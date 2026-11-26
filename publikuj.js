// Publikuje następny post (karuzelę) danego przedmiotu na JEGO koncie Instagrama.
//   node publikuj.js matma            -> od razu następny post
//   node publikuj.js matma --auto     -> tylko o godzinach z konfig.js (czas PL), raz na godzinę
//   node publikuj.js --auto           -> wszystkie przedmioty, które mają skonfigurowane konto
//   + --test                          -> tylko pokazuje, co by opublikował
// Sekrety (osobno dla każdego konta): IG_TOKEN_MATMA, IG_USER_ID_MATMA, IG_TOKEN_POLSKI, ... + BASE_URL (adres folderu output/)
import fs from "node:fs";
import { PRZEDMIOTY, GODZINY } from "./konfig.js";

const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
const cfg = (k) => process.env[k] || (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
const args = process.argv.slice(2);
const TEST = args.includes("--test");
const AUTO = args.includes("--auto");
const PLAN = args.includes("--plan"); // tylko wypisz "przedmiot id" postów do wyrenderowania
const BASE = (cfg("BASE_URL") || "<BASE_URL>").replace(/\/$/, "");
// tokeny z logowania przez Instagram (IGAA…) idą do graph.instagram.com – bez strony na Facebooku
const apiDla = (token) => token?.startsWith("IG") ? "https://graph.instagram.com/v23.0" : "https://graph.facebook.com/v23.0";
const nr3 = (n) => String(n).padStart(3, "0");

const teraz = new Date();
const czasPL = (o) => teraz.toLocaleString("sv-SE", { timeZone: "Europe/Warsaw", ...o });
const dzis = czasPL({ year: "numeric", month: "2-digit", day: "2-digit" });
const godz = Number(czasPL({ hour: "2-digit", hour12: false }));

const wybrane = args.filter((a) => PRZEDMIOTY[a]);
const przedmioty = wybrane.length ? wybrane : Object.keys(PRZEDMIOTY);

if (AUTO && !GODZINY.includes(godz)) {
  if (PLAN) process.exit(0);
  console.log(`W Polsce jest ${godz}:xx – nie ma teraz publikacji (${GODZINY.join(", ")}).`);
  process.exit(0);
}

async function api(token, sciezka, params, method = "POST") {
  const body = new URLSearchParams({ ...params, access_token: token });
  const API = apiDla(token);
  const res = await fetch(method === "GET" ? `${API}/${sciezka}?${body}` : `${API}/${sciezka}`, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (json.error) throw new Error(`${sciezka}: ${json.error.message}`);
  return json;
}

async function czekaj(token, id) {
  for (let i = 0; i < 40; i++) {
    const { status_code } = await api(token, id, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR") throw new Error(`Instagram odrzucił kontener ${id}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Instagram zbyt długo przetwarza zdjęcia");
}

function opis(p, post) {
  const c = PRZEDMIOTY[p];
  const glowa = post.typ === "quiz"
    ? `🧠 ${post.temat}\nRozwiąż, zanim przesuniesz! Wynik daj w komentarzu 👇`
    : `${c.emoji} ${post.temat}\n\n${post.opis || ""}`;
  return `${glowa}\n\n👉 Przesuń do końca\n🔖 Zapisz na powtórkę przed maturą\n📤 Wyślij komuś, kto też zdaje\n\nCodziennie kolejny temat po kolei – obserwuj ${c.handle}\n\n${c.hashtagi}`;
}

let blad = false;
for (const p of przedmioty) {
  const klucz = p.toUpperCase();
  const TOKEN = cfg(`IG_TOKEN_${klucz}`), IG = cfg(`IG_USER_ID_${klucz}`);
  if (!TEST && (!TOKEN || !IG)) { console.log(`${p}: brak konta (IG_TOKEN_${klucz} / IG_USER_ID_${klucz}) – pomijam.`); continue; }
  const STAN = `opublikowane/${p}`;
  fs.mkdirSync(STAN, { recursive: true });
  const stan = fs.readdirSync(STAN).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(`${STAN}/${f}`, "utf8")));
  const slot = `${dzis} ${godz}`;
  if (AUTO && stan.some((s) => s.slot === slot)) { console.log(`${p}: post na ${godz}:00 już wyszedł.`); continue; }

  const posty = JSON.parse(fs.readFileSync(`tresci/${p}.json`, "utf8"));
  const post = posty.find((x) => !stan.some((s) => s.id === x.id));
  if (!post) { console.log(`${p}: brak kolejnych postów – dopisz treści!`); continue; }
  if (PLAN) { console.log(`${p} ${post.id}`); continue; }
  if (!fs.existsSync(`output/${p}/${nr3(post.id)}_1.jpg`)) { console.log(`${p}: brak grafik posta ${post.id}`); blad = true; continue; }
  const pliki = fs.readdirSync(`output/${p}`).filter((f) => f.startsWith(nr3(post.id) + "_"))
    .sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1])).slice(0, 10); // IG: max 10 zdjęć
  const zdjecia = pliki.map((f) => `${BASE}/${p}/${f}`);
  const tekst = opis(p, post);
  console.log(`${p} #${post.id} „${post.temat}” (${zdjecia.length} slajdów)\n${tekst}\n---`);
  if (TEST) continue;
  try {
    const dzieci = [];
    for (const url of zdjecia) {
      const { id } = await api(TOKEN, `${IG}/media`, { image_url: url, is_carousel_item: "true" });
      await czekaj(TOKEN, id);
      dzieci.push(id);
    }
    const { id: k } = await api(TOKEN, `${IG}/media`, { media_type: "CAROUSEL", children: dzieci.join(","), caption: tekst });
    await czekaj(TOKEN, k);
    const { id: media } = await api(TOKEN, `${IG}/media_publish`, { creation_id: k });
    fs.writeFileSync(`${STAN}/${nr3(post.id)}.json`, JSON.stringify({ id: post.id, media, data: teraz.toISOString(), ...(AUTO && { slot }) }, null, 2));
    console.log(`✅ ${p}: opublikowano #${post.id} (media ${media})`);
  } catch (e) {
    blad = true;
    console.log(`❌ ${p}: ${e.message}`);
  }
}
if (blad) process.exit(1);

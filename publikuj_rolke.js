// Publikuje rolkę (Reels) zrobioną z lekcji, która już wyszła jako karuzela.
//   node publikuj_rolke.js polski          -> od razu
//   node publikuj_rolke.js --auto          -> tylko o godzinach z ROLKI w konfig.js
//   --plan -> wypisz "przedmiot id" do zrobienia,  --test -> nic nie publikuj
import fs from "node:fs";
import { PRZEDMIOTY, ROLKI } from "./konfig.js";

const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
const cfg = (k) => process.env[k] || (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
const args = process.argv.slice(2);
const [TEST, AUTO, PLAN] = ["--test", "--auto", "--plan"].map((a) => args.includes(a));
const BASE = (cfg("BASE_URL") || "<BASE_URL>").replace(/\/$/, "");
const apiDla = (t) => t?.startsWith("IG") ? "https://graph.instagram.com/v23.0" : "https://graph.facebook.com/v23.0";
const nr3 = (n) => String(n).padStart(3, "0");
const teraz = new Date();
const czasPL = (o) => teraz.toLocaleString("sv-SE", { timeZone: "Europe/Warsaw", ...o });
const dzis = czasPL({ year: "numeric", month: "2-digit", day: "2-digit" });
const godz = Number(czasPL({ hour: "2-digit", hour12: false }));
const wybrane = args.filter((a) => PRZEDMIOTY[a]);
const przedmioty = wybrane.length ? wybrane : Object.keys(ROLKI);

async function api(token, sciezka, params, method = "POST") {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(method === "GET" ? `${apiDla(token)}/${sciezka}?${body}` : `${apiDla(token)}/${sciezka}`, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (json.error) throw new Error(`${sciezka}: ${json.error.message}`);
  return json;
}

let blad = false;
for (const p of przedmioty) {
  if (AUTO && !(ROLKI[p] || []).includes(godz)) continue;
  const klucz = p.toUpperCase();
  const TOKEN = cfg(`IG_TOKEN_${klucz}`), IG = cfg(`IG_USER_ID_${klucz}`);
  if (!TEST && (!TOKEN || !IG)) { if (!PLAN) console.log(`${p}: brak konta – pomijam.`); continue; }
  const STAN = `opublikowane/${p}`, STAN_R = `${STAN}/rolki`;
  fs.mkdirSync(STAN_R, { recursive: true });
  const wczytaj = (k) => fs.readdirSync(k).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(`${k}/${f}`, "utf8")));
  const karuzele = wczytaj(STAN), rolki = wczytaj(STAN_R);
  if (AUTO && rolki.some((r) => r.dzien === dzis)) { if (!PLAN) console.log(`${p}: dzisiejsza rolka już wyszła.`); continue; }
  const posty = JSON.parse(fs.readFileSync(`tresci/${p}.json`, "utf8"));
  const post = posty.find((x) => x.typ === "lekcja" && karuzele.some((k) => k.id === x.id) && !rolki.some((r) => r.id === x.id));
  if (!post) { if (!PLAN) console.log(`${p}: brak lekcji na rolkę (najpierw muszą wyjść karuzele).`); continue; }
  if (PLAN) { console.log(`${p} ${post.id}`); continue; }
  const plik = `output/${p}/rolka_${nr3(post.id)}.mp4`;
  if (!fs.existsSync(plik)) { console.log(`${p}: brak pliku ${plik}`); blad = true; continue; }
  const c = PRZEDMIOTY[p];
  const tekst = `${c.emoji} ${post.temat} – w minutę z lektorem 🎧\n\n${post.opis || ""}\n\n🔖 Zapisz na powtórkę\n📤 Wyślij komuś, kto też zdaje\n➕ Obserwuj ${c.handle} – codziennie kolejny temat\n\n${c.hashtagi} #reels`;
  console.log(`${p}: rolka z #${post.id} „${post.temat}”\n${BASE}/${p}/rolka_${nr3(post.id)}.mp4`);
  if (TEST) continue;
  try {
    const { id: k } = await api(TOKEN, `${IG}/media`, { media_type: "REELS", video_url: `${BASE}/${p}/rolka_${nr3(post.id)}.mp4`, caption: tekst, share_to_feed: "true" });
    for (let i = 0; ; i++) {
      const { status_code } = await api(TOKEN, k, { fields: "status_code" }, "GET");
      if (status_code === "FINISHED") break;
      if (status_code === "ERROR" || i > 60) throw new Error(`Instagram nie przyjął filmu (${status_code})`);
      await new Promise((r) => setTimeout(r, 10000));
    }
    const { id: media } = await api(TOKEN, `${IG}/media_publish`, { creation_id: k });
    fs.writeFileSync(`${STAN_R}/${nr3(post.id)}.json`, JSON.stringify({ id: post.id, media, dzien: dzis, data: teraz.toISOString() }, null, 2));
    console.log(`✅ ${p}: rolka #${post.id} opublikowana (media ${media})`);
  } catch (e) { blad = true; console.log(`❌ ${p}: ${e.message}`); }
}
if (blad) process.exit(1);

// Renderuje karuzele do output/<przedmiot>/<NNN>_<n>.jpg
//   node render.js                 -> wszystkie przedmioty, tylko posty bez grafik
//   node render.js matma           -> jeden przedmiot
//   node render.js matma --id 3    -> jeden post (zawsze od nowa)
//   --wszystko                     -> renderuj od nowa wszystko
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import crypto from "node:crypto";
import puppeteer from "puppeteer-core";
import { slajd } from "./szablon.js";
import { PRZEDMIOTY } from "./konfig.js";

const KAT = path.resolve(".");
const args = process.argv.slice(2);
const wybrane = args.filter((a) => PRZEDMIOTY[a]);
const przedmioty = wybrane.length ? wybrane : Object.keys(PRZEDMIOTY);
const ID = args.includes("--id") ? Number(args[args.indexOf("--id") + 1]) : null;
const WSZYSTKO = args.includes("--wszystko");
const nr3 = (n) => String(n).padStart(3, "0");

const CHROME = process.env.CHROME_PATH ||
  ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"]
    .find((p) => fs.existsSync(p));

export function wczytaj(p) {
  return JSON.parse(fs.readFileSync(`tresci/${p}.json`, "utf8"));
}

// slajdy posta + automatyczny slajd końcowy z zapowiedzią następnego tematu
export function slajdyPosta(posty, i) {
  const post = posty[i];
  const nast = posty.slice(i + 1).find((x) => x.typ !== "quiz") || posty[i + 1];
  const s = [...post.slajdy];
  if (s[s.length - 1]?.t !== "koniec") s.push({ t: "koniec", nastepny: nast ? nast.temat : null });
  return s;
}

const przegladarka = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
const strona = await przegladarka.newPage();
await strona.setViewport({ width: 1080, height: 1350 });
fs.mkdirSync(".tmp", { recursive: true });
const plikTmp = path.join(KAT, ".tmp", `slajd_${process.pid}.html`);
let ostrzezenia = 0, zrobione = 0;

for (const p of przedmioty) {
  if (!fs.existsSync(`tresci/${p}.json`)) continue;
  const posty = wczytaj(p);
  const out = `output/${p}`;
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < posty.length; i++) {
    const post = posty[i];
    if (ID != null && post.id !== ID) continue;
    const sl = slajdyPosta(posty, i);
    // odcisk treści: jeśli post albo zapowiedź następnego się zmieniły – renderujemy od nowa
    const odcisk = crypto.createHash("md5").update(JSON.stringify([post.dzial, sl])).digest("hex");
    const plikOdc = `${out}/${nr3(post.id)}.md5`;
    if (ID == null && !WSZYSTKO && fs.existsSync(`${out}/${nr3(post.id)}_1.jpg`) && fs.existsSync(plikOdc) && fs.readFileSync(plikOdc, "utf8") === odcisk) continue;
    for (const f of fs.readdirSync(out).filter((f) => f.startsWith(nr3(post.id) + "_"))) fs.unlinkSync(`${out}/${f}`);
    for (let n = 0; n < sl.length; n++) {
      fs.writeFileSync(plikTmp, slajd({ przedmiot: p, sl: sl[n], nr: n + 1, ile: sl.length, post, katalog: pathToFileURL(KAT).href }));
      await strona.goto(pathToFileURL(plikTmp).href, { waitUntil: "load" });
      await strona.evaluate(() => document.fonts.ready);
      // dopasowanie: jeśli treść się nie mieści, delikatnie zmniejszamy
      const zoom = await strona.evaluate(() => {
        const r = document.getElementById("r");
        let z = 1;
        const zaDuzo = () => r.scrollHeight > r.clientHeight + 2 || r.scrollWidth > r.clientWidth + 2 ||
          [...r.querySelectorAll(".katex-display,.karta-wzor,.wynik,.o,li")].some((e) => e.scrollWidth > e.clientWidth + 2);
        while (zaDuzo() && z > 0.55) { z -= 0.03; r.style.zoom = z; }
        return z;
      });
      if (zoom < 0.8) { ostrzezenia++; console.log(`⚠️  ${p} post ${post.id} slajd ${n + 1}: za dużo treści (zmniejszone do ${Math.round(zoom * 100)}%) – skróć tekst`); }
      await strona.screenshot({ path: `${out}/${nr3(post.id)}_${n + 1}.jpg`, type: "jpeg", quality: 92 });
    }
    fs.writeFileSync(plikOdc, odcisk);
    zrobione++;
    console.log(`✔ ${p} #${post.id} „${post.temat}” – ${sl.length} slajdów`);
  }
}
await przegladarka.close();
console.log(`Gotowe: ${zrobione} postów, ostrzeżeń: ${ostrzezenia}`);

// Robi rolkę (Reels, 1080x1920) z gotowych slajdów posta + lektor czytający treść slajdów.
//   node rolka.js polski 3      -> output/polski/rolka_003.mp4  (slajdy muszą być wyrenderowane: node render.js polski --id 3)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PRZEDMIOTY } from "./konfig.js";

const [p, idArg] = process.argv.slice(2);
if (!PRZEDMIOTY[p] || !idArg) { console.log("użycie: node rolka.js <przedmiot> <id>"); process.exit(1); }
const id = Number(idArg);
const nr3 = (n) => String(n).padStart(3, "0");
const posty = JSON.parse(fs.readFileSync(`tresci/${p}.json`, "utf8"));
const post = posty.find((x) => x.id === id);
if (!post) throw new Error("brak posta " + id);

let FFMPEG = "ffmpeg";
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { FFMPEG = (await import("ffmpeg-static")).default; }
const PYTHON = process.env.PYTHON || (process.platform === "win32" ? "py" : "python3");
const GLOS = process.env.GLOS || "pl-PL-MarekNeural";

// tekst slajdu -> tekst do przeczytania (bez emoji, formatowania i strzałek)
const czysc = (s) => String(s ?? "")
  .replace(/\$[^$]*\$/g, " ")
  .replace(/\*\*|==/g, "")
  .replace(/\p{Extended_Pictographic}|️|👉|✅|❌/gu, "")
  .replace(/[→⟶]/g, ", ").replace(/\s=\s/g, " – ").replace(/\bvs\.?(?=\s)/g, "czy")
  .replace(/\s*\n\s*/g, ". ")
  .replace(/\s+/g, " ")
  .replace(/\s+([.,!?:;])/g, "$1")
  .trim();
const zdanie = (s) => { const t = czysc(s); return t && !/[.!?…:]$/.test(t) ? t + "." : t; };

function narracja(sl) {
  switch (sl.t) {
    case "okladka": return [sl.tytul, sl.pod].map(zdanie).join(" ");
    case "punkty": return [sl.tytul, sl.wstep, ...sl.punkty, sl.uwaga].filter(Boolean).map(zdanie).join(" ");
    case "wzor": return [sl.tytul, sl.wstep, sl.opis, sl.uwaga].filter(Boolean).map(zdanie).join(" ");
    case "przyklad": return [sl.tytul, sl.tresc, ...(sl.kroki || []), sl.wynik].filter(Boolean).map(zdanie).join(" ");
    case "porownanie": return [sl.tytul, sl.lewa.naglowek, ...sl.lewa.punkty, sl.prawa.naglowek, ...sl.prawa.punkty, sl.uwaga].filter(Boolean).map(zdanie).join(" ");
    case "cytat": return [sl.cytat, sl.autor, sl.opis].filter(Boolean).map(zdanie).join(" ");
    case "pytanie": return [sl.tresc, ...(sl.odp || []).map((o, i) => `${"ABCD"[i]}: ${czysc(o)}`), "Zatrzymaj filmik i pomyśl."].map(zdanie).join(" ");
    case "odpowiedz": return ["Poprawna odpowiedź: " + czysc(sl.poprawna), ...(sl.kroki || []), sl.tresc].filter(Boolean).map(zdanie).join(" ");
    default: return "";
  }
}

const TMP = `.tmp/rolka_${p}_${id}`;
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const out = `output/${p}`;
const slajdy = [...post.slajdy.filter((s) => s.t !== "koniec"), { t: "koniec" }];
const segmenty = [];

for (let n = 0; n < slajdy.length; n++) {
  const img = `${out}/${nr3(id)}_${n + 1}.jpg`;
  if (!fs.existsSync(img)) throw new Error(`brak slajdu ${img} – najpierw node render.js ${p} --id ${id}`);
  const tekst = slajdy[n].t === "koniec"
    ? `Zapisz ten post na powtórkę i obserwuj ${PRZEDMIOTY[p].handle.replace("@", "").replace(/\./g, " kropka ")}.`
    : narracja(slajdy[n]);
  fs.writeFileSync(`${TMP}/t${n}.txt`, tekst);
  execFileSync(PYTHON, ["lektor.py", `${TMP}/t${n}.txt`, `${TMP}/a${n}.mp3`, `${TMP}/w${n}.json`, GLOS], { stdio: "inherit" });
  const slowa = JSON.parse(fs.readFileSync(`${TMP}/w${n}.json`, "utf8"));
  const ost = slowa[slowa.length - 1];
  const dl = Math.max(2.2, (ost ? ost.t + ost.d : 2) + 0.7);
  // pionowe tło = rozmyty slajd, na środku ostry slajd z delikatnym przybliżeniem
  const klatki = Math.round(dl * 30);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error",
    "-loop", "1", "-framerate", "30", "-i", img, "-i", `${TMP}/a${n}.mp3`,
    "-filter_complex",
    `[0:v]split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=28:2,eq=brightness=-0.12[tlo];` +
    `[b]scale=2160:-2,zoompan=z='1+0.035*on/${klatki}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1350:fps=30[fg];` +
    `[tlo][fg]overlay=0:285,format=yuv420p,fade=t=in:st=0:d=0.25[v];[1:a]apad,aresample=44100[au]`,
    "-map", "[v]", "-map", "[au]", "-t", dl.toFixed(2),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-r", "30", "-c:a", "aac", "-b:a", "128k", "-ac", "2",
    `${TMP}/s${n}.mp4`]);
  segmenty.push(`file 's${n}.mp4'`);
  console.log(`slajd ${n + 1}: ${dl.toFixed(1)} s – ${tekst.slice(0, 70)}…`);
}
fs.writeFileSync(`${TMP}/lista.txt`, segmenty.join("\n"));
const wyj = `${out}/rolka_${nr3(id)}.mp4`;
execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${TMP}/lista.txt`, "-c", "copy", "-movflags", "+faststart", path.resolve(wyj)]);
fs.rmSync(TMP, { recursive: true, force: true });
console.log("✔ " + wyj);

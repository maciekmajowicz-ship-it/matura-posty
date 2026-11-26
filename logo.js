// Logo (zdjęcie profilowe 1080x1080) dla każdego profilu.  node logo.js
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { PRZEDMIOTY } from "./konfig.js";

const ZNAK = {
  polski: `<span class="z pl">Ą</span>`,
  matma: `<span class="z">x<sup>2</sup></span>`,
  angielski: `<span class="z en">Hi!</span>`,
};

const KAT = pathToFileURL(path.resolve(".")).href;
const html = (p) => {
  const c = PRZEDMIOTY[p].kolory;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${KAT}/node_modules/@fontsource-variable/unbounded/index.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;background:radial-gradient(circle at 30% 20%,${c.tlo2} 0%,${c.tlo} 70%);position:relative;font-family:"Unbounded Variable"}
.blask{position:absolute;width:760px;height:760px;border-radius:50%;left:160px;top:160px;background:radial-gradient(circle,${c.akcent2}66 0%,transparent 62%)}
.ring{position:absolute;inset:110px;border-radius:50%;border:14px solid ${c.akcent};opacity:.95}
.ring2{position:absolute;inset:70px;border-radius:50%;border:4px dashed ${c.tekst}33}
.z{position:absolute;left:0;right:0;top:50%;transform:translateY(-63%);text-align:center;font-weight:900;font-size:520px;line-height:1;color:${c.tekst};letter-spacing:-20px;text-shadow:0 24px 60px #0008}
.z sup{font-size:.45em;color:${c.akcent};vertical-align:.95em;margin-left:6px}
.z.pl{font-size:470px}
.z.en{font-size:400px;letter-spacing:-24px}
.pas{position:absolute;bottom:180px;left:50%;transform:translateX(-50%) rotate(-4deg);background:${c.akcent};color:${c.tlo};font-weight:800;font-size:64px;letter-spacing:8px;padding:14px 40px;border-radius:18px;box-shadow:0 16px 40px #0007}
.iskra{position:absolute;width:70px;height:70px;background:${c.akcent};clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
</style></head><body>
<div class="blask"></div><div class="ring2"></div><div class="ring"></div>
${ZNAK[p]}
<div class="pas">MATURA</div>
<div class="iskra" style="left:250px;top:300px;width:56px;height:56px"></div>
<div class="iskra" style="left:320px;top:250px;width:30px;height:30px;opacity:.7"></div>
</body></html>`;
};

const CHROME = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const s = await b.newPage();
await s.setViewport({ width: 1080, height: 1080 });
fs.mkdirSync("logo", { recursive: true });
fs.mkdirSync(".tmp", { recursive: true });
for (const p of Object.keys(PRZEDMIOTY)) {
  fs.writeFileSync(".tmp/logo.html", html(p));
  await s.goto(pathToFileURL(path.resolve(".tmp/logo.html")).href);
  await s.evaluate(() => document.fonts.ready);
  await s.screenshot({ path: `logo/${p}.png` });
  console.log("logo/" + p + ".png");
}
await b.close();

// Buduje HTML jednego slajdu 1080x1350 (format Instagrama 4:5).
import katex from "katex";
import { PRZEDMIOTY } from "./konfig.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tex = (w, display) => katex.renderToString(w, { displayMode: display, throwOnError: false, output: "html" });

// **pogrubienie** = kolor akcentu, ==podkreślenie== = marker, $wzór$ = KaTeX, \n = nowa linia
export function tekst(s) {
  if (s == null) return "";
  const czesci = String(s).split(/(\$[^$]+\$)/g);
  return czesci.map((c) => {
    if (/^\$[^$]+\$$/.test(c)) return tex(c.slice(1, -1), false);
    return esc(c)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/==(.+?)==/g, "<mark>$1</mark>")
      .replace(/\n/g, "<br>");
  }).join("");
}

function tresc(sl, p) {
  switch (sl.t) {
    case "okladka":
      return `<div class="okl">
        ${sl.nad ? `<div class="pigulka">${tekst(sl.nad)}</div>` : ""}
        <h1 class="duzy">${tekst(sl.tytul)}</h1>
        ${sl.pod ? `<p class="pod">${tekst(sl.pod)}</p>` : ""}
        ${sl.wzor ? `<div class="wzor-okl">${tex(sl.wzor, true)}</div>` : ""}
      </div>`;
    case "punkty":
      return `<h2>${tekst(sl.tytul)}</h2>
        ${sl.wstep ? `<p class="wstep">${tekst(sl.wstep)}</p>` : ""}
        <ul class="punkty">${sl.punkty.map((x, i) => `<li><span class="nr">${sl.numeruj === false ? "•" : i + 1}</span><div>${tekst(x)}</div></li>`).join("")}</ul>
        ${sl.uwaga ? `<div class="uwaga">💡 ${tekst(sl.uwaga)}</div>` : ""}`;
    case "wzor":
      return `<h2>${tekst(sl.tytul)}</h2>
        ${sl.wstep ? `<p class="wstep">${tekst(sl.wstep)}</p>` : ""}
        <div class="karta-wzor">${(Array.isArray(sl.wzor) ? sl.wzor : [sl.wzor]).map((w) => `<div class="w">${tex(w, true)}</div>`).join("")}</div>
        ${sl.opis ? `<p class="opis">${tekst(sl.opis)}</p>` : ""}
        ${sl.uwaga ? `<div class="uwaga">💡 ${tekst(sl.uwaga)}</div>` : ""}`;
    case "przyklad":
      return `<div class="etykieta">✏️ PRZYKŁAD</div><h2>${tekst(sl.tytul)}</h2>
        ${sl.tresc ? `<p class="wstep">${tekst(sl.tresc)}</p>` : ""}
        ${sl.kroki ? `<ol class="kroki">${sl.kroki.map((k) => `<li>${tekst(k)}</li>`).join("")}</ol>` : ""}
        ${sl.wynik ? `<div class="wynik">${tekst(sl.wynik)}</div>` : ""}`;
    case "porownanie":
      return `<h2>${tekst(sl.tytul)}</h2>
        <div class="dwie">${[sl.lewa, sl.prawa].map((k, i) => `<div class="kol k${i}"><div class="kol-n">${tekst(k.naglowek)}</div>
          <ul>${k.punkty.map((x) => `<li>${tekst(x)}</li>`).join("")}</ul></div>`).join("")}</div>
        ${sl.uwaga ? `<div class="uwaga">💡 ${tekst(sl.uwaga)}</div>` : ""}`;
    case "cytat":
      return `<div class="cytat"><div class="cudz">“</div><blockquote>${tekst(sl.cytat)}</blockquote>
        <div class="autor">— ${tekst(sl.autor)}</div></div>
        ${sl.opis ? `<p class="opis">${tekst(sl.opis)}</p>` : ""}`;
    case "pytanie":
      return `<div class="etykieta quiz">🧠 ZADANIE</div><h2>${tekst(sl.tytul || "Sprawdź się!")}</h2>
        <p class="wstep pyt">${tekst(sl.tresc)}</p>
        ${sl.odp ? `<div class="odp">${sl.odp.map((o, i) => `<div class="o"><span>${"ABCDEF"[i]}</span><div>${tekst(o)}</div></div>`).join("")}</div>` : ""}
        <div class="nast">Odpowiedź na następnym slajdzie 👉</div>`;
    case "odpowiedz":
      return `<div class="etykieta ok">✅ ODPOWIEDŹ</div>
        <div class="poprawna">${tekst(sl.poprawna)}</div>
        ${sl.kroki ? `<ol class="kroki">${sl.kroki.map((k) => `<li>${tekst(k)}</li>`).join("")}</ol>` : ""}
        ${sl.tresc ? `<p class="opis">${tekst(sl.tresc)}</p>` : ""}`;
    case "koniec": {
      const cfg = PRZEDMIOTY[p];
      return `<div class="okl kon">
        <div class="pigulka">${cfg.emoji} ${esc(cfg.nazwa)}</div>
        <h1 class="duzy sredni">${tekst(sl.tytul || "Zapisz, żeby nie zgubić! 🔖")}</h1>
        ${sl.nastepny ? `<p class="pod">Następny post: <b>${tekst(sl.nastepny)}</b></p>` : ""}
        <div class="cta"><div>🔖 Zapisz</div><div>📤 Wyślij znajomemu</div><div>➕ Obserwuj</div></div>
        <div class="handle">${esc(cfg.handle)}</div>
      </div>`;
    }
    default:
      throw new Error("Nieznany typ slajdu: " + sl.t);
  }
}

export function slajd({ przedmiot, sl, nr, ile, post, katalog }) {
  const c = PRZEDMIOTY[przedmiot].kolory;
  const cfg = PRZEDMIOTY[przedmiot];
  const ostatni = nr === ile;
  const kropki = Array.from({ length: ile }, (_, i) => `<i class="${i + 1 === nr ? "on" : ""}"></i>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${katalog}/node_modules/@fontsource-variable/unbounded/index.css">
<link rel="stylesheet" href="${katalog}/node_modules/@fontsource-variable/inter/index.css">
<link rel="stylesheet" href="${katalog}/node_modules/katex/dist/katex.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden}
body{background:${c.tlo};color:${c.tekst};font-family:"Inter Variable",sans-serif;position:relative}
.tlo{position:absolute;inset:0;overflow:hidden}
.tlo:before{content:"";position:absolute;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle,${c.tlo2} 0%,transparent 65%);top:-420px;right:-380px;opacity:.95}
.tlo:after{content:"";position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,${c.akcent2}55 0%,transparent 65%);bottom:-430px;left:-330px}
.siatka{position:absolute;inset:0;background-image:radial-gradient(${c.tekst}14 2px,transparent 2px);background-size:44px 44px;mask-image:linear-gradient(180deg,#000,transparent 70%)}
.gora{position:absolute;top:56px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center;font:700 26px "Unbounded Variable";letter-spacing:3px}
.gora .seria{color:${c.akcent}}
.gora .licz{color:${c.przygaszony};font-size:24px}
.ramka{position:absolute;top:150px;left:72px;right:72px;bottom:150px;display:flex;flex-direction:column;justify-content:center}
.dol{position:absolute;bottom:56px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.dol .kropki{display:flex;gap:10px}.dol .kropki i{width:14px;height:14px;border-radius:7px;background:${c.tekst}33}
.dol .kropki i.on{width:44px;background:${c.akcent}}
.dol .dalej{font:700 26px "Unbounded Variable";color:${c.tlo};background:${c.akcent};padding:14px 26px;border-radius:40px}
.dol .h{font:600 24px "Inter Variable";color:${c.przygaszony}}
h1,h2{font-family:"Unbounded Variable";font-weight:800;line-height:1.08;letter-spacing:-1px}
h1.duzy{font-size:104px;margin:26px 0 28px}
h1.sredni{font-size:78px}
h2{font-size:62px;margin-bottom:36px}
b{color:${c.akcent};font-weight:800}
mark{background:${c.akcent2};color:#fff;padding:0 10px;border-radius:10px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.pigulka{align-self:flex-start;font:700 26px "Unbounded Variable";letter-spacing:2px;color:${c.tlo};background:${c.akcent};padding:14px 26px;border-radius:40px}
.pod{font-size:44px;line-height:1.3;font-weight:500;color:${c.tekst}dd}
.wstep{font-size:40px;line-height:1.38;margin-bottom:30px;font-weight:500}
.opis{font-size:38px;line-height:1.4;margin-top:30px;color:${c.tekst}e6}
.punkty{list-style:none;display:flex;flex-direction:column;gap:26px}
.punkty li{display:flex;gap:26px;align-items:flex-start;font-size:40px;line-height:1.32;font-weight:500;background:${c.tekst}0d;border:2px solid ${c.tekst}1a;border-radius:28px;padding:24px 28px}
.punkty .nr{flex:none;width:58px;height:58px;border-radius:18px;background:${c.akcent};color:${c.tlo};font:800 30px "Unbounded Variable";display:flex;align-items:center;justify-content:center;margin-top:-4px}
.uwaga{margin-top:34px;font-size:36px;line-height:1.35;background:${c.akcent2}2a;border-left:10px solid ${c.akcent2};padding:24px 30px;border-radius:0 24px 24px 0}
.karta-wzor{font-size:60px;background:#ffffff;color:#111;border-radius:36px;padding:40px 30px;box-shadow:0 30px 80px #0006;display:flex;flex-direction:column;gap:10px}
.karta-wzor .katex-display{margin:6px 0}
.karta-wzor .katex{font-size:1em}
.wzor-okl .katex{font-size:1em;color:${c.akcent}}
.wzor-okl{font-size:70px}
.etykieta{align-self:flex-start;font:700 26px "Unbounded Variable";letter-spacing:2px;padding:12px 22px;border-radius:14px;background:${c.akcent2};color:#fff;margin-bottom:26px}
.etykieta.quiz{background:${c.akcent};color:${c.tlo}}
.etykieta.ok{background:#22c55e}
.kroki{counter-reset:k;list-style:none;display:flex;flex-direction:column;gap:18px}
.kroki li{counter-increment:k;font-size:38px;line-height:1.35;padding-left:74px;position:relative;font-weight:500}
.kroki li:before{content:counter(k);position:absolute;left:0;top:0;width:52px;height:52px;border-radius:50%;border:3px solid ${c.akcent};color:${c.akcent};font:800 26px "Unbounded Variable";display:flex;align-items:center;justify-content:center}
.wynik{margin-top:30px;font:800 44px "Unbounded Variable";background:${c.akcent};color:${c.tlo};padding:26px 34px;border-radius:26px;align-self:flex-start}
.wynik b{color:${c.tlo}}
.wynik .katex{font-size:1em}
.dwie{display:flex;gap:28px}
.kol{flex:1;border-radius:30px;padding:30px;background:${c.tekst}0f;border:3px solid ${c.akcent}}
.kol.k1{border-color:${c.akcent2}}
.kol-n{font:800 36px "Unbounded Variable";margin-bottom:20px;color:${c.akcent}}
.k1 .kol-n{color:${c.akcent2}}
.kol ul{list-style:none;display:flex;flex-direction:column;gap:16px}
.kol li{font-size:34px;line-height:1.32;font-weight:500}
.cytat{position:relative;background:${c.tekst}0f;border-radius:36px;padding:60px 56px 50px;border:2px solid ${c.tekst}22}
.cudz{position:absolute;top:-70px;left:30px;font:900 220px Georgia,serif;color:${c.akcent};line-height:1}
blockquote{font:italic 500 50px/1.35 Georgia,serif}
.autor{margin-top:28px;font:700 30px "Unbounded Variable";color:${c.akcent}}
.pyt{font-size:44px}
.odp{display:flex;flex-direction:column;gap:18px}
.o{display:flex;gap:22px;align-items:center;font-size:40px;font-weight:600;background:${c.tekst}12;border:2px solid ${c.tekst}26;border-radius:24px;padding:20px 26px}
.o>span{flex:none;width:58px;height:58px;border-radius:50%;background:${c.tekst};color:${c.tlo};font:800 28px "Unbounded Variable";display:flex;align-items:center;justify-content:center}
.nast{margin-top:36px;font:700 32px "Unbounded Variable";color:${c.akcent}}
.poprawna{font:800 84px/1.1 "Unbounded Variable";color:${c.akcent};margin-bottom:34px}
.poprawna .katex{font-size:.9em}
.okl{display:flex;flex-direction:column}
.kon .cta{display:flex;gap:16px;flex-wrap:wrap;margin:44px 0 34px}
.kon .cta div{font:700 30px "Inter Variable";background:${c.tekst}14;border:2px solid ${c.tekst}30;padding:18px 26px;border-radius:40px}
.kon .handle{font:800 54px "Unbounded Variable";color:${c.akcent}}
</style></head><body>
<div class="tlo"><div class="siatka"></div></div>
<div class="gora"><span class="seria">${esc(cfg.seria)} ${post.dzial ? "· " + esc(post.dzial).toUpperCase() : ""}</span><span class="licz">${nr}/${ile}</span></div>
<div class="ramka" id="r">${tresc(sl, przedmiot)}</div>
<div class="dol"><div class="kropki">${kropki}</div>${ostatni ? `<span class="h">${esc(cfg.handle)}</span>` : `<span class="dalej">PRZESUŃ →</span>`}</div>
</body></html>`;
}

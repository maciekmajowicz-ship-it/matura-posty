# Generuje głos lektora (darmowe głosy Microsoft Edge) + czasy słów do napisów
#   python tiktok/lektor.py tekst.txt wyjscie.mp3 wyjscie.json [glos]
import asyncio, json, sys
import edge_tts

async def main(wej, mp3, js, glos):
    tekst = open(wej, encoding="utf-8").read()
    com = edge_tts.Communicate(tekst, glos, rate="+0%", boundary="WordBoundary")
    slowa = []
    with open(mp3, "wb") as f:
        async for c in com.stream():
            if c["type"] == "audio":
                f.write(c["data"])
            elif c["type"] == "WordBoundary":
                slowa.append({"t": c["offset"] / 1e7, "d": c["duration"] / 1e7, "s": c["text"]})
    json.dump(slowa, open(js, "w", encoding="utf-8"), ensure_ascii=False)

glos = sys.argv[4] if len(sys.argv) > 4 else "pl-PL-MarekNeural"
asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], glos))

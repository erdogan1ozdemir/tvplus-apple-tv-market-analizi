#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ahrefs organik keyword çıktısını (tool-result dosyası) Apple TV+ dizi
kataloğuyla eşleştirir. Keyword dizi adıyla BAŞLAMALI ve gerisi bilinen bir ek
olmalı; gevşek alt dize eşleşmesi "sweet home" → Home gibi yanlış pozitif veriyordu.

    python3 scripts/rakip_esle.py <ad> <tool-result-dosyasi>
"""
import json, re, sys, unicodedata
ad, F = sys.argv[1], sys.argv[2]
raw = json.load(open(F, encoding="utf-8")); metin = "".join(x.get("text","") for x in raw)
d, _ = json.JSONDecoder().raw_decode(metin[metin.index("{"):]); rows = d.get("keywords", d)
def n(s): return " ".join(re.sub(r"[’'!?:.,&()]"," ",unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower()).split())
kat = json.load(open("data/arastirma/dizi_katalog.json", encoding="utf-8"))["diziler"]
adlar = {n(w["dizi"]): w["dizi"] for w in kat}; sirali = sorted(adlar, key=len, reverse=True)
EK = r"( izle| dizi| dizisi| \d+\. ?sezon.*| \d+\. ?bolum.*| turkce dublaj.*| altyazili.*| konusu| oyunculari| full.*| apple tv.*| season \d+.*| cast)?$"
esl = []
for r in rows:
    kw = n(r["keyword"])
    for a in sirali:
        if len(a) >= 4 and re.fullmatch(re.escape(a) + EK, kw):
            esl.append({"keyword": r["keyword"], "dizi": adlar[a], "volume": r.get("volume"),
                        "traffic": r.get("sum_traffic"), "pos": r.get("best_position"), "url": r.get("best_position_url")}); break
top = sum(r.get("sum_traffic") or 0 for r in rows); atop = sum(e["traffic"] or 0 for e in esl)
json.dump({"kaynak": f"ahrefs {ad} tr 2026-09-01 ilk {len(rows)}", "toplam_trafik": top, "apple_dizi_trafik": atop, "eslesmeler": esl},
          open(f"data/arastirma/rakip_{ad}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{ad:18} ilk {len(rows)} kw · trafik {top:>9,} · Apple TV+ dizilerine {atop:>6,} (%{100*atop/max(top,1):.1f}) · {len(esl)} kw".replace(",", "."))

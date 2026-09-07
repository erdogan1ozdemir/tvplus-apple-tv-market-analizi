#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ek varyasyon seed'i: korsan marka · bölüm · platform · kalite aileleri.

Ana seed (dizi_seed.py) çekirdek sorgu ailelerini üretir. Bu betik, SERP'te
gerçekten görülen korsan markaları ve ana seed'de bulunmayan üç aileyi ekler.
Mevcut CSV'lerdeki keyword'ler elenir; mükerrer gönderilmez.

Kullanım: python3 scripts/varyasyon_seed.py
Çıktı   : data/raw/seed_varyasyon.csv
"""
import csv, json, glob, re, unicodedata

def temizle(s):
    s = unicodedata.normalize("NFC", str(s).lower().strip())
    s = re.sub(r"[’'!?:.,&()]", " ", s)
    return " ".join(s.split())

KATALOG = json.load(open("data/arastirma/dizi_katalog.json", encoding="utf-8"))["diziler"]
KORSAN  = json.load(open("data/arastirma/korsan_markalar.json", encoding="utf-8"))

# (kalıp, sayfa_tipi, intent, varlık_tipi, marka_tipi)
AILELER = (
    [(m, "Korsan Markalı", "İzleme", "Dizi", "Korsan Markalı") for m in KORSAN] +
    [("tüm bölümleri", "Bölüm", "İzleme", "Bölüm", "Jenerik"),
     ("son bölüm",     "Bölüm", "İzleme", "Bölüm", "Jenerik"),
     ("bölümleri",     "Bölüm", "İzleme", "Bölüm", "Jenerik"),
     ("kaç bölüm",     "Sezon Bilgi", "Bilgi", "Dizi", "Jenerik"),
     ("blutv",       "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("exxen",       "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("disney plus", "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("prime video", "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("tod",         "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("gain",        "Platform", "İzleme", "Dizi", "Platform Markalı"),
     ("hd izle",                "İzleme", "İzleme", "Dizi", "Jenerik"),
     ("1080p izle",             "İzleme", "İzleme", "Dizi", "Jenerik"),
     ("türkçe altyazılı izle",  "İzleme", "İzleme", "Dizi", "Jenerik")]
)

# Mevcut çekimlerdeki keyword'ler: mükerrer gönderilmez
var = set()
for y in glob.glob("data/raw/hacim_*.csv"):
    for r in csv.DictReader(open(y, encoding="utf-8-sig")):
        var.add(temizle(r["keyword"]))

satir, gorulen = [], set()
for w in KATALOG:
    ad = temizle(w["dizi"])
    for kalip, st, it, ent, marka in AILELER:
        kw = temizle(f"{ad} {kalip}")
        if kw in var or kw in gorulen:
            continue
        gorulen.add(kw)
        satir.append({
            "keyword": kw, "dizi": w["dizi"], "dizi_anahtar": ad,
            "kategori": w["kategori"], "tur": w["tur"], "tur_ham": w["tur"],
            "cikis_yili": w["yil"], "sezon_sayisi": w["sezon"], "durum": w["durum_tr"],
            "sayfa_tipi": st, "intent_katmani": it, "entity_tipi": ent,
            "sezon_no": "", "belirsiz_ad": "hayır", "marka_tipi": marka,
            "dil": "tr", "erisim": "Doğrulanacak",
            "apple_resmi": "evet" if w.get("apple_resmi") else "hayır",
        })

with open("data/raw/seed_varyasyon.csv", "w", encoding="utf-8", newline="") as f:
    wr = csv.DictWriter(f, fieldnames=list(satir[0].keys())); wr.writeheader(); wr.writerows(satir)

from collections import Counter
c = Counter(s["sayfa_tipi"] for s in satir)
print(f"seed: {len(satir):,} keyword · {len(KATALOG)} dizi · {len(KORSAN)} korsan marka".replace(",", "."))
print("sayfa tipi:", dict(c))
print(f"mükerrer elenen: {len(KATALOG)*len(AILELER) - len(satir):,}".replace(",", "."))
print(f"tahmini istek: {-(-len(satir)//700)} · ~${len(satir)*0.00014:.2f}")

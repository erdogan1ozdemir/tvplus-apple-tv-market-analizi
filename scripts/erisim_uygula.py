#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erişim fasetini SERP kanıtından doldurur.

Kural: dizinin "{ad} izle" sorgusunun ilk 10'unda, adı birebir eşleşen bir
meşru platform sayfası varsa "Meşru Görünür", yoksa "Yalnız Korsan".
SERP'i olmayan diziler "Doğrulanacak" kalır — tahmin yürütülmez.

Kaynak: data/denetim/erisim_serp.json (scripts/serp_birlestir.py çıktısından türetilir)
Kullanım: python3 scripts/erisim_uygula.py
"""
import csv, json, os, glob, collections

karar = json.load(open("data/denetim/erisim_serp.json", encoding="utf-8"))
sayac = collections.Counter()
for yol in sorted(glob.glob("data/raw/hacim_*.csv")):
    satir = list(csv.DictReader(open(yol, encoding="utf-8-sig")))
    if not satir: continue
    kol = list(satir[0].keys())
    for r in satir:
        yeni = karar.get((r.get("dizi_anahtar") or "").strip(), "Doğrulanacak")
        r["erisim"] = yeni
        sayac[yeni] += 1
    gecici = yol + ".tmp"
    with open(gecici, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=kol); w.writeheader()
        for r in satir: w.writerow({k: r.get(k, "") for k in kol})
    os.replace(gecici, yol)
    print(f"{yol}: {len(satir)} satır")
print("\nErişim faseti:", dict(sayac))

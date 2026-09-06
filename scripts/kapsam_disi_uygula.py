#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""data/denetim/kapsam_disi.json kararlarını hacim CSV'lerine işler.

Denetim yıkıcı değildir: satır silinmez, `mantik_denetim` kolonuna gerekçe
yazılır ve build-data.js bu satırları kapsam dışı bırakır. Karar değişirse
JSON düzeltilip betik yeniden çalıştırılır; kolon sıfırdan yazıldığı için
eski işaretler birikmez.

Kullanım: python3 scripts/kapsam_disi_uygula.py
"""
import csv, json, os, re, unicodedata, glob

def temizle(s):
    s = unicodedata.normalize("NFC", str(s).lower().strip())
    s = re.sub(r"[’'!?:.,&()]", " ", s)
    return " ".join(s.split())

K = json.load(open("data/denetim/kapsam_disi.json", encoding="utf-8"))
TUM    = {k: v for k, v in K["tum_kume"].items()    if not k.startswith("_")}
CIPLAK = {k: v for k, v in K["ciplak_form"].items() if not k.startswith("_")}

toplam = {"tum": 0, "ciplak": 0, "hacim": 0}
for yol in sorted(glob.glob("data/raw/hacim_*.csv")):
    satir = list(csv.DictReader(open(yol, encoding="utf-8-sig")))
    if not satir: continue
    kol = list(satir[0].keys())
    if "mantik_denetim" not in kol: kol.append("mantik_denetim")
    for r in satir:
        anah = temizle(r.get("dizi_anahtar", ""))
        kw   = temizle(r.get("keyword", ""))
        hac  = int(float(r.get("search_volume") or 0))
        r["mantik_denetim"] = ""                       # her koşuda sıfırlanır
        if anah in TUM:
            r["mantik_denetim"] = "Kapsam dışı · " + TUM[anah]
            toplam["tum"] += 1; toplam["hacim"] += hac
        elif anah in CIPLAK and kw == anah:
            r["mantik_denetim"] = "Kapsam dışı · çıplak ad · " + CIPLAK[anah]
            toplam["ciplak"] += 1; toplam["hacim"] += hac
    gecici = yol + ".tmp"
    with open(gecici, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=kol); w.writeheader()
        for r in satir: w.writerow({k: r.get(k, "") for k in kol})
    os.replace(gecici, yol)                            # atomik yazım
    print(f"{yol}: {len(satir)} satır işlendi")

print(f"\nİşaretlenen: {toplam['tum']} satır (tüm küme) + {toplam['ciplak']} satır (çıplak ad)")
print(f"Kapsam dışı bırakılan aylık hacim: {toplam['hacim']:,}".replace(",", "."))

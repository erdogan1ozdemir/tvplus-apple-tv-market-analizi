#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SERP ham verisini panonun okuyacağı biçime çevirir.

Birincil metrik tahmini tıktır: keyword aylık hacmi × pozisyon CTR'ı. Ahrefs'in
`traffic` alanı sıralanan URL'nin TOPLAM organik trafiğidir, o keyword'e ait
değildir; jenerik URL sıralandığında hub'ın tamamını sayar (bkz. bulgular.md).
Sayfa trafiği ikincil sütun olarak taşınır, null olanlar dışarıda kalır.
"""
import json, collections

# Google organik TR tıklama oranı eğrisi (pozisyon → CTR)
CTR = {1:.284, 2:.152, 3:.106, 4:.078, 5:.060, 6:.045, 7:.036, 8:.030, 9:.025, 10:.021}

# Domain sınıfı: talebin nereye aktığını okumak için tek ayrım bu.
MESRU   = {"tv.apple.com","primevideo.com","netflix.com","blutv.com","gain.tv","exxen.com","tv.turkcell.com.tr"}
AGREGAT = {"justwatch.com","imdb.com","beyazperde.com","sinemalar.com","tr.wikipedia.org","en.wikipedia.org",
           "eksisozluk.com","youtube.com","google.com","bantmag.com","hiwellapp.com","rottentomatoes.com"}
def sinif(d):
    if d in MESRU:   return "Meşru Platform"
    if d in AGREGAT: return "Agregatör / Bilgi"
    return "Korsan"

hedef = {h["kw"]: h for h in json.load(open("data/arastirma/serp_hedef.json", encoding="utf-8"))}
satir, eksik = [], []
for l in open("data/serp/ham.jsonl", encoding="utf-8"):
    d = json.loads(l); h = hedef.get(d["kw"])
    if not h: eksik.append(d["kw"]); continue
    for poz, dom, tra in d["pos"]:
        satir.append({"keyword": d["kw"], "dizi": h["dizi"], "intent": h["it"],
                      "aylik_hacim": h["ay"], "pozisyon": poz, "domain": dom,
                      "sinif": sinif(dom),
                      "tahmini_tik": round(h["ay"] * CTR.get(poz, 0.015)),
                      "sayfa_trafik": tra})
json.dump(satir, open("data/serp/serp.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

kw = len({s["keyword"] for s in satir})
print(f"{len(satir)} satır · {kw} keyword · {len({s['domain'] for s in satir})} domain")
if eksik: print("hedef listesinde yok:", eksik)
d = collections.defaultdict(int)
for s in satir: d[s["sinif"]] += s["tahmini_tik"]
top = sum(d.values())
print("\nSINIF BAZINDA TAHMİNİ AYLIK TIK")
for k, v in sorted(d.items(), key=lambda x: -x[1]):
    print(f"  {k:20} {v:>8,} · %{100*v/top:.0f}".replace(",", "."))
dd = collections.defaultdict(int)
for s in satir: dd[s["domain"]] += s["tahmini_tik"]
print("\nDOMAIN İLK 12")
for k, v in sorted(dd.items(), key=lambda x: -x[1])[:12]:
    print(f"  {k:24} {v:>8,} · {sinif(k)}".replace(",", "."))

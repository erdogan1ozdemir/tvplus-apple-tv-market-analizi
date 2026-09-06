#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Wikipedia'nın serbest metin tür etiketini kırılım ekseni olarak kullanılabilir
19 Türkçe türe indirger.

Bu kural ilk turda tek seferlik uygulanmış, koda girmemişti; katalog büyüdüğünde
yeni satırlar ham İngilizce türle kaldı (26 tür). Kural burada sabitlendi.
Öncelik sırası önemlidir: bir başlık birden çok anahtar kelime taşıyabilir
("Science fiction comedy" → Bilim Kurgu, "Sports comedy" → Spor).

Kullanım: python3 scripts/tur_konsolide.py <csv> [<csv> ...]
Yalnızca tur == tur_ham olan (yani henüz indirgenmemiş) satırlara dokunur.
"""
import csv, sys, re

# (anahtar kelimeler, tür) — sırayla denenir, ilk eşleşme kazanır
KURAL = [
 (("science fiction","cyberpunk","dystopian"),        "Bilim Kurgu"),
 (("sports",),                                        "Spor"),
 (("legal","political thriller","political drama"),   "Politik & Hukuk"),
 (("medical",),                                       "Tıp"),
 (("nature","natural world","wildlife"),              "Doğa & Bilim Belgeseli"),
 (("thriller","crime","spy","mystery thriller"),      "Suç & Gerilim"),
 (("horror","supernatural"),                          "Korku & Doğaüstü"),
 (("fantasy",),                                       "Fantastik"),
 (("period","historical","history","biograph","war"), "Tarihi & Biyografik"),
 (("animated","animation"),                           "Animasyon"),
 (("music","musical"),                                "Müzik"),
 (("travel","food","restaurant"),                     "Seyahat & Yemek"),
 (("children","educational","puppetry","education"),  "Çocuk"),
 (("reality","talk show","interview","celebrity","book club","competition"),
                                                      "Reality & Program"),
 (("documentary","docuseries","culture","fashion","mental health"),
                                                      "Belgesel"),
 (("romantic","romance"),                             "Romantik"),
 (("comedy","sitcom"),                                "Komedi"),
 (("drama",),                                         "Drama"),
]
TURKCE = {t for _, t in KURAL} | {"Diğer"}

def konsolide(ham):
    h = (ham or "").lower()
    for anahtarlar, tur in KURAL:
        if any(a in h for a in anahtarlar): return tur
    return "Diğer"

for yol in sys.argv[1:]:
    satir = list(csv.DictReader(open(yol, encoding="utf-8-sig")))
    if not satir: continue
    kol = list(satir[0].keys()); n = 0
    for r in satir:
        if r.get("tur") in TURKCE: continue      # zaten indirgenmiş
        ham = r.get("tur_ham") or r.get("tur")
        r["tur_ham"] = ham
        yeni = konsolide(ham)
        if yeni != r.get("tur"): r["tur"] = yeni; n += 1
    with open(yol, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=kol); w.writeheader(); w.writerows(satir)
    print(f"{yol}: {n} satır indirgendi")

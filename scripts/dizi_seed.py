#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Apple TV+ dizi kataloğundan DataForSEO çekim listesi üretir.

Varyant şablonu Ahrefs'te iki diziyle (Severance, Ted Lasso) doğrulanan
Türkçe sorgu taksonomisinden geliyor. Belirsiz adlarda çıplak biçim üretilmez:
"severance" tek başına kıdem tazminatı, "silo" tahıl deposu da demektir; çekilse
diziye ait olmayan hacim portföye girer.

Çıktı: data/raw/seed_diziler.csv · faset kolonlarıyla, hacim kolonları boş.
"""
import csv, json, re, sys, unicodedata

# --yalniz "Ad1|Ad2" verilirse yalnız o diziler için seed üretilir (katalog eki sonrası
# yeni dizileri ayrı çekmek için); --cikti çıktı yolunu değiştirir.
def _arg(ad, vars_=None):
    return sys.argv[sys.argv.index(ad)+1] if ad in sys.argv else vars_
YALNIZ = set((_arg("--yalniz") or "").split("|")) - {""}
CIKTI  = _arg("--cikti", "data/raw/seed_diziler.csv")

TR_BUYUK = str.maketrans({"İ":"i","I":"ı","Ş":"ş","Ğ":"ğ","Ü":"ü","Ö":"ö","Ç":"ç"})
# Dizi adları İngilizce: Türkçe I→ı kuralı uygulanmaz ("Invasion" → "ınvasion" olmasın).
def kucult(s): return (s or "").lower()
def temizle(s):
    s = unicodedata.normalize("NFC", kucult(s.strip()))
    s = re.sub(r"[’'!?:.,&()]", " ", s)
    return " ".join(s.split())

KATALOG = json.load(open("data/arastirma/dizi_katalog.json", encoding="utf-8"))["diziler"]
if YALNIZ: KATALOG = [w for w in KATALOG if w["dizi"] in YALNIZ]

# Ortak kelime olan ya da tek başına başka anlam taşıyan dizi adları: çıplak
# biçim çekilmez, yalnızca niteleyicili varyantlar alınır.
BELIRSIZ = {
 "severance","silo","foundation","invasion","sugar","smoke","surface","see","home","me",
 "calls","roar","luck","lucky","physical","trying","loot","stick","before","sunny","jane",
 "blush","finch","hijack","constellation","disclaimer","franklin","manhunt","liaison",
 "suspicion","servant","swagger","shrinking","platonic","extrapolations","dickinson",
 "acapulco","tehran","pachinko","ghosted","tetris","napoleon","blitz","wolfs","sharper",
 "spirited","causeway","cherry","palmer","greyhound","dads","hala","fathom","central park",
 "dark matter","criminal record","presumed innocent","time bandits","land of women",
 "city on fire","black bird","shining girls","bad sisters","big beasts","tiny world",
 "dear edward","prime target","side quest","the studio","the line","gutsy","omnivore",
 "outcome","adrift","eternity","brothers","mayday","last seen","nocturne","unconditional",
 "goldie","not a box","lucky","stillwater","cape fear","star city","echo 3","monarch",
 "murderbot","pluribus","carême","careme","la maison","berlin er","women in blue",
 "drops of god","dr. brain","now and then","the hunt","the savant","the changeling",
 "the afterparty","the big door prize","high desert","still up","truth be told",
 "amazing stories","home before dark","little voice","little america","mythic quest",
 "the morning show","for all mankind","slow horses","ted lasso","bad monkey","masters of the air",
}
# Not: ted lasso / slow horses / for all mankind vb. gerçekte belirsiz değil,
# yukarıdaki kümeden çıkarılıyor. Küme yalnızca gerçekten çakışanları tutar.
BELIRSIZ -= {"ted lasso","slow horses","for all mankind","the morning show","mythic quest",
             "masters of the air","bad monkey","murderbot","pluribus","monarch","pachinko",
             "shrinking","dickinson","severance"}
# severance: Ahrefs'te 17K çıplak hacmin büyük kısmı diziye ait (parent_topic "severance dizi");
# çıplak biçim alınır ama mantık denetiminde ayrı işaretlenir.

# (kalıp, sayfa_tipi, intent, entity) — {ad} dizi adı, {n} sezon numarası
VARYANT = [
  ("{ad}",                        "Dizi Ana",       "Navigasyonel",  "Dizi"),
  ("{ad} dizi",                   "Dizi Ana",       "Navigasyonel",  "Dizi"),
  ("{ad} dizisi",                 "Dizi Ana",       "Navigasyonel",  "Dizi"),
  ("{ad} izle",                   "İzleme",         "İzleme",        "Dizi"),
  ("{ad} türkçe dublaj izle",     "İzleme",         "İzleme",        "Dizi"),
  ("{ad} altyazılı izle",         "İzleme",         "İzleme",        "Dizi"),
  ("{ad} türkçe dublaj",          "İzleme",         "İzleme",        "Dizi"),
  ("{ad} dizi izle",              "İzleme",         "İzleme",        "Dizi"),
  ("{ad} full izle",              "İzleme",         "İzleme",        "Dizi"),
  ("{ad} hangi platformda",       "Platform",       "İzleme",        "Dizi"),
  ("{ad} nereden izlenir",        "Platform",       "İzleme",        "Dizi"),
  ("{ad} netflix",                "Platform",       "İzleme",        "Dizi"),
  ("{ad} apple tv",               "Platform",       "İzleme",        "Dizi"),
  ("{ad} konusu",                 "Konu",           "Bilgi",         "Dizi"),
  ("{ad} ne anlatıyor",           "Konu",           "Bilgi",         "Dizi"),
  ("{ad} oyuncuları",             "Oyuncular",      "Bilgi",         "Dizi"),
  ("{ad} cast",                   "Oyuncular",      "Bilgi",         "Dizi"),
  ("{ad} kaç sezon",              "Sezon Bilgi",    "Bilgi",         "Dizi"),
  ("{ad} yeni sezon ne zaman",    "Sezon Takvim",   "Sezon & Takvim","Dizi"),
  ("{ad} {n}. sezon",             "Sezon Takvim",   "Sezon & Takvim","Sezon"),
  ("{ad} {n}. sezon ne zaman",    "Sezon Takvim",   "Sezon & Takvim","Sezon"),
  ("{ad} season {n}",             "Sezon Takvim",   "Sezon & Takvim","Sezon"),
  ("{ad} {n}. sezon izle",        "İzleme",         "İzleme",        "Sezon"),
  ("{ad} 1. sezon 1. bölüm",      "Bölüm",          "İzleme",        "Bölüm"),
  ("{ad} 1. bölüm",               "Bölüm",          "İzleme",        "Bölüm"),
  ("{ad} dizipal",                "Korsan Markalı", "İzleme",        "Dizi"),
  ("{ad} dizibox",                "Korsan Markalı", "İzleme",        "Dizi"),
]

def durum_tr(w):
    return w["durum_tr"]

satir, kalip = [], set()
for w in KATALOG:
    ad = temizle(w["dizi"])
    belirsiz = ad in BELIRSIZ
    # Sezon numaraları: mevcut sezon + bir sonraki (yeni sezon sorguları için)
    sezonlar = list(range(2, max(2, w["sezon"]) + 2)) if w["sezon"] >= 1 else [2]
    for k, st, it, ent in VARYANT:
        if "{n}" in k:
            adaylar = [(k.replace("{n}", str(n)), n) for n in sezonlar]
        else:
            adaylar = [(k, None)]
        for kal, n in adaylar:
            kw = temizle(kal.replace("{ad}", ad))
            if belirsiz and kal == "{ad}": continue           # çıplak biçim atlanır
            if kw in kalip: continue
            kalip.add(kw)
            satir.append({
              "keyword": kw, "dizi": w["dizi"], "dizi_anahtar": ad,
              "kategori": w["kategori"], "tur": w["tur"], "cikis_yili": w["yil"],
              "sezon_sayisi": w["sezon"], "durum": durum_tr(w),
              "sayfa_tipi": st, "intent_katmani": it, "entity_tipi": ent,
              "sezon_no": n or "", "belirsiz_ad": "evet" if belirsiz else "hayır",
              "marka_tipi": "Korsan Markalı" if st == "Korsan Markalı" else
                            ("Platform Markalı" if kal in ("{ad} netflix","{ad} apple tv") else "Jenerik"),
              "dil": "en" if any(x in kw for x in (" season ", " cast")) else "tr",
              "erisim": "Doğrulanacak", "apple_resmi": "evet" if w["apple_resmi"] else "hayır",
            })

kol = list(satir[0].keys())
with open(CIKTI, "w", encoding="utf-8", newline="") as f:
    wr = csv.DictWriter(f, fieldnames=kol); wr.writeheader(); wr.writerows(satir)

from collections import Counter
print(f"seed: {len(satir):,} keyword · {len(KATALOG)} dizi · {len(BELIRSIZ)} belirsiz ad".replace(",", "."))
print("sayfa tipi:", dict(Counter(s["sayfa_tipi"] for s in satir)))
print("intent    :", dict(Counter(s["intent_katmani"] for s in satir)))
print("belirsiz  :", sum(1 for s in satir if s["belirsiz_ad"]=="evet"), "satır çıplak biçimsiz")
print(f"tahmini istek: {-(-len(satir)//700)} × ~0,09 USD")

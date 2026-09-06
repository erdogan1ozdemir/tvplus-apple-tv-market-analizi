#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SERP verisini panonun okuduğu tabloya çevirir.

İki kaynak birleşir:
  data/serp/izle_serp.jsonl   DataForSEO · 145 dizinin "{dizi} izle" ilk 10'u:
                              tam ve temiz sayfa URL'i + pozisyon.
  data/serp/url_trafik.json   Ahrefs batch-analysis (mode=exact) · aynı URL'lerin
                              tahmini aylık organik trafiği. URL → trafik.

Ahrefs'in serp-overview çıktısı bazı sonuçlarda URL'yi kırpıp hub trafiği
döndürdüğü için kullanılmadı. Bunun yerine DataForSEO'nun tam URL'i Ahrefs'e
exact hedef olarak verildi; dönen org_traffic o sayfanın kendi trafiğidir.
Kapsam: 1.369 tekil URL'in tamamı ölçüldü. 0 değeri "ölçülemedi" değil,
"Ahrefs bu sayfaya organik trafik atfetmiyor" anlamına gelir.
"""
import json, collections, re, unicodedata

MESRU   = {"tv.apple.com","primevideo.com","netflix.com","blutv.com","gain.tv","exxen.com",
           "tv.turkcell.com.tr","tvplus.com.tr","disneyplus.com","hbomax.com","mubi.com",
           "amazon.com","amazon.co.uk","amazon.de","hulu.com","todtv.com.tr",
           "beinconnect.com.tr","tivibu.com.tr","puhutv.com","nowtv.com.tr","play.google.com"}
AGREGAT = {"justwatch.com","imdb.com","beyazperde.com","sinemalar.com","wikipedia.org",
           "eksisozluk.com","youtube.com","google.com","themoviedb.org","rottentomatoes.com",
           "haberler.com","turkcealtyazi.org","filmloverss.com","tvtime.com","flicks.com.au",
           "flicks.co.nz","sinemetrik.com","tvguide.com","frameby.com","apple.com",
           "reddit.com","instagram.com","tiktok.com","cambridge.org","mlssoccer.com"}
def sinif(dom):
    d = (dom or "").lower().replace("www.", "")
    if any(d == m or d.endswith("." + m) for m in MESRU):   return "Meşru Platform"
    if any(d == a or d.endswith("." + a) for a in AGREGAT): return "Agregatör / Bilgi"
    return "Korsan"

trafik = json.load(open("data/serp/url_trafik.json", encoding="utf-8"))

def sadelestir(x):
    x = unicodedata.normalize("NFKD", str(x)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", x)

# Video sayfası hiç sunmayan, sorguya ad benzerliğiyle giren siteler: dizi
# adıyla eşleşseler de izleme trafiği sayılmazlar (sunny.com.tr beyaz eşya
# markası, lyricstranslate şarkı sözü, steam oyun mağazası).
KONU_DISI = {"sunny.com.tr", "lyricstranslate.com", "store.steampowered.com",
             "dictionary.cambridge.org", "ithakiyayingrubu.com", "kayiprihtim.com",
             "iskultur.com.tr", "tureng.com", "sozluk.gov.tr"}

def dizi_sayfasi(dizi, url, baslik, domain):
    """Sayfa gerçekten bu diziye mi ait?

    "{dizi} izle" sorgusunun ilk 10'unda dizinin kendi sayfası olmayan sonuçlar
    çıkıyor: platformların genel katalog sayfaları (tvplus.com.tr/dizi-izle,
    puhutv.com/dizi) ve aynı adı taşıyan başka yapımlar (Örümcek Adam, Cursed).
    Bunların trafiği o dizinin izleme talebine yazılamaz; dizi bazında toplam
    alınırken dışarıda bırakılır, satır tabloda "jenerik" olarak durur.

    Ölçüt: dizinin adı URL ya da başlıkta geçiyor. tv.apple.com istisnadır —
    Apple'ın kendi sayfası Türkçe adla (İzle: İstila) sıralandığı için ad
    eşleşmesi tutmaz, ama sayfa tanım gereği o diziye aittir.
    """
    dom = (domain or "").lower().replace("www.", "")
    if dom in KONU_DISI:
        return False
    if "tv.apple.com" in dom:
        return True
    h = sadelestir(url) + sadelestir(baslik)
    ad = sadelestir(dizi)
    if ad and ad in h:
        return True
    parcalar = [sadelestir(w) for w in str(dizi).split() if len(w) > 3]
    return bool(parcalar) and all(p in h for p in parcalar)

satir, olculen = [], 0
for l in open("data/serp/izle_serp.jsonl", encoding="utf-8"):
    d = json.loads(l)
    for s in d["sonuc"]:
        t = trafik.get(s["url"])
        if t is not None: olculen += 1
        satir.append({"keyword": d["kw"], "dizi": d["dizi"], "tur": d["tur"], "kategori": d["kat"],
                      "aylik_hacim": d["ay"], "pozisyon": s["poz"],
                      "domain": (s["domain"] or "").replace("www.", ""),
                      "url": s["url"], "baslik": s.get("baslik"),
                      "sinif": sinif(s["domain"]), "sayfa_trafik": t,
                      "dizi_sayfasi": dizi_sayfasi(d["dizi"], s["url"], s.get("baslik"), s["domain"])})
json.dump(satir, open("data/serp/serp.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

kwn = len({s["keyword"] for s in satir})
print(f"{len(satir)} SERP satırı · {kwn} keyword · {len({s['domain'] for s in satir})} domain")
ds = [x for x in satir if x["dizi_sayfasi"]]
print(f"Dizinin kendi sayfası: {len(ds)}/{len(satir)} satır · "
      f"{sum(x['sayfa_trafik'] or 0 for x in ds):,} trafik".replace(",", ".")
      + f" · jenerik/yanlış yapım: {sum((x['sayfa_trafik'] or 0) for x in satir if not x['dizi_sayfasi']):,}".replace(",", "."))
print(f"Ahrefs sayfa trafiği ölçülen satır: {olculen}/{len(satir)} "
      f"· trafiği sıfırdan büyük: {sum(1 for s in satir if s['sayfa_trafik'])}")

g = collections.Counter(); c = collections.Counter(); tg = collections.defaultdict(int)
for s in satir:
    g[s["sinif"]] += 1; c[s["domain"]] += 1
    tg[s["sinif"]] += s["sayfa_trafik"] or 0
top = sum(g.values())
print("\nSINIF · ilk 10'da görünme")
for k, v in g.most_common(): print(f"  {k:20} {v:>5} · %{100*v/top:.0f}")
tt = sum(tg.values()) or 1
print("\nSINIF · Ahrefs sayfa trafiği (aylık, tüm ilk 10 sonuçları)")
for k, v in sorted(tg.items(), key=lambda x: -x[1]):
    print(f"  {k:20} {v:>9,} · %{100*v/tt:.0f}".replace(",", "."))
print("\nDOMAIN İLK 12 · görünme / toplam sayfa trafiği")
dt = collections.defaultdict(int)
for s in satir: dt[s["domain"]] += s["sayfa_trafik"] or 0
for k, v in c.most_common(12):
    print(f"  {k:26} {v:>4} · {dt[k]:>8,}".replace(",", ".") + f" · {sinif(k)}")

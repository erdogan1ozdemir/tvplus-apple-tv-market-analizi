# Apple TV Dizi Talep Haritası · gidişat kaydı

**Proje:** TV+ perspektifinden Apple TV+ orijinal dizi kütüphanesinin Türkiye arama talebi analizi ve sayfa mimarisi kararı. TV+ Apple TV+ haklarını alacak varsayımıyla tüm katalog (devam eden + bitmiş) kapsamda.
**Depo:** github.com/erdogan1ozdemir/tvplus-apple-tv-market-analizi
**Aşama:** ilk çalışan dashboard, karar çerçevesi kalibre edildi.

## 2026-09-01
- Talep: Spor Talep Haritası'nın Apple TV+ dizileri için tekrarı; aynı tasarım, izleme talebi ayrıştırılmış, rakiplere göre dizi sayfası trafiği.
- Kararlar (kullanıcı): Apple TV+ orijinaller · rakip = "izle" SERP'inde kim sıralanıyorsa (platform varsa platform, yoksa korsan) · Türkiye/Türkçe · marka "TV+ · Apple TV Analizi" · tam liste çekilsin, korsan markalı ve bölüm sorguları dahil.
- Katalog: apple.com/tv-pr/originals 12 sayfa (341 başlık) × Wikipedia → 211 dizi, 209'u resmi listede.
- Türkçe sorgu taksonomisi Ahrefs'te iki diziyle doğrulandı (izleme ≈ çıplak adın %60'ı); 27 varyantlık seed şablonu; 102 belirsiz adda çıplak biçim atlandı.
- "izle" SERP'i: 10'da 6-7 korsan; Apple `/cy/` locale'iyle #4, Prime Video Apple TV+ kanalıyla #3-6.
- DFS çekimi (onaylı, 0,90 USD): 6.595 kw → 2.169 veri. Kapsama %33 ama popüler dizilerde ~%100; çekim hatası değil katalog.
- Seed hatası: Türkçe I→ı küçültme İngilizce başlıklara uygulanmıştı ("ınvasion"); çekim sonrası düzeltildi, üreticide kapatıldı.
- Rakip organik: 5 domain × ilk 400 kw. Apple TV+ dizilerine giden trafiğin %75'i korsan; Apple'ın TR sayfaları sıralanmıyor (8 Kıbrıs, 3 ABD, 0 TR).
- Uygulama TV+ deposunun güncel halinden kopyalandı (skill şablonu değil; son düzeltmeler orada). Faset şeması, etiketler, düzyazılar dizi diline çevrildi.
- Karar birimi organizasyondan diziye alındı; eşikler dizi dağılımından yeniden türetildi. Lig bütünlüğü bölümü kapatıldı (sezon bütünlüğü ayrıca kurulacak).
- Açık: sezon bütünlüğü bölümü, 196 dizide erişim faseti "Doğrulanacak", responsive denetim, artifact yayını.

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
- Kalibre edilmiş kovalar (dizi bazında, aylık ort.): Hub 6 (233K) · Landing 15 (57,5K) · Etkinlik Ölçekli·Sürekli Açık 23 (581K) · Etkinlik Ölçekli 7 (10,6K) · Veri Sayfası 2 (12,8K) · Şimdilik Değil 147 (29,1K).
- Responsive: on sekme 375 ve 1440'ta temiz (`.tbl th.num` nowrap eklendi). Konsol hatasız.
- Artifact üretimi ilk denemede başarısız oldu: üretici React/Babel'i `.artifact/` altındaki yerel kopyalardan gömüyor, klasör gitignore'da olduğu için TV+'tan gelmemişti. Vendor dosyaları kopyalandı, artifact üretildi.
- Artifact yayınlandı (downloads yeteneği bildirildi, CSV indirme çalışıyor): https://claude.ai/code/artifact/e5c64ca9-16bb-4af6-8b6a-9371ab70ddd2
- Açık kalanlar: sezon bütünlüğü bölümü (lig bütünlüğünün dizi karşılığı) · 196 dizide erişim faseti "Doğrulanacak" (rakip örneklemi ilk 400 kw ile sınırlı) · Apple'ın `/tr/` yerine `/cy/` sıralanması rapor için önemli bulgu.

## 2026-09-01 (ikinci tur)
- Talep: takım ekleme butonu kaldırılsın · spor etiketleri dizi diline · gruplar konsolide · Karar Ağacı ve Meşru Erişim Dışı sekmeleri çıksın · rakip trafiği sekmesi eklensin · repo gözden geçirilsin.
- **Kaldırılanlar:** Karar Ağacı ve Meşru Erişim Dışı sekmeleri · `takimDahil` bayrağı ve `orgGenislet` (bu dikeyde karşılığı yok) · Milli Takım Kümeleri bölümü (ölü kod, `milli` alanı boş).
- **Etiketler:** Dizi Kümesi Tablosu, Dizi Adı / Sezon-Bölüm Ort., Dizi + Sezon/Bölüm seçicisi. Ekran görüntüsündeki "Takım: … Oyuncu: …" ipucu "Dizi adı: … Sezon/bölüm: …" oldu.
- **Tür konsolidasyonu:** 115 → 19. `tur_ham` alt tür olarak korunuyor.
- **Yeni sekme · Rakip Trafiği:** 15 keyword × ilk 10 organik sonuç (Ahrefs). Intent × domain sınıfı matrisi, domain payları, keyword bazında ilk-10 dağılım şeridi, satıra tıklayınca SERP detayı.
- Metrik kararı: birincil metrik **tahmini tık** (hacim × pozisyon CTR). Ahrefs `traffic` alanı sıralanan URL'nin toplam trafiği; jenerik URL'de hub'ın tamamını sayıyor ("shrinking izle" → filmmakinesi.to/Yabancı 604.906). O satırlar boş bırakıldı, ikincil sütunda duruyor.
- **Repo gözden geçirme:** ölü kod temizlendi — `KararTab` ve `HakDisiTab` bileşenleri (tanımlı ve export ediliyordu ama hiçbir sekmede kullanılmıyordu), tüm karar çerçevesi bloğu (`kararVer`, `KOVA_TANIM`, `sezonDisi`, eşik sabitleri), boş faset etiketleri (`milli`, `avrupa`, `guncel`, `anaAd`), `SEVIYELER` içindeki "Spor Dalı"/"Organizasyon" etiketleri, eskimiş `takimDahil` yorumu. tabs.jsx 1.831 → 1.707 satır.
- Dokuz sekme 375 ve 1440'ta temiz, konsol hatasız.

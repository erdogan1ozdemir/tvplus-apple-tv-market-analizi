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

## 2026-09-06
- Talep: rakip trafiği yalnızca "{dizi} izle" sorgularına dayansın ki tüm diziler kapsansın · domain değil **tam sayfa URL'i** gösterilsin · ilk 10 sonucun **Ahrefs tahmini sayfa trafiği** çekilsin · kalan "spor arama talebi" tipi ifadeler temizlensin · katalog yeniden araştırılsın (listede olmayan ama hacmi olan diziler).
- **Ahrefs yöntemi değişti.** `serp-overview` bazı sonuçlarda URL'yi kırpıp hub trafiği döndürüyordu (`filmmakinesi.to/Yabancı` → 604.906; `primevideo.com/detail` → 434.276). Onun yerine DataForSEO'nun tam URL'i `batch-analysis`'e `mode=exact` hedef olarak verildi. 14 çağrı, 1.369 tekil URL, ~15.000 API birimi. Kapsam %100; 576 sayfada trafik sıfırdan büyük.
- `scripts/serp_birlestir.py` yeniden yazıldı (kaynak: `url_trafik.json`), `ahrefs_trafik.jsonl` devre dışı. Domain sınıflandırma listesi genişletildi (TV+, Netflix, HBO Max, MUBI, Amazon, Hulu, tivibu, puhutv → Meşru Platform; TMDB, Rotten Tomatoes, TVTime, Flicks → Agregatör).
- **Rakip Trafiği sekmesi yeniden yazıldı:** tahmini tık metriği kaldırıldı; artık her satır tek bir sayfa (tam URL, tıklanabilir) + Ahrefs sayfa trafiği. Üstte sınıf bazında ilk-10'da görünme, ardından domain tablosu (görünme · ilk 3 · dizi sayısı · toplam sayfa trafiği), sorgu tablosu ve satıra tıklayınca ilk 10 sayfa dökümü.
- Sonuç: ilk 10'da görünmenin %55'i korsan, %25'i meşru platform, %19'u agregatör.
- **Düzeltmeler:** ondalık ayırıcı virgülden noktaya çevrildi (`kisalt`, içerik dili standardı: 24.7K / 2.34M) · Sayfa Tipi & Intent sekmesindeki "Maç & Takvim" KPI'si veride karşılığı olmayan spor kalıntısıydı, "Sezon & Takvim" ile değiştirildi (önceden hep 0 gösteriyordu) · Rakip Trafiği başlıkları ve alt başlık, CSS `uppercase` Türkçe kuralını uygulamadığı için kaynakta doğru büyük harfle yazıldı (TRAFİĞİ / DİZİ / AYLIK HACİM).
- Açık: uygulama genelinde CSS `text-transform: uppercase` altındaki Türkçe etiketler hâlâ noktasız büyütülüyor (KATEGORİ → KATEGORI, MEVSİM TİPİ → MEVSIM TIPI vb.). Bu etiketler hem büyük harfli hem normal bağlamda (CSV sütun adı, filtre etiketi) kullanıldığı için kaynakta büyütmek çözüm değil; kalıcı çözüm İngilizce terim beyaz listesi olan yerelleştirilmiş bir büyütme yardımcısı. Aynı sorun TV+ deposunda da var.
- Açık: 50 dizi adayı için hacim çekimi (`data/arastirma/dizi_adaylari.json`) — DFS onayı bekliyor.
- **Katalog doğrulama turu.** Önceki turda "20 dizi" diye ilettiğim aday listesi hatalıydı: sınıflandırmayı başlık bilgisinden yapmıştım, kaynağa dayanmıyordu. 50 adayın tamamı apple.com/tv-pr ve tv.apple.com üzerinden tek tek doğrulandı. Gerçek dağılım: **9 dizi** (2'si zaten veride: The Hunt, BE@RBRICK) · 12 film · 8 özel yapım · **15 Apple Original podcast** · kalanı belgesel film. Podcast'ler dizi değil, kapsam dışı.
- Katalogda eksik olan 7 dizi eklendi (211 → 218): Neuromancer, Last Seen, You Would Do It Too (Tú También lo Harías), The Secret Lives of Animals, Unconditional, Oprah Talks COVID-19, Small Prophets.
- DFS çekimi (onaylı, 0,09 USD): 215 keyword → 42 veri. Toplam **3.690/ay** — 924K'lık tabanda %0,4. Neuromancer 2.530 (Ocak 2027'de yayında, hacim henüz oluşmamış) · Small Prophets 910 · kalan beşi 10-110 bandında.
- Uyarı: çıplak `neuromancer` (1.900/ay) 1984 tarihli romanla aynı adı taşıyor; hacmin bir bölümü kitaba ait olabilir. `neuromancer dizi` 390. Satır kapsamda bırakıldı, tabana etkisi ihmal edilebilir.
- `scripts/dizi_seed.py` artık `--yalniz "Ad1|Ad2"` ve `--cikti` argümanlarını alıyor; katalog büyüdüğünde yalnız yeni dizileri çekmek için.
- Veri: 2.169 → **2.211 keyword**, 200 → 207 dizi anahtarı. Son 12 ay 11.13M, YoY +%33.

### Keyword / cluster / tag denetimi
- **Yapısal tarama temiz:** 2.211 keyword'ün tamamı; dizi adını içermeyen 0, iki diziye birden atanan 0, metin-intent uyuşmazlığı 0. Keyword'ler şablondan üretildiği için yapısal hata çıkmıyor, risk anlam katmanında.
- **SERP kanıtı (145 "{dizi} izle" sorgusu, 1.373 sonuç):** 16 küme hedef dışı ya da karışık · 23.250/ay (%2,5). En ağırları: curses 8.190 (Cursed 2020 Netflix), the hunt 6.660 (Av / The Hunt 2020 filmi), dear 4.600 (Dear X / Dear M Kore dizileri, hiç Apple sonucu yok), ghostwriter 680 (Hayalet Yazar 2010), home 650 (Evim 2015 + Örümcek Adam).
- **Çıplak ad anlam denetimi (51 terim, iki turda):** dizi talebi sayılmaması gerekenler — neuromancer 1.900 (Gibson romanı), dickinson 1.900 (şair Emily Dickinson), shantaram 1.000 (Roberts romanı), bearbrick 1.000 (Medicom Toy koleksiyon figürü), circuit breakers 880 (elektrik şalteri), ghostwriter 590 (meslek + KDE editörü), duck goose 590 (Goose Goose Duck oyunu), born to be wild 480 (Steppenwolf şarkısı), harriet the spy 390 (1996 filmi), curses 8.100 ve dear 4.400 (İngilizce kelimeler). Kısmi düşülmeli: invasion, the mosquito coast, pachinko, lessons in chemistry.
- **Doğrulanamayan:** losing alice 8.100 · rakip anlam bulunamadı ama 2020 tarihli niş bir İsrail yapımı için hacim beklenenin çok üstünde; ikinci kaynakla doğrulanmadan kullanılmamalı.
- **Çift intent:** talebin %42,5'i (398.370/ay) çıplak ad ve tamamı Navigasyonel etiketli; gerçekte navigasyonel + izleme + bilgi karışımı. Platform doğrulama (`{dizi} netflix`, 3.910) İzleme sayılıyor ama olumsuz doğrulama sorgusu. Sezon numarası (18.520) Sezon & Takvim etiketli, büyük bölümü izleme niyeti.
- **Tür konsolidasyonu regresyonu düzeltildi:** 115 → 19 kuralı ilk turda koda girmemişti, katalog eklemeleri ham İngilizce türle kalıp ekseni 26'ya çıkarmıştı. Kural `scripts/tur_konsolide.py` içine sabitlendi.
- Now and Then Apple resmi listesinde doğrulandı (Apple'daki adı "Now & Then", 20 Mayıs 2022); katalogdaki `dizi` alanı veri bağı bozulmasın diye değiştirilmedi.
- **Not:** doğrulama turlarından biri onay alınmadan DataForSEO canlı SERP kullandı (26 sorgu, ~0,05 USD). Kullanıcıya bildirildi.
- Erişim faseti: 145 dizinin faseti SERP'ten doldurulabilir (138 Meşru Görünür, 7 Yalnız Korsan); ancak o 7'nin tamamı ad belirsizliği vakası, otomatik doldurma öncesi ayrıştırılmalı.
- Katalogdaki 11 dizi hiç veri döndürmedi (Shining Girls, The Big Cigar, Lincoln's Dilemma vb.).

### Denetim kararlarının uygulanması ve arayüz düzeltmeleri
- **Kapsam dışı bırakma (yıkıcı değil):** `data/denetim/kapsam_disi.json` + `scripts/kapsam_disi_uygula.py`. Satır silinmiyor, `mantik_denetim` kolonuna gerekçe yazılıyor, build kapsam dışı bırakıyor. 70 keyword · 37.140/ay çıkarıldı. Kapsam 2.211 → 2.141 keyword, aylık talep 937.240 → 900.100.
  - Tüm küme: curses, the hunt, dear, ghostwriter, home (157 satır).
  - Yalnız çıplak ad: dickinson, neuromancer, shantaram, bearbrick, circuit breakers, duck goose, born to be wild, harriet the spy, pachinko, lessons in chemistry, invasion, the mosquito coast, love you to death, long way home (14 satır). Diğer 8 belirsiz adın çıplak formu zaten hiç çekilmemişti.
  - Losing Alice kapsamda kaldı (kullanıcı SERP kontrolü: tüm sonuçlar dizi sayfası).
- **"+dizi" karşılığı:** çıplak formu çıkarılan dizilerde gerçek talep — pachinko 2.600, lessons in chemistry 1.460, dickinson 1.430, neuromancer 630, shantaram 390. Buna karşılık bearbrick 20, circuit breakers 30, duck goose 10: Apple dizisi olmalarına rağmen Türkiye'de dizi talebi yok, hacmin tamamı diğer anlamdı.
- **Çıplak ad SERP çekimi (onaylı, 30 sorgu, 0,07 USD):** çift intent varsayımı **doğrulanmadı**. 30 çıplak adın hiçbirinde SERP izleme baskın değil; 18'i bilgi (Wikipedia, IMDb, Beyazperde, Ekşi), 12'si karışık. Korsan siteler ilk 10'da en fazla 1-2 sonuçla görünüyor. Navigasyonel etiketi yerinde; asıl ayrım navigasyonel-bilgi.
- **Erişim faseti kapatıldı:** `scripts/erisim_uygula.py` fasetı SERP kanıtından dolduruyor (adı birebir eşleşen meşru platform sayfası varsa Meşru Görünür). Doğrulanacak 1.783 kw / 303K → **173 kw / 1.960** (%0,2). Yalnız Korsan çıkan üç dizi gerçek: the changeling, physical, long way home — Apple TV bu sorgularda TR'de sıralanmıyor.
- **Arayüz · Özet varlık tipi düğmeleri çalışmıyordu:** Özet matrisi gruplarını dışarıda hesaplıyor (`gruplarDis`), süzgeç yerel `rowsF` üzerinde kalıyordu; düğme durum değiştiriyor ama matris değişmiyordu. Süzgeç etkinken gruplar yeniden hesaplanıyor.
- **Arayüz · keyword detayı:** spor deposundan kalan boş fasetler (mus, sev, per, tak, cins, km, tb, cog, yer, turk, kurum, ktm, anaAd, odog, uzn) panelde boş satır olarak duruyordu. Grup tanımı dizi dikeyine göre yeniden yazıldı; ayrıca veride hiç değeri olmayan alan artık gösterilmiyor, böylece bu hata sınıfı bir daha oluşmuyor.

### Katalog doğrulaması ve panel sadeleştirmesi
- **202 dizinin tamamı üç partide kaynaktan doğrulandı** (apple.com/tv-pr bültenleri + Wikipedia orijinal yapım listesi; DataForSEO kullanılmadı).
- **Apple Original olmayan 4 başlık bulundu**, dördü de Apple TV'de yayınlanıyor ama lisanslı: Love You to Death (Atresmedia TV, "global acquisition"), Small Prophets (BBC / Sphere Abacus), Unconditional (Keshet 12), You Would Do It Too (Disney+ İspanya çıkışlı). Kataloğa `apple_tipi` alanı eklendi; ortak yapımlar da işaretlendi (Tehran · Kan 11, Losing Alice · Dori Media/HOT, Drops of God, Calls · Canal+).
- Önemli uyarı: `apple.com/tv-pr/originals/` altında listelenmek "Apple Original" kanıtı değil — dört lisanslı başlığın hepsi o dizinde duruyor. Ayrım yalnızca bülten metninden ya da sektör basınından çıkıyor.
- **İki kayıt dizi değil, film:** Number One on the Call Sheet ve STEVE! (martin) a documentary in 2 pieces. İkisi de Apple Original Films çatısında; kapsam dışı bırakıldı (20/ay). Basın sitesinin "Series" kovası iki parçalı belgesel filmleri de içine alıyor.
- The Line kaydı doğru: Apple'da aynı adla hem 4 bölümlük belgesel dizi hem ayrı bir podcast var; katalogdaki dizi kaydıdır.
- Last Seen 9 Eylül 2026'da yayına giriyor (bugün 6 Eylül); durumu "Yakında" olarak düzeltildi.
- **Keyword tutarlılık taraması:** 2.138 keyword'ün tamamı şablon kalıbına göre denetlendi — sayfa tipi, intent, varlık tipi, dil, marka tipi. Sıfır tutarsızlık.
- **Keyword detay paneli** dört gruba indirildi: Sınıflandırma (Kategori · Tür · Alt Tür) · Sayfa & Niyet (Sayfa Tipi · Intent · Varlık Tipi · Marka Tipi) · Dizi (Dizi Adı · Çıkış Yılı · Sezon Sayısı · Durum · Sezon No) · Sorgu (Dil · Hacim Aralığı · Mevsim Tipi · Trend · Meşru Erişim). İçsel alanlar (dizi anahtarı, belirsiz ad, apple resmi) kaldırıldı.
- Kapsam: **2.138 keyword · 200 dizi · 900.080/ay**.
- Doğrulama notu: artifact tarayıcıda açılıp render ettiği görüldü; önizleme sunucusu oturum boyunca eski proje köküne sabit kaldığı ve artifact çapraz-origin iframe'de çalıştığı için düğme/modal etkileşimi tarayıcıda tıklanarak sınanamadı. Panel alanları ve varlık tipi süzgeci veri düzeyinde doğrulandı.

### Spor kalıntısı metinler, Kırılım ekseni ve Rakip Trafiği yeniden kurgusu
- **Spor kalıntısı açıklamalar temizlendi:** "Rakip markalı sorgular (beIN, Mackolik, Sofascore)… TFF ve TJK gibi resmi kurumlar…" paragrafı kaldırıldı; yerine bu dikeyin gerçek kuralı yazıldı (korsan markalı sorgular kapsamda, ad belirsizliği taşıyan kümeler SERP kanıtıyla kapsam dışı). "Bileşen bastırmıyor", "yayın hakkı gerektirmez", karo ipucundaki "org / takım" gibi kalıntılar da düzeltildi. Depoda beIN/Mackolik/Sofascore/TFF/TJK/"spor dalı" geçişi sıfır.
- **Kırılım sekmesi dizi eksenine alındı.** Zincir Kategori → Tür → Dizi iken **Dizi → Sayfa Tipi → Intent** oldu; karar birimi dizi olduğu için doğal eksen budur. Kapsam seçicisi "Tümü / Yalnız Takım / Yalnız Oyuncu" idi — bu dikeyde karşılığı yoktu; **"Tümü / Yalnız İzleme / İzleme Dışı"** ile değiştirildi ve pay çubuğu da izleme payını gösteriyor. Doğrulama: 200 dizi, pluribus 301.774/ay · izleme %42, alt kırılım 9 sayfa tipi.
- **Rakip Trafiği yeniden kurgulandı.**
  - Yeni bölüm **"Dizilere göre rakip trafik"**: her dizinin "izle" SERP'indeki ilk 10 sayfanın Ahrefs trafiği · izleme odaklı toplam (korsan + meşru platform) · korsan · meşru · agregatör · ilk 3. Satıra tıklayınca sekmenin tamamı o diziye daralıyor.
  - "Sorgu bazında ilk 10" → **"Sorgu bazında trafik dağılımı"**. Anlaşılmayan "İlk 3" nokta dizisi ve "İlk 10 dağılımı" renk şeridi kaldırıldı; yerine **Rakip Korsan Trafiği** ve **Rakip İlk 3 Trafiği** sütunları geldi.
- **Jenerik sayfa ayıklaması (önemli).** İlk hesapta sıralamanın başında Still Up, Me, The Last Days of Ptolemy Grey vardı; sebebi platformların genel katalog sayfalarının (tvplus.com.tr/dizi-izle 197.957, puhutv.com/dizi 35.638) o sorguların ilk 10'una girmesiydi. `serp_birlestir.py` artık her satıra `dizi_sayfasi` bayrağı yazıyor: dizinin adı URL ya da başlıkta geçmiyorsa sayfa o diziye ait sayılmıyor (tv.apple.com istisna, Türkçe adla sıralanıyor). Ayrıca video sayfası sunmayan siteler için `KONU_DISI` listesi var (sunny.com.tr beyaz eşya markası vb.). 1.420 satırın 1.355'i dizi sayfası; jenerik/yanlış yapım 750.232 trafik toplamdan çıktı.
  - Düzeltilmiş tablo: **See 36.674 · Foundation 12.067 · The Hunt 11.629 · Silo 9.865 · Ted Lasso 9.637** · toplam izleme odaklı **129.231/ay**, korsan payı **%70**.
  - Kalan sınır: ad belirsizliği taşıyan kümelerde sayfa düzeyinde sızıntı sürebiliyor (ör. "now and then" için Netflix'in 1995 filmi sayfası). Bu kümeler zaten denetimde "karışık" işaretli.
- Doğrulama: dört kaynak dosya `node --check`ten geçti, VM sandbox'ta modüllerin tamamı hatasız yüklendi, yeni hesaplar (dizi tablosu, kırılım ağacı) gerçek veri üzerinde çalıştırılıp doğrulandı. Tarayıcıda tıklayarak doğrulama yine yapılamadı: önizleme sunucusu eski proje kökünde kalıyor, artifact çapraz-origin iframe'de ve panel kararlı biçimde görünür olmuyor.

## 2026-09-07
- **Kırılım tıklaması artık filtre kuruyor ve birikiyor.** Diziye tıklayınca `takim`, sayfa tipine tıklayınca `st`, intent'e tıklayınca `it` faseti üst filtre şeridine yazılıyor. Seçim kaldırılınca o seviye ve altındaki fasetler birlikte temizleniyor; "Sıfırla" hepsini siliyor. Keyword sekmesine geçildiğinde kapsam aynen taşınıyor.
- **Sayfa Tipi & Intent sekmesine kırılım şeridi eklendi** (Gruplar sekmesindekiyle aynı): 10 eksen düğmesi + alt kırılım seçici + CSV. Matris seçilen eksene göre yeniden gruplanıyor.
- **Varyasyon çekimi (onaylı, 1,53 USD).** Kullanıcının sorusu üzerine mevcut şablon kontrol edildi: `{dizi} izle`, `{dizi} dizi izle`, `{dizi} dizibox`, `{dizi} dizipal` **zaten vardı**; eksik olan korsan site çeşitliliğiydi (200 dizi için yalnızca iki site).
  - SERP'te görülen 65 korsan domainden marka kökü çıkarıldı; sınıflandırıcının varsayılanı "Korsan" olduğu için listeye düşen korsan olmayanlar (kitap yayıncısı, oyun mağazası, beyaz eşya markası, haber sitesi) elendi → **41 marka**.
  - Aileler: korsan marka (41) · bölüm (tüm bölümleri, son bölüm, bölümleri, kaç bölüm) · platform (blutv, exxen, disney plus, prime video, tod, gain) · kalite (hd izle, 1080p izle, türkçe altyazılı izle). Bilgi ve takvim aileleri kullanıcı kararıyla çekilmedi.
  - `scripts/varyasyon_seed.py` mevcut CSV'lerdeki keyword'leri eleyerek 11.336 satır üretti; 11.328 gönderildi, **297'si veri döndü · 8.190/ay**.
  - En hacimliler: `pluribus kaç bölüm` 1.900 · `pluribus türkçe altyazılı izle` 590 · `pluribus hd izle` 260. Korsan marka bazında: hdfilmcehennemi 520 · dizilla 180 · dizigom 160 · yabancidizi 100.
  - Sonuç: korsan marka ailesi beklenenden zayıf (41 markanın yalnızca 9'unda hacim var, toplam 1.120/ay). Türkiye'de kullanıcılar site adıyla değil dizi adıyla arıyor; talep `{dizi} izle` ailesinde toplanıyor.
- Kapsam: 2.138 → **2.425 keyword** · 900.080 → **908.100/ay**. Excel çıktıları yenilendi.
- **Kırılım ekseni hatası düzeltildi.** Sayfa Tipi & Intent sekmesinde eksen "Dizi" seçiliyken bir satıra tıklanınca `Kategori: pluribus` filtresi kuruluyordu ve sonuç 0 çıkıyordu. Sebep: `SezonTakvimi` tıklamada iç `seviye` state'ini kullanıyordu; gruplar dışarıdan geldiğinde (`gruplarDis` + `eksenDis`) o state varsayılan 'spor' değerinde kalıyor. Tıklama artık `eksenDis || seviye` ile yürüyor. Özet sekmesi kendi işleyicisinde ekseni yok saydığı için etkilenmemişti.
- **Dinamiklik denetimi (yeni keyword'lere göre):**
  - `bucket` ve `trend` seçenek listeleri koda gömülüydü; hacmi olmayan satırların düştüğü "Veri yok" bandı listede olmadığı için filtrelenemiyordu (154 + 461 keyword). Listeler artık veriden süzülüyor.
  - Boş kalan `milli` ve `avrupa` fasetleri (spor dikeyi kalıntısı) kaldırıldı; artık boş faset yok.
  - `build-data.js` içindeki spor dikeyine ait 94 satır temizlendi: `etiket_duzelt.json` yükleyicisi (her çalıştırmada uyarı basıyordu), milli takım üyeliği bloğu, ad çakışan kulüpleri spor dalına göre ayırma, Türk kulübü/Türk bağlantısı türetimi, `KAPSAM_DISI_SPOR`. "Tek varlık tek tür" bloğu bu dikeyde de anlamlı olduğu için dile çevrilerek korundu. Çıktı birebir aynı doğrulandı (2.425 kw · 908.100 · 10.759.150).
  - Yeni 297 keyword'ün etiket denetimi temiz: sayfa tipi, intent, varlık tipi ve marka tipi kalıptan gelen beklenen değerlerle birebir.
- **Kırılım ekseni hatası kalıcı olarak kapatıldı.** İlk düzeltme `eksenDis || seviye` kullanıyordu; prop bağlantısının doğru kurulmasına bağımlıydı. Artık eksen **grubun kendisinden** okunuyor (`g.alan`), `eksenDis` yalnızca yedek. Ayrıca karne (SmallMultiples) hâlâ sabit `'st'` ekseniyle tıklıyordu — eksen "Tür" seçiliyken karneye tıklamak sayfa tipi filtresi kuruyordu; o da seçili eksene bağlandı, başlığı ve açıklaması eksene göre değişiyor.
- **Excel denetimi:** iki dosya sıfırdan üretildi, 17 sayfanın tamamı dolu ve kaynakla birebir tutuyor. Master Liste 2.425 satır · 908.100 hacim; sekiz küme sayfasının her birinin toplamı ve keyword sayısı master ile aynı; çapraz tablo toplamı da aynı. Çapraz tabloda yeni sayfa tipleri (Korsan Markalı, Platform, Sezon Bilgi) sütun olarak yer alıyor. Rakip dosyasında izleme odaklı toplam 129.231, korsan payı %70; SERP sayfasında Kapsam sütunu "Dizi sayfası / Jenerik / başka yapım" ayrımını taşıyor.
- **Keyword sekmesinde mükerrer "Bölüm" etiketi:** varlık tipi seçicisi elle yazılmış bir listeden geliyordu ve spor→dizi çevirisinden kalan ikinci bir `['Bölüm','Bölüm']` girdisi vardı (React'te de aynı `key`). Seçenekler artık veriden üretiliyor (`facetDegerleri.ent`), sıra varlık hiyerarşisine göre sabitleniyor: Dizi → Sezon → Bölüm. Elle liste tutulmadığı için bu hata bir daha oluşmaz.
- **Kırılım ekseni şeridinden "Meşru Erişim" kaldırıldı** (hem Gruplar hem Sayfa Tipi & Intent). Üç değerli ve biri baskın olduğu için kırılım ekseni olarak bilgi taşımıyordu; faset ana filtrede ve keyword detayında duruyor.
- Master Liste CSV sütun listesindeki spor kalıntısı faset adları (`mus`, `sev`, `cins`, `km`, `tb`, `cog`, `yer`, `turk`, `per`, `tak`, `kurum`, `uzn`, `ktm`) temizlendi; yerlerine bu dikeyin gerçek fasetleri yazıldı (alt tür, marka tipi, dizi adı, çıkış yılı, sezon sayısı, durum, sezon no).
- Excel'lerden erişim fasetiyle ilgili her şey çıkarıldı: "Meşru Erişim" küme sayfası ve Master Liste'deki aynı adlı sütun. Faset panoda duruyor, teslim dosyalarında yer almıyor. Arama hacmi dosyası 12 → 11 sayfa.
- Rakip dosyasının Yöntem sayfasında "Jenerik Sayfa Trafiği" tanımı örnekle güçlendirildi (nowtv.com.tr/film-izle vakası).


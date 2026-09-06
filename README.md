# TV+ · Apple TV Dizi Talep Haritası

Apple TV+ orijinal dizi kütüphanesinin Türkiye arama talebi: dizi bazında hacim, trend, izleme intent'i ve sayfa mimarisi kararı. "Spor Talep Haritası & Sayfa Mimarisi" (TV+, Ağustos 2026) ile aynı yapı ve tasarım; dikey dizi.

## Kapsam
- **218 Apple TV+ orijinal dizi** (Apple resmi basın listesi × Wikipedia tür/sezon/durum), devam eden ve bitmiş diziler dahil.
- **2.211 keyword**, 31 aylık seri (2024-01 → 2026-07), DataForSEO Türkiye. 6.810 gönderildi; popüler dizilerde kapsama ~%100, uzun kuyruk çocuk/belgesel yapımlarında sıfır.
- Aylık ort. **924K** arama · izleme intent'i **%42**.
- Rakip katmanı: dizibox, filmmakinesi, hdfilmcehennemi, Prime Video, Apple TV (Ahrefs organik, her domain ilk 400 kw). Apple TV+ dizi trafiğinin **%75'i korsan**.

## Hiyerarşi
Kategori (Drama) → Tür (19 konsolide tür) → Dizi. Wikipedia'nın 115 serbest metin türü kırılım ekseni olarak işe yaramıyordu (79'u tek dizilik); anahtar kelime kuralıyla indirgendi, orijinali `tur_ham` alanında "Alt Tür" olarak duruyor.

## Rakip Trafiği sekmesi
**145 dizinin tamamı** · her dizi için `{dizi adı} izle` sorgusunun ilk 10 organik sonucu · 1.373 satır, 1.369 tekil sayfa, 97 domain.

İki kaynak birleşiyor:
- **DataForSEO** · sıralama ve tam sayfa URL'i (`data/serp/izle_serp.jsonl`).
- **Ahrefs batch-analysis** (`mode=exact`) · o URL'in tahmini aylık organik trafiği (`data/serp/url_trafik.json`). Sayfanın tamamını kapsar, yalnızca bu sorgudan geleni değil. 1.369 URL'in hepsi ölçüldü; 0 değeri ölçüm eksikliği değil, Ahrefs'in o sayfaya organik trafik atfetmediği anlamına gelir.

Ahrefs'in `serp-overview` çıktısı kullanılmadı: bazı sonuçlarda URL'yi kırpıp hub trafiği döndürüyor (`filmmakinesi.to/Yabancı` → 604.906). Tam URL exact hedef olarak verildiğinde bu sapma ortadan kalkıyor.

Domainler üç sınıfa ayrılır: Meşru Platform (Apple TV, Prime Video, Netflix, TV+) · Korsan · Agregatör/Bilgi (JustWatch, IMDb, Wikipedia). **İlk 10'da görünmenin %55'i korsan, %25'i meşru platform, %19'u agregatör.** Sayfa trafiği toplamlarında platform payı yüksek çıkıyor; bunun bir bölümü dizi sayfası değil genel katalog sayfalarından geliyor (ör. `tvplus.com.tr/dizi-izle`), toplamlar okunurken bu satırlar ayrıca değerlendirilebilir.

SERP verisi yenilemek için: `python3 scripts/dfs_serp.py` (sıralama + URL) → Ahrefs `batch-analysis` ile `data/serp/url_trafik.json` güncelle → `python3 scripts/serp_birlestir.py`.

## Excel çıktıları
```bash
python3 scripts/excel_rakip.py    # cikti/appletv-rakip-trafigi.xlsx
python3 scripts/excel_hacim.py    # cikti/appletv-arama-hacmi.xlsx
```
- **Rakip trafiği:** dizi bazında trafik · tüm SERP sonuçları (1.420 satır, tam URL) · domain özeti · sınıf özeti · yöntem.
- **Arama hacmi:** master liste (2.138 keyword) · dizi, kategori, tür, sayfa tipi, intent, varlık tipi, erişim, marka tipi küme sayfaları · dizi × sayfa tipi çapraz tablosu · kapsam dışı · yöntem.

Biçim Inbound Design System Excel rejimindedir (Bölüm 15.3): başlık `#434343` beyaz kalın, gövde Calibri + ink teal, dolgusuz sayısal sütun, satır başına ince üst kenarlık.

## Çalıştırma
```bash
python3 scripts/tur_konsolide.py data/raw/hacim_*.csv   # ham tür → 19 Türkçe tür
node scripts/build-data.js     # data/raw/hacim_*.csv → data/dashboard.js
PORT=3100 node server.js       # http://localhost:3100
```

Artifact (tek dosya HTML): `node scripts/build-artifact.js` — React/ReactDOM yerel kopyaları `.artifact/react.js` ve `.artifact/react-dom.js` gerekir (gitignore'da; TV+ deposundan kopyalanır).

Araştırma günlüğü: `data/arastirma/bulgular.md`. Gidişat: `appletv-claude.md`.

# TV+ · Apple TV Dizi Talep Haritası

Apple TV+ orijinal dizi kütüphanesinin Türkiye arama talebi: dizi bazında hacim, trend, izleme intent'i ve sayfa mimarisi kararı. "Spor Talep Haritası & Sayfa Mimarisi" (TV+, Ağustos 2026) ile aynı yapı ve tasarım; dikey dizi.

## Kapsam
- **211 Apple TV+ orijinal dizi** (Apple resmi basın listesi × Wikipedia tür/sezon/durum), devam eden ve bitmiş diziler dahil.
- **2.169 keyword**, 31 aylık seri (2024-01 → 2026-07), DataForSEO Türkiye. 6.595 gönderildi; popüler dizilerde kapsama ~%100, uzun kuyruk çocuk/belgesel yapımlarında sıfır.
- Aylık ort. **924K** arama · izleme intent'i **%42**.
- Rakip katmanı: dizibox, filmmakinesi, hdfilmcehennemi, Prime Video, Apple TV (Ahrefs organik, her domain ilk 400 kw). Apple TV+ dizi trafiğinin **%75'i korsan**.

## Hiyerarşi ve karar
Kategori (Drama) → Tür (Science fiction) → Dizi. Karar birimi **dizi**; eşikler dizi dağılımından türetildi (`data/arastirma/bulgular.md`).

## Çalıştırma
```bash
node scripts/build-data.js     # data/raw/hacim_diziler.csv → data/dashboard.js
PORT=3100 node server.js       # http://localhost:3100
```

Artifact (tek dosya HTML): `node scripts/build-artifact.js` — React/ReactDOM yerel kopyaları `.artifact/react.js` ve `.artifact/react-dom.js` gerekir (gitignore'da; TV+ deposundan kopyalanır).

Araştırma günlüğü: `data/arastirma/bulgular.md`. Gidişat: `appletv-claude.md`.

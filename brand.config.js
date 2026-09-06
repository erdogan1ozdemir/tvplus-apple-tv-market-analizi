// Marka yapılandırması. Arayüz metinleri buradan akar; dikeye özgü etiketler
// app.jsx / utils.js / tabs.jsx içinde elle çevrilir (bkz. skill: talep-haritasi-dashboard).
window.BRAND = {
  name: "TV+",
  title: "Apple TV Dizi Talep Haritası",
  subtitle: "Turkcell TV+ · Apple TV+ Orijinal Dizi Kütüphanesi · Türkiye",
  accent: "#FFC900",
  accentDeep: "#E5B400",
  dark: "#141414",
  slug: "appletv",
  logo: "assets/tvplus-logo.svg",
  agency: { name: "Inbound SEO", label: "Inbound", show: true },
  // Erişim faseti: bu dikeyde "yayın hakkı" yerine dizinin Türkiye'de nerede
  // meşru izlenebildiği. CSV'deki erisim kolonuyla birebir eşleşmeli.
  erisim: { alan: "erisim", var: "Meşru Görünür", yok: "Yalnız Korsan", dogrulanacak: "Doğrulanacak" },
};

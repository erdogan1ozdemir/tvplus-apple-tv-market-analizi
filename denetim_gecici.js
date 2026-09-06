/* Responsive denetimi. Tarayıcı konsolunda ya da javascript_tool ile yüklenir.
 *
 * İki hata sınıfı arar:
 *   1. taşma  — eleman kapsayıcısından dışarı çıkıyor
 *   2. sıkışma — eleman taşmıyor ama tek karakter genişliğine daralmış
 *
 * İkincisi önemli: başlığın ezilmesi taşma kontrolüne takılmaz, çünkü eleman
 * taşmıyor daralıyor. Yalnızca taşmaya bakan bir denetim bu hatayı kaçırır.
 *
 * Kullanım:
 *   window.__D()                      → bulunulan sekmeyi tara
 *   await window.__DTUM(['Özet',...]) → sekmeleri sırayla gez ve tara
 */
(function(){
  const gorunur = el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null;
  };
  const ad = el => el.tagName.toLowerCase() +
    (typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');

  window.__D = function(kapsam){
    const kok = document.documentElement;
    const out = { sayfa: Math.max(0, kok.scrollWidth - kok.clientWidth), tasma: [], sikisma: [] };
    const kok2 = document.querySelector(kapsam || '.content') || document.body;

    // 1200 elemanla sınırlı: büyük tablolarda tarayıcı kilitlenmesin
    [...kok2.querySelectorAll('*')].slice(0, 1200).forEach(el => {
      if (!gorunur(el) || el.closest('svg')) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;

      const p = el.parentElement;
      if (p) {
        const ps = getComputedStyle(p);
        // Kendi içinde kaydırılan kaplar taşma sayılmaz
        if (!/auto|scroll/.test(ps.overflowX + ps.overflow)) {
          const pr = p.getBoundingClientRect();
          if (pr.width) {
            const t = Math.round(Math.max(r.right - pr.right, pr.left - r.left));
            if (t > 6) out.tasma.push(ad(el) + ' >' + t + 'px in ' + ad(p));
          }
        }
      }

      const metin = (el.textContent || '').trim();
      if (!el.children.length && metin.length >= 10 &&
          r.height / Math.max(r.width, 1) > 2.2 && r.height > 70) {
        out.sikisma.push(ad(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) +
          ' "' + metin.slice(0, 24) + '"');
      }
    });

    out.tasma = [...new Set(out.tasma)].slice(0, 5);
    out.sikisma = [...new Set(out.sikisma)].slice(0, 5);
    out.temiz = out.sayfa <= 2 && !out.tasma.length && !out.sikisma.length;
    return out;
  };

  window.__DTUM = async function(sekmeAdlari){
    const sonuc = {};
    for (const n of sekmeAdlari) {
      const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.includes(n));
      if (!b) { sonuc[n] = 'sekme bulunamadı'; continue; }
      b.click();
      await new Promise(r => setTimeout(r, 450));
      const d = window.__D();
      if (!d.temiz) sonuc[n] = d;
    }
    return { genislik: window.innerWidth,
             sorun: Object.keys(sonuc).length ? sonuc : 'temiz' };
  };

  return 'denetim yüklendi · window.__D() ve window.__DTUM([...])';
})()

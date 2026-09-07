#!/usr/bin/env node
/**
 * sandbox_test.js — tarayıcı olmadan çalışma zamanı denetimi.
 *
 * Önizleme sunucusu başka bir proje köküne bağlıysa ya da artifact çapraz-origin
 * iframe'de açılıyorsa arayüz tıklanarak sınanamaz. Bu betik, kaynak dosyaların
 * bir VM sandbox'ında hatasız yüklendiğini ve sekmelerin export edildiğini
 * gösterir; "doğruladım" demeden önce çalıştırılacak asgari kontroldür.
 *
 * Kullanım: node scripts/sandbox_test.js
 */
const fs = require('fs');
const vm = require('vm');

const sb = { console };
sb.window = sb; sb.self = sb; sb.globalThis = sb;
sb.document = {
  createElement: () => ({ style:{}, setAttribute(){}, appendChild(){} }),
  documentElement: { style:{}, setAttribute(){}, classList:{ add(){}, remove(){} } },
  head: { appendChild(){} }, body: { appendChild(){}, style:{} },
  addEventListener(){}, removeEventListener(){},
  querySelector: () => null, querySelectorAll: () => [],
};
sb.navigator = { userAgent: 'node' };
sb.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
sb.addEventListener = () => {};
sb.matchMedia = () => ({ matches:false, addEventListener(){}, addListener(){} });
sb.setTimeout = setTimeout; sb.clearTimeout = clearTimeout;
vm.createContext(sb);

const dosyalar = ['.artifact/react.js', '.artifact/react-dom.js', 'brand.config.js',
                  'data/dashboard.js', 'utils.js', 'components.jsx', 'tabs.jsx'];

let hata = false;
for (const f of dosyalar) {
  if (!fs.existsSync(f)) { console.log('ATLA', f, '(yok)'); continue; }
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
    console.log('OK  ', f);
  } catch (e) {
    hata = true;
    console.log('HATA', f, '→', e.message);
    console.log('    ', (e.stack || '').split('\n')[1] || '');
    break;
  }
}

if (!hata) {
  const tabs = Object.keys(sb.TABS || {});
  const kw = (sb.DATA && sb.DATA.keywords || []).length;
  console.log(`\nSekme/export: ${tabs.length} · keyword: ${kw.toLocaleString('tr-TR')}`);
  const eksik = ['OzetTab','KeywordTab','KirilimTab','MasterTab'].filter(t => !tabs.includes(t));
  if (eksik.length) { console.log('EKSİK EXPORT:', eksik.join(', ')); process.exit(1); }
  console.log('Modül yüklemesi temiz.');
}
process.exit(hata ? 1 : 0);

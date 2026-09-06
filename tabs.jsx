// TV+ Apple TV Dizi Talep Haritası — sekmeler
window.TABS = (function(){
  const h = React.createElement;
  const C = window.C;
  const { fmtNum, fmtOrt, fmtFull, fmtPct, TR_MONTHS, ROLLING_LABELS, qLabel,
          groupBy, seriesFor, applyFacets, SEVIYELER, FACET_ETIKET,
          SEZ_RENK, HAK_RENK, aggregateRolling, aggregateMonthly,
          yoyFor, yoyEtiketFor, hacimFor, oncekiHacimFor,
          toCSV, downloadCSV, serialToRollingLabel } = U;
  const D = () => window.DATA;
  const SPOR_RENK = () => window.SPOR_RENK || {};

  const YoY = ({v, tip}) => h(C.YoYPill, {yoy:v, type:'YoY', tip});
  const topR12 = rows => rows.reduce((a,k)=>a+(k.r12||0),0);
  const topP12 = rows => rows.reduce((a,k)=>a+(k.p12||0),0);


  // Bir grubun üst kırılımdaki karşılığı: "Bilim Kurgu" -> "Drama / Bilim Kurgu"
  const UST_EKSEN = { org:'spor', st:'spor', ent:'spor', it:'st', mus:'spor',
                      sev:'spor', kulup:'org', cins:'spor', ktm:'ent',
                      takim:'org' };
  function ustDeger(g){
    const ust = UST_EKSEN[g.alan];
    if(!ust || !g.rows || !g.rows.length) return null;
    const say = {};
    for(const k of g.rows){ const v=k[ust]; if(v) say[v]=(say[v]||0)+(k.r12||0); }
    const sirali = Object.entries(say).sort((a,b)=>b[1]-a[1]);
    return sirali.length ? sirali[0][0] : null;
  }
  // Grup başlığına gelince ne içerdiğini anlatan metin
  function grupAciklama(g, viewMode){
    if(!g.rows || !g.rows.length) return g.label;
    const altEksen = g.alan==='spor' ? 'org' : g.alan==='org' ? 'st' : 'org';
    const say = {};
    for(const k of g.rows){ const v=k[altEksen]; if(v) say[v]=(say[v]||0)+(k.r12||0); }
    const ilk = Object.entries(say).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
    const toplamAlt = Object.keys(say).length;
    const ust = ustDeger(g);
    return [
      (ust ? ust + ' / ' : '') + g.label,
      `Son 12 Ay ort.: ${fmtFull(Math.round(g.r12/12))}/ay · Önceki 12 Ay ort.: ${fmtFull(Math.round(g.p12/12))}/ay` +
        (g.ryoy!=null ? ` · YoY ${fmtPct(g.ryoy,1)}` : ''),
      `${g.kwCount.toLocaleString('tr-TR')} keyword · toplam talebin %${(g.share*100).toFixed(1).replace('.',',')}'i`,
      `Peak: ${g.peakLabel} · ${qLabel(viewMode==='calendar'?g.peakQCal:g.peakQ, viewMode)} · ${g.sezType}`,
      ilk.length ? `İçerik (${FACET_ETIKET[altEksen]}, ${toplamAlt} adet): ` + ilk.join(', ') +
        (toplamAlt>ilk.length ? ' …' : '') : ''
    ].filter(Boolean).join('\n');
  }


  // Small multiples kartlarının alt metrik şeridi. Görünüm moduna göre değişir:
  // Takvim yılı  -> 2025 aylık ort., 2025 toplam, 2026 YTD aylık ort.
  // Rolling      -> Son 12 Ay aylık ort., Son 12 Ay toplam
  function kartMetrikleri(g, viewMode){
    const M = D().meta, yil = M.yillar;
    const ort = a => { const v=(a||[]).filter(x=>x!=null); return v.length ? Math.round(v.reduce((x,y)=>x+y,0)/v.length) : 0; };
    const top = a => (a||[]).reduce((x,y)=>x+(y||0),0);
    if(viewMode==='calendar'){
      const ay26 = (D().months2026||[]).length;
      return [
        {label:yil[0]+' Aylık Ort.', value:fmtNum(ort(g.cal24)), tip:fmtFull(ort(g.cal24))+' arama/ay'},
        {label:yil[1]+' Aylık Ort.', value:fmtNum(ort(g.cal25)), tip:fmtFull(ort(g.cal25))+' arama/ay'},
        {label:yil[2]+' YTD Ort.',   value:fmtNum(ort((g.cal26||[]).slice(0,ay26))),
          tip:fmtFull(ort((g.cal26||[]).slice(0,ay26)))+' arama/ay · ilk '+ay26+' ay'},
      ];
    }
    return [
      {label:'Önceki 12 Ay Ort.', value:fmtNum(ort(g.prev)), tip:fmtFull(ort(g.prev))+' arama/ay'},
      {label:'Son 12 Ay Ort.',    value:fmtNum(ort(g.roll)), tip:fmtFull(ort(g.roll))+' arama/ay'},
    ];
  }

  function Kaynak({not}){
    const M = D().meta;
    return h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.5}},
      'Kaynak: ', M.kaynak, ' · Takvim: ', M.aylar[0], ' – ', M.aylar[M.aylar.length-1],
      ' · Son 12 Ay: ', ROLLING_LABELS[0], ' – ', ROLLING_LABELS[11],
      not ? ' · '+not : '');
  }

  // ══════════════════════════════════════════ SEZONSALLIK MATRİSİ
  // Özdilek'teki "Kat 1 Sezon Takvimi" karşılığı: seviye seçimi, sıralama,
  // hücre içi YoY rozeti, kopyala + CSV.
  // Matris satirina tiklandiginda ayni sekmede bir alt kirilima inen ortak
  // davranis. Ozet ve Gruplar sekmelerinde zaten vardi; Sayfa Tipi ve Yayin
  // Hakki Disi sekmeleri sekme degistiriyordu, bu tutarsizligi kapatir.
  function inisKur(yol, setYol, setSecili){
    if(!yol || !setYol) return null;
    // Eksen matristen gelir: matrisin o anki kırılım ekseni neyse yol ona uzar
    return function(eksen, deger){
      if(!eksen || !deger) return;
      setYol(yol.concat({eksen, deger}));
      if(setSecili) setSecili(null);
    };
  }

  function SezonTakvimi({rows, viewMode, onSelectGroup, baslik, aciklama,
                          seviye:dSeviye, setSeviye:dSet, entFiltre:dEnt, setEntFiltre:dEntSet,
                          gruplarDis, eksenDis, onGrupDetay, inisModu}){
    const [iSeviye, iSet] = React.useState('spor');
    const [iEnt, iEntSet] = React.useState('');
    const seviye = dSeviye || iSeviye;
    const setSeviye = dSet || iSet;
    const entFiltre = dEnt !== undefined ? dEnt : iEnt;
    const setEntFiltre = dEntSet || iEntSet;
    const rowsF = entFiltre ? rows.filter(r=>r.ent===entFiltre) : rows;
    const [sirala, setSirala] = React.useState('hacim');
    // İniş modunda bir satıra tıklamak yolu uzatır ve matrisi bir alt eksene
    // taşır: kategoride Drama seçilince türler gelir. Eksen
    // dışarıdan yönetiliyorsa (Özet) ilerletmeyi orası yapar.
    const grupTikla = function(eks, deg){
      if(!onSelectGroup) return;
      onSelectGroup(eks, deg);
      if(inisModu && !dSet){
        const i = ZINCIR.indexOf(eks);
        if(i >= 0 && i + 1 < ZINCIR.length) iSet(ZINCIR[i + 1]);
      }
    };
    const gruplar = React.useMemo(()=>{
      // Özet'te kırılım yolu ekseni belirler; gruplar dışarıdan hazır gelir.
      let g = gruplarDis || groupBy(rowsF, seviye);
      if(sirala==='yoyUp')   g = [...g].sort((a,b)=>(b.ryoy??-9)-(a.ryoy??-9));
      else if(sirala==='yoyDown') g = [...g].sort((a,b)=>(a.ryoy??9)-(b.ryoy??9));
      else if(sirala==='az') g = [...g].sort((a,b)=>a.label.localeCompare(b.label,'tr'));
      return g;
      // false groupBy'ın içinde okunuyor; React göremediği için bağımlılığa
      // açıkça yazılmalı, yoksa bayrak değişince önbellekteki gruplar dönüyor.
    },[rowsF, seviye, sirala, gruplarDis]);

    const takvim = viewMode==='calendar';
    const etiketler = takvim ? TR_MONTHS : ROLLING_LABELS;
    const hmRows = gruplar.map(g=>({
      label: g.label,
      sub: (()=>{ const u=ustDeger(g);
        return (u && u!==g.label ? u+' · ' : '') + fmtOrt(takvim ? g.tot25 : g.r12); })(),
      title: grupAciklama(g, viewMode),
      values: takvim ? g.cal25 : g.roll,
      prevValues: takvim ? g.cal24 : g.prev,
      peakIdx: takvim ? g.peakIdxCal : g.peakIdx,
      _g: g,
    }));

    const csv = () => toCSV(gruplar, [
      {label: eksenDis ? (ZINCIR_ETIKET[eksenDis]||eksenDis) : (FACET_ETIKET[seviye]||seviye), key:'label'},
      ...CSV_HACIM,
      {label:'YoY %', get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
      {label:'Keyword', key:'kwCount'}, {label:'Pay %', get:r=>(r.share*100).toFixed(2)},
      {label:'Peak Ay', key:'peakLabel'}, {label:'Peak Çeyrek', get:r=>qLabel(viewMode==='calendar'?r.peakQCal:r.peakQ, viewMode)},
      {label:'Mevsim Tipi', key:'sezType'},
      ...etiketler.map((m,i)=>({label:m, get:r=>(takvim?r.cal25:r.roll)[i]}))
    ]);
    const kopyaMetin = () => [
      [eksenDis ? (ZINCIR_ETIKET[eksenDis]||eksenDis) : (FACET_ETIKET[seviye]||seviye),
       ...etiketler, 'Son 12 Ay', 'YoY%'].join('\t'),
      ...gruplar.map(g=>[g.label,
        ...(takvim?g.cal25:g.roll).map(v=>v||0), g.r12,
        g.ryoy==null?'':(g.ryoy*100).toFixed(1)].join('\t'))
    ].join('\n');

    return h('div',{className:'card'},
      h('div',{className:'card-title-row'},
        h('div',{style:{minWidth:0}},
          h('div',{className:'txt-3', style:{fontSize:11.5}},
            aciklama || (takvim
              ? `Takvim yılı görünümü · ${D().meta.yillar[1]} ayları, ${D().meta.yillar[0]} ile karşılaştırmalı`
              : `Rolling görünüm · Son 12 Ay (${ROLLING_LABELS[0]} – ${ROLLING_LABELS[11]}), Önceki 12 Ay ile karşılaştırmalı`))),
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginLeft:'auto'}},
          // Eksen tek yerden değişir: Kırılım satırı. Buradaki rozet yalnızca
          // hangi eksende olunduğunu söyler; iki yazıcı olduğunda başlık ile
          // seçici çelişebiliyordu.
          h('span',{className:'eksen-rozet',
            'data-tip':'Kırılım ekseni yukarıdaki Kırılım satırından değiştirilir'},
            (ZINCIR_ETIKET[eksenDis] || FACET_ETIKET[seviye] || seviye), ' kırılımı',
            h('span',{className:'badge', style:{marginLeft:6}}, gruplar.length)),
          h('div',{className:'segmented', title:'Varlık tipine göre daralt'},
            [['','Tümü'],['Dizi','Dizi'],['Sezon','Sezon'],['Bölüm','Bölüm']].map(function(e){
              return h('button',{key:e[0]||'all', className: entFiltre===e[0]?'active':'',
                onClick:()=>setEntFiltre(e[0])}, e[1]);
            })),
          h('div',{className:'segmented'},
            [['hacim','Hacim ↓'],['yoyUp','YoY ↑'],['yoyDown','YoY ↓'],['az','A–Z']].map(([v,l])=>
              h('button',{key:v, className: sirala===v?'active':'', onClick:()=>setSirala(v)}, l))),
          h(C.CopyButton, {getData:kopyaMetin, title:'Tabloyu kopyala'}),
          h('button',{className:'chip-btn', onClick:()=>downloadCSV(`tvplus-sezonsallik-${seviye}.csv`, csv())},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV'))),
      h('div',{className:'matrix-scroll'},
        h(C.Heatmap,{rows:hmRows, monthsLabels:etiketler, showValues:true, showYoY:true,
          showPeakDot:true,
          onClickCell:(row)=>grupTikla(seviye, row._g.ust),
          rowAction: onGrupDetay
            ? {ipucu:'Bu grubu Gruplar sekmesinde aç', simge:'→',
               onClick:(row)=>onGrupDetay(row._g.ust)}
            : null})),
      gruplar.length>12 && h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:6}},
        gruplar.length.toLocaleString('tr-TR')+' satır · tablo kendi içinde kaydırılabilir'),
      h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.5}},
        'Her hücrede üst: ilgili ayın arama hacmi, alt rozet: ',
        takvim ? 'önceki takvim yılının aynı ayına' : 'önceki 12 aylık dönemin aynı ayına',
        ' kıyasla YoY değişim. Renk: ',
        h('span',{style:{color:'var(--red)'}},'kırmızı (dip)'), ' · ',
        h('span',{style:{color:'var(--gold)'}},'sarı (orta)'), ' · ',
        h('span',{style:{color:'var(--green)'}},'yeşil (peak)'), '.'),
    );
  }

  // ══════════════════════════════════════════ GRUP DETAY TABLOSU
  function GrupTablosu({gruplar, seviye, onSelectGroup, onIn, inEtiket,
                        viewMode, limit=400}){
    const [sira, setSira] = React.useState({k:'r12', y:-1});
    const veri = React.useMemo(()=>{
      const s=[...gruplar];
      s.sort((a,b)=>{ const x=a[sira.k], y=b[sira.k];
        if(x==null) return 1; if(y==null) return -1;
        if(typeof x==='number'&&typeof y==='number') return (x-y)*sira.y;
        return String(x).localeCompare(String(y),'tr')*sira.y; });
      return s;
    },[gruplar, sira]);
    const th=(id,lab,cls)=>h('th',{key:id, className:cls||'', style:{cursor:'pointer'},
      onClick:()=>setSira(s=>({k:id, y:s.k===id?-s.y:-1}))},
      lab, sira.k===id?(sira.y===-1?' ↓':' ↑'):'');
    return h('div',{className:'tbl-wrap'},
      h('table',{className:'tbl tbl-kat-detay'},
        h('thead',null,h('tr',null,
          th('label', FACET_ETIKET[seviye]||'Grup'),
          th(viewMode==='calendar'?'tot24':'p12',
             (viewMode==='calendar' ? (D().meta.yillar[0]||'Önceki Yıl') : 'Önceki 12 Ay')+' Ort.','num col-hide-sm'),
          th(viewMode==='calendar'?'tot25':'r12',
             (viewMode==='calendar' ? (D().meta.yillar[1]||'Son Yıl') : 'Son 12 Ay')+' Ort.','num'),
          th(viewMode==='calendar'?'yoy':'ryoy','YoY','num'),
          h('th',{key:'tr', className:'col-hide-sm'},'12 Ay Trend'),
          th('kwCount','Keyword','num col-hide-sm'),
          th('share','Pay','num col-hide-sm'),
          th('peakQ','Peak Ç.','col-hide-sm'),
          th('peakLabel','En yüksek ay','col-hide-sm'),
          th('sezType','Mevsim Tipi','col-hide-sm'),
          onIn && h('th',{key:'ey', className:'col-eylem'},''))),
        h('tbody',null, veri.slice(0,limit).map((g,i)=>{
          const ust = ustDeger(g);
          // Satır tıklaması bir alt kırılıma iner; detay kartı ayrı düğmede
          const birincil = onIn ? ()=>onIn(g.ust) : (()=>onSelectGroup && onSelectGroup(seviye, g.ust));
          return h('tr',{key:g.label, className:'clickable',
            'data-tip': onIn ? (inEtiket||'Bir alt kırılıma in') : grupAciklama(g, viewMode),
            onClick:birincil},
            h('td',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('div',{style:{width:10,height:10,borderRadius:2,flexShrink:0,
                  background: (window.SPOR_RENK||{})[ust||g.ust] || 'var(--accent)'}}),
                h('div',{style:{minWidth:0}},
                  h('div',{className:'kw-cell'}, g.label),
                  ust && ust!==g.label && h('div',{className:'cat-cell'}, ust),
                  h('div',{className:'kw-mobile-meta'},
                    h('span',null, fmtOrt(g.r12), ' · ', g.peakLabel),
                    h('span',{className:'pill q'+(g.peakQ+1), style:{fontSize:10,padding:'1px 5px',marginLeft:6}},
                      qLabel(viewMode==='calendar'?g.peakQCal:g.peakQ, viewMode)))))),
            h('td',{className:'num col-hide-sm', title:fmtFull(oncekiHacimFor(g, viewMode))+' arama · dönem toplamı'},
              fmtOrt(oncekiHacimFor(g, viewMode))),
            h('td',{className:'num', title:fmtFull(hacimFor(g, viewMode))+' arama · dönem toplamı'},
              h('strong',null, fmtOrt(hacimFor(g, viewMode)))),
            h('td',{className:'num'}, h(YoY,{v:yoyFor(g, viewMode), tip:yoyEtiketFor(viewMode)})),
            h('td',{className:'col-hide-sm', style:{width:110}},
              h(C.Sparkline,{values: viewMode==='calendar'?g.cal25:g.roll, w:100, h:28,
                color: SEZ_RENK[g.sezType]||'var(--accent)'})),
            h('td',{className:'num col-hide-sm'}, g.kwCount.toLocaleString('tr-TR')),
            h('td',{className:'num col-hide-sm'}, (g.share*100).toFixed(1).replace('.',',')+'%'),
            h('td',{className:'col-hide-sm'},
              h('span',{className:'pill q'+(g.peakQ+1), title:'Son 12 ayın en yüksek hacimli çeyreği'},
                qLabel(viewMode==='calendar'?g.peakQCal:g.peakQ, viewMode))),
            h('td',{className:'col-hide-sm', style:{fontSize:13,color:'var(--ink-2)'}},
              g.peakLabel + ' · ' + fmtNum(Math.max(...g.roll))),
            h('td',{className:'col-hide-sm'},
              h('span',{style:{color:SEZ_RENK[g.sezType], fontWeight:600}}, g.sezType)),
            // Alt kırılım varken detay kartı satır sonundaki düğmeye taşınır
            onIn && h('td',{className:'col-eylem'},
              h('button',{className:'chip-btn sessiz tbl-eylem',
                'data-tip':'Detay kartını aç',
                onClick:(e)=>{ e.stopPropagation();
                  onSelectGroup && onSelectGroup(seviye, g.ust); }}, 'Detay')));
        }))));
  }

  // ══════════════════════════════════════════ ÖZET (Pazar Özeti)
  // Kırılım yolunun iz şeridi. Her adım tıklanabilir; o adıma dönülür.
  function IzSeridi({yol, setYol, eksen, kapsamHacim}){
    if(!yol.length && !eksen) return null;
    const adim = (etiket, i) => h('button',{key:i, className:'iz-adim',
      onClick:()=>setYol(yol.slice(0, i))}, etiket);
    return h('div',{className:'iz-seridi'},
      adim('Tüm portföy', 0),
      yol.map((a,i)=>h(React.Fragment,{key:'f'+i},
        h('span',{className:'iz-ayrac'},'›'),
        i===yol.length-1
          ? h('span',{className:'iz-adim aktif'}, a.deger)
          : adim(a.deger, i+1))),
      eksen && h('span',{className:'iz-eksen'},
        ZINCIR_ETIKET[eksen]+' kırılımı'),
      h('span',{className:'iz-hacim', 'data-tip':'Aylık ortalama arama hacmi'}, fmtOrt(kapsamHacim)),
      yol.length>0 && h('button',{className:'iz-geri',
        onClick:()=>setYol(yol.slice(0,-1)), 'data-tip':'Bir üst kırılıma dön'},'↑ Üst kırılım'));
  }

  function OzetTab({rows:tumRows, viewMode, setKeywordModal, onSelectGroup, onNavigateKw,
                    gitSekme, yol, setYol}){
    const M = D().meta;
    const takvim = viewMode==='calendar';
    const yilAd = D().meta.yillar;
    // Kırılım yolu: Özet'in tamamı seçili kapsamı gösterir. Yol boşken tüm veri.
    const izYolu = yol || [];
    const rows   = React.useMemo(()=>yoluUygula(tumRows, izYolu), [tumRows, izYolu]);
    const eksen  = React.useMemo(()=>aktifEksen(rows, izYolu), [rows, izYolu]);
    const kapsamAdi = izYolu.length ? izYolu[izYolu.length-1].deger : 'Tüm portföy';
    // Derin seviyelerde grup adı kategori olmadığından renk kapsamdan alınır
    const kapsamSpor = React.useMemo(()=>{
      const say = {};
      for(const k of rows) if(k.spor) say[k.spor] = (say[k.spor]||0) + (k.r12||0);
      const s = Object.entries(say).sort((a,b)=>b[1]-a[1]);
      return s.length ? s[0][0] : null;
    }, [rows]);
    const renkAl = g => SPOR_RENK()[g.spor || g.ust] || SPOR_RENK()[kapsamSpor] || '#BAB0AC';
    // Bir gruba tıklandığında yol bir adım uzar; yaprakta detay açılır
    // Kırılıma inerken sayfa başına atlanmaz: tıklanan bölüm sayfanın
    // ortasındaysa kullanıcı bağlamını kaybediyordu. İz şeridi zaten
    // hangi kapsamda olunduğunu gösteriyor.
    const in_ = (deger) => { if(!eksen) return;
      setYol([...izYolu, {eksen, deger}]); };
    const r12 = takvim ? aggregateMonthly(rows,'m25').reduce((a,b)=>a+b,0) : topR12(rows);
    const p12 = takvim ? aggregateMonthly(rows,'m24').reduce((a,b)=>a+b,0) : topP12(rows);
    const ryoy = p12>0 ? (r12-p12)/p12 : null;
    const roll = aggregateRolling(rows,'last'), prev = aggregateRolling(rows,'prev');
    const pIdx = roll.indexOf(Math.max(...roll));
    const yukselen = rows.filter(k=>k.trend==='Yükselen');
    const dusen    = rows.filter(k=>k.trend==='Düşen');
    const izleme   = rows.filter(k=>k.it==='İzleme');
    const veriSayfa= rows.filter(k=>['Konu','Oyuncular','Sezon Bilgi','Sezon Takvim'].includes(k.st));
    const kirilim  = React.useMemo(()=>eksen ? kirilimGruplari(rows, eksen) : [],
                                   [rows, eksen]);
    const {series, labels} = seriesFor({roll, prev, cal24:aggregateMonthly(rows,'m24'),
      cal25:aggregateMonthly(rows,'m25'), cal26:aggregateMonthly(rows,'m26')}, viewMode);

    // Çeyreklik peak dağılımı (stacked)
    const ceyrekDag = kirilim.slice(0,8).map(g=>{
      const q=U.quarterSums(g.roll), t=q.reduce((a,b)=>a+b,0)||1;
      return {label:g.label, q:q.map(v=>v/t)};
    });
    // Top listeler
    const enBuyuk = [...rows].sort((a,b)=>(b.r12||0)-(a.r12||0)).slice(0,10);
    const enArtan = rows.filter(k=>k.ryoy!=null && k.r12>=12000)
      .sort((a,b)=>b.ryoy-a.ryoy).slice(0,10);
    const enDusen = rows.filter(k=>k.ryoy!=null && k.r12>=12000)
      .sort((a,b)=>a.ryoy-b.ryoy).slice(0,10);

    const MiniListe = ({baslik, veri, sag, tone}) => h('div',{className:'card'},
      h('div',{className:'card-title-row'},
        h('h3',{style:{fontSize:14}}, baslik),
        sag && h('span',{className:'chip '+(tone||'neu'), style:{fontSize:10}}, sag)),
      h('div',{style:{display:'flex',flexDirection:'column'}},
        veri.map((k,i)=>h('button',{key:k.kw, className:'mini-row',
          onClick:()=>setKeywordModal(k),
          style:{display:'grid', gridTemplateColumns:'20px 1fr auto auto', gap:8,
            alignItems:'center', padding:'7px 4px', border:0, background:'none',
            borderTop: i?'1px solid var(--line-soft)':'none', cursor:'pointer',
            textAlign:'left', font:'inherit', color:'var(--ink)'}},
          h('span',{className:'txt-3', style:{fontSize:11}}, i+1),
          h('span',null, h('div',{style:{fontWeight:500, fontSize:12.5}}, k.kw),
            h('div',{className:'txt-3', style:{fontSize:10.5}}, (k.spor||'')+' · '+(k.org||''))),
          h('span',{className:'num', style:{fontSize:12, fontWeight:600}}, fmtOrt(k.r12)),
          h(YoY,{v:k.ryoy})))));

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu rapor ne anlatıyor?',
        sub:'veri kaynağı, dönem tanımı ve okuma notu', icon:'sinyal'},
        h('p',null,'Apple TV+ dizi talebi ', h('strong',null, M.toplamKeyword.toLocaleString('tr-TR')),
          ' keyword üzerinden ', h('strong',null, M.aylar.length+' aylık'), ' pencerede (',
          M.aylar[0],' – ',M.aylar[M.aylar.length-1],') haritalanmıştır.'),
        h('p',null, h('strong',null,'Son 12 Ay'),' = ',ROLLING_LABELS[0],' – ',ROLLING_LABELS[11],
          '. ', h('strong',null,'Önceki 12 Ay'),' = ', U.ymLabel(D().monthsP12[0]),' – ',
          U.ymLabel(D().monthsP12[11]),'. Tüm YoY karşılaştırmaları bu iki pencere arasındadır; ',
          'üstteki görünüm düğmesiyle takvim yılı karşılaştırmasına geçilebilir.'),
        h('p',null,'Rakip markalı sorgular (beIN, Mackolik, Sofascore ve benzeri) jenerik ' +
          'toplamdan çıkarılmıştır. TFF ve TJK gibi resmi kurumlar bilginin birinci çıkış ' +
          'noktası olduğundan jenerik kabul edilir.'),
        h('p',null, h('strong',null,'Okuma notu: '),
          'Bir dizinin talebi tek sayfaya sığmaz: izleme, konu, oyuncu ve sezon takvimi ayrı sayfa adaylarıdır. Bu pano her diziyi ' +
          'verilmektedir; bu ailede organik tıklama oranı düşük kalmaktadır. İzleme intent\'i ' +
          '("canlı izle", "nerede izlenir", "hangi kanalda") bileşen tarafından bastırılmamaktadır.')),

      // ——— Pazar Özeti hero ———
      h(C.SectionHeader,{icon:'ozet', title:'Pazar Özeti', accent:'coral',
        desc:'Apple TV+ dizi kütüphanesinin Son 12 Ay görünümü, Önceki 12 Ay ile karşılaştırmalı'}),
      h('div',{className:'hero-kpi'},
        h('div',{className:'hero-left'},
          h('div',{className:'hero-label'}, takvim ? ('Aylık Ort. Arama · '+yilAd[1]) : 'Aylık Ort. Arama · Son 12 Ay'),
          h('div',{className:'hero-value'}, fmtOrt(r12)),
          h('div',{className:'hero-sub'},
            h(YoY,{v:ryoy, tip:yoyEtiketFor(viewMode)}),
            h('span',{className:'txt-3', style:{marginLeft:8, fontSize:11.5}},
              takvim ? ('vs. '+yilAd[0]+' ort. ') : 'vs. Önceki 12 Ay ort. ', fmtOrt(p12)))),
        h('div',{className:'hero-chart'},
          h(C.LineChart,{series, height:150, labels, yFormat:fmtNum, legend:true, gradient:true})),
        h('div',{className:'hero-right'},
          h('div',{className:'hero-label'},'Peak Ay'),
          h('div',{className:'hero-peak'}, takvim ? U.TR_MONTHS[aggregateMonthly(rows,'m25')
            .indexOf(Math.max(...aggregateMonthly(rows,'m25')))]+' '+yilAd[1] : ROLLING_LABELS[pIdx]),
          h('div',{className:'txt-3', style:{fontSize:11}}, fmtFull(roll[pIdx]), ' arama'))),

      h('div',{className:'grid grid-kpi kpi-5', style:{marginTop:14}},
        h(C.Kpi,{label:'Keyword', value:rows.length.toLocaleString('tr-TR'),
          sub:M.toplamKeyword.toLocaleString('tr-TR')+' toplam içinden'}),
        h(C.Kpi,{label:'Yükselen', value:yukselen.length.toLocaleString('tr-TR'),
          sub:'YoY +%5 üzeri', chip:'↑', chipClass:'pos'}),
        h(C.Kpi,{label:'Düşen', value:dusen.length.toLocaleString('tr-TR'),
          sub:'YoY −%5 altı', chip:'↓', chipClass:'neg'}),
        h(C.Kpi,{label:'İZLEME INTENT\'İ', value:fmtOrt(topR12(izleme)),
          sub:izleme.length.toLocaleString('tr-TR')+' keyword · TV+\'ın doğal alanı', accent:true}),
        h(C.Kpi,{label:'VERİ SAYFASI TALEBİ', value:fmtOrt(topR12(veriSayfa)),
          sub:'Google bileşeni cevabı veriyor'})),

      // Kapsam eylemleri: seçili kırılım diğer sekmelerde de geçerli olduğu
      // için buradan geçiş yapıldığında kapsam taşınır, yeniden kurulmaz.
      h('div',{className:'kapsam-eylem'},
        h('span',{className:'kapsam-ad'},
          h('span',{className:'txt-3'},'Seçili kapsam'),
          h('strong',null, izYolu.length
            ? izYolu.map(a=>a.deger).join(' › ')
            : 'Tüm portföy')),
        h('span',{className:'kapsam-sayi'},
          h('strong',null, rows.length.toLocaleString('tr-TR')), ' keyword · ',
          h('strong',null, fmtOrt(r12)), ' aylık ort.'),
        h('button',{className:'chip-btn birincil',
          'data-tip':'Bu kapsamın keyword listesini aç',
          onClick:()=>gitSekme && gitSekme('keyword')},
          h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'liste', size:13})),
          'Keyword\'leri gör',
          h('span',{className:'btn-sayac'}, fmtNum(rows.length))),
        h('button',{className:'chip-btn',
          'data-tip':'Bu kapsamı dizi kümelerinde aç',
          onClick:()=>gitSekme && gitSekme('entity')},
          'Dizi & Sezon',
          h('span',{className:'btn-sayac'},
            fmtNum(rows.filter(k=>k.ent==='Dizi'||(k.ent==='Sezon'||k.ent==='Bölüm')).length))),
        h('button',{className:'chip-btn',
          'data-tip':'Bu kapsamı kırılım sekmesinde aç',
          onClick:()=>gitSekme && gitSekme('kirilim')}, 'Kırılım'),
        izYolu.length>0 && h('button',{className:'chip-btn sessiz',
          onClick:()=>setYol([])},
          h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'kapat', size:12})),
          'Kapsamı kaldır')),

      h('div',{className:'insight-bar'},
        h('span',{className:'insight-arrow'},''),
        h('span',null,'Aylık ortalama arama hacmi ', h('strong',null, fmtOrt(r12)),
          ' seviyesinde; önceki 12 aya kıyasla ',
          h('strong',{style:{color: ryoy>0?'var(--green)':'var(--red)'}}, fmtPct(ryoy,1)),
          ' değişim göstermiştir. ', h('strong',null, yukselen.length.toLocaleString('tr-TR')),
          ' keyword yükseliş eğiliminde; içerik yenileme fırsatı olarak değerlendirilebilir. ',
          'Peak dönem: ', h('strong',null, ROLLING_LABELS[pIdx]), '.')),

      // ——— Aylık ritim + pazar payı ———
      h(C.SectionHeader,{icon:'saat',
        title: eksen ? `${kapsamAdi} · Aylık Ritim & ${ZINCIR_ETIKET[eksen]} Dağılımı`
                     : `${kapsamAdi} · Aylık Ritim`,
        desc: eksen ? `12 aylık arama trendi ve ${kirilim.length} ${ZINCIR_ETIKET[eksen].toLowerCase()} arasındaki pay dağılımı`
                    : '12 aylık arama trendi'}),
      h('div',{className:'grid grid-main'},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},
              takvim ? 'Takvim Yılı Karşılaştırması' : 'Aylık Arama Hacmi · Son 12 Ay'),
            h('div',{className:'meta-sag'},
              h('div',null, takvim ? (yilAd[1]+' aylık ort.: ') : 'Son 12 Ay aylık ort.: ',
                h('strong',{style:{color:'var(--ink)'}}, fmtOrt(r12))),
              h('div',null, 'YoY: ',
                h('strong',{style:{color: ryoy>0?'var(--green)':'var(--red)'}}, fmtPct(ryoy,0)),
                ' · Peak: ', h('strong',{style:{color:'var(--ink)'}},
                  takvim ? U.TR_MONTHS[aggregateMonthly(rows,'m25')
                    .indexOf(Math.max(...aggregateMonthly(rows,'m25')))] : ROLLING_LABELS[pIdx])))),
          h('div',{className:'chart-orta'},
            h(C.LineChart,{series, height:250, labels, yFormat:fmtNum, legend:true}))),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}}, (ZINCIR_ETIKET[eksen]||'Grup')+' Pazar Payı'),
            h('div',{className:'meta-sag'}, takvim ? (yilAd[1]+' aylık ort.') : 'Son 12 Ay aylık ort.')),
          h('div',{className:'chart-orta', style:{marginBottom:12}},
            h(C.Donut,{size:190, data: kirilim.slice(0,9).map(g=>({
              label:g.label, value:hacimFor(g,viewMode), color:renkAl(g)})),
              onSliceClick: d => in_(d.label)})),
          h('div',{className:'pay-scroll'},
            // ShareBars tıklamayı satır nesnesinden değil onClickRow'dan alır;
            // satır içindeki onClick yok sayılıyordu, satırlar tıklanmıyordu.
            h(C.ShareBars,{onClickRow: eksen ? in_ : null,
              rows: kirilim.map(g=>({
                label:g.label, value:hacimFor(g,viewMode), share:g.share,
                yoy:yoyFor(g,viewMode),
                title:grupAciklama(g, viewMode), color:renkAl(g)}))})),
          h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:8}},
            kirilim.length+' '+(ZINCIR_ETIKET[eksen]||'grup').toLowerCase()+
            ' · satıra tıklayın, bir alt kırılıma iner'))),

      // ——— Sezonsallık matrisi ———
      h(C.SectionHeader,{icon:'takvim',
        title:`${kapsamAdi} · ${ZINCIR_ETIKET[eksen]||'Detay'} Ritmi`,
        desc: eksen
          ? `${kirilim.length} ${ZINCIR_ETIKET[eksen].toLowerCase()} · aylık arama ritmi ve karşılaştırmalı peak dağılımı`
          : 'bu kapsamda daha alt kırılım bulunmuyor',
        actions: h(C.InfoIcon,{title:'Sezonsallık matrisi nasıl okunur?'},
          h('p',null,'Her hücrede üstte ilgili ayın arama hacmi, altında önceki dönemin aynı ayına ' +
            'kıyasla YoY değişimi yer alır.'),
          h('p',null,'Renk skalası satır içindedir: kırmızı dip, sarı orta, yeşil peak. ' +
            'Nokta işareti satırın zirve ayını gösterir.'),
          h('p',null,'Seviye düğmeleriyle kırılım ekseni, sıralama düğmeleriyle satır sırası ' +
            'değiştirilebilir; varlık tipi düğmeleri matrisi dizi, sezon veya bölüm ' +
            'satırlarıyla sınırlar. Satıra tıklandığında o grubun detayı açılır.'))}),
      eksen && h(SezonTakvimi,{rows, viewMode, baslik:'Sezonsallık',
        gruplarDis: kirilim, eksenDis: eksen,
        onSelectGroup: (_a, deger) => in_(deger),
        onGrupDetay: deger => eksen==='takim'
          ? onNavigateKw({alan:'takim', deger})
          : onSelectGroup(eksen, deger)}),

      // ——— Karne (bağımsız ölçek) ———
      h(C.SectionHeader,{icon:'karne',
        title:`${kapsamAdi} · ${ZINCIR_ETIKET[eksen]||'Detay'} Karnesi`,
        desc: eksen
          ? `her ${ZINCIR_ETIKET[eksen].toLowerCase()} kendi ölçeğinde · karta tıklayın, bir alt kırılıma iner`
          : 'bu kapsamda daha alt kırılım bulunmuyor'}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{yScale:'independent',
          toplamEtiket: takvim ? yilAd[1] : 'Son 12 Ay',
          monthsLabels: takvim ? U.TR_MONTHS : ROLLING_LABELS,
          items: kirilim.slice(0,14).map(g=>({label:g.label, color:renkAl(g),
            values: takvim?g.cal25:g.roll, prevValues: takvim?g.cal24:g.prev,
            yoy: yoyFor(g,viewMode), title:grupAciklama(g, viewMode),
            metrics: kartMetrikleri(g, viewMode)})),
          onClick: it => in_(it.label)}),
        h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.6}},
          'Kart başlığındaki yüzde rozeti ', h('strong',null,'YoY değişimdir'),
          ' (Son 12 Ay / Önceki 12 Ay). Sağ alttaki değerler ', h('strong',null,'aylık ortalama arama hacmidir'),
          '. Çubukların üzerine gelindiğinde ilgili ayın hacmi ve önceki dönemin aynı ayına ',
          'kıyasla YoY değişimi görünür. Her kart kendi maksimumuna göre ölçeklenir; ',
          'bu nedenle kartlar arası çubuk yükseklikleri değil, hacim değerleri karşılaştırılabilir.')),

      // ——— YoY kazanan / kaybeden ———
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},'Kategori YoY · Kazanan & Kaybeden'),
            h('span',{className:'txt-3',style:{fontSize:10.5}},'Son 12 Ay / Önceki 12 Ay')),
          h(C.BarChart,{height:250, colorBy:'yoy', yFormat:v=>fmtPct(v,0),
            data: kirilim.filter(g=>yoyFor(g,viewMode)!=null).slice(0,12)
              .map(g=>({label:g.label, value:yoyFor(g,viewMode)})),
            onBarClick: d => in_(d.label)})),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},'Çeyreklik Peak Dağılımı'),
            h('span',{className:'txt-3',style:{fontSize:10.5}},'Son 12 Ay payları')),
          h('div',{style:{display:'flex',flexDirection:'column',gap:10, marginTop:6}},
            ceyrekDag.map(c=>h('div',{key:c.label},
              h('div',{style:{fontSize:12, fontWeight:600, marginBottom:4}}, c.label),
              h(C.QStack,{q1:c.q[0], q2:c.q[1], q3:c.q[2], q4:c.q[3]}))),
            h('div',{className:'legend', style:{marginTop:6}},
              ['Q1','Q2','Q3','Q4'].map((q,i)=>h('div',{key:q, className:'li'},
                h('div',{className:'swatch', style:{background:['#3B82F6','#EF4444','#F59E0B','#10B981'][i]}}),
                h('span',null,q))))))),

      // ——— Top listeler ———
      h(C.SectionHeader,{icon:'kupa', title:'Öne Çıkan Keyword\'ler',
        desc:'satıra tıklayın, keyword detayı açılır'}),
      h('div',{className:'grid grid-3'},
        h(MiniListe,{baslik:'Top 10 Hacim Lideri', veri:enBuyuk}),
        h(MiniListe,{baslik:'En Çok Büyüyen', veri:enArtan, sag:'↑ Kazanan', tone:'pos'}),
        h(MiniListe,{baslik:'En Çok Daralan', veri:enDusen, sag:'↓ Kaybeden', tone:'neg'})),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD TABLOSU
  function KeywordTablosu({rows, setKeywordModal, viewMode='rolling', sayfaBoyu=50, kompakt,
                            peakGizli, setPeakGizli}){
    const [sayfa, setSayfa] = React.useState(0);
    const [sira, setSira] = React.useState({k:'r12', d:-1});
    const [iPeak, iPeakSet] = React.useState(false);
    const gizli = peakGizli !== undefined ? peakGizli : iPeak;
    const setGizli = setPeakGizli || iPeakSet;
    React.useEffect(()=>setSayfa(0), [rows]);
    const M = D().meta, yil = M.yillar;
    const veri = React.useMemo(()=>{
      const a=[...rows];
      a.sort((x,y)=>{ const xv=x[sira.k], yv=y[sira.k];
        if(xv==null) return 1; if(yv==null) return -1;
        return (xv>yv?1:xv<yv?-1:0)*sira.d; });
      return a;
    },[rows, sira]);
    const sayfaSayisi = Math.max(1, Math.ceil(veri.length/sayfaBoyu));
    const dilim = veri.slice(sayfa*sayfaBoyu, (sayfa+1)*sayfaBoyu);
    const th=(lab,k,num,ipucu)=>h('th',{key:k, className:num?'num':'', title:ipucu,
      style:{cursor:'pointer', userSelect:'none'},
      onClick:()=>setSira(x=>({k, d: x.k===k ? -x.d : -1}))},
      lab, sira.k===k ? (sira.d>0?' ↑':' ↓') : '');

    return h('div',{className:'card flush'},
      h('div',{className:'tbl-ust'},
        h('span',{className:'txt-3', style:{fontSize:11}},
          'Hacimler aylık ortalamadır ve kısaltılmış gösterilir; hücrenin üzerine gelince tam değer görünür. CSV çıktısında tam değer yer alır. YoY sütunları takvim yılı karşılaştırmasıdır.'),
        h('button',{className:'chip-btn'+(gizli?'':' active'), style:{marginLeft:'auto'},
          onClick:()=>setGizli(g=>!g)},
          h('span',{className:'btn-ikon'}, h(C.Ikon,{ad: gizli?'goz':'gozKapali', size:13})),
          gizli ? 'Peak sütunlarını göster' : 'Peak sütunlarını gizle')),
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,
            th('Keyword','kw'),
            !kompakt && th('Kategori','spor'),
            !kompakt && th('Tür','org'),
            !kompakt && th('Dizi','takim', false, 'Her satır ait olduğu diziyi taşır'),
            !kompakt && th('Varlık','ent'),
            th(yil[0]+' Ort.','a24', true, yil[0]+' aylık ortalama arama hacmi'),
            th(yil[1]+' Ort.','a25', true, yil[1]+' aylık ortalama arama hacmi'),
            th(yil[0].slice(2)+'–'+yil[1].slice(2)+' YoY','yoy', true,
              yil[0]+' → '+yil[1]+' takvim yılı değişimi'),
            th(yil[2]+' YTD Ort.','a26', true,
              yil[2]+' ilk '+(D().months2026||[]).length+' ayın ortalaması'),
            th('YTD YoY','ytd', true, yil[2]+' YTD / '+yil[1]+' aynı dönem'),
            h('th',{key:'trend'},'Trend'),
            !gizli && h('th',{key:'pa'},'Peak Ay'),
            !gizli && h('th',{key:'pq'},'Peak Ç.'),
            !kompakt && th('Bucket','bucket'))),
          h('tbody',null,
            dilim.length===0 && h('tr',null,h('td',{colSpan:14, className:'empty'},'Sonuç bulunamadı')),
            dilim.map(function(r){
              const roll = U.rollingOf(r);
              const pi = roll.indexOf(Math.max(...roll));
              const pq = U.peakQuarterIdx(roll) + 1;
              return h('tr',{key:r.kw, className:'clickable', onClick:()=>setKeywordModal(r)},
                h('td',{className:'kw-cell', style:{maxWidth:230}}, r.kw),
                !kompakt && h('td',{style:{fontSize:12}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:5}},
                    h('div',{style:{width:7,height:7,borderRadius:2,flexShrink:0,
                      background:(window.SPOR_RENK||{})[r.spor]||'#BAB0AC'}}),
                    h('span',null, r.spor||'–'))),
                !kompakt && h('td',{style:{fontSize:12,color:'var(--ink-2)'}}, r.org||'–'),
                !kompakt && h('td',{style:{fontSize:12,color:'var(--ink-2)'}},
                  r.takim ? h('span',{className:'cat-pill'}, r.takim) : '–'),
                !kompakt && h('td',{style:{fontSize:12,color:'var(--ink-3)'}}, r.ent||'–'),
                h('td',{className:'num', title: r.a24==null?null:fmtFull(r.a24)+' arama/ay'},
                  fmtNum(r.a24)),
                h('td',{className:'num', title: r.a25==null?null:fmtFull(r.a25)+' arama/ay'},
                  fmtNum(r.a25)),
                h('td',{className:'num'}, h(YoY,{v:r.yoy, tip:yil[0]+' → '+yil[1]})),
                h('td',{className:'num', title: r.a26==null?null:fmtFull(r.a26)+' arama/ay'},
                  fmtNum(r.a26)),
                h('td',{className:'num'}, h(YoY,{v:r.ytd, tip:'YTD karşılaştırması'})),
                h('td',{style:{width:110}}, h(C.Sparkline,{values:roll, w:100, h:26,
                  color: SEZ_RENK[r.sinif]||'var(--accent)'})),
                !gizli && h('td',null, h('span',{className:'pill neu'}, ROLLING_LABELS[pi]||'–')),
                !gizli && h('td',null, h('span',{className:'pill q'+pq,
                  title:'Seçili pencerenin en yüksek hacimli çeyreği'}, qLabel(pq-1, viewMode))),
                !kompakt && h('td',null, h('span',{className:'cat-pill'}, r.bucket)));
            }))))
      ,
      sayfaSayisi>1 && h('div',{style:{display:'flex',justifyContent:'center',gap:8,padding:14,
        borderTop:'1px solid var(--line)'}},
        h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
          disabled:sayfa===0, onClick:()=>setSayfa(p=>Math.max(0,p-1))},'← Önceki'),
        h('span',{style:{padding:'6px 12px',fontSize:13,color:'var(--ink-2)'}},
          `Sayfa ${sayfa+1}/${sayfaSayisi} · ${veri.length.toLocaleString('tr-TR')} kayıt`),
        h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
          disabled:sayfa>=sayfaSayisi-1, onClick:()=>setSayfa(p=>Math.min(sayfaSayisi-1,p+1))},'Sonraki →')));
  }

  // CSV'de önce ekranda görünen değer (aylık ortalama), hemen yanında tam
  // dönem toplamı. Etiketler hangisinin ne olduğunu açıkça söyler; grafikle
  // CSV arasında sessiz bir fark kalmasın.
  const CSV_HACIM = [
    {label:'Önceki 12 Ay Aylık Ort.', get:r=>Math.round((r.p12||0)/12)},
    {label:'Son 12 Ay Aylık Ort.',    get:r=>Math.round((r.r12||0)/12)},
    {label:'Önceki 12 Ay Toplam',     key:'p12'},
    {label:'Son 12 Ay Toplam',        key:'r12'},
  ];

  const KW_CSV = [
    {label:'Keyword',key:'kw'},{label:'Kategori',key:'spor'},{label:'Tür',key:'org'},
    {label:'Sayfa Tipi',key:'st'},{label:'Intent',key:'it'},{label:'Varlık Tipi',key:'ent'},
    {label:'Dizi',key:'takim'},{label:'Meşru Erişim',key:'hak'},
    {label:'2024 Ort.',key:'a24'},{label:'2025 Ort.',key:'a25'},{label:'2026 YTD Ort.',key:'a26'},
    ...CSV_HACIM,
    {label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
    {label:'Takvim YoY %',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
    {label:'Mevsim Tipi',key:'sinif'},{label:'Bucket',key:'bucket'},{label:'Trend',key:'trend'},
    {label:'Peak Ay',get:r=>r.rpeakSerial?serialToRollingLabel(r.rpeakSerial):''},
  ];

  // ══════════════════════════════════════════ GRUPLAR
  function GruplarTab({rows, viewMode, secili, setSecili, setKeywordModal, onSelectGroup,
                        onNavigateKw, seviye, setSeviye, entFiltre, setEntFiltre,
                        peakGizli, setPeakGizli, yol, setYol}){
    const [altSeviye, setAltSeviye] = React.useState('');

    // Bir gruba tıklanınca sekme değiştirmek yerine aynı sekmede bir alt
    // kırılıma inilir: kategoride Drama seçilince türler,
    // orada bir tür seçilince diziler gelir. Yol tüm sekmelerde ortak
    // olduğu için iz şeridinden geri alınabilir.
    const zincirSira = ZINCIR.indexOf(seviye);
    const altEksen = zincirSira >= 0 && zincirSira + 1 < ZINCIR.length
      ? ZINCIR[zincirSira + 1] : null;
    const inAlt = altEksen ? function(deger){
      setYol(y => y.concat({eksen: seviye, deger}));
      setSeviye(altEksen); setSecili(null);
      window.scrollTo({top:0, behavior:'smooth'});
    } : null;
    // Varlık filtresi hem sezonsallık matrisini hem alttaki grup tablosunu daraltır
    const rowsF = entFiltre ? rows.filter(r=>r.ent===entFiltre) : rows;
    const gruplar = React.useMemo(()=>groupBy(rowsF, seviye, altSeviye||null),
      [rowsF, seviye, altSeviye]);
    const g = secili ? gruplar.find(x=>x.ust===secili.deger) : null;

    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:14}},
        h('div',{className:'filter-panel-label'}, h('strong',null,'Kırılım')),
        // 14 eksen düğmesi dar ekranda tek satıra sığmıyor ve sayfayı yatay
        // kaydırıyordu; bu seçici satır kırabilen bir varyant kullanır.
        h('div',{className:'segmented segmented-saran'},
          Object.entries(FACET_ETIKET).filter(([id])=>
            ['spor','org','takim','st','it','ent','hak','mus','sev','cins','cog','ktm','sinif','bucket'].includes(id)
          ).map(([id,lab])=>h('button',{key:id, className: seviye===id?'active':'',
            onClick:()=>{setSeviye(id); setSecili(null);}}, lab))),
        h('div',{style:{marginLeft:'auto', display:'flex', gap:6, alignItems:'center'}},
          h('span',{className:'txt-3', style:{fontSize:11}},'Alt kırılım'),
          h('select',{value:altSeviye, onChange:e=>setAltSeviye(e.target.value),
            style:{fontSize:12, padding:'5px 8px', borderRadius:8,
              border:'1px solid var(--line)', background:'var(--bg-card)', color:'var(--ink)'}},
            h('option',{value:''},'Yok'),
            Object.entries(FACET_ETIKET).filter(([id])=>id!==seviye &&
              ['spor','org','st','it','ent','hak','mus','cins','ktm'].includes(id))
              .map(([id,lab])=>h('option',{key:id, value:id}, lab))),
          h('button',{className:'chip-btn',
            onClick:()=>downloadCSV(`tvplus-${seviye}.csv`, toCSV(gruplar,[
              {label:FACET_ETIKET[seviye],key:'label'}, ...CSV_HACIM,
              {label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
              {label:'Keyword',key:'kwCount'},{label:'Pay %',get:r=>(r.share*100).toFixed(2)},
              {label:'Peak Ay',key:'peakLabel'},{label:'Peak Çeyrek',get:r=>qLabel(viewMode==='calendar'?r.peakQCal:r.peakQ, viewMode)},
              {label:'Mevsim Tipi',key:'sezType'}]))},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV'))),

      g && h('div',{className:'card drill-card', style:{marginBottom:16}},
        h('div',{className:'card-title-row'},
          h('div',null,
            (()=>{ const u=ustDeger(g); return u && u!==g.label
              ? h('div',{className:'txt-3', style:{fontSize:11.5, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'.06em'}}, u) : null; })(),
            h('h3',{style:{fontSize:18}}, g.label)),
          h(YoY,{v:yoyFor(g,viewMode), tip:yoyEtiketFor(viewMode)}),
          h('button',{className:'chip-btn sessiz', style:{marginLeft:'auto'},
            onClick:()=>setSecili(null)},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'kapat', size:12})), 'Kapat')),
        h('div',{className:'grid grid-kpi kpi-5', style:{margin:'12px 0'}},
          h(C.Kpi,{label: viewMode==='calendar' ? (D().meta.yillar[1]+' Toplam') : 'Son 12 Ay',
            value:fmtOrt(hacimFor(g,viewMode)), sub:g.kwCount+' keyword · aylık ort.', accent:true}),
          h(C.Kpi,{label: viewMode==='calendar' ? (D().meta.yillar[0]+' Toplam') : 'Önceki 12 Ay',
            value:fmtOrt(oncekiHacimFor(g,viewMode)),
            chip: yoyFor(g,viewMode)==null?null:fmtPct(yoyFor(g,viewMode),1),
            chipClass: (yoyFor(g,viewMode)||0)>0?'pos':'neg'}),
          h(C.Kpi,{label:'Pay', value:(g.share*100).toFixed(1).replace('.',',')+'%'}),
          h(C.Kpi,{label:'Peak', value:g.peakLabel, sub:qLabel(viewMode==='calendar'?g.peakQCal:g.peakQ, viewMode)}),
          h(C.Kpi,{label:'Mevsim Tipi', value:g.sezType, sub:`CV ${g.cv} · peak/dip ${g.pdRatio}`})),
        h(C.LineChart,{...(()=>{const s=seriesFor(g,viewMode); return {series:s.series, labels:s.labels};})(),
          height:220, yFormat:fmtNum, legend:true}),
        h('div',{style:{marginTop:14}},
          h('div',{className:'txt-3', style:{fontSize:11, marginBottom:6}},'En yüksek 10 keyword'),
          h(KeywordTablosu,{rows:g.rows.slice(0,10), setKeywordModal, viewMode, sayfaBoyu:10, kompakt:true})),
        h('button',{className:'chip-btn birincil', style:{marginTop:12},
          onClick:()=>onNavigateKw({alan:seviye, deger:g.ust})},
          'Bu grubun tüm keyword\'lerini gör',
          h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'okSag', size:13})))),

      h(SezonTakvimi,{rows, viewMode, baslik:'Sezonsallık',
        onSelectGroup: inAlt ? (_a, deger)=>inAlt(deger) : onSelectGroup,
        onGrupDetay: inAlt ? (deger)=>onSelectGroup(seviye, deger) : null,
        seviye, setSeviye:(v)=>{setSeviye(v); setSecili(null);},
        entFiltre, setEntFiltre:(v)=>{setEntFiltre(v); setSecili(null);},
        aciklama:`${FACET_ETIKET[seviye]} kırılımı · alttaki tablo ve grafikler aynı eksene bağlıdır`}),
      h(C.SectionHeader,{icon:'liste', title:'Grup Detayları',
        desc:`${FACET_ETIKET[seviye]} ekseninde ${gruplar.length.toLocaleString('tr-TR')} grup`
          + (entFiltre ? ` · yalnızca ${entFiltre} satırları` : '')
          + (altEksen ? ` · satıra tıklayın, ${FACET_ETIKET[altEksen]} kırılımına iner`
                      : ' · satıra tıklayın, detay kartı açılır')}),
      h(GrupTablosu,{gruplar, seviye, onSelectGroup, viewMode,
        onIn: inAlt,
        inEtiket: altEksen ? (FACET_ETIKET[altEksen]+' kırılımına in') : null}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD
  function KeywordTab({rows, viewMode, setKeywordModal, entFiltre, setEntFiltre,
                        peakGizli, setPeakGizli}){
    const [q, setQ] = React.useState('');
    const entHizli = entFiltre || '';
    const setEntHizli = setEntFiltre || (()=>{});
    const veri = React.useMemo(()=>{
      const qq=q.trim().toLowerCase();
      let r = entHizli ? rows.filter(x=>x.ent===entHizli) : rows;
      return qq ? r.filter(x=>x.kw.includes(qq)) : r;
    },[rows,q,entHizli]);

    const takvim = viewMode==='calendar';
    const son = veri.reduce((a,k)=>a+(takvim?(k.m25||[]).reduce((x,y)=>x+(y||0),0):(k.r12||0)),0);
    const onc = veri.reduce((a,k)=>a+(takvim?(k.m24||[]).reduce((x,y)=>x+(y||0),0):(k.p12||0)),0);
    const yoy = onc>0 ? (son-onc)/onc : null;
    const yuk = veri.filter(k=>(yoyFor(k,viewMode)||0)>0.05).length;
    const dus = veri.filter(k=>(yoyFor(k,viewMode)||0)<-0.05).length;
    return h('div',{className:'tab-content-anim'},
      h('div',{className:'toolbar'},
        h('input',{className:'input input-search', placeholder:'Keyword ara…', value:q,
          onChange:e=>setQ(e.target.value), style:{flex:1, minWidth:180}}),
        h('div',{className:'segmented segmented-saran', title:'Varlık tipine göre daralt'},
          [['','Tümü'],['Dizi','Dizi'],['Sezon','Sezon'],['Bölüm','Bölüm'],
           ['Bölüm','Bölüm']].map(function(e){
            return h('button',{key:e[0]||'all', className: entHizli===e[0]?'active':'',
              onClick:()=>setEntHizli(e[0])}, e[1],
              h('span',{className:'badge', style:{marginLeft:5}},
                fmtNum(e[0] ? rows.filter(r=>r.ent===e[0]).length : rows.length)));
          })),
        h('span',{className:'txt-3', style:{fontSize:13}}, fmtNum(veri.length)+' keyword'),
        h(C.CopyButton,{getData:()=>({
          headers:['Keyword','Kategori','Tür','Sayfa Tipi','Önceki 12 Ay','Son 12 Ay','YoY %','Bucket','Peak Ay'],
          rows: veri.map(r=>{ const roll=U.rollingOf(r);
            return [r.kw, r.spor||'', r.org||'', r.st||'', r.p12, r.r12,
              ((r.ryoy||0)*100).toFixed(2)+'%', r.bucket||'', ROLLING_LABELS[roll.indexOf(Math.max(...roll))]||'']; })
        })}),
        h('button',{className:'chip-btn',
          onClick:()=>downloadCSV('tvplus-keyword.csv', toCSV(veri, KW_CSV))},
          h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV')),
      h('div',{className:'grid grid-kpi kpi-4', style:{marginBottom:14}},
        h(C.Kpi,{label:'Filtrelenen KW', value:fmtNum(veri.length), accent:true,
          sub:`${D().meta.toplamKeyword.toLocaleString('tr-TR')} toplam içinden`}),
        h(C.Kpi,{label:'Aylık Ortalama', value:fmtNum(son/12),
          chip: yoy==null?null:fmtPct(yoy,1), chipClass: (yoy||0)>0?'pos':'neg',
          sub: (takvim ? (D().meta.yillar[1]+' aylık ort.') : 'Son 12 Ay aylık ort.')
               + ' · toplam '+fmtNum(son)}),
        h(C.Kpi,{label:'Yükselen', value:fmtNum(yuk), chip:'↑', chipClass:'pos', sub:'görünen içinde'}),
        h(C.Kpi,{label:'Düşen', value:fmtNum(dus), chip:'↓', chipClass:'neg', sub:'görünen içinde'})),
      h(KeywordTablosu,{rows:veri, setKeywordModal, viewMode, sayfaBoyu:50,
        peakGizli, setPeakGizli}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ TRENDLER & SEZONSALLIK
  function TrendlerTab({rows, viewMode, setKeywordModal, onSelectGroup}){
    const sezG = groupBy(rows,'sinif');
    const sporG = groupBy(rows,'spor');
    const peakDag = ROLLING_LABELS.map((l,i)=>({label:l,
      value: rows.reduce((a,k)=>a + (U.rollingOf(k)[i]||0), 0)}));
    const yuk = rows.filter(k=>k.ryoy!=null && k.r12>=12000).sort((a,b)=>b.ryoy-a.ryoy).slice(0,25);
    const dus = rows.filter(k=>k.ryoy!=null && k.r12>=12000).sort((a,b)=>a.ryoy-b.ryoy).slice(0,25);
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sezonsallık ve trend nasıl hesaplanıyor?', icon:'isi'},
        h('p',null,'Mevsim tipi, 2024 Ocak\u2019tan bu yana uzanan tüm aylık serinin ' +
          'değişkenlik katsayısı (CV) ve peak/dip ' +
          'oranıyla belirlenir: CV 0.35 altı ', h('strong',null,'Evergreen'), ', peak/dip ≥ 20 ' +
          'veya CV ≥ 1.0 ', h('strong',null,'Spike'), ', kalanlar ', h('strong',null,'Seasonal'),'.'),
        h('p',null,'Trend etiketi Son 12 Ay / Önceki 12 Ay karşılaştırmasından gelir: ' +
          '+%5 üzeri Yükselen, −%5 altı Düşen, arası Stabil.')),
      h('div',{className:'grid grid-kpi kpi-4'},
        sezG.map(s=>h(C.Kpi,{key:s.label, label:s.label, value:fmtOrt(s.r12),
          sub:`${s.kwCount.toLocaleString('tr-TR')} keyword · %${(s.share*100).toFixed(1)}`,
          chip: s.ryoy==null?null:fmtPct(s.ryoy,0),
          chipClass: s.ryoy==null?'neu':(s.ryoy>0?'pos':'neg')}))),
      h(C.SectionHeader,{icon:'takvim', title:'Aylık talep ritmi',
        desc:'Son 12 Ay · çubuğa gelin, o ayın arama hacmi görünür'}),
      h('div',{className:'card'}, h(C.BarChart,{data:peakDag, height:230, yFormat:fmtNum, colorBy:'flat'})),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'}, h('h3',{style:{fontSize:14}},'Kategori YoY')),
          h(C.BarChart,{height:250, colorBy:'yoy', yFormat:v=>fmtPct(v,0),
            data: sporG.filter(g=>g.ryoy!=null).slice(0,12).map(g=>({label:g.label, value:g.ryoy})),
            onBarClick: d=>onSelectGroup('spor', d.label)})),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'}, h('h3',{style:{fontSize:14}},'Mevsim tipi dağılımı')),
          h('div',{style:{display:'grid', placeItems:'center'}},
            h(C.Donut,{size:190, data: sezG.map(s=>({label:s.label, value:s.r12,
              color:SEZ_RENK[s.label]||'#BAB0AC'}))})))),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',null, h(C.SectionHeader,{icon:'trend', title:'Yükselen keyword\'ler',
          desc:'YoY artışı en yüksek · Son 12 Ay 12.000+'}),
          h(KeywordTablosu,{rows:yuk, setKeywordModal, viewMode, sayfaBoyu:25, kompakt:true})),
        h('div',null, h(C.SectionHeader,{icon:'trend', title:'Gerileyen keyword\'ler',
          desc:'YoY daralması en yüksek · Son 12 Ay 12.000+'}),
          h(KeywordTablosu,{rows:dus, setKeywordModal, viewMode, sayfaBoyu:25, kompakt:true}))),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ SAYFA TİPİ & INTENT
  function SayfaTipiTab({rows, viewMode, setKeywordModal, onSelectGroup, yol, setYol}){
    // Bir grup seçilince aynı sekmede yol uzar, sekme değişmez. Matris, karne
    // kartları ve grup tablosu aynı işleyiciyi paylaşır.
    const inAlt = inisKur(yol, setYol);
    const stG = groupBy(rows,'st'), itG = groupBy(rows,'it'), entG = groupBy(rows,'ent');
    const izleme = rows.filter(k=>k.it==='İzleme');
    const veri = rows.filter(k=>['Konu','Oyuncular','Sezon Bilgi','Sezon Takvim'].includes(k.st));
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sayfa tipi neden belirleyici?', icon:'hedef', defaultOpen:true},
        h('p',null,'Dizi talebinin yaklaşık yarısı izleme intent\'idir ("izle", "türkçe dublaj izle", "altyazılı izle"). ' +
          'Bu ailede SERP\'in büyük bölümü korsan sitelerdedir; meşru platform sıralanmadığında talep oraya akar.'),
        h('p',null,'Konu, oyuncu ve sezon takvimi sorguları bilgi katmanıdır; yayın hakkı gerektirmez ve dizi hub\'ının ' +
          'alt sayfalarını besler. Hakkı olan platform için izleme sayfası doğal üstünlük alanıdır.')),
      h('div',{className:'grid grid-kpi kpi-4'},
        h(C.Kpi,{label:'İZLEME INTENT\'İ', value:fmtOrt(topR12(izleme)), accent:true,
          sub:izleme.length.toLocaleString('tr-TR')+' keyword · bileşen bastırmıyor'}),
        h(C.Kpi,{label:'VERİ SAYFASI TALEBİ', value:fmtOrt(topR12(veri)), sub:'konu · oyuncu · sezon takvimi · aylık ort.'}),
        h(C.Kpi,{label:'NAVİGASYONEL', value:fmtOrt(topR12(rows.filter(k=>k.it==='Navigasyonel'))),
          sub:'çıplak varlık adı · hub sayfası ister'}),
        h(C.Kpi,{label:'SEZON & TAKVİM', value:fmtOrt(topR12(rows.filter(k=>k.it==='Sezon & Takvim'))),
          sub:'sezon takvimi sayfası cevaplar'})),
      h(SezonTakvimi,{rows, viewMode, baslik:'Sayfa tipi sezonsallığı',
        inisModu: !!inAlt, onSelectGroup: inAlt || onSelectGroup}),
      h(C.SectionHeader,{icon:'karne', title:'Sayfa tipi karnesi',
        desc:'her sayfa tipi kendi ölçeğinde · Son 12 Ay'}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{yScale:'independent', monthsLabels:ROLLING_LABELS,
          toplamEtiket:'Son 12 Ay',
          items: stG.slice(0,14).map(g=>({label:g.label,
            values: viewMode==='calendar'?g.cal25:g.roll,
            prevValues: viewMode==='calendar'?g.cal24:g.prev,
            yoy:yoyFor(g,viewMode), title:grupAciklama(g, viewMode),
            metrics: kartMetrikleri(g, viewMode)})),
          onClick: it=>(inAlt ? inAlt('st', it.label) : onSelectGroup('st', it.label))}),
        h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10}},
          'Sağ alttaki değerler aylık ortalama arama hacmidir.')),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'}, h('h3',{style:{fontSize:14, marginBottom:12}},'Intent katmanı'),
          h(C.ShareBars,{rows:itG.map(g=>({label:g.label, value:g.r12, share:g.share, yoy:g.ryoy, title:grupAciklama(g, viewMode)}))})),
        h('div',{className:'card'}, h('h3',{style:{fontSize:14, marginBottom:12}},'Varlık tipi'),
          h(C.ShareBars,{rows:entG.map(g=>({label:g.label, value:g.r12, share:g.share, yoy:g.ryoy, title:grupAciklama(g, viewMode)}))}))),
      h(C.SectionHeader,{icon:'izle', title:'İzleme intent\'i · en yüksek talep',
        actions: h('button',{className:'chip-btn',
          onClick:()=>downloadCSV('tvplus-izleme-intent.csv', toCSV(izleme, KW_CSV))},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV')}),
      h(KeywordTablosu,{rows:izleme, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ TAKIM & OYUNCU
  // Dizi kümesi: dizi adının kendi aramaları ile o dizinin sezon ve bölüm
  // aramaları tek çatı altında toplanır. Sayfa açma kararı bu toplama bakar.
  // Sorgu kuyrukları: "severance 2. sezon izle" gibi çok katmanlı ekler
  // tek geçişte inmiyordu, her biri ayrı küme oluyordu.
  // Takım kümesi anahtarı build-data.js'te üretilip k.takim alanında geliyor.
  // alan: 'takim' dizi kümesi
  // üyeliktir; sezon ve bölüm satırları dizinin kümesinde sayılır,
  // satır çoğaltılmadığı için toplam hacim iki kez sayılmaz.
  function takimKumeleri(rows, alan){
    alan = alan || 'takim';
    const m = new Map();
    for(const k of rows){
      const takim = k[alan] || null;
      if(!takim) continue;
      if(!m.has(takim)) m.set(takim, {label:takim, ust:takim, alan:alan,
        rows:[], takimRows:[], oyuncuRows:[], r12:0, p12:0, kwCount:0,
        org:k.org, spor:k.spor});
      const g = m.get(takim);
      g.rows.push(k); g.kwCount++;
      (k.ent==='Dizi' ? g.takimRows : g.oyuncuRows).push(k);
      g.r12 += k.r12||0; g.p12 += k.p12||0;
      if(!g.org && k.org) g.org = k.org;
      if(!g.spor && k.spor) g.spor = k.spor;
    }
    const toplamR12 = rows.reduce((a,k)=>a+(k.r12||0),0) || 1;
    return [...m.values()].map(g => {
      const z = U.zenginlestir(g, toplamR12);
      z.takimVol  = topR12(g.takimRows);
      z.oyuncuVol = topR12(g.oyuncuRows);
      z.takimKw   = g.takimRows.length;
      z.oyuncuKw  = g.oyuncuRows.length;
      return z;
    }).sort((a,b)=>b.r12-a.r12);
  }

  // ————————————————————————————————— Kırılım zinciri
  // Özet'te bir gruba tıklandığında tablolar bir alt eksene iner. Zincir
  // varsayılandır; Kırılım seçicisiyle elle başka eksene geçilebilir.
  const ZINCIR = ['spor','org','takim','st'];
  const ZINCIR_ETIKET = {spor:'Kategori', org:'Tür',
                         takim:'Dizi', st:'Sayfa Tipi'};
  const BOS_ESIK = 0.60;   // bu oranın üstünde boş kova varsa seviye atlanır

  function kirilimGruplari(rows, eksen){
    return (eksen==='takim' || eksen==='milli')
      ? takimKumeleri(rows, eksen) : groupBy(rows, eksen);
  }

  function eksenUygun(rows, eksen){
    const toplam = rows.reduce((a,k)=>a+(k.r12||0),0);
    const g = kirilimGruplari(rows, eksen);
    if(g.length < 2) return false;                    // tek grup bilgi taşımaz
    const kapsanan = g.reduce((a,x)=>a+(x.r12||0),0);
    return toplam===0 || (toplam-kapsanan)/toplam < BOS_ESIK;
  }

  // yol: [{eksen,deger}] → şu an kırılım yapılacak eksen (yoksa null = yaprak)
  function aktifEksen(rows, yol){
    const sonEksen = yol.length ? yol[yol.length-1].eksen : null;
    const baslangic = sonEksen ? ZINCIR.indexOf(sonEksen)+1 : 0;
    for(let i=Math.max(0,baslangic); i<ZINCIR.length; i++){
      if(eksenUygun(rows, ZINCIR[i])) return ZINCIR[i];
    }
    return null;
  }

  // Satırları kırılım yoluna göre daraltır
  function yoluUygula(rows, yol){
    let r = rows;
    for(const adim of (yol||[])){
      if(adim.eksen==='takim' || adim.eksen==='milli'){
        const k = takimKumeleri(r, adim.eksen).find(g=>g.label===adim.deger);
        r = k ? k.rows : [];
      } else {
        r = r.filter(k => k[adim.eksen] === adim.deger);
      }
    }
    return r;
  }

  function EntityTab({rows, viewMode, setKeywordModal, onSelectGroup, onNavigateKw,
                       entFiltre, setEntFiltre, peakGizli, setPeakGizli}){
    const [gorunum, setGorunum] = React.useState('kume');   // kume | liste
    const [kapsam, setKapsam] = React.useState('hepsi');    // hepsi | takim | oyuncu
    const varlik = rows.filter(k=>k.ent==='Dizi'||(k.ent==='Sezon'||k.ent==='Bölüm'));
    const kapsamli = kapsam==='takim' ? varlik.filter(k=>k.ent==='Dizi')
                   : kapsam==='oyuncu' ? varlik.filter(k=>(k.ent==='Sezon'||k.ent==='Bölüm')) : varlik;
    // Kapsam seçimi kümelere de yansır: yalnız dizi adı / yalnız sezon-bölüm seçilince
    // hacimler, chart'lar ve sezonsallık matrisi o kapsamla yeniden hesaplanır.
    const kumeler = React.useMemo(()=>takimKumeleri(kapsamli), [kapsamli]);
    // Dizi kümesi: dizi adı, sezon ve bölüm satırları tek çatıda toplanır.
    // KPI'lar da kapsam seçimine uyar
    const tkRows = kapsamli.filter(k=>k.ent==='Dizi');
    const oyRows = kapsamli.filter(k=>(k.ent==='Sezon'||k.ent==='Bölüm'));
    const tkTop = topR12(tkRows), oyTop = topR12(oyRows);

    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:14}},
        h('div',{className:'segmented'},
          [['kume','Dizi Kümesi'],['liste','Keyword Listesi']].map(function(g){
            return h('button',{key:g[0], className: gorunum===g[0]?'active':'',
              onClick:()=>setGorunum(g[0])}, g[1]);
          })),
        h('div',{className:'segmented', title:'Kümede hangi aramalar sayılsın'},
          [['hepsi','Dizi + Sezon/Bölüm'],['takim','Yalnız Dizi Adı'],['oyuncu','Yalnız Sezon/Bölüm']]
            .map(function(g){
              return h('button',{key:g[0], className: kapsam===g[0]?'active':'',
                onClick:()=>setKapsam(g[0])}, g[1]);
            })),
        h('div',{style:{marginLeft:'auto', fontSize:12.5}},
          h('strong',null, fmtOrt(topR12(kapsamli))), ' aylık ort. · ',
          h('strong',null, fmtNum(kapsamli.length)), ' keyword')),

      h('div',{className:'grid grid-kpi kpi-4'},
        h(C.Kpi,{label:'Dizi Kümesi', value:fmtNum(kumeler.length), accent:true,
          sub:'dizi adı + sezon/bölüm aramaları birlikte'}),
        h(C.Kpi,{label:'Dizi Adı Araması', value:fmtOrt(tkTop),
          sub:tkRows.length.toLocaleString('tr-TR')+' keyword'}),
        h(C.Kpi,{label:'Sezon/Bölüm Araması', value:fmtOrt(oyTop),
          sub:oyRows.length.toLocaleString('tr-TR')+' keyword'}),
        h(C.Kpi,{label:'Sezon/Bölüm Payı',
          value:'%'+(100*oyTop/((tkTop+oyTop)||1)).toFixed(1).replace('.',','),
          sub:'kümedeki sezon/bölüm katkısı'})),

      gorunum==='kume' ? h(React.Fragment,null,
        h(C.SectionHeader,{icon:'takvim', title:'Dizi Kümesi Sezonsallığı',
          desc:'satır = dizi kümesi, sütun = ay'}),
        h('div',{className:'card'},
          h('div',{className:'matrix-scroll'},
            h(C.Heatmap,{monthsLabels: viewMode==='calendar'?U.TR_MONTHS:ROLLING_LABELS,
              showValues:true, showYoY:true,
              rows: kumeler.slice(0,25).map(function(g){
                return {label:g.label,
                  sub:[g.spor, g.org, fmtOrt(g.r12)+'/ay'].filter(Boolean).join(' · '),
                  values: viewMode==='calendar'?g.cal25:g.roll,
                  prevValues: viewMode==='calendar'?g.cal24:g.prev,
                  peakIdx: viewMode==='calendar' ? g.peakIdxCal : g.peakIdx,
                  title:[g.label,'Dizi adı: '+fmtOrt(g.takimVol)+'/ay','Sezon/bölüm: '+fmtOrt(g.oyuncuVol)+'/ay',
                    'Toplam: '+fmtOrt(g.r12)+'/ay · 12 ay toplamı '+fmtFull(g.r12)].join('\n')};
              }),
              // Satıra tıklandığında o dizinin keyword'leri açılır:
              // dizi adı aramaları ve sezon/bölüm aramaları birlikte.
              onClickCell:(row)=>onNavigateKw({alan:'takim', deger:row.label})})),
          h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:8}},
            kumeler.length.toLocaleString('tr-TR')+' dizi kümesi · satıra tıklayın, o dizinin keywordleri açılır')),
        h(C.SectionHeader,{icon:'liste', title:'Dizi Kümesi Tablosu',
          desc:'dizi adı araması ve sezon/bölüm araması ayrı kolonlarda',
          actions: h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
            onClick:()=>downloadCSV('tvplus-takim-kumesi.csv', toCSV(kumeler,[
              {label:'Dizi',key:'label'},{label:'Tür',key:'org'},
              {label:'Kategori',key:'spor'},
              {label:'Dizi Adı Aylık Ort.', get:r=>Math.round((r.takimVol||0)/12)},
              {label:'Dizi KW',key:'takimKw'},
              {label:'Sezon/Bölüm Aylık Ort.', get:r=>Math.round((r.oyuncuVol||0)/12)},
              {label:'Sezon/Bölüm KW',key:'oyuncuKw'},
              {label:'Dizi Adı Toplam',key:'takimVol'},
              {label:'Sezon/Bölüm Toplam',key:'oyuncuVol'},
              ...CSV_HACIM,
              {label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
              {label:'Peak Ay',key:'peakLabel'}]))},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV')}),
        h('div',{className:'card flush'},
          h('div',{className:'tbl-wrap'},
            h('table',{className:'tbl'},
              h('thead',null,h('tr',null,
                h('th',null,'Dizi'), h('th',null,'Tür'),
                h('th',{className:'num'},'Dizi Adı Ort.'),
                h('th',{className:'num'},'Sezon/Bölüm Ort.'),
                h('th',{className:'num'},'Toplam Ort.'),
                h('th',{className:'num'},'Sezon/Bölüm Payı'),
                h('th',{className:'num'},'YoY'),
                h('th',null,'Trend'), h('th',null,'Peak Ay'))),
              h('tbody',null, kumeler.slice(0,200).map(function(g){
                const pay = g.r12 ? g.oyuncuVol/g.r12 : 0;
                return h('tr',{key:g.label, className:'clickable',
                  onClick:()=>onNavigateKw({alan:'takim', deger:g.label})},
                  h('td',{className:'kw-cell'},
                    h('div',{style:{display:'flex',alignItems:'center',gap:7}},
                      h('div',{style:{width:8,height:8,borderRadius:2,flexShrink:0,
                        background:(window.SPOR_RENK||{})[g.spor]||'#BAB0AC'}}),
                      h('div',{style:{minWidth:0}},
                        h('div',null, g.label,
                          g.spor && h('span',{className:'tag-spor',
                            style:{background:`color-mix(in srgb, ${(window.SPOR_RENK||{})[g.spor]||'#BAB0AC'} 18%, transparent)`,
                              color:(window.SPOR_RENK||{})[g.spor]||'var(--ink-2)'}}, g.spor)),
                        h('div',{className:'cat-cell'}, g.org||'')))),
                  h('td',{style:{fontSize:12,color:'var(--ink-2)'}}, g.org||'–'),
                  h('td',{className:'num', title:fmtFull(g.takimVol)+' arama · dönem toplamı'}, fmtOrt(g.takimVol),
                    h('span',{className:'txt-3', style:{fontSize:10, marginLeft:5}}, g.takimKw+' kw')),
                  h('td',{className:'num', title:fmtFull(g.oyuncuVol)+' arama · dönem toplamı'}, fmtOrt(g.oyuncuVol),
                    h('span',{className:'txt-3', style:{fontSize:10, marginLeft:5}}, g.oyuncuKw+' kw')),
                  h('td',{className:'num', title:fmtFull(g.r12)+' arama · dönem toplamı'},
                    h('strong',null, fmtOrt(g.r12))),
                  h('td',{className:'num'}, '%'+(pay*100).toFixed(1).replace('.',',')),
                  h('td',{className:'num'}, h(YoY,{v:g.ryoy})),
                  h('td',{style:{width:110}}, h(C.Sparkline,{values:g.roll, w:100, h:26})),
                  h('td',null, h('span',{className:'pill neu'}, g.peakLabel)));
              })))))
      ) : h(React.Fragment,null,
        h(C.SectionHeader,{icon:'liste', title:'Varlık Keyword Listesi',
          desc:'dizi, sezon ve bölüm keyword\'lerinin tamamı',
          actions: h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
            onClick:()=>downloadCSV('tvplus-varlik.csv', toCSV(kapsamli, KW_CSV))},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'indir', size:13})), 'CSV')}),
        h(KeywordTablosu,{rows:kapsamli, setKeywordModal, viewMode, sayfaBoyu:50,
          peakGizli, setPeakGizli})),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ RAKİP TRAFİĞİ
  // 145 dizinin "{dizi} izle" sorgusunda ilk 10 organik sonuç: tam sayfa URL'i,
  // pozisyon, domain sınıfı ve Ahrefs'in o sayfa için tahmini organik trafiği.
  const SINIF_RENK = {'Korsan':'#D32F2F','Meşru Platform':'#2E7D32','Agregatör / Bilgi':'#4E79A7'};

  function RakipTab({rows}){
    const serp = (D().serp)||[];
    const [sinifF, setSinifF]   = React.useState('');
    const [seciliKw, setSecili] = React.useState(null);
    const [sirala, setSirala]   = React.useState('hacim');

    if(!serp.length) return h('div',{className:'tab-content-anim'},
      h(C.EmptyState,{title:'SERP taraması yok',
        desc:'data/serp/serp.json üretilmemiş. scripts/serp_birlestir.py çalıştırılmalı.'}));

    const kapsam = new Set(rows.map(k=>k.takim).filter(Boolean));
    const veri = React.useMemo(()=>serp.filter(s=>
      (!kapsam.size || kapsam.has(s.dizi)) && (!sinifF || s.sinif===sinifF)),[serp, sinifF, rows]);

    const siniflar = ['Korsan','Meşru Platform','Agregatör / Bilgi'];
    // İlk 10'da görünme: kapsam eksiksiz olduğu için asıl gösterge budur
    const gorunme = siniflar.map(sn=>({sn, n:veri.filter(s=>s.sinif===sn).length}));
    const toplamG = gorunme.reduce((a,x)=>a+x.n,0) || 1;

    const domTablo = React.useMemo(()=>{
      const m={};
      for(const s of veri){
        const o = m[s.domain] || (m[s.domain]={dom:s.domain, sinif:s.sinif, n:0, ilk3:0,
                                              trafik:0, trafikli:0, diziler:new Set()});
        o.n++; if(s.pozisyon<=3) o.ilk3++;
        o.diziler.add(s.dizi);
        if(s.sayfa_trafik!=null){ o.trafik += s.sayfa_trafik; o.trafikli++; }
      }
      return Object.values(m).sort((a,b)=>b.n-a.n);
    },[veri]);

    const kwTablo = React.useMemo(()=>{
      const m={};
      for(const s of veri){
        const o = m[s.keyword] || (m[s.keyword]={kw:s.keyword, dizi:s.dizi, tur:s.tur,
                                                hacim:s.aylik_hacim, sat:[]});
        o.sat.push(s);
      }
      const l = Object.values(m);
      l.forEach(o=>{ o.sat.sort((a,b)=>a.pozisyon-b.pozisyon);
        o.pay = siniflar.map(sn=>({sn, n:o.sat.filter(x=>x.sinif===sn).length}));
        o.ilk3 = o.sat.filter(x=>x.pozisyon<=3).map(x=>x.sinif); });
      if(sirala==='hacim') l.sort((a,b)=>b.hacim-a.hacim);
      else if(sirala==='korsan') l.sort((a,b)=>
        (b.pay.find(p=>p.sn==='Korsan').n) - (a.pay.find(p=>p.sn==='Korsan').n));
      else l.sort((a,b)=>a.kw.localeCompare(b.kw,'tr'));
      return l;
    },[veri, sirala]);

    const secili = seciliKw ? kwTablo.find(k=>k.kw===seciliKw) : null;

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu talep hangi sayfalara gidiyor?', icon:'karar', defaultOpen:true},
        h('p',null,'145 dizinin ', h('b',null,'"{dizi adı} izle"'), ' sorgusunda ilk 10 organik sonuç tarandı. ',
          'Her satır tek bir sayfadır: domain değil, tam URL. Sayfa trafiği, Ahrefs\'in o URL için ',
          'verdiği tahmini aylık organik trafiktir; yalnızca bu sorgudan geleni değil, sayfanın tamamını kapsar.'),
        h('p',null,'Domainler üç sınıfa ayrılıyor: ',
          h('b',{style:{color:SINIF_RENK['Meşru Platform']}},'Meşru Platform'),' (Apple TV, Prime Video, Netflix, TV+), ',
          h('b',{style:{color:SINIF_RENK['Korsan']}},'Korsan'),' ve ',
          h('b',{style:{color:SINIF_RENK['Agregatör / Bilgi']}},'Agregatör / Bilgi'),
          ' (JustWatch, IMDb, Wikipedia).'),
        h('p',{className:'txt-3', style:{fontSize:11.5}},
          'Kapsam: 145 dizinin tamamı · 1.373 sonuç · 1.369 tekil sayfa. Sayfa trafiği ',
          h('b',null,'tüm sayfalar için'), ' ölçüldü; 0 değeri ölçüm eksikliği değil, ',
          'Ahrefs\'in o sayfaya organik trafik atfetmediği anlamına gelir. Bir sayfanın trafiği ',
          'yalnızca dizi sorgusundan gelmez: genel liste sayfaları (ör. platformların dizi ',
          'kataloğu) toplamda yüksek görünür, bu satırlar toplamlar okunurken ayrıca değerlendirilebilir.')),

      h('div',{className:'grid grid-kpi kpi-4', style:{marginBottom:16}},
        gorunme.map(g=>h(C.Kpi,{key:g.sn, label:g.sn.toLocaleUpperCase('tr-TR'), value:fmtNum(g.n),
          chip:'%'+Math.round(100*g.n/toplamG), chipClass:'neu',
          sub:'ilk 10\'da görünme', accent:g.sn==='Korsan'})),
        h(C.Kpi,{label:'TARANAN DİZİ', value:fmtNum(new Set(veri.map(s=>s.dizi)).size),
          sub:fmtNum(new Set(veri.map(s=>s.keyword)).size)+' sorgu · ilk 10'})),

      h('div',{className:'toolbar', style:{marginBottom:14}},
        h('div',{className:'segmented segmented-saran'},
          [['','Tüm sınıflar'], ...siniflar.map(s=>[s,s])].map(([v,l])=>
            h('button',{key:v||'all', className:sinifF===v?'active':'',
              onClick:()=>{setSinifF(v); setSecili(null);}}, l))),
        h('div',{className:'segmented', style:{marginLeft:'auto'}},
          [['hacim','Hacim ↓'],['korsan','Korsan yoğunluğu ↓'],['az','A–Z']].map(([v,l])=>
            h('button',{key:v, className:sirala===v?'active':'', onClick:()=>setSirala(v)}, l)))),

      h(C.SectionHeader,{icon:'liste', title:'Domain bazında görünürlük',
        desc:domTablo.length+' domain · ilk 10\'da kaç kez, kaçında ilk 3\'te'}),
      h('div',{className:'card flush', style:{marginBottom:18}},
        h('div',{className:'tbl-wrap'},
          h('table',{className:'tbl'},
            h('thead',null, h('tr',null,
              h('th',null,'Domain'), h('th',null,'Sınıf'),
              h('th',{className:'num'},'İlk 10\'da'), h('th',{className:'num'},'İlk 3\'te'),
              h('th',{className:'num col-hide-sm'},'DİZİ'),
              h('th',{className:'num'},'AHREFS SAYFA TRAFİĞİ'))),
            h('tbody',null, domTablo.slice(0,30).map(d=>h('tr',{key:d.dom},
              h('td',{className:'kw-cell'}, d.dom),
              h('td',null, h('span',{className:'pill', style:{
                background:`color-mix(in srgb, ${SINIF_RENK[d.sinif]} 15%, transparent)`,
                color:SINIF_RENK[d.sinif], fontWeight:600, whiteSpace:'nowrap'}}, d.sinif)),
              h('td',{className:'num'}, h('strong',null, fmtNum(d.n))),
              h('td',{className:'num'}, fmtNum(d.ilk3)),
              h('td',{className:'num col-hide-sm'}, fmtNum(d.diziler.size)),
              h('td',{className:'num'}, h('strong',null, fmtNum(d.trafik))))))))),

      h(C.SectionHeader,{icon:'liste', title:'Sorgu bazında ilk 10',
        desc:'satıra tıklayın, o sorgunun 10 sayfası tam URL ile açılır'}),
      h('div',{className:'card flush'},
        h('div',{className:'tbl-wrap'},
          h('table',{className:'tbl'},
            h('thead',null, h('tr',null,
              h('th',null,'Sorgu'), h('th',null,'Tür'),
              h('th',{className:'num'},'AYLIK HACİM'),
              h('th',null,'İlk 3'), h('th',null,'İlk 10 dağılımı'))),
            h('tbody',null, kwTablo.map(k=>h('tr',{key:k.kw,
              className:'clickable'+(seciliKw===k.kw?' secili':''),
              onClick:()=>setSecili(seciliKw===k.kw?null:k.kw)},
              h('td',{className:'kw-cell'}, k.kw),
              h('td',{className:'cat-cell'}, k.tur),
              h('td',{className:'num'}, fmtNum(k.hacim)),
              h('td',null, h('div',{style:{display:'flex',gap:3}},
                k.ilk3.map((sn,i)=>h('span',{key:i, title:sn,
                  style:{width:9,height:9,borderRadius:2,background:SINIF_RENK[sn]}})))),
              h('td',{style:{minWidth:140}},
                h('div',{style:{display:'flex',height:15,borderRadius:4,overflow:'hidden'}},
                  k.pay.filter(p=>p.n>0).map(p=>h('div',{key:p.sn,
                    title:p.sn+' · '+p.n+' sayfa',
                    style:{width:(100*p.n/k.sat.length)+'%', background:SINIF_RENK[p.sn]}})))))))))),

      secili && h(React.Fragment,null,
        h(C.SectionHeader,{icon:'liste', title:secili.kw+' · ilk 10 sayfa',
          desc:secili.dizi+' · '+fmtNum(secili.hacim)+'/ay',
          actions:h('button',{className:'chip-btn', onClick:()=>setSecili(null)},'Kapat')}),
        h('div',{className:'card flush'},
          h('div',{className:'tbl-wrap'},
            h('table',{className:'tbl'},
              h('thead',null, h('tr',null,
                h('th',{className:'num'},'Poz.'), h('th',null,'Sayfa'),
                h('th',null,'Sınıf'), h('th',{className:'num'},'AHREFS SAYFA TRAFİĞİ'))),
              h('tbody',null, secili.sat.map((s,i)=>h('tr',{key:i},
                h('td',{className:'num'}, s.pozisyon),
                h('td',{className:'kw-cell', style:{maxWidth:520}},
                  h('a',{href:s.url, target:'_blank', rel:'noopener noreferrer',
                    style:{color:'var(--ink)', textDecoration:'none'}},
                    h('div',{style:{fontWeight:600}}, s.domain),
                    h('div',{className:'cat-cell', style:{wordBreak:'break-all'}}, s.url))),
                h('td',null, h('span',{className:'pill', style:{
                  background:`color-mix(in srgb, ${SINIF_RENK[s.sinif]} 15%, transparent)`,
                  color:SINIF_RENK[s.sinif], fontWeight:600, whiteSpace:'nowrap'}}, s.sinif)),
                h('td',{className:'num'},
                  s.sayfa_trafik ? h('strong',null, fmtNum(s.sayfa_trafik))
                                 : h('span',{className:'txt-3'},'0'))))))))),

      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ MASTER LİSTE
  function MasterTab({rows, setKeywordModal, viewMode}){
    const M = D().meta;
    const KOL = [
      {label:'Keyword',key:'kw'}, ...CSV_HACIM,
      {label:'YoY % (rolling)',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
      {label:'YoY % (takvim)',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
      {label:'YTD YoY %',get:r=>r.ytd==null?'':(r.ytd*100).toFixed(1)},
      {label:'Kaynak Aylık Hacim (DfS)',key:'sv'},{label:'Bucket',key:'bucket'},{label:'Trend',key:'trend'},
      {label:'Mevsim Tipi',key:'sinif'},{label:'CV',key:'cv'},{label:'Peak/Dip',key:'pd'},
      {label:'Peak Ay',get:r=>r.rpeakSerial?serialToRollingLabel(r.rpeakSerial):''},
      {label:'Peak Çeyrek',get:r=>qLabel(((viewMode==='calendar'?r.pq:r.rpq)||[]).indexOf(1), viewMode)},
      ...Object.entries(FACET_ETIKET).filter(([id])=>
        ['spor','org','st','it','ent','hak','mus','sev','cins','km','tb','cog','yer',
         'turk','per','tak','kurum','dil','uzn','ktm','kulup'].includes(id))
        .map(([id,lab])=>({label:lab, key:id})),
      
      ...D().months2024.map((m,i)=>({label:m, get:r=>r.m24[i]})),
      ...D().months2025.map((m,i)=>({label:m, get:r=>r.m25[i]})),
      ...D().months2026.map((m,i)=>({label:m, get:r=>r.m26[i]})),
    ];
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Master liste', icon:'kutu', defaultOpen:true,
        sub:`${rows.length.toLocaleString('tr-TR')} satır · ${KOL.length} kolon`},
        h('p',null,'Filtrelenmiş liste; tüm faset öznitelikleri, üç ayrı YoY hesabı ' +
          '(rolling, takvim, YTD) ve ', h('strong',null, M.aylar.length+' aylık'),
          ' ham seriyle birlikte indirilebilir.'),
        h('p',null,'Kaynak: ', M.kaynak, '.')),
      h('div',{className:'filter-panel', style:{marginBottom:16}},
        h('div',{style:{fontSize:12.5}},
          h('strong',null, rows.length.toLocaleString('tr-TR')),' satır · ',
          h('strong',null, KOL.length),' kolon · ',
          h('strong',null, M.aylar.length),' aylık veri noktası'),
        h('button',{className:'chip-btn active', style:{marginLeft:'auto'},
          onClick:()=>downloadCSV(`appletv-dizi-master-${M.olusturma}.csv`, toCSV(rows, KOL))},
          '⬇ Master listeyi CSV indir')),
      h(C.SectionHeader,{icon:'liste', title:'Önizleme'}),
      h(KeywordTablosu,{rows, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD MODAL
  const MODAL_FASET_GRUP = [
    ['Sınıflandırma',            ['spor','org','st','it','ent']],
    ['Organizasyon Özellikleri', ['mus','sev','per','tak']],
    ['Kapsam',                   ['cins','km','tb','cog','yer','turk']],
    ['TV+ & Kaynak',             ['hak','kurum','ktm','kulup']],
    ['Veri Denetimi',            ['mden','anaAd','odog']],
    ['Sorgu Özellikleri',        ['dil','uzn','bucket','sinif','trend']],
  ];

  function KeywordModal({kw, viewMode, onClose}){
    const M = D().meta;
    // Modal kendi görünüm seçicisine sahiptir: detayda rolling ile takvim yılı
    // arasında geçiş yapmak için ana filtreyi değiştirmek gerekmesin.
    const [kip, setKip] = React.useState(viewMode || 'rolling');
    const takvim = kip==='calendar';
    const g = {roll:U.rollingOf(kw), prev:U.prevRollingOf(kw)||new Array(12).fill(0),
      cal24:kw.m24, cal25:kw.m25, cal26:kw.m26};
    const sr = seriesFor(g, kip);
    const t25 = (kw.m25||[]).reduce((a,b)=>a+(b||0),0);
    const t24 = (kw.m24||[]).reduce((a,b)=>a+(b||0),0);
    const yv = yoyFor(kw, kip);
    const mini = (lab, deger, alt, tone) => h('div',{className:'kpi-mini', key:lab},
      h('div',{className:'kpi-mini-label'}, lab),
      h('div',{className:'kpi-mini-value', style: tone?{color:tone}:null}, deger),
      alt ? h('div',{className:'kpi-mini-sub'}, alt) : null);

    return h(C.Modal,{onClose},
      h('div',{style:{marginBottom:12}},
        h('div',{className:'txt-3', style:{fontSize:10.5, textTransform:'uppercase',
          letterSpacing:'.07em', fontWeight:700}},
          [kw.spor, kw.org].filter(Boolean).join('  /  ')),
        h('h2',{style:{fontSize:20, margin:'3px 0 4px', lineHeight:1.2}}, kw.kw),
        h('div',{style:{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
          marginTop:6}},
          h('div',{className:'segmented', style:{fontSize:11}},
            h('button',{className: kip==='rolling'?'active':'',
              onClick:()=>setKip('rolling')},'Rolling 12 Ay'),
            h('button',{className: kip==='calendar'?'active':'',
              onClick:()=>setKip('calendar')},'Takvim Yılı')),
          h('div',{className:'txt-3', style:{fontSize:10.5}},
            takvim ? ('Takvim yılı görünümü · '+M.yillar.join(' / '))
                   : ('Son 12 Ay: '+ROLLING_LABELS[0]+' – '+ROLLING_LABELS[11]),
            ' · Kaynak: ', M.kaynak))),

      h('div',{className:'kpi-mini-row'},
        mini(takvim ? M.yillar[1] : 'Son 12 Ay', fmtFull(takvim ? t25 : kw.r12), kw.bucket),
        mini(takvim ? M.yillar[0] : 'Önceki 12 Ay', fmtFull(takvim ? t24 : kw.p12)),
        mini('YoY', yv==null?'–':fmtPct(yv,1), yoyEtiketFor(viewMode),
          yv==null?null:(yv>0?'var(--green)':'var(--red)')),
        (takvim
          ? mini(M.yillar[1]+' Aylık Ort.', fmtFull(kw.a25),
              M.yillar[1]+' toplamının 12 aya bölümü')
          : mini('Son 12 Ay Aylık Ort.', fmtFull(kw.r12!=null ? Math.round(kw.r12/12) : null),
              ROLLING_LABELS[0]+' – '+ROLLING_LABELS[11]+' ortalaması')),
        mini('Mevsim Tipi', kw.sinif, kw.cv!=null?('CV '+kw.cv+' · p/d '+kw.pd):null, SEZ_RENK[kw.sinif]),
        mini('Peak', kw.rpeakSerial ? serialToRollingLabel(kw.rpeakSerial) : '–',
          qLabel((takvim?kw.pq:kw.rpq||[]).indexOf(1), kip))),

      h('div',{className:'card', style:{padding:10, margin:'14px 0 10px'}},
        h(C.LineChart,{series:sr.series, labels:sr.labels, height:180, yFormat:fmtNum,
          legend:true, gradient:true})),
      // Takvim kipinde üç takvim yılı alt alta; her yıl bir önceki yılla
      // karşılaştırılır. Rolling kipinde son 12 ay ve önceki 12 ay.
      h(C.Heatmap,{rows: takvim
          ? [{label:String(M.yillar[0]), values:kw.m24||[]},
             {label:String(M.yillar[1]), values:kw.m25||[], prevValues:kw.m24||[]},
             {label:String(M.yillar[2]||'2026'), values:kw.m26||[], prevValues:kw.m25||[]}]
          : [{label:'Son 12 Ay',    values:g.roll, prevValues:g.prev},
             {label:'Önceki 12 Ay', values:g.prev}],
        monthsLabels: takvim?U.TR_MONTHS:ROLLING_LABELS, showValues:true, showYoY:true}),

      h('h4',{style:{fontSize:13, margin:'20px 0 10px'}},'Öznitelikler'),
      h('div',{className:'faset-tablo'},
        MODAL_FASET_GRUP.map(function(gr){
          const baslik = gr[0], alanlar = gr[1];
          return h('div',{key:baslik, className:'faset-grup'},
            h('div',{className:'faset-grup-baslik'}, baslik),
            h('dl',{className:'faset-liste'},
              alanlar.map(function(a){
                const v = kw[a];
                const bos = (v==null || v==='');
                return h(React.Fragment,{key:a},
                  h('dt',null, FACET_ETIKET[a]||a),
                  h('dd',{className: bos?'bos':''}, bos?'–':String(v)));
              })));
        })));
  }

  /* ═══════════════════════════════════════════════════════════════════
     KIRILIM SEKMESİ
     Hızlı bakma sekmesi: Kategori → Tür → Dizi zincirinde
     aşağı inilir, yalnızca büyüklük gösterilir (trend/sezonsallık yok).
     İki gösterim: karo şeridi (A) ve sütun kırılımı (B). Yol ve
     kontroller ikisinde ortaktır, gösterim değişince yer korunur.
     ═══════════════════════════════════════════════════════════════════ */
  const KIRILIM_SEVIYE = [['spor','Kategori'],['org','Tür'],['takim','Dizi']];
  const KIRILIM_ESIK = [0, 10000, 50000, 250000, 1e6, 5e6, 25e6];
  const KIRILIM_SINIR = 24;   // seviye başına ilk gösterilen karo sayısı

  // Üç seviyeli ağaç. Her düğümde hacim ve keyword sayısı
  // [tümü, yalnız dizi adı, yalnız sezon/bölüm] olarak tutulur.
  function kirilimAgaci(rows){
    const kok = new Map();
    const bos = ad => ({n:ad, v:[0,0,0], k:[0,0,0], c:new Map()});
    const ekle = (d,k) => {
      const i = k.ent==='Dizi' ? 1 : (k.ent==='Sezon'||k.ent==='Bölüm') ? 2 : -1;
      d.v[0]+=k.r12||0; d.k[0]++;
      if(i>0){ d.v[i]+=k.r12||0; d.k[i]++; }
    };
        for(const k of rows){
      const s=k.spor||'Diğer', o=k.org||'Belirsiz', t=k.takim||null;
      if(!kok.has(s)) kok.set(s, bos(s));
      const ds=kok.get(s); ekle(ds,k);
      if(!ds.c.has(o)) ds.c.set(o, bos(o));
      const dOrg=ds.c.get(o); ekle(dOrg,k);
      if(t){ if(!dOrg.c.has(t)) dOrg.c.set(t, bos(t)); ekle(dOrg.c.get(t), k); }
    }
    const diz = m => [...m.values()].map(d=>({n:d.n, v:d.v, k:d.k, c:diz(d.c)}));
    return diz(kok);
  }

  function KirilimTab({rows, onNavigateKw}){
    const [gorunum, setGorunum] = React.useState(function(){
      try { return localStorage.getItem('tvplus.kirilim.gorunum') || 'karo'; }
      catch(e){ return 'karo'; }
    });
    const [kapsam, setKapsam] = React.useState(0);
    const [sira, setSira]     = React.useState('v');
    const [q, setQ]           = React.useState('');
    const [esik, setEsik]     = React.useState(0);
    const [yol, setYol]       = React.useState([]);
    // Karo ızgarası aşağı doğru aktığı için uzun seviyeler bir sonraki
    // seviyeyi ekrandan itiyor; seviye başına açılıp kapanan bir sınır tutulur.
    const [acikSeviye, setAcikSeviye] = React.useState({});

    React.useEffect(function(){
      try { localStorage.setItem('tvplus.kirilim.gorunum', gorunum); } catch(e){}
    }, [gorunum]);

    const agac = React.useMemo(()=>kirilimAgaci(rows), [rows]);

    // Yol boyunca ilerleyip bulunulan seviyenin listesini döndürür
    const konum = React.useMemo(function(){
      let liste = agac;
      for(const ad of yol){
        const d = liste.find(x=>x.n===ad);
        if(!d){ return {liste:[], kirik:true}; }
        liste = d.c;
      }
      return {liste, kirik:false};
    }, [agac, yol]);

    // Filtre bir üst seviyeyi kopardıysa yolu kısalt
    React.useEffect(function(){
      if(konum.kirik && yol.length) setYol([]);
    }, [konum.kirik]);

    const cocuklar = React.useCallback(function(liste){
      const min = KIRILIM_ESIK[esik];
      let r = (liste||[]).filter(d=>d.v[kapsam]>0 && d.v[kapsam]>=min);
      if(q){
        const t = q.toLocaleLowerCase('tr');
        r = r.filter(d=>d.n.toLocaleLowerCase('tr').includes(t) ||
                        d.c.some(x=>x.n.toLocaleLowerCase('tr').includes(t)));
      }
      return r.slice().sort(function(a,b){
        if(sira==='n') return a.n.localeCompare(b.n,'tr');
        if(sira==='k') return b.k[kapsam]-a.k[kapsam];
        if(sira==='c') return b.c.length-a.c.length;
        return b.v[kapsam]-a.v[kapsam];
      });
    }, [kapsam, sira, q, esik]);

    React.useEffect(function(){ setAcikSeviye({}); }, [kapsam, sira, q, esik]);

    // Bir düğüme tıklandığında: alt kırılımı varsa in, yoksa keyword'lere git.
    // Zaten seçili olan düğüme tekrar tıklamak seçimi kaldırır ve o seviye
    // yeniden tüm kayıtlarıyla listelenir.
    function tikla(seviye, dugum){
      if(yol[seviye] === dugum.n){ setYol(yol.slice(0, seviye)); return; }
      if(seviye>=2 || !dugum.c.length){
        const alan = KIRILIM_SEVIYE[Math.min(seviye,2)][0];
        onNavigateKw({alan, deger:dugum.n});
        return;
      }
      setYol(yol.slice(0, seviye).concat(dugum.n));
    }

    const kapsamAd = ['tüm aramalar','takım araması','oyuncu araması'][kapsam];
    const gorunenler = cocuklar(konum.liste);
    const seviyeIdx  = Math.min(yol.length, 2);
    const toplamHacim = gorunenler.reduce((a,d)=>a+d.v[kapsam],0);
    const toplamKw    = gorunenler.reduce((a,d)=>a+d.k[kapsam],0);

    // ——— parça: pay çubuğu (takım / oyuncu) ———
    function PayCubugu({d}){
      const t=d.v[1]||0, o=d.v[2]||0, s=t+o;
      if(!s) return null;
      return h('span',{className:'kr-bar',
        'data-tip':'Dizi adı '+fmtOrt(t)+'/ay · sezon/bölüm '+fmtOrt(o)+'/ay'},
        h('i',{className:'t', style:{width:(100*t/s).toFixed(1)+'%'}}),
        h('i',{className:'o', style:{width:(100*o/s).toFixed(1)+'%'}}));
    }

    // ——— A · karo şeridi ———
    function karoGorunum(){
      const seritler = [];
      for(let lv=0; lv<=yol.length && lv<3; lv++){
        let liste = agac;
        for(let i=0;i<lv;i++){ const d=liste.find(x=>x.n===yol[i]); if(!d){ liste=[]; break; } liste=d.c; }
        const c = cocuklar(liste);
        if(!c.length){ if(lv===0) seritler.push(h('div',{key:'bos', className:'kr-bos'},
          'Bu kapsam ve eşikte gösterilecek kayıt bulunmuyor.')); break; }
        const secili = yol[lv]||null;
        const acik = !!acikSeviye[lv];
        // Bu seviyede bir seçim varsa yalnızca seçili kayıt gösterilir;
        // karta tekrar tıklamak ya da "Seçimi kaldır" listeyi geri getirir.
        const gosterilen = secili ? c.filter(x=>x.n===secili) : c;
        seritler.push(
          h('div',{key:lv, className:'kr-serit'+(secili?' daralmis':'')},
            h('div',{className:'kr-serit-bas'},
              h('span',{className:'kr-serit-ad'}, KIRILIM_SEVIYE[lv][1]),
              secili
                ? h('button',{className:'chip-btn sessiz kr-geri',
                    onClick:()=>setYol(yol.slice(0, lv))},
                    '✕ Seçimi kaldır · '+c.length.toLocaleString('tr-TR')+' kayıt')
                : h('span',{className:'kr-serit-sayi'},
                    c.length.toLocaleString('tr-TR')+' kayıt')),
            h('div',{className:'kr-izgara'},
              gosterilen.slice(0, acik ? gosterilen.length : KIRILIM_SINIR).map(function(d){
                const alt = d.c.length;
                return h('button',{key:d.n, className:'kr-karo'+(d.n===secili?' secili':''),
                  onClick:()=>tikla(lv,d),
                  'data-tip': alt ? 'Aç: '+alt+' '+KIRILIM_SEVIYE[lv+1][1].toLocaleLowerCase('tr')
                                  : 'Keyword listesine git'},
                  h('span',{className:'kr-karo-ad', title:d.n}, d.n),
                  h('span',{className:'kr-karo-hacim'}, fmtOrt(d.v[kapsam])),
                  h('span',{className:'kr-karo-alt'},
                    d.k[kapsam].toLocaleString('tr-TR')+' kw' +
                    (alt ? ' · '+alt+' '+(lv===0?'org':'takım') : '')),
                  h(PayCubugu,{d}));
              })),
            gosterilen.length > KIRILIM_SINIR && h('button',{className:'chip-btn sessiz kr-daha',
              onClick:()=>setAcikSeviye(o=>({...o, [lv]: !acik}))},
              acik ? '↑ İlk '+KIRILIM_SINIR+' kaydı göster'
                   : '↓ Kalan '+(gosterilen.length-KIRILIM_SINIR).toLocaleString('tr-TR')
                     +' kaydı göster')));
        if(!secili) break;
      }
      return seritler;
    }

    // ——— B · sütun kırılımı ———
    function sutunGorunum(){
      return h('div',{className:'kr-sutunlar'},
        KIRILIM_SEVIYE.map(function(sv, lv){
          let liste = agac, kopuk = false;
          for(let i=0;i<lv;i++){
            const d = liste.find(x=>x.n===yol[i]);
            if(!d){ kopuk = true; break; }
            liste = d.c;
          }
          const c = (!kopuk && lv<=yol.length) ? cocuklar(liste) : [];
          const sec = yol[lv]||null;
          const gost = sec ? c.filter(x=>x.n===sec) : c;
          return h('div',{key:sv[0], className:'kr-sutun'},
            h('div',{className:'kr-sutun-bas'},
              h('span',null, sv[1]),
              sec
                ? h('button',{className:'kr-sutun-geri', 'data-tip':'Seçimi kaldır',
                    onClick:()=>setYol(yol.slice(0, lv))},
                    '✕ '+c.length.toLocaleString('tr-TR'))
                : h('span',null, c.length ? c.length.toLocaleString('tr-TR') : '–')),
            h('div',{className:'kr-sutun-liste'},
              gost.length
                ? gost.map(d=>h('button',{key:d.n, className:'kr-sat'+(yol[lv]===d.n?' secili':''),
                    onClick:()=>tikla(lv,d),
                    'data-tip': d.k[kapsam].toLocaleString('tr-TR')+' keyword'},
                    h('span',{className:'kr-sat-ad', title:d.n}, d.n),
                    h('span',{className:'kr-sat-hacim'}, fmtOrt(d.v[kapsam]))))
                : h('div',{className:'kr-bos'},
                    lv>yol.length ? 'Soldaki sütundan seçin' : 'Bu kapsamda kayıt yok')));
        }));
    }

    return h('div',null,
      h(C.SectionHeader,{icon:'karne', title:'Kırılım',
        desc:'spor dalı, organizasyon ve takım zincirinde hızlı bakış · trend gösterilmiyor'}),

      h('div',{className:'card kr-kontrol'},
        h('div',{className:'kr-kontrol-satir'},
          // Etiket ve seçici birlikte sarmalanır ki satır kırılınca ayrı düşmesinler
          h('span',{className:'kr-grup'},
            h('span',{className:'kr-etiket'},'Gösterim'),
            h('div',{className:'segmented'},
              [['karo','Karo Izgarası'],['sutun','Sütun Kırılımı']].map(g=>
                h('button',{key:g[0], className: gorunum===g[0]?'active':'',
                  onClick:()=>setGorunum(g[0])}, g[1])))),

          h('span',{className:'kr-grup'},
            h('span',{className:'kr-etiket'},'Kapsam'),
            h('div',{className:'segmented'},
              ['Tümü','Yalnız Takım','Yalnız Oyuncu'].map((g,i)=>
                h('button',{key:g, className: kapsam===i?'active':'',
                  onClick:()=>setKapsam(i)}, g)))),

          h('span',{className:'kr-grup'},
            h('span',{className:'kr-etiket'},'Sırala'),
            h('div',{className:'segmented'},
              [['v','Hacim'],['k','Keyword'],['c','Alt kırılım'],['n','A-Z']].map(g=>
                h('button',{key:g[0], className: sira===g[0]?'active':'',
                  onClick:()=>setSira(g[0])}, g[1])))),

          h('label',{className:'ara-sarmal kr-ara'},
            h('span',{className:'ara-ikon'}, h(C.Ikon,{ad:'ara', size:13})),
            h('input',{className:'ara-alan', type:'search', value:q,
              placeholder:'Ara…', onChange:e=>setQ(e.target.value.trim())})),

          h('span',{className:'kr-grup kr-esik'},
            h('span',{className:'kr-etiket'},'Min hacim'),
            h('input',{type:'range', min:0, max:KIRILIM_ESIK.length-1, step:1, value:esik,
              onChange:e=>setEsik(+e.target.value)}),
            h('b',null, esik===0 ? 'yok' : fmtOrt(KIRILIM_ESIK[esik])+'/ay')),

          (yol.length>0 || q || esik>0 || kapsam>0) &&
            h('button',{className:'chip-btn sessiz',
              onClick:()=>{ setYol([]); setQ(''); setEsik(0); setKapsam(0); }},
              h('span',{className:'btn-ikon'},'✕'), 'Sıfırla')),

        h('div',{className:'kr-iz'},
          h('button',{className:'iz-adim', onClick:()=>setYol([])},'Tüm portföy'),
          yol.map((ad,i)=>h(React.Fragment,{key:i},
            h('span',{className:'iz-ayrac'},'›'),
            i===yol.length-1
              ? h('span',{className:'iz-adim aktif'}, ad)
              : h('button',{className:'iz-adim', onClick:()=>setYol(yol.slice(0,i+1))}, ad))),
          h('span',{className:'kr-iz-ozet'},
            h('strong',null, KIRILIM_SEVIYE[seviyeIdx][1]), ' · ',
            h('strong',null, gorunenler.length.toLocaleString('tr-TR')), ' kayıt · ',
            h('strong',null, fmtOrt(toplamHacim)), ' aylık ort. · ',
            h('strong',null, toplamKw.toLocaleString('tr-TR')), ' keyword',
            kapsam>0 && h('span',{className:'kr-iz-kapsam'}, ' (yalnız '+kapsamAd+')')),
          yol.length>0 && h('button',{className:'chip-btn sessiz kr-ust',
            onClick:()=>setYol(yol.slice(0,-1)), 'data-tip':'Bir üst kırılıma dön'},
            '↑ Üst kırılım'))),

      h('div',{className:'card kr-govde'},
        gorunum==='karo' ? karoGorunum() : sutunGorunum()),

      h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:8}},
        'Alt kırılımı olan bir kayda tıklandığında bir seviye aşağı inilir; ',
        'alt kırılımı olmayan kayıtta ve takım seviyesinde Keyword sekmesi açılır. ',
        'Bireysel sporlarda takım seviyesi bulunmadığı için zincir organizasyonda tamamlanır.'));
  }

  return { OzetTab, GruplarTab, KeywordTab, TrendlerTab, SayfaTipiTab, EntityTab,
           KirilimTab, RakipTab,
           MasterTab, KeywordModal,
           SezonTakvimi, GrupTablosu, KeywordTablosu,
           ZINCIR, ZINCIR_ETIKET, aktifEksen, yoluUygula, kirilimGruplari, takimKumeleri,
           IzSeridi };
})();

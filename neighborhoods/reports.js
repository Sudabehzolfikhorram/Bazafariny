(() => {
  'use strict';
  const $ = s=>document.querySelector(s), ic=U.ic, fa=U.fa, pick=$('#hood'), dlg=$('#detail');
  const nav=[['map','نقشه','map'],['summary','خلاصه','hood'],['housing','کالبد و مسکن','build'],['social','اجتماعی و اقتصادی','people'],['hazard','مخاطرات','warn'],['projects','پروژه‌ها','cal']];
  let key,layer,sections;
  const isK=()=>key==='kouhsar';
  const layerList=()=>isK()?koh.layers:dossier.layers;
  const sourceName=()=>isK()?'تصاویر پایش کوهسار':'آشنایی با محله سیروس';
  const icons=()=>document.querySelectorAll('[data-icon]').forEach(x=>x.innerHTML=ic(x.dataset.icon,'s'));
  const button=(label,attrs,icon='expand')=>`<button class="btn sm" ${attrs}>${ic(icon,'xs')}${label}</button>`;
  const rows=rs=>`<dl class="statrows">${rs.map(([t,v,u])=>`<div><dt>${t}</dt><dd>${fa(v)} <small>${u||''}</small></dd></div>`).join('')}</dl>`;
  const card=(title,body)=>`<article class="card box"><h3>${title}</h3>${body}</article>`;
  function crop(sheet,box,title){
    const s=sheets[sheet];return `<svg xmlns="http://www.w3.org/2000/svg" class="crop" role="img" aria-label="${title}" viewBox="${box.join(' ')}"><svg x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}" overflow="hidden"><image href="assets/${sheet}.webp" width="${s.size[0]}" height="${s.size[1]}"/></svg></svg>`;
  }
  function fig(id) {
    const [sheet,box,t]=koh.figures[id];
    return `<article class="card box figure"><header><h3>${t}</h3>${button('بزرگ‌نمایی',`data-figure="${id}"`)}</header><div class="fragment">${crop(sheet,box,t)}</div></article>`;
  }
  function referenceCard(title,id,body) {
    return `<article class="card box"><header><h3>${title}</h3>${button('مشاهده منبع',`data-figure="${id}"`,'file')}</header>${body}</article>`;
  }
  function hazardCards(){
    const exp=koh.ranges.map(([t,,v])=>[t,v,'٪']);
    return grid(referenceCard('مساحت حریم‌ها','risk',rows(koh.ranges.map(([t,v])=>[t,v,'هکتار']))),
      referenceCard('درصد مواجهه با مخاطرات','exposure',rows(exp)));
  }
  function section(id,body){
    const idx=sections.findIndex(s=>s[0]===id);
    return `<section id="sec-${id}" class="sec"><div class="sh"><span class="n">${fa(idx+1)}</span><h2>${sections[idx][1]}</h2></div>${body}</section>`;
  }
  function drawMap() {
    const opts=layerList(), l=opts.find(([id])=>id===layer);
    $('#map-options').innerHTML=opts.map(([id,t,i])=>`<button data-layer="${id}" aria-pressed="${id===layer}" class="${id===layer?'chosen':''}"><span class="layer-icon">${ic(i)}</span><span>${t}</span><i></i></button>`).join('');
    $('#map-img').innerHTML=mapImg();
    $('#map-caption').textContent=l[1]+' · '+(isK()?sheets[layer].title:layer==='sat'?'Esri World Imagery':'OpenStreetMap');
    $('#map-source').hidden=!isK();
  }
  function mapImg(){
    if(isK())return crop(layer,sheets[layer].map,'نقشه کوهسار؛ '+sheets[layer].title);
    return `<img class="sir-map" alt="نقشه سیروس؛ ${layer==='sat'?'تصویر ماهواره‌ای':'مرز و معابر'}" src="${layer==='sat'?'../sirous/data/sat_core.jpg':'assets/sirous.svg'}">`;
  }
  function map(){
    return section('map',`<article class="card atlasbox"><aside class="atlas-side"><div class="map-kicker">${ic('layers','s')} راهنمای نقشه</div><h3>نماهای محله</h3><div id="map-options"></div><div class="map-origin">${ic('file','s')}<span>منبع نقشه<b>${isK()?'برگه‌های پایش کوهسار':'لایه‌های نقشه سیروس'}</b></span></div></aside><div class="map-body"><div class="map-tools"><b>${ic('map','s')} نقشه محله <span>${isK()?'کوهسار':'سیروس'}</span></b>${button('بزرگ‌نمایی','data-mapzoom')}</div><div class="map-paper" id="map-img"></div><div class="caption"><span id="map-caption"></span><button id="map-source" data-source>تصویر کامل منبع</button></div></div></article>`);
  }
  function bars(){
    const list=isK()?koh.services:dossier.services, ref=isK()?'میانگین شهر':'استاندارد', max=Math.max(...list.flatMap(r=>r.slice(1)));
    return card('سرانه خدمات',`<div class="chart-key"><span><i></i>محله</span><span><i></i>${ref}</span><small>مترمربع به ازای هر نفر</small></div><div class="bars">${list.map(([t,a,b])=>`<div><b>${t}</b><div class="tracks">${[a,b].map((v,i)=>`<div aria-label="${i?ref:'محله'}: ${fa(v)}"><i class="bar${i}" style="width:${100*v/max}%"></i><em>${fa(v)}</em></div>`).join('')}</div></div>`).join('')}</div>`);
  }
  function metricsBox(rs){return rs.map(([t,v,u,i,g])=>`<article class="kp"><div class="kh"><span class="ic" style="background:${U.grad(g)}">${ic(i,'xs')}</span><span class="l">${t}</span></div><div class="v num">${fa(v)}<small>${u}</small></div></article>`).join('');}
  const grid=(...cells)=>'<div class="twocol">'+cells.join('')+'</div>';
  function textBlock(t,msg){return card(t,`<p class="desc">${msg}</p>`);}
  function content(){
    const k=isK();
    const overview=k?
      card('واحدهای ناپایدار و نوساز',rows([['واحدهای ناپایدار',25.6,'٪'],['واحدهای نوساز',18.3,'٪']])+'<p class="note">سهم‌های درج‌شده در سربرگ برگه کالبدی</p>'):
      card('محدوده محله',rows(S.edges.map(([d,n])=>[d,n,''])));
    const h=k?grid(card('شاخص‌های شورای عالی معماری و شهرسازی',rows(koh.council)),referenceCard('وضعیت پایداری مسکن','condition',rows(koh.condition)+'<p class="note">درصدهای راهنمای نمودار برگه کالبدی</p>'),fig('capacity'),fig('exit')):
      grid(card('بلوک‌های محله',rows(dossier.blocks)),card('بافت و ظرفیت نوسازی',rows([dossier.metrics[3],dossier.metrics[4],dossier.metrics[5]])));
    const social=k?grid(card('شاخص‌های اجتماعی',rows(koh.livelihood)),card('اولویت رویکرد مداخله',`<ol class="priorities">${koh.priorities.map((p,i)=>`<li><b>${fa(i+1)}</b>${p}</li>`).join('')}</ol>`),fig('income'),fig('other')):
      grid(card('جمعیت و خانوار',rows(dossier.metrics.slice(1,3))),textBlock('نشانه‌های محله',S.landmarks.join('، ')));
    return map()+section('summary',grid(bars(),overview))+section('housing',h)+section('social',social)+
      (k?section('hazard',hazardCards())+section('projects',grid(fig('actions'),fig('projects'))):'');
  }
  function read(){return new URLSearchParams(location.search).get('hood')==='sirous'?'sirous':'kouhsar';}
  function render(){
    key=read();layer=layerList()[0][0];pick.value=key;
    const n=isK()?'کوهسار':'سیروس';
    sections=isK()?nav:nav.slice(0,4);
    document.title='گزارش محله '+n+' · بازآفرینی‌یار'; $('#name').textContent='گزارش محله '+n;
    $('#metrics').innerHTML=metricsBox(isK()?koh.metrics:dossier.metrics);
    $('#sections').innerHTML=sections.map(([id,t,i],ix)=>`<button class="${ix?'':'on'}" data-section="${id}">${ic(i,'s')}${t}</button>`).join('');
    $('#content').innerHTML=content();drawMap();
    $('#foot').textContent='منبع گزارش: '+sourceName();
    $('main').scrollTop=0;
  }
  function open(title,body){
    $('#detail-title').textContent=title;$('#detail-body').innerHTML=body;dlg.showModal();
  }
  pick.addEventListener('change',()=>{const u=new URL(location.href);u.searchParams.set('hood',pick.value);u.hash='';history.pushState(null,'',u);render();});
  window.addEventListener('popstate',render);
  $('#print').onclick=()=>window.print();$('#close').onclick=()=>dlg.close();
  dlg.onclick=e=>{if(e.target===dlg)dlg.close();};
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.layer){layer=b.dataset.layer;drawMap();$('#map-options [aria-pressed="true"]').focus({preventScroll:true});}
    if(b.dataset.section)$('#sec-'+b.dataset.section).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    if(b.hasAttribute('data-mapzoom'))open('نقشه '+(isK()?'کوهسار':'سیروس')+' · '+layerList().find(l=>l[0]===layer)[1],mapImg());
    if(b.hasAttribute('data-source')&&isK())open(sheets[layer].title,`<img src="assets/${layer}.webp" alt="${sheets[layer].title}">`);
    if(b.dataset.figure){const [s,box,title]=koh.figures[b.dataset.figure];open(title,crop(s,box,title));}
  });
  let ticking=false;
  $('main').addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{
    const edge=$('#sections').getBoundingClientRect().bottom+28;
    const at=sections.filter(([id])=>$('#sec-'+id).getBoundingClientRect().top<=edge).at(-1)||sections[0];
    document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('on',b.dataset.section===at[0]));ticking=false;
  });},{passive:true});
  icons();render();
})();

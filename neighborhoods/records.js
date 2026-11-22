// Each crop is [source x, y, width, height] in pixels of the original attachment.
// Counts from the headline are not reconciled with differently scoped panels.
const sheets = {
  housing: {title:'پایش کالبد و مسکن', size:[1130,786], map:[306,149,427,243]},
  social: {title:'پایش سکونتگاه‌های غیررسمی', size:[1135,793], map:[305,153,429,239]},
  hazard: {title:'پایش مخاطرات طبیعی و انسان‌ساخت', size:[1129,785], map:[301,153,430,236]}
};
const koh = {
  metrics:[
    ['مساحت محله',125.5,'هکتار','area','teal'],['جمعیت',18650,'نفر','people','blue'],
    ['تعداد خانوار',5230,'خانوار','family','sky'],['واحدهای مسکونی',4870,'واحد','home','blue'],
    ['واحدهای ناپایدار',1250,'واحد','warn','orange'],['واحدهای نوساز',890,'واحد','build','green']],
  layers:[['housing','کالبد و مسکن','build'],['social','کاربری و خدمات','layers'],['hazard','مخاطرات','warn']],
  services:[['آموزشی',8.2,12.6],['فضای سبز',4.1,10.3],['فرهنگی',2.7,6.8],['ورزشی',3.5,8.9]],
  council:[['معابر زیر ۶ متر',32,'٪'],['ابنیه مخروبه و متروکه',8.7,'٪'],['ابنیه کم‌دوام',24.5,'٪']],
  condition:[['نوساز',23.3,'٪'],['استاندارد',38.7,'٪'],['کم‌دوام',24.5,'٪'],['مخروبه',13.5,'٪']],
  livelihood:[['سطح میانگین تحصیلات',8.2,'سال'],['خانوار زیر حداقل دستمزد',46.7,'٪'],['تراکم خانوار در واحد مسکونی',5.3,'نفر'],['تراکم ناخالص جمعیت',148,'نفر در هکتار']],
  priorities:['توانمندسازی اجتماعی و اقتصادی','بهسازی عملکردی','نوسازی و مقاوم‌سازی'],
  ranges:[['حریم گسل',35,26],['حریم رودخانه و مسیل',48,34],['ترانشه‌ها و ناپایداری شیب',27,21],['حریم خطوط انتقال نیرو',15,19]],
  figures:{
    condition:['housing',[9,504,289,252],'وضعیت پایداری مسکن'],
    capacity:['housing',[791,264,311,168],'وضعیت مسکن در محله'],
    exit:['housing',[793,601,313,176],'قابلیت خروج محله از محلات هدف'],
    income:['social',[4,555,290,209],'توزیع درآمد خانوارها و طبقات معیشتی'],
    other:['social',[4,312,286,127],'سایر شاخص‌های اجتماعی'],
    risk:['hazard',[3,127,289,261],'سطح و سهم حریم‌ها از مساحت محله'],
    exposure:['hazard',[3,435,292,329],'درصد مواجهه با مخاطرات'],
    actions:['housing',[300,582,442,177],'اقدامات در حال انجام'],
    projects:['social',[304,563,439,202],'اقدامات و پروژه‌های جاری بر اساس رویکردهای مداخله']
  }
};
// Explicit allowlist: the legacy page combines the Sirous dossier with sample templates.
// Do not use S.bench, templates, estimates, simulated parcels or sample intervention records here.
const dossier = {
  metrics: ['area','pop','hh','worn','unst','cap'].map(key=>{
    const k=S.kpi.find(r=>r.k===key); return [k.t,k.v,k.u,k.ic,k.g];}),
  blocks: S.kpi.filter(r=>r.k==='res'||r.k==='com').map(r=>[r.t,r.v,r.u]),
  services:S.percap.map(r=>[r.t,r.v,r.norm]),
  layers:[['streets','مرز و شبکه معابر','road'],['sat','تصویر ماهواره‌ای','sat']]
};

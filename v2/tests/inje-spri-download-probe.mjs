// Independent professor-only public SWSTAT endpoint discovery. No cookies, keys, or data writes.
const bases=[
 ['SWSTAT brief','https://stat.spri.kr/uportal/stat/comBriefStatPage/SPRI_3_1.do'],
 ['SWSTAT detail','https://stat.spri.kr/uportal/stat/comDetailStatPage.do'],
 ['SWSTAT dashboard','https://stat.spri.kr/uportal/main/indexPage.do'],
 ['SPRi SW production','https://www.spri.kr/posts/view/22268?code=stat_sw_productions']
];
for(const [label,url] of bases){
 try{
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),16000);
  let res;try{res=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,*/*'},redirect:'follow'});}finally{clearTimeout(timeout)}
  const content=await res.text();
  console.log('PAGE',JSON.stringify({label,status:res.status,type:res.headers.get('content-type'),bytes:content.length,finalOrigin:new URL(res.url).origin,hasCSV:/csv/i.test(content),hasJSON:/json/i.test(content),
    scripts:[...content.matchAll(/<script[^>]+src=['"]([^'"]+)['"]/gi)].map(x=>x[1]).filter(s=>/stat|excel|export|download|brief|common|grid|ui|com/i.test(s)).slice(0,20),
    endpointCandidates:[...new Set([...content.matchAll(/(?:['"])([^'"]{5,180}(?:down|export|excel|csv|json|file)[^'"]{0,90})(?:['"])/gi)].map(x=>x[1]))].filter(x=>/\.do|\/|\.json|\.csv/i.test(x)).slice(0,25),
    buttons:[...content.matchAll(/.{0,100}(?:CSV|JSON|XML|다운로드|전체받기).{0,160}/gi)].map(x=>x[0].replace(/<[^>]*>/g,' ')).slice(0,12)}));
 }catch(e){console.log('PAGE_ERROR',JSON.stringify({label,error:String(e?.message||e).slice(0,120)}));}
}

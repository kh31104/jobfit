// Official SPRi SWSTAT script inspection; read only, no credentials.
const items=[
 ['briefJS','https://stat.spri.kr/js/uportal/stat/comBriefStats.js?ver=28133'],
 ['detailJS','https://stat.spri.kr/js/uportal/stat/comDetailStatSch.js?ver=28133'],
 ['detailSearchJS','https://stat.spri.kr/js/uportal/stat/comDetailStatSchSearch.js?ver=28133'],
 ['briefPage','https://stat.spri.kr/uportal/stat/comBriefStatPage/SPRI_3_1.do']
];
for(const [label,url] of items){
 try{
  const a=new AbortController(),t=setTimeout(()=>a.abort(),18000);
  let r;try{r=await fetch(url,{signal:a.signal,headers:{'User-Agent':'Mozilla/5.0','Referer':'https://stat.spri.kr/uportal/stat/comBriefStatPage/SPRI_3_1.do'}})}finally{clearTimeout(t)}
  const raw=await r.text();
  const matches=[...raw.matchAll(/(?:CSV|JSON|XML|excel|down(?:load)?|export|fileSave|saveAs)[^\n]{0,160}/gi)].slice(0,60).map(x=>x[0].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,190));
  const endpoints=[...new Set([...raw.matchAll(/(?:["'])(\/[^"'<>]{5,110}\.(?:do|json|csv))(?:["'])/gi)].map(x=>x[1]))].filter(x=>/stat|down|export|sheet|excel|file/i.test(x));
  if(label==='briefJS'||label==='detailJS')for(const word of ['downStatListExcelFile','DownFile(type','comStatDtl.do','btnCSV','btnJson','DownFile("CSV")','down2Text({']){const idx=raw.indexOf(word);if(idx>=0)console.log('EXTRACT',JSON.stringify({label,word,snippet:raw.slice(Math.max(0,idx-300),idx+2400).slice(0,2650)}));}
  console.log('SOURCE',JSON.stringify({label,status:r.status,bytes:raw.length,possibleEndpoints:endpoints.slice(0,45),matches:matches.slice(0,42)}));
 }catch(e){console.log('SOURCE_ERROR',JSON.stringify({label,error:String(e?.message||e).slice(0,120)}));}
}

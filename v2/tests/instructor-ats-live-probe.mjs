// Teacher-only isolated GitHub Actions live probe. No Supabase keys, no student data, GET only.
import fs from 'node:fs';
const providers=[
  {name:'Ashby',boards:[
    ['Ramp','https://api.ashbyhq.com/posting-api/job-board/ramp'],
    ['Linear','https://api.ashbyhq.com/posting-api/job-board/linear']]},
  {name:'Greenhouse',boards:[
    ['Figma','https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true'],
    ['Stripe','https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true']]},
  {name:'Lever',boards:[
    ['Palantir','https://api.lever.co/v0/postings/palantir?mode=json&limit=80'],
    ['Lever Demo','https://api.lever.co/v0/postings/leverdemo?mode=json&limit=80']]}
];
const clip=(s,n=120)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:''}catch{return ''}};
const plain=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g,' ').replace(/\s+/g,' ').trim();
function mapRecord(provider,j){
  if(provider==='Ashby')return {
    title:clip(j.title),location:clip(j.location,80),type:clip(j.employmentType,50),
    department:clip(j.department,60),date:j.publishedAt||null,
    jd:plain(j.descriptionPlain||j.descriptionHtml),url:safeUrl(j.jobUrl),applyUrl:safeUrl(j.applyUrl),
    listed:j.isListed===true};
  if(provider==='Greenhouse')return{
    title:clip(j.title),location:clip(j.location?.name,80),type:clip(j.metadata?.find?.(m=>/employment|type|level/i.test(m.name||''))?.value??'',50),
    department:clip(j.departments?.[0]?.name,60),date:j.first_published||j.updated_at||null,
    jd:plain(j.content||''),url:safeUrl(j.absolute_url),applyUrl:'',
    listed:true};
  return {
    title:clip(j.text),location:clip(j.categories?.location,80),type:clip(j.categories?.commitment||j.categories?.level,50),
    department:clip(j.categories?.department||j.categories?.team,60),date:j.createdAt?new Date(j.createdAt).toISOString():null,
    jd:plain((j.descriptionPlain||'')+' '+(j.lists||[]).map(x=>plain(x.content)).join(' ')),url:safeUrl(j.hostedUrl),applyUrl:safeUrl(j.applyUrl),
    listed:true};
}
function evidence(row){
  const role=row.title+' '+row.type;
  const intern=/\bintern(?:ship)?\b|인턴/i.test(role);
  const entry=/\bnew[ -]?grad(?:uate)?\b|\bgraduate\b|\bentry[ -]?level\b|\bearly[ -]?career\b|\bjunior\b|신입/i.test(role);
  return {...row,jdLength:row.jd.length,hasJD:row.jd.length>=80,
    hasTasksText:/responsibilit|what you.ll do|duties|your role|업무|담당|you will/i.test(row.jd),
    hasRequirementsText:/qualifications|requirements|what you need|experience|자격|우대/i.test(row.jd),
    classification:intern?'intern_wording':entry?'entry_wording':'unconfirmed'};
}
async function retrieve(url){
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),24000);
  try{
    const rsp=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json','User-Agent':'JOBFIT-Professor-ATS-Evaluation/1.0'},redirect:'error'});
    if(!rsp.ok)throw Error('HTTP_'+rsp.status);
    const size=Number(rsp.headers.get('content-length')||0);
    if(size>20000000)throw Error('response_size_limit');
    const raw=await rsp.text();
    if(raw.length>20000000)throw Error('response_size_limit');
    const json=JSON.parse(raw);
    return {json,bytes:raw.length,status:rsp.status};
  }finally{clearTimeout(t);}
}
async function runOne(p){
  const errors=[];
  for(const [board,endpoint] of p.boards){
    try{
      const {json,bytes,status}=await retrieve(endpoint);
      const raw=p.name==='Lever'?json:json.jobs;
      if(!Array.isArray(raw))throw Error('unexpected_response_shape');
      const rows=raw.filter(x=>p.name!=='Ashby'||x.isListed===true)
        .map(j=>evidence(mapRecord(p.name,j)));
      if(rows.length<10)throw Error('fewer_than_10_public_postings:'+rows.length);
      const samples=rows.slice(0,10);
      const report={provider:p.name,board,endpoint,apiStatus:status,responseBytes:bytes,
        sourceRecordCount:raw.length,listedRecordCount:rows.length,
        checkedCount:samples.length,internWordingsInBoard:rows.filter(x=>x.classification==='intern_wording').length,
        entryWordingsInBoard:rows.filter(x=>x.classification==='entry_wording').length,
        samples:samples.map(({jd,...x})=>x),
        summary:{
          jd: samples.filter(x=>x.hasJD).length,
          url: samples.filter(x=>x.url).length,
          applyUrl:samples.filter(x=>x.applyUrl).length,
          explicitIntern:samples.filter(x=>x.classification==='intern_wording').length,
          possibleEntry:samples.filter(x=>x.classification==='entry_wording').length,
          tasksTextCue:samples.filter(x=>x.hasTasksText).length,
          requirementsTextCue:samples.filter(x=>x.hasRequirementsText).length
        }};
      return {report,errors};
    }catch(e){errors.push({board,error:clip(e?.message||e,150)});}
  }
  return {report:{provider:p.name,error:'all_test_boards_failed',attempts:errors},errors};
}
const results=[];
for(const p of providers)results.push(await runOne(p));
const report={runAt:new Date().toISOString(),testType:'live-unauthed-GET-no-user-data',
 method:'API order first 10 listed postings per provider; title/type keyword counts are heuristic not confirmation',
 providerReports:results.map(x=>x.report)};
fs.mkdirSync('ats-probe-output',{recursive:true});
fs.writeFileSync('ats-probe-output/live-api-results.json',JSON.stringify(report,null,2)+'\n');
console.log('=== PUBLIC ATS LIVE PROBE SUMMARY ===');
for(const item of report.providerReports){
  console.log(JSON.stringify(item));
}
const failures=report.providerReports.filter(x=>x.checkedCount!==10);
console.log('=== FINISHED ===',JSON.stringify({providers:report.providerReports.length,
 success:report.providerReports.length-failures.length,failed:failures.map(x=>x.provider)}));
if(failures.length)process.exitCode=1;

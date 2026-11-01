// GitHub Pages deployment integrity check.
// Compare deployed bytes with the checked-out commit instead of hard-coded
// bootstrap/app version strings. This avoids false failures on version bumps.
// Read-only: no student data or application state is modified.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const paths=[
  'index.html',
  'v2/index.html',
  'v2/bootstrap.js',
  'v2/app.js',
  'v2/steps/step5.js',
  'v2/steps/step6IndustryCompany.js',
  'v2/steps/step7Tables.js',
  'v2/steps/industryAiParser.js'
];
const repoRoot=new URL('../../',import.meta.url);
const base=(process.env.JOBFIT_VERIFY_BASE||'https://kh31104.github.io/jobfit/').replace(/\/+$/,'')+'/';
const attempts=Math.max(1,Number(process.env.JOBFIT_VERIFY_ATTEMPTS)||30);
const intervalMs=Math.max(0,Number(process.env.JOBFIT_VERIFY_INTERVAL_MS)||10000);
const sha=process.env.GITHUB_SHA||'local-commit';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
const expected=paths.map(path=>{
  const bytes=readFileSync(new URL('../../'+path,import.meta.url));
  return {path,bytes,hash:digest(bytes)};
});

async function checkFile(file,attempt){
  const url=new URL(file.path,base);
  url.searchParams.set('jobfit_verify',sha+'-'+attempt+'-'+file.path.replace(/\W/g,'_'));
  try{
    const response=await fetch(url,{
      cache:'no-store',
      headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},
      signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)return {path:file.path,ok:false,status:response.status,expected:file.hash};
    const actual=Buffer.from(await response.arrayBuffer());
    const ok=file.bytes.equals(actual);
    return {path:file.path,ok,status:response.status,expected:file.hash,actual:digest(actual)};
  }catch(e){
    return {path:file.path,ok:false,error:String(e),expected:file.hash};
  }
}

for(let attempt=1;attempt<=attempts;attempt++){
  const results=await Promise.all(expected.map(f=>checkFile(f,attempt)));
  const failures=results.filter(x=>!x.ok);
  if(!failures.length){
    console.log('PASS deployed Pages matches the exact checked-out commit: '+sha);
    console.log(JSON.stringify(results.map(x=>({path:x.path,sha256:x.actual}))));
    process.exit(0);
  }
  console.log('Pages content mismatch attempt '+attempt+'/'+attempts+': '+JSON.stringify(failures));
  if(attempt<attempts)await new Promise(resolve=>setTimeout(resolve,intervalMs));
}
console.error('FAIL deployed GitHub Pages content did not match the exact checked-out commit. Inspect hashes and Pages publish settings above.');
process.exit(1);

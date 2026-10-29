// Verify the actual deployed GitHub Pages bytes against the exact checked-out commit.
// This avoids stale hard-coded asset query versions (bootstrap/app) when releases change.
import {readFileSync} from 'node:fs';

const root='https://kh31104.github.io/jobfit/';
const filePaths=[
  'index.html',
  'v2/index.html',
  'v2/bootstrap.js',
  'v2/app.js',
  'v2/steps/step5.js',
  'v2/steps/step6IndustryCompany.js',
  'v2/steps/industryAiParser.js'
];
const normalize=s=>String(s||'').replace(/\r\n/g,'\n').trimEnd();
const files=filePaths.map(path=>({path,expected:normalize(readFileSync(path,'utf8'))}));
for(let attempt=1;attempt<=45;attempt++){
  const result=await Promise.all(files.map(async({path,expected})=>{
    try{
      const response=await fetch(root+path+'?jobfit_verify='+Date.now(),{headers:{'Cache-Control':'no-cache'}});
      const deployed=normalize(await response.text());
      return {path,ok:response.ok&&deployed===expected,status:response.status,
        details:response.ok&&deployed!==expected?'deployed file differs from tested commit':''
      };
    }catch(e){return {path,ok:false,error:String(e)}}
  }));
  if(result.every(x=>x.ok)){
    console.log('PASS GitHub Pages serves the exact committed root, v2, application, STEP 6 and INJE STEP 7 AI modules');
    console.log(JSON.stringify(result));
    process.exit(0);
  }
  console.log('Pages deployment not yet on the exact commit, attempt '+attempt+'/45: '+JSON.stringify(result));
  await new Promise(resolve=>setTimeout(resolve,15000));
}
console.error('FAIL GitHub Pages latest commit files could not be verified after retry window');
process.exit(1);

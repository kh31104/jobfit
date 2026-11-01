// Compare deployed bytes with this exact checked-out release instead of stale version literals.
import {readFile} from 'node:fs/promises';

const root='https://kh31104.github.io/jobfit/';
const files=[
  'index.html',
  'v2/index.html',
  'v2/bootstrap.js',
  'v2/app.js',
  'v2/steps/step5.js',
  'v2/steps/step6IndustryCompany.js',
  'v2/steps/step7Tables.js'
];
const expected=Object.fromEntries(await Promise.all(files.map(async path=>{
  const local=await readFile(new URL('../../'+path,import.meta.url),'utf8');
  return [path,local];
})));
for(let attempt=1;attempt<=45;attempt++){
  const result=await Promise.all(files.map(async path=>{
    try{
      const response=await fetch(root+(path==='index.html'?'':path)+'?jobfit_verify='+Date.now(),{headers:{'Cache-Control':'no-cache'}});
      const served=await response.text();
      return {path,ok:response.ok && served===expected[path],status:response.status};
    }catch(e){return {path,ok:false,error:String(e)}}
  }));
  if(result.every(x=>x.ok)){
    console.log('PASS GitHub Pages matches exact checked-out student root and STEP7 files');
    console.log(JSON.stringify(result));
    process.exit(0);
  }
  console.log('Pages deploy not yet current, attempt '+attempt+'/45: '+JSON.stringify(result));
  await new Promise(resolve=>setTimeout(resolve,15000));
}
console.error('FAIL GitHub Pages bytes do not match the tested release');
process.exit(1);

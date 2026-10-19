// Read only: checks deployed bytes; the workflow reports verification to the tested commit.
const root='https://kh31104.github.io/jobfit/';
const files=[
  ['',text=>text.includes('./v2/bootstrap.js?v=40')],
  ['v2/index.html',text=>text.includes('./bootstrap.js?v=40')],
  ['v2/bootstrap.js',text=>text.includes("./app.js?v=43")],
  ['v2/app.js',text=>text.includes('physical===3?35:physical===4?37:physical===5?33')],
  ['v2/steps/step5.js',text=>text.includes('const recoveredGap=parseGapBullet')&&text.includes('const explicitGaps=')]
];
for(let attempt=1;attempt<=45;attempt++){
  const result=await Promise.all(files.map(async([path,predicate])=>{
    try{
      const response=await fetch(root+path+'?jobfit_verify='+Date.now(),{headers:{'Cache-Control':'no-cache'}});
      return {path:path||'index.html',ok:response.ok&&predicate(await response.text()),status:response.status};
    }catch(e){return {path:path||'index.html',ok:false,error:String(e)}}
  }));
  if(result.every(x=>x.ok)){
    console.log('PASS GitHub Pages served updated root, v2, bootloader, app and STEP6 report for the requested mobile fix');
    console.log(JSON.stringify(result));
    process.exit(0);
  }
  console.log('Pages deploy not yet current, attempt '+attempt+'/45: '+JSON.stringify(result));
  await new Promise(resolve=>setTimeout(resolve,15000));
}
console.error('FAIL GitHub Pages latest version could not be verified after retry window');
process.exit(1);

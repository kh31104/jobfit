import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});let failed=false;
function assert(v,m){if(!v)throw new Error(m)}

async function run(name,viewport){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(`${base}selective.html`,{waitUntil:'networkidle'});
    const body=(await page.locator('body').textContent())||'';
    for(const text of ['선택형 Career Tools','Career DNA','Experience & Competency','Job Explorer','Job Deep Dive','Industry & Company','Career Fit Map','JD Analyzer','Career Asset Match','Resume Lab','Cover Letter Lab','Interview Lab','Human-First Check','AI Job Portfolio'])assert(body.includes(text),`Missing module in composer: ${text}`);
    assert(!body.includes('주차'),'External composer must not show course week labels');

    for(const id of [1,2,5])await page.locator(`[data-module="${id}"] input`).check();
    await page.locator('#makeClassLink').click();
    const href=await page.locator('#previewClassLink').getAttribute('href');
    assert(href&&href.includes('mode=selective')&&href.includes('modules=1%2C2%2C5'),'Generated class link must carry selected modules');

    await page.goto(href,{waitUntil:'networkidle'});
    const navTexts=await page.locator('#stepNav .stepBtn').allTextContents();
    assert(navTexts.length===3,`Selective student nav must contain exactly 3 modules, found ${navTexts.length}`);
    assert(navTexts.some(x=>x.includes('Career DNA')),'Career DNA missing from student selective nav');
    assert(navTexts.some(x=>x.includes('Experience & Competency')),'Experience module missing from student selective nav');
    assert(navTexts.some(x=>x.includes('Industry & Company')),'Industry & Company missing from student selective nav');
    assert(!navTexts.some(x=>x.includes('Job Explorer')),'Unselected Job Explorer must be hidden');
    assert(await page.locator('#stepNav .stepMeta').count()===0,'Selective student nav must not render week metadata');
    const studentBody=(await page.locator('body').textContent())||'';
    assert(!studentBody.includes('주차'),'Selective student screen must not show course week labels');
    const keys=await page.evaluate(()=>Object.keys(localStorage));
    assert(keys.some(k=>k==='jobfit:v2:selective-run:custom-1-2-5'),'Selective run must use isolated local storage key');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Selective composer mobile horizontal overflow: ${overflow}px`)}
    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}
await run('selective composer desktop',{width:1280,height:1000});
await run('selective composer mobile',{width:390,height:844});
await browser.close();if(failed)process.exit(1);

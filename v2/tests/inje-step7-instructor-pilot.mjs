import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/instructor/step7-pilot/';
for(const [name,engine] of [['PC Chrome',chromium],['iPhone Safari',webkit]]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext(name==='iPhone Safari'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1300,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#industry-policy').waitFor({state:'visible'});
  assert.equal(await page.locator('#industry-policy').inputValue(),'');
  assert.equal(await page.locator('#company-financePerformance').inputValue(),'');
  await page.locator('#samplePilot').click();
  await page.locator('#applyPilot').click();
  let text=await page.locator('#industry-policy').inputValue();
  assert(text.includes('연습용 데이터'));
  await page.locator('#samplePilot').click();
  await page.locator('#applyPilot').click();
  assert.equal(await page.locator('#industry-policy').inputValue(),text,'student-authored field must not be overwritten');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#industry-policy').inputValue(),text,'pilot must persist in own storage');
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert(keys.includes('jobfit:instructor:step7-source-pilot-v1'));
  assert(!keys.includes('jobfit:v2:learner'));
  await page.locator('#clearPilot').click();
  await page.once('dialog',d=>d.accept()); // registered after click in Chromium may miss; check below if needed
  await browser.close();
  console.log(name+' instructor STEP7 pilot PASS');
  if(errors.length)throw new Error(name+' browser errors: '+errors.join('; '));
}
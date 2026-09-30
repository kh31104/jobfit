import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const assert=(value,message)=>{if(!value)throw new Error(message)};
const attrs=(locator,name)=>locator.evaluateAll((els,n)=>els.map(el=>el.getAttribute(n)),name);

const K_VERSION='K-CAAS-SF-KR-2020-v1';
const S_VERSION='SUDCO-CHO-KR-2019-9-v1';
const S_NUMBERS=[1,2,3,4,5,7,8,9,10];
const mockBundle={
  schemaVersion:'jobfit-research-measures-v1',
  kcaas:{version:K_VERSION,instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},
  sudco:{version:S_VERSION,instrument:'test-s',itemCount:9,itemNumbers:S_NUMBERS,items:S_NUMBERS.map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}
};

await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockBundle})}));

try{
  // Explicitly opt into the protected measure bundle. STEP2 no longer uses the pre-experience SUDCO block;
  // STEP0 K-CAAS and STEP13 post measures remain independently testable.
  await page.goto(`${base}?course=INJE2026&measures=true`,{waitUntil:'networkidle'});
  await page.locator('#makeCodeBtn').click();
  await page.waitForFunction(()=>String(JSON.parse(localStorage.getItem('jobfit:v2:learner')).profile?.anonCode||'').startsWith('JF26-'));
  await page.waitForSelector('[data-measure="pre-kcaas"]');

  const preK=page.locator('[data-measure="pre-kcaas"]');
  assert(await preK.count()===12,'K-CAAS count must be 12');
  assert((await attrs(preK,'data-scale-version')).every(v=>v===K_VERSION),'K-CAAS version mismatch');
  assert((await attrs(preK,'min')).every(v=>v==='1')&&(await attrs(preK,'max')).every(v=>v==='5'),'K-CAAS range mismatch');

  await page.locator('#preWork24Date').fill('2026-09-07');
  for(let i=0;i<14;i++)await page.locator('[data-measure="pre-work24"]').nth(i).fill(String(40+i));
  for(let i=0;i<12;i++)await preK.nth(i).fill(String((i%5)+1));
  await page.locator('#preMeasureSave').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).research?.measurements?.pre?.kcaas?.items?.length===12);
  const pre=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).research.measurements.pre);
  assert(pre.kcaas.items.length===12&&pre.kcaas.wordingVersion===K_VERSION,'K-CAAS save mismatch');

  await page.locator('.stepBtn[data-step="2"]').click();
  await page.waitForSelector('.experienceCompetencyWeek4');
  assert(await page.locator('#preStrengthMeasureSave').count()===0,'STEP2 must not render the pre-experience 9-item strength measure');
  assert(await page.locator('[data-measure="pre-sudco"]').count()===0,'STEP2 must not render pre-SUDCO items');
  const step2Text=(await page.locator('#stepRoot').textContent())||'';
  assert(!step2Text.includes('경험 분석 전 강점행동 9문항'),'STEP2 legacy strength-measure copy remains');

  await page.locator('.stepBtn[data-step="11"]').click();
  await page.waitForSelector('#postMeasureSave');
  const postS=page.locator('[data-measure="post-sudco"]');
  assert(await postS.count()===9,'POST SUDCO count must be 9');
  assert((await attrs(postS,'data-scale-version')).every(v=>v===S_VERSION),'POST SUDCO version mismatch');

  await page.locator('.stepBtn[data-step="0"]').click();
  await page.waitForSelector('[data-measure="pre-kcaas"]');
  await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'authorization should persist through reload in one tab session');

  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS restricted measure pipeline with STEP2 pre-SUDCO removed');
}finally{
  await browser.close();
}

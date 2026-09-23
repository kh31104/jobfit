import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(v,m){if(!v)throw new Error(m)}

async function mockRoutes(page){
  const anchors=['A','B','C','D','E','F','G','H'].map(code=>({code,name:`${code}유형`}));
  const scoring={A:[1,9,17,25,33],B:[2,10,18,26,34],C:[3,11,19,27,35],D:[4,12,20,28,36],E:[5,13,21,29,37],F:[6,14,22,30,38],G:[7,15,23,31,39],H:[8,16,24,32,40]};
  const scale={version:'TEST',instrument:'Career Anchor',itemCount:40,itemNumbers:Array.from({length:40},(_,i)=>i+1),items:Array.from({length:40},(_,i)=>`문항 ${i+1}`),response:{min:1,max:6,minLabel:'낮음',maxLabel:'높음'},bonusRule:{selectCount:3,addPoints:4},anchors,scoring,source:{}};
  await page.route('**/functions/v1/career-dna-measures',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',careerAnchor:scale})}));
  await page.route('**/functions/v1/research-measures',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:{}})}));
  await page.route('**/rest/v1/rpc/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
}

async function run(name,fn){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  await mockRoutes(page);
  try{await fn(page);console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}

await run('STEP1 collapsed modules open on click',async page=>{
  await page.goto(`${base}?course=INJE2026&measures=false`,{waitUntil:'domcontentloaded'});
  await page.locator('.stepBtn[data-step="1"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===7);
  const heads=page.locator('.careerDnaStandard .jobfitModuleToggle');
  assert(await heads.count()===7,'STEP1 must expose 7 clickable module headers');
  for(let i=0;i<7;i++)assert(await heads.nth(i).getAttribute('aria-expanded')==='false',`module ${i+1} must start collapsed`);
  await heads.nth(0).click();
  assert(await heads.nth(0).getAttribute('aria-expanded')==='true','first STEP1 module did not expand');
  const block=heads.nth(0).locator('..');
  assert(await block.locator('.jobfitModuleBody').first().isVisible(),'expanded STEP1 body is not visible');
  await heads.nth(0).click();
  assert(await heads.nth(0).getAttribute('aria-expanded')==='false','first STEP1 module did not collapse again');
});

await run('STEP1 learner data survives reload and IndexedDB recovery',async page=>{
  await page.goto(`${base}?course=INJE2026&measures=false`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#makeCodeBtn');
  const sample={version:2.2,activeStep:1,mode:'full',profile:{courseCode:'INJE2026',institution:'인제대학교',anonCode:'JF26-SAFE22',age:'22',grade:'3학년'},baseline:{jobDecision:'탐색 중',prepStage:'정보탐색'},research:{consent:false,measurements:{pre:{}}},assessments:{careerDNA:{balance:{answers:[{questionId:1,choice:'A',label:'선택 A',value:'안정',confirmedAt:'2026-09-21T04:00:00.000Z'},null,null,null,null,null,null]},selfStrengths:['학구열','신중성'],viaTop5:['학구열','신중성','진실성','희망','친절'],multipleIntelligence:{top3:['자기성찰지능','언어지능','인간친화지능']},comparison:{repeat:'오늘 STEP1 저장 내용'},hypothesis:{text:'오늘 STEP1 저장 가설',selfCheck:'어느 정도 맞음'}},experienceCompetency:{experiences:[]}},artifacts:{},meta:{updatedAt:new Date().toISOString()}};
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),sample);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.JobfitStorageContinuity);
  let s=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(s.profile.anonCode==='JF26-SAFE22','anonymous code lost after reload');
  assert(s.assessments.careerDNA.selfStrengths[0]==='학구열','self-selected strength lost after reload');
  assert(s.assessments.careerDNA.viaTop5[0]==='학구열','VIA lost after reload');
  assert(s.assessments.careerDNA.comparison.repeat==='오늘 STEP1 저장 내용','comparison lost after reload');
  assert(s.assessments.careerDNA.hypothesis.text==='오늘 STEP1 저장 가설','hypothesis lost after reload');
  await page.evaluate(()=>window.JobfitStorageContinuity.syncNow());
  await page.waitForTimeout(500);
  await page.evaluate(()=>localStorage.removeItem('jobfit:v2:learner'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')||'{}')?.profile?.anonCode==='JF26-SAFE22');
  s=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(s.assessments.careerDNA.balance.answers[0].choice==='A','balance answer lost after IndexedDB recovery');
  assert(s.assessments.careerDNA.selfStrengths[0]==='학구열','self-selected strength lost after IndexedDB recovery');
  assert(s.assessments.careerDNA.multipleIntelligence.top3[0]==='자기성찰지능','legacy MI data should be preserved for backward compatibility');
  assert(s.assessments.careerDNA.hypothesis.text==='오늘 STEP1 저장 가설','STEP1 hypothesis lost after IndexedDB recovery');
});

await run('STEP0 anonymous code button remains clickable',async page=>{
  await page.goto(`${base}?course=INJE2026&measures=false`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#makeCodeBtn');
  await page.locator('#makeCodeBtn').click();
  await page.waitForFunction(()=>/^JF26-[A-Z2-9]{6}$/.test(document.querySelector('#anonCode')?.textContent?.trim()||''));
  const code=(await page.locator('#anonCode').textContent()||'').trim();
  assert(/^JF26-[A-Z2-9]{6}$/.test(code),'anonymous code was not generated');
});

await browser.close();
if(failed)process.exit(1);

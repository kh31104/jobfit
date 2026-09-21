import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/';
const url=new URL(base);url.searchParams.set('course','INJE2026');
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(v,m){if(!v)throw new Error(m)}

async function runSavedBrowser(){
  const context=await browser.newContext();
  const page=await context.newPage();
  try{
    await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{localStorage.clear();indexedDB.deleteDatabase('jobfit-v2-continuity')});
    const saved={version:2.2,activeStep:0,mode:'full',profile:{courseCode:'INJE2026',institution:'인제대학교',anonCode:'JF26-3WKFA9',age:'22',grade:'3학년',major:'경영학과'},baseline:{jobDecision:'탐색 중',prepStage:'정보탐색'},research:{consent:false,measurements:{pre:{}}},assessments:{careerDNA:{balance:{answers:[{questionId:1,choice:'A',label:'안정적인 조직',value:'안정',confirmedAt:'2026-09-21T04:00:00.000Z'},null,null,null,null,null,null]},selfStrengths:['학구열','신중성'],viaTop5:['학구열','신중성','진실성','희망','친절'],multipleIntelligence:{top3:['자기성찰지능','언어지능','인간친화지능']},comparison:{repeat:'오늘 STEP 1에서 저장한 비교 내용'},hypothesis:{text:'오늘 STEP 1에서 저장한 가설',selfCheck:'어느 정도 맞음'}},experienceCompetency:{experiences:[]}},artifacts:{careerStartProfile:{statement:'기존 저장 문장'}},meta:{updatedAt:'2026-09-07T02:40:00.000Z'}};
    await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),saved);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#jobfitContinuityStatus');
    assert((await page.locator('#anonCode').textContent())?.includes('JF26-3WKFA9'),'Saved anonymous code was not restored on same browser');
    assert(await page.locator('#age').inputValue()==='22','Saved profile was not restored on same browser');
    let persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(persisted?.assessments?.careerDNA?.balance?.answers?.[0]?.choice==='A','STEP 1 balance answer was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.viaTop5?.[0]==='학구열','STEP 1 VIA result was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.comparison?.repeat==='오늘 STEP 1에서 저장한 비교 내용','STEP 1 comparison text was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.hypothesis?.text==='오늘 STEP 1에서 저장한 가설','STEP 1 hypothesis was lost after same-browser reload');
    assert((await page.locator('#jobfitContinuityStatus').textContent())?.includes('이 브라우저의 이전 Jobfit 자료를 찾았습니다.'),'Saved-browser continuity status missing');
    await page.evaluate(()=>window.JobfitStorageContinuity?.syncNow());
    await page.waitForTimeout(250);
    await page.evaluate(()=>localStorage.removeItem('jobfit:v2:learner'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#jobfitContinuityStatus');
    assert((await page.locator('#anonCode').textContent())?.includes('JF26-3WKFA9'),'IndexedDB mirror did not recover learner state');
    assert(await page.locator('#age').inputValue()==='22','IndexedDB mirror did not recover profile');
    persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(persisted?.assessments?.careerDNA?.balance?.answers?.[0]?.choice==='A','IndexedDB recovery lost STEP 1 balance answer');
    assert(persisted?.assessments?.careerDNA?.viaTop5?.[0]==='학구열','IndexedDB recovery lost STEP 1 VIA result');
    assert(persisted?.assessments?.careerDNA?.comparison?.repeat==='오늘 STEP 1에서 저장한 비교 내용','IndexedDB recovery lost STEP 1 comparison text');
    assert(persisted?.assessments?.careerDNA?.hypothesis?.text==='오늘 STEP 1에서 저장한 가설','IndexedDB recovery lost STEP 1 hypothesis');
    assert((await page.locator('#jobfitContinuityStatus').textContent())?.includes('보조 저장에서 이전 자료를 복구했습니다.'),'Durable recovery status missing');
    console.log('PASS same-browser continuity + durable mirror');
  }catch(e){failed=true;console.error(`FAIL same-browser continuity\n${e.stack||e}`)}finally{await context.close()}
}

async function runMissingBrowser(){
  const context=await browser.newContext();
  const page=await context.newPage();
  try{
    await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#jobfitContinuityStatus');
    const text=(await page.locator('#jobfitContinuityStatus').textContent())||'';
    assert(text.includes('이 브라우저에서 이전 Jobfit 자료를 찾지 못했습니다.'),'Missing-data guidance not shown');
    assert(text.includes('과거 작성내용 자체는 복구되지 않습니다.'),'Anonymous-code-only limitation not explained');
    assert(await page.locator('#continuityImportBtn').count()===1,'Backup restore CTA missing');
    console.log('PASS missing-browser recovery guidance');
  }catch(e){failed=true;console.error(`FAIL missing-browser guidance\n${e.stack||e}`)}finally{await context.close()}
}

await runSavedBrowser();
await runMissingBrowser();
await browser.close();
if(failed)process.exit(1);

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
    await page.waitForSelector('#anonCode');
    await page.waitForFunction(()=>window.JobfitStorageContinuity&&document.querySelector('#anonCode')?.textContent?.includes('JF26-3WKFA9'));
    assert((await page.locator('#anonCode').textContent())?.includes('JF26-3WKFA9'),'Saved anonymous code was not restored on same browser');
    assert(await page.locator('#age').inputValue()==='22','Saved profile was not restored on same browser');
    let persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(persisted?.assessments?.careerDNA?.balance?.answers?.[0]?.choice==='A','STEP 1 balance answer was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.selfStrengths?.[0]==='학구열','STEP 1 self-strength selection was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.viaTop5?.[0]==='학구열','STEP 1 VIA result was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.comparison?.repeat==='오늘 STEP 1에서 저장한 비교 내용','STEP 1 comparison text was lost after same-browser reload');
    assert(persisted?.assessments?.careerDNA?.hypothesis?.text==='오늘 STEP 1에서 저장한 가설','STEP 1 hypothesis was lost after same-browser reload');
    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('[data-strength]',{state:'attached'});
    assert(await page.locator('.strengthPick.selected').count()===2,'Saved self-strengths were not rendered selected after same-browser return');
    assert(!((await page.locator('#stepRoot').textContent())||'').includes('다중지능검사'),'Removed multiple-intelligence module rendered after same-browser return');
    await page.locator('.stepBtn[data-step="0"]').click();await page.waitForSelector('#anonCode');
    await page.evaluate(()=>window.JobfitStorageContinuity?.syncNow());
    await page.waitForTimeout(250);
    await page.evaluate(()=>localStorage.removeItem('jobfit:v2:learner'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#anonCode');
    await page.waitForFunction(()=>document.querySelector('#anonCode')?.textContent?.includes('JF26-3WKFA9'));
    assert((await page.locator('#anonCode').textContent())?.includes('JF26-3WKFA9'),'IndexedDB mirror did not recover learner state');
    assert(await page.locator('#age').inputValue()==='22','IndexedDB mirror did not recover profile');
    persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(persisted?.assessments?.careerDNA?.balance?.answers?.[0]?.choice==='A','IndexedDB recovery lost STEP 1 balance answer');
    assert(persisted?.assessments?.careerDNA?.selfStrengths?.[0]==='학구열','IndexedDB recovery lost STEP 1 self-strength selection');
    assert(persisted?.assessments?.careerDNA?.viaTop5?.[0]==='학구열','IndexedDB recovery lost STEP 1 VIA result');
    assert(persisted?.assessments?.careerDNA?.comparison?.repeat==='오늘 STEP 1에서 저장한 비교 내용','IndexedDB recovery lost STEP 1 comparison text');
    assert(persisted?.assessments?.careerDNA?.hypothesis?.text==='오늘 STEP 1에서 저장한 가설','IndexedDB recovery lost STEP 1 hypothesis');
    console.log('PASS same-browser continuity + durable mirror');
  }catch(e){failed=true;console.error(`FAIL same-browser continuity\n${e.stack||e}`)}finally{await context.close()}
}

async function runMissingBrowser(){
  const context=await browser.newContext();
  const page=await context.newPage();
  try{
    await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#makeCodeBtn');
    const text=(await page.locator('#stepRoot').textContent())||'';
    assert(text.includes('브라우저 데이터가 삭제되거나 다른 기기를 사용할 때'),'Same-browser storage limitation guidance missing');
    assert(await page.locator('#importBtn').count()===1,'Global backup import control missing');
    assert(await page.locator('#existingAnonCodeWrap').count()===1,'Existing anonymous-code restore guidance missing');
    console.log('PASS missing-browser recovery guidance');
  }catch(e){failed=true;console.error(`FAIL missing-browser guidance\n${e.stack||e}`)}finally{await context.close()}
}

await runSavedBrowser();
await runMissingBrowser();
await browser.close();
if(failed)process.exit(1);

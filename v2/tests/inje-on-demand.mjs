import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const KEY='jobfit:v2:learner';
const assert=(v,m)=>{if(!v)throw new Error(m)};
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),KEY);
async function openStep(page,n){await page.locator('.stepBtn[data-step="'+n+'"]').click();await page.waitForFunction(n=>document.querySelector('.stepBtn.active')?.dataset.step===String(n),n)}
const browser=await chromium.launch({headless:true});
let failed=false;
for(const width of [1280,390]){
 const context=await browser.newContext({viewport:{width,height:850}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.clear();indexedDB.deleteDatabase('jobfit-v2-continuity')});
  await page.reload({waitUntil:'domcontentloaded'});
  // No STEP 1-4 work: start at STEP 5 with only job + industry.
  await openStep(page,4);
  await page.locator('#injeOnDemand details').first().evaluate(el=>el.open=true);
  await page.fill('#od-job','교육기획');
  await page.fill('#od-industry','교육서비스');
  await page.click('#od-save');
  await page.waitForSelector('.jobAnalysisInje .targetPick');
  let state=await read(page);
  assert(state.artifacts?.injeOnDemand?.job==='교육기획','STEP 5 supplemental job was not saved');
  assert(!state.artifacts?.jobExplorer?.targets?.length,'STEP 5 supplement incorrectly overwrote STEP 4 targets');
  assert(!state.assessments?.experienceCompetency?.experiences?.length,'STEP 5 supplement invented STEP 3 experience');
  assert((await page.locator('.targetPick').first().innerText()).includes('교육기획'),'STEP 5 is still blocked despite on-demand target');

  // At STEP 6 enter only actual student experience + missing JD details.
  await openStep(page,5);
  const box=page.locator('#injeOnDemand details').first();await box.evaluate(el=>el.open=true);
  await page.fill('#od-experienceTitle','교육봉사');
  await page.fill('#od-experienceAction','학생 활동지를 직접 제작했다.');
  await page.fill('#od-experienceResult','작성한 활동지 2장');
  await page.fill('#od-competencies','교육자료 제작');
  await page.check('#od-experienceConfirmed');
  await page.fill('#od-careerNote','교육 콘텐츠 제작에 관심이 있다.');
  await page.fill('#od-activities','교육자료 설계');
  const jdBox=page.locator('#injeOnDemand details.qsDetails');await jdBox.evaluate(el=>el.open=true);
  await page.fill('#od-company','교육기관 예시');
  await page.fill('#od-jdTasks','교육과정 설계 및 활동지 제작');
  await page.fill('#od-jdRequirements','교육자료 기획 능력');
  await page.fill('#od-gap','실제 교육성과 분석 경험 부족');
  await page.fill('#od-nextAction','3개월 내 교육자료 포트폴리오 1건 제작');
  await page.click('#od-save');
  await page.waitForSelector('#jobfitReportPrint');
  const report=(await page.locator('#jobfitReportPrint').innerText())||'';
  for(const expected of ['교육봉사','학생 활동지를 직접 제작했다','교육자료 설계','교육과정 설계 및 활동지 제작','3개월 내 교육자료 포트폴리오'])
   assert(report.includes(expected),'STEP 6 report did not use available supplemental '+expected);
  state=await read(page);
  assert(!state.artifacts?.jobExplorer?.targets?.length,'STEP 6 overwrote original STEP 4');
  assert(!state.assessments?.experienceCompetency?.experiences?.length,'STEP 6 overwrote original STEP 3');
  assert(!state.artifacts?.jobDeepDive?.targetAnalyses,'STEP 6 overwrote original STEP 5');

  // Downstream modules consume read-only projections without forcing reentry.
  await openStep(page,8);
  const reqs=await page.locator('#requirementId option').allTextContents();
  assert(reqs.some(x=>x.includes('교육자료 기획 능력')),'STEP 9 JD requirement not available');
  assert(await page.locator('[data-asset]').count()>=1,'STEP 9 missing evidence draft');
  await openStep(page,9);
  assert((await page.locator('#interviewPrompt').inputValue()).includes('교육기관 예시'),'STEP 10 cannot see supplied target');
  await page.reload({waitUntil:'domcontentloaded'});
  state=await read(page);
  assert(state.artifacts?.injeOnDemand?.experienceTitle==='교육봉사','Supplement missing after reload');
  assert(!state.assessments?.experienceCompetency?.experiences?.length,'Original raw STEP 3 modified after reload');
  assert(!state.artifacts?.jobExplorer?.targets?.length,'Original raw STEP 4 modified after reload');
  assert(errors.length===0,'Javascript errors: '+errors.join('; '));
  console.log('PASS INJE on-demand recovery '+width+'px');
 }catch(e){failed=true;console.error('FAIL '+width+'px '+(e.stack||e));}finally{await context.close()}
}

// Existing content cannot be altered by simply viewing or by saving a supplement.
{
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded'});
  const original={version:2.2,activeStep:4,mode:'full',profile:{anonCode:'JF26-SAFEAB',courseCode:'INJE2026',major:'경영학과'},baseline:{jobDecision:'탐색 중'},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{
   careerDNA:{viaTop5:['학구열','친절','진실성','희망','신중성'],hypothesis:{text:'기존 가치관 문장'}},
   experienceCompetency:{experiences:[{id:'old-exp',title:'기존 팀프로젝트',action:'기존 행동 그대로',factChecked:true}]}},
   artifacts:{jobExplorer:{candidates:[{id:'oldjob',title:'기존 직무'}],targets:['oldjob'],targetCombos:[{id:'oldcombo',jobId:'oldjob',industry:'기존 산업'}]},
    jobDeepDive:{targetAnalyses:{oldcombo:{jobTitle:'기존 직무',jobTable:{tasks:'기존 업무'}}}}},meta:{updatedAt:'2026-10-01T00:00:00Z'}};
  await page.evaluate(({key,v})=>localStorage.setItem(key,JSON.stringify(v)),{key:KEY,v:original});
  await page.reload({waitUntil:'domcontentloaded'});
  await openStep(page,4);await openStep(page,5);await openStep(page,8);
  let state=await read(page);
  for(const group of ['careerDNA','experienceCompetency'])
    assert(JSON.stringify(state.assessments[group])===JSON.stringify(original.assessments[group]),group+' changed on visit');
  for(const group of ['jobExplorer','jobDeepDive'])
    assert(JSON.stringify(state.artifacts[group])===JSON.stringify(original.artifacts[group]),group+' changed on visit');
  // Saving only a new supplemental field does not touch prior data.
  await page.locator('#injeOnDemand details').first().evaluate(el=>el.open=true);
  await page.fill('#od-company','새로운 지원 기업');await page.fill('#od-jdRequirements','문서 작성 능력');
  await page.click('#od-save');
  state=await read(page);
  assert(state.artifacts.injeOnDemand.company==='새로운 지원 기업','New supplemental state missing');
  for(const group of ['careerDNA','experienceCompetency'])
    assert(JSON.stringify(state.assessments[group])===JSON.stringify(original.assessments[group]),group+' overwritten by supplement');
  for(const group of ['jobExplorer','jobDeepDive'])
    assert(JSON.stringify(state.artifacts[group])===JSON.stringify(original.artifacts[group]),group+' overwritten by supplement');
  console.log('PASS INJE previously saved data unchanged');
 }catch(e){failed=true;console.error('FAIL preserved data '+(e.stack||e));}finally{await context.close()}
}
await browser.close();
if(failed)process.exit(1);

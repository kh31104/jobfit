import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const mockMeasures={schemaVersion:'jobfit-research-measures-v1',kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'test-s',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:[1,2,3,4,5,7,8,9,10].map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}};
function assert(value,message){if(!value)throw new Error(message)}
async function routeClassroom(page){
  await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockMeasures})}));
  await page.route('**/rest/v1/rpc/cast_value_vote',route=>route.fulfill({status:200,contentType:'application/json',body:''}));
  await page.route('**/rest/v1/rpc/get_value_vote_counts',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{a_count:12,b_count:8,total_count:20,a_percent:60,b_percent:40}])}));
}
async function run(name,fn){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});page.on('dialog',d=>d.accept());
  await routeClassroom(page);
  try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}
async function openCareerDNA(page){await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt',{state:'attached'});await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===10)}
function moduleHead(page,title){return page.locator('.careerDnaStandard .moduleHead').filter({has:page.locator('h3',{hasText:title})}).first()}
async function expandModule(page,title){const head=moduleHead(page,title);if((await head.getAttribute('aria-expanded'))!=='true')await head.click()}

await run('STEP 0-13 all load with research PRE enabled',async page=>{
  await page.goto(`${base}?course=INJE2026&measures=true`,{waitUntil:'networkidle'});
  assert(await page.locator('#preMeasureSave').count()===1,'STEP0 PRE panel must render');
  assert(await page.locator('[data-measure="pre-work24"]').count()===9,'Work24 job-readiness PRE must expose 9 result-score inputs');
  for(let i=0;i<=13;i++){await page.locator(`.stepBtn[data-step="${i}"]`).click();await page.waitForTimeout(60);const body=(await page.locator('#stepRoot').textContent())||'';assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${i} failed to render`)}
});

await run('Career DNA research-standard sequence replaces Anchor and MI',async page=>{
  await openCareerDNA(page);const body=(await page.locator('#stepRoot').textContent())||'';
  for(const text of ['커리어 밸런스게임','내가 생각하는 나의 흥미','고용24 직업선호도검사 S형','내가 생각하는 나의 직업가치','고용24 성인용 직업가치관검사','내가 생각하는 나의 강점','VIA 성격강점 TOP5','내가 생각하는 나 × 검사에서 나타난 나','AI 자기이해 통합분석','Career DNA 가설 v1'])assert(body.includes(text),`Missing module: ${text}`);
  assert(!body.includes('Career Anchor'),'Career Anchor must be removed from research-standard STEP1');
  assert(!body.includes('다중지능검사'),'Multiple-intelligence assessment must be removed from research-standard STEP1');
  assert((await page.locator('[data-strength]').count())>=50,'Strength word picker missing');
  assert((await page.locator('.careerDnaStandard .jobfitModuleToggle[aria-expanded="false"]').count())===10,'All ten Career DNA modules must start collapsed');
});

await run('Work24 and VIA inputs generate hypothesis-only AI prompt',async page=>{
  await openCareerDNA(page);
  await expandModule(page,'내가 생각하는 나의 흥미');await page.locator('#selfInterest').fill('자료를 비교하고 원인을 찾는 활동을 좋아한다.');
  await expandModule(page,'고용24 직업선호도검사 S형');for(const [code,val] of Object.entries({R:40,I:65,A:45,S:55,E:48,C:60}))await page.locator(`#riasec_${code}`).fill(String(val));
  await expandModule(page,'내가 생각하는 나의 직업가치');await page.locator('#selfWorkValues').fill('성장과 일과 삶의 균형이 중요하다.');
  await expandModule(page,'고용24 성인용 직업가치관검사');for(let i=0;i<9;i++)await page.locator(`#workValue_${i}`).fill(String(40+i));
  await expandModule(page,'내가 생각하는 나의 강점');for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
  await expandModule(page,'VIA 성격강점 TOP5');for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);
  await expandModule(page,'내가 생각하는 나 × 검사에서 나타난 나');await page.locator('#compare_repeat').fill('학습과 신중함 관련 단서가 반복된다.');await page.locator('#compare_verify').fill('실제 과제에서 신중함이 행동으로 나타나는지 확인한다.');
  await expandModule(page,'AI 자기이해 통합분석');await page.locator('#makePrompt').click();const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[검사 단서 · 고용24 직업선호도검사 S형]'),'Work24 interest missing');
  assert(prompt.includes('[검사 단서 · 고용24 성인용 직업가치관검사]'),'Work24 values missing');
  assert(prompt.includes('[검사 단서 · VIA 성격강점 TOP5]'),'VIA missing');
  assert(prompt.includes('반복 단서'),'Repeated-cue terminology missing');
  assert(prompt.includes('행동 근거가 아니다'),'Behavior-evidence guard missing');
  assert(prompt.includes('직업을 추천하지 않는다'),'No-job-recommendation guard missing');
  assert(!prompt.includes('Career Anchor'),'Legacy Anchor leaked into prompt');
  assert(!prompt.includes('다중지능'),'Legacy MI leaked into prompt');
  await page.locator('#saveDNA').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner'))?.assessments?.careerDNA);
  assert(saved.standard?.version==='career-dna-research-v1.0','Research-standard version missing');
  assert(saved.careerAnchor===null&&saved.multipleIntelligence===null,'Legacy assessment values must not remain active');
  assert(saved.legacyCareerDnaV1,'Legacy values should be retained separately for migration safety');
});

await browser.close();if(failed)process.exit(1);

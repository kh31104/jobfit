import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const mockMeasures={schemaVersion:'jobfit-research-measures-v1',kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'test-s',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:[1,2,3,4,5,7,8,9,10].map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}};
function assert(v,m){if(!v)throw new Error(m)}
async function routeClassroom(page){
  await page.route('**/functions/v1/research-measures',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockMeasures})}));
  await page.route('**/rest/v1/rpc/cast_value_vote',r=>r.fulfill({status:200,contentType:'application/json',body:''}));
  await page.route('**/rest/v1/rpc/get_value_vote_counts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{a_count:12,b_count:8,total_count:20,a_percent:60,b_percent:40}])}));
}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());await routeClassroom(page);try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}
async function openCareerDNA(page){await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt');await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===10)}
function moduleHead(page,title){return page.locator('.careerDnaStandard .moduleHead').filter({has:page.locator('h3',{hasText:title})}).first()}
async function expandModule(page,title){const h=moduleHead(page,title);if((await h.getAttribute('aria-expanded'))!=='true')await h.click()}

await run('STEP 0-13 all load with classroom PRE enabled',async page=>{
  await page.goto(`${base}?course=INJE2026&measures=true`,{waitUntil:'networkidle'});
  assert(await page.locator('[data-measure="pre-work24"]').count()===9,'STEP0 must render 9 Work24 job-readiness result fields');
  for(let i=0;i<=13;i++){await page.locator(`.stepBtn[data-step="${i}"]`).click();await page.waitForTimeout(50);assert(!((await page.locator('#stepRoot').textContent())||'').includes('화면을 불러오지 못했습니다'),`STEP ${i} failed`) }
});

await run('Career DNA renders the research-safe 10-module sequence',async page=>{
  await openCareerDNA(page);const body=(await page.locator('#stepRoot').textContent())||'';
  for(const t of ['커리어 밸런스게임','내가 생각하는 나의 흥미','고용24 직업선호도검사 S형','내가 생각하는 나의 직업가치','고용24 성인용 직업가치관검사','내가 생각하는 나의 강점','VIA 성격강점','내가 생각하는 나 × 검사에서 나타난 나','AI 자기이해 통합분석','Career DNA 가설 v1'])assert(body.includes(t),`Missing ${t}`);
  assert(!body.includes('Career Anchor'),'Career Anchor must not be in research-safe STEP1');
  assert(!body.includes('다중지능검사'),'Multiple-intelligence test must not be in research-safe STEP1');
  assert((await page.locator('.jobfitModuleToggle[aria-expanded="false"]').count())===10,'All 10 modules should start collapsed');
});

await run('Balance game stays a warmup and can be corrected',async page=>{
  await openCareerDNA(page);await expandModule(page,'커리어 밸런스게임');
  await page.locator('[data-balance-choice="A"][data-index="0"]').click();await page.waitForSelector('#vote_0');
  assert(((await page.locator('#balanceSummary').textContent())||'').includes('진단점수가 아니라'),'Balance must be described as a non-diagnostic clue');
  const nav=page.waitForNavigation({waitUntil:'networkidle'});await page.locator('.balanceReselect').first().click();await nav;
  await page.waitForFunction(()=>{const b=document.querySelector('[data-balance-choice="B"][data-index="0"]');return b&&!b.disabled});
});

await run('Work24, self-perception and VIA feed a clue-level Career DNA prompt',async page=>{
  await openCareerDNA(page);
  await expandModule(page,'내가 생각하는 나의 흥미');await page.locator('#selfInterest_0').fill('자료를 비교하고 패턴을 찾는 활동');
  await expandModule(page,'고용24 직업선호도검사 S형');for(const [code,val] of Object.entries({R:45,I:63,A:42,S:51,E:47,C:58}))await page.locator(`#riasecStandard_${code}`).fill(String(val));
  await expandModule(page,'내가 생각하는 나의 직업가치');await page.locator('#selfValue_0').fill('성장');
  await expandModule(page,'고용24 성인용 직업가치관검사');await page.locator('#workValueName_0').fill('성취');await page.locator('#workValueScore_0').fill('5');
  await expandModule(page,'내가 생각하는 나의 강점');for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
  await expandModule(page,'VIA 성격강점');for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);
  await expandModule(page,'내가 생각하는 나 × 검사에서 나타난 나');await page.locator('#compare_repeat').fill('학습과 신중함이 반복해서 보인다.');await page.locator('#compare_verify').fill('실제 과제에서도 같은 행동이 나타나는지 확인한다.');
  await expandModule(page,'AI 자기이해 통합분석');await page.locator('#makePrompt').click();const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[자기인식 단서 · 흥미]'),'Self-interest clue missing');assert(prompt.includes('[검사 단서 · 고용24 직업선호도 S형]'),'Work24 interest clue missing');assert(prompt.includes('[검사 단서 · 고용24 직업가치관]'),'Work24 values clue missing');assert(prompt.includes('[검사 단서 · VIA 성격강점]'),'VIA clue missing');
  assert(prompt.includes('반복 단서'),'Prompt must use clue terminology');assert(prompt.includes('행동 근거'),'Prompt must reserve behavioral evidence for STEP2');assert(prompt.includes('직업을 추천하지 않는다'),'No-job-recommendation guard missing');
  assert(!prompt.includes('Career Anchor'),'Legacy Career Anchor leaked into prompt');assert(!prompt.includes('다중지능'),'Legacy MI leaked into prompt');
  await expandModule(page,'Career DNA 가설 v1');await page.locator('#aiHypothesis').fill('학습과 신중함은 실제 경험에서 확인할 가설이다.');await page.locator('#verifiedStrengthKeywords').fill('신중한 실행, 학습');await page.locator('#verifiedExperienceQuestions').fill('실제 행동에서 신중함이 확인되는가?\n학습 내용을 적용한 경험이 있는가?');await page.locator('#saveDNA').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved.assessments.careerDNA.standard.version==='career-dna-research-v1','Research-safe version missing');assert(saved.assessments.careerDNA.promptMeta.version==='career-dna-research-v1','Prompt version missing');assert(saved.artifacts.careerDNAProfile.riasecTop[0].code==='I','RIASEC profile not saved');
});

await browser.close();if(failed)process.exit(1);
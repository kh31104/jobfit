import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;

const anchors=[
  {code:'A',name:'전문성 추구형'},{code:'B',name:'리더쉽 추구형'},{code:'C',name:'자율성/독립성 추구형'},{code:'D',name:'안전/안정성 추구형'},
  {code:'E',name:'경제력 추구형',note:'기업가적 창의성'},{code:'F',name:'봉사/헌신 추구형'},{code:'G',name:'도전 추구형'},{code:'H',name:'삶의 질 추구형'}
];
const scoring={A:[1,9,17,25,33],B:[2,10,18,26,34],C:[3,11,19,27,35],D:[4,12,20,28,36],E:[5,13,21,29,37],F:[6,14,22,30,38],G:[7,15,23,31,39],H:[8,16,24,32,40]};
const mockAnchor={version:'COI-SCHEIN-KR-USER-SOURCE-40-v1',instrument:'Career Anchor Test',itemCount:40,itemNumbers:Array.from({length:40},(_,i)=>i+1),items:Array.from({length:40},(_,i)=>`Career Anchor 문항 ${i+1}`),response:{min:1,max:6,minLabel:'결코 아님',maxLabel:'항상 해당됨'},bonusRule:{selectCount:3,addPoints:4},anchors,scoring,source:{author:'Edgar H. Schein'}};

function assert(value,message){if(!value)throw new Error(message)}
async function routeClassroom(page){
  await page.route('**/functions/v1/career-dna-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',careerAnchor:mockAnchor})}));
  await page.route('**/rest/v1/rpc/cast_value_vote',route=>route.fulfill({status:200,contentType:'application/json',body:''}));
  await page.route('**/rest/v1/rpc/get_value_vote_counts',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{a_count:12,b_count:8,total_count:20,a_percent:60,b_percent:40}])}));
}
async function run(name,fn){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});page.on('dialog',d=>d.accept());
  await routeClassroom(page);
  try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}
async function openCareerDNA(page){await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt')}
async function completeAnchor(page){for(let i=0;i<40;i++){const value=(i%6)+1;await page.locator(`[data-anchor-item="${i}"][value="${value}"]`).check()}for(const n of [1,2,3])await page.locator(`[data-bonus-item][value="${n}"]`).check()}

await run('STEP 0-13 all load without research-measure collection',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  assert(new URL(page.url()).searchParams.get('measures')==='false','Current Inje semester must force measures=false');
  for(let i=0;i<=13;i++){
    await page.locator(`.stepBtn[data-step="${i}"]`).click();await page.waitForTimeout(70);
    const body=(await page.locator('#stepRoot').textContent())||'';assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${i} failed to render`);
  }
});

await run('Week 3 renders the agreed Career DNA standard sequence',async page=>{
  await openCareerDNA(page);const body=(await page.locator('#stepRoot').textContent())||'';
  for(const text of ['Balance Game','Career Anchor','내가 생각하는 나의 강점','VIA 성격강점','다중지능검사','내가 생각하는 나 × 검사에서 나타난 나','AI 통합분석','Career DNA 가설 v1'])assert(body.includes(text),`Missing module: ${text}`);
  assert(!body.includes('직업선호도검사'),'Old Work24 S/L module must not remain in Week 3');
  assert(!body.includes('Career DNA 인터뷰 시작'),'Week 3 must not start the Career DNA interview');
  assert((await page.locator('[data-anchor-item]').count())===240,'40 Career Anchor items x 6 response choices expected');
  assert((await page.locator('[data-strength]').count())>=50,'Strength word picker missing');
});

await run('Balance choice is private first, then shows live class aggregate',async page=>{
  await openCareerDNA(page);
  assert(((await page.locator('#vote_0').count())===0),'Vote result must be hidden before own choice');
  await page.locator('[data-balance-choice="A"][data-index="0"]').click();
  await page.waitForSelector('#vote_0');
  await page.waitForFunction(()=>document.querySelector('#vote_0')?.textContent?.includes('60.0%'));
  const text=(await page.locator('#vote_0').textContent())||'';assert(text.includes('20명'),'Class total missing after vote');
  assert(await page.locator('[data-balance-choice="B"][data-index="0"]').isDisabled(),'Choice must lock after confirmation');
});

await run('Career Anchor scores all 40 items plus three +4 bonus items',async page=>{
  await openCareerDNA(page);await completeAnchor(page);await page.waitForFunction(()=>document.querySelector('#anchorResult')?.textContent?.includes('주 앵커'));
  const result=(await page.locator('#anchorResult').textContent())||'';assert(result.includes('주 앵커'),'Primary anchor missing');assert(result.includes('가장 낮은 앵커'),'Lowest anchor missing');
  await page.locator('#saveDNA').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));const a=saved.assessments.careerDNA.careerAnchor;
  assert(a.responses.length===40,'40 Career Anchor responses not saved');assert(a.bonusItems.length===3,'Three bonus items not saved');assert(Object.keys(a.scores).length===8,'Eight anchor scores not saved');assert(a.complete===true,'Career Anchor completion not saved');
});

await run('Qualitative and quantitative inputs produce one-shot integration prompt and preserve STEP2 bridge',async page=>{
  await openCareerDNA(page);
  for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
  for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);
  for(const [i,v] of ['자기성찰지능','언어지능','인간친화지능'].entries())await page.locator(`#mi_${i}`).selectOption({label:v});
  const reflection='학습과 신중함이 여러 결과에서 반복된다.';await page.locator('#compare_repeat').fill(reflection);await page.locator('#compare_verify').fill('협업에서도 같은 강점이 반복되는지 확인하고 싶다.');
  await page.locator('#makePrompt').click();const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[내가 생각하는 나의 강점]'),'Self-strength module missing from prompt');assert(prompt.includes('[VIA 성격강점]'),'VIA missing from prompt');assert(prompt.includes('[다중지능]'),'MI missing from prompt');
  assert(prompt.includes('이번 단계는 인터뷰가 아니라'),'Prompt must state Week 3 is not an interview');assert(prompt.includes('직업을 추천하지 않는다'),'Job recommendation guard missing');assert(prompt.includes('4주차 실제 경험으로 확인할 질문 3개'),'Week4 verification questions missing');
  await page.locator('#nextStep').click();await page.waitForSelector('#stepRoot h2');const body=(await page.locator('#stepRoot').textContent())||'';assert(body.includes(reflection),'STEP2 reflection bridge broken');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved.assessments.careerDNA.reflection.fit===reflection,'Legacy reflection.fit contract changed');assert(saved.assessments.careerDNA.promptMeta.version==='career-dna-standard-v1','New prompt version missing');
});

await browser.close();if(failed)process.exit(1);

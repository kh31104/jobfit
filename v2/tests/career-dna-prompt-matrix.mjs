import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(value,message){if(!value)throw new Error(message)}
function moduleHead(page,title){return page.locator('.careerDnaStandard .moduleHead').filter({has:page.locator('h3',{hasText:title})}).first()}
async function expandModule(page,title){const head=moduleHead(page,title);if(await head.count()===0)throw new Error(`Missing module: ${title}`);if((await head.getAttribute('aria-expanded'))!=='true')await head.click()}
async function setup(page){
  await page.route('**/rest/v1/rpc/**',r=>r.fulfill({status:200,contentType:'application/json',body:r.request().url().includes('get_value_vote_counts')?JSON.stringify([{a_count:1,b_count:1,total_count:2,a_percent:50,b_percent:50}]):''}));
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="1"]').click();
  await page.waitForSelector('#makePrompt',{state:'attached'});
  await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===10);
}
async function scenario(name,fill,check){
  const ctx=await browser.newContext();const page=await ctx.newPage();page.on('dialog',d=>d.accept());
  try{
    await setup(page);await fill(page);await expandModule(page,'AI 자기이해 통합분석');await page.locator('#makePrompt').click();
    await page.waitForFunction(()=>document.querySelector('#promptBox')?.textContent?.includes('[출력 형식 · Career DNA 가설 v1]'));
    const prompt=(await page.locator('#promptBox').textContent())||'';
    await check({page,prompt});console.log(`PASS ${name}`);
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await ctx.close()}
}

await scenario('Empty STEP1 does not invent assessment data',async()=>{},async({prompt})=>{
  assert(prompt.includes('입력되지 않은 내용은 추정하지 않는다.'),'No-inference guard missing');
  assert(prompt.includes('직업을 추천하지 않는다.'),'No-job-recommendation guard missing');
  assert(!prompt.includes('[검사 단서 · 고용24 직업선호도검사 S형]'),'Empty Work24 interest must be omitted');
  assert(!prompt.includes('[검사 단서 · 고용24 성인용 직업가치관검사]'),'Empty Work24 values must be omitted');
  assert(!prompt.includes('[검사 단서 · VIA 성격강점 TOP5]'),'Empty VIA must be omitted');
  assert(!prompt.includes('Career Anchor'),'Retired Career Anchor must not appear');
  assert(!prompt.includes('다중지능'),'Retired multiple-intelligence assessment must not appear');
});

await scenario('Self-reflection and VIA stay separate',async page=>{
  await expandModule(page,'내가 생각하는 나의 강점');
  for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
  await expandModule(page,'VIA 성격강점 TOP5');
  for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);
},async({prompt})=>{
  assert(prompt.includes('[자기인식 단서 · 내가 생각하는 강점]'),'Self-perceived strengths missing');
  assert(prompt.includes('[검사 단서 · VIA 성격강점 TOP5]'),'VIA test clue missing');
  assert(prompt.includes('자기인식과 검사결과 중 어느 한쪽을 더 진짜라고 판단하지 않는다.'),'Self-vs-test guard missing');
  assert(prompt.includes('실제 경험에서 확인되기 전에는 행동 근거로 해석하지 않는다.'),'Behavior-evidence guard missing');
});

await scenario('Full research-standard Career DNA prompt uses only approved STEP1 sources',async page=>{
  await expandModule(page,'내가 생각하는 나의 흥미');await page.locator('#selfInterest').fill('자료를 비교하고 원인을 찾는 활동을 좋아한다.');
  await expandModule(page,'고용24 직업선호도검사 S형');
  for(const [code,val] of Object.entries({R:40,I:65,A:45,S:55,E:48,C:60}))await page.locator(`#riasec_${code}`).fill(String(val));
  await expandModule(page,'내가 생각하는 나의 직업가치');await page.locator('#selfWorkValues').fill('성장과 일과 삶의 균형이 중요하다.');
  await expandModule(page,'고용24 성인용 직업가치관검사');for(let i=0;i<9;i++)await page.locator(`#workValue_${i}`).fill(String(40+i));
  await expandModule(page,'내가 생각하는 나의 강점');for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
  await expandModule(page,'VIA 성격강점 TOP5');for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);
  await expandModule(page,'내가 생각하는 나 × 검사에서 나타난 나');
  await page.locator('#compare_repeat').fill('학습과 신중함 관련 단서가 반복된다.');
  await page.locator('#compare_connect').fill('자료 탐색 선호와 학구열이 연결되는 것 같다.');
  await page.locator('#compare_unexpected').fill('사회형 점수가 예상보다 높았다.');
  await page.locator('#compare_verify').fill('실제 과제에서 신중함이 행동으로 나타나는지 확인한다.');
},async({prompt})=>{
  for(const section of [
    '[자기인식 단서 · 내가 생각하는 흥미]',
    '[검사 단서 · 고용24 직업선호도검사 S형]',
    '[자기인식 단서 · 내가 생각하는 직업가치]',
    '[검사 단서 · 고용24 성인용 직업가치관검사]',
    '[자기인식 단서 · 내가 생각하는 강점]',
    '[검사 단서 · VIA 성격강점 TOP5]',
    '[학생이 직접 비교한 결과]',
    '[출력 형식 · Career DNA 가설 v1]',
    '[추가 출력 · 자기소개서 활용 키워드 + SWOT]'
  ])assert(prompt.includes(section),`Missing prompt section: ${section}`);
  assert(prompt.includes('반복 단서'),'Repeated-clue language missing');
  assert(prompt.includes('행동 근거가 아니다')||prompt.includes('행동 근거로 해석하지 않는다'),'Behavior-evidence caution missing');
  assert(prompt.includes('O와 T의 근거가 없으면'),'SWOT no-inference guard missing');
  assert(prompt.includes('SO 전략')&&prompt.includes('ST 전략')&&prompt.includes('WO 전략')&&prompt.includes('WT 전략'),'SWOT strategy structure missing');
  assert(!prompt.includes('Career Anchor'),'Retired Career Anchor leaked into prompt');
  assert(!prompt.includes('다중지능'),'Retired multiple-intelligence assessment leaked into prompt');
});

await browser.close();
if(failed)process.exit(1);

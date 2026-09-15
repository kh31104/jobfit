import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const anchors=['A','B','C','D','E','F','G','H'].map(code=>({code,name:`${code}유형`}));
const scoring={A:[1,9,17,25,33],B:[2,10,18,26,34],C:[3,11,19,27,35],D:[4,12,20,28,36],E:[5,13,21,29,37],F:[6,14,22,30,38],G:[7,15,23,31,39],H:[8,16,24,32,40]};
const mockAnchor={version:'COI-SCHEIN-KR-USER-SOURCE-40-v1',itemCount:40,itemNumbers:Array.from({length:40},(_,i)=>i+1),items:Array.from({length:40},(_,i)=>`문항 ${i+1}`),response:{min:1,max:6,minLabel:'결코 아님',maxLabel:'항상 해당됨'},bonusRule:{selectCount:3,addPoints:4},anchors,scoring,source:{}};
function assert(x,m){if(!x)throw new Error(m)}
async function setup(page){
  await page.route('**/functions/v1/career-dna-measures',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',careerAnchor:mockAnchor})}));
  await page.route('**/rest/v1/rpc/**',r=>r.fulfill({status:200,contentType:'application/json',body:r.request().url().includes('get_value_vote_counts')?JSON.stringify([{a_count:1,b_count:1,total_count:2,a_percent:50,b_percent:50}]):''}));
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt');
}
async function scenario(name,fill,check){const ctx=await browser.newContext();const page=await ctx.newPage();page.on('dialog',d=>d.accept());try{await setup(page);await fill(page);await page.locator('#makePrompt').click();const prompt=(await page.locator('#promptBox').textContent())||'';await check({page,prompt});console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await ctx.close()}}

await scenario('No completed module does not invent data',async()=>{},async({prompt})=>{
  assert(!prompt.includes('[Balance Game'),'Empty balance should be omitted');assert(!prompt.includes('[Career Anchor · 검사결과]'),'Empty anchor should be omitted');assert(!prompt.includes('[VIA 성격강점]'),'Empty VIA should be omitted');assert(!prompt.includes('[다중지능]'),'Empty MI should be omitted');assert(prompt.includes('입력되지 않은 내용은 추정하지 않는다.'),'No-inference guard missing');
});

await scenario('Partial VIA and MI are explicitly marked',async page=>{await page.locator('#via_0').fill('학구열');await page.locator('#via_1').fill('신중성');await page.locator('#mi_0').selectOption({label:'언어지능'})},async({prompt})=>{
  assert(prompt.includes('[VIA 성격강점]'),'VIA module missing');assert(prompt.includes('VIA가 2/5만 입력됨'),'Partial VIA warning missing');assert(prompt.includes('[다중지능]'),'MI module missing');assert(prompt.includes('다중지능이 1/3만 입력됨'),'Partial MI warning missing');
});

await scenario('Self strengths are separate from VIA results',async page=>{for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v)},async({prompt})=>{
  assert(prompt.includes('[내가 생각하는 나의 강점]'),'Qualitative strengths missing');assert(prompt.includes('[VIA 성격강점]'),'Quantitative VIA missing');assert(prompt.includes('학생의 자기인식과 검사결과 중 어느 한쪽을 더 진짜라고 판단하지 않는다.'),'Qual-vs-quant guard missing');
});

await scenario('Partial Career Anchor must not be ranked',async page=>{for(let i=0;i<5;i++)await page.locator(`[data-anchor-item="${i}"][value="4"]`).check()},async({prompt})=>{
  assert(prompt.includes('[Career Anchor · 부분응답]'),'Partial anchor warning missing');assert(prompt.includes('앵커 순위를 해석하지 말 것'),'Partial anchor rank guard missing');assert(!prompt.includes('[Career Anchor · 검사결과]'),'Partial anchor must not appear as completed result');
});

await scenario('Complete Career Anchor and all modules are integrated',async page=>{
  for(let i=0;i<40;i++)await page.locator(`[data-anchor-item="${i}"][value="5"]`).check();for(const n of [1,2,3])await page.locator(`[data-bonus-item][value="${n}"]`).check();
  for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();for(const [i,v] of ['학구열','신중성','진실성','희망','친절'].entries())await page.locator(`#via_${i}`).fill(v);for(const [i,v] of ['자기성찰지능','언어지능','인간친화지능'].entries())await page.locator(`#mi_${i}`).selectOption({label:v});await page.locator('#compare_unexpected').fill('인간친화지능은 예상과 달랐다.');
},async({prompt})=>{
  assert(prompt.includes('[Career Anchor · 검사결과]'),'Complete anchor module missing');assert(prompt.includes('[내가 생각하는 나의 강점]'),'Self strengths missing');assert(prompt.includes('[VIA 성격강점]'),'VIA missing');assert(prompt.includes('[다중지능]'),'MI missing');assert(prompt.includes('[학생이 직접 비교한 결과]'),'Student comparison missing');assert(prompt.includes('직업을 추천하지 않는다.'),'No job recommendation guard missing');
});

await browser.close();if(failed)process.exit(1);

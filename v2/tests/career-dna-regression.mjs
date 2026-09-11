import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;

const K_VERSION='K-CAAS-SF-KR-2020-v1';
const S_VERSION='SUDCO-CHO-KR-2019-9-v1';
const S_NUMBERS=[1,2,3,4,5,7,8,9,10];
const mockBundle={
  schemaVersion:'jobfit-research-measures-v1',
  kcaas:{version:K_VERSION,instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},
  sudco:{version:S_VERSION,instrument:'test-s',itemCount:9,itemNumbers:S_NUMBERS,items:S_NUMBERS.map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}
};

function assert(value,message){if(!value)throw new Error(message)}

async function run(name,fn){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockBundle})}));
  try{
    await fn(page);
    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(e){
    failed=true;
    console.error(`FAIL ${name}\n${e.stack||e}`);
  }finally{
    await context.close();
  }
}

async function openCareerDNA(page,url=`${base}?course=INJE2026&interest=S`){
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="1"]').click();
  await page.waitForSelector('#makePrompt');
}

async function fillRiasecStandard(page,values={R:48,I:63,A:42,S:51,E:47,C:58}){
  for(const [key,value] of Object.entries(values))await page.locator(`#std_${key}`).fill(String(value));
}

await run('STEP 0-13 all load with external measure API mocked',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  for(let i=0;i<=13;i++){
    await page.locator(`.stepBtn[data-step="${i}"]`).click();
    await page.waitForTimeout(80);
    const heading=((await page.locator('#stepRoot h2').first().textContent())||'').trim();
    assert(heading.length>0,`STEP ${i} heading missing`);
    const body=(await page.locator('#stepRoot').textContent())||'';
    assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${i} failed to render`);
  }
});

await run('S + VIA creates only available Career DNA modules',async page=>{
  await openCareerDNA(page);
  await fillRiasecStandard(page);
  const via=['호기심','친절','끈기','공정성','팀워크'];
  for(let i=0;i<via.length;i++)await page.locator(`#via_${i}`).fill(via[i]);
  await page.locator('#fit').fill('사람과 함께 문제를 해결했던 경험은 결과와 비슷하다고 느낀다.');
  await page.locator('#makePrompt').click();
  const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[직업흥미 · 고용24 S형(개정)]'),'RIASEC module missing');
  assert(prompt.includes('[VIA 강점 · 교육용 참고자료]'),'VIA module missing');
  assert(!prompt.includes('[직업가치]'),'Unentered value module must be omitted');
  assert(!prompt.includes('[성격 5요인 · L형]'),'S type must not include Big5 module');
  assert(prompt.includes('질문은 한 번에 반드시 하나만 한다.'),'One-question interview rule missing');
  assert(prompt.includes('첫 응답에서는 최종 해석이나 직업추천을 제시하지 말고'),'First-response guard missing');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const dna=saved.assessments.careerDNA;
  assert(dna.promptMeta.version==='career-dna-dynamic-v1','Prompt version missing');
  assert(dna.promptMeta.moduleStatus.riasec.status==='complete','RIASEC should be complete');
  assert(dna.promptMeta.moduleStatus.via.status==='complete','VIA should be complete');
  assert(dna.promptMeta.moduleStatus.values.status==='none','Values should remain none');
  assert(saved.artifacts.careerDNAProfile.riasecTop.length===3,'Legacy careerDNAProfile riasecTop contract changed');
});

await run('Partial input is explicitly marked and never guessed',async page=>{
  await openCareerDNA(page);
  await fillRiasecStandard(page);
  await page.locator('#val_0').fill('4');
  await page.locator('#val_1').fill('5');
  await page.locator('#makePrompt').click();
  const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[직업가치 · 부분입력]'),'Partial value module label missing');
  assert(prompt.includes('2/9만 입력'),'Partial value count warning missing');
  assert(prompt.includes('입력되지 않은 가치의 우선순위를 추정하지 않는다.'),'No-guess rule missing');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.careerDNA.promptMeta.moduleStatus.values.status==='partial','Partial value status not saved');
  assert(saved.assessments.careerDNA.promptMeta.moduleStatus.values.count===2,'Partial value count mismatch');
});

await run('L type includes Big5 only when Big5 data exists',async page=>{
  await openCareerDNA(page,`${base}?course=INJE2026&interest=L`);
  await fillRiasecStandard(page);
  const big5=[61,55,68,42,70];
  for(let i=0;i<big5.length;i++)await page.locator(`#big5_${i}`).fill(String(big5[i]));
  await page.locator('#makePrompt').click();
  const prompt=(await page.locator('#promptBox').textContent())||'';
  assert(prompt.includes('[성격 5요인 · L형]'),'L type Big5 module missing');
  assert(prompt.includes('성격 점수를 흥미나 능력과 동일시하지 않는다.'),'Big5 interpretation guard missing');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.careerDNA.promptMeta.moduleStatus.big5.status==='complete','Big5 completion status mismatch');
});

await run('STEP 1 reflection contract still reaches STEP 2',async page=>{
  await openCareerDNA(page);
  await fillRiasecStandard(page);
  const reflection='팀 프로젝트에서 설명을 맡았을 때 몰입했다.';
  await page.locator('#fit').fill(reflection);
  await page.locator('#nextStep').click();
  await page.waitForSelector('#stepRoot h2');
  const heading=(await page.locator('#stepRoot h2').textContent())||'';
  assert(heading.includes('Experience & Competency'),'STEP 2 did not load');
  const body=(await page.locator('#stepRoot').textContent())||'';
  assert(body.includes(reflection),'STEP 2 reflection bridge contract was broken');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.careerDNA.reflection.fit===reflection,'Legacy reflection key changed');
});

await browser.close();
if(failed)process.exit(1);

import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;

async function run(name,fn){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{
    await fn(page);
    if(errors.length) throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(e){
    failed=true;
    console.error(`FAIL ${name}\n${e.stack||e}`);
  }finally{await context.close();}
}

function assert(cond,msg){if(!cond)throw new Error(msg)}

await run('Inje preset locks full roadmap and creates anonymous code',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  await page.waitForSelector('h2');
  assert((await page.locator('h2').first().textContent()).includes('Career Start'),'Career Start did not load');
  const full=page.locator('.modeCard[data-mode="full"]');
  const selective=page.locator('.modeCard[data-mode="selective"]');
  assert(await full.evaluate(el=>el.classList.contains('on')),'Full roadmap not selected');
  assert((await selective.evaluate(el=>getComputedStyle(el).pointerEvents))==='none','Selective mode is not locked');
  await page.locator('#makeCodeBtn').click();
  const code=(await page.locator('#anonCode').textContent()).trim();
  assert(/^JF26-[A-Z2-9]{6}$/.test(code),`Unexpected anonymous code: ${code}`);
  await page.locator('#age').fill('22');
  await page.locator('#gender').selectOption({label:'여성'});
  await page.locator('#grade').selectOption({label:'3학년'});
  await page.locator('#jobDecision').selectOption({label:'탐색 중'});
  await page.locator('#aiFrequency').selectOption({label:'주 1–2회'});
  await page.locator('#aiRule').fill('AI는 탐색과 구조화에 활용하고 경험의 사실과 최종 판단은 내가 확인한다.');
  await page.locator('#saveStart').click();
  await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('#age').inputValue()==='22','Age did not persist after reload');
  assert((await page.locator('#anonCode').textContent()).trim()===code,'Anonymous code did not persist');
});

await run('Instructor can force S assessment',async page=>{
  await page.goto(`${base}?course=INJE2026&interest=S`,{waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="1"]').click();
  await page.waitForSelector('h2');
  assert((await page.locator('h2').first().textContent()).includes('Career DNA'),'Career DNA did not load');
  const selected=page.locator('.choiceCard.on');
  assert((await selected.textContent()).includes('고용24 S형'),'S assessment not forced');
  assert((await page.locator('body').textContent()).includes('지정검사는 S형'),'S assignment notice missing');
});

await run('Instructor can force L assessment',async page=>{
  await page.goto(`${base}?course=INJE2026&interest=L`,{waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="1"]').click();
  await page.waitForSelector('h2');
  const selected=page.locator('.choiceCard.on');
  assert((await selected.textContent()).includes('고용24 L형'),'L assessment not forced');
  assert((await page.locator('body').textContent()).includes('L형 성격 5요인'),'L personality fields missing');
});

await run('All STEP 0–13 modules load without page errors',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});
  for(let i=0;i<=13;i++){
    await page.locator(`.stepBtn[data-step="${i}"]`).click();
    await page.waitForTimeout(100);
    const heading=(await page.locator('#stepRoot h2').first().textContent())||'';
    assert(heading.trim().length>0,`STEP ${i} has no heading`);
    const body=(await page.locator('#stepRoot').textContent())||'';
    assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${i} failed to load`);
  }
});

await run('Mobile layout loads core navigation',async page=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  assert(await page.locator('.stepBtn').count()===14,'Mobile navigation does not contain 14 steps');
  assert(await page.locator('#makeCodeBtn').isVisible(),'Anonymous code button not visible on mobile');
});

await browser.close();
if(failed)process.exit(1);

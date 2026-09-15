import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(x,msg){if(!x)throw new Error(msg)}

async function runFlow(name,viewport){
  const context=await browser.newContext({viewport,acceptDownloads:true});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.waitForSelector('#stepRoot h2');
    assert(new URL(page.url()).searchParams.get('measures')==='false','Current semester must force measures=false');
    assert((await page.locator('#heroMeta').textContent()).includes('수업 INJE2026'),'INJE2026 meta missing');
    assert(!(await page.locator('#heroMeta').textContent()).includes('PRE/POST 측정'),'PRE/POST label must not appear this semester');
    const body=(await page.locator('#stepRoot').textContent())||'';
    assert(body.includes('오늘 할 일은 6개입니다.'),'Week1 no-research flow copy missing');
    assert(!body.includes('대학생진로준비도검사 화면 열기'),'Research PRE measure must not render');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===0,'K-CAAS PRE must not render');
    assert(await page.locator('[data-measure="pre-work24"]').count()===0,'Work24 PRE must not render');
    assert((await page.locator('#stepRoot .sectionHead .badge').first().textContent())==='1주차 · 120분','Week1 duration badge incorrect');
    assert(await page.locator('#backupNowBtn').isDisabled(),'Backup must be disabled before anon code');

    await page.locator('#makeCodeBtn').click();await page.waitForFunction(()=>document.querySelector('#makeCodeBtn')?.disabled===true);
    const code=(await page.locator('#anonCode').textContent()).trim();assert(/^JF26-[A-Z2-9]{6}$/.test(code),'Anonymous code format incorrect');
    await page.locator('#age').fill('22');await page.locator('#grade').selectOption({label:'3학년'});await page.locator('#jobDecision').selectOption({label:'탐색 중'});await page.locator('#prepStage').selectOption({label:'정보탐색'});
    await page.locator('#careerStartStatement').fill('관심 직무를 탐색하면서 내 경험을 직무와 연결해야 하는 상태이다.');await page.locator('#careerStartAction').fill('관심 직무 3개의 실제 업무를 비교한다.');
    await page.locator('#saveStart').click();await page.waitForFunction(()=>document.querySelector('.stepBtn[data-step="0"] .stepN')?.textContent==='✓');

    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(!stored.research?.measurements?.pre?.capturedAt,'No research PRE data should be captured');
    assert(stored.artifacts?.careerStartProfile?.statement,'Career Start statement missing');

    const downloadPromise=page.waitForEvent('download');await page.locator('#backupNowBtn').click();const download=await downloadPromise;const path=await download.path();const backup=JSON.parse(await readFile(path,'utf8'));
    assert(backup.profile?.anonCode===code,'Backup anon code mismatch');assert(backup.profile?.courseCode==='INJE2026','Backup lost course');assert(!backup.research?.measurements?.pre?.capturedAt,'Backup must not contain newly collected PRE data');

    await page.reload({waitUntil:'networkidle'});assert((await page.locator('#anonCode').textContent()).trim()===code,'Anon code changed after reload');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Horizontal overflow ${overflow}px`);
    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}

await runFlow('Inje no-research classroom desktop',{width:1280,height:1000});
await runFlow('Inje no-research classroom mobile',{width:390,height:844});
await browser.close();if(failed)process.exit(1);

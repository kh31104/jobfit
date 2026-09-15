import { chromium } from 'playwright';

const base=process.env.JOBFIT_LIVE_URL||'https://kh31104.github.io/jobfit/?course=INJE2026';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(value,message){if(!value)throw new Error(message)}

async function run(name,viewport){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{
    await page.goto(base,{waitUntil:'networkidle',timeout:60000});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','course=INJE2026 was not preserved');
    assert(new URL(page.url()).searchParams.get('measures')==='false','Current semester must keep research measures off');
    assert(await page.locator('.stepBtn').count()===14,'Student navigation must contain 14 steps');
    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt');await page.waitForSelector('[data-anchor-item]');
    const body=(await page.locator('#stepRoot').textContent())||'';
    for(const text of ['Balance Game','Career Anchor','내가 생각하는 나의 강점','VIA 성격강점','다중지능검사','내가 생각하는 나 × 검사에서 나타난 나','AI 통합분석','Career DNA 가설 v1'])assert(body.includes(text),`Missing deployed module: ${text}`);
    assert(!body.includes('직업선호도검사'),'Legacy Work24 S/L content remains in deployed Week3');
    assert((await page.locator('[data-anchor-item]').count())===240,'Deployed Career Anchor must expose 40 items x 6 choices');
    assert((await page.locator('#makePrompt').textContent()).includes('자기이해 통합하기'),'Week3 prompt button label incorrect');

    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Mobile horizontal overflow detected: ${overflow}px`)}

    for(const i of [0,1,2,3,4])await page.locator('[data-strength]').nth(i).click();
    await page.locator('#via_0').fill('학구열');await page.locator('#via_1').fill('신중성');await page.locator('#mi_0').selectOption({label:'자기성찰지능'});await page.locator('#compare_repeat').fill('학습과 신중함이 반복해서 보인다.');
    await page.locator('#makePrompt').click();const prompt=(await page.locator('#promptBox').textContent())||'';
    assert(prompt.includes('[내가 생각하는 나의 강점]'),'Self-strength module missing from deployed prompt');assert(prompt.includes('[VIA 성격강점]'),'VIA missing from deployed prompt');assert(prompt.includes('[다중지능]'),'MI missing from deployed prompt');assert(prompt.includes('이번 단계는 인터뷰가 아니라'),'Week3 must be one-shot integration, not interview');assert(prompt.includes('직업을 추천하지 않는다.'),'No-job-recommendation guard missing');assert(!/\bNaN\b|\bnull\b|undefined/.test(prompt),'Prompt contains invalid placeholder values');

    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved?.assessments?.careerDNA?.promptMeta?.version==='career-dna-standard-v1','Prompt version not persisted');
    await page.locator('#saveDNA').click();await page.waitForTimeout(100);const saved2=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved2?.assessments?.careerDNA?.interest?.type==='STANDARD','STEP1 compatibility completion marker missing');

    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(error){failed=true;console.error(`FAIL ${name}\n${error.stack||error}`)}finally{await context.close()}
}

await run('live production desktop Career DNA standard set',{width:1280,height:1000});
await run('live production mobile Career DNA standard set',{width:390,height:844});
await browser.close();if(failed)process.exit(1);

import { chromium } from 'playwright';

const base=process.env.JOBFIT_LIVE_URL||'https://kh31104.github.io/jobfit/?course=INJE2026';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(value,message){if(!value)throw new Error(message)}
function moduleHead(page,title){return page.locator('.careerDnaStandard .moduleHead').filter({has:page.locator('h3',{hasText:title})}).first()}
async function expandModule(page,title){const head=moduleHead(page,title);if((await head.getAttribute('aria-expanded'))!=='true')await head.click()}
async function waitCareerUx(page){await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===8&&document.querySelectorAll('.careerDnaStandard .jobfitModuleStatus').length===8&&!!document.querySelector('.jobfitStepProgressText'))}

async function run(name,viewport){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{
    await page.goto(base,{waitUntil:'networkidle',timeout:60000});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','course=INJE2026 was not preserved');
    assert(new URL(page.url()).searchParams.get('measures')==='true','INJE2026 STEP0 PRE must stay enabled');
    assert(await page.locator('.stepBtn').count()===14,'Student navigation must contain 14 steps');

    await page.waitForSelector('#preMeasureSave',{timeout:30000});
    const step0=(await page.locator('#stepRoot').textContent())||'';
    assert(step0.includes('오늘 할 일은 7개뿐입니다.'),'Deployed STEP0 must keep seven-stage sequence');
    const journey=(await page.locator('.journeyStrip span').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(journey.length===7,'Deployed STEP0 journey must contain seven stages');
    assert(journey[0].includes('수업 연결')&&journey[1].includes('Jobfit 참여코드')&&journey[2].includes('기본정보')&&journey[3].includes('현재 준비상태')&&journey[4].includes('AI Check-in')&&journey[5].includes('PRE 측정')&&journey[6].includes('백업'),'Deployed STEP0 stage order changed');
    assert(await page.locator('[data-measure="pre-work24"]').count()===14,'Deployed Work24 PRE must expose 14 score inputs');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'Deployed K-CAAS PRE must expose 12 items');
    assert(((await page.locator('#heroMeta').textContent())||'').includes('PRE/POST 측정'),'Deployed PRE/POST status label missing');

    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt',{state:'attached'});await page.waitForSelector('[data-anchor-item]',{state:'attached'});await waitCareerUx(page);
    const body=(await page.locator('#stepRoot').textContent())||'';
    for(const text of ['Balance Game','Career Anchor','내가 생각하는 나의 강점','VIA 성격강점','다중지능검사','내가 생각하는 나 × 검사에서 나타난 나','AI 통합분석','Career DNA 가설 v1'])assert(body.includes(text),`Missing deployed module: ${text}`);
    assert(body.includes('밸런스게임'),'Korean-first Balance Game label missing');
    assert(body.includes('커리어 앵커'),'Korean-first Career Anchor label missing');
    assert(!body.includes('직업선호도검사'),'Legacy Work24 S/L content remains in deployed Week3');
    assert((await page.locator('[data-anchor-item]').count())===240,'Deployed Career Anchor must expose 40 items x 6 choices');
    assert((await page.locator('.careerDnaStandard .jobfitModuleToggle[aria-expanded="false"]').count())===8,'Deployed Career DNA modules must start collapsed');
    assert((await page.locator('.careerDnaStandard .jobfitModuleStatus').count())===8,'Module progress badges missing');
    assert((await page.locator('.jobfitReturnGuide').count())===2,'External-test return guidance missing');
    assert((await page.locator('.jobfitStepProgressText').textContent()).includes('0/8 완료'),'Initial Career DNA progress text incorrect');
    assert((await page.locator('#makePrompt').textContent()).includes('SWOT 통합분석'),'Week3 SWOT prompt button label incorrect');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Week3 mobile horizontal overflow detected: ${overflow}px`)}

    // Student safety: an unfinished STEP1 input must be saved before navigating away.
    await expandModule(page,'내가 생각하는 나의 강점');await page.locator('[data-strength]').nth(0).click();
    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('#saveRoadmap');
    const autoSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner'))?.assessments?.careerDNA?.selfStrengths||[]);assert(autoSaved.length===1,'Dirty STEP1 input was not saved before navigation');
    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt',{state:'attached'});await waitCareerUx(page);

    await expandModule(page,'내가 생각하는 나의 강점');for(const i of [1,2,3,4])await page.locator('[data-strength]').nth(i).click();
    await expandModule(page,'VIA 성격강점');await page.locator('#via_0').fill('학구열');await page.locator('#via_1').fill('신중성');
    await expandModule(page,'다중지능검사');await page.locator('#mi_0').selectOption({label:'자기성찰지능'});
    await expandModule(page,'내가 생각하는 나 × 검사에서 나타난 나');await page.locator('#compare_repeat').fill('학습과 신중함이 반복해서 보인다.');
    await expandModule(page,'AI 통합분석');assert((await page.locator('.jobfitAiReadiness').textContent()).includes('분석 준비도'),'AI readiness guidance missing');await page.locator('#makePrompt').click();await page.waitForFunction(()=>document.querySelector('#promptBox')?.textContent?.includes('자소서 소재 연결표 3개'));const prompt=(await page.locator('#promptBox').textContent())||'';
    assert(prompt.includes('[내가 생각하는 나의 강점]'),'Self-strength module missing from deployed prompt');assert(prompt.includes('[VIA 성격강점]'),'VIA missing from deployed prompt');assert(prompt.includes('[다중지능]'),'MI missing from deployed prompt');assert(prompt.includes('이번 단계는 인터뷰가 아니라'),'Week3 must be one-shot integration, not interview');assert(prompt.includes('직업을 추천하지 않는다.'),'No-job-recommendation guard missing');assert(prompt.includes('[추가 출력 · 자기소개서 활용 키워드 + SWOT]'),'Deployed SWOT extension missing');assert(prompt.includes('약점/보완 키워드 3개'),'Deployed weakness keyword output missing');assert(prompt.includes('SO 전략'),'Deployed SWOT strategy output missing');assert(prompt.includes('자소서 소재 연결표 3개'),'Resume material mapping table missing');assert(prompt.includes('바로 활용 가능 / 경험 확인 필요'),'Resume evidence classification missing');assert(prompt.includes('STEP 2 경험 확인 필요'),'STEP2 evidence guard missing');assert(prompt.includes('완성된 자소서 문장을 쓰지 않는다'),'Unsupported finished cover-letter sentence guard missing');assert(!/\bNaN\b|\bnull\b|undefined/.test(prompt),'Prompt contains invalid placeholder values');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved?.assessments?.careerDNA?.promptMeta?.version==='career-dna-standard-v1','Prompt version not persisted');
    await page.locator('#saveDNA').click();await page.waitForTimeout(100);const saved2=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved2?.assessments?.careerDNA?.interest?.type==='STANDARD','STEP1 compatibility completion marker missing');

    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('#saveRoadmap');
    const week4=(await page.locator('#stepRoot').textContent())||'';
    for(const text of ['나의 경험에서 직무역량 찾기','지난주 Career DNA 간단히 확인','My Best 3 Experience','AI Experience Interview','행동 → 판단 → 결과 → 증거','강점·역량 키워드와 행동근거','Experience Map'])assert(week4.includes(text),`Missing deployed Week4 module: ${text}`);
    for(const removed of ['Career Story','Career Theme','Career Direction','1개월 Career Experiment'])assert(!week4.includes(removed),`Removed Week4 module remains deployed: ${removed}`);
    assert(await page.locator('#makeInterviewPrompt').count()===1,'Week4 evidence interview control missing');
    assert(await page.locator('#saveRoadmap').count()===1,'Week4 Experience Map save control missing');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Week4 mobile horizontal overflow detected: ${overflow}px`)}

    await page.locator('.stepBtn[data-step="3"]').click();await page.waitForSelector('#jobPrompt');
    const week6=(await page.locator('#stepRoot').textContent())||'';
    for(const text of ['강점·경험역량을 직무 후보로 연결하기','나의 직무탐색 근거 확인','AI 직무탐색 프롬프트','직무 후보 Pool','Target Job 1·2·3 직접 선택'])assert(week6.includes(text),`Missing deployed Week6 STEP3 module: ${text}`);
    const jobPrompt=await page.locator('#jobPrompt').inputValue();
    assert(jobPrompt.includes('[3주차 Career DNA]'),'Week6 prompt missing Career DNA bridge');
    assert(jobPrompt.includes('[4주차 Experience Map]'),'Week6 prompt missing Experience Map bridge');
    assert(jobPrompt.includes('Task·KSA·KPI'),'Week6 prompt missing Task/KSA/KPI validation');
    assert(!jobPrompt.includes('RIASEC'),'Legacy RIASEC dependency remains in Week6 prompt');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Week6 STEP3 mobile horizontal overflow detected: ${overflow}px`)}

    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(error){failed=true;console.error(`FAIL ${name}\n${error.stack||error}`)}finally{await context.close()}
}

await run('live production desktop STEP0-Week6 alignment',{width:1280,height:1000});
await run('live production mobile STEP0-Week6 alignment',{width:390,height:844});
await browser.close();if(failed)process.exit(1);

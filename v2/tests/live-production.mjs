import { chromium } from 'playwright';

const base=process.env.JOBFIT_LIVE_URL||'https://kh31104.github.io/jobfit/?course=INJE2026';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(value,message){if(!value)throw new Error(message)}
function moduleHead(page,title){return page.locator('.careerDnaStandard .moduleHead').filter({has:page.locator('h3',{hasText:title})}).first()}
async function expandModule(page,title){const head=moduleHead(page,title);if((await head.getAttribute('aria-expanded'))!=='true')await head.click()}
async function waitCareerUx(page){await page.waitForFunction(()=>document.querySelectorAll('.careerDnaStandard .jobfitModuleToggle').length===7&&document.querySelectorAll('.careerDnaStandard .jobfitModuleStatus').length===7&&!!document.querySelector('.jobfitStepProgressText'))}

async function run(name,viewport){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{
    await page.goto(base,{waitUntil:'networkidle',timeout:60000});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','course=INJE2026 was not preserved');
    assert(new URL(page.url()).searchParams.get('measures')==='true','INJE2026 STEP0 PRE must stay enabled');
    assert(await page.locator('.stepBtn').count()===12,'Student navigation must contain 12 steps after duplicate JD/Asset removal');
    const navText=(await page.locator('#stepNav').textContent())||'';
    assert(!navText.includes('주차'),'Student navigation must not show week labels');
    const navItems=(await page.locator('.stepBtn').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(navItems[0].includes('STEP 1 · Career Start'),'Student navigation must start at STEP 1');
    assert(navItems[11].includes('STEP 12 · AI Job Portfolio'),'Student navigation must be sequential through STEP 12');

    await page.waitForSelector('#preMeasureSave',{timeout:30000});
    const step0=(await page.locator('#stepRoot').textContent())||'';
    assert(step0.includes('오늘 할 일은 7개뿐입니다.'),'Deployed STEP0 must keep seven-stage sequence');
    assert(step0.includes('수업 데이터 저장 안내'),'Deployed STEP0 central storage notice missing');
    assert(step0.includes('별도 연구참여 동의'),'Deployed STEP0 future research consent notice missing');
    const journey=(await page.locator('.journeyStrip span').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(journey.length===7,'Deployed STEP0 journey must contain seven stages');
    assert(journey[0].includes('수업 연결')&&journey[1].includes('익명코드')&&journey[2].includes('기본정보')&&journey[3].includes('현재 준비상태')&&journey[4].includes('AI Check-in')&&journey[5].includes('PRE 측정')&&journey[6].includes('백업'),'Deployed STEP0 stage order changed');
    assert(await page.locator('[data-measure="pre-work24"]').count()===14,'Deployed Work24 PRE must expose 14 score inputs');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'Deployed K-CAAS PRE must expose 12 items');
    assert(((await page.locator('#heroMeta').textContent())||'').includes('PRE/POST 측정'),'Deployed PRE/POST status label missing');
    for(const id of ['careerStartStatement','careerStartAssets','careerStartGap','careerStartAction'])assert(await page.locator('#'+id).count()===1,`Deployed STEP0 summary field missing: ${id}`);

    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt',{state:'attached'});await page.waitForSelector('[data-anchor-item]',{state:'attached'});await waitCareerUx(page);
    const body=(await page.locator('#stepRoot').textContent())||'';
    for(const text of ['Balance Game','Career Anchor','내가 생각하는 나의 강점','VIA 성격강점','내가 생각하는 나 × 검사에서 나타난 나','AI 통합분석','Career DNA 가설 v1'])assert(body.includes(text),`Missing deployed module: ${text}`);
    assert(body.includes('밸런스게임'),'Korean-first Balance Game label missing');
    assert(body.includes('커리어 앵커'),'Korean-first Career Anchor label missing');
    assert(!body.includes('직업선호도검사'),'Legacy Work24 S/L content remains in deployed Week3');
    assert((await page.locator('[data-anchor-item]').count())===240,'Deployed Career Anchor must expose 40 items x 6 choices');
    assert((await page.locator('.careerDnaStandard .jobfitModuleToggle[aria-expanded="false"]').count())===7,'Deployed Career DNA modules must start collapsed');
    assert((await page.locator('.careerDnaStandard .jobfitModuleStatus').count())===7,'Module progress badges missing');
    assert((await page.locator('.jobfitReturnGuide').count())===1,'VIA return guidance missing');
    assert((await page.locator('.jobfitStepProgressText').textContent()).includes('0/7 완료'),'Initial Career DNA progress text incorrect');
    assert((await page.locator('#makePrompt').textContent()).includes('SWOT 통합분석'),'Week3 SWOT prompt button label incorrect');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Week3 mobile horizontal overflow detected: ${overflow}px`)}

    // Student safety: an unfinished STEP1 input must be saved before navigating away.
    await expandModule(page,'내가 생각하는 나의 강점');await page.locator('[data-strength]').nth(0).click();
    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('#saveRoadmap');
    const autoSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner'))?.assessments?.careerDNA?.selfStrengths||[]);assert(autoSaved.length===1,'Dirty STEP1 input was not saved before navigation');
    await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('#makePrompt',{state:'attached'});await waitCareerUx(page);

    await expandModule(page,'내가 생각하는 나의 강점');for(const i of [1,2,3,4])await page.locator('[data-strength]').nth(i).click();
    await expandModule(page,'VIA 성격강점');await page.locator('#via_0').fill('학구열');await page.locator('#via_1').fill('신중성');
    await expandModule(page,'내가 생각하는 나 × 검사에서 나타난 나');await page.locator('#compare_repeat').fill('학습과 신중함이 반복해서 보인다.');
    await expandModule(page,'AI 통합분석');assert((await page.locator('.jobfitAiReadiness').textContent()).includes('분석 준비도'),'AI readiness guidance missing');await page.locator('#makePrompt').click();await page.waitForFunction(()=>document.querySelector('#promptBox')?.textContent?.includes('자소서 소재 연결표 3개'));const prompt=(await page.locator('#promptBox').textContent())||'';
    assert(prompt.includes('[내가 생각하는 나의 강점]'),'Self-strength module missing from deployed prompt');assert(prompt.includes('[VIA 성격강점]'),'VIA missing from deployed prompt');assert(!prompt.includes('[다중지능]'),'Removed MI must not appear in deployed prompt');assert(prompt.includes('이번 단계는 인터뷰가 아니라'),'Week3 must be one-shot integration, not interview');assert(prompt.includes('직업을 추천하지 않는다.'),'No-job-recommendation guard missing');assert(prompt.includes('[추가 출력 · 자기소개서 활용 키워드 + SWOT]'),'Deployed SWOT extension missing');assert(prompt.includes('약점/보완 키워드 3개'),'Deployed weakness keyword output missing');assert(prompt.includes('SO 전략'),'Deployed SWOT strategy output missing');assert(prompt.includes('자소서 소재 연결표 3개'),'Resume material mapping table missing');assert(prompt.includes('바로 활용 가능 / 경험 확인 필요'),'Resume evidence classification missing');assert(prompt.includes('STEP 2 경험 확인 필요'),'STEP2 evidence guard missing');assert(prompt.includes('완성된 자소서 문장을 쓰지 않는다'),'Unsupported finished cover-letter sentence guard missing');assert(!/\bNaN\b|\bnull\b|undefined/.test(prompt),'Prompt contains invalid placeholder values');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved?.assessments?.careerDNA?.promptMeta?.version==='career-dna-standard-v1','Prompt version not persisted');
    await page.locator('#saveDNA').click();await page.waitForTimeout(100);const saved2=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(saved2?.assessments?.careerDNA?.interest?.type==='STANDARD','STEP1 compatibility completion marker missing');

    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('#saveRoadmap');
    const week4=(await page.locator('#stepRoot').textContent())||'';
    const week4Expected=['대표 경험 선택','AI 경험 인터뷰','STAR 사실확인','역량 확인','Experience & Competency Map'];
    const week4Actual=(await page.locator('.experienceCompetencyWeek4 > .block > .moduleHead h3').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(week4Actual.length===5,`Deployed STEP3 must contain exactly 5 modules, found ${week4Actual.length}: ${week4Actual.join(' | ')}`);
    week4Expected.forEach((title,i)=>assert(week4Actual[i]===title,`Deployed Week4 order mismatch at ${i+1}: expected ${title}, got ${week4Actual[i]||'missing'}`));
    assert(await page.locator('.strengthMeasurePanel').count()===0,'Deployed STEP2 must not render the pre-experience 9-item strength measure');
    assert(await page.locator('#situation').count()===1,'Deployed STEP2 04 must include S Situation field');
    assert(await page.locator('[data-measure="pre-sudco"]').count()===0,'Deployed STEP2 must not render pre-SUDCO items');
    assert(!week4.includes('경험 분석 전 강점행동 9문항'),'Legacy STEP2 9-item strength measure copy remains deployed');
    for(const removed of ['Career Story','Career Theme','Career Direction','1개월 Career Experiment'])assert(!week4.includes(removed),`Removed Week4 module remains deployed: ${removed}`);
    assert(await page.locator('#makeInterviewPrompt').count()===1,'STEP3 evidence interview control missing');
    assert(await page.locator('#nextStep').count()===1,'STEP3 → STEP4 handoff control missing');
    await page.locator('#goBest3').click();assert(await page.locator('#best3_best_title').isVisible(),'Deployed 01 → 02 route is broken or detoured');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Week4 mobile horizontal overflow detected: ${overflow}px`)}

    await page.locator('.stepBtn[data-step="3"]').click();await page.waitForSelector('#jobPrompt');
    const week6=(await page.locator('#stepRoot').textContent())||'';
    const step3Expected=['나의 직무탐색 근거 확인','직장에서 해보고 싶은 일','관심 산업·분야','직무 후보 찾기','Target Job 선택'];
    const step3Actual=(await page.locator('.jobExplorerV3 > .block > .moduleHead h3').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(step3Actual.length===5,`Deployed STEP3 must contain exactly 5 modules, found ${step3Actual.length}: ${step3Actual.join(' | ')}`);
    step3Expected.forEach((title,i)=>assert(step3Actual[i]===title,`Deployed STEP3 order mismatch at ${i+1}: expected ${title}, got ${step3Actual[i]||'missing'}`));
    assert(week6.includes('내가 탐색할 직무 찾기'),'Simplified STEP3 heading missing');
    assert(!week6.includes('내가 이 직무를 어떻게 생각하는가'),'Deleted STEP3 rating/reflection module returned');
    const jobPrompt=await page.locator('#jobPrompt').inputValue();
    assert(jobPrompt.includes('[STEP 2 Career DNA · 보조근거]'),'STEP4 prompt missing Career DNA bridge');
    assert(jobPrompt.includes('[STEP 3 경험 근거 · 우선근거]'),'STEP4 prompt missing STEP3 Evidence bridge');
    assert(jobPrompt.includes('후보는 4~5개만 제안'),'STEP3 prompt must limit job candidates');
    assert(jobPrompt.includes('특정 산업, 특히 에너지 산업을 기본값으로 두지 않는다'),'STEP3 prompt lost industry-neutral guard');
    assert(jobPrompt.includes('실제 Task·요구기술·기업조건은 STEP 5에서 공식자료로 확인'),'STEP4→5 validation boundary missing');
    assert(jobPrompt.includes('적합도 %, 추천순위, 취업성공확률을 만들지 않는다.'),'STEP3 prompt lost no-fit-percentage guard');
    assert(jobPrompt.includes('표 금지.'),'STEP3 prompt must forbid table output');
    assert(jobPrompt.includes('JSON 금지.'),'STEP3 prompt must forbid JSON output');
    assert(jobPrompt.includes('첫 줄부터 [후보 1]로 시작'),'STEP3 prompt must start directly with copy-friendly candidate text');
    assert(jobPrompt.includes('[후보 1]'),'STEP3 prompt missing copy-friendly bullet format');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`STEP3 mobile horizontal overflow detected: ${overflow}px`)}

    // Student flow: choose a Target Job, then confirm that STEP 4 is the compact FLEX-style JD flow.
    await page.evaluate(()=>{
      const key='jobfit:v2:learner',s=JSON.parse(localStorage.getItem(key));
      s.activeStep=4;s.artifacts=s.artifacts||{};
      s.artifacts.jobExplorer={
        ...(s.artifacts.jobExplorer||{}),
        candidates:[{id:'job_live_1',title:'생산기술',family:'생산·품질',summary:'생산공정을 안정적으로 운영하고 개선하는 직무'}],
        targets:['job_live_1'],
        targetCombos:[{id:'target_live_1',jobId:'job_live_1',industry:'자동차·모빌리티',priority:1}],
        targetReason:'공정 문제를 분석하고 개선하는 일을 더 알아보고 싶다.'
      };
      localStorage.setItem(key,JSON.stringify(s));
    });
    await page.reload({waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#companyName');
    const step4Body=(await page.locator('#stepRoot').textContent())||'';
    const step4Expected=['Target Job','Find JD','Choose JD','선택 직무 AI 분석','직무분석 테이블 완성','완성된 직무분석표','My Spec','GAP Match'];
    const step4Actual=(await page.locator('.jobAnalysisInje > #analysisRoot > .block > .moduleHead h3').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(step4Actual.length===8,`Deployed STEP5 must contain exactly 8 modules, found ${step4Actual.length}: ${step4Actual.join(' | ')}`);
    step4Expected.forEach((title,i)=>assert(step4Actual[i]===title,`Deployed STEP5 order mismatch at ${i+1}: expected ${title}, got ${step4Actual[i]||'missing'}`));
    assert(step4Body.includes('생산기술 × 자동차·모빌리티'),'STEP3 Target Job did not carry into STEP4');
    assert(!step4Body.includes('My Evidence'),'STEP4 must not expose the removed duplicate My Evidence step');
    assert(step4Body.includes('STEP 3의 경험근거는 자동으로 불러오고'),'STEP5 should explain that prior evidence is reused automatically');
    assert(await page.locator('.jdSiteLink').count()===5,'STEP4 Find JD must expose five recruitment-site links');
    const jdSites=(await page.locator('.jdSiteGrid').allTextContents()).join(' ');
    for(const name of ['사람인','잡코리아','고용24','잡알리오','클린아이 잡플러스'])assert(jdSites.includes(name),`STEP4 missing recruitment site: ${name}`);
    assert(await page.locator('#jdSearchPrompt').isVisible(),'STEP4 AI JD search prompt must be visible without opening another disclosure');
    const jdSearchPrompt=await page.locator('#jdSearchPrompt').inputValue();
    assert(jdSearchPrompt.includes('생산기술')&&jdSearchPrompt.includes('자동차·모빌리티'),'STEP4 JD search prompt lost current target context');
    assert(jdSearchPrompt.includes('첫 줄부터 [공고 1]로 시작'),'STEP4 JD search prompt must start with plain-text posting output');
    assert(jdSearchPrompt.includes('확인 기준일:')&&jdSearchPrompt.includes('대한민국 표준시, KST'),'STEP5 JD search prompt must use the current KST date');
    assert(jdSearchPrompt.includes('최대 3개'),'STEP5 Find JD must limit search output to three postings');
    assert(await page.locator('#jobAiPrompt').isVisible(),'STEP5 selected-job analysis prompt must be visible');
    assert(await page.locator('#jobCustomerKpi').count()===1&&await page.locator('#jobCompetencies').count()===1,'STEP5 five-field job-analysis editor must be present');
    assert(await page.locator('#specCertificates').count()===1&&await page.locator('#specLanguage').count()===1&&await page.locator('#specTools').count()===1,'STEP5 My Spec inputs must be present');
    assert(await page.locator('#copyDeepPrompt').isDisabled(),'STEP5 GAP analysis must stay locked before the job table and My Spec are complete');
    if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`STEP4 mobile horizontal overflow detected: ${overflow}px`)}

    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(error){failed=true;console.error(`FAIL ${name}\n${error.stack||error}`)}finally{await context.close()}
}

await run('live production desktop STEP0-Week6 alignment',{width:1280,height:1000});
await run('live production mobile STEP0-Week6 alignment',{width:390,height:844});
await browser.close();if(failed)process.exit(1);

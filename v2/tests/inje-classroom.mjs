import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(x,msg){if(!x)throw new Error(msg)}
const mockBundle={schemaVersion:'jobfit-research-measures-v1',kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'테스트 K-CAAS-SF',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`테스트 K 문항 ${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'테스트 SUDCO',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:Array.from({length:9},(_,i)=>`테스트 S 문항 ${i+1}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}};

async function runFlow(name,viewport){
  const context=await browser.newContext({viewport,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/functions/v1/research-measures',async route=>{const body=route.request().postDataJSON?.()||{};if(!String(body.access_code||''))return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'invalid_access'})});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:body.course,measures:mockBundle})})});
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
    await page.waitForSelector('#stepRoot h2');
    await page.waitForFunction(()=>document.querySelector('#stepRoot .sectionHead .badge')?.textContent==='1주차 · 120분');

    assert((await page.locator('#stepRoot h2').first().textContent()).includes('Career Start'),'STEP 0 Career Start did not load');
    assert((await page.locator('#heroMeta').textContent()).includes('수업 INJE2026'),'INJE2026 meta missing');
    assert((await page.locator('#heroMeta').textContent()).includes('PRE/POST 측정'),'PRE/POST measure preset missing');
    assert(await page.locator('#researchExportBtn').evaluate(el=>el.classList.contains('hidden')),'Top research export button should be hidden in Inje classroom view');
    assert(await page.locator('.researchTask').count()===1&&await page.locator('.researchTask').isHidden(),'Research export task should be hidden, not removed, in week 1 classroom flow');
    assert(await page.locator('.centralResearchTask.disabledTask').count()===1&&await page.locator('.centralResearchTask.disabledTask').isHidden(),'Disabled central research submission should be hidden in week 1 classroom flow');
    assert((await page.locator('#stepRoot .sectionHead .badge').first().textContent())==='1주차 · 120분','Week 1 duration badge not updated');
    assert(await page.locator('.researchAccessGate').count()===1,'Restricted measure access gate missing');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===0,'Research scale must not render before authorization');
    await page.locator('.researchAccessCode').fill('test-only-code');
    await page.locator('.researchAccessBtn').click();
    await page.waitForSelector('[data-measure="pre-kcaas"]');

    const body=(await page.locator('#stepRoot').textContent())||'';
    assert(body.includes('한국판 원문 확인 · PRE/POST 동일'),'Verified scale provenance label missing');
    assert(body.includes('연구자료 제출은 1주차에 하지 않습니다.'),'Week 1 research submission exclusion notice missing');
    assert(body.includes('중앙 연구 DB로 전송되지 않습니다.'),'Classroom local-only storage notice missing');
    assert(body.includes('수업 전 고용24 로그인 상태를 확인하세요.'),'Work24 login preflight hint missing');
    assert(body.includes('코드는 한 번만 발급됩니다.'),'Anonymous code one-time issue notice missing');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'K-CAAS-SF PRE 12 items missing');
    assert(await page.locator('[data-measure="pre-work24"]').count()===9,'Work24 PRE 9 result slots missing');
    assert(await page.locator('#backupNowBtn').isDisabled(),'Week 1 backup must be disabled before anonymous code exists');
    assert(await page.locator('#exportBtn').isDisabled(),'Top backup must be disabled before anonymous code exists');
    assert((await page.locator('.stepBtn[data-step="0"] .stepN').textContent())==='0','STEP 0 must not show complete before PRE');

    const work24Href=await page.getByRole('link',{name:/고용24 검사 페이지 열기/}).getAttribute('href');
    assert(work24Href==='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do','Work24 examination URL changed or is incorrect');

    await page.locator('#makeCodeBtn').click();
    await page.waitForFunction(()=>document.querySelector('#makeCodeBtn')?.disabled===true);
    const code=(await page.locator('#anonCode').textContent()).trim();
    assert(/^JF26-[A-Z2-9]{6}$/.test(code),'Anonymous code format is incorrect');
    assert((await page.locator('#makeCodeBtn').textContent()).includes('코드 유지됨'),'Anonymous code should lock after first issue');
    assert(!(await page.locator('#backupNowBtn').isDisabled()),'Backup should unlock after anonymous code is issued');
    assert(!(await page.locator('#exportBtn').isDisabled()),'Top backup should unlock after anonymous code is issued');
    let codeMeta=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).meta);
    assert(codeMeta.anonCodeLocked===true&&!!codeMeta.anonCodeIssuedAt,'Anonymous code lock metadata missing');

    await page.locator('#makeCodeBtn').evaluate(btn=>{btn.disabled=false;btn.click()});
    await page.waitForTimeout(80);
    assert((await page.locator('#anonCode').textContent()).trim()===code,'Anonymous code changed after forced reissue attempt');
    assert(await page.locator('#makeCodeBtn').isDisabled(),'Anonymous code button did not relock after forced reissue attempt');
    assert((await page.locator('#makeCodeBtn').textContent()).includes('코드 유지됨'),'Anonymous code locked label disappeared after forced reissue attempt');
    assert((await page.locator('#toast').textContent()).includes('이번 학기 동안 유지'),'Anonymous code reissue guard message missing');

    await page.locator('#age').fill('22');
    await page.locator('#grade').selectOption({label:'3학년'});
    await page.locator('#jobDecision').selectOption({label:'탐색 중'});
    await page.locator('#prepStage').selectOption({label:'정보탐색'});
    await page.locator('#careerStartStatement').fill('관심 직무를 탐색하면서 내 경험을 직무와 연결해야 하는 상태이다.');
    await page.locator('#careerStartAction').fill('관심 직무 3개의 실제 업무를 비교한다.');

    for(let i=0;i<9;i++)await page.locator('[data-measure="pre-work24"]').nth(i).fill(String(40+i));
    for(let i=0;i<12;i++)await page.locator('[data-measure="pre-kcaas"]').nth(i).fill(String((i%5)+1));

    await page.locator('#preMeasureSave').click();
    assert((await page.locator('#toast').textContent()).includes('고용24 검사일'),'Missing Work24 date was not blocked');
    let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(!stored.research?.measurements?.pre?.capturedAt,'PRE should not save when Work24 date is missing');

    await page.locator('#preWork24Date').fill('2026-09-07');
    await page.locator('[data-measure="pre-kcaas"]').first().fill('6');
    await page.locator('#preMeasureSave').click();
    assert((await page.locator('#preMeasureStatus').textContent()).includes('응답 범위를 확인'),'Out-of-range K-CAAS response was not blocked');
    stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(!stored.research?.measurements?.pre?.capturedAt,'PRE should not save an out-of-range K-CAAS response');

    await page.locator('[data-measure="pre-kcaas"]').first().fill('5');
    await page.locator('#preMeasureSave').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).research?.measurements?.pre?.kcaas?.items?.length===12);

    stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    const pre=stored.research.measurements.pre;
    assert(pre.work24JobReadiness.examDate==='2026-09-07','Work24 exam date was not stored');
    assert(pre.work24JobReadiness.scores.length===9&&pre.work24JobReadiness.scores[0]===40&&pre.work24JobReadiness.scores[8]===48,'Work24 9 scores were not stored correctly');
    assert(pre.kcaas.items.length===12&&pre.kcaas.items.every(v=>v>=1&&v<=5),'K-CAAS-SF stored values are incomplete or out of range');
    assert(pre.kcaas.wordingVersion==='K-CAAS-SF-KR-2020-v1'&&pre.kcaas.locked===true,'Locked K-CAAS-SF version metadata missing');
    assert((await page.locator('.stepBtn[data-step="0"] .stepN').textContent())==='0','STEP 0 should remain incomplete until Career Start fields are saved');

    await page.locator('#saveStart').click();
    await page.waitForFunction(()=>document.querySelector('.stepBtn[data-step="0"] .stepN')?.textContent==='✓');

    const downloadPromise=page.waitForEvent('download');
    await page.locator('#backupNowBtn').click();
    const download=await downloadPromise;
    assert(download.suggestedFilename().includes(code),'Backup filename does not contain the anonymous code');
    const downloadPath=await download.path();
    assert(!!downloadPath,'Backup file path was not created');
    const backup=JSON.parse(await readFile(downloadPath,'utf8'));
    assert(backup.profile?.anonCode===code,'Backup file anonymous code differs from the screen');
    assert(backup.meta?.anonCodeLocked===true&&!!backup.meta?.anonCodeIssuedAt,'Backup omitted anonymous code lock metadata');
    assert(backup.profile?.courseCode==='INJE2026'&&backup.profile?.institution==='인제대학교','Backup lost Inje course constraints');
    assert(backup.research?.measurements?.pre?.work24JobReadiness?.scores?.length===9,'Backup omitted Work24 PRE results');
    assert(backup.research?.measurements?.pre?.kcaas?.items?.length===12,'Backup omitted K-CAAS-SF PRE results');
    assert(backup.artifacts?.careerStartProfile?.statement,'Backup omitted Career Start statement');

    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#anonCode');
    assert((await page.locator('#anonCode').textContent()).trim()===code,'Anonymous code changed after reload');
    assert(await page.locator('#makeCodeBtn').isDisabled(),'Anonymous code reissue became available after reload');
    assert((await page.locator('#makeCodeBtn').textContent()).includes('코드 유지됨'),'Anonymous code locked label was lost after reload');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'Authorized measures should remain available during the same browser session');
    assert((await page.locator('.stepBtn[data-step="0"] .stepN').textContent())==='✓','Week 1 completion mark was lost after reload');

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert(overflow<=2,`Horizontal overflow detected at ${viewport.width}px viewport: ${overflow}px`);

    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(e){
    failed=true;
    console.error(`FAIL ${name}\n${e.stack||e}`);
  }finally{
    await context.close();
  }
}

await runFlow('Inje week 1 restricted student flow desktop',{width:1280,height:1000});
await runFlow('Inje week 1 restricted student flow mobile',{width:390,height:844});
await browser.close();
if(failed)process.exit(1);

import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const seed={
  assessments:{
    careerDNA:{
      standard:{version:'career-dna-standard-set-v1'},
      comparison:{repeat:'학습과 신중함이 반복된다.',verify:'협업에서도 같은 강점이 반복되는지 확인하고 싶다.'},
      reflection:{fit:'학습과 신중함이 반복된다.',question:'협업에서도 같은 강점이 반복되는지 확인하고 싶다.'},
      hypothesis:{text:'전문성을 깊게 쌓고 신중하게 판단하는 경향이 있을 가능성이 있다.',selfCheck:'어느 정도 맞음',version:'career-dna-hypothesis-v1'}
    },
    experienceCompetency:{
      experiences:[{
        id:'EXP-OLD',category:'수업·과제',title:'기존 경험',action:'자료를 비교했다',result:'발표안을 완성했다',
        evidence:'발표자료',evidenceGrade:'B · 타인의 피드백/평가로 확인',competencies:['분석'],
        competencyEvidence:[{keyword:'분석',evidence:'자료를 비교했다'}],factChecked:true
      }]
    }
  },
  artifacts:{experienceMap:[{id:'EXP-OLD',title:'기존 경험',action:'자료를 비교했다',result:'발표안을 완성했다',evidence:'발표자료',competencies:['분석'],competencyEvidence:[{keyword:'분석',evidence:'자료를 비교했다'}],factChecked:true}]}
};

function assert(x,m){if(!x)throw new Error(m)}
async function openFor(page,selector){
  await page.locator(selector).evaluate(el=>{
    const block=el.closest('.block');
    if(block&&!block.classList.contains('jobfitAccordionOpen'))block.querySelector('.jobfitAccordionTrigger')?.click();
  });
}
async function run(name,fn){
  const ctx=await browser.newContext({viewport:{width:1280,height:1100}});const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});page.on('dialog',d=>d.accept());
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
    await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),seed);
    await page.reload({waitUntil:'networkidle'});
    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('.experienceCompetencyWeek4');
    await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await ctx.close()}
}

await run('Week 4 focuses on Experience Map and keeps STEP1 bridge',async page=>{
  const body=(await page.locator('#stepRoot').textContent())||'';
  const expected=['대표 경험 선택','AI 경험 인터뷰','STAR 사실확인','역량 확인','Experience & Competency Map','Career Asset 저장'];
  const actual=await page.locator('.experienceCompetencyWeek4 > .block > .moduleHead h3').allTextContents();
  assert(actual.length===6,`STEP3 must have exactly 6 student modules, found ${actual.length}: ${actual.join(' | ')}`);
  expected.forEach((title,i)=>assert((actual[i]||'').trim().startsWith(title),`Week4 module order mismatch at ${i+1}: ${actual[i]||'missing'}`));
  assert(await page.locator('.strengthMeasurePanel').count()===0,'Pre-experience 9-item strength measure must not render in STEP2');
  assert(!body.includes('경험 분석 전 강점행동 9문항'),'Legacy 9-item strength measure copy remains in STEP2');
  for(const text of ['나의 경험에서 직무역량 찾기','Experience & Competency Map','STEP 4 직무탐색'])assert(body.includes(text),`Missing STEP3 module: ${text}`);
  for(const removed of ['Career Story','Career Theme','Career Direction','1개월 Career Experiment'])assert(!body.includes(removed),`Week4 should not include: ${removed}`);
  assert(body.includes('학습과 신중함이 반복된다.'),'STEP2 comparison bridge missing');
  assert(body.includes('전문성을 깊게 쌓고 신중하게 판단'),'STEP2 hypothesis bridge missing');
  assert(body.includes('기존 경험'),'Existing experience list must be preserved');
});

await run('Best3 representative switches to the experience the student actually selects',async page=>{
  await openFor(page,'#best3_best_title');
  await page.locator('#best3_best_title').fill('마케팅원론 팀플 고객 설문');
  await page.locator('#best3_best_summary').fill('설문 문항을 정리하고 응답을 분석했다.');
  await page.locator('#best3_flow_title').fill('학과 인스타그램 카드뉴스');
  await page.locator('#best3_flow_summary').fill('카드뉴스와 릴스를 직접 제작하고 게시했다.');
  await page.locator('#best3_recognition_title').fill('카페 신메뉴 안내판');
  await page.locator('#best3_recognition_summary').fill('고객 문의를 줄이기 위해 안내판을 제작했다.');

  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').inputValue()==='마케팅원론 팀플 고객 설문','First representative did not load');

  await openFor(page,'#best3_flow_title');
  await page.locator('input[name="representative"][value="flow"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').inputValue()==='학과 인스타그램 카드뉴스','Switching to flow experience kept the first representative');
  assert((await page.locator('#context').inputValue()).includes('카드뉴스와 릴스'),'Flow experience summary did not replace the first representative');

  await openFor(page,'#best3_recognition_title');
  await page.locator('input[name="representative"][value="recognition"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').inputValue()==='카페 신메뉴 안내판','Switching to recognition experience kept an earlier representative');
  assert((await page.locator('#context').inputValue()).includes('안내판'),'Recognition experience summary did not replace the earlier representative');
});

await run('Best3 representative feeds one-question Experience Interview',async page=>{
  await openFor(page,'#best3_best_title');
  await page.locator('#best3_best_title').fill('캡스톤 프로젝트');
  await page.locator('#best3_best_summary').fill('센서 오류 원인을 비교하고 팀과 수정했다.');
  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').inputValue()==='캡스톤 프로젝트','Representative title not copied');
  assert((await page.locator('#context').inputValue()).includes('센서 오류'),'Representative summary not copied');
  await page.locator('#makeInterviewPrompt').click();
  const prompt=(await page.locator('#interviewPrompt').textContent())||'';
  assert(prompt.includes('한 번에 질문은 반드시 하나만 한다'),'One-question rule missing');
  assert(prompt.includes('학생에게 질문할 때는 S/T/A/R 같은 기호를 붙이지 않는다'),'Student-friendly STAR rule missing');
  assert(prompt.includes('팀 전체의 행동과 내가 직접 한 행동'),'Ownership rule missing');
  assert(prompt.includes('최대 5회까지 질문'),'Five-question ceiling missing');
  assert(prompt.includes('강점·역량 이름을 확정하지 않는다'),'Evidence-before-competency rule missing');
  await page.locator('#role').fill('센서 데이터 검토와 원인 후보 정리를 맡았다.');
  await page.locator('#goFactCheck').click();
  assert(await page.locator('#situation').isVisible(),'02 interview should open 03 STAR fact check');
  assert((await page.locator('#situation').inputValue()).includes('센서 오류'),'Experience background should auto-fill Situation');
  assert((await page.locator('#challenge').inputValue()).includes('센서 데이터 검토'),'Responsibility should auto-fill Task/Role');
  await page.locator('#aiStructured').fill('S 상황: 팀 프로젝트\nT 문제·목표와 내 역할: 센서 오류 원인을 좁혀야 했다.\nA 내가 직접 한 행동: 원인 후보를 비교했다.\nWHY 판단·선택 이유: 반복 발생 여부를 기준으로 봤다.\nR 결과: 오류 범위를 좁혔다.\n확인 가능한 증거: 실험 기록');
  await page.locator('#importStarSummary').click();
  assert((await page.locator('#situation').inputValue())==='팀 프로젝트','STAR import should fill Situation');
  assert((await page.locator('#action').inputValue()).includes('원인 후보를 비교했다'),'STAR import should fill Action');
  assert((await page.locator('#challenge').inputValue())==='센서 오류 원인을 좁혀야 했다.','STAR import should strip the Task label cleanly');
});

await run('Mobile STAR import accepts touch and mobile-copied markdown labels',async page=>{
  await page.setViewportSize({width:390,height:844});
  await openFor(page,'#aiStructured');
  await page.locator('#aiStructured').fill('- **S 상황**: 모바일 팀 프로젝트\n- **T 문제·목표와 내 역할**: 자료 오류를 확인해야 했다.\n- **WHAT 내가 직접 한 행동**: 원자료와 결과표를 비교했다.\n- **WHY 판단·선택 이유**: 오류 가능성이 큰 항목부터 확인했다.\n- **R 결과**: 오류 2건을 수정했다.\n- **확인 가능한 증거**: 수정된 결과표');
  await page.locator('#importStarSummary').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'})));
  assert((await page.locator('#situation').inputValue())==='모바일 팀 프로젝트','Mobile touch STAR import should fill Situation');
  assert((await page.locator('#action').inputValue()).includes('원자료와 결과표를 비교했다.'),'Mobile-copied markdown STAR import should fill Action');
  assert((await page.locator('#evidence').inputValue())==='수정된 결과표','Mobile-copied markdown STAR import should fill Evidence');
});

await run('STEP2 draft survives reload before final experience save',async page=>{
  await openFor(page,'#best3_best_title');
  await page.locator('#best3_best_title').fill('학생회 행사');
  await page.locator('#best3_best_summary').fill('행사 신청이 적어 안내 방식을 바꿨다.');
  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  await page.locator('#roleTitle').fill('홍보 담당');
  await page.locator('#makeInterviewPrompt').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.experienceCompetency.draft.title==='학생회 행사','Interview draft not saved before external AI handoff');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('.experienceCompetencyWeek4');
  assert(await page.locator('#title').inputValue()==='학생회 행사','Draft title not restored after reload');
  assert(await page.locator('#roleTitle').inputValue()==='홍보 담당','Draft role not restored after reload');
});

await run('Virtual student can move STEP3 01 to 05 and then STEP4 without detours',async page=>{
  assert(await page.locator('#best3_best_title').isVisible(),'STEP3 representative experience input missing');
  await page.locator('#best3_best_title').fill('팀 프로젝트');
  await page.locator('#best3_best_summary').fill('자료 오류를 찾아 수정하고 발표를 마쳤다.');
  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').isVisible(),'01 → 02 route is broken');
  await page.locator('#category').selectOption({label:'팀프로젝트'});
  await page.locator('#roleTitle').fill('자료 검토');
  await page.locator('#role').fill('발표자료의 오류 검토를 맡았다.');
  await page.locator('#goFactCheck').click();
  assert(await page.locator('#situation').isVisible(),'02 → 03 route is broken');
  assert((await page.locator('#situation').inputValue()).includes('자료 오류'),'Representative context did not auto-fill S');
  assert((await page.locator('#challenge').inputValue()).includes('오류 검토'),'Responsibility did not auto-fill T');
  await page.locator('#challenge').fill('발표 전 자료 오류를 찾아야 했고, 나는 자료 검토를 맡았다.');
  await page.locator('#action').fill('원자료와 발표자료를 대조해 오류 항목을 수정했다.');
  await page.locator('#reason').fill('발표 직전이라 영향이 큰 항목부터 확인했다.');
  await page.locator('#result').fill('수정된 자료로 발표를 완료했다.');
  await page.locator('#evidence').fill('최종 발표자료');
  await page.locator('#evidenceType').selectOption({label:'산출물·문서'});
  await page.locator('#experienceFactChecked').check();
  await page.locator('#goCompetency').click();
  assert(await page.locator('#comp_1').isVisible(),'03 → 04 route is broken');
  await page.locator('#comp_1').selectOption('C04');
  await page.locator('#compStatus_1').selectOption({label:'행동 확인'});
  await page.locator('#compEv_1').fill('원자료와 발표자료를 대조해 오류를 수정했다.');
  await page.locator('#competencyEvidenceChecked').check();
  await page.locator('#saveExp').click();
  await page.waitForSelector('#experienceMapPreview');
  assert(await page.locator('#experienceMapPreview').isVisible(),'04 → 05 result route is broken');
  assert(await page.locator('#competencyMapPreview').count()===1,'Competency Map must stay available inside the result block');
  assert(await page.locator('#experienceDnaPreview').count()===1,'Career DNA comparison must stay available inside the result block');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.experienceCompetency.experiences.some(x=>x.title==='팀 프로젝트'),'Virtual-student experience was not saved');
  assert(saved.assessments.experienceCompetency.experiences.some(x=>x.id==='EXP-OLD'),'Virtual-student route overwrote existing experience data');
  await page.locator('#nextStep').click();
  await page.waitForSelector('#jobPrompt');
  const step4Text=(await page.locator('#stepRoot').textContent())||'';
  assert(step4Text.includes('내가 탐색할 직무 찾기'),'STEP3 → STEP4 button did not navigate to Job Exploration');
  assert(step4Text.includes('팀 프로젝트'),'STEP4 did not receive the saved STEP3 experience');
  assert(step4Text.includes('문제해결'),'STEP4 did not receive the confirmed STEP3 competency');
  const step4Prompt=await page.locator('#jobPrompt').inputValue();
  assert(step4Prompt.includes('[STEP 3 경험 근거 · 우선근거]'),'STEP4 prompt is missing the STEP3 evidence bridge');
  assert(step4Prompt.includes('원자료와 발표자료를 대조해 오류 항목을 수정했다.'),'STEP4 prompt did not carry the verified STEP3 action');
});

await run('Experience save preserves old data and writes competency evidence map',async page=>{
  await openFor(page,'#best3_best_title');
  await page.locator('#best3_best_title').fill('캡스톤 프로젝트');
  await page.locator('#best3_best_summary').fill('센서 오류 원인을 비교하고 팀과 수정했다.');
  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').isVisible(),'Representative action should open Interview section');
  await page.locator('#category').selectOption({label:'캡스톤·연구'});
  await page.locator('#roleTitle').fill('자료분석');

  await openFor(page,'#action');
  await page.locator('#challenge').fill('센서 오류 원인을 좁혀야 했다.');
  await page.locator('#action').fill('원인 후보를 비교했다.');
  await page.locator('#reason').fill('반복 발생 여부를 기준으로 우선순위를 정했다.');
  await page.locator('#result').fill('오류 범위를 좁혔다.');
  await page.locator('#evidence').fill('실험 기록');
  await page.locator('#evidenceType').selectOption({label:'작업기록·로그'});
  await page.locator('#experienceFactChecked').check();
  assert((await page.locator('#evidenceGradePreview').textContent()).includes('A · 객관적 자료'),'Evidence grade should be automatic');
  assert(await page.locator('#evidenceGrade').count()===0,'Manual evidence grade should be removed');
  assert(await page.locator('#actionVerbs').count()===0,'Manual action verbs field should be removed');

  await openFor(page,'#comp_1');
  assert((await page.locator('#actionEvidencePreview').textContent()).includes('원인 후보를 비교했다'),'Action should bridge into competency section');
  await page.locator('#comp_1').selectOption('C04');
  assert((await page.locator('#compCue_1').textContent()).includes('문제파악'),'Competency cue missing');
  await page.locator('#compStatus_1').selectOption({label:'행동 확인'});
  await page.locator('#compEv_1').fill('오류 원인 후보를 비교하고 우선순위를 정했다.');
  await page.locator('#competencyEvidenceChecked').check();
  await page.locator('#saveExp').click();
  await page.waitForSelector('#nextStep');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const ec=saved.assessments.experienceCompetency;
  assert(ec.version==='experience-competency-step3-v11','STEP3 version missing');
  assert(ec.experiences.some(x=>x.title==='캡스톤 프로젝트'),'New experience not saved');
  assert(ec.experiences.some(x=>x.id==='EXP-OLD'),'Existing experience was overwritten');
  const newExp=ec.experiences.find(x=>x.title==='캡스톤 프로젝트');
  assert(newExp.competencies.includes('문제해결'),'Competency keyword missing');
  assert(newExp.competencyEvidence.some(x=>x.code==='C04'&&x.label==='문제해결'&&x.evidence.includes('원인 후보')&&x.studentVerified),'Standard competency evidence missing');
  assert(Array.isArray(saved.artifacts.experienceMap)&&saved.artifacts.experienceMap.length>=2,'experienceMap contract broken');
  assert(await page.locator('#experienceMapPreview').isVisible(),'Save should move student to Experience Map');
  const readiness=(await page.locator('.experienceReadiness').textContent())||'';
  assert(readiness.includes('사실확인된 경험 2개')||readiness.includes('반복 패턴'),'Experience readiness guidance missing');
});

await run('STEP3 representative selection stores Best3 without creating new Career Roadmap',async page=>{
  await openFor(page,'#best3_flow_title');
  await page.locator('#best3_flow_title').fill('강의자료 만들기');
  await page.locator('#best3_flow_summary').fill('시간 가는 줄 모르고 자료를 정리했다.');
  await page.locator('input[name="representative"][value="flow"]').check();
  await page.locator('#useRepresentative').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const ec=saved.assessments.experienceCompetency;
  assert(ec.best3.flow.title==='강의자료 만들기','Best3 not saved under experienceCompetency');
  assert(ec.representativeKey==='flow','Representative key not saved');
  assert(!saved.assessments.careerRoadmap,'Week4 should not create Career Roadmap data');
  assert(saved.assessments.careerDNA.hypothesis.version==='career-dna-hypothesis-v1','Career DNA was changed');
});

await run('STEP4 Job Explorer bridges current Career DNA and Experience Map',async page=>{
  await page.locator('.stepBtn[data-step="3"]').click();await page.waitForSelector('#jobPrompt');
  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const text of ['내가 탐색할 직무 찾기','나의 직무탐색 근거 확인','직장에서 해보고 싶은 일','관심 산업·분야','직무 후보 찾기','Target Job 선택'])assert(body.includes(text),`Missing STEP4 module: ${text}`);
  assert(body.includes('분석'),'Experience Map competency not shown in Week6 bridge');
  const prompt=await page.locator('#jobPrompt').inputValue();
  assert(prompt.includes('[STEP 2 Career DNA · 보조근거]'),'Career DNA auxiliary block missing');
  assert(prompt.includes('[STEP 3 경험 근거 · 우선근거]'),'Experience evidence block missing');
  assert(prompt.includes('실제 Task·요구기술·기업조건은 STEP 5에서 공식자료로 확인'),'STEP 5 verification bridge missing');
  assert(prompt.includes('적합도 %, 추천순위, 취업성공확률을 만들지 않는다.'),'No-fit-score rule missing');
  assert(prompt.includes('Holland/RIASEC 유형을 임의로 추정하지 않는다.'),'No-fabricated-RIASEC rule missing');
  assert(prompt.includes('첫 줄부터 [후보 1]로 시작'),'STEP3 prompt must start directly with candidate text');
  assert(prompt.includes('JSON 금지'),'STEP3 prompt must explicitly forbid JSON');
  assert(prompt.includes('마크다운 표'),'STEP3 prompt must explicitly forbid markdown tables');
  await openFor(page,'#jobAiImport');
  await page.locator('#jobAiImport').fill('[후보 1]\n직무명: 브랜드 마케터\n직무군: 마케팅·브랜드\n어떤 일: 고객과 시장 데이터를 바탕으로 브랜드 활동을 기획한다.\n경험·행동 근거: 리뷰 데이터를 기준별로 분류했다.\n관심 근거: 자료·데이터 분석하기를 선택했다.\n가능 산업: 유통·물류, IT·플랫폼\nSTEP 5에서 확인할 것: 실제 담당업무와 요구도구');
  await page.locator('#importJobAi').click();
  assert(await page.locator('#candidateList [data-edit]').count()===1,'Imported STEP3 candidate must expose an edit button');
  assert(await page.locator('#candidateList [data-del]').count()===1,'Imported STEP3 candidate must keep a delete button');
  await page.locator('#candidateList [data-edit]').click();
  assert((await page.locator('#addCandidate').textContent()).includes('수정 저장'),'STEP3 candidate edit flow did not open');
  assert(await page.locator('#jobTitle').inputValue()==='브랜드 마케터','STEP3 candidate values did not load into editor');
});

await run('Inventory, HOW and asset bank preserve facts through reload and reuse',async page=>{
  await openFor(page,'#inventoryTitle');
  await page.locator('#inventoryCategory').selectOption('아르바이트·근로');
  await page.locator('#inventoryTitle').fill('축제 부스 운영');
  await page.locator('#addInventory').click();
  await page.locator('[data-inventory-use]').click();
  assert(await page.locator('#title').inputValue()==='축제 부스 운영','Inventory did not load selected experience');
  await openFor(page,'#aiStructured');
  await page.locator('#aiStructured').fill('S 상황: 축제 첫날 주문이 몰렸다.\nT 문제·목표와 내 역할: 대기시간을 줄여야 했다.\nWHAT 내가 직접 한 행동: 주문량을 기록하고 역할을 조정했다.\nWHY 판단·선택 이유: 주문 집중이 원인이라고 판단했다.\nHOW 실행 방법: 시간대별 기록과 처리단계를 비교했다.\nR 결과: 다음 날 대기시간이 줄었다.\n결과 이유(학생의 해석): 역할 조정이 도움이 됐다고 본다.\n확인 가능한 증거: 주문 기록');
  await page.locator('#importStarSummary').click();
  assert(await page.locator('#method').inputValue()==='시간대별 기록과 처리단계를 비교했다.','HOW import failed');
  assert(await page.locator('#resultReason').inputValue()==='역할 조정이 도움이 됐다고 본다.','Result interpretation import failed');
  await page.reload({waitUntil:'networkidle'});
  await openFor(page,'#method');
  assert(await page.locator('#method').inputValue()==='시간대별 기록과 처리단계를 비교했다.','HOW draft lost after reload');
  await page.locator('#experienceFactChecked').check();
  await openFor(page,'#saveExp');
  await page.locator('#saveExp').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts?.careerAssetBank?.items?.length===2);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(state.assessments.experienceCompetency.inventory.length===1,'Inventory lost on experience save');
  assert(state.artifacts.careerAssetBank.items.some(x=>x.id==='EXP-OLD'),'Legacy experience lost from bank');
  const saved=state.artifacts.careerAssetBank.items.find(x=>x.title==='축제 부스 운영');
  assert(saved?.method==='시간대별 기록과 처리단계를 비교했다.','Bank lost HOW');
  assert(saved?.resultReason==='역할 조정이 도움이 됐다고 본다.','Bank lost result interpretation');
  assert(!saved?.requirement&&!saved?.company,'Bank must remain independent of a specific JD');
  await openFor(page,'#careerAssetBankPreview');
  await page.locator('#careerAssetBankPreview [data-edit]').last().click();
  await openFor(page,'#method');
  await page.locator('#method').fill('기록을 표로 나눠 비교했다.');
  await page.reload({waitUntil:'networkidle'});
  await openFor(page,'#saveExp');
  await page.locator('#saveExp').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts?.careerAssetBank?.items?.some(x=>x.method==='기록을 표로 나눠 비교했다.'));
  const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(updated.artifacts.careerAssetBank.items.length===2,'Reloaded edit created a duplicate experience');
  await openFor(page,'#nextStep');await page.locator('#nextStep').click();
  await page.waitForSelector('.jobExplorerV3');
  assert((await page.locator('#stepRoot').textContent()).includes('축제 부스 운영'),'STEP4 did not reuse saved experience');
});


await run('STEP4 keeps old target choices and restores one-line AI reasons on desktop and mobile',async page=>{
  await page.evaluate(()=>{
    const key='jobfit:v2:learner',state=JSON.parse(localStorage.getItem(key));
    state.artifacts.jobExplorer={candidates:[{
      id:'job-old',title:'직무명: 브랜드 마케팅 직무군: 마케팅 어떤 일: 브랜드 콘텐츠 기획. 경험·행동 근거: 리뷰를 분류했다. 관심 근거: 데이터 분석에 관심. 가능 산업: 유통·물류 STEP 5에서 확인할 것: 요구도구',
      summary:'',why:'',evidence:'',family:'',industries:[]
    }],targets:['job-old'],targetCombos:[{id:'target-old',jobId:'job-old',industry:'유통·물류',priority:1}],desiredActivities:['자료·데이터 분석하기'],industryInterests:['유통·물류']};
    localStorage.setItem(key,JSON.stringify(state));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="3"]').click();await page.waitForSelector('.candidateCard');
  assert((await page.locator('#candidateList h3').first().textContent()).trim()==='브랜드 마케팅','Long title was not repaired');
  const content=await page.locator('#candidateList').textContent();
  assert(content.includes('리뷰를 분류했다.')&&content.includes('데이터 분석에 관심.'),'Missing reasons were not recovered');
  assert((await page.locator('[data-target-job="0"] option:checked').textContent()).trim()==='브랜드 마케팅','Target selection shows full text');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts.jobExplorer);
  assert(before.candidates[0].id==='job-old'&&before.candidates[0].rawImportText,'Old candidate metadata not preserved');
  assert(before.targetCombos[0].id==='target-old','Existing ranking lost on migration');
  await openFor(page,'#jobAiImport');
  await page.locator('#jobAiImport').fill(['[후보 1]','직무명: 브랜드 마케팅','관심 근거: 자료 분석을 직접 선택했다.','경험·행동 근거: 리뷰를 분류했다.'].join(String.fromCharCode(10)));
  await page.locator('#importJobAi').click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts.jobExplorer);
  assert(after.candidates.length===1&&after.candidates[0].id==='job-old','AI re-import deleted saved candidate');
  assert(after.targetCombos[0].id==='target-old','AI re-import deleted target ranking');
  await page.setViewportSize({width:390,height:844});
  assert(await page.locator('.candidateCard').count()===1,'Mobile card not rendered');
  const columns=await page.locator('.candidateEvidenceGrid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert(columns===1,'Mobile reasons should stack vertically');
});

await run('STEP5 completed JD and GAP records stay intact with readable desktop/mobile layouts',async page=>{
  const original={
    sources:[
      {id:'jd-saved-1',slot:0,companyName:'무신사',companyUrl:'https://www.musinsa.com',type:'기업 공식 채용공고',name:'Brand Marketing Assistant',url:'https://example.org/jd',checkedAt:'2026-10-13',note:'[담당업무] 브랜드 캠페인·프로모션 운영 / SNS 채널 운영 / 유관 부서 협업 [자격 요건] 1년 미만 경험'},
      {id:'jd-saved-2',slot:1,companyName:'예시기업',type:'기업 공식 채용공고',name:'Brand Marketing Intern',url:'https://example.org/jd2',checkedAt:'2026-10-13',note:'상세 자료 조사 / 캠페인 지원'}
    ],
    selectedSourceId:'jd-saved-1',
    jobTable:{customerKpi:'고객의 브랜드 인지도 / 고객 반응',tasks:'SNS 채널 운영 / 캠페인 실행 / 문서 정리',challenge:'캠페인 성과 확인 / 유관부서 협업',method:'시장조사 / Excel 자료 정리',competencies:'커뮤니케이션 / 분석 / 실행관리',careerPlan:'캠페인 운영 실무 → 브랜드 기획',aiResult:'[고객·성과기준]\\n• 고객 반응\\n[주요 과업]\\n• 캠페인 지원\\n[주요 해결과제]\\n• 일정 조율\\n[해결방법]\\n• 문서 정리\\n[필요역량]\\n• Excel'},
    studentSpec:{certificates:'없음',language:'TOEIC 800',tools:'Excel',portfolio:'리뷰 데이터 분석 프로젝트'},
    have:'Excel 사용 경험 / 리뷰 데이터 정리 경험',verify:'고객접점 경험 확인 필요',prepare:'브랜드 캠페인 사례 분석 / 보고서 작성',
    requirements:[{id:'gap1',name:'브랜드 캠페인 자료 작성',type:'Skill',status:'준비 필요',evidence:'',gap:'브랜드 캠페인 문서 제작 경험 확인 필요'}]
  };
  await page.evaluate(jd=>{
    const key='jobfit:v2:learner',state=JSON.parse(localStorage.getItem(key));
    const job={id:'marketing-job',title:'브랜드 마케팅',family:'마케팅'};
    state.artifacts.jobExplorer={
      candidates:[job],targets:[job.id],targetCombos:[{id:'target-marketing-1',jobId:job.id,industry:'유통·패션',priority:1}]
    };
    state.artifacts.jobDeepDive={analyses:{},targetAnalyses:{'target-marketing-1':jd}};
    localStorage.setItem(key,JSON.stringify(state));
  },original);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="4"]').click();
  await page.waitForSelector('.jobAnalysisInje');
  assert(await page.locator('#sourceList .sourceCompactItem').count()===2,'STEP5 posting summary must show saved JDs');
  assert(await page.locator('#sourceList').textContent().then(t=>!t.includes('SNS 채널 운영 / 유관 부서 협업')),'STEP5 duplicates full posting notes in source list');
  assert(await page.locator('.jdRecordCard').count()===3,'All three JD editor slots should still be present');
  assert(await page.locator('.jdRecordCard').first().evaluate(el=>!el.open),'Saved JD editor should start collapsed');
  assert(await page.locator('#sourceNote').inputValue()===original.sources[0].note,'Saved JD raw text changed in editor');
  assert(await page.locator('#chosenPreview .jdNoteDetails').count()===1,'Chosen JD should offer expandable full details');
  assert(await page.locator('#chosenPreview .jdNoteDetails').evaluate(el=>!el.open),'Chosen JD should hide the repeated raw note until expanded');
  assert(await page.locator('#jobAiImport').inputValue()===original.jobTable.aiResult,'Saved AI analysis original response not restored');
  assert(await page.locator('#jobAiLivePreview .analysisResultCard').count()===5,'AI reply needs five readable cards');
  assert(await page.locator('#jobAnalysisPreview .analysisResultCard').count()===5,'Completed job analysis should have five cards');
  assert(await page.locator('#jobAnalysisPreview table.matrix').count()===0,'Dense horizontal job-analysis table remains');
  assert(await page.locator('#jobTasks').evaluate(el=>el.tagName)==='TEXTAREA','Job analysis long text should be multiline');
  assert(await page.locator('#jobTasks').inputValue()===original.jobTable.tasks,'Original job tasks changed in multiline editor');
  assert(await page.locator('#specTools').inputValue()==='Excel','Existing STEP7 student spec missing');
  assert(await page.locator('#gapSummary .analysisResultCard').count()===4,'Saved GAP must display four readable cards');
  const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts.jobDeepDive.targetAnalyses['target-marketing-1']);
  assert(JSON.stringify(preserved)===JSON.stringify(original),'Viewing STEP5 modified completed student data');
  await page.setViewportSize({width:390,height:844});
  const grids=['.readableAnalysisGrid','.readableGrid','.analysisInputGrid','.specInputGrid'];
  for(const selector of grids){
    const columns=await page.locator('.jobAnalysisInje '+selector).first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert(columns===1,'STEP5 mobile view is not single-column: '+selector);
  }
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.stepBtn[data-step="4"]').click();await page.waitForSelector('#jobAnalysisPreview .analysisResultCard');
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).artifacts.jobDeepDive.targetAnalyses['target-marketing-1']);
  assert(JSON.stringify(after)===JSON.stringify(original),'Saved STEP5 state changed after PC/mobile reload');
});
await browser.close();if(failed)process.exit(1);

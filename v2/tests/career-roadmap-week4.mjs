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
  for(const text of ['나의 경험에서 직무역량 찾기','지난주 Career DNA 간단히 확인','My Best 3 Experience','AI Experience Interview','AI가 이해한 내 경험 사실확인','경험에서 확인된 역량','Experience Map'])assert(body.includes(text),`Missing Week4 module: ${text}`);
  for(const removed of ['Career Story','Career Theme','Career Direction','1개월 Career Experiment'])assert(!body.includes(removed),`Week4 should not include: ${removed}`);
  assert(body.includes('학습과 신중함이 반복된다.'),'STEP1 comparison bridge missing');
  assert(body.includes('전문성을 깊게 쌓고 신중하게 판단'),'STEP1 hypothesis bridge missing');
  assert(body.includes('기존 경험'),'Existing experience list must be preserved');
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
  await page.locator('#interviewOwnership').check();
  await page.locator('#interviewNumbers').check();
  await page.locator('#interviewEvidence').check();
  await page.locator('#goFactCheck').click();
  assert(await page.locator('#challenge').isVisible(),'03 fact check should open 04');
  await page.locator('#aiStructured').fill('S 상황: 팀 프로젝트\nT 문제·목표와 내 역할: 센서 오류 원인을 좁혀야 했다.\nA 내가 직접 한 행동: 원인 후보를 비교했다.\nWHY 판단·선택 이유: 반복 발생 여부를 기준으로 봤다.\nR 결과: 오류 범위를 좁혔다.\n확인 가능한 증거: 실험 기록');
  await page.locator('#importStarSummary').click();
  assert((await page.locator('#action').inputValue()).includes('원인 후보를 비교했다'),'STAR import should fill Action');
  assert((await page.locator('#challenge').inputValue())==='센서 오류 원인을 좁혀야 했다.','STAR import should strip the Task label cleanly');
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

await run('Experience save preserves old data and writes competency evidence map',async page=>{
  await openFor(page,'#best3_best_title');
  await page.locator('#best3_best_title').fill('캡스톤 프로젝트');
  await page.locator('#best3_best_summary').fill('센서 오류 원인을 비교하고 팀과 수정했다.');
  await page.locator('input[name="representative"][value="best"]').check();
  await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').isVisible(),'Representative action should open Interview section');
  await page.locator('#category').selectOption({label:'캡스톤·연구'});
  await page.locator('#roleTitle').fill('자료분석');
  await page.locator('#interviewOwnership').check();
  await page.locator('#interviewNumbers').check();
  await page.locator('#interviewEvidence').check();

  await openFor(page,'#action');
  await page.locator('#challenge').fill('센서 오류 원인을 좁혀야 했다.');
  await page.locator('#action').fill('원인 후보를 비교했다.');
  await page.locator('#reason').fill('반복 발생 여부를 기준으로 우선순위를 정했다.');
  await page.locator('#result').fill('오류 범위를 좁혔다.');
  await page.locator('#evidence').fill('실험 기록');
  await page.locator('#evidenceType').selectOption({label:'작업기록·로그'});
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
  await page.waitForSelector('#saveRoadmap');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const ec=saved.assessments.experienceCompetency;
  assert(ec.version==='experience-competency-week4-v7','Week4 version missing');
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

await run('Week4 save stores Best3 in Experience & Competency without creating new Career Roadmap',async page=>{
  await openFor(page,'#best3_flow_title');
  await page.locator('#best3_flow_title').fill('강의자료 만들기');
  await page.locator('#best3_flow_summary').fill('시간 가는 줄 모르고 자료를 정리했다.');
  await page.locator('input[name="representative"][value="flow"]').check();
  await page.locator('#saveRoadmap').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const ec=saved.assessments.experienceCompetency;
  assert(ec.best3.flow.title==='강의자료 만들기','Best3 not saved under experienceCompetency');
  assert(ec.representativeKey==='flow','Representative key not saved');
  assert(!saved.assessments.careerRoadmap,'Week4 should not create Career Roadmap data');
  assert(saved.assessments.careerDNA.hypothesis.version==='career-dna-hypothesis-v1','Career DNA was changed');
});

await run('Week6 Job Explorer bridges current Career DNA and Experience Map',async page=>{
  await page.locator('.stepBtn[data-step="3"]').click();await page.waitForSelector('#jobPrompt');
  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const text of ['강점·경험역량을 직무 후보로 연결하기','나의 직무탐색 근거 확인','AI 직무탐색 프롬프트','직무 후보 Pool','Target Job 1·2·3 직접 선택'])assert(body.includes(text),`Missing Week6 module: ${text}`);
  assert(body.includes('분석'),'Experience Map competency not shown in Week6 bridge');
  const prompt=await page.locator('#jobPrompt').inputValue();
  assert(prompt.includes('[3주차 Career DNA]'),'Career DNA block missing');
  assert(prompt.includes('[4주차 Experience Map]'),'Experience Map block missing');
  assert(prompt.includes('Task·KSA·KPI'),'Task/KSA/KPI verification bridge missing');
  assert(prompt.includes('직무 적합도, 취업성공확률, 추천순위를 만들지 않는다.'),'No-fit-score rule missing');
  assert(!prompt.includes('RIASEC'),'Legacy RIASEC dependency remains in Week6 prompt');
});

await browser.close();if(failed)process.exit(1);
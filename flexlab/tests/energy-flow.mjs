import { chromium } from 'playwright';

const URL=process.env.FLEXLAB_TEST_URL||'http://127.0.0.1:8765/flexlab/';
function assert(ok,msg){if(!ok)throw new Error(msg)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});

try{
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.removeItem('jobfit:flexlab:job-analysis:v1'));
  await page.reload({waitUntil:'networkidle'});

  assert(await page.locator('[data-step]').count()===6,'FLEX must keep six steps');

  await page.locator('[data-path="target.job"]').fill('발전운영·환경');
  await page.locator('[data-path="student.major"]').fill('화학공학');
  await page.locator('[data-next="2"]').click();
  await page.waitForSelector('[data-path="step2Search.company"]');

  await page.locator('[data-path="step2Search.company"]').fill('현재 찾지 못함');
  await page.locator('[data-path="step2Search.title"]').fill('에너지 관련 신입 공고 없음');
  const searchPrompt=await page.locator('#searchPromptPreview').inputValue();
  assert(searchPrompt.includes('화학공학'),'STEP2 prompt must include major');
  assert(searchPrompt.includes('발전운영·환경'),'STEP2 prompt must include target job');
  await page.locator('[data-next="3"]').click();

  await page.waitForSelector('[data-analysis-method="komipo-2026-3"]');
  assert(await page.locator('.curatedJob').count()===3,'STEP3 must offer public, private and custom analysis methods');

  // Method 3 inputs stay hidden until Method 3 is selected.
  assert(await page.locator('[data-customjob="company"]').count()===0,'Custom inputs must stay hidden before Method 3 selection');

  // KOMIPO: student chooses recruitment field and one sub-role.
  await page.locator('[data-analysis-method="komipo-2026-3"]').click();
  await page.waitForSelector('[data-curated-group="komipo-2026-3"]');
  assert((await page.locator('.majorStrip').innerText()).includes('화학공학'),'Role picker must show student major');
  await page.locator('[data-curated-group="komipo-2026-3"]').selectOption('화학');
  await page.waitForSelector('[data-curated-role="komipo-2026-3"]');
  const roleOptions=await page.locator('[data-curated-role="komipo-2026-3"] option').allTextContents();
  assert(roleOptions.includes('화력발전설비운영'),'KOMIPO chemistry must include thermal power operation');
  assert(roleOptions.includes('환경관리'),'KOMIPO chemistry must include environmental management');
  assert(roleOptions.includes('태양광에너지생산'),'KOMIPO chemistry must include solar energy production');

  await page.locator('[data-curated-role="komipo-2026-3"]').selectOption('화력발전설비운영');
  await page.waitForSelector('#jobPromptPreview');
  const jobPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(jobPrompt.includes('한국중부발전'),'STEP3 prompt must include selected public company');
  assert(jobPrompt.includes('화학공학'),'STEP3 prompt must include student major');
  assert(jobPrompt.includes('화력발전설비운영'),'STEP3 prompt must include only selected sub-role');
  assert(jobPrompt.includes('탈황·탈질'),'Selected role source must include role-specific knowledge');
  assert(jobPrompt.includes('개조식'),'Job-analysis prompt must request bullet-style output');
  assert(jobPrompt.includes("• "),'Job-analysis prompt must specify bullet markers');
  assert(!jobPrompt.includes('인공지능서비스기획'),'Prompt must not mix other KOMIPO roles');

  await page.locator('#jobTableAiResult').fill([
    '고객·KPI: 발전소 운영부서와 전력 이용자 / 안정운영 지표',
    '주요 과업: 발전환경설비 운전과 점검',
    '주요 해결과제: 배출기준을 지키며 설비를 안정 운영',
    '해결방법: 탈황·탈질·집진설비 상태와 계측데이터를 확인',
    '필요역량: 발전공학, 환경설비 이해, 데이터 해석, 안전기준 준수',
    '경력개발: 환경설비 운영과 발전설비 전문성 확대'
  ].join('\n'));
  await page.locator('#applyJobTableAiBtn').click();
  await page.waitForSelector('[data-path="jobTable.tasks"]');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('발전환경설비'),'AI result must populate role-specific job table');
  assert(await page.locator('.jobAnalysisPreview th').count()===6,'STEP3 must render six-column job analysis table');

  // Same company, another role gets a separate workspace; returning restores the first.
  await page.locator('[data-curated-role="komipo-2026-3"]').selectOption('환경관리');
  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('환경관리'),'Switching sub-role must rebuild prompt');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue())==='','New sub-role must start with its own table');
  await page.locator('[data-path="jobTable.tasks"]').fill('오염원 조사와 배출·방지시설 관리');
  await page.locator('[data-path="jobTable.competencies"]').fill('환경데이터 분석과 준법');
  await page.locator('[data-curated-role="komipo-2026-3"]').selectOption('화력발전설비운영');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('발전환경설비'),'Returning to a sub-role must restore its table');

  // SK Careers R262054: posting-only analysis with work-path selection.
  await page.locator('[data-analysis-method="skenergy-2026-clx"]').click();
  await page.waitForSelector('[data-curated-group="skenergy-2026-clx"]');
  assert((await page.locator('.selectedJobSummary').count())===0,'SK analysis must wait until a work path is chosen');
  await page.locator('[data-curated-group="skenergy-2026-clx"]').selectOption('O&M 발전소 기술전문직군');
  await page.waitForSelector('[data-curated-role="skenergy-2026-clx"]');
  const skOptions=await page.locator('[data-curated-role="skenergy-2026-clx"] option').allTextContents();
  assert(skOptions.includes('현장운전'),'SK posting must include field operation path');
  assert(skOptions.includes('생산관리'),'SK posting must include production management path');
  assert(skOptions.includes('정비(전기)'),'SK posting must include electrical maintenance path');
  await page.locator('[data-curated-role="skenergy-2026-clx"]').selectOption('정비(전기)');
  await page.waitForSelector('#jobPromptPreview');
  const skPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(skPrompt.includes('나래에너지서비스'),'SK Careers example must use the company shown in R262054');
  assert(skPrompt.includes('정비(전기)'),'SK prompt must include selected work path');
  assert(skPrompt.includes('전기 분야 발전설비 유지관리 업무'),'SK prompt must use posting role text');
  assert(skPrompt.includes('공고에 별도 명시 없음'),'SK prompt must not invent missing job-description details');
  assert((await page.locator('.rolePicker').innerText()).includes('현장운전을 먼저 수행'),'SK UI must explain mandatory field-operation sequence');

  // Method 3: selecting the method must automatically reveal its input screen.
  await page.locator('[data-analysis-method="custom"]').click();
  await page.waitForSelector('[data-customjob="company"]',{state:'visible'});
  assert(await page.locator('#customJobEntry').isVisible(),'Method 3 selection must reveal the direct-input screen');
  await page.locator('[data-customjob="company"]').fill('한화솔루션');
  await page.locator('[data-customjob="title"]').fill('에너지솔루션 생산기술 신입');
  await page.locator('[data-customjob="role"]').fill('생산기술');
  await page.locator('[data-customjob="facts"]').fill('생산공정 데이터 분석, 설비 개선, 공정 안정화');
  await page.locator('#useCustomJobBtn').click();
  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('한화솔루션'),'Custom prompt must include student-entered company');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('생산기술'),'Custom prompt must include student-entered role');

  // Return to KOMIPO and restore selected role + analysis.
  await page.locator('[data-analysis-method="komipo-2026-3"]').click();
  await page.waitForSelector('[data-curated-role="komipo-2026-3"]');
  assert((await page.locator('[data-curated-role="komipo-2026-3"]').inputValue())==='화력발전설비운영','KOMIPO role selection must persist');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('발전환경설비'),'KOMIPO role table must survive company switching');

  // Continue the full student flow with the public-company example.
  await page.locator('[data-analysis-method="komipo-2026-3"]').click();
  await page.locator('[data-next="4"]').click();

  await page.waitForSelector('[data-path="student.majorEvidence"]');
  await page.locator('[data-path="student.majorEvidence"]').fill('화공실험에서 공정 데이터를 비교하고 환경설비 관련 변수를 해석했다.');
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('환경설비 캡스톤');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('센서 데이터를 비교해 이상 원인을 좁혔다.');
  await page.locator('[data-path="star.actionWhat"]').fill('측정값을 기준값과 비교하고 원인 후보를 정리했다.');
  await page.locator('[data-path="star.result"]').fill('오류 범위를 좁혀 재시험 대상을 정했다.');
  await page.locator('[data-path="star.evidence"]').fill('측정 기록과 프로젝트 보고서');
  await page.locator('#refreshKeywordPromptBtn').click();
  const keywordPrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(keywordPrompt.includes('화공실험'),'STEP4 prompt must include major evidence');
  assert(keywordPrompt.includes('환경설비 캡스톤'),'STEP4 prompt must include experience');
  assert(keywordPrompt.includes('개조식'),'Competency prompt must request bullet-style output');
  await page.locator('[data-path="ai.keywordResult"]').fill('설비 데이터 해석 / 이상원인 분석 / 안전기준 기반 점검');
  await page.locator('[data-next="5"]').click();

  await page.waitForSelector('#step5TargetSelect');
  const autoTarget=await page.locator('#step5TargetSelect').inputValue();
  assert(autoTarget.includes('komipo-2026-3')&&autoTarget.includes('화력발전설비운영'),'STEP5 must auto-fill the STEP3 comparison target');

  // Student can directly switch the STEP5 comparison target.
  await page.locator('#step5TargetSelect').selectOption('curated|skenergy-2026-clx|O&M 발전소 기술전문직군|정비(전기)');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('나래에너지서비스'),'STEP5 must allow direct comparison-target switching');
  const skGapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(skGapPrompt.includes('정비(전기)'),'Directly selected STEP5 role must flow into GAP prompt');
  assert(skGapPrompt.includes('전기 분야 발전설비 유지관리 업무'),'STEP5 direct selection must use registered role data even without a STEP3 table');

  // Switch back to the STEP3-analyzed target and continue.
  await page.locator('#step5TargetSelect').selectOption('curated|komipo-2026-3|화학|화력발전설비운영');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('한국중부발전'),'STEP5 must restore the chosen public-company target');

  await page.locator('[data-path="student.certificates"]').fill('대기환경기사 준비 중');
  await page.locator('[data-path="student.language"]').fill('TOEIC 820');
  await page.locator('[data-path="student.tools"]').fill('Excel, Python');
  const reqStatus=page.locator('[data-req="0"][data-reqkey="status"]');
  await reqStatus.selectOption('충족');
  await page.locator('[data-req="0"][data-reqkey="note"]').fill('TOEIC 820');
  await page.locator('#refreshGapPromptBtn').click();
  const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(gapPrompt.includes('TOEIC 820'),'STEP5 prompt must include student spec');
  assert(gapPrompt.includes('한국중부발전'),'STEP5 prompt must include selected posting');
  assert(gapPrompt.includes('개조식'),'GAP prompt must request bullet-style output');
  await page.locator('[data-path="fit.assets"]').fill('TOEIC 820, 화공실험, 환경설비 데이터 분석 경험');
  await page.locator('[data-path="fit.gaps"]').fill('대기환경기사 미취득, 현장 설비 경험 부족');
  await page.locator('[data-path="fit.actions"]').fill('3개월 내 대기환경기사 준비와 환경설비 데이터 미니 프로젝트 완성');
  await page.locator('[data-path="ai.gapResult"]').fill('우선 GAP: 자격증과 현장형 설비 Evidence');
  await page.locator('[data-next="6"]').click();

  await page.waitForSelector('.preview');
  const portfolio=await page.locator('.preview').innerText();
  assert(portfolio.includes('한국중부발전'),'Portfolio must include selected company');
  assert(portfolio.includes('환경설비 캡스톤'),'Portfolio must include student experience');
  assert(portfolio.includes('대기환경기사 미취득'),'Portfolio must include GAP');
  const selfPrompt=await page.locator('#selfIntroPromptPreview').inputValue();
  const interviewPrompt=await page.locator('#interviewPromptPreview').inputValue();
  assert(selfPrompt.includes('환경설비 캡스톤'),'Self-intro prompt must be personalized');
  assert(selfPrompt.includes('개조식'),'Self-intro prompt must request bullet-style output');
  assert(interviewPrompt.includes('대기환경기사 미취득'),'Interview prompt must include GAP');
  assert(interviewPrompt.includes('개조식'),'Interview prompt must request bullet-style output');
  assert(interviewPrompt.includes('총 12개의 실무면접 예상질문'),'Interview prompt must request a practical question set');
  assert(interviewPrompt.includes('[1. 직무이해·실무지식 · 4문항]'),'Interview prompt must include role-knowledge questions');
  assert(interviewPrompt.includes('예상 꼬리질문'),'Interview prompt must request follow-up questions');
  assert(interviewPrompt.includes('모범답안은 쓰지 않는다'),'Interview prompt must not generate model answers');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:flexlab:job-analysis:v1')));
  assert(saved.version===8,'FLEX state version must be 8');
  assert(saved.sampleJobId==='komipo-2026-3','Selected curated job must persist');

  await page.evaluate(()=>localStorage.removeItem('jobfit:flexlab:job-analysis:v1'));
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-step="3"]').click();
  assert(await page.locator('[data-customjob="company"]').count()===0,'Custom inputs must be hidden after fresh reload until Method 3 is selected');
  await page.locator('[data-analysis-method="custom"]').click();
  await page.waitForSelector('[data-customjob="company"]',{state:'visible'});
  await page.locator('[data-customjob="company"]').fill('직접입력 테스트 기업');
  await page.locator('[data-customjob="role"]').fill('에너지 설비');
  await page.locator('[data-customjob="facts"]').fill('에너지 설비 점검과 운영');
  await page.locator('#useCustomJobBtn').click();
  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('직접입력 테스트 기업'),'Custom analysis method must work after reload');

  console.log('FLEX energy mobile flow: PASS');
}finally{
  await browser.close();
}

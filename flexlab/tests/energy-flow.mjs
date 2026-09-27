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

  // STEP 1: industry must not be fixed.
  const industryInput=page.locator('[data-path="target.industry"]');
  assert((await industryInput.inputValue())==='','STEP1 industry must start blank');
  assert((await industryInput.getAttribute('placeholder')).includes('에너지'),'STEP1 industry must show examples only');
  await industryInput.fill('에너지');
  await page.locator('[data-path="target.job"]').fill('화공·환경');
  await page.locator('[data-path="student.major"]').fill('화학공학');
  await page.locator('[data-next="2"]').click();
  await page.waitForSelector('[data-path="step2Search.company"]');

  await page.locator('[data-path="step2Search.company"]').fill('현재 찾지 못함');
  await page.locator('[data-path="step2Search.title"]').fill('관심 직무 신입 공고 없음');
  const searchPrompt=await page.locator('#searchPromptPreview').inputValue();
  assert(searchPrompt.includes('에너지 산업'),'STEP2 prompt must use the student-entered industry');
  assert(searchPrompt.includes('화학공학'),'STEP2 prompt must include major');
  assert(searchPrompt.includes('개조식'),'STEP2 prompt must request readable bullet output');
  await page.locator('[data-next="3"]').click();

  await page.waitForSelector('[data-analysis-method="kea-2026-h2"]');
  assert(await page.locator('.curatedJob').count()===3,'STEP3 must offer KEA, HD Oilbank and custom methods');
  assert((await page.locator('.curatedJob').nth(0).innerText()).includes('한국에너지공단'),'Public sample must be Korea Energy Agency');
  assert((await page.locator('.curatedJob').nth(1).innerText()).includes('HD현대오일뱅크'),'Private sample must be HD Hyundai Oilbank');

  // Method 3 stays hidden until selected.
  assert(await page.locator('[data-customjob="company"]').count()===0,'Custom inputs must stay hidden before Method 3 selection');

  // Korea Energy Agency: choose a current 2026 new-hire role.
  await page.locator('[data-analysis-method="kea-2026-h2"]').click();
  await page.waitForSelector('[data-curated-group="kea-2026-h2"]');
  assert((await page.locator('.majorStrip').innerText()).includes('화학공학'),'Role picker must show student major');
  await page.locator('[data-curated-group="kea-2026-h2"]').selectOption('기술');
  await page.waitForSelector('[data-curated-role="kea-2026-h2"]');
  const keaRoles=await page.locator('[data-curated-role="kea-2026-h2"] option').allTextContents();
  assert(keaRoles.includes('건축'),'KEA technical roles must include architecture');
  assert(keaRoles.includes('기계'),'KEA technical roles must include mechanical');
  assert(keaRoles.includes('데이터분석'),'KEA technical roles must include data analysis');
  assert(keaRoles.includes('전기'),'KEA technical roles must include electrical');
  assert(keaRoles.includes('전산'),'KEA technical roles must include IT');
  assert(keaRoles.includes('화공·환경'),'KEA technical roles must include chemical/environment');

  await page.locator('[data-curated-role="kea-2026-h2"]').selectOption('화공·환경');
  await page.waitForSelector('#jobPromptPreview');
  const keaPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(keaPrompt.includes('한국에너지공단'),'KEA job prompt must include the selected public institution');
  assert(keaPrompt.includes('화공·환경'),'KEA job prompt must include selected role');
  assert(keaPrompt.includes('공식 별첨 직무기술서'),'KEA prompt must preserve source limitations');
  assert(keaPrompt.includes('개조식'),'KEA prompt must request bullet-style output');

  await page.locator('#jobTableAiResult').fill([
    '고객·KPI: • 정책·사업 수혜자 / 제도 운영성과와 정확성',
    '주요 과업: • 에너지·환경 사업 자료 검토 • 사업 운영 지원',
    '주요 해결과제: • 기준과 데이터에 맞는 사업 판단',
    '해결방법: • 공고·직무기술서와 데이터 근거를 확인',
    '필요역량: • 화공·환경 기초지식 • 데이터 해석 • 기준 준수',
    '경력개발: • 에너지효율·기후변화·신재생 분야 전문성 확대'
  ].join('\n'));
  await page.locator('#applyJobTableAiBtn').click();
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('에너지·환경'),'KEA AI result must populate role-specific job table');
  assert(await page.locator('.jobAnalysisPreview th').count()===6,'STEP3 must render the six-column job-analysis table');

  // HD Hyundai Oilbank: diverse new-graduate roles.
  await page.locator('[data-analysis-method="hdoilbank-2026-h2"]').click();
  await page.waitForSelector('[data-curated-group="hdoilbank-2026-h2"]');
  const groups=await page.locator('[data-curated-group="hdoilbank-2026-h2"] option').allTextContents();
  assert(groups.some(x=>x.includes('엔지니어')),'HD Oilbank must include engineering');
  assert(groups.some(x=>x.includes('IT')),'HD Oilbank must include IT');
  assert(groups.some(x=>x.includes('영업')),'HD Oilbank must include sales');
  assert(groups.some(x=>x.includes('경영일반')),'HD Oilbank must include management roles');

  await page.locator('[data-curated-group="hdoilbank-2026-h2"]').selectOption('엔지니어');
  await page.waitForSelector('[data-curated-role="hdoilbank-2026-h2"]');
  await page.locator('[data-curated-role="hdoilbank-2026-h2"]').selectOption('공정기술/생산기획');
  await page.waitForSelector('#jobPromptPreview');
  const hdPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(hdPrompt.includes('HD현대오일뱅크'),'HD Oilbank prompt must use the private-company sample');
  assert(hdPrompt.includes('공정 관리·최적화'),'HD Oilbank prompt must use official role description');
  assert(hdPrompt.includes('화학공학 전공 필수'),'HD Oilbank prompt must include role-specific major requirement');

  // Method 3 must reveal its input screen automatically.
  await page.locator('[data-analysis-method="custom"]').click();
  await page.waitForSelector('[data-customjob="company"]',{state:'visible'});
  assert(await page.locator('#customJobEntry').isVisible(),'Method 3 selection must reveal the direct-input screen');
  await page.locator('[data-customjob="company"]').fill('직접입력 에너지기업');
  await page.locator('[data-customjob="role"]').fill('생산기술');
  await page.locator('[data-customjob="facts"]').fill('생산 데이터 분석과 설비 개선');
  await page.locator('#useCustomJobBtn').click();
  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('직접입력 에너지기업'),'Custom prompt must include student-entered company');

  // Return to KEA: selected role + analysis must be preserved.
  await page.locator('[data-analysis-method="kea-2026-h2"]').click();
  await page.waitForSelector('[data-curated-role="kea-2026-h2"]');
  assert((await page.locator('[data-curated-role="kea-2026-h2"]').inputValue())==='화공·환경','KEA role selection must persist');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('에너지·환경'),'KEA role table must survive company switching');

  // STEP 4
  await page.locator('[data-next="4"]').click();
  await page.waitForSelector('[data-path="student.majorEvidence"]');
  await page.locator('[data-path="student.majorEvidence"]').fill('화공실험에서 공정 데이터와 환경변수를 비교해 해석했다.');
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('환경데이터 캡스톤');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('측정 데이터를 정리하고 이상값 원인을 비교했다.');
  await page.locator('[data-path="star.actionWhat"]').fill('기준값과 측정값을 비교해 원인 후보를 정리했다.');
  await page.locator('[data-path="star.result"]').fill('재시험 대상을 좁히고 결과를 보고서로 정리했다.');
  await page.locator('[data-path="star.evidence"]').fill('측정기록과 프로젝트 보고서');
  await page.locator('#refreshKeywordPromptBtn').click();
  const keywordPrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(keywordPrompt.includes('환경데이터 캡스톤'),'STEP4 prompt must include student experience');
  assert(keywordPrompt.includes('개조식'),'STEP4 prompt must request bullet-style output');
  await page.locator('[data-path="ai.keywordResult"]').fill('• 데이터 해석\n• 기준 기반 문제분석\n• 환경업무 문서화');
  await page.locator('[data-next="5"]').click();

  // STEP 5: auto-fill STEP3 target, but allow direct switching.
  await page.waitForSelector('#step5TargetSelect');
  const autoTarget=await page.locator('#step5TargetSelect').inputValue();
  assert(autoTarget.includes('kea-2026-h2')&&autoTarget.includes('화공·환경'),'STEP5 must auto-fill the STEP3 comparison target');

  await page.locator('#step5TargetSelect').selectOption('curated|hdoilbank-2026-h2|엔지니어|공정기술/생산기획');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('HD현대오일뱅크'),'STEP5 must allow direct comparison-target switching');
  const hdGapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(hdGapPrompt.includes('공정기술/생산기획'),'STEP5 direct selection must flow into GAP prompt');
  assert(hdGapPrompt.includes('공정 관리·최적화'),'STEP5 must use registered HD Oilbank role data');

  await page.locator('#step5TargetSelect').selectOption('curated|kea-2026-h2|기술|화공·환경');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('한국에너지공단'),'STEP5 must restore KEA target');

  await page.locator('[data-path="student.certificates"]').fill('대기환경기사 준비 중');
  await page.locator('[data-path="student.language"]').fill('TOEIC 820');
  await page.locator('[data-path="student.tools"]').fill('Excel, Python');
  const reqStatus=page.locator('[data-req="0"][data-reqkey="status"]');
  await reqStatus.selectOption('충족');
  await page.locator('[data-req="0"][data-reqkey="note"]').fill('공통 지원자격 확인');
  await page.locator('#refreshGapPromptBtn').click();
  const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(gapPrompt.includes('한국에너지공단'),'STEP5 GAP prompt must use restored KEA target');
  assert(gapPrompt.includes('개조식'),'STEP5 GAP prompt must request bullet-style output');
  await page.locator('[data-path="fit.assets"]').fill('화공실험, 환경데이터 분석 경험, Excel/Python');
  await page.locator('[data-path="fit.gaps"]').fill('직무기술서 기반 전문지식 보강, 현장 경험 부족');
  await page.locator('[data-path="fit.actions"]').fill('공식 직무기술서 학습과 에너지 데이터 미니 프로젝트 완성');
  await page.locator('[data-path="ai.gapResult"]').fill('• 우선 GAP: 직무 전문지식과 현장형 Evidence');
  await page.locator('[data-next="6"]').click();

  // STEP 6
  await page.waitForSelector('.preview');
  const portfolio=await page.locator('.preview').innerText();
  assert(portfolio.includes('한국에너지공단'),'Portfolio must include selected public institution');
  assert(portfolio.includes('환경데이터 캡스톤'),'Portfolio must include student experience');

  const selfPrompt=await page.locator('#selfIntroPromptPreview').inputValue();
  const interviewPrompt=await page.locator('#interviewPromptPreview').inputValue();
  assert(selfPrompt.includes('개조식'),'Self-intro prompt must request bullet-style output');
  assert(interviewPrompt.includes('총 12개의 실무면접 예상질문'),'Interview prompt must request practical interview questions');
  assert(interviewPrompt.includes('예상 꼬리질문'),'Interview prompt must include follow-up questions');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:flexlab:job-analysis:v1')));
  assert(saved.version===9,'FLEX state version must be 9');
  assert(saved.sampleJobId==='kea-2026-h2','Selected KEA target must persist');

  console.log('FLEX generalized industry + KEA/HD Oilbank flow: PASS');
}finally{
  await browser.close();
}

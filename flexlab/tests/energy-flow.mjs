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
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-path="target.industry"]').inputValue())==='에너지','STEP1 industry must persist in the same browser');
  assert((await page.locator('[data-path="student.major"]').inputValue())==='화학공학','STEP1 major must persist in the same browser');
  await page.locator('[data-next="2"]').click();
  await page.waitForSelector('[data-path="step2Search.company"]');

  await page.locator('[data-path="step2Search.company"]').fill('학생이 찾은 에너지기업');
  await page.locator('[data-path="step2Search.title"]').fill('2026 생산기술 신입');
  await page.locator('[data-path="step2Search.sourceUrl"]').fill('https://example.com/student-found-job');
  await page.locator('[data-path="step2Search.memo"]').fill('화학공학 관련 전공 우대\n생산 데이터 분석 경험 우대');
  await page.locator('#searchPromptPreview').evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});
  await page.locator('#searchPromptPreview').fill((await page.locator('#searchPromptPreview').inputValue())+'\n• 학생 메모 프롬프트');
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-path="step2Search.company"]').inputValue())==='학생이 찾은 에너지기업','STEP2 answer must persist after reload');
  assert((await page.locator('#searchPromptPreview').inputValue()).includes('학생 메모 프롬프트'),'Edited STEP2 AI prompt must persist after reload');
  const searchPrompt=await page.locator('#searchPromptPreview').inputValue();
  assert(searchPrompt.includes('에너지 산업'),'STEP2 prompt must use the student-entered industry');
  assert(searchPrompt.includes('화학공학'),'STEP2 prompt must include major');
  assert(searchPrompt.includes('개조식'),'STEP2 prompt must request readable bullet output');
  await page.locator('[data-next="3"]').click();

  await page.waitForSelector('[data-analysis-method="kea-2026-h2"]');
  assert(await page.locator('.curatedJob').count()===3,'STEP3 must offer KEA, HD Electric and custom methods');
  assert((await page.locator('.curatedJob').nth(0).innerText()).includes('한국에너지공단'),'Public sample must be Korea Energy Agency');
  assert((await page.locator('.curatedJob').nth(1).innerText()).includes('HD현대일렉트릭'),'Private sample must be HD Hyundai Electric');
  assert((await page.locator('.curatedJob').nth(0).locator('a').getAttribute('href'))==='https://kea.recruitlab.co.kr/app/recruitment-announcement/view/1020','KEA card must open the requested RecruitLab announcement');

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
  assert(keaPrompt.includes('공식 NCS 직무기술서'),'KEA prompt must preserve source limitations');
  assert(keaPrompt.includes('온실가스 배출량 산정'),'KEA prompt must include role-specific NCS tasks');
  assert(keaPrompt.includes('열역학, 공업화학, 연소공학'),'KEA prompt must include the role-specific written exam range');
  assert(keaPrompt.includes('직무수행능력면접 60점'),'KEA prompt must include the official interview structure');
  assert(keaPrompt.includes('환경설비설계 · 온실가스관리 · 기후변화적응'),'KEA prompt must preserve role-specific analysis axes');
  assert(keaPrompt.includes("필요지식")&&keaPrompt.includes("필요기술")&&keaPrompt.includes("직무수행태도"),'KEA prompt must explicitly separate official K/S/B evidence');
  assert(keaPrompt.includes('개조식'),'KEA prompt must request bullet-style output');

  await page.locator('#jobTableAiResult').fill([
    '**고객·KPI:**',
    '• 정책·사업 수혜자 / 제도 운영성과와 정확성',
    '2. 주요 과업:',
    '• 에너지·환경 사업 자료 검토 • 사업 운영 지원',
    '### 주요 해결과제',
    '• 기준과 데이터에 맞는 사업 판단',
    '__해결방법:__',
    '• 공고·직무기술서와 데이터 근거를 확인',
    '5) 필요역량:',
    '• 화공·환경 기초지식 • 데이터 해석 • 기준 준수',
    '[경력개발]:',
    '• 에너지효율·기후변화·신재생 분야 전문성 확대'
  ].join('\n'));
  await page.locator('#applyJobTableAiBtn').click();
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('에너지·환경'),'KEA AI result must populate role-specific job table');
  assert(await page.locator('.jobAnalysisPreview th').count()===5,'STEP3 must render the five-column core job-analysis table');
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-curated-role="kea-2026-h2"]').inputValue())==='화공·환경','STEP3 selected role must persist after reload');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('에너지·환경'),'STEP3 analysis answer must persist after reload');

  // HD Hyundai Electric: choose among official 2026 new-hire roles.
  await page.locator('[data-analysis-method="hdelectric-2026-h2"]').click();
  await page.waitForSelector('[data-curated-group="hdelectric-2026-h2"]');
  const hdLockedText=(await page.locator('#stepRoot').innerText())||'';
  for(const heading of ['③ AI에게 선택한 직무만 분석시키기','④ 직무분석 테이블 완성','⑤ 완성된 직무분석표'])assert(hdLockedText.includes(heading),'HD Electric must show the full ②→⑤ path before role selection: '+heading);
  const groups=await page.locator('[data-curated-group="hdelectric-2026-h2"] option').allTextContents();
  assert(groups.some(x=>x.includes('설계·품질')),'HD Electric must include design/quality practice group');
  assert(groups.some(x=>x.includes('디지털·경영지원')),'HD Electric must include digital/management-support practice group');
  assert(groups.some(x=>x.includes('영업·기술전략')),'HD Electric must include sales/technology-strategy practice group');

  await page.locator('[data-curated-group="hdelectric-2026-h2"]').selectOption('설계·품질');
  await page.waitForSelector('[data-curated-role="hdelectric-2026-h2"]');
  const hdRoles=await page.locator('[data-curated-role="hdelectric-2026-h2"] option').allTextContents();
  assert(hdRoles.includes('전기설계'),'HD Electric roles must include electrical design');
  assert(hdRoles.includes('구조설계'),'HD Electric roles must include structural design');
  assert(hdRoles.includes('품질경영'),'HD Electric roles must include quality management');

  await page.locator('[data-curated-role="hdelectric-2026-h2"]').selectOption('품질경영');
  await page.waitForSelector('#jobPromptPreview');
  const hdPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(hdPrompt.includes('HD현대일렉트릭'),'HD Electric prompt must use the private-company sample');
  assert(hdPrompt.includes('실패비용·불량률'),'HD Electric prompt must use official quality role details');
  assert(hdPrompt.includes('ISO 9001'),'HD Electric prompt must include quality-system evidence');
  assert(hdPrompt.includes('전기·기계 등 이공계열'),'HD Electric prompt must include official role preference');
  assert(hdPrompt.includes('[직무특성상 추론]'),'HD Electric prompt must distinguish inferred knowledge/skills');
  assert(hdPrompt.includes('TOEIC Speaking 120점'),'HD Electric prompt must include common application criteria');
  assert(hdPrompt.includes('품질지표 수립·관리(실패비용·불량률) → 품질시스템 인증'),'Quality prompt must include its own role-analysis axis');

  const hdRoleChecks=[
    ['설계·품질','전기설계','전력기기 상세 전기설계·개발 → 도면 일정·완성도 관리','설계도면 제도·표준 관리'],
    ['설계·품질','구조설계','주요 제품 상세 구조설계·개발 → 도면 일정·완성도 관리','상세 구조설계 및 개발'],
    ['설계·품질','품질경영','품질지표 수립·관리(실패비용·불량률) → 품질시스템 인증','부적합사항(NCR)'],
    ['디지털·경영지원','ICT/DT','SAP/ERP 운영·유지보수 → Legacy 시스템 개선·IT/DT 기술기획','CAD/PLM 시스템 개발·운영'],
    ['디지털·경영지원','HR','채용·평가·승진·보상 등 HR 제도운영 → 조직문화 개선·임직원 교육','복지제도 기획·운영'],
    ['영업·기술전략','영업','전력기기 제품 영업 → 영업전략 수립·프로젝트 진행','가격협상·대리점 영업관리'],
    ['영업·기술전략','기술경영','전사 기술·제품 개발전략 → PRM/TRM 기획','특허·지식재산(IP) 전략·분석·권리화']
  ];
  for(const [group,role,guideNeedle,officialNeedle] of hdRoleChecks){
    await page.locator('[data-curated-group="hdelectric-2026-h2"]').selectOption(group);
    await page.waitForSelector('[data-curated-role="hdelectric-2026-h2"]');
    await page.locator('[data-curated-role="hdelectric-2026-h2"]').selectOption(role);
    await page.waitForSelector('#jobPromptPreview');
    const prompt=await page.locator('#jobPromptPreview').inputValue();
    assert(prompt.includes(guideNeedle),`HD Electric ${role} prompt must include its own analysis axis`);
    assert(prompt.includes(officialNeedle),`HD Electric ${role} prompt must retain official job-description evidence`);
    assert(prompt.includes('[직무특성상 추론]'),`HD Electric ${role} prompt must label inferred K/S/B`);
  }

  // Method 3 must reveal its input screen automatically.
  await page.locator('[data-analysis-method="custom"]').click();
  await page.waitForSelector('[data-customjob="company"]',{state:'visible'});
  assert(await page.locator('#customJobEntry').isVisible(),'Method 3 selection must reveal the direct-input screen');
  assert(await page.locator('[data-customjob="period"]').count()===0,'STEP3 custom input must remove recruitment period as a low-value duplicate field');
  const customLockedText=(await page.locator('#stepRoot').innerText())||'';
  for(const heading of ['② 내 전공 확인 → 이 기업에서 분석할 직무 입력','③ AI에게 선택한 직무만 분석시키기','④ 직무분석 테이블 완성','⑤ 완성된 직무분석표'])assert(customLockedText.includes(heading),'Custom method must show the full ②→⑤ path: '+heading);
  await page.locator('[data-customjob="company"]').fill('직접입력 에너지기업');
  await page.locator('[data-customjob="role"]').fill('생산기술');
  await page.locator('#useCustomJobBtn').click();
  assert(await page.locator('#jobPromptPreview').count()===0,'Custom analysis must not open from company/role alone without job-duty evidence');
  await page.locator('[data-customjob="facts"]').fill('생산 데이터 분석\n설비 이상 원인 확인\n공정 개선안 검토');
  await page.locator('[data-customjob="required"]').evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});
  await page.locator('[data-customjob="required"]').fill('화학공학 등 관련 전공 / TOEIC 800 이상');
  await page.locator('[data-customjob="preferred"]').fill('대기환경기사 / 생산데이터 분석 프로젝트 경험');
  await page.locator('#useCustomJobBtn').click();
  await page.waitForSelector('#jobPromptPreview');
  const customPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(customPrompt.includes('직접입력 에너지기업'),'Custom prompt must include student-entered company');
  assert(customPrompt.includes('3~5개 업무축'),'Custom prompt must derive role axes from pasted duties');
  assert(customPrompt.includes('[공고근거]'),'Custom prompt must distinguish pasted evidence from inference');
  assert(customPrompt.includes('직무명만 보고 일반적인 업무를 사실처럼 추가하지 마'),'Custom prompt must block generic role hallucination');

  // Return to KEA: selected role + analysis must be preserved.
  await page.locator('[data-analysis-method="kea-2026-h2"]').click();
  await page.waitForSelector('[data-curated-role="kea-2026-h2"]');
  assert((await page.locator('[data-curated-role="kea-2026-h2"]').inputValue())==='화공·환경','KEA role selection must persist');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('에너지·환경'),'KEA role table must survive company switching');

  // STEP 4: compact 3-part flow + fully personalized prompt.
  await page.locator('[data-next="4"]').click();
  await page.waitForSelector('[data-path="student.majorEvidence"]');
  const step4Text=(await page.locator('#stepRoot').innerText())||'';
  assert(step4Text.includes('① 전공에서 직무 근거 하나 찾기'),'STEP4 must keep the major evidence step');
  assert(step4Text.includes('② 경험 3개 + 행동 근거 한 번에 정리'),'STEP4 must combine experiences and action evidence');
  assert(step4Text.includes('③ AI로 나만의 직무역량 찾기'),'STEP4 must have only one AI analysis step after evidence');
  assert(!step4Text.includes('③ 대표 경험에서 행동 근거 확인'),'STEP4 must remove the old separate action-evidence step');

  assert(await page.locator('[data-expkey="type"]').count()===0,'STEP4 must remove the experience-type dropdown and keep only evidence that changes the analysis');
  const sparsePrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(sparsePrompt.includes('[Jobfit의 현재 정보충분도 진단]'),'STEP4 prompt must diagnose evidence sufficiency before analysis');
  assert(sparsePrompt.includes('현재 상태: 추가질문 필요'),'Sparse STEP4 evidence must be marked as needing follow-up questions');
  assert(sparsePrompt.includes('대표 경험에서 내가 직접 한 행동'),'Sparse diagnostics must identify missing direct-action evidence');
  assert(sparsePrompt.includes('[정보가 부족할 때의 AI 인터뷰 규칙]'),'STEP4 prompt must contain adaptive interview rules');
  assert(sparsePrompt.includes('최종 분석을 하지 말고 [추가질문] 하나만 제시'),'AI must ask one focused question instead of analyzing insufficient evidence');
  assert(sparsePrompt.includes('이미 입력되었거나 이전 답변으로 확인된 내용은 다시 묻지 마라'),'Adaptive interview must not repeat known information');

  // Persona A: data-oriented project evidence.
  await page.locator('[data-path="student.majorEvidence"]').fill('화공실험에서 공정 데이터와 환경변수를 비교해 해석했다.');
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('환경데이터 캡스톤');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('측정 데이터를 정리하고 이상값 원인을 비교했다.');
  await page.locator('[data-exp="1"][data-expkey="title"]').fill('화공실험 팀프로젝트');
  await page.locator('[data-exp="1"][data-expkey="summary"]').fill('실험조건을 바꾸어 에너지 사용량 차이를 비교했다.');
  await page.locator('[data-exp="2"][data-expkey="title"]').fill('학과 데이터 정리');
  await page.locator('[data-exp="2"][data-expkey="summary"]').fill('엑셀로 반복 측정값을 정리하고 오류값을 표시했다.');
  await page.locator('[data-path="star.actionWhat"]').fill('기준값과 측정값을 비교해 원인 후보를 정리했다.');
  await page.locator('[data-path="star.result"]').fill('재시험 대상을 좁히고 결과를 보고서로 정리했다.');
  await page.locator('[data-path="star.evidence"]').fill('측정기록과 프로젝트 보고서');
  const promptA=await page.locator('#keywordPromptPreview').inputValue();
  assert(promptA.includes('필수적으로 부족한 정보: 없음'),'Completed core evidence must clear mandatory STEP4 evidence gaps');
  assert(promptA.includes('기본 분석 가능하지만 보강질문 권장'),'Missing optional WHY/HOW may trigger targeted enrichment without blocking analysis');
  assert(promptA.includes('모든 STAR 항목을 억지로 채우는 것이 목적이 아니다'),'Adaptive interview must stop once evidence is sufficient rather than forcing a full STAR interview');

  // Persona B: service-operation evidence, same target job.
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('카페 재고관리 아르바이트');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('품목별 폐기량을 기록해 발주 수량을 조정했다.');
  await page.locator('[data-exp="1"][data-expkey="title"]').fill('매장 동선 개선');
  await page.locator('[data-exp="1"][data-expkey="summary"]').fill('혼잡 시간 주문 흐름을 관찰하고 작업 순서를 바꿨다.');
  await page.locator('[data-exp="2"][data-expkey="title"]').fill('고객 문의 기록');
  await page.locator('[data-exp="2"][data-expkey="summary"]').fill('반복 문의를 유형별로 정리해 안내문을 수정했다.');
  await page.locator('[data-path="star.actionWhat"]').fill('폐기기록을 일주일 단위로 비교해 과다발주 품목을 표시했다.');
  await page.locator('[data-path="star.result"]').fill('다음 발주에서 해당 품목 주문량을 줄였다.');
  await page.locator('[data-path="star.evidence"]').fill('재고기록표와 발주내역');
  const promptB=await page.locator('#keywordPromptPreview').inputValue();

  // Persona C: coordination evidence, same target job.
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('학생회 행사 운영');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('부스별 준비상태와 납품일정을 표로 정리했다.');
  await page.locator('[data-exp="1"][data-expkey="title"]').fill('공모전 팀 일정관리');
  await page.locator('[data-exp="1"][data-expkey="summary"]').fill('역할별 마감일을 정하고 지연 작업을 재배분했다.');
  await page.locator('[data-exp="2"][data-expkey="title"]').fill('동아리 예산 정산');
  await page.locator('[data-exp="2"][data-expkey="summary"]').fill('지출증빙을 항목별로 확인해 누락자료를 요청했다.');
  await page.locator('[data-path="star.actionWhat"]').fill('납품 지연 가능성이 있는 부스를 찾아 담당자와 대체 일정을 조정했다.');
  await page.locator('[data-path="star.result"]').fill('행사 전날까지 모든 부스 준비상태를 확인했다.');
  await page.locator('[data-path="star.evidence"]').fill('행사 체크리스트와 일정표');
  const promptC=await page.locator('#keywordPromptPreview').inputValue();

  assert(promptA!==promptB&&promptB!==promptC&&promptA!==promptC,'STEP4 three student personas must generate different prompts');
  assert(promptA.includes('환경데이터 캡스톤')&&!promptA.includes('카페 재고관리 아르바이트'),'Persona A prompt must contain only Persona A evidence');
  assert(promptB.includes('카페 재고관리 아르바이트')&&!promptB.includes('학생회 행사 운영'),'Persona B prompt must contain only Persona B evidence');
  assert(promptC.includes('학생회 행사 운영')&&!promptC.includes('환경데이터 캡스톤'),'Persona C prompt must contain only Persona C evidence');
  for(const prompt of [promptA,promptB,promptC]){
    assert(prompt.includes('직무의 주요 과업·해결과제·필요역량'),'Every personalized prompt must preserve the same job-evidence axis');
    assert(prompt.includes('모든 학생에게 같은 역량 목록을 주지 말고'),'Every personalized prompt must prohibit generic identical competency output');
    assert(prompt.includes('개조식'),'STEP4 prompt must request bullet-style output');
  }

  // Restore Persona A for downstream portfolio/GAP checks.
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('환경데이터 캡스톤');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('측정 데이터를 정리하고 이상값 원인을 비교했다.');
  await page.locator('[data-exp="1"][data-expkey="title"]').fill('화공실험 팀프로젝트');
  await page.locator('[data-exp="1"][data-expkey="summary"]').fill('실험조건을 바꾸어 에너지 사용량 차이를 비교했다.');
  await page.locator('[data-exp="2"][data-expkey="title"]').fill('학과 데이터 정리');
  await page.locator('[data-exp="2"][data-expkey="summary"]').fill('엑셀로 반복 측정값을 정리하고 오류값을 표시했다.');
  await page.locator('[data-path="star.actionWhat"]').fill('기준값과 측정값을 비교해 원인 후보를 정리했다.');
  await page.locator('[data-path="star.result"]').fill('재시험 대상을 좁히고 결과를 보고서로 정리했다.');
  await page.locator('[data-path="star.evidence"]').fill('측정기록과 프로젝트 보고서');
  const keywordPrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(keywordPrompt.includes('환경데이터 캡스톤'),'Restored STEP4 prompt must contain Persona A evidence');
  await page.locator('[data-path="ai.keywordResult"]').fill('• 데이터 해석\n• 기준 기반 문제분석\n• 환경업무 문서화');
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-exp="0"][data-expkey="title"]').inputValue())==='환경데이터 캡스톤','STEP4 experience must persist after reload');
  assert((await page.locator('[data-path="ai.keywordResult"]').inputValue()).includes('데이터 해석'),'STEP4 AI result must persist after reload');
  await page.locator('[data-next="5"]').click();

  // STEP 5: auto-fill STEP3 target, but allow direct switching.
  await page.waitForSelector('#step5TargetSelect');
  const autoTarget=await page.locator('#step5TargetSelect').inputValue();
  assert(autoTarget.includes('kea-2026-h2')&&autoTarget.includes('화공·환경'),'STEP5 must auto-fill the STEP3 comparison target');
  const targetTexts=await page.locator('#step5TargetSelect option').allTextContents();
  assert(targetTexts.some(x=>x.includes('직접입력 에너지기업')),'STEP5 must offer the STEP3 custom company');
  assert(targetTexts.some(x=>x.includes('학생이 찾은 에너지기업')),'STEP5 must offer the STEP2 student-found posting');

  await page.locator('#step5TargetSelect').selectOption('searched');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('학생이 찾은 에너지기업'),'STEP5 must select the STEP2 student-found posting');
  assert((await page.locator('.requirementSource').nth(0).innerText()).includes('화학공학 관련 전공 우대'),'STEP5 must auto-load student-found posting memo into requirements');

  await page.locator('#step5TargetSelect').selectOption('custom');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('직접입력 에너지기업'),'STEP5 must select the STEP3 custom company');
  assert((await page.locator('.requirementSource').nth(0).innerText()).includes('TOEIC 800'),'STEP5 custom target must auto-load required qualifications');
  assert((await page.locator('.requirementSource').nth(1).innerText()).includes('대기환경기사'),'STEP5 custom target must auto-load preferences');

  await page.locator('#step5TargetSelect').selectOption('curated|hdelectric-2026-h2|설계·품질|품질경영');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('HD현대일렉트릭'),'STEP5 must allow direct comparison-target switching');
  const hdGapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(hdGapPrompt.includes('품질경영'),'STEP5 direct selection must flow into GAP prompt');
  assert(hdGapPrompt.includes('부적합사항(NCR)'),'STEP5 must use registered HD Electric role data');
  assert(hdGapPrompt.includes('직무별 공식 우대사항'),'STEP5 must compare role-specific official preferences');

  await page.locator('#step5TargetSelect').selectOption('curated|kea-2026-h2|기술|화공·환경');
  await page.waitForSelector('#step5TargetSelect');
  assert((await page.locator('.gapTargetBlock').innerText()).includes('한국에너지공단'),'STEP5 must restore KEA target');
  const step5Text=(await page.locator('#stepRoot').innerText())||'';
  assert(step5Text.includes('② 공고 요구조건 × 내 스펙 한 번에 비교'),'STEP5 must merge spec entry and requirement comparison into one block');
  assert(step5Text.includes('③ AI로 내 GAP 분석'),'STEP5 must keep AI GAP analysis as step 3');
  assert(step5Text.includes('④ 최종 GAP과 3개월 행동'),'STEP5 must end at step 4');
  assert(!step5Text.includes('⑤ 내가 정한 최종 GAP과 행동'),'STEP5 must remove the old fifth block');
  assert(await page.locator('[data-path="student.otherSpec"]').count()===0,'STEP5 must remove duplicated other-spec input');
  const sparseGapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(sparseGapPrompt.includes('[Jobfit의 현재 GAP 정보충분도 진단]'),'STEP5 prompt must diagnose GAP evidence sufficiency before analysis');
  assert(sparseGapPrompt.includes('현재 상태: 추가질문 필요'),'Unclassified STEP5 requirements must trigger follow-up questions');
  assert(sparseGapPrompt.includes('아직 판정하지 않은 공고조건'),'STEP5 diagnostics must identify unclassified requirements');
  assert(sparseGapPrompt.includes('최종 GAP 분석을 하지 말고 [추가질문] 하나만 제시'),'STEP5 AI must ask one question instead of analyzing incomplete GAP evidence');

  await page.locator('[data-path="student.certificates"]').fill('대기환경기사 준비 중');
  await page.locator('[data-path="student.language"]').fill('TOEIC 820');
  await page.locator('[data-path="student.tools"]').fill('Excel, Python');
  const autoEvidence=await page.locator('[data-req="1"][data-reqkey="note"]').inputValue();
  assert(autoEvidence.includes('대기환경기사 준비 중'),'STEP5 must auto-connect previously entered student spec to matching requirements');
  await page.locator('[data-req="0"][data-reqkey="status"]').selectOption('충족');
  await page.locator('[data-req="0"][data-reqkey="note"]').fill('공통 지원자격 확인');
  await page.locator('[data-req="1"][data-reqkey="status"]').selectOption('일부 준비');
  await page.locator('[data-req="1"][data-reqkey="note"]').fill('대기환경기사 준비 중');
  await page.locator('[data-req="2"][data-reqkey="status"]').selectOption('현재 GAP');
  await page.locator('[data-req="2"][data-reqkey="note"]').fill('공식 직무기술서 기반 현장형 문제풀이 경험 부족');
  assert((await page.locator('#derivedGapAssetsPreview').innerText()).includes('공통 지원자격 확인'),'STEP5 confirmed evidence must update live without a duplicate strengths input');
  const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(gapPrompt.includes('한국에너지공단'),'STEP5 GAP prompt must use restored KEA target');
  assert(gapPrompt.includes('필수적으로 부족한 정보: 없음'),'Completed STEP5 evidence must clear mandatory GAP evidence gaps');
  assert(gapPrompt.includes('현재 상태: GAP 분석 준비 완료'),'STEP5 must stop follow-up questioning once GAP evidence is sufficient');
  assert(gapPrompt.includes('이미 입력된 자격증·어학·도구·경험·판정은 다시 묻지 마라'),'STEP5 adaptive interview must not repeat known information');
  assert(gapPrompt.includes('개조식'),'STEP5 GAP prompt must request bullet-style output');
  await page.locator('[data-path="fit.gaps"]').fill('직무기술서 기반 전문지식 보강, 현장 경험 부족');
  await page.locator('[data-path="fit.actions"]').fill('공식 직무기술서 학습과 에너지 데이터 미니 프로젝트 완성');
  await page.locator('[data-path="ai.gapResult"]').fill('• 우선 GAP: 직무 전문지식과 현장형 Evidence');
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-path="student.language"]').inputValue())==='TOEIC 820','STEP5 spec must persist after reload');
  assert((await page.locator('[data-path="fit.gaps"]').inputValue()).includes('현장 경험 부족'),'STEP5 GAP must persist after reload');
  assert((await page.locator('[data-path="ai.gapResult"]').inputValue()).includes('우선 GAP'),'STEP5 AI result must persist after reload');
  await page.locator('[data-next="6"]').click();

  // STEP 6
  await page.waitForSelector('.preview');
  const portfolio=await page.locator('.preview').innerText();
  assert(portfolio.includes('한국에너지공단'),'Portfolio must include selected public institution');
  assert(portfolio.includes('환경데이터 캡스톤'),'Portfolio must include student experience');
  assert(!portfolio.includes('유형 미지정'),'Portfolio must not carry the removed experience-type field');
  assert(!portfolio.includes('기타 스펙:'),'Portfolio must not carry the removed duplicate other-spec field');
  assert(portfolio.includes('현재 확인된 근거'),'Portfolio must use derived evidence instead of a duplicate strengths input');

  const selfPrompt=await page.locator('#selfIntroPromptPreview').inputValue();
  const interviewPrompt=await page.locator('#interviewPromptPreview').inputValue();
  assert(selfPrompt.includes('한국에너지공단 2026 자기소개서 실제 문항'),'KEA self-intro prompt must use official questions');
  assert(selfPrompt.includes('미래성장동력'),'KEA self-intro prompt must include the official contribution question');
  assert(selfPrompt.includes('블라인드'),'KEA self-intro prompt must include blind-writing rules');
  assert(selfPrompt.includes('연결할 공식 NCS/업무축'),'KEA self-intro prompt must map each story to the selected official role');
  assert(selfPrompt.includes('개조식'),'Self-intro prompt must request bullet-style output');
  assert(interviewPrompt.includes('총 12개의 실무면접 예상질문'),'Interview prompt must request practical interview questions');
  assert(interviewPrompt.includes('직무수행능력면접 60점'),'Interview prompt must reflect KEA interview evaluation');
  assert(interviewPrompt.includes('발표면접 예상 주제 · 2문항'),'KEA interview prompt must reflect the presentation-interview format');
  assert(interviewPrompt.includes('공정의 연료·에너지 흐름'),'KEA interview prompt must use the selected chemical/environment role question axis');
  assert(interviewPrompt.includes('공식 근거: NCS/직무수행내용/필요지식/필요기술/직무수행태도'),'KEA interview prompt must trace questions to official evidence');
  assert(interviewPrompt.includes('예상 꼬리질문'),'Interview prompt must include follow-up questions');

  await page.locator('[data-path="ai.selfIntroResult"]').fill('• 문항별 소재배치 저장 테스트');
  await page.locator('[data-path="ai.interviewResult"]').fill('• Q1 화공·환경 실무질문 저장 테스트');
  await page.locator('#interviewPromptPreview').fill(interviewPrompt+'\n• 사용자 수정 프롬프트');
  await page.reload({waitUntil:'networkidle'});
  assert((await page.locator('[data-path="ai.selfIntroResult"]').inputValue()).includes('소재배치 저장 테스트'),'STEP6 self-intro AI result must persist after reload');
  assert((await page.locator('[data-path="ai.interviewResult"]').inputValue()).includes('실무질문 저장 테스트'),'STEP6 interview AI result must persist after reload');
  assert((await page.locator('#interviewPromptPreview').inputValue()).includes('사용자 수정 프롬프트'),'Edited STEP6 prompt must persist after reload');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:flexlab:job-analysis:v1')));
  assert(saved.version===11,'FLEX state version must be 11');
  assert(saved.sampleJobId==='kea-2026-h2','Selected KEA target must persist');

  console.log('FLEX role-specific KEA/HD Electric + browser persistence flow: PASS');
}finally{
  await browser.close();
}

import { chromium } from 'playwright';

const URL=process.env.FLEXLAB_TEST_URL||'http://127.0.0.1:8765/flexlab/';
function assert(ok,msg){if(!ok)throw new Error(msg)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.removeItem('jobfit:flexlab:job-analysis:v1'));
  await page.reload({waitUntil:'networkidle'});

  // STEP 01 · 부경대 기계공학 학생
  await page.locator('[data-path="target.industry"]').fill('에너지');
  await page.locator('[data-path="target.job"]').fill('구조설계');
  await page.locator('[data-path="student.major"]').fill('기계공학');
  await page.locator('[data-path="target.initialView"]').fill('CAD로 제품 구조와 도면을 설계하는 직무라고 생각한다.');
  await page.locator('[data-next="2"]').click();

  // STEP 02 · 실제 공고 검색 → STEP 03 자동승계
  await page.waitForSelector('[data-path="step2Search.company"]');
  await page.locator('[data-path="step2Search.company"]').fill('HD현대일렉트릭');
  await page.locator('[data-path="step2Search.title"]').fill('2026년 하반기 신입사원 구조설계');
  await page.locator('[data-path="step2Search.sourceUrl"]').fill('https://hd-recruit2026.com/');
  await page.locator('[data-path="step2Search.facts"]').fill('주요 제품 상세 구조설계 및 개발\n도면 일정·완성도 관리\n설계 외주·설계 품질 관리\n설계도면 제도·표준 관리');
  await page.locator('#useStep2JobBtn').click();

  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#stepRoot').innerText()).includes('HD현대일렉트릭'),'STEP2 found HD Electric must carry into STEP3');
  assert((await page.locator('[data-curated-role="hdelectric-2026-h2"]').inputValue())==='구조설계','STEP2 target role must auto-select matching curated structure-design role');
  const jobPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(jobPrompt.includes('구조설계')&&jobPrompt.includes('기계공학'),'STEP3 prompt must use the student major and selected role');

  // STEP 03 · 5개 핵심 직무분석 + 선택형 경력개발
  await page.locator('#jobTableAiResult').fill([
    '고객·KPI:',
    '• 제품개발·생산·품질 부서 / 도면 정확성·설계완성도·일정 준수 [추론]',
    '주요 과업:',
    '• 주요 제품 상세 구조설계·개발',
    '• 도면 일정·완성도 관리',
    '• 설계 외주·품질 및 표준 관리',
    '주요 해결과제:',
    '• 구조 요구조건을 도면에 정확히 반영 [추론]',
    '• 설계변경과 일정·품질을 함께 관리 [추론]',
    '해결방법:',
    '• 요구조건 확인 → 구조·도면 검토 → 치수·간섭 확인 → 변경 후 재검증 [추론]',
    '필요역량:',
    '• 기계구조 이해 [추론] • 도면검토·CAD 활용 [추론] • 정확성·표준준수 [추론]',
    '경력개발(선택):',
    '• 기계설계 기초 → 상세 구조설계·도면품질 → 설계표준·제품개발'
  ].join('\n'));
  await page.locator('#applyJobTableAiBtn').click();
  assert(await page.locator('.jobAnalysisPreview th').count()===5,'STEP3 core table must have five essential columns');
  assert((await page.locator('#stepRoot').innerText()).includes('경력개발 방향 보기 · 선택'),'Career development must be optional');

  // STEP 04 · 경험근거 → 개인 역량 → 3~5개만 Portfolio 반영
  await page.locator('[data-next="4"]').click();
  await page.locator('[data-path="student.majorEvidence"]').fill('기계설계 수업에서 축·베어링 구조를 계산하고 CAD 조립도를 작성했다.');
  const experiences=[
    ['기계설계 캡스톤','프레임 구조를 모델링하고 부품 간 간섭을 확인해 형상을 수정했다.'],
    ['CAD 과제','조립도와 부품도를 작성하고 치수 누락을 체크리스트로 검토했다.'],
    ['3D프린팅 프로젝트','시제품 조립오차를 측정해 설계 치수를 수정했다.']
  ];
  for(let i=0;i<3;i++){
    await page.locator('[data-exp="'+i+'"][data-expkey="title"]').fill(experiences[i][0]);
    await page.locator('[data-exp="'+i+'"][data-expkey="summary"]').fill(experiences[i][1]);
  }
  await page.locator('[data-path="star.actionWhat"]').fill('조립 모델의 간섭 위치를 확인하고 문제가 되는 치수와 형상을 수정한 뒤 다시 조립성을 점검했다.');
  await page.locator('[data-path="star.result"]').fill('시제품 재출력에서 간섭을 줄이고 최종 조립을 완료했다.');
  await page.locator('[data-path="star.evidence"]').fill('CAD 파일, 간섭검토 캡처, 시제품 사진');

  const competencyPrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(competencyPrompt.includes('[Portfolio용 핵심역량 요약]'),'STEP4 prompt must request compact portfolio-ready competency output');
  assert(competencyPrompt.includes('기계설계 캡스톤')&&competencyPrompt.includes('구조설계'),'STEP4 prompt must personalize job and experience');

  await page.locator('[data-path="ai.keywordResult"]').fill([
    '[출력 1 · 경험별 직무 연결]',
    '• 기계설계 캡스톤 → 구조설계 직접 연결',
    '[출력 2 · 이 학생의 핵심 직무역량 3~5개]',
    '• 구조설계·도면검토: 조립모델 검토와 형상 수정 근거',
    '[출력 3 · 자기소개서·면접에 가장 쓸 만한 경험]',
    '• 기계설계 캡스톤',
    '[출력 4 · 아직 증거가 부족한 직무역량]',
    '• 설계표준 적용 경험',
    '[Portfolio용 핵심역량 요약]',
    '• 구조설계·도면검토 → 상세 구조설계 → 조립모델에서 간섭 확인·형상 수정 → 충분',
    '• 간섭·치수 문제 확인 → 도면 완성도 관리 → 치수 누락·간섭을 체크리스트로 확인 → 충분',
    '• 설계변경 후 재검증 → 설계품질 관리 → 수정 후 모델·시제품을 다시 확인 → 충분'
  ].join('\n'));
  await page.locator('#applyCompetencySummaryBtn').click();
  assert((await page.locator('#stepRoot').innerText()).includes('구조설계·도면검토 → 상세 구조설계'),'STEP4 must save compact competency summary');

  // STEP 05 · 조건-스펙 비교 → AI 결과 자동 반영 → 학생 확인
  await page.locator('[data-next="5"]').click();
  await page.locator('[data-path="student.certificates"]').fill('일반기계기사 준비 중');
  await page.locator('[data-path="student.language"]').fill('TOEIC Speaking 130');
  await page.locator('[data-path="student.tools"]').fill('AutoCAD, SolidWorks');

  for(const [i,status,note] of [
    [0,'충족','학사 졸업예정 / TOEIC Speaking 130'],
    [1,'일부 준비','기계공학 전공 / 일반기계기사 준비 중'],
    [2,'일부 준비','기계설계 캡스톤·CAD 과제로 구조설계 경험 일부 보유']
  ]){
    const select=page.locator('[data-req="'+i+'"][data-reqkey="status"]');
    if(await select.count()){
      await select.selectOption(status);
      await page.locator('[data-req="'+i+'"][data-reqkey="note"]').fill(note);
    }
  }
  const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(gapPrompt.includes('GAP 분석 준비 완료'),'STEP5 must recognize sufficient evidence before final GAP analysis');

  await page.locator('[data-path="ai.gapResult"]').fill([
    '[1. 이 직무에서 실제로 하는 일]',
    '• 구조설계·도면 완성도·품질관리',
    '[2. 공고상 지원·평가·우대조건]',
    '• 기계 관련 전공과 관련 자격·경험 우대',
    '[3. 내가 이미 갖춘 근거]',
    '• 기계공학 전공 → 기계설계 수업·캡스톤',
    '[4. 일부 준비된 항목]',
    '• 일반기계기사 준비 중',
    '[5. 현재 GAP · 최대 3개]',
    '• GAP 1: 전력기기 제품구조 이해가 부족함',
    '• GAP 2: 실제 설계표준을 적용한 결과물이 부족함',
    '[6. 우선순위]',
    '• 1순위: 전력기기 제품구조 이해',
    '• 2순위: 설계표준 적용 결과물',
    '[7. 3개월 보완 행동]',
    '• 변압기·차단기 구조자료 3건 비교 → 제품구조 비교노트',
    '• 전력기기 부품 1개 도면을 검토 → 도면검토 포트폴리오',
    '• 일반기계기사 학습계획 실행 → 주차별 학습기록'
  ].join('\n'));
  await page.locator('#applyGapResultBtn').click();
  assert((await page.locator('[data-path="fit.gaps"]').inputValue()).includes('전력기기 제품구조 이해'),'STEP5 must auto-apply GAP 1');
  assert((await page.locator('[data-path="fit.actions"]').inputValue()).includes('도면검토 포트폴리오'),'STEP5 must auto-apply 3-month action');

  // STEP 06 · 진짜 취업준비 결과물
  await page.locator('[data-next="6"]').click();
  await page.waitForSelector('.preview');
  const portfolio=await page.locator('.preview').innerText();
  for(const expected of [
    'HD현대일렉트릭','구조설계','기계공학',
    '기계설계 캡스톤',
    '구조설계·도면검토 → 상세 구조설계',
    '전력기기 제품구조 이해',
    '도면검토 포트폴리오'
  ])assert(portfolio.includes(expected),'Final portfolio missing useful student outcome: '+expected);
  assert(!portfolio.includes('[출력 1 · 경험별 직무 연결]'),'Final portfolio must not dump raw long STEP4 AI output');
  assert(!portfolio.includes('경력계획:'),'Optional career-development text must not bloat the final portfolio');

  console.log('PUKYONG mechanical student STEP1→6 final usability flow: PASS');
}finally{
  await browser.close();
}

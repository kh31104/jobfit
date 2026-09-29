import { chromium } from 'playwright';

const URL=process.env.FLEXLAB_TEST_URL||'http://127.0.0.1:8765/flexlab/';
function assert(ok,msg){if(!ok)throw new Error(msg)}

const personas=[
  {
    id:'business',
    industry:'에너지',
    targetJob:'경영기획',
    major:'경영학',
    method:'kea-2026-h2',
    group:'사무',
    role:'경영·경제',
    jobAi:[
      '고객·KPI: • 경영진·내부부서 / 경영계획·예산·성과지표의 정확성과 실행도',
      '주요 과업: • 경영환경 분석 • 경영계획·예산·KPI 관리 • 부서 의사결정 지원',
      '주요 해결과제: • 부서별 자료 정합성 확보 • 한정된 예산의 우선순위 판단',
      '해결방법: • 자료 기준 통일 • KPI·예산 데이터 비교 • 기획서와 보고자료 작성',
      '필요역량: • 경영환경·KPI 분석 • 예산·문서 작성 • 부서간 의견조율',
      '경력개발: • 경영기획·성과관리·예산기획 영역으로 전문성 확대'
    ],
    majorEvidence:'경영전략 수업에서 기업 환경분석과 KPI 설계 과제를 수행했다.',
    experiences:[
      ['마케팅 프로젝트','고객 설문 결과를 엑셀로 정리해 세그먼트별 차이를 비교했다.'],
      ['학생회 예산관리','행사별 예산안을 비교해 우선순위를 정하고 지출내역을 정리했다.'],
      ['경영학 팀발표','팀원 자료를 동일 기준으로 맞춰 최종 기획안을 편집했다.']
    ],
    action:'설문 응답을 기준별로 재분류하고 핵심 고객군의 차이를 표로 만들었다.',
    result:'발표에서 타깃 고객을 하나로 좁혀 마케팅 제안을 정리했다.',
    evidence:'설문 데이터 파일과 최종 발표자료',
    keywordResult:'• 데이터 기반 기획\n• KPI·예산 관점의 우선순위 판단\n• 문서 구조화와 조율',
    certificates:'컴퓨터활용능력 1급',
    language:'TOEIC 850',
    tools:'Excel, PowerPoint',
    gaps:'에너지산업 경영지표 이해, 공공기관 NCS 준비',
    actions:'에너지공기업 경영자료 3건을 분석하고 NCS 문제풀이 기록을 만든다.'
  },
  {
    id:'cs',
    industry:'에너지',
    targetJob:'ICT/DT',
    major:'컴퓨터공학',
    method:'hdelectric-2026-h2',
    group:'디지털·경영지원',
    role:'ICT/DT',
    jobAi:[
      '고객·KPI: • 내부 현업 사용자 / 시스템 안정성·업무처리 정확성·개선 반영',
      '주요 과업: • SAP/ERP 운영 • Legacy 시스템 개선 • 업무 프로세스 표준화 • CAD/PLM 시스템 운영',
      '주요 해결과제: • 현업 요구를 시스템 요구사항으로 변환 • 기존 시스템과 신규 기능의 연계',
      '해결방법: • 요구사항 분석 • 프로세스 모델링 • 테스트·오류확인 • 운영 피드백 반영',
      '필요역량: • 시스템 분석 • 데이터 처리 • 프로세스 설계 • 테스트·운영',
      '경력개발: • ERP·업무시스템 운영에서 IT/DT 기획·프로세스 혁신 영역으로 확대'
    ],
    majorEvidence:'소프트웨어공학 수업에서 요구사항 정의와 웹서비스 테스트를 수행했다.',
    experiences:[
      ['캡스톤 웹서비스','사용자 요구를 기능목록으로 정리하고 API 연동 기능을 구현했다.'],
      ['데이터베이스 프로젝트','SQL로 주문 데이터를 조회하고 중복 데이터를 정리했다.'],
      ['교내 해커톤','오류 로그를 확인해 로그인 실패 원인을 찾아 수정했다.']
    ],
    action:'사용자 요구사항을 기능 단위로 나누고 API 응답 오류를 로그로 확인했다.',
    result:'핵심 기능 시연을 완료하고 테스트 실패 항목을 줄였다.',
    evidence:'GitHub 커밋, 테스트 체크리스트, 시연영상',
    keywordResult:'• 요구사항 분석\n• 시스템 연계·테스트\n• 데이터 처리와 오류 추적',
    certificates:'정보처리기사 준비 중',
    language:'OPIc IM2',
    tools:'Python, SQL, Git, REST API',
    gaps:'ERP/SAP 실무 경험, 제조업 프로세스 이해',
    actions:'SAP 학습과 제조 데이터 흐름 미니프로젝트를 완성해 GitHub에 정리한다.'
  },
  {
    id:'mechanical',
    industry:'에너지',
    targetJob:'구조설계',
    major:'기계공학',
    method:'hdelectric-2026-h2',
    group:'설계·품질',
    role:'구조설계',
    jobAi:[
      '고객·KPI: • 제품개발·생산·품질 부서 / 도면 정확성·설계완성도·일정 준수',
      '주요 과업: • 주요 제품 상세 구조설계·개발 • 도면 일정·완성도 관리 • 설계표준 관리',
      '주요 해결과제: • 구조 요구조건을 도면에 정확히 반영 • 설계변경과 일정의 동시 관리',
      '해결방법: • 요구조건 확인 • CAD 도면 검토 • 치수·간섭 점검 • 표준 반영',
      '필요역량: • 기계구조 이해 • CAD 도면해독·작성 • 설계변경·품질 관리',
      '경력개발: • 상세설계에서 제품개발·설계표준·설계품질 영역으로 확대'
    ],
    majorEvidence:'기계설계 수업에서 축·베어링 구조를 계산하고 CAD 조립도를 작성했다.',
    experiences:[
      ['기계설계 캡스톤','프레임 구조를 모델링하고 부품 간 간섭을 확인해 형상을 수정했다.'],
      ['CAD 과제','조립도와 부품도를 작성하고 치수 누락을 체크리스트로 검토했다.'],
      ['3D프린팅 프로젝트','시제품 출력 후 조립 오차를 측정해 설계 치수를 수정했다.']
    ],
    action:'조립 모델에서 간섭 위치를 확인하고 치수와 형상을 수정한 뒤 다시 조립성을 점검했다.',
    result:'시제품 재출력에서 조립 간섭을 줄이고 최종 조립을 완료했다.',
    evidence:'CAD 파일, 간섭검토 캡처, 시제품 사진',
    keywordResult:'• 구조설계와 도면검토\n• 간섭·치수 문제 확인\n• 설계변경 후 재검증',
    certificates:'일반기계기사 준비 중',
    language:'TOEIC Speaking 130',
    tools:'AutoCAD, SolidWorks',
    gaps:'전력기기 제품구조 이해, 설계표준 적용 경험',
    actions:'변압기·차단기 구조자료를 분석하고 부품 하나의 도면 검토 포트폴리오를 만든다.'
  }
];

async function runPersona(browser,p){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  try{
    await page.goto(URL,{waitUntil:'networkidle'});
    await page.evaluate(()=>localStorage.removeItem('jobfit:flexlab:job-analysis:v1'));
    await page.reload({waitUntil:'networkidle'});

    await page.locator('[data-path="target.industry"]').fill(p.industry);
    await page.locator('[data-path="target.job"]').fill(p.targetJob);
    await page.locator('[data-path="student.major"]').fill(p.major);
    await page.locator('[data-next="2"]').click();
    await page.waitForSelector('[data-path="step2Search.company"]');
    await page.locator('[data-next="3"]').click();

    await page.waitForSelector('[data-analysis-method="'+p.method+'"]');
    await page.locator('[data-analysis-method="'+p.method+'"]').click();
    await page.waitForSelector('[data-curated-group="'+p.method+'"]');
    await page.locator('[data-curated-group="'+p.method+'"]').selectOption(p.group);
    await page.waitForSelector('[data-curated-role="'+p.method+'"]');
    await page.locator('[data-curated-role="'+p.method+'"]').selectOption(p.role);
    await page.waitForSelector('#jobPromptPreview');
    const jobPrompt=await page.locator('#jobPromptPreview').inputValue();

    await page.locator('#jobTableAiResult').fill(p.jobAi.join('\n'));
    await page.locator('#applyJobTableAiBtn').click();
    await page.waitForSelector('[data-path="jobTable.tasks"]');
    await page.locator('[data-next="4"]').click();

    await page.waitForSelector('[data-path="student.majorEvidence"]');
    await page.locator('[data-path="student.majorEvidence"]').fill(p.majorEvidence);
    for(let i=0;i<3;i++){
      await page.locator('[data-exp="'+i+'"][data-expkey="title"]').fill(p.experiences[i][0]);
      await page.locator('[data-exp="'+i+'"][data-expkey="summary"]').fill(p.experiences[i][1]);
    }
    await page.locator('[data-path="star.actionWhat"]').fill(p.action);
    await page.locator('[data-path="star.result"]').fill(p.result);
    await page.locator('[data-path="star.evidence"]').fill(p.evidence);
    const competencyPrompt=await page.locator('#keywordPromptPreview').inputValue();
    await page.locator('[data-path="ai.keywordResult"]').fill(p.keywordResult);
    await page.locator('[data-next="5"]').click();

    await page.waitForSelector('#step5TargetSelect');
    await page.locator('[data-path="student.certificates"]').fill(p.certificates);
    await page.locator('[data-path="student.language"]').fill(p.language);
    await page.locator('[data-path="student.tools"]').fill(p.tools);
    for(const [i,status] of [[0,'충족'],[1,'일부 준비'],[2,'현재 GAP']]){
      const el=page.locator('[data-req="'+i+'"][data-reqkey="status"]');
      if(await el.count())await el.selectOption(status);
    }
    const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
    await page.locator('[data-path="fit.gaps"]').fill(p.gaps);
    await page.locator('[data-path="fit.actions"]').fill(p.actions);
    await page.locator('[data-next="6"]').click();

    await page.waitForSelector('.preview');
    const portfolio=await page.locator('.preview').innerText();
    return {id:p.id,jobPrompt,competencyPrompt,gapPrompt,portfolio};
  }finally{
    await page.close();
  }
}

const browser=await chromium.launch({headless:true});
try{
  const results=[];
  for(const p of personas)results.push(await runPersona(browser,p));

  const [business,cs,mechanical]=results;
  for(const pair of [[business,cs],[business,mechanical],[cs,mechanical]]){
    assert(pair[0].jobPrompt!==pair[1].jobPrompt,'STEP3 prompts must differ across majors/roles: '+pair[0].id+' vs '+pair[1].id);
    assert(pair[0].competencyPrompt!==pair[1].competencyPrompt,'STEP4 prompts must differ across student evidence: '+pair[0].id+' vs '+pair[1].id);
    assert(pair[0].gapPrompt!==pair[1].gapPrompt,'STEP5 prompts must differ across specs/GAP: '+pair[0].id+' vs '+pair[1].id);
    assert(pair[0].portfolio!==pair[1].portfolio,'Final portfolios must differ across student personas: '+pair[0].id+' vs '+pair[1].id);
  }

  assert(business.jobPrompt.includes('경영·경제')&&business.competencyPrompt.includes('경영학')&&business.portfolio.includes('마케팅 프로젝트'),'Business persona must preserve business-specific target and evidence');
  assert(cs.jobPrompt.includes('ICT/DT')&&cs.competencyPrompt.includes('컴퓨터공학')&&cs.portfolio.includes('캡스톤 웹서비스'),'CS persona must preserve ICT/DT-specific target and evidence');
  assert(mechanical.jobPrompt.includes('구조설계')&&mechanical.competencyPrompt.includes('기계공학')&&mechanical.portfolio.includes('기계설계 캡스톤'),'Mechanical persona must preserve structural-design target and evidence');

  for(const r of results){
    assert(r.competencyPrompt.includes('[정보가 부족할 때의 AI 인터뷰 규칙]'),'Every persona must carry the adaptive evidence-interview protocol: '+r.id);
    assert(r.competencyPrompt.includes('필수적으로 부족한 정보: 없음'),'Completed persona core evidence must pass the mandatory evidence gate: '+r.id);
    assert(r.competencyPrompt.includes('[추가질문]'),'Every persona prompt must define the one-question-at-a-time follow-up format: '+r.id);
    assert(r.gapPrompt.includes('[정보가 부족할 때의 GAP 확인 인터뷰 규칙]'),'Every persona GAP prompt must carry the adaptive evidence-check protocol: '+r.id);
    assert(r.gapPrompt.includes('[추가질문]'),'Every persona GAP prompt must define the one-question-at-a-time follow-up format: '+r.id);
    for(const heading of ['1. TARGET JOB','2. JOB ANALYSIS','3. MY EVIDENCE','4. MY COMPETENCY','5. SPEC & GAP']){
      assert(r.portfolio.includes(heading),'Portfolio must retain concise five-part structure: '+r.id+' / '+heading);
    }
    for(const removed of ['SEARCH EXPERIENCE','처음 생각한 직무 이미지','[AI GAP 분석 메모]','APPLICATION MATERIALS']){
      assert(!r.portfolio.includes(removed),'Portfolio must exclude process/duplicate output: '+r.id+' / '+removed);
    }
  }

  console.log('FLEX 3-major personalized STEP3→4→5→Portfolio differentiation: PASS');
}finally{
  await browser.close();
}

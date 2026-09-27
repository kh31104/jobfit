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

  await page.locator('[data-path="target.job"]').fill('발전운영·전기설비');
  await page.locator('[data-path="student.major"]').fill('전기공학');
  await page.locator('[data-next="2"]').click();
  await page.waitForSelector('[data-path="step2Search.company"]');

  await page.locator('[data-path="step2Search.company"]').fill('현재 찾지 못함');
  await page.locator('[data-path="step2Search.title"]').fill('에너지 관련 신입 공고 없음');
  const searchPrompt=await page.locator('#searchPromptPreview').inputValue();
  assert(searchPrompt.includes('전기공학'),'STEP2 prompt must include major');
  assert(searchPrompt.includes('발전운영·전기설비'),'STEP2 prompt must include target job');
  await page.locator('[data-next="3"]').click();

  await page.waitForSelector('[data-curated="komipo-2026-3"]');
  assert(await page.locator('.curatedJob').count()===2,'STEP3 must offer two curated energy postings');
  await page.locator('[data-curated="komipo-2026-3"]').click();
  await page.waitForSelector('#jobPromptPreview');
  const jobPrompt=await page.locator('#jobPromptPreview').inputValue();
  assert(jobPrompt.includes('한국중부발전'),'STEP3 job prompt must include selected public company');
  assert(jobPrompt.includes('전기공학'),'STEP3 job prompt must include student major');

  await page.locator('#jobTableAiResult').fill([
    '고객·KPI: 발전소 운영부서와 전력 이용자 / 안정운영 지표',
    '주요 과업: 발전설비 점검과 운전 데이터 확인',
    '주요 해결과제: 이상징후를 조기에 찾아 설비 신뢰성을 유지',
    '해결방법: 점검기준과 계측데이터를 비교해 원인을 좁힘',
    '필요역량: 전기설비 이해, 데이터 해석, 안전기준 준수',
    '경력개발: 설비운영 경험을 쌓아 정비·신뢰성 분야로 확장'
  ].join('\n'));
  await page.locator('#applyJobTableAiBtn').click();
  await page.waitForSelector('[data-path="jobTable.tasks"]');
  assert((await page.locator('[data-path="jobTable.tasks"]').inputValue()).includes('발전설비'),'AI result must populate job table');
  assert((await page.locator('[data-path="jobTable.competencies"]').inputValue()).includes('전기설비'),'AI result must populate competency field');
  await page.locator('[data-next="4"]').click();

  await page.waitForSelector('[data-path="student.majorEvidence"]');
  await page.locator('[data-path="student.majorEvidence"]').fill('전력계통 수업에서 부하흐름 계산과 설비 데이터를 해석했다.');
  await page.locator('[data-exp="0"][data-expkey="title"]').fill('전기설비 캡스톤');
  await page.locator('[data-exp="0"][data-expkey="summary"]').fill('센서 데이터를 비교해 이상 원인을 좁혔다.');
  await page.locator('[data-path="star.actionWhat"]').fill('측정값을 기준값과 비교하고 원인 후보를 정리했다.');
  await page.locator('[data-path="star.result"]').fill('오류 범위를 좁혀 재시험 대상을 정했다.');
  await page.locator('[data-path="star.evidence"]').fill('측정 기록과 프로젝트 보고서');
  const keywordPrompt=await page.locator('#keywordPromptPreview').inputValue();
  assert(keywordPrompt.includes('전력계통 수업'),'STEP4 prompt must include major evidence');
  assert(keywordPrompt.includes('전기설비 캡스톤'),'STEP4 prompt must include experience');
  await page.locator('[data-path="ai.keywordResult"]').fill('설비 데이터 해석 / 이상원인 분석 / 안전기준 기반 점검');
  await page.locator('[data-next="5"]').click();

  await page.waitForSelector('[data-path="student.certificates"]');
  await page.locator('[data-path="student.certificates"]').fill('전기기사 준비 중');
  await page.locator('[data-path="student.language"]').fill('TOEIC 820');
  await page.locator('[data-path="student.tools"]').fill('Excel, Python');
  const reqStatus=page.locator('[data-req="0"][data-reqkey="status"]');
  await reqStatus.selectOption('충족');
  await page.locator('[data-req="0"][data-reqkey="note"]').fill('TOEIC 820');
  const gapPrompt=await page.locator('#gapPromptPreview').inputValue();
  assert(gapPrompt.includes('TOEIC 820'),'STEP5 prompt must include student spec');
  assert(gapPrompt.includes('한국중부발전'),'STEP5 prompt must include selected posting');
  await page.locator('[data-path="fit.assets"]').fill('TOEIC 820, 전력계통 수업, 데이터 분석 경험');
  await page.locator('[data-path="fit.gaps"]').fill('전기기사 미취득, 현장 설비 경험 부족');
  await page.locator('[data-path="fit.actions"]').fill('3개월 내 전기기사 준비와 설비 데이터 미니 프로젝트 완성');
  await page.locator('[data-path="ai.gapResult"]').fill('우선 GAP: 자격증과 현장형 설비 Evidence');
  await page.locator('[data-next="6"]').click();

  await page.waitForSelector('.preview');
  const portfolio=await page.locator('.preview').innerText();
  assert(portfolio.includes('한국중부발전'),'Portfolio must include selected company');
  assert(portfolio.includes('전기설비 캡스톤'),'Portfolio must include student experience');
  assert(portfolio.includes('전기기사 미취득'),'Portfolio must include GAP');
  assert((await page.locator('#selfIntroPromptPreview').inputValue()).includes('전기설비 캡스톤'),'Self-intro prompt must be personalized');
  assert((await page.locator('#interviewPromptPreview').inputValue()).includes('전기기사 미취득'),'Interview prompt must include GAP');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:flexlab:job-analysis:v1')));
  assert(saved.version===7,'FLEX state version must be 7');
  assert(saved.sampleJobId==='komipo-2026-3','Selected curated job must persist');

  await page.evaluate(()=>localStorage.removeItem('jobfit:flexlab:job-analysis:v1'));
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-step="3"]').click();
  await page.locator('[data-curated="skenergy-2026-clx"]').click();
  await page.waitForSelector('#jobPromptPreview');
  assert((await page.locator('#jobPromptPreview').inputValue()).includes('SK에너지'),'Private-energy sample selection must work');

  console.log('FLEX energy mobile flow: PASS');
}finally{
  await browser.close();
}

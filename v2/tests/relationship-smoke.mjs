import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(cond,msg){if(!cond)throw new Error(msg)}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}

const baseState={
  version:2.2,activeStep:3,mode:'full',
  profile:{anonCode:'JF26-REL001',courseCode:'INJE2026',major:'기계공학과'},
  baseline:{jobDecision:'2–3개 후보 있음'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{
    careerDNA:{hypothesis:{text:'문제를 확인하고 개선하는 활동에 관심이 있다.'},careerAnchor:{ranking:[{code:'TF',name:'전문·직무역량',score:28},{code:'SE',name:'안정·보장',score:25},{code:'AU',name:'자율·독립',score:23}]},selfStrengths:['분석력','책임감','협력'],viaTop5:['학구열','신중함','진정성','희망','친절']},
    experienceCompetency:{experiences:[{id:'exp1',title:'캡스톤',action:'시험 결과를 비교해 오류 원인을 확인했다',result:'설계조건을 수정했다',evidence:'시험기록',competencies:['문제해결','분석'],factChecked:true}]}
  },
  artifacts:{
    jobExplorer:{
      candidates:[
        {id:'job1',title:'생산기술',family:'생산·공정·설비',industries:['자동차·모빌리티','반도체·전자'],summary:'생산공정의 문제를 확인하고 개선한다.',why:'문제해결 활동에 관심',evidence:'캡스톤 오류 원인 확인',unknowns:'현장업무 확인 필요'},
        {id:'job2',title:'데이터분석',family:'IT·데이터',industries:['IT·플랫폼','금융'],summary:'데이터를 분석해 의사결정을 돕는다.',why:'데이터 분석 관심',evidence:'시험 결과 비교',unknowns:'분석도구 확인 필요'}
      ],
      targets:[],targetCombos:[],desiredActivities:['문제 원인 찾아 해결하기','자료·데이터 분석하기'],newInterests:[],industryInterests:['자동차·모빌리티','IT·플랫폼']
    },
    experienceMap:[{id:'exp1',title:'캡스톤',action:'시험 결과를 비교해 오류 원인을 확인했다',result:'설계조건을 수정했다',evidence:'시험기록',competencies:['문제해결','분석'],factChecked:true}]
  },
  meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
};

await run('INJE navigation removes duplicate STEP 7–8 and renumbers application labs',async page=>{
  const state=structuredClone(baseState);state.activeStep=6;
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  const labels=await page.locator('.stepBtn').allTextContents();
  assert(labels.length===12,'INJE should have 12 visible steps including STEP 0–11');
  assert(!labels.some(x=>x.includes('JD Analyzer')),'Duplicate JD Analyzer step should be removed from INJE');
  assert(!labels.some(x=>x.includes('Career Asset Match')),'Duplicate Career Asset Match step should be removed from INJE');
  assert(labels.some(x=>x.includes('Industry & Company Analysis')),'STEP 7 Industry & Company Analysis missing');
  assert(!labels.some(x=>x.includes('Career Fit Map')),'INJE STEP 7 must not show Career Fit Map');
  assert(labels.some(x=>x.includes('Resume Lab')),'Resume Lab missing after renumbering');
  await page.locator('.stepBtn[data-step="7"]').click();
  await page.waitForSelector('#stepRoot .kicker');
  const text=(await page.locator('#stepRoot').textContent())||'';
  assert(text.includes('Resume Lab'),'New STEP 8 should load Resume Lab');
  assert((await page.locator('#stepRoot .kicker').first().textContent()).includes('STEP 8'),'Resume Lab kicker was not renumbered');
});

await run('INJE STEP 7 analyzes industry and up to three companies from STEP 5 target',async page=>{
  const state=structuredClone(baseState);
  state.activeStep=6;
  state.artifacts.jobExplorer.targets=['job1'];
  state.artifacts.jobExplorer.targetCombos=[{id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1}];
  state.artifacts.jobDeepDive={targetAnalyses:{target_job1_auto:{
    selectedSourceId:'src1',
    sources:[{id:'src1',companyName:'가상모빌리티A',name:'생산기술 신입공고',url:'https://example.com/jd',note:'공정 데이터 분석 및 개선'}],
    jobTable:{tasks:'공정 데이터 확인 · 이상 원인 분석',competencies:'생산공정 지식 · 데이터 분석 · 문제해결'}
  }},analyses:{}};
  state.artifacts.industryCompany={
    industries:[{id:'ind_seed',name:'자동차·모빌리티',jobId:'job1',generatedBy:'step4-inje'}],
    targetIndustries:['ind_seed'],
    companies:[{id:'co_seed',name:'가상모빌리티A',industryId:'ind_seed',jobId:'job1',generatedBy:'step4-inje'}],
    targetCompanies:['co_seed'],notes:''
  };

  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#industryPrompt');

  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const expected of ['내가 지원할 산업과 기업 이해하기','01. My Target 확인','02. Industry Scan','03. Industry × Job','04. Find Company','05. Company Analysis','06. My Target Company','생산기술 신입공고','공정 데이터 확인'])assert(body.includes(expected),'STEP 7 missing: '+expected);
  assert((await page.locator('#industryName').inputValue())==='자동차·모빌리티','Target industry should prefill from STEP 5 target');
  assert((await page.locator('#companyName').inputValue())==='','STEP 5 JD company must remain reference only, not a completed STEP 7 company analysis');
  assert(await page.locator('[data-ctarget]').count()===0,'STEP 5 generated company must not count as STEP 7 analyzed company');
  const ip=await page.locator('#industryPrompt').inputValue();
  assert(ip.includes('생산기술')&&ip.includes('자동차·모빌리티'),'Industry prompt must use target job and industry');

  await page.locator('#industryJobId').selectOption('job1');
  await page.locator('#industrySourceType').selectOption({label:'정부·공공기관'});
  await page.locator('#industrySource').fill('산업동향 공식자료');
  await page.locator('#industryUrl').fill('https://example.com/industry');
  await page.locator('#industryBusiness').fill('완성차와 부품을 생산·판매하고 개인·기업 고객에게 이동수단을 제공한다.');
  await page.locator('#industryChange').fill('전동화와 스마트팩토리 확대');
  await page.locator('#industryJobLink').fill('공정 데이터 기반 품질·생산성 개선 역량이 중요해진다.');
  await page.locator('#addIndustry').click();
  await page.locator('[data-itarget]').last().check();

  const addCompany=async(name,n)=>{
    await page.locator('#companyName').fill(name);
    await page.locator('#companyType').selectOption({label:'대기업'});
    await page.locator('#companyIndustryId').selectOption({index:1});
    await page.locator('#companyJobId').selectOption('job1');
    await page.locator('#companySource').fill('공식 사업보고서');
    await page.locator('#companyUrl').fill('https://example.com/company'+n);
    await page.locator('#companyHiringEvidence').selectOption({label:'현재 채용공고 확인'});
    await page.locator('#companyJobSource').fill('생산기술 신입공고');
    await page.locator('#companyJobUrl').fill('https://example.com/job'+n);
    await page.locator('#companyBusiness').fill('자동차 제조 · 국내외 고객');
    await page.locator('#companyDirection').fill('전동화 생산라인 확대');
    await page.locator('#companyRole').fill('생산기술이 공정 안정성과 생산성 개선에 기여');
    await page.locator('#companySignals').fill('공정지식 · 데이터 분석 · 문제해결');
    await page.locator('#addCompany').click();
  };
  await addCompany('기업A',1);
  await addCompany('기업B',2);
  await addCompany('기업C',3);
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.industryCompany.companies.length===3,'STEP 7 must store three companies');

  await page.locator('#companyName').fill('기업D');
  await page.locator('#addCompany').click();
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.industryCompany.companies.length===3,'STEP 7 must block a fourth company');

  const targets=page.locator('[data-ctarget]');
  for(let i=0;i<3;i++)await targets.nth(i).check();
  await page.locator('#saveAll').click();
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.industryCompany.targetCompanies.length===3,'STEP 7 must save up to three target companies');
  const compare=(await page.locator('#companyCompare').textContent())||'';
  for(const expected of ['기업A','기업B','기업C','Business · Customer','Hiring Signal'])assert(compare.includes(expected),'Company comparison missing: '+expected);
});

await run('STEP 0 Career Check-in auto summary accepts student-facing heading variants',async page=>{
  const state=structuredClone(baseState);state.activeStep=0;
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#careerCheckinResult');
  const result=[
    '**① 현재 출발점**',
    '마케팅 안에서도 어떤 직무를 선택할지 탐색 중이다.',
    '',
    '**② 지금 활용 가능한 자산**',
    '마케팅 수업에서 SNS 홍보안을 만든 경험이 있다.',
    '',
    '**③ 가장 먼저 보완할 GAP**',
    '직무별 실제 업무 차이를 더 확인해야 한다.',
    '',
    '**④ 이번 주 실행행동**',
    '브랜드 마케팅 채용공고 2개를 찾아 담당업무를 비교한다.'
  ].join('\n');
  await page.locator('#careerCheckinResult').fill(result);
  await page.locator('#parseCheckinResult').click();
  assert((await page.locator('#careerStartStatement').inputValue()).includes('마케팅 안에서도'),'STEP 0 starting point was not auto summarized');
  assert((await page.locator('#careerStartAction').inputValue()).includes('채용공고 2개'),'STEP 0 action was not auto summarized');
});

await run('STEP 3 stores Job × Industry targets and does not default to energy',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),baseState);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('[data-target-job="0"]');
  const energy=page.locator('[data-choice="industry"][value="에너지"]');
  assert(await energy.count()===1,'Energy industry option missing');
  assert(!(await energy.isChecked()),'Energy industry must not be selected by default');

  await page.locator('[data-target-job="0"]').selectOption('job1');
  await page.locator('[data-target-industry="0"]').selectOption({label:'자동차·모빌리티'});
  await page.locator('[data-target-job="1"]').selectOption('job2');
  await page.locator('[data-target-industry="1"]').selectOption({label:'IT·플랫폼'});
  await page.locator('#targetReason').fill('문제해결과 데이터 분석 경험을 실제 직무에서 확인하고 싶다.');
  await page.locator('#saveTargets').click();

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.jobExplorer.targetCombos.length===2,'STEP 3 did not store two target combinations');
  assert(stored.artifacts.jobExplorer.targetCombos[0].industry==='자동차·모빌리티','Target 1 industry not saved');
  assert(stored.artifacts.jobExplorer.targetCombos[1].industry==='IT·플랫폼','Target 2 industry not saved');
  assert(stored.artifacts.jobExplorer.targets.includes('job1')&&stored.artifacts.jobExplorer.targets.includes('job2'),'Legacy target job ids were not retained');
  assert(stored.artifacts.industryCompany.targetIndustries.length===2,'Industry compatibility bridge was not generated');
});

await run('STEP 3 imports copy-friendly bullet candidates and allows editing',async page=>{
  const state=structuredClone(baseState);
  state.activeStep=3;
  state.artifacts.jobExplorer.candidates=[];
  state.artifacts.jobExplorer.targets=[];
  state.artifacts.jobExplorer.targetCombos=[];
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#jobAiImport');
  const prompt=await page.locator('#jobPrompt').inputValue();
  assert(prompt.includes('표 금지.'),'STEP 3 prompt must forbid tables');
  assert(prompt.includes('JSON 금지.'),'STEP 3 prompt must forbid JSON');
  assert(prompt.includes('첫 줄부터 [후보 1]로 시작'),'STEP 3 prompt must start with copy-friendly candidate text');
  assert(prompt.includes('[후보 1]'),'STEP 3 prompt missing copy-friendly candidate format');

  const ai=[
    '[후보 1]',
    '직무명: 브랜드/콘텐츠 마케터',
    '직무군: 마케팅·브랜드',
    '어떤 일: 소비자 반응과 트렌드를 분석해 브랜드 콘텐츠와 홍보 방향을 기획한다.',
    '경험·행동 근거: SNS 홍보안 프로젝트에서 반응이 좋은 게시물 특징을 비교했다.',
    '관심 근거: 마케팅과 브랜드 관련 일에 관심이 있다.',
    '가능 산업: 유통·물류, IT·플랫폼',
    'STEP 5에서 확인할 것: 실제 요구 포트폴리오와 디지털 마케팅 도구',
    '',
    '[후보 2]',
    '직무명: CRM 마케팅',
    '직무군: 마케팅·브랜드',
    '어떤 일: 고객 데이터를 바탕으로 고객군별 메시지와 캠페인을 기획한다.',
    '경험·행동 근거: 자료를 기준별로 비교하고 정리한 경험',
    '관심 근거: 사람들의 반응을 분석하는 일에 관심',
    '가능 산업: 유통·물류, 금융',
    'STEP 5에서 확인할 것: SQL·CRM 도구 요구수준'
  ].join('\n');
  await page.locator('#jobAiImport').fill(ai);
  await page.locator('#importJobAi').click();
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.jobExplorer.candidates.length===2,'Bullet candidate import count mismatch');
  assert(stored.artifacts.jobExplorer.candidates[0].title==='브랜드/콘텐츠 마케터','Bullet candidate title not imported');
  assert(stored.artifacts.jobExplorer.candidates[0].industries.includes('유통·물류'),'Bullet candidate industries not imported');

  await page.locator('[data-edit]').first().click();
  assert((await page.locator('#jobTitle').inputValue())==='브랜드/콘텐츠 마케터','Edit did not load candidate into form');
  await page.locator('#jobTitle').fill('브랜드 마케터');
  await page.locator('#jobSummary').fill('브랜드 전략과 캠페인을 기획하고 고객 반응을 확인한다.');
  await page.locator('#addCandidate').click();
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.jobExplorer.candidates[0].title==='브랜드 마케터','Edited candidate title was not saved');
  assert(stored.artifacts.jobExplorer.candidates[0].summary.includes('브랜드 전략'),'Edited candidate summary was not saved');
  assert(stored.artifacts.jobExplorer.candidates.length===2,'Editing must not create a duplicate candidate');
});

await run('STEP 5 stores up to three JDs and keeps the selected company relation',async page=>{
  const state=structuredClone(baseState);
  state.activeStep=4;
  state.artifacts.jobExplorer.targets=['job1','job2'];
  state.artifacts.jobExplorer.targetCombos=[
    {id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1},
    {id:'target_job2_it',jobId:'job2',industry:'IT·플랫폼',priority:2}
  ];
  state.artifacts.industryCompany={industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''};

  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#companyName');
  assert(await page.locator('.jdSiteLink').count()===5,'STEP 5 Find JD must show five recruitment-site links');
  const searchPrompt=await page.locator('#jdSearchPrompt').inputValue();
  for(const expected of ['생산기술','자동차·모빌리티','확인 기준일:','현재 모집 중','최근 6개월','최대 3개'])assert(searchPrompt.includes(expected),'JD search prompt missing: '+expected);

  assert((await page.locator('#companyName1').inputValue())===''&&(await page.locator('#companyName2').inputValue())==='','JD 2 and JD 3 company fields must start independently blank');
  const add=async(i,company,name,url)=>{
    const s=i===0?'':String(i);
    await page.locator('#companyName'+s).fill(company);
    await page.locator('#companyUrl'+s).fill('https://example.com/'+company);
    await page.locator('#sourceType'+s).selectOption({label:'기업 공식 채용공고'});
    await page.locator('#sourceName'+s).fill(name);
    await page.locator('#sourceUrl'+s).fill(url);
    await page.locator('#sourceNote'+s).fill('생산공정 데이터 분석 및 개선 업무 / 생산공정 기본지식 우대');
    await page.locator(i===0?'#addSource':'#saveSource'+s).click();
  };
  await add(0,'가상모빌리티A','생산기술 신입공고 A','https://example.com/job1');
  await add(1,'가상모빌리티B','생산기술 신입공고 B','https://example.com/job2');
  await add(2,'가상모빌리티C','생산기술 신입공고 C','https://example.com/job3');
  assert(await page.locator('#sourceList .listCard').count()===3,'Find JD must store exactly three postings');
  assert((await page.locator('#companyName').inputValue())==='가상모빌리티A','JD 1 company was overwritten');
  assert((await page.locator('#companyName1').inputValue())==='가상모빌리티B','JD 2 company was not stored independently');
  assert((await page.locator('#companyName2').inputValue())==='가상모빌리티C','JD 3 company was not stored independently');
  await page.locator('#chosenSource').selectOption({index:1});

  const jobAnalysis=[
    '[고객·성과기준]','• 생산·품질부서 / 공정 안정성',
    '[주요 과업]','• 생산공정 데이터를 확인하고 이상 원인을 분석한다',
    '[주요 해결과제]','• 공정 이상 원인을 좁히고 재발을 줄인다',
    '[해결방법]','• 측정값 비교와 원인분석으로 개선안을 확인한다',
    '[필요역량]','• 생산공정 기초지식 · 데이터 분석 · 문제해결',
    '[경력개발]','• 공정개선 전문성 확대'
  ].join('\n');
  await page.locator('#jobAiImport').fill(jobAnalysis);
  await page.locator('#applyJobAi').click();
  await page.locator('#specCertificates').fill('없음');
  await page.locator('#specLanguage').fill('없음');
  await page.locator('#specTools').fill('Excel');
  const gap=[
    '[내가 가진 것]','• 데이터 비교 → 캡스톤 시험 결과 비교 경험',
    '[확인 필요]','• 생산공정 기본지식의 실제 수준',
    '[핵심 GAP]','• GAP 1: 생산공정 기본지식 보강',
    '[3개월 행동]','• 생산공정 기본지식 → 공정 데이터 미니 프로젝트 1개 완성'
  ].join('\n');
  await page.locator('#deepAiImport').fill(gap);
  await page.locator('#importDeepAi').click();
  await page.locator('#saveDeep').click();

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a?.sources?.length===3,'Three JD records were not saved');
  assert(a.sources.map(x=>x.companyName).join('|').includes('가상모빌리티A'),'JD-specific company name was not saved');
  assert(a?.jobTable?.tasks?.includes('생산공정 데이터'),'Completed job-analysis table was not saved');
  assert(a?.studentSpec?.tools==='Excel','My Spec was not saved');
  assert(a?.requirements?.[0]?.status==='준비 필요','Concise GAP was not stored');
  assert(stored.artifacts.jdAnalyzer?.postings?.[0]?.company==='가상모빌리티A','Selected JD company did not flow downstream');
  const ic=stored.artifacts.industryCompany;
  const ind=ic.industries.find(x=>x.jobId==='job1'&&x.name==='자동차·모빌리티');
  const co=ic.companies.find(x=>x.jobId==='job1'&&x.name==='가상모빌리티A');
  assert(ind&&co?.industryId===ind.id,'Selected JD company did not retain Industry relation');
});

await run('STEP 5 separates job analysis from My Spec and produces concise GAP output',async page=>{
  const state=structuredClone(baseState);state.activeStep=4;
  state.artifacts.jobExplorer.targets=['job1'];
  state.artifacts.jobExplorer.targetCombos=[{id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1}];
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#companyName');
  await page.locator('#companyName').fill('가상모빌리티');
  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('생산기술 신입공고');
  await page.locator('#sourceUrl').fill('https://example.com/job1');
  await page.locator('#sourceNote').fill('생산공정 데이터 분석 및 개선. 생산공정 기본지식 우대.');
  await page.locator('#addSource').click();
  const jobPrompt=await page.locator('#jobAiPrompt').inputValue();
  assert(jobPrompt.includes('학생의 스펙·경험과 비교하지 않는다'),'Job analysis must be separated from GAP analysis');
  assert(jobPrompt.includes('[고객·성과기준]')&&jobPrompt.includes('[필요역량]'),'Job-analysis prompt must use the five-field output');
  assert(await page.locator('#copyDeepPrompt').isDisabled(),'GAP must stay locked before job table and My Spec are complete');
  await page.locator('#jobAiImport').fill([
    '[고객·성과기준]','• 생산부서 / 공정 안정성',
    '[주요 과업]','• 공정 데이터를 확인하고 이상 원인을 분석한다',
    '[주요 해결과제]','• 이상 원인을 좁힌다',
    '[해결방법]','• 데이터 비교와 원인분석',
    '[필요역량]','• 공정지식 · 데이터 분석'
  ].join('\n'));
  await page.locator('#applyJobAi').click();
  await page.locator('#specCertificates').fill('없음');
  await page.locator('#specLanguage').fill('TOEIC 820');
  await page.locator('#specTools').fill('Excel, Python');
  assert(!(await page.locator('#copyDeepPrompt').isDisabled()),'GAP must unlock after job table and My Spec are complete');
  const gapPrompt=await page.locator('#deepPrompt').inputValue();
  assert(gapPrompt.includes('TOEIC 820')&&gapPrompt.includes('Excel, Python'),'GAP prompt must use the student-entered My Spec');
  assert(gapPrompt.includes('JSON, 표, 코드블록을 사용하지 않는다'),'GAP prompt must forbid JSON and tables');
  assert(gapPrompt.includes('[내가 가진 것]')&&gapPrompt.includes('[핵심 GAP]'),'GAP prompt must request concise bullet sections');
  await page.locator('#deepAiImport').fill([
    '[내가 가진 것]','• 데이터 분석 → 캡스톤 측정값 비교 경험',
    '[확인 필요]','• 생산공정 현장 경험 수준',
    '[핵심 GAP]','• GAP 1: 생산공정 기본지식 보강',
    '[3개월 행동]','• 기본지식 → 공정 데이터 미니 프로젝트 완성'
  ].join('\n'));
  await page.locator('#importDeepAi').click();
  const summary=(await page.locator('#gapSummary').textContent())||'';
  for(const expected of ['내가 가진 것','확인 필요','핵심 GAP','3개월 행동','생산공정 기본지식'])assert(summary.includes(expected),'Concise GAP summary missing: '+expected);
});

await run('STEP 6 renders a three-page MY JOBFIT REPORT v1 from STEP 5 outputs',async page=>{
  const state=structuredClone(baseState);state.activeStep=5;
  state.assessments.careerDNA.hypothesis={};
  state.assessments.careerDNA.reflection={fit:'반복 행동을 실제 경험으로 확인하며 진로 방향을 정리하고 있다.',question:'경험으로 더 확인할 부분'};
  state.assessments.careerDNA.careerAnchor={ranking:[{code:'TF',name:'전문성 추구형',score:0},{code:'GM',name:'리더십 추구형',score:0},{code:'AU',name:'자율성/독립성 추구형',score:0}],responses:[1,2],bonusItems:[],scores:{TF:0,GM:0,AU:0},complete:false};
  state.artifacts.jobExplorer.targets=['job1'];
  state.artifacts.jobExplorer.targetCombos=[{id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1}];
  state.artifacts.jobDeepDive={targetAnalyses:{target_job1_auto:{
    company:{name:'가상모빌리티',source:'공식 홈페이지',url:'https://example.com/company'},
    jobTable:{customerKpi:'생산부서 / 공정 안정성',tasks:'공정 데이터 확인 · 이상 원인 분석',challenge:'이상 원인 축소와 재발 방지',method:'측정값 비교 · 원인분석',competencies:'생산공정 지식 · 데이터 분석',careerPlan:'공정개선 전문성 확대'},
    studentSpec:{certificates:'없음',language:'TOEIC 820',tools:'Excel, Python',portfolio:'공정 데이터 미니 프로젝트'},
    requirements:[{id:'r1',name:'생산공정 기본지식 보강',type:'Knowledge',status:'준비 필요',evidence:'',gap:'생산공정 기본지식 보강'}],
    have:'캡스톤 측정값 비교 경험',verify:'생산공정 현장 경험 수준',prepare:'공정 데이터 미니 프로젝트 1개 완성'
  }},analyses:{}};
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#jobfitReportPrint');
  assert(await page.locator('.reportPage').count()===3,'MY JOBFIT REPORT v1 must render exactly three pages');
  const text=(await page.locator('#jobfitReportPrint').textContent())||'';
  for(const expected of ['WHO AM I?','WHERE CAN I USE IT?',"WHAT DO I HAVE & WHAT'S NEXT?",'고객(KPI)','주요 과업','주요 해결과제','해결방법','필요역량','MY SPEC','TOEIC 820','Excel, Python','핵심 GAP','3개월 행동','생산공정 기본지식 보강'])assert(text.includes(expected),'Report missing: '+expected);
  assert(text.includes('반복 행동을 실제 경험으로 확인하며 진로 방향을 정리하고 있다.'),'Career DNA object fallback did not render readable text');
  assert(text.includes('검사 미완료'),'Incomplete Career Anchor must be labeled without a fake ranking');
  assert(!text.includes('[object Object]'),'Report must never expose object stringification');
  assert(!text.includes('0점'),'Incomplete Career Anchor must not show zero-score TOP 3');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.jobfitReportV1?.version==='my-jobfit-report-v1','STEP 6 report metadata missing');
  await page.emulateMedia({media:'print'});
  assert(await page.locator('.reportPage').first().isVisible(),'Report is not visible in print media');
  const pdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
  const pdfPageCount=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert(pdfPageCount===3,`Printed MY JOBFIT REPORT must contain exactly 3 PDF pages, found ${pdfPageCount}`);
});
await run('Marketing student STEP 1-6 outputs flow into MY JOBFIT REPORT',async page=>{
  const state=structuredClone(baseState);state.activeStep=4;
  state.profile.major='경영학과';
  state.assessments.careerDNA.selfStrengths=['분석력','기획력','책임감'];
  state.assessments.careerDNA.hypothesis={text:'소비자 반응을 분석해 콘텐츠 방향을 정하는 일에 관심이 있다.'};
  state.assessments.experienceCompetency.experiences=[{id:'expM1',title:'의류 리뷰 데이터 분석',action:'생성형 AI를 활용해 고객 리뷰를 핏·소재·가격대·디자인 기준으로 분류하고 구글 시트에 정리했다',result:'20~30대 고객이 선호하는 조건을 비교했다',evidence:'구글 시트 분석표',competencies:['분석','정보구조화'],factChecked:true}];
  state.artifacts.experienceMap=structuredClone(state.assessments.experienceCompetency.experiences);
  state.artifacts.jobExplorer={
    candidates:[{id:'job1',title:'브랜드/콘텐츠 마케터',family:'마케팅·브랜드',industries:['뷰티·소비재'],summary:'소비자와 콘텐츠 트렌드를 분석해 브랜드 콘텐츠와 캠페인을 기획한다.',why:'고객 리뷰 분석 경험과 연결',evidence:'의류 리뷰 데이터 분석',unknowns:'콘텐츠 직접 제작과 성과분석 수준'}],
    targets:['job1'],targetCombos:[{id:'target_job1_marketing',jobId:'job1',industry:'뷰티·소비재',priority:1}],
    desiredActivities:['소비자 반응 분석하기','콘텐츠 기획하기'],newInterests:[],industryInterests:['뷰티·소비재']
  };
  state.artifacts.jobDeepDive={targetAnalyses:{},analyses:{}};

  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#companyName');
  assert((await page.locator('.jobAnalysisInje').getAttribute('data-accordion-default'))==='1','Fresh STEP 5 should recommend Find JD first');

  await page.locator('#companyName').fill('가상뷰티');
  await page.locator('#companyUrl').fill('https://example.com/beauty');
  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('글로벌 브랜드/콘텐츠 마케터 신입');
  await page.locator('#sourceUrl').fill('https://example.com/beauty-marketing');
  await page.locator('#sourceNote').fill('글로벌 소비자와 콘텐츠 트렌드 분석, 제품 USP 도출, 틱톡·인스타그램 숏폼 기획, 인플루언서 협업, 콘텐츠 성과 분석. 영어 콘텐츠 독해 우대.');
  await page.locator('#addSource').click();

  await page.locator('#jobAiImport').fill([
    '[고객·성과기준]','• 글로벌 소비자 / 콘텐츠 반응과 캠페인 성과',
    '[주요 과업]','• 시장·콘텐츠 트렌드 분석 · USP 도출 · 숏폼 기획 · 인플루언서 협업 · 성과 확인',
    '[주요 해결과제]','• 제품 강점을 타깃 고객이 반응하는 콘텐츠로 바꾸기',
    '[해결방법]','• 경쟁사·콘텐츠 비교 · 숏폼 제작 · 지표 확인',
    '[필요역량]','• 고객분석 · 콘텐츠 기획 · SNS 이해 · 성과분석 · 협업'
  ].join('\n'));
  await page.locator('#applyJobAi').click();

  await page.locator('#specCertificates').fill('없음');
  await page.locator('#specLanguage').fill('TOEIC 850');
  await page.locator('#specTools').fill('Excel, Google Sheets, Canva');
  await page.locator('#specPortfolio').fill('의류 리뷰 데이터 분석표');
  const gapPrompt=await page.locator('#deepPrompt').inputValue();
  assert(gapPrompt.includes('TOEIC 850')&&gapPrompt.includes('Google Sheets'),'Marketing GAP prompt must use entered student specs');
  assert(gapPrompt.includes('의류 리뷰 데이터 분석'),'Marketing GAP prompt must reuse fact-checked STEP 2 evidence');

  await page.locator('#deepAiImport').fill([
    '[내가 가진 것]','• 고객·시장 분석 → 의류 리뷰를 기준별로 분류하고 선호조건을 비교한 경험',
    '[확인 필요]','• 실제 SNS 채널 운영과 인플루언서 협업 경험 여부',
    '[핵심 GAP]','• GAP 1: 숏폼 콘텐츠 직접 기획·제작 포트폴리오 부족','• GAP 2: 발행 콘텐츠 성과지표 분석 경험 부족',
    '[3개월 행동]','• 숏폼 콘텐츠 3개 제작 → 조회·반응 지표 기록','• 브랜드 1개를 정해 경쟁사·USP·콘텐츠 성과 분석 포트폴리오 완성'
  ].join('\n'));
  await page.locator('#importDeepAi').click();
  await page.locator('#saveDeep').click();
  await page.locator('#nextStep').click();
  await page.waitForSelector('#jobfitReportPrint');

  const text=(await page.locator('#jobfitReportPrint').textContent())||'';
  for(const expected of ['브랜드/콘텐츠 마케터','가상뷰티','글로벌 브랜드/콘텐츠 마케터 신입','고객(KPI)','주요 과업','주요 해결과제','해결방법','필요역량','TOEIC 850','Excel, Google Sheets, Canva','숏폼 콘텐츠 직접 기획·제작 포트폴리오 부족','3개월 행동'])assert(text.includes(expected),'Marketing report missing: '+expected);
  assert(await page.locator('.reportPage').count()===3,'Marketing report must remain three pages');
  const marketingPdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
  const marketingPdfPageCount=(marketingPdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert(marketingPdfPageCount===3,`Marketing student PDF must contain exactly 3 pages, found ${marketingPdfPageCount}`);
});

await run('BASE Career Fit Map accepts linked combination and rejects mismatched relation',async page=>{
  const state=structuredClone(baseState);
  state.profile.courseCode='';
  state.activeStep=6;
  state.artifacts.jobExplorer.targets=['job1','job2'];
  state.artifacts.industryCompany={industries:[{id:'ind1',name:'자동차·모빌리티',jobId:'job1',source:'공식 산업자료',url:'https://example.com/ind',business:'자동차 제조',jobLink:'공정 개선'}],targetIndustries:['ind1'],companies:[{id:'co1',name:'가상모빌리티',type:'대기업',industryId:'ind1',jobId:'job1',industry:'자동차·모빌리티',job:'생산기술',source:'사업보고서',url:'https://example.com/co',hiringEvidence:'현재 채용공고 확인',jobUrl:'https://example.com/jd',business:'자동차 제조',role:'공정 안정화'}],targetCompanies:['co1'],notes:''};
  state.artifacts.jobDeepDive={analyses:{job1:{sources:[{id:'s1'}],tasks:[{id:'t1'}],requirements:[{id:'r1'}]}}};

  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#fitJob').selectOption('job1');
  await page.locator('#fitIndustry').selectOption('ind1');
  await page.locator('#fitCompany').selectOption('co1');
  let text=(await page.locator('#comboGuard').textContent())||'';
  assert(text.includes('연결관계 확인'),`Linked combo not accepted: ${text}`);
  await page.locator('#fitJob').selectOption('job2');
  text=(await page.locator('#comboGuard').textContent())||'';
  assert(text.includes('조합 불일치'),`Mismatched combo not rejected: ${text}`);
});

await browser.close();
if(failed)process.exit(1);

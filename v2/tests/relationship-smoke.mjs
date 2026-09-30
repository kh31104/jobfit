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
  assert(labels.some(x=>x.includes('Resume Lab')),'Resume Lab missing after renumbering');
  await page.locator('.stepBtn[data-step="7"]').click();
  await page.waitForSelector('#stepRoot .kicker');
  const text=(await page.locator('#stepRoot').textContent())||'';
  assert(text.includes('Resume Lab'),'New STEP 7 should load Resume Lab');
  assert((await page.locator('#stepRoot .kicker').first().textContent()).includes('STEP 7'),'Resume Lab kicker was not renumbered');
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
  assert(prompt.includes('표를 만들지 않는다.'),'STEP 3 prompt must forbid tables');
  assert(prompt.includes('JSON, 코드블록, 중괄호 { }를 절대 출력하지 않는다.'),'STEP 3 prompt must forbid JSON');
  assert(prompt.includes('[후보 1]'),'STEP 3 prompt missing copy-friendly candidate format');

  const ai=[
    '[후보 1]',
    '직무명: 브랜드/콘텐츠 마케터',
    '직무군: 마케팅·브랜드',
    '어떤 일: 소비자 반응과 트렌드를 분석해 브랜드 콘텐츠와 홍보 방향을 기획한다.',
    '경험·행동 근거: SNS 홍보안 프로젝트에서 반응이 좋은 게시물 특징을 비교했다.',
    '관심 근거: 마케팅과 브랜드 관련 일에 관심이 있다.',
    '가능 산업: 유통·물류, IT·플랫폼',
    'STEP 4에서 확인할 것: 실제 요구 포트폴리오와 디지털 마케팅 도구',
    '',
    '[후보 2]',
    '직무명: CRM 마케팅',
    '직무군: 마케팅·브랜드',
    '어떤 일: 고객 데이터를 바탕으로 고객군별 메시지와 캠페인을 기획한다.',
    '경험·행동 근거: 자료를 기준별로 비교하고 정리한 경험',
    '관심 근거: 사람들의 반응을 분석하는 일에 관심',
    '가능 산업: 유통·물류, 금융',
    'STEP 4에서 확인할 것: SQL·CRM 도구 요구수준'
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

await run('STEP 4 stores chosen JD, GAP Match, and downstream bridges',async page=>{
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
  assert(await page.locator('.jdSiteLink').count()===5,'STEP 4 Find JD must show five recruitment-site links');
  const siteText=(await page.locator('.jdSiteGrid').allTextContents()).join(' ');
  for(const name of ['사람인','잡코리아','고용24','잡알리오','클린아이 잡플러스'])assert(siteText.includes(name),`STEP 4 recruitment site missing: ${name}`);
  const searchPrompt=await page.locator('#jdSearchPrompt').inputValue();
  assert(searchPrompt.includes('생산기술'),'JD search prompt missing Target Job');
  assert(searchPrompt.includes('자동차·모빌리티'),'JD search prompt missing Target industry');
  assert(searchPrompt.includes('현재 모집 중'),'JD search prompt missing current-posting priority');
  assert(searchPrompt.includes('최근 6개월'),'JD search prompt missing recent-posting fallback');

  await page.locator('#companyName').fill('가상모빌리티');
  await page.locator('#companyUrl').fill('https://example.com/company');
  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('생산기술 신입공고');
  await page.locator('#sourceUrl').fill('https://example.com/job1');
  await page.locator('#sourceNote').fill('생산공정 문제 분석과 개선 업무');
  await page.locator('#addSource').click();

  const ai={
    purpose:'생산공정의 문제를 확인하고 안정적으로 생산되도록 개선한다.',
    gate:'기계계열 전공',
    preference:'제조 프로젝트 경험',
    knowledge:'생산공정 기초',
    skills:'데이터 분석, 문제해결',
    behaviors:'문제를 확인하고 관련부서와 조정한다.',
    experienceRequired:'공정 또는 설비 관련 프로젝트',
    signals:'공정개선, 협업',
    tasks:[{name:'생산공정 이상 원인을 분석한다',skill:'데이터 분석 · 문제해결',output:'개선안',context:'생산·품질부서 협업'}],
    requirements:[
      {name:'공정 데이터 분석',type:'Skill',evidence:'캡스톤에서 시험 결과를 비교해 오류 원인을 확인함',status:'근거 있음',gap:''},
      {name:'생산공정 기본지식',type:'Knowledge',evidence:'없음',status:'준비 필요',gap:'기초학습 필요'}
    ],
    have:'문제 원인 분석 경험',prepare:'생산공정 기본지식'
  };
  await page.locator('#deepAiImport').fill(JSON.stringify(ai));
  await page.locator('#importDeepAi').click();
  await page.locator('#saveDeep').click();

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a?.company?.name==='가상모빌리티','STEP 4 company was not saved');
  assert(a?.sources?.length===1&&a.selectedSourceId===a.sources[0].id,'Chosen JD was not saved');
  assert(a?.tasks?.[0]?.name.includes('생산공정'),'STEP 4 task was not saved');
  assert(a?.requirements?.[0]?.status==='근거 있음','STEP 4 GAP status was not saved');
  assert(stored.artifacts.jdAnalyzer?.selectedId,'STEP 7 JD bridge was not moved into STEP 4');
  assert(stored.artifacts.jdAnalyzer?.postings?.[0]?.jobTitle==='생산기술','JD bridge job title missing');
  assert(stored.artifacts.careerAssets?.assets?.some(x=>x.requirement==='공정 데이터 분석'),'STEP 8 Career Asset bridge was not moved into STEP 4');

  const ic=stored.artifacts.industryCompany;
  const ind=ic.industries.find(x=>x.jobId==='job1'&&x.name==='자동차·모빌리티');
  const co=ic.companies.find(x=>x.jobId==='job1'&&x.name==='가상모빌리티');
  assert(ind,'Industry relation was not created by STEP 4');
  assert(co?.industryId===ind.id,'Company did not retain Industry relation');
});

await run('STEP 4 imports AI analysis into reviewable fields',async page=>{
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
  await page.waitForSelector('#deepAiImport');
  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('생산기술 신입공고');
  await page.locator('#sourceUrl').fill('https://example.com/job1');
  await page.locator('#sourceNote').fill('생산공정 문제 분석과 개선 업무');
  await page.locator('#addSource').click();
  const ai={
    purpose:'생산공정의 문제를 확인하고 안정적으로 생산되도록 개선한다.',
    newHireWork:'공정 데이터를 확인하고 이상 원인을 분석한다.',
    gate:'기계계열 전공',
    preference:'제조 프로젝트 경험',
    knowledge:'생산공정 기초',
    skills:'데이터 분석, 문제해결',
    behaviors:'문제를 확인하고 관련부서와 조정한다.',
    experienceRequired:'공정 또는 설비 관련 프로젝트',
    signals:'공정개선, 협업',
    unknowns:'세부 근무환경 확인 필요',
    tasks:[{name:'생산공정 이상 원인을 분석한다',skill:'데이터 분석 · 문제해결',sourceRef:'S1',output:'개선안',context:'생산·품질부서 협업'}],
    requirements:[{name:'공정 데이터 분석',type:'Skill',evidence:'캡스톤에서 시험 결과를 비교해 오류 원인을 확인함',status:'근거 있음',gap:''},{name:'생산공정 기본지식',type:'Knowledge',evidence:'없음',status:'준비 필요',gap:'기초학습 필요'}],
    have:'문제 원인 분석 경험',
    verify:'실제 현장업무',
    prepare:'생산공정 기본지식',
    conclusion:'경험 근거는 있으나 생산공정 지식은 추가 준비가 필요하다.'
  };
  await page.locator('#deepAiImport').fill(JSON.stringify(ai));
  await page.locator('#importDeepAi').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a?.purpose.includes('생산공정'),'AI analysis purpose not imported');
  assert(a?.tasks?.length===1&&a.tasks[0].name.includes('생산공정'),'AI task not imported');
  assert(a?.requirements?.some(x=>x.name==='공정 데이터 분석'&&x.status==='근거 있음'),'AI evidence matrix not imported');
  assert(a?.prepare==='생산공정 기본지식','AI preparation item not imported');
});

await run('STEP 5 renders a three-page MY JOBFIT REPORT v1',async page=>{
  const state=structuredClone(baseState);
  state.activeStep=5;
  state.artifacts.jobExplorer.targets=['job1','job2'];
  state.artifacts.jobExplorer.targetCombos=[
    {id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1},
    {id:'target_job2_it',jobId:'job2',industry:'IT·플랫폼',priority:2}
  ];
  state.artifacts.jobDeepDive={
    targetAnalyses:{
      target_job1_auto:{
        company:{name:'가상모빌리티',source:'공식 홈페이지',url:'https://example.com/company'},
        purpose:'생산공정의 문제를 확인하고 안정적으로 생산되도록 개선한다.',
        tasks:[{id:'t1',name:'생산공정 이상 원인을 분석한다',skill:'데이터 분석'}],
        requirements:[
          {id:'r1',name:'공정 데이터 분석',type:'Skill',status:'근거 있음',evidence:'캡스톤 시험 결과 비교',gap:''},
          {id:'r2',name:'생산공정 기본지식',type:'Knowledge',status:'준비 필요',evidence:'',gap:'기초학습 필요'}
        ],
        have:'문제 원인 분석 경험',prepare:'생산공정 기본지식'
      }
    },
    analyses:{}
  };

  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#jobfitReportPrint');

  assert((await page.locator('h2').first().textContent()).includes('MY JOBFIT REPORT v1'),'STEP 5 title did not change');
  assert(await page.locator('.reportPage').count()===3,'MY JOBFIT REPORT v1 must render exactly three pages');
  const text=(await page.locator('#jobfitReportPrint').textContent())||'';
  for(const expected of ['WHO AM I?','WHERE CAN I USE IT?',"WHAT DO I HAVE & WHAT'S NEXT?",'CAREER ANCHOR · TOP 3','전문·직무역량','VIA 성격강점 · TOP 5','학구열','자동차·모빌리티','생산기술','공정 데이터 분석','준비 필요'])assert(text.includes(expected),`Report missing: ${expected}`);

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.jobfitReportV1?.version==='my-jobfit-report-v1','STEP 5 report metadata missing');
  await page.emulateMedia({media:'print'});
  assert(await page.locator('.reportPage').first().isVisible(),'Report is not visible in print media');
});

await run('STEP 6 accepts linked combination and rejects mismatched relation',async page=>{
  const state=structuredClone(baseState);
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

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

await run('STEP 4 stores source-grounded Job Analysis and keeps downstream relations',async page=>{
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

  await page.locator('#companyName').fill('가상모빌리티');
  await page.locator('#companySource').fill('공식 홈페이지');
  await page.locator('#companyUrl').fill('https://example.com/company');

  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('생산기술 신입공고');
  await page.locator('#sourceUrl').fill('https://example.com/job1');
  await page.locator('#sourceNote').fill('생산공정 문제 분석과 개선 업무');
  await page.locator('#addSource').click();

  await page.locator('#taskName').fill('생산공정 이상 원인을 분석한다');
  await page.locator('#taskSkill').fill('데이터 분석 · 문제해결');
  await page.locator('#taskSource').selectOption({label:'생산기술 신입공고'});
  await page.locator('#addTask').click();

  await page.locator('#reqName').fill('공정 데이터 분석');
  await page.locator('#reqType').selectOption({label:'Skill'});
  await page.locator('#reqStatus').selectOption({label:'근거 있음'});
  await page.locator('#reqEvidence').fill('캡스톤에서 시험 결과를 비교해 오류 원인을 확인함');
  await page.locator('#addReq').click();

  await page.locator('#purpose').fill('생산공정의 문제를 확인하고 안정적으로 생산되도록 개선한다.');
  await page.locator('#skills').fill('데이터 분석, 문제해결');
  await page.locator('#have').fill('문제 원인 분석 경험');
  await page.locator('#prepare').fill('생산공정 기본지식');
  await page.locator('#saveDeep').click();

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a?.company?.name==='가상모빌리티','STEP 4 company was not saved');
  assert(a?.sources?.length===1,'STEP 4 source was not saved');
  assert(a?.tasks?.[0]?.name.includes('생산공정'),'STEP 4 task was not saved');
  assert(a?.requirements?.[0]?.status==='근거 있음','STEP 4 evidence status was not saved');
  assert(stored.artifacts.jobDeepDive.analyses.job1,'Legacy jobDeepDive analysis bridge missing');

  const ic=stored.artifacts.industryCompany;
  const ind=ic.industries.find(x=>x.jobId==='job1'&&x.name==='자동차·모빌리티');
  const co=ic.companies.find(x=>x.jobId==='job1'&&x.name==='가상모빌리티');
  assert(ind,'Industry relation was not created by STEP 4');
  assert(co?.industryId===ind.id,'Company did not retain Industry relation');
  assert(ic.targetCompanies.includes(co.id),'Company was not retained as downstream target');
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

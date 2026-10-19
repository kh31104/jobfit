import {chromium, webkit, devices} from 'playwright';

// Uses a fresh browser context and fictitious learner data. No real student data is changed.
const base=(process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const key='jobfit:v2:learner';
const rawGap=[
  '[내가 가진 것]','• 시료 검사 기록 정리',
  '[확인 필요]','• 실제 생산관리 시스템 사용 경험',
  '[핵심 GAP]','• GAP 1: ERP 운영 경험',
  '[3개월 행동]','• ERP 기초 수업 듣기'
].join('\n');
const experience={
  id:'exp-mobile-test',title:'식품공장 분석업무',action:'시료 검사 결과를 기록하고 공정을 설명함',
  evidence:'검사 기록지',factChecked:true,
  competencies:['의사소통','책임·직업윤리','협업'],
  competencyEvidence:[
    {label:'의사소통',status:'행동 확인',evidence:'후임자에게 검사 절차를 단계별로 설명함'},
    {label:'책임·직업윤리',status:'행동 확인',evidence:'부적합 수치를 보고하여 출고 중지를 요청함'},
    {label:'협업',status:'행동 확인',evidence:'동료가 사용할 검사 물품을 미리 준비함'}
  ]
};
const requirements=Array.from({length:6},(_,i)=>({
  id:'req-'+i,name:'기존 직무요구 '+(i+1),status:'근거 있음',evidence:'기존 근거 '+(i+1),gap:''
}));
const analysis={
  sources:[{id:'jd1',slot:0,name:'가상 식품기업 품질관리',companyName:'가상식품사',url:'https://example.com/jd',checkedAt:'2026-10-19'}],
  selectedSourceId:'jd1',
  jobTable:{customerKpi:'검사 정확도',tasks:'시료 검사',challenge:'이상치 파악',method:'검사 결과 비교',competencies:'품질·분석 역량'},
  studentSpec:{certificates:'없음',language:'한국어 TOPIK 3급',tools:'없음',portfolio:'없음'},
  requirements
};
function fixture(){
  return {
    version:2.2,mode:'full',activeStep:3,
    profile:{anonCode:'JF26-EMULATION-ONLY',courseCode:'INJE2026',major:'글로벌자유전공'},
    research:{consent:false,measurements:{pre:{},post:{}}},
    assessments:{careerDNA:{},experienceCompetency:{experiences:[experience]}},
    artifacts:{
      jobExplorer:{
        candidates:[{id:'j1',title:'품질관리',family:'생산·품질',industries:['식품']}],
        targetCombos:[{id:'target_j1_식품_1',jobId:'j1',industry:'식품',priority:1}],
        desiredActivities:[],industryInterests:[]
      },
      jobDeepDive:{targetAnalyses:{'target_j1_식품_1':analysis}}
    },
    meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
  };
}
function ensure(ok,message){if(!ok)throw Error(message)}
async function run(engine,label,device){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...device,locale:'ko-KR',acceptDownloads:true});
  // In deployed tests do not send synthetic data to operational or research servers.
  await context.route(/https:\/\/[^/]*supabase\.co\//,route=>route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded',timeout:60000});
    await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,fixture()]);
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('[data-choice="activity"]',{state:'attached',timeout:45000});
    // Touch-like WebKit/Chromium interactions must persist selections before navigation.
    await page.locator('[data-choice="activity"][value="기준에 맞는지 검사·점검하기"]').check({force:true});
    await page.locator('[data-choice="industry"][value="식품"]').check({force:true});
    await page.locator('#saveTargets').click({force:true});
    let stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    ensure(stored.artifacts.jobExplorer.desiredActivities.includes('기준에 맞는지 검사·점검하기'),label+': STEP4 activity not saved');
    ensure(stored.artifacts.jobExplorerChoiceSnapshot.industryInterests.includes('식품'),label+': STEP4 industry snapshot not saved');
    ensure(stored.artifacts.jobExplorer.targetCombos[0].jobId==='j1',label+': changed target job');

    // Simulate older mobile data where arrays were lost but explicit choice snapshot survived.
    stored.artifacts.jobExplorer.desiredActivities=[];
    stored.artifacts.jobExplorer.industryInterests=[];
    stored.activeStep=4;
    await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,stored]);
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#deepAiImport',{state:'attached',timeout:45000});
    await page.locator('#deepAiImport').fill(rawGap,{force:true});
    // Safari tab discard/background and Android reload must not lose the draft.
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#deepAiImport',{state:'attached',timeout:45000});
    ensure((await page.locator('#deepAiImport').inputValue())===rawGap,label+': GAP raw draft lost on reload');
    await page.locator('#saveDeep').click({force:true});
    stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    const savedAnalysis=stored.artifacts.jobDeepDive.targetAnalyses['target_j1_식품_1'];
    ensure(savedAnalysis.gapAiDraft===rawGap,label+': GAP raw changed');
    ensure(savedAnalysis.requirements.some(r=>r.gap==='ERP 운영 경험'),label+': parsed GAP missing');
    ensure(savedAnalysis.requirements.filter(r=>r.id.startsWith('req-')).length===6,label+': original 6 requirements overwritten');
    ensure(savedAnalysis.jobTable.tasks==='시료 검사',label+': original job table changed');
    ensure(stored.assessments.experienceCompetency.experiences[0].action===experience.action,label+': original experience changed');
    await page.locator('#nextStep').click({force:true});
    await page.waitForSelector('#jobfitReportPrint',{state:'attached',timeout:45000});
    let report=await page.locator('#jobfitReportPrint').textContent();
    for(const txt of ['기준에 맞는지 검사·점검하기','식품','ERP 운영 경험','ERP 기초 수업 듣기',
      '후임자에게 검사 절차를 단계별로 설명함','부적합 수치를 보고하여 출고 중지를 요청함','동료가 사용할 검사 물품을 미리 준비함']){
      ensure(report.includes(txt),label+': STEP6 missing '+txt);
    }
    ensure(await page.locator('.reportPage').count()===3,label+': original 3-section report changed');
    await page.locator('#refreshReport').click({force:true});
    await page.waitForSelector('#jobfitReportPrint',{state:'attached',timeout:45000});
    report=await page.locator('#jobfitReportPrint').textContent();
    ensure(report.includes('ERP 운영 경험')&&report.includes('기준에 맞는지 검사·점검하기'),label+': refresh lost report data');
    ensure(!errors.length,label+': page errors '+errors.join(' | '));
    console.log('PASS '+label+' '+base+' — selection, reload, GAP save, report, evidence, refresh');
  } finally{
    await context.close();await browser.close();
  }
}
let failures=0;
for(const [engine,label,device] of [
  [webkit,'iPhone Safari WebKit emulation',devices['iPhone 13']],
  [chromium,'Android Chrome Chromium emulation',devices['Pixel 7']]
]){
  try{await run(engine,label,device)}catch(e){failures++;console.error('FAIL '+label+': '+(e.stack||e))}
}
if(failures)process.exit(1);

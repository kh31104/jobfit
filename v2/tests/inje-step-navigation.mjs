import {chromium,webkit,devices} from 'playwright';

const base=(process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const key='jobfit:v2:learner';
function assert(ok,message){if(!ok)throw Error(message)}
function stateFor({jd=true,draft=''}={}){
  return {
    version:2.2,mode:'full',activeStep:4,
    profile:{anonCode:'JF26-NAV-TEST',courseCode:'INJE2026',major:'글로벌자유전공'},
    research:{consent:false,measurements:{pre:{},post:{}}},
    assessments:{
      careerDNA:{hypothesis:{text:'본인이 확인한 진로 기준'}},
      experienceCompetency:{experiences:[{
        id:'exp-nav',title:'식품공장 분석업무',action:'시료를 직접 검사하고 검사지에 기록함',
        evidence:'검사지',factChecked:true,competencies:['책임·직업윤리'],
        competencyEvidence:[{label:'책임·직업윤리',status:'행동 확인',evidence:'이상 수치를 담당자에게 보고함'}]
      }]}
    },
    artifacts:{
      jobExplorer:{
        candidates:[{id:'j1',title:'품질관리',industries:['식품']}],
        targetCombos:[{id:'target-j1',jobId:'j1',industry:'식품',priority:1}],
        desiredActivities:['기준에 맞는지 검사·점검하기'],industryInterests:['식품']
      },
      jobDeepDive:{targetAnalyses:{'target-j1':{
        sources:jd?[{id:'jd1',slot:0,name:'가상 직무공고',url:'https://example.com/jd',companyName:'가상식품기업'}]:[],
        selectedSourceId:jd?'jd1':'',
        jobTable:{customerKpi:'검사 정확도',tasks:'시료 검사',challenge:'이상수치',method:'측정 결과 검토',competencies:'품질기초'},
        studentSpec:{certificates:'없음',language:'한국어 TOPIK 3급',tools:'Excel',portfolio:'과제 노트'},
        requirements:[{id:'req-original',name:'검사 업무',status:'근거 있음',evidence:'내가 수행한 검사 기록',gap:''}],
        gapAiDraft:draft
      }}},
      careerAssets:{assets:[{id:'protected-asset',proof:'기존 Career Asset을 절대 덮어쓰면 안 됨'}]},
      jdAnalyzer:{postings:[{id:'protected-jd',rawPosting:'기존 JD 원문을 절대 덮어쓰면 안 됨'}],selectedId:'protected-jd'}
    },
    meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
  };
}
function originalFields(s){
  return {
    profile:s.profile,
    careerDNA:s.assessments.careerDNA,
    experiences:s.assessments.experienceCompetency.experiences,
    explorer:s.artifacts.jobExplorer,
    targetAnalysis:s.artifacts.jobDeepDive.targetAnalyses['target-j1'],
    assets:s.artifacts.careerAssets,
    jdAnalyzer:s.artifacts.jdAnalyzer
  };
}
async function test(engine,label,device){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...device,locale:'ko-KR',acceptDownloads:true});
  await context.route(/https:\/\/[^/]*supabase\.co\//,route=>route.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function seed(s){
    await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,s]);
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#saveDeep').waitFor({state:'attached',timeout:60000});
  }
  async function saved(){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded',timeout:60000});
    for(const scenario of ['jd-present-no-gap','no-jd-no-gap','invalid-gap-text']){
      const initial=stateFor({jd:scenario!=='no-jd-no-gap',draft:scenario==='invalid-gap-text'?'형식 미인식 텍스트 (그대로 보관)':''});
      await seed(initial);
      await page.locator('#saveDeep').click({force:true});
      const afterSave=await saved();
      assert(afterSave.artifacts.jobDeepDive.targetAnalyses['target-j1'].gapAiDraft===initial.artifacts.jobDeepDive.targetAnalyses['target-j1'].gapAiDraft,label+': original GAP draft overwritten '+scenario);
      assert(afterSave.artifacts.careerAssets.assets[0].id==='protected-asset',label+': previous career asset overwritten '+scenario);
      assert(afterSave.artifacts.jdAnalyzer.postings[0].rawPosting==='기존 JD 원문을 절대 덮어쓰면 안 됨',label+': previous JD overwritten '+scenario);
      // Regression for the reported bug: this click used to jump back to GAP Match.
      await page.locator('#nextStep').click({force:true});
      await page.locator('#jobfitReportPrint').waitFor({state:'attached',timeout:45000});
      assert(await page.locator('.stepBtn[data-step="5"].active').count()===1,label+': STEP 6 is not active '+scenario);
      const report=await page.locator('#jobfitReportPrint').textContent();
      assert(report.includes('WHERE CAN I USE IT?')&&report.includes("WHAT DO I HAVE & WHAT'S NEXT?"),label+': report did not render '+scenario);
      assert(report.includes('기준에 맞는지 검사·점검하기')&&report.includes('식품'),label+': earlier selections lost '+scenario);
      assert(report.includes('확인된 GAP 없음'),label+': missing GAP should remain unconfirmed '+scenario);
      if(scenario==='no-jd-no-gap')assert(report.includes('STEP 5에서 분석 기준 JD를 선택하세요.'),label+': missing JD was incorrectly fabricated');
      const final=await saved();
      const before=originalFields(initial),after=originalFields(final);
      assert(JSON.stringify(before)===JSON.stringify(after),label+': existing learner results changed during save/navigation '+scenario);
      console.log('PASS '+label+' '+scenario+': saved and entered STEP 6 with original fields intact');
    }

    // Both PC and mobile: verify 1-12 navigation entrypoints do not redirect to STEP 5.
    await seed(stateFor());
    for(let n=0;n<12;n++){
      await page.locator('.stepBtn[data-step="'+n+'"]').click({force:true});
      await page.waitForFunction(index=>{
        const active=document.querySelector('.stepBtn.active');
        const root=document.getElementById('stepRoot');
        return active?.dataset.step===String(index)&&root?.querySelector('.sectionHead')&&!root.textContent.includes('불러오는 중');
      },n,{timeout:45000});
      const text=await page.locator('#stepRoot').textContent();
      assert(!text.includes('선택한 모듈 화면을 불러오지 못했습니다.'),label+': unable to render STEP '+(n+1));
    }
    const final=await saved();
    assert(final.assessments.experienceCompetency.experiences[0].action==='시료를 직접 검사하고 검사지에 기록함',label+': experience changed across all 12 steps');
    assert(final.artifacts.jobDeepDive.targetAnalyses['target-j1'].studentSpec.language==='한국어 TOPIK 3급',label+': original student spec changed across navigation');
    assert(!errors.length,label+': browser errors '+errors.join(' | '));
    console.log('PASS '+label+': 12-step navigation and original student values remain intact');
  } finally {
    await context.close();await browser.close();
  }
}
let failed=0;
for(const [engine,label,device] of [
  [chromium,'PC Chrome 1280px',{viewport:{width:1280,height:900}}],
  [webkit,'iPhone Safari WebKit',devices['iPhone 13']],
  [chromium,'Android Chrome Chromium',devices['Pixel 7']]
]){
  try{await test(engine,label,device)}catch(e){failed++;console.error('FAIL '+label+': '+(e.stack||e))}
}
if(failed)process.exit(1);

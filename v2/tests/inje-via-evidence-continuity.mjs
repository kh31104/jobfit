import {chromium,webkit,devices} from 'playwright';

// Isolated synthetic learner: never edit or transmit real student records.
const base=(process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const key='jobfit:v2:learner';
const via=['학구열','신중성','진실성','희망','공정성'];
const evidence='실제 SNS 게시 일정을 표로 정리하고 업로드 날짜를 검증했다';
const action='인스타그램 게시 일정을 정리했다';
const exp={
  id:'exp-via-evidence-regression',title:'SNS 콘텐츠 운영',action,
  factChecked:true,competencies:['기획'],
  competencyEvidence:[{code:'C06',label:'기획',keyword:'기획',status:'행동 확인',studentVerified:true,evidence}]
};
function fixture(step=5){
  return {
    version:2.2,mode:'full',activeStep:step,
    profile:{anonCode:'JF26-VIA-EVIDENCE-TEST',courseCode:'INJE2026',major:'경영학과'},
    research:{consent:false,measurements:{pre:{},post:{}}},
    assessments:{
      careerDNA:{viaTop5:[...via],selfStrengths:['추진력'],hypothesis:{text:'본인의 선택으로 확인한 내용'}},
      experienceCompetency:{experiences:[structuredClone(exp)]}
    },
    artifacts:{
      // Intentionally stale summaries must not hide verified source data.
      careerDNAProfile:{viaTop5:[],selfStrengths:[],updatedAt:'2026-10-19T00:00:00.000Z'},
      competencyMap:[],
      experienceMap:[{id:exp.id,title:exp.title,action:exp.action,factChecked:true,competencies:[],competencyEvidence:[]}]
    },
    meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
  };
}
function assert(v,message){if(!v)throw Error(message)}
async function verify(engine,label,device){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...device,locale:'ko-KR',acceptDownloads:true});
  await context.route(/https:\/\/[^/]*supabase\.co\//,route=>route.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded'});
    await page.evaluate(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),[key,fixture()]);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#jobfitReportPrint',{timeout:45000});
    let report=await page.locator('#jobfitReportPrint').innerText();
    for(const term of [...via,evidence,action,'역량별 행동 근거'])
      assert(report.includes(term),label+': missing source value in STEP6: '+term);
    assert(await page.locator('.reportPage').count()===3,label+': 3 report sections changed');
    let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    assert(saved.assessments.experienceCompetency.experiences[0].competencyEvidence[0].evidence===evidence,
      label+': student evidence was rewritten');
    // Immediate mobile keyboard entry + nav: no 300ms delay is allowed to lose VIA.
    saved.activeStep=1;saved.assessments.careerDNA.viaTop5=[];
    saved.artifacts.careerDNAProfile.viaTop5=[];
    await page.evaluate(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),[key,saved]);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#via_0',{timeout:45000});
    for(let i=0;i<via.length;i++)await page.locator('#via_'+i).fill(via[i]);
    await page.locator('.stepBtn[data-step="5"]').click({force:true});
    await page.waitForSelector('#jobfitReportPrint',{timeout:45000});
    report=await page.locator('#jobfitReportPrint').innerText();
    for(const term of [...via,evidence])assert(report.includes(term),label+': immediate STEP change lost '+term);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#jobfitReportPrint',{timeout:45000});
    report=await page.locator('#jobfitReportPrint').innerText();
    for(const term of [...via,evidence])assert(report.includes(term),label+': reload lost '+term);
    saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    assert(saved.assessments.careerDNA.viaTop5.join('|')===via.join('|'),label+': VIA storage mismatch');
    assert(saved.assessments.experienceCompetency.experiences[0].action===action,label+': student action changed');
    assert(!errors.length,label+': JS errors '+errors.join(' | '));
    console.log('PASS '+label+' — VIA immediate save, evidence source, stale summary, reload');
  }finally{await context.close();await browser.close()}
}
let failures=0;
for(const [engine,label,device] of [
  [chromium,'PC Chrome',{}],
  [webkit,'iPhone Safari WebKit',devices['iPhone 13']],
  [chromium,'Android Chrome',devices['Pixel 7']]
]){
  try{await verify(engine,label,device)}
  catch(e){failures++;console.error('FAIL '+label+' '+(e.stack||e))}
}
if(failures)process.exit(1);

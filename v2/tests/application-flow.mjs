import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const inje=`${base}?course=INJE2026`;
const browser=await chromium.launch({headless:true});let failed=false;
function assert(c,m){if(!c)throw new Error(m)}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}

function state(step=4){
  return {
    version:2.2,activeStep:step,mode:'full',
    profile:{anonCode:'JF26-APP001',courseCode:'INJE2026',major:'기계공학과',majorGroup:'공학계열'},
    baseline:{jobDecision:'탐색 중'},research:{consent:false,measurements:{pre:{},post:{}}},
    assessments:{careerDNA:{},experienceCompetency:{experiences:[{id:'exp1',title:'캡스톤 프로젝트',action:'측정조건을 나눠 비교했다',result:'오차 원인을 확인했다',evidence:'측정기록',factChecked:true}]}},
    artifacts:{
      jobExplorer:{candidates:[{id:'job1',title:'생산기술',family:'생산·품질',summary:'생산공정을 안정적으로 운영하고 개선하는 직무'}],targets:['job1'],targetCombos:[{id:'target_job1_auto',jobId:'job1',industry:'자동차·모빌리티',priority:1}],targetReason:'공정 문제를 분석하고 개선하는 일을 더 알아보고 싶다.'},
      jobDeepDive:{analyses:{},targetAnalyses:{}},
      jdAnalyzer:{postings:[],selectedId:''},careerAssets:{assets:[]},
      resumeLab:{items:[],summary:'',skills:'',notes:''}
    },
    meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
  }
}
async function seed(page,s){await page.goto(inje,{waitUntil:'networkidle'});await page.evaluate(x=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(x)),s);await page.reload({waitUntil:'networkidle'})}
async function fillStep4(page,{withEvidence=true}={}){
  await page.waitForSelector('#companyName');
  await page.locator('#companyName').fill('가상모빌리티');
  await page.locator('#companyUrl').fill('https://example.com/company');
  await page.locator('#sourceType').selectOption({label:'기업 공식 채용공고'});
  await page.locator('#sourceName').fill('생산기술 신입공고');
  await page.locator('#sourceUrl').fill('https://example.com/job1');
  await page.locator('#sourceNote').fill('2027년 2월 졸업예정자. 생산공정 데이터 분석 및 개선. 생산공정 기본지식 우대.');
  await page.locator('#addSource').click();
  const ai={
    purpose:'생산공정의 문제를 확인하고 안정적으로 생산되도록 개선한다.',
    gate:'2027년 2월 졸업예정자',
    preference:'제조 프로젝트 경험',
    knowledge:'생산공정 기본지식',
    skills:'데이터 분석, 문제해결',
    behaviors:'문제를 확인하고 관련부서와 조정한다.',
    experienceRequired:'공정 또는 설비 관련 프로젝트',
    signals:'공정개선, 협업',
    tasks:[{name:'생산공정 이상 원인을 분석한다',skill:'데이터 분석 · 문제해결',output:'개선안',context:'생산·품질부서 협업'}],
    requirements:[
      {name:'공정 데이터 분석',type:'Skill',evidence:withEvidence?'캡스톤 프로젝트에서 측정조건을 나눠 비교했다':'없음',status:withEvidence?'근거 있음':'준비 필요',gap:withEvidence?'':'직접 데이터 분석 근거 필요'},
      {name:'생산공정 기본지식',type:'Knowledge',evidence:'없음',status:'준비 필요',gap:'기초학습 필요'}
    ],
    have:withEvidence?'문제 원인 분석 경험':'없음',
    prepare:'생산공정 기본지식'
  };
  await page.locator('#deepAiImport').fill(JSON.stringify(ai));
  await page.locator('#importDeepAi').click();
  await page.locator('#saveDeep').click();
}

await run('STEP 4 keeps Application Gate separate and moves JD Analyzer functions into GAP Match',async page=>{
  const s=state(4);await seed(page,s);await fillStep4(page,{withEvidence:true});
  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const t of ['Target Job','Find JD','Choose JD','GAP Match'])assert(body.includes(t),`STEP 4 missing ${t}`);
  assert(!body.includes('My Evidence'),'STEP 4 must not ask the student to re-enter My Evidence');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const p=stored.artifacts.jdAnalyzer.postings.find(x=>x.jobTitle==='생산기술');
  assert(p,'STEP 4 did not create JD bridge');
  assert(p.gates.length===1&&p.gates[0].text.includes('졸업예정자'),'Application Gate was not stored separately');
  assert(p.requirements.some(x=>x.text==='공정 데이터 분석'),'JD Requirement was not stored separately');
  assert(!p.requirements.some(x=>x.text.includes('졸업예정자')),'Gate leaked into JD Requirements');
});

await run('STEP 4 shows a real preparation gap when STEP 2 has no matching evidence',async page=>{
  const s=state(4);await seed(page,s);await fillStep4(page,{withEvidence:false});
  const gap=(await page.locator('#gapSummary').textContent())||'';
  assert(gap.includes('준비 필요'),'Student cannot see the preparation gap');
  assert(gap.includes('공정 데이터 분석'),'Missing requirement is not visible in GAP Match');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const asset=stored.artifacts.careerAssets.assets.find(x=>x.requirement==='공정 데이터 분석');
  assert(asset?.evidenceLevel==='없음','No-evidence requirement must remain unavailable for application writing');
});

await run('New STEP 7 Resume Lab keeps unverified STEP 4 evidence as draft',async page=>{
  const s=state(7);
  s.artifacts.jdAnalyzer={postings:[{id:'jd1',company:'가상모빌리티',jobTitle:'생산기술',rawPosting:'공정 데이터 분석 및 개선',gates:[],gateReviewed:true,requirements:[{id:'r1',text:'공정 데이터 분석',type:'Skill',level:'필수'}]}],selectedId:'jd1'};
  s.artifacts.careerAssets={assets:[{id:'a1',postingId:'jd1',experienceId:'exp1',experienceTitle:'캡스톤 프로젝트',requirementId:'r1',requirement:'공정 데이터 분석',requirementLevel:'필수',evidenceLevel:'B · 관련 증거',proof:'조건별 비교',fact:'측정기록',factCheck:'추가확인 필요',sourceExperienceFactChecked:true}]};
  await seed(page,s);
  const heading=(await page.locator('#stepRoot').textContent())||'';
  assert(heading.includes('Resume Lab'),'Logical STEP 7 did not load Resume Lab');
  assert((await page.locator('#stepRoot .kicker').first().textContent()).includes('STEP 7'),'Resume Lab still shows the old STEP number');
  await page.locator('#assetId').selectOption('a1');
  const ctx=(await page.locator('#assetContext').textContent())||'';
  assert(ctx.includes('현재는 초안용'),'Unverified asset was not marked draft-only');
  await page.locator('#rawBullet').fill('조건별 측정값을 비교해 오차 원인을 확인');
  await page.locator('#addItem').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.resumeLab.items[0].status==='draft','Unverified resume item should remain draft');
});

await browser.close();if(failed)process.exit(1);

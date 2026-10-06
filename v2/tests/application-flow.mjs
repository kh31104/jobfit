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
  const jobAnalysis=[
    '[고객·성과기준]',
    '• 생산·품질부서 / 공정 안정성과 개선 결과',
    '[주요 과업]',
    '• 생산공정 데이터를 확인하고 이상 원인을 분석한다',
    '[주요 해결과제]',
    '• 공정 이상 원인을 좁히고 재발을 줄인다',
    '[해결방법]',
    '• 측정값 비교와 원인분석으로 개선안을 확인한다',
    '[필요역량]',
    '• 생산공정 기초지식 · 데이터 분석 · 문제해결',
    '[경력개발]',
    '• 공정 데이터 분석 → 공정개선 전문성 확대'
  ].join('\n');
  await page.locator('#jobAiImport').fill(jobAnalysis);
  await page.locator('#applyJobAi').click();
  await page.locator('#specCertificates').fill('없음');
  await page.locator('#specLanguage').fill('없음');
  await page.locator('#specTools').fill(withEvidence?'Excel':'없음');
  const gap=withEvidence?[
    '[내가 가진 것]',
    '• 공정 데이터 분석 → 캡스톤 프로젝트에서 측정조건을 나눠 비교함',
    '[확인 필요]',
    '• 생산공정 기본지식의 실제 수준',
    '[핵심 GAP]',
    '• GAP 1: 생산공정 기본지식 보강',
    '[3개월 행동]',
    '• 생산공정 기본지식 → 공정 데이터 미니 프로젝트 1개 완성'
  ].join('\n'):[
    '[내가 가진 것]',
    '• 현재 직접 연결되는 스펙 근거는 확인되지 않음',
    '[확인 필요]',
    '• 추가 프로젝트 경험 여부',
    '[핵심 GAP]',
    '• GAP 1: 공정 데이터 분석 직접 근거 부족',
    '• GAP 2: 생산공정 기본지식 보강',
    '[3개월 행동]',
    '• 공정 데이터 분석 → 공정 데이터 미니 프로젝트 1개 완성'
  ].join('\n');
  await page.locator('#deepAiImport').fill(gap);
  await page.locator('#importDeepAi').click();
  await page.locator('#saveDeep').click();
}

await run('STEP 5 separates JD analysis, My Spec, and GAP Match',async page=>{
  const s=state(4);await seed(page,s);await fillStep4(page,{withEvidence:true});
  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const t of ['Target Job','Find JD','Choose JD','선택 직무 AI 분석','직무분석 테이블 완성','완성된 직무분석표','My Spec','GAP Match'])assert(body.includes(t),`STEP 5 missing ${t}`);
  assert(!body.includes('My Evidence'),'STEP 5 must reuse STEP 2 experience evidence rather than re-enter it');
  assert(await page.locator('.jdSiteLink').count()===5,'STEP4 Find JD must expose five real recruitment-site links');
  const sites=(await page.locator('.jdSiteGrid').allTextContents()).join(' ');
  for(const name of ['사람인','잡코리아','고용24','잡알리오','클린아이 잡플러스'])assert(sites.includes(name),`STEP4 recruitment site missing: ${name}`);
  assert(await page.locator('#jdSearchPrompt').isVisible(),'STEP4 AI job-posting search prompt must be immediately visible');
  const searchPrompt=await page.locator('#jdSearchPrompt').inputValue();
  assert(searchPrompt.includes('첫 줄부터 [공고 1]로 시작'),'STEP4 AI search prompt must use copy-friendly plain text');
  assert(searchPrompt.includes('표, JSON, 코드블록을 사용하지 않는다'),'STEP4 AI search prompt must forbid non-copy-friendly formats');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a?.jobTable?.tasks?.includes('생산공정 데이터'),'STEP 5 job-analysis table was not saved');
  assert(a?.studentSpec?.certificates==='없음'&&a?.studentSpec?.tools==='Excel','STEP 5 My Spec was not saved');
  assert(a?.have?.includes('캡스톤'),'STEP 5 concise GAP result did not preserve student evidence');
  const p=stored.artifacts.jdAnalyzer.postings.find(x=>x.jobTitle==='생산기술');
  assert(p&&p.company==='가상모빌리티','STEP 5 did not create the selected-JD bridge');
});

await run('STEP 4 shows a real preparation gap when STEP 2 has no matching evidence',async page=>{
  const s=state(4);await seed(page,s);await fillStep4(page,{withEvidence:false});
  const gap=(await page.locator('#gapSummary').textContent())||'';
  assert(gap.includes('공정 데이터 분석 직접 근거 부족'),'Student cannot see the confirmed preparation gap');
  assert(gap.includes('생산공정 기본지식'),'Second confirmed GAP is not visible');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const a=stored.artifacts.jobDeepDive.targetAnalyses.target_job1_auto;
  assert(a.requirements.length===2&&a.requirements.every(x=>x.status==='준비 필요'),'Confirmed GAP items must be stored as preparation needs');
});

await run('New STEP 8 Resume Lab keeps unverified STEP 5 evidence as draft',async page=>{
  const s=state(7);
  s.artifacts.jdAnalyzer={postings:[{id:'jd1',company:'가상모빌리티',jobTitle:'생산기술',rawPosting:'공정 데이터 분석 및 개선',gates:[],gateReviewed:true,requirements:[{id:'r1',text:'공정 데이터 분석',type:'Skill',level:'필수'}]}],selectedId:'jd1'};
  s.artifacts.careerAssets={assets:[{id:'a1',postingId:'jd1',experienceId:'exp1',experienceTitle:'캡스톤 프로젝트',requirementId:'r1',requirement:'공정 데이터 분석',requirementLevel:'필수',evidenceLevel:'B · 관련 증거',proof:'조건별 비교',fact:'측정기록',factCheck:'추가확인 필요',sourceExperienceFactChecked:true}]};
  await seed(page,s);
  const heading=(await page.locator('#stepRoot').textContent())||'';
  assert(heading.includes('Resume Lab'),'Logical STEP 8 did not load Resume Lab');
  assert((await page.locator('#stepRoot .kicker').first().textContent()).includes('STEP 8'),'Resume Lab still shows the old STEP number');
  await page.locator('#assetId').selectOption('a1');
  const ctx=(await page.locator('#assetContext').textContent())||'';
  assert(ctx.includes('현재는 초안용'),'Unverified asset was not marked draft-only');
  await page.locator('#rawBullet').fill('조건별 측정값을 비교해 오차 원인을 확인');
  await page.locator('#addItem').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.resumeLab.items[0].status==='draft','Unverified resume item should remain draft');
});

await run('STEP 8 Resume Lab supports three form tabs and optional detail documents',async page=>{
  const s=state(7);await seed(page,s);
  const text=(await page.locator('#stepRoot').textContent())||'';
  for(const label of ['표준이력서','NCS 이력서','블라인드 이력서'])assert(text.includes(label),'Resume template tab missing: '+label);
  await page.locator('[data-resume-bind="forms.standard.nameKo"]').fill('홍길동');
  await page.locator('[data-resume-template="ncs"]').click();
  await page.locator('[data-resume-bind="forms.ncs.job"]').fill('생산기술');
  await page.locator('[data-resume-template="blind"]').click();
  assert(((await page.locator('#resumeTemplateGuide').textContent())||'').includes('블라인드 작성 주의'),'Blind privacy guidance missing');
  await page.locator('[data-resume-bind="forms.blind.targetJob"]').fill('생산기술');
  await page.locator('[data-resume-doc="experience"]').click();
  await page.locator('[data-resume-bind="optionalDocument.experience.action"]').fill('측정조건을 나눠 비교했다');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.artifacts.resumeLab.templateType==='blind','Selected resume template was not saved');
  assert(stored.artifacts.resumeLab.forms.standard.nameKo==='홍길동','Standard resume input was not preserved');
  assert(stored.artifacts.resumeLab.forms.ncs.job==='생산기술','NCS resume input was not preserved');
  assert(stored.artifacts.resumeLab.forms.blind.targetJob==='생산기술','Blind resume input was not preserved');
  assert(stored.artifacts.resumeLab.optionalDocument.type==='experience','Optional document selection was not saved');
  assert(stored.artifacts.resumeLab.optionalDocument.experience.action.includes('측정조건'),'Experience description was not saved');
});

await browser.close();if(failed)process.exit(1);

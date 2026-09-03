import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});let failed=false;
function assert(c,m){if(!c)throw new Error(m)}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}

function state(step=7){return {version:2.2,activeStep:step,mode:'full',profile:{anonCode:'JF26-APP001',courseCode:'INJE2026'},baseline:{jobDecision:'명확히 정함'},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{careerDNA:{},experienceCompetency:{experiences:[{id:'exp1',title:'캡스톤 프로젝트',action:'측정조건을 나눠 비교했다',evidence:'측정기록',factChecked:true}]}},artifacts:{jdAnalyzer:{postings:[{id:'jd1',company:'가상기업',postingTitle:'신입채용',jobTitle:'생산기술',url:'https://example.com/jd',source:'기업 채용사이트',capturedAt:'2026-09-01',rawPosting:'2027년 2월 졸업예정자. 공정 데이터 분석 및 개선.',gates:[],gateReviewed:false,requirements:[],analysisNote:'',unknowns:''}],selectedId:'jd1'},careerAssets:{assets:[]},resumeLab:{items:[],summary:'',skills:'',notes:''}},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}}

await run('JD Analyzer stores Application Gate separately',async page=>{
  const s=state(7);await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(x=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(x)),s);await page.reload({waitUntil:'networkidle'});
  await page.locator('#gateText').fill('2027년 2월 졸업예정자');await page.locator('#gateType').selectOption({label:'졸업·학적'});await page.locator('#gateStatus').selectOption({label:'충족 가능'});await page.locator('#gateExcerpt').fill('2027년 2월 졸업예정자');await page.locator('#addGate').click();await page.locator('#gateReviewed').check();
  await page.locator('#reqText').fill('공정 데이터 분석 및 개선');await page.locator('#reqType').selectOption({label:'Task'});await page.locator('#reqLevel').selectOption({label:'업무핵심'});await page.locator('#reqExplicit').selectOption({label:'공고에 명시'});await page.locator('#reqExcerpt').fill('공정 데이터 분석 및 개선');await page.locator('#addReq').click();await page.locator('#saveJD').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));const p=stored.artifacts.jdAnalyzer.postings[0];assert(p.gates.length===1,'Gate not saved');assert(p.gates[0].type==='졸업·학적','Gate type incorrect');assert(p.requirements.length===1,'Requirement not saved separately');assert(p.gateReviewed===true,'Gate review not saved');
});

await run('Career Asset Match flags critical core evidence gap',async page=>{
  const s=state(8);s.artifacts.jdAnalyzer.postings[0].gateReviewed=true;s.artifacts.jdAnalyzer.postings[0].gates=[{id:'g1',text:'2027년 2월 졸업예정자',type:'졸업·학적',status:'충족',excerpt:'졸업예정자'}];s.artifacts.jdAnalyzer.postings[0].requirements=[{id:'r1',text:'공정 데이터 분석',type:'Skill',level:'필수',evidenceQuestion:'데이터를 분석한 경험은?'}];await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(x=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(x)),s);await page.reload({waitUntil:'networkidle'});
  let txt=(await page.locator('#criticalGap').textContent())||'';assert(txt.includes('Critical GAP'),'Missing critical gap for no evidence');
  await page.locator('#experienceId').selectOption('exp1');await page.locator('#requirementId').selectOption('r1');await page.locator('#proof').fill('측정조건을 나눠 비교했다');await page.locator('#fact').fill('측정기록');await page.locator('#jobLink').fill('데이터 비교 행동이 요구와 연결된다');await page.locator('#evidenceLevel').selectOption({label:'C · 간접 증거'});await page.locator('#factCheck').selectOption({label:'검증완료'});await page.locator('#addAsset').click();txt=(await page.locator('#criticalGap').textContent())||'';assert(txt.includes('Critical GAP'),'C evidence should remain critical gap for mandatory requirement');
});

await run('Resume keeps unverified asset as draft',async page=>{
  const s=state(9);s.artifacts.jdAnalyzer.postings[0].gateReviewed=true;s.artifacts.jdAnalyzer.postings[0].requirements=[{id:'r1',text:'공정 데이터 분석',type:'Skill',level:'필수'}];s.artifacts.careerAssets.assets=[{id:'a1',experienceId:'exp1',experienceTitle:'캡스톤 프로젝트',requirementId:'r1',requirement:'공정 데이터 분석',requirementLevel:'필수',evidenceLevel:'B · 관련 증거',proof:'조건별 비교',fact:'측정기록',factCheck:'추가확인 필요',sourceExperienceFactChecked:true}];await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(x=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(x)),s);await page.reload({waitUntil:'networkidle'});
  await page.locator('#assetId').selectOption('a1');let ctx=(await page.locator('#assetContext').textContent())||'';assert(ctx.includes('현재는 초안용'),'Unverified asset was not marked draft-only');await page.locator('#rawBullet').fill('조건별 측정값을 비교해 오차 원인을 확인');await page.locator('#addItem').click();const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(stored.artifacts.resumeLab.items[0].status==='draft','Unverified resume item should be draft');
});

await browser.close();if(failed)process.exit(1);

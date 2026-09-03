import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
function assert(cond,msg){if(!cond)throw new Error(msg)}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}

const baseState={version:2.2,activeStep:5,mode:'full',profile:{anonCode:'JF26-REL001',courseCode:'INJE2026'},baseline:{jobDecision:'2–3개 후보 있음'},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{careerDNA:{},experienceCompetency:{experiences:[]}},artifacts:{jobExplorer:{candidates:[{id:'job1',title:'공정기술',family:'생산·품질'},{id:'job2',title:'데이터분석',family:'IT·데이터'}],targets:['job1','job2'],notes:''},jobDeepDive:{analyses:{job1:{sources:[{id:'s1',type:'기업 공식 채용공고',name:'공정기술 공고',url:'https://example.com/job1'}],tasks:[{id:'t1',name:'공정 이상 분석'}],requirements:[{id:'r1',name:'데이터 분석'}]},job2:{sources:[{id:'s2',type:'기업 공식 채용공고',name:'데이터분석 공고',url:'https://example.com/job2'}],tasks:[{id:'t2',name:'데이터 모델링'}],requirements:[{id:'r2',name:'SQL'}]}}}},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}};

await run('STEP 5 stores explicit Job Industry Company relations',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),baseState);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#industryName');
  await page.locator('#industryName').fill('반도체');
  await page.locator('#industryJobId').selectOption('job1');
  await page.locator('#industrySourceType').selectOption({label:'정부·공공기관'});
  await page.locator('#industrySource').fill('산업 공식자료');
  await page.locator('#industryUrl').fill('https://example.com/industry');
  await page.locator('#industryBusiness').fill('반도체 제품과 제조공정');
  await page.locator('#industryJobLink').fill('공정 이상 분석과 개선');
  await page.locator('#addIndustry').click();
  const indId=await page.locator('[data-itarget]').first().getAttribute('data-itarget');
  assert(indId,'Industry id missing');
  await page.locator(`[data-itarget="${indId}"]`).check();
  await page.locator('#companyName').fill('가상반도체');
  await page.locator('#companyType').selectOption({label:'대기업'});
  await page.locator('#companyIndustryId').selectOption(indId);
  await page.locator('#companyJobId').selectOption('job1');
  await page.locator('#companySource').fill('사업보고서');
  await page.locator('#companyUrl').fill('https://example.com/company');
  await page.locator('#companyHiringEvidence').selectOption({label:'현재 채용공고 확인'});
  await page.locator('#companyJobSource').fill('공정기술 채용공고');
  await page.locator('#companyJobUrl').fill('https://example.com/posting');
  await page.locator('#companyBusiness').fill('반도체 제조');
  await page.locator('#companyRole').fill('공정 안정화와 수율 개선');
  await page.locator('#addCompany').click();
  const coId=await page.locator('[data-ctarget]').first().getAttribute('data-ctarget');
  assert(coId,'Company id missing');
  await page.locator(`[data-ctarget="${coId}"]`).check();
  await page.locator('#saveAll').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const ind=stored.artifacts.industryCompany.industries.find(x=>x.id===stored.artifacts.industryCompany.targetIndustries[0]);
  const co=stored.artifacts.industryCompany.companies.find(x=>x.id===stored.artifacts.industryCompany.targetCompanies[0]);
  assert(ind?.jobId==='job1','Industry did not retain Target Job id');
  assert(co?.industryId===ind.id,'Company did not retain Industry id');
  assert(co?.jobId==='job1','Company did not retain Target Job id');
  assert(co?.hiringEvidence==='현재 채용공고 확인','Hiring evidence not saved');
});

await run('STEP 6 accepts linked combination and rejects mismatched relation',async page=>{
  const state=structuredClone(baseState);
  state.activeStep=6;
  state.artifacts.industryCompany={industries:[{id:'ind1',name:'반도체',jobId:'job1',source:'공식 산업자료',url:'https://example.com/ind',business:'반도체 제조',jobLink:'공정 개선'}],targetIndustries:['ind1'],companies:[{id:'co1',name:'가상반도체',type:'대기업',industryId:'ind1',jobId:'job1',industry:'반도체',job:'공정기술',source:'사업보고서',url:'https://example.com/co',hiringEvidence:'현재 채용공고 확인',jobUrl:'https://example.com/jd',business:'반도체 제조',role:'공정 안정화'}],targetCompanies:['co1'],notes:''};
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#fitJob').selectOption('job1');await page.locator('#fitIndustry').selectOption('ind1');await page.locator('#fitCompany').selectOption('co1');
  let text=(await page.locator('#comboGuard').textContent())||'';assert(text.includes('연결관계 확인'),`Linked combo not accepted: ${text}`);
  await page.locator('#fitJob').selectOption('job2');text=(await page.locator('#comboGuard').textContent())||'';assert(text.includes('조합 불일치'),`Mismatched combo not rejected: ${text}`);
});

await browser.close();
if(failed)process.exit(1);

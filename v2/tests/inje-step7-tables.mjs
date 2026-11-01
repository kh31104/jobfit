import {chromium} from 'playwright';
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const seed={
 version:2.2,activeStep:6,mode:'full',
 profile:{courseCode:'INJE2026',major:'교육학과',anonCode:'JF26-S7TEST'},
 assessments:{experienceCompetency:{experiences:[{id:'experience-preserve',title:'교내 프로젝트',action:'내가 직접 수행',factChecked:true}]}},
 artifacts:{
  jobExplorer:{candidates:[{id:'job1',title:'교육기획'}],targets:['job1'],targetCombos:[{id:'t1',jobId:'job1',industry:'교육',priority:1}]},
  industryCompany:{industries:[{id:'old-ind',name:'기존 산업',business:'기존 본문'}],companies:[{id:'old-co',name:'기존 기업',business:'원문'}],targetIndustries:['old-ind'],targetCompanies:['old-co'],notes:'기존 메모'}
 }
};
const sampleIndustry=[
 '[policy]','• 교육정책 분석 [S1]','[economy]','• 교육시장 분석 [S2]',
 '[opportunity]','• 교육수요 변화 [S1]','[Sources]',
 '[S1] 교육부 | 교육정책 자료 | 2026-10-10 | https://www.moe.go.kr',
 '[S2] 통계청 | 교육통계 자료 | 2026-09-20 | https://kostat.go.kr'
].join('\n');
const sampleCompany=[
 '[productStrength]','• 교육 콘텐츠 품질 [S1]','[customer]','• 교육기관 [S1]',
 '[financePerformance]','• 확인 필요','[swotStrength]','• 상품 강점 [S1]',
 '[Sources]','[S1] DART | 사업보고서 | 2026-09-30 | https://dart.fss.or.kr'
].join('\n');
let failed=false;
for(const width of [1280,390]){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'?course=INJE2026',{waitUntil:'domcontentloaded'});
  await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#jf7Import-industry').waitFor();
  let state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  if(JSON.stringify(state.artifacts.industryCompany)!==JSON.stringify(seed.artifacts.industryCompany))throw Error('Opening the new STEP 7 changed legacy data');
  if(await page.locator('#industryAiImport').count())throw Error('Old duplicate industry input is displayed in new mode');
  if(await page.locator('[data-kind="industry"][data-field="policy"]').count()!==1)throw Error('Policy field must be unique');
  if(await page.locator('[data-kind="company"][data-field="swotStrength"]').count()!==1)throw Error('SWOT field must be unique');
  if(await page.locator('#jf7-job').inputValue()!=='교육기획')throw Error('Target job not loaded');
  if(await page.locator('#jf7-industry').inputValue()!=='교육')throw Error('Industry not loaded');
  await page.fill('#industry-policy','• 학생이 먼저 수정한 내용');
  await page.fill('#jf7Import-industry',sampleIndustry);
  if((await page.locator('#industry-policy').inputValue())!=='• 학생이 먼저 수정한 내용')throw Error('AI overwrote authored content');
  if(!(await page.locator('#industry-economy').inputValue()).includes('교육시장 분석'))throw Error('AI did not fill table');
  if(await page.locator('#jf7Import-industry').inputValue()!=='')throw Error('AI reply duplicated in paste box');
  const hint=await page.locator('[data-status="industry-economy"]').textContent();
  if(!hint.includes('원문 대조 필요'))throw Error('AI source incorrectly verified');
  if(!(await page.locator('[data-open="industry-S1"]').textContent()).includes('원문 열기'))throw Error('Crosscheck link missing');
  await page.fill('#jf7-company','한국교육서비스');
  await page.fill('#jf7Import-company',sampleCompany);
  if(!(await page.locator('#company-swotStrength').inputValue()).includes('상품 강점'))throw Error('SWOT not populated');
  await page.click('#jf7Finish');
  state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  if(!state.artifacts.industryCompanyTableV1?.industry.fields.economy)throw Error('New table draft not saved');
  if(JSON.stringify(state.artifacts.industryCompany.industries.find(x=>x.id==='old-ind'))!==JSON.stringify(seed.artifacts.industryCompany.industries[0]))throw Error('Legacy industry changed');
  if(JSON.stringify(state.artifacts.industryCompany.companies.find(x=>x.id==='old-co'))!==JSON.stringify(seed.artifacts.industryCompany.companies[0]))throw Error('Legacy company changed');
  if(!state.artifacts.industryCompany.industries.some(x=>x.generatedBy==='step7-table-v1'))throw Error('STEP 8 industry link missing');
  if(!state.artifacts.industryCompany.companies.some(x=>x.name==='한국교육서비스'))throw Error('STEP 8 company link missing');
  await page.reload({waitUntil:'domcontentloaded'});
  if(!(await page.locator('#industry-economy').inputValue()).includes('교육시장 분석'))throw Error('Table did not survive reload');
  if(!(await page.locator('#company-swotStrength').inputValue()).includes('상품 강점'))throw Error('SWOT did not survive reload');
  if(errors.length)throw Error('Browser errors: '+errors.join(', '));
  console.log('PASS STEP7 PEST/SWOT single-entry preservation and crosscheck '+width);
 }catch(e){failed=true;console.error('FAIL STEP7 new table '+width+': '+(e.stack||e));}
 finally{await context.close();await browser.close()}
}
if(failed)process.exit(1);

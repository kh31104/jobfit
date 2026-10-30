import {chromium,webkit} from 'playwright';
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const browsers=[{name:'PC Chromium',engine:chromium,width:1280},{name:'Android Chrome engine',engine:chromium,width:390},...(process.env.JOBFIT_TEST_WEBKIT==='1'?[{name:'iPhone Safari WebKit',engine:webkit,width:390}]:[])];
const assert=(condition,reason)=>{if(!condition)throw new Error(reason)};
const seed={
 version:2.2,activeStep:6,mode:'full',
 profile:{anonCode:'JF26-INJES7',courseCode:'INJE2026',institution:'인제대학교',major:'경영학과'},
 research:{consent:false,measurements:{pre:{},post:{}}},
 assessments:{careerDNA:{viaTop5:['학구열','신중성','친절','희망','진실성']},experienceCompetency:{experiences:[{id:'experience-old',title:'기존 팀프로젝트',action:'원래 했던 일',factChecked:true}]}},
 artifacts:{
  jobExplorer:{candidates:[{id:'job1',title:'브랜드 마케팅',family:'마케팅'}],targets:['job1'],targetCombos:[{id:'target1',jobId:'job1',industry:'유통·패션',priority:1}]},
  industryCompany:{industries:[
    {id:'legacy-step4',name:'옛 산업기록',generatedBy:'step4-inje',jobId:'job1',source:'레거시',url:'https://example.org/legacy'},
    {id:'original-ind',name:'유통·패션',jobId:'job1',source:'기존 원본자료',url:'https://example.org/original',business:'원래 산업분석 문장'}],
    targetIndustries:['legacy-step4','original-ind'],
    companies:[{id:'original-co',name:'기존 회사',industryId:'original-ind',jobId:'job1',business:'기존 고객',source:'예전 보고서',url:'https://example.org/old-company'}],
    targetCompanies:['original-co'],notes:'원래 메모'}
 },meta:{createdAt:'2026-10-01T00:00:00.000Z',updatedAt:'2026-10-01T00:00:00.000Z'}
};
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const showStep7Inputs=async(page,selector)=>{
  await page.locator(selector).waitFor({state:'attached'});
  if(!(await page.locator(selector).isVisible())){
    await page.locator('[data-acc-expand]').waitFor({state:'visible'});
    await page.locator('[data-acc-expand]').click();
  }
  await page.locator(selector).waitFor({state:'visible'});
};
const industryAi=String.raw`[산업명]
• 교육서비스
[근무처 유형]
• 교육서비스 기업 마케팅팀
• 전국 대학 홍보팀(채용 여부 확인 필요)
[대표 기관·기업군]
• 민간 교육서비스 기업군
• 전국 대학(기관 유형)
[그곳에서 하는 일]
• SNS 콘텐츠 기획
[진입·채용 경로]
• 기업 공식 채용공고 및 대학 교직원 채용게시판
[산업 구조·주요 고객]
• 학습자를 대상으로 교육서비스 제공
[최근 변화]
• AI 기반 학습 콘텐츠 확대
[내 직무에 미치는 영향]
• 콘텐츠 기획·자료 분석
[다른 산업과의 차이·선택]
• 서비스업은 성과기준이 다름
[출처 유형]
• 정부·공공기관
[확인 자료]
• 공개 교육산업 보고서 2026
[원문 URL]
• https://example.org/education
[확인일]
• 2026-10-29`;
const companyAi=String.raw`[기업 1]
• 기업명: 새기업A
• 기업유형: 중견기업
• 연결 산업: 교육서비스
• Business · Customer: 교육기관 고객
• Strategy: 새로운 서비스 검토
• Job Link: 브랜드 마케팅
• Hiring Signal: 콘텐츠 제작
• 기업 공식자료: 사업보고서
• 기업 공식자료 URL: https://example.org/a
• 채용·직무 자료: 공식 직무소개
• 채용 근거: 공식 직무소개 확인
• 채용·직무 원문 URL: https://example.org/a/jobs
• 확인 필요: 실제 공고 마감일
[기업 2]
• 기업명: 새기업B
• 연결 산업: 교육서비스
• Business · Customer: 기업고객
• Job Link: 브랜드 마케팅
• Hiring Signal: 시장 조사
• 확인 필요: 실제 기업자료 URL`;
let failed=false;
for(const item of browsers){
 const browser=await item.engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:item.width,height:950}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded'});
  await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed});
  await page.reload({waitUntil:'domcontentloaded'});
  await showStep7Inputs(page,'#industryAiImport');
  let state=await read(page);
  assert(JSON.stringify(state.artifacts.industryCompany)===JSON.stringify(seed.artifacts.industryCompany),'Simply opening STEP 7 modified existing saved data');
  // Existing manually entered content must not be silently overwritten by an AI paste.
  await page.fill('#industryBusiness','학생이 직접 작성한 내용');
   await page.fill('#industryWorkplaces','학생이 직접 적은 근무처');
  await page.fill('#industryAiImport',industryAi);
  assert(await page.locator('#industryBusiness').inputValue()==='학생이 직접 작성한 내용','AI overwrote manually authored content');
   assert(await page.locator('#industryWorkplaces').inputValue()==='학생이 직접 적은 근무처','AI overwrote student workplace text');
   assert((await page.locator('#industryEmployers').inputValue()).includes('민간 교육서비스 기업군'),'Employer field was not auto-mapped');
   assert((await page.locator('#industryTasks').inputValue()).includes('SNS 콘텐츠 기획'),'Task field was not auto-mapped');
   assert((await page.locator('#industryEntry').inputValue()).includes('교직원 채용게시판'),'Entry field was not auto-mapped');
  assert(await page.locator('#industryChange').inputValue()==='AI 기반 학습 콘텐츠 확대','AI did not auto-fill the matching field');
  assert(await page.locator('#industryFactChecked').isChecked()===false,'AI was incorrectly marked fact checked');
  assert((await read(page)).artifacts.industryCompanyAiDrafts.industry.includes('교육서비스'),'AI draft not saved separately');
  await page.click('#industryAiReplace');
  assert((await page.locator('#industryBusiness').inputValue()).includes('학습자를 대상으로'),'Explicit replace did not update editable form');
   assert((await page.locator('#industryWorkplaces').inputValue()).includes('교육서비스 기업 마케팅팀'),'Explicit replace did not update student workplace field');
  await page.click('#addIndustry');
  state=await read(page);
  assert(state.artifacts.industryCompany.industries.length===3,'Legacy, existing and new industry were not retained');
  assert(JSON.stringify(state.artifacts.industryCompany.industries.find(x=>x.id==='original-ind'))===JSON.stringify(seed.artifacts.industryCompany.industries[1]),'Original industry changed');
  assert(state.artifacts.industryCompany.industries.some(x=>x.id==='legacy-step4'),'Previously generated STEP4 industry was deleted');
  const added=state.artifacts.industryCompany.industries.find(x=>x.name==='교육서비스');
  assert(added?.factCheck==='확인 필요','Unverified AI industry marked as verified');
   assert(added.workplaces.includes('교육서비스 기업 마케팅팀'),'Workplace field not saved');
   assert(added.employers.includes('민간 교육서비스 기업군'),'Employer field not saved');
   assert(added.tasks.includes('SNS 콘텐츠 기획'),'Task field not saved');
   assert(added.entry.includes('교직원 채용게시판'),'Entry field not saved');
  await page.locator('[data-editind="'+added.id+'"]').click();
  assert((await page.locator('#industryBusiness').inputValue()).includes('학습자를 대상으로'),'Saved industry did not load for editing');
  await page.fill('#industryChange','학생이 원문에서 확인한 수정 내용');
  await page.check('#industryFactChecked');
  await page.click('#addIndustry');
  state=await read(page);
  assert(state.artifacts.industryCompany.industries.length===3,'Editing created duplicate industry');
  assert(state.artifacts.industryCompany.industries.find(x=>x.id===added.id).factCheck==='원문 대조 완료','Explicit industry fact check not saved');
  assert(state.artifacts.industryCompany.industries.find(x=>x.id===added.id).change==='학생이 원문에서 확인한 수정 내용','Industry edits not retained');
  // Company analysis: 2 independent candidates, editable before final save.
  await page.fill('#companyAiImport',companyAi);
  assert(await page.locator('#companyAiCandidate option').count()===3,'Multi-company options not created');
  assert(await page.locator('#companyName').inputValue()==='새기업A','Company 1 did not auto-apply');
  assert(await page.locator('#companySignals').inputValue()==='콘텐츠 제작','Hiring Signal did not map');
  assert(!await page.locator('#companyFactChecked').isChecked(),'Company AI was automatically verified');
  await page.check('#companyFactChecked');
  await page.click('#addCompany');
  state=await read(page);
  const a=state.artifacts.industryCompany.companies.find(x=>x.name==='새기업A');
  assert(a?.factCheck==='원문 대조 완료','Verified company not saved');
  assert(JSON.stringify(state.artifacts.industryCompany.companies.find(x=>x.id==='original-co'))===JSON.stringify(seed.artifacts.industryCompany.companies[0]),'Original company overwritten');
  await page.selectOption('#companyAiCandidate','1');
  assert(await page.locator('#companyName').inputValue()==='새기업B','Selecting next AI company did not populate form');
  assert(!await page.locator('#companyFactChecked').isChecked(),'Second company inherited verification');
  await page.click('#addCompany');
  state=await read(page);
  assert(state.artifacts.industryCompany.companies.length===3,'All 3 company records not preserved');
  assert(state.artifacts.industryCompany.companies.find(x=>x.name==='새기업B').factCheck==='확인 필요','Company B with missing URL was incorrectly verified');
  // Existing data, and the pasted AI draft, survive reload and STEP reentry.
  await page.reload({waitUntil:'domcontentloaded'});
  await showStep7Inputs(page,'#companyAiImport');
  state=await read(page);
  assert(state.artifacts.industryCompanyAiDrafts.company.includes('새기업B'),'AI company paste lost on reload');
  assert(state.assessments.careerDNA.viaTop5.length===5,'STEP1 data lost');
  assert(state.assessments.experienceCompetency.experiences[0].action==='원래 했던 일','STEP3 data lost');
  assert(state.artifacts.jobExplorer.targets[0]==='job1','STEP4 data lost');
  assert(errors.length===0,'Client JavaScript errors: '+errors.join(' | '));
  console.log('PASS INJE STEP7 AI auto-apply / fact check / edit / preservation / reload '+item.name);
 }catch(error){failed=true;console.error('FAIL '+item.name+': '+(error.stack||error));}
 finally{await context.close();await browser.close();}
}
if(failed)process.exit(1);

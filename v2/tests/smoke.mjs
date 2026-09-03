import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const instructorBase=new URL(base.endsWith('/v2/')?'../instructor/':'./instructor/',base).href;
const browser=await chromium.launch({headless:true});
let failed=false;

async function run(name,fn,{viewport={width:1280,height:900}}={}){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close();}
}
function assert(cond,msg){if(!cond)throw new Error(msg)}

await run('Inje preset locks full roadmap and creates anonymous code',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});await page.waitForSelector('h2');
  assert((await page.locator('h2').first().textContent()).includes('Career Start'),'Career Start did not load');
  const full=page.locator('.modeCard[data-mode="full"]'),selective=page.locator('.modeCard[data-mode="selective"]');
  assert(await full.evaluate(el=>el.classList.contains('on')),'Full roadmap not selected');assert((await selective.evaluate(el=>getComputedStyle(el).pointerEvents))==='none','Selective mode is not locked');
  await page.locator('#makeCodeBtn').click();const code=(await page.locator('#anonCode').textContent()).trim();assert(/^JF26-[A-Z2-9]{6}$/.test(code),`Unexpected anonymous code: ${code}`);
  assert(await page.locator('#centralResearchBtn').isDisabled(),'Central research submission must stay disabled before approved consent');
  assert((await page.locator('.backupTask').filter({hasText:'기기 밖 보관 확인'}).textContent()).includes('선택'),'Off-device backup confirmation is not marked optional');
  await page.locator('#age').fill('22');await page.locator('#gender').selectOption({label:'여성'});await page.locator('#grade').selectOption({label:'3학년'});await page.locator('#jobDecision').selectOption({label:'탐색 중'});await page.locator('#aiFrequency').selectOption({label:'주 1–2회'});await page.locator('#aiRule').fill('AI는 탐색과 구조화에 활용하고 경험의 사실과 최종 판단은 내가 확인한다.');await page.locator('#saveStart').click();await page.reload({waitUntil:'networkidle'});assert(await page.locator('#age').inputValue()==='22','Age did not persist after reload');assert((await page.locator('#anonCode').textContent()).trim()===code,'Anonymous code did not persist');
});

await run('Course code button applies Inje preset',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('#courseCode').fill('INJE2026');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),page.locator('#applyCourseBtn').click()]);assert(new URL(page.url()).searchParams.get('course')==='INJE2026','Course code was not applied to URL');assert(await page.locator('.modeCard[data-mode="full"]').evaluate(el=>el.classList.contains('on')),'Course preset did not select full roadmap');assert((await page.locator('.modeCard[data-mode="selective"]').evaluate(el=>getComputedStyle(el).pointerEvents))==='none','Course preset did not lock selective mode');
});

await run('Instructor can force S assessment',async page=>{
  await page.goto(`${base}?course=INJE2026&interest=S`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('h2');assert((await page.locator('h2').first().textContent()).includes('Career DNA'),'Career DNA did not load');const selected=page.locator('.choiceCard.on');assert((await selected.textContent()).includes('고용24 S형'),'S assessment not forced');assert((await page.locator('body').textContent()).includes('지정검사는 S형'),'S assignment notice missing');
});

await run('Instructor can force L assessment',async page=>{
  await page.goto(`${base}?course=INJE2026&interest=L`,{waitUntil:'networkidle'});await page.locator('.stepBtn[data-step="1"]').click();await page.waitForSelector('h2');const selected=page.locator('.choiceCard.on');assert((await selected.textContent()).includes('고용24 L형'),'L assessment not forced');assert((await page.locator('body').textContent()).includes('L형 성격 5요인'),'L personality fields missing');
});

await run('All STEP 0–13 modules load without page errors',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});for(let i=0;i<=13;i++){await page.locator(`.stepBtn[data-step="${i}"]`).click();await page.waitForTimeout(100);const heading=(await page.locator('#stepRoot h2').first().textContent())||'';assert(heading.trim().length>0,`STEP ${i} has no heading`);const body=(await page.locator('#stepRoot').textContent())||'';assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${i} failed to load`);}
});

await run('Seeded semester data assembles into final Job Portfolio',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});
  const seeded={
    version:2.2,activeStep:13,mode:'full',profile:{anonCode:'JF26-TEST99',courseCode:'INJE2026',age:'22',grade:'4학년',major:'산업공학과',majorGroup:'공학계열'},baseline:{jobDecision:'명확히 정함',industryDecision:'거의 정함',prepStage:'지원서 준비'},research:{consent:false,measurements:{pre:{},post:{}}},
    assessments:{careerDNA:{interest:{type:'S',riasecRaw:{R:30,I:42,A:25,S:32,E:29,C:37},riasecStandard:{R:48,I:63,A:42,S:51,E:47,C:58}},workValues:{성취:5,'일과 삶의 균형':4,자기개발:5}},experienceCompetency:{experiences:[{id:'exp1',title:'센서 데이터 캡스톤',rawVoice:'센서 오차가 커서 조건을 나눠 다시 확인했습니다.',action:'측정조건을 분리해 비교했다',result:'오차 원인을 확인했다',evidence:'측정기록',competencies:['문제해결','데이터분석'],factChecked:true}]}},
    artifacts:{
      careerDNAProfile:{riasecTop:[{code:'I',score:63},{code:'C',score:58}],valueTop:[{name:'성취',score:5}]},
      jobExplorer:{candidates:[{id:'job1',title:'생산기술',family:'생산·품질'}],targets:['job1'],notes:''},
      industryCompany:{industries:[{id:'ind1',name:'배터리',jobId:'job1'}],targetIndustries:['ind1'],companies:[{id:'co1',name:'가상에너지',type:'대기업',industryId:'ind1',jobId:'job1',industry:'배터리',job:'생산기술'}],targetCompanies:['co1'],notes:''},
      careerFit:{comparisons:[{id:'fit1',jobId:'job1',industryId:'ind1',companyId:'co1',roleInterest:4,valueFit:4,evidenceReadiness:4,industryAppeal:5,companyAppeal:4,infoConfidence:4,reasons:'공정 데이터와 문제해결 경험이 연결된다.',risks:'현장실습 경험 보완 필요'}],selectedId:'fit1',reflection:''},
      jdAnalyzer:{postings:[{id:'jd1',company:'가상에너지',postingTitle:'신입채용',jobTitle:'생산기술',url:'https://example.com',rawPosting:'공정 데이터 분석 및 개선',gates:[{id:'g1',text:'졸업예정자',type:'졸업·학적',status:'충족',excerpt:'졸업예정자'}],gateReviewed:true,requirements:[{id:'req1',text:'공정 데이터 분석',type:'Skill',level:'업무핵심'}],analysisNote:'데이터 기반 공정개선 역량이 핵심이다.'}],selectedId:'jd1'},
      careerAssets:{assets:[{id:'asset1',postingId:'jd1',experienceId:'exp1',experienceTitle:'센서 데이터 캡스톤',requirementId:'req1',requirement:'공정 데이터 분석',requirementLevel:'업무핵심',proof:'조건별 측정값을 비교했다.',fact:'측정기록을 남겼다.',gap:'산업 현장 경험 부족',jobLink:'데이터 기반 원인분석과 연결',evidenceLevel:'B · 관련 증거',strength:4,useFor:'여러 곳',factCheck:'검증완료',sourceExperienceFactChecked:true}]},
      resumeLab:{items:[{id:'r1',assetTitle:'센서 데이터 캡스톤',finalBullet:'조건별 센서 측정값을 비교해 오차 원인을 확인',factChecked:true,assetVerified:true,status:'final-ready'}],summary:'데이터로 문제 원인을 확인하는 생산기술 지원자',skills:'Excel'},
      coverLetterLab:{questions:[{id:'cl1',question:'직무역량',requirementId:'req1',requirement:'공정 데이터 분석',assetIds:['asset1'],rawAnswer:'조건을 나눠 확인했습니다.',draft:'센서 오차를 조건별로 비교했습니다.',factChecked:true,assetVerified:true,requirementAligned:true,status:'final-ready'}]},
      humanFirst:{items:[{id:'hf1',coverId:'cl1',question:'직무역량',sourceAssetIds:['asset1'],finalText:'센서 오차가 커졌을 때 측정조건을 나눠 비교하며 원인을 확인했습니다.',factChecked:true,coverReady:true,assetsVerified:true,status:'final-ready'}],consistency:{resumeCover:true,coverInterview:true,factLock:true},notes:''},
      interviewLab:{questions:[{id:'iq1',category:'경험',sourceType:'자소서 주장',question:'오차 원인을 어떻게 확인했나요?',assetId:'asset1',answerOutline:'조건을 나눠 측정값을 비교했습니다.',factCheck:'검증완료',evidenceVerified:true,status:'ready'}],practiceNotes:''},
      jobPortfolio:{positioning:'데이터를 근거로 문제 원인을 확인하는 생산기술 지원자',gap:'현장실습 경험',plan30:'배터리 공정 채용공고 10건 분석',plan90:'공정 데이터 프로젝트 1건 완성',finalChecks:{gate:true,jd:true,facts:true,consistency:true,ready:true},status:'final-ready'}
    },meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
  };
  await page.evaluate(state=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(state)),seeded);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('#portfolioPrint');const text=(await page.locator('#portfolioPrint').textContent())||'';for(const expected of ['가상에너지','생산기술','배터리','센서 데이터 캡스톤','조건별 센서 측정값','오차 원인을 어떻게 확인했나요?','현장실습 경험','공정 데이터 프로젝트 1건 완성'])assert(text.includes(expected),`Portfolio missing seeded value: ${expected}`);await page.emulateMedia({media:'print'});assert(await page.locator('#portfolioPrint').isVisible(),'Portfolio is not visible in print media');assert((await page.locator('.topbar').evaluate(el=>getComputedStyle(el).display))==='none','Topbar should be hidden for print');
});

await run('Mobile layout loads core navigation',async page=>{await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});assert(await page.locator('.stepBtn').count()===14,'Mobile navigation does not contain 14 steps');assert(await page.locator('#makeCodeBtn').isVisible(),'Anonymous code button not visible on mobile');},{viewport:{width:390,height:844}});

await run('Instructor dashboard whitelists research-only files',async page=>{
  await page.goto(instructorBase,{waitUntil:'networkidle'});
  assert(!(await page.locator('#magicLinkBtn').isDisabled()),'Instructor login must be enabled after account activation');
  assert(await page.locator('#centralLoadBtn').isDisabled(),'Central dashboard load must stay disabled until instructor login');
  const researchFile={schema_version:'jobfit-research-v1.3',participant_code:'JF26-DASH01',context:{cohort_id:'INJE2026',institution_code:'인제대학교'},demographics:{age:22,gender:'여성',grade:'3학년',major_raw:'경영학과',major_group:'상경계열'},career_baseline:{preparation_stage:'정보탐색'},pre_measurements:{work24_job_readiness:{scores:[1,2,3,4,5,6,7,8,9]},kcaas:{concern:4,control:4,curiosity:4,confidence:4,total:4},strength_deficit:{strength_use:4.2,deficit_correction:3.8}},progress:{current_step:2,completed_steps:[0,1],completed_step_count:2,total_steps:14,completion_percent:14},export_metadata:{export_type:'research-only',exported_at:new Date().toISOString(),excludes_activity_text:true},experiences:[{rawVoice:'교수자 화면에 보이면 안 되는 원문'}]};
  await page.locator('#fileInput').setInputFiles({name:'jobfit-research-JF26-DASH01.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(researchFile))});
  await page.waitForFunction(()=>document.getElementById('count')?.textContent==='1');
  assert(await page.locator('#count').textContent()==='1','Dashboard did not count imported student');assert((await page.locator('body').textContent()).includes('JF26-DASH01'),'Anonymous code missing');assert(!(await page.locator('body').textContent()).includes('교수자 화면에 보이면 안 되는 원문'),'Raw activity text leaked');await page.locator('.codeLink').click();assert((await page.locator('#detail').textContent()).includes('경제적 취약성 적응도'),'Detailed Work24 score labels missing');
});

await browser.close();if(failed)process.exit(1);

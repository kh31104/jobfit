import {chromium} from 'playwright';

// STEP 7·8 '새로 시작' 회귀 검사
// A. 앞 단계 자료가 전혀 없는 학생: STEP 7 → STEP 8 → STEP 9까지 기본 정보만으로 진행 가능해야 한다.
// B. 앞 단계 자료가 있는 학생: 화면만 열어서는 저장 자료가 바뀌지 않고, 새로 시작을 골라도 기존 자료가 남으며 되돌릴 수 있어야 한다.
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),key);
const openStep=async(page,step)=>{await page.locator(`.stepBtn[data-step="${step}"]`).click();await page.waitForFunction(s=>document.querySelector('.stepBtn.active')?.dataset.step===String(s),step);if(step===6){await page.locator('#jf7Legacy').waitFor();await page.click('#jf7Legacy')}};

const seed={
  version:2.2,activeStep:6,mode:'full',
  profile:{anonCode:'JF26-SEEDAB',courseCode:'INJE2026',institution:'인제대학교',major:'경영학과'},
  baseline:{jobDecision:'탐색 중'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{careerDNA:{},experienceCompetency:{experiences:[{id:'exp1',title:'소비자 조사',action:'리뷰를 기준별로 분류했다.',result:'조사표를 완성했다.',evidence:'분석자료',competencies:['분석'],factChecked:true}]}},
  artifacts:{
    jobExplorer:{candidates:[{id:'job1',title:'브랜드 마케팅',family:'마케팅'}],targets:['job1'],targetCombos:[{id:'target-job1',jobId:'job1',industry:'유통·패션',priority:1}]},
    industryCompany:{industries:[{id:'ind1',name:'유통·패션',jobId:'job1',source:'산업 보고서',url:'https://example.org/ind'}],targetIndustries:['ind1'],companies:[{id:'co1',name:'시드유통',industryId:'ind1',jobId:'job1',industry:'유통·패션',job:'브랜드 마케팅',jobUrl:'https://example.org/job',signals:'고객 데이터 분석\n협업 커뮤니케이션'}],targetCompanies:['co1'],notes:''},
    jdAnalyzer:{postings:[{id:'jd1',company:'시드유통',jobTitle:'브랜드 마케팅',rawPosting:'캠페인 운영',requirements:[{id:'req1',text:'고객 데이터 분석',type:'Skill',level:'업무핵심'}],gates:[],gateReviewed:true}],selectedId:'jd1'},
    careerAssets:{assets:[{id:'asset1',postingId:'jd1',experienceId:'exp1',experienceTitle:'소비자 조사',requirementId:'req1',requirement:'고객 데이터 분석',evidenceLevel:'A · 직접 증거',factCheck:'검증완료',sourceExperienceFactChecked:true,proof:'리뷰 120건 분류',fact:'분류 기준표'}]}
  },
  meta:{createdAt:'2026-10-13T00:00:00.000Z',updatedAt:'2026-10-13T00:00:00.000Z'}
};

let failed=false;

// ---------- A. 자료 없는 학생 ----------
for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:950}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle'});
    await page.evaluate(()=>{localStorage.clear();indexedDB.deleteDatabase('jobfit-v2-continuity')});
    await page.reload({waitUntil:'networkidle'});
    await openStep(page,6);
    await page.waitForSelector('#qsStep7.callout');
    assert(await page.locator('#qsStep7 #qs7Job').isVisible(),'STEP 7 quick start form is not visible for a learner without data');
    assert((await page.locator('#industryJobId option').count())===1,'STEP 7 job select should be empty before quick start');

    await page.click('#qs7Save');
    assert((await read(page)).artifacts?.quickStart===undefined,'Quick start saved without required fields');
    await page.fill('#qs7Major','식품영양학과');await page.fill('#qs7Job','식품 품질관리');await page.fill('#qs7Industry','식품, 바이오');
    await page.click('#qs7Save');
    await page.click('#jf7Legacy');
    await page.waitForFunction(()=>[...document.querySelectorAll('#industryJobId option')].some(o=>o.textContent.includes('식품 품질관리')));
    let st=await read(page);
    assert(/^JF26-[A-Z2-9]{6}$/.test(st.profile?.anonCode||''),'Anonymous code was not issued during quick start');
    assert(st.profile?.major==='식품영양학과','Major was not saved');
    assert(st.artifacts?.quickStart?.step7?.active===true&&st.artifacts.quickStart.step7.industries.join('|')==='식품|바이오','Quick start target was not saved');
    assert(!st.artifacts?.jobExplorer?.targets?.length,'Quick start must not write STEP 4 targets');
    assert(!(await page.locator('.stepBtn[data-step="3"] .stepN').textContent()).includes('✓'),'STEP 4 must not show as complete after quick start');
    assert((await page.locator('#industryName').inputValue())==='식품','Industry name was not prefilled from quick start');
    assert((await page.locator('.targetSummary').textContent()).includes('새로 시작'),'Target summary does not show the quick start target');

    // STEP 7 본 기능: 산업 → 기업 → 선택
    await page.fill('#industrySource','식품산업 통계');await page.fill('#industryUrl','https://example.org/food');await page.click('#addIndustry');
    await page.locator('[data-itarget]').first().check();
    await page.fill('#companyName','바른식품');await page.selectOption('#companyIndustryId',{index:1});
    await page.fill('#companyJobUrl','https://example.org/qc');await page.fill('#companySignals','HACCP 이해\n품질 데이터 기록\n현장 소통');
    await page.click('#addCompany');
    await page.locator('[data-ctarget]').first().check();
    await page.click('#saveAll');
    st=await read(page);
    assert(st.artifacts?.industryCompany?.targetCompanies?.length===1,'STEP 7 company selection was not saved');

    // STEP 8: Quick Start 없이 이력서 1종을 직접 작성하고 경험만 필요할 때 추가
    await openStep(page,7);
    await page.waitForSelector('#resumeTemplateLab');
    assert(await page.locator('#qsStep8').count()===0,'STEP 8 should start with the resume form, not an intake form');
    assert(await page.locator('#resumeEvidenceImport #resumeExperienceEntry').count()===1,'Optional experience must be in section 2');
    await page.locator('[data-application-mode="targeted"]').click();
    await page.locator('[data-resume-bind="targetCompany"]').fill('바른식품');
    await page.locator('[data-resume-bind="forms.standard.targetJob"]').fill('식품 품질관리');
    await page.locator('[data-resume-bind="forms.standard.nameKo"]').fill('학생 테스트');
    await page.locator('[data-resume-bind="forms.standard.email"]').fill('learner@example.com');
    await page.locator('[data-extra-exp-mode="new"]').click();
    await page.locator('[data-new-exp="title"]').fill('급식실 위생 점검 보조');
    await page.locator('[data-new-exp="actionResult"]').fill('점검표를 매일 기록하고 누락 항목을 담당자에게 알렸다.');
    await page.locator('#newExperienceFactChecked').check();
    await page.locator('#addNewResumeExperience').click();
    st=await read(page);
    assert(st.artifacts.resumeLab.forms.standard.activities.r0.activity.includes('급식실 위생'),'New experience did not enter the resume');
    assert((await page.locator('.stepBtn[data-step="7"] .stepN').textContent()).includes('✓'),'One usable resume should complete STEP 8');
    await page.locator('#refreshResumePreview').click();
    assert((await page.locator('#resumeA4Preview').innerText()).includes('식품 품질관리'),'Target job missing from resume preview');

    // STEP 9은 근거 카드가 없더라도 진입할 수 있어야 한다.
    await openStep(page,8);
    await page.waitForSelector('#question');
    await page.reload({waitUntil:'networkidle'});
    st=await read(page);
    assert(st.artifacts.resumeLab.forms.standard.targetJob==='식품 품질관리','Resume was lost after reload');
    assert(errors.length===0,'Browser errors: '+errors.join(' | '));
    console.log(`PASS learner without data can start from STEP 7 and reach STEP 9 (${width}px)`);
  }catch(err){failed=true;console.error(`FAIL A ${width}px\n`+(err.stack||err));}
  finally{await context.close();}
}

// ---------- B. 자료 있는 학생 ----------
{
  const context=await browser.newContext({viewport:{width:1280,height:950}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle'});
    await page.evaluate(({key,seed})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(seed))},{key,seed});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#qsStep7');
    await page.click('#jf7Legacy');
    assert(await page.evaluate(()=>{const d=document.querySelector('#qsStep7 .qsDetails');return !!d&&!d.open&&!document.querySelector('#qsStep7.callout')}),'STEP 7 quick start should be a closed option when targets exist');
    await openStep(page,7);await page.waitForSelector('#resumeTemplateLab');
    assert(await page.locator('#qsStep8').count()===0,'Deprecated STEP 8 Quick Start still shown');
    let st=await read(page);
    for(const k of ['jobExplorer','industryCompany','jdAnalyzer','careerAssets'])assert(JSON.stringify(st.artifacts[k])===JSON.stringify(seed.artifacts[k]),'Opening STEP 7·8 modified saved '+k);
    assert(JSON.stringify(st.assessments.experienceCompetency)===JSON.stringify(seed.assessments.experienceCompetency),'Opening STEP 7·8 modified experiences');

    // STEP 7 새로 시작 → 되돌리기
    await openStep(page,6);await page.waitForSelector('#qsStep7');
    await page.locator('#qsStep7 .qsDetails > summary').click();
    assert(!(await page.locator('#qs7Code').count()),'Code field should be hidden when a code already exists');
    await page.fill('#qs7Job','데이터 분석');await page.fill('#qs7Industry','IT·플랫폼');await page.click('#qs7Save');await page.click('#jf7Legacy');
    await page.waitForFunction(()=>[...document.querySelectorAll('#industryJobId option')].map(o=>o.textContent).join('|')==='선택|데이터 분석');
    st=await read(page);
    assert(st.profile.anonCode==='JF26-SEEDAB','Existing anonymous code changed');
    assert(JSON.stringify(st.artifacts.jobExplorer)===JSON.stringify(seed.artifacts.jobExplorer),'Quick start modified STEP 4 data');
    assert(JSON.stringify(st.artifacts.industryCompany)===JSON.stringify(seed.artifacts.industryCompany),'Quick start modified STEP 7 saved data');
    assert(await page.locator('[data-qs7-use="explorer"]').isVisible(),'Switch-back button should be visible without opening the panel');
    await page.click('[data-qs7-use="explorer"]');await page.click('#jf7Legacy');
    await page.waitForFunction(()=>[...document.querySelectorAll('#industryJobId option')].some(o=>o.textContent==='브랜드 마케팅'));
    st=await read(page);
    assert(st.artifacts.quickStart.step7.active===false,'Switching back to STEP 4 target did not persist');

    // STEP 8: 기존 STEP 3 경험을 선택 불러와도 원본과 JD·Career Asset은 유지해야 한다.
    await openStep(page,7);await page.waitForSelector('#resumeTemplateLab');
    await page.locator('[data-resume-import="experiences"]').first().click();
    st=await read(page);
    assert(st.artifacts.careerAssets.assets.some(a=>a.id==='asset1'),'Existing career asset was removed');
    assert(st.artifacts.jdAnalyzer.postings.length===1&&st.artifacts.jdAnalyzer.selectedId==='jd1','Saved JD was changed');
    assert(st.assessments.experienceCompetency.experiences.length===1,'Original STEP 3 experience was changed');
    assert(st.artifacts.resumeLab.forms.standard.activities.r0.activity.includes('소비자 조사'),'Verified STEP 3 experience was not imported');
    assert(errors.length===0,'Browser errors: '+errors.join(' | '));
    console.log('PASS learner with data keeps original data and can switch back');
  }catch(err){failed=true;console.error('FAIL B\n'+(err.stack||err));}
  finally{await context.close();}
}

await browser.close();
if(failed)process.exit(1);

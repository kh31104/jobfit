import {chromium,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const output=process.env.JOBFIT_QA_OUT||'v2/test-output/step8-pdf-qa';
mkdirSync(output,{recursive:true});
const must=(condition,message)=>{if(!condition)throw Error(message)};
const fakeState=()=>({
  version:2.2,activeStep:7,mode:'full',
  profile:{anonCode:'JF26-STEP8-QA',courseCode:'INJE2026',major:'경영학과'},
  assessments:{experienceCompetency:{experiences:[{id:'ex1',title:'고객 리뷰 분류 프로젝트',action:'리뷰 30건을 범주화',result:'분류표 작성',evidence:'분류표',factChecked:true}]}},
  artifacts:{
    jdAnalyzer:{postings:[{id:'jd1',company:'기존선택기업',jobTitle:'기존 선택 직무',rawPosting:'고객 리뷰를 분석하는 업무',requirements:[{id:'req1',text:'데이터 정리',level:'필수'}],gates:[],gateReviewed:true}],selectedId:'jd1'},
    careerAssets:{assets:[{id:'asset1',experienceId:'ex1',experienceTitle:'고객 리뷰 분류 프로젝트',requirementId:'req1',requirement:'데이터 정리',evidenceLevel:'A · 직접 증거',factCheck:'검증완료',sourceExperienceFactChecked:true,proof:'리뷰 30건 직접 분류',fact:'분류표',jobLink:'분류 기준 설계'}]},
    resumeLab:{items:[],forms:{standard:{},ncs:{},blind:{}},optionalDocument:{type:'none',experience:{},career:{}}},
    coverLetterLab:{questions:[]}
  }
});
const config=[
  {name:'pc-chromium',engine:chromium,opts:{viewport:{width:1366,height:900},acceptDownloads:true},pdf:true},
  {name:'android-chromium',engine:chromium,opts:{...devices['Pixel 7'],acceptDownloads:true},pdf:true},
  {name:'iphone-webkit',engine:webkit,opts:{...devices['iPhone 13'],acceptDownloads:true},pdf:false}
];
let errorsFound=0;
for(const cfg of config){
  const browser=await cfg.engine.launch({headless:true});
  const context=await browser.newContext(cfg.opts);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const by=field=>page.locator('[data-resume-bind="'+field+'"]');
  const enter=async(field,value)=>{await by(field).fill(value);};
  const openGroup=async(group)=>{
    const box=page.locator('[data-resume-section="'+group+'"]');
    if(!await box.getAttribute('open'))await box.locator('summary').click();
  };
  async function printAndCheck(button,tag,expectedText,unexpectedText=''){
    const [printPage]=await Promise.all([
      page.waitForEvent('popup',{timeout:12000}),
      page.locator(button).click()
    ]);
    await printPage.locator('.resumeA4Sheet').waitFor({timeout:12000});
    const text=await printPage.locator('body').innerText();
    for(const item of expectedText)must(text.includes(item),cfg.name+'/'+tag+' missing printed text '+item);
    if(unexpectedText)must(!text.includes(unexpectedText),cfg.name+'/'+tag+' unexpectedly leaked '+unexpectedText);
    if(cfg.pdf){
      const pdf=await printPage.pdf({format:'A4',printBackground:true});
      must(pdf.subarray(0,5).toString()==='%PDF-','Invalid PDF header: '+cfg.name+'/'+tag);
      must(pdf.length>3500,'Generated PDF is too small: '+cfg.name+'/'+tag);
      writeFileSync(path.join(output,cfg.name+'-'+tag+'.pdf'),pdf);
      console.log('PASS '+cfg.name+' '+tag+' A4 PDF '+pdf.length+' bytes; expected text present');
    }else{
      must(text.includes('모바일에서는 공유 → 프린트/인쇄'),'iPhone printable page has no save instructions');
      await printPage.screenshot({path:path.join(output,cfg.name+'-'+tag+'.png'),fullPage:true});
      console.log('PASS '+cfg.name+' '+tag+' Safari printable tab; OS PDF dialog requires manual confirmation');
    }
    await printPage.close();
  }
  try{
    await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle',timeout:40000});
    await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed:fakeState()});
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#resumeTemplateLab').waitFor();
    must(await page.locator('[data-resume-template]').count()===3,'Missing three templates');

    // Student A: general resume, no target job required despite a previously chosen JD.
    await page.locator('[data-application-mode="general"]').click();
    await enter('forms.standard.nameKo','홍테스트');
    await enter('forms.standard.phone','010-1111-2222');
    await enter('forms.standard.email','resume-test@example.com');
    await openGroup('standard-education');
    await enter('forms.standard.education.r0.school','테스트대학교');
    await enter('forms.standard.education.r0.major','경영학과');
    await enter('forms.standard.education.r0.period','2023.03~2027.02');
    await page.locator('[data-extra-exp-mode="new"]').click();
    await page.locator('[data-new-exp="title"]').fill('고객 분석 교내 프로젝트');
    await page.locator('[data-new-exp="period"]').fill('2026.03~2026.06');
    await page.locator('[data-new-exp="actionResult"]').fill('리뷰 30건을 직접 분류해 결과표 작성');
    await page.locator('#newExperienceFactChecked').check();
    await page.locator('#addNewResumeExperience').click();
    await page.locator('#refreshResumePreview').click();
    const generalText=await page.locator('#resumeA4Preview').innerText();
    must(generalText.includes('홍테스트')&&generalText.includes('테스트대학교'),'General preview lost student form data');
    must(!generalText.includes('기존 선택 직무'),'General resume inherited old JD despite general mode');
    await printAndCheck('#printResumeOnly','standard-general',['홍테스트','테스트대학교','경영학과'],'기존 선택 직무');

    // Student edits, receives two AI reviews, and keeps the previous feedback.
    await page.locator('[data-application-mode="targeted"]').click();
    await enter('targetCompany','지원희망기업');
    await enter('targetJDText','SNS 분석 및 데이터 시각화');
    await enter('forms.standard.targetJob','디지털 마케팅');
    await page.locator('#previewResumeReviewPrompt').click();
    const firstPrompt=await page.locator('#resumeReviewPromptText').inputValue();
    must(firstPrompt.includes('지원희망기업')&&firstPrompt.includes('디지털 마케팅'),'Targeted AI review ignored JD');
    must(!firstPrompt.includes('홍테스트')&&!firstPrompt.includes('010-1111-2222'),'AI prompt leaked student personal details');
    await page.locator('#resumeReviewFeedback').fill('1차: 성과 근거를 명확하게 작성하세요');
    await enter('forms.standard.targetJob','브랜드/SNS 마케팅');
    await page.locator('#redoResumeReview').click();
    const secondPrompt=await page.locator('#resumeReviewPromptText').inputValue();
    must(secondPrompt.includes('브랜드/SNS 마케팅'),'Re-review did not use edited job');
    await page.locator('#resumeReviewHistory summary').click();
    must(await page.locator('#resumeReviewHistory').innerText().then(x=>x.includes('1차: 성과 근거')),'Review history lost');
    await page.locator('#resumeReviewFeedback').fill('2차: 수정 완료');
    await page.locator('#goToResumePdf').click();
    await printAndCheck('#printResumeOnly','standard-targeted',['홍테스트','지원희망기업','브랜드/SNS 마케팅']);

    // Student B: NCS education and work experience.
    await page.locator('[data-resume-template="ncs"]').click();
    await enter('forms.ncs.nameKo','김엔씨에스');
    await enter('forms.ncs.mobile','010-1234-5678');
    await enter('forms.ncs.email','ncs@example.com');
    await enter('forms.ncs.field','홍보');
    await enter('forms.ncs.job','콘텐츠 운영');
    await openGroup('ncs-training');
    await enter('forms.ncs.training.r0.name','디지털 마케팅 실습');
    await enter('forms.ncs.training.r0.content','SNS 지표 분석 및 콘텐츠 작성');
    await page.locator('#refreshResumePreview').click();
    must((await page.locator('#resumeA4Preview').innerText()).includes('디지털 마케팅 실습'),'NCS preview missing training');
    await printAndCheck('#printResumeOnly','ncs-targeted',['김엔씨에스','디지털 마케팅 실습','콘텐츠 운영']);

    // Student C: blind resume must not include standard-resume school name.
    await page.locator('[data-resume-template="blind"]').click();
    await enter('forms.blind.name','박블라인드');
    await enter('forms.blind.phone','010-2222-3333');
    await enter('forms.blind.email','blind@example.com');
    await enter('forms.blind.targetJob','기업 홍보');
    await openGroup('blind-experience');
    await enter('forms.blind.experience.r0.organization','학생 프로젝트팀');
    await enter('forms.blind.experience.r0.role','자료 정리 담당');
    await enter('forms.blind.experience.r0.activity','소비자 의견을 분류해 발표자료 작성');
    await page.locator('#refreshResumePreview').click();
    await printAndCheck('#printResumeOnly','blind-targeted',['박블라인드','학생 프로젝트팀','기업 홍보'],'테스트대학교');

    // Optional experience document: standalone and combined PDF both need readable print windows.
    await page.locator('[data-resume-doc="experience"]').click();
    await enter('optionalDocument.experience.title','소비자 조사 경험기술서');
    await openGroup('experience-doc-evidence');
    await enter('optionalDocument.experience.action','리뷰 분류 기준을 직접 설계');
    await by('optionalDocument.experience.factChecked').check();
    await printAndCheck('#printExperienceOnly','experience-only',['소비자 조사 경험기술서','리뷰 분류 기준을 직접 설계']);
    await printAndCheck('#printResumePdf','combined-resume',['박블라인드','소비자 조사 경험기술서']);

    // Persistence and independence of template fields + review rounds.
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#resumeTemplateLab').waitFor();
    must(await by('forms.blind.name').inputValue()==='박블라인드','Blind resume lost after reload');
    await page.locator('[data-resume-template="standard"]').click();
    must(await by('forms.standard.nameKo').inputValue()==='홍테스트','Standard resume overwritten by blind');
    must(await by('forms.standard.targetJob').inputValue()==='브랜드/SNS 마케팅','Student edited job lost');
    must((await page.locator('#resumeReviewFeedback').inputValue())==='2차: 수정 완료','Second feedback not preserved');
    must((await page.locator('#resumeReviewRoundStatus').innerText()).includes('2회'),'Review rounds not persisted');
    const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    must(state.assessments.experienceCompetency.experiences[0].action==='리뷰 30건을 범주화','Original STEP 3 experience was overwritten');
    must(state.artifacts.resumeLab.additionalExperiences.length>=1,'Newly added experience missing after reload');
    must(errors.length===0,cfg.name+' browser JS error: '+errors.join(' | '));
    console.log('PASS '+cfg.name+' all STEP 8 student-flow checks; persistent inputs and existing STEP 3 intact');
  }catch(error){
    errorsFound++;
    console.error('FAIL '+cfg.name+' '+(error.stack||error));
    await page.screenshot({path:path.join(output,cfg.name+'-failed.png'),fullPage:true}).catch(()=>{});
  }finally{
    await context.close();
    await browser.close();
  }
}
if(errorsFound)process.exitCode=1;
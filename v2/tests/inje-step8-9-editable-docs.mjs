import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const key='jobfit:v2:learner';
const seed=()=>({
  version:2.2,activeStep:7,mode:'full',
  profile:{anonCode:'JF26-EDIT-DOC',courseCode:'INJE2026',major:'경영학과'},
  assessments:{experienceCompetency:{experiences:[{id:'ex1',title:'리뷰 분석',action:'고객 리뷰 30건을 분류했다.',result:'분류표를 작성했다.',evidence:'분류표',factChecked:true,rawVoice:'분류 기준을 정하고 직접 정리했다.'}]}},
  artifacts:{
    jdAnalyzer:{postings:[{id:'jd1',company:'가상기업',jobTitle:'브랜드 마케팅',rawPosting:'리뷰 분석',requirements:[{id:'r1',text:'고객 데이터 분석',level:'필수'}],gates:[],gateReviewed:true}],selectedId:'jd1'},
    careerAssets:{assets:[{id:'asset1',experienceId:'ex1',experienceTitle:'리뷰 분석',requirementId:'r1',requirement:'고객 데이터 분석',evidenceLevel:'A · 직접 증거',factCheck:'검증완료',sourceExperienceFactChecked:true,proof:'고객 리뷰 30건 분류',fact:'분류표',jobLink:'고객 데이터 분류 경험'}]},
    resumeLab:{items:[],forms:{standard:{},ncs:{},blind:{}},optionalDocument:{type:'none',experience:{},career:{}}},
    coverLetterLab:{questions:[]}
  }
});
const browser=await chromium.launch({headless:true});
let failed=false;
for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle'});
    await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed:seed()});
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#resumeTemplateLab').waitFor();
    await page.locator('[data-resume-bind="forms.standard.targetJob"]').fill('마케팅');
    await page.locator('[data-resume-template="ncs"]').click();
    await page.locator('[data-resume-template="standard"]').click();
    assert(await page.locator('[data-resume-bind="forms.standard.targetJob"]').inputValue()==='마케팅','Template switching erased manual entry');

    await page.selectOption('#assetId','asset1');
    await page.selectOption('#section',{label:'프로젝트'});
    await page.locator('#rawBullet').fill('리뷰 분석 원문');
    await page.locator('#finalBullet').fill('리뷰 30건 직접 분류');
    await page.locator('#factChecked').check();
    await page.locator('#addItem').click();
    assert(await page.locator('#resumeItems [data-edit]').count()===1,'Resume item not saved');
    const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).artifacts.resumeLab.items[0].id,key);
    await page.locator('#resumeItems [data-edit]').click();
    assert(!(await page.locator('#factChecked').isChecked()),'Existing resume fact check was improperly inherited');
    await page.locator('#finalBullet').fill('리뷰 30건 기준별 분류 및 표 작성');
    await page.locator('#factChecked').check();
    await page.locator('#addItem').click();
    const resume=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).artifacts.resumeLab,key);
    assert(resume.items.length===1&&resume.items[0].id===before,'Editing duplicated resume row');
    assert(resume.items[0].finalBullet.includes('기준별 분류')&&resume.items[0].status==='final-ready','Resume updated bullet not final-ready');

    await page.locator('[data-resume-doc="experience"]').click();
    await page.locator('[data-resume-bind="optionalDocument.experience.title"]').fill('경험기술서 실습');
    await page.locator('[data-resume-bind="optionalDocument.experience.action"]').fill('리뷰를 실제로 분류함');
    await page.locator('[data-resume-bind="optionalDocument.experience.factChecked"]').check();
    assert(await page.locator('#printExperienceOnly').count()===1,'Separate experience PDF option missing');
    const popupPromise=page.waitForEvent('popup');
    await page.locator('#printExperienceOnly').click();
    const popup=await popupPromise;
    await popup.locator('body').waitFor();
    assert((await popup.locator('body').innerText()).includes('경험기술서 실습'),'Separate PDF missed saved experience');
    await popup.close();

    await page.reload({waitUntil:'networkidle'});
    await page.locator('#resumeTemplateLab').waitFor();
    assert(await page.locator('[data-resume-bind="forms.standard.targetJob"]').inputValue()==='마케팅','Resume state lost on reload');
    const oldAssessment=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).assessments.experienceCompetency.experiences[0].action,key);
    assert(oldAssessment==='고객 리뷰 30건을 분류했다.','Upstream experience overwritten');

    await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.activeStep=8;localStorage.setItem(key,JSON.stringify(s));},key);
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#question').waitFor();
    await page.locator('#question').fill('고객 데이터를 분석한 경험은?');
    await page.locator('#intent').fill('실제 분석 경험 확인');
    await page.selectOption('#requirementId','r1');
    await page.locator('[data-asset="asset1"]').check();
    await page.locator('#rawAnswer').fill('분류 기준을 직접 수립');
    await page.locator('#draft').fill('고객 리뷰 분석 초안');
    await page.locator('#finalAnswer').fill('고객 리뷰 30건을 직접 분류했습니다.');
    await page.locator('#factChecked').check();
    await page.locator('#addQuestion').click();
    assert(await page.locator('[data-cover-edit]').count()===1,'Cover question not saved');
    const coverBefore=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).artifacts.coverLetterLab.questions[0].id,key);
    await page.locator('[data-cover-edit]').click();
    assert(!(await page.locator('#factChecked').isChecked()),'Existing cover fact check was improperly inherited');
    await page.locator('#finalAnswer').fill('고객 리뷰 30건을 기준별로 직접 분류했습니다.');
    await page.locator('#factChecked').check();
    await page.locator('#addQuestion').click();
    const cover=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).artifacts.coverLetterLab,key);
    assert(cover.questions.length===1&&cover.questions[0].id===coverBefore,'Editing duplicated cover question');
    assert(cover.questions[0].finalAnswer.includes('기준별로')&&cover.questions[0].status==='final-ready','Cover final not saved');

    const downloadPromise=page.waitForEvent('download');
    await page.locator('[data-cover-txt]').click();
    const dl=await downloadPromise;
    assert(dl.suggestedFilename().endsWith('.txt'),'Per-question TXT did not download');

    await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.activeStep=11;localStorage.setItem(key,JSON.stringify(s));},key);
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#portfolioPrint').waitFor();
    assert((await page.locator('#portfolioPrint').innerText()).includes('기준별로 직접 분류했습니다.'),'Edited cover final not forwarded to portfolio');
    assert(errors.length===0,'Browser error: '+errors.join(' | '));
    console.log('PASS INJE STEP 8-9 editable documents '+width+'px');
  }catch(e){failed=true;console.error('FAIL '+width+'px '+(e.stack||e));}
  finally{await context.close();}
}
await browser.close();
if(failed)process.exit(1);

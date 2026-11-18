import {chromium,webkit,devices} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const formPaths={
  standard:{name:'forms.standard.nameKo',existing:'forms.standard.education.r0.school',expected:'내가 작성한 학교',newPath:'forms.standard.activities.r0.note',newValue:'직접 수정한 활동 내용'},
  ncs:{name:'forms.ncs.nameKo',existing:'forms.ncs.training.r0.name',expected:'직접 작성한 교육',newPath:'forms.ncs.training.r0.content',newValue:'직접 수정한 교육 내용'},
  blind:{name:'forms.blind.name',existing:'forms.blind.experience.r0.organization',expected:'직접 작성한 조직',newPath:'forms.blind.experience.r0.activity',newValue:'직접 수정한 경험 내용'}
};
const seed=type=>({
  version:2.2,activeStep:7,mode:'full',
  profile:{anonCode:'JF26-INJE-DIRECT-QA',courseCode:'INJE2026',major:'경영학과',schoolName:'검증대학교'},
  assessments:{experienceCompetency:{experiences:[
    {id:'ex1',category:'프로젝트',title:'소비자 조사',action:'고객 리뷰를 분류함',result:'분류표 작성',factChecked:true},
    {id:'ex2',category:'프로젝트',title:'검증 전 활동',action:'검증 안 됨',factChecked:false}
  ]}},
  artifacts:{
    jobDeepDive:{targetAnalyses:{t1:{studentSpec:{certificates:'컴퓨터활용능력 2급',tools:'Excel'}}},analyses:{}},
    jdAnalyzer:{postings:[{id:'jd1',company:'가상기업',jobTitle:'브랜드 마케팅'}],selectedId:'jd1'},
    resumeLab:{templateType:type,applicationMode:'general',items:[],forms:{
      standard:{education:{r0:{school:'내가 작성한 학교',major:'인문학과'}},activities:{r0:{activity:'내가 작성한 활동',note:'기존 작성한 활동 내용'}}},
      ncs:{training:{r0:{name:'직접 작성한 교육',content:'기존 교육 내용'}}},
      blind:{experience:{r0:{organization:'직접 작성한 조직',activity:'기존 경험 내용'}}}
    },optionalDocument:{type:'none',experience:{title:'미완료 경험기술서'},career:{}}}
  }
});
const cases=[
  {name:'PC Chrome',engine:chromium,opts:{viewport:{width:1280,height:900}}},
  {name:'Android Chrome',engine:chromium,opts:{...devices['Pixel 7']}},
  {name:'iPhone Safari',engine:webkit,opts:{...devices['iPhone 13']}}
];
for(const testCase of cases){
  const browser=await testCase.engine.launch({headless:true});
  try{
    for(const type of ['standard','ncs','blind']){
      const context=await browser.newContext(testCase.opts);
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
      try{
        await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle',timeout:40000});
        const initial=seed(type),spec=formPaths[type];
        await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:key,s:initial});
        await page.reload({waitUntil:'networkidle'});
        await page.locator('#resumeTemplateLab').waitFor({timeout:15000});
        assert(await page.locator('#resumeTemplateTabs + #resumeTemplateForm').count()===1,testCase.name+'/'+type+': template not followed immediately by form');
        assert(await page.locator('#resumeEvidenceImport,#resumeAutoImport,#resumePriorDetails').count()===0,testCase.name+'/'+type+': removed middle panels still exist');
        assert(await page.locator('#resumeOptionalDocsDisclosure').count()===1,testCase.name+'/'+type+': optional documents missing');
        assert(!(await page.locator('#resumeOptionalDocsDisclosure').evaluate(el=>el.open)),testCase.name+'/'+type+': optional documents not collapsed');
        assert((await page.locator('[data-resume-bind="'+spec.existing+'"]').inputValue())===spec.expected,testCase.name+'/'+type+': previously saved value missing');
        const before=await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));return {profile:s.profile,assessments:s.assessments,jobDeepDive:s.artifacts.jobDeepDive,jdAnalyzer:s.artifacts.jdAnalyzer,optionalDocument:s.artifacts.resumeLab.optionalDocument};},key);
        await page.locator('[data-resume-bind="'+spec.name+'"]').fill('실습 학생 '+type);
        await page.locator('[data-resume-bind="'+spec.newPath+'"]').fill(spec.newValue);
        const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
        assert(saved.artifacts.resumeLab.forms[type],testCase.name+'/'+type+': selected form not saved');
        assert(JSON.stringify(saved.profile)===JSON.stringify(before.profile),testCase.name+'/'+type+': profile overwritten');
        assert(JSON.stringify(saved.assessments)===JSON.stringify(before.assessments),testCase.name+'/'+type+': STEP 3 overwritten');
        assert(JSON.stringify(saved.artifacts.jobDeepDive)===JSON.stringify(before.jobDeepDive),testCase.name+'/'+type+': STEP 5 overwritten');
        assert(JSON.stringify(saved.artifacts.jdAnalyzer)===JSON.stringify(before.jdAnalyzer),testCase.name+'/'+type+': JD overwritten');
        assert(JSON.stringify(saved.artifacts.resumeLab.optionalDocument)===JSON.stringify(before.optionalDocument),testCase.name+'/'+type+': optional documents deleted');
        await page.reload({waitUntil:'networkidle'});
        assert((await page.locator('[data-resume-bind="'+spec.name+'"]').inputValue())==='실습 학생 '+type,testCase.name+'/'+type+': name lost on reload');
        assert((await page.locator('[data-resume-bind="'+spec.existing+'"]').inputValue())===spec.expected,testCase.name+'/'+type+': existing value lost on reload');
        assert((await page.locator('[data-resume-bind="'+spec.newPath+'"]').inputValue())===spec.newValue,testCase.name+'/'+type+': edited value lost on reload');
        await page.evaluate(()=>window.JobfitStepAccordion?.openBlock?.(document.getElementById('resumeAiReview')));
        await page.locator('#previewResumeReviewPrompt').click();
        const prompt=await page.locator('#resumeReviewPromptText').inputValue();
        assert(!prompt.includes('JF26-INJE-DIRECT-QA'),testCase.name+'/'+type+': student identifier leaked to review');
        assert(!errors.length,testCase.name+'/'+type+': page error '+errors.join(' | '));
        console.log('PASS '+testCase.name+' '+type+' direct editing / existing data preservation / reload');
      }finally{await context.close();}
    }
  }finally{await browser.close();}
}
console.log('PASS simplified STEP 8: three templates x PC Android iPhone');

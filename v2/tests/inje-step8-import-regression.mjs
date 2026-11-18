import {chromium,webkit,devices} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const verified=[
  {id:'ex-edu',category:'교육·수업',title:'디지털마케팅 실습',period:'2026.03~2026.06',action:'시장 데이터를 분류했다',result:'발표 자료 작성',factChecked:true},
  {id:'ex-work',category:'인턴·경력',title:'매장 운영 인턴',organization:'테스트상점',role:'데이터 정리',action:'재고표를 정리했다',result:'오류 목록 작성',factChecked:true},
  ...Array.from({length:4},(_,i)=>({id:'ex-act-'+i,category:'프로젝트',title:'팀 프로젝트 '+(i+1),organization:'프로젝트팀',role:'분석 담당',action:'고객 의견 '+(i+1)+'차 분류',result:'분류표 완성',factChecked:true}))
];
const pending={id:'ex-pending',category:'프로젝트',title:'사실확인 전 프로젝트',action:'미확인 활동',factChecked:false};
function seed(type){
  return {
    version:2.2,activeStep:7,mode:'full',
    profile:{anonCode:'JF26-INJE-IMPORT-QA',courseCode:'INJE2026',major:'경영학과',schoolName:'검증대학교'},
    assessments:{experienceCompetency:{experiences:[...verified,pending]}},
    artifacts:{
      experienceMap:[...verified,pending],
      jobExplorer:{candidates:[{id:'job1',title:'브랜드 마케팅'}],targetCombos:[{jobId:'job1'}]},
      jobDeepDive:{targetAnalyses:{t1:{studentSpec:{certificates:'컴퓨터활용능력 2급, GTQ 1급',language:'TOEIC 850',tools:'Excel'}}},analyses:{}},
      jdAnalyzer:{postings:[{id:'jd1',company:'가상기업',jobTitle:'브랜드 마케팅'}],selectedId:'jd1'},
      resumeLab:{templateType:type,applicationMode:'general',items:[],forms:{
        standard:{education:{r0:{school:'내가 작성한 학교',major:'인문학과'}},activities:{r0:{activity:'내가 작성한 활동',note:'직접 작성한 근거'}}},
        ncs:{training:{r0:{name:'직접 작성한 교육',content:'기존 교육 내용'}}},
        blind:{experience:{r0:{organization:'직접 작성한 조직',activity:'기존 경험 내용'}}}
      }}
    }
  };
}
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
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e.message)));
      try{
        await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle',timeout:40000});
        const initial=seed(type);
        await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:key,s:initial});
        await page.reload({waitUntil:'networkidle'});
        await page.locator('#resumeTemplateLab').waitFor({timeout:15000});
        await page.evaluate(()=>window.JobfitStepAccordion?.openBlock?.(document.getElementById('resumeEvidenceImport')));
        await page.locator('#resumeAutoImport [data-resume-import="all"]').click();
        const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
        const result=state.artifacts.resumeLab;
        const report=result.lastImportReport;
        assert(report?.inje===true,testCase.name+'/'+type+': no summary');
        assert(report.pendingExperiences===1,testCase.name+'/'+type+': pending experience missing');
        assert((await page.locator('#resumeImportFeedback').innerText()).includes('사실확인 전 경험 1건'),testCase.name+'/'+type+': pending explanation missing');
        assert(report.addedByGroup.credentials===3,testCase.name+'/'+type+': qualifications not imported');
        assert(result.skills.includes('Excel'),testCase.name+'/'+type+': tools not imported');
        assert(result.applicationMode==='general',testCase.name+'/'+type+': general mode changed');
        assert(JSON.stringify(state.assessments)===JSON.stringify(initial.assessments),testCase.name+'/'+type+': original STEP 3 data changed');
        assert(JSON.stringify(state.artifacts.jobDeepDive)===JSON.stringify(initial.artifacts.jobDeepDive),testCase.name+'/'+type+': prior STEP 5 spec changed');
        assert(result.forms.standard.education.r0.school==='내가 작성한 학교',testCase.name+'/'+type+': handwritten education overwritten');
        assert(result.forms.standard.activities.r0.activity==='내가 작성한 활동',testCase.name+'/'+type+': handwritten activity overwritten');
        assert(result.forms.ncs.training.r0.name==='직접 작성한 교육',testCase.name+'/'+type+': handwritten training overwritten');
        assert(result.forms.blind.experience.r0.organization==='직접 작성한 조직',testCase.name+'/'+type+': handwritten blind experience overwritten');
        if(type==='standard'){
          assert(result.forms.standard.education.r1.school==='검증대학교',testCase.name+': profile education not imported');
          assert(result.forms.standard.career.r0.company==='테스트상점',testCase.name+': career missing');
          assert(result.forms.standard.activities.r1.activity==='디지털마케팅 실습',testCase.name+': class experience missing');
          assert(result.forms.standard.activities.r3.activity==='팀 프로젝트 2',testCase.name+': activity import order incorrect');
          assert(report.unplaced>0,testCase.name+': row cap not identified');
          assert(await page.locator('[data-resume-section="standard-activities"]').evaluate(el=>el.open),testCase.name+': added resume section not expanded');
        }else if(type==='ncs'){
          assert(result.forms.ncs.training.r1.name==='디지털마케팅 실습',testCase.name+': STEP 3 education not imported');
          assert(result.forms.ncs.career.r0.company==='테스트상점',testCase.name+': NCS career missing');
          assert(result.forms.ncs.activities.r0.group==='프로젝트팀',testCase.name+': NCS activities missing');
          assert(await page.locator('[data-resume-section="ncs-training"]').evaluate(el=>el.open),testCase.name+': NCS training not expanded');
        }else{
          assert(result.forms.blind.training.r0.course==='디지털마케팅 실습',testCase.name+': blind education missing');
          assert(result.forms.blind.experience.r1.organization==='근무기관'||result.forms.blind.experience.r1.organization==='테스트상점',testCase.name+': blind career missing');
          assert(!JSON.stringify(result.forms.blind).includes('검증대학교'),testCase.name+': blind school name leaked');
          assert(await page.locator('[data-resume-section="blind-experience"]').evaluate(el=>el.open),testCase.name+': blind experience not expanded');
        }
        const before=JSON.stringify(result.forms);
        await page.locator('#resumeAutoImport [data-resume-import="all"]').click();
        const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).artifacts.resumeLab,key);
        assert(JSON.stringify(after.forms)===before,testCase.name+'/'+type+': second import duplicated/overwrote rows');
        assert(after.lastImportReport.count===0,testCase.name+'/'+type+': second import not idempotent');
        await page.reload({waitUntil:'networkidle'});
        const reloaded=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).artifacts.resumeLab,key);
        assert(JSON.stringify(reloaded.forms)===before,testCase.name+'/'+type+': reload lost imported forms');
        assert(!errors.length,testCase.name+'/'+type+': page errors '+errors.join(' | '));
        console.log('PASS '+testCase.name+' '+type+' import / student data preservation / repeated import / reload');
      }finally{await context.close();}
    }
  }finally{await browser.close();}
}
console.log('PASS STEP 8 import simulation: 3 templates × PC/Android/iPhone');

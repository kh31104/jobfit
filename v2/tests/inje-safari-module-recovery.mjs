// Safari module import resilience: simulate network interruption and rapid reloads.
// Runs against BOTH root and /v2/ entrypoints, with real Chromium and WebKit.
import {chromium,webkit,devices} from 'playwright';

const base=(process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const key='jobfit:v2:learner';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const fixture={
  version:2.2,mode:'full',activeStep:6,
  profile:{anonCode:'JF26-SAFARI-LOAD',courseCode:'INJE2026',major:'경영학과'},
  assessments:{experienceCompetency:{experiences:[{id:'ex1',title:'고객 분석',action:'실제 리뷰 분류',evidence:'분류표',factChecked:true}]}},
  artifacts:{
    careerAssets:{assets:[{id:'a1',experienceTitle:'고객 분석',proof:'리뷰 분류',fact:'분류표'}]},
    jdAnalyzer:{selectedId:'j1',postings:[{id:'j1',company:'테스트 기업',jobTitle:'마케팅',requirements:[],gates:[],gateReviewed:true}]},
    resumeLab:{items:[{id:'keep',rawBullet:'기존 작성 이력서',finalBullet:'기존 값 유지',status:'draft'}]},
    coverLetterLab:{questions:[{id:'keep-cover',question:'자소서 문항',rawAnswer:'기존 작성 답변',status:'draft'}]}
  }
};
let failed=false;
for(const [engine,label,device] of [
  [webkit,'iPhone Safari WebKit',devices['iPhone 13']],
  [chromium,'PC Chromium',{viewport:{width:1280,height:900}}],
  [chromium,'Android Chrome',devices['Pixel 7']]
]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({...device,locale:'ko-KR'});
 await context.route(/https:\/\/[^/]*supabase\.co\//,route=>route.abort());
 const page=await context.newPage(),errors=[],failedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',request=>{if(/\/v2\/(app\.js|steps\/step9\.js)/.test(request.url()))failedRequests.push(request.url()+' : '+request.failure()?.errorText);});
 try{
   let appFailed=0;
   await page.route(/\/v2\/app\.js\?v=47$/,route=>{
     if(!appFailed++){return route.abort('failed');}
     return route.continue();
   });
   await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('.stepBtn[data-step="6"]').waitFor({timeout:45000});
   assert(appFailed===1,label+': app bootstrap interruption not triggered');
   await page.unroute(/\/v2\/app\.js\?v=47$/);

   await page.evaluate(({key,fixture})=>localStorage.setItem(key,JSON.stringify(fixture)),{key,fixture});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.stepBtn[data-step="6"].active').waitFor({timeout:45000});
   await page.locator('#stepRoot .sectionHead').waitFor({timeout:45000});

   let stepFailed=0;
   await page.route(/\/steps\/step9\.js\?v=34$/,route=>{
     if(!stepFailed++){return route.abort('failed');}
     return route.continue();
   });
   await page.locator('.stepBtn[data-step="7"]').click();
   await page.locator('#resumeTemplateLab').waitFor({timeout:45000});
   assert(stepFailed===1,label+': STEP 8 interruption not triggered');
   await page.unroute(/\/steps\/step9\.js\?v=34$/);
   assert((await page.locator('#resumeItems').innerText()).includes('기존 값 유지'),label+': seeded resume lost');
   await page.locator('.stepBtn[data-step="8"]').click();
   await page.locator('#question').waitFor({timeout:45000});
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
   assert(JSON.stringify(saved.artifacts.resumeLab.items)===JSON.stringify(fixture.artifacts.resumeLab.items),label+': resume state changed');
   assert(JSON.stringify(saved.artifacts.coverLetterLab.questions)===JSON.stringify(fixture.artifacts.coverLetterLab.questions),label+': cover state changed');
   assert(saved.assessments.experienceCompetency.experiences[0].action==='실제 리뷰 분류',label+': upstream experience changed');

   // Earlier production test exposed errors after repeated seed/reload. Confirm imports are not unhandled.
   for(let round=0;round<3;round++){
     await page.reload({waitUntil:'domcontentloaded'});
     await page.locator('#question').waitFor({timeout:45000});
   }
   // Wait for optional post-app modules to settle before asserting.
   await page.waitForTimeout(350);
   assert(errors.length===0,label+': unhandled module error '+errors.join(' | '));
   console.log('PASS '+label+' / '+base+' : app bootstrap recovered, STEP 8 recovered, reload and student data intact; intercepted requests '+failedRequests.length);
 }catch(e){failed=true;console.error('FAIL '+label+' / '+base+': '+(e.stack||e));console.error('Requested failure diagnostics: '+failedRequests.join(' | '));}
 finally{await context.close();await browser.close();}
}
if(failed)process.exit(1);

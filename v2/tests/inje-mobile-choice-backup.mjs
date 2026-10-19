import {chromium} from 'playwright';
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});
let failed=false;
for(const width of [390,320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    const state={
      version:2.2,activeStep:3,mode:'full',
      profile:{anonCode:'JF26-CHOICETEST',courseCode:'INJE2026',major:'경영학과'},
      research:{consent:false,measurements:{pre:{},post:{}}},
      assessments:{careerDNA:{},experienceCompetency:{experiences:[]}},
      artifacts:{jobExplorer:{
        candidates:[{id:'j1',title:'브랜드 마케팅',family:'마케팅',industries:['유통·물류']}],
        targetCombos:[{id:'target-j1',jobId:'j1',industry:'유통·물류',priority:1}]
      }},meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
    };
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'networkidle'});
    await page.evaluate(value=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(value)),state);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('[data-choice="activity"]');
    await page.locator('[data-choice="activity"][value="자료·데이터 분석하기"]').check();
    await page.locator('[data-choice="industry"][value="유통·물류"]').check();
    let current=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(current.artifacts.jobExplorer.desiredActivities.includes('자료·데이터 분석하기'),'STEP 4 activity not saved');
    assert(current.artifacts.jobExplorerChoiceSnapshot.industryInterests.includes('유통·물류'),'STEP 4 choices not mirrored');
    // Simulate selective loss of the STEP 4 arrays, preserving the explicit snapshot.
    current.artifacts.jobExplorer.desiredActivities=[];
    current.artifacts.jobExplorer.industryInterests=[];
    current.activeStep=5;
    await page.evaluate(value=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(value)),current);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#jobfitReportPrint');
    const report=(await page.locator('#jobfitReportPrint').textContent())||'';
    assert(report.includes('자료·데이터 분석하기'),'STEP 6 missing selected activity');
    assert(report.includes('유통·물류'),'STEP 6 missing selected industry');
    // The same JSON backup must retain the complete data and snapshot.
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:10000}),
      page.locator('#exportBtn').click()
    ]);
    assert(download.suggestedFilename().endsWith('.json'),'Expected Jobfit JSON backup');
    const backup=await download.path();
    assert(!!backup,'Browser download must produce a backed file');
    assert(errors.length===0,'JavaScript errors: '+errors.join(' | '));
    console.log('PASS STEP4 selections -> STEP6 + mobile backup '+width+'px');
  }catch(error){failed=true;console.error('FAIL choices/backup '+width+'px '+(error.stack||error))}
  finally{await context.close()}
}
await browser.close();
if(failed)process.exit(1);

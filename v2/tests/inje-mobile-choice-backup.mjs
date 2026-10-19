import {chromium} from 'playwright';
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});
let failed=false;
for(const width of [390,320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const page=await context.newPage();
  // Mock only the PDF engine's Blob output to test browser download behavior
  // independent of external CDN availability; report DOM remains real.
  await page.addInitScript(()=>{
    window.html2pdf=()=>({
      set(){return this},
      from(element){window.__pdfReportText=element.textContent;return this},
      outputPdf(){return Promise.resolve(new Blob(['%PDF-1.4\\n'],{type:'application/pdf'}))}
    });
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    const state={
      version:2.2,activeStep:3,mode:'full',
      profile:{anonCode:'JF26-CHOICETEST',courseCode:'INJE2026',major:'경영학과'},
      research:{consent:false,measurements:{pre:{},post:{}}},
      assessments:{careerDNA:{hypothesis:{text:'Career DNA 가설 v1. 내가 중요하게 생각하는 일의 조건은 안정성입니다. ✔ 첫 번째 경험은 자료를 비교한 일입니다. ✔ 두 번째 경험은 팀과 의견을 조정한 일입니다. (Balance Game 결과 참고)'}},experienceCompetency:{experiences:[{id:'e1',title:'브랜드 자료 조사',action:'고객 리뷰 분류',competencies:['자료정리','문제해결'],factChecked:true},{id:'e2',title:'팀 프로젝트',action:'협업 일정 조정',competencies:['협업'],factChecked:true}]}},
      artifacts:{jobExplorer:{
        candidates:[{id:'j1',title:'브랜드 마케팅',family:'마케팅',industries:['유통·물류']}],
        targetCombos:[{id:'target-j1',jobId:'j1',industry:'유통·물류',priority:1}]
      }},meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
    };
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'networkidle'});
    await page.evaluate(value=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(value)),state);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('[data-choice="activity"]');
    // The STEP 4 read-only cards must preserve every original character.
    const dnaOriginal='Career DNA 가설 v1. 내가 중요하게 생각하는 일의 조건은 안정성입니다. ✔ 첫 번째 경험은 자료를 비교한 일입니다. ✔ 두 번째 경험은 팀과 의견을 조정한 일입니다. (Balance Game 결과 참고)';
    const cards=page.locator('.evidenceSummaryGrid .readableCard');
    assert(await cards.count()===3,'STEP 4 evidence must show three separate cards');
    assert((await cards.nth(0).locator('.readablePreview').textContent())===dnaOriginal,'Career DNA content was modified by formatting');
    assert((await cards.nth(1).locator('.readablePreview').textContent())==='브랜드 자료 조사 · 팀 프로젝트','Best Experience names or separator were modified');
    assert((await cards.nth(2).locator('.readablePreview').textContent())==='자료정리, 문제해결, 협업','Confirmed competencies content was modified');
    assert(await cards.nth(0).locator('.previewLine').count()>=3,'Career DNA lacks visible paragraph breaks');
    assert(await cards.nth(2).locator('.previewLine').count()===3,'Competencies are not formatted in separate lines');
    const layout=await page.locator('.evidenceSummaryGrid').evaluate(el=>({
      columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
      cardWidth:el.firstElementChild.getBoundingClientRect().width,
      overflow:el.scrollWidth>el.clientWidth+2
    }));
    assert(!layout.overflow,'STEP 4 evidence grid causes horizontal scroll');
    assert(layout.columns===(width<=700?1:2),'STEP 4 cards do not use expected responsive columns');

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
    assert(await page.locator('#openReportPdf').count()===1,'Mobile PDF viewer fallback is missing');
    const [pdfDownload]=await Promise.all([
      page.waitForEvent('download',{timeout:15000}),
      page.locator('#printReport').click()
    ]);
    assert(pdfDownload.suggestedFilename()==='MY_JOBFIT_REPORT_v1.pdf','PDF file download name is wrong');
    const pdfSource=await page.evaluate(()=>window.__pdfReportText||'');
    assert(pdfSource.includes('자료·데이터 분석하기')&&pdfSource.includes('유통·물류'),'PDF source dropped report selections');
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

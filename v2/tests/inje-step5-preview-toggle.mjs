import {chromium,webkit,devices} from 'playwright';

const base=(process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const storageKey='jobfit:v2:learner';
const jobRaw=[
  '[고객·성과기준]','• 제품 품질',
  '[주요 과업]','• 시료 검사',
  '[주요 해결과제]','• 이상수치 확인',
  '[해결방법]','• 결과 비교',
  '[필요역량]','• 자료 정리'
].join('\n');
const gapRaw=[
  '[내가 가진 것]','• 실제 시료 검사 경험',
  '[확인 필요]','• ERP 교육 여부',
  '[핵심 GAP]','• GAP 1: ERP 운영 경험',
  '[3개월 행동]','• ERP 교육 이수'
].join('\n');
const analysis={
  sources:[{id:'jd1',slot:0,name:'품질관리 직무 공고',companyName:'가상기업',url:'https://example.com/jd'}],
  selectedSourceId:'jd1',
  jobTable:{
    customerKpi:'제품 품질',tasks:'시료 검사',challenge:'이상수치 확인',method:'결과 비교',
    competencies:'자료 정리',careerPlan:'',aiResult:jobRaw
  },
  studentSpec:{certificates:'없음',language:'없음',tools:'Excel',portfolio:''},
  requirements:[{id:'req1',name:'ERP 운영',status:'준비 필요',gap:'ERP 운영 경험',evidence:''}],
  have:'실제 시료 검사 경험',verify:'ERP 교육 여부',prepare:'ERP 교육 이수',
  gapAiDraft:gapRaw
};
const state={
  version:2.2,activeStep:4,mode:'full',
  profile:{anonCode:'JF26-PREVIEW-TEST',courseCode:'INJE2026',major:'화학과'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{careerDNA:{},experienceCompetency:{experiences:[{
    id:'exp-original',title:'시료 검사',action:'수치 기록',evidence:'검사지',factChecked:true
  }]}},
  artifacts:{
    jobExplorer:{
      candidates:[{id:'job1',title:'품질관리',industries:['식품']}],
      targetCombos:[{id:'target1',jobId:'job1',industry:'식품',priority:1}]
    },
    jobDeepDive:{targetAnalyses:{target1:analysis}}
  },
  meta:{createdAt:'2026-10-19T00:00:00Z',updatedAt:'2026-10-19T00:00:00Z'}
};
function check(ok,message){if(!ok)throw Error(message)}
async function run(engine,label,device){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...device,locale:'ko-KR'});
  await context.route(/https:\/\/[^/]*supabase\.co\//,route=>route.abort());
  const page=await context.newPage();
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'domcontentloaded',timeout:60000});
    await page.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),[storageKey,state]);
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#gapSummary').waitFor({state:'attached',timeout:45000});
    const before=await page.evaluate(key=>localStorage.getItem(key),storageKey);
    const job=page.locator('#jobAiPreviewDetails'),gap=page.locator('#gapAiPreviewDetails');
    check(await job.count()===1&&await gap.count()===1,label+': missing preview disclosures');
    check(await job.getAttribute('open')===null&&await gap.getAttribute('open')===null,label+': previews should start collapsed');
    check(await page.locator('#jobAiImport').inputValue()===jobRaw,label+': original JD AI raw modified');
    check(await page.locator('#deepAiImport').inputValue()===gapRaw,label+': original GAP AI raw modified');
    const finalJob=await page.locator('#jobAnalysisPreview').textContent();
    const finalGap=await page.locator('#gapSummary').textContent();
    check(finalJob.includes('시료 검사')&&finalGap.includes('ERP 운영 경험'),label+': final saved results missing');
    for(const id of ['jobAiPreviewDetails','gapAiPreviewDetails']){
      await page.evaluate(id=>{
        const block=document.getElementById(id)?.closest('.block');
        window.JobfitStepAccordion?.openBlock?.(block);
      },id);
      const detail=page.locator('#'+id);
      await detail.locator('summary').click();
      check(await detail.getAttribute('open')!==null,label+': '+id+' failed to expand');
      check((await detail.textContent()).includes(id==='jobAiPreviewDetails'?'시료 검사':'ERP 운영 경험'),label+': '+id+' has no preview content');
      await detail.locator('summary').click();
      check(await detail.getAttribute('open')===null,label+': '+id+' failed to collapse');
    }
    check((await page.locator('#jobAnalysisPreview').textContent())===finalJob,label+': finished JD report was changed');
    check((await page.locator('#gapSummary').textContent())===finalGap,label+': saved GAP report was changed');
    check((await page.evaluate(key=>localStorage.getItem(key),storageKey))===before,label+': toggling display rewrote learner storage');
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#gapSummary').waitFor({state:'attached',timeout:45000});
    check(await page.locator('#jobAiPreviewDetails').getAttribute('open')===null,label+': JD preview reopened on reload');
    check(await page.locator('#gapAiPreviewDetails').getAttribute('open')===null,label+': GAP preview reopened on reload');
    check(await page.locator('#jobAiImport').inputValue()===jobRaw,label+': JD raw changed after reload');
    check(await page.locator('#deepAiImport').inputValue()===gapRaw,label+': GAP raw changed after reload');
    console.log('PASS '+label+': both disclosures toggle; originals, final results and storage remain unchanged');
  }finally{await context.close();await browser.close();}
}
let errors=0;
for(const [engine,label,device] of [
  [chromium,'PC Chromium',{viewport:{width:1280,height:900}}],
  [webkit,'iPhone Safari WebKit',devices['iPhone 13']],
  [chromium,'Android Chrome Chromium',devices['Pixel 7']]
]){
  try{await run(engine,label,device)}catch(e){errors++;console.error('FAIL '+label+': '+(e.stack||e))}
}
if(errors)process.exit(1);

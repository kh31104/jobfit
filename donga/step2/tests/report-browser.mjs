import {chromium} from "playwright";
import assert from "node:assert/strict";

const url=process.env.JOBFIT_STEP2_URL||"http://127.0.0.1:8765/donga/step2/";
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(url,{waitUntil:"networkidle"});
 await page.evaluate(()=>{
  localStorage.setItem("jobfit:donga:step2:v1",JSON.stringify({
   app:"JOBFIT_DONGA_STEP2",version:11,currentStep:4,sampleJobId:"custom",
   target:{industry:"유통",job:"브랜드 마케팅",company:"예시회사"},
   customJob:{company:"예시회사",role:"브랜드 마케팅",title:"신입 마케팅 담당",sourceUrl:"https://example.com/jobs/123",facts:"SNS 관리"},
   student:{major:"경영학과",majorEvidence:"시장 조사 과제",certificates:"",language:"TOEIC 820",tools:"Excel"},
   jobTable:{customerKpi:"고객 만족, 전환율",tasks:"경쟁사 조사, SNS 콘텐츠 제작",challenge:"고객 유입",method:"시장분석, 콘텐츠 제작",competencies:"브랜드 이해, 고객 분석"},
   requirements:[
    {condition:"필수·지원자격: Photoshop, SNS관리, 콘텐츠기획 핵심역량: 성실성, 창의성",status:"일부 준비",note:"자동 불러오기 · 전공: 경영학과 / 과제 수행"},
    {condition:"우대사항: SNS 콘텐츠 제작 경험, Canva",status:"현재 GAP",note:"작업 경험 부족"},
    {condition:"직무 필요역량: 시장 조사, 데이터 분석",status:"충족",note:"경영학과 데이터 분석 수업"}
   ],
   fit:{gaps:"1. 콘텐츠 기획 실적\n2. Canva 활용 경험",actions:"• 콘텐츠 3개 제작\n• 피드백 반영"}
  }));
 });
 await page.reload({waitUntil:"networkidle"});
 assert.equal(await page.locator("#step2ReportBlock").count(),1,"report exists only at end of 04");
 assert.equal(await page.locator("#step2PdfBtn").count(),1,"PDF button exists");
 assert((await page.locator(".requirementRow .donga-readable-line").count())>=5,"requirement conditions bulletized");
 assert((await page.locator("#step2Report .donga-job-table tr").count())>=9,"job analysis and specs tables");
 const before=await page.evaluate(()=>localStorage.getItem("jobfit:donga:step2:v1"));
 await page.locator("#step2ReportRefreshBtn").click();
 const after=await page.evaluate(()=>localStorage.getItem("jobfit:donga:step2:v1"));
 assert.equal(after,before,"refresh must not alter saved raw data");
 const firstNote=page.locator('[data-req="0"][data-reqkey="note"]');
 if(!(await firstNote.isVisible()))await firstNote.locator("xpath=ancestor::details[1]/summary").click();
 await firstNote.fill("직접 확인한 근거\n추가 경험");
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")));
 assert.equal(result.requirements[0].note,"직접 확인한 근거\n추가 경험","editable original preserved");
 assert.equal(result.jobTable.tasks,"경쟁사 조사, SNS 콘텐츠 제작","job table original preserved");
 assert.match(await page.locator('[data-evidence-preview="0"]').innerText(),/추가 경험/,"note preview updated");
 await page.emulateMedia({media:"print"});
 await page.evaluate(()=>document.body.classList.add("donga-report-print"));
 const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
 assert(pdf.byteLength>8000,"PDF created");
 const pageCount=(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length;
 assert(pageCount>=1&&pageCount<=5,"print pages reasonable "+pageCount);
 assert.deepEqual(errors,[],"no browser exceptions");
 console.log("PASS STEP 2 GAP bullets, non-mutating preview, editable notes, A4 PDF; pages="+pageCount);
}finally{await browser.close();}

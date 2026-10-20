import assert from "node:assert/strict";
import {chromium, webkit, devices} from "playwright";
const url=process.env.JOBFIT_STEP3_URL||"http://127.0.0.1:8765/donga/step3/";
for(const [label,type,device] of [
 ["Desktop Chrome",chromium,null],
 ["Android Chrome",chromium,devices["Pixel 7"]],
 ["iPhone Safari",webkit,devices["iPhone 13"]]
]){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext({...(device||{}),acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(url,{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>{
   localStorage.setItem("jobfit:donga:step1:v1","step1-unchanged");
   localStorage.setItem("jobfit:donga:step2:v1",JSON.stringify({app:"JOBFIT_DONGA_STEP2",target:{job:"품질관리"}}));
 });
 await page.reload({waitUntil:"domcontentloaded"});
 await page.locator("#loadStep2").click();
 assert.equal(await page.locator("#job").inputValue(),"품질관리",label+" import job");
 await page.locator("#prePlan").fill("채용공고 비교\n측정 데이터 실습\n성과 사례 정리");
 await page.locator("#postPlan").fill("검사·기준 익히기\n개선 업무 수행\n품질 전문가");
 await page.locator("#makeAiPrompt").click();
 const aiPrompt=await page.locator("#aiPrompt").inputValue();
 assert.match(aiPrompt,/Q1 희망 직무: 품질관리/,label+" AI prompt job");
 assert.match(aiPrompt,/Q2 취업 전 준비계획: 채용공고 비교/,label+" AI prompt student plan");
 assert.match(aiPrompt,/학생이 STEP 2에서 입력한 담당업무/,label+" AI prompt STEP 2 facts heading");
 await page.locator("#build").click();
 assert.equal(await page.locator("#leftEditors .editItem").count(),3,label+" left stages");
 assert.equal(await page.locator("#rightEditors .editItem").count(),4,label+" right stages");
 let value=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(value.left[0].one,"채용공고 비교",label+" own plan prioritized");
 assert.equal(value.right[0].one,"검사·기준 익히기",label+" own future prioritized");
 assert.equal(value.left[0].origin,"mine",label+" source mark");
 assert.equal(value.right[3].origin,"cdp",label+" fallback source mark");
 await page.locator("#leftEditors .editItem").first().locator("textarea").first().fill("채용공고 3개 직접 비교");
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#leftEditors .editItem").first().locator("textarea").first().inputValue(),"채용공고 3개 직접 비교",label+" saved after reload");
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:donga:step1:v1")),"step1-unchanged",label+" step1 preserved");
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")))).target.job,"품질관리",label+" step2 preserved");
 assert.equal(await page.locator("#paper .roadItem").count(),7,label+" 7 visual nodes");

 await page.locator("#makeArtPrompt").click();
 const artPrompt=await page.locator("#artPrompt").inputValue();
 assert.match(artPrompt,/A4 가로형 297 × 210mm/,label+" art A4 landscape");
 assert.match(artPrompt,/채용공고 3개 직접 비교/,label+" art own content");
 assert.match(artPrompt,/왼쪽 그림/,label+" art left heading");
 assert.match(artPrompt,/오른쪽 그림/,label+" art right heading");
 const aiJSON=JSON.stringify({
   before:[{goal:"품질 채용공고 비교",action:"업무 세부내용 확인"},{goal:"측정·검사 프로젝트",action:"측정 결과 분석"},{goal:"품질 사례 준비",action:"문제해결 과정 설명"}],
   after:[{goal:"기준·검사 업무 파악",action:"현장 기준 숙지"},{goal:"불량 원인분석",action:"개선 실무 경험"},{goal:"품질 체계 운영",action:"협업과 분석 강화"},{goal:"품질 분야 전문가",action:"직무 전문성 확장"}]
 });
 await page.locator("#aiAnswer").fill(aiJSON);
 page.once("dialog",d=>d.accept());
 await page.locator("#applyAi").click();
 let aiState=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(aiState.left[0].one,"품질 채용공고 비교",label+" AI parsed response");
 assert.equal(aiState.left[0].origin,"ai",label+" AI attribution");
 assert.equal(aiState.question.pre,"채용공고 비교\n측정 데이터 실습\n성과 사례 정리",label+" original student question untouched");
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#aiAnswer").inputValue(),aiJSON,label+" AI answer restored");
 assert.equal(await page.locator("#leftEditors textarea").first().inputValue(),"품질 채용공고 비교",label+" AI stages restored");
 assert.equal((await page.locator("#paper .roadItem").count()),7,label+" 7 AI nodes in preview");
 await page.locator("#makeArtPrompt").click();
 assert.match(await page.locator("#artPrompt").inputValue(),/품질 채용공고 비교/,label+" art prompt refreshes from AI result");

 if(label==="Desktop Chrome"){
   const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
   const count=(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length;
   assert.equal(count,1,"A4 landscape report must be exactly one PDF page");
 }
 assert.deepEqual(errors,[],label+" runtime errors");
 await context.close();await browser.close();
 console.log("PASS",label);
}
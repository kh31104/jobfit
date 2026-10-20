import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
const url=process.env.JOBFIT_STEP3_URL||"http://127.0.0.1:8765/donga/step3/";
const before=[
 {goal:"품질 채용공고 비교",action:"업무 세부내용 확인"},
 {goal:"측정·검사 프로젝트",action:"측정 결과 분석"},
 {goal:"품질 사례 준비",action:"문제해결 과정 설명"}
];
const after=[
 {goal:"품질개선 실무 수행",action:"공정 불량 원인 분석"},
 {goal:"품질시스템 개선 담당",action:"중요 문제 해결"},
 {goal:"품질 전략 수립 참여",action:"관련 부서 운영 이해"},
 {goal:"품질 전문 컨설턴트",action:"경력 방향 검토"}
];
for(const [label,type,device] of [["Desktop Chrome",chromium,null],["Android Chrome",chromium,devices["Pixel 7"]],["iPhone Safari",webkit,devices["iPhone 13"]]]){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext({...(device||{}),acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(url,{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>{
   localStorage.setItem("jobfit:donga:step1:v1","step1-untouched");
   localStorage.setItem("jobfit:v2:learner","INJE_DO_NOT_TOUCH");
   localStorage.setItem("jobfit:flexlab:job-analysis:v1","FLEX_DO_NOT_TOUCH");
   localStorage.setItem("jobfit:donga:step2:v1",JSON.stringify({app:"JOBFIT_DONGA_STEP2",target:{job:"품질관리"}}));
 });
 await page.reload({waitUntil:"domcontentloaded"});
 const nav=page.locator("#dongaStep3Nav .donga-stepbtn");
 assert.equal(await nav.count(),5,label+" five left navigation buttons");
 assert.equal(await page.locator("#dongaPanel1").isVisible(),true,label+" starting point first");
 assert.match(await page.locator("#starting2").innerText(),/품질관리/,label+" STEP 2 read-only");
 const go=async n=>{await nav.nth(n-1).click();assert.equal(await page.locator("#dongaPanel"+n).isVisible(),true,label+" panel "+n)};
 await go(2);
 await page.locator("#loadStep2").click();
 assert.equal(await page.locator("#job").inputValue(),"품질관리",label+" import chosen job");
 await page.locator("#prePlan").fill("채용공고 비교\n측정 데이터 실습\n성과 사례 정리");
 await page.locator("#postPlan").fill("검사·기준 익히기\n개선 업무 수행\n품질 전문가");
 await page.locator("#targetTime").selectOption("6개월 이내");
 await page.locator("#build").click();
 let data=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(data.left[0].one,"채용공고 비교",label+" student preference preserved");
 assert.equal(data.right[0].one,"검사·기준 익히기",label+" student career preference");
 assert.equal(data.left[0].label,"탐색기",label+" before labels");
 assert.equal(data.right[0].label,"5년 차",label+" final stages default");
 await go(3);
 await page.locator("#makeAiPrompt").click();
 const prePrompt=await page.locator("#aiPrompt").inputValue();
 assert.match(prePrompt,/희망 직무: 품질관리/,label+" career plan job");
 assert.match(prePrompt,/희망 취업 시점: 6개월 이내/,label+" career plan date");
 assert.match(prePrompt,/보완할 GAP/,label+" career plan GAP");
 assert.match(prePrompt,/"before"/,label+" plan response schema");
 await page.locator("#aiAnswer").fill(JSON.stringify({before}));
 page.once("dialog",d=>d.accept());
 await page.locator("#applyAi").click();
 await go(4);
 await page.locator("#careerTrack").selectOption("전문가형");
 await page.locator("#makePostPrompt").click();
 const postPrompt=await page.locator("#postPrompt").inputValue();
 assert.match(postPrompt,/희망 경력 방향: 전문가형/,label+" career track");
 assert.match(postPrompt,/"after"/,label+" roadmap response schema");
 assert.match(postPrompt,/15년 차/,label+" long-term years");
 await page.locator("#postAnswer").fill(JSON.stringify({after}));
 page.once("dialog",d=>d.accept());
 await page.locator("#applyPost").click();
 await go(5);
 await page.locator("#monthActions").fill("1. JD 검토\n2. 분석 프로젝트\n3. 포트폴리오");
 await page.locator("#semesterOutput").fill("측정 데이터 분석 보고서 1개");
 await page.locator("#priorityGap").fill("품질 데이터 분석 경험");
 assert.equal(await page.locator("#leftEditors .editItem").count(),3,label+" before editors");
 assert.equal(await page.locator("#rightEditors .editItem").count(),4,label+" after editors");
 assert.equal(await page.locator("#paper .roadItem").count(),7,label+" both career maps");

 const preview=await page.evaluate(()=>{
  const view=document.querySelector(".paperViewport").getBoundingClientRect();
  const paper=document.querySelector("#paper").getBoundingClientRect();
  const right=document.querySelector(".right.roadmap").getBoundingClientRect();
  return {view:[view.left,view.right],paper:[paper.left,paper.right],right:[right.left,right.right]};
 });
 assert(preview.paper[0]>=preview.view[0]-2&&preview.paper[1]<=preview.view[1]+2,label+" whole page fits preview");
 assert(preview.right[1]<=preview.view[1]+2,label+" right roadmap visible in preview");
 await page.locator("#previewZoom").click();
 assert.equal(await page.locator("#previewZoom").getAttribute("aria-pressed"),"true",label+" preview zoom enabled");
 await page.locator("#previewZoom").click();
 assert.equal(await page.locator("#previewZoom").getAttribute("aria-pressed"),"false",label+" preview fit restored");
 await page.locator("#makeArtPrompt").click();
 const art=await page.locator("#artPrompt").inputValue();
 assert.match(art,/A4 가로형 297 × 210mm/,label+" A4 layout");
 assert.match(art,/품질 채용공고 비교/,label+" left AI content");
 assert.match(art,/품질개선 실무 수행/,label+" right AI content");
 await page.reload({waitUntil:"domcontentloaded"});
 await go(5);
 data=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(data.drafts.aiAnswer,JSON.stringify({before}),label+" AI plan answer persistence");
 assert.equal(data.drafts.postAnswer,JSON.stringify({after}),label+" AI career answer persistence");
 assert.equal(data.action.month,"1. JD 검토\n2. 분석 프로젝트\n3. 포트폴리오",label+" action persistence");
 assert.equal(data.question.targetTime,"6개월 이내",label+" target time persistence");
 assert.equal(data.question.pre,"채용공고 비교\n측정 데이터 실습\n성과 사례 정리",label+" raw student answer persistence");
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:donga:step1:v1")),"step1-untouched",label+" STEP 1 untouched");
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")))).target.job,"품질관리",label+" STEP 2 untouched");
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:v2:learner")),"INJE_DO_NOT_TOUCH",label+" INJE protected");
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:flexlab:job-analysis:v1")),"FLEX_DO_NOT_TOUCH",label+" FLEX protected");
 if(label==="Desktop Chrome"){
   const saved=await page.evaluate(()=>localStorage.getItem("jobfit:donga:step3:v1"));
   const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#export").click()]);
   assert.match(download.suggestedFilename(),/JOBFIT_DONGA_STEP3_backup/,label+" backup filename");
   await page.locator("#monthActions").fill("임시 수정");
   page.once("dialog",dialog=>dialog.accept());
   await page.locator("#importFile").setInputFiles({name:"JOBFIT_DONGA_STEP3_backup.json",mimeType:"application/json",buffer:Buffer.from(saved)});
   await page.waitForFunction(()=>document.querySelector("#monthActions").value.startsWith("1. JD 검토"));
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")).action.month),"1. JD 검토\n2. 분석 프로젝트\n3. 포트폴리오",label+" restored backup");
 }
 if(label==="Desktop Chrome"){
   await page.emulateMedia({media:"print"});
   assert.equal(await page.locator("#paper").evaluate(el=>getComputedStyle(el).transform),"none",label+" print scaling reset");
   const metrics=await page.evaluate(()=>{
 const paper=document.querySelector("#paper");
 const titles=[...paper.querySelectorAll(".note")].map(el=>({client:el.clientHeight,scroll:el.scrollHeight}));
 const cols=[...paper.querySelectorAll(".roadmap")].map(el=>{const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}});
 return {paper:{width:paper.clientWidth,height:paper.clientHeight},columns:cols,overflows:titles.filter(x=>x.scroll>x.client+3)};
 });
 console.log("PDF_LAYOUT_METRICS",JSON.stringify(metrics));
 assert.equal(metrics.columns.length,2,"exactly two graphic columns");
 assert(metrics.columns[0].x<metrics.columns[1].x,"left and right illustrations");
 assert.equal(metrics.overflows.length,0,"visible text must not be clipped");
 const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
   assert.equal((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length,1,"A4 landscape one page");
 }

 const flowPage=await context.newPage();
 await flowPage.goto(url.replace(/step3\/?$/,""),{waitUntil:"domcontentloaded"});
 const font1=await flowPage.evaluate(()=>getComputedStyle(document.body).fontFamily);
 const nav1=await flowPage.locator("#dongaSide1 .donga-steplabel b").first().evaluate(el=>getComputedStyle(el).fontSize);
 const subtitle1=await flowPage.locator("#dongaSide1 .donga-steplabel small").first().evaluate(el=>getComputedStyle(el).fontSize);
 const section1=await flowPage.locator("#step1 .heading b").evaluate(el=>getComputedStyle(el).fontSize);
 const hero1=await flowPage.locator("header h1").evaluate(el=>getComputedStyle(el).fontSize);

 const headerWeight1=await flowPage.locator("header h1").evaluate(el=>getComputedStyle(el).fontWeight);
 assert.equal(await flowPage.locator('details.step:visible').count(),1,label+" STEP1 only one section visible");

 assert.equal(await flowPage.locator("#dongaSide1 .donga-stepbtn").count(),7,label+" STEP 1 sidebar 7");
 await flowPage.locator("#dongaSide1 .donga-stepbtn").nth(2).click();
 assert.equal(await flowPage.locator("#step3").evaluate(x=>x.open),true,label+" STEP1 accordion opens");
 await flowPage.goto(url.replace(/step3\/?$/,"step2/"),{waitUntil:"domcontentloaded"});
 const font2=await flowPage.evaluate(()=>getComputedStyle(document.body).fontFamily);
 const headerWeight2=await flowPage.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontWeight);
 const nav2=await flowPage.locator("#stepNav .stepText").first().evaluate(el=>getComputedStyle(el).fontSize);
 const subtitle2=await flowPage.locator("#stepNav .stepText small").first().evaluate(el=>getComputedStyle(el).fontSize);
 const section2=await flowPage.locator("#stepRoot .stepCard .sectionHead h2").evaluate(el=>getComputedStyle(el).fontSize);
 const hero2=await flowPage.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontSize);
 assert.equal(await flowPage.locator(".main > .progressCard").count(),0,label+" STEP2 top progress moved away");
 assert.equal(await flowPage.locator(".side .donga-step2-progress").isVisible(),true,label+" STEP2 progress in sidebar");
 assert.equal(await flowPage.locator(".stepCard .sectionHead .kicker").first().innerText(),"01",label+" STEP2 compact 01 title");
 assert.equal(nav2,nav1,label+" STEP2 sidebar title font matches STEP1");
 assert.equal(subtitle2,subtitle1,label+" STEP2 sidebar subtitle font matches STEP1");
 assert.equal(section2,section1,label+" STEP2 section title size matches STEP1");
 assert.equal(hero2,hero1,label+" STEP2 hero title size matches STEP1");
 if(label==="Desktop Chrome"){
   const snap=await flowPage.locator(".stepCard .sectionHead").screenshot({type:"jpeg",quality:45});
   console.log("DONGA_STEP2_HEADER_VISUAL_START:"+snap.toString("base64")+":DONGA_STEP2_HEADER_VISUAL_END");
 }

 assert.equal(font2,font1,label+" identical UI font STEP1/2");
 assert.equal(headerWeight2,headerWeight1,label+" identical title weight STEP1/2");

 assert.equal(await flowPage.locator("#stepNav .stepBtn").count(),4,label+" STEP2 sidebar 4");
 assert.equal(await flowPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),true,label+" STEP2 no horizontal overflow");

 await page.emulateMedia({media:"screen"});
 const font3=await page.evaluate(()=>getComputedStyle(document.body).fontFamily);
 const nav3=await page.locator("#dongaStep3Nav .donga-steplabel b").first().evaluate(el=>getComputedStyle(el).fontSize);
 const subtitle3=await page.locator("#dongaStep3Nav .donga-steplabel small").first().evaluate(el=>getComputedStyle(el).fontSize);
 const section3=await page.locator("#dongaPanel5 .sectionHead h2").first().evaluate(el=>getComputedStyle(el).fontSize);
 const hero3=await page.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontSize);
 assert.equal(nav3,nav1,label+" STEP3 sidebar title font matches STEP1");
 assert.equal(subtitle3,subtitle1,label+" STEP3 sidebar subtitle font matches STEP1");
 assert.equal(section3,section1,label+" STEP3 section heading matches STEP1");
 assert.equal(hero3,hero1,label+" STEP3 hero title size matches STEP1");

 const headerWeight3=await page.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontWeight);
 assert.equal(font3,font1,label+" identical UI font STEP1/3");
 assert.equal(headerWeight3,headerWeight1,label+" identical title weight STEP1/3");
 await flowPage.close();

 const fallbackContext=await browser.newContext({...(device||{})});
 const fallback=await fallbackContext.newPage();
 await fallback.goto(url,{waitUntil:"domcontentloaded"});
 assert.match(await fallback.locator("#starting1").innerText(),/미입력/,label+" missing STEP1 data is not invented");
 await fallback.locator("#dongaStep3Nav .donga-stepbtn").nth(1).click();
 await fallback.locator("#job").fill("품질관리");
 await fallback.locator("#preUnknown").check();
 await fallback.locator("#postUnknown").check();
 await fallback.locator("#build").click();
 assert.equal(await fallback.locator("#dongaPanel3").isVisible(),true,label+" after build navigates to career plan");
 const fallbackData=await fallback.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(fallbackData.right[0].label,"5년 차",label+" fallback 5y heading");
 assert.match(fallbackData.right[0].one,/품질개선 실무/,label+" 5y fallback not entry level");
 assert.equal(fallbackData.right[0].origin,"cdp",label+" fallback explicitly marked");
 assert.equal(fallbackData.question.post,"",label+" original student input preserved");
 await fallbackContext.close();
 assert.deepEqual(errors,[],label+" errors");
 await context.close();await browser.close();console.log("PASS",label);
}

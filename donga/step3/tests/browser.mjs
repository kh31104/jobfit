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

 // G/FORE response supplied as one paragraph: four distinct tasks and three GAPs.
 const priorStep2=await page.evaluate(()=>localStorage.getItem("jobfit:donga:step2:v1"));
 await page.evaluate(()=>{
   const key="jobfit:donga:step2:v1",x=JSON.parse(localStorage.getItem(key));
   x.target.industry="패션·의류 / 패션 브랜드·온라인 유통";
   x.target.job="브랜드 마케팅 / SNS 콘텐츠 마케팅";
   x.jobTable={tasks:"[공고근거] 브랜드 운영: 마케팅팀 사무 업무와 브랜드 촬영을 보조한다. [공고근거] SNS 마케팅: 공식 SNS 콘텐츠를 기획·제작하고 한국·중국·일본 채널 운영을 지원한다. [공고근거] 인플루언서 마케팅: 실행을 지원하고 명단을 관리한다. [공고근거] 외부 협업·협찬: 외부 파트너와 소통하고 제품 발송을 관리한다.&#x20;"};
   x.fit={gaps:"1. 필수 학력조건 미충족 — 현재 2학년으로 졸업 또는 졸업예정자 자격을 갖추지 못함. GAP 2: SNS 콘텐츠 제작 근거 부족 — 제작 결과물이 없음. GAP 3: 마케팅 운영 경험 근거 부족 — 인플루언서 협업 경험 확인 필요. [6. 우선순위] 1순위: 학력조건 [7. 3개월 보완 행동] GAP 1 → 확인표 작성."};
   localStorage.setItem(key,JSON.stringify(x));
 });
 const sourceBefore=await page.evaluate(()=>localStorage.getItem("jobfit:donga:step2:v1"));
 await page.reload({waitUntil:"domcontentloaded"});
 const work=page.locator("#starting2 .startingTaskList .startingEntry");
 const gap=page.locator("#starting2 .startingGapList .startingEntry");
 assert.equal(await work.count(),4,label+" four task cards");
 assert.equal(await page.locator("#starting2 .startingFormatStamp").innerText(),"직무분석·GAP 항목별 보기",label+" latest card format has loaded");
 assert.equal(await page.locator("#starting2 .startingTaskList .startingEntryHeading").count(),4,label+" four duty headings in separate cards");
 assert.equal(await page.locator("#starting2 .startingGapList .startingEntryHeading").count(),3,label+" three GAP headings in separate cards");
 assert.match(await page.locator("#starting2 .startingTaskList .startingEntryHeading").nth(0).innerText(),/브랜드 운영/,label+" category title extracted");
 assert.equal(await gap.count(),3,label+" GAP 1-3 individual cards");
 assert.match(await work.nth(1).innerText(),/SNS 마케팅/,label+" task detail retained");
 assert.match(await gap.nth(2).innerText(),/마케팅 운영 경험/,label+" GAP detail retained");
 assert.match(await page.locator("#starting2 .startingSummaryGrid").innerText(),/패션·의류/,label+" industry retained");
 const visible=await page.locator("#starting2").innerText();
 assert(!visible.includes("[6. 우선순위]")&&!visible.includes("3개월 보완 행동"),label+" unrelated priority/actions suppressed from summary");
 assert(!visible.includes("&#x20;"),label+" escaped space artifact removed");
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:donga:step2:v1")),sourceBefore,label+" STEP2 source unchanged by rendering");
 assert.equal(await page.locator("#starting2").evaluate(el=>el.scrollWidth<=el.clientWidth+3),true,label+" no summary horizontal overflow");
 await page.evaluate(value=>localStorage.setItem("jobfit:donga:step2:v1",value),priorStep2);
 await page.reload({waitUntil:"domcontentloaded"});
 assert.match(await page.locator("#starting2").innerText(),/품질관리/,label+" original JD restored");

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
 assert.equal(await page.locator("#dongaPanel3 .buttons a[href*=\"chatgpt.com\"]").count(),1,label+" STEP3 ChatGPT in prep");
 assert.equal(await page.locator("#dongaPanel3 .buttons a[href*=\"gemini.google.com\"]").count(),1,label+" STEP3 Gemini in prep");
 assert.equal(await page.locator("#dongaPanel3 .buttons a[href*=\"claude.ai\"]").count(),1,label+" STEP3 Claude in prep");
 await page.locator("#makeAiPrompt").click();
 const prePrompt=await page.locator("#aiPrompt").inputValue();
 assert.match(prePrompt,/희망 직무: 품질관리/,label+" career plan job");
 assert.match(prePrompt,/희망 취업 시점: 6개월 이내/,label+" career plan date");
 assert.match(prePrompt,/보완할 GAP/,label+" career plan GAP");
 assert.match(prePrompt,/"before"/,label+" plan response schema");

 assert.match(prePrompt,/탐색기/,"new before prompt uses readable stage names");
 assert.match(prePrompt,/기간:.*준비 기간/,"new before prompt asks for period and actions");
 assert(!prePrompt.includes('JSON 형식: {"before"'),"new before prompt does not request JSON output");
 const natural=[
   "탐색기","기간: 0~3개월","목표: SNS 콘텐츠 제작 기초 익히기",
   "실행: 가상 SNS 콘텐츠 3개·숏폼 1개 만들기","결과물: 콘텐츠 4개 포트폴리오",
   "","성장기","기간: 4~18개월","목표: AI 콘텐츠 실습과 협찬 업무 이해",
   "실행: 가상 릴스 제작과 인플루언서 목록 정리","결과물: 콘텐츠 분석표와 협찬 관리표",
   "","도약기","기간: 19개월~취업 전","목표: 취업 지원에 필요한 자료 정리",
   "실행: 어학·지원자격 확인 및 포트폴리오 보완","결과물: 최종 포트폴리오와 지원자격 확인표"
 ].join("\n");
 const previousLeft=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")).left);
 await page.locator("#aiAnswer").fill(natural);
 assert.equal(await page.locator("#beforeAiPreview .beforeAiCard").count(),3,"plain-text AI reply shows readable three-stage preview");
 assert.match(await page.locator("#beforeAiPreview").innerText(),/가상 SNS 콘텐츠 3개/,"preview contains concrete student action");
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")).left),previousLeft,"paste does not replace existing plans");
 page.once("dialog",d=>d.accept());
 await page.locator("#applyAi").click();
 const naturalSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")));
 assert.equal(naturalSaved.left[0].one,"0~3개월 · SNS 콘텐츠 제작 기초 익히기","duration and goal recorded");
 assert.equal(naturalSaved.left[1].two,"가상 릴스 제작과 인플루언서 목록 정리 → 콘텐츠 분석표와 협찬 관리표","action/result preserved");
 assert.equal(naturalSaved.drafts.aiAnswer,natural,"plain-language source saved verbatim");
 assert.equal(naturalSaved.right.length,4,"after-work stages unchanged");
 await page.locator("#aiAnswer").fill("탐색기\n목표: 준비");
 assert.match(await page.locator("#beforeAiPreview").innerText(),/형식 확인 필요/,"invalid paste displays actionable error");
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step3:v1")))).left[0].one,naturalSaved.left[0].one,"invalid edit does not replace plans");

 await page.locator("#aiAnswer").fill(JSON.stringify({before}));
 page.once("dialog",d=>d.accept());
 await page.locator("#applyAi").click();
 await go(4);
 assert.equal(await page.locator("#dongaPanel4 .buttons a[href*=\"gemini.google.com\"]").count(),1,label+" STEP3 Gemini in career");
 assert.equal(await page.locator("#dongaPanel4 .buttons a[href*=\"claude.ai\"]").count(),1,label+" STEP3 Claude in career");
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
 assert.equal(await page.locator(".artCard .buttons a[href*=\"gemini.google.com\"]").count(),1,label+" STEP3 Gemini in illustration");
 assert.equal(await page.locator(".artCard .buttons a[href*=\"claude.ai\"]").count(),1,label+" STEP3 Claude in illustration");
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
 const uiStep1=await flowPage.evaluate(()=>{
   const cs=sel=>getComputedStyle(document.querySelector(sel));
   return {tagVisible:cs("#step1 .tag").display,plusVisible:cs("#step1 .plus").display,
    progressVisible:cs("#dongaSide1 .donga-nav-status").display,
    buttonHeight:cs(".donga-main .btn").minHeight,buttonFont:cs(".donga-main .btn").fontSize,
    inputHeight:cs(".donga-main input:not([type=checkbox]):not([type=radio])").minHeight,
    inputFont:cs(".donga-main input:not([type=checkbox]):not([type=radio])").fontSize,
    cardRadius:cs(".donga-main .card").borderRadius};
 });
 assert.equal(uiStep1.tagVisible,"none",label+" STEP1 status badge hidden");
 assert.equal(uiStep1.plusVisible,"none",label+" STEP1 redundant plus hidden");
 assert.equal(uiStep1.progressVisible,"none",label+" STEP1 progress widget hidden");
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
 const uiStep2=await flowPage.evaluate(()=>{
   const cs=sel=>getComputedStyle(document.querySelector(sel));
   return {progressVisible:cs(".donga-step2-progress").display,
    badgeVisible:cs(".stepCard .sectionHead > .badge").display,
    buttonHeight:cs(".stepCard .btn").minHeight,buttonFont:cs(".stepCard .btn").fontSize,
    inputHeight:cs(".stepCard .input").minHeight,inputFont:cs(".stepCard .input").fontSize,
    cardRadius:cs(".stepCard").borderRadius};
 });
 assert.equal(uiStep2.progressVisible,"none",label+" STEP2 redundant progress card hidden");
 assert.equal(uiStep2.badgeVisible,"none",label+" STEP2 redundant practice badge hidden");
 assert.equal(uiStep2.buttonHeight,uiStep1.buttonHeight,label+" STEP1/2 button sizes");
 assert.equal(uiStep2.buttonFont,uiStep1.buttonFont,label+" STEP1/2 button fonts");
 assert.equal(uiStep2.inputHeight,uiStep1.inputHeight,label+" STEP1/2 input heights");
 assert.equal(uiStep2.inputFont,uiStep1.inputFont,label+" STEP1/2 input fonts");
 assert.equal(uiStep2.cardRadius,uiStep1.cardRadius,label+" STEP1/2 cards");
 const font2=await flowPage.evaluate(()=>getComputedStyle(document.body).fontFamily);
 const headerWeight2=await flowPage.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontWeight);
 const nav2=await flowPage.locator("#stepNav .stepText").first().evaluate(el=>getComputedStyle(el).fontSize);
 const subtitle2=await flowPage.locator("#stepNav .stepText small").first().evaluate(el=>getComputedStyle(el).fontSize);
 const section2=await flowPage.locator("#stepRoot .stepCard .sectionHead h2").evaluate(el=>getComputedStyle(el).fontSize);
 const hero2=await flowPage.locator(".hero h1").evaluate(el=>getComputedStyle(el).fontSize);
 assert.equal(await flowPage.locator(".main > .progressCard").count(),0,label+" STEP2 top progress moved away");
 assert.equal(await flowPage.locator(".side .donga-step2-progress").isVisible(),false,label+" STEP2 progress box hidden");
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
 const uiStep3=await page.evaluate(()=>{
   const cs=sel=>getComputedStyle(document.querySelector(sel));
   return {buttonHeight:cs(".donga-screen .btn").minHeight,buttonFont:cs(".donga-screen .btn").fontSize,
    inputHeight:cs("#job").minHeight,inputFont:cs("#job").fontSize,
    cardRadius:cs(".donga-screen .card").borderRadius};
 });
 assert.equal(uiStep3.buttonHeight,uiStep1.buttonHeight,label+" STEP1/3 button sizes");
 assert.equal(uiStep3.buttonFont,uiStep1.buttonFont,label+" STEP1/3 button fonts");
 assert.equal(uiStep3.inputHeight,uiStep1.inputHeight,label+" STEP1/3 input heights");
 assert.equal(uiStep3.inputFont,uiStep1.inputFont,label+" STEP1/3 input fonts");
 assert.equal(uiStep3.cardRadius,uiStep1.cardRadius,label+" STEP1/3 cards");
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

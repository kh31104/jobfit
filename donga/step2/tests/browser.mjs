import { chromium, webkit, devices } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const url = process.env.JOBFIT_STEP2_URL || "http://127.0.0.1:8765/donga/step2/";
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({acceptDownloads:true});
page.on("dialog", async d=>d.accept());
try{
  await page.goto(url,{waitUntil:"networkidle"});
  assert.equal(await page.locator("#stepNav .stepBtn").count(),4,"only 4 selected FLEX modules");
  const labels=await page.locator("#stepNav .stepText").allTextContents();
  assert.deepEqual(labels.map(s=>s.split(/\s+/)[0]),["Target","Find","Choose","GAP"]);
  assert(!labels.join(" ").includes("Portfolio") && !labels.join(" ").includes("My Evidence"),"excluded steps absent");
  await page.evaluate(()=>{
    localStorage.setItem("jobfit:donga:step1:v1","step1-safe");
    localStorage.setItem("jobfit:flexlab:job-analysis:v1","flex-safe");
  });
  await page.locator('[data-path="target.industry"]').fill("제조업");
  await page.locator('[data-path="target.job"]').fill("품질관리");
  await page.locator('[data-path="student.major"]').fill("산업공학");
  await page.locator('[data-next="2"]').click();
  assert.equal(await page.locator("#copySearchPromptBtn").count(),1,"Find JD prompt copy button");
  const aiFind=page.locator("#copySearchPromptBtn").locator("xpath=..");
  assert.equal(await aiFind.locator("[data-ai-provider]").count(),3,"Find JD offers ChatGPT, Gemini and Claude");
  for(const [name,domain] of [["ChatGPT","chatgpt.com"],["Gemini","gemini.google.com"],["Claude","claude.ai"]]){
    assert.match(await aiFind.locator('[data-ai-provider="'+name+'"]').getAttribute("href"),new RegExp(domain),"correct "+name+" URL");
  }

  assert.equal(await page.locator('[data-use-search-index]').count(),3,"STEP2 supports 3 independent search results");
  assert.match((await page.locator("a.jobSite").allTextContents()).join(" "),/링커리어/,"Linkareer search site displayed");
  assert.equal(await page.locator('a.jobSite').filter({hasText:"링커리어"}).getAttribute("href"),"https://linkareer.com/recruit-home");
  await page.locator('[data-path="step2Search.company"]').fill("테스트 제조");
  await page.locator('[data-path="step2Search.title"]').fill("품질관리 신입");
  await page.locator('[data-path="step2Search.facts"]').fill("품질 데이터 집계\n불량 원인 분석");
  for(const [i,company] of [[0,"테스트 제조 B"],[1,"테스트 제조 C"]]){
    const el=page.locator('[data-path="step2SearchMore.'+i+'.company"]');
    if(!(await el.isVisible()))await el.locator("xpath=ancestor::details[1]/summary").click();
    await el.fill(company);
    await page.locator('[data-path="step2SearchMore.'+i+'.title"]').fill("품질관리 채용 공고 "+(i+2));
    await page.locator('[data-path="step2SearchMore.'+i+'.sourceUrl"]').fill("https://example.com/job/"+(i+2));
  }
  assert.equal(await page.locator('[data-use-search-index="0"]').innerText(),"이 공고로 03 직무분석하기");
  assert.match(await page.locator("#stepRoot").innerText(),/03에서는 수업용 예시로 한국에너지공단과 HD현대일렉트릭/);
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator('[data-path="step2Search.company"]').inputValue(),"테스트 제조","legacy first entry retained");
  assert.equal(await page.locator('[data-path="step2SearchMore.0.company"]').inputValue(),"테스트 제조 B","second entry autosaved");
  assert.equal(await page.locator('[data-path="step2SearchMore.1.company"]').inputValue(),"테스트 제조 C","third entry autosaved");
  await page.locator('[data-use-search-index="1"]').click();
  const selectedSearch=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")));
  assert.equal(selectedSearch.selectedSearchIndex,1,"chosen result index retained");
  assert.equal(selectedSearch.customJob.company,"테스트 제조 B","only second result transferred to analysis");
  assert.equal(selectedSearch.step2Search.company,"테스트 제조","original first result preserved");

  const analysisCopy=page.locator("#copyReviewedJobPromptBtn");
  if(await analysisCopy.count()){
    assert.equal(await analysisCopy.locator("xpath=..").locator("[data-ai-provider]").count(),3,"Job analysis prompt links");
  }

  assert.match(await page.locator("#stepRoot").innerText(),/3 Ways/);
  const jobCards=page.locator(".jobSummaryGrid .jobSummaryCard");
  assert.equal(await jobCards.count(),5,"completed job analysis shows five readable cards");
  assert.equal(await page.locator(".jobAnalysisPreview table").count(),0,"cramped five-column table removed");
  const jobTasks=page.locator('[data-path="jobTable.tasks"]');
  if(!(await jobTasks.isVisible()))await jobTasks.locator("xpath=ancestor::details[1]/summary").click();
  const multiline="품질 기록 확인 • 불량 원인 분석 • [추론] 공정 데이터 개선";
  await jobTasks.fill(multiline);
  const competency=page.locator('[data-path="jobTable.competencies"]');
  if(!(await competency.isVisible()))await competency.locator("xpath=ancestor::details[1]/summary").click();
  await competency.fill("Knowledge: 통계기초 • Skill: 엑셀 분석 • Behavior: 신중한 기록");
  assert.equal(await page.locator('.jobSummaryCard [data-preview="jobTable.tasks"] .readableItem').count(),3,"embedded bullet list split in final summary");
  assert.equal(await page.locator('.jobTableItem [data-preview="jobTable.competencies"] .readableItem').count(),3,"live bullet view synchronized");
  assert.equal(await jobTasks.inputValue(),multiline,"original typed text not overwritten");
  await page.locator('[data-next="4"]').click();
  assert.match(await page.locator("#stepRoot h2").innerText(),/GAP/);
  assert(await page.locator('[data-path="student.majorEvidence"]').isVisible(),"standalone evidence input");
  await page.locator('[data-path="student.certificates"]').fill("품질경영기사 준비 중");
  await page.locator('[data-path="student.majorEvidence"]').fill("통계 수업에서 불량률 데이터 분석");
  const aiGap=page.locator('[data-path="ai.gapResult"]');
  await aiGap.fill("[5. 현재 GAP · 최대 3개]\n• GAP 1: 공정 데이터 분석 경험 부족\n• GAP 2: 개선 사례 부족\n[7. 3개월 보완 행동]\n• 불량률 보고서 작성\n• 개선안 비교표 작성");
  assert.equal(await page.locator('[data-preview="ai.gapResult"] .readableItem').count(),4,"GAP result split into four bullets");
  assert.equal(await page.locator('[data-preview="ai.gapResult"] .readableHeading').count(),2,"GAP headings separated");
  await page.locator('[data-path="fit.gaps"]').fill("품질 실무 데이터 분석 근거 보완");
  assert.equal(await page.locator('[data-preview="fit.gaps"] .readableItem').count(),1,"live GAP preview reflects edits");
  await page.locator('[data-path="fit.actions"]').fill("3개월 내 공정 데이터 분석 사례 1개 작성");
  let saved=await page.evaluate(()=>{
    const x=JSON.parse(localStorage.getItem("jobfit:donga:step2:v1"));
    return {x,step1:localStorage.getItem("jobfit:donga:step1:v1"),flex:localStorage.getItem("jobfit:flexlab:job-analysis:v1")};
  });
  assert.equal(saved.x.app,"JOBFIT_DONGA_STEP2");
  assert.equal(saved.x.currentStep,4);
  assert.equal(saved.x.fit.gaps,"품질 실무 데이터 분석 근거 보완");
  assert.equal(saved.x.jobTable.tasks,multiline,"saved raw job analysis remains unchanged");
  assert.match(saved.x.ai.gapResult,/GAP 1:/,"saved raw GAP result remains unchanged");
  assert.equal(saved.step1,"step1-safe");
  assert.equal(saved.flex,"flex-safe");
  const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#exportJsonBtn").click()]);
  const backup=JSON.parse(await fs.readFile(await download.path(),"utf8"));
  assert.equal(backup.app,"JOBFIT_DONGA_STEP2");
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator('[data-path="fit.gaps"]').inputValue(),"품질 실무 데이터 분석 근거 보완");
  await page.evaluate(()=>localStorage.removeItem("jobfit:donga:step2:v1"));
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator('[data-path="target.job"]').inputValue(),"");
  await page.locator("#importFile").setInputFiles({name:"donga-step2-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});
  await page.locator('[data-step="4"]').click();
  assert.equal(await page.locator('[data-path="fit.gaps"]').inputValue(),"품질 실무 데이터 분석 근거 보완");
  assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:donga:step1:v1")),"step1-safe");
  assert.equal(await page.evaluate(()=>localStorage.getItem("jobfit:flexlab:job-analysis:v1")),"flex-safe");

  for(const [deviceName,type,profile] of [
    ["Android Chrome",chromium,devices["Pixel 7"]],
    ["iPhone Safari",webkit,devices["iPhone 13"]]
  ]){
    const mobileBrowser=await type.launch({headless:true});
    try{
      const mobilePage=await mobileBrowser.newPage(profile);
      await mobilePage.goto(url,{waitUntil:"domcontentloaded"});
      await mobilePage.evaluate(saved=>localStorage.setItem("jobfit:donga:step2:v1",JSON.stringify(saved)),backup);
      await mobilePage.reload({waitUntil:"domcontentloaded"});
      await mobilePage.locator('[data-step="3"]').click();
      assert.equal(await mobilePage.locator(".jobSummaryCard").count(),5,deviceName+" job analysis cards");
      assert.equal(await mobilePage.locator('.jobSummaryCard [data-preview="jobTable.tasks"] .readableItem').count(),3,deviceName+" multiline bullet display");
      assert.equal(await mobilePage.locator(".jobSummaryGrid").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length),1,deviceName+" stacked one-column cards");
      await mobilePage.locator('[data-step="4"]').click();
      assert.equal(await mobilePage.locator('[data-preview="ai.gapResult"] .readableHeading').count(),2,deviceName+" GAP headings");
      assert.equal(await mobilePage.locator('[data-preview="ai.gapResult"] .readableItem').count(),4,deviceName+" GAP bullet list");
      assert.equal(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+4),true,deviceName+" no horizontal overflow");
    }finally{await mobileBrowser.close()}
  }
  console.log("DONG-A STEP 2: 4 modules, progression, student input, GAP, autosave, reload, JSON backup/restore and isolation PASS");
}finally{await browser.close();}

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
    if(i===0)await page.locator('[data-path="step2SearchMore.0.facts"]').fill("품질관리 공정 데이터 확인 및 불량 원인 분석");
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
  assert.equal(await page.locator(".jobTableCards .jobTableItem").count(),5,"only five editable job analysis areas displayed");
  assert.equal((await page.locator("#stepRoot").innerText()).includes("⑤ 완성된 직무분석표"),false,"duplicate result section removed");
  assert.equal(await page.locator(".jobSummaryGrid").count(),0,"duplicate job summary grid removed");

  const sampleAnalysis=[
    "### 1. 고객(KPI):",
    "• [추론] 현장 품질관리 담당자 / 데이터 집계의 정확성",
    "**2. 주요 과업:**",
    "• [공고근거] 품질 데이터를 집계한다",
    "[3. 주요 해결과제]",
    "• [추론] 불량 원인 분석 기준을 확인한다",
    "4) 해결방법:",
    "• [추론] 불량 기록 검토 후 원인별로 분류한다",
    "필요역량:",
    "• [추론] Knowledge: 품질 기초",
    "• [추론] Skill: 자료 정리",
    "• [추론] Behavior: 기록 정확성",
    "[추가 확인 질문]",
    "• 품질 성과지표는 무엇인지 확인할까요?"
  ].join("\n");
  await page.locator("#jobTableAiResult").fill(sampleAnalysis);
  await page.locator("#applyJobTableAiBtn").click();
  const fromAI=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")).jobTable);
  for(const key of ["customerKpi","tasks","challenge","method","competencies"]){
    assert(fromAI[key]?.length>0,"AI paste populates field "+key);
  }
  assert(!fromAI.competencies.includes("확인할까요"),"follow-up questions are not merged into competencies");
  assert.match(await page.locator("#stepRoot").innerText(),/필수 5개 항목 중 5개 입력/);
  // 실제 G/FORE 답변처럼 '건수. 주요 과업:'과 '관리한다. 해결방법:'이 한 줄에 붙는 사례.
  const pastedFromAI=[
    "고객(KPI):",
    "[공고근거] 내부 이해관계자: G/FORE 마케팅팀 및 브랜드 운영 담당자.",
    "[공고근거] 외부 이해관계자: 인플루언서, 마케팅 대행사 및 외부 파트너.",
    "[추론] 콘텐츠 대상 고객: 한국·중국·일본 공식 SNS 채널 이용자.",
    "[추론] KPI: 콘텐츠 제작 일정 준수율, 인플루언서 명단 정확도, 협찬 제품 발송 오류 건수. 주요 과업:",
    "[공고근거] 브랜드 운영: 마케팅팀 사무 업무와 브랜드 촬영을 보조한다.",
    "[공고근거] SNS 마케팅: 공식 SNS 콘텐츠를 기획·제작하고 한국·중국·일본 채널 운영을 지원한다.",
    "[공고근거] 인플루언서 마케팅: 마케팅 실행을 지원하고 인플루언서 명단을 관리한다.",
    "[공고근거] 외부 협업·협찬: 대행사 및 외부 파트너와 소통하고 협찬 제품 발송을 관리한다.",
    "[image](https://www.google.com/s2/favicons?domain=https://linkareer.com&sz=32)",
    "공모전 대외활동-링커리어",
    "주요 해결과제:",
    "[추론] 브랜드 운영: 촬영 및 사무 지원 과정에서 업무 누락과 일정 지연을 방지해야 한다.",
    "[추론] SNS 콘텐츠: 국가별 채널 특성에 맞는 콘텐츠를 기획하고 제작 품질을 관리해야 한다.",
    "[추론] 인플루언서 마케팅: 협업 대상자 정보와 진행 현황의 오류를 줄여야 한다.",
    "[추론] 외부 협업·협찬: 파트너 간 요청사항의 혼선을 줄이고 제품 발송 오류를 방지해야 한다. 해결방법:",
    "[추론] 브랜드 운영: 촬영 일정·요청사항 확인 → 체크리스트 관리 → 업무 완료 여부 보고.",
    "[추론] SNS 콘텐츠: 국가별 채널 특성 확인 → 콘텐츠 기획안·제작 도구 활용 → 제작물 검토.",
    "[추론] 인플루언서 마케팅: 협업 대상 정보 확인 → 명단·진행 현황표 관리 → 누락 사항 점검.",
    "[추론] 외부 협업·협찬: 요청사항·수령 정보 확인 → 발송 관리표 작성 → 배송 완료 여부 확인. 필요역량:",
    "Knowledge [추론]: 패션·골프 브랜드 및 국가별 SNS 특성 이해 — 콘텐츠 기획·채널 운영 지원에 연결.",
    "Skill [공고근거·우대]: Photoshop·Illustrator 및 숏폼 영상 제작 능력 — SNS 콘텐츠 제작에 연결.",
    "Skill [공고근거·우대]: AI 도구 활용 및 영어·중국어·일본어 능력 — 콘텐츠 작업과 해외 SNS 운영 보조에 연결.",
    "Behavior [공고근거·우대]: 꼼꼼한 업무 처리 — 인플루언서 명단과 협찬 제품 발송 관리에 연결. [추가 확인 질문]",
    "[확인 필요] SNS 콘텐츠는 인턴이 직접 게시하나요?",
    "[확인 필요] 별도로 정해진 KPI가 있나요?"
  ].join("\n");
  const aiPasteAgain=page.locator("#jobTableAiResult");
  if(!(await aiPasteAgain.isVisible()))await aiPasteAgain.locator("xpath=ancestor::details[1]/summary").click();
  await aiPasteAgain.fill(pastedFromAI);
  await page.locator("#applyJobTableAiBtn").click();
  const realResponse=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")).jobTable);
  assert.equal(realResponse.aiResult,pastedFromAI,"the pasted original response stays byte-for-byte identical");
  for(const key of ["customerKpi","tasks","challenge","method","competencies"]){
    assert(realResponse[key]?.trim(),"real pasted response fills field "+key);
  }
  assert(realResponse.customerKpi.includes("협찬 제품 발송 오류 건수"),"KPI section preserved");
  assert(!realResponse.customerKpi.includes("주요 과업:"),"inline tasks heading separated from KPI");
  assert(realResponse.tasks.includes("공식 SNS 콘텐츠"),"task section extracted correctly");
  assert(!realResponse.tasks.includes("google.com"),"favicon metadata excluded from tasks");
  assert(!realResponse.tasks.includes("링커리어"),"site label excluded from tasks");
  assert(realResponse.challenge.includes("업무 누락과 일정 지연"),"challenge extracted");
  assert(!realResponse.challenge.includes("해결방법:"),"inline methods heading separated");
  assert(realResponse.method.includes("체크리스트 관리"),"method extracted");
  assert(!realResponse.method.includes("필요역량:"),"inline competencies heading separated");
  assert(realResponse.competencies.includes("Behavior"),"competency data extracted");
  assert(!realResponse.competencies.includes("추가 확인 질문"),"follow-up marker excluded");
  assert(!realResponse.competencies.includes("별도로 정해진 KPI"),"follow-up content excluded");
  assert.match(await page.locator("#stepRoot").innerText(),/필수 5개 항목 중 5개 입력/);
  // 재반영해도 동일 결과로, 예전의 잘못된 분배를 덮어 고친다.
  await page.locator("#applyJobTableAiBtn").click();
  const reapply=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")).jobTable);
  for(const key of ["customerKpi","tasks","challenge","method","competencies"]){
    assert.equal(reapply[key],realResponse[key],"re-apply remains deterministic for "+key);
  }
  assert.equal(await page.locator(".jobAnalysisPreview table").count(),0,"cramped table not used");
  const jobTasks=page.locator('[data-path="jobTable.tasks"]');
  if(!(await jobTasks.isVisible()))await jobTasks.locator("xpath=ancestor::details[1]/summary").click();
  const multiline="품질 기록 확인 • 불량 원인 분석 • [추론] 공정 데이터 개선";
  await jobTasks.fill(multiline);
  const competency=page.locator('[data-path="jobTable.competencies"]');
  if(!(await competency.isVisible()))await competency.locator("xpath=ancestor::details[1]/summary").click();
  await competency.fill("Knowledge: 통계기초 • Skill: 엑셀 분석 • Behavior: 신중한 기록");
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

  // 학생 예시: 학력 조건에 자격증을 끼워 넣지 않고, 도구/어학/수행근거를 요구조건별로 비교한다.
  await page.evaluate(()=>{
    const key="jobfit:donga:step2:v1";
    const x=JSON.parse(localStorage.getItem(key));
    x.currentStep=4;
    x.student.major="경영학과 2학년";
    x.student.certificates="컴퓨터활용능력 2급";
    x.student.language="토익 620";
    x.student.tools="Photoshop, Canva";
    x.student.majorEvidence="교내 홍보단 SNS 운영 활동에 참여하고 콘텐츠 기획부터 결과 분석까지 포트폴리오 작성";
    x.requirements=[
      {condition:"필수 지원자격: 4년제 대학 졸업 또는 졸업예정자",status:"현재 GAP",note:"자동 불러오기 · 전공: 경영학과 2학년 / 자격증: 컴퓨터활용능력 2급"},
      {condition:"우대사항: Photoshop, Illustrator, 영어·중국어·일본어 능숙자",status:"일부 준비",note:"자동 불러오기 · 어학: 토익 620"},
      {condition:"직무 필요역량: SNS 콘텐츠 기획과 Photoshop, AI 도구 사용",status:"충족",note:"내가 직접 확인한 SNS 프로젝트 자료"}
    ];
    localStorage.setItem(key,JSON.stringify(x));
  });
  await page.reload({waitUntil:"networkidle"});
  await page.locator('[data-path="student.tools"]').fill("Photoshop, Canva");
  const evidenceTest=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step2:v1")).requirements);
  const startEvidence=await evidenceTest();
  assert.equal(startEvidence[0].note,"","legacy auto evidence cleared when it cannot prove graduation");
  assert.equal(startEvidence[0].status,"현재 GAP","existing status preserved");
  assert(startEvidence[1].note.includes("Photoshop"),"Photoshop matched to required tool");
  assert(startEvidence[1].note.includes("토익 620"),"English test can be shown for English requirement");
  assert(!startEvidence[1].note.includes("Canva"),"unrequested Canva not mixed into Photoshop/Illustrator evidence");
  assert(!startEvidence[1].note.includes("컴퓨터활용능력"),"unrequested qualification not included");
  assert.equal(startEvidence[2].note,"내가 직접 확인한 SNS 프로젝트 자료","user's manual note preserved");
  assert.equal(startEvidence[2].status,"충족","manual classification remains unchanged");
  const emptyNote=await page.locator('[data-evidence-preview="0"]').innerText();
  assert.match(emptyNote,/직접 연결되는 입력 근거 없음/,"no match is clearly explained");
  assert.equal(await page.locator('[data-req="2"][data-reqkey="note"]').inputValue(),"내가 직접 확인한 SNS 프로젝트 자료","editor retains original manual note");
  await page.locator('[data-path="student.tools"]').fill("Canva");
  const refreshed=await evidenceTest();
  assert(!refreshed[1].note.includes("Photoshop"),"auto suggestion removes skill after student input changes");
  assert(refreshed[1].note.includes("토익 620"),"unrelated language evidence remains");
  assert.equal(refreshed[2].note,"내가 직접 확인한 SNS 프로젝트 자료","manual note still preserved after input change");
  // 외국어 종류도 같은 어학이라는 이유만으로 충족 근거로 연결하면 안 된다.
  await page.evaluate(()=>{
    const key="jobfit:donga:step2:v1",x=JSON.parse(localStorage.getItem(key));
    x.requirements[1].condition="우대사항: 중국어 HSK 또는 일본어 JLPT";
    x.requirements[1].note="자동 불러오기 · 어학: 토익 620";
    localStorage.setItem(key,JSON.stringify(x));
  });
  await page.reload({waitUntil:"networkidle"});
  await page.locator('[data-path="student.language"]').fill("토익 620");
  assert.equal((await evidenceTest())[1].note,"","TOEIC cannot satisfy Chinese/Japanese-only condition");
  assert.equal((await evidenceTest())[2].note,"내가 직접 확인한 SNS 프로젝트 자료","reload keeps direct note intact");

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
      assert.equal(await mobilePage.locator(".jobTableItem").count(),5,deviceName+" job analysis cards");
      assert.equal(await mobilePage.locator('.jobTableItem [data-preview="jobTable.tasks"] .readableItem').count(),3,deviceName+" multiline bullet display");
      assert.equal(await mobilePage.locator(".jobTableCards").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length),1,deviceName+" stacked one-column cards");
      await mobilePage.locator('[data-step="4"]').click();
      assert.equal(await mobilePage.locator('[data-preview="ai.gapResult"] .readableHeading').count(),2,deviceName+" GAP headings");
      assert.equal(await mobilePage.locator('[data-preview="ai.gapResult"] .readableItem').count(),4,deviceName+" GAP bullet list");
      assert.equal(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+4),true,deviceName+" no horizontal overflow");
    }finally{await mobileBrowser.close()}
  }
  console.log("DONG-A STEP 2: 4 modules, progression, student input, GAP, autosave, reload, JSON backup/restore and isolation PASS");
}finally{await browser.close();}

// INJE STEP 10 only. Do not write to prior steps or alter their saved artifacts.
function nonempty(...values){
  return values.find(value=>typeof value==="string"&&value.trim())?.trim()||"";
}
function clean(value,max=500){
  return String(value??"").trim().slice(0,max);
}
function targetFrom(state,data,posting){
  const resumeItems=state.artifacts?.resumeLab?.items||[];
  const coverItems=state.artifacts?.coverLetterLab?.questions||[];
  const resume=resumeItems.find(x=>x&&x.jobTitle)||{};
  const cover=coverItems.find(x=>x&&x.jobTitle)||{};
  return {
    job:nonempty(data.mockInterview?.targetJob,posting?.jobTitle,cover.jobTitle,resume.jobTitle,state.profile?.targetJob),
    company:nonempty(data.mockInterview?.company,posting?.company,cover.company,resume.company),
    mode:data.mockInterview?.mode==="12"?"12":"6",
    record:data.mockInterview?.record||""
  };
}
function html(value,ctx){return ctx.escapeHtml(String(value??""));}
export function injeMockInterviewSection({state,data,posting,ctx}){
  const initial=targetFrom(state,data,posting);
  return '<div class="hr"></div><div class="block injeMockInterview" id="injeMockInterview">'+
    '<h3>0. 내 AI로 실전 모의면접 하기</h3>'+
    '<p class="help">① 지원직무 확인 → ② 면접 프롬프트 복사 → ③ 내 AI 채팅창에 붙여넣어 답변하기. 지원기업이나 앞 STEP 기록이 없어도 연습할 수 있습니다.</p>'+
    '<div class="grid2">'+
      '<div class="field"><label for="mockInterviewTargetJob">지원직무 <span class="muted">(직접 수정 가능)</span></label>'+
      '<input id="mockInterviewTargetJob" type="text" maxlength="100" placeholder="예: 브랜드 마케팅 / 아직 미정이면 비워두세요" value="'+html(initial.job,ctx)+'"></div>'+
      '<div class="field"><label for="mockInterviewCompany">지원기업 <span class="muted">(선택)</span></label>'+
      '<input id="mockInterviewCompany" type="text" maxlength="100" placeholder="기업 미정이어도 시작할 수 있어요" value="'+html(initial.company,ctx)+'"></div></div>'+
    '<div class="field" style="margin-top:12px"><label for="mockInterviewMode">면접 문항 수</label>'+
      '<select id="mockInterviewMode"><option value="6"'+(initial.mode==="6"?" selected":"")+'>6문항 · 기본 연습</option><option value="12"'+(initial.mode==="12"?" selected":"")+'>12문항 · 심화 연습</option></select></div>'+
    '<div class="callout info" id="mockInterviewJobGuide" aria-live="polite">'+
      (initial.job?'<b>현재 지원직무: '+html(initial.job,ctx)+'</b><br>앞 단계에서 불러온 정보를 여기에서 수정해도 다른 STEP에는 영향을 주지 않습니다.':
        '<b>지원직무가 없어도 시작할 수 있어요.</b><br>AI가 관심 업무와 전공을 한 번에 하나씩 질문한 뒤 직무 후보를 제안합니다. 학생이 선택한 직무로 면접을 이어갑니다.')+
    '</div>'+
    '<div class="actions"><button type="button" class="btn primary" id="copyMockInterviewPrompt">① AI 실전면접 시작 · 프롬프트 복사</button>'+
    '<a class="btn secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">② AI 채팅창 열기</a></div>'+
    '<p class="help">복사한 프롬프트를 이용하는 AI에 직접 붙여넣으세요. JOBFIT이 학생 정보를 AI에 자동 전송하지는 않습니다. 음성 연습은 사용하는 AI 채팅의 음성 기능을 선택하세요.</p>'+
    '<details class="injeInterviewDetails" id="mockInterviewImportDetails"><summary>지원직무를 정하지 못했나요? · AI가 추천한 직무 가져오기 (선택)</summary>'+
    '<p class="help">AI와 대화해 직무를 선택했다면, AI 답변 중 ‘[선택 직무] 브랜드 마케팅’과 같은 줄을 아래에 붙여넣으세요. 지원직무 칸에 반영됩니다.</p>'+
    '<div class="field"><label for="mockInterviewAiResult">AI의 직무 추천 결과</label><textarea id="mockInterviewAiResult" rows="3" placeholder="[선택 직무] 브랜드 마케팅"></textarea></div>'+
    '<div class="actions"><button type="button" class="btn secondary" id="applyMockInterviewJob">선택한 지원직무 반영</button></div></details>'+
    '<details class="injeInterviewDetails" id="mockInterviewPreviewDetails"><summary>AI에 보낼 면접 프롬프트 확인하기 (선택)</summary>'+
    '<textarea id="mockInterviewPromptPreview" rows="12" readonly aria-label="AI 실전면접 프롬프트 미리보기"></textarea>'+
    '<div class="actions"><button type="button" class="btn secondary" id="refreshMockInterviewPrompt">현재 입력 반영</button></div></details>'+
    '<div class="field" style="margin-top:14px"><label for="mockInterviewRecord">면접 후 피드백·연습 기록 <span class="muted">(선택)</span></label>'+
    '<textarea id="mockInterviewRecord" rows="4" placeholder="AI 면접에서 반복 지적된 내용이나 다음 연습에서 고칠 점을 적거나 붙여넣으세요.">'+html(initial.record,ctx)+'</textarea></div>'+
    '<div class="actions"><button type="button" class="btn secondary" id="saveMockInterviewRecord">실전면접 설정·기록 저장</button></div>'+
    '<p class="help" id="mockInterviewMessage" role="status" aria-live="polite"></p>'+
    '</div>'+
    '<style>.injeMockInterview{max-width:100%;overflow-wrap:anywhere}.injeMockInterview input,.injeMockInterview select,.injeMockInterview textarea{max-width:100%;box-sizing:border-box}.injeMockInterview .injeInterviewDetails{margin-top:12px;padding:12px;border:1px solid #d8dfe9;border-radius:10px}.injeMockInterview .injeInterviewDetails summary{cursor:pointer;font-weight:600}.injeMockInterview .injeInterviewDetails textarea{width:100%;margin-top:10px}.injeMockInterview .actions{flex-wrap:wrap}.injeMockInterview .actions a.btn{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}@media(max-width:760px){.injeMockInterview .grid2{grid-template-columns:minmax(0,1fr)}.injeMockInterview .actions>*{max-width:100%}}</style>';
}
function contextForInterview(state,posting){
  const assets=(state.artifacts?.careerAssets?.assets||[]).filter(x=>x&&x.factCheck==="검증완료"&&x.sourceExperienceFactChecked!==false).slice(0,3)
    .map(x=>({experience:clean(x.experienceTitle,120),action:clean(x.proof,400),result:clean(x.fact,400),status:"학생 확인 완료"}));
  const exp=(state.assessments?.experienceCompetency?.experiences||[]).filter(x=>x&&(x.title||x.name)).slice(0,3)
    .map(x=>({experience:clean(x.title||x.name,120),action:clean(x.action,400),result:clean(x.result||x.evidence,400),status:x.factChecked?"학생 사실확인 표시":"추가 확인 필요"}));
  const resumes=(state.artifacts?.resumeLab?.items||[]).filter(x=>x&&(x.status==="final-ready"||(x.factChecked&&x.assetVerified))).slice(0,2)
    .map(x=>clean(x.finalBullet||x.aiBullet||x.rawBullet,550)).filter(Boolean);
  const covers=(state.artifacts?.coverLetterLab?.questions||[]).filter(x=>x&&(x.status==="final-ready"||(x.factChecked&&x.assetVerified&&x.requirementAligned))).slice(0,2)
    .map(x=>({question:clean(x.question,150),answer:clean(x.finalAnswer,550)}));
  const requirements=(posting?.requirements||[]).slice(0,5).map(x=>({
    task:clean(x.text||x.requirement||x.name,200),
    interviewQuestion:clean(x.evidenceQuestion,200)
  }));
  return {major:clean(state.profile?.major||state.assessments?.careerDNA?.major,100),
    experience:assets.length?assets:exp,
    experienceStatus:assets.length?"검증된 근거 우선":"학생 입력 기록 · 일부 확인 필요",
    resume:resumes,cover:covers,requirements};
}
export function buildInjeMockInterviewPrompt({state,posting,targetJob,company,mode}){
  const total=mode==="12"?12:6,job=clean(targetJob,100),org=clean(company,100);
  const context=contextForInterview(state,posting);
  const lines=[
    "너는 한국 대학생을 대상으로 실전 면접을 진행하는 직무 담당 면접관이다.",
    "모범답안을 대신 작성하지 말고 학생이 직접 말하게 해라. 없는 경험·수치·자격·성과를 만들지 마라.",
    "",
    "[지원 정보]",
    "지원직무: "+(job||"미정 · 먼저 질문으로 확인"),
    "지원기업: "+(org||"미정 · 특정 기업의 내부정보를 가정하지 않음"),
    "면접 모드: "+total+"문항",
    "",
    "[기존 기록 · 제공된 정보만 사용]",
    JSON.stringify(context,null,2),
    "",
    "[지원직무가 미정일 때]",
    "1. 면접을 바로 시작하지 말고 관심 업무·관심 산업·전공·해본 활동을 확인하는 질문을 한 번에 하나씩 최대 3개만 한다.",
    "2. 이미 제공된 정보는 다시 묻지 않는다. 전공만으로 직무를 임의로 확정하지 않는다.",
    "3. 후보 직무 2~3개와 주요 업무 차이를 짧게 설명하고 학생이 하나를 선택하도록 묻는다.",
    "4. 학생이 선택한 직무를 정확히 '[선택 직무] 직무명' 형식으로 한 줄에 출력한다. 기업이 미정이면 일반 직무 면접이라고 안내한다.",
    "5. 학생이 직무를 선택한 다음에만 아래 규칙으로 첫 면접질문을 한다. 답변이 없으면 선택을 기다린다.",
    "",
    "[실전 모의면접 진행 방식]",
    "기본 질문 "+total+"개. 꼬리질문은 기본 문항 수에 포함하지 않는다.",
    total===6
      ?"6문항: 직무 이해 / 직무지식·기술 / 경험·문제해결 / 협업 / 판단·상황 / 준비상태·GAP"
      :"12문항: 직무이해 / 직무지식 / 직무기술 / 실제 업무상황 / 전공 적용 / 경험 / 행동·판단 / 협업 / 갈등 / 성과·근거 / 직업공통능력 / 준비상태·GAP",
    "1. 처음부터 전체 예상질문을 나열하지 말고, [실전면접 Q1/"+total+"]로 첫 질문 하나만 제시한 뒤 답을 기다린다.",
    "2. 답변을 들은 뒤 질문에 답했는지, 직접 행동·판단 이유·결과 근거가 있는지 확인한다.",
    "3. 충분하면 바로 짧게 피드백한다. 부족할 때만 꼬리질문 한 번에 하나씩, 원 질문당 최대 3회 한다.",
    "4. 꼬리질문 표시는 [추가질문 1/3], [추가질문 2/3], [추가질문 3/3]으로 한다. 이미 답한 내용을 되묻지 않는다.",
    "5. 학생이 '모른다' 또는 '해본 적 없다'고 답해도 인정하고, 경험을 지어내게 유도하지 않는다.",
    "6. 매 질문을 마치면 [답변 피드백]으로 잘된 점, 보완할 점, 직무 연결, 다음 답변에서 고칠 행동을 각각 1~2개씩 알려준다.",
    "7. 피드백한 다음에야 다음 질문 한 개로 넘어간다. 질문 유형을 반복하지 않는다.",
    "8. 제공된 기록에 없는 내용은 사실처럼 단정하지 않는다. 공고 내용이 없으면 일반 직무지식으로만 질문한다.",
    "9. 제공된 자소서·이력서와 다른 답변이 나오면 실제 사실을 확인하게 한다. 검증되지 않은 경험은 확인 필요로 표시한다.",
    "10. 기본 "+total+"문항이 끝나면 [면접 종료 피드백]으로 잘된 점 2개, 보완할 점 2개, 가장 강한 답변 1개, 다음에 연습할 행동 2개를 제시한다.",
    "",
    "[첫 응답]",
    job?"설명이나 모범답안 없이 [실전면접 Q1/"+total+"]과 첫 질문 한 개만 제시해라.":
      "지원직무부터 확인하라. 질문 한 개만 하고 학생의 답변을 기다려라. 아직 면접 질문을 시작하지 마라."
  ];
  return lines.join("\n");
}
function parseChosenJob(answer){
  const lines=String(answer||"").split(/\r?\n/);
  let chosen="",company="";
  for(const line of lines){
    const jobMatch=line.match(/^\s*(?:\[(?:선택|최종|지원)\s*직무\]\s*|(?:선택|최종|지원)\s*직무\s*[:：]\s*)(.{1,100})\s*$/i);
    const companyMatch=line.match(/^\s*(?:\[선택\s*기업\]\s*|지원\s*기업\s*[:：]\s*)(.{1,100})\s*$/i);
    if(jobMatch)chosen=clean(jobMatch[1].replace(/^[:：\s]+/,""),100);
    if(companyMatch)company=clean(companyMatch[1].replace(/^[:：\s]+/,""),100);
  }
  if(/^(미정|없음|선택 필요|확인 필요|직무명|지원 직무)$/i.test(chosen))chosen="";
  return {job:chosen,company};
}
export function mountInjeMockInterview({root,state,data,posting,ctx,persist}){
  const parent=root.querySelector("#injeMockInterview");if(!parent)return;
  const at=id=>parent.querySelector("#"+id);
  const message=text=>{at("mockInterviewMessage").textContent=text;ctx.toast(text);};
  const current=()=>({targetJob:at("mockInterviewTargetJob").value.trim(),company:at("mockInterviewCompany").value.trim(),
    mode:at("mockInterviewMode").value==="12"?"12":"6",record:at("mockInterviewRecord").value});
  const save=()=>{data.mockInterview={...(data.mockInterview||{}),...current()};persist();};
  const refresh=()=>{
    const fields=current();
    at("mockInterviewPromptPreview").value=buildInjeMockInterviewPrompt({state,posting,...fields});
    at("mockInterviewJobGuide").innerHTML=fields.targetJob
      ?"<b>현재 지원직무: "+html(fields.targetJob,ctx)+"</b><br>이 수정은 STEP 10의 면접 기록에만 저장됩니다."
      :"<b>지원직무가 없어도 시작할 수 있어요.</b><br>AI가 관심 업무를 질문하고, 학생이 선택한 직무로 면접을 시작합니다.";
  };
  ["mockInterviewTargetJob","mockInterviewCompany","mockInterviewMode"].forEach(id=>{
    at(id).addEventListener("change",()=>{save();refresh();});
    at(id).addEventListener("input",refresh);
  });
  at("mockInterviewRecord").addEventListener("change",save);
  at("saveMockInterviewRecord").addEventListener("click",()=>{save();message("STEP 10의 모의면접 설정과 기록을 저장했습니다.");});
  at("refreshMockInterviewPrompt").addEventListener("click",()=>{save();refresh();message("현재 지원직무와 기존 기록을 반영했습니다.");});
  at("applyMockInterviewJob").addEventListener("click",()=>{
    const result=parseChosenJob(at("mockInterviewAiResult").value);
    if(!result.job){message("선택 직무를 찾지 못했습니다. AI 답변의 '[선택 직무] 브랜드 마케팅' 형식 한 줄을 붙여넣거나 지원직무를 직접 입력하세요.");return;}
    at("mockInterviewTargetJob").value=result.job;
    if(result.company)at("mockInterviewCompany").value=result.company;
    save();refresh();message("AI와 선택한 지원직무를 STEP 10에 반영했습니다.");
  });
  at("copyMockInterviewPrompt").addEventListener("click",async()=>{
    save();refresh();
    const value=at("mockInterviewPromptPreview").value;
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
      else {
        const el=at("mockInterviewPromptPreview");el.focus();el.select();
        if(!document.execCommand("copy"))throw new Error("copy failed");
      }
      message("면접 프롬프트를 복사했습니다. AI 채팅에 붙여넣으세요.");
    }catch{
      at("mockInterviewPreviewDetails").open=true;
      at("mockInterviewPromptPreview").focus();at("mockInterviewPromptPreview").select();
      message("자동 복사가 되지 않았습니다. 열린 프롬프트를 직접 복사해 주세요.");
    }
  });
  refresh();
}

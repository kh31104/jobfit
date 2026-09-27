const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";

const steps = [
  ["Target Job","직무 설정"],
  ["Find JD","실제 공고 찾기"],
  ["Choose JD","직무분석 테이블"],
  ["My Evidence","전공·경험 → 역량"],
  ["GAP Match","공고조건 × 내 스펙"],
  ["Portfolio","자소서·면접 연결"]
];

const emptyPosting=()=>({company:"",title:"",sourceUrl:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const emptyExperience=()=>({title:"",type:"",summary:""});
const emptyMatch=()=>({requirement:"",evidence:"",status:"",note:""});
const emptyJobTable=()=>({customerKpi:"",tasks:"",challenge:"",method:"",competencies:"",careerPlan:"",aiResult:""});
const emptyRequirements=()=>[0,1,2].map(()=>({condition:"",status:"",note:""}));
const emptyFit=()=>({assets:"",gaps:"",actions:""});
const emptyCustomJob=()=>({
  id:"custom",type:"직접 입력",company:"",title:"",role:"",period:"",sourceUrl:"",
  source:"학생 직접 입력",facts:"",required:"",preferred:"",
  note:"내가 찾은 기업·직무·공고 정보를 직접 입력해 분석합니다."
});
const emptyAnalysisCase=()=>({
  jobTable:emptyJobTable(),
  requirements:emptyRequirements(),
  fit:emptyFit(),
  keywordResult:"",
  gapResult:""
});

const CURATED_JOBS=[
  {
    id:"komipo-2026-3",
    type:"공기업",
    company:"한국중부발전",
    title:"2026년도 제3차 4직급 신입직원 · 기술직",
    role:"화학·전기전자·환경에너지안전 등",
    period:"2026.09.17 ~ 2026.10.02",
    sourceUrl:"https://job.alio.go.kr/mobile2021/recruit/recruitView.do?idx=304972",
    source:"잡알리오 · 한국중부발전",
    facts:"정규직 신입 · 기술직 포함 · 학력무관 · 대졸수준 일반전형 외국어 TOEIC 700점 이상(환산점수 인정) · 필기에서 직무지식 및 직무수행능력 평가 · PT/역량면접",
    required:"대졸수준 일반전형: 영어 TOEIC 700점 이상 또는 인정되는 환산점수\n공통 기본자격 및 회사가 정한 결격사유 확인 필요",
    preferred:"전문자격증·체험형/채용형 인턴 등은 공고 기준 우대 또는 가점 항목 확인",
    note:"세부 직무의 과업은 직무기술서와 본인이 선택한 직군을 함께 확인해야 합니다."
  },
  {
    id:"skenergy-2026-clx",
    type:"대기업",
    company:"SK에너지",
    title:"2026년 SK이노베이션 계열 울산CLX 기술직 인턴",
    role:"제조",
    period:"2026.09.15 ~ 2026.09.27",
    sourceUrl:"https://www.skcareers.com/Recruit/Detail/R261969",
    source:"SK Careers",
    facts:"SK energy · 제조 직무 · 울산 · 채용연계형 인턴",
    required:"공식 공고 상세 모집요강에서 지원자격을 직접 확인하세요.",
    preferred:"공식 공고 상세 모집요강에서 우대사항을 직접 확인하세요.",
    note:"공식 페이지에서 확인되는 채용 기본정보만 미리 제공합니다. 세부 과업·요건은 원문을 확인하거나 AI에게 원문 링크를 읽게 한 뒤 근거와 추론을 구분해 정리합니다."
  }
];

const defaults=()=>({
  version:7,currentStep:1,updatedAt:"",
  target:{industry:"에너지",job:"",company:"",initialView:""},
  student:{major:"",majorEvidence:"",certificates:"",language:"",tools:"",otherSpec:""},
  step2Search:{company:"",title:"",sourceUrl:"",memo:""},
  sampleJobId:"",
  customJob:emptyCustomJob(),
  analysisCases:{
    "komipo-2026-3":emptyAnalysisCase(),
    "skenergy-2026-clx":emptyAnalysisCase(),
    "custom":emptyAnalysisCase()
  },
  jobTable:emptyJobTable(),
  context:{change:"",problem:""},
  profile:{solve:"",output:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",signal:"",top5:""},
  comparison:{common:"",differences:""},
  experiences:[emptyExperience(),emptyExperience(),emptyExperience()],
  selectedExperience:0,
  star:{competency:"",experience:"",situation:"",task:"",actionWhat:"",actionWhy:"",actionHow:"",result:"",evidence:""},
  requirements:emptyRequirements(),
  matchRows:[0,1,2].map(emptyMatch),
  fit:emptyFit(),
  ai:{keywordResult:"",gapResult:""}
});

let state=load(), activePosting=0;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!x)return defaults();
    const b=defaults();
    const legacyStep=Number(x.currentStep||1);
    const oldVersion=Number(x.version||1);
    let mappedStep;
    if(oldVersion<5){
      const v5Step=({1:1,2:2,3:3,4:3,5:5,6:7,7:7,8:7}[legacyStep]||1);
      mappedStep=({1:1,2:2,3:3,4:4,5:4,6:5,7:6}[v5Step]||1);
    }else if(oldVersion<6){
      mappedStep=({1:1,2:2,3:3,4:4,5:4,6:5,7:6}[legacyStep]||1);
    }else{
      mappedStep=Math.max(1,Math.min(6,legacyStep));
    }

    const postings=[0,1,2].map(i=>{
      const old=x.postings?.[i]||{};
      return {...emptyPosting(),...old,sourceUrl:old.sourceUrl||old.url||""};
    });

    const oldStar=x.star||{};
    const experiences=Array.isArray(x.experiences)&&x.experiences.length
      ? [0,1,2].map(i=>{
          const e=x.experiences[i]||{};
          return {...emptyExperience(),...e,summary:e.summary||e.note||""};
        })
      : [0,1,2].map(i=>i===0?{title:oldStar.experience||x.fit?.evidence||"",type:"",summary:""}:emptyExperience());

    const requirements=Array.isArray(x.requirements)&&x.requirements.length
      ? [0,1,2].map(i=>({condition:"",status:"",note:"",...(x.requirements[i]||{})}))
      : b.requirements;

    const oldMatches=Array.isArray(x.matchRows)?x.matchRows:(Array.isArray(x.matches)?x.matches:[]);
    const matchRows=[0,1,2].map(i=>({...emptyMatch(),...(oldMatches[i]||{})}));

    const star={
      ...b.star,...oldStar,
      experience:oldStar.experience||x.fit?.evidence||experiences[0]?.title||"",
      situation:oldStar.situation||oldStar.situationTask||"",
      actionWhat:oldStar.actionWhat||oldStar.action||""
    };

    const analysisCases={...b.analysisCases};
    Object.keys(analysisCases).forEach(id=>{
      const oldCase=x.analysisCases?.[id]||{};
      analysisCases[id]={
        jobTable:{...emptyJobTable(),...(oldCase.jobTable||{})},
        requirements:[0,1,2].map(i=>({condition:"",status:"",note:"",...(oldCase.requirements?.[i]||{})})),
        fit:{...emptyFit(),...(oldCase.fit||{})},
        keywordResult:oldCase.keywordResult||"",
        gapResult:oldCase.gapResult||""
      };
    });
    if(x.sampleJobId&&analysisCases[x.sampleJobId]&&!x.analysisCases){
      analysisCases[x.sampleJobId]={
        jobTable:{...emptyJobTable(),...(x.jobTable||{})},
        requirements:[0,1,2].map(i=>({condition:"",status:"",note:"",...(x.requirements?.[i]||{})})),
        fit:{...emptyFit(),...(x.fit||{})},
        keywordResult:x.ai?.keywordResult||"",
        gapResult:x.ai?.gapResult||""
      };
    }

    return {
      ...b,...x,version:7,currentStep:mappedStep,
      target:{...b.target,...(x.target||{})},
      student:{...b.student,...(x.student||{})},
      step2Search:{...b.step2Search,...(x.step2Search||{})},
      customJob:{...emptyCustomJob(),...(x.customJob||{})},
      analysisCases,
      jobTable:{...b.jobTable,...(x.jobTable||{})},
      context:{...b.context,...(x.context||{})},
      profile:{...b.profile,...(x.profile||{})},
      competency:{...b.competency,...(x.competency||{})},
      comparison:{...b.comparison,...(x.comparison||{})},
      postings,experiences,requirements:requirements.slice(0,3),matchRows:matchRows.slice(0,3),star,
      selectedExperience:Math.max(0,Math.min(2,Number(x.selectedExperience||0))),
      fit:{...b.fit,...(x.fit||{})},
      ai:{...b.ai,...(x.ai||{})}
    };
  }catch(e){return defaults();}
}

function save(){
  state.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const el=document.getElementById("saveState");
  if(el)el.textContent="저장됨 "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  progress();
}

function h(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function get(path){return path.split(".").reduce((o,k)=>o?.[k],state);}
function set(path,val){const a=path.split(".");let o=state;a.slice(0,-1).forEach(k=>{o[k]??={};o=o[k];});o[a.at(-1)]=val;}
function filled(v){return String(v||"").trim().length>0;}
function toast(msg){const e=document.getElementById("toast");if(!e)return;e.textContent=msg;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),1800);}

function field(path,label,ph,area=true,optional=false){
  const val=h(get(path)||"");
  const opt=optional?' <span class="hint">(선택)</span>':"";
  if(area)return '<div class="field"><label>'+label+opt+'</label><textarea class="input" data-path="'+path+'" placeholder="'+h(ph)+'">'+val+'</textarea></div>';
  return '<div class="field"><label>'+label+opt+'</label><input class="input" data-path="'+path+'" value="'+val+'" placeholder="'+h(ph)+'" /></div>';
}

function done(n){
  if(n===1)return filled(state.target.job)&&filled(state.student.major);
  if(n===2)return filled(state.step2Search.company)||filled(state.step2Search.title)||filled(state.step2Search.memo);
  if(n===3)return filled(state.sampleJobId)&&filled(state.jobTable.tasks)&&filled(state.jobTable.competencies);
  if(n===4)return state.experiences.some(e=>filled(e.title))&&(filled(state.ai.keywordResult)||filled(state.star.actionWhat)||filled(state.student.majorEvidence));
  if(n===5)return filled(state.fit.gaps)||state.matchRows.some(m=>filled(m.requirement)&&filled(m.status));
  if(n===6)return done(1)&&done(3)&&done(4)&&done(5);
}

function nav(){
  document.getElementById("stepNav").innerHTML='<div class="navTitle">JOB ANALYSIS</div>'+steps.map((s,i)=>{
    const n=i+1,d=done(n),a=state.currentStep===n;
    return '<button class="stepBtn '+(a?"active ":"")+(d?"done":"")+'" data-step="'+n+'" aria-label="STEP '+n+' '+h(s[0])+' · '+h(s[1])+'" '+(a?'aria-current="step"':'')+'><span class="stepN">'+(d?"✓":String(n).padStart(2,"0"))+'</span><span class="stepText">'+s[0]+'<small>'+s[1]+'</small></span></button>';
  }).join("");
  document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>go(Number(b.dataset.step)));
}

function progress(){
  const n=steps.filter((_,i)=>done(i+1)).length,p=Math.round(n/6*100);
  const l=document.getElementById("progressLabel"),b=document.getElementById("progressBar");
  if(l)l.textContent="진행 "+p+"% · "+n+"/6";
  const current=document.getElementById("currentStepLabel");
  if(current){const s=steps[state.currentStep-1];current.textContent="STEP "+String(state.currentStep).padStart(2,"0")+" · "+s[0]+" · "+s[1];}
  if(b)b.style.width=p+"%";
  nav();
}

function shell(n,title,desc,body,badge="실습"){
  return '<section class="card stepCard"><div class="sectionHead"><div><div class="kicker">STEP '+String(n).padStart(2,"0")+'</div><h2>'+title+'</h2><p>'+desc+'</p></div><span class="badge">'+badge+'</span></div>'+body+'<div class="actions stepFooter">'+(n>1?'<button class="btn secondary" data-prev="'+(n-1)+'">이전</button>':"")+(n<6?'<button class="btn primary" data-next="'+(n+1)+'">저장하고 다음</button>':"")+'</div></section>';
}

function energySearchPrompt(){
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 대학생이고, 에너지 산업의 "+(state.target.job||"관심 직무")+"를 탐색하고 있어.",
    "",
    "지금 채용 중인 공고가 적을 수 있으니 다음 순서로 찾아줘.",
    "1. 현재 모집 중인 에너지 공기업·발전사 공고",
    "2. 현재 모집 중인 정유·전력·에너지 대기업 공고",
    "3. 현재 공고가 없다면 최근 6개월 이내 신입·인턴 공고",
    "",
    "각 공고마다 기업명 / 공고명 / 직무 / 모집기간 / 공식 또는 공공기관 출처 링크를 알려줘.",
    "내 전공과 "+(state.target.job||"관심 직무")+"에 가까운 이유는 한 문장으로만 설명해줘.",
    "확인되지 않은 공고나 오래된 공고를 현재 채용 중이라고 표현하지 마."
  ].join("\n");
}

function step1(){
  return shell(1,"Target Job","먼저 분석할 직무와 내 전공을 정합니다. 이후 모든 AI 프롬프트가 이 입력을 사용합니다.",
    '<div class="grid2">'+
      field("target.industry","관심 산업","에너지",false)+
      field("target.job","분석할 직무","예: 발전운영·정비, 생산기술, 안전·환경, 전기설비, 품질관리",false)+
      field("student.major","내 전공","예: 전기공학, 기계공학, 화학공학, 환경공학",false)+
      field("target.initialView","지금 생각하는 이 직무 <span class=\"hint\">(선택)</span>","이 직무는 어떤 일을 하는 사람이라고 생각하나요?")+
    '</div>'+
    '<div class="callout good"><b>여기까지 입력하면 충분합니다.</b> 다음 단계부터 직무·전공에 맞춰 AI 프롬프트가 자동으로 달라집니다.</div>');
}

function jobSite(name,url,desc){
  return '<a class="jobSite" href="'+url+'" target="_blank" rel="noopener"><b>'+name+'</b><span>'+desc+'</span></a>';
}

function step2SearchPromptBox(){
  return '<details class="optionBox"><summary>AI에게 현재 공고 찾아달라고 하기 · 선택</summary><div class="optionBody">'+
    '<p class="help">STEP 1의 직무와 전공을 넣어 만든 검색 프롬프트입니다.</p>'+
    '<textarea class="promptBox promptEditor" id="searchPromptPreview">'+h(energySearchPrompt())+'</textarea>'+
    '<div class="actions compactActions"><button class="btn secondary" id="copySearchPromptBtn">내 검색 프롬프트 복사</button></div></div></details>';
}

function step2(){
  return shell(2,"Find JD","먼저 직접 최근 채용공고를 찾아봅니다. 에너지 공고가 없거나 마감되어 있어도 괜찮습니다.",
    '<div class="block"><h3>① 실제 공고 한번 찾아보기</h3><p class="help">공고가 있으면 기록하고, 없으면 “현재 찾지 못함”이라고 적고 STEP 3으로 이동합니다.</p><div class="siteSection"><b>민간기업</b><div class="jobSiteGrid">'+
      jobSite("사람인","https://www.saramin.co.kr/","에너지·제조 공고")+
      jobSite("잡코리아","https://www.jobkorea.co.kr/","대기업·공채")+
      jobSite("고용24","https://www.work24.go.kr/","정부 통합 채용정보")+
    '</div></div><div class="siteSection"><b>공공기관</b><div class="jobSiteGrid">'+
      jobSite("잡알리오","https://job.alio.go.kr/","국가 공공기관")+
      jobSite("클린아이 잡플러스","https://job.cleaneye.go.kr/","지방공공기관")+
    '</div></div></div>'+
    '<div class="block"><h3>② 검색 결과 한 줄만 기록</h3><div class="grid2">'+
      field("step2Search.company","찾은 기업","예: 한국남부발전 / 찾지 못함",false)+
      field("step2Search.title","찾은 직무·공고","예: 기술직 신입 / 현재 관련 공고 없음",false)+
      '<div class="field span2"><label>공고 주소 <span class="hint">(선택)</span></label><input class="input" data-path="step2Search.sourceUrl" value="'+h(state.step2Search.sourceUrl||"")+'" placeholder="https://..." /></div>'+
      field("step2Search.memo","검색 메모 <span class=\"hint\">(선택)</span>","어떤 검색어를 썼는지, 왜 적절한 공고를 찾기 어려웠는지 간단히 적어도 됩니다.")+
    '</div></div>'+step2SearchPromptBox()+
    '<div class="callout info"><b>공고가 없어도 수업은 계속됩니다.</b> STEP 3에서 실제 2026년 에너지 공기업·대기업 공고 예시를 제공합니다.</div>');
}

function postingLines(text=""){
  return String(text).split(/\r?\n/).map(x=>x.replace(/^[\s·•▶▷■□▪\-–—*]+/,"").trim()).filter(Boolean);
}

const sectionRules=[
  ["tasks",/(담당\s*업무|주요\s*업무|업무\s*내용|직무\s*내용|수행\s*업무|주요\s*역할|하는\s*일)/i],
  ["required",/(자격\s*요건|지원\s*자격|필수\s*요건|필수\s*사항|필수\s*조건|요구\s*사항|응시\s*자격)/i],
  ["preferred",/(우대\s*사항|우대\s*조건|우대\s*요건|가점|preferred)/i],
  ["other",/(기타|근무\s*조건|복리\s*후생|채용\s*절차|전형\s*절차|전형\s*방법)/i]
];

function lineSection(line,current="other"){
  const hit=sectionRules.find(([,rx])=>rx.test(line));
  if(hit)return hit[0];
  if(current==="tasks"||current==="required"||current==="preferred")return current;
  if(/우대|가점|preferred/i.test(line))return "preferred";
  if(/필수|자격|졸업|학위|전공|경력\s*\d|어학|자격증|지원\s*가능/i.test(line))return "required";
  if(/담당|수행|관리|분석|기획|개선|운영|개발|설계|검토|대응|지원|최적화|모니터링|정비|점검/i.test(line))return "tasks";
  return current;
}

function parsePosting(text=""){
  const out={tasks:[],required:[],preferred:[],other:[]};
  let current="other";
  postingLines(text).forEach(line=>{
    const hit=sectionRules.find(([,rx])=>rx.test(line));
    if(hit){
      current=hit[0];
      const rest=line.replace(hit[1],"").replace(/^[\s:：\-–—]+/,"").trim();
      if(rest)out[current].push(rest);
      return;
    }
    current=lineSection(line,current);
    out[current].push(line);
  });
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,[...new Set(v)].join("\n")]));
}

function postingSection(p,key){
  if(filled(p[key]))return p[key];
  return parsePosting(p.text)[key]||"";
}

function autoParsePosting(){
  const p=state.postings[activePosting];
  if(!filled(p.text)){toast("먼저 채용공고 원문을 붙여넣어 주세요.");return;}
  const parsed=parsePosting(p.text);
  ["tasks","required","preferred","other"].forEach(k=>{if(!filled(p[k]))p[k]=parsed[k];});
  save();render();toast("공고를 TASK · GATE · 우대 · 전형/기타로 나눴습니다.");
}

const dict={
  "지식(Knowledge)":["공정","품질","회계","재무","마케팅","시장","전기","전자","기계","화학","에너지","안전","환경","법규","제품","산업","원가","생산","설비","전력","전공"],
  "기술(Skill)":["분석","Excel","엑셀","Python","파이썬","SQL","CAD","GIS","ArcGIS","Minitab","미니탭","통계","데이터","보고서","프레젠테이션","영어","어학","문서","설계","개선","최적화","모니터링"],
  "행동(Behavior)":["협업","소통","문제해결","문제 해결","주도","책임","고객","커뮤니케이션","조율","적극","논리","꼼꼼","유관부서","유관 부서"],
  "경험(Experience)":["인턴","프로젝트","실험","연구","현장","공모전","아르바이트","실습","경력","경험","캡스톤","교육","자격증"]
};

function rx(x){return x.replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");}

function signals(){
  const text=state.postings.map(p=>p.text).join("\n"),out={};
  Object.entries(dict).forEach(([cat,words])=>{
    out[cat]=words.map(w=>({w,count:(text.match(new RegExp(rx(w),"gi"))||[]).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);
  });
  return out;
}

function lineSignals(line){
  const found=[];
  Object.entries(dict).forEach(([cat,words])=>{
    const hits=words.filter(w=>new RegExp(rx(w),"i").test(line));
    if(hits.length)found.push({cat,words:hits});
  });
  return found;
}

function evidenceRows(){
  const rows=[];
  state.postings.forEach((p,i)=>{
    if(!filled(p.text))return;
    [["TASK","tasks"],["GATE","required"],["PREFERENCE","preferred"]].forEach(([label,key])=>{
      postingLines(postingSection(p,key)).forEach(line=>rows.push({posting:i+1,section:label,line,signals:lineSignals(line)}));
    });
  });
  return rows;
}

function signalLabel(items){
  if(!items.length)return '<span class="hint">직접 판단</span>';
  return items.map(x=>'<span class="pill">'+h(x.cat.split("(")[0].trim())+' · '+h(x.words.slice(0,3).join(", "))+'</span>').join(" ");
}

const signalGroups=[
  {label:"데이터 분석",terms:["데이터 분석","데이터","통계","Excel","엑셀","Python","파이썬","SQL","Minitab","미니탭"]},
  {label:"문제해결·개선",terms:["문제해결","문제 해결","개선","원인 분석","최적화"]},
  {label:"협업·소통",terms:["협업","소통","커뮤니케이션","유관부서","유관 부서","조율"]},
  {label:"공정·생산·설비",terms:["공정","생산","설비","수율","가동","품질","정비","점검"]},
  {label:"안전·환경",terms:["안전","환경","PSM","위험성평가","법규"]},
  {label:"현장·프로젝트 경험",terms:["인턴","프로젝트","현장","실습","캡스톤","경험","경력"]}
];

function firstEvidence(text,terms){
  return postingLines(text).find(line=>terms.some(w=>new RegExp(rx(w),"i").test(line)))||"";
}

function commonSignalRows(){
  return signalGroups.map(g=>{
    const cells=state.postings.map(p=>{
      if(!filled(p.text))return {hit:false,evidence:""};
      const evidence=firstEvidence(p.text,g.terms);
      return {hit:!!evidence,evidence};
    });
    return {label:g.label,n:cells.filter(x=>x.hit).length,cells};
  }).filter(x=>x.n).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,"ko"));
}

function optionalComparison(){
  const valid=state.postings.filter(p=>filled(p.text)).length,rows=commonSignalRows();
  const trs=rows.length?rows.map(r=>'<tr><td><b>'+h(r.label)+'</b></td><td>'+r.n+'</td>'+r.cells.map(c=>'<td>'+(c.hit?'<b>✓</b><br><span class="hint">'+h(c.evidence.slice(0,90))+'</span>':'-')+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="5">공고 2~3개를 입력하면 비교표가 만들어집니다.</td></tr>';
  return '<details class="optionBox comparisonOption"><summary>심화 OPTION · 같은 직무 공고 2~3개 비교하기</summary><div class="optionBody">'+
    '<div class="callout '+(valid>=2?"good":"info")+'">현재 공고 <b>'+valid+'개</b>가 입력되어 있습니다. 이번 수업은 공고 1개만 분석해도 충분합니다.</div>'+
    '<div class="tableWrap"><table><thead><tr><th>요구 신호</th><th>등장 공고 수</th><th>공고 1 근거</th><th>공고 2 근거</th><th>공고 3 근거</th></tr></thead><tbody>'+trs+'</tbody></table></div>'+
    '<div class="grid2">'+field("comparison.common","여러 공고의 공통 요구","여러 회사에서 반복되는 요구")+field("comparison.differences","기업별 차이","특정 회사에서만 강조되는 요구")+'</div></div></details>';
}

function selectedCuratedJob(){
  return CURATED_JOBS.find(x=>x.id===state.sampleJobId)||null;
}

function jobAnalysisPrompt(){
  const j=selectedCuratedJob();
  if(!j)return "먼저 STEP 3에서 분석할 공고를 선택하세요.";
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 대학생이고, "+(state.target.job||"에너지 관련 직무")+"를 준비하고 있다.",
    "",
    "[선택한 실제 채용공고]",
    "기업: "+j.company,
    "공고: "+j.title,
    "직무/분야: "+j.role,
    "모집기간: "+j.period,
    "확인된 기본정보: "+j.facts,
    "공식·공공 출처: "+j.sourceUrl,
    "",
    "가능하면 위 링크의 현재 공고와 직무기술서를 직접 확인해 직무분석을 해줘.",
    "링크의 세부내용을 확인할 수 없다면 모르는 내용을 만들지 말고 '원문 확인 필요'라고 써줘.",
    "",
    "아래 6개 제목을 그대로 사용해 답해줘.",
    "고객·KPI:",
    "주요 과업:",
    "주요 해결과제:",
    "해결방법:",
    "필요역량:",
    "경력개발:",
    "",
    "작성 원칙:",
    "- [공고에서 확인]과 [직무 특성상 추론]을 구분한다.",
    "- KPI가 공고에 없으면 임의의 수치 목표를 만들지 않는다.",
    "- 필요역량은 지식(Knowledge), 기술(Skill), 행동(Behavior) 중 실제 근거가 있는 것 중심으로 쓴다.",
    "- "+(state.student.major||"내 전공")+" 학생이 이해하기 쉬운 표현으로 설명한다.",
    "- 각 항목은 2~4개 핵심 내용만 적는다."
  ].join("\n");
}

function parseJobTableResult(raw){
  const map=[
    ["customerKpi",/^(?:#+\s*)?(?:고객\s*[·/&]\s*KPI|고객\s*및\s*KPI|고객|KPI)\s*[:：]?/i],
    ["tasks",/^(?:#+\s*)?(?:주요\s*과업|과업|주요\s*업무)\s*[:：]?/i],
    ["challenge",/^(?:#+\s*)?(?:주요\s*해결과제|해결과제|과제)\s*[:：]?/i],
    ["method",/^(?:#+\s*)?(?:해결방법|해결\s*방법|방법)\s*[:：]?/i],
    ["competencies",/^(?:#+\s*)?(?:필요역량|필요\s*역량|역량)\s*[:：]?/i],
    ["careerPlan",/^(?:#+\s*)?(?:경력개발|경력\s*개발|경력계획)\s*[:：]?/i]
  ];
  const out={};let current="";
  for(const original of String(raw||"").split(/\r?\n/)){
    const line=original.trim();if(!line)continue;
    const hit=map.find(([,re])=>re.test(line));
    if(hit){
      current=hit[0];
      const rest=line.replace(hit[1],"").trim();
      if(rest)out[current]=rest;
      continue;
    }
    if(current)out[current]=(out[current]?out[current]+"\n":"")+line.replace(/^[-*•]\s*/,"");
  }
  return out;
}

function curatedJobCards(){
  return '<div class="curatedJobGrid">'+CURATED_JOBS.map(j=>{
    const on=state.sampleJobId===j.id;
    return '<article class="curatedJob '+(on?"selected":"")+'">'+
      '<div class="curatedMeta"><span>'+h(j.type)+'</span><small>'+h(j.period)+'</small></div>'+
      '<h3>'+h(j.company)+'</h3><b>'+h(j.title)+'</b>'+
      '<p>'+h(j.facts)+'</p>'+
      '<div class="curatedLinks"><a href="'+h(j.sourceUrl)+'" target="_blank" rel="noopener">원문 확인</a>'+
      '<button class="btn '+(on?"primary":"secondary")+'" data-curated="'+h(j.id)+'">'+(on?"선택됨":"이 공고로 분석")+'</button></div>'+
    '</article>';
  }).join("")+'</div>';
}

function jobTableFields(){
  return '<div class="jobTableCards">'+
    '<div class="jobTableItem"><span>01</span>'+field("jobTable.customerKpi","고객(KPI)","이 직무의 고객은 누구이며 성과는 무엇으로 확인할까?")+'</div>'+
    '<div class="jobTableItem"><span>02</span>'+field("jobTable.tasks","주요 과업","실제로 반복해서 수행하는 일은 무엇인가?")+'</div>'+
    '<div class="jobTableItem"><span>03</span>'+field("jobTable.challenge","주요 해결과제","업무에서 해결해야 하는 문제는 무엇인가?")+'</div>'+
    '<div class="jobTableItem"><span>04</span>'+field("jobTable.method","해결방법","어떤 방법·절차·도구로 해결하는가?")+'</div>'+
    '<div class="jobTableItem"><span>05</span>'+field("jobTable.competencies","필요역량","필요한 지식·기술·행동은 무엇인가?")+'</div>'+
    '<div class="jobTableItem"><span>06</span>'+field("jobTable.careerPlan","경력개발","이 직무에서 경험을 쌓으면 어떤 방향으로 전문성이 넓어지는가?")+'</div>'+
  '</div>';
}

function jobTablePreview(){
  const cells=[
    ["고객(KPI)","jobTable.customerKpi",state.jobTable.customerKpi],
    ["과업","jobTable.tasks",state.jobTable.tasks],
    ["주요 해결과제","jobTable.challenge",state.jobTable.challenge],
    ["해결방법","jobTable.method",state.jobTable.method],
    ["필요역량","jobTable.competencies",state.jobTable.competencies],
    ["경력계획","jobTable.careerPlan",state.jobTable.careerPlan]
  ];
  return '<div class="tableWrap jobAnalysisPreview"><table><thead><tr>'+cells.map(x=>'<th>'+x[0]+'</th>').join("")+'</tr></thead><tbody><tr>'+cells.map(x=>'<td data-preview="'+x[1]+'">'+h(x[2]||"-")+'</td>').join("")+'</tr></tbody></table></div>';
}

function step3(){
  const j=selectedCuratedJob();
  return shell(3,"Choose JD → Job Analysis","최근 에너지 공기업·대기업 공고 중 하나를 선택하고, 실제 직무분석 테이블을 완성합니다.",
    '<div class="block"><h3>① 수업용 실제 공고 하나 선택</h3><p class="help">STEP 2에서 공고를 찾지 못했어도 아래 공고로 그대로 실습할 수 있습니다.</p>'+curatedJobCards()+'</div>'+
    (j?
      '<div class="selectedJobSummary"><b>분석 대상 · '+h(j.company)+' / '+h(j.role)+'</b><span>'+h(j.note)+'</span></div>'+
      '<div class="block"><h3>② AI에게 직무분석 초안 받기</h3><p class="help">내 전공·희망직무·선택 공고가 자동으로 들어갑니다. AI 결과의 사실 여부는 원문 링크와 비교합니다.</p>'+
        '<textarea class="promptBox promptEditor shortPrompt" id="jobPromptPreview">'+h(jobAnalysisPrompt())+'</textarea>'+
        '<div class="actions compactActions"><button class="btn secondary" id="copyReviewedJobPromptBtn">내 직무분석 프롬프트 복사</button></div>'+
        '<div class="field aiPaste"><label>AI 답변 붙여넣기 <span class="hint">(선택)</span></label><textarea class="input" data-path="jobTable.aiResult" id="jobTableAiResult" placeholder="AI 답변을 붙여넣으면 아래 6칸으로 나눌 수 있습니다.">'+h(state.jobTable.aiResult||"")+'</textarea></div>'+
        '<div class="actions compactActions"><button class="btn secondary" id="applyJobTableAiBtn">AI 답변을 6칸에 반영</button></div>'+
      '</div>'+
      '<div class="divider"></div><div class="block"><h3>③ 직무분석 테이블 완성</h3><p class="help">AI가 적은 내용을 그대로 확정하지 말고, 공고와 맞지 않는 내용은 고치거나 삭제합니다.</p>'+jobTableFields()+'</div>'+
      '<div class="block"><h3>④ 완성된 직무분석표</h3><p class="help">모바일에서는 좌우로 밀어서 전체 표를 확인합니다.</p>'+jobTablePreview()+'</div>'+
      '<details class="optionBox"><summary>선택 공고에서 확인된 기본정보</summary><div class="optionBody"><div class="callout info"><b>'+h(j.source)+'</b><br>'+h(j.facts)+'</div><div class="callout warn"><b>지원자격:</b><br>'+h(j.required).replace(/\n/g,"<br>")+'<br><br><b>우대·확인사항:</b><br>'+h(j.preferred).replace(/\n/g,"<br>")+'</div></div></details>'
      :
      '<div class="callout warn"><b>먼저 공고를 하나 선택하세요.</b> 선택하면 개인 직무분석 프롬프트와 6개 직무분석 칸이 열립니다.</div>'
    )
  );
}

const expTypes=["","전공수업","프로젝트·캡스톤","인턴·현장실습","아르바이트","학생회·동아리","공모전·대외활동","연구·실험","자격·교육","개인경험","기타"];

function experienceRows(){
  return state.experiences.map((e,i)=>{
    const opts=expTypes.map(x=>'<option value="'+h(x)+'" '+(e.type===x?"selected":"")+'>'+(x||"유형 선택")+'</option>').join("");
    const optional=i>0?' <span class="hint">(선택)</span>':'';
    return '<div class="experienceRow '+(state.selectedExperience===i?"selected":"")+'">'+
      '<label class="experiencePick"><input type="radio" name="selectedExperience" data-exp-select="'+i+'" '+(state.selectedExperience===i?"checked":"")+' /> '+(i===0?"대표 경험":"추가 경험 "+(i+1))+optional+'</label>'+
      '<div class="grid2"><div class="field"><label>경험 이름</label><input class="input" data-exp="'+i+'" data-expkey="title" value="'+h(e.title)+'" placeholder="예: 캡스톤 에너지효율 프로젝트" /></div>'+
      '<div class="field"><label>경험 유형</label><select class="input" data-exp="'+i+'" data-expkey="type">'+opts+'</select></div></div>'+
      '<div class="field"><label>내가 한 일 한 줄</label><input class="input" data-exp="'+i+'" data-expkey="summary" value="'+h(e.summary)+'" placeholder="예: 운전 데이터를 정리하고 이상값 원인을 비교했다" /></div>'+
    '</div>';
  }).join("");
}

function competencyKeywordPrompt(){
  const j=selectedCuratedJob();
  const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary)).map((e,i)=>
    (i+1)+". "+(e.title||"경험")+(e.type?" ["+e.type+"]":"")+" - "+(e.summary||"세부내용 미입력")
  );
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 대학생이고, "+(state.target.job||j?.role||"에너지 직무")+"를 준비하고 있다.",
    "",
    "[선택한 채용공고]",
    j?j.company+" / "+j.title+" / "+j.role:"공고 미선택",
    j?"확인된 정보: "+j.facts:"",
    "",
    "[직무분석 결과]",
    "주요 과업: "+(state.jobTable.tasks||"미입력"),
    "해결과제: "+(state.jobTable.challenge||"미입력"),
    "해결방법: "+(state.jobTable.method||"미입력"),
    "필요역량: "+(state.jobTable.competencies||"미입력"),
    "",
    "[내 전공에서 찾은 근거]",
    state.student.majorEvidence||"미입력",
    "",
    "[내 경험]",
    ...(exps.length?exps:["경험 미입력"]),
    "",
    "[대표 경험의 추가 근거]",
    "내 행동: "+(state.star.actionWhat||"미입력"),
    "결과: "+(state.star.result||"미입력"),
    "증거: "+(state.star.evidence||"미입력"),
    "",
    "위 정보만 사용해서 내가 자기소개서와 면접에서 사용할 수 있는 '직무역량 키워드'를 3~5개 찾아줘.",
    "각 키워드마다 아래 형식으로 정리해줘.",
    "1) 역량 키워드",
    "2) 이 직무에서 왜 필요한지",
    "3) 내 전공 또는 경험에서 확인되는 근거",
    "4) 채용담당자가 이해할 수 있는 직무언어로 바꾼 표현",
    "5) 자기소개서에서 강조할 행동 1개",
    "6) 면접에서 확인받을 수 있는 질문 1개",
    "",
    "내가 입력하지 않은 경험·수치·성과·자격을 만들지 마.",
    "근거가 약한 역량은 '근거 부족'이라고 표시해줘.",
    "성격형 표현보다 실제 행동과 업무언어를 우선해줘."
  ].filter(Boolean).join("\n");
}

function step4(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  if(filled(e.title)&&(!filled(state.star.experience)||state.star.experience!==e.title))state.star.experience=e.title;
  return shell(4,"Major & Experience → Competency","내 전공과 경험에서 직무에 연결할 수 있는 근거를 찾고, 자기소개서·면접에 쓸 역량 키워드로 바꿉니다.",
    '<div class="block"><h3>① 전공에서 근거 하나 찾기</h3><div class="selectedEvidence"><span>내 전공</span><b>'+h(state.student.major||"STEP 1에서 전공을 입력하세요.")+'</b></div>'+
      field("student.majorEvidence","직무와 연결되는 수업·실험·과제·프로젝트","예: 전력계통 수업에서 부하흐름을 계산 / 열역학 실험에서 효율을 비교 / 공정제어 프로젝트에서 데이터를 분석")+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>② 내 경험 최대 3개</h3><p class="help">경험 이름과 내가 한 일을 한 줄만 적어도 됩니다. AI가 없는 경험을 만들지 않도록 실제로 한 내용만 씁니다.</p><div class="experienceList">'+experienceRows()+'</div></div>'+
    '<div class="divider"></div><div class="block starBlock"><h3>③ 대표 경험에서 행동 근거 확인</h3><div class="selectedEvidence"><span>대표 경험</span><b>'+h(e.title||state.star.experience||"위에서 대표 경험을 선택하세요.")+'</b></div>'+
      field("star.actionWhat","내가 직접 한 행동","팀이 한 일이 아니라 내가 실제로 한 행동은?")+
      '<div class="grid2">'+field("star.result","결과","내 행동 뒤 무엇이 달라졌나요?")+field("star.evidence","확인 가능한 증거","수치·산출물·기록·피드백 등")+'</div>'+
      '<details class="optionBox"><summary>STAR+를 더 자세히 정리하기 · 선택</summary><div class="optionBody"><div class="grid2">'+
        field("star.situation","S · 상황","언제, 어디서, 어떤 상황이었나요?")+
        field("star.task","T · 역할과 과제","내 역할과 해결해야 했던 문제는?")+
        field("star.actionWhy","WHY · 판단 이유","왜 그 방법을 선택했나요?")+
        field("star.actionHow","HOW · 실행 방식","어떤 순서·도구·방법으로 진행했나요?")+
      '</div></div></details>'+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>④ AI로 직무역량 키워드 찾기</h3><p class="help">STEP 1~4에 입력한 내용이 자동으로 프롬프트에 들어갑니다.</p>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="keywordPromptPreview">'+h(competencyKeywordPrompt())+'</textarea>'+
      '<div class="actions compactActions"><button class="btn ghost" id="refreshKeywordPromptBtn">현재 입력 반영</button><button class="btn secondary" id="copyKeywordPromptBtn">내 역량분석 프롬프트 복사</button></div>'+
      field("ai.keywordResult","AI 결과 붙여넣기 <span class=\"hint\">(선택)</span>","AI가 정리한 3~5개 역량 키워드를 붙여넣으세요. STEP 6 Portfolio에 함께 들어갑니다.")+
    '</div>'+
    '<div class="callout warn"><b>확인 원칙:</b> AI가 제시한 역량 중 내 행동으로 설명할 수 없는 키워드는 삭제합니다.</div>');
}

function ensureRequirements(){
  const j=selectedCuratedJob();
  const src=[];
  if(j){
    String(j.required||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach(x=>src.push(x));
    if(src.length<3&&filled(state.jobTable.competencies))src.push("직무 필요역량: "+state.jobTable.competencies);
    if(src.length<3&&filled(state.jobTable.tasks))src.push("주요 과업 수행 준비: "+state.jobTable.tasks);
  }
  src.slice(0,3).forEach((line,i)=>{if(!filled(state.requirements[i]?.condition))state.requirements[i].condition=line;});
}

function requirementRows(){
  ensureRequirements();
  return state.requirements.map((r,i)=>'<div class="requirementRow">'+
    '<div class="field"><label>공고·직무 조건 '+(i+1)+'</label><input class="input" data-req="'+i+'" data-reqkey="condition" value="'+h(r.condition)+'" placeholder="공고에서 확인한 필수·우대조건 또는 핵심 요구" /></div>'+
    '<div class="field"><label>내 현재 상태</label><select class="input" data-req="'+i+'" data-reqkey="status"><option value="">선택</option><option value="충족" '+(r.status==="충족"?"selected":"")+'>충족</option><option value="일부 준비" '+(r.status==="일부 준비"?"selected":"")+'>일부 준비</option><option value="현재 GAP" '+(r.status==="현재 GAP"?"selected":"")+'>현재 GAP</option><option value="원문 확인 필요" '+(r.status==="원문 확인 필요"?"selected":"")+'>원문 확인 필요</option></select></div>'+
    '<div class="field"><label>내 근거 <span class="hint">(선택)</span></label><input class="input" data-req="'+i+'" data-reqkey="note" value="'+h(r.note)+'" placeholder="예: TOEIC 820 / 전기기사 준비 중 / 해당 경험 없음" /></div>'+
  '</div>').join("");
}

function gapPrompt(){
  const j=selectedCuratedJob();
  const reqs=state.requirements.filter(r=>filled(r.condition)).map((r,i)=>(i+1)+". "+r.condition+" / 내 판정: "+(r.status||"미판정")+" / 근거: "+(r.note||"없음"));
  const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary)).map((e,i)=>(i+1)+". "+(e.title||"경험")+" - "+(e.summary||""));
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 취업준비생이고, "+(state.target.job||j?.role||"에너지 직무")+"를 준비하고 있다.",
    "",
    "[선택 공고]",
    j?j.company+" / "+j.title+" / "+j.role:"공고 미선택",
    j?"공고에서 확인된 정보: "+j.facts:"",
    j?"공고 링크: "+j.sourceUrl:"",
    "",
    "[직무에서 하는 일]",
    state.jobTable.tasks||"미입력",
    "[직무 필요역량]",
    state.jobTable.competencies||"미입력",
    "",
    "[공고·직무 조건과 내가 판단한 상태]",
    ...(reqs.length?reqs:["아직 입력하지 않음"]),
    "",
    "[나의 스펙]",
    "전공: "+(state.student.major||"미입력"),
    "자격증: "+(state.student.certificates||"없음/미입력"),
    "어학: "+(state.student.language||"없음/미입력"),
    "도구·기술: "+(state.student.tools||"없음/미입력"),
    "기타 스펙: "+(state.student.otherSpec||"없음/미입력"),
    "전공 근거: "+(state.student.majorEvidence||"미입력"),
    "",
    "[경험]",
    ...(exps.length?exps:["경험 미입력"]),
    "",
    "위 정보와 공식 공고를 기준으로 내 GAP을 분석해줘.",
    "가능하면 공고 링크를 확인하되, 확인할 수 없는 조건은 추정하지 말고 '원문 확인 필요'라고 표시해줘.",
    "",
    "아래 순서로 답해줘.",
    "1. 공고에서 실제로 하는 일 3개",
    "2. 필수조건과 우대조건 구분",
    "3. 내가 이미 갖춘 근거",
    "4. 일부 준비된 항목",
    "5. 현재 GAP 최대 3개",
    "6. 우선순위 1~3",
    "7. 각 GAP을 3개월 안에 보완할 수 있는 구체적 행동",
    "",
    "내가 입력하지 않은 자격증·점수·경험을 있다고 가정하지 마.",
    "채용 가능성을 점수나 확률로 계산하지 마."
  ].filter(Boolean).join("\n");
}

function step5(){
  const j=selectedCuratedJob();
  return shell(5,"JD Requirements × My Spec → GAP","공고에서 요구하는 조건과 내 현재 스펙을 비교해 지금 준비할 GAP을 정합니다.",
    '<div class="selectedJobSummary"><b>비교 대상 · '+h(j?j.company:"공고 미선택")+'</b><span>'+h(j?j.title:"STEP 3에서 공고를 선택하세요.")+'</span></div>'+
    '<div class="block"><h3>① 내 스펙 빠르게 입력</h3><div class="grid2">'+
      '<div class="field"><label>내 전공</label><input class="input" value="'+h(state.student.major||"")+'" disabled /></div>'+
      field("student.certificates","자격증","예: 전기기사 / 산업안전기사 준비 중 / 없음",false)+
      field("student.language","어학","예: TOEIC 820 / OPIc IM2 / 없음",false)+
      field("student.tools","도구·기술","예: Excel, Python, CAD, Minitab, 실험장비",false)+
      field("student.otherSpec","기타 스펙 <span class=\"hint\">(선택)</span>","인턴, 교육, 수상, 현장실습 등",false,true)+
    '</div></div>'+
    '<div class="divider"></div><div class="block"><h3>② 공고·직무 조건 3개만 비교</h3><p class="help">조건이 공고에서 명확하지 않으면 ‘원문 확인 필요’를 선택합니다.</p><div class="requirementList">'+requirementRows()+'</div></div>'+
    '<div class="divider"></div><div class="block"><h3>③ AI로 내 GAP 분석</h3><p class="help">공고, 직무분석, 전공, 경험, 스펙이 모두 들어간 개인 프롬프트입니다.</p>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="gapPromptPreview">'+h(gapPrompt())+'</textarea>'+
      '<div class="actions compactActions"><button class="btn ghost" id="refreshGapPromptBtn">현재 입력 반영</button><button class="btn secondary" id="copyGapPromptBtn">내 GAP 분석 프롬프트 복사</button></div>'+
      field("ai.gapResult","AI GAP 분석 결과 <span class=\"hint\">(선택)</span>","AI의 GAP 분석 결과를 붙여넣으세요.")+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>④ 내가 정한 최종 GAP과 행동</h3><div class="grid2">'+
      field("fit.assets","현재 갖춘 강점·스펙","공고와 연결되는 내 근거")+
      field("fit.gaps","우선 보완할 GAP","최대 3개만 남기세요.")+
      field("fit.actions","3개월 행동계획","무엇을 언제까지 어떤 결과물로 만들 것인가?")+
    '</div></div>');
}

function portfolio(){
  const t=state.target, st=state.student, jt=state.jobTable, f=state.fit, star=state.star;
  const j=selectedCuratedJob();
  const req=state.requirements.filter(r=>filled(r.condition));
  const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary));
  const a=["MY JOB ANALYSIS PORTFOLIO","",
    "1. TARGET",
    "산업: "+(t.industry||"-"),
    "희망 직무: "+(t.job||"-"),
    "전공: "+(st.major||"-"),
    "처음 생각한 직무 이미지: "+(t.initialView||"-"),"",
    "2. SEARCH EXPERIENCE",
    "직접 찾아본 기업: "+(state.step2Search.company||"-"),
    "직접 찾아본 공고·직무: "+(state.step2Search.title||"-"),
    "검색 메모: "+(state.step2Search.memo||"-"),"",
    "3. SELECTED JOB POSTING",
    "기업: "+(j?.company||"-"),
    "공고: "+(j?.title||"-"),
    "분야: "+(j?.role||"-"),
    "기간: "+(j?.period||"-"),
    "출처: "+(j?.sourceUrl||"-"),"",
    "4. JOB ANALYSIS TABLE",
    "고객·KPI: "+(jt.customerKpi||"-"),
    "주요 과업: "+(jt.tasks||"-"),
    "주요 해결과제: "+(jt.challenge||"-"),
    "해결방법: "+(jt.method||"-"),
    "필요역량: "+(jt.competencies||"-"),
    "경력개발: "+(jt.careerPlan||"-"),"",
    "5. MAJOR & EXPERIENCE EVIDENCE",
    "전공에서 찾은 근거: "+(st.majorEvidence||"-")
  ];
  if(exps.length)exps.forEach((e,i)=>a.push("경험 "+(i+1)+": "+(e.title||"-")+" / "+(e.type||"유형 미지정")+" / "+(e.summary||"-")));
  else a.push("경험: -");
  a.push(
    "대표 경험 행동: "+(star.actionWhat||"-"),
    "대표 경험 결과: "+(star.result||"-"),
    "대표 경험 증거: "+(star.evidence||"-"),"",
    "6. COMPETENCY LANGUAGE",
    state.ai.keywordResult||"AI 역량분석 결과 미입력","",
    "7. MY SPEC",
    "자격증: "+(st.certificates||"-"),
    "어학: "+(st.language||"-"),
    "도구·기술: "+(st.tools||"-"),
    "기타 스펙: "+(st.otherSpec||"-"),"",
    "8. REQUIREMENTS & GAP"
  );
  if(req.length)req.forEach((r,i)=>a.push((i+1)+". "+r.condition+" / "+(r.status||"미판정")+" / 내 근거: "+(r.note||"-")));
  else a.push("조건 비교: -");
  a.push(
    "현재 강점·자산: "+(f.assets||"-"),
    "우선 보완 GAP: "+(f.gaps||"-"),
    "3개월 행동계획: "+(f.actions||"-"),"",
    "[AI GAP 분석 메모]",
    state.ai.gapResult||"-"
  );
  return a.join("\n");
}

function selfIntroPrompt(){
  const j=selectedCuratedJob(), e=state.experiences[state.selectedExperience]||emptyExperience();
  return [
    "아래는 내가 직접 정리한 직무분석과 경험 자료다. 이 정보 밖의 사실을 만들지 말아줘.",
    "",
    "[지원 직무] "+(state.target.job||j?.role||"-"),
    "[기업/공고] "+(j?j.company+" / "+j.title:"-"),
    "[직무 주요 과업] "+(state.jobTable.tasks||"-"),
    "[직무 필요역량] "+(state.jobTable.competencies||"-"),
    "[내 전공] "+(state.student.major||"-"),
    "[전공 근거] "+(state.student.majorEvidence||"-"),
    "[대표 경험] "+(e.title||state.star.experience||"-"),
    "[내 행동] "+(state.star.actionWhat||"-"),
    "[결과] "+(state.star.result||"-"),
    "[증거] "+(state.star.evidence||"-"),
    "[역량 키워드 분석] "+(state.ai.keywordResult||"-"),
    "[현재 GAP과 준비] "+(state.fit.gaps||"-")+" / "+(state.fit.actions||"-"),
    "",
    "이 자료를 바탕으로 자기소개서에 쓸 수 있는 소재 초안을 만들어줘.",
    "기업 칭찬이나 추상적인 성격 표현보다 '직무 요구 → 내 행동 근거 → 결과'가 보이게 써줘.",
    "내가 말하지 않은 수치·성과·역할은 추가하지 마.",
    "근거가 부족하면 문장을 만들지 말고 먼저 확인 질문을 해줘.",
    "최종 문장은 과장된 AI 문체 없이 실제 대학생이 말할 법한 한국어로 써줘."
  ].join("\n");
}

function interviewPrompt(){
  const j=selectedCuratedJob(), e=state.experiences[state.selectedExperience]||emptyExperience();
  return [
    "너는 "+(j?.company||"에너지 기업")+"의 "+(state.target.job||j?.role||"지원 직무")+" 면접관 역할을 해줘.",
    "아래 자료만 근거로 면접을 진행해줘.",
    "",
    "[직무 과업] "+(state.jobTable.tasks||"-"),
    "[해결과제] "+(state.jobTable.challenge||"-"),
    "[필요역량] "+(state.jobTable.competencies||"-"),
    "[전공] "+(state.student.major||"-"),
    "[대표 경험] "+(e.title||state.star.experience||"-"),
    "[내 행동] "+(state.star.actionWhat||"-"),
    "[결과/증거] "+(state.star.result||"-")+" / "+(state.star.evidence||"-"),
    "[현재 GAP/준비] "+(state.fit.gaps||"-")+" / "+(state.fit.actions||"-"),
    "",
    "질문은 한 번에 하나씩 해줘.",
    "직무이해 2문항, 경험검증 3문항, GAP·준비 1문항 순서로 진행해줘.",
    "내 답변에서 모호한 부분이 있으면 수치·역할·판단근거를 확인하는 꼬리질문을 해줘.",
    "내 답을 대신 만들지 말고, 답변이 끝난 뒤에만 '근거가 충분한 부분 / 보완할 부분'을 짧게 피드백해줘."
  ].join("\n");
}

function step6(){
  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 06</div><h2>My Job Portfolio</h2><p>직무분석, 전공·경험, 역량 키워드, 스펙, GAP을 한 파일로 모으고 실제 지원 준비로 연결합니다.</p></div><span class="badge">Portfolio</span></div>'+
    '<div class="block noPrint"><h3>① 내 직무분석 결과 확인</h3><p class="help">아래 내용은 STEP 1~5 입력값으로 자동 생성됩니다. 빠진 내용이 있으면 이전 STEP에서 수정합니다.</p></div>'+
    '<div class="preview">'+h(portfolio())+'</div>'+
    '<div class="divider noPrint"></div><div class="block noPrint"><h3>② 내 AI로 자기소개서 준비</h3><p class="help">내 전공·경험·직무분석·GAP이 들어간 개인 프롬프트입니다.</p><textarea class="promptBox promptEditor shortPrompt" id="selfIntroPromptPreview">'+h(selfIntroPrompt())+'</textarea><div class="actions compactActions"><button class="btn secondary" id="copySelfIntroPromptBtn">자기소개서 프롬프트 복사</button></div></div>'+
    '<div class="block noPrint"><h3>③ 내 AI로 면접 연습</h3><textarea class="promptBox promptEditor shortPrompt" id="interviewPromptPreview">'+h(interviewPrompt())+'</textarea><div class="actions compactActions"><button class="btn secondary" id="copyInterviewPromptBtn">면접 프롬프트 복사</button></div></div>'+
    '<div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>직무분석 Portfolio를 Word에서 수정합니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 PDF로 저장합니다.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>다음 수업에서 이어서 사용할 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div>'+
    '<div class="actions stepFooter noPrint"><button class="btn secondary" data-prev="5">이전</button><button class="btn secondary" id="copyBtn">Portfolio 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
}

async function copyText(text,msg){
  try{await navigator.clipboard.writeText(text);toast(msg);}catch(e){toast("복사 권한을 확인해 주세요.");}
}

function selectCuratedJob(id){
  const j=CURATED_JOBS.find(x=>x.id===id);if(!j)return;
  if(state.sampleJobId&&state.sampleJobId!==id){
    state.jobTable={customerKpi:"",tasks:"",challenge:"",method:"",competencies:"",careerPlan:"",aiResult:""};
    state.requirements=[0,1,2].map(()=>({condition:"",status:"",note:""}));
  }
  state.sampleJobId=id;
  state.target.company=j.company;
  state.postings[0]={
    ...emptyPosting(),
    company:j.company,title:j.title,sourceUrl:j.sourceUrl,
    text:"[공고에서 확인된 기본정보]\n"+j.facts,
    required:j.required,preferred:j.preferred,
    notes:j.note
  };
  save();render();toast(j.company+" 공고를 분석 대상으로 선택했습니다.");
}

function applyJobTableAi(){
  const raw=document.getElementById("jobTableAiResult")?.value||state.jobTable.aiResult||"";
  if(!filled(raw)){toast("먼저 AI 답변을 붙여넣어 주세요.");return;}
  const parsed=parseJobTableResult(raw);
  const keys=["customerKpi","tasks","challenge","method","competencies","careerPlan"];
  const count=keys.filter(k=>filled(parsed[k])).length;
  if(!count){toast("6개 제목을 찾지 못했습니다. 직접 입력해 주세요.");return;}
  keys.forEach(k=>{if(filled(parsed[k]))state.jobTable[k]=parsed[k];});
  state.jobTable.aiResult=raw;
  state.postings[0].tasks=state.jobTable.tasks;
  state.competency.top5=state.jobTable.competencies;
  save();render();toast("AI 답변에서 "+count+"개 항목을 직무분석표에 반영했습니다.");
}

function bind(){
  document.querySelectorAll("[data-path]").forEach(e=>{
    const handler=()=>{
      set(e.dataset.path,e.value);
      const preview=document.querySelector('[data-preview="'+e.dataset.path+'"]');
      if(preview)preview.textContent=e.value||"-";
      save();
    };
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-pf]").forEach(e=>{
    const handler=()=>{state.postings[activePosting][e.dataset.pf]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-curated]").forEach(e=>e.onclick=()=>selectCuratedJob(e.dataset.curated));
  document.querySelectorAll("[data-exp]").forEach(e=>{
    const handler=()=>{const i=Number(e.dataset.exp),k=e.dataset.expkey;state.experiences[i]??=emptyExperience();state.experiences[i][k]=e.value;if(i===state.selectedExperience&&k==="title")state.star.experience=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-exp-select]").forEach(e=>e.onchange=()=>{
    if(e.checked){
      state.selectedExperience=Number(e.dataset.expSelect);
      const title=state.experiences[state.selectedExperience]?.title||"";
      if(title)state.star.experience=title;
      save();render();
    }
  });
  document.querySelectorAll("[data-req]").forEach(e=>{
    const handler=()=>{const i=Number(e.dataset.req),k=e.dataset.reqkey;state.requirements[i]??={condition:"",status:"",note:""};state.requirements[i][k]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-next]").forEach(e=>e.onclick=()=>go(Number(e.dataset.next)));
  document.querySelectorAll("[data-prev]").forEach(e=>e.onclick=()=>go(Number(e.dataset.prev)));

  document.getElementById("copySearchPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("searchPromptPreview")?.value||energySearchPrompt(),"내 채용공고 검색 프롬프트를 복사했습니다."));
  document.getElementById("copyReviewedJobPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("jobPromptPreview")?.value||jobAnalysisPrompt(),"내 직무분석 프롬프트를 복사했습니다."));
  document.getElementById("applyJobTableAiBtn")?.addEventListener("click",applyJobTableAi);
  document.getElementById("refreshKeywordPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("keywordPromptPreview");if(e)e.value=competencyKeywordPrompt();toast("현재 전공·경험을 프롬프트에 반영했습니다.");});
  document.getElementById("copyKeywordPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("keywordPromptPreview")?.value||competencyKeywordPrompt(),"내 역량분석 프롬프트를 복사했습니다."));
  document.getElementById("refreshGapPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("gapPromptPreview");if(e)e.value=gapPrompt();toast("현재 스펙·GAP 정보를 프롬프트에 반영했습니다.");});
  document.getElementById("copyGapPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("gapPromptPreview")?.value||gapPrompt(),"내 GAP 분석 프롬프트를 복사했습니다."));
  document.getElementById("copySelfIntroPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("selfIntroPromptPreview")?.value||selfIntroPrompt(),"내 자기소개서 프롬프트를 복사했습니다."));
  document.getElementById("copyInterviewPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("interviewPromptPreview")?.value||interviewPrompt(),"내 면접 프롬프트를 복사했습니다."));
  document.getElementById("docBtn")?.addEventListener("click",exportDoc);
  document.getElementById("printBtn")?.addEventListener("click",()=>window.print());
  document.getElementById("jsonBtn2")?.addEventListener("click",exportJson);
  document.getElementById("copyBtn")?.addEventListener("click",()=>copyText(portfolio(),"Portfolio 텍스트를 복사했습니다."));
  document.getElementById("resetBtn")?.addEventListener("click",()=>{
    if(confirm("Jobfit FLEX 직무분석 데이터만 새로 시작할까요? INJE Jobfit 데이터에는 영향을 주지 않습니다.")){
      localStorage.removeItem(STORAGE_KEY);state=defaults();activePosting=0;render();toast("FLEX 데이터만 초기화했습니다.");
    }
  });
}

function render(){
  nav();
  const pages=[null,step1,step2,step3,step4,step5,step6];
  document.getElementById("stepRoot").innerHTML=pages[state.currentStep]();
  bind();progress();
}

function go(n){
  save();
  state.currentStep=Math.max(1,Math.min(6,n));
  save();render();
  requestAnimationFrame(()=>{
    const root=document.getElementById("stepRoot");
    if(!root)return;
    const mobile=window.matchMedia("(max-width:650px)").matches;
    const offset=mobile?86:24;
    const y=root.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
  });
}

function download(name,content,type){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}

function base(){return "Jobfit_FLEX_"+(state.target.job||"직무분석").replace(/[\\/:*?"<>|]/g,"_");}
function exportJson(){save();download(base()+"_backup.json",JSON.stringify(state,null,2),"application/json;charset=utf-8");toast("FLEX 백업파일을 저장했습니다.");}
function exportDoc(){
  const body=portfolio().split("\n").map(x=>"<p>"+(h(x)||"&nbsp;")+"</p>").join("");
  const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"Malgun Gothic",sans-serif;line-height:1.55;color:#222}p{margin:5px 0}p:first-child{font-size:22px;font-weight:700;margin-bottom:18px}</style></head><body>'+body+"</body></html>";
  download(base()+".doc","\ufeff"+html,"application/msword");toast("Word용 문서를 저장했습니다.");
}
function importJson(file){
  const r=new FileReader();
  r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw new Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(x));state=load();render();toast("FLEX 백업을 불러왔습니다.");}catch(e){toast("Jobfit FLEX 백업파일인지 확인해 주세요.");}};
  r.readAsText(file,"utf-8");
}

document.getElementById("exportJsonBtn").onclick=exportJson;
document.getElementById("importJsonBtn").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=e=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";};

render();

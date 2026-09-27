const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";

const steps = [
  ["Target Job","직무 설정"],
  ["Find JD","채용공고 찾기"],
  ["JD Analyzer","TASK·GATE·KSA"],
  ["My Evidence · STAR+","경험 찾기·심층분해"],
  ["Career Asset Match","Requirement × Evidence"],
  ["Gap & Portfolio","Action Plan"]
];

const emptyPosting=()=>({company:"",title:"",sourceUrl:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const emptyExperience=()=>({title:"",type:"",summary:""});
const emptyMatch=()=>({requirement:"",evidence:"",status:"",note:""});

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
  jobTable:{customerKpi:"",tasks:"",challenge:"",method:"",competencies:"",careerPlan:"",aiResult:""},
  context:{change:"",problem:""},
  profile:{solve:"",output:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",signal:"",top5:""},
  comparison:{common:"",differences:""},
  experiences:[emptyExperience(),emptyExperience(),emptyExperience()],
  selectedExperience:0,
  star:{competency:"",experience:"",situation:"",task:"",actionWhat:"",actionWhy:"",actionHow:"",result:"",evidence:""},
  requirements:[0,1,2].map(()=>({condition:"",status:"",note:""})),
  matchRows:[0,1,2].map(emptyMatch),
  fit:{assets:"",gaps:"",actions:""},
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

    return {
      ...b,...x,version:7,currentStep:mappedStep,
      target:{...b.target,...(x.target||{})},
      student:{...b.student,...(x.student||{})},
      step2Search:{...b.step2Search,...(x.step2Search||{})},
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
    return '<div class="experienceRow '+(state.selectedExperience===i?"selected":"")+'">'+
      '<label class="experiencePick"><input type="radio" name="selectedExperience" data-exp-select="'+i+'" '+(state.selectedExperience===i?"checked":"")+' /> STAR+로 깊게 볼 경험 '+(i+1)+'</label>'+
      '<div class="grid2"><div class="field"><label>경험 이름</label><input class="input" data-exp="'+i+'" data-expkey="title" value="'+h(e.title)+'" placeholder="예: 캡스톤에서 배터리 실험" /></div>'+
      '<div class="field"><label>경험 유형</label><select class="input" data-exp="'+i+'" data-expkey="type">'+opts+'</select></div></div>'+
      '<div class="field"><label>한 줄 메모 <span class="hint">(선택)</span></label><input class="input" data-exp="'+i+'" data-expkey="summary" value="'+h(e.summary)+'" placeholder="예: 실험 데이터를 정리하고 이상값 원인을 확인" /></div>'+
    '</div>';
  }).join("");
}

function jobQuestionHints(){
  const t=(state.target.job+" "+state.postings[0].title).toLowerCase();
  if(/안전|환경|she|품질|qa|qc/.test(t))return ["기준·규정이나 품질 기준을 적용한 경험이 있나요?","이상·위험요인을 어떻게 발견했나요?","재발 방지나 예방을 위해 무엇을 했나요?"];
  if(/생산|공정|설비|정비|운전|기계|전기|전자|전력/.test(t))return ["어떤 회로·설비·공정·데이터를 다뤘나요?","예상과 다른 측정값·동작·고장이 있었나요?","원인을 어떤 순서로 확인했고 무엇을 바꿨나요?"];
  if(/데이터|it|dx|ai|분석/.test(t))return ["어떤 데이터를 사용했나요?","어떤 분석도구·방법을 왜 선택했나요?","분석 결과가 실제 판단이나 개선에 어떻게 쓰였나요?"];
  if(/영업|마케팅|기획|사업/.test(t))return ["누구의 문제를 해결하려 했나요?","어떤 자료·수치를 비교해 판단했나요?","본인의 제안이나 행동이 어떤 결과로 이어졌나요?"];
  return ["가장 어려웠던 문제는 무엇이었나요?","본인이 직접 판단해서 한 행동은 무엇이었나요?","결과를 확인할 수 있는 산출물·수치·변화가 있나요?"];
}

function experiencePrompt(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  const hints=jobQuestionHints();
  return [
    "나는 "+(state.target.job||state.postings[0].title||"희망 직무")+"를 준비하는 대학생이야.","",
    "[채용공고 핵심 요구]",state.competency.top5||state.competency.skill||"(아직 정리 전)","",
    "[내 경험]",e.title||state.star.experience||"(경험 입력 필요)",e.summary||"","",
    "이 경험을 바로 자기소개서로 작성하지 말고, 내 실제 행동을 확인하기 위한 질문을 한 번에 하나씩 해줘.","",
    "공통 질문 순서:",
    "1. 당시 상황",
    "2. 내가 맡은 역할과 해결해야 했던 과제",
    "3. 내가 직접 한 행동 WHAT",
    "4. 왜 그 방법을 선택했는지 WHY",
    "5. 실제로 어떻게 했는지 HOW",
    "6. 결과와 확인 가능한 수치·산출물",
    "7. 이 경험에서 실제로 확인되는 역량",
    "8. 위 채용공고 요구와 연결되는 부분","",
    "직무 맞춤 추가질문 후보:",
    ...hints.map((x,i)=>(i+1)+". "+x),"",
    "질문은 한 번에 하나씩 하고, 내 답을 받은 뒤 다음 질문으로 넘어가.",
    "내가 말하지 않은 행동·수치·성과는 만들지 마.",
    "근거가 부족한 역량은 '확인되지 않음'이라고 표시해줘."
  ].join("\n");
}

function step4(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  if(filled(e.title)&&(!filled(state.star.experience)||state.star.experience!==e.title))state.star.experience=e.title;
  const hints=jobQuestionHints().map(x=>'<li>'+h(x)+'</li>').join("");
  return shell(4,"My Evidence · STAR+","경험을 짧게 꺼낸 뒤 하나를 선택해 STAR+로 깊게 분해합니다. 경험 이름만으로 역량을 확정하지 않습니다.",
    '<div class="block"><h3>① 경험 3개까지 짧게 꺼내기</h3><div class="callout info"><b>짧게 적어도 됩니다.</b> “캡스톤에서 배터리 실험” · “전기회로 프로젝트” · “학생회 총무” · “아르바이트”처럼 시작합니다.</div><div class="experienceList">'+experienceRows()+'</div></div>'+
    '<div class="divider"></div>'+
    '<div class="block starBlock"><h3>② 선택 경험을 STAR+로 확인</h3><div class="selectedEvidence"><span>선택 경험</span><b>'+h(e.title||state.star.experience||"위에서 경험을 하나 선택하세요.")+'</b></div>'+
    '<div class="grid2">'+
      field("star.experience","경험 이름","선택한 경험",false)+
      field("star.competency","연결할 요구역량 후보","예: 전력설비 이해, 데이터 분석, 문제해결",false,true)+
      field("star.situation","S · 상황","언제, 어디서, 어떤 상황이었나요?")+
      field("star.task","T · 역할과 과제","본인의 역할과 해결해야 했던 문제는 무엇이었나요?")+
      field("star.actionWhat","A · WHAT","본인이 직접 한 행동은 무엇인가요?")+
      field("star.actionWhy","A · WHY","왜 그 방법을 선택했나요?")+
      field("star.actionHow","A · HOW","실제로 어떤 순서·도구·방법으로 진행했나요?")+
      field("star.result","R · 결과","무엇이 달라졌나요?")+
      field("star.evidence","EVIDENCE · 확인 가능한 근거","수치, 보고서, 회로도, 시뮬레이션 결과, 기록, 피드백 등이 있나요?")+
    '</div>'+
    '<div class="block"><h3>직무 맞춤 꼬리질문</h3><ul class="questionList">'+hints+'</ul></div>'+
    '<details class="optionBox"><summary>AI로 경험을 더 깊게 질문하기 · 프롬프트 확인</summary><div class="optionBody"><p class="help">아래 문장을 먼저 읽고 필요하면 직접 수정하세요. 바로 복사되지 않습니다.</p><textarea class="promptBox promptEditor" id="experiencePromptPreview">'+h(experiencePrompt())+'</textarea><div class="actions compactActions"><button class="btn ghost" id="refreshExpPromptBtn">현재 입력으로 다시 만들기</button><button class="btn secondary" id="copyReviewedExpPromptBtn">내용 확인 후 프롬프트 복사</button></div></div></details>'+
    '<div class="callout warn"><b>AI 사용 원칙:</b> AI는 질문과 정리를 돕습니다. 학생이 말하지 않은 경험·수치·성과를 만들어내지 않습니다.</div></div>');
}

function ensureRequirements(){
  const src=[...new Set(state.postings.flatMap(p=>filled(p.text)?postingLines(postingSection(p,"required")):[]))].slice(0,4);
  src.forEach((line,i)=>{if(i<4&&!filled(state.requirements[i]?.condition))state.requirements[i].condition=line;});
}

function requirementRows(){
  ensureRequirements();
  return state.requirements.map((r,i)=>'<div class="requirementRow">'+
    '<div class="field"><label>GATE '+(i+1)+'</label><input class="input" data-req="'+i+'" data-reqkey="condition" value="'+h(r.condition)+'" placeholder="관련 전공, 자격증, 학력, 경력 등" /></div>'+
    '<div class="field"><label>현재 상태</label><select class="input" data-req="'+i+'" data-reqkey="status"><option value="">선택</option><option value="충족" '+(r.status==="충족"?"selected":"")+'>충족</option><option value="준비 중" '+(r.status==="준비 중"?"selected":"")+'>준비 중</option><option value="현재 미충족" '+(r.status==="현재 미충족"?"selected":"")+'>현재 미충족</option><option value="해당 없음" '+(r.status==="해당 없음"?"selected":"")+'>해당 없음</option></select></div>'+
    '<div class="field"><label>메모 <span class="hint">(선택)</span></label><input class="input" data-req="'+i+'" data-reqkey="note" value="'+h(r.note)+'" placeholder="증빙·준비계획" /></div>'+
  '</div>').join("");
}

function topRequirements(){
  const all=[state.competency.top5,state.competency.knowledge,state.competency.skill,state.competency.behavior,state.competency.experience];
  return [...new Set(all.flatMap(x=>String(x||"").split(/[\n,;/·]+/).map(y=>y.trim()).filter(Boolean)))].slice(0,5);
}

function ensureMatchRows(){
  const reqs=topRequirements();
  reqs.forEach((x,i)=>{if(i<5&&!filled(state.matchRows[i]?.requirement))state.matchRows[i].requirement=x;});
}

function matchRows(){
  ensureMatchRows();
  return state.matchRows.map((r,i)=>'<div class="matchRow">'+
    '<div class="field"><label>JD Requirement '+(i+1)+'</label><input class="input" data-match="'+i+'" data-matchkey="requirement" value="'+h(r.requirement)+'" placeholder="예: 데이터 분석" /></div>'+
    '<div class="field"><label>나의 Evidence</label><textarea class="input" data-match="'+i+'" data-matchkey="evidence" placeholder="어떤 경험·행동으로 증명할 수 있나요?">'+h(r.evidence)+'</textarea></div>'+
    '<div class="field"><label>판정</label><select class="input" data-match="'+i+'" data-matchkey="status"><option value="">선택</option><option value="직접 근거 있음" '+(r.status==="직접 근거 있음"?"selected":"")+'>● 직접 근거 있음</option><option value="부분적으로 연결됨" '+(r.status==="부분적으로 연결됨"?"selected":"")+'>◐ 부분적으로 연결됨</option><option value="현재 근거 없음" '+(r.status==="현재 근거 없음"?"selected":"")+'>○ 현재 근거 없음</option></select></div>'+
  '</div>').join("");
}

function step5(){
  return shell(5,"Career Asset Match","회사가 요구하는 것과 내가 실제로 증명할 수 있는 것을 나란히 놓고 Fit과 Gap을 구분합니다.",
    '<div class="block"><h3>① 지원 가능 여부 · GATE 확인</h3><div class="requirementList">'+requirementRows()+'</div></div>'+
    '<div class="divider"></div><div class="block"><h3>② JD Requirement × 나의 Evidence</h3><p class="help">숫자 점수 대신 근거 수준으로 판정합니다.</p><div class="matchList">'+matchRows()+'</div></div>'+
    '<div class="callout info"><b>판정 기준:</b> ● 직접 근거 있음 = 실제 행동·결과로 설명 가능 / ◐ 부분적으로 연결됨 = 수업·기초경험 등은 있으나 깊이가 부족 / ○ 현재 근거 없음 = 새 Evidence가 필요</div>');
}

function portfolio(){
  const t=state.target,c=state.context,p=state.profile,k=state.competency,f=state.fit,star=state.star;
  const ps=state.postings.filter(x=>filled(x.text)||filled(x.title)||filled(x.company));
  const req=state.requirements.filter(r=>filled(r.condition));
  const exps=state.experiences.filter(e=>filled(e.title));
  const matches=state.matchRows.filter(r=>filled(r.requirement));
  const a=["MY JOB ANALYSIS PORTFOLIO","",
    "1. TARGET JOB",
    "관심 산업: "+(t.industry||"-"),
    "분석 직무: "+(t.job||"-"),
    "관심 기업: "+(t.company||state.postings[0].company||"-"),
    "분석 전 직무 이미지: "+(t.initialView||"-"),"",
    "2. JOB POSTING"
  ];

  ps.forEach((x,i)=>a.push(
    "[공고 "+(i+1)+"] "+(x.company||"기업명 미입력")+" · "+(x.title||"직무명 미입력"),
    "공고 주소: "+(x.sourceUrl||"-"),
    "TASK: "+(postingSection(x,"tasks")||"-"),
    "GATE: "+(postingSection(x,"required")||"-"),
    "PREFERENCE: "+(postingSection(x,"preferred")||"-"),
    "SELECTION/기타: "+(postingSection(x,"other")||"-"),
    "내가 읽어낸 핵심: "+(x.notes||"-"),""
  ));

  a.push(
    "3. KSA & SIGNAL",
    "Knowledge: "+(k.knowledge||"-"),
    "Skill: "+(k.skill||"-"),
    "Behavior: "+(k.behavior||"-"),
    "Experience: "+(k.experience||"-"),
    "SIGNAL: "+(k.signal||"-"),
    "핵심 요구 TOP 5: "+(k.top5||"-"),""
  );

  if(filled(c.change)||filled(p.solve))a.push(
    "[산업·직무 맥락 메모]",
    "산업 변화: "+(c.change||"-"),
    "기업 과제: "+(c.problem||"-"),
    "직무가 해결하는 문제: "+(p.solve||"-"),
    "직무 결과: "+(p.output||"-"),""
  );

  a.push("4. MY EXPERIENCE LIST");
  if(exps.length)exps.forEach((e,i)=>a.push((i+1)+". "+e.title+" / "+(e.type||"유형 미지정")+(e.summary?" / "+e.summary:"")));
  else a.push("-");

  a.push(
    "","5. STAR+ CAREER EVIDENCE",
    "연결 역량 후보: "+(star.competency||"-"),
    "경험: "+(star.experience||"-"),
    "S 상황: "+(star.situation||"-"),
    "T 역할·과제: "+(star.task||"-"),
    "A WHAT: "+(star.actionWhat||"-"),
    "A WHY: "+(star.actionWhy||"-"),
    "A HOW: "+(star.actionHow||"-"),
    "R 결과: "+(star.result||"-"),
    "EVIDENCE: "+(star.evidence||"-"),"",
    "6. CAREER ASSET MATCH"
  );

  if(matches.length)matches.forEach((r,i)=>a.push((i+1)+". "+r.requirement+" / "+(r.status||"미판정")+" / Evidence: "+(r.evidence||"-")));
  else a.push("-");

  a.push("","7. GATE · GAP · ACTION");
  if(req.length)req.forEach((r,i)=>a.push("GATE "+(i+1)+": "+r.condition+" / "+(r.status||"미선택")+(r.note?" / "+r.note:"")));
  else a.push("GATE 확인: -");

  a.push(
    "현재 강점·자산: "+(f.assets||"-"),
    "핵심 GAP: "+(f.gaps||"-"),
    "3~6개월 행동: "+(f.actions||"-"),"",
    "8. APPLICATION NOTES",
    "[자기소개서 소재] "+(star.experience||"-"),
    "[면접 예상질문]",
    "- 왜 "+(t.job||"관심")+" 직무를 선택했는가?",
    "- 이 직무의 핵심 TASK 3가지는 무엇인가?",
    "- 채용공고에서 확인한 핵심 Requirement는 무엇인가?",
    "- "+(star.competency||"이 직무 역량")+"을 보여주는 경험을 설명해 주세요.",
    "- 그 경험에서 본인이 직접 한 행동은 무엇인가?",
    "- 현재 가장 큰 GAP은 무엇이며 어떻게 보완하고 있는가?"
  );

  return a.join("\n");
}

function step6(){
  const direct=state.matchRows.filter(r=>r.status==="직접 근거 있음").map(r=>r.requirement).join(", ");
  const gaps=state.matchRows.filter(r=>r.status==="현재 근거 없음").map(r=>r.requirement).join(", ");
  if(!filled(state.fit.assets)&&direct)state.fit.assets=direct;
  if(!filled(state.fit.gaps)&&gaps)state.fit.gaps=gaps;

  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 06</div><h2>GAP → ACTION → Portfolio</h2><p>부족한 항목의 우선순위를 정하고, 오늘 분석한 내용을 취업 준비 파일로 남깁니다.</p></div><span class="badge">Portfolio</span></div>'+
    '<div class="block noPrint"><h3>① GAP을 준비 행동으로 바꾸기</h3><p class="help">우선순위는 JD 핵심도 × 현재 GAP × 3~6개월 안에 만들 수 있는 Evidence로 정합니다.</p><div class="grid2">'+
      field("fit.assets","현재 강점·자산","직접 근거가 있는 지식·기술·경험")+
      field("fit.gaps","가장 먼저 보완할 GAP","공고가 중요하게 요구하지만 현재 근거가 없는 것")+
      field("fit.actions","3~6개월 안에 만들 Evidence","프로젝트, 실습, 자격, 현장경험, 데이터 결과물 등")+
    '</div></div>'+
    '<div class="divider noPrint"></div><div class="preview">'+h(portfolio())+'</div>'+
    '<div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>Word에서 열고 수정할 수 있는 .doc 파일입니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 ‘PDF로 저장’을 선택하세요.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>다시 불러올 수 있는 FLEX 전용 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div>'+
    '<div class="actions stepFooter noPrint"><button class="btn secondary" data-prev="5">이전</button><button class="btn secondary" id="copyBtn">결과 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
}

async function copyText(text,msg){
  try{await navigator.clipboard.writeText(text);toast(msg);}catch(e){toast("복사 권한을 확인해 주세요.");}
}

function bind(){
  document.querySelectorAll("[data-path]").forEach(e=>{
    const handler=()=>{set(e.dataset.path,e.value);save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-pf]").forEach(e=>{
    const handler=()=>{state.postings[activePosting][e.dataset.pf]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-tab]").forEach(e=>e.onclick=()=>{save();activePosting=Number(e.dataset.tab);render();});
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
  document.querySelectorAll("[data-match]").forEach(e=>{
    const handler=()=>{const i=Number(e.dataset.match),k=e.dataset.matchkey;state.matchRows[i]??=emptyMatch();state.matchRows[i][k]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-next]").forEach(e=>e.onclick=()=>go(Number(e.dataset.next)));
  document.querySelectorAll("[data-prev]").forEach(e=>e.onclick=()=>go(Number(e.dataset.prev)));

  document.getElementById("parsePostingBtn")?.addEventListener("click",autoParsePosting);
  document.getElementById("refreshJobPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("jobPromptPreview");if(e)e.value=jobAnalysisPrompt();toast("현재 입력으로 프롬프트를 다시 만들었습니다.");});
  document.getElementById("copyReviewedJobPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("jobPromptPreview")?.value||jobAnalysisPrompt(),"확인한 직무분석 AI 프롬프트를 복사했습니다."));
  document.getElementById("refreshExpPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("experiencePromptPreview");if(e)e.value=experiencePrompt();toast("현재 입력으로 프롬프트를 다시 만들었습니다.");});
  document.getElementById("copyReviewedExpPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("experiencePromptPreview")?.value||experiencePrompt(),"확인한 경험 심층질문 AI 프롬프트를 복사했습니다."));
  document.getElementById("docBtn")?.addEventListener("click",exportDoc);
  document.getElementById("printBtn")?.addEventListener("click",()=>window.print());
  document.getElementById("jsonBtn2")?.addEventListener("click",exportJson);
  document.getElementById("copyBtn")?.addEventListener("click",()=>copyText(portfolio(),"결과 텍스트를 복사했습니다."));
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

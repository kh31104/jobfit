const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";

const steps = [
  ["Target Job","직무 설정"],
  ["Find JD","채용공고 찾기"],
  ["JD Analyzer","TASK·GATE·KSA"],
  ["My Evidence","경험 찾기"],
  ["Evidence Interview","STAR+"],
  ["Career Asset Match","Requirement × Evidence"],
  ["Gap & Portfolio","Action Plan"]
];

const emptyPosting=()=>({company:"",title:"",sourceUrl:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const emptyExperience=()=>({title:"",type:"",summary:""});
const emptyMatch=()=>({requirement:"",evidence:"",status:"",note:""});

const defaults=()=>({
  version:5,currentStep:1,updatedAt:"",
  target:{industry:"",job:"",company:"",initialView:""},
  context:{change:"",problem:""},
  profile:{solve:"",output:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",signal:"",top5:""},
  comparison:{common:"",differences:""},
  experiences:[emptyExperience(),emptyExperience(),emptyExperience()],
  selectedExperience:0,
  star:{competency:"",experience:"",situation:"",task:"",actionWhat:"",actionWhy:"",actionHow:"",result:"",evidence:""},
  requirements:[0,1,2,3].map(()=>({condition:"",status:"",note:""})),
  matchRows:[0,1,2,3,4].map(emptyMatch),
  fit:{assets:"",gaps:"",actions:""}
});

let state=load(), activePosting=0;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!x)return defaults();
    const b=defaults();
    const legacyStep=Number(x.currentStep||1);
    const mappedStep=(x.version||1)<5
      ? ({1:1,2:2,3:3,4:3,5:5,6:7,7:7,8:7}[legacyStep]||1)
      : Math.max(1,Math.min(7,legacyStep));

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
      ? [0,1,2,3].map(i=>({condition:"",status:"",note:"",...(x.requirements[i]||{})}))
      : b.requirements;

    const oldMatches=Array.isArray(x.matchRows)?x.matchRows:(Array.isArray(x.matches)?x.matches:[]);
    const matchRows=[0,1,2,3,4].map(i=>({...emptyMatch(),...(oldMatches[i]||{})}));

    const star={
      ...b.star,...oldStar,
      experience:oldStar.experience||x.fit?.evidence||experiences[0]?.title||"",
      situation:oldStar.situation||oldStar.situationTask||"",
      actionWhat:oldStar.actionWhat||oldStar.action||""
    };

    return {
      ...b,...x,version:5,currentStep:mappedStep,
      target:{...b.target,...(x.target||{})},
      context:{...b.context,...(x.context||{})},
      profile:{...b.profile,...(x.profile||{})},
      competency:{...b.competency,...(x.competency||{})},
      comparison:{...b.comparison,...(x.comparison||{})},
      postings,experiences,requirements,matchRows,star,
      selectedExperience:Math.max(0,Math.min(2,Number(x.selectedExperience||0))),
      fit:{...b.fit,...(x.fit||{})}
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
  if(n===1)return filled(state.target.industry)&&filled(state.target.job);
  if(n===2){const p=state.postings[0];return filled(p.sourceUrl)||filled(p.company)||filled(p.title)||filled(p.text);}
  if(n===3)return state.postings.some(p=>filled(p.text))&&Object.values(state.competency).some(filled);
  if(n===4)return state.experiences.some(e=>filled(e.title));
  if(n===5)return filled(state.star.experience)&&(filled(state.star.actionWhat)||filled(state.star.result));
  if(n===6)return state.matchRows.some(m=>filled(m.requirement)&&filled(m.status));
  if(n===7)return done(1)&&done(3)&&done(4);
}

function nav(){
  document.getElementById("stepNav").innerHTML='<div class="navTitle">JOB ANALYSIS</div>'+steps.map((s,i)=>{
    const n=i+1,d=done(n),a=state.currentStep===n;
    return '<button class="stepBtn '+(a?"active ":"")+(d?"done":"")+'" data-step="'+n+'"><span class="stepN">'+(d?"✓":String(n).padStart(2,"0"))+'</span><span class="stepText">'+s[0]+'<small>'+s[1]+'</small></span></button>';
  }).join("");
  document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>go(Number(b.dataset.step)));
}

function progress(){
  const n=steps.filter((_,i)=>done(i+1)).length,p=Math.round(n/7*100);
  const l=document.getElementById("progressLabel"),b=document.getElementById("progressBar");
  if(l)l.textContent="진행 "+p+"% · "+n+"/7";
  if(b)b.style.width=p+"%";
  nav();
}

function shell(n,title,desc,body,badge="실습"){
  return '<section class="card stepCard"><div class="sectionHead"><div><div class="kicker">STEP '+String(n).padStart(2,"0")+'</div><h2>'+title+'</h2><p>'+desc+'</p></div><span class="badge">'+badge+'</span></div>'+body+'<div class="actions">'+(n>1?'<button class="btn secondary" data-prev="'+(n-1)+'">이전</button>':"")+(n<7?'<button class="btn primary" data-next="'+(n+1)+'">저장하고 다음</button>':"")+'</div></section>';
}

function step1(){
  return shell(1,"Target Job","수업에서 정한 산업과 직무를 FLEX의 분석 대상으로 확정합니다.",
    '<div class="grid2">'+
      field("target.industry","관심 산업","예: 전력망·전력공급, 발전, LNG·수소, ESS·전력기기",false)+
      field("target.job","분석할 직무","예: 발전운영·정비, 안전·환경, 생산기술, 품질관리",false)+
      field("target.company","관심 기업","아직 없다면 비워도 됩니다.",false,true)+
      field("target.initialView","지금 생각하는 이 직무","이 직무는 회사에서 어떤 문제를 해결하는 사람이라고 생각하나요?")+
    '</div>'+
    '<details class="optionBox"><summary>수업에서 정리한 산업·직무 맥락도 남기기 · 선택</summary><div class="optionBody"><div class="grid2">'+
      field("context.change","최근 산업 변화","기술·정책·시장 변화 중 직무와 관련된 것",true,true)+
      field("context.problem","기업이 해결해야 할 문제","산업 변화 때문에 기업이 해결해야 하는 과제",true,true)+
      field("profile.solve","이 직무가 해결하는 문제","직무가 맡는 문제를 한 문장으로",true,true)+
      field("profile.output","이 직무가 만들어야 하는 결과","안정운전, 품질, 생산성, 매출, 납기 등",true,true)+
    '</div></div></details>'+
    '<div class="callout good"><b>수업 문장:</b> “나는 ______ 문제를 해결하는 ______ 직무를 준비한다.”</div>');
}

function jobSite(name,url,desc){
  return '<a class="jobSite" href="'+url+'" target="_blank" rel="noopener"><b>'+name+'</b><span>'+desc+'</span></a>';
}

function step2(){
  const p=state.postings[0];
  return shell(2,"Find JD","오늘 분석할 실제 채용공고 1개를 찾습니다. 공고 2·3개 비교는 심화활동입니다.",
    '<div class="block"><h3>① 채용공고 찾기</h3><div class="siteSection"><b>민간기업</b><div class="jobSiteGrid">'+
      jobSite("사람인","https://www.saramin.co.kr/","민간기업·신입/경력")+
      jobSite("잡코리아","https://www.jobkorea.co.kr/","민간기업·공채")+
      jobSite("인크루트","https://www.incruit.com/","민간·공공 채용")+
      jobSite("고용24","https://www.work24.go.kr/","정부 통합 채용정보")+
    '</div></div><div class="siteSection"><b>공공기관</b><div class="jobSiteGrid">'+
      jobSite("잡알리오","https://job.alio.go.kr/","국가 공공기관 채용")+
      jobSite("클린아이 잡플러스","https://job.cleaneye.go.kr/","지방공공기관 채용")+
    '</div></div></div>'+
    '<div class="block"><h3>② 오늘 분석할 공고 기록</h3><div class="grid2">'+
      '<div class="field"><label>기업명</label><input class="input" data-pf="company" value="'+h(p.company)+'" placeholder="예: 한국남부발전" /></div>'+
      '<div class="field"><label>공고 직무명</label><input class="input" data-pf="title" value="'+h(p.title)+'" placeholder="공고에 적힌 직무명" /></div>'+
      '<div class="field span2"><label>채용공고 주소 <span class="hint">(선택)</span></label><input class="input" data-pf="sourceUrl" value="'+h(p.sourceUrl)+'" placeholder="https://..." /></div>'+
    '</div><div class="callout info"><b>기본 실습:</b> 공고 1개면 충분합니다. 담당업무·지원자격·우대사항이 보이도록 다음 STEP에 붙여넣으세요.</div></div>');
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

function jobAnalysisPrompt(){
  const p=state.postings[activePosting];
  return [
    "나는 대학생이며 "+(state.target.job||p.title||"희망 직무")+"를 분석하고 있다.","",
    "[실제 채용공고]",p.text||"(공고 원문을 입력하세요)","",
    "다음 기준으로 분석해줘.",
    "1. 공고에서 직접 확인되는 TASK(담당업무)",
    "2. GATE(필수·지원자격)",
    "3. PREFERENCE(우대조건)",
    "4. Knowledge / Skill / Behavior / Experience",
    "5. 반복되거나 강조되는 SIGNAL",
    "6. 업무내용을 바탕으로 추정할 수 있는 KPI/KBI 후보",
    "7. 대학생이 준비할 수 있는 Evidence","",
    "반드시 [공고 직접근거]와 [추론]을 구분해줘.",
    "공고에 없는 사실을 공고에 적혀 있는 것처럼 표현하지 말고, 확인할 수 없는 KPI·KBI는 '공고만으로 확인 불가'라고 표시해줘."
  ].join("\n");
}

function step3(){
  const p=state.postings[activePosting];
  const tabs=state.postings.map((_,i)=>'<button class="tabBtn '+(i===activePosting?"active":"")+'" data-tab="'+i+'">'+(i===0?"공고 1 · 기본 분석":"공고 "+(i+1)+" · 심화 선택")+'</button>').join("");
  const cards=Object.entries(signals()).map(([cat,items])=>'<div class="signalCard"><h4>'+cat+'</h4><div class="pills">'+(items.length?items.slice(0,10).map(x=>'<span class="pill">'+h(x.w)+' <strong>'+x.count+'</strong></span>').join(""):'<span class="hint">발견된 후보가 없습니다.</span>')+'</div></div>').join("");
  const evidence=evidenceRows();
  const trs=evidence.length?evidence.slice(0,45).map(r=>'<tr><td>공고 '+r.posting+'</td><td>'+h(r.section)+'</td><td>'+h(r.line)+'</td><td>'+signalLabel(r.signals)+'</td></tr>').join(""):'<tr><td colspan="4">채용공고를 입력하면 원문 근거표가 만들어집니다.</td></tr>';

  return shell(3,"JD Analyzer","TASK → GATE/PREFERENCE → KSA → SIGNAL 순서로 회사가 원하는 것을 분리합니다.",
    '<div class="postingTabs">'+tabs+'</div>'+
    '<div class="grid2"><div class="field"><label>기업명</label><input class="input" data-pf="company" value="'+h(p.company)+'" /></div><div class="field"><label>공고 직무명</label><input class="input" data-pf="title" value="'+h(p.title)+'" /></div></div>'+
    '<div class="block"><div class="field"><label>채용공고 원문</label><textarea class="input tall" data-pf="text" placeholder="담당업무, 자격요건, 우대사항이 보이도록 붙여넣으세요.">'+h(p.text)+'</textarea></div><div class="actions compactActions"><button class="btn secondary" id="parsePostingBtn">TASK·조건 자동 나누기</button></div></div>'+
    '<div class="block"><h3>① TASK · GATE · PREFERENCE</h3><div class="grid2">'+
      '<div class="field"><label>TASK · 담당업무</label><textarea class="input" data-pf="tasks" placeholder="실제로 하게 될 일">'+h(p.tasks)+'</textarea></div>'+
      '<div class="field"><label>GATE · 필수/지원자격</label><textarea class="input" data-pf="required" placeholder="지원 가능한 최소 조건">'+h(p.required)+'</textarea></div>'+
      '<div class="field"><label>PREFERENCE · 우대사항</label><textarea class="input" data-pf="preferred" placeholder="있으면 경쟁력이 되는 조건">'+h(p.preferred)+'</textarea></div>'+
      '<div class="field"><label>SELECTION/기타</label><textarea class="input" data-pf="other" placeholder="전형절차·근무조건·기타">'+h(p.other)+'</textarea></div>'+
    '</div><div class="field"><label>내가 읽어낸 핵심</label><textarea class="input" data-pf="notes" placeholder="이 회사가 이 직무 사람에게 실제로 시키려는 일은?">'+h(p.notes)+'</textarea></div></div>'+
    '<div class="divider"></div><div class="block"><h3>② KSA · 업무수행에 필요한 것</h3><div class="grid2">'+
      field("competency.knowledge","Knowledge · 지식","전공지식, 산업·공정·제품·법규 등")+
      field("competency.skill","Skill · 기술","설계, 데이터분석, CAD, Excel, Python 등")+
      field("competency.behavior","Behavior · 행동/업무방식","공고에서 직접 확인되는 협업·정확성·문제해결 등")+
      field("competency.experience","Experience · 경험","인턴, 프로젝트, 실험, 현장실습 등")+
    '</div><div class="callout warn"><b>근거 원칙:</b> 공고에서 직접 확인되지 않는 Behavior는 “확인되지 않음”으로 두어도 됩니다.</div></div>'+
    '<div class="block"><h3>③ SIGNAL · 반복·강조 신호</h3>'+field("competency.signal","이 회사·직무가 강조하는 신호","예: 안전, 데이터, 품질, 공정개선, 글로벌, 고객")+field("competency.top5","핵심 요구 TOP 5","공고 원문에서 근거를 찾을 수 있는 항목 5개")+'</div>'+
    '<details class="optionBox"><summary>근거 확인 · 원문 문장과 키워드 보기</summary><div class="optionBody"><div class="tableWrap"><table><thead><tr><th>공고</th><th>구분</th><th>원문 근거</th><th>분류 후보</th></tr></thead><tbody>'+trs+'</tbody></table></div><div class="signalGrid">'+cards+'</div></div></details>'+
    '<details class="optionBox"><summary>AI로 더 깊게 분석하기 · 프롬프트 생성</summary><div class="optionBody"><p class="help">AI 결과는 공고 원문과 다시 대조하세요.</p><pre class="promptBox">'+h(jobAnalysisPrompt())+'</pre><button class="btn secondary" id="copyJobPromptBtn">AI 분석 프롬프트 복사</button></div></details>'+
    optionalComparison());
}

const expTypes=["","전공수업","프로젝트·캡스톤","인턴·현장실습","아르바이트","학생회·동아리","공모전·대외활동","연구·실험","자격·교육","개인경험","기타"];

function experienceRows(){
  return state.experiences.map((e,i)=>{
    const opts=expTypes.map(x=>'<option value="'+h(x)+'" '+(e.type===x?"selected":"")+'>'+(x||"유형 선택")+'</option>').join("");
    return '<div class="experienceRow '+(state.selectedExperience===i?"selected":"")+'">'+
      '<label class="experiencePick"><input type="radio" name="selectedExperience" data-exp-select="'+i+'" '+(state.selectedExperience===i?"checked":"")+' /> 심층분해할 경험 '+(i+1)+'</label>'+
      '<div class="grid2"><div class="field"><label>경험 이름</label><input class="input" data-exp="'+i+'" data-expkey="title" value="'+h(e.title)+'" placeholder="예: 캡스톤에서 배터리 실험" /></div>'+
      '<div class="field"><label>경험 유형</label><select class="input" data-exp="'+i+'" data-expkey="type">'+opts+'</select></div></div>'+
      '<div class="field"><label>한 줄 메모 <span class="hint">(선택)</span></label><input class="input" data-exp="'+i+'" data-expkey="summary" value="'+h(e.summary)+'" placeholder="예: 실험 데이터를 정리하고 이상값 원인을 확인" /></div>'+
    '</div>';
  }).join("");
}

function step4(){
  return shell(4,"My Evidence","STAR부터 쓰지 않습니다. 먼저 이 직무와 연결해볼 경험을 짧게 3개까지 꺼내봅니다.",
    '<div class="callout info"><b>짧게 적어도 됩니다.</b> “편의점 알바 1년” · “캡스톤에서 배터리 실험” · “학생회 총무” · “공모전 참가” · “품질관리 수업에서 Minitab 사용”</div>'+
    '<div class="experienceList">'+experienceRows()+'</div>'+
    '<div class="callout warn"><b>아직 역량을 확정하지 않습니다.</b> 경험 이름만 보고 ‘리더십·문제해결’이라고 판단하지 않고, 다음 STEP에서 실제 행동을 확인합니다.</div>');
}

function jobQuestionHints(){
  const t=(state.target.job+" "+state.postings[0].title).toLowerCase();
  if(/안전|환경|she|품질|qa|qc/.test(t))return ["기준·규정이나 품질 기준을 적용한 경험이 있나요?","이상·위험요인을 어떻게 발견했나요?","재발 방지나 예방을 위해 무엇을 했나요?"];
  if(/생산|공정|설비|정비|운전|기계|전기/.test(t))return ["어떤 공정·설비·데이터를 다뤘나요?","예상과 다른 결과나 고장이 있었나요?","원인을 어떤 순서로 확인했고 무엇을 바꿨나요?"];
  if(/데이터|it|dx|ai|분석/.test(t))return ["어떤 데이터를 사용했나요?","어떤 분석도구·방법을 왜 선택했나요?","분석 결과가 실제 판단이나 개선에 어떻게 쓰였나요?"];
  if(/영업|마케팅|기획|사업/.test(t))return ["누구의 문제를 해결하려 했나요?","어떤 자료·수치를 비교해 판단했나요?","본인의 제안이나 행동이 어떤 결과로 이어졌나요?"];
  return ["가장 어려웠던 문제는 무엇이었나요?","본인이 직접 판단해서 한 행동은 무엇이었나요?","결과를 확인할 수 있는 산출물·수치·변화가 있나요?"];
}

function experiencePrompt(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  return [
    "나는 "+(state.target.job||state.postings[0].title||"희망 직무")+"를 준비하는 대학생이야.","",
    "[채용공고 핵심 요구]",state.competency.top5||state.competency.skill||"(아직 정리 전)","",
    "[내 경험]",e.title||state.star.experience||"(경험 입력 필요)",e.summary||"","",
    "이 경험을 바로 자기소개서로 작성하지 말고, 내 실제 행동을 확인하기 위한 질문을 한 번에 하나씩 해줘.","",
    "질문 순서:",
    "1. 당시 상황",
    "2. 내가 맡은 역할과 해결해야 했던 과제",
    "3. 내가 직접 한 행동 WHAT",
    "4. 왜 그 방법을 선택했는지 WHY",
    "5. 실제로 어떻게 했는지 HOW",
    "6. 결과와 확인 가능한 수치·산출물",
    "7. 이 경험에서 실제로 확인되는 역량",
    "8. 위 채용공고 요구와 연결되는 부분","",
    "내가 말하지 않은 행동·수치·성과는 만들지 마.",
    "근거가 부족한 역량은 '확인되지 않음'이라고 표시해줘."
  ].join("\n");
}

function step5(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  if(filled(e.title)&&!filled(state.star.experience))state.star.experience=e.title;
  const hints=jobQuestionHints().map(x=>'<li>'+h(x)+'</li>').join("");
  return shell(5,"Evidence Interview","선택한 경험 하나를 STAR+로 깊게 파고, 실제 행동과 결과가 확인된 뒤에만 역량을 붙입니다.",
    '<div class="selectedEvidence"><span>선택 경험</span><b>'+h(e.title||state.star.experience||"STEP 4에서 경험을 선택하세요.")+'</b></div>'+
    '<div class="grid2">'+
      field("star.experience","경험 이름","선택한 경험",false)+
      field("star.competency","연결할 요구역량 후보","예: 데이터 분석, 설비 이해, 품질관리",false,true)+
      field("star.situation","S · 상황","언제, 어디서, 어떤 상황이었나요?")+
      field("star.task","T · 역할과 과제","본인의 역할과 해결해야 했던 문제는 무엇이었나요?")+
      field("star.actionWhat","A · WHAT","본인이 직접 한 행동은 무엇인가요?")+
      field("star.actionWhy","A · WHY","왜 그 방법을 선택했나요?")+
      field("star.actionHow","A · HOW","실제로 어떤 순서·도구·방법으로 진행했나요?")+
      field("star.result","R · 결과","무엇이 달라졌나요?")+
      field("star.evidence","EVIDENCE · 확인 가능한 근거","수치, 보고서, 결과물, 기록, 피드백 등이 있나요?")+
    '</div>'+
    '<div class="block"><h3>직무 맞춤 꼬리질문</h3><ul class="questionList">'+hints+'</ul></div>'+
    '<div class="actions compactActions"><button class="btn secondary" id="copyExpPromptBtn">AI 추가질문 프롬프트 복사</button></div>'+
    '<div class="callout warn"><b>AI 사용 원칙:</b> AI는 질문과 정리를 돕습니다. 학생이 말하지 않은 경험·수치·성과를 만들어내지 않습니다.</div>');
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

function step6(){
  return shell(6,"Career Asset Match","회사가 요구하는 것과 내가 실제로 증명할 수 있는 것을 나란히 놓고 Fit과 Gap을 구분합니다.",
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

function step7(){
  const direct=state.matchRows.filter(r=>r.status==="직접 근거 있음").map(r=>r.requirement).join(", ");
  const gaps=state.matchRows.filter(r=>r.status==="현재 근거 없음").map(r=>r.requirement).join(", ");
  if(!filled(state.fit.assets)&&direct)state.fit.assets=direct;
  if(!filled(state.fit.gaps)&&gaps)state.fit.gaps=gaps;

  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 07</div><h2>GAP → ACTION → Portfolio</h2><p>부족한 항목의 우선순위를 정하고, 오늘 분석한 내용을 취업 준비 파일로 남깁니다.</p></div><span class="badge">Portfolio</span></div>'+
    '<div class="block noPrint"><h3>① GAP을 준비 행동으로 바꾸기</h3><p class="help">우선순위는 JD 핵심도 × 현재 GAP × 3~6개월 안에 만들 수 있는 Evidence로 정합니다.</p><div class="grid2">'+
      field("fit.assets","현재 강점·자산","직접 근거가 있는 지식·기술·경험")+
      field("fit.gaps","가장 먼저 보완할 GAP","공고가 중요하게 요구하지만 현재 근거가 없는 것")+
      field("fit.actions","3~6개월 안에 만들 Evidence","프로젝트, 실습, 자격, 현장경험, 데이터 결과물 등")+
    '</div></div>'+
    '<div class="divider noPrint"></div><div class="preview">'+h(portfolio())+'</div>'+
    '<div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>Word에서 열고 수정할 수 있는 .doc 파일입니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 ‘PDF로 저장’을 선택하세요.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>다시 불러올 수 있는 FLEX 전용 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div>'+
    '<div class="actions noPrint"><button class="btn secondary" data-prev="6">이전</button><button class="btn secondary" id="copyBtn">결과 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
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
    const handler=()=>{const i=Number(e.dataset.exp),k=e.dataset.expkey;state.experiences[i]??=emptyExperience();state.experiences[i][k]=e.value;save();};
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
  document.getElementById("copyJobPromptBtn")?.addEventListener("click",()=>copyText(jobAnalysisPrompt(),"직무분석 AI 프롬프트를 복사했습니다."));
  document.getElementById("copyExpPromptBtn")?.addEventListener("click",()=>copyText(experiencePrompt(),"경험 심층질문 AI 프롬프트를 복사했습니다."));
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
  const pages=[null,step1,step2,step3,step4,step5,step6,step7];
  document.getElementById("stepRoot").innerHTML=pages[state.currentStep]();
  bind();progress();
}

function go(n){
  save();
  state.currentStep=Math.max(1,Math.min(7,n));
  save();render();
  window.scrollTo({top:280,behavior:"smooth"});
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

const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";
const steps = [
  ["분석대상 선택","Target Job"],
  ["채용공고 찾기","Find JD"],
  ["JD Analyzer","Task·Gate·KSA"],
  ["나의 경험 찾기","My Evidence"],
  ["경험 분해","STAR+ Interview"],
  ["Career Asset Match","Requirement × Evidence"],
  ["GAP & Portfolio","Action Plan"]
];
const emptyPosting=()=>({company:"",title:"",sourceUrl:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const emptyExperience=()=>({title:"",type:"",summary:""});
const emptyMatch=()=>({requirement:"",evidence:"",status:""});
const defaults=()=>({
  version:5,currentStep:1,updatedAt:"",
  target:{industry:"",job:"",company:"",initialView:""},
  context:{money:"",change:"",problem:"",impact:""},
  profile:{manage:"",solve:"",collab:"",data:"",output:"",risk:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",top5:""},
  comparison:{common:"",differences:""},
  experiences:[emptyExperience(),emptyExperience(),emptyExperience()],
  selectedExperience:0,
  fit:{assets:"",evidence:"",gaps:"",actions:""},
  requirements:[0,1,2,3].map(()=>({condition:"",status:"",note:""})),
  star:{competency:"",experience:"",situation:"",task:"",actionWhat:"",actionWhy:"",actionHow:"",result:"",evidence:""},
  matchRows:[0,1,2,3,4].map(emptyMatch)
});
let state=load(), activePosting=0;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!x)return defaults();
    const b=defaults();
    const legacyStep=Number(x.currentStep||1);
    const oldSix=(x.version||1)<3
      ? ({1:1,2:2,3:2,4:3,5:4,6:4,7:5,8:6}[legacyStep]||1)
      : Math.max(1,Math.min(6,legacyStep));
    const mappedStep=(x.version||1)<5
      ? ({1:1,2:1,3:3,4:3,5:5,6:7}[oldSix]||1)
      : Math.max(1,Math.min(7,legacyStep));
    const req=Array.isArray(x.requirements)&&x.requirements.length
      ? [0,1,2,3].map(i=>({condition:"",status:"",note:"",...(x.requirements[i]||{})}))
      : b.requirements;
    const oldStar=x.star||{};
    const legacyEvidence=(x.fit&&x.fit.evidence)||"";
    const exps=Array.isArray(x.experiences)&&x.experiences.length
      ? [0,1,2].map(i=>({...emptyExperience(),...(x.experiences[i]||{})}))
      : [0,1,2].map(i=>i===0?{...emptyExperience(),title:oldStar.experience||legacyEvidence}:emptyExperience());
    const matches=Array.isArray(x.matchRows)&&x.matchRows.length
      ? [0,1,2,3,4].map(i=>({...emptyMatch(),...(x.matchRows[i]||{})}))
      : b.matchRows;
    return {
      ...b,...x,version:5,currentStep:mappedStep,
      target:{...b.target,...(x.target||{})},
      context:{...b.context,...(x.context||{})},
      profile:{...b.profile,...(x.profile||{})},
      competency:{...b.competency,...(x.competency||{})},
      comparison:{...b.comparison,...(x.comparison||{})},
      fit:{...b.fit,...(x.fit||{})},
      requirements:req,
      experiences:exps,
      selectedExperience:Number.isInteger(x.selectedExperience)?Math.max(0,Math.min(2,x.selectedExperience)):0,
      star:{
        ...b.star,...oldStar,
        experience:oldStar.experience||legacyEvidence||exps[0].title||"",
        situation:oldStar.situation||oldStar.situationTask||"",
        actionWhat:oldStar.actionWhat||oldStar.action||"",
        result:oldStar.result||""
      },
      matchRows:matches,
      postings:[0,1,2].map(i=>({...emptyPosting(),...(x.postings?.[i]||{})}))
    };
  }catch(e){return defaults();}
}
function save(){
  state.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const s=document.getElementById("saveState");
  if(s)s.textContent="저장됨 "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  progress();
}
function h(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function get(path){return path.split(".").reduce((o,k)=>o?.[k],state);}
function set(path,val){const a=path.split(".");let o=state;a.slice(0,-1).forEach(k=>{o[k]??={};o=o[k];});o[a.at(-1)]=val;}
function filled(v){return String(v||"").trim().length>0;}
function toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),1800);}
function field(path,label,ph,area=true,optional=false){
  const val=h(get(path)||"");
  const opt=optional?' <span class="hint">(선택)</span>':"";
  if(area)return '<div class="field"><label>'+label+opt+'</label><textarea class="input" data-path="'+path+'" placeholder="'+h(ph)+'">'+val+'</textarea></div>';
  return '<div class="field"><label>'+label+opt+'</label><input class="input" data-path="'+path+'" value="'+val+'" placeholder="'+h(ph)+'" /></div>';
}
function done(n){
  if(n===1)return filled(state.target.industry)&&filled(state.target.job);
  if(n===2)return state.postings.some(p=>filled(p.sourceUrl)||filled(p.company)||filled(p.title)||filled(p.text));
  if(n===3)return state.postings.some(p=>filled(p.text));
  if(n===4)return state.experiences.some(e=>filled(e.title));
  if(n===5)return filled(state.star.experience)&&filled(state.star.actionWhat);
  if(n===6)return state.matchRows.some(r=>filled(r.status));
  if(n===7)return filled(state.fit.gaps)||filled(state.fit.actions)||done(6);
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
  return shell(1,"분석대상 선택","오늘 깊게 볼 산업과 직무를 하나 정합니다.",
    '<div class="grid2">'+field("target.industry","관심 산업","예: 에너지, 반도체, 조선, 금융",false)+field("target.job","분석할 직무","예: 생산기술, 품질관리, 영업, 재무",false)+field("target.company","관심 기업","특정 기업이 있으면 입력",false,true)+field("target.initialView","지금 생각하는 이 직무","이 직무는 회사에서 어떤 문제를 해결하는 사람이라고 생각하나요?")+'</div><div class="callout info"><b>먼저 내 생각을 적습니다.</b> 실제 채용공고를 본 뒤 직무 이해가 어떻게 달라졌는지 비교합니다.</div>');
}
function step2(){
  const guide=
    '<div class="sourceGuide"><div class="sourceGuideHead"><div><b>자료찾기 가이드</b><span>모든 자료를 다 볼 필요는 없습니다. 오늘 직무를 이해하는 데 필요한 공식자료 1~2개만 확인하세요.</span></div></div>'+
    '<div class="sourceGrid">'+
      '<div class="sourceCard"><span class="sourceN">1</span><div><b>기업 공식 홈페이지·IR</b><p>무엇을 만들고 파는지, 최근 어떤 사업에 투자하는지 확인</p></div></div>'+
      '<div class="sourceCard"><span class="sourceN">2</span><div><b>DART 사업보고서</b><p>주요 사업·시장·위험요인을 확인할 때 사용</p><a href="https://dart.fss.or.kr/" target="_blank" rel="noopener">DART 열기</a></div></div>'+
      '<div class="sourceCard"><span class="sourceN">3</span><div><b>공공 통계·산업자료</b><p>산업 규모·고용·생산 변화가 필요할 때 사용</p><a href="https://kosis.kr/" target="_blank" rel="noopener">KOSIS 열기</a></div></div>'+
      '<div class="sourceCard"><span class="sourceN">4</span><div><b>실제 채용공고</b><p>산업 변화가 실제 업무·자격·우대조건에 어떻게 나타나는지 확인</p><a href="https://www.work24.go.kr/" target="_blank" rel="noopener">고용24 열기</a></div></div>'+
    '</div><div class="callout info"><b>검색어 예시:</b> “기업명 + 사업보고서”, “산업명 + 통계”, “직무명 + 신입 채용”. 블로그 요약보다 원문을 먼저 봅니다.</div></div>';
  return shell(2,"산업·기업·직무 맥락","네 질문만 먼저 답해 산업의 변화가 실제 직무의 일로 어떻게 이어지는지 정리합니다.",
    guide+
    '<div class="block"><h3>필수 · 네 질문만 작성</h3><div class="grid2">'+
      field("context.change","① 최근 이 산업에서 무엇이 바뀌고 있는가?","기술, 정책, 고객, 경쟁, 원가, 공급망 중 핵심 변화 1~2개")+
      field("context.problem","② 그 변화 때문에 기업은 어떤 문제를 해결해야 하는가?","비용, 품질, 안전, 납기, 고객, 기술 과제 등")+
      field("profile.solve","③ 내가 선택한 직무는 그중 어떤 문제를 해결하는가?","이 직무가 맡는 문제를 한 문장으로")+
      field("profile.output","④ 그 직무가 만들어야 하는 결과는 무엇인가?","수율 향상, 매출, 안정적 운영, 납기 준수 등")+
    '</div></div>'+
    '<details class="optionBox"><summary>더 알아보기 · 필요할 때만 작성</summary><div class="optionBody"><div class="grid2">'+
      field("context.money","이 산업·기업은 무엇으로 돈을 버는가?","핵심 제품·서비스와 고객",true,true)+
      field("context.impact","산업 변화가 이 직무에 어떤 영향을 주는가?","업무가 늘거나 바뀌는 지점",true,true)+
      field("profile.manage","무엇을 관리하거나 다루는가?","공정, 고객, 비용, 설비, 일정, 데이터 등",true,true)+
      field("profile.collab","누구와 함께 일하는가?","내부 부서, 현장, 고객, 협력사 등",true,true)+
      field("profile.data","어떤 정보·데이터를 보는가?","생산실적, 매출, 품질지표, 시장자료 등",true,true)+
      field("profile.risk","잘못하면 어떤 문제가 생기는가?","비용 증가, 사고, 불량, 일정 지연 등",true,true)+
    '</div></div></details>'+
    '<div class="callout good"><b>정리 기준:</b> 산업 변화 → 기업의 문제 → 직무가 해결할 문제 → 만들어야 할 결과가 한 줄로 이어지면 충분합니다.</div>');
}
function postingLines(text=""){
  return String(text).split(/\r?\n/).map(x=>x.replace(/^[\s·•▶▷■□▪\-–—*]+/,"").trim()).filter(Boolean);
}
const sectionRules=[
  ["tasks",/(담당\s*업무|주요\s*업무|업무\s*내용|직무\s*내용|수행\s*업무|주요\s*역할|하는\s*일)/i],
  ["required",/(자격\s*요건|지원\s*자격|필수\s*요건|필수\s*사항|필수\s*조건|요구\s*사항)/i],
  ["preferred",/(우대\s*사항|우대\s*조건|우대\s*요건|preferred)/i],
  ["other",/(기타|근무\s*조건|복리\s*후생|채용\s*절차|전형\s*절차)/i]
];
function lineSection(line,current="other"){
  const hit=sectionRules.find(([,rx])=>rx.test(line));
  if(hit)return hit[0];
  if(current==="tasks"||current==="required"||current==="preferred")return current;
  if(/우대|가점|preferred/i.test(line))return "preferred";
  if(/필수|자격|졸업|학위|전공|경력\s*\d|어학|자격증|지원\s*가능/i.test(line))return "required";
  if(/담당|수행|관리|분석|기획|개선|운영|개발|설계|검토|대응|지원|최적화|모니터링/i.test(line))return "tasks";
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
  save();render();toast("공고를 4개 영역으로 나눴습니다. 원문과 맞는지 확인해 주세요.");
}
function step3(){
  const p=state.postings[activePosting];
  const tabs=state.postings.map((_,i)=>'<button class="tabBtn '+(i===activePosting?"active":"")+'" data-tab="'+i+'">'+(i===0?"공고 1 · 기본 분석":"공고 "+(i+1)+" · 심화 선택")+'</button>').join("");
  const body='<div class="postingTabs">'+tabs+'</div>'+
    '<div class="grid2"><div class="field"><label>기업명 <span class="hint">(선택)</span></label><input class="input" data-pf="company" value="'+h(p.company)+'" placeholder="기업명" /></div><div class="field"><label>공고 직무명 <span class="hint">(선택)</span></label><input class="input" data-pf="title" value="'+h(p.title)+'" placeholder="공고에 적힌 직무명" /></div></div>'+
    '<div class="block"><div class="field"><label>채용공고 원문</label><textarea class="input tall" data-pf="text" placeholder="담당업무, 자격요건, 우대사항이 보이도록 붙여넣으세요.">'+h(p.text)+'</textarea></div><div class="actions compactActions"><button class="btn secondary" id="parsePostingBtn">공고 구조 자동 나누기</button></div></div>'+
    '<div class="block"><h3>① 공고 원문을 구조로 나누기</h3><p class="help">자동 분류는 초안입니다. 반드시 원문을 다시 보고 잘못 들어간 문장을 수정하세요.</p><div class="grid2">'+
      '<div class="field"><label>담당업무</label><textarea class="input" data-pf="tasks" placeholder="실제로 하게 될 일">'+h(p.tasks)+'</textarea></div>'+
      '<div class="field"><label>필수·지원자격</label><textarea class="input" data-pf="required" placeholder="반드시 충족하거나 지원을 위해 필요한 조건">'+h(p.required)+'</textarea></div>'+
      '<div class="field"><label>우대사항</label><textarea class="input" data-pf="preferred" placeholder="있으면 유리한 조건">'+h(p.preferred)+'</textarea></div>'+
      '<div class="field"><label>기타 조건</label><textarea class="input" data-pf="other" placeholder="근무조건·채용절차 등 분석에 참고할 내용">'+h(p.other)+'</textarea></div>'+
    '</div></div>'+
    '<div class="block"><div class="field"><label>② 내가 읽어낸 핵심</label><textarea class="input" data-pf="notes" placeholder="이 회사가 이 직무 사람에게 실제로 시키려는 일은 무엇인가요?">'+h(p.notes)+'</textarea></div></div>'+
    '<div class="callout warn"><b>분석 원칙:</b> 담당업무·자격요건·우대사항을 먼저 구분한 뒤 역량을 해석합니다. 공고에 없는 역량은 추가하지 않습니다.</div>';
  return shell(3,"채용공고 분석","공고 원문을 업무·필수조건·우대조건으로 먼저 나눈 뒤 직무 요구를 읽습니다.",body,"핵심 실습");
}
const dict={
  "지식(Knowledge)":["공정","품질","회계","재무","마케팅","시장","전기","전자","기계","화학","에너지","안전","법규","제품","산업","원가","생산","설비","전력","전공"],
  "기술(Skill)":["분석","Excel","엑셀","Python","파이썬","SQL","CAD","통계","데이터","보고서","프레젠테이션","영어","어학","문서","설계","개선","최적화","모니터링"],
  "행동(Behavior)":["협업","소통","문제해결","문제 해결","주도","책임","고객","커뮤니케이션","조율","적극","논리","꼼꼼","유관부서","유관 부서"],
  "경험(Experience)":["인턴","프로젝트","실험","연구","현장","공모전","아르바이트","실습","경력","경험","캡스톤","교육","자격증"]
};
function rx(s){return s.replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");}
function signals(){
  const text=state.postings.map(p=>p.text).join("\n"),out={};
  Object.entries(dict).forEach(([cat,words])=>{out[cat]=words.map(w=>({w,count:(text.match(new RegExp(rx(w),"gi"))||[]).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);});
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
    [
      ["담당업무","tasks"],["필수·지원자격","required"],["우대사항","preferred"]
    ].forEach(([label,key])=>{
      postingLines(postingSection(p,key)).forEach(line=>{
        rows.push({posting:i+1,section:label,line,signals:lineSignals(line)});
      });
    });
  });
  return rows;
}
function signalLabel(items){
  if(!items.length)return '<span class="hint">직접 판단</span>';
  return items.map(x=>'<span class="pill">'+h(x.cat.split("(")[0].trim())+' · '+h(x.words.slice(0,3).join(", "))+'</span>').join(" ");
}
function step4(){
  const cards=Object.entries(signals()).map(([cat,items])=>'<div class="signalCard"><h4>'+cat+'</h4><div class="pills">'+(items.length?items.slice(0,10).map(x=>'<span class="pill">'+h(x.w)+' <strong>'+x.count+'</strong></span>').join(""):'<span class="hint">발견된 후보가 없습니다.</span>')+'</div></div>').join("");
  const evidence=evidenceRows();
  const trs=evidence.length?evidence.slice(0,45).map(r=>'<tr><td>공고 '+r.posting+'</td><td>'+h(r.section)+'</td><td>'+h(r.line)+'</td><td>'+signalLabel(r.signals)+'</td></tr>').join(""):'<tr><td colspan="4">STEP 3에서 채용공고를 입력하면 원문 근거표가 만들어집니다.</td></tr>';
  return shell(4,"요구역량 찾기","공고를 보고 내가 확정한 요구역량부터 정리합니다. 근거표와 반복 키워드는 필요할 때 펼쳐 확인하세요.",
    '<div class="block"><h3>기본 분석 · 내가 확정한 요구역량</h3><div class="grid2">'+
      field("competency.knowledge","Knowledge · 무엇을 알아야 하나?","전공지식, 산업·제품·공정 지식 등")+
      field("competency.skill","Skill · 무엇을 할 수 있어야 하나?","데이터 분석, 설계, 문서작성, 툴 활용 등")+
      field("competency.behavior","Behavior · 어떻게 일해야 하나?","공고에서 직접 확인되는 협업·문제해결·책임 등의 표현")+
      field("competency.experience","Experience · 어떤 경험을 요구하나?","인턴, 프로젝트, 실험, 현장경험 등")+
    '</div><div class="callout warn"><b>Behavior 주의:</b> 공고에서 직접 확인되지 않으면 <b>“확인되지 않음”</b>이라고 적어도 됩니다. 공고에 없는 역량을 만들어 넣지 않습니다.</div>'+
    '<div class="block">'+field("competency.top5","이 직무의 핵심 요구 TOP 5","공고 원문에서 근거를 찾을 수 있는 항목 5개")+'</div></div>'+
    '<details class="optionBox"><summary>근거 확인 · 원문 문장과 반복 키워드 보기</summary><div class="optionBody">'+
      '<div class="block"><h3>원문 근거표</h3><p class="help">자동 분류는 보조판정입니다. 최종 판단은 공고 문맥을 기준으로 합니다.</p><div class="tableWrap"><table><thead><tr><th>공고</th><th>구분</th><th>원문 근거</th><th>분류 후보</th></tr></thead><tbody>'+trs+'</tbody></table></div></div>'+
      '<div class="block"><h3>반복해서 보이는 키워드</h3><div class="signalGrid">'+cards+'</div></div>'+
    '</div></details>'+
    optionalComparison());
}
const signalGroups=[
  {label:"데이터 분석",terms:["데이터 분석","데이터","통계","Excel","엑셀","Python","파이썬","SQL"]},
  {label:"문제해결·개선",terms:["문제해결","문제 해결","개선","원인 분석","최적화"]},
  {label:"협업·소통",terms:["협업","소통","커뮤니케이션","유관부서","유관 부서","조율"]},
  {label:"공정·생산·설비",terms:["공정","생산","설비","수율","가동","품질"]},
  {label:"전공·기술지식",terms:["전공","기계","전기","전자","화학","에너지","안전"]},
  {label:"현장·프로젝트 경험",terms:["인턴","프로젝트","현장","실습","캡스톤","경험","경력"]},
  {label:"기획·운영·관리",terms:["기획","운영","관리"]},
  {label:"문서·보고",terms:["보고서","문서","프레젠테이션","PPT"]},
  {label:"어학",terms:["영어","어학","TOEIC","토익","OPIc","오픽"]},
  {label:"자격·인증",terms:["자격증","기사","산업기사"]}
];
function firstEvidence(text,terms){
  return postingLines(text).find(line=>terms.some(w=>new RegExp(rx(w),"i").test(line)))||"";
}
function commonSignalRows(){
  const ps=state.postings;
  return signalGroups.map(g=>{
    const cells=ps.map(p=>{
      if(!filled(p.text))return {hit:false,evidence:""};
      const evidence=firstEvidence(p.text,g.terms);
      return {hit:!!evidence,evidence};
    });
    return {label:g.label,n:cells.filter(x=>x.hit).length,cells};
  }).filter(x=>x.n).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,"ko"));
}
function commonRows(){
  const texts=state.postings.map(p=>p.text).filter(Boolean),all=[...new Set(Object.values(dict).flat())],rows=[];
  all.forEach(w=>{const presence=texts.map(t=>new RegExp(rx(w),"i").test(t)),n=presence.filter(Boolean).length;if(n)rows.push({w,n,presence});});
  return rows.sort((a,b)=>b.n-a.n||a.w.localeCompare(b.w,"ko"));
}

function optionalComparison(){
  const valid=state.postings.filter(p=>filled(p.text)).length,rows=commonSignalRows();
  const trs=rows.length?rows.map(r=>'<tr><td><b>'+h(r.label)+'</b></td><td>'+r.n+'</td>'+r.cells.map(c=>'<td>'+(c.hit?'<b>✓</b><br><span class="hint">'+h(c.evidence.slice(0,90))+'</span>':'-')+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="5">공고를 입력하면 비교표가 만들어집니다.</td></tr>';
  return '<details class="optionBox comparisonOption"><summary>심화 OPTION · 같은 직무 공고 2~3개 비교하기</summary><div class="optionBody">'+
    '<div class="callout '+(valid>=2?"good":"info")+'">현재 공고 <b>'+valid+'개</b>가 입력되어 있습니다. 공고 1개만 분석해도 기본 실습은 완료됩니다.</div>'+
    '<div class="block"><h3>공통 요구와 기업별 차이</h3><p class="help">같은 뜻의 표현을 묶고, 각 공고의 실제 문장을 근거로 비교합니다.</p><div class="tableWrap"><table><thead><tr><th>요구 신호</th><th>등장 공고 수</th><th>공고 1 근거</th><th>공고 2 근거</th><th>공고 3 근거</th></tr></thead><tbody>'+trs+'</tbody></table></div></div>'+
    '<div class="grid2">'+
      field("comparison.common","여러 공고에서 공통으로 요구한 것","예: 공정 이해, 데이터 분석, 문제해결, 협업")+
      field("comparison.differences","기업마다 달랐던 요구","예: A사는 설비 경험, B사는 Python 분석을 더 강조")+
    '</div><div class="callout info"><b>해석:</b> 여러 회사에서 반복되면 직무 공통 신호, 한 회사에서만 강조되면 기업·사업 특성 신호로 봅니다.</div>'+
  '</div></details>';
}

function requirementSourceLines(){
  return [...new Set(state.postings.flatMap(p=>filled(p.text)?postingLines(postingSection(p,"required")):[]))].slice(0,4);
}
function ensureRequirements(){
  const src=requirementSourceLines();
  let changed=false;
  state.requirements=state.requirements||[0,1,2,3].map(()=>({condition:"",status:"",note:""}));
  src.forEach((line,i)=>{if(i<4&&!filled(state.requirements[i]?.condition)){state.requirements[i]={condition:line,status:"",note:""};changed=true;}});
  if(changed)save();
}
function requirementRows(){
  ensureRequirements();
  return state.requirements.map((r,i)=>'<div class="requirementRow">'+
    '<div class="field"><label>필수조건 '+(i+1)+'</label><input class="input" data-req="'+i+'" data-reqkey="condition" value="'+h(r.condition)+'" placeholder="예: 관련 전공, 자격증, 학력, 경력" /></div>'+
    '<div class="field"><label>현재 상태</label><select class="input" data-req="'+i+'" data-reqkey="status">'+
      '<option value="">선택</option>'+
      '<option value="충족" '+(r.status==="충족"?"selected":"")+'>충족</option>'+
      '<option value="준비 중" '+(r.status==="준비 중"?"selected":"")+'>준비 중</option>'+
      '<option value="현재 미충족" '+(r.status==="현재 미충족"?"selected":"")+'>현재 미충족</option>'+
      '<option value="해당 없음" '+(r.status==="해당 없음"?"selected":"")+'>해당 없음</option>'+
    '</select></div>'+
    '<div class="field"><label>메모 <span class="hint">(선택)</span></label><input class="input" data-req="'+i+'" data-reqkey="note" value="'+h(r.note)+'" placeholder="증빙·준비계획" /></div>'+
  '</div>').join("");
}
function step5(){
  return shell(5,"나와 연결","직무 요구와 나의 현재 상태를 비교하고, 자기소개서·면접에 다시 쓸 경험 한 개를 Mini STAR로 정리합니다.",
    '<div class="block"><h3>① 필수조건 먼저 확인</h3><p class="help">지원 가능 여부와 준비 우선순위를 먼저 확인합니다. 공고의 필수·지원자격에서 자동으로 가져오며 수정할 수 있습니다.</p><div class="requirementList">'+requirementRows()+'</div></div>'+
    '<div class="divider"></div><div class="block"><h3>② My Fit & Gap</h3><div class="grid2">'+
      field("fit.assets","내가 이미 가지고 있는 것","전공, 지식, 기술, 자격, 경험 중 직무와 연결되는 것")+
      field("fit.gaps","아직 부족한 것","공고가 요구하지만 지금 근거가 부족한 항목")+
      field("fit.actions","다음 행동","이번 학기 또는 3개월 안에 할 수 있는 준비")+
    '</div></div>'+
    '<div class="divider"></div><div class="block starBlock"><h3>③ Mini STAR · 취업에 다시 쓸 경험 1개</h3><p class="help">모든 경험을 정리할 필요는 없습니다. 오늘 분석한 직무와 가장 연결되는 경험 하나만 남깁니다.</p><div class="grid2">'+
      field("star.competency","연결할 요구역량","예: 데이터 분석, 설비 이해, 고객 대응",false)+
      field("star.experience","경험 이름","예: 태양광 발전량 분석 캡스톤 프로젝트",false)+
      field("star.situationTask","상황·과제 (S/T)","어떤 상황에서 무엇을 해결해야 했나요?")+
      field("star.action","내가 실제로 한 행동 (A)","내가 직접 한 행동을 동사 중심으로 적으세요.")+
      field("star.result","결과 (R)","수치, 변화, 산출물, 배운 점 등 확인 가능한 결과")+
    '</div><div class="callout good"><b>자소서·면접 연결:</b> 경험 이름보다 상황·행동·결과가 남아 있어야 나중에 답변을 다시 만들 수 있습니다.</div></div>');
}
function portfolio(){
  const t=state.target,c=state.context,p=state.profile,k=state.competency,cmp=state.comparison,f=state.fit,star=state.star;
  const ps=state.postings.filter(x=>filled(x.text));
  const common=commonSignalRows().filter(x=>x.n>=2).map(x=>x.label).join(", ")||"-";
  const req=(state.requirements||[]).filter(r=>filled(r.condition));
  const starSummary=[star.situationTask,star.action,star.result].filter(filled).join(" → ")||"-";
  const a=[
    "MY JOB ANALYSIS PORTFOLIO","",
    "1. TARGET JOB",
    "관심 산업: "+(t.industry||"-"),
    "분석 직무: "+(t.job||"-"),
    "관심 기업: "+(t.company||"-"),
    "분석 전 직무 이미지: "+(t.initialView||"-"),"",
    "2. INDUSTRY · COMPANY · JOB CONTEXT",
    "최근 산업 변화: "+(c.change||"-"),
    "기업이 해결해야 할 문제: "+(c.problem||"-"),
    "직무가 해결하는 문제: "+(p.solve||"-"),
    "직무가 만들어야 하는 결과: "+(p.output||"-"),
    "추가 메모 - 수익 구조: "+(c.money||"-"),
    "추가 메모 - 직무 영향: "+(c.impact||"-"),
    "추가 메모 - 관리·대상: "+(p.manage||"-"),
    "추가 메모 - 협업 대상: "+(p.collab||"-"),"",
    "3. JOB POSTING ANALYSIS"
  ];
  ps.forEach((x,i)=>a.push(
    "[공고 "+(i+1)+"] "+(x.company||"기업명 미입력")+" · "+(x.title||"직무명 미입력"),
    "담당업무: "+(postingSection(x,"tasks")||"-"),
    "필수·지원자격: "+(postingSection(x,"required")||"-"),
    "우대사항: "+(postingSection(x,"preferred")||"-"),
    "내가 읽어낸 핵심: "+(x.notes||"-"),""
  ));
  a.push(
    "4. COMPETENCY MAP",
    "Knowledge: "+(k.knowledge||"-"),
    "Skill: "+(k.skill||"-"),
    "Behavior: "+(k.behavior||"-"),
    "Experience: "+(k.experience||"-"),
    "핵심 요구 TOP 5: "+(k.top5||"-"),
    "공고 비교 공통신호: "+common,
    "공통 요구 요약: "+(cmp.common||"-"),
    "기업별 차이: "+(cmp.differences||"-"),"",
    "5. MY FIT & REQUIREMENTS"
  );
  if(req.length)req.forEach((r,i)=>a.push("필수조건 "+(i+1)+": "+r.condition+" / 상태: "+(r.status||"미선택")+(r.note?" / 메모: "+r.note:"")));
  else a.push("필수조건 확인: -");
  a.push(
    "이미 가진 것: "+(f.assets||"-"),
    "부족한 것: "+(f.gaps||"-"),
    "다음 행동: "+(f.actions||"-"),"",
    "6. MINI STAR · MY EVIDENCE",
    "연결 역량: "+(star.competency||"-"),
    "경험: "+(star.experience||"-"),
    "상황·과제(S/T): "+(star.situationTask||"-"),
    "행동(A): "+(star.action||"-"),
    "결과(R): "+(star.result||"-"),"",
    "7. APPLICATION NOTES",
    "[자기소개서 소재]",
    (star.experience||"경험")+"에서 "+starSummary,
    "[면접 준비 질문]",
    "- 왜 "+(t.job||"관심")+" 직무를 선택했는가?",
    "- 이 직무에서 가장 중요한 업무는 무엇이라고 이해하고 있는가?",
    "- 실제 채용공고에서 확인한 핵심 요구는 무엇인가?",
    "- "+(star.competency||"이 직무 역량")+"을 보여주는 경험을 설명해 주세요.",
    "- 그 경험에서 본인이 직접 한 행동은 무엇이었는가?",
    "- 현재 부족한 부분을 어떻게 준비하고 있는가?"
  );
  return a.join("\n");
}
function step6(){
  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 06</div><h2>결과물 만들기</h2><p>수업 뒤 자기소개서·면접 준비에서 다시 사용할 수 있도록 저장합니다.</p></div><span class="badge">Portfolio</span></div><div class="preview">'+h(portfolio())+'</div><div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>Word에서 열고 수정할 수 있는 .doc 파일입니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 ‘PDF로 저장’을 선택하세요.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>다시 불러올 수 있는 FLEX 전용 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div><div class="actions noPrint"><button class="btn secondary" data-prev="5">이전</button><button class="btn secondary" id="copyBtn">결과 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
}
function bind(){
  document.querySelectorAll("[data-path]").forEach(e=>e.oninput=()=>{set(e.dataset.path,e.value);save();});
  document.querySelectorAll("[data-pf]").forEach(e=>e.oninput=()=>{state.postings[activePosting][e.dataset.pf]=e.value;save();});
  document.querySelectorAll("[data-req]").forEach(e=>e.onchange=e.oninput=()=>{const i=Number(e.dataset.req),k=e.dataset.reqkey;state.requirements[i]??={condition:"",status:"",note:""};state.requirements[i][k]=e.value;save();});
  document.querySelectorAll("[data-tab]").forEach(e=>e.onclick=()=>{save();activePosting=Number(e.dataset.tab);render();});
  document.querySelectorAll("[data-next]").forEach(e=>e.onclick=()=>go(Number(e.dataset.next)));
  document.querySelectorAll("[data-prev]").forEach(e=>e.onclick=()=>go(Number(e.dataset.prev)));
  document.getElementById("parsePostingBtn")?.addEventListener("click",autoParsePosting);
  document.getElementById("docBtn")?.addEventListener("click",exportDoc);
  document.getElementById("printBtn")?.addEventListener("click",()=>window.print());
  document.getElementById("jsonBtn2")?.addEventListener("click",exportJson);
  document.getElementById("copyBtn")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(portfolio());toast("결과 텍스트를 복사했습니다.");}catch(e){toast("복사 권한을 확인해 주세요.");}});
  document.getElementById("resetBtn")?.addEventListener("click",()=>{if(confirm("Jobfit FLEX 직무분석 데이터만 새로 시작할까요? INJE Jobfit 데이터에는 영향을 주지 않습니다.")){localStorage.removeItem(STORAGE_KEY);state=defaults();activePosting=0;render();toast("FLEX 데이터만 초기화했습니다.");}});
}
function render(){
  nav();
  const f=[null,step1,step2,step3,step4,step5,step6];
  document.getElementById("stepRoot").innerHTML=f[state.currentStep]();
  bind();progress();
}
function go(n){save();state.currentStep=Math.max(1,Math.min(6,n));save();render();window.scrollTo({top:280,behavior:"smooth"});}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function base(){return "Jobfit_FLEX_"+(state.target.job||"직무분석").replace(/[\\/:*?"<>|]/g,"_");}
function exportJson(){save();download(base()+"_backup.json",JSON.stringify(state,null,2),"application/json;charset=utf-8");toast("FLEX 백업파일을 저장했습니다.");}
function exportDoc(){const body=portfolio().split("\n").map(x=>"<p>"+(h(x)||"&nbsp;")+"</p>").join("");const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"Malgun Gothic",sans-serif;line-height:1.55;color:#222}p{margin:5px 0}p:first-child{font-size:22px;font-weight:700;margin-bottom:18px}</style></head><body>'+body+"</body></html>";download(base()+".doc","\ufeff"+html,"application/msword");toast("Word용 문서를 저장했습니다.");}
function importJson(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw new Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(x));state=load();render();toast("FLEX 백업을 불러왔습니다.");}catch(e){toast("Jobfit FLEX 백업파일인지 확인해 주세요.");}};r.readAsText(file,"utf-8");}
document.getElementById("exportJsonBtn").onclick=exportJson;
document.getElementById("importJsonBtn").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=e=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";};
render();

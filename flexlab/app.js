const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";
const steps = [
  ["분석대상 선택","산업·직무"],
  ["산업·기업 맥락","변화와 역할"],
  ["직무 해부","업무·문제"],
  ["채용공고 분석","실제 공고"],
  ["요구역량 찾기","K·S·B·E"],
  ["공고 비교","공통 신호"],
  ["나와 연결","Evidence·Gap"],
  ["결과물 만들기","Portfolio"]
];
const emptyPosting=()=>({company:"",title:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const defaults=()=>({
  version:2,currentStep:1,updatedAt:"",
  target:{industry:"",job:"",company:"",initialView:""},
  context:{money:"",change:"",problem:"",impact:""},
  profile:{manage:"",solve:"",collab:"",data:"",output:"",risk:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",top5:""},
  comparison:{common:"",differences:""},
  fit:{assets:"",evidence:"",gaps:"",actions:""}
});
let state=load(), activePosting=0;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!x)return defaults();
    const b=defaults();
    return {...b,...x,target:{...b.target,...(x.target||{})},context:{...b.context,...(x.context||{})},profile:{...b.profile,...(x.profile||{})},competency:{...b.competency,...(x.competency||{})},comparison:{...b.comparison,...(x.comparison||{})},fit:{...b.fit,...(x.fit||{})},postings:[0,1,2].map(i=>({...emptyPosting(),...(x.postings?.[i]||{})}))};
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
  if(n===2)return filled(state.context.change)||filled(state.context.impact);
  if(n===3)return filled(state.profile.solve)||filled(state.profile.output);
  if(n===4)return state.postings.some(p=>filled(p.text));
  if(n===5)return Object.values(state.competency).some(filled);
  if(n===6)return state.postings.filter(p=>filled(p.text)).length>=2;
  if(n===7)return Object.values(state.fit).some(filled);
  if(n===8)return done(1)&&done(4);
}
function nav(){
  document.getElementById("stepNav").innerHTML='<div class="navTitle">JOB ANALYSIS</div>'+steps.map((s,i)=>{
    const n=i+1,d=done(n),a=state.currentStep===n;
    return '<button class="stepBtn '+(a?"active ":"")+(d?"done":"")+'" data-step="'+n+'"><span class="stepN">'+(d?"✓":String(n).padStart(2,"0"))+'</span><span class="stepText">'+s[0]+'<small>'+s[1]+'</small></span></button>';
  }).join("");
  document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>go(Number(b.dataset.step)));
}
function progress(){
  const n=steps.filter((_,i)=>done(i+1)).length,p=Math.round(n/8*100);
  const l=document.getElementById("progressLabel"),b=document.getElementById("progressBar");
  if(l)l.textContent="진행 "+p+"% · "+n+"/8";
  if(b)b.style.width=p+"%";
  nav();
}
function shell(n,title,desc,body,badge="실습"){
  return '<section class="card stepCard"><div class="sectionHead"><div><div class="kicker">STEP '+String(n).padStart(2,"0")+'</div><h2>'+title+'</h2><p>'+desc+'</p></div><span class="badge">'+badge+'</span></div>'+body+'<div class="actions">'+(n>1?'<button class="btn secondary" data-prev="'+(n-1)+'">이전</button>':"")+(n<8?'<button class="btn primary" data-next="'+(n+1)+'">저장하고 다음</button>':"")+'</div></section>';
}
function step1(){
  return shell(1,"분석대상 선택","오늘 깊게 볼 산업과 직무를 하나 정합니다.",
    '<div class="grid2">'+field("target.industry","관심 산업","예: 에너지, 반도체, 조선, 금융",false)+field("target.job","분석할 직무","예: 생산기술, 품질관리, 영업, 재무",false)+field("target.company","관심 기업","특정 기업이 있으면 입력",false,true)+field("target.initialView","지금 생각하는 이 직무","이 직무는 회사에서 어떤 문제를 해결하는 사람이라고 생각하나요?")+'</div><div class="callout info"><b>먼저 내 생각을 적습니다.</b> 실제 채용공고를 본 뒤 직무 이해가 어떻게 달라졌는지 비교합니다.</div>');
}
function step2(){
  return shell(2,"산업·기업 맥락","산업을 외우기보다 변화가 직무에 어떤 일을 만들어내는지 봅니다.",
    '<div class="grid2">'+field("context.money","이 산업·기업은 무엇으로 돈을 버는가?","핵심 제품·서비스와 고객")+field("context.change","최근 무엇이 바뀌고 있는가?","기술, 정책, 고객, 경쟁, 원가, 공급망 등")+field("context.problem","그 변화가 기업에 어떤 문제를 만드는가?","기업이 해결해야 할 과제")+field("context.impact","그래서 이 직무는 무엇을 해야 하는가?","산업 변화와 직무의 역할 연결")+'</div>');
}
function step3(){
  const q=[
    ["profile.manage","무엇을 관리하는가?","공정, 고객, 비용, 설비, 일정, 데이터 등"],
    ["profile.solve","어떤 문제를 해결하는가?","불량, 납기, 매출, 비용, 안전, 고객불만 등"],
    ["profile.collab","누구와 일하는가?","내부 부서, 현장, 고객, 협력사 등"],
    ["profile.data","어떤 정보·데이터를 보는가?","생산실적, 매출, 품질지표, 시장자료 등"],
    ["profile.output","어떤 결과를 만들어야 하는가?","수율 향상, 매출, 보고서, 납기 준수 등"],
    ["profile.risk","잘못하면 어떤 문제가 생기는가?","비용 증가, 사고, 불량, 일정 지연 등"]
  ];
  return shell(3,"직무 해부","직무명을 실제 업무·문제·결과 단위로 분해합니다.",'<div class="grid2">'+q.map(x=>field(x[0],x[1],x[2])).join("")+'</div><div class="callout good"><b>좋은 직무 설명:</b> 무엇을 한다 + 왜 한다 + 어떤 결과를 만든다.</div>');
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
function step4(){
  const p=state.postings[activePosting];
  const tabs=state.postings.map((_,i)=>'<button class="tabBtn '+(i===activePosting?"active":"")+'" data-tab="'+i+'">공고 '+(i+1)+(i?" · 선택":"")+'</button>').join("");
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
  return shell(4,"채용공고 분석","공고 원문을 업무·필수조건·우대조건으로 먼저 나눈 뒤 직무 요구를 읽습니다.",body,"핵심 실습");
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
function step5(){
  const cards=Object.entries(signals()).map(([cat,items])=>'<div class="signalCard"><h4>'+cat+'</h4><div class="pills">'+(items.length?items.slice(0,10).map(x=>'<span class="pill">'+h(x.w)+' <strong>'+x.count+'</strong></span>').join(""):'<span class="hint">발견된 후보가 없습니다.</span>')+'</div></div>').join("");
  const evidence=evidenceRows();
  const trs=evidence.length?evidence.slice(0,45).map(r=>'<tr><td>공고 '+r.posting+'</td><td>'+h(r.section)+'</td><td>'+h(r.line)+'</td><td>'+signalLabel(r.signals)+'</td></tr>').join(""):'<tr><td colspan="4">STEP 4에서 채용공고를 입력하면 원문 근거표가 만들어집니다.</td></tr>';
  return shell(5,"요구역량 찾기","먼저 공고의 원문 문장을 확인하고, 그 문장에서 지식·기술·행동·경험 요구를 해석합니다.",
    '<div class="block"><h3>① 원문 근거표</h3><p class="help">각 문장이 공고의 어디에서 나온 것인지 먼저 확인합니다. 오른쪽 분류는 키워드 기반 보조판정입니다.</p><div class="tableWrap"><table><thead><tr><th>공고</th><th>구분</th><th>원문 근거</th><th>분류 후보</th></tr></thead><tbody>'+trs+'</tbody></table></div></div>'+
    '<div class="block"><h3>② 반복해서 보이는 키워드</h3><p class="help">단어 빈도는 정답이 아니라 확인용입니다. 업무 문맥과 함께 판단하세요.</p><div class="signalGrid">'+cards+'</div></div>'+
    '<div class="divider"></div><div class="block"><h3>③ 내가 확정한 요구역량</h3><div class="grid2">'+
      field("competency.knowledge","Knowledge · 알아야 하는 것","전공지식, 산업·제품·공정 지식 등")+
      field("competency.skill","Skill · 할 수 있어야 하는 것","데이터 분석, 설계, 문서작성, 툴 활용 등")+
      field("competency.behavior","Behavior · 일하는 방식","협업, 문제해결, 책임, 고객지향 등")+
      field("competency.experience","Experience · 요구되는 경험","인턴, 프로젝트, 실험, 현장경험 등")+
    '</div><div class="block">'+field("competency.top5","이 직무의 핵심 요구 TOP 5","반드시 공고 원문에서 근거를 찾을 수 있는 항목 5개")+'</div></div>');
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
function step6(){
  const valid=state.postings.filter(p=>filled(p.text)).length,rows=commonSignalRows();
  const trs=rows.length?rows.map(r=>'<tr><td><b>'+h(r.label)+'</b></td><td>'+r.n+'</td>'+r.cells.map(c=>'<td>'+(c.hit?'<b>✓</b><br><span class="hint">'+h(c.evidence.slice(0,90))+'</span>':'-')+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="5">공고를 입력하면 비교표가 만들어집니다.</td></tr>';
  return shell(6,"공고 비교","같은 직무의 여러 공고에서 반복되는 요구와 회사별 차이를 원문 근거로 비교합니다.",
    '<div class="callout '+(valid>=2?"good":"info")+'">현재 공고 <b>'+valid+'개</b>가 입력되어 있습니다. <b>2개 이상</b>이면 공통 요구와 기업별 차이를 구분하기 쉬워집니다.</div>'+
    '<div class="block"><h3>① 의미가 비슷한 표현 묶어서 비교</h3><p class="help">단어 하나가 정확히 같지 않아도 같은 요구로 볼 수 있는 표현을 묶었습니다. 각 칸에는 실제 공고 문장을 함께 표시합니다.</p><div class="tableWrap"><table><thead><tr><th>요구 신호</th><th>등장 공고 수</th><th>공고 1 근거</th><th>공고 2 근거</th><th>공고 3 근거</th></tr></thead><tbody>'+trs+'</tbody></table></div></div>'+
    '<div class="divider"></div><div class="block"><h3>② 내가 정리한 비교 결과</h3><div class="grid2">'+
      field("comparison.common","여러 공고에서 공통으로 요구한 것","예: 공정 이해, 데이터 분석, 문제해결, 협업")+
      field("comparison.differences","기업마다 달랐던 요구","예: A사는 설비 경험, B사는 Python 분석을 더 강조")+
    '</div></div>'+
    '<div class="callout info"><b>해석 기준:</b> 여러 회사에서 반복되는 요구는 직무 공통 신호로, 특정 회사에서만 강조되는 요구는 기업·사업 특성에 따른 신호로 구분해 봅니다.</div>');
}
function step7(){
  return shell(7,"나와 연결","직무 요구를 내 경험과 비교해 자기소개서·면접에 쓸 근거를 남깁니다.",'<div class="grid2">'+field("fit.assets","내가 이미 가지고 있는 것","전공, 지식, 기술, 자격, 경험 중 직무와 연결되는 것")+field("fit.evidence","그것을 보여줄 수 있는 경험","수업·프로젝트·실험·인턴·아르바이트 등 구체적 사례")+field("fit.gaps","아직 부족한 것","공고가 요구하지만 지금 근거가 부족한 항목")+field("fit.actions","다음 행동","이번 학기 또는 3개월 안에 할 수 있는 준비")+'</div><div class="callout good"><b>자소서·면접용 메모:</b> “역량이 있다”보다 그 역량을 보여주는 상황·행동·결과를 남겨두세요.</div>');
}
function portfolio(){
  const t=state.target,c=state.context,p=state.profile,k=state.competency,cmp=state.comparison,f=state.fit;
  const ps=state.postings.filter(x=>filled(x.text));
  const common=commonSignalRows().filter(x=>x.n>=2).map(x=>x.label).join(", ")||"-";
  const a=[
    "MY JOB ANALYSIS PORTFOLIO","",
    "1. TARGET JOB","관심 산업: "+(t.industry||"-"),"분석 직무: "+(t.job||"-"),"관심 기업: "+(t.company||"-"),"분석 전 직무 이미지: "+(t.initialView||"-"),"",
    "2. INDUSTRY & COMPANY CONTEXT","수익 구조: "+(c.money||"-"),"최근 변화: "+(c.change||"-"),"기업의 과제: "+(c.problem||"-"),"직무에 미치는 영향: "+(c.impact||"-"),"",
    "3. JOB PROFILE","관리 대상: "+(p.manage||"-"),"해결 문제: "+(p.solve||"-"),"협업 대상: "+(p.collab||"-"),"확인하는 데이터: "+(p.data||"-"),"만들어야 하는 결과: "+(p.output||"-"),"실패 시 문제: "+(p.risk||"-"),"",
    "4. JOB POSTING ANALYSIS"
  ];
  ps.forEach((x,i)=>a.push("[공고 "+(i+1)+"] "+(x.company||"기업명 미입력")+" · "+(x.title||"직무명 미입력"),"담당업무: "+(postingSection(x,"tasks")||"-"),"필수·지원자격: "+(postingSection(x,"required")||"-"),"우대사항: "+(postingSection(x,"preferred")||"-"),"내가 읽어낸 핵심: "+(x.notes||"-"),"원문:\n"+x.text,""));
  a.push("5. COMPETENCY MAP","Knowledge: "+(k.knowledge||"-"),"Skill: "+(k.skill||"-"),"Behavior: "+(k.behavior||"-"),"Experience: "+(k.experience||"-"),"핵심 요구 TOP 5: "+(k.top5||"-"),"2개 이상 공고 반복 키워드: "+common,"공통 요구 요약: "+(cmp.common||"-"),"기업별 차이: "+(cmp.differences||"-"),"","6. MY EVIDENCE & GAP","이미 가진 것: "+(f.assets||"-"),"증거 경험: "+(f.evidence||"-"),"부족한 것: "+(f.gaps||"-"),"다음 행동: "+(f.actions||"-"),"","7. 자기소개서에 다시 쓸 메모","활용 가능한 경험: "+(f.evidence||"-"),"","8. 면접에서 다시 볼 질문","- 왜 "+(t.job||"이 직무")+"를 선택했는가?","- 이 직무에서 가장 중요한 업무는 무엇이라고 이해하고 있는가?","- 실제 채용공고에서 반복해서 확인된 요구는 무엇이었는가?","- 그 요구를 보여줄 수 있는 본인의 경험은 무엇인가?","- 현재 부족한 부분을 어떻게 준비하고 있는가?");
  return a.join("\n");
}
function step8(){
  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 08</div><h2>결과물 만들기</h2><p>수업 뒤 자기소개서·면접 준비에서 다시 사용할 수 있도록 저장합니다.</p></div><span class="badge">Portfolio</span></div><div class="preview">'+h(portfolio())+'</div><div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>Word에서 열고 수정할 수 있는 .doc 파일입니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 ‘PDF로 저장’을 선택하세요.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>다시 불러올 수 있는 FLEX 전용 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div><div class="actions noPrint"><button class="btn secondary" data-prev="7">이전</button><button class="btn secondary" id="copyBtn">결과 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
}
function bind(){
  document.querySelectorAll("[data-path]").forEach(e=>e.oninput=()=>{set(e.dataset.path,e.value);save();});
  document.querySelectorAll("[data-pf]").forEach(e=>e.oninput=()=>{state.postings[activePosting][e.dataset.pf]=e.value;save();});
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
  const f=[null,step1,step2,step3,step4,step5,step6,step7,step8];
  document.getElementById("stepRoot").innerHTML=f[state.currentStep]();
  bind();progress();
}
function go(n){save();state.currentStep=Math.max(1,Math.min(8,n));save();render();window.scrollTo({top:280,behavior:"smooth"});}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function base(){return "Jobfit_FLEX_"+(state.target.job||"직무분석").replace(/[\\/:*?"<>|]/g,"_");}
function exportJson(){save();download(base()+"_backup.json",JSON.stringify(state,null,2),"application/json;charset=utf-8");toast("FLEX 백업파일을 저장했습니다.");}
function exportDoc(){const body=portfolio().split("\n").map(x=>"<p>"+(h(x)||"&nbsp;")+"</p>").join("");const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"Malgun Gothic",sans-serif;line-height:1.55;color:#222}p{margin:5px 0}p:first-child{font-size:22px;font-weight:700;margin-bottom:18px}</style></head><body>'+body+"</body></html>";download(base()+".doc","\ufeff"+html,"application/msword");toast("Word용 문서를 저장했습니다.");}
function importJson(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw new Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(x));state=load();render();toast("FLEX 백업을 불러왔습니다.");}catch(e){toast("Jobfit FLEX 백업파일인지 확인해 주세요.");}};r.readAsText(file,"utf-8");}
document.getElementById("exportJsonBtn").onclick=exportJson;
document.getElementById("importJsonBtn").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=e=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";};
render();

/* STEP 2 read-only presentation. Never edits learner data or derived source strings. */
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);

const sectionMarkers=[
  "필수·지원자격","필수/지원자격","지원자격","우대사항","핵심역량","자격요건",
  "직무 필요역량","Knowledge\\s*\\[[^\\]]+\\]","Skill\\s*\\[[^\\]]+\\]",
  "Behavior\\s*\\[[^\\]]+\\]"
];
const markers=new RegExp("([^\\n])((?:"+sectionMarkers.join("|")+")(?:\\s*[:：])?)","g");
const headingPattern=/^(?:\[.{2,95}\]|(?:필수·지원자격|필수\/지원자격|지원자격|우대사항|핵심역량|자격요건|직무 필요역량|Knowledge|Skill|Behavior)(?:\s|[:：]|$))/i;

/**
 * Format without changing source. Commas are split only in dense passages.
 * Source remains intact in each STEP 2 input and saved backup.
 */
export function visualLines(value,{dense=false}={}){
  let source=String(value??"").replace(/\r\n?/g,"\n").trim();
  if(!source)return [];
  source=source.replace(markers,(_whole,prefix,label)=>prefix+"\n"+label);
  source=source.replace(/[•●▪]\s*/g,"\n• ");
  if(dense){
    source=source.replace(/;\s*/g,";\n");
    source=source.replace(/,\s*(?=\S)/g,",\n");
    source=source.replace(/\s+\/\s+(?=\S)/g," /\n");
  }
  return source.split("\n").map(s=>s.trim()).filter(Boolean).map(s=>{
    const heading=headingPattern.test(s);
    return {heading,text:s.replace(/^\s*(?:[-*•●▪]|\d+[.)])\s*/,"")};
  }).filter(x=>x.text.trim());
}
export function readableHTML(value,{dense=false,empty="미입력"}={}){
  const parts=visualLines(value,{dense});
  if(!parts.length)return '<span class="donga-pdf-empty">'+escapeHTML(empty)+'</span>';
  return '<div class="donga-readable-list">'+parts.map(({text,heading})=>
    '<div class="donga-readable-line'+(heading?" donga-readable-heading":"")+'">'+
    '<span class="donga-readable-bullet" aria-hidden="true">'+(heading?"◆":"•")+'</span>'+
    '<span class="donga-readable-text">'+escapeHTML(text)+'</span></div>'
  ).join("")+'</div>';
}
const valueOrDash=v=>String(v??"").trim()||"미입력";
function row(label,value,opts={}){
  return '<tr><th scope="row">'+escapeHTML(label)+'</th><td>'+readableHTML(value,{...opts})+'</td></tr>';
}
function labelValue(label,val){
  return '<div class="donga-report-meta-cell"><span>'+escapeHTML(label)+'</span><b>'+escapeHTML(valueOrDash(val))+'</b></div>';
}
function safeLink(raw){
  const s=String(raw||"").trim();
  if(!/^https?:\/\/[^<>"\s]+$/i.test(s))return readableHTML(s);
  return '<a href="'+escapeHTML(s)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s)+'</a>';
}
/** Render report from a snapshot of the current selection; no localStorage access. */
export function renderStep2Report(snapshot){
  const target=snapshot?.target||{},student=snapshot?.student||{},
    job=snapshot?.jobTable||{},fit=snapshot?.fit||{};
  const req=Array.isArray(snapshot?.requirements)?snapshot.requirements:[];
  const jobRows=[
    ["01 · 고객(KPI)",job.customerKpi],
    ["02 · 주요 과업",job.tasks],
    ["03 · 주요 해결과제",job.challenge],
    ["04 · 해결방법",job.method],
    ["05 · 필요역량",job.competencies]
  ];
  if(String(job.careerPlan||"").trim())jobRows.push(["참고 · 경력개발 방향",job.careerPlan]);
  const cards=req.map((r,i)=>
    '<article class="donga-report-req">'+
    '<header class="donga-report-req-head"><b>공고·직무 조건 '+(i+1)+'</b><span>'+escapeHTML(valueOrDash(r.status||"미판정"))+'</span></header>'+
    '<div class="donga-report-req-body"><div><small>공고의 요구조건</small>'+readableHTML(r.condition,{dense:true})+'</div>'+
    '<div><small>나의 근거 (학생 확인)</small>'+readableHTML(r.note,{dense:true,empty:"입력한 근거 없음"})+'</div></div>'+
    '</article>'
  ).join("");
  return '<div class="donga-report-doc">'+
    '<header class="donga-report-head"><p>JOBFIT DONG-A · STEP 2</p>'+
    '<h2>MY JOB ANALYSIS &amp; GAP</h2><div>직무분석 결과 · 공고 요구조건 비교 · 취업준비 계획</div></header>'+
    '<section class="donga-report-meta">'+
    labelValue("기업",target.company)+labelValue("선택 직무",target.role)+
    labelValue("채용공고",target.title)+labelValue("전공",student.major)+
    '</section>'+
    '<section class="donga-report-section"><h3>01. 직무분석표</h3>'+
    '<table class="donga-job-table"><colgroup><col class="donga-report-labelcol"><col></colgroup><tbody>'+
    jobRows.map(([label,val])=>row(label,val,{dense:true})).join("")+'</tbody></table></section>'+
    '<section class="donga-report-section"><h3>02. 나의 현재 준비 상태</h3>'+
    '<table class="donga-job-table"><colgroup><col class="donga-report-labelcol"><col></colgroup><tbody>'+
    row("자격증",student.certificates,{dense:true})+
    row("어학",student.language,{dense:true})+
    row("도구·기술",student.tools,{dense:true})+
    row("전공·수행 근거",student.majorEvidence,{dense:true})+
    '</tbody></table></section>'+
    '<section class="donga-report-section"><h3>03. JD Requirements × My Spec</h3>'+
    '<p class="donga-report-section-intro">각 조건의 충족 여부는 학생이 판단한 상태입니다. 자동 입력된 근거도 반드시 사실 여부를 확인하세요.</p>'+
    (cards||'<p class="donga-pdf-empty">비교한 공고 요구조건이 없습니다.</p>')+'</section>'+
    '<section class="donga-report-section"><h3>04. 우선 보완 GAP</h3>'+
    '<div class="donga-report-note">'+readableHTML(fit.gaps,{dense:true,empty:"아직 GAP을 정리하지 않았습니다."})+'</div></section>'+
    '<section class="donga-report-section"><h3>05. 앞으로 3개월 행동계획</h3>'+
    '<div class="donga-report-note">'+readableHTML(fit.actions,{dense:true,empty:"아직 행동계획을 정리하지 않았습니다."})+'</div></section>'+
    '<footer class="donga-report-foot"><p><b>공고 원문·출처</b> '+safeLink(target.sourceUrl)+'</p>'+
    '<p>학생이 입력하거나 선택한 정보를 읽기 좋게 배열한 보고서입니다. 공고 내용·준비 상태의 사실 여부를 별도로 확인해야 합니다.</p></footer>'+
    '</div>';
}

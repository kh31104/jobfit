/* Jobfit Dong-A STEP 2: read-only screen/PDF formatting. Never mutate learner inputs. */
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);
const valueOrDash=v=>String(v??"").trim()||"미입력";
const LEADING_DECORATION=/^[ \t]*(?:◆|◇|▶|▷)\s*/;
const HEADING=/^(?:필수[·/]?\s*지원자격|지원자격|우대사항|핵심역량|자격요건|직무\s*필요역량|필수조건|우대조건)\s*[:：]?$/i;
const INLINE_SECTION=/(?:^|[ \t]+)(필수[·/]?\s*지원자격|우대사항|핵심역량|자격요건|직무\s*필요역량)\s*[:：]\s*/g;
const LINK_PREVIEW=/^(?:\[[^\]]*image[^\]]*\]\s*\(|!\[[^\]]*\]\s*\(|공모전\s*대외활동\s*[-–]\s*링커리어|대학생\s*대외활동\s*공모전\s*채용\s*사이트\s*링커리어|https?:\/\/(?:www\.)?linkareer\.com\/?\s*$)/i;

function cleanOutput(value){
  let s=String(value??"").replace(/\r\n?/g,"\n").replace(/\u00a0/g," ").replace(/&nbsp;|&#x20;/gi," ").trim();
  // Only copied previews/links are omitted in presentation; input and saved backup retain them.
  s=s.replace(/\[(?:image|이미지)\]\s*\(https?:\/\/[^)]*\)/gi,"\n");
  s=s.replace(/!\[[^\]]*\]\s*\(https?:\/\/[^)]*\)/gi,"\n");
  return s;
}
/** Split only real lines and explicit list markers, never commas inside a sentence. */
export function visualLines(value,{dense=false}={}){
  let source=cleanOutput(value);
  if(!source)return [];
  // Normalize heading separators only when used as headings, not inside normal words.
  source=source.replace(/([^\n])(?:[ \t]+)(?=(?:필수[·/]?\s*지원자격|우대사항|핵심역량|자격요건|직무\s*필요역량)\s*[:：])/gi,"$1\n");
  source=source.replace(/(^|\n)(필수[·/]?\s*지원자격|지원자격|우대사항|핵심역량|자격요건|직무\s*필요역량)\s*[:：][ \t]*(?=\S)/gi,"$1$2:\n");
  source=source.replace(/([^\n])(?:[ \t]+)(?=\[\s*추가\s*확인\s*질문\s*\])/gi,"$1\n");
  source=source.replace(/([^\n])[ \t]+([•●▪])[ \t]*/g,"$1\n$2 ");
  const items=source.split("\n").map(s=>s.trim()).filter(Boolean);
  return items.filter(s=>!LINK_PREVIEW.test(s)).map(raw=>{
    const bullet=/^[•●▪*-]\s+/.test(raw);
    let text=raw.replace(LEADING_DECORATION,"").replace(/^[•●▪*-]\s+/,"").trim();
    if(!text||LINK_PREVIEW.test(text))return null;
    return {heading:HEADING.test(text)||/^\[\s*추가\s*확인\s*질문\s*\]$/i.test(text),bullet,text};
  }).filter(Boolean);
}
export function readableHTML(value,{dense=false,empty="미입력"}={}){
  const parts=visualLines(value,{dense});
  if(!parts.length)return '<span class="donga-pdf-empty">'+escapeHTML(empty)+'</span>';
  return '<div class="donga-readable-list">'+parts.map(({text,heading,bullet})=>
    '<div class="donga-readable-line'+(heading?" donga-readable-heading":"")+(bullet?" is-explicit-bullet":"")+'">'+
    (bullet&&!heading?'<span class="donga-readable-bullet" aria-hidden="true"></span>':"")+
    '<span class="donga-readable-text">'+escapeHTML(text)+'</span></div>'
  ).join("")+'</div>';
}
function row(label,value,opts={}){
  return '<tr><th scope="row">'+escapeHTML(label)+'</th><td>'+readableHTML(value,opts)+'</td></tr>';
}
function labelValue(label,val){
  return '<div class="donga-report-meta-cell"><span>'+escapeHTML(label)+'</span><b>'+escapeHTML(valueOrDash(val))+'</b></div>';
}
function safeLink(raw){
  const s=String(raw||"").trim();
  if(!/^https?:\/\/[^<>"\s]+$/i.test(s))return readableHTML(s);
  return '<a href="'+escapeHTML(s)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s)+'</a>';
}
function splitJobCompetencies(raw){
  const s=String(raw||"");
  const parts=s.split(/(?:^|\s)\[\s*추가\s*확인\s*질문\s*\]\s*/i);
  return {skills:parts.shift()||"",questions:parts.join("\n").trim()};
}
function cleanReportText(raw){
  return cleanOutput(raw).replace(/^\s*[\u2022◆▪●]\s*/gm,"").trim();
}
const GAP_SECTION=/\[\s*(?:6\.\s*우선순위|7\.\s*3개월\s*보완\s*행동|7\.\s*3개월\s*행동계획)\s*\]/i;
function gapTextOnly(raw){
  return cleanReportText(String(raw||"").split(GAP_SECTION)[0]).replace(/\[\s*5\.\s*[^\]]+\]\s*/gi,"").trim();
}
function planTextOnly(raw,fromGaps=""){
  const actual=cleanOutput(raw);
  if(actual)return actual.replace(/^\[\s*7\.\s*[^\]]+\]\s*/i,"").trim();
  const m=String(fromGaps||"").match(/\[\s*7\.\s*3개월[^\]]*\]\s*([\s\S]*)/i);
  return m?m[1].trim():"";
}
/**
 * One parser for STEP2 screen and PDF, accepting newlines, bullet-only AI replies,
 * and pasted answers where "GAP 2 →" follows the previous sentence on the same line.
 * No edits are made to source fields or localStorage.
 */
export function parsePlanItems(raw,type="action",fromGaps=""){
  let text=cleanOutput(raw);
  if(type==="gap")text=gapTextOnly(text);
  if(type==="action")text=planTextOnly(text,fromGaps);
  if(!text)return [];
  // A pasted bullet may be on the same line as the previous GAP entry.
  text=text.replace(/[ \t]*[•●▪][ \t]*(?=(?:GAP\s*[1-9]\s*(?:→|[:：.)-])|[1-9]\s*[.)]\s+|[1-9]\s*순위\s*[:：]))/gi,"\n");
  // A newly numbered item may follow a sentence even without a bullet.
  text=text.replace(/([^\n])[ \t]+(?=GAP\s*[1-9]\s*(?:→|[:：.)-]))/gi,"$1\n");
  const lines=text.split("\n").map(t=>t.trim()).filter(Boolean);
  const marker=/^GAP\s*([1-9])\s*(?:→|[:：.)-])\s*|^([1-9])\s*[.)]\s+|^([1-9])\s*순위\s*[:：]\s*/i;
  const items=[];
  for(const original of lines){
    if(/^\[\s*(?:6\.\s*우선순위|7\.\s*3개월|추가\s*확인)\s*[^\]]*\]/i.test(original))continue;
    const isBullet=/^[•●▪*-]\s+/.test(original);
    const line=original.replace(/^[•●▪*-]\s+/,"").trim();
    if(!line||LINK_PREVIEW.test(line))continue;
    const match=line.match(marker);
    if(match){
      const detail=line.slice(match[0].length).trim();
      if(detail)items.push({id:Number(match[1]||match[2]||match[3]),text:detail});
    }else if(items.length&&!isBullet){
      items[items.length-1].text+=" "+line; // wrapped paragraph, not an independent numbered item
    }else{
      items.push({id:items.length+1,text:line});
    }
  }
  return items;
}
export function renderGapCards(raw){
  const items=parsePlanItems(raw,"gap");
  if(!items.length)return '<p class="donga-pdf-empty">아직 GAP을 정리하지 않았습니다.</p>';
  return '<div class="donga-gap-grid">'+items.map(({id,text})=>{
    const parts=text.split(/\s+[—–]\s+/);
    const hasTitle=parts.length>1;
    return '<article class="donga-gap-item"><span class="donga-plan-index">GAP '+id+'</span>'+
      '<div class="donga-gap-desc">'+(hasTitle?'<b>'+escapeHTML(parts.shift())+'</b><p>'+escapeHTML(parts.join(" — "))+'</p>':'<p>'+escapeHTML(text)+'</p>')+'</div></article>';
  }).join("")+'</div>';
}
export function renderActionCards(raw,fromGaps=""){
  const items=parsePlanItems(raw,"action",fromGaps);
  if(!items.length)return '<p class="donga-pdf-empty">아직 행동계획을 정리하지 않았습니다.</p>';
  return '<div class="donga-action-grid">'+items.map(({id,text})=>{
    // Preserve the same action wording on the screen and in the PDF.
    // Only the final arrow becomes the outcome-column separator.
    const parts=text.split(/\s*→\s*/).map(x=>x.trim()).filter(Boolean);
    const result=parts.length>=2?parts.pop():"";
    const action=parts.join(" → ")||text;
    return '<article class="donga-action-item" data-gap="'+id+'"><span class="donga-plan-index">GAP '+id+'</span>'+
      '<div class="donga-action-content"><span class="donga-action-key">실행할 일</span><p>'+escapeHTML(action)+'</p></div>'+
      (result?'<div class="donga-action-outcome"><span class="donga-action-key">남길 결과물</span><p>'+escapeHTML(result)+'</p></div>':"")+
      '</article>';
  }).join("")+'</div>';
}
function requirementCard(r,i){
  const hasAuto=/^\s*자동\s*불러오기\s*·/.test(String(r.note||""));
  const note=hasAuto?String(r.note).replace(/^\s*자동\s*불러오기\s*·\s*/,""):r.note;
  const status=String(r.status||"미판정");
  return '<article class="donga-report-req">'+
    '<header class="donga-report-req-head"><b>공고·직무 조건 '+(i+1)+'</b><span>'+escapeHTML(status)+'</span></header>'+
    '<div class="donga-report-req-body"><section><h4>공고의 요구조건</h4>'+readableHTML(r.condition,{dense:true,empty:"공고조건 미입력"})+'</section>'+
    '<section><h4>나의 근거 <small>'+(hasAuto?"자동 연결 · 학생 확인 필요":"학생 확인")+'</small></h4>'+
    readableHTML(note,{dense:true,empty:"연결된 근거 없음 · 직접 확인 필요"})+'</section></div>'+
    '</article>';
}
/** Render a snapshot only. Existing notes, status, GAP, actions and backups are not modified. */
export function renderStep2Report(snapshot){
  const target=snapshot?.target||{},student=snapshot?.student||{},job=snapshot?.jobTable||{},fit=snapshot?.fit||{};
  const req=Array.isArray(snapshot?.requirements)?snapshot.requirements:[];
  const c=splitJobCompetencies(job.competencies);
  const jobRows=[
    ["01 · 고객(KPI)",job.customerKpi],
    ["02 · 주요 과업",job.tasks],
    ["03 · 주요 해결과제",job.challenge],
    ["04 · 해결방법",job.method],
    ["05 · 필요역량",c.skills]
  ];
  if(c.questions)jobRows.push(["참고 · 확인할 사항",c.questions]);
  if(String(job.careerPlan||"").trim())jobRows.push(["참고 · 경력개발 방향",job.careerPlan]);
  return '<div class="donga-report-doc">'+
    '<header class="donga-report-head"><p>JOBFIT DONG-A · STEP 2</p>'+
    '<div class="donga-report-title" role="heading" aria-level="2">MY JOB ANALYSIS &amp; GAP</div><div>직무분석 결과 · 공고 요구조건 비교 · 취업준비 계획</div></header>'+
    '<section class="donga-report-meta">'+
    labelValue("기업",target.company)+labelValue("선택 직무",target.role)+
    labelValue("채용공고",target.title)+labelValue("전공",student.major)+'</section>'+
    '<section class="donga-report-section"><h3>01. 직무분석표</h3>'+
    '<table class="donga-job-table"><colgroup><col class="donga-report-labelcol"><col></colgroup><tbody>'+
    jobRows.map(([label,val])=>row(label,val,{dense:true})).join("")+'</tbody></table></section>'+
    '<section class="donga-report-section"><h3>02. 나의 현재 준비 상태</h3>'+
    '<table class="donga-job-table"><colgroup><col class="donga-report-labelcol"><col></colgroup><tbody>'+
    row("자격증",student.certificates,{dense:true})+row("어학",student.language,{dense:true})+
    row("도구·기술",student.tools,{dense:true})+row("전공·수행 근거",student.majorEvidence,{dense:true})+
    '</tbody></table></section>'+
    '<section class="donga-report-section"><h3>03. JD Requirements × My Spec</h3>'+
    '<p class="donga-report-section-intro">공고 원문과 학생이 입력한 근거를 나란히 비교합니다. 충족 여부는 학생의 확인이 필요합니다.</p>'+
    (req.length?req.map(requirementCard).join(""):'<p class="donga-pdf-empty">비교한 공고 요구조건이 없습니다.</p>')+'</section>'+
    '<section class="donga-report-section"><h3>04. 우선 보완 GAP</h3>'+renderGapCards(fit.gaps)+'</section>'+
    '<section class="donga-report-section"><h3>05. 앞으로 3개월 행동계획</h3>'+
    renderActionCards(fit.actions,fit.gaps)+'</section>'+
    '<footer class="donga-report-foot"><p><b>공고 원문·출처</b> '+safeLink(target.sourceUrl)+'</p>'+
    '<p>학생이 입력하거나 선택한 정보를 읽기 좋게 배열한 보고서입니다. 공고 내용·준비 상태의 사실 여부를 별도로 확인해야 합니다.</p></footer>'+
  '</div>';
}

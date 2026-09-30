const VERSION='my-jobfit-report-v1';

export async function render(ctx){
  const s=ctx.getState(),root=document.getElementById('stepRoot');
  const report=buildReport(s,ctx);
  root.innerHTML=`<section class="card jobfitReportStage">${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 5</div><h2>MY JOBFIT REPORT v1</h2><p>STEP 1~5의 핵심만 3페이지로 정리합니다. 전체 입력 원문은 Jobfit 저장데이터와 백업파일에 남습니다.</p></div><span class="badge">중간 결과물</span></div>
    <div class="progress"><span style="width:43%"></span></div>
    <div class="callout info"><b>학생이 다시 읽을 수 있는 분량으로 줄였습니다.</b><br>검사 전체 문항, AI 대화 전체, STAR 원문 전체, JD 원문은 PDF에 넣지 않습니다. Career DNA → Experience Evidence → Job Exploration → Job Analysis → GAP만 남깁니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>보고서 준비상태</h3><p>누락된 단계가 있어도 현재까지 입력된 내용으로 보고서를 만들 수 있습니다.</p></div></div>${readinessHtml(s,ctx)}</div>
    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>3페이지 미리보기</h3><p>학생에게 전달되는 PDF 형태입니다.</p></div></div>
      <div class="actions noReportPrint"><button class="btn primary" id="refreshReport">현재 내용으로 갱신</button><button class="btn secondary" id="printReport">PDF 저장 화면</button><button class="btn outline" id="backupReport">Jobfit 데이터 백업</button></div>
      <div id="jobfitReportPrint" class="reportPreview">${reportHtml(report,ctx)}</div>
      <div class="status" id="status"></div>
    </div>
  </section>`;
  saveMeta(false);
  document.getElementById('refreshReport')?.addEventListener('click',()=>{saveMeta(true);ctx.toast('MY JOBFIT REPORT v1을 갱신했습니다.');ctx.navigate(5)});
  document.getElementById('printReport')?.addEventListener('click',()=>{saveMeta(true);window.print()});
  document.getElementById('backupReport')?.addEventListener('click',()=>ctx.downloadJSON());

  function saveMeta(show){const now=new Date().toISOString();ctx.saveState({artifacts:{jobfitReportV1:{version:VERSION,generatedAt:now,pageCount:3,targetCount:report.targets.length}}});if(show){const el=document.getElementById('status');if(el)el.textContent='보고서 내용을 갱신했습니다. PDF 저장 화면에서 “PDF로 저장”을 선택하세요.';}}
}

function buildReport(s,ctx){
  const dna=s.assessments?.careerDNA||{},profile=s.artifacts?.careerDNAProfile||{},exp=s.assessments?.experienceCompetency||{experiences:[]},map=Array.isArray(s.artifacts?.experienceMap)?s.artifacts.experienceMap.filter(x=>x?.factChecked):[];
  const experiences=map.length?map:(exp.experiences||[]).filter(x=>x?.factChecked);
  const best3=exp.best3||{},repKey=exp.representativeKey||'',repSeed=repKey&&best3[repKey]?best3[repKey]:null;
  const best=(repSeed?.title?experiences.find(x=>x?.title===repSeed.title):null)||experiences[0]||repSeed||{};
  const explorer=s.artifacts?.jobExplorer||{},targets=getTargets(explorer),deep=s.artifacts?.jobDeepDive||{},targetAnalyses=deep.targetAnalyses||{};
  const primary=targets[0],analysis=primary?(targetAnalyses[primary.id]||deep.analyses?.[primary.jobId]||{}):{};
  const values=[...new Set(profile.valueClues||((dna.balance?.answers||[]).filter(Boolean).map(x=>x.value)))].slice(0,3);
  const anchor=(profile.careerAnchorTop||dna.careerAnchor?.ranking||[]).slice(0,3).map(x=>({name:x.name||x.code||'',score:Number.isFinite(Number(x.score))?Number(x.score):null})).filter(x=>x.name);
  const selfStrengths=(profile.selfStrengths||dna.selfStrengths||[]).slice(0,5);
  const via=(profile.viaTop5||dna.viaTop5||[]).slice(0,5);
  const careerText=profile.hypothesis?.text||dna.hypothesis?.text||dna.reflection||'';
  const compMap=Array.isArray(s.artifacts?.competencyMap)?s.artifacts.competencyMap:[];
  const competencies=(compMap.length?compMap.map(x=>x.keyword):[...new Set(experiences.flatMap(x=>x.competencies||[]))]).filter(Boolean).slice(0,5);
  const actions=experiences.map(x=>String(x.action||'').trim()).filter(Boolean).slice(0,4);
  const desired=(explorer.desiredActivities||[]).slice(0,5),industries=(explorer.industryInterests||[]).filter(x=>x!=='아직 잘 모르겠어요').slice(0,4);
  const reqs=(analysis.requirements||[]).slice(0,5);
  const jobTable=analysis.jobTable||{};
  const studentSpec=analysis.studentSpec||{};
  const have=(analysis.have||reqs.filter(x=>['근거 있음','일부 근거 있음'].includes(x.status)).map(x=>x.name).join(' · '));
  const verify=analysis.verify||'';
  const gaps=reqs.filter(x=>x.gap||x.status==='준비 필요').map(x=>x.gap||x.name).filter(Boolean).slice(0,3);
  const prepare=(analysis.prepare||reqs.filter(x=>['준비 필요','확인 필요'].includes(x.status)).map(x=>x.name).join(' · '));
  const todaySummary=makeToday(actions,targets,prepare,anchor,via);
  return {code:s.profile?.anonCode||'—',major:s.profile?.major||'미입력',date:koreaDate(),careerText,values,anchor,selfStrengths,via,best,competencies,actions,desired,industries,targets,analysis,jobTable,studentSpec,reqs,have,verify,gaps,prepare,todaySummary};
}
function reportHtml(r,ctx){return `
  <section class="reportPage">
    ${pageHead('01 · CAREER DNA + EXPERIENCE','WHO AM I?')}
    ${rBox('MY CAREER DNA',`${r.careerText?`<p>${esc(r.careerText,ctx)}</p>`:''}<p><b>중요 기준</b> ${esc(r.values.join(' · ')||'STEP 1에서 가치 단서를 확인하세요.',ctx)}</p><p><b>내가 생각하는 강점</b> ${esc(r.selfStrengths.join(' · ')||'입력 없음',ctx)}</p>`,'blue')}
    <div class="reportGrid2">${rBox('CAREER ANCHOR · TOP 3',anchorText(r.anchor,ctx),'blue',true)}${rBox('VIA 성격강점 · TOP 5',`<p>${esc(r.via.join(' · ')||'VIA 결과 미입력',ctx)}</p><p class="reportNote">자기이해 보조정보로 사용</p>`,'green',true)}</div>
    ${rBox('MY BEST EXPERIENCE',r.best?.title?`<p><b>${esc(r.best.title,ctx)}</b></p><p>${esc(shortText(r.best.action||r.best.summary||r.best.result||'',180)||'경험의 핵심 행동을 STEP 2에서 확인하세요.',ctx)}</p>`:'<p>STEP 2에서 Best Experience를 확인하세요.</p>','green')}
    ${rBox('EXPERIENCE DNA',`<p>${esc(r.actions.length?r.actions.map(shortAction).join(' → '):'반복 행동을 확인하는 중입니다.',ctx)}</p>`,'blue')}
    <div class="reportGrid3">${(r.competencies.length?r.competencies.slice(0,3):['역량 확인 중']).map(x=>rMini(x,'STEP 2의 행동 Evidence에서 확인')).join('')}</div>
    ${pageFoot(r,1)}
  </section>

  <section class="reportPage">
    ${pageHead('02 · JOB EXPLORATION + JOB ANALYSIS','WHERE CAN I USE IT?')}
    <div class="reportGrid2">${rBox('해보고 싶은 업무',`<p>${esc(r.desired.join(' · ')||'STEP 3에서 업무활동을 선택하세요.',ctx)}</p>`,'blue',true)}${rBox('관심 산업',`<p>${esc(r.industries.join(' · ')||'아직 산업 미정',ctx)}</p>`,'green',true)}</div>
    ${rBox('MY TARGET',targetText(r.targets,ctx),'blue')}
    ${rBox(`JOB ANALYSIS${r.targets[0]?` · ${esc(r.targets[0].industry,ctx)} × ${esc(r.targets[0].job?.title||'',ctx)}`:''}`,jobAnalysisText(r.analysis,ctx),'green')}
    ${jobAnalysisReportTable(r.analysis,ctx)}
    ${pageFoot(r,2)}
  </section>

  <section class="reportPage">
    ${pageHead('03 · EVIDENCE + GAP',"WHAT DO I HAVE & WHAT'S NEXT?")}
    ${rBox('MY SPEC',specText(r,ctx),'blue')}
    ${evidenceTable(r.reqs,ctx)}
    <div class="reportGrid2">${rBox('내가 가진 것',`<p>${esc(r.have||'현재 확인된 근거 없음',ctx)}</p>`,'green',true)}${rBox('확인 필요',`<p>${esc(r.verify||'추가 확인 항목 없음',ctx)}</p>`,'blue',true)}</div>
    ${rBox('핵심 GAP · 최대 3개',`<p>${esc(r.gaps.length?r.gaps.map((x,i)=>(i+1)+'. '+x).join(' / '):'확인된 GAP 없음',ctx)}</p>`,'blue')}
    ${rBox('3개월 행동',`<p>${esc(r.prepare||'STEP 5에서 3개월 행동을 정리하세요.',ctx)}</p>`,'green')}
    ${pageFoot(r,3)}
  </section>`}
function pageHead(kicker,title){return `<div class="reportBrand">JOBFIT</div><div class="reportKicker">${kicker}</div><h1>${title}</h1><div class="reportRule"></div>`}
function pageFoot(r,n){return `<div class="reportMeta">Jobfit 익명코드 ${escSimple(r.code)} · 작성일 ${escSimple(r.date)}<span>MY JOBFIT REPORT v1 · ${n}/3</span></div>`}
function rBox(title,body,tone='blue',inline=false){return `<div class="reportBox ${tone} ${inline?'inlineBox':''}"><h2>${title}</h2>${body}</div>`}
function rMini(title,body){return `<div class="reportMini"><h3>${escSimple(title)}</h3><p>${body}</p></div>`}
function targetText(targets,ctx){if(!targets.length)return '<p>STEP 3에서 직무 × 산업 Target을 선택하세요.</p>';return targets.slice(0,3).map((t,i)=>`<p><b>${i+1}${i===2?' 예비':'순위'}</b> ${esc(t.industry||'산업 미정',ctx)} × ${esc(t.job?.title||'직무',ctx)}</p>`).join('')}
function jobAnalysisText(a,ctx){const jt=a.jobTable||{},tasks=(a.tasks||[]).slice(0,5).map(x=>x.name).filter(Boolean);const taskText=jt.tasks||tasks.join(' · ')||a.newHireWork||'STEP 5에서 실제 직무분석을 완료하세요.';return `<p><b>주요 과업</b> ${esc(taskText,ctx)}</p><p><b>필요역량</b> ${esc(jt.competencies||a.skills||a.knowledge||'확인 필요',ctx)}</p>`}
function jobAnalysisReportTable(a,ctx){const jt=a.jobTable||{};const legacyTasks=(a.tasks||[]).slice(0,5).map(x=>x.name).filter(Boolean).join(' · ');const rows=[['고객(KPI)',jt.customerKpi||'확인 필요'],['주요 과업',jt.tasks||legacyTasks||a.newHireWork||'확인 필요'],['주요 해결과제',jt.challenge||'확인 필요'],['해결방법',jt.method||'확인 필요'],['필요역량',jt.competencies||[a.knowledge,a.skills,a.behaviors].filter(Boolean).join(' / ')||'확인 필요']];return `<div class="reportTable jobAnalysisReport">${rows.map(([k,v])=>`<div class="tr"><div><b>${esc(k,ctx)}</b></div><div>${esc(v,ctx)}</div></div>`).join('')}</div>${jt.careerPlan?rBox('경력개발 · 선택',`<p>${esc(jt.careerPlan,ctx)}</p>`,'blue'):''}`}
function specText(r,ctx){const s=r.studentSpec||{};return `<p><b>전공</b> ${esc(r.major||'미입력',ctx)}</p><p><b>자격증</b> ${esc(s.certificates||'미입력',ctx)} · <b>어학</b> ${esc(s.language||'미입력',ctx)} · <b>도구·기술</b> ${esc(s.tools||'미입력',ctx)}</p>${s.portfolio?`<p><b>추가 프로젝트</b> ${esc(s.portfolio,ctx)}</p>`:''}`}
function evidenceTable(reqs,ctx){if(!reqs.length)return rBox('MY EVIDENCE','<p>STEP 4에서 TASK → SKILL → MY EVIDENCE 비교를 추가하면 여기에 표시됩니다.</p>','blue');return `<div class="reportTable"><div class="tr th"><div>직무에서 필요한 것</div><div>나의 근거</div><div>현재 상태</div></div>${reqs.slice(0,5).map(r=>`<div class="tr"><div>${esc(r.name,ctx)}</div><div>${esc(r.evidence||'현재 근거 없음',ctx)}</div><div><b class="${statusTone(r.status)}">${esc(r.status||'확인 필요',ctx)}</b></div></div>`).join('')}</div>`}
function statusTone(s=''){return s==='근거 있음'?'ok':s==='일부 근거 있음'?'partial':'need'}
function getTargets(explorer){const combos=Array.isArray(explorer.targetCombos)&&explorer.targetCombos.length?explorer.targetCombos:(explorer.targets||[]).map((jobId,i)=>({id:`target_${jobId}_${i+1}`,jobId,industry:'산업 미정',priority:i+1}));return combos.map(c=>({...c,job:explorer.candidates?.find(x=>x.id===c.jobId)})).filter(x=>x.job)}
function makeToday(actions,targets,prepare,anchor=[],via=[]){const act=actions.length?`‘${shortAction(actions[0])}’처럼 실제로 한 행동 근거가 있다`:'현재까지의 경험 근거를 정리하고 있다';const ts=targets.slice(0,2).map(t=>`${t.industry} × ${t.job?.title||'직무'}`).join(', ');const tests=[anchor.length?`Career Anchor에서는 ${anchor.slice(0,2).map(x=>x.name).join('·')}`:'',via.length?`VIA에서는 ${via.slice(0,2).join('·')}`:''].filter(Boolean).join(', ');return `현재 나는 ${act}. ${tests?tests+'가 주요 자기이해 결과로 나타났다. ':''}${ts?`${ts}를 우선 탐색하고 있으며, `:''}${prepare?`${shortText(prepare,90)}은 앞으로 확인·준비할 항목이다.`:'다음 직무분석에서 부족한 부분을 더 확인할 예정이다.'}`}
function readinessHtml(s,ctx){const d=s.assessments?.careerDNA||{},ex=s.assessments?.experienceCompetency?.experiences||[],j=s.artifacts?.jobExplorer||{},deep=s.artifacts?.jobDeepDive||{},analyses=Object.values(deep.targetAnalyses||deep.analyses||{}),jobReady=analyses.some(a=>{const t=a?.jobTable||{};return [t.customerKpi,t.tasks,t.challenge,t.method,t.competencies].every(v=>String(v||'').trim())}),gapReady=analyses.some(a=>String(a?.have||'').trim()||String(a?.prepare||'').trim()||(a?.requirements||[]).some(r=>r?.gap));const rows=[['Career DNA',!!(d.hypothesis||d.reflection||d.selfStrengths?.length||d.careerAnchor?.ranking?.length||d.viaTop5?.length)],['Experience & Competency',ex.some(x=>x?.factChecked&&String(x.action||'').trim())],['Job Exploration',!!(j.targetCombos?.length||j.targets?.length)],['Job Analysis',jobReady],['GAP Match',gapReady]];return `<div class="grid4">${rows.map(([name,on])=>`<div class="miniCard"><b>${on?'✓':'○'} ${esc(name,ctx)}</b><span>${on?'보고서에 반영 가능':'입력된 내용만 반영'}</span></div>`).join('')}</div>`}
function anchorText(items,ctx){if(!items?.length)return '<p>Career Anchor 결과 미입력</p>';return '<p>'+items.map((x,i)=>`<b>${i+1}</b> ${esc(x.name,ctx)}${x.score!==null?` ${esc(String(x.score),ctx)}점`:''}`).join(' · ')+'</p><p class="reportNote">상위 결과를 직무추천의 단독 근거로 사용하지 않음</p>'}
function koreaDate(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value||'';return [g('year'),g('month'),g('day')].join('-')}
function shortAction(x=''){return shortText(String(x).replace(/[.!?].*$/,''),45)}function shortText(x='',n=120){const s=String(x).trim().replace(/\s+/g,' ');return s.length>n?`${s.slice(0,n-1)}…`:s}
function esc(x,ctx){return ctx.escapeHtml(String(x??''))}function escSimple(x=''){return String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function styleBlock(){return `<style>
.jobfitReportStage .moduleHead{display:flex;gap:11px;align-items:flex-start}.jobfitReportStage .moduleHead>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#eef3ff;color:#3152c9;font-weight:950;flex:0 0 auto}.reportPreview{display:grid;gap:18px;margin-top:16px}.reportPage{position:relative;width:100%;max-width:794px;aspect-ratio:210/297;margin:0 auto;background:#fff;border:1px solid #e3e8f2;box-shadow:0 10px 28px rgba(30,55,105,.08);padding:48px 48px 54px;overflow:hidden}.reportBrand{display:inline-block;background:#315df4;color:#fff;border-radius:999px;padding:7px 16px;font-size:11px;font-weight:950}.reportKicker{margin-top:18px;color:#315df4;font-weight:900;font-size:11px}.reportPage h1{font-size:28px;margin:8px 0 14px}.reportRule{height:1px;background:#dbe2ec;margin-bottom:24px}.reportBox{border:1px solid #dfe6f2;border-radius:14px;padding:16px 18px;margin:13px 0;min-height:82px;position:relative}.reportBox:after{content:'';position:absolute;left:0;right:0;bottom:0;height:5px;border-radius:0 0 14px 14px;background:#315df4}.reportBox.green:after{background:#087a63}.reportBox h2{font-size:14px;margin:0 0 10px}.reportBox p{margin:5px 0;color:#667085;line-height:1.55;font-size:11px}.reportBox .reportNote{font-size:9.5px;color:#98a2b3}.reportGrid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.reportGrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.reportMini{border:1px solid #dfe6f2;border-radius:14px;padding:14px;min-height:95px}.reportMini h3{font-size:13px;margin:0 0 9px}.reportMini p{font-size:10px;color:#667085;line-height:1.5}.reportTable{border:1px solid #dfe6f2;border-radius:14px;overflow:hidden;margin:13px 0}.reportTable .tr{display:grid;grid-template-columns:1.15fr 1.2fr .7fr;border-top:1px solid #e8edf5}.jobAnalysisReport .tr{grid-template-columns:.7fr 2fr}.reportTable .tr:first-child{border-top:0}.reportTable .tr>div{padding:12px;font-size:10.5px;color:#475467}.reportTable .th{background:#f8faff;font-weight:900}.reportTable .th>div{color:#172033}.reportTable .ok{color:#087a63}.reportTable .partial,.reportTable .need{color:#9a6700}.reportMeta{position:absolute;left:48px;right:48px;bottom:24px;color:#98a2b3;font-size:9px;display:flex;justify-content:space-between}.reportMeta span{margin-left:auto}.inlineBox{margin-top:0}.noReportPrint{display:flex}
@media(max-width:700px){.reportPage{padding:26px 22px 44px;aspect-ratio:auto;min-height:900px}.reportGrid2,.reportGrid3{grid-template-columns:1fr}.reportMeta{left:22px;right:22px}}
@media print{@page{size:A4;margin:0}body *{visibility:hidden!important}.jobfitReportStage,#jobfitReportPrint,#jobfitReportPrint *{visibility:visible!important}.jobfitReportStage{position:absolute!important;left:0!important;top:0!important;width:100%!important}.jobfitReportStage>.sectionHead,.jobfitReportStage>.progress,.jobfitReportStage>.callout,.jobfitReportStage>.block:not(:last-child),.jobfitReportStage>.hr,.noReportPrint,.jobfitReportStage .status,.jobfitAccordionToolbar{display:none!important}#jobfitReportPrint{display:block!important;margin:0!important}.reportPage{width:210mm!important;height:297mm!important;max-width:none!important;aspect-ratio:auto!important;border:0!important;box-shadow:none!important;margin:0!important;padding:14mm 14mm 16mm!important;break-after:page;page-break-after:always}.reportPage:last-child{break-after:auto;page-break-after:auto}.reportMeta{left:14mm;right:14mm;bottom:8mm}}
</style>`}

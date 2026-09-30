const SOURCE_TYPES=['기업 공식 채용공고','기업 공식 직무소개','기업 공식 직무기술서','NCS','고용24 직업정보','공공기관·정부자료','산업협회·전문기관','기타 신뢰자료'];
const REQ_TYPES=['Gate · 필수조건','Preference · 우대조건','Knowledge','Skill','Behavior','Experience','Tool·System','기타'];
const GAP_STATUS=['근거 있음','일부 근거 있음','확인 필요','준비 필요'];
const VERSION='job-analysis-inje-v4';

export async function render(ctx){
  const s=ctx.getState(),explorer=s.artifacts?.jobExplorer||{candidates:[],targets:[]},targets=getTargets(explorer);
  const saved=structuredClone(s.artifacts?.jobDeepDive||{analyses:{},targetAnalyses:{}});
  saved.analyses=saved.analyses||{};saved.targetAnalyses=saved.targetAnalyses||{};
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card jobAnalysisInje">${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 4 · JOB ANALYSIS</div><h2>실제 채용공고로 직무 확인하기</h2><p>STEP 3에서 고른 Target Job을 실제 JD로 확인하고, <b>공고 요구 ↔ STEP 2 Evidence ↔ GAP</b>만 남깁니다.</p></div><span class="badge">직무분석</span></div>
    <div class="progress"><span style="width:36%"></span></div>
    <div class="callout info"><b>STEP 2 경험은 다시 쓰지 않습니다.</b><br>STEP 2의 경험근거는 자동으로 불러오고, 학생은 실제 JD와 GAP만 확인합니다.</div>
    <div id="analysisRoot"></div>
  </section>`;
  if(!targets.length){document.getElementById('analysisRoot').innerHTML='<div class="callout warn"><b>Target Job이 없습니다.</b><br>STEP 3에서 먼저 Target Job을 선택하세요.</div>';return}
  let currentId=targets[0].id;paint();

  function paint(){
    const target=targets.find(x=>x.id===currentId)||targets[0],job=target.job,legacy=saved.analyses?.[job?.id]||{};
    const a=structuredClone(saved.targetAnalyses?.[target.id]||defaultAnalysis(target,legacy));
    const box=document.getElementById('analysisRoot');
    box.innerHTML=`
      ${block('01','Target Job','STEP 3에서 선택한 직무를 확인합니다. 새로 고르지 않습니다.',`
        <div class="pillRow">${targets.map((t,i)=>`<button class="btn outline smallBtn targetPick ${t.id===target.id?'activePick':''}" data-id="${esc(t.id,ctx)}">${i+1}. ${esc(t.job?.title||'직무',ctx)} × ${esc(t.industry||'산업 미정',ctx)}</button>`).join('')}</div>
        <div class="callout good" style="margin-top:10px"><b>현재 Target</b><br>${esc(job?.title||'직무',ctx)} × ${esc(target.industry||'산업 미정',ctx)}</div>`)}

      ${block('02','Find JD','기업 공식 채용공고를 우선으로 실제 JD를 찾고 등록합니다.',`
        <div class="grid2">${txt('companyName','기업명',a.company?.name||'','예: ○○전자')}${txt('companyUrl','기업 공식페이지',a.company?.url||'','https://...')}</div>
        <div class="grid4" style="margin-top:12px">${sel('sourceType','자료 유형','',SOURCE_TYPES)}${txt('sourceName','JD·자료명','','예: 2026 신입 생산기술')}${txt('sourceUrl','원문 URL','','https://...')}${txt('sourceChecked','확인일','',today())}</div>
        <div class="field" style="margin-top:10px"><label>원문에서 확인한 핵심</label><textarea id="sourceNote" placeholder="주요 업무·지원조건·우대사항 등 원문에서 확인한 내용만 간단히 적으세요."></textarea></div>
        <div class="actions"><button class="btn primary" id="addSource">JD·자료 추가</button></div><div id="sourceList"></div>`)}

      ${block('03','Choose JD','분석에 사용할 실제 공고 하나를 선택합니다.',`
        <div class="field"><label>분석할 JD</label><select id="chosenSource"></select></div>
        <div id="chosenPreview" class="callout info" style="margin-top:10px"></div>`)}

      ${block('04','GAP Match','JD의 Gate·Requirement를 STEP 2 Evidence와 비교합니다. 경험을 다시 입력하지 않습니다.',`
        <textarea id="deepPrompt" rows="18">${esc(buildPrompt(ctx.getState(),target,a),ctx)}</textarea>
        <div class="actions"><button class="btn secondary" id="refreshDeepPrompt">현재 JD 반영</button><button class="btn primary" id="copyDeepPrompt">AI GAP 분석 프롬프트 복사</button></div>
        <div class="callout info" style="margin-top:12px"><b>AI 결과 한 번에 불러오기</b><br>마지막 JSON 블록을 붙여넣으면 TASK·Gate·Requirement·GAP이 자동 분리됩니다.</div>
        <textarea id="deepAiImport" rows="8" placeholder="AI 답변의 JSON 블록을 붙여넣으세요."></textarea>
        <div class="actions"><button class="btn secondary" id="importDeepAi">GAP 분석 불러오기</button></div>
        <div id="gapSummary" style="margin-top:12px"></div>
        <div class="actions"><button class="btn primary" id="saveDeep">GAP Match 저장</button><button class="btn secondary" id="nextStep">STEP 5 MY JOBFIT REPORT v1 →</button></div>
        <div class="status" id="status"></div>`)}
    `;
    bind(target,a);renderSources(target,a);renderChosen(a);renderGap(a);
  }

  function bind(target,a){
    document.querySelectorAll('.targetPick').forEach(b=>b.addEventListener('click',()=>{currentId=b.dataset.id;paint()}));
    document.getElementById('addSource')?.addEventListener('click',()=>addSource(target,a));
    document.getElementById('chosenSource')?.addEventListener('change',e=>{a.selectedSourceId=e.target.value;persist(target,a);renderChosen(a);refreshPrompt(target,a)});
    document.getElementById('refreshDeepPrompt')?.addEventListener('click',()=>refreshPrompt(target,a));
    document.getElementById('copyDeepPrompt')?.addEventListener('click',()=>copy(document.getElementById('deepPrompt').value,ctx));
    document.getElementById('importDeepAi')?.addEventListener('click',()=>importDeepAi(target,a));
    document.getElementById('saveDeep')?.addEventListener('click',()=>{capture(a);persist(target,a,true);renderGap(a);ctx.toast('GAP Match를 저장했습니다.')});
    document.getElementById('nextStep')?.addEventListener('click',()=>{capture(a);persist(target,a,true);ctx.navigate(5)});
  }

  function addSource(target,a){
    const name=v('sourceName'),url=v('sourceUrl');if(!name||!url){ctx.toast('자료명과 원문 URL을 입력하세요.');return}
    a.company={name:v('companyName'),url:v('companyUrl'),source:'기업 공식자료'};
    a.sources=a.sources||[];const id='src_'+Date.now();
    a.sources.push({id,type:v('sourceType')||'기업 공식 채용공고',name,url,checkedAt:v('sourceChecked')||today(),note:v('sourceNote')});
    if(!a.selectedSourceId)a.selectedSourceId=id;
    persist(target,a);['sourceName','sourceUrl','sourceNote'].forEach(x=>set(x,''));paint();ctx.toast('JD·자료를 추가했습니다.');
  }

  function importDeepAi(target,a){
    const raw=v('deepAiImport');if(!raw){ctx.toast('AI 분석결과를 먼저 붙여넣어 주세요.');return}
    const x=parseJsonBlock(raw);if(!x||typeof x!=='object'||Array.isArray(x)){ctx.toast('JSON 블록을 읽지 못했습니다.');return}
    for(const k of ['purpose','newHireWork','gate','preference','knowledge','skills','behaviors','experienceRequired','signals','unknowns','have','verify','prepare','conclusion'])if(x[k]!==undefined)a[k]=String(x[k]??'').trim();
    if(Array.isArray(x.tasks))a.tasks=x.tasks.slice(0,5).map((t,i)=>({id:'task_ai_'+Date.now()+'_'+i,name:String(t.name||'').trim(),skill:String(t.skill||'').trim(),output:String(t.output||'').trim(),context:String(t.context||'').trim()})).filter(x=>x.name);
    if(Array.isArray(x.requirements))a.requirements=x.requirements.slice(0,10).map((r,i)=>({id:'req_ai_'+Date.now()+'_'+i,name:String(r.name||'').trim(),type:REQ_TYPES.includes(String(r.type||''))?String(r.type):'기타',status:GAP_STATUS.includes(String(r.status||''))?String(r.status):'확인 필요',evidence:String(r.evidence||'').trim(),gap:String(r.gap||'').trim()})).filter(x=>x.name);
    persist(target,a,true);paint();ctx.toast('GAP 분석을 불러왔습니다. 원문과 STEP 2 경험을 확인해 주세요.');
  }

  function renderSources(target,a){
    const box=document.getElementById('sourceList');if(!box)return;
    if(!a.sources?.length){box.innerHTML='<div class="placeholder"><b>아직 JD가 없습니다.</b>기업 공식 채용공고를 우선 등록하세요.</div>';updateChosenSelect(a);return}
    box.innerHTML=a.sources.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">JD ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc(x.type,ctx)} · ${esc(x.checkedAt||'',ctx)}</div></div><button class="btn danger smallBtn" data-delsrc="${x.id}">삭제</button></div><p>${esc(x.note||'핵심내용 미입력',ctx)}</p><a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">원문 열기 ↗</a></div>`).join('');
    box.querySelectorAll('[data-delsrc]').forEach(b=>b.addEventListener('click',()=>{a.sources=a.sources.filter(x=>x.id!==b.dataset.delsrc);if(a.selectedSourceId===b.dataset.delsrc)a.selectedSourceId=a.sources[0]?.id||'';persist(target,a);paint()}));updateChosenSelect(a);
  }
  function updateChosenSelect(a){const el=document.getElementById('chosenSource');if(!el)return;el.innerHTML='<option value="">JD 선택</option>'+((a.sources||[]).map(x=>`<option value="${x.id}" ${a.selectedSourceId===x.id?'selected':''}>${esc(x.name,ctx)}</option>`).join(''))}
  function renderChosen(a){updateChosenSelect(a);const box=document.getElementById('chosenPreview');if(!box)return;const x=(a.sources||[]).find(s=>s.id===a.selectedSourceId);box.innerHTML=x?`<b>${esc(x.name,ctx)}</b><br>${esc(x.note||'원문 핵심내용을 확인하세요.',ctx)}`:'분석할 JD를 선택하세요.'}
  function renderGap(a){const box=document.getElementById('gapSummary');if(!box)return;const reqs=a.requirements||[],tasks=a.tasks||[];if(!reqs.length&&!tasks.length){box.innerHTML='<div class="callout info">Choose JD 후 AI GAP 분석을 실행하면 결과가 여기에 정리됩니다.</div>';return}box.innerHTML=`
    <div class="grid2"><div class="miniCard"><b>GATE · 필수조건</b><span>${esc(a.gate||'확인 필요',ctx)}</span></div><div class="miniCard"><b>PREFERENCE · 우대조건</b><span>${esc(a.preference||'확인 필요',ctx)}</span></div></div>
    <div class="matrixWrap" style="margin-top:12px"><table class="matrix"><thead><tr><th>JD 요구</th><th>구분</th><th>STEP 2 Evidence</th><th>상태</th><th>GAP</th></tr></thead><tbody>${reqs.map(r=>`<tr><td><b>${esc(r.name,ctx)}</b></td><td>${esc(r.type,ctx)}</td><td>${esc(r.evidence||'없음',ctx)}</td><td><span class="stateTag state-${stateClass(r.status)}">${esc(r.status,ctx)}</span></td><td>${esc(r.gap||'—',ctx)}</td></tr>`).join('')}</tbody></table></div>
    <div class="grid2" style="margin-top:12px"><div class="miniCard"><b>이미 가진 근거</b><span>${esc(a.have||reqs.filter(x=>['근거 있음','일부 근거 있음'].includes(x.status)).map(x=>x.evidence).filter(Boolean).join(' · ')||'—',ctx)}</span></div><div class="miniCard"><b>다음 준비</b><span>${esc(a.prepare||reqs.filter(x=>['확인 필요','준비 필요'].includes(x.status)).map(x=>x.name).join(' · ')||'—',ctx)}</span></div></div>`}
  function capture(a){a.company={name:v('companyName')||a.company?.name||'',url:v('companyUrl')||a.company?.url||'',source:'기업 공식자료'};a.version=VERSION;a.updatedAt=new Date().toISOString();}
  function persist(target,a,sync=false){saved.targetAnalyses[target.id]=a;saved.analyses[target.job.id]={...a,jobTitle:target.job.title,industry:target.industry,targetId:target.id};const patch={jobDeepDive:saved};if(sync)Object.assign(patch,syncDownstream(ctx.getState(),target,a));ctx.saveState({artifacts:patch})}
  function refreshPrompt(target,a){capture(a);persist(target,a);const p=document.getElementById('deepPrompt');if(p)p.value=buildPrompt(ctx.getState(),target,a)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function set(id,x){const el=document.getElementById(id);if(el)el.value=x}
}

function syncDownstream(state,target,a){
  const selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId)||(a.sources||[])[0];
  const postingId='jd_step4_'+slug(target.id);
  const requirements=(a.requirements||[]).filter(r=>!String(r.type).startsWith('Gate')).map((r,i)=>({id:'jdreq_'+i+'_'+slug(r.name),text:r.name,type:normalizeReqType(r.type),level:requirementLevel(r),explicitness:'공고에 명시',sourceQuote:'',evidenceQuestion:'STEP 2 Evidence와 연결 확인'}));
  const gates=lines(a.gate).map((x,i)=>({id:'gate_'+i,text:x,type:'기타',status:'확인 필요',sourceQuote:''}));
  const jdOld=structuredClone(state.artifacts?.jdAnalyzer||{postings:[],selectedId:''});
  const posting={id:postingId,company:a.company?.name||'기업 미정',jobTitle:target.job?.title||'',rawPosting:selected?.note||'',source:selected?.url||'',postingUrl:selected?.url||'',requirements,gates,gateReviewed:!!a.gate,createdAt:new Date().toISOString()};
  jdOld.postings=[...(jdOld.postings||[]).filter(x=>x.id!==postingId),posting];jdOld.selectedId=postingId;
  const experiences=(state.assessments?.experienceCompetency?.experiences||[]).filter(x=>x?.factChecked);
  const assets=(a.requirements||[]).filter(r=>r.name).map((r,i)=>{const ex=findExperience(r.evidence,experiences),level=evidenceLevel(r.status),req=requirements.find(q=>q.text===r.name);return{id:'asset_step4_'+i+'_'+slug(r.name),postingId,experienceId:ex?.id||'',experienceTitle:ex?.title||'',requirementId:req?.id||'',requirement:r.name,requirementType:r.type,requirementLevel:req?.level||'',evidenceQuestion:'',proof:ex?.action||r.evidence||'',fact:r.evidence||ex?.evidence||'',gap:r.gap||'',jobLink:r.name,evidenceLevel:level,strength:level,useFor:'여러 곳',factCheck:ex?.factChecked?'검증완료':'추가확인 필요',sourceExperienceFactChecked:!!ex?.factChecked,createdAt:new Date().toISOString()}});
  const careerAssets={...(state.artifacts?.careerAssets||{}),assets};
  return {jdAnalyzer:jdOld,careerAssets,industryCompany:syncIndustryCompany(state,target,a)};
}
function getTargets(explorer){const combos=Array.isArray(explorer.targetCombos)&&explorer.targetCombos.length?explorer.targetCombos:(explorer.targets||[]).map((jobId,i)=>({id:'target_'+jobId+'_'+(i+1),jobId,industry:'산업 미정',priority:i+1}));return combos.map(c=>({...c,job:explorer.candidates?.find(x=>x.id===c.jobId)})).filter(x=>x.job)}
function defaultAnalysis(target,legacy={}){return {...legacy,targetId:target.id,jobTitle:target.job?.title||'',industry:target.industry||'',company:legacy.company||{name:'',url:'',source:''},sources:legacy.sources||[],selectedSourceId:legacy.selectedSourceId||legacy.sources?.[0]?.id||'',tasks:legacy.tasks||[],requirements:legacy.requirements||[],purpose:legacy.purpose||'',newHireWork:legacy.newHireWork||'',gate:legacy.gate||'',preference:legacy.preference||'',knowledge:legacy.knowledge||'',skills:legacy.skills||'',behaviors:legacy.behaviors||'',experienceRequired:legacy.experienceRequired||'',signals:legacy.signals||'',unknowns:legacy.unknowns||'',have:legacy.have||'',verify:legacy.verify||'',prepare:legacy.prepare||'',conclusion:legacy.conclusion||''}}
function buildPrompt(s,target,a){const ex=(s.assessments?.experienceCompetency?.experiences||[]).filter(x=>x?.factChecked).slice(0,6).map((x,i)=>`${i+1}. ${x.title||'경험'} | 행동: ${x.action||'미입력'} | 결과: ${x.result||'미입력'} | Evidence: ${x.evidence||'미입력'}`).join('\n'),selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId),support=(a.sources||[]).map((x,i)=>`[S${i+1}] ${x.type} | ${x.name} | ${x.url}\n${x.note||''}`).join('\n\n');return `너는 대학생의 실제 채용공고 분석을 돕는 조력자다. 추천이나 합격가능성 판단이 아니라 JD와 학생의 기존 Evidence를 비교한다.

[TARGET]
직무: ${target.job?.title||''}
산업: ${target.industry||'미정'}
기업: ${a.company?.name||'미정'}
선택 JD: ${selected?.name||'미선택'}

[실제 자료]
${support||'등록 자료 없음'}

[STEP 2에서 이미 사실확인된 경험]
${ex||'확인된 경험 없음'}

[규칙]
1. 선택 JD를 최우선 근거로 사용한다.
2. 공고에 없는 조건·경험·수치를 만들지 않는다.
3. Gate(지원자격)와 Requirement(업무·K/S/B/E)를 분리한다.
4. 경험근거를 새로 질문하지 말고 위 STEP 2 경험에서만 연결한다.
5. 연결 근거가 없으면 '없음'으로 두고 준비 필요로 표시한다.
6. 적합도 %, 추천점수, 합격확률은 만들지 않는다.

[출력]
- 실제 TASK 최대 5개
- Gate · 필수조건
- Preference · 우대조건
- Requirement별 STEP 2 Evidence와 GAP
- 앞으로 확인·준비할 것
마지막에 아래 JSON만 유효한 코드블록으로 함께 출력한다.
{"purpose":"직무 목적","newHireWork":"신입 주요업무","gate":"필수조건","preference":"우대조건","knowledge":"필요지식","skills":"기술·도구","behaviors":"행동","experienceRequired":"요구경험","signals":"강조신호","unknowns":"추가확인","tasks":[{"name":"TASK","skill":"필요 SKILL","output":"결과물","context":"업무맥락"}],"requirements":[{"name":"JD 요구","type":"Skill","evidence":"STEP 2 실제 Evidence 또는 없음","status":"근거 있음","gap":"남는 GAP"}],"have":"이미 가진 근거","verify":"더 확인할 것","prepare":"준비할 것","conclusion":"현재 결론"}
status는 근거 있음/일부 근거 있음/확인 필요/준비 필요 중 하나만 사용한다.`}
function syncIndustryCompany(state,target,a){const old=structuredClone(state.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''});let ind=(old.industries||[]).find(x=>x.jobId===target.job.id&&x.name===target.industry);if(!ind){ind={id:'ind_'+target.job.id+'_'+slug(target.industry),name:target.industry,jobId:target.job.id,generatedBy:'step4-inje'};old.industries=[...(old.industries||[]),ind]}if(!(old.targetIndustries||[]).includes(ind.id))old.targetIndustries=[...(old.targetIndustries||[]),ind.id];if(a.company?.name){const id='co_'+slug(target.id),selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId);const company={id,name:a.company.name,industryId:ind.id,jobId:target.job.id,industry:target.industry,job:target.job.title,source:selected?.name||'',url:a.company.url||selected?.url||'',jobUrl:selected?.url||'',hiringEvidence:selected?'JD 확인':'미확인',role:a.purpose||'',targetRef:target.id,generatedBy:'step4-inje'};old.companies=[...(old.companies||[]).filter(x=>x.id!==id),company];if(!(old.targetCompanies||[]).includes(id))old.targetCompanies=[...(old.targetCompanies||[]),id]}return old}
function findExperience(evidence,items){const t=String(evidence||'');return items.find(x=>t.includes(x.title||'')||String(x.action||'').split(/\s+/).filter(w=>w.length>2).some(w=>t.includes(w)))||null}
function evidenceLevel(status){if(status==='근거 있음')return 'A · 직접 증거';if(status==='일부 근거 있음')return 'B · 관련 증거';if(status==='확인 필요')return 'C · 간접 증거';return '없음'}
function requirementLevel(r){return String(r.type).startsWith('Preference')?'우대':['준비 필요','확인 필요'].includes(r.status)?'필수':'업무핵심'}
function normalizeReqType(t=''){if(t.includes('Knowledge'))return 'Knowledge';if(t.includes('Skill'))return 'Skill';if(t.includes('Behavior'))return 'Attitude';if(t.includes('Experience'))return 'Experience';if(t.includes('Tool'))return 'Tool';if(t.includes('Preference'))return 'Preferred';return 'Task'}
function lines(x=''){return String(x).split(/\n|·|;/).map(x=>x.trim()).filter(Boolean)}
function block(n,title,desc,body){return `<div class="hr"></div><div class="block"><div class="moduleHead"><span>${n}</span><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`}
function parseJsonBlock(raw=''){const text=String(raw).trim(),fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i),source=(fenced?.[1]||text).trim();try{return JSON.parse(source)}catch{}const s=source.indexOf('{'),e=source.lastIndexOf('}');if(s>=0&&e>s){try{return JSON.parse(source.slice(s,e+1))}catch{}}return null}
function stateClass(x=''){return x==='근거 있음'?'good':x==='일부 근거 있음'?'partial':x==='준비 필요'?'prepare':'verify'}
function slug(x=''){return String(x||'').trim().replace(/[^0-9A-Za-z가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'item'}
function today(){return new Date().toISOString().slice(0,10)}function esc(x,ctx){return ctx.escapeHtml(String(x??''))}
async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}
function styleBlock(){return `<style>.jobAnalysisInje .moduleHead{display:flex;gap:11px;align-items:flex-start}.jobAnalysisInje .moduleHead>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#eef3ff;color:#3152c9;font-weight:950;flex:0 0 auto}.jobAnalysisInje .moduleHead h3{margin:2px 0 3px}.jobAnalysisInje .moduleHead p{margin:0;color:#667085;font-size:12px;line-height:1.5}.activePick{background:#eef3ff!important;color:#3152c9!important}.stateTag{display:inline-flex;padding:5px 8px;border-radius:999px;font-weight:900;font-size:11px}.state-good{background:#ecfdf7;color:#087a63}.state-partial{background:#eef3ff;color:#3152c9}.state-prepare{background:#fff8e6;color:#9a6700}.state-verify{background:#f2f4f7;color:#667085}</style>`}

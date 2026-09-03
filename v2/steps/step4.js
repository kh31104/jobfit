const SOURCE_TYPES=['기업 공식 직무소개','기업 공식 채용공고','NCS','고용24 직업정보','공공기관·정부자료','산업협회·전문기관','기타'];
const REQ_TYPES=['Task','Knowledge','Skill','Attitude','Tool','Experience','Qualification','기타'];

export async function render(ctx){
  const s=ctx.getState();
  const explorer=s.artifacts?.jobExplorer||{candidates:[],targets:[]};
  const saved=s.artifacts?.jobDeepDive||{analyses:{}};
  const targetJobs=(explorer.targets||[]).map(id=>explorer.candidates?.find(x=>x.id===id)).filter(Boolean);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 4</div><h2>Job Deep Dive</h2><p>직무명을 보는 데서 멈추지 않고 실제 Task·KSA·KPI·Tool·협업대상·요구경험을 출처별로 확인합니다.</p></div><span class="badge">6주차 · 분석</span></div>
    <div class="progress"><span style="width:36%"></span></div>
    <div class="callout info"><b>핵심 원칙</b><br>같은 직무명이라도 기업·산업에 따라 실제 Task가 다를 수 있습니다. 최소 2개 출처를 교차확인하고, <b>각 Task가 어디서 확인됐는지</b> 남깁니다.</div>
    ${targetJobs.length?`<div class="block"><h3>1. 분석할 Target Job</h3><div class="pillRow">${targetJobs.map((j,i)=>`<button class="btn outline smallBtn jobPick" data-id="${j.id}">${i+1}. ${esc(j.title,ctx)}</button>`).join('')}</div></div>`:`<div class="callout warn"><b>Target Job이 아직 없습니다.</b><br>STEP 3에서 직무 후보를 만들고 최대 3개를 선택한 뒤 돌아오세요.</div>`}
    <div id="analysisRoot"></div>
  </section>`;

  if(!targetJobs.length)return;
  let currentId=targetJobs[0].id;
  root.querySelectorAll('.jobPick').forEach(b=>b.addEventListener('click',()=>{currentId=b.dataset.id;paint()}));
  paint();

  function paint(){
    const job=explorer.candidates.find(x=>x.id===currentId);
    const a=structuredClone(saved.analyses?.[currentId]||defaultAnalysis(job));
    const box=document.getElementById('analysisRoot');
    box.innerHTML=`<div class="hr"></div>
      <div class="block"><div class="sectionHead"><div><h3>2. ${esc(job.title,ctx)} — Source Register</h3><p class="help">AI 답변 자체는 출처로 인정하지 않습니다. 기업 공식자료·채용공고·NCS·고용24 등 실제 자료를 등록하세요.</p></div><span class="badge">${sourceQualityLabel(a.sources)}</span></div>
        <div class="grid4">
          ${sel('sourceType','출처 유형','',SOURCE_TYPES)}
          ${txt('sourceName','자료명','','예: 2026 하반기 생산기술 신입공고')}
          ${txt('sourceUrl','URL','','https://...')}
          ${txt('sourceChecked','확인일','',today())}
        </div>
        <div class="field" style="margin-top:12px"><label>이 출처에서 확인한 핵심 내용</label><textarea id="sourceNote" placeholder="Task·KSA·Tool·요구경험 중 실제로 확인된 내용만 짧게 기록"></textarea></div>
        <div class="actions"><button class="btn primary" id="addSource">출처 추가</button></div><div id="sourceList" style="margin-top:12px"></div>
      </div>

      <div class="hr"></div><div class="block"><h3>3. Task Evidence Map</h3><p class="help">직무의 대표업무를 하나씩 등록하고 어느 출처에서 확인했는지 연결합니다. 여러 출처에서 반복 확인된 Task는 신뢰도가 높아집니다.</p>
        <div class="grid3">${txt('taskName','실제 Task','','예: 공정 이상 원인 분석')}${selSource('taskSource','근거 출처',a.sources)}${sel('taskImportance','업무 중요도','',['핵심','중요','보조'])}</div>
        <div class="grid2" style="margin-top:12px">${area('taskOutput','주요 산출물·결과','','이 Task를 수행하면 무엇이 만들어지거나 개선되는가?')}${area('taskContext','업무맥락·협업대상','','누구와 협업하며 어떤 상황에서 수행하는가?')}</div>
        <div class="actions"><button class="btn primary" id="addTask">Task 추가</button></div><div id="taskList" style="margin-top:12px"></div>
      </div>

      <div class="hr"></div><div class="block"><h3>4. 직무 핵심 구조</h3><div class="grid2">
        ${area('ksa','KSA',a.ksa,'Knowledge / Skill / Attitude를 구분해 정리')}
        ${area('kpi','KPI·성과기준',a.kpi,'성과를 무엇으로 판단하는가? 자료에 없으면 확인되지 않음')}
        ${area('tools','Tool·시스템·방법',a.tools,'예: Excel, SAP, Python, 장비, 분석기법')}
        ${area('entry','신입 진입경로·선호경험',a.entry,'전공, 프로젝트, 인턴, 자격, 포트폴리오 등')}
        ${area('workContext','업무환경·협업대상',a.workContext,'현장/사무/고객접점, 주요 협업부서 등')}
        ${area('variation','기업·산업별 달라질 수 있는 부분',a.variation,'직무명이 같아도 달라지는 Task·Tool·고객·KPI를 기록')}
      </div></div>

      <div class="hr"></div><div class="block"><h3>5. AI 직무분석 검증 프롬프트</h3><p class="help">등록한 근거만 사용해 구조화하도록 합니다. 자료에 없는 내용은 반드시 ‘확인되지 않음’으로 남깁니다.</p><textarea id="deepPrompt" rows="14">${esc(buildPrompt(job,a),ctx)}</textarea><div class="actions"><button class="btn secondary" id="copyDeepPrompt">프롬프트 복사</button></div></div>

      <div class="hr"></div><div class="block"><h3>6. Requirement × My Evidence Matrix</h3><p class="help">직무 요구와 내 경험의 증거를 분리합니다. ‘관련 경험 없음’도 중요한 GAP 정보입니다.</p>
        <div class="grid4">${txt('reqName','요구사항','','예: 데이터 분석')}${sel('reqType','구분','',REQ_TYPES)}${sel('reqImportance','중요도','',['핵심','중요','보조'])}${sel('reqEvidenceLevel','Evidence 수준','',['A · 직접 증거','B · 관련 증거','C · 간접 증거','없음'])}</div>
        <div class="grid2" style="margin-top:12px">${area('reqEvidence','나의 Evidence','','내가 실제로 한 행동·성과·과목·프로젝트')}${area('reqGap','현재 GAP','','부족한 경험·지식·도구·자격')}</div>
        <div class="actions"><button class="btn primary" id="addReq">요구사항 추가</button></div><div id="matrixBox" style="margin-top:14px"></div>
      </div>

      <div class="hr"></div><div class="block"><h3>7. 직무분석 결론</h3>
        <div class="grid2">${area('coreDefinition','이 직무의 본질',a.coreDefinition,'직무명을 쓰지 않고, 반복적으로 해결하는 문제와 만들어내는 결과로 정의')}${area('conclusion','나의 결론',a.conclusion,'내 강점 Evidence / 가장 큰 GAP / 더 확인할 점')}</div>
        <div class="callout ${analysisReady(a)?'good':'warn'}" id="coverageBox">${coverageText(a)}</div>
        <div class="actions"><button class="btn primary" id="saveDeep">${esc(job.title,ctx)} 분석 저장</button><button class="btn secondary" id="nextStep">STEP 5 Industry & Company →</button></div><div class="status" id="status"></div>
      </div>`;

    renderSources(a);renderTasks(a);renderMatrix(a);
    document.getElementById('addSource').addEventListener('click',()=>addSource(job,a));
    document.getElementById('addTask').addEventListener('click',()=>addTask(job,a));
    document.getElementById('addReq').addEventListener('click',()=>addRequirement(job,a));
    document.getElementById('copyDeepPrompt').addEventListener('click',()=>copy(document.getElementById('deepPrompt').value,ctx));
    document.getElementById('saveDeep').addEventListener('click',()=>save(job,a));
    document.getElementById('nextStep').addEventListener('click',()=>{save(job,a);ctx.navigate(5)});
  }

  function addSource(job,a){const name=v('sourceName'),url=v('sourceUrl');if(!name||!url){ctx.toast('자료명과 URL을 입력하세요.');return;}a.sources=a.sources||[];a.sources.push({id:`src_${Date.now()}`,type:v('sourceType'),name,url,checkedAt:v('sourceChecked'),note:v('sourceNote')});persist(job.id,a);['sourceName','sourceUrl','sourceNote'].forEach(id=>set(id,''));renderSources(a);refresh(a);ctx.toast('근거 출처를 추가했습니다.');}
  function addTask(job,a){const name=v('taskName');if(!name){ctx.toast('Task를 입력하세요.');return;}a.tasks=a.tasks||[];a.tasks.push({id:`task_${Date.now()}`,name,sourceId:v('taskSource'),importance:v('taskImportance'),output:v('taskOutput'),context:v('taskContext')});persist(job.id,a);['taskName','taskOutput','taskContext'].forEach(id=>set(id,''));renderTasks(a);refresh(a);ctx.toast('Task Evidence를 추가했습니다.');}
  function addRequirement(job,a){const name=v('reqName');if(!name){ctx.toast('요구사항을 입력하세요.');return;}a.requirements=a.requirements||[];a.requirements.push({id:`req_${Date.now()}`,name,type:v('reqType'),importance:v('reqImportance'),evidenceLevel:v('reqEvidenceLevel'),evidence:v('reqEvidence'),gap:v('reqGap')});persist(job.id,a);['reqName','reqEvidence','reqGap'].forEach(id=>set(id,''));renderMatrix(a);refresh(a);ctx.toast('요구사항을 추가했습니다.');}

  function renderSources(a){const box=document.getElementById('sourceList');if(!box)return;if(!a.sources?.length){box.innerHTML='<div class="placeholder"><b>아직 근거 출처가 없습니다.</b>최소 2개, 가능하면 기업 공식자료/채용공고를 포함하세요.</div>';return;}box.innerHTML=a.sources.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">Source ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc(x.type||'유형 미입력',ctx)} · 확인 ${esc(x.checkedAt||'미입력',ctx)}</div></div><button class="btn danger smallBtn" data-delsrc="${x.id}">삭제</button></div><p>${esc(x.note||'핵심내용 미입력',ctx)}</p><div class="sourceLine"><a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">원문 열기 ↗</a></div></div>`).join('');box.querySelectorAll('[data-delsrc]').forEach(b=>b.addEventListener('click',()=>{a.sources=a.sources.filter(x=>x.id!==b.dataset.delsrc);a.tasks=(a.tasks||[]).map(t=>t.sourceId===b.dataset.delsrc?{...t,sourceId:''}:t);persist(currentId,a);paint();}));}
  function renderTasks(a){const box=document.getElementById('taskList');if(!box)return;if(!a.tasks?.length){box.innerHTML='<div class="placeholder"><b>아직 Task Evidence가 없습니다.</b>실제 수행업무를 출처와 함께 등록하세요.</div>';return;}box.innerHTML=a.tasks.map((t,i)=>{const src=a.sources?.find(x=>x.id===t.sourceId);const repeat=countTaskMentions(a,t.name);return `<div class="listCard"><div class="listHead"><div><span class="rankTag">Task ${i+1}</span><h3>${esc(t.name,ctx)}</h3><div class="muted small">${esc(t.importance||'중요도 미입력',ctx)} · ${esc(src?.name||'출처 미연결',ctx)}</div></div><span class="scoreChip">확인 ${repeat}회</span></div><div class="grid2"><div><b>산출물·결과</b><p>${esc(t.output||'—',ctx)}</p></div><div><b>맥락·협업</b><p>${esc(t.context||'—',ctx)}</p></div></div><div class="actions"><button class="btn danger smallBtn" data-deltask="${t.id}">삭제</button></div></div>`}).join('');box.querySelectorAll('[data-deltask]').forEach(b=>b.addEventListener('click',()=>{a.tasks=a.tasks.filter(x=>x.id!==b.dataset.deltask);persist(currentId,a);paint();}));}
  function renderMatrix(a){const box=document.getElementById('matrixBox');if(!box)return;if(!a.requirements?.length){box.innerHTML='<div class="placeholder"><b>아직 요구사항이 없습니다.</b>공식자료와 채용공고에서 반복되는 요구를 추가하세요.</div>';return;}box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>요구</th><th>구분</th><th>중요도</th><th>Evidence 수준</th><th>나의 Evidence</th><th>GAP</th><th></th></tr></thead><tbody>${a.requirements.map(r=>`<tr><td><b>${esc(r.name,ctx)}</b></td><td>${esc(r.type,ctx)}</td><td>${esc(r.importance,ctx)}</td><td>${esc(r.evidenceLevel||'미평가',ctx)}</td><td>${esc(r.evidence||'없음',ctx)}</td><td>${esc(r.gap||'—',ctx)}</td><td><button class="btn danger smallBtn" data-delreq="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table></div>`;box.querySelectorAll('[data-delreq]').forEach(b=>b.addEventListener('click',()=>{a.requirements=a.requirements.filter(x=>x.id!==b.dataset.delreq);persist(currentId,a);renderMatrix(a);refresh(a);}));}

  function save(job,a){['ksa','kpi','tools','entry','workContext','variation','coreDefinition','conclusion'].forEach(k=>a[k]=v(k));a.jobTitle=job.title;a.updatedAt=new Date().toISOString();persist(job.id,a);refresh(a);document.getElementById('status').textContent='직무분석을 저장했습니다.';ctx.toast('Job Deep Dive를 저장했습니다.');}
  function refresh(a){const c=document.getElementById('coverageBox');if(c){c.className=`callout ${analysisReady(a)?'good':'warn'}`;c.textContent=coverageText(a)}const p=document.getElementById('deepPrompt');if(p)p.value=buildPrompt(explorer.candidates.find(x=>x.id===currentId),a);}
  function persist(id,a){saved.analyses=saved.analyses||{};saved.analyses[id]=a;ctx.saveState({artifacts:{jobDeepDive:saved}})}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
}

function defaultAnalysis(job){return {jobTitle:job.title,sources:[],tasks:[],ksa:'',kpi:'',tools:'',entry:'',workContext:'',variation:'',requirements:[],coreDefinition:'',conclusion:''}}
function analysisReady(a){return (a.sources?.length||0)>=2&&(a.tasks?.length||0)>=3&&(a.requirements?.length||0)>=3}
function coverageText(a){const s=a.sources?.length||0,t=a.tasks?.length||0,r=a.requirements?.length||0;return analysisReady(a)?`분석 근거가 기본 기준을 충족했습니다. 출처 ${s}개 · Task ${t}개 · 요구사항 ${r}개. 이제 산업·기업별 차이를 확인하세요.`:`분석 보강 필요: 출처 ${s}/2+ · Task ${t}/3+ · 요구사항 ${r}/3+. 수량보다 실제 근거와 출처 연결이 우선입니다.`}
function sourceQualityLabel(s=[]){const official=s.filter(x=>['기업 공식 직무소개','기업 공식 채용공고','NCS','고용24 직업정보','공공기관·정부자료'].includes(x.type)).length;return s.length>=2&&official>=1?'근거 교차확인':'근거 보강'}
function countTaskMentions(a,name){const key=normalize(name);const notes=(a.sources||[]).filter(s=>normalize(s.note).includes(key)).length;return Math.max(1,notes)}
function normalize(x=''){return String(x).replace(/\s+/g,'').toLowerCase()}
function buildPrompt(job,a){const sources=(a.sources||[]).map((x,i)=>`[S${i+1}] ${x.type} | ${x.name} | ${x.url}\n메모: ${x.note||''}`).join('\n\n');const tasks=(a.tasks||[]).map((t,i)=>`${i+1}. ${t.name} | ${t.importance||''} | ${t.output||''}`).join('\n');return `너는 직무분석 리서처다. 아래에 등록된 근거 외의 사실은 추가하지 마라. 자료에 없으면 반드시 '자료에서 확인되지 않음'이라고 표시해라.\n\n[분석 직무]\n${job?.title||''}\n\n[등록 출처]\n${sources||'없음'}\n\n[내가 확인한 Task]\n${tasks||'없음'}\n\n[기존 메모]\nKSA: ${a.ksa||''}\nKPI: ${a.kpi||''}\nTool: ${a.tools||''}\n진입경로: ${a.entry||''}\n업무환경: ${a.workContext||''}\n\n다음 순서로 정리해줘.\n1. 여러 출처에서 공통으로 확인되는 핵심 Task\n2. 특정 기업·산업에서만 나타나는 Task\n3. Knowledge / Skill / Attitude\n4. Tool·시스템·방법\n5. KPI 또는 성과기준\n6. 신입에게 요구되는 경험·자격·교육\n7. 자료 간 불일치 또는 직무명은 같지만 내용이 다른 부분\n8. 추가로 확인해야 할 정보\n\n각 주장 끝에 [S1], [S2]처럼 근거 출처를 붙여라. 추측·일반론·가상의 수치는 금지한다.`}
function selSource(id,label,sources=[]){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${sources.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}
function today(){return new Date().toISOString().slice(0,10)}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

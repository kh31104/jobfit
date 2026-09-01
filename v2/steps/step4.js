export async function render(ctx){
  const s=ctx.getState();
  const explorer=s.artifacts?.jobExplorer||{candidates:[],targets:[]};
  const saved=s.artifacts?.jobDeepDive||{analyses:{}};
  const targetJobs=(explorer.targets||[]).map(id=>explorer.candidates?.find(x=>x.id===id)).filter(Boolean);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`
  <section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 4</div><h2>Job Deep Dive</h2><p>선택한 직무가 실제로 무엇을 하는지, 공식자료와 채용공고를 근거로 Task·KSA·KPI·요구경험까지 분석합니다.</p></div><span class="badge">6주차 · 분석</span></div>
    <div class="progress"><span style="width:36%"></span></div>

    ${targetJobs.length?`<div class="block"><h3>1. 분석할 Target Job</h3><div class="pillRow">${targetJobs.map((j,i)=>`<button class="btn outline smallBtn jobPick" data-id="${j.id}">${i+1}. ${esc(j.title,ctx)}</button>`).join('')}</div></div>`:`<div class="callout warn"><b>Target Job이 아직 없습니다.</b><br>STEP 3에서 직무 후보를 만들고 최대 3개를 선택한 뒤 돌아오세요.</div>`}

    <div id="analysisRoot"></div>
  </section>`;

  if(!targetJobs.length)return;
  let currentId=targetJobs[0].id;
  root.querySelectorAll('.jobPick').forEach(b=>b.addEventListener('click',()=>{currentId=b.dataset.id;paint()}));
  paint();

  function paint(){
    const job=explorer.candidates.find(x=>x.id===currentId);
    const a=saved.analyses?.[currentId]||defaultAnalysis(job);
    const box=document.getElementById('analysisRoot');
    box.innerHTML=`
      <div class="hr"></div>
      <div class="block"><h3>2. ${esc(job.title,ctx)} — 공식 직무근거</h3><p class="help">최소 2개 이상의 출처를 확인하세요. AI 답변은 출처가 아니라 탐색 보조도구입니다.</p>
        <div class="grid3">
          ${txt('source1','출처 1',a.source1,'예: NCS 직무기술서')}
          ${txt('url1','URL 1',a.url1,'https://...')}
          ${txt('checked1','확인일',a.checked1,'YYYY-MM-DD')}
          ${txt('source2','출처 2',a.source2,'예: 기업 공식 직무소개')}
          ${txt('url2','URL 2',a.url2,'https://...')}
          ${txt('checked2','확인일',a.checked2,'YYYY-MM-DD')}
        </div>
      </div>

      <div class="block"><h3>3. 직무 핵심 구조</h3>
        <div class="grid2">
          ${area('tasks','핵심 Task',a.tasks,'실제 수행업무를 3~7개로 정리')}
          ${area('ksa','KSA',a.ksa,'Knowledge / Skill / Attitude를 구분해 정리')}
          ${area('kpi','주요 KPI·성과기준',a.kpi,'이 직무의 성과를 무엇으로 판단하는가?')}
          ${area('tools','Tool·시스템·방법',a.tools,'예: Excel, SAP, Python, 분석도구, 장비')}
          ${area('entry','신입 진입경로·선호경험',a.entry,'전공, 프로젝트, 인턴, 자격, 포트폴리오 등')}
          ${area('workContext','업무환경·협업대상',a.workContext,'누구와 일하고 어떤 환경에서 업무하는가?')}
        </div>
      </div>

      <div class="hr"></div>
      <div class="block"><h3>4. AI 직무분석 검증 프롬프트</h3><p class="help">아래에 확인한 공식자료 내용을 넣고 외부 AI에서 구조화하세요. AI가 새로운 사실을 임의로 추가하지 않도록 설계했습니다.</p>
        <textarea id="deepPrompt" rows="13">${esc(buildPrompt(job,a),ctx)}</textarea><div class="actions"><button class="btn secondary" id="copyDeepPrompt">프롬프트 복사</button></div>
      </div>

      <div class="hr"></div>
      <div class="block"><h3>5. Requirement × My Evidence Matrix</h3><p class="help">채용에서 요구되는 항목과 내가 이미 가진 증거를 분리해 봅니다. ‘없음’도 중요한 결과입니다.</p>
        <div class="grid3">
          ${txt('reqName','요구사항','','예: 데이터 분석')}
          ${sel('reqType','구분','',['Task','Knowledge','Skill','Attitude','Tool','Experience','Qualification','기타'])}
          ${sel('reqImportance','중요도','',['핵심','중요','보조'])}
        </div>
        <div class="grid2" style="margin-top:12px">
          ${area('reqEvidence','나의 Evidence','','이 요구를 증명할 경험·성과·과목·프로젝트가 있는가?')}
          ${area('reqGap','현재 GAP','','부족하다면 무엇이 부족한가?')}
        </div>
        <div class="actions"><button class="btn primary" id="addReq">요구사항 추가</button></div>
        <div id="matrixBox" style="margin-top:14px"></div>
      </div>

      <div class="hr"></div>
      <div class="block"><h3>6. 직무분석 한 문장 결론</h3>
        ${area('conclusion','내 결론',a.conclusion,'예: 이 직무는 ○○을 반복적으로 수행하며, 나에게는 △△ 경험이 강점이고 □□가 가장 큰 GAP이다.')}
        <div class="actions"><button class="btn primary" id="saveDeep">${esc(job.title,ctx)} 분석 저장</button><button class="btn secondary" id="nextStep">STEP 5 Industry & Company →</button></div><div class="status" id="status"></div>
      </div>`;

    renderMatrix(a);
    document.getElementById('copyDeepPrompt').addEventListener('click',()=>copy(document.getElementById('deepPrompt').value,ctx));
    document.getElementById('addReq').addEventListener('click',()=>addRequirement(job,a));
    document.getElementById('saveDeep').addEventListener('click',()=>save(job,a));
    document.getElementById('nextStep').addEventListener('click',()=>{save(job,a);ctx.navigate(5)});
  }

  function addRequirement(job,a){
    const name=v('reqName'); if(!name){ctx.toast('요구사항을 입력하세요.');return;}
    a.requirements=a.requirements||[];
    a.requirements.push({id:`req_${Date.now()}`,name,type:v('reqType'),importance:v('reqImportance'),evidence:v('reqEvidence'),gap:v('reqGap')});
    persist(job.id,a);['reqName','reqEvidence','reqGap'].forEach(id=>document.getElementById(id).value='');renderMatrix(a);ctx.toast('요구사항을 추가했습니다.');
  }
  function renderMatrix(a){
    const box=document.getElementById('matrixBox');if(!box)return;
    if(!a.requirements?.length){box.innerHTML='<div class="placeholder"><b>아직 요구사항이 없습니다.</b>공식자료와 채용공고에서 반복되는 요구를 하나씩 추가하세요.</div>';return;}
    box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>요구</th><th>구분</th><th>중요도</th><th>나의 Evidence</th><th>GAP</th><th></th></tr></thead><tbody>${a.requirements.map(r=>`<tr><td><b>${esc(r.name,ctx)}</b></td><td>${esc(r.type,ctx)}</td><td>${esc(r.importance,ctx)}</td><td>${esc(r.evidence||'없음',ctx)}</td><td>${esc(r.gap||'—',ctx)}</td><td><button class="btn danger smallBtn" data-delreq="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table></div>`;
    box.querySelectorAll('[data-delreq]').forEach(b=>b.addEventListener('click',()=>{a.requirements=a.requirements.filter(x=>x.id!==b.dataset.delreq);persist(currentId,a);renderMatrix(a);}));
  }
  function save(job,a){
    ['source1','url1','checked1','source2','url2','checked2','tasks','ksa','kpi','tools','entry','workContext','conclusion'].forEach(k=>a[k]=v(k));
    a.jobTitle=job.title;a.updatedAt=new Date().toISOString();persist(job.id,a);document.getElementById('status').textContent='직무분석을 저장했습니다.';ctx.toast('Job Deep Dive를 저장했습니다.');
  }
  function persist(id,a){saved.analyses=saved.analyses||{};saved.analyses[id]=a;ctx.saveState({artifacts:{jobDeepDive:saved}})}
  function v(id){return document.getElementById(id)?.value?.trim()||''}
}

function defaultAnalysis(job){return {jobTitle:job.title,source1:'',url1:'',checked1:'',source2:'',url2:'',checked2:'',tasks:'',ksa:'',kpi:'',tools:'',entry:'',workContext:'',requirements:[],conclusion:''}}
function buildPrompt(job,a){return `너는 직무분석 리서처다. 아래 자료에 실제로 적힌 내용만 구조화해줘. 확인되지 않은 일반론은 추가하지 말고, 자료에 없으면 '자료에서 확인되지 않음'이라고 표시해줘.\n\n[분석 직무]\n${job.title}\n\n[출처 1]\n${a.source1||''}\n${a.url1||''}\n\n[출처 2]\n${a.source2||''}\n${a.url2||''}\n\n[내가 읽고 메모한 내용]\n핵심 Task: ${a.tasks||''}\nKSA: ${a.ksa||''}\nKPI: ${a.kpi||''}\nTool: ${a.tools||''}\n진입경로/선호경험: ${a.entry||''}\n업무환경: ${a.workContext||''}\n\n다음 순서로 정리해줘.\n1. 실제 핵심 Task 5개 이내\n2. Knowledge / Skill / Attitude\n3. Tool·시스템·방법\n4. KPI 또는 성과기준\n5. 신입에게 요구되는 경험·자격·교육\n6. 반복적으로 확인되는 핵심 요구 5개\n7. 자료 간 일치하는 부분 / 서로 다른 부분\n8. 추가 확인이 필요한 정보\n\n각 항목 뒤에 어느 출처에서 확인했는지 표시하고, 추측은 하지 마.`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}
function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}
async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

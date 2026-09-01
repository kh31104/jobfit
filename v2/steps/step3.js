export async function render(ctx){
  const s=ctx.getState();
  const dna=s.assessments?.careerDNA||{};
  const exp=s.artifacts?.experienceCompetency||{};
  const saved=s.artifacts?.jobExplorer||{candidates:[],targets:[],notes:''};
  const root=document.getElementById('stepRoot');

  root.innerHTML=`
  <section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 3</div><h2>Job Explorer</h2><p>검사결과로 직무를 단정하지 않고, 나의 흥미·가치·경험 근거를 바탕으로 직무 후보를 넓게 탐색합니다.</p></div><span class="badge">6주차 · 탐색</span></div>
    <div class="progress"><span style="width:29%"></span></div>

    <div class="callout info"><b>이 STEP의 원칙</b><br>Jobfit은 특정 직무를 자동으로 정답처럼 추천하지 않습니다. 후보를 만들고 근거를 비교한 뒤 <b>학생이 직접 Target Job 1·2·3을 선택</b>합니다.</div>

    <div class="block"><h3>1. 나의 탐색 근거 확인</h3><p class="help">직무 후보를 만들 때 최소 두 종류 이상의 근거를 사용합니다. 검사 하나만으로 직무를 결정하지 않습니다.</p>
      <div class="grid3">
        <div class="miniCard"><b>흥미</b><span>${esc(summaryRIASEC(dna),ctx)}</span></div>
        <div class="miniCard"><b>가치</b><span>${esc((dna.valuesTop||dna.workValuesTop||[]).join(', ')||dna.valuesSummary||'STEP 1에서 입력',ctx)}</span></div>
        <div class="miniCard"><b>경험·역량</b><span>${esc(summaryCompetencies(exp),ctx)}</span></div>
      </div>
    </div>

    <div class="hr"></div>
    <div class="block"><h3>2. AI 직무탐색 프롬프트</h3><p class="help">외부 AI에서 후보를 넓게 찾는 용도입니다. 결과는 그대로 채택하지 말고 공식 직무정보·채용공고로 검증합니다.</p>
      <textarea id="jobPrompt" rows="12">${esc(buildPrompt(s),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="copyPrompt">프롬프트 복사</button></div>
    </div>

    <div class="hr"></div>
    <div class="block"><h3>3. 직무 후보 Pool</h3><p class="help">AI 결과, NCS, 고용24 직업정보, 기업 직무소개, 실제 채용공고 등을 확인하면서 최대 10개 정도까지 후보를 넓게 기록하세요.</p>
      <div class="grid2">
        ${txt('jobTitle','직무명','','예: 구매, 공정기술, 데이터분석')}
        ${txt('jobFamily','직무군','','예: 영업·마케팅 / 생산·품질 / IT·데이터')}
        ${txt('source','확인 출처','','예: NCS, 기업 직무소개, 채용공고')}
        ${txt('sourceUrl','출처 URL','','https://...')}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${area('why','관심 근거','','왜 이 직무가 궁금한가?')}
        ${area('evidence','나의 근거','','내 흥미·가치·경험 중 무엇과 연결되는가?')}
      </div>
      <div class="grid3" style="margin-top:12px">
        ${score('interestScore','관심도')}${score('evidenceScore','경험근거')}${score('valueScore','가치적합')}
      </div>
      <div class="actions"><button class="btn primary" id="addCandidate">후보 추가</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="candidateList"></div></div>

    <div class="hr"></div>
    <div class="block"><h3>4. Target Job 1·2·3 직접 선택</h3><p class="help">탐색우선점수는 학생이 입력한 관심도·경험근거·가치적합의 단순 평균이며, 심리검사 기반의 ‘적합도 점수’가 아닙니다. 최종선택은 본인이 합니다.</p>
      <div id="targetPick"></div>
      <div class="field" style="margin-top:12px"><label>선택 메모</label><textarea id="notes" placeholder="왜 이 3개를 더 깊게 확인하려 하는지 적어보세요.">${esc(saved.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveTargets">Target Job 저장</button><button class="btn secondary" id="nextStep">STEP 4 Job Deep Dive →</button></div>
    </div>
  </section>`;

  let data=structuredClone(saved);
  renderCandidates();renderTargets();
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(document.getElementById('jobPrompt').value,ctx));
  document.getElementById('addCandidate').addEventListener('click',addCandidate);
  document.getElementById('saveTargets').addEventListener('click',saveTargets);
  document.getElementById('nextStep').addEventListener('click',()=>{saveTargets();ctx.navigate(4)});

  function addCandidate(){
    const title=v('jobTitle'); if(!title){setStatus('직무명을 입력하세요.');return;}
    data.candidates=data.candidates||[];
    data.candidates.push({id:`job_${Date.now()}`,title,family:v('jobFamily'),source:v('source'),sourceUrl:v('sourceUrl'),why:v('why'),evidence:v('evidence'),interestScore:n('interestScore'),evidenceScore:n('evidenceScore'),valueScore:n('valueScore'),createdAt:new Date().toISOString()});
    ['jobTitle','jobFamily','source','sourceUrl','why','evidence'].forEach(id=>document.getElementById(id).value='');
    ['interestScore','evidenceScore','valueScore'].forEach(id=>document.getElementById(id).value='3');
    persist();renderCandidates();renderTargets();setStatus('직무 후보를 추가했습니다.');
  }
  function renderCandidates(){
    const box=document.getElementById('candidateList');
    if(!data.candidates?.length){box.innerHTML='<div class="placeholder"><b>아직 직무 후보가 없습니다.</b>AI와 공식자료를 이용해 넓게 탐색한 뒤 후보를 추가하세요.</div>';return;}
    box.innerHTML=data.candidates.map((j,i)=>{const avg=((+j.interestScore||0)+(+j.evidenceScore||0)+(+j.valueScore||0))/3;return `<div class="listCard"><div class="listHead"><div><span class="rankTag">후보 ${i+1}</span><h3>${esc(j.title,ctx)}</h3><div class="muted small">${esc(j.family||'직무군 미입력',ctx)}</div></div><div class="scoreChip">탐색우선 ${avg.toFixed(1)}/5</div></div><div class="grid2"><div><b>관심 근거</b><p>${esc(j.why||'—',ctx)}</p></div><div><b>나의 근거</b><p>${esc(j.evidence||'—',ctx)}</p></div></div><div class="sourceLine"><b>확인 출처</b> ${esc(j.source||'미입력',ctx)} ${j.sourceUrl?`· <a href="${esc(j.sourceUrl,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div><div class="pillRow"><span class="pill">관심 ${j.interestScore||0}</span><span class="pill">경험근거 ${j.evidenceScore||0}</span><span class="pill">가치적합 ${j.valueScore||0}</span></div><div class="actions"><button class="btn danger smallBtn" data-del="${j.id}">삭제</button></div></div>`}).join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.del;data.candidates=data.candidates.filter(x=>x.id!==id);data.targets=(data.targets||[]).filter(x=>x!==id);persist();renderCandidates();renderTargets();}));
  }
  function renderTargets(){
    const box=document.getElementById('targetPick');
    if(!data.candidates?.length){box.innerHTML='<div class="callout warn">먼저 직무 후보를 추가하세요.</div>';return;}
    box.innerHTML=data.candidates.map(j=>`<label class="checkRow"><input type="checkbox" data-target="${j.id}" ${(data.targets||[]).includes(j.id)?'checked':''}><div><b>${esc(j.title,ctx)}</b><span>${esc(j.family||'',ctx)}</span></div></label>`).join('');
    box.querySelectorAll('[data-target]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-target]:checked')].map(x=>x.dataset.target);if(ids.length>3){c.checked=false;ctx.toast('Target Job은 최대 3개까지 선택합니다.');} }));
  }
  function saveTargets(){
    const box=document.getElementById('targetPick');
    data.targets=box?[...box.querySelectorAll('[data-target]:checked')].map(x=>x.dataset.target):data.targets||[];
    data.notes=v('notes');persist();setStatus(data.targets.length?`Target Job ${data.targets.length}개를 저장했습니다.`:'후보 Pool은 저장되었습니다. Target Job은 나중에 선택해도 됩니다.');
  }
  function persist(){ctx.saveState({artifacts:{jobExplorer:data}})}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function n(id){return Number(document.getElementById(id)?.value||0)}
  function setStatus(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}

function buildPrompt(s){
  const d=s.assessments?.careerDNA||{}, e=s.artifacts?.experienceCompetency||{};
  return `너는 대학생의 직무 탐색을 돕는 커리어 리서처다. 내 검사결과 하나만 보고 직무를 단정하지 말고, 아래 여러 근거를 함께 사용해 직무 후보를 넓게 제안해줘.\n\n[나의 Career DNA]\n${json(d)}\n\n[나의 경험·역량 데이터]\n${json(e)}\n\n규칙:\n1. 직무 후보 8~12개를 제안한다. 같은 계열 직무만 반복하지 말고 인접 직무도 포함한다.\n2. 각 후보마다 '흥미 근거 / 가치 근거 / 경험·행동 근거'를 구분한다. 근거가 약하면 약하다고 표시한다.\n3. 단순 성격·검사유형 매칭으로 추천하지 않는다. 내가 실제로 보여준 행동 Evidence를 우선한다.\n4. 직무명만 제안하지 말고 대표 업무 3개를 함께 적는다.\n5. 확인이 필요한 정보는 NCS, 고용24 직업정보, 기업 공식 직무소개, 실제 채용공고 중 어디서 검증하면 좋은지 제안한다.\n6. 확인하지 못한 사실을 지어내지 않는다.\n7. 최종 선택은 대신 하지 말고, 내가 더 탐색할 질문을 제시한다.\n\n표현은 대학생이 이해하기 쉬운 한국어로 작성해줘.`;
}
function summaryRIASEC(d){const r=d.riasec||d.RIASEC||{};const arr=Object.entries(r).filter(([,v])=>v!==''&&v!=null).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3);return arr.length?arr.map(([k,v])=>`${k} ${v}`).join(' · '):'STEP 1 Career DNA 결과를 확인하세요.'}
function summaryCompetencies(e){const list=e.competencies||e.keywords||[];if(Array.isArray(list)&&list.length)return list.slice(0,6).join(', ');const assets=e.items||e.experiences||[];const all=[];(assets||[]).forEach(x=>{(x.competencies||[]).forEach(c=>all.push(c))});return [...new Set(all)].slice(0,6).join(', ')||'STEP 2에서 경험·역량을 입력하세요.'}
function json(v){try{return JSON.stringify(v,null,2)}catch{return String(v)}}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}"><option value="1">1 낮음</option><option value="2">2</option><option value="3" selected>3 보통</option><option value="4">4</option><option value="5">5 높음</option></select></div>`}
function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}
async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다. 직접 선택해 복사하세요.')}}

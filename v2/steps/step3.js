const JOB_FAMILIES=['기획·전략','인사·조직','재무·회계','영업·사업개발','마케팅·브랜드','고객·서비스','구매·물류·SCM','생산·공정·설비','품질·안전·환경','R&D·연구','IT·데이터','디자인·콘텐츠','공공·행정','상담·교육','기타'];
const JOB_EXPLORER_VERSION='job-explorer-week6-v2';

export async function render(ctx){
  const s=ctx.getState();
  const dna=s.assessments?.careerDNA||{};
  const exp=s.assessments?.experienceCompetency||{experiences:[]};
  const experienceMap=Array.isArray(s.artifacts?.experienceMap)?s.artifacts.experienceMap.filter(x=>x?.factChecked):[];
  const saved=s.artifacts?.jobExplorer||{candidates:[],targets:[],notes:''};
  const data=structuredClone(saved);
  data.candidates=Array.isArray(data.candidates)?data.candidates:[];
  data.targets=Array.isArray(data.targets)?data.targets:[];
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card jobExplorerWeek6">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 3 · JOB EXPLORER</div><h2>강점·경험역량을 직무 후보로 연결하기</h2><p>3주차의 자기이해와 4주차 Experience Map을 출발점으로, <b>내 강점을 실제로 사용할 수 있는 직무 후보</b>를 넓게 탐색합니다.</p></div><span class="badge">6주차 · 탐색</span></div>
    <div class="progress"><span style="width:29%"></span></div>
    <div class="callout info"><b>6주차의 핵심 질문</b><br>“내가 가진 강점·역량은 어떤 직무의 실제 업무에서 사용될 수 있는가?” 직무명을 먼저 정하지 않고, <b>내 행동근거 → 업무(Task) → 직무 후보</b> 순서로 탐색합니다.</div>
    <div class="callout warn"><b>직무추천과 직무탐색은 다릅니다.</b> 검사결과 하나만으로 ‘이 직무가 잘 맞는다’고 확정하지 않습니다. 후보를 넓게 만든 뒤 공식 직무정보를 확인하고 학생이 직접 Target Job을 선택합니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>나의 직무탐색 근거 확인</h3><p>직무 후보를 만들기 전에 3주차와 4주차에서 확인한 자료를 분리해서 봅니다.</p></div></div>
      <div class="grid3">
        <div class="miniCard"><b>강점 단서</b><span>${esc(summaryStrengths(dna,s.artifacts?.careerDNAProfile),ctx)}</span></div>
        <div class="miniCard"><b>가치·커리어 기준</b><span>${esc(summaryValues(dna,s.artifacts?.careerDNAProfile),ctx)}</span></div>
        <div class="miniCard"><b>경험에서 확인한 역량</b><span>${esc(summaryCompetencies(exp,experienceMap),ctx)}</span></div>
      </div>
      <div class="experienceEvidence">${experienceBridgeHtml(experienceMap,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>AI 직무탐색 프롬프트</h3><p>AI에게 ‘나에게 맞는 직무 3개’를 묻지 않습니다. 서로 다른 업무군의 후보를 넓게 만들고, <b>왜 후보인지 내 행동근거</b>를 함께 확인합니다.</p></div></div>
      <textarea id="jobPrompt" rows="17">${esc(buildPrompt(s),ctx)}</textarea><div class="actions"><button class="btn secondary" id="copyPrompt">프롬프트 복사</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>직무 후보 Pool</h3><p>AI가 낸 직무를 그대로 저장하지 말고, NCS·고용24 직업정보·기업 공식 직무소개·실제 채용공고 등에서 업무를 확인한 뒤 추가합니다.</p></div></div>
      <div class="callout good"><b>권장 탐색폭</b> · 후보 8~12개, 최소 4개 이상의 서로 다른 직무군. 같은 업무군의 이름만 바꾼 후보가 반복되지 않도록 합니다.</div>
      <div class="grid2">${txt('jobTitle','직무명','','예: 공정기술, 구매, 데이터분석')}${sel('jobFamily','직무군','',JOB_FAMILIES)}${txt('source','확인 출처','','예: NCS, 고용24 직업정보, 기업 직무소개')}${txt('sourceUrl','출처 URL','','https://...')}</div>
      <div class="grid2" style="margin-top:12px">${area('tasks','대표 업무','','실제로 수행하는 대표 Task 2~3개')}${area('why','관심·강점 연결','','내 강점 또는 관심 중 무엇과 연결되는가?')}${area('evidence','나의 경험 근거','','4주차 Experience Map의 어떤 행동·역량과 연결되는가?')}${area('gap','더 확인할 점','','Task·KSA·KPI 중 아직 모르는 것은?')}</div>
      <div class="grid4" style="margin-top:12px">${score('interestScore','업무 관심')}${score('evidenceScore','경험 근거')}${score('valueScore','가치 적합')}${score('infoScore','정보 확인도')}</div>
      <label class="checkRow"><input type="checkbox" id="sourceVerified"><div><b>공식/실제 자료 확인</b><span>NCS·고용24 직업정보·기업 공식 직무소개·실제 채용공고 중 하나 이상에서 대표 업무를 직접 확인했습니다.</span></div></label>
      <div class="actions"><button class="btn primary" id="addCandidate">후보 추가</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="diversityCheck"></div><div id="candidateList"></div></div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>Target Job 1·2·3 직접 선택</h3><p>6주차 후반 STEP 4에서 Task·KSA·KPI와 내 Experience Map을 깊게 매칭할 직무를 최대 3개 고릅니다.</p></div></div>
      <div id="targetPick"></div><div id="targetWarning"></div>
      <div class="field" style="margin-top:12px"><label>선택 메모</label><textarea id="notes" placeholder="왜 이 직무를 더 깊게 확인하려 하는지, 어떤 경험근거가 있고 무엇을 더 확인해야 하는지 적으세요.">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveTargets">Target Job 저장</button><button class="btn secondary" id="nextStep">STEP 4 Task·KSA·KPI 심층분석 →</button></div>
    </div>
  </section>`;

  renderCandidates();renderTargets();renderDiversity();
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(document.getElementById('jobPrompt').value,ctx));
  document.getElementById('addCandidate').addEventListener('click',addCandidate);
  document.getElementById('saveTargets').addEventListener('click',saveTargets);
  document.getElementById('nextStep').addEventListener('click',()=>{saveTargets();ctx.navigate(4)});

  function addCandidate(){
    const title=v('jobTitle'),family=v('jobFamily');
    if(!title){status('직무명을 입력하세요.');return}
    if(!family){status('직무군을 선택하세요.');return}
    data.candidates.push({
      id:`job_${Date.now()}`,title,family,source:v('source'),sourceUrl:v('sourceUrl'),tasks:v('tasks'),why:v('why'),evidence:v('evidence'),gap:v('gap'),
      interestScore:n('interestScore'),evidenceScore:n('evidenceScore'),valueScore:n('valueScore'),infoScore:n('infoScore'),
      sourceVerified:!!document.getElementById('sourceVerified').checked,createdAt:new Date().toISOString()
    });
    ['jobTitle','source','sourceUrl','tasks','why','evidence','gap'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('jobFamily').value='';
    ['interestScore','evidenceScore','valueScore','infoScore'].forEach(id=>document.getElementById(id).value='3');
    document.getElementById('sourceVerified').checked=false;
    persist();renderCandidates();renderTargets();renderDiversity();status('직무 후보를 추가했습니다.');
  }
  function renderCandidates(){
    const box=document.getElementById('candidateList');
    if(!data.candidates.length){box.innerHTML='<div class="placeholder"><b>아직 직무 후보가 없습니다.</b> AI로 넓게 탐색한 뒤 실제 자료를 확인하고 후보를 직접 추가하세요.</div>';return}
    box.innerHTML=data.candidates.map((j,i)=>{
      const avg=avgScore(j);
      return `<div class="listCard"><div class="listHead"><div><span class="rankTag">후보 ${i+1}</span><h3>${esc(j.title,ctx)}</h3><div class="muted small">${esc(j.family||'직무군 미입력',ctx)}</div></div><div class="scoreChip">탐색우선 ${avg.toFixed(1)}/5</div></div><div class="grid2"><div><b>대표 Task</b><p>${esc(j.tasks||'—',ctx)}</p></div><div><b>강점·관심 연결</b><p>${esc(j.why||'—',ctx)}</p></div><div><b>Experience Map 근거</b><p>${esc(j.evidence||'—',ctx)}</p></div><div><b>더 확인할 점</b><p>${esc(j.gap||'—',ctx)}</p></div></div><div class="sourceLine"><b>확인 출처</b> ${esc(j.source||'미입력',ctx)} ${j.sourceUrl?`· <a href="${esc(j.sourceUrl,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div><div class="pillRow"><span class="pill">업무관심 ${j.interestScore||0}</span><span class="pill">경험근거 ${j.evidenceScore||0}</span><span class="pill">가치 ${j.valueScore||0}</span><span class="pill">정보확인 ${j.infoScore||0}</span><span class="pill">${j.sourceVerified?'자료 확인완료':'자료 확인필요'}</span></div><div class="actions"><button class="btn danger smallBtn" data-del="${j.id}">삭제</button></div></div>`;
    }).join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.candidates=data.candidates.filter(x=>x.id!==b.dataset.del);data.targets=data.targets.filter(x=>x!==b.dataset.del);persist();renderCandidates();renderTargets();renderDiversity()}));
  }
  function renderDiversity(){
    const box=document.getElementById('diversityCheck'),families=familyStats(data.candidates);
    if(!data.candidates.length){box.innerHTML='';return}
    const distinct=Object.keys(families).length,max=Math.max(...Object.values(families)),total=data.candidates.length;
    let cls='good',msg=`현재 ${total}개 후보 · ${distinct}개 직무군.`;
    if(total>=6&&distinct<4){cls='warn';msg+=` 후보 수에 비해 직무군이 ${distinct}개뿐입니다. 서로 다른 업무군을 더 탐색하세요.`}
    else if(max>2&&total>=6){cls='warn';const top=Object.entries(families).sort((a,b)=>b[1]-a[1])[0];msg+=` ${top[0]} 직무군이 ${top[1]}개로 몰려 있습니다. 이름만 다른 비슷한 직무가 반복되지 않았는지 확인하세요.`}
    else msg+=' 탐색 폭을 유지하면서 실제 업무를 확인하세요.';
    box.innerHTML=`<div class="callout ${cls}"><b>직무 후보 다양성 체크</b><br>${esc(msg,ctx)}<div class="pillRow" style="margin-top:8px">${Object.entries(families).map(([k,v])=>`<span class="pill">${esc(k,ctx)} ${v}</span>`).join('')}</div></div>`;
  }
  function renderTargets(){
    const box=document.getElementById('targetPick');
    if(!data.candidates.length){box.innerHTML='<div class="callout warn">먼저 직무 후보를 추가하세요.</div>';return}
    box.innerHTML=data.candidates.map(j=>`<label class="checkRow"><input type="checkbox" data-target="${j.id}" ${data.targets.includes(j.id)?'checked':''}><div><b>${esc(j.title,ctx)}</b><span>${esc(j.family||'',ctx)} · ${j.sourceVerified?'자료 확인완료':'자료 확인필요'}</span></div></label>`).join('');
    box.querySelectorAll('[data-target]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-target]:checked')];if(ids.length>3){c.checked=false;ctx.toast('Target Job은 최대 3개입니다.')}renderTargetWarning()}));
    renderTargetWarning();
  }
  function renderTargetWarning(){
    const el=document.getElementById('targetWarning');if(!el)return;
    const ids=[...document.querySelectorAll('[data-target]:checked')].map(x=>x.dataset.target),jobs=ids.map(id=>data.candidates.find(x=>x.id===id)).filter(Boolean);
    if(!jobs.length){el.innerHTML='';return}
    const unver=jobs.filter(x=>!x.sourceVerified).length,fams=new Set(jobs.map(x=>x.family));let msg='';
    if(unver)msg+=`선택 직무 중 ${unver}개는 실제 자료 확인이 더 필요합니다. `;
    if(jobs.length===3&&fams.size===1)msg+='3개가 모두 같은 직무군입니다. 의도한 선택인지 한 번 더 확인하세요.';
    el.innerHTML=msg?`<div class="callout warn">${esc(msg,ctx)}</div>`:'';
  }
  function saveTargets(){
    data.targets=[...document.querySelectorAll('[data-target]:checked')].map(x=>x.dataset.target);
    data.notes=v('notes');persist();
    status(data.targets.length?`Target Job ${data.targets.length}개를 저장했습니다.`:'직무 후보 Pool을 저장했습니다.');
  }
  function persist(){
    data.version=JOB_EXPLORER_VERSION;
    data.sourceExperienceMapVersion=s.assessments?.experienceCompetency?.version||'';
    data.diversity={families:familyStats(data.candidates),updatedAt:new Date().toISOString()};
    ctx.saveState({artifacts:{jobExplorer:data}});
  }
  function v(id){return document.getElementById(id)?.value?.trim()||''}
  function n(id){return Number(document.getElementById(id)?.value||0)}
  function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}

function buildPrompt(s){
  const dna=s.assessments?.careerDNA||{},profile=s.artifacts?.careerDNAProfile||{},exp=s.assessments?.experienceCompetency||{},map=Array.isArray(s.artifacts?.experienceMap)?s.artifacts.experienceMap.filter(x=>x?.factChecked):[];
  const valueClues=profile.valueClues||((dna.balance?.answers||[]).filter(Boolean).map(x=>x.value));
  const anchorTop=profile.careerAnchorTop||dna.careerAnchor?.ranking?.slice(0,3)||[];
  const selfStrengths=profile.selfStrengths||dna.selfStrengths||[];
  const via=profile.viaTop5||dna.viaTop5||[];
  const mi=profile.multipleIntelligenceTop3||dna.multipleIntelligence?.top3||[];
  const comparison=profile.comparison||dna.comparison||{};
  const hypothesis=profile.hypothesis||dna.hypothesis||{};
  const verifiedExperiences=(exp.experiences||[]).filter(x=>x?.factChecked);
  const evidence=(map.length?map:verifiedExperiences).slice(0,8).map(x=>({
    experience:x.title||'경험',action:x.action||'',result:x.result||'',competencies:x.competencies||[],competencyEvidence:x.competencyEvidence||[]
  }));
  return `당신은 대학생의 직무탐색을 돕는 조력자다. 목표는 검사결과로 직업을 추천하는 것이 아니라, 학생의 자기이해와 실제 경험근거에서 출발해 서로 다른 업무군의 직무 후보를 넓게 탐색하게 돕는 것이다.\n\n[3주차 Career DNA]\n가치 단서: ${valueClues.length?valueClues.join(', '):'입력 없음'}\nCareer Anchor 상위: ${anchorTop.length?anchorTop.map(x=>x.name||x.code).join(', '):'입력 없음'}\n내가 선택한 강점: ${selfStrengths.length?selfStrengths.join(', '):'입력 없음'}\nVIA TOP5: ${via.length?via.join(', '):'입력 없음'}\n다중지능 TOP3: ${mi.length?mi.join(', '):'입력 없음'}\n반복해서 나타난다고 본 부분: ${comparison.repeat||'입력 없음'}\nCareer DNA 가설: ${hypothesis.text||'입력 없음'}\n\n[4주차 Experience Map]\n${evidence.length?evidence.map((x,i)=>`${i+1}. ${x.experience}\n- 행동: ${x.action||'미입력'}\n- 결과: ${x.result||'미입력'}\n- 역량 후보: ${x.competencies.length?x.competencies.join(', '):'미입력'}\n- 근거행동: ${x.competencyEvidence.length?x.competencyEvidence.map(c=>`${c.keyword}: ${c.evidence}`).join(' / '):'미입력'}`).join('\n'):'저장된 Experience Map 없음'}\n\n[탐색 규칙]\n1. 특정 검사 하나만 보고 직무를 추천하지 않는다.\n2. 직무 후보는 가능하면 8~12개, 최소 4개 이상의 서로 다른 직무군에서 제안한다.\n3. 각 후보는 '내 강점/경험 → 실제로 활용될 가능성이 있는 업무(Task) → 직무 후보' 순서로 설명한다.\n4. 학생이 실제로 보여준 행동근거가 없는 역량을 새로 만들어내지 않는다.\n5. VIA나 다중지능 결과만으로 역량 또는 직무적합성을 단정하지 않는다.\n6. 직무 적합도, 취업성공확률, 추천순위를 만들지 않는다.\n7. 실제 Task·KSA·KPI는 기업·산업마다 다를 수 있으므로 반드시 추가 확인이 필요하다고 표시한다.\n8. NCS·고용24·기업 직무소개·채용공고를 실제로 확인하지 않았다면 출처나 URL을 만들어내지 않는다.\n\n[출력]\n표로 정리해줘.\n열: 직무 후보 / 직무군 / 대표 Task 가설 2~3개 / 연결되는 내 강점·경험 행동 / 왜 더 탐색할 가치가 있는지 / 공식자료에서 확인할 질문\n\n마지막에는 '직접 확인할 것'으로\n- 실제 Task\n- KSA\n- KPI·성과기준\n- 신입에게 요구하는 경험\n을 정리해줘.\n\n학생이 후보를 직접 비교하고 선택할 수 있도록 하고, 최종 직무를 대신 결정하지 마.`;
}
function summaryStrengths(dna,profile){
  const self=profile?.selfStrengths||dna.selfStrengths||[],via=profile?.viaTop5||dna.viaTop5||[],mi=profile?.multipleIntelligenceTop3||dna.multipleIntelligence?.top3||[];
  const parts=[];if(self.length)parts.push(`내가 고른 강점: ${self.join(', ')}`);if(via.length)parts.push(`VIA: ${via.join(', ')}`);if(mi.length)parts.push(`활동방식 단서: ${mi.join(', ')}`);return parts.join(' / ')||'3주차 입력자료 없음';
}
function summaryValues(dna,profile){
  const values=profile?.valueClues||((dna.balance?.answers||[]).filter(Boolean).map(x=>x.value)),anchors=profile?.careerAnchorTop||dna.careerAnchor?.ranking?.slice(0,3)||[];
  const parts=[];if(values.length)parts.push(`가치 단서: ${[...new Set(values)].join(', ')}`);if(anchors.length)parts.push(`Career Anchor: ${anchors.map(x=>x.name||x.code).join(', ')}`);return parts.join(' / ')||'3주차 입력자료 없음';
}
function summaryCompetencies(exp,map){
  const verified=(exp.experiences||[]).filter(x=>x?.factChecked),src=map.length?map:verified,comps=[...new Set(src.flatMap(x=>x.competencies||[]))];
  const evidenceCount=src.filter(x=>x.action&&(x.evidence||x.result)).length;
  return comps.length?`${comps.join(', ')} · 근거가 정리된 경험 ${evidenceCount}/${src.length}개`:(src.length?`저장 경험 ${src.length}개 · 역량키워드 추가 필요`:'4주차 Experience Map 없음');
}
function experienceBridgeHtml(map,ctx){
  if(!map.length)return '<div class="callout warn" style="margin-top:12px"><b>Experience Map이 비어 있습니다.</b> STEP 2에서 최소 한 개의 경험을 행동·결과·역량근거까지 정리한 뒤 직무탐색을 시작하는 것을 권장합니다.</div>';
  return `<div class="evidenceStrip">${map.slice(0,4).map(x=>`<div><b>${ctx.escapeHtml(x.title||'경험')}</b><span>${ctx.escapeHtml((x.competencies||[]).join(', ')||'역량 미입력')}</span><small>${ctx.escapeHtml(x.action||'행동 미입력')}</small></div>`).join('')}</div>`;
}
function familyStats(cands){const out={};for(const c of cands||[])if(c.family)out[c.family]=(out[c.family]||0)+1;return out}
function avgScore(j){const xs=[j.interestScore,j.evidenceScore,j.valueScore,j.infoScore].map(Number).filter(Number.isFinite);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}
function copy(text,ctx){navigator.clipboard.writeText(text).then(()=>ctx.toast('프롬프트를 복사했습니다.')).catch(()=>ctx.toast('직접 선택해 복사해 주세요.'))}
function esc(x,ctx){return ctx.escapeHtml(String(x??''))}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`}
function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></div>`}
function styleBlock(){return `<style>
.jobExplorerWeek6 .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.jobExplorerWeek6 .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.jobExplorerWeek6 .moduleHead h3{margin:0 0 3px}.jobExplorerWeek6 .moduleHead p{margin:0;color:var(--muted);font-size:13px}.miniCard{display:flex;flex-direction:column;gap:8px}.miniCard span{font-size:13px;line-height:1.55}.evidenceStrip{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}.evidenceStrip>div{border:1px solid var(--line);border-radius:12px;padding:10px}.evidenceStrip b,.evidenceStrip span,.evidenceStrip small{display:block}.evidenceStrip span{margin-top:4px;font-size:12px}.evidenceStrip small{margin-top:5px;color:var(--muted)}@media(max-width:760px){.evidenceStrip{grid-template-columns:1fr}}
</style>`}

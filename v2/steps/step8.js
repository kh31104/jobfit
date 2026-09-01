export async function render(ctx){
  const s=ctx.getState();
  const experiences=s.assessments?.experienceCompetency?.experiences||[];
  const jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const saved=s.artifacts?.careerAssets||{assets:[]};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 8</div><h2>Career Asset Match</h2><p>실제 JD의 요구와 내 경험을 연결해 지원에 사용할 Evidence를 선별합니다.</p></div><span class="badge">9주차</span></div>
    <div class="progress"><span style="width:64%"></span></div>
    ${posting?`<div class="callout info"><b>Target JD</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)} · Requirement ${(posting.requirements||[]).length}개</div>`:`<div class="callout warn"><b>Target JD가 없습니다.</b><br>STEP 7에서 실제 채용공고를 먼저 등록하세요.</div>`}

    <div class="block"><h3>1. Experience × Requirement 연결</h3><p class="help">AI가 대신 경험을 고르는 것이 아니라, 학생이 실제 증거가 있는 조합만 선택합니다.</p>
      <div class="grid2">
        ${selectExperience('experienceId','내 경험',experiences)}
        ${selectReq('requirementId','JD Requirement',posting?.requirements||[])}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${area('proof','증명할 수 있는 핵심행동','','이 요구를 보여주는 내가 직접 한 행동')}
        ${area('fact','사실 Evidence','','수치·결과·피드백·산출물 등 사실로 확인되는 근거')}
        ${area('gap','부족한 점','','이 경험으로 충분히 증명되지 않는 부분')}
        ${area('jobLink','직무 연결','','왜 이 행동이 해당 직무 Requirement와 연결되는가?')}
      </div>
      <div class="grid3" style="margin-top:12px">
        ${score('strength','증거 강도')}
        ${sel('useFor','우선 활용처','',['이력서','경험기술서','자기소개서','면접','여러 곳'])}
        ${sel('factCheck','사실검증','',['검증완료','추가확인 필요'])}
      </div>
      <div class="actions"><button class="btn primary" id="addAsset">Career Asset 추가</button><button class="btn secondary" id="copyPrompt">경험심화 프롬프트 복사</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="assetList"></div></div>
    <div class="actions"><button class="btn primary" id="saveAssets">Career Asset DB 저장</button><button class="btn secondary" id="nextStep">STEP 9 Resume Lab →</button></div>
  </section>`;

  renderAssets();
  document.getElementById('addAsset').addEventListener('click',addAsset);
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));
  document.getElementById('saveAssets').addEventListener('click',()=>{persist();status('Career Asset DB를 저장했습니다.');});
  document.getElementById('nextStep').addEventListener('click',()=>{persist();ctx.navigate(9)});

  function addAsset(){
    const experienceId=v('experienceId'),requirementId=v('requirementId');if(!experienceId||!requirementId){status('경험과 JD Requirement를 모두 선택하세요.');return;}
    const x=experiences.find(e=>e.id===experienceId),r=(posting?.requirements||[]).find(r=>r.id===requirementId);
    const item={id:`asset_${Date.now()}`,postingId:posting?.id||'',experienceId,experienceTitle:x?.title||'',requirementId,requirement:r?.text||'',proof:v('proof'),fact:v('fact'),gap:v('gap'),jobLink:v('jobLink'),strength:Number(v('strength')||0),useFor:v('useFor'),factCheck:v('factCheck'),createdAt:new Date().toISOString()};
    data.assets.push(item);persist();['proof','fact','gap','jobLink'].forEach(id=>document.getElementById(id).value='');renderAssets();status('Career Asset을 추가했습니다.');
  }
  function renderAssets(){const box=document.getElementById('assetList');if(!data.assets.length){box.innerHTML='<div class="placeholder"><b>아직 Career Asset이 없습니다.</b>JD Requirement마다 실제 경험 Evidence를 연결하세요.</div>';return;}box.innerHTML=data.assets.map((a,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">Asset ${i+1}</span><h3>${esc(a.experienceTitle,ctx)}</h3><div class="muted small">→ ${esc(a.requirement,ctx)}</div></div><div class="scoreChip">Evidence ${a.strength}/5</div></div><div class="grid2"><div><b>핵심행동</b><p>${esc(a.proof||'—',ctx)}</p></div><div><b>사실근거</b><p>${esc(a.fact||'—',ctx)}</p></div><div><b>직무연결</b><p>${esc(a.jobLink||'—',ctx)}</p></div><div><b>GAP</b><p>${esc(a.gap||'—',ctx)}</p></div></div><div class="pillRow"><span class="pill">${esc(a.useFor||'활용처 미정',ctx)}</span><span class="pill">${esc(a.factCheck||'검증상태 미정',ctx)}</span></div><div class="actions"><button class="btn danger smallBtn" data-del="${a.id}">삭제</button></div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.assets=data.assets.filter(x=>x.id!==b.dataset.del);persist();renderAssets();}));}
  function buildPrompt(){const x=experiences.find(e=>e.id===v('experienceId')),r=(posting?.requirements||[]).find(r=>r.id===v('requirementId'));return `너는 취업 경험면접관이다. 내가 아래 JD Requirement를 실제 경험으로 증명할 수 있는지 검증해줘. 없는 이야기를 만들지 말고 한 번에 질문 하나만 해줘.\n\n[JD Requirement]\n${r?.text||'미선택'}\n\n[내 경험]\n${JSON.stringify(x||{},null,2)}\n\n다음 순서로 확인해줘.\n1. 이 Requirement와 직접 연결되는 내가 한 행동\n2. 그 행동을 선택한 이유\n3. 결과와 사실 Evidence\n4. 팀의 행동과 내 행동의 구분\n5. 과장되거나 확인되지 않은 부분\n6. 이 경험으로 충분히 증명되지 않는 GAP\n7. 마지막에만 '지원에 활용 가능한 핵심 Evidence 3줄'로 구조화\n\n문장을 멋있게 만드는 것보다 사실 검증을 우선해줘.`}
  function persist(){ctx.saveState({artifacts:{careerAssets:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function selectExperience(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">${x.title}</option>`).join('')}</select></div>`}function selectReq(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">${x.text}</option>`).join('')}</select></div>`}function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}"><option value="1">1 약함</option><option value="2">2</option><option value="3" selected>3 보통</option><option value="4">4</option><option value="5">5 강함</option></select></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('경험심화 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

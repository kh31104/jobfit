export async function render(ctx){
  const s=ctx.getState();
  const jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const assets=s.artifacts?.careerAssets?.assets||[];
  const saved=s.artifacts?.coverLetterLab||{questions:[]};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 10</div><h2>Cover Letter Lab</h2><p>문항의 평가의도를 먼저 해석하고, 맞는 Career Asset을 선택한 뒤 AI가 질문하도록 합니다.</p></div><span class="badge">10주차</span></div>
    <div class="progress"><span style="width:79%"></span></div>
    ${posting?`<div class="callout info"><b>Target</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}

    <div class="block"><h3>1. 자소서 문항 등록</h3>
      <div class="grid2">${area('question','자기소개서 문항','','문항 전체를 그대로 입력')}${area('intent','내가 해석한 평가의도','','기업이 이 문항으로 무엇을 확인하려 하는가?')}</div>
      <div class="field" style="margin-top:12px"><label>사용할 Career Asset</label><div id="assetChecks">${assets.length?assets.map(a=>`<label class="checkRow"><input type="checkbox" data-asset="${a.id}"><div><b>${esc(a.experienceTitle,ctx)}</b><span>${esc(a.requirement,ctx)} · Evidence ${a.strength}/5</span></div></label>`).join(''):'<div class="callout warn">STEP 8 Career Asset을 먼저 만들어 주세요.</div>'}</div></div>
      <div class="actions"><button class="btn secondary" id="copyPrompt">AI Experience Interview 프롬프트 복사</button></div>
    </div>

    <div class="hr"></div><div class="block"><h3>2. 내 답변에서 초안 만들기</h3>
      <div class="grid2">${area('rawAnswer','내 원래 답변·Raw Voice','','AI 인터뷰에서 내가 실제로 말하거나 입력한 내용')}${area('structure','구조화 메모','','문항에 맞춰 핵심 메시지 / Situation / Action / Result / 직무연결을 정리')}</div>
      <div class="field" style="margin-top:12px"><label>AI 초안</label><textarea id="draft" rows="10" placeholder="AI가 구조화한 초안. 최종본이 아닙니다."></textarea></div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>사실검증 완료</b><span>경험·수치·역할·결과가 Career Asset과 일치합니다.</span></div></label>
      <div class="actions"><button class="btn primary" id="addQuestion">문항 저장</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="questionList"></div></div>
    <div class="actions"><button class="btn primary" id="saveAll">Cover Letter Lab 저장</button><button class="btn secondary" id="nextStep">STEP 11 Interview Lab →</button></div>
  </section>`;

  renderQuestions();
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));
  document.getElementById('addQuestion').addEventListener('click',addQuestion);
  document.getElementById('saveAll').addEventListener('click',()=>{persist();status('자기소개서 작업을 저장했습니다.');});
  document.getElementById('nextStep').addEventListener('click',()=>{persist();ctx.navigate(11)});

  function selectedAssets(){const ids=[...document.querySelectorAll('[data-asset]:checked')].map(x=>x.dataset.asset);return assets.filter(a=>ids.includes(a.id))}
  function addQuestion(){const q=v('question');if(!q){status('자기소개서 문항을 입력하세요.');return;}const item={id:`cl_${Date.now()}`,postingId:posting?.id||'',company:posting?.company||'',jobTitle:posting?.jobTitle||'',question:q,intent:v('intent'),assetIds:selectedAssets().map(a=>a.id),rawAnswer:v('rawAnswer'),structure:v('structure'),draft:v('draft'),factChecked:document.getElementById('factChecked').checked,createdAt:new Date().toISOString()};data.questions.push(item);persist();['question','intent','rawAnswer','structure','draft'].forEach(id=>document.getElementById(id).value='');document.querySelectorAll('[data-asset]').forEach(x=>x.checked=false);document.getElementById('factChecked').checked=false;renderQuestions();status('자소서 문항을 저장했습니다.');}
  function renderQuestions(){const box=document.getElementById('questionList');if(!data.questions.length){box.innerHTML='<div class="placeholder"><b>아직 저장한 자소서 문항이 없습니다.</b>문항별로 경험을 골라 AI 인터뷰 후 초안을 만드세요.</div>';return;}box.innerHTML=data.questions.map((q,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">문항 ${i+1}</span><h3>${esc(q.question,ctx)}</h3><div class="muted small">${esc(q.intent||'평가의도 미작성',ctx)}</div></div>${q.factChecked?'<span class="scoreChip">Fact Checked</span>':'<span class="scoreChip" style="background:#fff8e6;color:#9a6700;border-color:#f3dfaa">확인 필요</span>'}</div><div><b>AI 초안</b><p>${esc(q.draft||'—',ctx)}</p></div><div class="actions"><button class="btn danger smallBtn" data-del="${q.id}">삭제</button></div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.questions=data.questions.filter(x=>x.id!==b.dataset.del);persist();renderQuestions();}));}
  function buildPrompt(){const sel=selectedAssets();return `지금부터 자기소개서를 대신 써주는 작가가 아니라, 내 경험을 꺼내는 취업 인터뷰어가 되어줘.\n\n[기업/직무]\n${posting?`${posting.company} / ${posting.jobTitle}`:'미등록'}\n\n[자기소개서 문항]\n${v('question')||'미입력'}\n\n[내가 생각한 평가의도]\n${v('intent')||'미입력'}\n\n[선택한 Career Asset]\n${JSON.stringify(sel,null,2)}\n\n진행 규칙:\n1. 먼저 이 문항이 무엇을 평가하는지 내 해석이 타당한지 점검해줘.\n2. 내가 선택한 경험 중 어떤 것이 가장 적합한지 이유와 함께 비교하되 최종 선택은 나에게 묻는다.\n3. 경험이 정해지면 한 번에 질문 하나씩 해줘.\n4. 반드시 내가 직접 한 행동, 판단 이유, 결과, Evidence, 직무연결을 확인한다.\n5. 내가 말하지 않은 수치·성과·역할은 절대 만들지 않는다.\n6. 충분한 Evidence가 모이기 전에는 완성문을 쓰지 않는다.\n7. 마지막에만 '핵심 메시지 → 상황 → 행동 → 결과 → 직무연결' 구조를 먼저 보여주고, 내가 확인하면 초안을 작성한다.\n8. 과장된 수식어와 기업 칭찬 문장을 자동으로 추가하지 않는다.\n9. 초안 끝에 사실확인이 필요한 표현을 별도로 표시한다.\n\n첫 질문부터 시작해줘.`}
  function persist(){ctx.saveState({artifacts:{coverLetterLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('자소서 인터뷰 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

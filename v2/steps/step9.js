export async function render(ctx){
  const s=ctx.getState();
  const jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const assets=s.artifacts?.careerAssets?.assets||[];
  const saved=s.artifacts?.resumeLab||{items:[],summary:'',skills:'',notes:''};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 9</div><h2>Resume Lab</h2><p>JD와 Career Asset을 연결해 직무맞춤 이력서·경험기술서 문장을 만듭니다.</p></div><span class="badge">9주차</span></div>
    <div class="progress"><span style="width:71%"></span></div>
    ${posting?`<div class="callout info"><b>Target JD</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}

    <div class="block"><h3>1. 이력서 핵심원칙</h3><div class="grid3"><div class="miniCard"><b>Fact</b><span>하지 않은 일·없는 수치는 쓰지 않는다.</span></div><div class="miniCard"><b>Action</b><span>역할명이 아니라 내가 직접 한 행동을 쓴다.</span></div><div class="miniCard"><b>Job Link</b><span>JD와 관련 없는 경험을 억지로 넣지 않는다.</span></div></div></div>

    <div class="hr"></div>
    <div class="block"><h3>2. Career Asset → Resume Bullet</h3><div class="grid2">${selectAsset('assetId','Career Asset',assets)}${sel('section','이력서 섹션','',['프로젝트','인턴·경력','대외활동','아르바이트','교육·수업','기타'])}</div>
      <div class="grid2" style="margin-top:12px">${area('rawBullet','내 원문','','내가 먼저 사실 중심으로 작성한 문장')}${area('aiBullet','AI 구조화','','AI가 제안한 문장 또는 구조')}${area('finalBullet','최종 Bullet','','Action + 대상/방법 + Result/Evidence 중심으로 최종 수정')}${area('detailText','경험기술서 확장','','필요 시 3~5문장으로 역할·행동·성과를 확장')}</div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>Fact Check</b><span>행동·수치·결과가 Career Asset의 사실과 일치합니다.</span></div></label>
      <div class="actions"><button class="btn secondary" id="copyPrompt">Resume AI 프롬프트 복사</button><button class="btn primary" id="addItem">이력서 문장 추가</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="resumeItems"></div></div>

    <div class="hr"></div><div class="block"><h3>3. 직무맞춤 요약</h3><div class="grid2">${area('summary','직무 요약',data.summary,'내가 어떤 Evidence를 가진 지원자인지 2~3문장')}${area('skills','직무 관련 Skill·Tool',data.skills,'JD에서 실제로 요구하고 내가 보유한 Skill·Tool만')}</div>
      <div class="field" style="margin-top:12px"><label>점검 메모</label><textarea id="notes" placeholder="추가 보완할 부분">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveResume">Resume 저장</button><button class="btn secondary" id="nextStep">STEP 10 Cover Letter Lab →</button></div></div>
  </section>`;

  renderItems();
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));
  document.getElementById('addItem').addEventListener('click',addItem);
  document.getElementById('saveResume').addEventListener('click',saveBase);
  document.getElementById('nextStep').addEventListener('click',()=>{saveBase();ctx.navigate(10)});

  function addItem(){const assetId=v('assetId');if(!assetId){status('Career Asset을 선택하세요.');return;}const a=assets.find(x=>x.id===assetId);const item={id:`resume_${Date.now()}`,assetId,assetTitle:a?.experienceTitle||'',section:v('section'),rawBullet:v('rawBullet'),aiBullet:v('aiBullet'),finalBullet:v('finalBullet'),detailText:v('detailText'),factChecked:document.getElementById('factChecked').checked};data.items.push(item);persist();['rawBullet','aiBullet','finalBullet','detailText'].forEach(id=>document.getElementById(id).value='');document.getElementById('factChecked').checked=false;renderItems();status('Resume 문장을 추가했습니다.');}
  function renderItems(){const box=document.getElementById('resumeItems');if(!data.items.length){box.innerHTML='<div class="placeholder"><b>아직 Resume 문장이 없습니다.</b>Career Asset을 실제 이력서 문장으로 바꾸세요.</div>';return;}box.innerHTML=data.items.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">Resume ${i+1}</span><h3>${esc(x.assetTitle,ctx)}</h3><div class="muted small">${esc(x.section||'섹션 미정',ctx)}</div></div>${x.factChecked?'<span class="scoreChip">Fact Checked</span>':'<span class="scoreChip" style="background:#fff8e6;color:#9a6700;border-color:#f3dfaa">확인 필요</span>'}</div><div><b>최종 Bullet</b><p>${esc(x.finalBullet||x.aiBullet||x.rawBullet||'—',ctx)}</p></div>${x.detailText?`<div><b>경험기술</b><p>${esc(x.detailText,ctx)}</p></div>`:''}<div class="actions"><button class="btn danger smallBtn" data-del="${x.id}">삭제</button></div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.items=data.items.filter(x=>x.id!==b.dataset.del);persist();renderItems();}));}
  function buildPrompt(){const a=assets.find(x=>x.id===v('assetId'));return `너는 이력서 문장 코치다. 아래 사실만 사용해 직무맞춤 Resume bullet을 구조화해줘. 없는 숫자·성과·역할은 만들지 마.\n\n[Target JD]\n${posting?`${posting.company} / ${posting.jobTitle}\n${posting.rawPosting||''}`:'미등록'}\n\n[Career Asset]\n${JSON.stringify(a||{},null,2)}\n\n[내가 먼저 쓴 문장]\n${v('rawBullet')||'미작성'}\n\n규칙:\n1. Action이 앞에 드러나게 한다.\n2. 불필요한 수식어를 줄인다.\n3. 수치가 없으면 억지로 만들지 않는다.\n4. JD와 연결되는 이유를 별도 설명하고, 문장 안에 키워드를 억지로 끼우지 않는다.\n5. 1줄 Bullet 2안과 경험기술서용 3~4문장 1안을 제시한다.\n6. 마지막에 사실확인이 필요한 표현을 따로 표시한다.`}
  function saveBase(){data.summary=v('summary');data.skills=v('skills');data.notes=v('notes');persist();ctx.toast('Resume Lab 결과를 저장했습니다.');}
  function persist(){ctx.saveState({artifacts:{resumeLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function selectAsset(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">${x.experienceTitle} → ${x.requirement}</option>`).join('')}</select></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('Resume 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

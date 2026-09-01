export async function render(ctx){
  const s=ctx.getState();
  const experiences=s.assessments?.experienceCompetency?.experiences||[];
  const cover=s.artifacts?.coverLetterLab||{questions:[]};
  const resume=s.artifacts?.resumeLab||{items:[]};
  const interview=s.artifacts?.interviewLab||{questions:[]};
  const saved=s.artifacts?.humanFirst||{items:[],consistency:{resumeCover:false,coverInterview:false,factLock:false},notes:''};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 12</div><h2>Human-First Check</h2><p>좋은 내용을 사람의 언어로 되돌리고, 이력서·자소서·면접에서 같은 사실과 같은 지원자가 보이는지 확인합니다.</p></div><span class="badge">13주차</span></div>
    <div class="progress"><span style="width:93%"></span></div>
    <div class="callout info"><b>목표는 ‘AI 탐지 우회’가 아닙니다.</b><br>실제 경험과 전문성을 보존하고, 학생이 하지 않을 법한 과장·번역투·상투표현을 제거해 <b>진짜 본인의 언어</b>로 제출물을 정리합니다.</div>

    <div class="block"><h3>1. My Raw Voice</h3><p class="help">STEP 2에서 남긴 원래 표현을 참고합니다. AI가 다듬기 전 내가 실제로 설명하던 언어입니다.</p><div class="resultGrid">${rawVoiceCards(experiences,ctx)}</div></div>

    <div class="hr"></div><div class="block"><h3>2. 자기소개서 문장 Humanize</h3>
      ${selectQuestion('coverId','수정할 자소서 문항',cover.questions||[])}
      <div class="actions"><button class="btn secondary" id="loadDraft">초안 불러오기</button><button class="btn outline" id="copyPrompt">Human-First 프롬프트 복사</button></div>
      <div class="field" style="margin-top:12px"><label>AI 초안</label><textarea id="draft" rows="9" placeholder="수정할 초안을 불러오거나 붙여넣으세요."></textarea></div>
      <div class="grid3" style="margin-top:12px">${area('keep','KEEP','','구체적이고 사실적이라 그대로 둘 부분')}${area('humanize','HUMANIZE','','내용은 좋지만 내 말 같지 않은 부분')}${area('deleteText','DELETE','','정보가 없거나 상투적인 부분')}</div>
      <div class="field" style="margin-top:12px"><label>My Voice 최종본</label><textarea id="finalText" rows="10" placeholder="학생이 직접 확인·수정한 최종 문장"></textarea></div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>Fact Lock</b><span>숫자·행동·역할·결과가 원 Career Asset과 일치하며 새 사실을 추가하지 않았습니다.</span></div></label>
      <div class="actions"><button class="btn primary" id="saveHuman">Human-First 버전 저장</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="humanList"></div></div>

    <div class="hr"></div><div class="block"><h3>3. 지원서 ↔ 면접 일관성 검증</h3>
      ${check('resumeCover','이력서와 자기소개서의 역할·기간·수치가 서로 일치한다.',data.consistency.resumeCover)}
      ${check('coverInterview','자기소개서에서 강조한 경험을 면접에서 내 말로 설명할 수 있다.',data.consistency.coverInterview)}
      ${check('factLockAll','이력서·자소서·면접 어디에도 새로 만들어진 사실이 없다.',data.consistency.factLock)}
      <div class="field" style="margin-top:12px"><label>최종 점검 메모</label><textarea id="notes" placeholder="아직 어색한 표현, 면접에서 설명하기 어려운 부분, 수정할 사실">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveAll">Human-First Check 저장</button><button class="btn secondary" id="nextStep">STEP 13 AI Job Portfolio →</button></div>
    </div>
  </section>`;

  renderHumanList();
  document.getElementById('loadDraft').addEventListener('click',loadDraft);
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(experiences,document.getElementById('draft').value),ctx));
  document.getElementById('saveHuman').addEventListener('click',saveHuman);
  document.getElementById('saveAll').addEventListener('click',saveAll);
  document.getElementById('nextStep').addEventListener('click',()=>{saveAll();ctx.navigate(13)});

  function loadDraft(){const q=cover.questions?.find(x=>x.id===v('coverId'));document.getElementById('draft').value=q?.draft||'';ctx.toast(q?.draft?'초안을 불러왔습니다.':'저장된 초안이 없습니다.');}
  function saveHuman(){const coverId=v('coverId'),draft=v('draft'),finalText=v('finalText');if(!draft&&!finalText){status('수정할 초안 또는 최종본을 입력하세요.');return;}const q=cover.questions?.find(x=>x.id===coverId);const item={id:`hf_${Date.now()}`,coverId,question:q?.question||'',draft,keep:v('keep'),humanize:v('humanize'),deleteText:v('deleteText'),finalText,factChecked:document.getElementById('factChecked').checked,createdAt:new Date().toISOString()};data.items=data.items.filter(x=>x.coverId!==coverId||!coverId);data.items.push(item);persist();renderHumanList();status('My Voice 최종본을 저장했습니다.');}
  function renderHumanList(){const box=document.getElementById('humanList');if(!data.items.length){box.innerHTML='<div class="placeholder"><b>아직 Human-First 최종본이 없습니다.</b>AI 초안과 Raw Voice를 비교해 한 문항씩 최종확정하세요.</div>';return;}box.innerHTML=data.items.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">Final ${i+1}</span><h3>${esc(x.question||'자소서 문항',ctx)}</h3></div>${x.factChecked?'<span class="scoreChip">Fact Locked</span>':'<span class="scoreChip" style="background:#fff8e6;color:#9a6700;border-color:#f3dfaa">확인 필요</span>'}</div><div><b>My Voice 최종본</b><p>${esc(x.finalText||'—',ctx)}</p></div><div class="actions"><button class="btn danger smallBtn" data-del="${x.id}">삭제</button></div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.items=data.items.filter(x=>x.id!==b.dataset.del);persist();renderHumanList();}));}
  function saveAll(){data.consistency={resumeCover:document.getElementById('resumeCover').checked,coverInterview:document.getElementById('coverInterview').checked,factLock:document.getElementById('factLockAll').checked};data.notes=v('notes');persist();ctx.toast('Human-First Check를 저장했습니다.');}
  function persist(){ctx.saveState({artifacts:{humanFirst:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function rawVoiceCards(items,ctx){const rows=items.filter(x=>x.rawVoice).slice(0,8);if(!rows.length)return '<div class="placeholder"><b>Raw Voice가 없습니다.</b>STEP 2의 경험에서 본인이 실제로 설명한 표현을 남기면 여기에서 활용할 수 있습니다.</div>';return rows.map(x=>`<div class="resultCard"><strong>${ctx.escapeHtml(x.title)}</strong><p>${ctx.escapeHtml(x.rawVoice)}</p></div>`).join('')}
function selectQuestion(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">${x.question}</option>`).join('')}</select></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function check(id,text,on){return `<label class="checkRow"><input type="checkbox" id="${id}" ${on?'checked':''}><div><b>${text}</b></div></label>`}
function buildPrompt(experiences,draft){const voices=experiences.filter(x=>x.rawVoice).map(x=>({title:x.title,rawVoice:x.rawVoice}));return `너는 문장을 'AI처럼 안 보이게' 속이는 도구가 아니라, 지원자의 실제 언어와 사실을 회복하는 편집자다. 탐지기 우회를 목표로 하지 않는다.\n\n[지원자의 Raw Voice]\n${JSON.stringify(voices,null,2)}\n\n[수정할 초안]\n${draft||'미입력'}\n\n다음 기준으로 문장별로 분류해줘.\nKEEP: 구체적이고 사실적이며 지원자의 언어와 크게 어긋나지 않는 문장\nHUMANIZE: 내용은 필요하지만 번역투·상투어·과도한 추상어 때문에 지원자가 실제로 말하지 않을 법한 문장\nDELETE: 새로운 정보가 없거나 누구에게나 적용되는 일반론\n\n규칙:\n1. 숫자·행동·역할·결과는 절대 바꾸지 않는다.\n2. 내가 하지 않은 행동을 추가하지 않는다.\n3. '혁신적인, 핵심은, 결론적으로, ~하는 것이 중요합니다' 같은 상투표현은 정보가 없으면 제거한다.\n4. 모든 문장을 일부러 거칠게 만들거나 문법을 틀리게 만들지 않는다.\n5. Raw Voice에 없는 말투를 억지로 흉내내지 않는다.\n6. 수정 제안은 최소변경을 우선한다.\n7. 마지막에 사실확인이 필요한 표현만 별도로 표시한다.\n\n먼저 KEEP / HUMANIZE / DELETE 표부터 보여줘.`}
function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('Human-First 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

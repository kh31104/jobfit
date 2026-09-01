const CATEGORIES=['수업·과제','팀프로젝트','캡스톤·연구','동아리·학생회','공모전·대외활동','인턴·현장실습','아르바이트·근로','봉사활동','개인프로젝트','기타'];

export async function render(ctx){
  const state=ctx.getState();
  const saved=state.assessments?.experienceCompetency||{experiences:[]};
  const experiences=Array.isArray(saved.experiences)?saved.experiences:[];
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 2</div><h2>Experience & Competency</h2><p>검사결과가 아니라 실제 경험에서 내가 한 행동과 직무역량의 증거를 찾습니다.</p></div><span class="badge">4주차</span></div>
    <div class="progress"><span style="width:21%"></span></div>
    <div class="callout info"><b>핵심 원칙</b> · '협업을 잘한다'가 아니라 <b>어떤 상황에서 무엇을 했고, 어떤 결과가 있었는지</b>를 남깁니다. AI는 경험을 만들어내지 않고 질문과 구조화만 합니다.</div>

    <div class="block"><h3>1. 내 경험 목록</h3><p class="help">크고 화려한 경험만 적지 않습니다. 수업·아르바이트·동아리처럼 내가 실제로 행동한 경험이면 충분합니다.</p>
      <div id="experienceList">${listHtml(experiences,ctx)}</div>
      <div class="actions"><button class="btn secondary" id="newExp">+ 새 경험 추가</button></div>
    </div>

    <div class="hr"></div><div class="block"><h3>2. Experience Interview</h3><input type="hidden" id="editId" value="">
      <div class="grid3">
        ${sel('category','경험 유형','',CATEGORIES)}
        ${txt('title','경험 이름','','예: 캡스톤 센서 프로젝트')}
        ${txt('period','기간','','예: 2026.03–06')}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${area('context','경험 배경','무엇을 하기 위한 경험이었나요? 팀/수업/조직의 목적을 짧게 적으세요.','')}
        ${area('role','내 역할','팀 전체가 아니라 내가 맡은 역할과 책임은 무엇이었나요?','')}
      </div>
      <div class="actions"><button class="btn secondary" id="makeInterviewPrompt">AI 경험인터뷰 프롬프트 만들기</button><button class="btn outline hidden" id="copyInterviewPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="interviewPrompt"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>3. AI 인터뷰 후, 사실을 구조화</h3><p class="help">AI와 대화한 뒤 아래 칸을 학생이 직접 확인·수정합니다. 없는 수치나 행동을 보완해서 쓰면 안 됩니다.</p>
      <div class="grid2">
        ${area('challenge','문제·과제','가장 어려웠던 문제 또는 해결해야 했던 과제는?','')}
        ${area('action','내가 직접 한 행동','내가 실제로 한 행동을 구체적인 동사로 적으세요.','')}
        ${area('reason','왜 그렇게 했는가','그 행동을 선택한 이유와 판단 기준은?','')}
        ${area('result','결과','무엇이 달라졌나요? 가능하면 수치·피드백·완성물 등으로 적으세요.','')}
        ${area('evidence','증거','결과를 입증할 수 있는 자료·숫자·피드백·기록은?','')}
        ${area('learning','배운 점','이 경험 이후 달라진 행동이나 다음에 적용할 점은?','')}
      </div>
      <div class="field" style="margin-top:12px"><label>내 원래 말 · Raw Voice</label><textarea id="rawVoice" placeholder="AI가 고치기 전 내가 실제로 설명한 표현이나 메모를 남겨두세요."></textarea><span class="hint">나중에 Human-First Writing에서 내 말투를 복원할 때 사용합니다.</span></div>
      <div class="field" style="margin-top:12px"><label>AI 구조화 결과 <span class="muted">(선택)</span></label><textarea id="aiStructured" placeholder="AI가 정리해 준 STAR/경험 구조를 필요한 경우 붙여넣으세요."></textarea></div>
    </div>

    <div class="hr"></div><div class="block"><h3>4. 역량 키워드 추출</h3><p class="help">AI가 제안한 역량명을 그대로 믿지 말고, 위 행동과 증거로 설명할 수 있는 키워드만 남깁니다.</p>
      <div class="field"><label>역량 키워드</label><input class="input" id="competencies" placeholder="예: 문제해결, 데이터분석, 조율, 책임감"><span class="hint">쉼표(,)로 구분. 이후 실제 채용공고의 Task·KSA와 다시 매칭합니다.</span></div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>Fact Check 완료</b><span>내가 하지 않은 행동, 확인되지 않은 수치, 과장된 결과가 없는지 확인했습니다.</span></div></label>
    </div>

    <div class="actions"><button class="btn primary" id="saveExp">이 경험 저장</button><button class="btn outline" id="clearForm">입력 초기화</button><button class="btn secondary" id="nextStep">STEP 3 직무탐색 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>loadExperience(b.dataset.edit)));
  root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteExperience(b.dataset.delete)));
  document.getElementById('newExp').addEventListener('click',clearForm);
  document.getElementById('clearForm').addEventListener('click',clearForm);
  document.getElementById('saveExp').addEventListener('click',saveExperience);
  document.getElementById('nextStep').addEventListener('click',()=>ctx.navigate(3));
  document.getElementById('makeInterviewPrompt').addEventListener('click',()=>{const prompt=makePrompt();const box=document.getElementById('interviewPrompt');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyInterviewPrompt').classList.remove('hidden')});
  document.getElementById('copyInterviewPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('interviewPrompt').textContent);ctx.toast('경험인터뷰 프롬프트를 복사했습니다.')}catch{ctx.toast('직접 선택해 복사해 주세요.')}});

  function currentExperiences(){return ctx.getState().assessments?.experienceCompetency?.experiences||[]}
  function saveExperience(){
    const title=v('title');if(!title){ctx.toast('경험 이름을 먼저 입력해 주세요.');return}
    const oldId=v('editId');const item={id:oldId||`EXP-${Date.now()}`,category:v('category'),title,period:v('period'),context:v('context'),role:v('role'),challenge:v('challenge'),action:v('action'),reason:v('reason'),result:v('result'),evidence:v('evidence'),learning:v('learning'),rawVoice:v('rawVoice'),aiStructured:v('aiStructured'),competencies:v('competencies').split(',').map(x=>x.trim()).filter(Boolean),factChecked:document.getElementById('factChecked').checked,updatedAt:new Date().toISOString()};
    const arr=[...currentExperiences()];const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]=item;else arr.push(item);
    ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:arr.map(x=>({id:x.id,title:x.title,category:x.category,action:x.action,result:x.result,evidence:x.evidence,competencies:x.competencies,factChecked:x.factChecked}))}});ctx.toast('경험을 Career Asset 후보로 저장했습니다.');ctx.navigate(2);
  }
  function loadExperience(id){const x=currentExperiences().find(e=>e.id===id);if(!x)return;set('editId',x.id);['category','title','period','context','role','challenge','action','reason','result','evidence','learning','rawVoice','aiStructured'].forEach(k=>set(k,x[k]||''));set('competencies',(x.competencies||[]).join(', '));document.getElementById('factChecked').checked=!!x.factChecked;document.getElementById('title').focus();}
  function deleteExperience(id){if(!confirm('이 경험을 삭제할까요?'))return;const arr=currentExperiences().filter(x=>x.id!==id);ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:arr}});ctx.toast('삭제했습니다.');ctx.navigate(2)}
  function clearForm(){['editId','category','title','period','context','role','challenge','action','reason','result','evidence','learning','rawVoice','aiStructured','competencies'].forEach(k=>set(k,''));document.getElementById('factChecked').checked=false;document.getElementById('title').focus()}
  function makePrompt(){return `지금부터 내 경험을 분석하는 취업 면접관이 되어줘. 목표는 자소서를 대신 써주는 것이 아니라, 내가 실제로 한 행동과 증거를 정확히 꺼내는 것이다.\n\n[경험]\n유형: ${v('category')||'미입력'}\n이름: ${v('title')||'미입력'}\n기간: ${v('period')||'미입력'}\n배경: ${v('context')||'미입력'}\n내 역할: ${v('role')||'미입력'}\n\n진행 규칙:\n1. 한 번에 질문 하나만 해줘.\n2. 다음 6가지를 차례대로 확인해줘: 가장 어려웠던 문제 → 내가 직접 한 행동 → 왜 그렇게 판단했는지 → 결과 → 결과의 증거 → 배운 점.\n3. 팀이 한 일과 내가 한 일을 반드시 구분해줘.\n4. 내가 말하지 않은 숫자·성과·역할은 절대 만들지 마.\n5. 모호한 답이면 구체적인 행동을 묻는 꼬리질문을 해줘.\n6. 인터뷰가 끝난 뒤에만 Situation / Role / Challenge / Action / Reasoning / Result / Evidence / Learning 순으로 구조화해줘.\n7. 마지막에는 내 행동에서 확인 가능한 역량 키워드를 최대 5개 제안하되, 각 키워드 옆에 근거가 된 행동을 함께 적어줘.\n8. 표현을 멋있게 바꾸기보다 사실 보존을 우선해줘.\n\n첫 질문부터 시작해줘.`}
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
  function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}
  function area(id,label,ph,value){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph}">${ctx.escapeHtml(value||'')}</textarea></div>`}
  function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${ctx.escapeHtml(o)}</option>`).join('')}</select></div>`}
}

function listHtml(items,ctx){if(!items.length)return '<div class="placeholder"><b>아직 저장한 경험이 없습니다.</b>첫 경험을 하나 선택해 AI 인터뷰를 시작해 보세요.</div>';return `<div class="resultGrid">${items.map(x=>`<div class="resultCard"><strong>${ctx.escapeHtml(x.title)}</strong><p>${ctx.escapeHtml(x.category||'경험')} · ${(x.competencies||[]).map(ctx.escapeHtml).join(' · ')||'역량 미입력'}</p><div class="pillRow" style="margin-top:10px">${x.factChecked?'<span class="pill">Fact Checked</span>':'<span class="pill">검증 필요</span>'}</div><div class="actions"><button class="btn outline smallBtn" data-edit="${x.id}">수정</button><button class="btn danger smallBtn" data-delete="${x.id}">삭제</button></div></div>`).join('')}</div>`}

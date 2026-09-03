import {renderStrengthMeasure,bindStrengthMeasure} from '../researchMeasures.js';

const CATEGORIES=['수업·과제','팀프로젝트','캡스톤·연구','동아리·학생회','공모전·대외활동','인턴·현장실습','아르바이트·근로','봉사활동','개인프로젝트','기타'];
const EVIDENCE_TYPES=['수치·지표','산출물·문서','교수·상사·고객 피드백','수상·선발·평가결과','작업기록·로그','동료·팀 피드백','자기기억만'];

export async function render(ctx){
  const state=ctx.getState();
  const saved=state.assessments?.experienceCompetency||{experiences:[]};
  const experiences=Array.isArray(saved.experiences)?saved.experiences:[];
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 2</div><h2>Experience & Competency</h2><p>검사점수가 아니라 실제 경험에서 <b>내 행동 → 결과 → 증거 → 역량</b>을 추출합니다.</p></div><span class="badge">4주차</span></div>
    <div class="progress"><span style="width:21%"></span></div>
    <div class="callout info"><b>AI의 역할</b> · 자소서를 대신 쓰는 것이 아니라 인터뷰합니다. 팀이 한 일과 내가 한 일을 분리하고, 없는 수치·성과·역할을 만들지 못하게 합니다.</div>

    ${ctx.courseConfig.researchMeasures?renderStrengthMeasure(ctx,'pre'):''}

    <div class="block"><h3>1. 내 경험 목록</h3><p class="help">크고 화려한 경험보다 내가 실제로 행동한 경험이 중요합니다. 최소 3개 이상을 쌓아두면 이후 직무·JD 매칭이 훨씬 정확해집니다.</p><div id="experienceList">${listHtml(experiences,ctx)}</div><div class="actions"><button class="btn secondary" id="newExp">+ 새 경험 추가</button></div></div>

    <div class="hr"></div><div class="block"><h3>2. 경험 기본정보</h3><input type="hidden" id="editId" value="">
      <div class="grid3">${sel('category','경험 유형','',CATEGORIES)}${txt('title','경험 이름','','예: 캡스톤 센서 프로젝트')}${txt('period','기간','','예: 2026.03–06')}</div>
      <div class="grid3" style="margin-top:12px">${sel('workMode','진행 방식','',['개인','팀','조직/부서'])}${score('contribution','내 기여도')}${txt('roleTitle','내 역할 한 줄','','예: 회로설계 담당 / 고객응대 / 자료분석')}</div>
      <div class="grid2" style="margin-top:12px">${area('context','경험 배경','무엇을 하기 위한 경험이었나요? 목적과 상황만 짧게.','')}${area('role','내 책임 범위','팀 전체가 아니라 내가 맡은 책임과 의사결정 범위는 무엇이었나요?','')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>3. AI Experience Interview</h3><p class="help">아래 프롬프트를 외부 AI에 붙여넣고 실제 대화를 진행합니다. AI가 한 번에 하나씩 묻게 설계되어 있습니다.</p><div class="actions"><button class="btn secondary" id="makeInterviewPrompt">증거 중심 인터뷰 프롬프트 만들기</button><button class="btn outline hidden" id="copyInterviewPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="interviewPrompt"></div></div>

    <div class="hr"></div><div class="block"><h3>4. AI 인터뷰 후 사실 구조화</h3><p class="help">AI 답변을 그대로 붙이지 말고 학생이 직접 확인·수정합니다.</p>
      <div class="grid2">${area('challenge','문제·과제','내가 해결하거나 달성해야 했던 핵심 과제는?','')}${area('action','내가 직접 한 행동','내가 실제로 한 행동을 동사 중심으로 적으세요.','')}${area('reason','판단·이유','왜 그 행동을 선택했나요? 비교한 대안이나 판단기준은?','')}${area('result','결과','무엇이 달라졌나요? 확인 가능한 결과만 적으세요.','')}${area('evidence','증거','수치·산출물·피드백·기록 등 결과를 입증하는 근거는?','')}${area('learning','전이 가능한 배움','다른 상황에서도 다시 사용할 수 있는 방식·원칙은?','')}</div>
      <div class="grid3" style="margin-top:12px">${sel('evidenceType','가장 강한 증거 유형','',EVIDENCE_TYPES)}${sel('evidenceGrade','증거 강도','',['A · 객관적 자료로 확인 가능','B · 타인의 피드백/평가로 확인','C · 본인 설명 중심'])}${txt('actionVerbs','핵심 행동동사','','예: 비교했다, 분석했다, 조율했다')}</div>
      <div class="field" style="margin-top:12px"><label>내 원래 말 · Raw Voice</label><textarea id="rawVoice" placeholder="AI가 다듬기 전 내가 실제로 설명한 문장이나 메모"></textarea><span class="hint">STEP 12 Human-First에서 내 언어를 복원할 때 사용합니다.</span></div>
      <div class="field" style="margin-top:12px"><label>AI 구조화 결과 <span class="muted">(선택)</span></label><textarea id="aiStructured" placeholder="AI가 정리한 구조가 있다면 붙여넣되, 사실확인 후 사용"></textarea></div>
    </div>

    <div class="hr"></div><div class="block"><h3>5. 역량은 반드시 행동 근거와 묶기</h3><p class="help">‘문제해결’ 같은 단어만 저장하지 않습니다. 각 역량마다 어떤 행동이 그 역량의 근거인지 적습니다.</p>
      <div class="grid3">${competencyRow(1)}${competencyRow(2)}${competencyRow(3)}</div>
      <div class="field" style="margin-top:12px"><label>추가 역량 키워드 <span class="muted">(선택)</span></label><input class="input" id="competencies" placeholder="예: 데이터분석, 조율, 책임감"><span class="hint">쉼표로 구분. 이후 실제 채용공고의 Task·KSA와 다시 대조합니다.</span></div>
    </div>

    <div class="hr"></div><div class="block"><h3>6. Career Asset Quality Check</h3>
      ${check('ownershipChecked','팀의 행동과 내가 직접 한 행동을 구분했다.')}
      ${check('evidenceChecked','결과를 뒷받침하는 증거 수준을 확인했다.')}
      ${check('noFabrication','내가 하지 않은 행동·확인되지 않은 수치·과장된 결과가 없다.')}
      ${check('transferChecked','이 경험의 행동이 다른 직무상황에서 어떻게 재사용될지 설명할 수 있다.')}
    </div>

    <div class="actions"><button class="btn primary" id="saveExp">이 경험 저장</button><button class="btn outline" id="clearForm">입력 초기화</button><button class="btn secondary" id="nextStep">STEP 3 직무탐색 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>loadExperience(b.dataset.edit)));
  root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteExperience(b.dataset.delete)));
  document.getElementById('newExp').addEventListener('click',clearForm);document.getElementById('clearForm').addEventListener('click',clearForm);document.getElementById('saveExp').addEventListener('click',saveExperience);document.getElementById('nextStep').addEventListener('click',()=>ctx.navigate(3));
  document.getElementById('makeInterviewPrompt').addEventListener('click',()=>{const prompt=makePrompt();const box=document.getElementById('interviewPrompt');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyInterviewPrompt').classList.remove('hidden')});
  document.getElementById('copyInterviewPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('interviewPrompt').textContent);ctx.toast('경험인터뷰 프롬프트를 복사했습니다.')}catch{ctx.toast('직접 선택해 복사해 주세요.')}});
  if(ctx.courseConfig.researchMeasures)bindStrengthMeasure(ctx,'pre');

  function currentExperiences(){return ctx.getState().assessments?.experienceCompetency?.experiences||[]}
  function saveExperience(){
    const title=v('title');if(!title){ctx.toast('경험 이름을 먼저 입력해 주세요.');return}
    const oldId=v('editId');
    const competencyEvidence=[1,2,3].map(i=>({keyword:v(`comp_${i}`),evidence:v(`compEv_${i}`)})).filter(x=>x.keyword||x.evidence);
    const extra=v('competencies').split(',').map(x=>x.trim()).filter(Boolean);
    const competencies=[...new Set([...competencyEvidence.map(x=>x.keyword).filter(Boolean),...extra])];
    const quality={ownership:ck('ownershipChecked'),evidence:ck('evidenceChecked'),noFabrication:ck('noFabrication'),transfer:ck('transferChecked')};
    const item={id:oldId||`EXP-${Date.now()}`,category:v('category'),title,period:v('period'),workMode:v('workMode'),contribution:n('contribution'),roleTitle:v('roleTitle'),context:v('context'),role:v('role'),challenge:v('challenge'),action:v('action'),reason:v('reason'),result:v('result'),evidence:v('evidence'),evidenceType:v('evidenceType'),evidenceGrade:v('evidenceGrade'),actionVerbs:v('actionVerbs'),learning:v('learning'),rawVoice:v('rawVoice'),aiStructured:v('aiStructured'),competencies,competencyEvidence,quality,factChecked:quality.noFabrication&&quality.ownership,updatedAt:new Date().toISOString()};
    const arr=[...currentExperiences()];const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]=item;else arr.push(item);
    ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:arr.map(x=>({id:x.id,title:x.title,category:x.category,action:x.action,result:x.result,evidence:x.evidence,evidenceGrade:x.evidenceGrade,competencies:x.competencies,competencyEvidence:x.competencyEvidence,factChecked:x.factChecked}))}});ctx.toast('경험을 Evidence 기반 Career Asset 후보로 저장했습니다.');ctx.navigate(2);
  }
  function loadExperience(id){const x=currentExperiences().find(e=>e.id===id);if(!x)return;set('editId',x.id);['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured'].forEach(k=>set(k,x[k]||''));set('contribution',x.contribution||3);set('competencies',(x.competencies||[]).filter(c=>!(x.competencyEvidence||[]).some(e=>e.keyword===c)).join(', '));[1,2,3].forEach((i,idx)=>{set(`comp_${i}`,x.competencyEvidence?.[idx]?.keyword||'');set(`compEv_${i}`,x.competencyEvidence?.[idx]?.evidence||'')});document.getElementById('ownershipChecked').checked=!!x.quality?.ownership;document.getElementById('evidenceChecked').checked=!!x.quality?.evidence;document.getElementById('noFabrication').checked=!!x.quality?.noFabrication;document.getElementById('transferChecked').checked=!!x.quality?.transfer;document.getElementById('title').focus();}
  function deleteExperience(id){if(!confirm('이 경험을 삭제할까요?'))return;const arr=currentExperiences().filter(x=>x.id!==id);ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:arr.map(x=>({id:x.id,title:x.title,category:x.category,action:x.action,result:x.result,evidence:x.evidence,evidenceGrade:x.evidenceGrade,competencies:x.competencies,factChecked:x.factChecked}))}});ctx.toast('삭제했습니다.');ctx.navigate(2)}
  function clearForm(){['editId','category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured','competencies','comp_1','compEv_1','comp_2','compEv_2','comp_3','compEv_3'].forEach(k=>set(k,''));set('contribution',3);['ownershipChecked','evidenceChecked','noFabrication','transferChecked'].forEach(id=>document.getElementById(id).checked=false);document.getElementById('title').focus()}
  function makePrompt(){return `지금부터 내 경험을 분석하는 취업 면접관이 되어줘. 목표는 자소서를 대신 쓰는 것이 아니라, 내가 실제로 한 행동과 증거를 정확히 꺼내는 것이다.\n\n[경험 기본정보]\n유형: ${v('category')||'미입력'}\n경험: ${v('title')||'미입력'}\n기간: ${v('period')||'미입력'}\n진행방식: ${v('workMode')||'미입력'}\n내 역할: ${v('roleTitle')||v('role')||'미입력'}\n배경: ${v('context')||'미입력'}\n\n[인터뷰 규칙]\n1. 반드시 한 번에 질문 하나만 한다. 전체 질문은 최대 10개다.\n2. 내가 '우리 팀이', '저희가'라고 답하면 바로 '그중 본인이 직접 한 행동은 무엇인가요?'라고 다시 묻는다.\n3. Challenge → Action → Reasoning → Result → Evidence → Learning 순으로 파고든다.\n4. Action에서는 실제 행동동사, 사용한 도구·자료, 누구와 어떻게 상호작용했는지 묻는다.\n5. Result에서 숫자가 없으면 숫자를 만들도록 유도하지 않는다. 대신 산출물, 완료여부, 피드백, 변화, 기록 등 실제 확인 가능한 결과를 묻는다.\n6. 내가 말하지 않은 숫자·성과·역할·도구·고객반응은 절대 만들어내지 않는다.\n7. 모호한 역량명부터 제시하지 말고 행동 사실을 먼저 충분히 확보한다.\n8. 인터뷰가 끝나면 내가 말한 내용만으로 Situation / Role / Challenge / Action / Reasoning / Result / Evidence / Learning을 정리한다.\n9. 역량은 최대 5개만 제안하고, 각 역량 옆에 '근거 행동 한 문장'을 붙인다. 근거가 약하면 '근거 약함'이라고 표시한다.\n10. 마지막에 확인이 필요한 사실이나 과장 위험이 있는 문장을 별도로 표시한다.\n\n첫 질문부터 시작해줘.`}
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}function n(id){return Number(document.getElementById(id)?.value||0)}function ck(id){return !!document.getElementById(id)?.checked}function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
  function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}function area(id,label,ph,value){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph}">${ctx.escapeHtml(value||'')}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${ctx.escapeHtml(o)}</option>`).join('')}</select></div>`}
}
function competencyRow(i){return `<div class="metricCard"><b>역량 ${i}</b><div class="field"><label>키워드</label><input class="input" id="comp_${i}" placeholder="예: 문제해결"></div><div class="field" style="margin-top:8px"><label>근거 행동</label><textarea id="compEv_${i}" placeholder="이 역량을 보여주는 실제 행동 한 문장"></textarea></div></div>`}function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}${n===1?' 낮음':n===5?' 높음':''}</option>`).join('')}</select></div>`}function check(id,text){return `<label class="checkRow"><input type="checkbox" id="${id}"><div><b>${text}</b></div></label>`}
function listHtml(items,ctx){if(!items.length)return '<div class="placeholder"><b>아직 저장한 경험이 없습니다.</b>첫 경험을 하나 선택해 AI 인터뷰를 시작해 보세요.</div>';return `<div class="resultGrid">${items.map(x=>`<div class="resultCard"><strong>${ctx.escapeHtml(x.title)}</strong><p>${ctx.escapeHtml(x.category||'경험')} · ${(x.competencies||[]).map(ctx.escapeHtml).join(' · ')||'역량 미입력'}</p><div class="pillRow" style="margin-top:10px"><span class="pill">${ctx.escapeHtml(x.evidenceGrade||'증거등급 미정')}</span>${x.factChecked?'<span class="pill">Fact Checked</span>':'<span class="pill">검증 필요</span>'}</div><div class="actions"><button class="btn outline smallBtn" data-edit="${x.id}">수정</button><button class="btn danger smallBtn" data-delete="${x.id}">삭제</button></div></div>`).join('')}</div>`}

import {prepareResearchMeasures,renderStrengthMeasure,bindStrengthMeasure} from '../researchMeasures.js';

const WEEK4_VERSION='experience-competency-week4-v2';
const CATEGORIES=['수업·과제','팀프로젝트','캡스톤·연구','동아리·학생회','공모전·대외활동','인턴·현장실습','아르바이트·근로','봉사활동','개인프로젝트','기타'];
const EVIDENCE_TYPES=['수치·지표','산출물·문서','교수·상사·고객 피드백','수상·선발·평가결과','작업기록·로그','동료·팀 피드백','자기기억만'];

export async function render(ctx){
  if(ctx.courseConfig.researchMeasures)await prepareResearchMeasures(ctx);
  const state=ctx.getState();
  const dna=state.assessments?.careerDNA||{};
  const saved=state.assessments?.experienceCompetency||{experiences:[]};
  const experiences=Array.isArray(saved.experiences)?saved.experiences:[];
  const legacyBest3=state.assessments?.careerRoadmap?.best3||{};
  const best3=normalizeBest3(saved.best3||legacyBest3);
  const representativeKey=saved.representativeKey||state.assessments?.careerRoadmap?.representativeKey||'';
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card experienceCompetencyWeek4">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 2 · EXPERIENCE & COMPETENCY</div><h2>나의 경험에서 직무역량 찾기</h2><p>3주차 Career DNA를 정답으로 확정하지 않고, <b>내가 실제로 한 행동</b>에서 강점과 역량의 근거를 찾습니다.</p></div><span class="badge">4주차</span></div>
    <div class="progress"><span style="width:21%"></span></div>
    <div class="callout info"><b>오늘의 흐름</b> · Career DNA 간단히 확인 → My Best 3 Experience → 대표 경험 선택 → AI Experience Interview → 행동·결과·증거 정리 → 강점·역량 키워드 → Experience Map</div>
    <div class="callout good"><b>4주차의 도착점</b> · 직업을 정하는 시간이 아닙니다. <b>어떤 경험에서 내가 무엇을 했고, 그 행동이 어떤 강점·역량을 보여주는지</b> 근거와 함께 정리합니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>지난주 Career DNA 간단히 확인</h3><p>검사점수를 다시 해석하지 않습니다. 3주차에서 내가 남긴 자기이해 가설만 참고합니다.</p></div></div>
      ${dnaBridgeHtml(dna,ctx)}
    </div>

    ${ctx.courseConfig.researchMeasures?renderStrengthMeasure(ctx,'pre'):''}

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>My Best 3 Experience</h3><p>강점 이름부터 고르지 말고, 먼저 내가 실제로 행동했던 경험 세 가지를 떠올립니다.</p></div></div>
      ${best3Row('best','내가 꽤 잘했다고 생각하는 경험',best3.best,ctx)}
      ${best3Row('flow','시간 가는 줄 모르고 몰입한 경험',best3.flow,ctx)}
      ${best3Row('recognition','다른 사람에게 인정·감사를 받은 경험',best3.recognition,ctx)}
      <div class="summaryBox" style="margin-top:12px"><h4>오늘 깊게 분석할 대표 경험 1개</h4><p class="help">세 경험 중 하나를 골라 아래 Experience Interview의 시작자료로 가져옵니다.</p><div class="repChoices">${['best','flow','recognition'].map(k=>`<label><input type="radio" name="representative" value="${k}" ${representativeKey===k?'checked':''}><span>${k==='best'?'잘한 경험':k==='flow'?'몰입 경험':'인정받은 경험'}</span></label>`).join('')}</div><div class="actions"><button class="btn outline" id="useRepresentative">선택한 경험을 분석칸으로 가져오기</button></div></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>AI Experience Interview</h3><p>AI가 답을 쓰는 것이 아니라, 경험 속 <b>내 행동·판단·결과·증거</b>를 한 질문씩 구체화하도록 사용합니다.</p></div></div>
      <div id="experienceList">${listHtml(experiences,ctx)}</div><div class="actions"><button class="btn secondary" id="newExp">+ 새 경험 추가</button></div>
      <input type="hidden" id="editId" value="">
      <div class="grid3" style="margin-top:14px">${sel('category','경험 유형','',CATEGORIES,ctx)}${txt('title','경험 이름','','예: 캡스톤 프로젝트',ctx)}${txt('period','기간','','예: 2026.03–06',ctx)}</div>
      <div class="grid3" style="margin-top:12px">${sel('workMode','진행 방식','',['개인','팀','조직/부서'],ctx)}${score('contribution','내 기여도')}${txt('roleTitle','내 역할 한 줄','','예: 자료분석 / 고객응대 / 일정조율',ctx)}</div>
      <div class="grid2" style="margin-top:12px">${area('context','경험 배경','무엇을 하기 위한 경험이었나요? 목적과 상황만 짧게.','',ctx)}${area('role','내 책임 범위','팀 전체가 아니라 내가 맡은 책임과 의사결정 범위는 무엇이었나요?','',ctx)}</div>
      <div class="actions" style="margin-top:12px"><button class="btn secondary" id="makeInterviewPrompt">AI 경험 인터뷰 프롬프트 만들기</button><button class="btn outline hidden" id="copyInterviewPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="interviewPrompt"></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>행동 → 판단 → 결과 → 증거</h3><p>AI와 대화한 뒤 확인된 사실만 내 경험카드에 정리합니다.</p></div></div>
      <div class="grid2">${area('challenge','문제·과제','내가 해결하거나 달성해야 했던 핵심 과제는?','',ctx)}${area('action','내가 직접 한 행동','내가 실제로 한 행동을 동사 중심으로 적으세요.','',ctx)}${area('reason','판단·이유','왜 그 행동을 선택했나요? 비교한 대안이나 판단기준은?','',ctx)}${area('result','결과','무엇이 달라졌나요? 확인 가능한 결과만 적으세요.','',ctx)}${area('evidence','증거','수치·산출물·피드백·기록 등 결과를 입증하는 근거는?','',ctx)}${area('learning','다시 쓸 수 있는 방식','다른 상황에서도 반복해서 사용할 수 있는 행동방식은?','',ctx)}</div>
      <div class="grid3" style="margin-top:12px">${sel('evidenceType','가장 강한 증거 유형','',EVIDENCE_TYPES,ctx)}${sel('evidenceGrade','증거 강도','',['A · 객관적 자료로 확인 가능','B · 타인의 피드백/평가로 확인','C · 본인 설명 중심'],ctx)}${txt('actionVerbs','핵심 행동동사','','예: 비교했다, 분석했다, 조율했다',ctx)}</div>
      <div class="field" style="margin-top:12px"><label>내 원래 말 · Raw Voice</label><textarea id="rawVoice" placeholder="AI가 다듬기 전 내가 실제로 설명한 문장이나 메모"></textarea><span class="hint">나중에 자기소개서·면접답변을 내 말로 복원할 때 사용합니다.</span></div>
      <div class="field" style="margin-top:12px"><label>AI 구조화 결과 <span class="muted">(선택)</span></label><textarea id="aiStructured" placeholder="AI가 정리한 내용이 있다면 붙여넣고, 사실과 다른 부분은 직접 수정하세요."></textarea></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>05</span><div><h3>강점·역량 키워드와 행동근거</h3><p>키워드만 남기지 않습니다. <b>왜 그 역량이라고 볼 수 있는지 실제 행동 한 문장</b>을 반드시 함께 저장합니다.</p></div></div>
      <div class="grid3">${competencyRow(1)}${competencyRow(2)}${competencyRow(3)}</div>
      <div class="field" style="margin-top:12px"><label>추가 역량 키워드 <span class="muted">(선택)</span></label><input class="input" id="competencies" placeholder="예: 데이터분석, 조율, 책임감"><span class="hint">쉼표로 구분. 6주차에 실제 직무의 Task·KSA·KPI와 다시 대조합니다.</span></div>
      <div class="qualityBox" style="margin-top:14px">
        ${check('ownershipChecked','팀의 행동과 내가 직접 한 행동을 구분했다.')}
        ${check('evidenceChecked','결과를 뒷받침하는 증거 수준을 확인했다.')}
        ${check('noFabrication','내가 하지 않은 행동·확인되지 않은 수치·과장된 결과가 없다.')}
        ${check('transferChecked','이 행동방식을 다른 상황에서도 어떻게 쓸 수 있는지 설명할 수 있다.')}
      </div>
      <div class="actions"><button class="btn primary" id="saveExp">이 경험 저장</button><button class="btn outline" id="clearForm">입력 초기화</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>06</span><div><h3>Experience Map</h3><p>저장한 경험들을 한눈에 보고, 어떤 역량에 실제 근거가 있는지 확인합니다.</p></div></div>
      <div id="experienceMapPreview">${experienceMapHtml(experiences,ctx)}</div>
      <div class="callout warn" style="margin-top:12px"><b>다음 연결</b> · 6주차에는 여기에서 만든 강점·역량과 행동근거를 가지고 직무 후보를 탐색하고, 실제 직무의 Task·KSA·KPI와 매칭합니다.</div>
    </div>

    <div class="actions"><button class="btn primary" id="saveRoadmap">4주차 Experience Map 저장</button><button class="btn secondary" id="nextStep">STEP 3 직무탐색 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>loadExperience(b.dataset.edit)));
  root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteExperience(b.dataset.delete)));
  document.getElementById('newExp').addEventListener('click',clearForm);
  document.getElementById('clearForm').addEventListener('click',clearForm);
  document.getElementById('saveExp').addEventListener('click',saveExperience);
  document.getElementById('useRepresentative').addEventListener('click',useRepresentative);
  document.getElementById('saveRoadmap').addEventListener('click',()=>saveWeek4(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveWeek4(false);ctx.navigate(3)});
  document.getElementById('makeInterviewPrompt').addEventListener('click',()=>{
    const box=document.getElementById('interviewPrompt');
    box.textContent=makeExperiencePrompt();
    box.classList.remove('hidden');
    document.getElementById('copyInterviewPrompt').classList.remove('hidden');
  });
  document.getElementById('copyInterviewPrompt').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(document.getElementById('interviewPrompt').textContent||'');ctx.toast('경험 인터뷰 프롬프트를 복사했습니다.')}
    catch{ctx.toast('직접 선택해 복사해 주세요.')}
  });
  if(ctx.courseConfig.researchMeasures)bindStrengthMeasure(ctx,'pre');

  function currentExperiences(){return ctx.getState().assessments?.experienceCompetency?.experiences||[]}
  function collectBest3(){return{
    best:{title:v('best3_best_title'),summary:v('best3_best_summary')},
    flow:{title:v('best3_flow_title'),summary:v('best3_flow_summary')},
    recognition:{title:v('best3_recognition_title'),summary:v('best3_recognition_summary')}
  }}
  function selectedRepresentative(){return document.querySelector('input[name="representative"]:checked')?.value||''}
  function saveWeek4(showToast){
    const exp=currentExperiences();
    const patch={version:WEEK4_VERSION,best3:collectBest3(),representativeKey:selectedRepresentative(),experiences:exp,updatedAt:new Date().toISOString()};
    ctx.saveState({assessments:{experienceCompetency:patch},artifacts:{experienceMap:experienceMap(exp)}});
    if(showToast){
      document.getElementById('status').textContent='4주차 Experience Map이 이 브라우저에 저장되었습니다.';
      ctx.toast('4주차 Experience Map을 저장했습니다.');
    }
  }
  function saveExperience(){
    const title=v('title');if(!title){ctx.toast('경험 이름을 먼저 입력해 주세요.');return}
    saveWeek4(false);
    const oldId=v('editId');
    const competencyEvidence=[1,2,3].map(i=>({keyword:v(`comp_${i}`),evidence:v(`compEv_${i}`)})).filter(x=>x.keyword||x.evidence);
    const extra=v('competencies').split(',').map(x=>x.trim()).filter(Boolean);
    const competencies=[...new Set([...competencyEvidence.map(x=>x.keyword).filter(Boolean),...extra])];
    const quality={ownership:ck('ownershipChecked'),evidence:ck('evidenceChecked'),noFabrication:ck('noFabrication'),transfer:ck('transferChecked')};
    const item={id:oldId||`EXP-${Date.now()}`,category:v('category'),title,period:v('period'),workMode:v('workMode'),contribution:n('contribution'),roleTitle:v('roleTitle'),context:v('context'),role:v('role'),challenge:v('challenge'),action:v('action'),reason:v('reason'),result:v('result'),evidence:v('evidence'),evidenceType:v('evidenceType'),evidenceGrade:v('evidenceGrade'),actionVerbs:v('actionVerbs'),learning:v('learning'),rawVoice:v('rawVoice'),aiStructured:v('aiStructured'),competencies,competencyEvidence,quality,factChecked:quality.noFabrication&&quality.ownership,updatedAt:new Date().toISOString()};
    const arr=[...currentExperiences()];const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]=item;else arr.push(item);
    const current=ctx.getState().assessments?.experienceCompetency||{};
    ctx.saveState({assessments:{experienceCompetency:{...current,version:WEEK4_VERSION,best3:collectBest3(),representativeKey:selectedRepresentative(),experiences:arr,updatedAt:new Date().toISOString()}},artifacts:{experienceMap:experienceMap(arr)}});
    ctx.toast('경험과 역량근거를 Experience Map에 저장했습니다.');ctx.navigate(2);
  }
  function loadExperience(id){
    const x=currentExperiences().find(e=>e.id===id);if(!x)return;
    set('editId',x.id);
    ['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured'].forEach(k=>set(k,x[k]||''));
    set('contribution',x.contribution||3);
    set('competencies',(x.competencies||[]).filter(c=>!(x.competencyEvidence||[]).some(e=>e.keyword===c)).join(', '));
    [1,2,3].forEach((i,idx)=>{set(`comp_${i}`,x.competencyEvidence?.[idx]?.keyword||'');set(`compEv_${i}`,x.competencyEvidence?.[idx]?.evidence||'')});
    document.getElementById('ownershipChecked').checked=!!x.quality?.ownership;
    document.getElementById('evidenceChecked').checked=!!x.quality?.evidence;
    document.getElementById('noFabrication').checked=!!x.quality?.noFabrication;
    document.getElementById('transferChecked').checked=!!x.quality?.transfer;
    document.getElementById('title').focus();
  }
  function deleteExperience(id){
    if(!confirm('이 경험을 삭제할까요?'))return;
    saveWeek4(false);
    const arr=currentExperiences().filter(x=>x.id!==id);
    const current=ctx.getState().assessments?.experienceCompetency||{};
    ctx.saveState({assessments:{experienceCompetency:{...current,experiences:arr,updatedAt:new Date().toISOString()}},artifacts:{experienceMap:experienceMap(arr)}});
    ctx.toast('삭제했습니다.');ctx.navigate(2);
  }
  function clearForm(){
    ['editId','category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured','competencies','comp_1','compEv_1','comp_2','compEv_2','comp_3','compEv_3'].forEach(k=>set(k,''));
    set('contribution',3);
    ['ownershipChecked','evidenceChecked','noFabrication','transferChecked'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false});
    document.getElementById('title')?.focus();
  }
  function useRepresentative(){
    const key=selectedRepresentative();if(!key){ctx.toast('대표 경험을 먼저 선택해 주세요.');return}
    const title=v(`best3_${key}_title`),summary=v(`best3_${key}_summary`);
    if(!title&&!summary){ctx.toast('선택한 경험의 제목이나 설명을 먼저 적어 주세요.');return}
    if(!v('title'))set('title',title);if(!v('context'))set('context',summary);
    document.getElementById('title')?.scrollIntoView({behavior:'smooth',block:'center'});
    ctx.toast('대표 경험을 분석칸에 가져왔습니다.');
  }
  function makeExperiencePrompt(){
    const h=dna.hypothesis||{},c=dna.comparison||{},dnaLines=[
      h.text&&`Career DNA 가설: ${h.text}`,
      c.repeat&&`반복해서 나타난다고 본 부분: ${c.repeat}`,
      c.verify&&`더 확인하고 싶은 부분: ${c.verify}`
    ].filter(Boolean);
    return `지금부터 내 경험에서 실제 행동과 직무역량의 근거를 찾는 인터뷰어가 되어줘. 자소서를 대신 쓰거나 직업을 추천하지 말고, 내가 실제로 한 일을 구체적으로 확인해줘.\n\n[대표 경험 기본정보]\n경험명: ${v('title')||'미입력'}\n유형: ${v('category')||'미입력'}\n기간: ${v('period')||'미입력'}\n진행방식: ${v('workMode')||'미입력'}\n내 역할: ${v('roleTitle')||'미입력'}\n배경: ${v('context')||'미입력'}\n책임범위: ${v('role')||'미입력'}${dnaLines.length?`\n\n[3주차 자기이해 가설 · 참고만]\n${dnaLines.join('\n')}`:''}\n\n[인터뷰 규칙]\n1. 한 번에 질문 하나만 한다.\n2. 먼저 이 경험에서 내가 실제로 맡은 역할과 해결해야 했던 문제를 확인한다.\n3. 팀 전체가 한 일과 내가 직접 한 행동을 반드시 분리한다.\n4. 문제·과제 → 내 행동 → 판단이유 → 결과 → 증거 순서로 질문한다.\n5. 내가 말하지 않은 행동·수치·성과를 만들어내지 않는다.\n6. 강점이나 역량 이름을 먼저 붙이지 않는다. 행동이 충분히 확인된 뒤에만 후보를 제시한다.\n7. 가능하면 \"무엇을 비교했는지, 어떻게 판단했는지, 누구와 어떻게 조율했는지\"처럼 행동을 더 구체화한다.\n8. 마지막에는 확인된 사실만 사용해 정리한다.\n\n[마지막 정리 형식]\n- 핵심 상황·과제\n- 내가 직접 한 행동 3~5개\n- 판단이유\n- 결과\n- 확인 가능한 증거\n- 핵심 행동동사\n- 강점·역량 후보 최대 3개\n- 각 역량의 근거 행동 한 문장\n- 6주차 직무 Task·KSA·KPI와 대조할 때 확인할 질문 1~2개\n\n첫 질문부터 시작해줘.`;
  }
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
  function n(id){return Number(document.getElementById(id)?.value||0)}
  function ck(id){return !!document.getElementById(id)?.checked}
  function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
}

function normalizeBest3(x){return{best:{title:x?.best?.title||'',summary:x?.best?.summary||''},flow:{title:x?.flow?.title||'',summary:x?.flow?.summary||''},recognition:{title:x?.recognition?.title||'',summary:x?.recognition?.summary||''}}}
function experienceMap(arr){return arr.map(x=>({id:x.id,title:x.title,category:x.category,roleTitle:x.roleTitle,action:x.action,actionVerbs:x.actionVerbs,result:x.result,evidence:x.evidence,evidenceGrade:x.evidenceGrade,competencies:x.competencies,competencyEvidence:x.competencyEvidence,learning:x.learning,factChecked:x.factChecked}))}
function dnaBridgeHtml(dna,ctx){
  const h=dna.hypothesis||{},c=dna.comparison||{},r=dna.reflection||{};
  const rows=[];
  if(h.text)rows.push(['Career DNA 가설 v1',h.text]);
  if(h.selfCheck)rows.push(['내가 본 정확도',h.selfCheck]);
  if(c.repeat||r.fit)rows.push(['반복해서 나타난 부분',c.repeat||r.fit]);
  if(c.verify||r.question)rows.push(['경험으로 더 확인하고 싶은 부분',c.verify||r.question]);
  if(!rows.length)return '<div class="callout good"><b>STEP 1 → STEP 2</b> · 저장된 Career DNA 요약이 없습니다. 그래도 괜찮습니다. 4주차는 실제 경험에서 내가 한 행동부터 찾으면 됩니다.</div>';
  return `<div class="dnaBridge"><div class="dnaBridgeHead"><b>STEP 1 → STEP 2</b><span>가설은 참고만 하고 경험으로 확인합니다.</span></div>${rows.map(([k,val])=>`<div class="dnaBridgeRow"><small>${ctx.escapeHtml(k)}</small><p>${ctx.escapeHtml(val)}</p></div>`).join('')}</div>`;
}
function best3Row(key,label,saved,ctx){return `<div class="best3Row"><div class="best3Label"><b>${ctx.escapeHtml(label)}</b></div><input class="input" id="best3_${key}_title" value="${ctx.escapeHtml(saved?.title||'')}" placeholder="경험 이름"><textarea id="best3_${key}_summary" placeholder="무엇을 했고 왜 이 경험이 떠오르는지 한두 문장">${ctx.escapeHtml(saved?.summary||'')}</textarea></div>`}
function competencyRow(i){return `<div class="metricCard"><b>역량 ${i}</b><div class="field"><label>키워드</label><input class="input" id="comp_${i}" placeholder="예: 문제해결"></div><div class="field" style="margin-top:8px"><label>근거 행동</label><textarea id="compEv_${i}" placeholder="이 역량을 보여주는 실제 행동 한 문장"></textarea></div></div>`}
function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}${n===1?' 낮음':n===5?' 높음':''}</option>`).join('')}</select></div>`}
function check(id,text){return `<label class="checkRow"><input type="checkbox" id="${id}"><div><b>${text}</b></div></label>`}
function txt(id,label,value,ph,ctx){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ctx.escapeHtml(ph||'')}"></div>`}
function area(id,label,ph,value,ctx){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ctx.escapeHtml(ph||'')}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function sel(id,label,value,opts,ctx){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${ctx.escapeHtml(o)}</option>`).join('')}</select></div>`}
function listHtml(items,ctx){
  if(!items.length)return '<div class="placeholder"><b>아직 저장한 경험이 없습니다.</b> My Best 3에서 대표 경험을 골라 인터뷰를 시작해 보세요.</div>';
  return `<div class="resultGrid">${items.map(x=>`<div class="resultCard"><strong>${ctx.escapeHtml(x.title)}</strong><p>${ctx.escapeHtml(x.category||'경험')} · ${(x.competencies||[]).map(c=>ctx.escapeHtml(c)).join(' · ')||'역량 미입력'}</p><div class="pillRow" style="margin-top:10px"><span class="pill">${ctx.escapeHtml(x.evidenceGrade||'증거등급 미정')}</span>${x.factChecked?'<span class="pill">Fact Checked</span>':'<span class="pill">검증 필요</span>'}</div><div class="actions"><button class="btn outline smallBtn" data-edit="${x.id}">수정</button><button class="btn danger smallBtn" data-delete="${x.id}">삭제</button></div></div>`).join('')}</div>`;
}
function experienceMapHtml(items,ctx){
  if(!items.length)return '<div class="placeholder"><b>Experience Map이 아직 비어 있습니다.</b> 경험을 하나 이상 저장하면 행동·결과·역량근거가 여기에 정리됩니다.</div>';
  return `<div class="experienceMapGrid">${items.map((x,i)=>`<div class="mapCard"><span class="rankTag">Experience ${i+1}</span><h4>${ctx.escapeHtml(x.title)}</h4><div><small>내 행동</small><p>${ctx.escapeHtml(x.action||'아직 정리하지 않음')}</p></div><div><small>결과·증거</small><p>${ctx.escapeHtml(x.result||'결과 미입력')}${x.evidence?` · ${ctx.escapeHtml(x.evidence)}`:''}</p></div><div><small>역량 + 근거</small>${(x.competencyEvidence||[]).length?`<ul>${x.competencyEvidence.map(c=>`<li><b>${ctx.escapeHtml(c.keyword||'역량')}</b> · ${ctx.escapeHtml(c.evidence||'근거행동 미입력')}</li>`).join('')}</ul>`:`<p>${(x.competencies||[]).map(c=>ctx.escapeHtml(c)).join(', ')||'아직 추출하지 않음'}</p>`}</div></div>`).join('')}</div>`;
}
function styleBlock(){return `<style>
.experienceCompetencyWeek4 .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.experienceCompetencyWeek4 .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.experienceCompetencyWeek4 .moduleHead h3{margin:0 0 3px}.experienceCompetencyWeek4 .moduleHead p{margin:0;color:var(--muted);font-size:13px}.dnaBridge{border:1px solid var(--line);border-radius:16px;overflow:hidden}.dnaBridgeHead{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;background:#f7f8ff}.dnaBridgeHead span{font-size:12px;color:var(--muted)}.dnaBridgeRow{padding:10px 14px;border-top:1px solid var(--line)}.dnaBridgeRow small{color:var(--muted);font-weight:800}.dnaBridgeRow p{margin:4px 0 0;white-space:pre-wrap}.best3Row{display:grid;grid-template-columns:220px 1fr 1.5fr;gap:9px;align-items:stretch;margin-top:9px}.best3Label{display:flex;align-items:center;padding:10px 12px;background:#fafafa;border:1px solid var(--line);border-radius:12px}.best3Row textarea{min-height:70px}.repChoices{display:flex;flex-wrap:wrap;gap:8px}.repChoices label input{position:absolute;opacity:0}.repChoices label span{display:block;padding:8px 12px;border:1px solid var(--line);border-radius:999px;cursor:pointer}.repChoices label input:checked+span{background:#5b50dd;color:#fff;border-color:#5b50dd}.qualityBox{border:1px solid var(--line);border-radius:14px;padding:10px}.summaryBox{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fafbff}.summaryBox h4{margin:0 0 6px}.experienceMapGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mapCard{border:1px solid var(--line);border-radius:14px;padding:12px}.mapCard h4{margin:8px 0 12px}.mapCard small{color:var(--muted);font-weight:800}.mapCard p{margin:4px 0 10px;line-height:1.55}.mapCard ul{margin:6px 0 0;padding-left:18px}.mapCard li{margin:5px 0}@media(max-width:760px){.best3Row,.experienceMapGrid{grid-template-columns:1fr}.dnaBridgeHead{display:block}.dnaBridgeHead span{display:block;margin-top:4px}}
</style>`}

import {prepareResearchMeasures,renderStrengthMeasure,bindStrengthMeasure} from '../researchMeasures.js?v=2';

const WEEK4_VERSION='experience-competency-week4-v7';
const COMPETENCY_DICTIONARY=[
  ['C01','의사소통','설명·질문·경청·문서작성·정보전달'],
  ['C02','협업','공동작업·정보공유·역할협조·동료지원'],
  ['C03','조정·협상','의견차 조정·갈등대응·합의·이해관계 조율'],
  ['C04','문제해결','문제파악·원인분석·대안탐색·해결 실행'],
  ['C05','분석·수리','자료비교·수치계산·데이터해석·근거기반 판단'],
  ['C06','기획','목표설정·방법설계·절차구성·실행계획 수립'],
  ['C07','업무관리','우선순위·일정·진행상황·자원 관리'],
  ['C08','정보·디지털 활용','정보탐색·선별·SW·디지털도구·AI 활용'],
  ['C09','학습·자기관리','새 지식 습득·피드백 반영·자기점검'],
  ['C10','리더십','방향제시·역할배분·의사결정·구성원 지원'],
  ['C11','고객·사용자 대응','요구파악·문의·불만 대응·서비스 개선'],
  ['C12','책임·직업윤리','규칙 준수·책임 있는 업무처리·윤리적 판단']
].map(([code,label,cues])=>({code,label,cues}));
function competencyByCode(code){return COMPETENCY_DICTIONARY.find(x=>x.code===code)}
function competencyByLabel(label){return COMPETENCY_DICTIONARY.find(x=>x.label===label)}
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
    <div class="callout info"><b>오늘의 흐름</b> · Career DNA 간단히 확인 → My Best 3 Experience → 대표 경험 선택 → AI Experience Interview → 사실확인 → 행동·결과·증거 정리 → 표준 역량 확인 → Experience Map → Competency Map → Experience DNA</div>
    <div class="callout good"><b>4주차의 도착점</b> · 직업을 정하는 시간이 아닙니다. <b>어떤 경험에서 내가 무엇을 했고, 그 행동이 어떤 강점·역량을 보여주는지</b> 근거와 함께 정리합니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>지난주 Career DNA 간단히 확인</h3><p>검사점수를 다시 해석하지 않습니다. 3주차에서 내가 남긴 자기이해 가설만 참고합니다.</p></div></div>
      ${dnaBridgeHtml(dna,ctx)}
      <div class="actions"><button class="btn secondary" id="goBest3">${ctx.courseConfig.researchMeasures?'확인했어요 → 강점행동 9문항':'확인했어요 → 02 경험 떠올리기'}</button></div>
    </div>

    ${ctx.courseConfig.researchMeasures?renderStrengthMeasure(ctx,'pre'):''}

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>My Best 3 Experience</h3><p>강점 이름부터 고르지 말고, 먼저 내가 실제로 행동했던 경험을 떠올립니다.</p></div></div>
      <div class="callout info"><b>3개가 꼭 다 떠오르지 않아도 괜찮습니다.</b> 지금은 1~2개만 적어도 됩니다. 오늘 깊게 분석할 대표 경험 1개는 선택해 주세요.</div>
      ${best3Row('best','내가 꽤 잘했다고 생각하는 경험',best3.best,ctx)}
      ${best3Row('flow','시간 가는 줄 모르고 몰입한 경험',best3.flow,ctx)}
      ${best3Row('recognition','다른 사람에게 인정·감사를 받은 경험',best3.recognition,ctx)}
      <div class="summaryBox" style="margin-top:12px"><h4>오늘 깊게 분석할 대표 경험 1개</h4><p class="help">세 경험 중 하나를 골라 아래 Experience Interview의 시작자료로 가져옵니다.</p><div class="repChoices">${['best','flow','recognition'].map(k=>`<label><input type="radio" name="representative" value="${k}" ${representativeKey===k?'checked':''}><span>${k==='best'?'잘한 경험':k==='flow'?'몰입 경험':'인정받은 경험'}</span></label>`).join('')}</div><div class="actions"><button class="btn outline" id="useRepresentative">선택한 경험을 분석칸으로 가져오기</button></div></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>STAR 기반 AI Experience Interview</h3><p>STAR 문장을 대신 쓰는 단계가 아닙니다. AI가 <b>상황(S) → 문제·내 역할(T) → 내 행동(A) → 판단(WHY) → 결과(R)</b>에서 빠진 내용을 한 질문씩 확인합니다.</p></div></div>
      <div class="callout info"><b>사용 방법</b><br>① 대표 경험을 가져온 뒤 <b>AI 경험 인터뷰 프롬프트 만들기</b>를 누르세요.<br>② 프롬프트를 AI에 붙여넣고, 질문에는 <b>내가 실제로 한 행동만</b> 답하세요. 기억나지 않으면 모른다고 답해도 됩니다.<br>③ 마지막 STAR 정리가 나오면 사실과 다른 부분이 없는지 확인한 뒤 04에서 내 경험카드로 정리하세요.</div>
      <details class="detailsBox savedExperienceBox" ${experiences.length?'':'hidden'}><summary><b>저장된 경험 ${experiences.length}개 보기</b></summary><div id="experienceList" style="margin-top:10px">${listHtml(experiences,ctx)}</div></details>
      <div class="actions"><button class="btn secondary" id="newExp">+ 새 경험 직접 입력</button></div>
      <input type="hidden" id="editId" value=""><input type="hidden" id="contribution" value="3">
      <div class="grid3" style="margin-top:14px">${sel('category','경험 유형','',CATEGORIES,ctx)}${txt('title','경험 이름','','예: 캡스톤 프로젝트',ctx)}${txt('roleTitle','내 역할 한 줄','','예: 자료분석 / 고객응대 / 일정조율',ctx)}</div>
      <div class="grid2" style="margin-top:12px">${area('context','경험 배경','무엇을 하기 위한 경험이었나요? 목적과 상황만 짧게.','',ctx)}${area('role','내 책임 범위','팀 전체가 아니라 내가 맡은 책임과 의사결정 범위는 무엇이었나요?','',ctx)}</div>
      <details class="detailsBox" style="margin-top:12px"><summary>기간·진행 방식은 필요하면 입력 · 선택사항</summary><div class="grid2" style="margin-top:10px">${txt('period','기간','','예: 2026.03–06',ctx)}${sel('workMode','진행 방식','',['개인','팀','조직/부서'],ctx)}</div></details>
      <div class="actions" style="margin-top:12px"><button class="btn secondary" id="makeInterviewPrompt">AI 인터뷰 프롬프트 만들기·복사</button><button class="btn outline hidden" id="copyInterviewPrompt">다시 복사</button></div><div class="promptBox hidden" id="interviewPrompt"></div>
      <div class="summaryBox" style="margin-top:12px"><h4>인터뷰 후 사실확인</h4><p class="help">AI가 정리한 문장을 그대로 저장하지 말고, 아래 항목을 확인한 뒤 경험카드에 반영하세요.</p>
        <div class="qualityBox">
          ${check('interviewOwnership','AI 정리에서 팀 전체의 행동과 내가 직접 한 행동이 구분되어 있다.')}
          ${check('interviewNumbers','AI 정리에 내가 말하지 않은 수치·성과·역할이 추가되지 않았다.')}
          ${check('interviewEvidence','결과·증거가 실제로 확인 가능한 내용이거나, 확인할 수 없는 부분은 ‘확인 필요’로 표시되어 있다.')}
        </div>
        <div class="actions"><button class="btn primary" id="goFactCheck">사실확인 완료 → 04로 이동</button></div>
      </div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>AI가 이해한 내 경험 사실확인</h3><p>03의 마지막 STAR 정리를 기준으로, <b>내가 실제로 한 사실만</b> 경험카드에 남깁니다.</p></div></div>
      <div class="starImportBox">
        <label><b>AI의 마지막 STAR 정리가 있으면 붙여넣기 · 선택</b></label>
        <textarea id="aiStructured" placeholder="AI 인터뷰 마지막에 나온 S / T / A / WHY / R 정리를 붙여넣으세요."></textarea>
        <div class="actions"><button class="btn secondary" id="importStarSummary">STAR 항목으로 불러오기</button></div>
        <span class="hint">자동으로 나눠 넣은 뒤 반드시 실제 경험과 맞는지 직접 수정합니다.</span>
      </div>
      <div class="starHandoff" style="margin-top:12px">
        <div><b>S · 상황</b><span>03의 경험 배경을 확인합니다.</span></div>
        <div><b>T · 문제·역할</b><span>아래 ‘문제·과제’와 위에서 적은 ‘내 책임 범위’로 이어집니다.</span></div>
        <div><b>A · 행동</b><span>아래 ‘내가 직접 한 행동’에 옮깁니다.</span></div>
        <div><b>WHY · 판단</b><span>아래 ‘판단·이유’에 옮깁니다.</span></div>
        <div><b>R · 결과</b><span>아래 ‘결과’와 ‘증거’로 확인합니다.</span></div>
      </div>
      <div class="callout warn" style="margin-top:12px"><b>중요</b> · AI가 정리한 문장을 그대로 복사하지 마세요. 내가 하지 않은 행동, 기억나지 않는 수치, 과장된 결과가 있으면 삭제하거나 수정합니다.</div>
      <div class="grid2" style="margin-top:12px">${area('challenge','T · 문제·과제','내가 해결하거나 달성해야 했던 핵심 과제는?','',ctx)}${area('action','A · 내가 직접 한 행동','내가 실제로 한 행동만 동사 중심으로 적으세요.','',ctx)}${area('reason','WHY · 판단·이유','왜 그 행동을 선택했나요? 핵심 판단기준만 적으세요.','',ctx)}${area('result','R · 결과','행동 뒤 무엇이 달라졌나요? 확인 가능한 결과만 적으세요.','',ctx)}</div>
      <div class="grid2" style="margin-top:12px">${area('evidence','결과를 확인할 근거','수치·산출물·피드백·기록 등 실제 확인 가능한 근거가 있으면 적으세요.','',ctx)}${sel('evidenceType','증거 유형 · 선택','',EVIDENCE_TYPES,ctx)}</div>
      <div class="evidenceGradeLine" id="evidenceGradePreview">증거 유형을 선택하면 확인 수준을 자동으로 표시합니다.</div>
      <details class="detailsBox" style="margin-top:12px"><summary>추가 메모가 필요하면 펼치기 · 선택사항</summary>
        <div class="grid2">${area('rawVoice','내 원래 말 · Raw Voice','AI가 다듬기 전 내가 실제로 말한 문장이나 메모','',ctx)}${area('learning','다른 상황에서도 다시 쓸 수 있는 방식','이 경험에서 반복해서 사용할 수 있는 행동방식이 있다면 적으세요.','',ctx)}</div>
      </details>
      <div class="actions"><button class="btn primary" id="goCompetency">사실확인 완료 → 05 역량 연결</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>05</span><div><h3>경험에서 확인된 역량</h3><p>Jobfit 표준역량 C01~C12 중 <b>실제 행동근거가 있는 역량만</b> 선택합니다. 직책·성격표현만으로 역량을 판정하지 않습니다.</p></div></div>
      <div class="actionSourceBox"><b>역량을 판단할 때 볼 행동</b><p id="actionEvidencePreview">04에서 ‘내가 직접 한 행동’을 입력하면 여기에 표시됩니다.</p></div>
      <div class="grid3" style="margin-top:12px">${competencyRow(1)}${competencyRow(2)}${competencyRow(3)}</div>
      <div class="callout info" style="margin-top:12px"><b>판정 기준</b> · 먼저 04의 행동을 보고 역량을 고릅니다. 근거가 약하면 ‘추가 확인 필요’를 선택하고, 세 칸을 억지로 채우지 않아도 됩니다.</div>
      <details class="detailsBox" style="margin-top:12px"><summary>어떤 역량인지 헷갈리면 C01~C12 행동 기준표 보기</summary><div class="competencyDictionary">${COMPETENCY_DICTIONARY.map(x=>`<div><b>${x.code} · ${x.label}</b><span>${x.cues}</span></div>`).join('')}</div></details>
      <div class="qualityBox" style="margin-top:14px">
        ${check('competencyEvidenceChecked','선택한 역량은 위 행동에서 확인할 수 있고, 없는 역량을 억지로 추가하지 않았다.')}
      </div>
      <div class="actions"><button class="btn primary" id="saveExp">이 경험 저장</button><button class="btn outline" id="clearForm">입력 초기화</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>06</span><div><h3>Experience Map</h3><p>저장한 경험들을 한눈에 보고, 어떤 역량에 실제 근거가 있는지 확인합니다.</p></div></div>
      <div class="experienceReadiness">${experienceReadinessHtml(experiences,ctx)}</div>
      <div id="experienceMapPreview" style="margin-top:12px">${experienceMapHtml(experiences,ctx)}</div>
      <div class="actions"><button class="btn outline" id="analyzeAnother">다른 경험도 분석하기</button><button class="btn secondary" id="goCompetencyMap">07 Competency Map 보기</button></div>
      <div class="callout warn" style="margin-top:12px"><b>다음 연결</b> · 6주차에는 여기에서 만든 강점·역량과 행동근거를 가지고 직무 후보를 탐색하고, 실제 직무의 Task·KSA·KPI와 매칭합니다.</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>07</span><div><h3>Competency Map</h3><p>여러 경험에서 같은 행동이 반복되는지 확인합니다. 경험 횟수는 역량 점수가 아닙니다.</p></div></div>
      ${experiences.length<2?'<div class="callout warn"><b>현재는 반복 패턴을 판단할 단계가 아닙니다.</b> 저장된 경험이 1개라면 ‘이 경험에서 확인된 역량’까지만 보고, 2개 이상부터 반복 여부를 비교하세요.</div>':''}
      <div id="competencyMapPreview" style="margin-top:12px">${competencyMapHtml(experiences,ctx)}</div>
      <div class="actions"><button class="btn secondary" id="goExperienceDna">08 My Experience DNA 보기</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>08</span><div><h3>My Experience DNA</h3><p>내가 생각한 강점과 실제 경험에서 확인된 행동을 구분해 다음 직무탐색 단계로 가져갑니다.</p></div></div>
      ${experienceDnaReadinessHtml(experiences,ctx)}
      <div id="experienceDnaPreview" style="margin-top:12px">${experienceDnaHtml(experiences,dna,ctx)}</div>
      <div class="callout info" style="margin-top:12px"><b>해석 주의</b> · 이 결과는 역량검사 점수나 능력의 높고 낮음을 뜻하지 않습니다. 지금까지 입력한 경험에서 확인된 행동을 정리한 결과입니다.</div>
      <div class="callout warn" style="margin-top:12px"><b>다음 연결</b> · 다음 단계에서는 Career DNA와 Experience DNA를 실제 직무정보·채용공고의 요구역량과 비교합니다.</div>
    </div>

    <div class="actions"><button class="btn primary" id="saveRoadmap">4주차 Experience DNA 저장</button><button class="btn secondary" id="nextStep">STEP 3 직무탐색 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>loadExperience(b.dataset.edit)));
  root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteExperience(b.dataset.delete)));
  document.getElementById('newExp').addEventListener('click',clearForm);
  document.getElementById('clearForm').addEventListener('click',clearForm);
  document.getElementById('saveExp').addEventListener('click',saveExperience);
  document.getElementById('useRepresentative').addEventListener('click',useRepresentative);
  document.getElementById('saveRoadmap').addEventListener('click',()=>saveWeek4(true));
  document.getElementById('nextStep').addEventListener('click',()=>{
    saveWeek4(false);
    const ready=currentExperiences().some(x=>x?.factChecked&&String(x?.action||'').trim());
    if(!ready){ctx.toast('STEP 3로 가기 전에 사실확인을 마친 경험을 1개 이상 저장해 주세요.');openModule(currentExperiences().length?'05':'03');return}
    ctx.navigate(3);
  });
  document.getElementById('goBest3')?.addEventListener('click',()=>{
    const measure=document.querySelector('.experienceCompetencyWeek4 > .strengthMeasurePanel');
    if(measure)window.JobfitStepAccordion?.openBlock?.(measure);else openModule('02');
  });
  document.getElementById('makeInterviewPrompt').addEventListener('click',async()=>{
    saveDraft();
    const box=document.getElementById('interviewPrompt');
    box.textContent=makeExperiencePrompt();
    box.classList.remove('hidden');
    document.getElementById('copyInterviewPrompt').classList.remove('hidden');
    try{await navigator.clipboard.writeText(box.textContent||'');ctx.toast('AI 인터뷰 프롬프트를 만들고 복사했습니다.')}
    catch{ctx.toast('프롬프트를 만들었습니다. 아래 ‘다시 복사’를 눌러 복사해 주세요.')}
  });
  document.getElementById('copyInterviewPrompt').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(document.getElementById('interviewPrompt').textContent||'');ctx.toast('경험 인터뷰 프롬프트를 복사했습니다.')}
    catch{ctx.toast('직접 선택해 복사해 주세요.')}
  });
  document.getElementById('goFactCheck')?.addEventListener('click',()=>{
    if(!ck('interviewOwnership')||!ck('interviewNumbers')||!ck('interviewEvidence')){ctx.toast('세 가지 사실확인을 먼저 체크해 주세요.');return}
    saveDraft();openModule('04');
  });
  document.getElementById('importStarSummary')?.addEventListener('click',importStarSummary);
  document.getElementById('goCompetency')?.addEventListener('click',()=>{if(!v('action')){ctx.toast('내가 직접 한 행동을 먼저 확인해 주세요.');return}saveDraft();openModule('05')});
  document.getElementById('analyzeAnother')?.addEventListener('click',()=>openModule('02'));
  document.getElementById('goCompetencyMap')?.addEventListener('click',()=>openModule('07'));
  document.getElementById('goExperienceDna')?.addEventListener('click',()=>openModule('08'));
    document.getElementById('action')?.addEventListener('input',updateActionEvidencePreview);
  document.getElementById('evidenceType')?.addEventListener('change',updateEvidenceGradePreview);
  [1,2,3].forEach(i=>document.getElementById(`comp_${i}`)?.addEventListener('change',()=>updateCompetencyCue(i)));
  restoreDraft();
  updateActionEvidencePreview();updateEvidenceGradePreview();[1,2,3].forEach(updateCompetencyCue);
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
    const current=ctx.getState().assessments?.experienceCompetency||{};
    const patch={...current,version:WEEK4_VERSION,best3:collectBest3(),representativeKey:selectedRepresentative(),experiences:exp,updatedAt:new Date().toISOString()};
    ctx.saveState({assessments:{experienceCompetency:patch},artifacts:{experienceMap:experienceMap(exp),competencyMap:competencyMap(exp),experienceDNA:experienceDNA(exp,dna)}});
    if(showToast){
      document.getElementById('status').textContent='4주차 Experience DNA가 이 브라우저에 저장되었습니다.';
      ctx.toast('4주차 Experience DNA를 저장했습니다.');
    }
  }
  async function saveExperience(){
    const title=v('title');if(!title){ctx.toast('경험 이름을 먼저 입력해 주세요.');openModule('03');return}
    if(!v('action')){ctx.toast('04에서 내가 직접 한 행동을 먼저 확인해 주세요.');openModule('04');return}
    const confirmedRows=[1,2,3].filter(i=>v(`compStatus_${i}`)==='행동 확인');
    if(confirmedRows.some(i=>!v(`comp_${i}`)||!v(`compEv_${i}`))){ctx.toast('‘행동 확인’으로 판정한 역량은 역량명과 근거 행동을 함께 적어 주세요.');openModule('05');return}
    if(confirmedRows.length&&!ck('competencyEvidenceChecked')){ctx.toast('선택한 역량과 행동근거를 확인했다는 체크를 해 주세요.');openModule('05');return}
    saveWeek4(false);
    const oldId=v('editId');
    const studentVerified=ck('competencyEvidenceChecked');
    const competencyEvidence=[1,2,3].map(i=>{const code=v(`comp_${i}`),def=competencyByCode(code);return {code,label:def?.label||'',keyword:def?.label||'',evidence:v(`compEv_${i}`),status:v(`compStatus_${i}`),studentVerified};}).filter(x=>x.code||x.evidence);
    const competencies=[...new Set(competencyEvidence.filter(x=>x.status==='행동 확인'&&x.studentVerified).map(x=>x.label).filter(Boolean))];
    const quality={ownership:ck('interviewOwnership'),evidence:ck('interviewEvidence'),noFabrication:ck('interviewNumbers'),transfer:!!v('learning'),competencyEvidence:studentVerified,interviewOwnership:ck('interviewOwnership'),interviewNumbers:ck('interviewNumbers'),interviewEvidence:ck('interviewEvidence')};
    const evidenceType=v('evidenceType');
    const item={id:oldId||`EXP-${Date.now()}`,category:v('category'),title,period:v('period'),workMode:v('workMode'),contribution:n('contribution'),roleTitle:v('roleTitle'),context:v('context'),role:v('role'),challenge:v('challenge'),action:v('action'),reason:v('reason'),result:v('result'),evidence:v('evidence'),evidenceType,evidenceGrade:evidenceGradeFor(evidenceType),actionVerbs:'',learning:v('learning'),rawVoice:v('rawVoice'),aiStructured:v('aiStructured'),competencies,competencyEvidence,quality,factChecked:quality.interviewOwnership&&quality.interviewNumbers&&quality.interviewEvidence,updatedAt:new Date().toISOString()};
    const arr=[...currentExperiences()];const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]=item;else arr.push(item);
    const current=ctx.getState().assessments?.experienceCompetency||{};
    ctx.saveState({assessments:{experienceCompetency:{...current,version:WEEK4_VERSION,best3:collectBest3(),representativeKey:selectedRepresentative(),experiences:arr,draft:{},updatedAt:new Date().toISOString()}},artifacts:{experienceMap:experienceMap(arr),competencyMap:competencyMap(arr),experienceDNA:experienceDNA(arr,dna)}});
    await ctx.navigate(2);
    openModule('06');
    ctx.toast(`경험을 저장했습니다. 현재 ${arr.length}개 경험이 Experience Map에 있습니다.`);
  }
  function loadExperience(id){
    const x=currentExperiences().find(e=>e.id===id);if(!x)return;
    set('editId',x.id);
    ['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','learning','rawVoice','aiStructured'].forEach(k=>set(k,x[k]||''));
    set('contribution',x.contribution||3);
    [1,2,3].forEach((i,idx)=>{const ce=x.competencyEvidence?.[idx]||{},def=competencyByCode(ce.code)||competencyByLabel(ce.label||ce.keyword);set(`comp_${i}`,ce.code||def?.code||'');set(`compEv_${i}`,ce.evidence||'');set(`compStatus_${i}`,ce.status||'')});
    const verified=document.getElementById('competencyEvidenceChecked');if(verified)verified.checked=!!(x.quality?.competencyEvidence||(x.competencyEvidence?.length&&x.competencyEvidence.every(e=>e.studentVerified)));
    [['interviewOwnership','interviewOwnership'],['interviewNumbers','interviewNumbers'],['interviewEvidence','interviewEvidence']].forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=!!x.quality?.[key]});
    updateActionEvidencePreview();updateEvidenceGradePreview();[1,2,3].forEach(updateCompetencyCue);
    window.JobfitStepAccordion?.openBlock?.(document.getElementById('title')?.closest('.block'));
    document.getElementById('title').focus();
  }
  function deleteExperience(id){
    if(!confirm('이 경험을 삭제할까요?'))return;
    saveWeek4(false);
    const arr=currentExperiences().filter(x=>x.id!==id);
    const current=ctx.getState().assessments?.experienceCompetency||{};
    ctx.saveState({assessments:{experienceCompetency:{...current,experiences:arr,updatedAt:new Date().toISOString()}},artifacts:{experienceMap:experienceMap(arr),competencyMap:competencyMap(arr),experienceDNA:experienceDNA(arr,dna)}});
    ctx.toast('삭제했습니다.');ctx.navigate(2);
  }
  function clearForm(){
    ['editId','category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','learning','rawVoice','aiStructured','comp_1','compEv_1','compStatus_1','compStatus_2','compStatus_3','comp_2','compEv_2','comp_3','compEv_3'].forEach(k=>set(k,''));
    set('contribution',3);
    ['interviewOwnership','interviewNumbers','interviewEvidence','competencyEvidenceChecked'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false});
    updateActionEvidencePreview();updateEvidenceGradePreview();[1,2,3].forEach(updateCompetencyCue);
    clearDraft();
    document.getElementById('title')?.focus();
  }
  function useRepresentative(){
    const key=selectedRepresentative();if(!key){ctx.toast('대표 경험을 먼저 선택해 주세요.');return}
    const title=v(`best3_${key}_title`),summary=v(`best3_${key}_summary`);
    if(!title&&!summary){ctx.toast('선택한 경험의 제목이나 설명을 먼저 적어 주세요.');return}
    saveWeek4(false);
    if(!v('title'))set('title',title);if(!v('context'))set('context',summary);
    const target=document.getElementById('title');window.JobfitStepAccordion?.openBlock?.(target?.closest('.block'));
    target?.scrollIntoView({behavior:'smooth',block:'center'});target?.focus();
    ctx.toast('대표 경험을 분석칸에 가져왔습니다.');
  }
  function makeExperiencePrompt(){
    const h=dna.hypothesis||{},c=dna.comparison||{},dnaLines=[
      h.text&&`Career DNA 가설: ${h.text}`,
      c.repeat&&`반복해서 나타난다고 본 부분: ${c.repeat}`,
      c.verify&&`더 확인하고 싶은 부분: ${c.verify}`
    ].filter(Boolean);
    return `지금부터 내 경험에서 실제 행동의 근거를 찾는 Jobfit Experience Interviewer가 되어줘. 자소서를 대신 쓰거나 직업·역량을 먼저 추천하지 말고, 내가 실제로 한 일을 STAR 방식으로 구체적으로 확인해줘.

[대표 경험 기본정보]
경험명: ${v('title')||'미입력'}
유형: ${v('category')||'미입력'}
기간: ${v('period')||'미입력'}
진행방식: ${v('workMode')||'미입력'}
내 역할: ${v('roleTitle')||'미입력'}
배경: ${v('context')||'미입력'}
책임범위: ${v('role')||'미입력'}${dnaLines.length?`\n\n[3주차 자기이해 가설 · 참고만]\n${dnaLines.join('\n')}`:''}

[STAR + WHY 확인 기준]
S · Situation: 어떤 상황이었는가
T · Task: 해결해야 했던 문제·목표와 내 역할은 무엇이었는가
A · Action: 내가 직접 무엇을 했는가
WHY · Judgment: 왜 그 방법을 선택했는가
R · Result: 그 행동 뒤 무엇이 달라졌는가

[인터뷰 규칙]
1. 한 번에 질문은 반드시 하나만 한다.
2. 학생에게 질문할 때는 S/T/A/R 같은 기호를 붙이지 않는다. STAR는 내부 질문 구조로만 사용한다.
3. 질문은 가능하면 한 문장, 길어도 두 문장 이내로 짧게 한다.
4. 먼저 현재 입력내용을 읽고 S/T/A/WHY/R 중 이미 확인된 내용과 빠진 내용을 구분한다.
5. 이미 말한 내용은 다시 묻지 않는다. STAR 순서를 기계적으로 처음부터 반복하지 않는다.
6. 가장 부족한 정보 하나만 다음 질문으로 묻는다.
7. 특히 A(Action)를 가장 중요하게 확인한다. 팀 전체의 행동과 내가 직접 한 행동을 반드시 분리한다.
8. '소통했다, 협업했다, 노력했다, 해결했다, 책임감 있게 했다, 리더십을 발휘했다'처럼 추상적인 표현이 나오면 역량으로 해석하지 말고 '그때 본인이 직접 한 행동은 무엇이었나요?'처럼 행동을 묻는다.
9. 판단이 모호하면 판단기준만 묻고, 결과가 모호하면 변화만 먼저 묻는다. 한 질문에서 이유·결과·증거를 동시에 묻지 않는다.
10. 예시는 학생이 '잘 모르겠다'고 하거나 두 번 연속 추상적으로 답했을 때만 짧게 제시한다. 처음부터 선택지를 나열해 답을 유도하지 않는다.
11. 결과에 숫자가 반드시 필요한 것은 아니다. 수치가 없으면 전후 변화, 완료 여부, 타인의 반응, 피드백, 작업기록처럼 실제 확인 가능한 결과를 찾는다.
12. 사용자가 '잘 모르겠다'고 하면 예시 답을 대신 만들지 말고 기억을 돕는 사실 질문 하나만 한다.
13. 내가 말하지 않은 행동·역할·수치·성과를 만들거나 보완하지 않는다.
14. 보통 2~4회 질문으로 핵심을 확인하되, 부족한 정보가 있으면 최대 5회까지 질문한다.
15. S/T/A/R이 충분히 확인되면 5회를 채우지 않고 종료한다. 결과를 확인할 수 없는 경우에는 '결과 확인 어려움' 자체를 사실로 기록하고 종료할 수 있다.
16. 5회 질문 후에도 부족한 정보는 추측하지 말고 '확인 필요'로 표시한다.
17. 이 인터뷰 단계에서는 강점·역량 이름을 확정하지 않는다. 먼저 사실을 정리하고 학생이 확인한 뒤 다음 단계에서 행동근거와 역량을 연결한다.

[인터뷰 종료 기준]
- S: 경험의 맥락을 이해할 수 있다.
- T: 해결해야 했던 문제·목표와 내 역할이 구분된다.
- A: 내가 직접 한 구체적인 행동이 최소 1개 이상 확인된다.
- R: 행동 이후 확인 가능한 결과·변화가 있거나, 결과 확인이 어렵다는 사실이 확인된다.
위 네 요소가 충족되면 인터뷰를 종료한다.

[마지막 정리 형식]
- S 상황
- T 문제·목표와 내 역할
- A 내가 직접 한 행동 1~5개(확인된 행동만)
- WHY 판단·선택 이유
- R 결과
- 확인 가능한 증거
- 핵심 행동동사
- 확인 필요 사항

마지막 정리는 내가 말한 사실만 사용한다. 행동 개수를 맞추려고 내용을 늘리지 않는다. 추정이 섞일 수 있는 문장은 반드시 '확인 필요'로 표시한다.
정리 후에는 '이 내용이 실제 경험과 맞나요? 틀리거나 과장된 부분이 있으면 수정해 주세요.'라고 묻는다.

첫 질문부터 시작해줘.`;
  }
  function draftSnapshot(){
    const fields=['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','learning','rawVoice','aiStructured'];
    const values={};fields.forEach(id=>values[id]=v(id));
    values.contribution=n('contribution')||3;
    values.interviewChecks={ownership:ck('interviewOwnership'),numbers:ck('interviewNumbers'),evidence:ck('interviewEvidence')};
    values.competencyEvidenceChecked=ck('competencyEvidenceChecked');
    values.competencies=[1,2,3].map(i=>({code:v(`comp_${i}`),status:v(`compStatus_${i}`),evidence:v(`compEv_${i}`)}));
    return values;
  }
  function saveDraft(){
    const state=ctx.getState(),current=state.assessments?.experienceCompetency||{};
    ctx.saveState({assessments:{experienceCompetency:{...current,version:WEEK4_VERSION,best3:collectBest3(),representativeKey:selectedRepresentative(),experiences:currentExperiences(),draft:draftSnapshot(),updatedAt:new Date().toISOString()}}});
  }
  function clearDraft(){
    const state=ctx.getState(),current=state.assessments?.experienceCompetency||{};
    if(!current.draft||!Object.keys(current.draft).length)return;
    ctx.saveState({assessments:{experienceCompetency:{...current,draft:{},updatedAt:new Date().toISOString()}}});
  }
  function restoreDraft(){
    const d=ctx.getState().assessments?.experienceCompetency?.draft||{};
    if(!d||!Object.keys(d).length)return;
    ['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','learning','rawVoice','aiStructured'].forEach(id=>{if(d[id]!==undefined&&d[id]!==null)set(id,d[id])});
    set('contribution',d.contribution||3);
    const checks=d.interviewChecks||{};
    const own=document.getElementById('interviewOwnership'),nums=document.getElementById('interviewNumbers'),ev=document.getElementById('interviewEvidence'),verified=document.getElementById('competencyEvidenceChecked');
    if(own)own.checked=!!checks.ownership;if(nums)nums.checked=!!checks.numbers;if(ev)ev.checked=!!checks.evidence;if(verified)verified.checked=!!d.competencyEvidenceChecked;
    (d.competencies||[]).slice(0,3).forEach((x,idx)=>{const i=idx+1;set(`comp_${i}`,x?.code||'');set(`compStatus_${i}`,x?.status||'');set(`compEv_${i}`,x?.evidence||'')});
  }
    function openModule(number){
    const block=[...document.querySelectorAll('.experienceCompetencyWeek4 > .block')].find(b=>b.querySelector(':scope > .moduleHead > span')?.textContent?.trim()===number);
    if(block)window.JobfitStepAccordion?.openBlock?.(block);
  }
  function importStarSummary(){
    const raw=v('aiStructured');if(!raw){ctx.toast('AI의 마지막 STAR 정리를 먼저 붙여넣어 주세요.');return}
    const parsed=parseStarSummary(raw);
    if(parsed.task)set('challenge',parsed.task);
    if(parsed.action)set('action',parsed.action);
    if(parsed.why)set('reason',parsed.why);
    if(parsed.result)set('result',parsed.result);
    if(parsed.evidence)set('evidence',parsed.evidence);
    updateActionEvidencePreview();
    const filled=[parsed.task,parsed.action,parsed.why,parsed.result,parsed.evidence].filter(Boolean).length;
    saveDraft();
    ctx.toast(filled?`STAR 정리에서 ${filled}개 항목을 불러왔습니다. 실제 경험과 맞는지 수정해 주세요.`:'STAR 제목을 찾지 못했습니다. 아래 칸에 직접 정리해 주세요.');
  }
  function parseStarSummary(raw){
    const aliases=[
      ['task',/^(?:[-*•]\s*)?(?:T\s*[·.:)-]?\s*)?(?:문제·목표와 내 역할|문제·목표|문제|과제|Task)/i],
      ['action',/^(?:[-*•]\s*)?(?:A\s*[·.:)-]?\s*)?(?:내가 직접 한 행동|행동|Action)/i],
      ['why',/^(?:[-*•]\s*)?(?:WHY\s*[·.:)-]?\s*)?(?:판단·선택 이유|판단|이유|Judgment)/i],
      ['result',/^(?:[-*•]\s*)?(?:R\s*[·.:)-]?\s*)?(?:결과|Result)/i],
      ['evidence',/^(?:[-*•]\s*)?(?:확인 가능한 증거|증거|Evidence)/i],
      ['stop',/^(?:[-*•]\s*)?(?:핵심 행동동사|확인 필요 사항)/i]
    ];
    const out={task:'',action:'',why:'',result:'',evidence:''};let current='';
    for(const original of String(raw).split(/\r?\n/)){
      const line=original.trim();if(!line)continue;
      const hit=aliases.find(([,re])=>re.test(line));
      if(hit){
        current=hit[0]==='stop'?'':hit[0];
        if(current){
          const cleaned=line.replace(hit[1],'').replace(/^\s*[:：·.-]?\s*/,'').trim();
          if(cleaned)out[current]=(out[current]?out[current]+'\n':'')+cleaned;
        }
        continue;
      }
      if(current)out[current]=(out[current]?out[current]+'\n':'')+line.replace(/^[-*•]\s*/,'');
    }
    return out;
  }
    function evidenceGradeFor(type){
    if(['수치·지표','산출물·문서','수상·선발·평가결과','작업기록·로그'].includes(type))return 'A · 객관적 자료로 확인 가능';
    if(['교수·상사·고객 피드백','동료·팀 피드백'].includes(type))return 'B · 타인의 피드백/평가로 확인';
    if(type==='자기기억만')return 'C · 본인 설명 중심';
    return '';
  }
  function updateEvidenceGradePreview(){const el=document.getElementById('evidenceGradePreview');if(!el)return;const grade=evidenceGradeFor(v('evidenceType'));el.textContent=grade?`확인 수준 · ${grade}`:'증거 유형을 선택하면 확인 수준을 자동으로 표시합니다.'}
  function updateActionEvidencePreview(){const el=document.getElementById('actionEvidencePreview');if(!el)return;el.textContent=v('action')||'04에서 ‘내가 직접 한 행동’을 입력하면 여기에 표시됩니다.'}
  function updateCompetencyCue(i){const code=v(`comp_${i}`),def=competencyByCode(code),el=document.getElementById(`compCue_${i}`);if(el)el.textContent=def?`확인할 행동 예: ${def.cues}`:'역량을 선택하면 확인할 행동 예시가 표시됩니다.'}
    function v(id){return document.getElementById(id)?.value?.trim?.()||''}
  function n(id){return Number(document.getElementById(id)?.value||0)}
  function ck(id){return !!document.getElementById(id)?.checked}
  function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
}

function normalizeBest3(x){return{best:{title:x?.best?.title||'',summary:x?.best?.summary||''},flow:{title:x?.flow?.title||'',summary:x?.flow?.summary||''},recognition:{title:x?.recognition?.title||'',summary:x?.recognition?.summary||''}}}
function experienceMap(arr){return arr.map(x=>({id:x.id,title:x.title,category:x.category,roleTitle:x.roleTitle,action:x.action,actionVerbs:x.actionVerbs,result:x.result,evidence:x.evidence,evidenceGrade:x.evidenceGrade,competencies:x.competencies,competencyEvidence:x.competencyEvidence,learning:x.learning,factChecked:x.factChecked}))}
function competencyMap(arr){
  const map={};
  (arr||[]).forEach(x=>{
    const seen=new Set();
    (x.competencyEvidence||[]).forEach(e=>{
      if(e.status&&e.status!=='행동 확인')return;
      const k=(e.label||e.keyword||'').trim(); if(!k||seen.has(k))return; seen.add(k);
      if(!map[k])map[k]={keyword:k,experienceIds:[],experienceTitles:[],evidence:[]};
      map[k].experienceIds.push(x.id); map[k].experienceTitles.push(x.title);
      if(e.evidence)map[k].evidence.push({experienceId:x.id,text:e.evidence});
    });
    (x.competencies||[]).forEach(raw=>{
      const k=(raw||'').trim(); if(!k||seen.has(k))return; seen.add(k);
      if(!map[k])map[k]={keyword:k,experienceIds:[],experienceTitles:[],evidence:[]};
      map[k].experienceIds.push(x.id); map[k].experienceTitles.push(x.title);
    });
  });
  return Object.values(map).sort((a,b)=>b.experienceIds.length-a.experienceIds.length||a.keyword.localeCompare(b.keyword,'ko'));
}
function experienceDNA(arr,dna){
  const cm=competencyMap(arr);
  return {
    representativeExperiences:(arr||[]).slice(0,3).map(x=>({id:x.id,title:x.title,category:x.category})),
    repeatedCompetencies:cm.filter(x=>x.experienceIds.length>=2),
    observedCompetencies:cm,
    careerDnaHypothesis:dna?.hypothesis?.text||'',
    interpretationRule:'경험 횟수는 역량 수준 점수가 아니라 현재 입력한 경험에서 관련 행동이 확인된 빈도입니다.',
    updatedAt:new Date().toISOString()
  };
}
function experienceReadinessHtml(items,ctx){
  const n=items.length;
  if(n===0)return '<div class="callout warn"><b>아직 저장한 경험이 없습니다.</b> 03~05에서 대표 경험 1개를 먼저 분석해 저장하세요.</div>';
  if(n===1)return '<div class="callout info"><b>경험 1개 저장 · 기본 활동 완료</b><br>이 경험에서 행동근거를 확인할 수 있습니다. 반복되는 역량을 비교하려면 경험을 1개 이상 더 분석하는 것을 권장합니다.</div>';
  if(n===2)return '<div class="callout good"><b>경험 2개 저장 · 비교 가능</b><br>이제 두 경험에서 같은 행동·역량이 반복되는지 비교할 수 있습니다.</div>';
  return `<div class="callout good"><b>경험 ${n}개 저장 · 반복 패턴 확인 가능</b><br>여러 경험에서 반복되는 행동과 역량을 07에서 확인하세요.</div>`;
}
function experienceDnaReadinessHtml(items,ctx){
  const n=items.length;
  if(n===0)return '<div class="callout warn"><b>Experience DNA를 만들 근거가 없습니다.</b> 먼저 경험을 저장하세요.</div>';
  if(n===1)return '<div class="callout warn"><b>초기 Experience DNA</b> · 경험 1개 결과입니다. 이 경험에서 확인된 행동만 해석하고, ‘나의 반복 역량’으로 일반화하지 마세요.</div>';
  if(n===2)return '<div class="callout info"><b>비교 단계</b> · 경험 2개를 비교할 수 있습니다. 같은 행동이 두 경험에서 반복되는지 확인하세요.</div>';
  return '<div class="callout good"><b>반복 패턴 확인 단계</b> · 3개 이상의 경험이 있습니다. 반복해서 나타나는 행동은 다음 직무탐색에서 검증할 근거로 가져갈 수 있습니다.</div>';
}
function competencyMapHtml(items,ctx){
  const rows=competencyMap(items);
  if(!rows.length)return '<div class="placeholder"><b>아직 확인된 역량이 없습니다.</b> 경험을 저장하고 각 역량의 근거 행동을 확인해 주세요.</div>';
  return `<div class="experienceMapGrid">${rows.map(x=>`<div class="mapCard"><div class="listHead"><h4>${ctx.escapeHtml(x.keyword)}</h4><span class="scoreChip">${x.experienceIds.length>=2?'반복 확인':'추가 경험 필요'}</span></div><p><b>${x.experienceIds.length}개 경험</b>에서 관련 행동 확인</p><div class="pillRow">${x.experienceTitles.map(t=>`<span class="pill">${ctx.escapeHtml(t)}</span>`).join('')}</div>${x.evidence.length?`<div style="margin-top:10px"><small>근거 행동</small><ul>${x.evidence.slice(0,3).map(e=>`<li>${ctx.escapeHtml(e.text)}</li>`).join('')}</ul></div>`:''}</div>`).join('')}</div>`;
}
function experienceDnaHtml(items,dna,ctx){
  const result=experienceDNA(items,dna);
  if(!items.length)return '<div class="placeholder"><b>Experience DNA를 만들 경험이 없습니다.</b> 먼저 경험을 2개 이상 저장해 주세요.</div>';
  const repeated=result.repeatedCompetencies;
  const hypothesis=result.careerDnaHypothesis;
  return `<div class="summaryBox"><h4>대표 경험</h4><div class="pillRow">${result.representativeExperiences.map(x=>`<span class="pill">${ctx.escapeHtml(x.title)}</span>`).join('')}</div></div>
    <div class="summaryBox" style="margin-top:10px"><h4>반복해서 확인된 역량</h4>${repeated.length?repeated.map(x=>`<p><b>${ctx.escapeHtml(x.keyword)}</b> · ${x.experienceIds.length}개 경험에서 관련 행동 확인</p>`).join(''):'<p class="help">아직 두 개 이상의 경험에서 반복 확인된 역량이 없습니다. 경험을 추가하면 비교할 수 있습니다.</p>'}</div>
    <div class="summaryBox" style="margin-top:10px"><h4>3주차 Career DNA와 비교</h4><p class="help">${hypothesis?ctx.escapeHtml(hypothesis):'저장된 Career DNA 가설이 없습니다.'}</p><p>Career DNA는 자기이해 가설이고, Experience DNA는 현재 입력한 경험에서 확인한 행동 근거입니다. 두 결과가 다르면 어느 한쪽을 틀렸다고 판단하지 말고 추가 경험에서 확인합니다.</p></div>`;
}
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
function competencyRow(i){return `<div class="metricCard compactCompetency"><b>역량 후보 ${i}</b><div class="field"><label>Jobfit 표준역량</label><select id="comp_${i}"><option value="">선택하지 않아도 됨</option>${COMPETENCY_DICTIONARY.map(x=>`<option value="${x.code}">${x.code} · ${x.label}</option>`).join('')}</select><span class="hint" id="compCue_${i}">역량을 선택하면 확인할 행동 예시가 표시됩니다.</span></div><div class="field" style="margin-top:8px"><label>판정</label><select id="compStatus_${i}"><option value="">판정 선택</option><option>행동 확인</option><option>추가 확인 필요</option><option>현재 경험에서 확인되지 않음</option></select></div><div class="field" style="margin-top:8px"><label>근거 행동 한 줄</label><input class="input" id="compEv_${i}" placeholder="04의 실제 행동 중 근거가 되는 부분"></div></div>`}
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
  return `<div class="experienceMapGrid">${items.map((x,i)=>{const ce=x.competencyEvidence||[],confirmed=ce.filter(c=>c.status==='행동 확인'&&c.studentVerified),pending=ce.filter(c=>c.status!=='행동 확인'||!c.studentVerified);return `<div class="mapCard"><span class="rankTag">Experience ${i+1}</span><h4>${ctx.escapeHtml(x.title)}</h4><div><small>내 행동</small><p>${ctx.escapeHtml(x.action||'아직 정리하지 않음')}</p></div><div><small>결과·증거</small><p>${ctx.escapeHtml(x.result||'결과 미입력')}${x.evidence?` · ${ctx.escapeHtml(x.evidence)}`:''}</p></div><div><small>확인된 역량 + 근거</small>${confirmed.length?`<ul>${confirmed.map(c=>`<li><b>${ctx.escapeHtml(c.keyword||'역량')}</b> · ${ctx.escapeHtml(c.evidence||'근거행동 미입력')}</li>`).join('')}</ul>`:'<p>아직 행동근거로 확정한 역량이 없습니다.</p>'}${pending.length?`<details class="detailsBox" style="margin-top:8px"><summary>추가 확인 중인 역량 ${pending.length}개</summary><ul>${pending.map(c=>`<li><b>${ctx.escapeHtml(c.keyword||'역량')}</b> · ${ctx.escapeHtml(c.status||'판정 필요')}</li>`).join('')}</ul></details>`:''}</div></div>`}).join('')}</div>`;
}
function styleBlock(){return `<style>
.experienceCompetencyWeek4 .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.experienceCompetencyWeek4 .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.experienceCompetencyWeek4 .moduleHead h3{margin:0 0 3px}.experienceCompetencyWeek4 .moduleHead p{margin:0;color:var(--muted);font-size:13px}.dnaBridge{border:1px solid var(--line);border-radius:16px;overflow:hidden}.dnaBridgeHead{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;background:#f7f8ff}.dnaBridgeHead span{font-size:12px;color:var(--muted)}.dnaBridgeRow{padding:10px 14px;border-top:1px solid var(--line)}.dnaBridgeRow small{color:var(--muted);font-weight:800}.dnaBridgeRow p{margin:4px 0 0;white-space:pre-wrap}.best3Row{display:grid;grid-template-columns:220px 1fr 1.5fr;gap:9px;align-items:stretch;margin-top:9px}.best3Label{display:flex;align-items:center;padding:10px 12px;background:#fafafa;border:1px solid var(--line);border-radius:12px}.best3Row textarea{min-height:70px}.repChoices{display:flex;flex-wrap:wrap;gap:8px}.repChoices label input{position:absolute;opacity:0}.repChoices label span{display:block;padding:8px 12px;border:1px solid var(--line);border-radius:999px;cursor:pointer}.repChoices label input:checked+span{background:#5b50dd;color:#fff;border-color:#5b50dd}.qualityBox{border:1px solid var(--line);border-radius:14px;padding:10px}.evidenceGradeLine{margin-top:8px;font-size:12px;color:var(--muted);font-weight:750}.actionSourceBox{border:1px solid #dbe4ff;background:#f7f9ff;border-radius:14px;padding:12px}.actionSourceBox b{display:block;margin-bottom:5px}.actionSourceBox p{margin:0;white-space:pre-wrap;line-height:1.55;color:#41547f}.compactCompetency .field{gap:5px}.starImportBox{border:1px solid #dbe4ff;background:#f8faff;border-radius:14px;padding:12px}.starImportBox textarea{margin-top:8px;min-height:120px}.competencyDictionary{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.competencyDictionary>div{border:1px solid var(--line);border-radius:10px;padding:9px;background:#fff}.competencyDictionary b{display:block;font-size:12px;margin-bottom:3px}.competencyDictionary span{font-size:11px;color:var(--muted);line-height:1.45}.starHandoff{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.starHandoff>div{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fafbff}.starHandoff b{display:block;margin-bottom:4px}.starHandoff span{display:block;font-size:12px;line-height:1.45;color:var(--muted)}.summaryBox{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fafbff}.summaryBox h4{margin:0 0 6px}.experienceMapGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mapCard{border:1px solid var(--line);border-radius:14px;padding:12px}.mapCard h4{margin:8px 0 12px}.mapCard small{color:var(--muted);font-weight:800}.mapCard p{margin:4px 0 10px;line-height:1.55}.mapCard ul{margin:6px 0 0;padding-left:18px}.mapCard li{margin:5px 0}@media(max-width:760px){.best3Row,.experienceMapGrid,.starHandoff,.competencyDictionary{grid-template-columns:1fr}.dnaBridgeHead{display:block}.dnaBridgeHead span{display:block;margin-top:4px}}
</style>`}

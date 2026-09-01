export async function render(ctx){
  const s=ctx.getState(),p=s.profile||{},b=s.baseline||{},c=ctx.courseConfig;
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 0</div><h2>Career Start</h2><p>Jobfit에서 사용할 나의 시작점과 학습 데이터를 만듭니다.</p></div><span class="badge">1주차</span></div>
    <div class="progress"><span style="width:7%"></span></div>

    <div class="block"><h3>1. 이용 방식</h3><p class="help">전체 로드맵은 자기이해부터 Job Portfolio까지 모두 수행하고, 선택형은 필요한 도구만 이용합니다.</p><div class="modeGrid"><div class="modeCard ${s.mode==='full'?'on':''}" data-mode="full"><b>전체 Career Roadmap</b><span>STEP 0–13 전체 과정을 누적합니다.</span></div><div class="modeCard ${s.mode==='selective'?'on':''}" data-mode="selective"><b>선택형 Career Tools</b><span>지금 필요한 검사·직무·지원서·면접 도구만 사용합니다.</span></div></div>${c.lockMode?`<div class="callout info">이 수업에서는 교수자 설정에 따라 <b>${s.mode==='full'?'전체 Career Roadmap':'선택형 Career Tools'}</b>으로 고정되어 있습니다.</div>`:''}</div>

    <div class="hr"></div><div class="block"><h3>2. 수업 연결 · 익명코드</h3><div class="grid2"><div class="field"><label>수업코드 <span class="muted">(선택)</span></label><input class="input" id="courseCode" value="${ctx.escapeHtml(p.courseCode||'')}" placeholder="교수자에게 받은 코드"></div><div class="field"><label>학교/기관 <span class="muted">(선택)</span></label><input class="input" id="institution" value="${ctx.escapeHtml(p.institution||'')}" placeholder="예: ○○대학교"></div></div><div class="codeBox" style="margin-top:12px"><div><div class="muted" style="font-size:11px;font-weight:800">MY JOBFIT CODE</div><div class="anonCode" id="anonCode">${ctx.escapeHtml(p.anonCode||'아직 생성되지 않음')}</div></div><button class="btn outline" id="makeCodeBtn">${p.anonCode?'새 코드 발급':'익명코드 생성'}</button></div><div class="callout warn">익명코드는 로그인 대신 데이터를 구분하기 위한 코드입니다. 현재 개발버전은 이 브라우저에 저장되므로 브라우저 데이터 삭제 시 복구되지 않을 수 있습니다.</div></div>

    <div class="hr"></div><div class="block"><h3>3. 기본 프로필</h3><p class="help">진로분석에 필요한 최소 배경정보입니다. 이름·학번·전화번호·정확한 생년월일은 입력하지 않습니다.</p><div class="grid3">
      ${num('age','나이',p.age,'예: 22')}
      ${sel('gender','성별',p.gender,['','여성','남성','기타','응답하지 않음'])}
      ${sel('grade','학년',p.grade,['','1학년','2학년','3학년','4학년','5학년 이상','졸업·수료'])}
      ${txt('major','학과',p.major,'예: 경영학과')}
      ${sel('majorGroup','전공계열',p.majorGroup,['','인문계열','사회계열','상경계열','교육계열','공학계열','자연과학계열','의약·보건계열','예체능계열','수해양·환경계열','기타'])}
      ${sel('enrollmentStatus','학적상태',p.enrollmentStatus,['','재학','휴학','졸업예정','졸업·수료','기타'])}
      ${sel('graduationPlan','졸업까지 남은 기간',p.graduationPlan,['','6개월 이내','6개월–1년','1–2년','2년 이상','졸업·수료','미정'])}
      ${sel('gpaBand','학점 구간',p.gpaBand,['','3.0 미만','3.0–3.49','3.5–3.99','4.0 이상','해당없음','응답하지 않음'])}
    </div></div>

    <div class="hr"></div><div class="block"><h3>4. 진로·취업 Baseline</h3><p class="help">정답을 고르는 것이 아니라 지금의 상태를 기록합니다. 학기 말에 출발점과 비교할 수 있습니다.</p><div class="grid3">
      ${sel('jobDecision','희망직무 결정 정도',b.jobDecision,['','전혀 정하지 못함','탐색 중','2–3개 후보 있음','거의 정함','명확히 정함'])}
      ${sel('industryDecision','희망산업 결정 정도',b.industryDecision,['','전혀 정하지 못함','탐색 중','2–3개 후보 있음','거의 정함','명확히 정함'])}
      ${sel('prepStage','취업준비 단계',b.prepStage,['','아직 시작 전','정보탐색','기초준비','지원서 준비','실제 지원 중'])}
      ${sel('internship','인턴·현장실습 경험',b.internship,['','없음','1회','2회','3회 이상'])}
      ${sel('careerProgram','진로·취업 프로그램 참여',b.careerProgram,['','없음','1회','2–3회','4회 이상'])}
      ${sel('certificate','자격·인증 준비 정도',b.certificate,['','없음','준비 중','1개 보유','2개 보유','3개 이상 보유'])}
      ${sel('priorApplication','실제 입사지원 경험',b.priorApplication,['','없음','1–2회','3–5회','6회 이상'])}
      ${sel('workExperience','유급 근로경험',b.workExperience,['','없음','아르바이트','인턴','계약·정규 근무','2개 이상 유형 경험'])}
    </div></div>

    <div class="hr"></div><div class="block"><h3>5. AI 활용 Baseline</h3><p class="help">AI를 많이 쓰는지가 아니라, 무엇을 맡기고 무엇을 내가 판단할지를 정합니다.</p><div class="grid3">${sel('aiFrequency','생성형 AI 사용빈도',b.aiFrequency,['','거의 사용하지 않음','월 1–3회','주 1–2회','주 3회 이상','거의 매일'])}${txt('aiTools','주로 사용하는 AI',b.aiTools,'예: ChatGPT, Gemini')}${sel('aiCareerUse','취업준비 AI 사용경험',b.aiCareerUse,['','없음','정보검색만','기업·직무분석','지원서 작성','면접연습','여러 단계에서 활용'])}</div>
      <div class="field" style="margin-top:12px"><label>취업준비에서 사용해본 AI 영역 <span class="muted">(쉼표로 구분)</span></label><input class="input" id="aiCareerCategories" value="${ctx.escapeHtml(b.aiCareerCategories||'')}" placeholder="예: 직무탐색, 기업분석, 자소서, 면접"></div>
      <div class="field" style="margin-top:12px"><label>My AI Career Rule</label><textarea id="aiRule" placeholder="예: AI는 정보정리와 질문 생성에 활용하되, 경험의 사실과 최종 판단은 내가 직접 확인한다.">${ctx.escapeHtml(b.aiRule||'')}</textarea><span class="hint">한 학기 동안 반복해서 확인할 나의 AI 활용 원칙입니다.</span></div>
    </div>

    ${c.research?`<div class="hr"></div><div class="block"><h3>6. 연구 활용 동의 <span class="muted">(선택)</span></h3><p class="help">교육 참여와 연구 참여는 별개입니다. 동의하지 않아도 Jobfit 기능은 동일하게 사용할 수 있어야 합니다.</p><label class="checkRow"><input type="checkbox" id="researchConsent" ${s.research?.consent?'checked':''}><div><b>익명화된 검사·배경정보의 연구 활용에 동의</b><span>실제 수집 전 승인된 연구안내문·동의문·저장정책을 적용해야 합니다.</span></div></label></div>`:`<div class="callout info"><b>현재 연구데이터 수집은 비활성화되어 있습니다.</b> 학습 데이터는 학생의 Jobfit 진행을 위해 이 브라우저에만 저장됩니다.</div>`}

    <div class="actions"><button class="btn primary" id="saveStart">Career Start 저장</button><button class="btn secondary" id="nextStep">STEP 1 Career DNA →</button></div><div class="status" id="status"></div>
  </section>`;

  if(c.lockMode)root.querySelectorAll('.modeCard').forEach(x=>x.style.pointerEvents='none');
  root.querySelectorAll('.modeCard').forEach(card=>card.addEventListener('click',()=>{root.querySelectorAll('.modeCard').forEach(x=>x.classList.remove('on'));card.classList.add('on');ctx.saveState({mode:card.dataset.mode})}));
  document.getElementById('makeCodeBtn').addEventListener('click',()=>{const code=ctx.makeAnonCode();document.getElementById('anonCode').textContent=code;ctx.saveState({profile:{anonCode:code}});ctx.toast('익명코드를 발급했습니다. 별도로 보관하세요.');});
  document.getElementById('saveStart').addEventListener('click',save);document.getElementById('nextStep').addEventListener('click',()=>{save();ctx.navigate(1)});

  function save(){const profile={...ctx.getState().profile,courseCode:v('courseCode'),institution:v('institution'),age:v('age'),gender:v('gender'),grade:v('grade'),major:v('major'),majorGroup:v('majorGroup'),enrollmentStatus:v('enrollmentStatus'),graduationPlan:v('graduationPlan'),gpaBand:v('gpaBand')};const baseline={...ctx.getState().baseline,jobDecision:v('jobDecision'),industryDecision:v('industryDecision'),prepStage:v('prepStage'),internship:v('internship'),careerProgram:v('careerProgram'),certificate:v('certificate'),priorApplication:v('priorApplication'),workExperience:v('workExperience'),aiFrequency:v('aiFrequency'),aiTools:v('aiTools'),aiCareerUse:v('aiCareerUse'),aiCareerCategories:v('aiCareerCategories'),aiRule:v('aiRule')};const research={...ctx.getState().research};if(c.research)research.consent=!!document.getElementById('researchConsent')?.checked;ctx.saveState({profile,baseline,research,artifacts:{careerStartProfile:{jobDecision:baseline.jobDecision,industryDecision:baseline.industryDecision,prepStage:baseline.prepStage,aiRule:baseline.aiRule,updatedAt:new Date().toISOString()}}});document.getElementById('status').textContent='저장되었습니다.';ctx.toast('Career Start를 저장했습니다.');}
  function v(id){return document.getElementById(id)?.value?.trim?.()??document.getElementById(id)?.value??''}function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}function num(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" type="number" min="17" max="80" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${o||'선택'}</option>`).join('')}</select></div>`}
}

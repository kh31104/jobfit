import {renderMeasurePanel,bindMeasurePanel} from '../researchMeasures.js';

export async function render(ctx){
  const s=ctx.getState(),p=s.profile||{},b=s.baseline||{},c=ctx.courseConfig,start=s.artifacts?.careerStartProfile||{};
  const backupMeta=s.meta||{},backupComplete=!!backupMeta.backupConfirmed;
  const researchStatus=ctx.researchSyncStatus(),researchSyncedAt=backupMeta.lastResearchSyncAt||'';
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 0 · 1주차</div><h2>Career Start</h2><p>오늘은 ‘정답’을 찾는 날이 아니라 <b>지금의 나를 기록하는 날</b>입니다.</p></div><span class="badge">약 50–60분</span></div>
    <div class="progress"><span style="width:7%"></span></div>

    <div class="callout good"><b>오늘 할 일은 7개뿐입니다.</b><br>① 수업 연결 확인 → ② 익명코드 → ③ 기본정보 → ④ 현재 준비상태 → ⑤ AI Career Check-in → ⑥ PRE 측정 → ⑦ 백업 저장</div>
    <div class="journeyStrip">${['수업 연결','익명코드','기본정보','현재 준비상태','AI Check-in','PRE 측정','백업'].map((x,i)=>`<span><b>${i+1}</b>${x}</span>`).join('')}</div>

    <details class="summaryBox courseSetup" ${c.preset?'':'open'}>
      <summary><b>① 수업 연결 ${c.preset?'완료 ✓':'설정'}</b> <span class="muted">${ctx.escapeHtml(c.institution||p.institution||'일반 이용')}</span></summary>
      <div style="margin-top:12px">
        <p class="help">인제대 수업 링크로 들어왔다면 이미 설정되어 있으므로 수정할 필요가 없습니다.</p>
        <div class="modeGrid"><div class="modeCard ${s.mode==='full'?'on':''}" data-mode="full"><b>전체 Career Roadmap</b><span>STEP 0–13을 누적합니다.</span></div><div class="modeCard ${s.mode==='selective'?'on':''}" data-mode="selective"><b>선택형 Career Tools</b><span>필요한 도구만 이용합니다.</span></div></div>
        <div class="grid2" style="margin-top:12px"><div class="field"><label>수업코드</label><input class="input" id="courseCode" value="${ctx.escapeHtml(p.courseCode||'')}" placeholder="교수자에게 받은 코드"></div><div class="field"><label>학교/기관</label><input class="input" id="institution" value="${ctx.escapeHtml(c.institution||p.institution||'')}" placeholder="예: ○○대학교" ${c.preset?'readonly':''}></div></div>
        <div class="actions"><button class="btn secondary smallBtn" id="applyCourseBtn">수업코드 적용</button>${c.preset?'<span class="badge">INJE2026 · 전체로드맵 적용</span>':''}</div>
      </div>
    </details>

    <div class="hr"></div><div class="block focusBlock"><div class="stepLabel">②</div><h3>내 익명코드 확인</h3><p class="help">이름·학번 대신 한 학기 동안 사용할 코드입니다. 같은 학생의 PRE/POST를 연결하는 기준이 됩니다.</p>
      <div class="codeBox"><div><div class="muted" style="font-size:11px;font-weight:800">MY JOBFIT CODE</div><div class="anonCode" id="anonCode">${ctx.escapeHtml(p.anonCode||'아직 생성되지 않음')}</div></div><div class="actions compactActions"><button class="btn outline" id="copyCodeBtn">코드 복사</button><button class="btn primary" id="makeCodeBtn">${p.anonCode?'코드 재발급':'익명코드 생성'}</button></div></div>
      <div class="callout warn"><b>코드는 한 번만 발급됩니다.</b> 이 코드는 이번 학기 동안 유지됩니다. 브라우저 데이터가 삭제되거나 다른 기기를 사용할 때 같은 코드를 유지할 수 있도록 JSON 백업파일도 보관하세요.</div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">③</div><h3>기본정보</h3><p class="help">진로·취업 분석에 필요한 최소 정보만 입력합니다. 이름·학번·전화번호·정확한 생년월일은 입력하지 않습니다.</p>
      <div class="grid3">${num('age','나이',p.age,'예: 22')}${sel('gender','성별',p.gender,['','여성','남성','기타','응답하지 않음'])}${sel('grade','학년',p.grade,['','1학년','2학년','3학년','4학년','5학년 이상','졸업·수료'])}${txt('major','학과',p.major,'예: 경영학과')}${sel('majorGroup','전공계열',p.majorGroup,['','인문계열','사회계열','상경계열','교육계열','공학계열','자연과학계열','의약·보건계열','예체능계열','수해양·환경계열','기타'])}${sel('enrollmentStatus','학적상태',p.enrollmentStatus,['','재학','휴학','졸업예정','졸업·수료','기타'])}</div>
      <details style="margin-top:12px"><summary>추가 배경정보 입력</summary><div class="grid2" style="margin-top:10px">${sel('graduationPlan','졸업까지 남은 기간',p.graduationPlan,['','6개월 이내','6개월–1년','1–2년','2년 이상','졸업·수료','미정'])}${sel('gpaBand','학점 구간',p.gpaBand,['','3.0 미만','3.0–3.49','3.5–3.99','4.0 이상','해당없음','응답하지 않음'])}</div></details>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">④</div><h3>현재 진로·취업 준비상태</h3><p class="help">잘 보이기 위해 높게 체크할 필요가 없습니다. 오늘의 상태가 학기 말 비교의 출발점입니다.</p>
      <div class="grid3">${sel('jobDecision','희망직무 결정 정도',b.jobDecision,['','전혀 정하지 못함','탐색 중','2–3개 후보 있음','거의 정함','명확히 정함'])}${sel('industryDecision','희망산업 결정 정도',b.industryDecision,['','전혀 정하지 못함','탐색 중','2–3개 후보 있음','거의 정함','명확히 정함'])}${sel('prepStage','취업준비 단계',b.prepStage,['','아직 시작 전','정보탐색','기초준비','지원서 준비','실제 지원 중'])}${sel('internship','인턴·현장실습 경험',b.internship,['','없음','1회','2회','3회 이상'])}${sel('careerProgram','진로·취업 프로그램 참여',b.careerProgram,['','없음','1회','2–3회','4회 이상'])}${sel('certificate','자격·인증 준비 정도',b.certificate,['','없음','준비 중','1개 보유','2개 보유','3개 이상 보유'])}${sel('priorApplication','실제 입사지원 경험',b.priorApplication,['','없음','1–2회','3–5회','6회 이상'])}${sel('workExperience','유급 근로경험',b.workExperience,['','없음','아르바이트','인턴','계약·정규 근무','2개 이상 유형 경험'])}</div>
      <h4 style="margin:18px 0 8px">AI 사용 시작점</h4><div class="grid3">${sel('aiFrequency','생성형 AI 사용빈도',b.aiFrequency,['','거의 사용하지 않음','월 1–3회','주 1–2회','주 3회 이상','거의 매일'])}${txt('aiTools','주로 사용하는 AI',b.aiTools,'예: ChatGPT, Gemini')}${sel('aiCareerUse','취업준비 AI 사용경험',b.aiCareerUse,['','없음','정보검색만','기업·직무분석','지원서 작성','면접연습','여러 단계에서 활용'])}</div>
      <div class="field" style="margin-top:12px"><label>My AI Career Rule</label><textarea id="aiRule" placeholder="예: AI는 정보정리와 질문 생성에 활용하되, 경험의 사실과 최종 판단은 내가 직접 확인한다.">${ctx.escapeHtml(b.aiRule||'')}</textarea></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">⑤</div><h3>AI LAB 00 · Career Check-in</h3><p class="help">AI에게 진로를 정해달라고 하지 않습니다. <b>AI가 나에게 질문하게</b> 만들어 지금의 상태를 말로 확인합니다.</p>
      <div class="actions"><button class="btn secondary" id="makeStartPrompt">AI 인터뷰 프롬프트 만들기</button><button class="btn outline hidden" id="copyStartPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="startPromptBox"></div>
      <div class="grid2" style="margin-top:14px"><div class="field"><label>인터뷰 후 ‘지금의 나’ 한 문장</label><textarea id="careerStartStatement" placeholder="예: 관심 직무는 탐색 중이지만 프로젝트 경험을 직무역량으로 연결하는 연습이 필요한 상태이다.">${ctx.escapeHtml(start.statement||'')}</textarea></div><div class="field"><label>이번 주 내가 직접 할 1가지</label><textarea id="careerStartAction" placeholder="예: 관심 직무 3개의 실제 업무를 비교한다.">${ctx.escapeHtml(start.nextAction||'')}</textarea></div></div>
    </div>

    ${c.researchMeasures?`<div class="stepLabel measureStepLabel">⑥</div>${renderMeasurePanel(ctx,'pre')}`:''}

    <div class="hr"></div><div class="block finishBlock"><div class="stepLabel">⑦</div><h3>저장·백업 안내</h3><p class="help">이 기기에는 자동저장됩니다. 휴대폰에서 노트북으로 바꾸거나 브라우저 데이터가 지워질 때를 대비해 <b>JSON 백업파일을 기기 밖에도 보관</b>하는 것을 권장합니다.</p>
      <div class="backupFlow">
        <div class="backupTask"><span class="backupTaskN">1</span><div><b>현재 답변 저장</b><p>입력한 Career Start와 PRE 결과를 이 브라우저에 저장합니다.</p><button class="btn primary" id="saveStart">Career Start 저장</button></div></div>
        <div class="backupTask"><span class="backupTaskN">2</span><div><b>JSON 백업파일 만들기</b><p><b>휴대폰·태블릿:</b> ‘공유해서 보관’ 후 카카오톡 나에게 보내기·이메일·Drive 등을 선택하세요.<br><b>노트북:</b> ‘파일 다운로드’ 후 자기 이메일이나 클라우드에 직접 첨부하세요.</p><div class="actions"><button class="btn secondary" id="backupNowBtn">백업파일 다운로드</button><button class="btn outline" id="shareBackupBtn">공유해서 보관</button></div><div class="status" id="backupFileStatus"></div></div></div>
        <div class="backupTask"><span class="backupTaskN">3</span><div><b>기기 밖 보관 확인 <span class="muted">(선택)</span></b><p>다운로드 폴더에만 두면 휴대폰 분실·기기 변경 시 찾지 못할 수 있습니다. 확인 체크는 권장사항이며 다음 단계 진행에는 영향을 주지 않습니다.</p><label class="backupConfirm"><input type="checkbox" id="backupStoredCheck" ${backupComplete?'checked':''}><span>이메일·카카오톡 ‘나에게 보내기’·Google Drive·iCloud·OneDrive 중 한 곳에 보관했습니다.</span></label></div></div>
        <div class="backupTask researchTask"><span class="backupTaskN">R</span><div><b>연구용 데이터 파일 저장</b><p>교수자 제출·연구자료 취합용 파일입니다. <b>인구통계·검사점수·진행률만</b> 포함하며 경험 서술, AI 대화, 지원서, 면접답변 원문은 제외합니다.</p><button class="btn researchBtn" id="researchDownloadBtn">연구용 데이터 파일 내려받기</button><div class="status" id="researchFileStatus"></div></div></div>
        ${renderCentralResearchTask(researchStatus,researchSyncedAt,ctx)}
      </div>
      <div class="backupComplete ${backupComplete?'done':''}" id="backupCompleteState" aria-live="polite"></div>
      <div class="actions"><button class="btn outline" id="nextStep">STEP 1 Career DNA →</button></div><div class="status" id="status"></div>
      <div class="callout info"><b>첫 수업 완료 기준</b><br>익명코드 + 기본정보 + 현재 준비상태 + AI Check-in + 고용24 구직준비도·진로적응성 PRE까지 완료하면 됩니다. 백업파일의 기기 밖 보관과 확인 체크는 권장사항입니다. 강점활용·약점교정 측정은 STEP 2 경험·역량 수업에서 진행합니다.</div>
    </div>

    <div class="callout info"><b>연구 활용은 별도 절차입니다.</b> 교육활동 참여 및 성적과 연구동의는 분리됩니다. 중앙 전송이 활성화되더라도 동의하지 않은 학생은 연구용 파일이나 중앙 DB를 제출하지 않아도 됩니다.</div>
  </section>`;

  if(c.lockMode)root.querySelectorAll('.modeCard').forEach(x=>x.style.pointerEvents='none');
  root.querySelectorAll('.modeCard').forEach(card=>card.addEventListener('click',()=>{root.querySelectorAll('.modeCard').forEach(x=>x.classList.remove('on'));card.classList.add('on');ctx.saveState({mode:card.dataset.mode})}));
  document.getElementById('applyCourseBtn')?.addEventListener('click',()=>ctx.applyCourseCode(v('courseCode')));
  document.getElementById('makeCodeBtn').addEventListener('click',()=>{
    const existing=String(ctx.getState().profile?.anonCode||'');
    const code=ctx.makeAnonCode(),btn=document.getElementById('makeCodeBtn');
    document.getElementById('anonCode').textContent=code;
    if(existing.startsWith('JF26-')){
      btn.disabled=true;btn.setAttribute('aria-disabled','true');btn.textContent='코드 유지됨 ✓';
      ctx.toast('기존 익명코드는 이번 학기 동안 유지됩니다.');
    }else ctx.toast('익명코드를 발급했습니다. 백업파일에도 함께 저장됩니다.');
  });
  document.getElementById('copyCodeBtn').addEventListener('click',async()=>{const code=document.getElementById('anonCode').textContent;if(!code.startsWith('JF26-')){ctx.toast('익명코드를 먼저 생성해 주세요.');return}try{await navigator.clipboard.writeText(code);ctx.toast('익명코드를 복사했습니다.')}catch{ctx.toast('코드를 길게 눌러 직접 복사해 주세요.')}});
  document.getElementById('makeStartPrompt').addEventListener('click',()=>{const box=document.getElementById('startPromptBox');box.textContent=makeStartPrompt();box.classList.remove('hidden');document.getElementById('copyStartPrompt').classList.remove('hidden')});
  document.getElementById('copyStartPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('startPromptBox').textContent);ctx.toast('AI LAB 00 프롬프트를 복사했습니다.')}catch{ctx.toast('복사가 차단되었습니다. 직접 선택해 복사해 주세요.')}});
  document.getElementById('saveStart').addEventListener('click',save);
  document.getElementById('backupNowBtn').addEventListener('click',()=>{save(false);ctx.downloadJSON();renderBackupStatus();});
  document.getElementById('shareBackupBtn').addEventListener('click',async()=>{save(false);await ctx.shareBackup();renderBackupStatus();});
  document.getElementById('backupStoredCheck').addEventListener('change',e=>{const latest=ctx.getState();if(e.target.checked&&!latest.meta?.lastBackupAt){e.target.checked=false;ctx.toast('백업파일을 먼저 만들거나 공유해 주세요.');return}ctx.saveState({meta:{backupConfirmed:e.target.checked,backupConfirmedAt:e.target.checked?new Date().toISOString():null}});renderBackupStatus();});
  document.getElementById('researchDownloadBtn').addEventListener('click',()=>{save(false);const name=ctx.downloadResearchJSON();if(name)renderResearchStatus();});
  document.getElementById('centralResearchBtn')?.addEventListener('click',async()=>{
    const required=['researchReadCheck','researchVoluntaryCheck','researchAgreeCheck'];
    if(required.some(id=>!document.getElementById(id)?.checked)){ctx.toast('연구 안내와 동의 항목 3개를 모두 확인해 주세요.');return}
    const button=document.getElementById('centralResearchBtn'),statusEl=document.getElementById('centralResearchStatus');
    try{button.disabled=true;statusEl.textContent='연구용 데이터만 안전하게 전송하고 있습니다.';save(false);const result=await ctx.syncResearchData();statusEl.textContent=`중앙 제출 완료 · ${formatTime(result.received_at||new Date().toISOString())} · 활동 원문 제외`;statusEl.className='status goodText';ctx.toast('중앙 연구데이터 제출이 완료되었습니다.')}catch(err){statusEl.textContent=err.message||'중앙 제출에 실패했습니다.';statusEl.className='status errorText';ctx.toast('중앙 제출 상태를 확인해 주세요.')}finally{button.disabled=false}
  });
  document.getElementById('nextStep').addEventListener('click',()=>{save(false);ctx.navigate(1)});
  if(c.researchMeasures)bindMeasurePanel(ctx,'pre');
  renderBackupStatus();
  renderResearchStatus();

  function makeStartPrompt(){return `너는 대학생 취업·진로 코치다. 아래 정보는 내가 직접 입력한 현재 상태다. 이 정보 밖의 경험이나 성향을 지어내지 마라.\n\n[현재 상태]\n- 희망직무 결정 정도: ${v('jobDecision')||'미입력'}\n- 희망산업 결정 정도: ${v('industryDecision')||'미입력'}\n- 취업준비 단계: ${v('prepStage')||'미입력'}\n- 인턴·현장실습 경험: ${v('internship')||'미입력'}\n- 실제 입사지원 경험: ${v('priorApplication')||'미입력'}\n- 생성형 AI 사용빈도: ${v('aiFrequency')||'미입력'}\n- 취업준비 AI 사용경험: ${v('aiCareerUse')||'미입력'}\n\n지금부터 내 진로·취업 시작점을 확인하기 위해 한 번에 하나씩 질문해 줘. 질문은 최대 5개만 하고, 내가 답하지 않은 내용은 추측하지 마라. 특히 ① 지금 관심 있는 일/직무, ② 내가 해본 경험, ③ 가장 막막한 부분, ④ 이번 학기에 얻고 싶은 변화, ⑤ AI에게 맡기고 싶은 것과 내가 직접 판단해야 할 것을 확인해 줘.\n\n질문이 끝나면 내가 말한 내용만으로 다음 4가지를 짧게 정리해 줘.\n1. 현재 Career Starting Point\n2. 지금 활용 가능한 자산 1~2개\n3. 가장 먼저 보완할 GAP 1개\n4. 이번 주 내가 직접 실행할 행동 1개\n\n문장은 과장하지 말고 대학생인 내가 실제로 말할 법한 표현으로 써 줘.`}

  function save(show=true){
    const current=ctx.getState(),profile={...current.profile,courseCode:v('courseCode')||c.course||current.profile?.courseCode||'',institution:c.institution||v('institution')||current.profile?.institution||'',age:v('age'),gender:v('gender'),grade:v('grade'),major:v('major'),majorGroup:v('majorGroup'),enrollmentStatus:v('enrollmentStatus'),graduationPlan:v('graduationPlan'),gpaBand:v('gpaBand')};
    const baseline={...current.baseline,jobDecision:v('jobDecision'),industryDecision:v('industryDecision'),prepStage:v('prepStage'),internship:v('internship'),careerProgram:v('careerProgram'),certificate:v('certificate'),priorApplication:v('priorApplication'),workExperience:v('workExperience'),aiFrequency:v('aiFrequency'),aiTools:v('aiTools'),aiCareerUse:v('aiCareerUse'),aiRule:v('aiRule')};
    ctx.saveState({profile,baseline,artifacts:{careerStartProfile:{jobDecision:baseline.jobDecision,industryDecision:baseline.industryDecision,prepStage:baseline.prepStage,aiRule:baseline.aiRule,statement:v('careerStartStatement'),nextAction:v('careerStartAction'),updatedAt:new Date().toISOString()}}});
    if(show){const missing=[];if(!current.profile?.anonCode&&!document.getElementById('anonCode').textContent.startsWith('JF26-'))missing.push('익명코드');if(!profile.age||!profile.grade)missing.push('기본정보');if(!baseline.jobDecision||!baseline.prepStage)missing.push('준비상태');document.getElementById('status').textContent=missing.length?`저장했습니다. 아직 확인할 항목: ${missing.join(' · ')}`:'Career Start가 저장되었습니다. PRE 측정과 백업 보관까지 확인하세요.';ctx.toast('Career Start 저장 완료');}
  }
  function renderBackupStatus(){const meta=ctx.getState().meta||{},made=!!meta.lastBackupAt,done=!!meta.backupConfirmed,fileStatus=document.getElementById('backupFileStatus'),completeState=document.getElementById('backupCompleteState'),check=document.getElementById('backupStoredCheck');if(fileStatus)fileStatus.textContent=made?`백업파일 생성됨 · ${formatTime(meta.lastBackupAt)} · ${meta.lastBackupMethod==='share'?'공유':'다운로드'}`:'아직 이번 백업파일을 만들지 않았습니다.';if(check)check.checked=done;if(completeState){completeState.classList.toggle('done',done);completeState.innerHTML=done?'<b>백업 확인 ✓</b><span>다른 기기에서는 이 JSON 파일을 ‘백업 불러오기’로 복구할 수 있습니다.</span>':'<b>선택 확인</b><span>기기 밖 보관을 권장하지만 체크하지 않아도 다음 단계로 진행할 수 있습니다.</span>'}}
  function renderResearchStatus(){const at=ctx.getState().meta?.lastResearchExportAt,el=document.getElementById('researchFileStatus');if(el)el.textContent=at?`연구용 파일 생성됨 · ${formatTime(at)} · 활동 원문 제외`:'익명코드를 만든 뒤 언제든 저장할 수 있습니다.'}
  function formatTime(iso){try{return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return '방금'}}
  function v(id){return document.getElementById(id)?.value?.trim?.()??document.getElementById(id)?.value??''}
  function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}
  function num(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" type="number" min="17" max="80" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ph||''}"></div>`}
  function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${o||'선택'}</option>`).join('')}</select></div>`}
}

function renderCentralResearchTask(status,syncedAt,ctx){
  if(!status.enabled)return `<div class="backupTask centralResearchTask disabledTask"><span class="backupTaskN">DB</span><div><b>중앙 연구 DB 제출 <span class="muted">(준비 중)</span></b><p>최종 연구동의 문구와 교수자 접근 설정이 승인된 뒤 활성화됩니다. 현재는 위의 ‘연구용 데이터 파일 내려받기’를 사용하세요.</p><button class="btn researchBtn" id="centralResearchBtn" disabled>중앙 DB로 제출</button><div class="status" id="centralResearchStatus">현재 자동 전송되지 않습니다.</div></div></div>`;
  return `<div class="backupTask centralResearchTask"><span class="backupTaskN">DB</span><div><b>중앙 연구 DB 제출 <span class="optionalBadge">자발적 선택</span></b><p>제출되는 내용은 인구통계·고용24 점수·진로적응성·강점활용/약점교정 점수·진행률입니다. 활동 원문, AI 대화, 지원서와 면접답변은 제출하지 않습니다.</p><a class="consentDocLink" href="${ctx.escapeHtml(status.consentDocumentUrl)}" target="_blank" rel="noopener noreferrer">연구 설명문·동의서 확인 ↗</a><div class="researchConsentChecks"><label><input type="checkbox" id="researchReadCheck"><span>연구 설명문과 수집 항목을 확인했습니다.</span></label><label><input type="checkbox" id="researchVoluntaryCheck"><span>참여는 자발적이며 거부해도 수업·성적에 불이익이 없음을 이해했습니다.</span></label><label><input type="checkbox" id="researchAgreeCheck"><span>위 연구목적의 자료 수집·이용에 동의합니다.</span></label></div><button class="btn researchBtn" id="centralResearchBtn">동의하고 중앙 DB로 제출</button><div class="status ${syncedAt?'goodText':''}" id="centralResearchStatus">${syncedAt?`최근 중앙 제출 · ${formatDisplayTime(syncedAt)} · 활동 원문 제외`:`동의하지 않으면 제출하지 않아도 됩니다. 동의 여부는 성적에 영향을 주지 않습니다.`}</div></div></div>`;
}
function formatDisplayTime(iso){try{return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return '제출 완료'}}

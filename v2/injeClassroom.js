const params=new URLSearchParams(location.search);
const course=(params.get('course')||'').trim().toUpperCase();
const isInjeClass=['INJE2026','INJE-2026-2'].includes(course);
const STORAGE_KEY='jobfit:v2:learner';

if(isInjeClass){
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}};
  const hasAnonCode=()=>String(readState().profile?.anonCode||document.getElementById('anonCode')?.textContent||'').startsWith('JF26-');
  const fullFinite=(arr,n,min=-Infinity,max=Infinity)=>Array.isArray(arr)&&arr.length===n&&arr.every(v=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max);
  const showToast=msg=>{const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('on');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('on'),2600)};
  const week1Complete=()=>{
    const s=readState(),p=s.profile||{},b=s.baseline||{},a=s.artifacts?.careerStartProfile||{},pre=s.research?.measurements?.pre||{};
    return !!(
      String(p.anonCode||'').startsWith('JF26-')&&p.age&&p.grade&&b.jobDecision&&b.prepStage&&
      a.statement&&a.nextAction&&pre.work24CollegeCareerReadiness?.examDate&&
      fullFinite(pre.work24CollegeCareerReadiness?.scores,14)&&fullFinite(pre.kcaas?.items,12,1,5)&&
      pre.kcaas?.wordingVersion==='K-CAAS-SF-KR-2020-v1'
    );
  };
  const setBackupAvailability=()=>{
    const ready=hasAnonCode();
    ['exportBtn','backupNowBtn','shareBackupBtn'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      el.disabled=!ready;
      el.setAttribute('aria-disabled',String(!ready));
      if(!ready)el.title='익명코드를 먼저 생성하면 백업할 수 있습니다.';
    });
    const status=document.getElementById('backupFileStatus');
    if(status&&!ready&&status.textContent!=='익명코드를 먼저 생성하면 백업 버튼이 활성화됩니다.')status.textContent='익명코드를 먼저 생성하면 백업 버튼이 활성화됩니다.';
  };
  const lockExistingCode=()=>{
    const btn=document.getElementById('makeCodeBtn');if(!btn)return;
    if(hasAnonCode()){
      btn.disabled=true;
      btn.setAttribute('aria-disabled','true');
      if(btn.textContent!=='코드 유지됨 ✓')btn.textContent='코드 유지됨 ✓';
      btn.title='PRE/POST 연결을 위해 이 익명코드를 한 학기 동안 유지합니다.';
    }
  };
  const restoreAnonCode=()=>{
    const input=document.getElementById('existingAnonCode');
    if(!input)return;
    const code=String(input.value||'').trim().toUpperCase();
    if(!/^JF26-[A-Z2-9]{6}$/.test(code)){
      showToast('기존 익명코드를 확인해 주세요. 예: JF26-ABC234');
      input.focus();
      return;
    }
    const s=readState();
    s.profile=s.profile||{};
    s.meta=s.meta||{};
    s.profile.anonCode=code;
    s.meta.anonCodeLocked=true;
    s.meta.anonCodeRestoredAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
    showToast(`기존 익명코드를 불러왔습니다: ${code}`);
    setTimeout(()=>location.reload(),350);
  };
  const addExistingCodeRestore=()=>{
    const box=document.getElementById('anonCode')?.closest('.codeBox');
    if(!box||document.getElementById('existingAnonCodeWrap'))return;
    const wrap=document.createElement('div');
    wrap.id='existingAnonCodeWrap';
    wrap.className='callout info';
    wrap.style.marginTop='12px';
    wrap.innerHTML='<b>이전에 발급받은 코드가 있나요?</b><br><span class="muted">다른 기기·다른 브라우저에서 다시 접속했다면 새 코드를 만들지 말고 기존 코드를 입력하세요.</span><div class="actions" style="margin-top:10px"><input class="input" id="existingAnonCode" inputmode="text" autocomplete="off" placeholder="예: JF26-ABC234" style="max-width:260px;text-transform:uppercase"><button class="btn secondary smallBtn" id="restoreAnonCodeBtn" type="button">기존 코드 불러오기</button></div>';
    box.insertAdjacentElement('afterend',wrap);
    document.getElementById('restoreAnonCodeBtn')?.addEventListener('click',restoreAnonCode);
    document.getElementById('existingAnonCode')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();restoreAnonCode();}});
  };
  const markWeek1Nav=()=>{
    const first=document.querySelector('.stepBtn[data-step="0"] .stepN');if(!first)return;
    const desired=week1Complete()?'✓':'0';
    if(first.textContent!==desired)first.textContent=desired;
  };
  const addWork24Hint=()=>{
    const headings=[...document.querySelectorAll('#stepRoot h3')];
    const heading=headings.find(el=>el.textContent.trim()==='고용24 대학생진로준비도검사');
    const box=heading?.closest('.summaryBox');if(!box||box.querySelector('.injeWork24LoginHint'))return;
    const hint=document.createElement('div');
    hint.className='callout info injeWork24LoginHint';
    hint.innerHTML='<b>수업 전 고용24 로그인 상태를 확인하세요.</b><br>로그인 후 필터에서 <b>대학생 → 진로(취업)준비도</b>를 선택하고, <b>대학생진로준비도검사</b>를 실시하세요. 약 20분이 걸립니다.';
    const actions=box.querySelector('.actions');
    if(actions)actions.insertAdjacentElement('afterend',hint);else box.prepend(hint);
  };
  const makeStorageCopyAccurate=()=>{
    const saveLabel=document.getElementById('saveState');
    if(saveLabel&&saveLabel.textContent==='이 브라우저에 자동 저장')saveLabel.textContent='이 브라우저에 저장';
    document.querySelectorAll('#stepRoot .finishBlock > p.help').forEach(p=>{
      if(p.textContent.includes('이 기기에는 자동저장됩니다.'))p.innerHTML='저장 버튼을 누르면 이 기기에 저장됩니다. 휴대폰에서 노트북으로 바꾸거나 브라우저 데이터가 지워질 때를 대비해 <b>내 학습 백업파일을 기기 밖에도 보관</b>하는 것을 권장합니다.';
    });
  };
  const applyClassroomView=()=>{
    const researchTop=document.getElementById('researchExportBtn');
    if(researchTop&&!researchTop.classList.contains('hidden'))researchTop.classList.add('hidden');

    document.querySelectorAll('.researchTask').forEach(el=>el.classList.add('hidden'));
    document.querySelectorAll('.centralResearchTask.disabledTask').forEach(el=>el.classList.add('hidden'));

    setBackupAvailability();
    lockExistingCode();
    markWeek1Nav();
    makeStorageCopyAccurate();

    const root=document.getElementById('stepRoot');
    if(!root)return;
    const kicker=root.querySelector('.kicker');
    if(!kicker||!kicker.textContent.includes('STEP 0'))return;

    addExistingCodeRestore();

    const firstBadge=root.querySelector('.sectionHead .badge');
    if(firstBadge&&firstBadge.textContent!=='1주차 · 120분')firstBadge.textContent='1주차 · 120분';

    root.querySelectorAll('.callout.info b').forEach(label=>{
      if([
        '현재 중앙 연구데이터 전송은 비활성화되어 있습니다.',
        '연구 활용은 별도 절차입니다.'
      ].includes(label.textContent)){
        const box=label.parentElement;
        if(box)box.innerHTML='<b>연구자료 제출은 1주차에 하지 않습니다.</b> 오늘 자료는 이 브라우저와 내 학습 백업파일에만 저장되며 교수자 또는 중앙 연구 DB로 전송되지 않습니다. 연구 활용 여부는 수업 운영과 별도로 이후 절차에서 안내합니다.';
      }
    });
    addWork24Hint();
  };

  document.addEventListener('click',e=>{
    const target=e.target.closest?.('button');if(!target)return;
    if(['preMeasureSave','postMeasureSave'].includes(target.id)){
      if(!hasAnonCode()){
        e.preventDefault();e.stopImmediatePropagation();
        showToast('익명코드를 먼저 생성해 주세요. PRE/POST 연결에 필요합니다.');
        document.getElementById('makeCodeBtn')?.focus();
        return;
      }
      const prefix=target.id.startsWith('post')?'post':'pre';
      const date=document.getElementById(`${prefix}Work24Date`);
      const work24=[...document.querySelectorAll(`[data-measure="${prefix}-work24"]`)];
      const hasWork24=work24.some(el=>el.value!=='');
      if(hasWork24&&!date?.value){
        e.preventDefault();e.stopImmediatePropagation();
        showToast('고용24 검사일을 입력해 주세요.');
        date?.focus();
        return;
      }
      const scaleInputs=[...document.querySelectorAll(`[data-measure="${prefix}-kcaas"],[data-measure="${prefix}-sudco"]`)];
      const invalid=scaleInputs.find(el=>el.value!==''&&!el.checkValidity());
      if(invalid){
        e.preventDefault();e.stopImmediatePropagation();
        const status=document.getElementById(`${prefix}MeasureStatus`);
        if(status)status.textContent='응답 범위를 확인하세요. K-CAAS-SF는 1–5, 강점활용·약점교정은 0–6입니다.';
        showToast('응답 범위를 벗어난 숫자가 있습니다.');
        invalid.focus();
      }
    }
  },true);

  document.addEventListener('input',e=>{
    const el=e.target;
    if(!(el instanceof HTMLInputElement)||!el.matches('[data-measure$="-kcaas"],[data-measure$="-sudco"]'))return;
    el.setAttribute('aria-invalid',String(el.value!==''&&!el.checkValidity()));
  },true);

  applyClassroomView();
  const observer=new MutationObserver(applyClassroomView);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}

const params=new URLSearchParams(location.search);
const course=(params.get('course')||'').trim().toUpperCase();
const isInjeClass=['INJE2026','INJE-2026-2'].includes(course);
const STORAGE_KEY='jobfit:v2:learner';

if(isInjeClass){
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}};
  const hasAnonCode=()=>String(readState().profile?.anonCode||document.getElementById('anonCode')?.textContent||'').startsWith('JF26-');
  const showToast=msg=>{const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('on');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('on'),2600)};
  const week1Complete=()=>{
    const s=readState(),p=s.profile||{},b=s.baseline||{},a=s.artifacts?.careerStartProfile||{};
    return !!(String(p.anonCode||'').startsWith('JF26-')&&p.age&&p.grade&&b.jobDecision&&b.prepStage&&a.statement&&a.nextAction);
  };
  const setBackupAvailability=()=>{
    const ready=hasAnonCode();
    ['exportBtn','backupNowBtn','shareBackupBtn'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      el.disabled=!ready;el.setAttribute('aria-disabled',String(!ready));
      if(!ready)el.title='익명코드를 먼저 생성하면 백업할 수 있습니다.';
    });
    const status=document.getElementById('backupFileStatus');
    if(status&&!ready)status.textContent='익명코드를 먼저 생성하면 백업 버튼이 활성화됩니다.';
  };
  const lockExistingCode=()=>{
    const btn=document.getElementById('makeCodeBtn');if(!btn)return;
    if(hasAnonCode()){
      btn.disabled=true;btn.setAttribute('aria-disabled','true');btn.textContent='코드 유지됨 ✓';
      btn.title='이 익명코드는 한 학기 동안 같은 학생의 학습 백업을 이어가기 위해 유지합니다.';
    }
  };
  const restoreAnonCode=()=>{
    const input=document.getElementById('existingAnonCode');if(!input)return;
    const code=String(input.value||'').trim().toUpperCase();
    if(!/^JF26-[A-Z2-9]{6}$/.test(code)){showToast('기존 익명코드를 확인해 주세요. 예: JF26-ABC234');input.focus();return}
    const s=readState();s.profile=s.profile||{};s.meta=s.meta||{};s.profile.anonCode=code;s.meta.anonCodeLocked=true;s.meta.anonCodeRestoredAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(s));showToast(`기존 익명코드를 불러왔습니다: ${code}`);setTimeout(()=>location.reload(),350);
  };
  const addExistingCodeRestore=()=>{
    const box=document.getElementById('anonCode')?.closest('.codeBox');if(!box||document.getElementById('existingAnonCodeWrap'))return;
    const wrap=document.createElement('div');wrap.id='existingAnonCodeWrap';wrap.className='callout info';wrap.style.marginTop='12px';
    wrap.innerHTML='<b>이전에 발급받은 코드가 있나요?</b><br><span class="muted">다른 기기·다른 브라우저에서 다시 접속했다면 새 코드를 만들지 말고 기존 코드를 입력하세요.</span><div class="actions" style="margin-top:10px"><input class="input" id="existingAnonCode" inputmode="text" autocomplete="off" placeholder="예: JF26-ABC234" style="max-width:260px;text-transform:uppercase"><button class="btn secondary smallBtn" id="restoreAnonCodeBtn" type="button">기존 코드 불러오기</button></div>';
    box.insertAdjacentElement('afterend',wrap);
    document.getElementById('restoreAnonCodeBtn')?.addEventListener('click',restoreAnonCode);
    document.getElementById('existingAnonCode')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();restoreAnonCode()}});
  };
  const markWeek1Nav=()=>{const first=document.querySelector('.stepBtn[data-step="0"] .stepN');if(first)first.textContent=week1Complete()?'✓':'0'};
  const makeStorageCopyAccurate=()=>{
    const saveLabel=document.getElementById('saveState');if(saveLabel&&saveLabel.textContent==='이 브라우저에 자동 저장')saveLabel.textContent='이 브라우저에 저장';
  };
  const removeResearchSemesterUI=()=>{
    document.getElementById('researchExportBtn')?.classList.add('hidden');
    document.querySelectorAll('.researchTask,.centralResearchTask,.researchMeasurePanel,.strengthMeasurePanel,.measureStepLabel').forEach(el=>el.classList.add('hidden'));
  };
  const rewriteWeek1Copy=()=>{
    const root=document.getElementById('stepRoot');if(!root)return;
    const kicker=root.querySelector('.kicker');if(!kicker||!kicker.textContent.includes('STEP 0'))return;
    const mainCallout=[...root.querySelectorAll('.callout.good')].find(x=>x.textContent.includes('오늘 할 일'));
    if(mainCallout)mainCallout.innerHTML='<b>오늘 할 일은 6개입니다.</b><br>① 수업 연결 확인 → ② 익명코드 → ③ 기본정보 → ④ 현재 준비상태 → ⑤ AI Career Check-in → ⑥ 저장·백업';
    const journey=root.querySelector('.journeyStrip');
    if(journey&&!journey.dataset.noResearch){journey.innerHTML=['수업 연결','익명코드','기본정보','현재 준비상태','AI Check-in','저장·백업'].map((x,i)=>`<span><b>${i+1}</b>${x}</span>`).join('');journey.dataset.noResearch='1'}
    root.querySelectorAll('h3').forEach(h=>{if(h.textContent.trim()==='저장·백업 안내'){const label=h.parentElement?.querySelector('.stepLabel');if(label)label.textContent='⑥'}});
    root.querySelectorAll('.callout.info b').forEach(label=>{
      if(label.textContent.includes('연구')||label.textContent.includes('중앙')){
        const box=label.parentElement;if(box&&box.textContent.includes('연구'))box.innerHTML='<b>이번 학기에는 연구용 데이터를 수집하지 않습니다.</b><br>Jobfit의 개인 검사결과·작성내용·AI 결과는 교수자나 연구 DB로 자동 전송되지 않습니다. 학생 본인의 학습을 이어가기 위해 이 브라우저와 개인 백업파일에만 저장합니다.';
      }
    });
  };
  const applyClassroomView=()=>{
    removeResearchSemesterUI();setBackupAvailability();lockExistingCode();markWeek1Nav();makeStorageCopyAccurate();rewriteWeek1Copy();addExistingCodeRestore();
    const root=document.getElementById('stepRoot');const firstBadge=root?.querySelector('.sectionHead .badge');
    if(root?.querySelector('.kicker')?.textContent.includes('STEP 0')&&firstBadge)firstBadge.textContent='1주차 · 120분';
  };

  document.addEventListener('click',e=>{
    const target=e.target.closest?.('button');if(!target)return;
    if(target.matches('.stepBtn')&&document.getElementById('saveStart'))document.getElementById('saveStart').click();
  },true);

  applyClassroomView();
  const observer=new MutationObserver(applyClassroomView);observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}

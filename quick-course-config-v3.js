(function(){
 const MODE_KEY='careerNavigationCourseModeV3';
 const MODULE_KEY='careerNavigationSelectedModulesV3';
 const REOPEN_KEY='careerNavigationOpenWork24AfterQuickConfigV3';
 const OFFICIAL_IDS=['riasec','workvalue','careerreadiness'];
 const MODULES=[
  {id:'riasec',title:'직업흥미 · 고용24 S형',tag:'공식검사'},
  {id:'workvalue',title:'직업가치 · 고용24 직업가치관',tag:'공식검사'},
  {id:'careerreadiness',title:'대학생 진로준비도',tag:'공식검사'},
  {id:'experience',title:'경험 · 나의 강점',tag:'경험'},
  {id:'via',title:'VIA 성격강점',tag:'강점'},
  {id:'mi',title:'다중지능',tag:'선택참고'},
  {id:'mbti',title:'MBTI',tag:'선택참고'},
  {id:'disc',title:'DiSC',tag:'선택참고'}
 ];
 let draftMode='full';
 let draftModules=new Set();

 function readMode(){
  const x=String(localStorage.getItem(MODE_KEY)||'').trim();
  return x==='class'?'class':'full';
 }
 function readModules(){
  try{
   const x=JSON.parse(localStorage.getItem(MODULE_KEY)||'[]');
   return Array.isArray(x)?x.filter(id=>MODULES.some(m=>m.id===id)):[];
  }catch(e){return[]}
 }
 function escText(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function ensureStyle(){
  if(document.getElementById('quickCourseConfigV3Style'))return;
  const style=document.createElement('style');
  style.id='quickCourseConfigV3Style';
  style.textContent=`
   .quickConfigBackdrop{position:fixed;inset:0;background:rgba(20,25,45,.5);z-index:9998;display:grid;place-items:center;padding:16px}.quickConfigBackdrop.hidden{display:none!important}.quickConfigPanel{width:min(760px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:24px;box-shadow:0 24px 70px rgba(20,25,45,.28);padding:22px}.quickConfigHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.quickConfigHead h2{margin:4px 0 5px;font-size:24px}.quickConfigHead p{margin:0;color:var(--muted);font-size:13px;line-height:1.55}.quickConfigClose{border:0;background:#f2f3f7;border-radius:11px;width:38px;height:38px;cursor:pointer;font-size:19px}.quickModeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.quickModeBtn{border:2px solid var(--line);border-radius:16px;background:#fff;padding:14px;text-align:left;cursor:pointer;color:var(--text)}.quickModeBtn.selected{border-color:#655ae7;background:#faf9ff}.quickModeBtn b,.quickModeBtn span{display:block}.quickModeBtn b{font-size:16px;margin-bottom:4px}.quickModeBtn span{font-size:12px;color:var(--muted);line-height:1.45}.quickModuleSection{border-top:1px solid var(--line);padding-top:15px}.quickModuleSection.hidden{display:none}.quickModuleTitle{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.quickModuleTitle b{font-size:15px}.quickModuleTitle span{font-size:11px;color:var(--muted)}.quickModuleGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.quickModuleBtn{display:flex;gap:9px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:13px;background:#fff;padding:11px;cursor:pointer;color:var(--text)}.quickModuleBtn.selected{border-color:#7469e9;background:#f8f7ff}.quickCheck{width:25px;height:25px;border-radius:8px;background:#eef0f6;display:grid;place-items:center;font-weight:900;flex:0 0 auto}.quickModuleBtn.selected .quickCheck{background:#5b50dd;color:#fff}.quickModuleText b,.quickModuleText small{display:block}.quickModuleText b{font-size:13px}.quickModuleText small{font-size:10px;color:var(--muted);margin-top:2px}.quickConfigNote{background:#f3fbf6;border:1px solid #d7e9df;color:#315c46;border-radius:12px;padding:10px 12px;margin-top:14px;font-size:12px;line-height:1.5}.quickConfigActions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.quickConfigActions .btn{min-width:110px}.quickConfigBtn{font-weight:900!important;color:#37308f!important;border-color:#cfcaf7!important;background:#fff!important}
   @media(max-width:620px){.quickModeGrid,.quickModuleGrid{grid-template-columns:1fr}.quickConfigPanel{padding:17px}.quickConfigActions{display:grid;grid-template-columns:1fr 1fr}.quickConfigActions .btn{width:100%;min-width:0}}
  `;
  document.head.appendChild(style);
 }
 function ensurePanel(){
  let back=document.getElementById('quickCourseConfigV3');
  if(back)return back;
  back=document.createElement('div');
  back.id='quickCourseConfigV3';
  back.className='quickConfigBackdrop hidden';
  back.addEventListener('click',e=>{if(e.target===back)closeQuickCourseConfigV3()});
  document.body.appendChild(back);
  return back;
 }
 function renderPanel(){
  const back=ensurePanel();
  const count=draftModules.size;
  back.innerHTML=`<section class="quickConfigPanel" role="dialog" aria-modal="true" aria-label="수업 구성">
   <div class="quickConfigHead"><div><span class="small muted">COURSE SETUP</span><h2>수업 구성</h2><p>진행방식과 오늘 사용할 모듈을 한 화면에서 바꿉니다. 이미 입력한 결과는 삭제되지 않습니다.</p></div><button class="quickConfigClose" type="button" onclick="closeQuickCourseConfigV3()">×</button></div>
   <div class="quickModeGrid">
    <button type="button" class="quickModeBtn ${draftMode==='full'?'selected':''}" onclick="setQuickCourseModeV3('full')"><b>전체 Career Roadmap</b><span>자기이해부터 직무·기업 탐색, GAP, Action Plan까지 전체 과정</span></button>
    <button type="button" class="quickModeBtn ${draftMode==='class'?'selected':''}" onclick="setQuickCourseModeV3('class')"><b>오늘의 선택형 수업</b><span>오늘 필요한 자기이해 모듈만 선택해서 진행</span></button>
   </div>
   <div class="quickModuleSection ${draftMode==='class'?'':'hidden'}">
    <div class="quickModuleTitle"><b>오늘 사용할 모듈</b><span>${count}개 선택</span></div>
    <div class="quickModuleGrid">${MODULES.map(m=>`<button type="button" class="quickModuleBtn ${draftModules.has(m.id)?'selected':''}" onclick="toggleQuickCourseModuleV3('${m.id}')"><span class="quickCheck">${draftModules.has(m.id)?'✓':'+'}</span><span class="quickModuleText"><b>${escText(m.title)}</b><small>${escText(m.tag)}</small></span></button>`).join('')}</div>
   </div>
   <div class="quickConfigNote">선택하지 않은 검사는 0점으로 처리하지 않고 <b>미실시</b>로 유지합니다. 전체 로드맵에서는 고용24 공식검사 3개를 포함한 전체 과정을 사용할 수 있습니다.</div>
   <div class="quickConfigActions"><button type="button" class="btn btnSecondary" onclick="closeQuickCourseConfigV3()">취소</button><button type="button" class="btn btnPrimary" onclick="applyQuickCourseConfigV3()">이 구성으로 적용</button></div>
  </section>`;
 }
 function open(){
  draftMode=readMode();
  draftModules=new Set(readModules());
  renderPanel();
  ensurePanel().classList.remove('hidden');
  document.body.style.overflow='hidden';
 }
 function close(){
  const back=document.getElementById('quickCourseConfigV3');if(back)back.classList.add('hidden');
  document.body.style.overflow='';
 }
 window.openQuickCourseConfigV3=open;
 window.closeQuickCourseConfigV3=close;
 window.setQuickCourseModeV3=function(mode){if(mode!=='full'&&mode!=='class')return;draftMode=mode;renderPanel()};
 window.toggleQuickCourseModuleV3=function(id){if(!MODULES.some(m=>m.id===id))return;if(draftModules.has(id))draftModules.delete(id);else draftModules.add(id);renderPanel()};
 window.applyQuickCourseConfigV3=function(){
  if(draftMode==='class'&&!draftModules.size){alert('선택형 수업에서는 모듈을 1개 이상 선택해 주세요.');return}
  localStorage.setItem(MODE_KEY,draftMode);
  if(draftMode==='class')localStorage.setItem(MODULE_KEY,JSON.stringify(MODULES.map(m=>m.id).filter(id=>draftModules.has(id))));
  const shouldOpen=draftMode==='full'||[...draftModules].some(id=>OFFICIAL_IDS.includes(id));
  if(shouldOpen)sessionStorage.setItem(REOPEN_KEY,'1');else sessionStorage.removeItem(REOPEN_KEY);
  close();
  location.reload();
 };
 function decorateBanner(){
  const banner=document.getElementById('courseModeActiveBanner');if(!banner)return;
  const oldMode=[...banner.querySelectorAll('button')].find(b=>b.textContent.trim()==='수업모드 변경');if(oldMode)oldMode.style.display='none';
  const oldModules=document.getElementById('changeModulesV3Btn');if(oldModules)oldModules.style.display='none';
  let btn=document.getElementById('quickCourseConfigV3Btn');
  if(!btn){btn=document.createElement('button');btn.id='quickCourseConfigV3Btn';btn.type='button';btn.className='ghost quickConfigBtn';btn.textContent='⚙ 수업 구성';btn.onclick=open;const work24=document.getElementById('openWork24V3Btn');if(work24&&work24.parentNode===banner)work24.insertAdjacentElement('afterend',btn);else banner.appendChild(btn)}
 }
 function reopenWork24IfNeeded(){
  if(sessionStorage.getItem(REOPEN_KEY)!=='1')return;
  sessionStorage.removeItem(REOPEN_KEY);
  let tries=0;
  const timer=setInterval(()=>{tries++;if(typeof window.openWork24AssessmentV3==='function'){clearInterval(timer);window.openWork24AssessmentV3()}else if(tries>30)clearInterval(timer)},100);
 }
 function install(){
  ensureStyle();ensurePanel();
  let tries=0;
  const timer=setInterval(()=>{decorateBanner();tries++;if(tries>40)clearInterval(timer)},150);
  const observer=new MutationObserver(()=>decorateBanner());observer.observe(document.body,{childList:true,subtree:true});
  reopenWork24IfNeeded();
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

(function(){
 const MODULE_KEY='careerNavigationSelectedModulesV3';
 const MODULES=[
  {id:'riasec',title:'직업흥미 · RIASEC',tag:'흥미',desc:'어떤 활동과 업무에 자연스럽게 관심이 가는지 확인합니다.',use:'직무 후보를 탐색하는 핵심 자료'},
  {id:'anchor',title:'직업가치 · Career Anchor',tag:'가치',desc:'일에서 포기하기 어려운 가치와 경력 선택 기준을 확인합니다.',use:'기업환경·경력방향을 비교하는 자료'},
  {id:'experience',title:'경험 · 나의 강점',tag:'경험',desc:'내 경험과 타인 피드백에서 실제로 드러난 강점을 찾습니다.',use:'자기소개·면접·역량 근거 자료'},
  {id:'via',title:'VIA 성격강점',tag:'강점',desc:'평소 자주 발휘하는 성격강점의 특징을 확인합니다.',use:'일하는 방식과 강점 활용 자료'},
  {id:'mi',title:'다중지능',tag:'학습방식',desc:'정보를 이해하고 문제를 해결할 때 선호하는 방식을 살펴봅니다.',use:'학습·문제해결 방식 참고자료'},
  {id:'mbti',title:'MBTI',tag:'업무스타일',desc:'이미 알고 있는 MBTI 유형을 직접 입력해 업무·협업 스타일을 돌아봅니다.',use:'소통·협업 방식 참고자료'},
  {id:'disc',title:'DiSC',tag:'행동스타일',desc:'외부 DiSC 검사 결과를 입력해 행동·의사소통 경향을 살펴봅니다.',use:'관계·협업 방식 참고자료'}
 ];
 let selected=new Set();
 let originalSelect=null;

 function readModules(){
  try{
   const value=JSON.parse(localStorage.getItem(MODULE_KEY)||'[]');
   return Array.isArray(value)?value.filter(id=>MODULES.some(m=>m.id===id)):[];
  }catch(e){return[]}
 }
 function writeModules(ids){
  const clean=[...new Set(ids)].filter(id=>MODULES.some(m=>m.id===id));
  localStorage.setItem(MODULE_KEY,JSON.stringify(clean));
  selected=new Set(clean);
  return clean;
 }
 function moduleNames(ids=readModules()){
  return ids.map(id=>MODULES.find(m=>m.id===id)?.title).filter(Boolean);
 }
 function setAppVisible(visible){
  ['progress','stepText','mobileStage','stageToggle','stageNav'].forEach(id=>{
   const node=document.getElementById(id);if(node)node.classList.toggle('moduleSelectorHidden',!visible);
  });
  const main=document.querySelector('.wrap > main');
  if(main)main.classList.toggle('moduleSelectorHidden',!visible);
  const banner=document.getElementById('courseModeActiveBanner');
  if(banner)banner.classList.toggle('moduleSelectorHidden',!visible);
 }
 function ensureScreen(){
  let screen=document.getElementById('moduleSelectorV3');
  if(!screen){
   screen=document.createElement('section');
   screen.id='moduleSelectorV3';
   const modeScreen=document.getElementById('courseModeScreenV3');
   const hero=document.querySelector('.hero');
   if(modeScreen&&modeScreen.parentNode)modeScreen.parentNode.insertBefore(screen,modeScreen.nextSibling);
   else if(hero&&hero.parentNode)hero.parentNode.insertBefore(screen,hero.nextSibling);
  }
  return screen;
 }
 function renderSelection(){
  const screen=ensureScreen();
  const count=selected.size;
  screen.className='moduleSelectorV3';
  screen.innerHTML=`
   <div class="moduleSelectorHead">
    <span class="moduleSelectorEyebrow">TODAY'S SELF-UNDERSTANDING</span>
    <h2>오늘 수업에서 무엇을 확인할까요?</h2>
    <p>수업 주제에 필요한 항목만 선택하세요. 여러 개를 함께 선택할 수 있습니다.</p>
   </div>
   <div class="moduleRule"><b>중요</b> · 선택하지 않은 검사는 낮은 점수나 0점으로 계산하지 않고 <b>미실시</b>로 남깁니다.</div>
   <div class="moduleGrid">
    ${MODULES.map(m=>`<button type="button" class="moduleCard ${selected.has(m.id)?'selected':''}" data-module="${m.id}" onclick="toggleCareerModuleV3('${m.id}')">
      <span class="moduleCheck">${selected.has(m.id)?'✓':'+'}</span>
      <span class="moduleTag">${m.tag}</span>
      <b>${m.title}</b>
      <small>${m.desc}</small>
      <em>${m.use}</em>
     </button>`).join('')}
   </div>
   <div class="moduleSelectionDock">
    <div><span>오늘 선택한 모듈</span><b>${count}개</b><small>${count?moduleNames([...selected]).join(' · '):'아직 선택하지 않았습니다.'}</small></div>
    <div class="moduleDockButtons"><button type="button" class="btn btnSecondary" onclick="backToCourseModeV3()">← 진행방식 다시 선택</button><button type="button" class="btn btnPrimary" onclick="completeCareerModulesV3()">선택 완료 · 수업 시작 →</button></div>
   </div>`;
 }
 function openSelector(){
  selected=new Set(readModules());
  const modeScreen=document.getElementById('courseModeScreenV3');
  if(modeScreen)modeScreen.classList.add('courseModeHidden');
  setAppVisible(false);
  const screen=ensureScreen();
  screen.classList.remove('moduleSelectorHidden');
  renderSelection();
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function closeSelector(){
  const screen=document.getElementById('moduleSelectorV3');
  if(screen)screen.classList.add('moduleSelectorHidden');
 }
 function decorateBanner(){
  if(typeof window.getCourseModeV3!=='function'||window.getCourseModeV3()!=='class')return;
  const banner=document.getElementById('courseModeActiveBanner');if(!banner)return;
  const names=moduleNames();
  const left=banner.querySelector('div');
  if(left){
   left.innerHTML=`<span>현재 수업모드</span><b>오늘의 선택형 수업</b><small class="moduleBannerList">${names.length?names.join(' · '):'모듈 미선택'}</small>`;
  }
  let btn=document.getElementById('changeModulesV3Btn');
  if(!btn){
   btn=document.createElement('button');btn.id='changeModulesV3Btn';btn.className='ghost';btn.type='button';btn.textContent='모듈 변경';btn.onclick=openSelector;
   const modeBtn=banner.querySelector('button');
   if(modeBtn)banner.insertBefore(btn,modeBtn);else banner.appendChild(btn);
  }
 }
 window.toggleCareerModuleV3=function(id){
  if(!MODULES.some(m=>m.id===id))return;
  if(selected.has(id))selected.delete(id);else selected.add(id);
  renderSelection();
 };
 window.completeCareerModulesV3=function(){
  if(!selected.size){alert('오늘 진행할 자기이해 모듈을 1개 이상 선택해 주세요.');return}
  writeModules([...selected]);
  closeSelector();
  if(originalSelect)originalSelect('class');
  setTimeout(decorateBanner,0);
 };
 window.backToCourseModeV3=function(){
  closeSelector();
  if(typeof window.changeCourseModeV3==='function')window.changeCourseModeV3();
 };
 window.openCareerModuleSelectorV3=openSelector;
 window.getSelectedCareerModulesV3=function(){return readModules()};
 window.getCareerModuleCatalogV3=function(){return MODULES.map(x=>({...x}))};

 function install(){
  if(typeof window.selectCourseModeV3!=='function'||typeof window.getCourseModeV3!=='function'){
   setTimeout(install,60);return;
  }
  if(!document.getElementById('moduleSelectorV3Style')){
   const style=document.createElement('style');style.id='moduleSelectorV3Style';style.textContent=`
    .moduleSelectorHidden{display:none!important}
    .moduleSelectorV3{background:#fff;border:1px solid var(--line);border-radius:24px;padding:22px;margin:14px 0;box-shadow:0 8px 24px rgba(26,38,68,.05)}
    .moduleSelectorHead{text-align:center;max-width:760px;margin:0 auto 15px}.moduleSelectorEyebrow{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.08em;color:#5548d8;background:#f0efff;border-radius:999px;padding:6px 9px}.moduleSelectorHead h2{font-size:26px;margin:12px 0 7px}.moduleSelectorHead p{margin:0;color:var(--muted);line-height:1.6}
    .moduleRule{max-width:850px;margin:0 auto 16px;border:1px solid #d7e9df;background:#f3fbf6;color:#315c46;border-radius:14px;padding:11px 13px;font-size:13px;line-height:1.55}
    .moduleGrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.moduleCard{position:relative;display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:start;text-align:left;border:2px solid var(--line);border-radius:18px;background:#fff;padding:16px;cursor:pointer;color:var(--text);min-height:148px}.moduleCard:hover,.moduleCard:focus{border-color:#aaa4ef;outline:none}.moduleCard.selected{border-color:#665be8;background:#faf9ff;box-shadow:0 0 0 2px rgba(102,91,232,.08)}.moduleCheck{grid-row:1/5;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#eef0f6;color:#5b6477;font-weight:900}.moduleCard.selected .moduleCheck{background:#5b50dd;color:#fff}.moduleTag{justify-self:start;font-size:10px;font-weight:900;color:#6258c7;background:#f0efff;border-radius:999px;padding:4px 7px}.moduleCard b{font-size:17px;margin-top:4px}.moduleCard small{font-size:12px;color:var(--muted);line-height:1.5;margin-top:5px}.moduleCard em{font-style:normal;font-size:11px;color:#44516a;margin-top:8px;font-weight:700}
    .moduleSelectionDock{display:flex;justify-content:space-between;gap:16px;align-items:center;border:1px solid #dcdcff;background:#f8f8ff;border-radius:17px;padding:14px 15px;margin-top:16px}.moduleSelectionDock span,.moduleSelectionDock b,.moduleSelectionDock small{display:block}.moduleSelectionDock span{font-size:11px;color:var(--muted)}.moduleSelectionDock b{font-size:17px;color:#37308f;margin:2px 0}.moduleSelectionDock small{font-size:11px;color:#66738a;max-width:520px;line-height:1.45}.moduleDockButtons{display:flex;gap:8px;flex:0 0 auto}.moduleBannerList{display:block;margin-top:3px;color:#68738a;font-size:10px;line-height:1.35;max-width:560px}
    @media(max-width:720px){.moduleGrid{grid-template-columns:1fr}.moduleSelectorV3{padding:17px}.moduleSelectorHead h2{font-size:23px}.moduleSelectionDock{align-items:stretch;flex-direction:column}.moduleDockButtons{display:grid;grid-template-columns:1fr 1fr}.moduleDockButtons .btn{width:100%}.courseModeActiveBanner{flex-wrap:wrap}.moduleBannerList{max-width:100%}}
    @media(max-width:480px){.moduleDockButtons{grid-template-columns:1fr}.moduleCard{min-height:136px}}
   `;document.head.appendChild(style);
  }
  originalSelect=window.selectCourseModeV3;
  window.selectCourseModeV3=function(mode){
   if(mode==='class'){openSelector();return}
   originalSelect(mode);
  };
  selected=new Set(readModules());
  const current=window.getCourseModeV3();
  if(current==='class'){
   if(!selected.size)openSelector();else decorateBanner();
  }
 }
 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();

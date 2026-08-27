(function(){
 const PHASE_KEY='careerNavigationWork24PhaseV3';
 const READINESS_VISITED_KEY='careerNavigationReadinessVisitedV3';
 let originalOpenWork24=null;
 let originalGoStep=null;
 let adjusting=false;

 function mode(){return typeof window.getCourseModeV3==='function'?window.getCourseModeV3():'full'}
 function results(){try{return typeof window.getWork24AssessmentResultsV3==='function'?window.getWork24AssessmentResultsV3():{}}catch(e){return{}}}
 function status(id){return results()?.[id]?.status==='complete'}
 function hideWork24(){const s=document.getElementById('work24AssessmentV3');if(s)s.classList.add('work24AssessmentHidden')}
 function showApp(){if(typeof window.setCareerAppVisibleV3==='function')window.setCareerAppVisibleV3(true)}
 function setPhase(value){sessionStorage.setItem(PHASE_KEY,value)}
 function phase(){return sessionStorage.getItem(PHASE_KEY)||'self'}

 function renameStepOne(){
  const nav=document.getElementById('stageNav');
  if(nav){const first=nav.querySelector('.stageChip');if(first&&/직업가치관/.test(first.textContent))first.textContent='1. 나의 선택 기준 발견'}
  const mobile=document.getElementById('mobileStage');
  if(mobile){const b=mobile.querySelector('b');if(b&&/직업가치관/.test(b.textContent))b.textContent='나의 선택 기준 발견'}
  const step=document.querySelector('.step[data-step="1"]');
  if(step){
   [...step.querySelectorAll('h1,h2,h3')].forEach(node=>{
    const text=node.textContent.trim();
    if(text==='직업가치관 발견')node.textContent='나의 선택 기준 발견';
   });
   let note=document.getElementById('step1ValueRoleNoteV3');
   if(!note){
    note=document.createElement('div');note.id='step1ValueRoleNoteV3';note.className='callout';
    note.innerHTML='<b>이 활동의 역할</b><br>고용24 직업가치관검사는 표준화된 공식 결과를 확인하는 검사이고, 이 단계의 밸런스게임과 가치 선택은 <b>내가 실제 선택 상황에서 중요하게 여기는 기준을 돌아보는 수업 활동</b>입니다.';
    const firstHeading=step.querySelector('h2,h1');
    if(firstHeading&&firstHeading.parentNode)firstHeading.insertAdjacentElement('afterend',note);
   }
  }
 }

 function tabByText(text){return [...document.querySelectorAll('#work24AssessmentV3 .w24Tab')].find(x=>x.textContent.includes(text))}
 function setTabVisibility(tab,visible){if(tab)tab.style.display=visible?'':'none'}
 function currentWork24Title(){return document.querySelector('#work24AssessmentV3 .w24TestGuide h3')?.textContent.trim()||''}

 function adjustSelfPhase(){
  const readiness=tabByText('대학생 진로준비도');
  setTabVisibility(readiness,false);
  setTabVisibility(tabByText('직업선호도'),true);
  setTabVisibility(tabByText('직업가치관'),true);
  if(currentWork24Title().includes('대학생 진로준비도')&&typeof window.showWork24ModuleV3==='function'){
   window.showWork24ModuleV3('riasec');return;
  }
  const bottom=document.querySelector('#work24AssessmentV3 .w24Bottom');
  if(!bottom)return;
  const count=['riasec','workvalue'].filter(status).length;
  bottom.innerHTML=`<button type="button" class="btn btnSecondary" onclick="backFromWork24SelfV3()">← 진행방식 선택</button><div><span class="small muted">${count}/2개 자기이해 공식검사 결과 저장</span><button type="button" class="btn btnPrimary" onclick="continueFromWork24SelfV3()">${count===2?'흥미·가치 입력 완료 · 수업 시작 →':'나중에 입력 · 수업 시작 →'}</button></div>`;
 }

 function adjustReadinessPhase(){
  setTabVisibility(tabByText('직업선호도'),false);
  setTabVisibility(tabByText('직업가치관'),false);
  setTabVisibility(tabByText('대학생 진로준비도'),true);
  if(!currentWork24Title().includes('대학생 진로준비도')&&typeof window.showWork24ModuleV3==='function'){
   window.showWork24ModuleV3('careerreadiness');return;
  }
  const head=document.querySelector('#work24AssessmentV3 .w24Head h2');
  const desc=document.querySelector('#work24AssessmentV3 .w24Head p');
  if(head)head.textContent='GAP 분석 전에 현재 진로·취업 준비상태를 확인하세요';
  if(desc)desc.textContent='대학생 진로준비도검사 결과를 입력하면 이후 GAP 분석과 실행계획을 해석할 때 참고할 수 있습니다.';
  const bottom=document.querySelector('#work24AssessmentV3 .w24Bottom');
  if(!bottom)return;
  bottom.innerHTML=`<button type="button" class="btn btnSecondary" onclick="backFromReadinessV3()">← 채용공고 탐색으로</button><div><span class="small muted">${status('careerreadiness')?'진로준비도 결과 저장 완료':'진로준비도 결과 미입력'}</span><button type="button" class="btn btnPrimary" onclick="continueToGapV3()">${status('careerreadiness')?'결과 확인 완료 · GAP 분석으로 →':'나중에 입력 · GAP 분석으로 →'}</button></div>`;
 }

 function adjustWork24(){
  if(adjusting||mode()!=='full')return;
  const screen=document.getElementById('work24AssessmentV3');
  if(!screen||screen.classList.contains('work24AssessmentHidden'))return;
  adjusting=true;
  try{phase()==='readiness'?adjustReadinessPhase():adjustSelfPhase()}finally{adjusting=false}
 }

 window.backFromWork24SelfV3=function(){
  hideWork24();showApp();
  if(typeof window.changeCourseModeV3==='function')window.changeCourseModeV3();
 };
 window.continueFromWork24SelfV3=function(){
  hideWork24();showApp();setPhase('self');
  if(originalGoStep)originalGoStep(1);else if(typeof window.renderProgress==='function')window.renderProgress();
 };
 window.backFromReadinessV3=function(){
  hideWork24();showApp();setPhase('self');
  if(originalGoStep)originalGoStep(9);
 };
 window.continueToGapV3=function(){
  sessionStorage.setItem(READINESS_VISITED_KEY,'1');
  hideWork24();showApp();setPhase('self');
  if(originalGoStep)originalGoStep(10);
 };

 function installWrappers(){
  if(!originalOpenWork24&&typeof window.openWork24AssessmentV3==='function'){
   originalOpenWork24=window.openWork24AssessmentV3;
   window.openWork24AssessmentV3=function(requestedPhase){
    if(mode()==='full')setPhase(requestedPhase==='readiness'?'readiness':'self');
    originalOpenWork24();
    setTimeout(adjustWork24,0);
   };
  }
  if(!originalGoStep&&typeof window.goStep==='function'){
   originalGoStep=window.goStep;
   window.goStep=function(n){
    const target=Number(n);
    if(mode()==='full'&&target===10&&sessionStorage.getItem(READINESS_VISITED_KEY)!=='1'&&originalOpenWork24){
     setPhase('readiness');
     window.openWork24AssessmentV3('readiness');
     return;
    }
    return originalGoStep(n);
   };
  }
 }

 function install(){
  installWrappers();renameStepOne();adjustWork24();
  const observer=new MutationObserver(()=>{installWrappers();renameStepOne();adjustWork24()});
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  setInterval(()=>{installWrappers();renameStepOne();adjustWork24()},500);
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

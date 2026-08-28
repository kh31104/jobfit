(function(){
 const STAGES=['커리어 밸런스 게임','내가 생각하는 나의 흥미','고용24 직업선호도 S형','내가 생각하는 나의 가치','고용24 직업가치관검사','강점 + 경험 + 타인 피드백','VIA 성격강점 TOP5','통합 Career Profile','직무·산업·기업 탐색','실제 채용공고 검증','대학생 진로준비도검사','GAP 분석','30일 Career Action Plan','My Career Roadmap'];
 let installed=false,originalFlow=null,originalGoStep=null,originalGoSubStep=null;
 function isV4(){return /STEP\s+\d+\s*\/\s*13/.test(document.getElementById('stepText')?.textContent||'')||!!document.getElementById('careerFlowV4')&&!document.getElementById('careerFlowV4')?.classList.contains('flowV4Hidden')}
 function logicalStep(){const t=document.getElementById('stepText')?.textContent||'';const m=t.match(/STEP\s+(\d+)\s*\/\s*13/);return m?Number(m[1]):null}
 function mode(){try{return typeof window.getCourseModeV3==='function'?window.getCourseModeV3():'full'}catch(e){return'full'}}
 function selected(){try{return typeof window.getSelectedCareerModulesV3==='function'?window.getSelectedCareerModulesV3():[]}catch(e){return[]}}
 function allowed(){if(mode()!=='class')return STAGES.map((_,i)=>i);const m=selected(),a=[0];if(m.includes('riasec'))a.push(1,2);if(m.includes('workvalue'))a.push(3,4);if(m.includes('via'))a.push(5,6);if(m.includes('careerreadiness'))a.push(10);return [...new Set(a)].sort((a,b)=>a-b)}
 function renderTop(step){const a=allowed(),progress=document.getElementById('progress'),text=document.getElementById('stepText'),mobile=document.getElementById('mobileStage'),nav=document.getElementById('stageNav');if(progress)progress.innerHTML=STAGES.map((_,i)=>`<span class="flowItem ${i<=step?'on':''}" style="display:${a.includes(i)?'block':'none'}"></span>`).join('');if(text)text.textContent=`STEP ${step} / 13 · ${STAGES[step]}`;if(mobile)mobile.innerHTML=`<b>${STAGES[step]}</b><span>STEP ${step} / 13</span>`;if(nav)nav.innerHTML=a.map(i=>`<button class="stageChip ${i===step?'on':''}" onclick="goCareerFlowV4(${i})">${i}. ${STAGES[i]}</button>`).join('')}
 function hideCustom(){const c=document.getElementById('careerFlowV4');if(c)c.classList.add('flowV4Hidden');const w=document.getElementById('work24V4');if(w)w.classList.add('work24V4Hidden')}
 function showApp(){try{if(typeof window.setCareerAppVisibleV3==='function')window.setCareerAppVisibleV3(true)}catch(e){} }
 function legacyStep(step){return step===8?7:step===9?8:step===11?10:step===12?11:step===13?12:null}
 function directLegacy(step){const legacy=legacyStep(step);if(!legacy)return false;hideCustom();showApp();try{current=legacy;currentSub=1;renderProgress()}catch(e){console.error('V4 direct navigation failed',e);return false}setTimeout(()=>{decorate(step);renderTop(step)},30);return true}
 function decorate(step){
  if(step===8){document.querySelectorAll('.step[data-step="7"] .substepNote').forEach(n=>n.textContent='STEP 8 · 직무·산업·기업 탐색');const h=document.querySelector('.step[data-step="7"] h2');if(h&&/Career Fit/i.test(h.textContent))h.textContent='직무·산업·기업 탐색'}
  if(step===9){document.querySelectorAll('.step[data-step="8"] .substepNote').forEach(n=>n.textContent='STEP 9 · 실제 채용공고 검증')}
  if(step===11){document.querySelectorAll('.step[data-step="10"] .substepNote').forEach(n=>n.textContent='STEP 11 · GAP 분석')}
  if(step===12){document.querySelectorAll('.step[data-step="11"] .substepNote').forEach(n=>n.textContent='STEP 12 · 30일 Career Action Plan')}
  if(step===13){document.querySelectorAll('.step[data-step="12"] .substepNote').forEach(n=>n.textContent='STEP 13 · My Career Roadmap')}
 }
 function nextForLegacy(logical,target){
  if(logical===8&&(target===8||target===9))return 9;
  if(logical===9&&target===9)return 9;
  if(logical===9&&target===10)return 10;
  if(logical===11&&target===9)return 9;
  if(logical===11&&target===11)return 12;
  if(logical===12&&target===10)return 11;
  if(logical===12&&target===12)return 13;
  if(logical===13&&target===11)return 12;
  return null;
 }
 function install(){
  if(installed)return;
  if(typeof window.goCareerFlowV4!=='function'||typeof window.goStep!=='function'){setTimeout(install,80);return}
  installed=true;originalFlow=window.goCareerFlowV4;originalGoStep=window.goStep;originalGoSubStep=window.goSubStep;
  window.goCareerFlowV4=function(step){step=Number(step);if([8,9,11,12,13].includes(step)&&isV4())return directLegacy(step);return originalFlow(step)};
  window.goStep=function(n){const l=logicalStep(),target=Number(n);if(isV4()&&l!==null){const mapped=nextForLegacy(l,target);if(mapped!==null)return window.goCareerFlowV4(mapped);if([8,9,11,12,13].includes(l)&&target>=6){const mappedDirect=target===7?8:target===8?9:target===10?11:target===11?12:target===12?13:null;if(mappedDirect!==null)return window.goCareerFlowV4(mappedDirect)}}return originalGoStep(n)};
  window.goSubStep=function(stage,sub){const l=logicalStep();if(isV4()&&l!==null&&l>=8){return originalGoSubStep?originalGoSubStep(stage,sub):undefined}return originalGoSubStep?originalGoSubStep(stage,sub):undefined};
  window.V4_NAVIGATION_GUARD_FIX={version:'1.0',reason:'V4 uses VIA TOP5 and no MI prerequisite'};
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

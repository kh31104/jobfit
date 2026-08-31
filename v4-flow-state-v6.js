(function(){
 const STEP_KEY='careerNavigationLogicalStepV4';
 const MODE_KEY='careerNavigationCourseModeV3';
 let resumed=false;
 function mode(){try{return localStorage.getItem(MODE_KEY)==='class'?'class':'full'}catch(e){return'full'}}
 function saveStep(step){const n=Number(step);if(Number.isInteger(n)&&n>=0&&n<=13)localStorage.setItem(STEP_KEY,String(n))}
 function mainData(){try{return JSON.parse(localStorage.getItem('careerCompassV64')||'{}')}catch(e){return{}}}
 function inferLegacy(){
  const d=mainData();
  const legacy=Number(d.current||0),sub=Number(d.currentSub||1);
  if(legacy===4)return{step:6,sub};
  if(legacy===7)return{step:8,sub:1};
  if(legacy===8||legacy===9)return{step:9,sub:1};
  if(legacy===10)return{step:11,sub:1};
  if(legacy===11)return{step:12,sub:1};
  if(legacy===12)return{step:13,sub:1};
  return null;
 }
 function visibleLogical(){const t=document.getElementById('stepText')?.textContent||'';const m=t.match(/STEP\s*(\d+)\s*\/\s*13/);return m?Number(m[1]):null}
 function patchGo(){
  const fn=window.goCareerFlowV4;
  if(typeof fn!=='function'||fn.__flowStateV6)return false;
  const wrapped=function(step){saveStep(step);return fn.apply(this,arguments)};
  wrapped.__flowStateV6=true;window.goCareerFlowV4=wrapped;return true;
 }
 function resume(){
  if(resumed||mode()!=='full'||typeof window.goCareerFlowV4!=='function')return;
  resumed=true;
  let step=visibleLogical(),sub=1;
  if(step===null){
   const saved=Number(localStorage.getItem(STEP_KEY));
   if(Number.isInteger(saved)&&saved>=0&&saved<=13)step=saved;
   else{const inferred=inferLegacy();if(inferred){step=inferred.step;sub=inferred.sub}}
  }
  if(step===null)return;
  window.goCareerFlowV4(step);
  if(step===6){
   const d=mainData();sub=Number(d.currentSub||sub||1);
   if(sub===2&&typeof window.backToViaFeaturesV4==='function')setTimeout(()=>window.backToViaFeaturesV4(),120);
   if(sub===3&&typeof window.openViaTop5InputV4==='function')setTimeout(()=>window.openViaTop5InputV4(),120);
  }
 }
 function install(){
  if(typeof window.goCareerFlowV4!=='function'){setTimeout(install,80);return}
  patchGo();
  const d=mainData();if(!Object.keys(d).length)localStorage.removeItem(STEP_KEY);
  setTimeout(resume,180);
  setInterval(patchGo,500);
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

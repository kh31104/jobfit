(function(){
 function showViaInput(){
  try{
   const custom=document.getElementById('careerFlowV4');if(custom)custom.classList.add('flowV4Hidden');
   const work=document.getElementById('work24V4');if(work)work.classList.add('work24V4Hidden');
   if(typeof window.setCareerAppVisibleV3==='function')window.setCareerAppVisibleV3(true);
   current=4;currentSub=3;
   if(typeof renderProgress==='function')renderProgress();
   setTimeout(()=>{
    try{
     const saved=typeof readRanks==='function'?readRanks('via'):[];
     if(typeof renderRanks==='function'&&typeof VIA!=='undefined')renderRanks('via',VIA,saved);
    }catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
   },60);
  }catch(e){console.error('VIA input transition failed',e)}
 }
 function showViaFeatures(){
  try{
   if(typeof window.setCareerAppVisibleV3==='function')window.setCareerAppVisibleV3(true);
   current=4;currentSub=2;
   if(typeof renderProgress==='function')renderProgress();
   window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){console.error('VIA features transition failed',e)}
 }
 window.openViaTop5InputV4=showViaInput;
 window.backToViaFeaturesV4=showViaFeatures;
 function patchButtons(){
  const step2=document.querySelector('.step[data-step="4"][data-substep="2"]');
  if(step2){
   [...step2.querySelectorAll('button')].forEach(btn=>{
    const t=(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(/VIA\s*TOP\s*(3|5)|내 VIA/.test(t)&&/입력/.test(t)){
     btn.onclick=function(e){e.preventDefault();e.stopPropagation();showViaInput()};
     btn.setAttribute('onclick','openViaTop5InputV4(); return false;');
     btn.textContent='내 VIA TOP5 입력 →';
    }
   });
  }
  const step3=document.querySelector('.step[data-step="4"][data-substep="3"]');
  if(step3){
   [...step3.querySelectorAll('button')].forEach(btn=>{
    const t=(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(t==='← 이전'||t.includes('특징 보기')){
     btn.onclick=function(e){e.preventDefault();e.stopPropagation();showViaFeatures()};
     btn.setAttribute('onclick','backToViaFeaturesV4(); return false;');
    }
   });
  }
 }
 function install(){patchButtons();const observer=new MutationObserver(patchButtons);observer.observe(document.body,{childList:true,subtree:true});setInterval(patchButtons,500)}
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

(function(){
 const WORK_KEY='careerNavigationWork24ResultsV3';
 function install(){
  if(typeof window.goCareerFlowV4!=='function'||typeof window.readRanks!=='function'){setTimeout(install,80);return}
  const originalOpen=window.openWork24AssessmentV4;
  if(typeof originalOpen==='function')window.openWork24AssessmentV4=function(id,opts){try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}return originalOpen(id,opts)};
  window.updateWork24V4Score=function(id,key,value){
   let x={};try{x=JSON.parse(localStorage.getItem(WORK_KEY)||'{}')}catch(e){}
   x.riasec=x.riasec||{scores:{},status:'draft',completedAt:''};x.riasec.scores=x.riasec.scores||{};
   x.careerreadiness=x.careerreadiness||{scores:{},status:'draft',completedAt:''};x.careerreadiness.scores=x.careerreadiness.scores||{};
   if(id!=='riasec'&&id!=='careerreadiness')return;
   x[id].scores[key]=String(value??'').trim()===''?'':Number(value);x[id].status='draft';x[id].completedAt='';localStorage.setItem(WORK_KEY,JSON.stringify(x));
  };
  const originalGo=window.goCareerFlowV4;
  window.goCareerFlowV4=function(step){
   try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}
   const r=originalGo(step);
   if(Number(step)===6)setTimeout(()=>{
    try{const d=JSON.parse(localStorage.getItem('careerCompassV64')||'{}'),saved=Array.isArray(d.via)?d.via.slice(0,5):[];if(saved.length&&typeof renderRanks==='function'&&typeof VIA!=='undefined')renderRanks('via',VIA,saved)}catch(e){}
   },120);
   return r;
  };
  const originalRead=window.readRanks;
  window.readRanks=function(prefix){if(prefix==='mi')return[];return originalRead(prefix)};
  const originalToggle=window.toggleValueV4;
  if(typeof originalToggle==='function')window.toggleValueV4=function(v){const r=originalToggle(v);try{window.selectedValues=[...selectedValues]}catch(e){}return r};
  try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}
 }
 if(document.readyState==='complete')setTimeout(install,180);else window.addEventListener('load',()=>setTimeout(install,180),{once:true});
})();
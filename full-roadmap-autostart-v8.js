(function(){
  function boot(){
    try{
      if(typeof window.getCourseModeV3!=='function'||typeof window.startCareerFlowV4!=='function'){
        setTimeout(boot,80);return;
      }
      if(window.getCourseModeV3()!=='full')return;
      window.startCareerFlowV4('full');
    }catch(e){console.error('Full roadmap V8 autostart failed',e)}
  }
  if(document.readyState==='complete')setTimeout(boot,120);
  else window.addEventListener('load',()=>setTimeout(boot,120),{once:true});
})();

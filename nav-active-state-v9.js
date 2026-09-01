(function(){
  function sync(step){
    step=Number(step);
    if(!Number.isFinite(step))return;
    const nav=document.getElementById('stageNav');
    if(nav){
      [...nav.querySelectorAll('button.stageChip')].forEach(btn=>{
        const m=String(btn.textContent||'').trim().match(/^(\d+)\./);
        btn.classList.toggle('on',!!m&&Number(m[1])===step);
      });
    }
    const text=document.getElementById('stepText');
    const mobile=document.getElementById('mobileStage');
    if(text&&window.__careerStagesV9?.[step])text.textContent=`STEP ${step} / 13 · ${window.__careerStagesV9[step]}`;
    if(mobile&&window.__careerStagesV9?.[step])mobile.innerHTML=`<b>${window.__careerStagesV9[step]}</b><span>STEP ${step} / 13</span>`;
  }
  window.__careerStagesV9=['커리어 밸런스 게임','내가 생각하는 나의 흥미','고용24 직업선호도 S형','내가 생각하는 나의 가치','고용24 직업가치관검사','강점 + 경험 + 타인 피드백','VIA 성격강점 TOP5','통합 Career Profile','직무·산업·기업 탐색','실제 채용공고 검증','대학생 진로준비도검사','GAP 분석','30일 Career Action Plan','My Career Roadmap'];
  function install(){
    if(typeof window.goCareerFlowV4!=='function'){setTimeout(install,80);return;}
    if(!window.__navStateWrappedV9){
      const oldGo=window.goCareerFlowV4;
      window.goCareerFlowV4=function(step){
        let result;
        try{result=oldGo.apply(this,arguments)}finally{setTimeout(()=>sync(step),0)}
        return result;
      };
      if(typeof window.openWork24AssessmentV4==='function'){
        const oldOpen=window.openWork24AssessmentV4;
        window.openWork24AssessmentV4=function(id,opts){
          const result=oldOpen.apply(this,arguments);
          const step=id==='riasec'?2:id==='workvalue'?4:id==='careerreadiness'?10:null;
          if(step!==null)setTimeout(()=>sync(step),0);
          return result;
        };
      }
      window.__navStateWrappedV9=true;
    }
  }
  if(document.readyState==='complete')install();
  else window.addEventListener('load',install,{once:true});
})();

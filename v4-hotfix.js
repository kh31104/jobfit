(function(){
 const WORK_KEY='careerNavigationWork24ResultsV3';
 function restoreScroll(y){
  const top=Math.max(0,Number(y)||0);
  requestAnimationFrame(()=>window.scrollTo({top,behavior:'auto'}));
  setTimeout(()=>window.scrollTo({top,behavior:'auto'}),40);
  setTimeout(()=>window.scrollTo({top,behavior:'auto'}),140);
 }
 function keepScroll(fn){
  if(typeof fn!=='function'||fn.__careerKeepScrollV4)return fn;
  const wrapped=function(...args){
   const y=window.scrollY||window.pageYOffset||0;
   let result;
   try{result=fn.apply(this,args)}catch(e){restoreScroll(y);throw e}
   if(result&&typeof result.then==='function')return result.finally(()=>restoreScroll(y));
   restoreScroll(y);return result;
  };
  wrapped.__careerKeepScrollV4=true;
  return wrapped;
 }
 function voteScope(repo){
  if(repo&&typeof repo.sessionLabel==='function')return repo.sessionLabel();
  return repo&&typeof repo.sessionCode==='function'&&repo.sessionCode()!=='GLOBAL'?'이 수업':'전체 누적';
 }
 async function refreshV4VoteCounts(){
  const repo=window.CareerVoteRepository;
  if(!repo||typeof repo.counts!=='function')return;
  const scope=voteScope(repo);
  await Promise.all([0,1,2,3,4,5,6].map(async i=>{
   const r=document.getElementById('f4Vote'+i);if(!r)return;
   try{
    const c=await repo.counts(i);
    const a=Number(c.a||0),b=Number(c.b||0),total=Number(c.total??(a+b));
    const ap=Number(c.aPercent??(total?a/total*100:0));
    const bp=Number(c.bPercent??(total?b/total*100:0));
    r.innerHTML=`<div class="voteStat"><b>A ${ap.toFixed(1)}%</b> · ${a}표</div><div class="voteStat"><b>B ${bp.toFixed(1)}%</b> · ${b}표</div><div class="small muted" style="grid-column:1/-1;margin-top:6px">${scope} ${total}명 기준</div>`;
   }catch(e){
    console.error('V4 Supabase vote count failed',e);
    r.innerHTML='<div class="voteStat" style="grid-column:1/-1">현재 실제 참여자 투표율을 불러오지 못했습니다.</div>';
   }
  }));
 }
 function scheduleVoteRefresh(){
  setTimeout(refreshV4VoteCounts,80);
  setTimeout(refreshV4VoteCounts,350);
 }
 async function syncCurrentV4Votes(){
  const repo=window.CareerVoteRepository;
  if(!repo||typeof repo.vote!=='function'||!Array.isArray(window.balanceAnswers)&&typeof balanceAnswers==='undefined')return;
  let answers=[];try{answers=Array.isArray(balanceAnswers)?balanceAnswers:[]}catch(e){return}
  const sig=answers.map(x=>String(x||'').toLowerCase()).join('|');
  if(!sig.replaceAll('|',''))return;
  const session=typeof repo.sessionCode==='function'?repo.sessionCode():'UNKNOWN';
  const key=`careerVoteSyncV4:${session}`;
  if(localStorage.getItem(key)===sig){scheduleVoteRefresh();return}
  for(let i=0;i<Math.min(7,answers.length);i++){
   const c=String(answers[i]||'').toLowerCase();
   if(c==='a'||c==='b'){
    try{await repo.vote(i,c)}catch(e){console.error('V4 vote sync failed',i,e)}
   }
  }
  localStorage.setItem(key,sig);
  scheduleVoteRefresh();
 }
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
   if(Number(step)===0)setTimeout(syncCurrentV4Votes,120);
   if(Number(step)===6)setTimeout(()=>{
    try{const d=JSON.parse(localStorage.getItem('careerCompassV64')||'{}'),saved=Array.isArray(d.via)?d.via.slice(0,5):[];if(saved.length&&typeof renderRanks==='function'&&typeof VIA!=='undefined')renderRanks('via',VIA,saved)}catch(e){}
   },120);
   return r;
  };
  const originalRead=window.readRanks;
  window.readRanks=function(prefix){if(prefix==='mi')return[];return originalRead(prefix)};

  const originalToggleValue=window.toggleValueV4;
  if(typeof originalToggleValue==='function'){
   window.toggleValueV4=keepScroll(function(v){
    const r=originalToggleValue(v);
    try{window.selectedValues=[...selectedValues]}catch(e){}
    return r;
   });
  }
  if(typeof window.toggleInterestV4==='function')window.toggleInterestV4=keepScroll(window.toggleInterestV4);

  const originalChooseIce=window.chooseIceV4;
  if(typeof originalChooseIce==='function'){
   window.chooseIceV4=keepScroll(async function(i,c){
    const previous=String((balanceAnswers||[])[i]||'').toLowerCase();
    if(previous===String(c).toLowerCase()){scheduleVoteRefresh();return}
    await originalChooseIce(i,c);
    try{
     if(window.CareerVoteRepository&&typeof window.CareerVoteRepository.vote==='function'){
      await window.CareerVoteRepository.vote(i,c);
      const session=window.CareerVoteRepository.sessionCode?.()||'UNKNOWN';
      try{localStorage.removeItem(`careerVoteSyncV4:${session}`)}catch(e){}
     }
    }catch(e){console.error('V4 Supabase vote save failed',e)}
    scheduleVoteRefresh();
   });
  }

  try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}
  if(/STEP\s*0\s*\/\s*13/.test(document.getElementById('stepText')?.textContent||''))setTimeout(syncCurrentV4Votes,120);
 }
 window.refreshCareerVoteCountsV4=refreshV4VoteCounts;
 window.syncCareerVotesV4=syncCurrentV4Votes;
 if(document.readyState==='complete')setTimeout(install,180);else window.addEventListener('load',()=>setTimeout(install,180),{once:true});
})();
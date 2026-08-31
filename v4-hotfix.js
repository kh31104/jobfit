(function(){
 const WORK_KEY='careerNavigationWork24ResultsV3';
 const SELF_KEY='careerNavigationSelfAwarenessV4';
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
 function scheduleVoteRefresh(){setTimeout(refreshV4VoteCounts,80);setTimeout(refreshV4VoteCounts,350)}
 async function syncCurrentV4Votes(){
  const repo=window.CareerVoteRepository;
  if(!repo||typeof repo.vote!=='function'||(!Array.isArray(window.balanceAnswers)&&typeof balanceAnswers==='undefined'))return;
  let answers=[];try{answers=Array.isArray(balanceAnswers)?balanceAnswers:[]}catch(e){return}
  const sig=answers.map(x=>String(x||'').toLowerCase()).join('|');
  if(!sig.replaceAll('|',''))return;
  const session=typeof repo.sessionCode==='function'?repo.sessionCode():'UNKNOWN';
  const key=`careerVoteSyncV4:${session}`;
  if(localStorage.getItem(key)===sig){scheduleVoteRefresh();return}
  for(let i=0;i<Math.min(7,answers.length);i++){
   const c=String(answers[i]||'').toLowerCase();
   if(c==='a'||c==='b'){try{await repo.vote(i,c)}catch(e){console.error('V4 vote sync failed',i,e)}}
  }
  localStorage.setItem(key,sig);scheduleVoteRefresh();
 }
 function viaSaved(){
  try{const d=JSON.parse(localStorage.getItem('careerCompassV64')||'{}');return Array.isArray(d.via)?d.via.slice(0,5):[]}catch(e){return[]}
 }
 function viaSelection(){
  const saved=viaSaved();
  return [1,2,3,4,5].map((n,i)=>document.getElementById('via'+n)?.value||saved[i]||'');
 }
 function viaEsc(v){
  try{return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}catch(e){return String(v??'')}
 }
 let viaRepairing=false;
 function ensureViaTop5Rows(){
  const box=document.getElementById('viaRankRows');
  if(!box||typeof VIA==='undefined'||!Array.isArray(VIA)||viaRepairing)return;
  const hasFive=[1,2,3,4,5].every(n=>document.getElementById('via'+n));
  if(hasFive)return;
  viaRepairing=true;
  const selected=viaSelection();
  box.innerHTML=[1,2,3,4,5].map((n,i)=>`<div class="rankRow"><div class="rankHead"><div class="rankN">${n}</div><b>VIA 강점 ${n}위</b></div><select id="via${n}" onchange="rankChanged('via',${n})"><option value="">선택하세요</option>${VIA.map(x=>`<option value="${viaEsc(x.key)}" ${selected[i]===x.key?'selected':''}>${viaEsc(x.key)} · ${viaEsc(x.en)}</option>`).join('')}</select><div class="rankPreview" id="viaPreview${n}">결과를 선택하면 특징이 표시됩니다.</div></div>`).join('');
  [1,2,3,4,5].forEach(n=>{try{if(typeof updatePreview==='function')updatePreview('via',n)}catch(e){}});
  viaRepairing=false;
 }
 function scheduleViaTop5(){setTimeout(ensureViaTop5Rows,20);setTimeout(ensureViaTop5Rows,120);setTimeout(ensureViaTop5Rows,350)}
 function watchViaRows(){
  const box=document.getElementById('viaRankRows');if(!box||box.__viaTop5Observer)return;
  const observer=new MutationObserver(()=>{if(!viaRepairing&&![1,2,3,4,5].every(n=>document.getElementById('via'+n)))setTimeout(ensureViaTop5Rows,0)});
  observer.observe(box,{childList:true});box.__viaTop5Observer=observer;scheduleViaTop5();
 }
 function isFullRoadmap(){
  try{return typeof window.getCourseModeV3==='function'?window.getCourseModeV3()!=='class':localStorage.getItem('careerNavigationCourseModeV3')!=='class'}catch(e){return true}
 }
 function normalizeV4Layout(){
  const main=document.querySelector('.wrap > main');if(!main||!main.parentNode)return;
  const parent=main.parentNode;
  const flow=document.getElementById('careerFlowV4');
  const work=document.getElementById('work24V4');
  if(flow&&flow.parentNode===parent)parent.insertBefore(flow,main);
  if(work&&work.parentNode===parent)parent.insertBefore(work,main);
 }
 function hideFlowV4(){const s=document.getElementById('careerFlowV4');if(s)s.classList.add('flowV4Hidden')}
 function hideWork24V4(){const s=document.getElementById('work24V4');if(s)s.classList.add('work24V4Hidden')}
 function ensureRoadmapNavStyle(){
  if(document.getElementById('careerRoadmapNavV4Style'))return;
  const s=document.createElement('style');s.id='careerRoadmapNavV4Style';
  s.textContent=`body.careerFullRoadmapV4 .stageToggle{display:none!important}body.careerFullRoadmapV4 .stageNav,body.careerFullRoadmapV4 .stageNav.hiddenStages{display:flex!important;grid-template-columns:none!important;gap:8px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:thin;position:sticky;top:0;z-index:35;background:rgba(248,249,255,.97);backdrop-filter:blur(10px);padding:9px 3px 11px;margin:0 0 8px;border-bottom:1px solid rgba(228,232,241,.9)}body.careerFullRoadmapV4 .stageNav .stageChip{flex:0 0 auto;width:auto;min-width:max-content;padding:9px 12px;border-radius:999px;font-size:12px}@media(max-width:600px){body.careerFullRoadmapV4 .stageNav,body.careerFullRoadmapV4 .stageNav.hiddenStages{margin-left:-2px;margin-right:-2px;padding-left:2px;padding-right:2px}body.careerFullRoadmapV4 .stageNav .stageChip{font-size:11px;padding:8px 10px}}`;
  document.head.appendChild(s);
 }
 function centerActiveStage(){
  const nav=document.getElementById('stageNav'),on=nav?.querySelector('.stageChip.on');if(!nav||!on)return;
  const target=Math.max(0,on.offsetLeft-(nav.clientWidth-on.offsetWidth)/2);
  nav.scrollTo({left:target,behavior:'smooth'});
 }
 function refreshFullRoadmapNav(){
  ensureRoadmapNavStyle();normalizeV4Layout();const full=isFullRoadmap();document.body.classList.toggle('careerFullRoadmapV4',full);
  const nav=document.getElementById('stageNav'),toggle=document.getElementById('stageToggle');
  if(full&&nav){nav.classList.remove('hiddenStages');if(toggle)toggle.style.display='none';setTimeout(centerActiveStage,30)}
  else if(toggle)toggle.style.display='';
 }
 function refreshInterestSaveButton(){
  const root=document.getElementById('careerFlowV4');if(!root)return;
  const btn=[...root.querySelectorAll('button.btnPrimary')].find(b=>/고용24\s*S형|completeInterestV4/.test((b.textContent||'')+' '+(b.getAttribute('onclick')||'')));
  if(!btn)return;btn.textContent='저장';btn.setAttribute('onclick','saveInterestOnlyV4()');
 }
 window.saveInterestOnlyV4=function(){
  let x={};try{x=JSON.parse(localStorage.getItem(SELF_KEY)||'{}')}catch(e){}
  x.interest=x.interest||{selected:[],note:'',done:false};
  const selected=Array.isArray(x.interest.selected)?x.interest.selected:[];
  if(selected.length!==3){alert('내가 생각하는 흥미 TOP3를 모두 선택해 주세요.');return}
  x.interest.done=true;localStorage.setItem(SELF_KEY,JSON.stringify(x));
  const root=document.getElementById('careerFlowV4');const btn=[...root?.querySelectorAll('button.btnPrimary')||[]].find(b=>(b.getAttribute('onclick')||'').includes('saveInterestOnlyV4'));
  if(btn){btn.textContent='✓ 저장됨';setTimeout(()=>{if(document.body.contains(btn))btn.textContent='저장'},1200)}
 };
 function install(){
  if(typeof window.goCareerFlowV4!=='function'||typeof window.readRanks!=='function'){setTimeout(install,80);return}
  const originalOpen=window.openWork24AssessmentV4;
  if(typeof originalOpen==='function')window.openWork24AssessmentV4=function(id,opts){
   hideFlowV4();
   try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}
   const r=originalOpen(id,opts);
   setTimeout(()=>{normalizeV4Layout();refreshFullRoadmapNav()},0);
   return r;
  };
  window.updateWork24V4Score=function(id,key,value){
   let x={};try{x=JSON.parse(localStorage.getItem(WORK_KEY)||'{}')}catch(e){}
   x.riasec=x.riasec||{scores:{},status:'draft',completedAt:''};x.riasec.scores=x.riasec.scores||{};
   x.careerreadiness=x.careerreadiness||{scores:{},status:'draft',completedAt:''};x.careerreadiness.scores=x.careerreadiness.scores||{};
   if(id!=='riasec'&&id!=='careerreadiness')return;
   x[id].scores[key]=String(value??'').trim()===''?'':Number(value);x[id].status='draft';x[id].completedAt='';localStorage.setItem(WORK_KEY,JSON.stringify(x));
  };
  const originalGo=window.goCareerFlowV4;
  window.goCareerFlowV4=function(step){
   step=Number(step);
   if(![2,4,10].includes(step))hideWork24V4();
   try{if(typeof selectedValues!=='undefined')window.selectedValues=[...selectedValues]}catch(e){}
   const r=originalGo(step);
   if(step===0)setTimeout(syncCurrentV4Votes,120);
   if(step===1)setTimeout(refreshInterestSaveButton,25);
   if(step===6){scheduleViaTop5();setTimeout(watchViaRows,80)}
   setTimeout(()=>{normalizeV4Layout();refreshFullRoadmapNav()},30);return r;
  };
  const originalSub=window.goSubStep;
  if(typeof originalSub==='function'&&!originalSub.__viaTop5Wrapped){
   const wrappedSub=function(stage,sub){
    if(Number(stage)===5&&/STEP\s*6\s*\/\s*13/.test(document.getElementById('stepText')?.textContent||''))return window.goCareerFlowV4(7);
    const r=originalSub(stage,sub);if(Number(stage)===4){scheduleViaTop5();setTimeout(watchViaRows,60)}setTimeout(()=>{normalizeV4Layout();refreshFullRoadmapNav()},20);return r
   };
   wrappedSub.__viaTop5Wrapped=true;window.goSubStep=wrappedSub;
  }
  window.finishVia=function(){
   ensureViaTop5Rows();
   const a=[1,2,3,4,5].map(n=>document.getElementById('via'+n)?.value||'');
   if(a.some(x=>!x)){alert('VIA 상위 5개를 모두 선택해 주세요.');return}
   if(new Set(a).size<5){alert('VIA 결과가 중복되어 있습니다.');return}
   try{if(typeof save==='function')save()}catch(e){}
   window.goCareerFlowV4(7);
  };
  const originalRead=window.readRanks;
  window.readRanks=function(prefix){if(prefix==='mi')return[];return originalRead(prefix)};
  const originalToggleValue=window.toggleValueV4;
  if(typeof originalToggleValue==='function'){
   window.toggleValueV4=keepScroll(function(v){const r=originalToggleValue(v);try{window.selectedValues=[...selectedValues]}catch(e){}return r});
  }
  const originalToggleInterest=window.toggleInterestV4;
  if(typeof originalToggleInterest==='function')window.toggleInterestV4=keepScroll(function(...args){const r=originalToggleInterest.apply(this,args);setTimeout(refreshInterestSaveButton,0);return r});
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
  normalizeV4Layout();watchViaRows();scheduleViaTop5();refreshFullRoadmapNav();refreshInterestSaveButton();
  const stageNav=document.getElementById('stageNav');if(stageNav&&!stageNav.__careerNavObserver){const ob=new MutationObserver(()=>setTimeout(()=>{normalizeV4Layout();refreshFullRoadmapNav();centerActiveStage()},0));ob.observe(stageNav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});stageNav.__careerNavObserver=ob}
  if(/STEP\s*0\s*\/\s*13/.test(document.getElementById('stepText')?.textContent||''))setTimeout(syncCurrentV4Votes,120);
 }
 window.refreshCareerVoteCountsV4=refreshV4VoteCounts;
 window.syncCareerVotesV4=syncCurrentV4Votes;
 window.ensureViaTop5RowsV4=ensureViaTop5Rows;
 window.refreshFullRoadmapNavV4=refreshFullRoadmapNav;
 window.normalizeV4Layout=normalizeV4Layout;
 if(document.readyState==='complete')setTimeout(install,180);else window.addEventListener('load',()=>setTimeout(install,180),{once:true});
})();
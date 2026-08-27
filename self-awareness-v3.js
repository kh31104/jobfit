(function(){
 const KEY='careerNavigationSelfAwarenessV3';
 const WORK24_RESULT_KEY='careerNavigationWork24ResultsV3';
 const INTERESTS=[
  {id:'R',title:'직접 만들고 움직이기',desc:'도구를 사용하거나 직접 만들어 보고, 몸을 움직이며 결과를 확인하는 활동',examples:'조립 · 제작 · 현장활동 · 기계·도구 사용 · 실습'},
  {id:'I',title:'분석하고 탐구하기',desc:'원인을 찾고 자료를 분석하며, 새로운 사실이나 원리를 알아가는 활동',examples:'분석 · 실험 · 조사 · 문제해결 · 연구'},
  {id:'A',title:'표현하고 창작하기',desc:'새로운 아이디어를 만들고 글·그림·영상·음악 등으로 자유롭게 표현하는 활동',examples:'기획 · 디자인 · 글쓰기 · 콘텐츠 · 창작'},
  {id:'S',title:'돕고 가르치기',desc:'사람의 이야기를 듣고 도움을 주거나, 설명하고 성장할 수 있도록 지원하는 활동',examples:'교육 · 상담 · 코칭 · 봉사 · 협력'},
  {id:'E',title:'설득하고 이끌기',desc:'사람에게 제안하고 영향을 주며, 목표를 정하고 일을 주도해 결과를 만들어가는 활동',examples:'발표 · 설득 · 리더십 · 영업 · 사업기획'},
  {id:'C',title:'정리하고 체계화하기',desc:'정보와 절차를 정확하게 정리하고, 기준에 따라 계획적으로 관리하는 활동',examples:'자료정리 · 관리 · 계획 · 회계 · 운영'}
 ];
 let state=readState();
 let screenMode='ice';
 let originalRenderProgress=null;
 let originalGoStep=null;
 let originalWork24Open=null;
 let originalCompleteModules=null;

 function defaultState(){return{icebreakerDone:false,icebreakerSkipped:false,interestDone:false,interest:{selected:[],note:''}}}
 function readState(){
  const base=defaultState();
  try{
   const x=JSON.parse(localStorage.getItem(KEY)||'{}');
   return {...base,...x,interest:{...base.interest,...(x.interest||{}),selected:Array.isArray(x.interest?.selected)?x.interest.selected.filter(id=>INTERESTS.some(z=>z.id===id)).slice(0,3):[]}};
  }catch(e){return base}
 }
 function saveState(){localStorage.setItem(KEY,JSON.stringify(state))}
 function escText(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function selectedModules(){try{return typeof window.getSelectedCareerModulesV3==='function'?window.getSelectedCareerModulesV3():[]}catch(e){return[]}}
 function courseMode(){try{return typeof window.getCourseModeV3==='function'?window.getCourseModeV3():''}catch(e){return''}}
 function needsInterest(){const mode=courseMode();return mode==='full'||(mode==='class'&&selectedModules().includes('riasec'))}
 function setAppVisible(visible){
  if(typeof window.setCareerAppVisibleV3==='function'){window.setCareerAppVisibleV3(visible);return}
  ['progress','stepText','mobileStage','stageToggle','stageNav'].forEach(id=>{const n=document.getElementById(id);if(n)n.classList.toggle('selfAwarenessHidden',!visible)});
  const main=document.querySelector('.wrap > main');if(main)main.classList.toggle('selfAwarenessHidden',!visible);
  const banner=document.getElementById('courseModeActiveBanner');if(banner)banner.classList.toggle('selfAwarenessHidden',!visible);
 }
 function ensureStyle(){
  if(document.getElementById('selfAwarenessV3Style'))return;
  const style=document.createElement('style');style.id='selfAwarenessV3Style';style.textContent=`
   .selfAwarenessHidden{display:none!important}.selfAwarenessScreen{background:#fff;border:1px solid var(--line);border-radius:24px;padding:22px;margin:14px 0;box-shadow:0 8px 24px rgba(26,38,68,.05)}
   .saHead{text-align:center;max-width:800px;margin:0 auto 17px}.saEyebrow{display:inline-block;font-size:10px;font-weight:900;letter-spacing:.08em;color:#5548d8;background:#f0efff;border-radius:999px;padding:6px 9px}.saHead h2{font-size:27px;margin:11px 0 7px}.saHead p{color:var(--muted);line-height:1.65;margin:0}.saRule{border:1px solid #d7e9df;background:#f3fbf6;color:#315c46;border-radius:14px;padding:11px 13px;margin:13px 0;font-size:12px;line-height:1.55}
   .saInterestGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.saInterestCard{position:relative;border:2px solid var(--line);border-radius:18px;background:#fff;padding:16px;text-align:left;cursor:pointer;color:var(--text);min-height:142px}.saInterestCard:hover,.saInterestCard:focus{border-color:#aaa4ef;outline:none}.saInterestCard.selected{border-color:#655ae7;background:#faf9ff}.saInterestRank{position:absolute;right:12px;top:12px;border-radius:999px;background:#5b50dd;color:#fff;padding:5px 8px;font-size:10px;font-weight:900}.saInterestCard b{display:block;font-size:17px;padding-right:52px;margin-bottom:6px}.saInterestCard p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}.saInterestCard small{display:block;color:#536078;margin-top:8px;font-size:11px;line-height:1.45}.saSelection{margin-top:13px;border:1px solid #ddd9ff;background:#f8f7ff;border-radius:15px;padding:12px 13px}.saSelection b{font-size:12px;color:#423a9d}.saNote{margin-top:14px}.saNote label{display:block;font-size:13px;font-weight:900;margin-bottom:6px}.saActions{display:flex;justify-content:space-between;align-items:center;gap:9px;margin-top:17px}.saActions>div{display:flex;gap:8px}.saIceNote{background:#fff9eb;border:1px solid #f2dfb7;border-radius:14px;padding:11px 13px;color:#6b5524;font-size:12px;line-height:1.55;margin:13px 0}.saIceSummary{background:#f8f7ff;border:1px solid #ddd9ff;border-radius:16px;padding:14px;margin-top:13px}.saIceSummary h3{margin:3px 0 8px;font-size:17px}
   @media(max-width:700px){.saInterestGrid{grid-template-columns:1fr}.selfAwarenessScreen{padding:17px}.saHead h2{font-size:23px}.saActions{align-items:stretch;flex-direction:column}.saActions>div{display:grid;grid-template-columns:1fr 1fr;width:100%}.saActions .btn{width:100%}}
   @media(max-width:460px){.saActions>div{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
 }
 function ensureScreen(){
  let screen=document.getElementById('selfAwarenessScreenV3');
  if(!screen){
   screen=document.createElement('section');screen.id='selfAwarenessScreenV3';
   const mode=document.getElementById('courseModeScreenV3'),hero=document.querySelector('.hero');
   if(mode&&mode.parentNode)mode.parentNode.insertBefore(screen,mode.nextSibling);else if(hero&&hero.parentNode)hero.parentNode.insertBefore(screen,hero.nextSibling);
  }
  return screen;
 }
 function hideOtherScreens(){
  const ids=['courseModeScreenV3','moduleSelectorV3','work24AssessmentV3'];
  ids.forEach(id=>{const n=document.getElementById(id);if(n)n.classList.add(id==='courseModeScreenV3'?'courseModeHidden':id==='moduleSelectorV3'?'moduleSelectorHidden':'work24AssessmentHidden')});
 }
 function iceSummary(){
  if(typeof competitionRanking!=='function'||typeof valueLabel!=='function')return '';
  const ranked=competitionRanking().slice(0,3);
  if(!ranked.length)return '';
  return `<div class="saIceSummary"><span class="small muted">오늘의 선택 경향</span><h3>내 선택에서 자주 나타난 키워드</h3><div class="pillbox">${ranked.map(x=>`<span class="pill">${escText(valueLabel(x.value))} ${x.count}회</span>`).join('')}</div><p class="small muted">이 결과는 아이스브레이킹용이며 이후 검사점수·직무추천에는 반영하지 않습니다.</p></div>`;
 }
 async function renderIce(){
  const screen=ensureScreen();screenMode='ice';screen.className='selfAwarenessScreen';
  const answers=Array.isArray(balanceAnswers)?balanceAnswers:[];
  screen.innerHTML=`<div class="saHead"><span class="saEyebrow">STEP 0 · ICE BREAKING</span><h2>커리어 밸런스 게임</h2><p>정답은 없습니다. 오래 고민하지 말고 지금의 나라면 어느 쪽을 고를지 빠르게 선택해보세요.</p></div><div class="saIceNote"><b>재미로 시작하는 워밍업입니다.</b> 다른 참여자들은 어떤 선택을 했는지 확인할 수 있지만, 이 결과는 이후의 직업가치관 검사나 직무추천에 사용하지 않습니다.</div><div id="saBalanceQuestions">${BALANCE_QUESTIONS.map((q,i)=>{const a=String(answers[i]||'').toLowerCase();return `<div class="balanceCard"><h3>${i+1}. 나의 선택은?</h3><div class="choiceGrid"><button class="choiceBtn ${a==='a'?'selected':''}" onclick="chooseCareerIcebreakerV3(${i},'a')"><b>A</b><br>${escText(q.a)}</button><button class="choiceBtn ${a==='b'?'selected':''}" onclick="chooseCareerIcebreakerV3(${i},'b')"><b>B</b><br>${escText(q.b)}</button></div><div class="voteResult" id="saVoteResult${i}"><div class="voteStat">A 집계 중</div><div class="voteStat">B 집계 중</div></div>${a?`<div class="valueHint">나의 선택 키워드 · ${escText(valueLabel(a==='a'?q.av:q.bv))}</div>`:''}</div>`}).join('')}</div><div id="saIceSummary">${answers.filter(Boolean).length===7?iceSummary():''}</div><div class="saActions"><button type="button" class="btn btnSecondary" onclick="skipCareerIcebreakerV3()">아이스브레이킹 건너뛰기</button><div><button type="button" class="btn btnPrimary" onclick="completeCareerIcebreakerV3()">${needsInterest()?'선택 완료 · 자기이해 시작 →':'선택 완료 · 수업 시작 →'}</button></div></div>`;
  BALANCE_QUESTIONS.forEach(async(_,i)=>{
   try{const c=await VoteRepository.counts(i),total=(c.a||0)+(c.b||0),ap=total?Math.round((c.a||0)/total*100):0,bp=total?100-ap:0,r=document.getElementById('saVoteResult'+i);if(r)r.innerHTML=`<div class="voteStat"><b>A ${ap}%</b> · ${c.a||0}표</div><div class="voteStat"><b>B ${bp}%</b> · ${c.b||0}표</div>`}catch(e){}
  });
 }
 function renderInterest(){
  const screen=ensureScreen();screenMode='interest';screen.className='selfAwarenessScreen';
  const selected=state.interest.selected||[];
  screen.innerHTML=`<div class="saHead"><span class="saEyebrow">STEP 1 · SELF AWARENESS</span><h2>내가 생각하는 나의 흥미</h2><p>검사 결과를 보기 전에, 내가 평소 좋아하거나 자연스럽게 끌리는 활동을 먼저 생각해봅니다.</p></div><div class="saRule"><b>이 활동은 심리검사가 아닙니다.</b> 지금 내가 생각하는 나의 흥미를 기록하는 자기인식 활동입니다. 아래 6개 활동 중 나에게 가까운 <b>TOP3를 선택 순서대로</b> 골라보세요.</div><div class="saInterestGrid">${INTERESTS.map(x=>{const idx=selected.indexOf(x.id);return `<button type="button" class="saInterestCard ${idx>=0?'selected':''}" onclick="toggleSelfInterestV3('${x.id}')">${idx>=0?`<span class="saInterestRank">TOP ${idx+1}</span>`:''}<b>${escText(x.title)}</b><p>${escText(x.desc)}</p><small>예: ${escText(x.examples)}</small></button>`}).join('')}</div><div class="saSelection"><b>내가 생각하는 흥미 TOP3 · ${selected.length}/3</b><div class="pillbox">${selected.length?selected.map((id,i)=>{const x=INTERESTS.find(z=>z.id===id);return `<span class="pill via">${i+1}. ${escText(x?.title||id)}</span>`}).join(''):'<span class="small muted">카드를 선택하면 선택한 순서가 TOP1 → TOP3가 됩니다.</span>'}</div></div><div class="saNote"><label for="selfInterestNoteV3">내가 시간 가는 줄 모르고 하는 활동 <span class="small muted">· 선택사항</span></label><textarea id="selfInterestNoteV3" rows="3" maxlength="300" placeholder="예: 새로운 자료를 찾아 비교해 볼 때, 사람에게 설명해 줄 때, 무언가를 직접 만들어 볼 때..." oninput="updateSelfInterestNoteV3(this.value)">${escText(state.interest.note||'')}</textarea></div><div class="saActions"><button type="button" class="btn btnSecondary" onclick="openCareerIcebreakerV3()">← 커리어 밸런스 게임</button><div><button type="button" class="btn btnPrimary" onclick="completeSelfInterestV3()">저장 · 다음 자기이해 활동 →</button></div></div>`;
 }
 function openPreflow(mode){
  if(location.hash.startsWith('#share='))return;
  state=readState();hideOtherScreens();setAppVisible(false);ensureScreen().classList.remove('selfAwarenessHidden');
  if(mode==='interest'||state.icebreakerDone&&needsInterest()&&!state.interestDone)renderInterest();else renderIce();
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function closePreflow(){const s=document.getElementById('selfAwarenessScreenV3');if(s)s.classList.add('selfAwarenessHidden');setAppVisible(true)}
 function enterLegacyQualitative(){
  closePreflow();
  try{current=1;currentSub=2;renderProgress()}catch(e){if(originalGoStep)originalGoStep(1)}
 }
 function enterAfterIcebreaker(){
  if(needsInterest()&&!state.interestDone){renderInterest();window.scrollTo({top:0,behavior:'smooth'});return}
  enterLegacyQualitative();
 }
 window.chooseCareerIcebreakerV3=async function(i,choice){
  const previous=String(balanceAnswers[i]||'').toLowerCase();if(previous===choice)return;
  balanceAnswers[i]=choice;
  try{await VoteRepository.vote(i,choice,previous)}catch(e){}
  try{save()}catch(e){}
  renderIce();
 };
 window.completeCareerIcebreakerV3=function(){
  if((balanceAnswers||[]).filter(Boolean).length<7){alert('7개 밸런스게임을 모두 선택해 주세요. 또는 “아이스브레이킹 건너뛰기”를 이용할 수 있습니다.');return}
  state.icebreakerDone=true;state.icebreakerSkipped=false;saveState();enterAfterIcebreaker();
 };
 window.skipCareerIcebreakerV3=function(){state.icebreakerDone=true;state.icebreakerSkipped=true;saveState();enterAfterIcebreaker()};
 window.openCareerIcebreakerV3=function(){openPreflow('ice')};
 window.openSelfInterestV3=function(){state=readState();hideOtherScreens();setAppVisible(false);renderInterest();window.scrollTo({top:0,behavior:'smooth'})};
 window.toggleSelfInterestV3=function(id){
  if(!INTERESTS.some(x=>x.id===id))return;
  const a=[...(state.interest.selected||[])],idx=a.indexOf(id);
  if(idx>=0)a.splice(idx,1);else{if(a.length>=3){alert('흥미 활동은 TOP3까지 선택할 수 있습니다. 먼저 선택한 항목을 해제해 주세요.');return}a.push(id)}
  state.interest.selected=a;saveState();renderInterest();
 };
 window.updateSelfInterestNoteV3=function(value){state.interest.note=String(value||'').slice(0,300);saveState()};
 window.completeSelfInterestV3=function(){
  if((state.interest.selected||[]).length!==3){alert('내가 생각하는 흥미 TOP3를 선택해 주세요.');return}
  state.interestDone=true;saveState();enterLegacyQualitative();
 };
 window.getSelfAwarenessV3=function(){return JSON.parse(JSON.stringify(readState()))};

 function decoupleIcebreakerFromValue(){
  window.buildValueProfile=function(){
   reinforcedValues=[];coreValues=[...selectedValues];
   valueProfile={selectedValues:[...selectedValues],balanceCounts:{},balanceTopValues:[],reinforcedValues:[]};
   return valueProfile;
  };
  window.renderValueSelection=function(){
   const grid=document.getElementById('valueChoiceGrid');if(!grid)return;buildValueProfile();
   grid.innerHTML=VALUE_WORDS.map(x=>`<button class="valuePick ${selectedValues.includes(x)?'selected':''}" onclick="toggleSelectedValue('${esc(x)}')">${selectedValues.includes(x)?'✓ ':''}${esc(valueLabel(x))}</button>`).join('');
   const box=document.getElementById('coreValueResult');if(box)box.innerHTML=`<div class="coreValueBox"><b>내가 생각하는 나의 가치 · ${selectedValues.length}/5</b><p class="small muted">공식 직업가치관검사를 보기 전에, 현재 내가 직업과 회사를 선택할 때 중요하다고 생각하는 기준을 기록합니다.</p><div class="pillbox">${selectedValues.map(x=>`<span class="pill">${esc(valueLabel(x))}</span>`).join('')||'<span class="muted">가치 카드를 선택해 주세요.</span>'}</div></div>`;
  };
 }
 function relabelLegacyFlow(){
  try{
   STAGE_NAMES[0]='내가 생각하는 나의 가치';STAGE_NAMES[1]='경험과 타인 피드백';
  }catch(e){}
  const oldBalance=document.querySelector('.step[data-step="1"][data-substep="1"]');if(oldBalance)oldBalance.classList.add('selfAwarenessHidden');
  const value=document.querySelector('.step[data-step="1"][data-substep="2"]');
  if(value){const note=value.querySelector('.substepNote'),h=value.querySelector('h2'),p=value.querySelector('p');if(note)note.textContent='STEP 2 · 자기인식 가치';if(h)h.textContent='내가 생각하는 나의 가치';if(p)p.innerHTML='공식 검사 결과를 보기 전에, 실제 직업과 회사를 선택할 때 <b>내가 중요하다고 생각하는 기준</b>을 먼저 골라보세요.'}
  document.querySelectorAll('.step .substepNote').forEach(n=>{
   if(value&&value.contains(n))return;
   n.textContent=n.textContent.replace(/STEP\s+(\d+)([A-Z]?)/,(_,num,suffix)=>`STEP ${Number(num)+1}${suffix||''}`);
  });
  const expBack=document.querySelector('.step[data-step="2"] .navBtns .btnSecondary');if(expBack)expBack.textContent='← 내가 생각하는 나의 가치';
 }
 function installProgressOffset(){
  originalRenderProgress=window.renderProgress;originalGoStep=window.goStep;
  window.goStep=function(n){
   if(Number(n)===1){current=1;currentSub=2;renderProgress();return}
   return originalGoStep?originalGoStep(n):undefined;
  };
  window.renderProgress=function(){
   if(current===1&&currentSub===1)currentSub=2;
   const total=13,visible=current+1;
   const p=document.getElementById('progress'),st=document.getElementById('stepText'),mob=document.getElementById('mobileStage'),nav=document.getElementById('stageNav');
   if(p)p.innerHTML=Array.from({length:total},(_,i)=>`<span class="flowItem ${i<visible?'on':''}"></span>`).join('');
   if(st)st.textContent=`STEP ${visible} / ${total}`;
   if(mob)mob.innerHTML=`<b>${STAGE_NAMES[current-1]}</b><span>STEP ${visible} / ${total}</span>`;
   if(nav)nav.innerHTML=`<button class="stageChip" onclick="openSelfInterestV3()">1. 내가 생각하는 나의 흥미</button>`+STAGE_NAMES.map((x,i)=>`<button class="stageChip ${i+1===current?'on':''}" onclick="goStep(${i+1})">${i+2}. ${x}</button>`).join('');
   if(nav)nav.classList.toggle('hiddenStages',!stageListOpen);
   const step6=[...document.querySelectorAll('.step[data-step="6"]')];if(step6.length===2&&step6[0].querySelector('#swotResult'))step6[0].parentNode.insertBefore(step6[1],step6[0]);
   document.querySelectorAll('.step').forEach(s=>{if(s.matches('[data-step="1"][data-substep="1"]')){s.classList.add('hidden');return}const stageMatch=Number(s.dataset.step)===current,subMatch=!s.dataset.substep||Number(s.dataset.substep)===currentSub;s.classList.toggle('hidden',!(stageMatch&&subMatch))});
   if(current===1)renderValueSelection();if(current===2){renderExperiences();renderRepresentativeExperience();renderExperienceStrengths()}if(current===3)renderStrengths();if(current===6){renderExperienceIntegration();renderIntegrated();renderSWOT()}if(current===7)renderCareerFitMap();if(current===8)renderCareerTargetAnalysis();if(current===9)renderCompanyResearch();if(current===10)renderGapAnalysis();if(current===11)renderActionPlan();if(current===12)renderRoadmap();
   window.scrollTo({top:0,behavior:'smooth'});try{save()}catch(e){}
  };
 }
 function updateIntegration(){
  window.renderExperienceIntegration=function(){
   const box=document.getElementById('experienceIntegration');if(!box)return;buildValueProfile();recalculateExperienceCommonStrengths();
   const st=readState(),interest=(st.interest.selected||[]).map(id=>INTERESTS.find(x=>x.id===id)?.title).filter(Boolean),via=readRanks('via'),mi=readRanks('mi'),star=[`${completedExperienceCount()}/3개 경험 작성`];
   const items=[['내가 생각하는 흥미 TOP3',interest,'role'],['내가 생각하는 나의 가치',selectedValues.map(valueLabel),''],['내가 생각하는 나의 강점 TOP5',selfStrengths,'via'],['상대방이 경험에서 발견한 강점',experiencePeerStrengths,'mi'],['VIA TOP3',via,'via'],['다중지능 TOP3',mi,'mi'],['STAR 경험 작성 현황',star,'role']];
   box.innerHTML=`<div class="integrationHero"><h3 style="margin-top:0">내가 생각한 나와 검사·경험 결과를 함께 읽기</h3><p>밸런스게임은 아이스브레이킹으로만 사용하고 통합분석에는 포함하지 않습니다. 자기인식 흥미·가치·강점과 실제 경험, 외부 검사 결과를 구분해서 살펴봅니다.</p><div class="grid3">${items.map(([title,values,cls])=>`<div class="recBox"><b>${title}</b><div class="pillbox">${values.length?values.map(x=>`<span class="pill ${cls}">${esc(x)}</span>`).join(''):'<span class="muted">아직 기록되지 않음</span>'}</div></div>`).join('')}</div></div>`;
  };
 }
 function wrapRouting(){
  originalWork24Open=window.openWork24AssessmentV3;
  if(originalWork24Open){
   window.openWork24AssessmentV3=function(){
    state=readState();
    const mode=courseMode();
    if(!state.icebreakerDone||(needsInterest()&&!state.interestDone)){openPreflow();return}
    if(mode==='full'&&(!selectedValues.length||!selfStrengths.length)){
     alert('공식검사는 내가 생각하는 흥미·가치·강점 등 자기인식 활동을 먼저 마친 뒤 진행합니다.');
     if(!selectedValues.length){current=1;currentSub=2;closePreflow();renderProgress()}else if(!selfStrengths.length){closePreflow();goStep(3)}
     return;
    }
    return originalWork24Open();
   };
   window.openWork24AssessmentDirectV3=originalWork24Open;
  }
  originalCompleteModules=window.completeCareerModulesV3;
  if(originalCompleteModules){
   window.completeCareerModulesV3=function(){originalCompleteModules();setTimeout(()=>{const s=document.getElementById('moduleSelectorV3');if(courseMode()==='class'&&selectedModules().length&&(!s||s.classList.contains('moduleSelectorHidden')))openPreflow()},140)};
  }
 }
 function patchReset(){
  const btn=document.getElementById('resetBtn');if(!btn)return;
  btn.onclick=function(){if(confirm('흥미·가치·경험·강점과 검사 결과를 모두 지우고 처음부터 시작할까요?')){['careerCompassV64','careerNavigationVotesV1','careerCompassV63','careerCompassV62','careerCompassV61','careerCompassV6','careerCompassV5',KEY,WORK24_RESULT_KEY,'careerNavigationCustomPeerStrengthsV1'].forEach(k=>localStorage.removeItem(k));location.reload()}};
 }
 function maybeStart(){
  if(location.hash.startsWith('#share='))return;
  const mode=courseMode();if(mode!=='full'&&mode!=='class')return;
  const modeScreen=document.getElementById('courseModeScreenV3');if(modeScreen&&!modeScreen.classList.contains('courseModeHidden'))return;
  state=readState();if(!state.icebreakerDone||(needsInterest()&&!state.interestDone))openPreflow();else if(current===1&&currentSub===1){currentSub=2;renderProgress()}
 }
 function install(){
  if(typeof window.renderProgress!=='function'||typeof window.getCourseModeV3!=='function'){setTimeout(install,70);return}
  ensureStyle();decoupleIcebreakerFromValue();relabelLegacyFlow();installProgressOffset();updateIntegration();wrapRouting();patchReset();
  try{buildValueProfile();renderValueSelection()}catch(e){}
  setTimeout(maybeStart,260);
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

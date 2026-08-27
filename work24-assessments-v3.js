(function(){
 const RESULT_KEY='careerNavigationWork24ResultsV3';
 const WORK24_URL='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
 const OFFICIAL_IDS=['riasec','workvalue','careerreadiness'];
 const S_FIELDS=[
  ['R','현실형(R)'],['I','탐구형(I)'],['A','예술형(A)'],['S','사회형(S)'],['E','진취형(E)'],['C','관습형(C)']
 ];
 const VALUE_FIELDS=[
  ['workLifeBalance','일과 삶의 균형'],['jobStability','직업안정'],['economicReward','경제적 보상'],['achievement','성취'],['socialRecognition','사회적 인정'],['autonomy','자율성'],['changeOrientation','변화지향'],['selfDevelopment','자기개발'],['socialContribution','사회적 공헌']
 ];
 const READINESS_GROUPS=[
  ['진로성숙도', [['planning','계획성'],['independence','독립성'],['selfKnowledge','자신지식(자기이해)']]],
  ['진로탐색행동', [['careerActivityExperience','진로활동경험'],['selfUnderstandingEffort','자기이해노력'],['careerClassActivity','진로수업활동'],['socialSupport','사회적 지지자 지원']]],
  ['진로의사결정', [['careerDecision','진로의사결정']]],
  ['취업준비행동', [['activeJobSearch','적극적 직업탐색'],['informalJobSearch','비공식적 직업탐색'],['preliminaryJobSearch','예비적 직업탐색'],['formalJobSearch','공식적 직업탐색'],['employmentPreparationEffort','취업준비노력'],['employmentPreparationIntensity','취업준비강도']]]
 ];
 let results=readResults();
 let activeId='riasec';

 function blankResults(){return{
  riasec:{scores:{},status:'draft',completedAt:''},
  workvalue:{scores:{},status:'draft',completedAt:''},
  careerreadiness:{scores:{},status:'draft',completedAt:''}
 }}
 function readResults(){
  const base=blankResults();
  try{
   const x=JSON.parse(localStorage.getItem(RESULT_KEY)||'{}');
   OFFICIAL_IDS.forEach(id=>{if(x&&x[id])base[id]={...base[id],...x[id],scores:{...base[id].scores,...(x[id].scores||{})}}});
  }catch(e){}
  return base;
 }
 function saveResults(){localStorage.setItem(RESULT_KEY,JSON.stringify(results))}
 function selectedOfficial(){
  const mode=typeof window.getCourseModeV3==='function'?window.getCourseModeV3():'full';
  if(mode==='class'&&typeof window.getSelectedCareerModulesV3==='function'){
   const ids=window.getSelectedCareerModulesV3();
   return OFFICIAL_IDS.filter(id=>ids.includes(id));
  }
  return [...OFFICIAL_IDS];
 }
 function titleFor(id){return id==='riasec'?'직업선호도검사 S형(개정)':id==='workvalue'?'성인용 직업가치관검사':'대학생 진로준비도검사'}
 function timeFor(id){return id==='riasec'?'약 25분':id==='workvalue'?'약 20분':'약 20분'}
 function escText(x){return typeof window.esc==='function'?window.esc(String(x??'')):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function numeric(value){const n=Number(value);return Number.isFinite(n)?n:null}
 function allKeys(id){
  if(id==='riasec')return S_FIELDS.map(x=>x[0]);
  if(id==='workvalue')return VALUE_FIELDS.map(x=>x[0]);
  return READINESS_GROUPS.flatMap(g=>g[1].map(x=>x[0]));
 }
 function isComplete(id){return allKeys(id).every(k=>numeric(results[id]?.scores?.[k])!==null)}
 function inputGrid(fields,id,help){
  return `<div class="w24ScoreGrid">${fields.map(([key,label])=>`<label class="w24ScoreField"><span>${escText(label)}</span><input type="number" inputmode="decimal" min="0" max="100" step="1" value="${escText(results[id]?.scores?.[key]??'')}" placeholder="점수" oninput="updateWork24ScoreV3('${id}','${key}',this.value)"></label>`).join('')}</div>${help?`<div class="w24InputHelp">${help}</div>`:''}`;
 }
 function riasecSummary(){
  const rows=S_FIELDS.map(([key,label])=>({key,label,value:numeric(results.riasec.scores[key])})).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value);
  if(rows.length<2)return '';
  return `<div class="w24AutoSummary"><b>자동 계산 · 흥미코드</b><strong>${rows[0].key}${rows[1].key}</strong><span>${escText(rows[0].label)} · ${escText(rows[1].label)}</span></div>`;
 }
 function valueSummary(){
  const rows=VALUE_FIELDS.map(([key,label])=>({label,value:numeric(results.workvalue.scores[key])})).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value).slice(0,3);
  if(rows.length<3)return '';
  return `<div class="w24AutoSummary"><b>자동 계산 · 상위 직업가치 TOP3</b><strong>${rows.map((x,i)=>`${i+1}. ${escText(x.label)}`).join(' · ')}</strong></div>`;
 }
 function readinessInputs(){
  return READINESS_GROUPS.map(([group,fields])=>`<section class="w24ReadinessGroup"><h4>${escText(group)}</h4>${inputGrid(fields,'careerreadiness','')}</section>`).join('')+
   `<div class="w24InputHelp">결과표의 각 하위요인 <b>T점수</b>를 그대로 입력합니다. 이 화면에서 단순 평균을 공식 검사점수로 새로 만들지는 않습니다.</div>`;
 }
 function testGuide(id){
  const text=id==='riasec'
   ?'검사 결과표의 R·I·A·S·E·C 6개 <b>표준점수</b>를 입력하세요. 원점수가 아니라 표준점수를 사용합니다.'
   :id==='workvalue'
    ?'검사 결과표의 9개 직업가치 <b>표준점수</b>를 입력하세요. 상위 3개는 앱이 자동으로 정리합니다.'
    :'검사 결과표에 제시된 14개 하위요인의 <b>T점수</b>를 입력하세요.';
  return `<div class="w24TestGuide"><div><span class="w24OfficialBadge">고용24 공식검사</span><h3>${titleFor(id)}</h3><p>${timeFor(id)} · 고용24 개인회원 로그인 후 검사</p></div><a class="btn btnPrimary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 검사실시 화면 열기 ↗</a></div><div class="w24Steps"><span>① 고용24 로그인</span><span>② <b>${titleFor(id)}</b> 찾기</span><span>③ 검사 실시</span><span>④ 결과표 점수 입력</span></div><div class="callout">${text}</div>`;
 }
 function panel(id){
  if(id==='riasec')return testGuide(id)+inputGrid(S_FIELDS,id,'고용24 S형 결과표에는 원점수와 표준점수가 함께 제시됩니다. 여기에는 <b>표준점수</b>만 입력합니다.')+riasecSummary()+saveBox(id);
  if(id==='workvalue')return testGuide(id)+inputGrid(VALUE_FIELDS,id,'결과표의 “표준점수” 행을 보고 9개 값을 입력합니다.')+valueSummary()+saveBox(id);
  return testGuide(id)+readinessInputs()+saveBox(id);
 }
 function saveBox(id){
  const done=results[id]?.status==='complete';
  return `<div class="w24SaveRow"><div>${done?'<span class="w24Saved">✓ 결과 저장 완료</span>':'<span class="small muted">모든 점수를 입력한 뒤 저장하세요.</span>'}</div><button type="button" class="btn btnPrimary" onclick="saveWork24ModuleV3('${id}')">${done?'결과 다시 저장':'이 검사 결과 저장'}</button></div>`;
 }
 function ensureScreen(){
  let screen=document.getElementById('work24AssessmentV3');
  if(!screen){
   screen=document.createElement('section');screen.id='work24AssessmentV3';
   const hero=document.querySelector('.hero');
   const mode=document.getElementById('courseModeScreenV3');
   if(mode&&mode.parentNode)mode.parentNode.insertBefore(screen,mode.nextSibling);
   else if(hero&&hero.parentNode)hero.parentNode.insertBefore(screen,hero.nextSibling);
  }
  return screen;
 }
 function render(){
  results=readResults();
  const ids=selectedOfficial();
  if(!ids.length){closeScreen();return}
  if(!ids.includes(activeId))activeId=ids[0];
  const screen=ensureScreen();screen.className='work24AssessmentV3';
  const allDone=ids.every(isComplete)&&ids.every(id=>results[id].status==='complete');
  screen.innerHTML=`<div class="w24Head"><span>WORK24 OFFICIAL ASSESSMENTS</span><h2>고용24에서 검사하고, 결과점수만 입력하세요</h2><p>검사문항은 Career Navigation으로 가져오지 않습니다. 고용24에서 공식 검사를 완료한 뒤 연구·수업에 필요한 결과점수만 이 기기에 저장합니다.</p></div>
   <div class="w24Privacy">🔒 현재 단계에서는 입력 결과가 <b>이 기기의 브라우저에만 저장</b>됩니다. 연구 DB 전송은 연구동의 기능을 만든 뒤 별도로 연결합니다.</div>
   <div class="w24Tabs">${ids.map(id=>`<button type="button" class="w24Tab ${activeId===id?'on':''}" onclick="showWork24ModuleV3('${id}')"><span>${results[id].status==='complete'?'✓':'○'}</span>${titleFor(id)}</button>`).join('')}</div>
   <div class="w24Panel">${panel(activeId)}</div>
   <div class="w24Bottom"><button type="button" class="btn btnSecondary" onclick="closeWork24AssessmentV3()">← 수업 화면으로</button><div><span class="small muted">${ids.filter(id=>results[id].status==='complete').length}/${ids.length}개 검사 결과 저장</span><button type="button" class="btn btnPrimary" ${allDone?'':'disabled'} onclick="completeWork24AssessmentsV3()">${allDone?'결과 입력 완료 · 수업 계속 →':'선택한 검사 결과를 모두 저장해 주세요'}</button></div></div>`;
 }
 function setAppVisible(visible){
  if(typeof window.setCareerAppVisibleV3==='function'){window.setCareerAppVisibleV3(visible);return}
  ['progress','stepText','mobileStage','stageToggle','stageNav'].forEach(id=>{const n=document.getElementById(id);if(n)n.classList.toggle('moduleSelectorHidden',!visible)});
  const main=document.querySelector('.wrap > main');if(main)main.classList.toggle('moduleSelectorHidden',!visible);
 }
 function openScreen(){
  const ids=selectedOfficial();if(!ids.length)return;
  activeId=ids[0];setAppVisible(false);
  const moduleScreen=document.getElementById('moduleSelectorV3');if(moduleScreen)moduleScreen.classList.add('moduleSelectorHidden');
  const modeScreen=document.getElementById('courseModeScreenV3');if(modeScreen)modeScreen.classList.add('courseModeHidden');
  render();window.scrollTo({top:0,behavior:'smooth'});
 }
 function closeScreen(){const s=document.getElementById('work24AssessmentV3');if(s)s.classList.add('work24AssessmentHidden');setAppVisible(true)}
 function decorateBanner(){
  const banner=document.getElementById('courseModeActiveBanner');if(!banner)return;
  if(document.getElementById('openWork24V3Btn'))return;
  const btn=document.createElement('button');btn.id='openWork24V3Btn';btn.type='button';btn.className='ghost';btn.textContent='고용24 검사결과';btn.onclick=openScreen;
  const first=banner.querySelector('button');if(first)banner.insertBefore(btn,first);else banner.appendChild(btn);
 }
 window.updateWork24ScoreV3=function(id,key,value){
  if(!OFFICIAL_IDS.includes(id)||!allKeys(id).includes(key))return;
  const trimmed=String(value??'').trim();
  results[id].scores[key]=trimmed===''?'':Number(trimmed);
  results[id].status='draft';results[id].completedAt='';saveResults();
  const summary=id==='riasec'?riasecSummary():id==='workvalue'?valueSummary():'';
  const old=document.querySelector('.w24AutoSummary');if(old&&summary){const wrap=document.createElement('div');wrap.innerHTML=summary;old.replaceWith(wrap.firstElementChild)}
 };
 window.saveWork24ModuleV3=function(id){
  if(!OFFICIAL_IDS.includes(id))return;
  const missing=allKeys(id).filter(k=>numeric(results[id].scores[k])===null);
  if(missing.length){alert(`아직 입력하지 않은 점수가 ${missing.length}개 있습니다. 결과표를 보고 모든 점수를 입력해 주세요.`);return}
  const invalid=allKeys(id).filter(k=>{const n=numeric(results[id].scores[k]);return n<0||n>100});
  if(invalid.length){alert('점수는 결과표에 표시된 0~100 범위의 값을 입력해 주세요.');return}
  results[id].status='complete';results[id].completedAt=new Date().toISOString();saveResults();render();
 };
 window.showWork24ModuleV3=function(id){if(selectedOfficial().includes(id)){activeId=id;render()}};
 window.openWork24AssessmentV3=openScreen;
 window.closeWork24AssessmentV3=closeScreen;
 window.completeWork24AssessmentsV3=function(){closeScreen();if(typeof window.renderProgress==='function')window.renderProgress()};
 window.getWork24AssessmentResultsV3=function(){return JSON.parse(JSON.stringify(readResults()))};
 window.WORK24_ASSESSMENT_CONFIG_V3={url:WORK24_URL,officialIds:[...OFFICIAL_IDS]};

 function install(){
  if(!document.querySelector('.hero')){setTimeout(install,60);return}
  if(!document.getElementById('work24AssessmentV3Style')){
   const style=document.createElement('style');style.id='work24AssessmentV3Style';style.textContent=`
    .work24AssessmentHidden{display:none!important}.work24AssessmentV3{background:#fff;border:1px solid var(--line);border-radius:24px;padding:22px;margin:14px 0;box-shadow:0 8px 24px rgba(26,38,68,.05)}
    .w24Head{text-align:center;max-width:820px;margin:0 auto 14px}.w24Head>span{display:inline-block;font-size:10px;font-weight:900;letter-spacing:.08em;color:#1658a7;background:#edf6ff;border-radius:999px;padding:6px 9px}.w24Head h2{font-size:26px;margin:11px 0 7px}.w24Head p{color:var(--muted);line-height:1.65;margin:0}.w24Privacy{background:#f0fdf9;border:1px solid #c5eee1;border-radius:14px;padding:12px 14px;color:#315c55;font-size:13px;line-height:1.55;margin:14px 0}
    .w24Tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.w24Tab{border:1px solid var(--line);background:#fff;border-radius:13px;padding:11px 10px;font-weight:800;color:#48526a;cursor:pointer}.w24Tab span{margin-right:5px}.w24Tab.on{border-color:#6d63df;background:#f6f5ff;color:#393097}.w24Panel{border:1px solid var(--line);border-radius:20px;padding:18px;background:#fbfcff}
    .w24TestGuide{display:flex;justify-content:space-between;gap:15px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:14px}.w24TestGuide h3{margin:6px 0 3px;font-size:21px}.w24TestGuide p{margin:0;font-size:12px}.w24OfficialBadge{font-size:10px;font-weight:900;background:#eef6ff;color:#1658a7;border-radius:999px;padding:5px 7px}.w24Steps{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:14px 0}.w24Steps span{border:1px solid #e0e4ed;border-radius:11px;padding:9px;background:#fff;font-size:11px;text-align:center;color:#56627a}
    .w24ScoreGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.w24ScoreField{display:grid;grid-template-columns:1fr 88px;gap:8px;align-items:center;border:1px solid var(--line);background:#fff;border-radius:13px;padding:9px 10px}.w24ScoreField span{font-size:12px;font-weight:800;color:#3f4b62}.w24ScoreField input{padding:9px;text-align:center}.w24InputHelp{font-size:12px;color:#66738a;line-height:1.55;margin:10px 2px}.w24AutoSummary{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid #d9d5ff;background:#f8f7ff;border-radius:14px;padding:12px 13px;margin-top:12px}.w24AutoSummary b{font-size:11px;color:#6257c8}.w24AutoSummary strong{font-size:17px;color:#30298d}.w24AutoSummary span{font-size:12px;color:#66738a}.w24ReadinessGroup{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}.w24ReadinessGroup:first-of-type{border-top:0}.w24ReadinessGroup h4{margin:0;color:#37308f}
    .w24SaveRow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px;border-top:1px solid var(--line);padding-top:14px}.w24Saved{font-size:13px;color:#087858;font-weight:900}.w24Bottom{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px}.w24Bottom>div{display:flex;align-items:center;gap:9px}.w24Bottom button:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:760px){.w24Tabs,.w24Steps{grid-template-columns:1fr}.w24ScoreGrid{grid-template-columns:1fr 1fr}.w24TestGuide{align-items:stretch;flex-direction:column}.w24TestGuide .btn{text-align:center}.w24Bottom{align-items:stretch;flex-direction:column}.w24Bottom>div{display:grid;grid-template-columns:1fr}.w24Bottom>.btn,.w24Bottom button{width:100%}}
    @media(max-width:480px){.w24ScoreGrid{grid-template-columns:1fr}.w24ScoreField{grid-template-columns:1fr 80px}.work24AssessmentV3{padding:16px}}
   `;document.head.appendChild(style);
  }
  setTimeout(decorateBanner,80);
 }
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

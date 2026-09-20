const ROOT_ID='stepRoot';
const IMPROVED_MARKER='[추가 출력 · 자기소개서 활용 키워드 + SWOT]';
const IMPROVED_EXTENSION=`[추가 출력 · 자기소개서 활용 키워드 + SWOT]
7. 자기소개서에서 나중에 검증할 강점 키워드 후보 5개
- 반드시 표로 작성한다.
- 열: 강점 키워드 후보 | 현재 단서 | 단서 유형 | STEP 2 경험에서 확인할 질문
- 단서 유형은 ‘자기인식 단서 / 검사 단서 / 반복 단서 / 학생 비교’ 중 하나 이상으로 표시한다.
- 서로 다른 자료에서 비슷한 특징이 반복되어도 ‘반복 단서’일 뿐 행동 근거로 간주하지 않는다.
- 고용24 또는 VIA 결과 하나만으로 직무역량이나 확정 강점이라고 표현하지 않는다.
- 실제 경험의 행동·판단·결과·증거가 확인된 뒤에만 행동 근거가 있다고 표현한다.

8. 자기소개서·면접에서 다룰 수 있는 보완 키워드 후보 3개
- 사람 자체를 부정적으로 규정하지 않는다.
- 자기인식과 검사결과의 불일치, 강점의 과잉 사용 가능성, 실제 경험으로 확인할 부분에서만 후보를 만든다.
- 근거가 부족하면 ‘추가 확인 필요’라고 표시한다.

9. SWOT 초안
- S와 W도 STEP 1에서는 확정판정이 아니라 내부 단서와 보완 후보로 작성한다.
- O와 T는 현재 입력자료에 실제 외부정보가 있을 때만 작성한다.
- 외부정보가 없으면 O와 T는 ‘STEP 3 이후 확인 필요’라고 표시한다.

10. SWOT 전략 초안
- O 또는 T가 확인되지 않았다면 전략을 지어내지 않는다.
- 확인되지 않은 직무·기업·채용시장 정보는 STEP 3 이후로 미룬다.

11. 자소서 소재 연결표 3개
- 아직 실제 경험의 행동근거가 확인되지 않았다면 완성된 자소서 문장을 쓰지 않는다.
- 열: 소재 후보 | 현재 단서 | STEP 2에서 확인할 행동 | 활용 가능한 문항
- 실제 경험 근거가 없으면 ‘STEP 2 경험 확인 필요’라고 표시한다.

12. 자소서 작성 전 검증
- ‘현재 확인된 단서’와 ‘실제 경험에서 확인된 행동 근거’를 분리한다.
- 성과, 수치, 역할, 직무 적합성은 입력자료에 없으면 만들지 않는다.
- 검사 결과만으로 ‘리더십이 뛰어나다’, ‘문제해결 능력이 높다’처럼 단정하지 않는다.

주의: STEP 1 결과는 자기소개서의 완성 문장이나 역량 판정이 아니라 ‘검증할 소재 후보’다. 다음 STEP에서 실제 경험의 상황·행동·결과·증거와 연결한 뒤 사용한다.`;

let dirty=false;
let saveLock=false;

function currentRoot(){return document.getElementById(ROOT_ID)}
function careerSection(root=currentRoot()){return root?.querySelector('.careerDnaStandard')||null}
function moduleBlocks(root=currentRoot()){
  const section=careerSection(root);
  return section?[...section.children].filter(el=>el.classList?.contains('block')):[];
}
function textFilled(el){return !!String(el?.value||'').trim()}
function countFilled(list){return list.filter(textFilled).length}
function setTextIfChanged(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setHtmlIfChanged(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}

function injectStyles(){
  if(document.getElementById('careerDnaStudentUxStyles'))return;
  const style=document.createElement('style');
  style.id='careerDnaStudentUxStyles';
  style.textContent=`
    .careerDnaStandard .jobfitModuleStatus{display:inline-flex;align-items:center;margin-left:8px;padding:3px 7px;border-radius:999px;background:#f1f3f8;color:#667085;font-size:11px;font-weight:800;vertical-align:middle}
    .careerDnaStandard .jobfitModuleStatus.done{background:#ecfdf3;color:#067647}
    .careerDnaStandard .jobfitModuleStatus.partial{background:#fff7e6;color:#a15c00}
    .careerDnaStandard .jobfitStepProgressText{margin:-2px 0 12px;font-size:12px;color:var(--muted);text-align:right}
    .careerDnaStandard .jobfitReturnGuide,.careerDnaStandard .jobfitHypothesisGuide,.careerDnaStandard .jobfitAiReadiness{margin-top:10px}
    .careerDnaStandard .jobfitUnsavedHint{margin-top:10px;font-size:12px;color:var(--muted)}
    @media(max-width:680px){.careerDnaStandard .jobfitStepProgressText{text-align:left}.careerDnaStandard .jobfitModuleStatus{display:inline-flex;margin-top:4px}}
  `;
  document.head.appendChild(style);
}

function moduleState(block,index,blocks){
  if(!block)return{label:'시작 전',complete:false,partial:false};
  if(index===0){const n=block.querySelectorAll('.balanceChoice.selected').length;return n===7?{label:'완료',complete:true,partial:false}:n?{label:`${n}/7`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===1){const n=countFilled([block.querySelector('#selfInterest')]);return n?{label:'완료',complete:true,partial:false}:{label:'시작 전',complete:false,partial:false}}
  if(index===2){const scores=countFilled(['R','I','A','S','E','C'].map(k=>block.querySelector(`#riasec_${k}`))),date=textFilled(block.querySelector('#interestExamDate'));return scores===6&&date?{label:'완료',complete:true,partial:false}:scores||date?{label:`${scores}/6`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===3){const n=countFilled([block.querySelector('#selfWorkValues')]);return n?{label:'완료',complete:true,partial:false}:{label:'시작 전',complete:false,partial:false}}
  if(index===4){const scores=countFilled([...block.querySelectorAll('[id^="workValue_"]')]),date=textFilled(block.querySelector('#workValuesDate'));return scores===9&&date?{label:'완료',complete:true,partial:false}:scores||date?{label:`${scores}/9`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===5){const n=block.querySelectorAll('.strengthPick.selected').length;return n===5?{label:'완료',complete:true,partial:false}:n?{label:`${n}/5`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===6){const n=countFilled([0,1,2,3,4].map(i=>block.querySelector(`#via_${i}`)));return n===5?{label:'완료',complete:true,partial:false}:n?{label:`${n}/5`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===7){const n=countFilled(['compare_repeat','compare_connect','compare_unexpected','compare_verify'].map(id=>block.querySelector(`#${id}`)));return n===4?{label:'완료',complete:true,partial:false}:n?{label:`${n}/4`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===8){const made=!!String(block.querySelector('#promptBox')?.textContent||'').trim();const ready=blocks.slice(1,8).filter((b,i)=>moduleState(b,i+1,blocks).complete).length;return made?{label:'생성됨',complete:true,partial:false}:{label:`준비 ${ready}/7`,complete:false,partial:ready>0}}
  if(index===9){const n=countFilled([block.querySelector('#aiHypothesis'),block.querySelector('#hypothesisFit')]);return n===2?{label:'완료',complete:true,partial:false}:n?{label:`${n}/2`,complete:false,partial:true}:{label:'저장 전',complete:false,partial:false}}
  return{label:'',complete:false,partial:false};
}

function updateStatuses(root=currentRoot()){
  const blocks=moduleBlocks(root);
  if(blocks.length!==10)return;
  const states=blocks.map((block,i)=>moduleState(block,i,blocks));
  blocks.forEach((block,i)=>{
    const h3=block.querySelector('.moduleHead h3');if(!h3)return;
    let badge=h3.querySelector('.jobfitModuleStatus');
    if(!badge){badge=document.createElement('small');badge.className='jobfitModuleStatus';h3.appendChild(badge)}
    badge.classList.toggle('done',states[i].complete);
    badge.classList.toggle('partial',states[i].partial&&!states[i].complete);
    setTextIfChanged(badge,states[i].label);
  });
  const completed=states.filter(x=>x.complete).length;
  const section=careerSection(root),bar=section?.querySelector('.progress > span');
  if(bar){const width=`${Math.round(completed/10*100)}%`;if(bar.style.width!==width)bar.style.width=width}
  const progress=section?.querySelector('.progress');
  if(progress){
    let node=section.querySelector('.jobfitStepProgressText');
    if(!node){node=document.createElement('div');node.className='jobfitStepProgressText';progress.insertAdjacentElement('afterend',node)}
    setTextIfChanged(node,`Career DNA 진행 ${completed}/10 완료 · 검사는 결과표의 값만 입력하고, 비어 있는 항목은 0점으로 처리하지 않습니다.`);
  }
  const ai=blocks[8];
  if(ai){
    let panel=ai.querySelector('.jobfitAiReadiness');
    if(!panel){panel=document.createElement('div');panel.className='callout info jobfitAiReadiness';ai.querySelector('#careerDnaAiGuide')?.insertAdjacentElement('afterend',panel)}
    const ready=states.slice(1,8).filter(x=>x.complete).length;
    setHtmlIfChanged(panel,ready===7?'<b>분석 준비 완료</b> · 자기인식과 검사 입력을 확인했습니다. AI 결과도 가설 수준으로 검토하세요.':`<b>분석 준비도 ${ready}/7</b> · 일부 자료만으로도 분석할 수 있지만 비어 있는 항목은 해석에서 제외됩니다.`);
  }
}

function addReturnGuides(root=currentRoot()){
  const blocks=moduleBlocks(root);if(blocks.length!==10)return;
  const guides=[
    [2,'고용24에서 <b>직업선호도검사 S형</b>을 마친 뒤 결과표의 R·I·A·S·E·C 점수와 검사일만 입력하세요. 검사문항이나 결과 설명문 전체를 복사할 필요는 없습니다.'],
    [4,'고용24에서 <b>성인용 직업가치관검사</b>를 마친 뒤 결과표의 9개 가치점수와 검사일만 입력하세요.'],
    [6,'VIA 공식검사를 마친 뒤 <b>TOP5 강점명만</b> 입력하세요. VIA는 보조 자기이해 자료이며 직무역량 판정도구가 아닙니다.']
  ];
  guides.forEach(([i,html])=>{
    const block=blocks[i];if(!block||block.querySelector('.jobfitReturnGuide'))return;
    const box=document.createElement('div');box.className='callout good jobfitReturnGuide';box.innerHTML=html;
    block.querySelector('.actions')?.insertAdjacentElement('afterend',box);
  });
  const last=blocks[9];
  if(last&&!last.querySelector('.jobfitHypothesisGuide')){
    const box=document.createElement('div');box.className='callout info jobfitHypothesisGuide';
    box.innerHTML='<b>저장 원칙</b> · AI 답변 전체를 그대로 채택하지 않습니다. 내가 납득한 단서와 STEP 2에서 확인할 질문만 남기세요.';
    last.querySelector('.field')?.insertAdjacentElement('beforebegin',box);
  }
}

function replacePromptExtension(root=currentRoot()){
  const box=root?.querySelector('#promptBox');if(!box)return;
  const text=box.textContent||'',idx=text.indexOf(IMPROVED_MARKER);if(idx<0)return;
  const next=text.slice(0,idx)+IMPROVED_EXTENSION;if(next!==text)box.textContent=next;
}
function enhancePromptButton(root=currentRoot()){
  const btn=root?.querySelector('#makePrompt');if(!btn||btn.dataset.resumeReady==='1')return;
  btn.dataset.resumeReady='1';btn.addEventListener('click',()=>queueMicrotask(()=>{replacePromptExtension(root);updateStatuses(root)}));
}
function saveIfDirty(){
  if(window.JobfitCareerDnaReselecting||!dirty||saveLock)return false;
  const root=currentRoot();if(!careerSection(root))return false;const btn=root.querySelector('#saveDNA');if(!btn)return false;
  saveLock=true;try{btn.click();dirty=false;return true}finally{setTimeout(()=>{saveLock=false},0)}
}
function markDirty(event){
  const root=currentRoot();if(!careerSection(root))return;const target=event.target;
  if(target?.closest?.('.balanceReselect')){saveIfDirty();window.JobfitCareerDnaReselecting=true;dirty=false;return}
  if(target?.closest?.('[data-balance-choice]')){setTimeout(()=>updateStatuses(root),0);return}
  if(target?.closest?.('.strengthPick')||target?.matches?.('#selfInterest,#interestExamDate,[id^="riasec_"],#selfWorkValues,#workValuesDate,[id^="workValue_"],#via_0,#via_1,#via_2,#via_3,#via_4,#compare_repeat,#compare_connect,#compare_unexpected,#compare_verify,#aiHypothesis,#hypothesisFit'))dirty=true;
  setTimeout(()=>updateStatuses(root),0);
}
function addUnsavedHint(root=currentRoot()){
  const section=careerSection(root);if(!section||section.querySelector('.jobfitUnsavedHint'))return;
  const actions=section.querySelector(':scope > .actions');if(!actions)return;
  const hint=document.createElement('div');hint.className='jobfitUnsavedHint';hint.textContent='다른 STEP으로 이동하기 전 현재 STEP 1 입력내용을 저장하도록 보완되어 있습니다.';actions.insertAdjacentElement('afterend',hint);
}
function enhance(){
  const root=currentRoot();if(!careerSection(root))return;
  injectStyles();addReturnGuides(root);enhancePromptButton(root);addUnsavedHint(root);replacePromptExtension(root);updateStatuses(root);
}
const observer=new MutationObserver(()=>enhance());
function start(){
  const root=currentRoot();if(!root)return;
  observer.observe(root,{childList:true,subtree:true});root.addEventListener('input',markDirty,true);root.addEventListener('change',markDirty,true);root.addEventListener('click',markDirty,true);
  document.addEventListener('click',event=>{const step=event.target.closest?.('.stepBtn');if(step&&careerSection())saveIfDirty()},true);
  window.addEventListener('pagehide',()=>saveIfDirty());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveIfDirty()});enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.JobfitCareerDnaStudentUx={enhance,saveIfDirty,updateStatuses,replacePromptExtension};

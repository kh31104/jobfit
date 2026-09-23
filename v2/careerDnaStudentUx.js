const ROOT_ID='stepRoot';
const IMPROVED_MARKER='[추가 출력 · 자기소개서 활용 키워드 + SWOT]';
const IMPROVED_EXTENSION=`[추가 출력 · 자기소개서 활용 키워드 + SWOT]
7. 자기소개서에서 활용할 수 있는 강점 키워드 5개
- 반드시 표로 작성한다.
- 열: 강점 키워드 | 현재 근거 | 경험으로 확인할 질문 | 활용 판단
- 활용 판단은 ‘바로 활용 가능 / 경험 확인 필요’ 중 하나만 사용한다.
- 검사명만 근거로 강점을 확정하지 않는다. 서로 다른 자료에서 반복되거나 학생이 직접 확인한 내용이 있을 때 우선한다.

8. 자기소개서·면접에서 다룰 수 있는 약점/보완 키워드 3개
- 반드시 표로 작성한다.
- 열: 약점/보완 키워드 | 나타날 수 있는 상황 | 현재 가능한 보완 행동 | 표현 시 주의점
- 사람 자체를 부정적으로 규정하지 않는다.
- 강점의 과잉 사용 가능성, 자기인식과 검사결과의 불일치, 실제 경험으로 더 확인해야 하는 부분에서만 도출한다.
- 근거가 부족하면 ‘추가 확인 필요’라고 표시한다.

9. SWOT 분석
- S(Strengths): 현재 자료에서 반복 확인되는 내부 강점
- W(Weaknesses): 현재 자료에서 확인되는 내부 보완점 또는 강점의 과잉 사용 위험
- O(Opportunities): 현재 입력자료에서 근거가 확인되는 외부 기회만 작성
- T(Threats): 현재 입력자료에서 근거가 확인되는 외부 위험만 작성
- STEP 1에는 직무·기업·채용시장 정보가 충분하지 않을 수 있다. O와 T의 근거가 없으면 임의로 추정하지 말고 ‘추가 정보 필요’라고 표시한다.

10. SWOT 전략
- SO 전략: 강점을 활용해 기회를 잡는 방법
- ST 전략: 강점으로 위험에 대응하는 방법
- WO 전략: 보완점을 개선하며 기회를 활용하는 방법
- WT 전략: 보완점과 위험이 겹칠 때의 예방 행동
- 각 전략은 1~2개씩 제시한다.
- 현재 정보로 만들 수 없는 전략은 ‘STEP 3 이후 직무·기업 정보 확인 후 작성’이라고 표시한다.
- 각 전략 끝에 ‘취업준비 행동 / 경험 설계 / 자기소개서 소재 개발’ 중 연결되는 항목을 표시한다.

11. 자소서 소재 연결표 3개
- 아직 실제 경험이 입력되지 않았으므로 완성된 자소서 문장을 쓰지 않는다.
- 표의 열: 우선 키워드 | 연결해서 찾아볼 경험 유형 | 반드시 확인할 행동 근거 | 활용 가능한 자소서 문항
- 활용 가능한 자소서 문항은 ‘성격의 장단점 / 협업 / 문제해결 / 도전·실패 / 직무역량’ 중 적합한 것을 제시한다.
- 실제 경험 근거가 없으면 ‘STEP 2 경험 확인 필요’라고 표시한다.

12. 자소서 작성 전 검증
- ‘현재 바로 활용 가능한 내용’과 ‘경험 확인 후 사용해야 할 내용’을 분리한다.
- 성과, 수치, 역할, 직무 적합성은 입력자료에 없으면 만들지 않는다.
- 검사 결과만으로 ‘리더십이 뛰어나다’, ‘문제해결 능력이 높다’처럼 단정하지 않는다.

마지막에 아래 형식으로 짧게 요약한다.
강점 키워드: 5개
약점/보완 키워드: 3개
우선 확인할 경험: 3개
자소서 문항 연결: 3개

주의: STEP 1 결과는 자기소개서의 완성 문장이 아니라 ‘검증할 소재 후보’다. 다음 STEP에서 실제 경험의 상황·행동·결과·증거와 연결한 뒤 사용한다.`;

let dirty=false;
let saveLock=false;

function currentRoot(){return document.getElementById(ROOT_ID)}
function careerSection(root=currentRoot()){return root?.querySelector('.careerDnaStandard')||null}
function moduleBlocks(root=currentRoot()){
  const section=careerSection(root);
  if(!section)return[];
  return [...section.children].filter(el=>el.classList?.contains('block'));
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

function adjustLabels(blocks){
  const first=blocks[0]?.querySelector('.moduleHead h3');
  if(first&&first.childNodes.length===1&&first.textContent.trim()==='Balance Game')first.textContent='밸런스게임 (Balance Game)';
  const second=blocks[1]?.querySelector('.moduleHead h3');
  if(second&&second.childNodes.length===1&&second.textContent.trim()==='Career Anchor')second.textContent='커리어 앵커 (Career Anchor)';
}

function moduleState(block,index,blocks){
  if(!block)return{label:'시작 전',complete:false,partial:false};
  if(index===0){const n=block.querySelectorAll('.balanceChoice.selected').length;return n===7?{label:'완료',complete:true,partial:false}:n?{label:`${n}/7`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===1){const n=block.querySelectorAll('[data-anchor-item]:checked').length,b=block.querySelectorAll('[data-bonus-item]:checked').length;if(n===40&&b===3)return{label:'완료',complete:true,partial:false};if(n===40)return{label:`추가선택 ${b}/3`,complete:false,partial:true};return n?{label:`${n}/40`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===2){const n=block.querySelectorAll('.strengthPick.selected').length;return n===5?{label:'완료',complete:true,partial:false}:n?{label:`${n}/5`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===3){const n=countFilled([0,1,2,3,4].map(i=>block.querySelector(`#via_${i}`)));return n===5?{label:'완료',complete:true,partial:false}:n?{label:`${n}/5`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===4){const n=countFilled(['compare_repeat','compare_connect','compare_unexpected','compare_verify'].map(id=>block.querySelector(`#${id}`)));return n===4?{label:'완료',complete:true,partial:false}:n?{label:`${n}/4`,complete:false,partial:true}:{label:'시작 전',complete:false,partial:false}}
  if(index===5){const made=!!String(block.querySelector('#promptBox')?.textContent||'').trim();const ready=blocks.slice(0,5).filter((b,i)=>moduleState(b,i,blocks).complete).length;return made?{label:'생성됨',complete:true,partial:false}:{label:`준비 ${ready}/5`,complete:false,partial:ready>0}}
  if(index===6){const n=countFilled([block.querySelector('#aiHypothesis'),block.querySelector('#hypothesisFit')]);return n===2?{label:'완료',complete:true,partial:false}:n?{label:`${n}/2`,complete:false,partial:true}:{label:'저장 전',complete:false,partial:false}}
  return{label:'',complete:false,partial:false};
}

function updateStatuses(root=currentRoot()){
  const blocks=moduleBlocks(root);
  if(blocks.length!==7)return;
  adjustLabels(blocks);
  const states=blocks.map((block,i)=>moduleState(block,i,blocks));
  blocks.forEach((block,i)=>{
    const h3=block.querySelector('.moduleHead h3');
    if(!h3)return;
    let badge=h3.querySelector('.jobfitModuleStatus');
    if(!badge){badge=document.createElement('small');badge.className='jobfitModuleStatus';h3.appendChild(badge)}
    badge.classList.toggle('done',states[i].complete);
    badge.classList.toggle('partial',states[i].partial&&!states[i].complete);
    setTextIfChanged(badge,states[i].label);
  });
  const completed=states.filter(x=>x.complete).length;
  const section=careerSection(root),bar=section?.querySelector('.progress > span');
  if(bar){const width=`${Math.round(completed/7*100)}%`;if(bar.style.width!==width)bar.style.width=width}
  const progress=section?.querySelector('.progress');
  if(progress){
    let text=section.querySelector('.jobfitStepProgressText');
    if(!text){text=document.createElement('div');text.className='jobfitStepProgressText';progress.insertAdjacentElement('afterend',text)}
    setTextIfChanged(text,`Career DNA 진행 ${completed}/7 완료 · 제목을 눌러 필요한 항목을 이어서 진행하세요.`);
  }
  const ai=blocks[5];
  if(ai){
    let panel=ai.querySelector('.jobfitAiReadiness');
    if(!panel){panel=document.createElement('div');panel.className='callout info jobfitAiReadiness';ai.querySelector('#careerDnaAiGuide')?.insertAdjacentElement('afterend',panel)}
    const ready=states.slice(0,5).filter(x=>x.complete).length;
    const html=ready===5?'<b>분석 준비 완료</b> · 01~05 입력이 모두 완료되었습니다. 현재 결과로 통합분석을 만들 수 있습니다.':`<b>분석 준비도 ${ready}/5</b> · 일부 자료만으로도 프롬프트는 만들 수 있지만, 비어 있는 항목은 해석에서 제외됩니다. 가능하면 01~05를 먼저 확인하세요.`;
    setHtmlIfChanged(panel,html);
  }
}

function addReturnGuides(root=currentRoot()){
  const blocks=moduleBlocks(root);
  if(blocks.length!==7)return;
  const guides=[
    [3,'검사를 새 탭에서 마친 뒤 이 화면으로 돌아와 <b>결과표의 TOP 5 강점명만</b> 입력하세요. 전체 결과를 복사해 넣을 필요는 없습니다.']
  ];
  guides.forEach(([i,html])=>{
    const block=blocks[i];
    if(!block||block.querySelector('.jobfitReturnGuide'))return;
    const box=document.createElement('div');box.className='callout good jobfitReturnGuide';box.innerHTML=html;
    block.querySelector('.actions')?.insertAdjacentElement('afterend',box);
  });
  const last=blocks[6];
  if(last&&!last.querySelector('.jobfitHypothesisGuide')){
    const box=document.createElement('div');box.className='callout info jobfitHypothesisGuide';
    box.innerHTML='<b>저장 방법</b> · AI 답변 전체를 붙여넣을 필요는 없습니다. 내가 확인한 강점·보완점·추가 확인 질문 중 맞는 내용만 남기고, 아래 자기평가까지 선택하세요.';
    last.querySelector('.field')?.insertAdjacentElement('beforebegin',box);
  }
}

function replacePromptExtension(root=currentRoot()){
  const box=root?.querySelector('#promptBox');
  if(!box)return;
  const text=box.textContent||'',idx=text.indexOf(IMPROVED_MARKER);
  if(idx<0)return;
  const next=text.slice(0,idx)+IMPROVED_EXTENSION;
  if(next!==text)box.textContent=next;
}

function enhancePromptButton(root=currentRoot()){
  const btn=root?.querySelector('#makePrompt');
  if(!btn||btn.dataset.resumeReady==='1')return;
  btn.dataset.resumeReady='1';
  btn.addEventListener('click',()=>{queueMicrotask(()=>{replacePromptExtension(root);updateStatuses(root)})});
}

function saveIfDirty(){
  if(window.JobfitCareerDnaReselecting||!dirty||saveLock)return false;
  const root=currentRoot();
  if(!careerSection(root))return false;
  const btn=root.querySelector('#saveDNA');
  if(!btn)return false;
  saveLock=true;
  try{btn.click();dirty=false;return true}finally{setTimeout(()=>{saveLock=false},0)}
}

function markDirty(event){
  const root=currentRoot();
  if(!careerSection(root))return;
  const target=event.target;
  if(target?.closest?.('.balanceReselect')){
    saveIfDirty();
    window.JobfitCareerDnaReselecting=true;
    dirty=false;
    return;
  }
  if(target?.closest?.('[data-balance-choice]')){
    setTimeout(()=>updateStatuses(root),0);
    return;
  }
  if(target?.closest?.('.strengthPick')||target?.matches?.('[data-anchor-item],[data-bonus-item],#via_0,#via_1,#via_2,#via_3,#via_4,#compare_repeat,#compare_connect,#compare_unexpected,#compare_verify,#aiHypothesis,#hypothesisFit'))dirty=true;
  setTimeout(()=>updateStatuses(root),0);
}

function addUnsavedHint(root=currentRoot()){
  const section=careerSection(root);
  if(!section||section.querySelector('.jobfitUnsavedHint'))return;
  const actions=section.querySelector(':scope > .actions');
  if(!actions)return;
  const hint=document.createElement('div');hint.className='jobfitUnsavedHint';
  hint.textContent='작성 중 다른 STEP으로 이동하거나 페이지를 닫아도 현재 STEP 1 입력내용을 먼저 저장하도록 보완되어 있습니다.';
  actions.insertAdjacentElement('afterend',hint);
}

function enhance(){
  const root=currentRoot();
  if(!careerSection(root))return;
  injectStyles();
  addReturnGuides(root);
  enhancePromptButton(root);
  addUnsavedHint(root);
  replacePromptExtension(root);
  updateStatuses(root);
}

const observer=new MutationObserver(()=>enhance());
function start(){
  const root=currentRoot();
  if(!root)return;
  observer.observe(root,{childList:true,subtree:true});
  root.addEventListener('input',markDirty,true);
  root.addEventListener('change',markDirty,true);
  root.addEventListener('click',markDirty,true);
  document.addEventListener('click',event=>{const step=event.target.closest?.('.stepBtn');if(step&&careerSection())saveIfDirty()},true);
  window.addEventListener('pagehide',()=>saveIfDirty());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveIfDirty()});
  enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.JobfitCareerDnaStudentUx={enhance,saveIfDirty,updateStatuses,replacePromptExtension};
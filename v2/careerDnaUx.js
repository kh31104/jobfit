const ROOT_ID='stepRoot';
const STORAGE_KEY='jobfit:v2:learner';
const REOPEN_BALANCE_KEY='jobfit:balance-reopen';
const PROMPT_LABEL='자기이해 + SWOT 통합분석 만들기';
const GUIDE_HTML='<b>AI LAB 사용 순서</b><br>① 현재 내용 저장 → ② 통합분석 프롬프트 만들기 → ③ 복사 → ④ 수업에서 사용하는 AI에 붙여넣기<br><span class="muted">AI 결과에는 자기이해 가설과 함께 <b>자소서용 강점·약점 키워드</b>, <b>SWOT 분석</b>, <b>SO·ST·WO·WT 전략</b>을 요청합니다. STEP 1 정보만으로 판단할 수 없는 기회(O)·위협(T)은 임의로 만들지 않고 ‘추가 정보 필요’로 표시하도록 설계했습니다. Jobfit이 입력내용을 AI로 자동 전송하지는 않습니다.</span>';
const SWOT_PROMPT_MARKER='[추가 출력 · 자기소개서 활용 키워드 + SWOT]';
const SWOT_PROMPT_EXTENSION=`

[추가 출력 · 자기소개서 활용 키워드 + SWOT]
7. 자기소개서에서 활용할 수 있는 강점 키워드 5개
- 한 단어 또는 짧은 표현으로 제시한다.
- 각 키워드 옆에 근거가 된 입력자료를 괄호로 표시한다.
- 막연한 칭찬보다 실제 행동이나 경험으로 확인할 수 있는 표현을 우선한다.
- 아직 경험 근거가 부족하면 ‘경험 확인 필요’라고 표시한다.

8. 자기소개서·면접에서 다룰 수 있는 약점/보완 키워드 3개
- 사람 자체를 부정적으로 규정하지 않는다.
- 자기인식과 검사결과의 불일치, 강점의 과잉 사용 가능성, 경험으로 더 확인해야 하는 부분에서만 도출한다.
- ‘약점/보완 키워드 | 나타날 수 있는 상황 | 현재 가능한 보완 행동’ 형식으로 작성한다.
- 근거가 부족하면 억지로 약점을 만들지 말고 ‘추가 확인 필요’라고 표시한다.

9. SWOT 분석
- S(Strengths): 현재 자료에서 반복 확인되는 내부 강점
- W(Weaknesses): 현재 자료에서 확인되는 내부 보완점 또는 과잉 사용 위험
- O(Opportunities): 현재 입력자료에서 근거가 확인되는 외부 기회만 작성
- T(Threats): 현재 입력자료에서 근거가 확인되는 외부 위험만 작성
- STEP 1에는 직무·기업·채용시장 정보가 충분하지 않을 수 있다. O와 T의 근거가 없으면 임의 추정하지 말고 ‘추가 정보 필요’라고 표시한다.

10. SWOT 전략
- SO 전략: 강점을 활용해 기회를 잡는 방법
- ST 전략: 강점으로 위험에 대응하는 방법
- WO 전략: 보완점을 개선하며 기회를 활용하는 방법
- WT 전략: 보완점과 위험이 겹칠 때의 예방 행동
- 각 전략은 1~2개씩 제시하되, 현재 정보로 만들 수 없는 전략은 ‘STEP 3 이후 직무·기업 정보 확인 후 작성’이라고 표시한다.
- 전략은 취업준비 행동, 경험 설계, 자기소개서 소재 개발 중 어디에 연결되는지 함께 표시한다.

마지막에 ‘자소서에 바로 쓸 수 있는 키워드 요약’을 별도로 제시한다.
강점 키워드: 5개
약점/보완 키워드: 3개
주의: 키워드를 자기소개서 문장으로 바로 확정하지 말고, 다음 STEP에서 실제 경험 근거와 연결해 검증한다.`;

let reopenBalanceIndex=null;
try{
  const pending=Number(sessionStorage.getItem(REOPEN_BALANCE_KEY));
  if(Number.isInteger(pending)&&pending>=0&&pending<7)reopenBalanceIndex=pending;
}catch{}

function parseState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function writeState(state){
  state.meta=state.meta||{};
  state.meta.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function ensureStandardCompatibility(){
  const state=parseState(),dna=state.assessments?.careerDNA;
  if(!dna?.standard?.version||dna.interest?.type==='STANDARD')return;
  state.assessments=state.assessments||{};
  state.assessments.careerDNA={...dna,interest:{...(dna.interest||{}),type:'STANDARD',resultVersion:'Career DNA Standard v1'}};
  writeState(state);
  const nav=document.querySelector('.stepBtn[data-step="1"] .stepN');if(nav&&nav.textContent!=='✓')nav.textContent='✓';
  window.JobfitStorageContinuity?.syncNow?.();
}
function injectStyles(){
  if(document.getElementById('careerDnaUxEnhancementStyles'))return;
  const style=document.createElement('style');
  style.id='careerDnaUxEnhancementStyles';
  style.textContent=`
    .careerDnaStandard .jobfitModuleToggle{cursor:pointer;position:relative;padding-right:34px;border-radius:12px;padding-top:8px;padding-bottom:8px}
    .careerDnaStandard .jobfitModuleToggle:hover{background:#fafaff}
    .careerDnaStandard .jobfitModuleToggle:focus-visible{outline:2px solid #655ae7;outline-offset:3px}
    .careerDnaStandard .moduleHead>span.jobfitModuleToggleIcon{margin-left:auto;width:auto;height:auto;background:transparent;border-radius:0;display:block;font-size:22px;line-height:1;color:#655ae7;font-weight:700;align-self:center}
    .careerDnaStandard .jobfitModuleBody[hidden]{display:none!important}
    .careerDnaStandard .balanceReselect{margin-left:8px;border:0;background:transparent;color:#5146c9;font-weight:800;font-size:12px;text-decoration:underline;cursor:pointer;padding:3px 4px}
    .careerDnaStandard .balanceReselect:hover{color:#3027a1}
    .careerDnaStandard .swotGuide{margin-top:10px}
  `;
  document.head.appendChild(style);
}
function setBlockExpanded(block,expanded){
  const head=block.querySelector(':scope > .moduleHead');if(!head)return;
  head.setAttribute('aria-expanded',expanded?'true':'false');
  head.querySelector('p')?.toggleAttribute('hidden',!expanded);
  const icon=head.querySelector('.jobfitModuleToggleIcon');if(icon)icon.textContent=expanded?'−':'＋';
  [...block.children].filter(el=>el!==head).forEach(el=>{el.classList.add('jobfitModuleBody');el.hidden=!expanded});
}
function enhanceCollapsibles(root){
  const section=root.querySelector('.careerDnaStandard');if(!section)return;
  const blocks=[...section.children].filter(el=>el.classList?.contains('block'));
  blocks.forEach(block=>{
    const head=block.querySelector(':scope > .moduleHead');
    if(!head||block.dataset.jobfitCollapsible==='1')return;
    block.dataset.jobfitCollapsible='1';
    head.classList.add('jobfitModuleToggle');
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    head.setAttribute('aria-expanded','false');
    const icon=document.createElement('span');icon.className='jobfitModuleToggleIcon';icon.setAttribute('aria-hidden','true');icon.textContent='＋';head.appendChild(icon);
    const toggle=()=>setBlockExpanded(block,head.getAttribute('aria-expanded')!=='true');
    head.addEventListener('click',event=>{if(event.target.closest('a,button,input,select,textarea,label'))return;toggle()});
    head.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}});
    setBlockExpanded(block,false);
  });
}
function findBalanceBlock(root){
  return [...root.querySelectorAll('.careerDnaStandard .block')].find(block=>block.querySelector('.moduleHead h3')?.textContent.trim()==='Balance Game')||null;
}
function reopenBalanceIfNeeded(root){
  if(!Number.isInteger(reopenBalanceIndex))return;
  const block=findBalanceBlock(root);if(!block||block.dataset.jobfitCollapsible!=='1')return;
  const targetIndex=reopenBalanceIndex;
  reopenBalanceIndex=null;
  try{sessionStorage.removeItem(REOPEN_BALANCE_KEY)}catch{}
  setBlockExpanded(block,true);
  requestAnimationFrame(()=>block.querySelectorAll('.balanceCard')[targetIndex]?.scrollIntoView({block:'center',behavior:'smooth'}));
}
function updateBalanceNotice(root){
  const balanceBlock=findBalanceBlock(root);
  if(!balanceBlock)return;
  const notice=balanceBlock.querySelector('.callout.warn');
  if(notice&&!notice.dataset.reselectNotice){
    notice.innerHTML='<b>먼저 내 선택을 확정합니다.</b> 다른 참여자의 비율은 선택한 뒤에만 보입니다. <b>잘못 선택했다면 ‘다시 선택’으로 수정할 수 있습니다.</b> 친구들의 결과를 본 뒤 선택을 바꾸는 용도로는 사용하지 마세요.';
    notice.dataset.reselectNotice='1';
  }
}
function enhanceBalanceReselect(root){
  updateBalanceNotice(root);
  root.querySelectorAll('.careerDnaStandard .balanceCard').forEach(card=>{
    const selected=card.querySelector('.balanceChoice.selected');
    const hint=card.querySelector('.valueHint');
    if(!selected||!hint||hint.querySelector('.balanceReselect'))return;
    const index=Number(selected.dataset.index);if(!Number.isInteger(index))return;
    const btn=document.createElement('button');btn.type='button';btn.className='balanceReselect';btn.textContent='다시 선택';btn.setAttribute('aria-label',`${index+1}번 밸런스게임 다시 선택`);
    btn.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();
      if(!confirm('이 문항을 다시 선택할까요? 현재 선택을 지운 뒤 A/B를 다시 고를 수 있습니다.'))return;
      const state=parseState();
      const answers=state.assessments?.careerDNA?.balance?.answers;
      if(!Array.isArray(answers))return;
      while(answers.length<7)answers.push(null);
      answers[index]=null;
      state.activeStep=1;
      writeState(state);
      try{sessionStorage.setItem(REOPEN_BALANCE_KEY,String(index))}catch{}
      try{await window.JobfitStorageContinuity?.syncNow?.()}catch{}
      location.reload();
    });
    hint.appendChild(btn);
  });
}
function appendSwotPrompt(root){
  const box=root.querySelector('#promptBox');if(!box)return;
  const current=box.textContent||'';
  if(!current||current.includes(SWOT_PROMPT_MARKER))return;
  box.textContent=current+SWOT_PROMPT_EXTENSION;
}
function enhanceAiSwot(root){
  const makePrompt=root.querySelector('#makePrompt');
  if(makePrompt){
    if(makePrompt.textContent!==PROMPT_LABEL)makePrompt.textContent=PROMPT_LABEL;
    if(!makePrompt.dataset.swotExtension){
      makePrompt.dataset.swotExtension='1';
      makePrompt.addEventListener('click',()=>appendSwotPrompt(root));
    }
  }
  const guide=root.querySelector('#careerDnaAiGuide');
  if(guide&&!guide.dataset.standardGuide){guide.innerHTML=GUIDE_HTML;guide.dataset.standardGuide='1'}
  const block=makePrompt?.closest('.block');
  if(block&&!block.querySelector('.swotGuide')){
    const info=document.createElement('div');info.className='callout good swotGuide';
    info.innerHTML='<b>추가 분석</b> · AI가 강점 키워드 5개, 약점/보완 키워드 3개, SWOT(S·W·O·T), SO·ST·WO·WT 전략까지 정리하도록 프롬프트에 포함됩니다. 외부 기회·위협 근거가 없으면 임의로 만들지 않습니다.';
    guide?.insertAdjacentElement('afterend',info);
  }
  const hypothesis=root.querySelector('#aiHypothesis');
  if(hypothesis){
    const label=hypothesis.closest('.field')?.querySelector('label');
    const labelText='AI 통합분석 결과 · 강점/약점 키워드·SWOT 포함, 내가 확인한 내용';
    if(label&&label.textContent!==labelText)label.textContent=labelText;
    const placeholder='AI 결과를 그대로 믿지 말고, 강점·약점 키워드와 SWOT 근거를 확인한 뒤 맞는 부분·수정할 부분·추가 확인할 부분을 남기세요.';
    if(hypothesis.placeholder!==placeholder)hypothesis.placeholder=placeholder;
  }
}
function enhanceCareerDNA(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const heading=root.querySelector('h2');if(!heading||!heading.textContent.includes('Career DNA'))return;
  injectStyles();
  enhanceBalanceReselect(root);
  enhanceAiSwot(root);
  enhanceCollapsibles(root);
  reopenBalanceIfNeeded(root);
  ensureStandardCompatibility();
}

const observer=new MutationObserver(()=>enhanceCareerDNA());
function start(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  observer.observe(root,{childList:true,subtree:true});
  root.addEventListener('click',event=>{
    const btn=event.target.closest?.('button');
    if(btn&&['saveDNA','makePrompt','nextStep'].includes(btn.id))setTimeout(ensureStandardCompatibility,0);
  });
  enhanceCareerDNA();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.JobfitCareerDnaUx={readState:parseState,ensureStandardCompatibility,enhanceCareerDNA};
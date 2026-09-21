const ROOT_ID='stepRoot';
const STORAGE_KEY='jobfit:v2:learner';
const REOPEN_BALANCE_KEY='jobfit:balance-reopen';
const PROMPT_LABEL='자기이해 + SWOT 통합분석 만들기';
const GUIDE_HTML='<b>AI LAB 사용 순서</b><br>① 현재 내용 저장 → ② 통합분석 프롬프트 만들기 → ③ 복사 → ④ 수업에서 사용하는 AI에 붙여넣기 → ⑤ 결과를 읽고 나와 맞는 부분 확인 → ⑥ 08 Career DNA 가설에 핵심 내용 저장<br><span class="muted">AI 결과에는 자기이해 가설과 함께 <b>자소서용 강점·약점 키워드</b>, <b>근거 상태</b>, <b>4주차 경험 확인 질문</b>, <b>SWOT 분석·전략</b>을 요청합니다. STEP 1 정보만으로 판단할 수 없는 기회(O)·위협(T)은 임의로 만들지 않고 ‘추가 정보 필요’로 표시합니다. 아직 실제 경험으로 확인하지 않은 키워드는 자소서 문장으로 확정하지 않습니다. Jobfit이 입력내용을 AI로 자동 전송하지는 않습니다.</span>';
const SWOT_PROMPT_MARKER='[추가 출력 · 자기소개서 활용 키워드 + SWOT]';
const WEEK4_BRIDGE_MARKER='[3주차에서 내가 검토해 둔 자기이해 후보 · 참고만]';
const SWOT_PROMPT_EXTENSION=`

[추가 출력 · 자기소개서 활용 키워드 + SWOT]
아래 7~12번은 자기소개서에 바로 문장을 써 주는 단계가 아니다. STEP 1 자료에서 ‘소재 후보’를 찾고, STEP 2의 실제 경험으로 검증하기 위한 준비 단계다. 검사명이나 점수만으로 역량을 확정하지 않는다.

7. 자기소개서에서 활용할 수 있는 강점 키워드 5개
- 한 단어 또는 짧은 표현으로 제시한다.
- 반드시 다음 표 형식으로 작성한다.
  강점 키워드 | 근거가 된 입력자료 | 근거 상태 | 4주차 실제 경험에서 확인할 질문
- 근거 상태는 ‘반복 근거’, ‘단일 근거’, ‘경험 확인 필요’ 중 하나만 사용한다.
- 서로 다른 자료 2개 이상에서 같은 방향의 특징이 반복될 때만 ‘반복 근거’로 표시한다.
- VIA, Career Anchor, 다중지능 결과 하나만으로 직무역량이라고 표현하지 않는다.
- 막연한 칭찬보다 실제 행동으로 확인할 수 있는 표현을 우선한다.

8. 자기소개서·면접에서 다룰 수 있는 약점/보완 키워드 3개
- 사람 자체를 부정적으로 규정하지 않는다.
- 자기인식과 검사결과의 불일치, 강점의 과잉 사용 가능성, 실제 경험으로 더 확인해야 하는 부분에서만 도출한다.
- 반드시 다음 표 형식으로 작성한다.
  약점/보완 키워드 | 근거 | 나타날 수 있는 상황 | 현재 가능한 보완 행동 | 4주차 확인 질문
- 근거가 부족하면 억지로 약점을 만들지 말고 ‘추가 확인 필요’라고 표시한다.
- 의학적·성격적 결함처럼 표현하지 않는다.

9. SWOT 분석
- 표 형식: 구분 | 현재 확인되는 내용 | 근거 또는 추가로 확인할 정보
- S(Strengths): 현재 자료에서 반복 확인되는 내부 강점 후보
- W(Weaknesses): 현재 자료에서 확인되는 내부 보완점 또는 강점의 과잉 사용 위험
- O(Opportunities): 현재 입력자료에서 근거가 확인되는 외부 기회만 작성
- T(Threats): 현재 입력자료에서 근거가 확인되는 외부 위험만 작성
- STEP 1에는 직무·기업·채용시장 정보가 충분하지 않을 수 있다. O와 T의 근거가 없으면 임의 추정하지 말고 ‘추가 정보 필요’라고 표시하고, 이후 STEP에서 무엇을 확인해야 하는지 적는다.

10. SWOT 전략
- SO 전략: 강점을 활용해 확인된 기회를 잡는 방법
- ST 전략: 강점으로 확인된 위험에 대응하는 방법
- WO 전략: 보완점을 개선하며 확인된 기회를 활용하는 방법
- WT 전략: 보완점과 확인된 위험이 겹칠 때의 예방 행동
- 표 형식: 전략 | 현재 가능한 행동 | 연결 단계 | 근거 상태
- 각 전략은 1~2개씩 제시한다.
- O 또는 T의 근거가 없으면 전략을 지어내지 말고 ‘STEP 3 이후 직무·기업 정보 확인 후 작성’이라고 표시한다.
- 연결 단계는 ‘취업준비 행동’, ‘경험 설계’, ‘자기소개서 소재 개발’ 중 하나로 표시한다.

11. 자소서 소재 준비표
- 강점 키워드 중 근거가 상대적으로 선명한 3개를 고른다. 순위를 매기는 것이 아니라, 다음 단계에서 먼저 검증할 소재 후보를 정하는 것이다.
- 표 형식: 강점 소재 후보 | 현재 근거 | 자소서에서 증명해야 할 행동 | 4주차 경험 인터뷰 질문
- 실제 경험이 아직 확인되지 않았다면 ‘경험 근거 확인 전 문장화 금지’라고 표시한다.
- 약점/보완 키워드 중 2개를 별도로 정리하고 ‘보완 행동을 보여줄 실제 사례가 있는지’ 확인할 질문을 붙인다.

12. Jobfit 저장용 요약
아래 형식으로 짧게 다시 정리한다.
- 강점 키워드 5개:
- 약점/보완 키워드 3개:
- 내가 중요하게 생각하는 일의 조건:
- 경험으로 먼저 확인할 강점 소재 3개:
- 4주차 실제 경험에서 확인할 질문 3개:
- SWOT 핵심: S / W / O / T 각각 한 줄
- 아직 추가 정보가 필요한 부분:

주의: 키워드를 자기소개서 문장으로 바로 확정하지 말고, 다음 STEP에서 실제 경험의 상황·행동·결과·증거와 연결해 검증한다.`;

let reopenBalanceIndex=null;
let structuredDraft=null;
try{
  const rawPending=sessionStorage.getItem(REOPEN_BALANCE_KEY);
  if(rawPending!==null){
    const pending=Number(rawPending);
    if(Number.isInteger(pending)&&pending>=0&&pending<7)reopenBalanceIndex=pending;
  }
}catch{}

function parseState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function writeState(state){
  state.meta=state.meta||{};
  state.meta.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function normalizeList(value,max){
  const source=Array.isArray(value)?value:String(value||'').split(/[,;\n·]+/);
  const out=[];
  source.map(x=>String(x||'').trim()).filter(Boolean).forEach(x=>{if(!out.includes(x)&&out.length<max)out.push(x)});
  return out;
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
    .careerDnaStructured{margin-top:12px;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fafbff}
    .careerDnaStructured h4{margin:0 0 5px}.careerDnaStructured .help{margin-bottom:10px}
    .careerDnaStructuredGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .jobfitStructuredBridge{margin-top:10px;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fbfbff}
    .jobfitStructuredBridge h4{margin:0 0 4px}.jobfitStructuredBridge p{margin:5px 0}.jobfitStructuredBridge small{color:var(--muted);font-weight:800}
    .jobfitStructuredBridge ul{margin:5px 0 0;padding-left:20px}
    @media(max-width:760px){.careerDnaStructuredGrid{grid-template-columns:1fr}}
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
    if(!head)return;
    block.dataset.jobfitCollapsible='0';
    head.classList.remove('jobfitModuleToggle');
    head.removeAttribute('role');
    head.removeAttribute('tabindex');
    head.setAttribute('aria-expanded','true');
    head.querySelector('p')?.removeAttribute('hidden');
    head.querySelector('.jobfitModuleToggleIcon')?.remove();
    [...block.children].filter(el=>el!==head).forEach(el=>{
      el.classList.remove('jobfitModuleBody');
      el.removeAttribute('hidden');
    });
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
      persistStructuredHypothesis();
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
    info.innerHTML='<b>추가 분석</b> · AI가 강점 키워드 5개, 약점/보완 키워드 3개를 근거 상태와 함께 정리하고, 4주차 실제 경험에서 확인할 질문까지 만듭니다. SWOT(S·W·O·T)과 SO·ST·WO·WT 전략도 포함하되 외부 기회·위협의 근거가 없으면 임의로 만들지 않습니다.';
    guide?.insertAdjacentElement('afterend',info);
  }
  const hypothesis=root.querySelector('#aiHypothesis');
  if(hypothesis){
    const label=hypothesis.closest('.field')?.querySelector('label');
    const labelText='AI 통합분석 결과 · 강점/약점 키워드·SWOT 포함, 내가 확인한 내용';
    if(label&&label.textContent!==labelText)label.textContent=labelText;
    const placeholder='AI 결과를 그대로 믿지 말고, 강점·약점 키워드의 근거 상태와 SWOT 근거를 확인한 뒤 맞는 부분·수정할 부분·4주차 경험으로 확인할 부분을 남기세요.';
    if(hypothesis.placeholder!==placeholder)hypothesis.placeholder=placeholder;
  }
}
function enhanceHypothesisStructured(root){
  const hypothesis=root.querySelector('#aiHypothesis');if(!hypothesis)return;
  const state=parseState(),h=state.assessments?.careerDNA?.hypothesis||{};
  if(root.querySelector('#careerDnaStructuredSummary')){
    if(!structuredDraft)structuredDraft={strengthKeywords:normalizeList(h.strengthKeywords,5),developmentKeywords:normalizeList(h.developmentKeywords,3),verifyQuestions:normalizeList(h.verifyQuestions,3)};
    return;
  }
  const wrap=document.createElement('div');wrap.id='careerDnaStructuredSummary';wrap.className='careerDnaStructured';
  wrap.innerHTML='<h4>4주차로 가져갈 핵심만 다시 확인</h4><p class="help">AI 결과를 그대로 옮기지 말고, 내가 읽어보고 납득한 후보만 적으세요. 아직 ‘확정된 역량’이 아니라 실제 경험에서 확인할 가설입니다.</p><div class="careerDnaStructuredGrid"><div class="field"><label>내가 검토한 강점 키워드 <span class="muted">최대 5개</span></label><input class="input" id="verifiedStrengthKeywords" placeholder="예: 신중한 실행, 학습, 협력"><span class="hint">쉼표로 구분. 4주차 경험에서 행동근거를 확인합니다.</span></div><div class="field"><label>보완 키워드 <span class="muted">최대 3개</span></label><input class="input" id="verifiedDevelopmentKeywords" placeholder="예: 과도한 신중함, 우선순위 조정"><span class="hint">성격의 결함이 아니라 보완 행동이 필요한 후보만 남깁니다.</span></div></div><div class="field" style="margin-top:10px"><label>4주차 실제 경험에서 확인할 질문 <span class="muted">최대 3개 · 한 줄에 하나</span></label><textarea id="verifiedExperienceQuestions" placeholder="예: 협업 상황에서도 신중함이 실제 행동으로 나타났는가?\n결정을 내려야 할 때 신중함이 속도를 늦춘 적은 없었는가?"></textarea></div>';
  hypothesis.closest('.field')?.insertAdjacentElement('afterend',wrap);
  const strength=root.querySelector('#verifiedStrengthKeywords'),development=root.querySelector('#verifiedDevelopmentKeywords'),questions=root.querySelector('#verifiedExperienceQuestions');
  strength.value=normalizeList(h.strengthKeywords,5).join(', ');
  development.value=normalizeList(h.developmentKeywords,3).join(', ');
  questions.value=normalizeList(h.verifyQuestions,3).join('\n');
  const syncDraft=()=>{structuredDraft={strengthKeywords:normalizeList(strength.value,5),developmentKeywords:normalizeList(development.value,3),verifyQuestions:normalizeList(questions.value,3)}};
  [strength,development,questions].forEach(el=>el.addEventListener('input',syncDraft));
  syncDraft();
}
function persistStructuredHypothesis(){
  if(!structuredDraft)return;
  const state=parseState(),dna=state.assessments?.careerDNA;if(!dna)return;
  dna.hypothesis={...(dna.hypothesis||{}),strengthKeywords:[...structuredDraft.strengthKeywords],developmentKeywords:[...structuredDraft.developmentKeywords],verifyQuestions:[...structuredDraft.verifyQuestions],structuredVersion:'career-dna-verified-summary-v1'};
  writeState(state);
  window.JobfitStorageContinuity?.syncNow?.();
}
function enhanceCareerDNA(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const heading=root.querySelector('h2');if(!heading||!heading.textContent.includes('Career DNA'))return;
  injectStyles();
  enhanceBalanceReselect(root);
  enhanceAiSwot(root);
  enhanceHypothesisStructured(root);
  enhanceCollapsibles(root);
  reopenBalanceIfNeeded(root);
  ensureStandardCompatibility();
}
function addBridgeRow(box,label,value){
  const row=document.createElement('div');row.style.marginTop='9px';
  const small=document.createElement('small');small.textContent=label;row.appendChild(small);
  if(Array.isArray(value)){
    const ul=document.createElement('ul');value.forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.appendChild(li)});row.appendChild(ul);
  }else{const p=document.createElement('p');p.textContent=value;row.appendChild(p)}
  box.appendChild(row);
}
function enhanceExperienceBridge(root){
  if(root.querySelector('#jobfitStructuredBridge'))return;
  const h=parseState().assessments?.careerDNA?.hypothesis||{};
  const strengths=normalizeList(h.strengthKeywords,5),development=normalizeList(h.developmentKeywords,3),questions=normalizeList(h.verifyQuestions,3);
  if(!strengths.length&&!development.length&&!questions.length)return;
  const box=document.createElement('div');box.id='jobfitStructuredBridge';box.className='jobfitStructuredBridge';
  const title=document.createElement('h4');title.textContent='3주차에서 내가 검토해 둔 후보';box.appendChild(title);
  const note=document.createElement('p');note.className='help';note.textContent='아직 확정된 역량이 아닙니다. 이번 주 실제 경험의 행동·결과·증거에서 맞는지 확인합니다.';box.appendChild(note);
  if(strengths.length)addBridgeRow(box,'강점 후보',strengths.join(' · '));
  if(development.length)addBridgeRow(box,'보완 후보',development.join(' · '));
  if(questions.length)addBridgeRow(box,'이번 주 확인 질문',questions);
  const firstBlock=root.querySelector('.block'),anchor=root.querySelector('.dnaBridge')||firstBlock?.querySelector('.callout')||firstBlock?.querySelector('.moduleHead');
  anchor?.insertAdjacentElement('afterend',box);
}
function appendWeek4BridgePrompt(root){
  const box=root.querySelector('#interviewPrompt');if(!box)return;
  const current=box.textContent||'';if(!current||current.includes(WEEK4_BRIDGE_MARKER))return;
  const h=parseState().assessments?.careerDNA?.hypothesis||{};
  const strengths=normalizeList(h.strengthKeywords,5),development=normalizeList(h.developmentKeywords,3),questions=normalizeList(h.verifyQuestions,3);
  if(!strengths.length&&!development.length&&!questions.length)return;
  const lines=['', '', WEEK4_BRIDGE_MARKER,'아래 내용은 3주차에서 내가 검토한 자기이해 후보이며 사실로 전제하지 않는다. 이번 경험에서 실제 행동근거가 확인될 때만 유지하고, 근거가 없으면 수정하거나 버린다.'];
  if(strengths.length)lines.push(`강점 후보: ${strengths.join(' · ')}`);
  if(development.length)lines.push(`보완 후보: ${development.join(' · ')}`);
  if(questions.length){lines.push('이번 주 확인 질문:');questions.forEach((q,i)=>lines.push(`${i+1}. ${q}`))}
  lines.push('인터뷰에서는 위 키워드에 맞추어 답을 유도하지 말고, 내가 말한 실제 행동을 먼저 확인한 뒤 일치 여부를 판단한다.');
  box.textContent=current+lines.join('\n');
}
function enhanceExperienceWeek4(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const heading=root.querySelector('h2');if(!heading||!heading.textContent.includes('나의 경험에서 직무역량 찾기'))return;
  injectStyles();enhanceExperienceBridge(root);
  const btn=root.querySelector('#makeInterviewPrompt');
  if(btn&&!btn.dataset.careerDnaBridge){btn.dataset.careerDnaBridge='1';btn.addEventListener('click',()=>appendWeek4BridgePrompt(root))}
}
function enhanceAll(){enhanceCareerDNA();enhanceExperienceWeek4()}

const observer=new MutationObserver(()=>enhanceAll());
function start(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  observer.observe(root,{childList:true,subtree:true});
  root.addEventListener('click',event=>{
    const btn=event.target.closest?.('button');
    if(btn?.closest?.('.careerDnaStandard')){
      if(['saveDNA','makePrompt','nextStep'].includes(btn.id)||btn.matches('[data-balance-choice]'))persistStructuredHypothesis();
      if(['saveDNA','makePrompt','nextStep'].includes(btn.id))setTimeout(ensureStandardCompatibility,0);
    }
  });
  enhanceAll();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.JobfitCareerDnaUx={readState:parseState,ensureStandardCompatibility,enhanceCareerDNA,persistStructuredHypothesis};
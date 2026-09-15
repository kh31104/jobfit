const ROOT_ID='stepRoot';
const PROMPT_BUTTON_LABEL='Career DNA 인터뷰 프롬프트 만들기';
const STORAGE_KEY='jobfit:v2:learner';

function parseState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function normalizeResultVersion(value,type){
  const expected=`${type}형(개정)`;
  const text=String(value||'').trim();
  if(!text)return expected;
  if(text.includes(`${type}형`))return text;
  if(/[SL]형/.test(text))return text.replace(/[SL]형/g,`${type}형`);
  return text;
}
function persistCorrectedVersion(type,version){
  const state=parseState();
  const dna=state.assessments?.careerDNA;
  if(!dna?.interest)return;
  const currentType=String(dna.interest.type||'');
  const currentVersion=String(dna.interest.resultVersion||'');
  if(currentType===type&&currentVersion===version)return;
  state.assessments=state.assessments||{};
  state.assessments.careerDNA=dna||{};
  state.assessments.careerDNA.interest={...(dna.interest||{}),type,resultVersion:version};
  state.meta=state.meta||{};
  state.meta.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  window.JobfitStorageContinuity?.syncNow?.();
}
function syncResultVersion(root,{persist=true}={}){
  const active=root.querySelector('.choiceCard.on[data-type]');
  const type=active?.dataset.type;
  const input=root.querySelector('#resultVersion');
  if(!type||!input)return;
  const corrected=normalizeResultVersion(input.value,type);
  if(input.value!==corrected)input.value=corrected;
  if(persist)persistCorrectedVersion(type,corrected);
}

function enhanceCareerDNA(){
  const root=document.getElementById(ROOT_ID);
  if(!root)return;
  const heading=root.querySelector('h2');
  if(!heading||!heading.textContent.includes('Career DNA'))return;

  syncResultVersion(root);

  const sCard=root.querySelector('.choiceCard[data-type="S"] span');
  const lCard=root.querySelector('.choiceCard[data-type="L"] span');
  if(sCard&&!sCard.dataset.deviceNote){
    sCard.textContent=`${sCard.textContent} · PC·모바일`;
    sCard.dataset.deviceNote='1';
  }
  if(lCard&&!lCard.dataset.deviceNote){
    lCard.textContent=`${lCard.textContent} · PC`;
    lCard.dataset.deviceNote='1';
  }

  const choiceGrid=root.querySelector('.choiceGrid');
  if(choiceGrid&&!root.querySelector('#careerDnaDeviceNotice')){
    const notice=document.createElement('div');
    notice.id='careerDnaDeviceNotice';
    notice.className='callout info';
    notice.style.marginTop='12px';
    notice.innerHTML='<b>검사 기기 안내</b> · 고용24 현재 안내 기준 S형은 PC·모바일, L형은 PC에서 지원됩니다. 수업에서 L형이 지정된 경우 PC에서 실시하세요.';
    choiceGrid.insertAdjacentElement('afterend',notice);
  }

  const makePrompt=root.querySelector('#makePrompt');
  if(makePrompt){
    if(makePrompt.textContent!==PROMPT_BUTTON_LABEL)makePrompt.textContent=PROMPT_BUTTON_LABEL;
    const actions=makePrompt.closest('.actions');
    if(actions&&!root.querySelector('#careerDnaAiGuide')){
      const guide=document.createElement('div');
      guide.id='careerDnaAiGuide';
      guide.className='callout info';
      guide.style.marginTop='12px';
      guide.innerHTML='<b>AI LAB 사용 순서</b><br>① 프롬프트 만들기 → ② 프롬프트 복사 → ③ 수업에서 사용하는 AI에 붙여넣기 → ④ AI가 묻는 질문에 한 번에 하나씩 답하기<br><span class="muted">이 버튼은 인터뷰용 프롬프트만 만듭니다. 입력한 내용이 AI로 자동 전송되지는 않습니다.</span>';
      actions.insertAdjacentElement('beforebegin',guide);
    }
  }
}

const observer=new MutationObserver(()=>enhanceCareerDNA());

function start(){
  const root=document.getElementById(ROOT_ID);
  if(!root)return;
  observer.observe(root,{childList:true,subtree:true});
  root.addEventListener('click',event=>{
    const target=event.target.closest?.('button');
    if(target&&['saveDNA','makePrompt','nextStep'].includes(target.id))syncResultVersion(root);
  },true);
  root.addEventListener('change',event=>{
    if(event.target?.id==='resultVersion')syncResultVersion(root);
  },true);
  enhanceCareerDNA();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
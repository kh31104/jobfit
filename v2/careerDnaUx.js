const ROOT_ID='stepRoot';
const PROMPT_BUTTON_LABEL='Career DNA 인터뷰 프롬프트 만들기';

function enhanceCareerDNA(){
  const root=document.getElementById(ROOT_ID);
  if(!root)return;
  const heading=root.querySelector('h2');
  if(!heading||!heading.textContent.includes('Career DNA'))return;

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
  enhanceCareerDNA();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

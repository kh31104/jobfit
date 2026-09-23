const ROOT_ID='stepRoot';

const STEP1_COPY=[
  {
    title:'가치 선택 · 밸런스게임 (Balance Game)',
    description:'둘 중 지금의 나에게 더 중요한 조건을 고르며, 일에서 중요하게 보는 가치 단서를 확인합니다.'
  },
  {
    title:'나의 커리어 기준 · 커리어 앵커 (Career Anchor)',
    description:'40문항에 응답해 내가 일과 커리어에서 쉽게 포기하기 어려운 기준을 확인합니다.'
  },
  {
    title:'내가 생각하는 나의 강점 · 먼저 고르기',
    description:'검사결과를 보기 전에 스스로 생각하는 대표 강점 5개를 먼저 고릅니다.'
  },
  {
    title:'VIA 성격강점 · 검사결과 비교하기',
    description:'공식 VIA 결과의 상위 5개를 입력해 내가 고른 강점과 비교할 자료를 만듭니다.'
  },
  {
    title:'내가 생각하는 나 × 검사에서 나타난 나 · 비교하기',
    description:'반복되는 점·연결되는 점·예상과 다른 점을 직접 비교하고, 실제 경험에서 확인할 질문을 만듭니다.'
  },
  {
    title:'AI 통합분석 · 강점·보완점·SWOT 정리',
    description:'지금까지의 자료를 AI가 근거 중심으로 정리하도록 하고, 강점·보완점·SWOT을 가설 수준으로 확인합니다.'
  },
  {
    title:'Career DNA 가설 v1 · 내가 확인한 내용만 저장',
    description:'AI 결과 중 내가 납득한 핵심과 더 확인할 부분만 남기고, 다음 주 실제 경험에서 검증합니다.'
  }
];

const STEP2_COPY=[
  {
    title:'지난주 Career DNA 간단히 확인 · 실제 경험으로 검증',
    description:'지난주 강점 후보를 정답으로 쓰지 않고, 실제 경험에서 확인할 가설과 질문만 가져옵니다.'
  },
  {
    title:'My Best 3 Experience · 경험 후보 꺼내기',
    description:'강점 이름부터 정하지 말고 실제 경험을 최대 3개 떠올립니다. 1~2개만 떠올라도 대표 경험 1개부터 분석할 수 있습니다.'
  },
  {
    title:'STAR 기반 AI Experience Interview · 대표 경험 깊게 묻기',
    description:'STAR를 직접 작성하는 대신, AI가 빠진 내용을 한 질문씩 묻고 내가 실제로 한 행동·판단·결과를 확인합니다.'
  },
  {
    title:'AI가 이해한 내 경험 사실확인',
    description:'STAR 인터뷰 결과에서 문제·행동·판단·결과와 확인 가능한 근거만 간단히 정리합니다.'
  },
  {
    title:'경험에서 확인된 역량 · C01~C12',
    description:'04에서 확인한 행동을 보면서 표준역량을 최대 3개까지 연결합니다. 근거가 없으면 선택하지 않아도 됩니다.'
  },
  {
    title:'Experience Map · 내 경험 근거 모아보기',
    description:'저장한 경험의 행동·결과·역량근거를 확인합니다. 1개는 기본 분석, 2개 이상부터 반복 여부를 비교합니다.'
  },
  {
    title:'Competency Map · 반복 행동 확인',
    description:'여러 경험에서 같은 역량의 행동근거가 반복되는지 확인합니다. 경험 횟수는 역량 점수가 아닙니다.'
  },
  {
    title:'My Experience DNA · 경험으로 확인한 나',
    description:'Career DNA의 자기인식과 실제 경험의 행동근거를 구분해 다음 직무탐색 단계로 가져갑니다.'
  }
];

function root(){return document.getElementById(ROOT_ID)}

function moduleBlocks(section){
  if(!section)return[];
  return [...section.children].filter(el=>el.classList?.contains('block'));
}

function applyModuleCopy(section,copy){
  const blocks=moduleBlocks(section);
  if(blocks.length<copy.length)return;
  copy.forEach((item,index)=>{
    const block=blocks[index];
    const h3=block.querySelector(':scope > .moduleHead h3');
    const p=block.querySelector(':scope > .moduleHead p');
    if(h3){
      const status=h3.querySelector('.jobfitModuleStatus');
      const currentTitle=[...h3.childNodes].filter(node=>node!==status).map(node=>node.textContent||'').join('').trim();
      if(currentTitle!==item.title){
        [...h3.childNodes].filter(node=>node!==status).forEach(node=>node.remove());
        h3.insertBefore(document.createTextNode(item.title),status||null);
      }
    }
    if(p&&p.textContent.trim()!==item.description)p.textContent=item.description;
  });
}

function enhanceStep1(section){
  applyModuleCopy(section,STEP1_COPY);

  const flow=section.querySelector('.callout.info');
  if(flow&&flow.textContent.includes('오늘의 흐름')&&!flow.dataset.learningFlowCopy){
    flow.innerHTML='<b>오늘의 흐름</b> · 가치 선택 → 커리어 기준 → 내가 보는 강점 → VIA → 직접 비교 → AI 통합분석 → Career DNA v1';
    flow.dataset.learningFlowCopy='1';
  }

  const guide=section.querySelector('#careerDnaAiGuide');
  if(guide&&!guide.dataset.learningFlowGuide){
    guide.innerHTML='<b>AI LAB 사용 순서</b><br>① 현재 내용 저장 → ② 통합분석 프롬프트 만들기 → ③ 복사해 수업에서 사용하는 AI에 붙여넣기 → ④ 결과의 근거와 ‘경험 확인 필요’ 표시 검토 → ⑤ 마지막의 Jobfit 저장용 요약을 중심으로 핵심만 정리 → ⑥ 07 Career DNA 가설에 저장<br><span class="muted">AI 결과는 최종 판정이 아닙니다. 실제 경험으로 확인하지 않은 강점·약점·역량은 다음 STEP에서 검증합니다. Jobfit이 입력내용을 AI로 자동 전송하지는 않습니다.</span>';
    guide.dataset.learningFlowGuide='1';
  }
}

function addStep2BridgeGuide(section){
  const firstBlock=moduleBlocks(section)[0];
  if(!firstBlock||firstBlock.querySelector('.jobfitFlowBridgeGuide'))return;
  const box=document.createElement('div');
  box.className='callout good jobfitFlowBridgeGuide';
  box.style.marginTop='10px';
  box.innerHTML='<b>가설을 경험으로 확인하는 순서</b><br>① STEP 1에서 남긴 강점·보완 후보와 확인 질문 읽기 → ② 그 특징이 실제로 나타났던 경험 떠올리기 → ③ 내가 직접 한 행동·결과·증거 확인 → ④ 근거가 있으면 유지하고, 없으면 수정하거나 버리기';
  const structured=firstBlock.querySelector('#jobfitStructuredBridge');
  const dnaBridge=firstBlock.querySelector('.dnaBridge');
  (structured||dnaBridge||firstBlock.querySelector('.moduleHead'))?.insertAdjacentElement('afterend',box);
}

function enhanceStep2(section){
  applyModuleCopy(section,STEP2_COPY);
  addStep2BridgeGuide(section);

  const interviewBlock=moduleBlocks(section)[2];
  if(interviewBlock&&!interviewBlock.querySelector('.jobfitInterviewSafetyGuide')){
    const actions=interviewBlock.querySelector('#makeInterviewPrompt')?.closest('.actions');
    if(actions){
      const box=document.createElement('div');
      box.className='callout info jobfitInterviewSafetyGuide';
      box.style.marginTop='10px';
      box.innerHTML='<b>인터뷰 원칙</b> · STEP 1의 강점 후보에 맞는 경험을 만들어내지 않습니다. 먼저 실제 행동을 확인하고, 마지막에만 강점·역량 후보와 일치하는지 판단합니다.';
      actions.insertAdjacentElement('beforebegin',box);
    }
  }
}

function enhance(){
  const current=root();if(!current)return;
  const step1=current.querySelector('.careerDnaStandard');
  if(step1)enhanceStep1(step1);
  const step2=current.querySelector('.experienceCompetencyWeek4');
  if(step2)enhanceStep2(step2);
}

const observer=new MutationObserver(()=>enhance());
function start(){
  const current=root();if(!current)return;
  observer.observe(current,{childList:true,subtree:true});
  enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.JobfitCareerDnaLearningFlowUx={enhance};
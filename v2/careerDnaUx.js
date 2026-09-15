const ROOT_ID='stepRoot';
const STORAGE_KEY='jobfit:v2:learner';

function parseState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function enhanceCareerDNA(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const heading=root.querySelector('h2');if(!heading||!heading.textContent.includes('Career DNA'))return;
  const makePrompt=root.querySelector('#makePrompt');
  if(makePrompt){
    makePrompt.textContent='현재 결과로 자기이해 통합하기';
    const guide=root.querySelector('#careerDnaAiGuide');
    if(guide)guide.innerHTML='<b>AI LAB 사용 순서</b><br>① 현재 내용 저장 → ② 통합분석 프롬프트 만들기 → ③ 복사 → ④ 수업에서 사용하는 AI에 붙여넣기<br><span class="muted">3주차에서는 AI가 인터뷰하지 않습니다. 입력한 내용을 한 번에 통합해 자기이해 가설을 만들고, 실제 경험 확인은 4주차에 진행합니다. Jobfit이 입력내용을 AI로 자동 전송하지는 않습니다.</span>';
  }
}

const observer=new MutationObserver(()=>enhanceCareerDNA());
function start(){const root=document.getElementById(ROOT_ID);if(!root)return;observer.observe(root,{childList:true,subtree:true});enhanceCareerDNA()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.JobfitCareerDnaUx={readState:parseState};

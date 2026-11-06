import {restoreBeforeApp,startContinuity} from './storageContinuity.js?v=2';

await restoreBeforeApp();

// INJE2026의 STEP 0 PRE는 학생 개인의 수업용 시작점 측정이다.
// 중앙 연구데이터 제출은 research:false와 research-sync 설정으로 계속 차단한다.
// 운영용 중앙 DB 동기화는 연구 제출과 분리하여 익명·구조화 데이터만 저장한다.
// 실제 학생용 GitHub Pages에서는 이전 measures=false 링크도 7단계 STEP 0으로 복원한다.
// localhost 자동검사는 보호된 문항 서버의 CORS 영향을 피하기 위해 PRE 전용 테스트에서만 measures=true를 명시한다.
const bootParams=new URLSearchParams(location.search);
const bootCourse=String(bootParams.get('course')||'').trim().toUpperCase();
const isInjeCourse=['INJE2026','INJE-2026-2'].includes(bootCourse);
const isLocalTest=['localhost','127.0.0.1'].includes(location.hostname);
if(isInjeCourse){
  const desired=isLocalTest?(bootParams.has('measures')?bootParams.get('measures'):'false'):'true';
  if(bootParams.get('measures')!==desired){
    bootParams.set('measures',desired);
    const query=bootParams.toString();
    history.replaceState(null,'',`${location.pathname}${query?`?${query}`:''}${location.hash||''}`);
  }
}

// iPhone Safari는 여러 번 새로고침하면 이전 문서의 진행 중인 import()가
// 취소되기도 한다. 해당 거부를 미처리 Promise로 남기지 않는다.
let leavingPage=false;
window.addEventListener('pagehide',()=>{leavingPage=true},{once:true});
const moduleLoadError=error=>error?.name==='TypeError'&&/module|import|fetch|load|network/i.test(String(error?.message||''));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function loadModule(specifier,label){
  for(let attempt=0;attempt<2;attempt++){
    if(leavingPage)return null;
    const url=attempt?specifier+(specifier.includes('?')?'&':'?')+'jobfit_retry=1':specifier;
    try{return await import(url)}
    catch(error){
      if(leavingPage)return null;
      // 문법 오류·코드 실행 오류는 재시도하지 않고 별도로 진단한다.
      if(!moduleLoadError(error)||attempt===1){
        console.error('Jobfit 모듈 초기화 실패 ('+label+'):',error);
        return null;
      }
      await pause(160);
    }
  }
  return null;
}
function showModuleFailure(label){
  if(leavingPage)return;
  const root=document.getElementById('stepRoot');
  if(!root)return;
  root.innerHTML='<section class="card callout warn"><b>'+label+'을 불러오지 못했습니다.</b><p>통신 상태를 확인한 뒤 다시 시도하세요. 기존 입력값은 초기화되지 않습니다.</p><button type="button" class="btn primary" id="retryAppLoad">다시 불러오기</button></section>';
  document.getElementById('retryAppLoad')?.addEventListener('click',()=>location.reload());
}

const app=await loadModule('./app.js?v=47','학습 화면');
if(!app){
  showModuleFailure('학습 화면');
}else if(!leavingPage){
  startContinuity();
  for(const [specifier,label] of [
    ['./injeClassroom.js?v=18','수업 도구'],
    ['./careerDnaUx.js?v=10','Career DNA'],
    ['./careerDnaStudentUx.js?v=1','Career DNA 결과'],
    ['./careerDnaLearningFlowUx.js?v=8','Career DNA 학습']
  ]){
    if(leavingPage)break;
    await loadModule(specifier,label);
  }
  if(!leavingPage){
    const sync=await loadModule('./operationalSync.js?v=2','운영 데이터 동기화');
    if(sync?.startOperationalSync)sync.startOperationalSync();
  }
}

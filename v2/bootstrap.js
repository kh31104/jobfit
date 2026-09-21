import {restoreBeforeApp,startContinuity} from './storageContinuity.js?v=1';

await restoreBeforeApp();
startContinuity();

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

await import('./app.js?v=26');
await import('./injeClassroom.js?v=17');
await import('./careerDnaUx.js?v=10');
await import('./careerDnaStudentUx.js?v=1');
await import('./careerDnaLearningFlowUx.js?v=7');
const {startOperationalSync}=await import('./operationalSync.js?v=2');
startOperationalSync();

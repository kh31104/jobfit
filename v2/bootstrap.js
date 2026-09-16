import {restoreBeforeApp,startContinuity} from './storageContinuity.js?v=1';

await restoreBeforeApp();

// INJE2026의 STEP 0 PRE는 학생 개인의 수업용 시작점 측정이다.
// 중앙 연구데이터 제출은 research:false와 research-sync 설정으로 계속 차단한다.
// 이전에 배포된 measures=false 링크로 접속해도 확정된 7단계 STEP 0을 복원한다.
const bootParams=new URLSearchParams(location.search);
const bootCourse=String(bootParams.get('course')||'').trim().toUpperCase();
if(['INJE2026','INJE-2026-2'].includes(bootCourse)&&bootParams.get('measures')!=='true'){
  bootParams.set('measures','true');
  const query=bootParams.toString();
  history.replaceState(null,'',`${location.pathname}${query?`?${query}`:''}${location.hash||''}`);
}

await import('./app.js?v=15');
await import('./injeClassroom.js?v=16');
await import('./careerDnaUx.js?v=7');
await import('./careerDnaStudentUx.js?v=1');
await import('./careerDnaLearningFlowUx.js?v=4');
startContinuity();

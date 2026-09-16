import {restoreBeforeApp,startContinuity} from './storageContinuity.js?v=1';

await restoreBeforeApp();

// 2026학년도 2학기 인제대 운영: 연구용 PRE/POST 측정을 수집하지 않는다.
// app.js가 courseConfig를 만들기 전에 URL 파라미터로 명시해 기존 공통 코드는 건드리지 않는다.
const bootParams=new URLSearchParams(location.search);
const bootCourse=String(bootParams.get('course')||'').trim().toUpperCase();
if(['INJE2026','INJE-2026-2'].includes(bootCourse)&&!bootParams.has('measures')){
  bootParams.set('measures','false');
  const query=bootParams.toString();
  history.replaceState(null,'',`${location.pathname}${query?`?${query}`:''}${location.hash||''}`);
}

await import('./app.js?v=15');
await import('./injeClassroom.js?v=15');
await import('./careerDnaUx.js?v=7');
await import('./careerDnaStudentUx.js?v=1');
await import('./careerDnaLearningFlowUx.js?v=2');
startContinuity();
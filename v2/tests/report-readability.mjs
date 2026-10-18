import assert from 'node:assert/strict';
import {render,reportItems} from '../steps/step5.js';
const root={innerHTML:''};globalThis.document={getElementById:id=>id==='stepRoot'?root:{addEventListener(){}}};
const action='생성형 AI에게 리뷰 데이터를 분석하도록 지시함. AI가 파악한 고객 니즈를 핏, 소재, 가격대, 디자인으로 분류함. 구글 시트에 직접 문서화하여 정리함.';
const state={profile:{major:'경영학'},assessments:{careerDNA:{careerAnchor:{complete:true,ranking:[{name:'안전/안정성 추구형',score:31},{name:'삶의 질 추구형',score:30},{name:'봉사/헌신 추구형',score:27}]}},experienceCompetency:{experiences:[{id:'e1',title:'브랜드 자료 조사',action,factChecked:true,competencies:['분석·수리','정보·디지털 활용'],competencyEvidence:[{label:'분석·수리',evidence:'리뷰를 핏·소재·가격대 기준으로 분류함.',status:'행동 확인'},{label:'정보·디지털 활용',evidence:'분류한 내용을 구글 시트에 문서화함.',status:'행동 확인'}],evidence:'분류 시트'}]}},artifacts:{}};
const before=JSON.stringify(state);const ctx={getState:()=>state,saveState(){},escapeHtml:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))};await render(ctx);
assert.match(root.innerHTML,/<ol class="reportList rankedList"><li>안전\/안정성 추구형/);assert.match(root.innerHTML,/<li>삶의 질 추구형 <b>30/);assert.match(root.innerHTML,/<li>구글 시트에 직접 문서화하여 정리함\.<\/li>/);assert.match(root.innerHTML,/리뷰를 핏·소재·가격대 기준으로 분류함/);assert.match(root.innerHTML,/분류한 내용을 구글 시트에 문서화함/);assert.doesNotMatch(root.innerHTML,/STEP 3의 행동 Evidence에서 확인/);assert.equal(JSON.stringify(state),before);assert.deepEqual(reportItems('- 첫 행동\n- 둘째 행동'),['첫 행동','둘째 행동']);assert.deepEqual(reportItems('3.5점을 기록함. 결과를 확인함.'),['3.5점을 기록함.','결과를 확인함.']);
state.assessments.experienceCompetency.experiences[0].action='긴 행동 원문 '.repeat(100)+'마지막으로 자료를 확인함.';await render(ctx);assert.match(root.innerHTML,/마지막으로 자료를 확인함/);assert.doesNotMatch(root.innerHTML,/자료…/);

assert.deepEqual(reportItems('고객: 이용자와 잠재 고객 / 성과: 참여 반응과 운영 일정'),['고객: 이용자와 잠재 고객','성과: 참여 반응과 운영 일정']);
assert.deepEqual(reportItems('캠페인 운영: 홍보 / SNS·채널 관리: SNS 게시 / 이벤트 운영: 현장'),['캠페인 운영: 홍보','SNS·채널 관리: SNS 게시','이벤트 운영: 현장']);
state.artifacts.jobExplorer={candidates:[{id:'j1',title:'브랜드 마케팅'}],targetCombos:[{id:'t1',jobId:'j1',industry:'패션'}]};
state.artifacts.jobDeepDive={targetAnalyses:{t1:{
  jobTable:{
    customerKpi:'고객: 이용자와 잠재 고객 / 성과: 참여 반응과 운영 일정',
    tasks:'캠페인 운영: 행사 홍보 / SNS·채널 관리: SNS 운영 / 이벤트 운영: 현장 관리',
    challenge:'고객 반응 확인 / 진행 상황 파악',
    method:'SNS 조사 / 자료 정리',
    competencies:'시장 이해: 고객 조사 / 협업: 일정 공유'
  },
  requirements:[{name:'행사 운영',evidence:'이벤트 지원 업무',status:'일부 근거 있음'}]
}}};
const stateBeforeReadability=JSON.stringify(state);
await render(ctx);
assert.equal(JSON.stringify(state),stateBeforeReadability,'읽기용 렌더링이 학생 저장 데이터를 바꿔서는 안 됨');
assert.match(root.innerHTML,/<div class="reportTable jobAnalysisReport"/);
assert.match(root.innerHTML,/<strong>캠페인 운영:<\/strong>/);
assert.match(root.innerHTML,/<strong>SNS·채널 관리:<\/strong>/);
assert.match(root.innerHTML,/<strong>고객:<\/strong>/);
assert.match(root.innerHTML,/<strong>캠페인 운영:<\/strong>\s*<span>행사 홍보<\/span>/);
assert.match(root.innerHTML,/data-label="확인된 나의 근거"/);
assert.match(root.innerHTML,/\.jobAnalysisReport \.tr\{grid-template-columns:minmax\(0,1fr\)\}/);
assert.match(root.innerHTML,/\.evidenceReportTable \.tr\.th\{display:none\}/);

state.assessments.experienceCompetency.experiences=[];state.assessments.careerDNA={};await render(ctx);assert.match(root.innerHTML,/확인된 행동이 없습니다/);assert.doesNotMatch(root.innerHTML,/안전\/안정성 추구형/);console.log('PASS report readability: ranked rows, sentence lists, actual competency evidence, no truncation, no state mutation, empty inputs');

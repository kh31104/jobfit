import assert from 'node:assert/strict';
import {buildReport} from '../steps/step5.js';

const source=[
  '[내가 가진 것]', '• 기준에 따라 생산 데이터를 정리함',
  '[확인 필요]', '• 생산관리 시스템 경험 확인',
  '[핵심 GAP]', '• GAP 1: ERP 운영 경험',
  '[3개월 행동]', '• ERP 기초 교육 이수'
].join('\n');
const requirements=[
  ...Array.from({length:6},(_,i)=>({id:'req-'+i,name:'직무 요구 '+i,status:'근거 있음',evidence:'행동 근거 '+i})),
  {id:'gap_ai_0',name:'ERP 운영 경험',status:'준비 필요',gap:'ERP 운영 경험'}
];
const state={
  profile:{major:'글로벌자유전공',anonCode:'REPORT-REGRESSION'},
  assessments:{careerDNA:{},experienceCompetency:{experiences:[{
    id:'e1',title:'식품공장 분석업무',factChecked:true,
    action:'기초 공정부터 실무까지 설명하고 시료를 반복 검사함',
    evidence:'검사 결과 기록',
    competencies:['의사소통','책임·직업윤리','협업'],
    competencyEvidence:[
      {label:'의사소통',evidence:'후임자에게 단계별로 설명함',status:'행동 확인'},
      {label:'책임·직업윤리',evidence:'부적합 제품의 출고 중지 요청',status:'행동 확인'},
      {label:'협업',evidence:'필요 시 물품을 사전 확보함',status:'행동 확인'}
    ]
  }]}},
  artifacts:{
    jobExplorer:{
      candidates:[{id:'j1',title:'품질관리'}],
      targetCombos:[{id:'target-j1',jobId:'j1',industry:'식품',priority:1}],
      desiredActivities:[],industryInterests:[]
    },
    jobExplorerChoiceSnapshot:{
      desiredActivities:['기준에 맞는지 검사·점검하기'],
      industryInterests:['식품']
    },
    jobDeepDive:{
      reportTargetId:'target-j1',
      targetAnalyses:{'target-j1':{
        jobTable:{tasks:'생산 분석'},
        studentSpec:{language:'한국어 TOPIK 3급'},
        gapAiDraft:source,
        requirements
      }}
    }
  }
};
const original=structuredClone(state);
const report=buildReport(state,{escapeHtml:s=>s});
assert.deepEqual(report.desired,['기준에 맞는지 검사·점검하기'],'The report must recover the exact learner-selected activity');
assert.deepEqual(report.industries,['식품'],'The report must recover the exact learner-selected industry');
assert.deepEqual(report.gaps,['ERP 운영 경험'],'The report must find GAP entries beyond the first five requirements');
assert.equal(report.have,'기준에 따라 생산 데이터를 정리함','The original saved GAP draft must be usable without pressing Apply');
assert.equal(report.verify,'생산관리 시스템 경험 확인');
assert.equal(report.prepare,'ERP 기초 교육 이수');
assert.equal(report.competencyDetails.length,3);
assert.equal(new Set(report.competencyDetails.flatMap(x=>x.sources.map(s=>s.title))).size,1,'One experience may support several competencies');
assert.deepEqual(report.competencyDetails.map(x=>x.sources[0].text),[
  '후임자에게 단계별로 설명함','부적합 제품의 출고 중지 요청','필요 시 물품을 사전 확보함'
],'Competency-specific behaviors must never collapse into a generic shared action');
assert.deepEqual(state,original,'Report generation must not mutate any saved learner input');

const rawOnly=structuredClone(state);
rawOnly.artifacts.jobDeepDive.targetAnalyses['target-j1'].requirements=requirements.slice(0,6);
const recovered=buildReport(rawOnly,{escapeHtml:s=>s});
assert.deepEqual(recovered.gaps,['ERP 운영 경험'],'An unapplied but saved AI draft must not disappear in STEP 6');

const distinct=structuredClone(state);
distinct.artifacts.jobExplorer.desiredActivities=['사람들과 협의·조정하기'];
distinct.artifacts.jobExplorer.industryInterests=['에너지'];
const kept=buildReport(distinct,{escapeHtml:s=>s});
assert.deepEqual(kept.desired,['사람들과 협의·조정하기'],'Current explicit choice must take priority over snapshot');
assert.deepEqual(kept.industries,['에너지']);
console.log('PASS: mobile STEP 4 selections, STEP 5 GAP recovery, per-competency evidence, and state immutability');

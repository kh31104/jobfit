import assert from "node:assert/strict";
import {visualLines,readableHTML,renderStep2Report} from "../report-view.js";

const raw="필수·지원자격: 스킬 Photoshop, SNS관리, 콘텐츠기획, 시장조사 핵심역량: 성실성, 창의성, 협동심";
const preserved=raw;
const lines=visualLines(raw,{dense:true});
assert(lines.length>=3,"real requirement headings separated from the list");
assert(lines.some(x=>x.heading&&x.text.includes("핵심역량")),"subheading recognized");
assert.equal(raw,preserved,"formatting must not mutate raw source");
assert.equal(visualLines("영어, 중국어, 일본어",{dense:true}).length,1,"languages separated by commas must stay together");
assert.equal(visualLines("토익 620 / Photoshop, Canva",{dense:true}).length,1,"student data not fractured by comma or slash");
assert(!readableHTML("Knowledge [추론]: SNS 특성 이해",{dense:true}).includes("donga-readable-heading"),"knowledge is content, not a standalone section heading");
const escaped=readableHTML("<img src=x onerror=alert(1)>",{dense:true});
assert(!escaped.includes("<img"),"user text HTML escaped");
assert(escaped.includes("&lt;img"),"original literal retained safely");
const model={
  target:{company:"예시회사",role:"브랜드 마케팅",title:"신입 마케팅",sourceUrl:"https://example.com/jobs"},
  student:{major:"경영학과",certificates:"",language:"TOEIC 820",tools:"Excel",majorEvidence:"브랜드 조사 과제"},
  jobTable:{customerKpi:"소비자·전환율",tasks:"시장조사, SNS 콘텐츠 기획",challenge:"신규 고객 유입",method:"경쟁사 분석, SNS",competencies:"고객 분석, 콘텐츠 기획"},
  requirements:[{condition:raw,status:"일부 준비",note:"Photoshop 연습 중"},{condition:"우대사항: 디자인 경험",status:"현재 GAP",note:"관련 경험 없음"}],
  fit:{gaps:"1. 콘텐츠 제작 포트폴리오\n2. Photoshop 작업 근거",actions:"• SNS 게시물 제작\n• 제작 결과 기록"}
};
const orig=JSON.stringify(model);
const report=renderStep2Report(model);
for(const text of ["직무분석표","고객(KPI)","주요 과업","필요역량","JD Requirements × My Spec","3개월 행동계획","Photoshop 연습 중","경영학과","신입 마케팅"])assert(report.includes(text),"expected report section/value: "+text);
assert(report.includes('<table class="donga-job-table">'),"real semantic table");
assert.equal(JSON.stringify(model),orig,"report renderer never mutates input");

const realistic={
 target:{company:"코오롱인더스트리 FnC부문",role:"브랜드 마케팅 / SNS 콘텐츠 마케팅",title:"G/FORE 마케팅팀 인턴",sourceUrl:"https://linkareer.com/activity/357989"},
 student:{major:"경영학과 2학년",certificates:"컴퓨터활용능력 2급",language:"토익 620",tools:"Photoshop, Canva",majorEvidence:"교내 홍보단 SNS 운영 콘텐츠 기획·분석 포트폴리오"},
 jobTable:{customerKpi:"KPI: 콘텐츠 제작 일정 준수율, 인플루언서 명단 정확도, 협찬 제품 발송 오류 건수.",
  tasks:"[공고근거] SNS 콘텐츠 기획·제작 지원.",
  challenge:"[추론] SNS 관리 데이터 정확성 관리.",
  method:"[추론] 콘텐츠 일정 검토.",
  competencies:"Skill [공고근거]: Photoshop 활용 능력.\n[추가 확인 질문]\n[확인 필요] SNS 콘텐츠를 직접 게시하나요?"},
 requirements:[
  {condition:"필수·지원자격: 4년제 대학 졸업 또는 졸업예정자\n대학생 대외활동 공모전 채용 사이트 링커리어\nhttps://linkareer.com/",status:"현재 GAP",note:""},
  {condition:"우대사항: 디자인 툴(Photoshop, Illustrator 등) 활용 능숙자\n영어, 중국어, 일본어 등 외국어 활용 가능자",status:"일부 준비",note:"자동 불러오기 · 관련 어학 입력(요구 수준 확인 필요): 토익 620\n공고와 겹치는 도구(숙련도 확인 필요): Photoshop"},
  {condition:"직무 필요역량: SNS 콘텐츠 기획\nKnowledge [추론]: 브랜드 이해",status:"일부 준비",note:"교내 홍보단 SNS 콘텐츠 기획"}
 ],
 fit:{
  gaps:"필수 학력조건 미충족 — 현재 2학년으로 졸업요건 미충족.\nGAP 2: SNS 콘텐츠 제작 근거 부족 — 제작 결과물 확인 필요.\nGAP 3: 마케팅 운영 경험 근거 부족 — 협찬 발송 경험 미확인. [6. 우선순위]\n1순위: 학력조건\n2순위: SNS 콘텐츠 [7. 3개월 보완 행동]\nGAP 1 → 학사일정 확인 → 예상 졸업 시점 및 향후 지원자격 확인표 작성",
  actions:"GAP 1 → 학사일정과 졸업예정 시기 확인 → 예상 졸업 시점 및 향후 지원자격 확인표 작성\nGAP 2 → Photoshop·Canva로 SNS 콘텐츠 3개 제작 → 제작 포트폴리오 완성\nGAP 3 → 협찬 발송 관리표 작성 → 업무 체크리스트 완성"
 }
};
const oldModel=JSON.stringify(realistic);
const example=renderStep2Report(realistic);
assert.equal((example.match(/class="donga-gap-item"/g)||[]).length,3,"three GAP cards extracted without priority/action noise");
assert.equal((example.match(/class="donga-action-item"/g)||[]).length,3,"three action rows extracted separately");
assert(example.includes("지원자격 확인표 작성"),"first action output remains in the outcome column");
assert(!example.includes("[6. 우선순위]")&&!example.includes("[7. 3개월 보완 행동]"),"parser section tokens are not printed as bullets");
assert(!example.includes("대학생 대외활동 공모전 채용 사이트 링커리어"),"copied site preview metadata suppressed in report only");
assert(example.includes("영어, 중국어, 일본어"),"foreign languages stay as a phrase");
assert(example.includes("Photoshop, Canva"),"student tools stay together");
assert(example.includes("참고 · 확인할 사항"),"AI follow-up questions appear separately from competencies");
assert.equal(JSON.stringify(realistic),oldModel,"even messy source values are never changed");

console.log("PASS STEP 2 read-only GAP bullets, escaped text and printable job table");

import assert from "node:assert/strict";
import {visualLines,readableHTML,renderStep2Report} from "../report-view.js";

const raw="필수·지원자격: 스킬 Photoshop, SNS관리, 콘텐츠기획, 시장조사 핵심역량: 성실성, 창의성, 협동심";
const preserved=raw;
const lines=visualLines(raw,{dense:true});
assert(lines.length>=5,"long requirements separated into bullets");
assert(lines.some(x=>x.heading&&x.text.includes("핵심역량")),"subheading recognized");
assert.equal(raw,preserved,"formatting must not mutate raw source");
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
console.log("PASS STEP 2 read-only GAP bullets, escaped text and printable job table");

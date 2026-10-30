import {parseIndustryAi,parseCompanyAi,isHttpUrl} from '../steps/industryAiParser.js';
import assert from 'node:assert/strict';

const industry=String.raw`[산업명]
• 패션·유통
[산업 구조·주요 고객]
• 브랜드와 소비자 연결
[주요 고객·가치사슬]
• B2C
[주요 기업]
• 확인된 기업 3곳
[최근 변화]
• 생성형 AI 활용 확대
[내 직무에 미치는 영향]
• SNS 성과 분석
[다른 산업과의 차이·선택]
• 캠페인 운영 방식의 차이
[출처 유형]
• 산업협회·전문기관
[확인 자료]
• 공식 산업동향 2026
[원문 URL]
• https://example.org/industry
[확인일]
• 2026-10-29`;
const p=parseIndustryAi(industry);
assert.equal(p.fields.name,'패션·유통');
assert.match(p.fields.business,/브랜드와 소비자 연결/);
assert.match(p.fields.business,/B2C/);
assert.match(p.fields.business,/기업 3곳/);
assert.equal(p.fields.url,'https://example.org/industry');
assert.equal(p.fields.source,'공식 산업동향 2026');
assert.equal(p.fields.checkedAt,'2026-10-29');
assert.equal(p.fields.change,'생성형 AI 활용 확대');
assert.equal(p.fields.jobLink,'SNS 성과 분석');
assert.equal(p.fields.difference,'캠페인 운영 방식의 차이');
assert.ok(p.recognized>=9);
const old=parseIndustryAi('[산업 한 줄]\n• 제품·서비스 제공\n[주요 고객·가치사슬]\n• B2B\n[직무·채용 영향]\n• 데이터 분석\n[확인 출처]\n• 공식보고서');
assert.match(old.fields.business,/B2B/);
assert.equal(old.fields.source,'공식보고서');
assert.ok(!old.fields.url,'Do not invent a source URL');

const education=String.raw`[산업명]
• 교육
[근무처 유형]
• 전국 대학(국립·공립·사립·전문대) — 대학교수 — 직무 존재 공식 확인
[대표 기관·기업군]
• 전국 대학 (개별 대학 몇 곳으로 축소하지 않음)
[그곳에서 하는 일]
• 대학교수 — 교과목 강의·연구
[진입·채용 경로]
• 대학별 공식 교원 임용공고 및 지원자격 확인
[산업 구조·주요 고객]
• 고등교육 제공
[원문 URL]
• https://example.org/university`;
const e=parseIndustryAi(education);
assert.match(e.fields.workplaces,/전국 대학/);
assert.match(e.fields.employers,/개별 대학 몇 곳/);
assert.match(e.fields.tasks,/교과목 강의/);
assert.match(e.fields.entry,/교원 임용공고/);
assert.equal(e.fields.business,'고등교육 제공');
assert.equal(e.fields.url,'https://example.org/university');

const companies=String.raw`[기업 1]
• 기업명: 기업A
• 기업유형: 대기업
• Business · Customer: 주요 제품과 고객
• Strategy: 공식 발표한 사업 방향
• Job Link: SNS 콘텐츠 기획
• Hiring Signal: 영상 제작
• 기업 공식자료: 사업보고서 2026
• 기업 공식자료 URL: https://example.org/a
• 채용·직무 자료: 공식 신입 공고
• 채용 근거: 최근 채용공고 확인
• 채용·직무 원문 URL: https://example.org/a/jobs
• 확인 필요: 인턴 채용시점
[기업 2]
• 기업명: 기업B
• Business · Customer: 교육서비스
• Job Link: 교육기획
• 확인 필요: 채용자료 확인`;
const c=parseCompanyAi(companies);
assert.equal(c.companies.length,2);
assert.equal(c.companies[0].name,'기업A');
assert.equal(c.companies[0].url,'https://example.org/a');
assert.equal(c.companies[0].jobUrl,'https://example.org/a/jobs');
assert.equal(c.companies[0].signals,'영상 제작');
assert.equal(c.companies[1].name,'기업B');
assert.equal(c.companies[1].jobUrl,undefined,'Do not fabricate a missing hiring link');
assert.equal(parseCompanyAi('이 기업은 성장 가능성이 높다').companies.length,0);
assert.equal(isHttpUrl('javascript:alert(1)'),false);
assert.equal(isHttpUrl('https://example.org/industry'),true);
console.log('PASS STEP 7 industry/company source-bound parsing and no fabricated fields');
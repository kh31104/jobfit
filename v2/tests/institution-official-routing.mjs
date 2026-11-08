import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const panel=read('steps/institutionSourcesPanel.js');
const api=read('institutionOfficialApi.js');
const tables=read('steps/step7Tables.js');
const step6=read('steps/step6IndustryCompany.js');
const app=read('app.js');
const supabase=read('../supabase/functions/univ-alimi-faculty-pilot/index.ts');

assert(!/\b(fetch\(|XMLHttpRequest|sendBeacon|supabase|firebase)\b/.test(panel),
  'learner STEP modules must not contain backend transports or direct service keys');
assert(!/DART_API_KEY|WORK24_RECRUIT_API_KEY|UNIV_ALIMI_FACULTY_RESEARCH_API_KEY/.test(panel+api),
  'never embed private API key names or values in learner code');
assert(panel.includes('mountInstitutionSourcePanel')&&tables.includes('mountInstitutionSourcePanel(root);'));
assert(step6.includes("courseConfig?.institution==='인제대학교'"));
assert(app.includes("IS_INJE_FULL&&state.activeStep===6"));
assert(tables.includes("artifacts:{industryCompanyTableV1:structuredClone(d)}"),
  'retain original STEP 7 save schema');
assert(panel.includes("if(target.value.trim())"), 'preexisting company cells must not be overwritten');
assert(panel.includes('firstFreeSource(root'), 'new source must use unused S1-S8 slot');
assert(panel.includes('restorePreviouslyChecked(root'), 'existing source verification flags must survive');
assert(panel.includes('checkbox.checked'), 'student acknowledgement required before transfer');
assert(!panel.includes('removeItem('), 'student data may not be reset');
assert(api.includes("getWork24Recruitment")&&api.includes("getPublicRecruitment")&&api.includes("getDartCompany")&&api.includes("getUniversityRecords"));
assert(supabase.includes('providedSchoolId||"auto"')&&supabase.includes('school_code_mismatch'),
  'campus code must be authenticated and isolated in cache');

const vmCode=panel.replace(/^import\s+.*;\s*$/gm,'').replace(/^export\s+(?=function)/gm,'')+';\nglobalThis._infer=inferInstitutionType;';
const ctx={};vm.createContext(ctx);vm.runInContext(vmCode,ctx,{timeout:1000});
const infer=ctx._infer;
for(const [input,expected] of [
  ['인제대학교','university'],['국립부경대학교','university'],['서울교육대학교','university'],
  ['한국가스공사','public'],['국민연금공단','public'],
  ['삼성전자','company'],['현대자동차','company'],['','unknown'],
  ['인제대학교 대학일자리플러스센터','company'],['전국 대학','company']
])assert.equal(infer(input),expected,JSON.stringify({input,expected}));
console.log('PASS: institution routing and preservation guards');

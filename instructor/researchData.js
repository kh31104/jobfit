export const WORK24_LABELS=['경제적 취약성 적응도','가족의 지지','사회적 지지','자아 존중감','자기 효능감','구직기술','의사전달','대인관계 활용','구직정보 수집'];

export function normalizeResearchRecord(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('JSON 객체가 아닙니다.');
  if(!String(input.schema_version||'').startsWith('jobfit-research-v1.'))throw new Error('Jobfit 연구용 파일이 아닙니다.');
  const code=cleanText(input.participant_code,40);
  if(!code)throw new Error('익명코드가 없습니다.');
  return {
    schema_version:cleanText(input.schema_version,40),
    participant_code:code,
    context:pickText(input.context,['cohort_id','institution_code','program_type','program_duration','roadmap_mode','assessment_timepoint','collected_at']),
    demographics:{...pickText(input.demographics,['gender','grade','major_raw','major_group','enrollment_status','graduation_horizon','gpa_band']),age:cleanNumber(input.demographics?.age)},
    pre_measurements:cleanMeasurements(input.pre_measurements),
    post_measurements:cleanMeasurements(input.post_measurements),
    progress:{current_step:cleanNumber(input.progress?.current_step),completed_steps:cleanArray(input.progress?.completed_steps),completed_step_count:cleanNumber(input.progress?.completed_step_count),total_steps:cleanNumber(input.progress?.total_steps),completion_percent:cleanNumber(input.progress?.completion_percent),last_saved_at:cleanText(input.progress?.last_saved_at,80)},
    export_metadata:{export_type:'research-only',exported_at:cleanText(input.export_metadata?.exported_at,80),excludes_activity_text:true}
  };
}

export function mergeResearchRecords(records){
  const latest=new Map();
  for(const row of records){
    const key=`${row.context?.cohort_id||''}|${row.participant_code}`;
    const prior=latest.get(key),now=Date.parse(row.export_metadata?.exported_at||row.context?.collected_at||0),old=Date.parse(prior?.export_metadata?.exported_at||prior?.context?.collected_at||0);
    if(!prior||now>=old)latest.set(key,row);
  }
  return [...latest.values()].sort((a,b)=>a.participant_code.localeCompare(b.participant_code));
}

export function researchRows(records){return records.map(r=>{
  const pre=r.pre_measurements||{},post=r.post_measurements||{};
  const row={
    익명코드:r.participant_code,수업코드:r.context?.cohort_id,학교:r.context?.institution_code,나이:r.demographics?.age,성별:r.demographics?.gender,학년:r.demographics?.grade,학과:r.demographics?.major_raw,전공계열:r.demographics?.major_group,학적상태:r.demographics?.enrollment_status,
    현재STEP:r.progress?.current_step,완료STEP수:r.progress?.completed_step_count,진행률:r.progress?.completion_percent,마지막저장:r.progress?.last_saved_at
  };
  WORK24_LABELS.forEach((label,i)=>{row[`PRE_고용24_${label}`]=pre.work24_job_readiness?.scores?.[i]??null;row[`POST_고용24_${label}`]=post.work24_job_readiness?.scores?.[i]??null});
  for(const [key,label] of [['concern','관심'],['control','통제'],['curiosity','호기심'],['confidence','자신감'],['total','전체']]){row[`PRE_진로적응성_${label}`]=pre.kcaas?.[key]??null;row[`POST_진로적응성_${label}`]=post.kcaas?.[key]??null}
  row.PRE_강점활용=pre.strength_deficit?.strength_use??null;row.PRE_약점교정=pre.strength_deficit?.deficit_correction??null;row.POST_강점활용=post.strength_deficit?.strength_use??null;row.POST_약점교정=post.strength_deficit?.deficit_correction??null;
  return row;
})}

export function toCsv(records){
  const rows=researchRows(records);if(!rows.length)return '';
  const headers=Object.keys(rows[0]),esc=v=>{const s=v===null||v===undefined?'':String(v);return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s};
  return '\ufeff'+[headers.map(esc).join(','),...rows.map(row=>headers.map(h=>esc(row[h])).join(','))].join('\n');
}

function cleanMeasurements(m){if(!m||typeof m!=='object')return null;return {
  captured_at:cleanText(m.captured_at,80),
  work24_job_readiness:m.work24_job_readiness?{instrument:cleanText(m.work24_job_readiness.instrument,100),exam_date:cleanText(m.work24_job_readiness.exam_date,30),scores:cleanArray(m.work24_job_readiness.scores).slice(0,9),labels:(m.work24_job_readiness.labels||[]).slice(0,9).map(x=>cleanText(x,80)),score_schema:cleanText(m.work24_job_readiness.score_schema,100),wording_status:cleanText(m.work24_job_readiness.wording_status,100)}:null,
  kcaas:m.kcaas?{instrument:cleanText(m.kcaas.instrument,100),concern:cleanNumber(m.kcaas.concern),control:cleanNumber(m.kcaas.control),curiosity:cleanNumber(m.kcaas.curiosity),confidence:cleanNumber(m.kcaas.confidence),total:cleanNumber(m.kcaas.total),wording_version:cleanText(m.kcaas.wording_version,120),wording_status:cleanText(m.kcaas.wording_status,120)}:null,
  strength_deficit:m.strength_deficit?{instrument:cleanText(m.strength_deficit.instrument,140),strength_use:cleanNumber(m.strength_deficit.strength_use),deficit_correction:cleanNumber(m.strength_deficit.deficit_correction),wording_version:cleanText(m.strength_deficit.wording_version,120),wording_status:cleanText(m.strength_deficit.wording_status,120)}:null
}}
function pickText(obj,keys){const out={};for(const k of keys)out[k]=Array.isArray(obj?.[k])?obj[k].slice(0,30).map(x=>cleanText(x,120)):cleanText(obj?.[k],200);return out}
function cleanText(v,max=200){if(v===null||v===undefined)return null;return String(v).slice(0,max)}
function cleanNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function cleanArray(v){return Array.isArray(v)?v.map(cleanNumber):[]}

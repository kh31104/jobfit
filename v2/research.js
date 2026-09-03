export const RESEARCH_SCHEMA_VERSION='jobfit-research-v1.4';

export function buildResearchPayload(state,{timepoint='single',context={}}={}){
  const p=state.profile||{},b=state.baseline||{},d=state.assessments?.careerDNA||{};
  const interest=d.interest||{},m=state.research?.measurements||{};
  return {
    schema_version:RESEARCH_SCHEMA_VERSION,
    participant_code:p.anonCode||null,
    context:{
      cohort_id:context.cohortId||p.courseCode||null,
      institution_code:context.institutionCode||p.institution||null,
      program_type:context.programType||null,
      program_duration:context.programDuration||null,
      roadmap_mode:state.mode||null,
      assessment_timepoint:timepoint,
      collected_at:new Date().toISOString()
    },
    demographics:{
      age:cleanNumber(p.age),gender:p.gender||null,grade:p.grade||null,major_raw:p.major||null,major_group:p.majorGroup||null,enrollment_status:p.enrollmentStatus||null,graduation_horizon:p.graduationPlan||null,gpa_band:p.gpaBand||null
    },
    career_baseline:{
      job_decision_level:b.jobDecision||null,industry_decision_level:b.industryDecision||null,preparation_stage:b.prepStage||null,internship_field_experience:b.internship||null,career_program_participation:b.careerProgram||null,certificate_preparation_band:b.certificate||null,prior_application_experience:b.priorApplication||null
    },
    ai_baseline:{generative_ai_frequency:b.aiFrequency||null,ai_tools_used:b.aiTools||null,ai_career_use_level:b.aiCareerUse||null,ai_career_use_categories:b.aiCareerCategories||null},
    work24_interest: interest.type?{
      test_type:interest.type,test_date:interest.examDate||null,riasec_raw:pickSix(interest.riasecRaw),riasec_standard:pickSix(interest.riasecStandard),big5:interest.type==='L'?allowNumericMap(d.personalityBig5):null,validity:interest.type==='L'?allowNumericMap(d.personalityValidity):null,facets:interest.type==='L'?allowNumericMap(d.personalityFacets):null,life_history:interest.type==='L'?allowNumericMap(d.lifeHistory):null
    }:null,
    work24_values:{scores:allowNumericMap(d.workValues),test_date:d.workValuesDate||null,version:d.workValuesVersion||null},
    pre_measurements:cleanMeasureBlock(m.pre),
    post_measurements:cleanMeasureBlock(m.post)
  };
}

export function buildResearchExportPayload(state,{context={},completedSteps=[]}={}){
  const safeSteps=[...new Set((completedSteps||[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=13))].sort((a,b)=>a-b);
  const full=buildResearchPayload(state,{timepoint:'all',context});
  return {
    schema_version:full.schema_version,
    participant_code:full.participant_code,
    context:full.context,
    demographics:full.demographics,
    work24_interest:full.work24_interest,
    work24_values:full.work24_values,
    pre_measurements:full.pre_measurements,
    post_measurements:full.post_measurements,
    export_metadata:{
      export_type:'research-only',
      exported_at:new Date().toISOString(),
      excludes_activity_text:true,
      excluded_categories:['career_baseline','ai_baseline','experience_narratives','ai_conversations','career_start_free_text','application_documents','interview_answers']
    },
    progress:{
      current_step:boundedStep(state.activeStep),
      completed_steps:safeSteps,
      completed_step_count:safeSteps.length,
      total_steps:14,
      completion_percent:Math.round(safeSteps.length/14*100),
      last_saved_at:state.meta?.updatedAt||null
    }
  };
}

export async function submitResearchPayload(payload,options){
  const {submitResearchSnapshot}=await import('./researchBackend.js');
  return submitResearchSnapshot(payload,options);
}

function cleanMeasureBlock(block){if(!block||!Object.keys(block).length)return null;return {
  captured_at:block.capturedAt||null,
  work24_job_readiness:block.work24JobReadiness?{
    instrument:block.work24JobReadiness.instrument||'고용24 구직준비도검사',
    exam_date:block.work24JobReadiness.examDate||null,
    item_count:9,
    scores:cleanArray(block.work24JobReadiness.scores),
    labels:Array.isArray(block.work24JobReadiness.labels)?block.work24JobReadiness.labels.slice(0,9):null,
    score_schema:block.work24JobReadiness.scoreSchema||null,
    wording_status:block.work24JobReadiness.wordingStatus||null
  }:null,
  kcaas:block.kcaas?{
    instrument:block.kcaas.instrument||'K-CAAS-SF',
    item_count:12,
    response_range:block.kcaas.responseRange||null,
    response_anchors:block.kcaas.responseAnchors||null,
    item_numbers:Array.isArray(block.kcaas.itemNumbers)?block.kcaas.itemNumbers.slice(0,12):null,
    items:cleanArray(block.kcaas.items),
    concern:cleanNumber(block.kcaas.concern),
    control:cleanNumber(block.kcaas.control),
    curiosity:cleanNumber(block.kcaas.curiosity),
    confidence:cleanNumber(block.kcaas.confidence),
    total:cleanNumber(block.kcaas.total),
    wording_version:block.kcaas.wordingVersion||null,
    wording_status:block.kcaas.wordingStatus||null,
    source:block.kcaas.source||null
  }:null,
  strength_deficit:block.sudco?{
    instrument:block.sudco.instrument||null,
    item_count:9,
    response_range:block.sudco.responseRange||null,
    response_anchors:block.sudco.responseAnchors||null,
    item_numbers:Array.isArray(block.sudco.itemNumbers)?block.sudco.itemNumbers.slice(0,9):null,
    items:cleanArray(block.sudco.items).slice(0,9),
    strength_use:cleanNumber(block.sudco.strengthUse),
    deficit_correction:cleanNumber(block.sudco.deficitCorrection),
    wording_version:block.sudco.wordingVersion||null,
    wording_status:block.sudco.wordingStatus||null,
    source:block.sudco.source||null,
    capture_context:block.sudco.captureContext||null
  }:null
}}
function cleanArray(arr=[]){return (arr||[]).map(cleanNumber)}
function cleanNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function boundedStep(v){const n=Number(v);return Number.isInteger(n)?Math.max(0,Math.min(13,n)):0}
function pickSix(obj={}){const out={};for(const k of ['R','I','A','S','E','C'])out[k]=cleanNumber(obj?.[k]);return out}
function allowNumericMap(obj={}){const out={};for(const [k,v] of Object.entries(obj||{})){const n=cleanNumber(v);if(n!==null)out[k]=n}return out}

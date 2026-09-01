export const RESEARCH_SCHEMA_VERSION='jobfit-research-v1';

export function buildResearchPayload(state,{timepoint='single',context={}}={}){
  const p=state.profile||{},b=state.baseline||{},d=state.assessments?.careerDNA||{};
  const interest=d.interest||{};
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
      age:cleanNumber(p.age),
      gender:p.gender||null,
      grade:p.grade||null,
      major_raw:p.major||null,
      major_group:p.majorGroup||null,
      enrollment_status:p.enrollmentStatus||null,
      graduation_horizon:p.graduationPlan||null,
      gpa_band:p.gpaBand||null
    },
    career_baseline:{
      job_decision_level:b.jobDecision||null,
      industry_decision_level:b.industryDecision||null,
      preparation_stage:b.prepStage||null,
      internship_field_experience:b.internship||null,
      career_program_participation:b.careerProgram||null,
      certificate_preparation_band:b.certificate||null,
      prior_application_experience:b.priorApplication||null
    },
    ai_baseline:{
      generative_ai_frequency:b.aiFrequency||null,
      ai_tools_used:b.aiTools||null,
      ai_career_use_level:b.aiCareerUse||null,
      ai_career_use_categories:b.aiCareerCategories||null
    },
    work24_interest: interest.type?{
      test_type:interest.type,
      test_date:interest.examDate||null,
      riasec_raw:pickSix(interest.riasecRaw),
      riasec_standard:pickSix(interest.riasecStandard),
      big5:interest.type==='L'?allowNumericMap(d.personalityBig5):null,
      validity:interest.type==='L'?allowNumericMap(d.personalityValidity):null,
      facets:interest.type==='L'?allowNumericMap(d.personalityFacets):null,
      life_history:interest.type==='L'?allowNumericMap(d.lifeHistory):null
    }:null,
    work24_values:{
      scores:allowNumericMap(d.workValues),
      test_date:d.workValuesDate||null,
      version:d.workValuesVersion||null
    },
    pending_instruments:{}
  };
}

export async function submitResearchPayload(){
  throw new Error('Central research collection is disabled. Configure an approved backend and consent flow before enabling submission.');
}

function cleanNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function pickSix(obj={}){const out={};for(const k of ['R','I','A','S','E','C'])out[k]=cleanNumber(obj?.[k]);return out}
function allowNumericMap(obj={}){const out={};for(const [k,v] of Object.entries(obj||{})){const n=cleanNumber(v);if(n!==null)out[k]=n}return out}

const STORAGE_KEY='jobfit:v2:learner';
const SCHEMA_VERSION='jobfit-operational-v1.0';
const ALLOWED_COURSES=new Set(['INJE2026','INJE-2026-2']);
const POLL_MS=3000;
const RETRY_MS=30000;

let timer=null;
let inFlight=false;
let lastSyncedRaw='';
let retryAfter=0;

export function startOperationalSync(){
  if(timer)return;
  tick();
  timer=setInterval(tick,POLL_MS);
  window.addEventListener('online',()=>{retryAfter=0;tick()});
}

async function tick(){
  if(inFlight||Date.now()<retryAfter||navigator.onLine===false)return;
  let raw=localStorage.getItem(STORAGE_KEY);
  if(!raw||raw===lastSyncedRaw)return;

  let state;
  try{state=JSON.parse(raw)}catch{return}
  if(!state||typeof state!=='object'||Array.isArray(state))return;

  const course=String(new URLSearchParams(location.search).get('course')||state.profile?.courseCode||'').trim().toUpperCase();
  if(!ALLOWED_COURSES.has(course)||state.mode==='selective')return;

  const participantCode=String(state.profile?.anonCode||'').trim().toUpperCase();
  if(!/^JF26-[A-Z0-9]{6}$/.test(participantCode))return;

  state.meta=state.meta||{};
  let syncToken=String(state.meta.operationalSyncToken||'');
  if(!/^[a-f0-9]{64}$/i.test(syncToken)){
    syncToken=createToken();
    state.meta.operationalSyncToken=syncToken;
    raw=JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY,raw);
  }

  const cfg=window.JOBFIT_RESEARCH_CONFIG||{};
  if(!cfg.supabaseUrl||!cfg.publishableKey)return;

  const completedSteps=Array.from({length:14},(_,i)=>i).filter(i=>isStepComplete(i,state));
  const body={
    course_code:course,
    participant_code:participantCode,
    sync_token:syncToken,
    schema_version:SCHEMA_VERSION,
    progress:{
      current_step:boundedStep(state.activeStep),
      completed_steps:completedSteps,
      completed_step_count:completedSteps.length,
      total_steps:14,
      completion_percent:Math.round(completedSteps.length/14*100)
    },
    state
  };

  inFlight=true;
  try{
    const response=await fetch(`${String(cfg.supabaseUrl).replace(/\/$/,'')}/functions/v1/jobfit-sync`,{
      method:'POST',
      headers:{'apikey':cfg.publishableKey,'Content-Type':'application/json'},
      body:JSON.stringify(body),
      keepalive:true
    });
    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      throw new Error(data?.error||`jobfit_sync_${response.status}`);
    }
    lastSyncedRaw=raw;
    retryAfter=0;
  }catch(error){
    retryAfter=Date.now()+RETRY_MS;
    console.warn('[Jobfit] 중앙 운영 DB 동기화 재시도 예정',error);
  }finally{
    inFlight=false;
  }
}

function createToken(){
  const a=new Uint8Array(32);
  crypto.getRandomValues(a);
  return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function boundedStep(v){
  const n=Number(v);
  return Number.isInteger(n)?Math.max(0,Math.min(13,n)):0;
}

function isStepComplete(i,s){
  const a=s.artifacts||{},d=s.assessments||{};
  switch(i){
    case 0:return !!(s.profile?.anonCode&&s.baseline?.jobDecision);
    case 1:return !!(d.careerDNA?.hypothesis||d.careerDNA?.reflection||d.careerDNA?.selfSelectedStrengths?.length||d.careerDNA?.viaTop5?.length);
    case 2:return !!d.experienceCompetency?.experiences?.length;
    case 3:return !!a.jobExplorer?.targets?.length;
    case 4:return !!Object.keys(a.jobDeepDive?.analyses||{}).length;
    case 5:return !!(a.industryCompany?.targetIndustries?.length&&a.industryCompany?.targetCompanies?.length);
    case 6:return !!a.careerFit?.selectedId;
    case 7:return !!(a.jdAnalyzer?.selectedId&&a.jdAnalyzer?.postings?.length);
    case 8:return !!a.careerAssets?.assets?.length;
    case 9:return !!a.resumeLab?.items?.length;
    case 10:return !!a.coverLetterLab?.questions?.length;
    case 11:return !!a.interviewLab?.questions?.length;
    case 12:return !!a.humanFirst?.items?.length;
    case 13:return !!a.jobPortfolio?.finalChecks?.facts;
    default:return false;
  }
}

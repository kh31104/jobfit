import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const allowedOrigin='https://kh31104.github.io';
const allowedCourses=new Set(['INJE2026','INJE-2026-2']);
const maxBodyBytes=768*1024;
const cors={
  'Access-Control-Allow-Origin':allowedOrigin,
  'Access-Control-Allow-Headers':'apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Cache-Control':'no-store'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST'||req.headers.get('origin')!==allowedOrigin)return json({error:'not_allowed'},403);
  try{
    if(!String(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return json({error:'json_required'},415);
    const declared=Number(req.headers.get('content-length')||0);
    if(declared>maxBodyBytes)return json({error:'payload_too_large'},413);
    const raw=await req.text();
    if(new TextEncoder().encode(raw).byteLength>maxBodyBytes)return json({error:'payload_too_large'},413);
    let body:Record<string,unknown>;
    try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}

    const courseCode=String(body.course_code||'').trim().toUpperCase();
    const participantCode=String(body.participant_code||'').trim().toUpperCase();
    const syncToken=String(body.sync_token||'');
    const schemaVersion=String(body.schema_version||'');
    const state=body.state as Record<string,unknown>|undefined;
    const progress=body.progress as Record<string,unknown>|undefined;

    if(!allowedCourses.has(courseCode))return json({error:'invalid_course'},403);
    if(!/^JF26-[A-Z0-9]{6}$/.test(participantCode))return json({error:'invalid_participant_code'},400);
    if(!/^[a-f0-9]{64}$/i.test(syncToken))return json({error:'invalid_sync_token'},400);
    if(!schemaVersion.startsWith('jobfit-operational-v1.'))return json({error:'invalid_schema_version'},400);
    if(!state||typeof state!=='object'||Array.isArray(state))return json({error:'invalid_state'},400);

    const admin=createClient(Deno.env.get('SUPABASE_URL')!,adminKey());
    const tokenHash=await sha256(syncToken);
    const {data:existing,error:existingError}=await admin.from('jobfit_participants')
      .select('id,sync_token_hash')
      .eq('course_code',courseCode)
      .eq('participant_code',participantCode)
      .maybeSingle();
    if(existingError)throw existingError;
    if(existing&&existing.sync_token_hash!==tokenHash)return json({error:'participant_token_mismatch'},409);

    let participantId=existing?.id as string|undefined;
    const now=new Date().toISOString();
    if(!participantId){
      const {data:created,error}=await admin.from('jobfit_participants')
        .insert({course_code:courseCode,participant_code:participantCode,sync_token_hash:tokenHash})
        .select('id').single();
      if(error)throw error;
      participantId=created.id;
    }else{
      const {error}=await admin.from('jobfit_participants').update({last_received_at:now}).eq('id',participantId);
      if(error)throw error;
    }

    const activeStep=boundedStep(progress?.current_step ?? state.activeStep);
    const safeProgress=sanitizeProgress(progress,activeStep);
    const payload=sanitizeState(state,safeProgress);
    const clientSavedAt=cleanDate((state.meta as Record<string,unknown>|undefined)?.updatedAt);

    const {data:previous,error:prevError}=await admin.from('jobfit_snapshots')
      .select('payload')
      .eq('participant_id',participantId)
      .order('received_at',{ascending:false})
      .limit(1)
      .maybeSingle();
    if(prevError)throw prevError;

    const {error:snapshotError}=await admin.from('jobfit_snapshots').insert({
      participant_id:participantId,
      schema_version:schemaVersion.slice(0,80),
      active_step:activeStep,
      payload,
      client_saved_at:clientSavedAt
    });
    if(snapshotError)throw snapshotError;

    const events:Array<Record<string,unknown>>=[{
      participant_id:participantId,
      step_no:activeStep,
      event_type:'save',
      client_event_at:clientSavedAt
    }];
    const prevCompleted=new Set<number>(numberArray((previous?.payload as any)?.progress?.completed_steps));
    for(const step of numberArray(safeProgress.completed_steps)){
      if(!prevCompleted.has(step))events.push({participant_id:participantId,step_no:step,event_type:'complete',client_event_at:clientSavedAt});
    }
    const {error:eventError}=await admin.from('jobfit_step_events').insert(events);
    if(eventError)throw eventError;

    return json({ok:true,participant_code:participantCode,received_at:now});
  }catch(error){
    console.error(error);
    return json({error:'server_error'},500);
  }
});

function adminKey(){
  try{
    const all=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
    if(all?.default)return all.default;
  }catch{}
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!legacy)throw new Error('admin_key_missing');
  return legacy;
}
async function sha256(value:string){
  const bytes=new TextEncoder().encode(value),hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function boundedStep(v:unknown){const n=Number(v);return Number.isInteger(n)?Math.max(0,Math.min(13,n)):0}
function cleanDate(v:unknown){const s=String(v||'');return /^\d{4}-\d{2}-\d{2}T/.test(s)?s:null}
function cleanText(v:unknown,max=120){return typeof v==='string'?v.trim().slice(0,max):''}
function cleanStringArray(v:unknown,maxItems=20,maxLen=80){return Array.isArray(v)?v.map(x=>cleanText(x,maxLen)).filter(Boolean).slice(0,maxItems):[]}
function cleanNumber(v:unknown){const n=Number(v);return Number.isFinite(n)?n:null}
function cleanBool(v:unknown){return typeof v==='boolean'?v:null}
function numberArray(v:unknown){return Array.isArray(v)?[...new Set(v.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=13))].sort((a,b)=>a-b):[]}
function pick(obj:unknown,keys:string[],max=120){
  if(!obj||typeof obj!=='object'||Array.isArray(obj))return {};
  const src=obj as Record<string,unknown>,out:Record<string,unknown>={};
  for(const k of keys){
    const v=src[k];
    if(typeof v==='string')out[k]=cleanText(v,max);
    else if(typeof v==='number'&&Number.isFinite(v))out[k]=v;
    else if(typeof v==='boolean')out[k]=v;
    else if(v===null)out[k]=null;
  }
  return out;
}
function sanitizeProgress(value:unknown,activeStep:number){
  const v=(value&&typeof value==='object'&&!Array.isArray(value)?value:{}) as Record<string,unknown>;
  const completed=numberArray(v.completed_steps);
  return {
    current_step:activeStep,
    completed_steps:completed,
    completed_step_count:completed.length,
    total_steps:14,
    completion_percent:Math.round(completed.length/14*100)
  };
}
function sanitizeCareerDna(dna:unknown){
  if(!dna||typeof dna!=='object'||Array.isArray(dna))return {};
  const d=dna as Record<string,any>;
  const answers=Array.isArray(d.balance?.answers)?d.balance.answers.slice(0,7).map((x:any)=>x&&typeof x==='object'?{
    questionId:cleanNumber(x.questionId),choice:cleanText(x.choice,1),label:cleanText(x.label,60),value:cleanText(x.value,60),confirmedAt:cleanDate(x.confirmedAt)
  }:null):[];
  const anchor=d.careerAnchor||{};
  const ranking=Array.isArray(anchor.ranking)?anchor.ranking.slice(0,8).map((x:any)=>({code:cleanText(x?.code,4),name:cleanText(x?.name,80),score:cleanNumber(x?.score)})):[];
  const scores:Record<string,number>={};
  if(anchor.scores&&typeof anchor.scores==='object')for(const [k,v] of Object.entries(anchor.scores))if(/^[A-H]$/.test(k)&&Number.isFinite(Number(v)))scores[k]=Number(v);
  return {
    standard:pick(d.standard,['version','savedAt'],100),
    balance:{answers},
    careerAnchor:{
      version:cleanText(anchor.version,100),
      responses:Array.isArray(anchor.responses)?anchor.responses.slice(0,40).map((x:any)=>Number.isFinite(Number(x))?Number(x):null):[],
      bonusItems:Array.isArray(anchor.bonusItems)?anchor.bonusItems.slice(0,3).map(Number).filter((x:number)=>x>=1&&x<=40):[],
      scores,ranking,complete:!!anchor.complete
    },
    selfStrengths:cleanStringArray(d.selfStrengths,5,40),
    viaTop5:cleanStringArray(d.viaTop5,5,60),
    multipleIntelligence:{top3:cleanStringArray(d.multipleIntelligence?.top3,3,60)},
    hypothesis:{
      selfCheck:cleanText(d.hypothesis?.selfCheck,40),
      strengthKeywords:cleanStringArray(d.hypothesis?.strengthKeywords,5,50),
      developmentKeywords:cleanStringArray(d.hypothesis?.developmentKeywords,3,50),
      verifyQuestions:cleanStringArray(d.hypothesis?.verifyQuestions,3,180),
      structuredVersion:cleanText(d.hypothesis?.structuredVersion,80)
    },
    interest:{
      type:cleanText(d.interest?.type,40),
      riasecRaw:numericObject(d.interest?.riasecRaw),
      riasecStandard:numericObject(d.interest?.riasecStandard)
    },
    workValues:numericObject(d.workValues),
    promptMeta:{version:cleanText(d.promptMeta?.version,80),moduleStatus:safeJson(d.promptMeta?.moduleStatus,3)}
  };
}
function numericObject(v:unknown){
  const out:Record<string,number>={};
  if(v&&typeof v==='object'&&!Array.isArray(v))for(const [k,x] of Object.entries(v as Record<string,unknown>))if(Number.isFinite(Number(x)))out[cleanText(k,50)]=Number(x);
  return out;
}
function sanitizeExperiences(value:unknown){
  const v=(value&&typeof value==='object'&&!Array.isArray(value)?value:{}) as Record<string,any>;
  const experiences=Array.isArray(v.experiences)?v.experiences.slice(0,30).map((x:any)=>({
    id:cleanText(x?.id,80),category:cleanText(x?.category,80),period:cleanText(x?.period,80),workMode:cleanText(x?.workMode,80),
    contribution:cleanNumber(x?.contribution),evidenceType:cleanText(x?.evidenceType,80),evidenceGrade:cleanText(x?.evidenceGrade,40),
    competencies:cleanStringArray(x?.competencies,12,60),quality:pick(x?.quality,['ownership','evidence','noFabrication','transfer']),factChecked:!!x?.factChecked,
    updatedAt:cleanDate(x?.updatedAt)
  })):[];
  return {version:cleanText(v.version,80),representativeKey:cleanText(v.representativeKey,40),experiences,updatedAt:cleanDate(v.updatedAt)};
}
function sanitizeArtifacts(a:unknown){
  const v=(a&&typeof a==='object'&&!Array.isArray(a)?a:{}) as Record<string,any>;
  const explorer=v.jobExplorer||{},industry=v.industryCompany||{},fit=v.careerFit||{},jd=v.jdAnalyzer||{},assets=v.careerAssets||{},portfolio=v.jobPortfolio||{};
  return {
    careerStartProfile:pick(v.careerStartProfile,['jobDecision','industryDecision','prepStage','updatedAt'],100),
    careerDNAProfile:{
      version:cleanText(v.careerDNAProfile?.version,80),
      valueClues:cleanStringArray(v.careerDNAProfile?.valueClues,12,60),
      careerAnchorTop:Array.isArray(v.careerDNAProfile?.careerAnchorTop)?v.careerDNAProfile.careerAnchorTop.slice(0,3).map((x:any)=>({code:cleanText(x?.code,4),name:cleanText(x?.name,80),score:cleanNumber(x?.score)})):[],
      selfStrengths:cleanStringArray(v.careerDNAProfile?.selfStrengths,5,50),
      viaTop5:cleanStringArray(v.careerDNAProfile?.viaTop5,5,60),
      multipleIntelligenceTop3:cleanStringArray(v.careerDNAProfile?.multipleIntelligenceTop3,3,60),
      updatedAt:cleanDate(v.careerDNAProfile?.updatedAt)
    },
    jobExplorer:{
      candidates:Array.isArray(explorer.candidates)?explorer.candidates.slice(0,30).map((x:any)=>({id:cleanText(x?.id,80),title:cleanText(x?.title,120),family:cleanText(x?.family,80),sourceVerified:!!x?.sourceVerified})):[],
      targets:cleanStringArray(explorer.targets,10,80),
      diversity:safeJson(explorer.diversity,2)
    },
    jobDeepDive:summarizeDeepDive(v.jobDeepDive),
    industryCompany:{
      industries:Array.isArray(industry.industries)?industry.industries.slice(0,20).map((x:any)=>({id:cleanText(x?.id,80),name:cleanText(x?.name,120),jobId:cleanText(x?.jobId,80),sourceType:cleanText(x?.sourceType,80),checkedAt:cleanText(x?.checkedAt,40)})):[],
      targetIndustries:cleanStringArray(industry.targetIndustries,5,80),
      companies:Array.isArray(industry.companies)?industry.companies.slice(0,30).map((x:any)=>({id:cleanText(x?.id,80),name:cleanText(x?.name,120),type:cleanText(x?.type,80),industryId:cleanText(x?.industryId,80),jobId:cleanText(x?.jobId,80),hiringEvidence:cleanText(x?.hiringEvidence,100),checkedAt:cleanText(x?.checkedAt,40)})):[],
      targetCompanies:cleanStringArray(industry.targetCompanies,10,80)
    },
    careerFit:{
      comparisons:Array.isArray(fit.comparisons)?fit.comparisons.slice(0,30).map((x:any)=>({
        id:cleanText(x?.id,80),jobId:cleanText(x?.jobId,80),industryId:cleanText(x?.industryId,80),companyId:cleanText(x?.companyId,80),
        roleInterest:cleanNumber(x?.roleInterest),valueFit:cleanNumber(x?.valueFit),industryAppeal:cleanNumber(x?.industryAppeal),companyAppeal:cleanNumber(x?.companyAppeal),
        evidenceReadiness:cleanNumber(x?.evidenceReadiness),jobEvidenceCoverage:cleanNumber(x?.jobEvidenceCoverage),contextEvidenceCoverage:cleanNumber(x?.contextEvidenceCoverage),
        createdAt:cleanDate(x?.createdAt)
      })):[],
      selectedId:cleanText(fit.selectedId,80)
    },
    jdAnalyzer:{
      postings:Array.isArray(jd.postings)?jd.postings.slice(0,20).map((p:any)=>({
        id:cleanText(p?.id,80),company:cleanText(p?.company,120),postingTitle:cleanText(p?.postingTitle,160),jobTitle:cleanText(p?.jobTitle,120),
        closeDate:cleanText(p?.closeDate,40),capturedAt:cleanText(p?.capturedAt,40),externalId:cleanText(p?.externalId,100),gateReviewed:!!p?.gateReviewed,
        gateStatus:Array.isArray(p?.gates)?p.gates.slice(0,30).map((g:any)=>({type:cleanText(g?.type,80),status:cleanText(g?.status,80)})):[],
        requirementSummary:summarizeRequirements(p?.requirements),createdAt:cleanDate(p?.createdAt)
      })):[],
      selectedId:cleanText(jd.selectedId,80)
    },
    careerAssets:{
      assets:Array.isArray(assets.assets)?assets.assets.slice(0,80).map((x:any)=>({
        id:cleanText(x?.id,80),postingId:cleanText(x?.postingId,80),experienceId:cleanText(x?.experienceId,80),requirementId:cleanText(x?.requirementId,80),
        requirementType:cleanText(x?.requirementType,80),requirementLevel:cleanText(x?.requirementLevel,80),evidenceLevel:cleanText(x?.evidenceLevel,80),
        strength:cleanNumber(x?.strength),useFor:cleanText(x?.useFor,80),factCheck:cleanText(x?.factCheck,80),sourceExperienceFactChecked:!!x?.sourceExperienceFactChecked,
        createdAt:cleanDate(x?.createdAt)
      })):[]
    },
    jobPortfolio:{
      status:cleanText(portfolio.status,40),
      finalChecks:pick(portfolio.finalChecks,['gate','jd','facts','consistency','ready']),
      completedAt:cleanDate(portfolio.completedAt)
    }
  };
}
function summarizeDeepDive(v:unknown){
  const analyses=(v&&typeof v==='object'&&!Array.isArray(v)?(v as any).analyses:null),out:Record<string,unknown>={};
  if(!analyses||typeof analyses!=='object'||Array.isArray(analyses))return {analyses:out};
  for(const [id,a] of Object.entries(analyses).slice(0,30)){
    const x=a as any;
    out[cleanText(id,80)]={jobTitle:cleanText(x?.jobTitle,120),sourceCount:Array.isArray(x?.sources)?x.sources.length:0,taskCount:Array.isArray(x?.tasks)?x.tasks.length:0,requirementCount:Array.isArray(x?.requirements)?x.requirements.length:0};
  }
  return {analyses:out};
}
function summarizeRequirements(v:unknown){
  const arr=Array.isArray(v)?v:[];
  const byType:Record<string,number>={},byLevel:Record<string,number>={};
  for(const r of arr.slice(0,100)){
    const type=cleanText((r as any)?.type,80)||'미분류',level=cleanText((r as any)?.level,80)||'미분류';
    byType[type]=(byType[type]||0)+1;byLevel[level]=(byLevel[level]||0)+1;
  }
  return {count:arr.length,byType,byLevel};
}
function safeJson(v:unknown,depth=2):unknown{
  if(depth<0)return null;
  if(v===null||typeof v==='boolean'||typeof v==='number')return v;
  if(typeof v==='string')return cleanText(v,100);
  if(Array.isArray(v))return v.slice(0,30).map(x=>safeJson(x,depth-1));
  if(v&&typeof v==='object'){
    const out:Record<string,unknown>={};
    for(const [k,x] of Object.entries(v as Record<string,unknown>).slice(0,40))out[cleanText(k,80)]=safeJson(x,depth-1);
    return out;
  }
  return null;
}
function sanitizeState(state:Record<string,unknown>,progress:Record<string,unknown>){
  return {
    policy_version:'jobfit-operational-min-v1',
    version:cleanNumber(state.version),
    mode:cleanText(state.mode,20),
    profile:pick(state.profile,['courseCode','institution','age','gender','grade','major','majorGroup','enrollmentStatus','graduationPlan','gpaBand'],120),
    baseline:pick(state.baseline,['jobDecision','industryDecision','prepStage','internship','careerProgram','certificate','priorApplication','workExperience','aiFrequency','aiTools','aiCareerUse'],120),
    assessments:{
      careerDNA:sanitizeCareerDna((state.assessments as any)?.careerDNA),
      experienceCompetency:sanitizeExperiences((state.assessments as any)?.experienceCompetency)
    },
    artifacts:sanitizeArtifacts(state.artifacts),
    progress,
    exclusions:['name','student_id','email','phone','research_measurements','experience_narrative','ai_conversation','resume_text','cover_letter_text','interview_text']
  };
}

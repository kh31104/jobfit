import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const allowedOrigin='https://kh31104.github.io';
const maxBodyBytes=256*1024;
const cors={'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST'||req.headers.get('origin')!==allowedOrigin)return json({error:'not_allowed'},403);
  try{
    if(!String(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return json({error:'json_required'},415);
    const declaredSize=Number(req.headers.get('content-length')||0);if(declaredSize>maxBodyBytes)return json({error:'payload_too_large'},413);
    const raw=await req.text();if(new TextEncoder().encode(raw).byteLength>maxBodyBytes)return json({error:'payload_too_large'},413);
    let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
    const {action,consent,sync_token,payload,participant_code,cohort_code}=body as {action?:string,consent?:unknown,sync_token?:string,payload?:Record<string,any>,participant_code?:string,cohort_code?:string};
    if(!/^[a-f0-9]{64}$/i.test(sync_token||''))return json({error:'invalid_sync_token'},400);
    const tokenHash=await sha256(sync_token),admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if(action==='withdraw'){
      const code=String(participant_code||'').slice(0,40),cohortCode=String(cohort_code||'').slice(0,80);
      if(!code||!cohortCode)return json({error:'participant_and_cohort_required'},400);
      const {data:cohort,error:cohortError}=await admin.from('research_cohorts').select('id').eq('cohort_code',cohortCode).single();
      if(cohortError||!cohort)return json({error:'cohort_not_found'},404);
      const {data:existing,error:existingError}=await admin.from('research_participants').select('id,sync_token_hash').eq('cohort_id',cohort.id).eq('participant_code',code).maybeSingle();
      if(existingError)throw existingError;if(!existing)return json({error:'participant_not_found'},404);if(existing.sync_token_hash!==tokenHash)return json({error:'participant_token_mismatch'},409);
      const withdrawnAt=new Date().toISOString();
      const {error:consentError}=await admin.from('research_consents').insert({participant_id:existing.id,consent_version:'withdrawal',consented:false,consented_at:withdrawnAt,withdrawn_at:withdrawnAt,withdrawal_scope:'delete_research_snapshots'});if(consentError)throw consentError;
      const {error:deleteError}=await admin.from('research_snapshots').delete().eq('participant_id',existing.id);if(deleteError)throw deleteError;
      return json({ok:true,participant_code:code,withdrawn_at:withdrawnAt,deleted_research_snapshots:true});
    }
    if(consent!==true)return json({error:'consent_required'},400);
    if(!String(payload?.schema_version||'').startsWith('jobfit-research-v1.')||payload?.export_metadata?.excludes_activity_text!==true)return json({error:'invalid_research_payload'},400);
    const approvedConsentVersion=String(Deno.env.get('RESEARCH_CONSENT_VERSION')||'').trim();
    if(approvedConsentVersion.length<3)return json({error:'research_collection_not_open'},503);
    if(String(payload?.consent_version||'')!==approvedConsentVersion)return json({error:'consent_version_mismatch'},409);
    const code=String(payload.participant_code||'').slice(0,40),cohortCode=String(payload.context?.cohort_id||'').slice(0,80);
    if(!code||!cohortCode)return json({error:'participant_and_cohort_required'},400);
    const {data:cohort,error:cohortError}=await admin.from('research_cohorts').select('id,is_active').eq('cohort_code',cohortCode).single();
    if(cohortError||!cohort?.is_active)return json({error:'inactive_cohort'},404);
    const {data:existing}=await admin.from('research_participants').select('id,sync_token_hash').eq('cohort_id',cohort.id).eq('participant_code',code).maybeSingle();
    if(existing&&existing.sync_token_hash!==tokenHash)return json({error:'participant_token_mismatch'},409);
    let participantId=existing?.id;
    if(!participantId){const {data:created,error}=await admin.from('research_participants').insert({cohort_id:cohort.id,participant_code:code,sync_token_hash:tokenHash}).select('id').single();if(error)throw error;participantId=created.id}
    else await admin.from('research_participants').update({last_received_at:new Date().toISOString()}).eq('id',participantId);
    const consentVersion=approvedConsentVersion.slice(0,100),consentedAt=new Date().toISOString();
    const {error:consentError}=await admin.from('research_consents').insert({participant_id:participantId,consent_version:consentVersion,consented:true,consented_at:consentedAt,withdrawn_at:null,withdrawal_scope:null});if(consentError)throw consentError;
    const snapshot={participant_id:participantId,schema_version:payload.schema_version,demographics:pick(payload.demographics,['age','gender','grade','major_raw','major_group','enrollment_status','graduation_horizon','gpa_band']),work24_interest:pick(payload.work24_interest,['test_type','test_date','riasec_raw','riasec_standard','big5','validity','facets','life_history']),work24_values:pick(payload.work24_values,['scores','test_date','version']),pre_measurements:measurements(payload.pre_measurements),post_measurements:measurements(payload.post_measurements),progress:pick(payload.progress,['current_step','completed_steps','completed_step_count','total_steps','completion_percent','last_saved_at']),source_exported_at:payload.export_metadata?.exported_at||null};
    const {error:snapshotError}=await admin.from('research_snapshots').insert(snapshot);if(snapshotError)throw snapshotError;
    return json({ok:true,participant_code:code,received_at:new Date().toISOString()});
  }catch(error){console.error(error);return json({error:'server_error'},500)}
});
async function sha256(value:string){const bytes=new TextEncoder().encode(value),hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function pick(value:unknown,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value))return null;return Object.fromEntries(keys.filter(key=>Object.hasOwn(value as object,key)).map(key=>[key,(value as Record<string,unknown>)[key]]))}
function measurements(value:unknown){const root=value as Record<string,unknown>|null;if(!root||typeof root!=='object'||Array.isArray(root))return null;return {captured_at:root.captured_at??null,work24_college_career_readiness:pick(root.work24_college_career_readiness,['instrument','exam_date','item_count','scores','labels','score_schema','wording_status']),kcaas:pick(root.kcaas,['instrument','item_count','response_range','items','concern','control','curiosity','confidence','total','wording_version','wording_status']),strength_deficit:pick(root.strength_deficit,['instrument','item_count','response_range','items','strength_use','deficit_correction','wording_version','wording_status','capture_context'])}}

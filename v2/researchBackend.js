const config=()=>globalThis.JOBFIT_RESEARCH_CONFIG||{};

export function researchSyncStatus(){const c=config(),endpointOk=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(c.supabaseUrl||'')&&String(c.publishableKey||'').startsWith('sb_publishable_'),consentOk=c.consentApproved===true&&String(c.consentVersion||'').length>=3&&/^https:\/\//i.test(c.consentDocumentUrl||'');return {enabled:c.enabled===true&&endpointOk&&consentOk,backendEnabled:c.enabled===true,endpointOk,consentApproved:consentOk,consentVersion:c.consentVersion||'',consentDocumentUrl:c.consentDocumentUrl||''}}
export function isResearchSyncConfigured(){return researchSyncStatus().enabled}

export function createResearchSyncToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')}

export async function submitResearchSnapshot(payload,{consent=false,syncToken}={}){
  if(!consent)throw new Error('연구 참여 동의가 확인되지 않았습니다.');
  if(!isResearchSyncConfigured())throw new Error('중앙 연구 DB 연결이 아직 활성화되지 않았습니다.');
  if(!/^[a-f0-9]{64}$/i.test(syncToken||''))throw new Error('연구 동기화 키가 없습니다.');
  if(payload?.export_metadata?.excludes_activity_text!==true)throw new Error('활동 원문 제외가 확인된 연구용 데이터만 전송할 수 있습니다.');
  if(payload?.consent_version!==config().consentVersion)throw new Error('승인된 연구동의 버전과 일치하지 않습니다.');
  const c=config(),response=await fetch(`${c.supabaseUrl}/functions/v1/${c.functionName||'research-sync'}`,{
    method:'POST',headers:{'apikey':c.publishableKey,'Content-Type':'application/json'},
    body:JSON.stringify({consent:true,sync_token:syncToken,payload})
  });
  const text=await response.text();if(!response.ok)throw new Error(`중앙 저장 실패 (${response.status}) ${text}`.trim());
  return text?JSON.parse(text):{ok:true};
}

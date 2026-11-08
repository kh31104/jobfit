const SESSION_KEY='jobfit:instructor:supabase-session';
const config=()=>globalThis.JOBFIT_RESEARCH_CONFIG||{};

export function instructorBackendStatus(){const c=config(),endpointOk=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(c.supabaseUrl||'')&&String(c.publishableKey||'').startsWith('sb_publishable_');return {enabled:c.instructorAuthEnabled===true&&endpointOk,endpointOk,supabaseUrl:c.supabaseUrl||'',publishableKey:c.publishableKey||''}}

// Auth callback accepts implicit tokens, token-hash and PKCE links without logging credentials.
// Called by instructor pages; learner localStorage and datasets are never used.
function cleanAuthUrl(){
  const url=new URL(location.href);
  const sensitive=['access_token','refresh_token','expires_in','expires_at','token_hash','type','code','error','error_code','error_description'];
  for(const name of sensitive)url.searchParams.delete(name);
  history.replaceState(null,'',url.pathname+url.search);
}
function saveInstructorSession(accessToken,refreshToken,seconds){
  if(typeof accessToken!=='string'||accessToken.split('.').length!==3)throw new Error('로그인 인증 토큰 형식이 올바르지 않습니다.');
  const expiresIn=Number(seconds);
  if(!Number.isFinite(expiresIn)||expiresIn<=0)throw new Error('로그인 인증 유효시간이 지났습니다.');
  const session={accessToken,refreshToken:refreshToken||'',expiresAt:Date.now()+Math.max(15,expiresIn-30)*1000};
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));return session;
}
export async function captureAuthCallback(){
  const fragment=new URLSearchParams(location.hash.replace(/^#/,''));
  const query=new URLSearchParams(location.search);
  const param=(key)=>fragment.get(key)||query.get(key);
  const errorCode=param('error_code')||param('error');
  if(errorCode){
    cleanAuthUrl();
    return {ok:false,reason:'인증 링크 오류 ('+String(errorCode).slice(0,65)+'). 새로운 로그인 메일을 발급받으세요.'};
  }
  const accessToken=param('access_token');
  if(accessToken){
    const refreshToken=param('refresh_token')||'';
    const seconds=param('expires_in')||'3600';
    cleanAuthUrl();
    try{
      const saved=saveInstructorSession(accessToken,refreshToken,seconds);
      return {ok:true,session:saved,method:'implicit'};
    }catch(e){return {ok:false,reason:String(e.message||e)};}
  }
  const tokenHash=param('token_hash');
  if(tokenHash){
    const type=param('type')||'magiclink';
    cleanAuthUrl();
    if(!['magiclink','email'].includes(type))return {ok:false,reason:'지원되지 않는 로그인 링크 유형입니다.'};
    const config=instructorBackendStatus();
    if(!config.enabled)return {ok:false,reason:'교수자 인증 서버 설정을 확인해야 합니다.'};
    try{
      const resp=await fetch(config.supabaseUrl+'/auth/v1/verify',{
        method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},
        body:JSON.stringify({token_hash:tokenHash,type})
      });
      if(!resp.ok)return {ok:false,reason:'인증 링크가 만료되었거나 이미 사용되었습니다. 새로운 메일을 요청하세요.'};
      const result=await resp.json();
      const saved=saveInstructorSession(result.access_token,result.refresh_token,result.expires_in||3600);
      return {ok:true,session:saved,method:'token_hash'};
    }catch(e){return {ok:false,reason:'인증 링크 확인 중 연결 문제가 발생했습니다. 다시 로그인해 주세요.'};}
  }
  const code=param('code');
  if(code){
    cleanAuthUrl();
    try{
      const conf=instructorBackendStatus();
      if(!conf.enabled)return {ok:false,reason:'교수자 인증 서버 설정을 확인해야 합니다.'};
      // PKCE links are redeemable only when the initiating browser has the verifier.
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
      const sdk=createClient(conf.supabaseUrl,conf.publishableKey,{auth:{
        flowType:'pkce',detectSessionInUrl:false,persistSession:false,autoRefreshToken:false,
        storage:sessionStorage,storageKey:'jobfit:instructor:pkce'
      }});
      const {data,error}=await sdk.auth.exchangeCodeForSession(code);
      if(error||!data?.session)return {ok:false,reason:'인증 코드 교환에 실패했습니다. 새 로그인 메일을 요청해 주세요.'};
      const s=data.session;
      const saved=saveInstructorSession(s.access_token,s.refresh_token,s.expires_in||3600);
      return {ok:true,session:saved,method:'pkce'};
    }catch(e){return {ok:false,reason:'인증 코드 처리가 완료되지 않았습니다. 새 로그인 메일을 요청해 주세요.'};}
  }
  return {ok:!!getSession(),session:getSession(),reason:getSession()?'':'인증정보가 전달되지 않았습니다. 메일의 로그인 링크를 다시 확인해 주세요.'};
}

export function getSession(){try{const session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(!session?.accessToken||Number(session.expiresAt)<=Date.now()){sessionStorage.removeItem(SESSION_KEY);return null}return session}catch{return null}}

export async function requestMagicLink(email){const c=instructorBackendStatus();if(!c.enabled)throw new Error('교수자 중앙 DB 로그인이 아직 활성화되지 않았습니다.');const clean=String(email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw new Error('이메일 주소를 확인해 주세요.');const redirectTo=new URL('./',location.href).href;const endpoint=new URL(`${c.supabaseUrl}/auth/v1/otp`);endpoint.searchParams.set('redirect_to',redirectTo);const response=await fetch(endpoint.href,{method:'POST',headers:{'apikey':c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:clean,create_user:false})});const text=await response.text();if(!response.ok)throw new Error(`로그인 링크 요청 실패 (${response.status}) ${text}`.trim());return {ok:true}}

export async function loadCentralResearch(cohortCode='INJE2026'){const c=instructorBackendStatus(),session=getSession();if(!c.enabled)throw new Error('교수자 중앙 DB 조회가 아직 활성화되지 않았습니다.');if(!session)throw new Error('교수자 로그인이 필요합니다.');const response=await fetch(`${c.supabaseUrl}/rest/v1/rpc/get_research_dashboard`,{method:'POST',headers:{'apikey':c.publishableKey,'Authorization':`Bearer ${session.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({p_cohort_code:cohortCode})});const text=await response.text();if(response.status===401){sessionStorage.removeItem(SESSION_KEY);throw new Error('로그인 시간이 만료되었습니다. 다시 로그인해 주세요.')}if(!response.ok)throw new Error(`중앙 데이터 조회 실패 (${response.status}) ${text}`.trim());const rows=text?JSON.parse(text):[];return rows.map(row=>row.research_record||row)}

export async function signOutInstructor(){const c=instructorBackendStatus(),session=getSession();sessionStorage.removeItem(SESSION_KEY);if(c.enabled&&session?.accessToken){await fetch(`${c.supabaseUrl}/auth/v1/logout`,{method:'POST',headers:{'apikey':c.publishableKey,'Authorization':`Bearer ${session.accessToken}`}}).catch(()=>{})}}

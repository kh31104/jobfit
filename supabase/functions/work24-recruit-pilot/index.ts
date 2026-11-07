// JOBFIT instructor-only Work24 API connectivity probe, independent of student app.
// No database reads except instructor authorization; no writes or student storage.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGINS = new Set(['https://kh31104.github.io', 'https://supabase.com', 'https://app.supabase.com']);
const LIMIT = new Map();
const RESPONSE_HEADERS = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'Vary':'Origin'
};
function json(body,status=200,origin=''){
  const headers={...RESPONSE_HEADERS};
  if(ALLOWED_ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
  return new Response(JSON.stringify(body),{status,headers});
}
function clip(text,max=180){
  return String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function value(xml,tag,max=180){
  const name=tag.replace(/[^A-Za-z0-9]/g,'');
  const match=xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'\\s*>','i'));
  if(!match)return '';
  return clip(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'"),max);
}
function blocks(xml,tag){
  const re=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'\\s*>','gi');
  return [...xml.matchAll(re)].map(x=>x[1]).slice(0,12);
}
function detailLink(id){
  return 'https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?wantedAuthNo='+
    encodeURIComponent(id)+'&infoTypeCd=VALIDATION&infoTypeGroup=tb_workinfoworknet';
}
async function fetchWork24(path,params){
  const url=new URL('https://www.work24.go.kr/cm/openApi/call/wk/'+path);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  // Never log the URL: authKey is a credential.
  const resp=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(11000),
    headers:{'Accept':'application/xml, text/xml, */*'}});
  if(!resp.ok)throw new Error('upstream_http_'+resp.status);
  if(Number(resp.headers.get('content-length')||0)>800000)throw new Error('response_too_large');
  const raw=await resp.text();
  if(raw.length>800000)throw new Error('response_too_large');
  return raw;
}

Deno.serve(async(req)=>{
  const origin=String(req.headers.get('origin')||'');
  if(req.method==='OPTIONS'){
    if(!ALLOWED_ORIGINS.has(origin))return json({error:'origin_not_allowed'},403);
    return new Response(null,{status:204,headers:{
      'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type',
      'Access-Control-Max-Age':'600'
    }});
  }
  if(req.method!=='POST')return json({error:'post_only'},405,origin);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:'origin_not_allowed'},403);
  if(Number(req.headers.get('content-length')||0)>1200)return json({error:'request_too_large'},413,origin);
  const authorization=String(req.headers.get('authorization')||'');
  const jwt=authorization.match(/^Bearer\s+([a-zA-Z0-9_.-]+)$/)?.[1]||'';
  if(!jwt)return json({error:'instructor_login_required'},401,origin);

  const projectUrl=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!projectUrl||!serviceKey)return json({error:'auth_server_not_configured'},503,origin);
  const admin=createClient(projectUrl,serviceKey,
    {auth:{autoRefreshToken:false,persistSession:false}});
  const {data:identity,error:authError}=await admin.auth.getUser(jwt);
  if(authError||!identity?.user)return json({error:'invalid_login'},401,origin);

  const {data:membership,error:membershipError}=await admin.from('research_instructors')
    .select('cohort_id, research_cohorts!inner(cohort_code)')
    .eq('user_id',identity.user.id).limit(20);
  const approved=!membershipError&&Array.isArray(membership)&&
    membership.some(row=>row.research_cohorts?.cohort_code==='INJE2026');
  if(!approved)return json({error:'inje_instructor_permission_required'},403,origin);

  const now=Date.now(),uid=identity.user.id;
  const prev=LIMIT.get(uid)||{time:now,calls:0};
  if(now-prev.time>60000){prev.time=now;prev.calls=0;}
  prev.calls++;LIMIT.set(uid,prev);
  if(prev.calls>4)return json({error:'pilot_rate_limit_4_per_min'},429,origin);

  const key=Deno.env.get('WORK24_RECRUIT_API_KEY')||'';
  if(!key)return json({error:'WORK24_RECRUIT_API_KEY_not_set'},503,origin);

  let input={};
  try{input=await req.json();}catch{return json({error:'invalid_json'},400,origin);}
  const keyword=clip(input.keyword||'',45);
  const career=String(input.career||'').toUpperCase();
  if(career&&!['N','Z'].includes(career))return json({error:'career_must_be_N_or_Z'},400,origin);
  const params={authKey:key,callTp:'L',returnType:'XML',startPage:'1',display:'10'};
  if(keyword)params.keyword=keyword;
  if(career)params.career=career;
  try{
    const raw=await fetchWork24('callOpenApiSvcInfo210L01.do',params);
    if(!/<wantedRoot(?:\s[^>]*)?>/i.test(raw)){
      return json({ok:false,stage:'list',error:'unexpected_xml_or_api_error',
        upstreamCode:value(raw,'errorCode',40)||value(raw,'returnCode',40)||null,
        note:'고용24 응답 형식을 확인해야 합니다. 인증키는 반환하지 않습니다.'},502,origin);
    }
    const entries=blocks(raw,'wanted').map(xml=>{
      const id=value(xml,'wantedAuthNo',60);
      return {
        id,
        company:value(xml,'company',110),
        title:value(xml,'title',150),
        career:value(xml,'career',70),
        region:value(xml,'region',70),
        registrationDate:value(xml,'regDt',30),
        closingDate:value(xml,'closeDt',30),
        source:'고용24',
        sourceUrl:id?detailLink(id):''
      };
    }).filter(r=>r.id);
    const detailIds=[...new Set(entries.map(x=>x.id))].slice(0,2);
    const details=[];
    for(const id of detailIds){
      const detailRaw=await fetchWork24('callOpenApiSvcInfo210D01.do',
        {authKey:key,callTp:'D',returnType:'XML',wantedAuthNo:id,infoSvc:'VALIDATION'});
      const root=blocks(detailRaw,'wantedDtl')[0]||'';
      const obj=root?{
        id,
        jobDescriptionPresent:!!value(root,'jobCont',200),
        certificatePresent:!!value(root,'certificate',200),
        preferredConditionsPresent:!!(value(root,'pfCond',150)||value(root,'etcPfCond',150)),
        majorPresent:!!value(root,'major',100),
        computerSkillsPresent:!!value(root,'compAbl',100),
        jobDescriptionExcerpt:value(root,'jobCont',190),
        sourceUrl:detailLink(id)
      }:{id,error:'detail_xml_not_returned',sourceUrl:detailLink(id)};
      details.push(obj);
    }
    return json({
      ok:true,kind:'work24-recruit-connectivity-pilot',
      sampleOnly:true,queriedAt:new Date().toISOString(),
      filter:{keyword:keyword||null,career:career||null,startPage:1,display:10},
      total:Number(value(raw,'total',25))||0,
      received:entries.length,detailChecked:details.length,
      postings:entries,details,
      limitations:'목록 최대 10건, 상세 최대 2건만 조회한 교수자용 기술 테스트. 통계적 대표성 없음. 기존 학생 데이터에 미반영.',
      attribution:'고용노동부 고용24(www.work24.go.kr) 제공. 무단복제 및 배포 금지.'
    },200,origin);
  }catch(error){
    const known=['response_too_large','upstream_http_401','upstream_http_403','upstream_http_404','upstream_http_500'];
    const msg=String(error?.message||'');
    return json({ok:false,error:known.includes(msg)?msg:'work24_network_or_parse_error',
      note:'외부 고용24 연결 또는 응답 검증 실패. 인증키 값과 원문 응답은 반환하지 않습니다.'},502,origin);
  }
});
// Independent professor-only public industry CSV preview. No student DB/localStorage writes.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {SOURCES,fetchPublicCsv,transform} from './lib.mjs';

const ALLOW=new Set(['https://kh31104.github.io']);
const CACHE=new Map();
const TIMES=new Map();
function answer(body,status,origin){
 const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(ALLOW.has(origin))h['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(body),{status,headers:h});
}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS'){
  if(!ALLOW.has(origin))return answer({error:'origin_denied'},403,origin);
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':origin,
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'authorization, apikey, content-type',
   'Access-Control-Max-Age':'600'
  }});
 }
 if(req.method!=='POST')return answer({error:'post_only'},405,origin);
 if(origin&&!ALLOW.has(origin))return answer({error:'origin_denied'},403,origin);
 if(Number(req.headers.get('content-length')||0)>1500)return answer({error:'body_too_large'},413,origin);
 const auth=(req.headers.get('authorization')||'').match(/^Bearer ([a-zA-Z0-9._-]+)$/)?.[1]||'';
 if(!auth)return answer({error:'login_required'},401,origin);
 const url=Deno.env.get('SUPABASE_URL')||'';
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||
  (()=>{try{return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||''}catch{return ''}})();
 if(!url||!secret)return answer({error:'server_auth_unconfigured'},503,origin);
 const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:identity,error:authError}=await admin.auth.getUser(auth);
 if(authError||!identity?.user)return answer({error:'invalid_session'},401,origin);
 const {data:rows,error:membershipError}=await admin.from('research_instructors')
  .select('cohort_id,research_cohorts!inner(cohort_code,is_active)')
  .eq('user_id',identity.user.id).limit(10);
 const isFaculty=!membershipError&&Array.isArray(rows)&&
  rows.some(x=>x.research_cohorts?.cohort_code==='INJE2026'&&x.research_cohorts?.is_active===true);
 if(!isFaculty)return answer({error:'inje_professor_permission_required'},403,origin);
 let input={};
 try{input=await req.json()}catch{return answer({error:'invalid_json'},400,origin)}
 const kind=String(input.kind||'');
 const source=SOURCES[kind];
 if(!source)return answer({error:'unsupported_source'},400,origin);
 const keyword=String(input.keyword||'').replace(/[<>\r\n]/g,'').trim();
 if(keyword.length>40)return answer({error:'keyword_too_long'},400,origin);
 const now=Date.now(),userId=identity.user.id;
 const rate=TIMES.get(userId)||[];
 const active=rate.filter(x=>now-x<60000);
 if(active.length>=6)return answer({error:'rate_limited_6_per_minute'},429,origin);
 active.push(now);TIMES.set(userId,active);
 try{
  let item=CACHE.get(kind);
  if(!item||item.expires<now){
   const response=await fetchPublicCsv(kind);
   item={table:response.table,bytes:response.receivedBytes,expires:now+30*60*1000,receivedAt:new Date().toISOString()};
   CACHE.set(kind,item);
  }
  const data=transform(kind,item.table,keyword,10);
  return answer({
   ok:true,kind,source:{title:source.title,provider:source.provider,url:source.url,
     baseDate:source.baseDate,license:source.license,tableField:source.field},
   result:{matched:data.matched,shown:data.records.length,rows:data.records},
   received:{bytes:item.bytes,at:item.receivedAt},queriedAt:new Date().toISOString(),
   caveats:['공개파일 기준일의 기록입니다. 현재 정책·모집상태가 아닙니다.',
     '산업 변화에서 직무 채용 증감으로 자동 추론하지 않습니다.',
     '교수자 전용 미리보기이며 학생 데이터에 기록하지 않습니다.']
  },200,origin);
 }catch(e){
  const msg=String(e?.message||'');
  const safe=/^(public_(?:metadata_http_\d+|download_http_\d+|file_too_large|file_empty|file_not_csv|file_unusable|file_metadata_missing)|invalid_csv)$/.test(msg)?msg:'public_source_unreachable';
  return answer({ok:false,error:safe,note:'공개파일 수신 또는 CSV 읽기에 실패했습니다. 학생 자료에는 영향이 없습니다.'},502,origin);
 }
});

// INJE STEP 7 instructor pilot: official-source preview only.
// No student data is accepted or stored. Server-only DART_API_KEY is required for company data.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGIN='https://kh31104.github.io';
const PROJECT_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_ROLE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ALLOWED_HOSTS=new Set(['korea.kr','www.korea.kr','moel.go.kr','www.moel.go.kr','motie.go.kr','www.motie.go.kr','kostat.go.kr','www.kostat.go.kr','kosis.kr','www.kosis.kr','bok.or.kr','www.bok.or.kr','kdi.re.kr','www.kdi.re.kr','msit.go.kr','www.msit.go.kr','nia.or.kr','www.nia.or.kr','nrf.re.kr','www.nrf.re.kr','www.data.go.kr','data.go.kr']);
const cors={'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type','Vary':'Origin','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const clean=(s:unknown,max=800)=>String(s??'').replace(/[\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const pauseDate=(s:string)=>s&&/^\d{8}$/.test(s)?s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8):'';
const limit=new Map<string,{n:number,t:number}>();

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.headers.get('origin')!==ALLOWED_ORIGIN||req.method!=='POST')return reply({error:'허용되지 않은 요청입니다.'},403);
  if(!String(req.headers.get('content-type')||'').includes('application/json'))return reply({error:'JSON 요청만 지원합니다.'},415);
  if(Number(req.headers.get('content-length')||0)>2000)return reply({error:'요청이 너무 큽니다.'},413);
  if(!PROJECT_URL||!SERVICE_ROLE)return reply({error:'교수자 인증 서버 설정을 확인해 주세요.'},503);
  const bearer=String(req.headers.get('authorization')||'').match(/^Bearer\s+([\w.\-_]+)$/i)?.[1];
  if(!bearer)return reply({error:'교수자 로그인 후 사용하세요.'},401);
  const admin=createClient(PROJECT_URL,SERVICE_ROLE,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:userResult,error:userError}=await admin.auth.getUser(bearer);
  if(userError||!userResult?.user)return reply({error:'교수자 로그인 세션이 유효하지 않습니다.'},401);
  // Membership is checked server-side. Student logins cannot access this endpoint.
  const {data:members,error:membershipError}=await admin.from('research_instructors').select('cohort_id, research_cohorts!inner(cohort_code)').eq('user_id',userResult.user.id).limit(20);
  const valid=!membershipError&&Array.isArray(members)&&members.some((row:any)=>row.research_cohorts?.cohort_code==='INJE2026');
  if(!valid)return reply({error:'INJE2026 교수자 권한이 확인되지 않았습니다.'},403);
  const marker=userResult.user.id,now=Date.now(),hits=limit.get(marker)||{n:0,t:now};
  if(now-hits.t>60000){hits.n=0;hits.t=now;}hits.n++;limit.set(marker,hits);
  if(hits.n>12)return reply({error:'1분에 최대 12회까지 조회할 수 있습니다.'},429);
  let input:Record<string,unknown>;
  try{input=await req.json();}catch{return reply({error:'요청 형식을 확인해 주세요.'},400);}
  try{
    if(input.kind==='industry'){
      const url=new URL(String(input.url||''));
      if(url.protocol!=='https:'||!ALLOWED_HOSTS.has(url.hostname)||url.port||url.username||url.password)return reply({error:'지원하는 공식 기관의 HTTPS 원문 주소만 입력하세요.'},400);
      if(url.toString().length>1000)return reply({error:'주소가 너무 깁니다.'},400);
      const page=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(9000),headers:{'User-Agent':'JobfitInstructorPilot/1.0 (research preview, respectful requests)','Accept':'text/html'}});
      if(!page.ok)return reply({error:'공식 페이지를 읽지 못했습니다. 다른 기관 자료를 시도하거나 원문을 직접 확인하세요.',status:page.status},422);
      if(!String(page.headers.get('content-type')||'').toLowerCase().includes('text/html'))return reply({error:'HTML 원문만 자동 미리보기가 가능합니다. PDF/HWP는 직접 확인해 주세요.'},422);
      const size=Number(page.headers.get('content-length')||0);
      if(size>450000)return reply({error:'페이지가 커서 자동 추출을 중단했습니다.'},422);
      const reader=page.body?.getReader();if(!reader)return reply({error:'본문을 읽지 못했습니다.'},422);
      const chunks:Uint8Array[]=[];let read=0;
      while(true){const {done,value}=await reader.read();if(done)break;if(value){read+=value.byteLength;if(read>450000){await reader.cancel();return reply({error:'페이지 용량 초과. 수집하지 않았습니다.'},422);}chunks.push(value);}}
      const bytes=new Uint8Array(read);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
      const html=new TextDecoder().decode(bytes);
      const meta=(key:string)=>{const escaped=key.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');const tag=html.match(new RegExp('<meta\\s+[^>]*(?:property|name)=["\\\']'+escaped+'["\\\'][^>]*>','i'))?.[0]||'';return clean(tag.match(/content=["']([^"']{1,1200})["']/i)?.[1]||'',400);};
      const title=clean(meta('og:title')||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'',180);
      const pub=clean(meta('article:published_time')||meta('date')||'',40);
      const description=clean(meta('og:description')||meta('description')||'',380);
      const body=clean(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&'),750);
      return reply({ok:true,kind:'industry',title:title||'원문 제목 미추출',issuer:url.hostname,published:pub||'',url:url.toString(),excerpt:description||body,checked:false,notice:'웹 문구 미리보기일 뿐 산업분석 결과나 검증 완료가 아닙니다.'});
    }
    if(input.kind==='company'){
      const code=clean(input.corp_code,20);
      if(!/^\d{8}$/.test(code))return reply({error:'OpenDART 기업 고유번호 8자리를 입력하세요.'},400);
      const dartKey=Deno.env.get('DART_API_KEY');
      if(!dartKey)return reply({error:'OpenDART 인증키 미설정: Supabase Edge Functions Secrets에 DART_API_KEY를 등록해야 합니다.',code:'dart_key_missing'},503);
      const fetchDart=async(path:string,params:Record<string,string>)=>{
        const u=new URL('https://opendart.fss.or.kr/api/'+path);
        for(const [k,v] of Object.entries({crtfc_key:dartKey, ...params}))u.searchParams.set(k,v);
        const resp=await fetch(u,{signal:AbortSignal.timeout(10000)});
        if(!resp.ok)return {status:'http_'+resp.status,message:'OpenDART 요청 실패'};
        return await resp.json();
      };
      const company=await fetchDart('company.json',{corp_code:code});
      if(company.status!=='000')return reply({error:'기업개황 조회 실패: '+clean(company.message||company.status,180)},422);
      const year=String(new Date().getUTCFullYear()-1);
      const [accounts,reports]=await Promise.all([
        fetchDart('fnlttSinglAcnt.json',{corp_code:code,bsns_year:year,reprt_code:'11011'}),
        fetchDart('list.json',{corp_code:code,bgn_de:year+'0101',end_de:String(new Date().getUTCFullYear())+'1231',pblntf_ty:'A',page_count:'100'})
      ]);
      const list=Array.isArray(reports.list)?reports.list:[];
      const annual=list.find((r:any)=>/사업보고서/.test(String(r.report_nm||''))&&String(r.report_nm||'').includes(year));
      const sourceUrl=annual?.rcept_no?'https://dart.fss.or.kr/dsaf001/main.do?rcpNo='+annual.rcept_no:'';
      const rows=Array.isArray(accounts.list)?accounts.list:[];
      const findAmount=(names:RegExp)=>rows.find((r:any)=>r.fs_div==='CFS'&&names.test(String(r.account_nm||''))&&r.thstrm_amount)?.thstrm_amount;
      const values=[['매출액',findAmount(/^(매출액|영업수익|수익\(매출액\))$/)],['영업이익',findAmount(/^영업이익/)],['당기순이익',findAmount(/^당기순이익$/)]].filter((x)=>Boolean(x[1]));
      return reply({ok:true,kind:'company',companyName:clean(company.corp_name,120),corp_code:code,industryCode:clean(company.induty_code,40),address:clean(company.adres,250),homepage:clean(company.hm_url,200),financialYear:year,financials:values.map(([label,amount])=>({label,amount:String(amount)})),consolidated:true,issuer:'금융감독원 전자공시시스템',sourceTitle:year+'년 사업보고서 주요계정',published:pauseDate(String(annual?.rcept_dt||'')),url:sourceUrl,checked:false,notice:sourceUrl?'사업보고서 원문을 확인한 뒤 검증 체크하세요.':'해당 연도 사업보고서 원문 주소를 찾지 못했습니다. 검증 완료로 표시하지 마세요.'});
    }
    return reply({error:'지원하지 않는 자료 유형입니다.'},400);
  }catch(error){console.error('Step7 instructor preview failed',String(error));return reply({error:'공식자료 연결에 실패했습니다. 주소·API 설정을 확인해 주세요.'},502);}
});

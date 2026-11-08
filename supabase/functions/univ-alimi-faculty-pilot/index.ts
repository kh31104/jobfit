// JOBFIT INJE STEP 7 university faculty/research public-data gateway.
// Read-only, no student records. Secret remains exclusively on the server.
const ALLOW="https://kh31104.github.io";
const SOURCE="https://www.data.go.kr/data/15158678/openapi.do";
const BASE="https://apis.data.go.kr/B340014/EducationResearchService/";
const CODE_BASE="https://apis.data.go.kr/B340014/BasicInformationService_2/getUniversityCode";
const OPS=Object.freeze({
  ensure:"getNoticeFullTimeFacultyEnsureRate",
  research:"getComparisonFullTimeFacultyResearchCrntSt"
});
const cache=new Map<string,{until:number,data:unknown}>();
const perIp=new Map<string,{t:number,n:number,day:string,daily:number}>();
function response(payload:unknown,status=200,origin=""){
  const headers:Record<string,string>={
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
    "Vary":"Origin","X-Content-Type-Options":"nosniff"
  };
  if(origin===ALLOW)headers["Access-Control-Allow-Origin"]=origin;
  return new Response(JSON.stringify(payload),{status,headers});
}
function unescapeXml(s:string){
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n,16),0x10ffff)))
    .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
    .replace(/&(amp|lt|gt|quot|apos);/g,(_,x)=>({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"} as Record<string,string>)[x]);
}
function xmlValue(s:string,tag:string){
  const m=s.match(new RegExp("<(?:[\\w-]+:)?"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?"+tag+"\\s*>","i"));
  return m?unescapeXml(m[1]).replace(/<[^>]+>/g,"").trim().slice(0,200):"";
}
function rows(xml:string){
  const tags=["item","row","record"];
  for(const tag of tags){
    const chunks=[...xml.matchAll(new RegExp("<(?:[\\w-]+:)?"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?"+tag+"\\s*>","gi"))].slice(0,60);
    if(chunks.length){
      return chunks.map(c=>{
        const obj:Record<string,string>={};
        for(const m of c[1].matchAll(/<([a-zA-Z][a-zA-Z0-9_-]*)(?:\s[^>]*)?>([^<>]*)<\/\1\s*>/g)){
          if(Object.keys(obj).length>=40)break;
          obj[m[1]]=unescapeXml(m[2]).replace(/[\u0000-\u001f]/g," ").trim().slice(0,160);
        }
        return obj;
      }).filter(x=>Object.keys(x).length);
    }
  }
  return [];
}
const schoolOf=(o:Record<string,string>)=>o.schlKrnNm||o.schulNm||o.schulName||o.schoolNm||o.schNm||o.univNm||o.univName||o.schoolName||o.schlNm||o.schulKrnNm||"";
Deno.serve(async req=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS")return origin===ALLOW?new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"content-type",
    "Access-Control-Max-Age":"600"
  }}):response({error:"origin_not_allowed"},403);
  if(origin&&origin!==ALLOW)return response({error:"origin_not_allowed"},403);
  if(req.method!=="GET")return response({error:"get_only"},405,origin);
  const u=new URL(req.url);
  if(u.searchParams.has("key")||u.searchParams.has("serviceKey"))return response({error:"do_not_send_secrets"},400,origin);
  const school=(u.searchParams.get("school")||"").trim();
  const kind=u.searchParams.get("kind")||"ensure";
  const providedSchoolId=(u.searchParams.get("schoolId")||"").trim();
  if(providedSchoolId&&!/^[A-Za-z0-9_-]{3,40}$/.test(providedSchoolId)) return response({error:"invalid_school_id"},400,origin);
  const year=Number(u.searchParams.get("year")||new Date().getUTCFullYear()-1);
  if(!/^[가-힣A-Za-z0-9()·.\- ]{2,48}$/.test(school)||!OPS[kind as keyof typeof OPS])
    return response({error:"invalid_school_or_kind"},400,origin);
  const currentYear=new Date().getUTCFullYear();
  if(!Number.isInteger(year)||year<2020||year>currentYear)return response({error:"invalid_year"},400,origin);
  const ck=[school,kind,year].join(":");
  const c=cache.get(ck);
  if(c&&c.until>Date.now())return response({...c.data as object,cached:true},200,origin);
  const ip=(req.headers.get("x-forwarded-for")||req.headers.get("cf-connecting-ip")||"unknown").split(",")[0];
  const now=Date.now(),day=new Date().toISOString().slice(0,10),prev=perIp.get(ip)||{t:now,n:0,day,daily:0};
  if(now-prev.t>60000){prev.t=now;prev.n=0;}
  if(prev.day!==day){prev.day=day;prev.daily=0;}
  prev.n++;prev.daily++;perIp.set(ip,prev);
  if(prev.n>6||prev.daily>25)return response({error:"request_limit"},429,origin);
  const secret=(Deno.env.get("UNIV_ALIMI_FACULTY_RESEARCH_API_KEY")||"").trim();
  if(!secret)return response({error:"university_api_secret_missing"},503,origin);
  const upstream=new URL(BASE+OPS[kind as keyof typeof OPS]);
  upstream.searchParams.set("serviceKey",secret);
  upstream.searchParams.set("pageNo","1");
  upstream.searchParams.set("numOfRows","30");
  upstream.searchParams.set("svyYr",String(year));
  try{
    let schoolId=providedSchoolId;
    if(!schoolId){
      // University names cannot be substituted for the required 'schlId' parameter.
      // Resolve the official ID first using the separate, publicly documented code API.
      const codeUrl=new URL(CODE_BASE);
      codeUrl.searchParams.set("serviceKey",secret);
      codeUrl.searchParams.set("pageNo","1");
      codeUrl.searchParams.set("numOfRows","100");
      codeUrl.searchParams.set("svyYr",String(year));
      codeUrl.searchParams.set("schlKrnNm",school);
      let codeResp=await fetch(codeUrl,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),
        headers:{"Accept":"application/xml,text/xml,*/*"}});
      if(codeResp.status===403){
        const errorBody=await codeResp.clone().text();
        const alt=(Deno.env.get("JOB_ALIO_RECRUIT_API_KEY")||"").trim();
        if(xmlValue(errorBody,"returnReasonCode")==="30"&&alt&&alt!==secret){
          codeUrl.searchParams.set("serviceKey",alt);
          codeResp=await fetch(codeUrl,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),
            headers:{"Accept":"application/xml,text/xml,*/*"}});
        }
      }
      if(!codeResp.ok)return response({error:"school_code_lookup_http_"+codeResp.status,
        guidance:"대학 기본 정보 API 활용승인과 인증키를 확인해 주세요.",
        source:"https://www.data.go.kr/data/15158963/openapi.do"},422,origin);
      const codeXml=(await codeResp.text()).slice(0,450000);
      const codeResult=xmlValue(codeXml,"resultCode")||xmlValue(codeXml,"returnReasonCode");
      if(codeResult&&!["0","00","200","000"].includes(codeResult))
        return response({error:"school_code_lookup_api_error",resultCode:codeResult},422,origin);
      const codeRows=rows(codeXml);
      const norm=(x:string)=>x.toLowerCase().replace(/[\s()]/g,"");
      const exact=codeRows.filter(x=>norm(schoolOf(x))===norm(school));
      const matches=exact.filter(x=>/^[A-Za-z0-9_-]{3,40}$/.test(String(x.schlId||"")));
      const unique=[...new Set(matches.map(x=>x.schlId))];
      if(unique.length!==1){
        return response({error:unique.length>1?"school_code_ambiguous":"school_code_not_found",
          received:codeRows.length,matched:matches.length,
          guidance:"대학명·공시연도를 확인하거나 학교아이디(schlId)를 직접 지정하세요.",
          source:"https://www.data.go.kr/data/15158963/openapi.do"},422,origin);
      }
      schoolId=unique[0];
    }
    upstream.searchParams.set("schlId",schoolId);
    let resp=await fetch(upstream,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),
      headers:{"Accept":"application/xml,text/xml,*/*"}});
    // A separate approved data.go.kr application may share a different service key.
    // Retry only once for an explicit unregistered-key response; never disclose either key.
    let alternateTried=false;
    if(resp.status===403){
      const firstError=await resp.clone().text();
      const firstCode=xmlValue(firstError,"returnReasonCode");
      const alt=(Deno.env.get("JOB_ALIO_RECRUIT_API_KEY")||"").trim();
      if(firstCode==="30"&&alt&&alt!==secret){
        alternateTried=true;
        upstream.searchParams.set("serviceKey",alt);
        resp=await fetch(upstream,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),
          headers:{"Accept":"application/xml,text/xml,*/*"}});
      }
    }
    if(!resp.ok){
      // Return only a classified response code. Never return the credential or raw response.
      const failureBody=(await resp.text()).slice(0,15000);
      const gatewayCode=xmlValue(failureBody,"returnReasonCode")||
        xmlValue(failureBody,"resultCode")||xmlValue(failureBody,"code");
      const gatewayType=xmlValue(failureBody,"returnAuthMsg")||
        xmlValue(failureBody,"errMsg");
      const bodyType=/<(?:!DOCTYPE|html|HTML)/.test(failureBody)?"html":
        /<\?xml|<OpenAPI_ServiceResponse|<response/.test(failureBody)?"xml":"other";
      return response({error:"source_http_"+resp.status,source:SOURCE,
        gatewayCode:gatewayCode.slice(0,15),gatewayType:gatewayType.replace(/[^A-Za-z0-9_-]/g,"").slice(0,70),
        bodyType,alternateTried,credentialLooksEncoded:secret.includes("%")},502,origin);
    }
    if(Number(resp.headers.get("content-length")||0)>450000)return response({error:"source_response_too_large"},502,origin);
    const xml=await resp.text();
    if(xml.length>450000)return response({error:"source_response_too_large"},502,origin);
    if(/<!DOCTYPE|<!ENTITY/i.test(xml))return response({error:"unsupported_xml"},502,origin);
    if(!/^\s*</.test(xml))return response({error:"source_not_xml"},502,origin);
    const code=xmlValue(xml,"resultCode")||xmlValue(xml,"returnCode")||xmlValue(xml,"code");
    if(code&&!["0","00","200","000"].includes(code))
      return response({error:"source_api_error",resultCode:code.slice(0,15),source:SOURCE},502,origin);
    const authCode=xmlValue(xml,"returnReasonCode");
    if(authCode)return response({error:"source_gateway_error",gatewayCode:authCode.slice(0,15),
      gatewayType:xmlValue(xml,"returnAuthMsg").replace(/[^A-Za-z0-9_-]/g,"").slice(0,70)},502,origin);
    const all=rows(xml);
    const tagNames=[...new Set([...xml.matchAll(/<\/?(?:[\w-]+:)?([a-zA-Z][\w-]*)\b/g)].map(x=>x[1]))].slice(0,25);
    const xmlRoot=(xml.match(/<(?!\?|!)([A-Za-z_][\w:-]*)\b/)||[])[1]||"unknown";
    const norm=(x:string)=>x.toLowerCase().replace(/[\s()]/g,"");
    const matches=all.filter(o=>{
      const rowSchool=schoolOf(o);
      if(rowSchool)return norm(rowSchool)===norm(school);
      if(o.schlId)return String(o.schlId)===schoolId;
      return true; // Official server filtered this response by the verified school ID.
    }).slice(0,5);
    if(!matches.length){
      const error=all.length?"school_matching_unverified":"no_data_or_schema_unverified";
      return response({ok:false,error,school,year,kind,received:all.length,source:SOURCE,xmlRoot,tagNames,
        notice:"정확한 학교명이 포함된 응답을 확인하지 못했습니다. 다른 대학 자료를 섞지 않습니다."},422,origin);
    }
    const result={ok:true,school,schoolId,year,kind,rows:matches,
      source:SOURCE,provider:"한국대학교육협의회 대학알리미",
      checked:false,
      notice:"API 원자료 미리보기입니다. 공시 기준연도와 항목 의미를 원문에서 대조하세요."};
    cache.set(ck,{until:Date.now()+30*60*1000,data:result});
    if(cache.size>150)cache.delete(cache.keys().next().value!);
    return response(result,200,origin);
  }catch{
    return response({error:"source_network_or_timeout",source:SOURCE},502,origin);
  }
});
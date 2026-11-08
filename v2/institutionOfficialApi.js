// INJE STEP 7: official-data API routing. No keys or student answers are sent.
// Instructor-authorized pilot endpoints remain locked for ordinary student sessions.
import {getSession,instructorBackendStatus} from '../instructor/centralBackend.js?v=2';

const PROJECT='https://hllnoriffbhzpyhpnvsf.supabase.co';
const ENDPOINTS=Object.freeze({
  university:'univ-alimi-faculty-pilot',
  company:'step7-source-preview',
  work24:'work24-recruit-pilot',
  public:'job-alio-recruit-pilot'
});

export function officialRouteFor(type){
  if(type==='university')return {primary:'university',source:'대학알리미',url:'https://www.data.go.kr/data/15158678/openapi.do'};
  if(type==='public')return {primary:'public',source:'JOB-ALIO',url:'https://job.alio.go.kr/recruit.do'};
  if(type==='company')return {primary:'company',source:'OpenDART · 고용24',url:'https://dart.fss.or.kr'};
  return {primary:null,source:'대상 기관 확인 필요',url:''};
}
export function instructorSessionReady(){
  const session=getSession(),cfg=instructorBackendStatus();
  return Boolean(session?.accessToken&&cfg.enabled&&cfg.publishableKey);
}
async function secureCall(endpoint,method,payload,params){
  const session=getSession(),cfg=instructorBackendStatus();
  if(!session?.accessToken||!cfg.enabled||!cfg.publishableKey){
    const error=new Error('교수자 인증이 필요한 API입니다. 학생은 공식 원문 링크로 자료를 확인할 수 있습니다.');
    error.code='instructor_authorization_required';
    throw error;
  }
  const url=new URL(PROJECT+'/functions/v1/'+endpoint);
  for(const [k,v] of Object.entries(params||{}))if(v!==''&&v!=null)url.searchParams.set(k,String(v));
  const res=await fetch(url.toString(),{
    method,
    cache:'no-store',
    headers:{'Accept':'application/json','apikey':cfg.publishableKey,
      'Authorization':'Bearer '+session.accessToken,...(method==='POST'?{'Content-Type':'application/json'}:{})},
    ...(method==='POST'?{body:JSON.stringify(payload||{})}:{}),
    signal:AbortSignal.timeout(17000)
  });
  let body;
  try{body=await res.json()}catch{throw new Error('공식자료 서버의 응답을 읽을 수 없습니다.');}
  if(!res.ok||body?.ok===false){
    const err=new Error(
      body?.error==='school_code_ambiguous'?'학교코드가 2개 이상 확인됐습니다. 본교·분교를 선택하세요.':
      body?.error==='school_code_not_found'?'공시연도와 대학명을 확인하세요.':
      body?.error==='school_code_lookup_http_403'?'대학 기본정보 API 인증권한을 확인하세요.':
      res.status===401?'교수자 로그인 세션이 만료됐습니다.':
      res.status===403?'해당 조회에 대한 교수자 권한이 없습니다.':
      'API 조회 실패 ('+String(body?.error||res.status)+')'
    );
    err.code=body?.error||'upstream_error';err.data=body;throw err;
  }
  return body;
}
export async function getUniversityRecords({school,year='2025',kind='ensure',schoolId=''}) {
  return secureCall(ENDPOINTS.university,'GET',null,{school,year,kind,schoolId});
}
export async function getPublicRecruitment() {
  return secureCall(ENDPOINTS.public,'POST',{action:'list'});
}
export async function getDartCompany(corpCode) {
  if(!/^\d{8}$/.test(String(corpCode)))throw new Error('OpenDART 기업 고유번호 8자리를 입력하세요.');
  return secureCall(ENDPOINTS.company,'POST',{kind:'company',corp_code:String(corpCode)});
}
export async function getWork24Recruitment(keyword) {
  if(!keyword||String(keyword).length>45)throw new Error('검색할 기업명을 입력하세요(최대 45자).');
  return secureCall(ENDPOINTS.work24,'POST',{keyword:String(keyword)});
}

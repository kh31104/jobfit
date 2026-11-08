import {renderInjeStep7Tables} from '../../v2/steps/step7Tables.js?v=1';
import {captureAuthCallback,getSession,requestMagicLink,signOutInstructor} from '../centralBackend.js';

const KEY='jobfit:instructor:step7-source-pilot-v1';
const root=document.getElementById('stepRoot');
const $=id=>document.getElementById(id);
const config=()=>window.JOBFIT_RESEARCH_CONFIG||{};
const empty=()=>({version:2.2,profile:{major:'교육학과'},artifacts:{},assessments:{},meta:{pilot:true}});
let state=load(),last=null;
function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');return saved&&typeof saved==='object'&&saved.meta?.pilot===true?saved:empty()}catch{return empty()}}
function deepMerge(base,patch){const out=structuredClone(base);for(const [key,value] of Object.entries(patch||{})){if(['__proto__','constructor','prototype'].includes(key))continue;if(value&&typeof value==='object'&&!Array.isArray(value)&&out[key]&&typeof out[key]==='object'&&!Array.isArray(out[key]))out[key]=deepMerge(out[key],value);else out[key]=value;}return out;}
function saveState(patch){state=deepMerge(state,patch);localStorage.setItem(KEY,JSON.stringify(state));return state;}
function toast(s){const el=$('toast');el.textContent=s;el.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.display='none',2800);}
const ctx={getState:()=>state,saveState,escapeHtml:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),toast,navigate:()=>toast('교수자 시범 화면에서는 STEP 이동이 비활성화되어 있습니다.'),makeAnonCode:()=>{const v='JF26-PILOT1';saveState({profile:{anonCode:v}});return v;}};
function render(){renderInjeStep7Tables(ctx,()=>toast('이전 STEP 자료는 교수자 시범 화면에서 열지 않습니다.'));}
function status(message){$('pilotStatus').textContent=message;toast(message)}
function authStatus(message){$('authStatus').textContent=message;}
function showPreview(value){
  last=value;
  if(!value){$('pilotData').textContent='아직 수집한 자료가 없습니다.';$('applyPilot').disabled=true;$('copyPilot').disabled=true;return;}
  if(value.kind==='sample'){$('pilotData').textContent='[샘플/실제 자료 아님]\n\n산업분석의 Policy 칸에 연습용 문장을 한 번만 넣어 빈칸 보호와 자동저장을 확인합니다.';}
  else if(value.kind==='industry'){$('pilotData').textContent=['[공식 사이트 HTML 수집 · 아직 원문 대조 전]', '발행처: '+value.issuer,'자료명: '+value.title,'게시일: '+(value.published||'확인 필요'),'원문: '+value.url,'문서 일부(자동 추출·검증 전): '+(value.excerpt||'미추출'),'주의: '+value.notice].join('\n');}
  else if(value.kind==='company'){$('pilotData').textContent=['[OpenDART 공식 API 조회 · 아직 원문 대조 전]','기업명: '+value.companyName,'DART 고유번호: '+value.corp_code,'산업코드: '+(value.industryCode||'확인 필요'),'소재지: '+(value.address||'확인 필요'), '사업연도: '+value.financialYear+'년 (연결 재무 기준)',...value.financials.map(x=>x.label+': '+x.amount+'원'),'원문 사업보고서: '+(value.url||'원문 링크 미확인'),'주의: '+value.notice].join('\n');}
  $('applyPilot').disabled=false;$('copyPilot').disabled=value.kind==='sample';
}
async function request(kind,fields){
  const session=getSession(),c=config();
  if(!session)throw new Error('공식자료 자동 수집은 먼저 교수자 이메일 로그인 후 사용할 수 있습니다. 샘플 저장 테스트는 로그인 없이 가능합니다.');
  if(!c.supabaseUrl||!c.publishableKey)throw new Error('Supabase 공개 설정이 누락되었습니다.');
  const resp=await fetch(c.supabaseUrl+'/functions/v1/step7-source-preview',{method:'POST',headers:{'apikey':c.publishableKey,'authorization':'Bearer '+session.accessToken,'content-type':'application/json'},body:JSON.stringify({kind,...fields})});
  let data;try{data=await resp.json()}catch{throw new Error('서버 응답을 읽지 못했습니다 ('+resp.status+').')}
  if(!resp.ok||!data.ok)throw new Error(data.error||'공식자료 서버 오류 ('+resp.status+')');
  return data;
}
function setLoading(kind,loading){const id=kind==='industry'?'loadIndustry':'loadCompany';$(id).disabled=loading;$(id).textContent=loading?'자료 확인 중…':kind==='industry'?'공식 문서 불러오기':'기업개황·재무정보 불러오기';}
$('loadIndustry').addEventListener('click',async()=>{
  const url=$('industryUrl').value.trim();if(!url){status('공식 자료의 상세 URL을 입력하세요.');return;}
  setLoading('industry',true);
  try{showPreview(await request('industry',{url}));status('정부·공공기관 자료를 가져왔습니다. 원문 대조 전 상태입니다.');}
  catch(e){showPreview(null);status(String(e.message||e));}finally{setLoading('industry',false)}
});
$('loadCompany').addEventListener('click',async()=>{
  const corp_code=$('corpCode').value.trim();
  if(!/^\d{8}$/.test(corp_code)){status('OpenDART 기업 고유번호는 숫자 8자리입니다.');return;}
  setLoading('company',true);
  try{showPreview(await request('company',{corp_code}));status('OpenDART 기업자료를 가져왔습니다. 수치를 원문과 대조해 주세요.');}
  catch(e){showPreview(null);status(String(e.message||e));}finally{setLoading('company',false)}
});
function hasValue(el){return !!String(el?.value||'').trim();}
function fillCell(kind,field,text){
  const el=$(kind+'-'+field);if(!el||hasValue(el))return false;
  el.value=text;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('blur',{bubbles:true}));return true;
}
function availableSource(kind){
  for(let n=1;n<=8;n++){
    const id='S'+n;
    const el=document.querySelector('[data-kind="'+kind+'"][data-source="'+id+'"][data-source-key="title"]');
    if(el&&!hasValue(el))return id;
  }
  return null;
}
function writeSource(kind,id,row){
  for(const key of ['issuer','title','published','url']){
    const el=document.querySelector('[data-kind="'+kind+'"][data-source="'+id+'"][data-source-key="'+key+'"]');
    if(el){el.value=String(row[key]||'');el.dispatchEvent(new Event('input',{bubbles:true}));}
  }
}
$('applyPilot').addEventListener('click',()=>{
  if(!last)return;
  if(last.kind==='sample'){
    const written=fillCell('industry','policy','• [연습용 데이터] 자동 수집 인터페이스 확인을 위한 샘플. 실제 정책 정보가 아닙니다.');
    status(written?'교수자 샘플을 빈칸에 저장했습니다. 새로고침해도 남는지 확인하세요.':'기존에 작성된 Policy 칸을 보호하여 덮어쓰지 않았습니다.');return;
  }
  const kind=last.kind,source=availableSource(kind);
  if(!source){status('출처 표 S1~S8이 모두 사용 중이어서 새 내용을 반영하지 않았습니다. 기존 출처를 보존했습니다.');return;}
  let applied=0;
  if(kind==='industry'){
    const field=$('industryField').value;
    const text='• [공식자료 수집/해석 전] '+last.title+' — '+(last.excerpt||'본문 내용 미추출, 원문 확인 필요').slice(0,180)+' ['+source+']';
    if(fillCell('industry',field,text))applied++;
    if(!applied){status('선택한 칸에 기존 글이 있어 덮어쓰지 않았습니다. 다른 빈칸을 선택하거나 직접 수정하세요.');return;}
    writeSource('industry',source,{issuer:last.issuer,title:last.title,published:last.published,url:last.url});
  }else{
    if(last.financials?.length){
      const amount=last.financials.map(x=>x.label+' '+x.amount+'원').join(' · ');
      if(fillCell('company','financePerformance','• '+last.financialYear+'년 사업보고서 연결 재무 기준: '+amount+' ['+source+']'))applied++;
    }
    if(fillCell('company','other','• 기업명 '+last.companyName+' · DART 고유번호 '+last.corp_code+' · 산업코드 '+(last.industryCode||'확인 필요')+' ['+source+']'))applied++;
    if(!applied){status('기존 기업분석 칸을 보호해 덮어쓰지 않았습니다. 필요한 내용을 직접 수정하세요.');return;}
    writeSource('company',source,{issuer:last.issuer,title:last.sourceTitle,published:last.published,url:last.url});
  }
  status(applied+'개 빈칸에 반영했습니다. 원문 대조 체크는 자동으로 선택하지 않았습니다. ['+source+']');
});
$('samplePilot').addEventListener('click',()=>{showPreview({kind:'sample'});status('샘플 준비 완료. 실제 산업자료가 아닙니다. ');});
$('copyPilot').addEventListener('click',async()=>{
  if(!last||last.kind==='sample')return;
  const fact=last.kind==='industry'?[last.title,last.excerpt,last.url].join('\n'):['기업 '+last.companyName,'사업연도 '+last.financialYear,...(last.financials||[]).map(x=>x.label+' '+x.amount+'원'),last.url||'원문 주소 미확인'].join('\n');
  const prompt=['아래는 공식 출처에서 자동 추출한 미검증 자료다. 원문을 재확인하고, 없는 사실은 추가하지 마라.','근거가 확인된 내용만 산업 PEST / 기업 5개 영역과 SWOT 분석표의 알맞은 칸에 개조식으로 정리해라.','확인할 수 없는 내용은 확인 필요라고 적고, 사실과 해석을 분리해라.','[수집 내용]',fact].join('\n\n');
  try{await navigator.clipboard.writeText(prompt);status('AI 분석용 수집자료를 복사했습니다. STEP 7의 분석 프롬프트와 함께 사용하세요.');}catch{status('클립보드 권한 때문에 복사하지 못했습니다.');}
});
$('clearPilot').addEventListener('click',()=>{
  if(!confirm('교수자 STEP 7 시범 저장자료만 삭제합니다. 학생 운영 데이터는 건드리지 않습니다. 초기화할까요?'))return;
  localStorage.removeItem(KEY);state=empty();showPreview(null);render();status('교수자 시범 데이터만 초기화했습니다.');
});
$('pilotLogin').addEventListener('click',async()=>{
  try{await requestMagicLink($('pilotEmail').value);authStatus('등록된 교수자 이메일로 로그인 링크를 전송했습니다. 메일의 링크로 다시 이 화면에 돌아오세요.');}
  catch(e){authStatus('로그인 요청 실패: '+String(e.message||e));}
});
$('pilotLogout').addEventListener('click',async()=>{await signOutInstructor();authStatus('로그아웃했습니다.');});
authStatus('교수자 로그인 완료 여부를 확인하고 있습니다.');
void captureAuthCallback().then(result=>{
  if(result?.ok)authStatus('교수자 로그인 세션이 있습니다. 공식자료 호출 시 권한을 추가 확인합니다.');
  else if(result?.reason && /인증 링크|인증 코드|인증 토큰/.test(result.reason))authStatus(result.reason);
  else authStatus('미로그인 · 샘플 테스트는 바로 가능');
}).catch(()=>authStatus('로그인 완료 처리 중 오류가 발생했습니다.'));
render();showPreview(null);

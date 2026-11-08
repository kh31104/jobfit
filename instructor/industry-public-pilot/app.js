import {captureAuthCallback,getSession,requestMagicLink,signOutInstructor,instructorBackendStatus} from '../centralBackend.js?v=2';
import {industryJobPlan} from './plan.mjs?v=1';
const $=id=>document.getElementById(id);
let last=null;
let activePlan=null;
const slots={policy:'P · 정책',economy:'E · 경제',society:'S · 사회',technology:'T · 기술'};
function msg(id,value,state=''){
 const node=$(id);node.textContent=String(value||'');node.dataset.state=state;
}
function el(tag,text='',className=''){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
function td(row,text){const c=el('td',text==null?'—':String(text));row.append(c);return c;}

const labelByKind={bsi:'산업통상부 · 제조업 경기지수 (E)',support:'중소벤처기업부 · 지원사업 목록 (P)',ethics:'NIA · 디지털윤리 동향 (S)'};
function invalidateResults(){
 $('results').hidden=true;$('meta').replaceChildren();
 msg('sourceStatus','산업·직무 조건이 바뀌었습니다. 새 기준으로 다시 조회하세요.');
}
function showRecommendations(){
 const plan=industryJobPlan($('industry').value,$('targetJob').value);
 activePlan=plan;
 const container=$('recommendations');container.replaceChildren();
 invalidateResults();
 msg('recommendStatus',plan.sectorLabel+' · '+plan.note+(plan.uncovered?'\n자료 범위의 한계: '+plan.uncovered:''),
  plan.suggestions.length?'success':'');
 if(!plan.suggestions.length){
  container.append(el('p','현재 연결된 공개 CSV 3종에서 적합한 출처를 자동 선정할 수 없습니다. 아래 원자료 직접 조회를 사용할 수 있으나 산업 관련성을 먼저 확인하세요.','profileHelp'));
  return;
 }
 for(const item of plan.suggestions){
  const card=el('div','','reco');
  card.append(el('h3',labelByKind[item.kind]||item.kind));
  card.append(el('p','추천 수준: '+item.level+' · 찾을 단어: '+item.keyword));
  card.append(el('p',item.why));
  const button=el('button','이 자료로 관련 항목 조회');button.type='button';
  button.addEventListener('click',()=>{
   if(activePlan!==plan){
    msg('sourceStatus','산업·직무를 변경했으므로 관련 자료를 다시 추천받아야 합니다.','error');return;
   }
   void runFetch('guided',item.kind);
  });
  card.append(button);container.append(card);
 }
}
$('recommend').addEventListener('click',showRecommendations);
for(const [buttonId,industry,job] of [
 ['exampleEducation','교육산업','교육기획'],
 ['exampleManufacturing','자동차 제조업','품질관리'],
 ['exampleTech','AI·소프트웨어 산업','데이터 분석']
]){
 $(buttonId).addEventListener('click',()=>{
  $('industry').value=industry;$('targetJob').value=job;showRecommendations();
 });
}
for(const id of ['industry','targetJob']){
 $(id).addEventListener('input',()=>{
  activePlan=null;$('recommendations').replaceChildren();
  msg('recommendStatus','입력 조건이 바뀌었습니다. ‘관련 자료 추천’을 다시 눌러주세요.');
  invalidateResults();
 });
}

function renderAuth(){
 if(getSession())msg('authStatus','로그인 세션을 확인했습니다. 공개 산업자료는 조회 시 교수자 권한을 다시 검증합니다.','success');
 else msg('authStatus','교수자 미로그인. 새 탭에서 열면 기존 탭의 로그인 세션이 공유되지 않을 수 있습니다.');
}
$('login').addEventListener('click',async()=>{
 $('login').disabled=true;
 try{await requestMagicLink($('email').value);msg('authStatus','새 로그인 링크 요청이 접수됐습니다. 메일에서 같은 브라우저로 로그인하세요.','success');}
 catch(e){const m=String(e?.message||e);msg('authStatus',m.includes('429')?'Supabase 이메일 발송 제한(429)입니다. 반복 요청하지 마세요.':m,'error');}
 finally{$('login').disabled=false;}
});
$('logout').addEventListener('click',async()=>{await signOutInstructor();renderAuth();});
function formatRow(kind,x){
 if(kind==='bsi')return [x.title,x.actualLabel+': '+x.actual,x.forecastLabel+': '+x.forecast];
 if(kind==='support')return [x.category,x.title,x.agency,x.start+' ~ '+x.end,x.original];
 return [x.year,x.title,x.summary];
}
function entryNote(kind,item,source,queriedAt,selection=null){
 let note='';
 if(kind==='bsi')note='• 업종: '+item.title+'\n• '+item.actualLabel+': '+item.actual+'\n• '+item.forecastLabel+': '+item.forecast;
 if(kind==='support')note='• 지원사업: '+item.title+'\n• 분야: '+item.category+'\n• 소관기관: '+item.agency+'\n• 신청기간(파일 내 기록): '+item.start+' ~ '+item.end+
  (item.original?'\n• 상세원문: '+item.original:'');
 if(kind==='ethics')note='• 자료: '+item.title+'\n• 연도: '+item.year+'\n• 내용(발췌): '+item.summary;
 const context=selection?.mode==='guided'?'[탐색 기준] '+selection.industry+
  (selection.targetJob?' / '+selection.targetJob:'')+
  '\n[관련성 구분] '+selection.level+' · '+selection.why+'\n':'';
 return context+note+'\n\n[출처] '+source.provider+' · '+source.title+
  '\n[파일 기준일] '+source.baseDate+'\n[조회일] '+queriedAt.slice(0,10)+
  '\n[원문] '+source.url+
  '\n[확인 필요] 원문 대조 및 시점 확인. 특정 직무의 채용 증감으로 자동 해석하지 않음.';
}
function renderResult(result){
 const meta=$('meta');meta.replaceChildren();
 const source=result.source;
 const a=el('a','원문 파일 확인');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';
 const info=el('p',source.provider+' · '+source.title+' · 파일 기준일 '+source.baseDate+
  ' · 자료 '+result.result.matched+'건 중 '+result.result.shown+'건 표시'+
  ' · 실제 조회 '+result.queriedAt.slice(0,19).replace('T',' ')+' UTC');
 const guide=result.selection||null;
 if(guide?.mode==='guided'){
  meta.append(el('p','맞춤 후보 · '+guide.sector+' / '+guide.industry+
    (guide.targetJob?' / '+guide.targetJob:'')+
    ' · '+guide.level+' · 문서 검색어: '+guide.keyword));
  meta.append(el('p',guide.why+(guide.uncovered?' · 자료 범위 한계: '+guide.uncovered:'')));
 }else if($('industry').value.trim()){
  meta.append(el('p','원자료 직접 조회 결과입니다. 입력한 산업·직무와 관련성이 자동 확인된 것은 아닙니다.'));
 }
 meta.append(info,el('p','이용조건: '+source.license+' · 접수기간이나 정책 시행 여부는 최신 원문 확인 필요.'),a);
 const kind=result.kind;
 const headings=kind==='bsi'?['업종','최신 현황','최신 전망','PEST 표']:
   kind==='support'?['분야','사업명','소관기관','파일 내 신청기간','상세 URL','PEST 표']:
   ['연도','보고서명','내용 발췌','PEST 표'];
 $('head').replaceChildren();const h=el('tr');for(const v of headings)h.append(el('th',v));$('head').append(h);
 const body=$('rows');body.replaceChildren();
 for(const item of result.result.rows||[]){
  const row=el('tr');const values=formatRow(kind,item);
  for(let i=0;i<values.length;i++){
   if(kind==='support'&&i===4&&item.original){
    const cell=el('td');const link=el('a','원문 확인');link.href=item.original;
    link.rel='noopener noreferrer';link.target='_blank';cell.append(link);row.append(cell);
   }else td(row,values[i]);
  }
  const action=el('td');const button=el('button','빈칸에 반영');button.type='button';
  button.addEventListener('click',()=>{
   const target=$(source.tableField);
   if(!target){msg('pestStatus','이 자료의 PEST 대상 칸이 없습니다.','error');return;}
   if(target.value.trim()){msg('pestStatus',slots[source.tableField]+' 칸에 내용이 있어 덮어쓰지 않았습니다. 직접 수정하거나 이 칸을 비운 후 반영하세요.','error');return;}
   target.value=entryNote(kind,item,source,result.queriedAt,result.selection||null);
   msg('pestStatus',slots[source.tableField]+' 칸에 원문 정보와 기준일을 반영했습니다. 직접 검토·수정 가능합니다.','success');
   target.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  action.append(button);row.append(action);body.append(row);
 }
 if(!body.children.length){const row=el('tr'),cell=el('td','해당 검색어에 맞는 기록이 없습니다. 검색어를 지우고 조회하세요.');cell.colSpan=headings.length;row.append(cell);body.append(row);}
 $('results').hidden=false;
}
async function runFetch(mode='manual',chosenKind=null){
 if(!getSession()){msg('sourceStatus','INJE2026 교수자 이메일 로그인이 필요합니다. 현재 탭에 유효한 인증정보가 없습니다.','error');return;}
 const cfg=instructorBackendStatus();
 if(!cfg.enabled){msg('sourceStatus','Supabase 교수자 인증 설정을 확인해 주세요.','error');return;}
 const button=$('search');button.disabled=true;button.textContent='공개 CSV 수신 중…';
 msg('sourceStatus','공공데이터포털에서 실제 공개파일을 확인하는 중입니다.');
 $('results').hidden=true;
 try{
  const body={kind:chosenKind||$('source').value,
    keyword:mode==='guided'?'':$('keyword').value.trim(),mode};
  if(mode==='guided'){
    body.industry=$('industry').value.trim();
    body.targetJob=$('targetJob').value.trim();
  }
  const response=await fetch(cfg.supabaseUrl+'/functions/v1/industry-public-pilot',{
   method:'POST',
   headers:{apikey:cfg.publishableKey,authorization:'Bearer '+getSession().accessToken,'content-type':'application/json'},
   body:JSON.stringify(body),cache:'no-store'
  });
  const data=await response.json();
  if(!response.ok||!data.ok){
   if(response.status===401)throw Error('로그인 시간이 만료됐습니다. 교수자 인증이 다시 필요합니다.');
   if(response.status===403)throw Error('INJE2026 교수자 조회 권한이 확인되지 않았습니다.');
   throw Error('자료 수신 실패 (HTTP '+response.status+'): '+String(data.error||'unknown'));
  }
  last=data;
  renderResult(data);
  msg('sourceStatus','공개 CSV 파일 수신 성공. 원문 확인 후 아래 PEST 표의 빈칸에만 반영할 수 있습니다.','success');
 }catch(e){msg('sourceStatus',String(e.message||e),'error');}
 finally{button.disabled=false;button.textContent='실제 CSV 조회';}
}
$('search').addEventListener('click',()=>void runFetch('manual'));
$('copy').addEventListener('click',async()=>{
 const text=Object.entries(slots).map(([k,v])=>v+'\n'+($(k).value.trim()||'(미입력)')).join('\n\n');
 try{await navigator.clipboard.writeText(text);msg('pestStatus','교수자 시험용 PEST 표를 복사했습니다. 학생 데이터에는 저장되지 않았습니다.','success');}
 catch{msg('pestStatus','브라우저 클립보드 권한이 없어 복사하지 못했습니다.','error');}
});
$('clear').addEventListener('click',()=>{
 if(!window.confirm('이 화면의 PEST 미리보기 입력값만 초기화합니다. 학생 데이터와는 무관합니다. 진행할까요?'))return;
 for(const key of Object.keys(slots))$(key).value='';
 msg('pestStatus','교수자 시험표만 비웠습니다.','success');
});
const wasAuthCallback=/(?:access_token|refresh_token|token_hash|code|error_code|error)=/.test(location.hash+location.search);
msg('authStatus','교수자 로그인 상태 확인 중…');
void captureAuthCallback().then(r=>{
 if(r?.ok||getSession())renderAuth();
 else if(wasAuthCallback&&r?.reason)msg('authStatus',r.reason,'error');
 else renderAuth();
}).catch(()=>msg('authStatus','교수자 인증 완료 처리에 실패했습니다. 기존 로그인 화면에서 확인해 주세요.','error'));

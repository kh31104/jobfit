import {captureAuthCallback,getSession,requestMagicLink,signOutInstructor,instructorBackendStatus} from '../centralBackend.js?v=2';

const $=id=>document.getElementById(id);
const fn='/functions/v1/work24-recruit-pilot';
function status(id,message,state=''){
  const el=$(id);el.textContent=message;el.dataset.state=state;
}
function textCell(row,value){
  const td=document.createElement('td');td.textContent=String(value||'—');row.append(td);return td;
}
function safeDate(value){return String(value||'—').slice(0,24);}
function render(result){
  const wrap=$('results');wrap.hidden=false;
  $('total').textContent=String(result.total??'—');
  $('received').textContent=String(result.received??'—');
  $('checked').textContent=String(result.detailChecked??'—');
  $('queryMeta').textContent='실제 조회 시각: '+safeDate(result.queriedAt)+
    ' · 키워드: '+String(result.filter?.keyword||'전체')+
    ' · 경력: '+(result.filter?.career==='N'?'신입':result.filter?.career==='Z'?'경력 무관':'전체');
  const tbody=$('rows');tbody.replaceChildren();
  for(const item of result.postings||[]){
    const row=document.createElement('tr');
    textCell(row,item.company);textCell(row,item.title);textCell(row,item.career);
    textCell(row,item.region);textCell(row,item.registrationDate);
    const td=document.createElement('td');
    if(item.id){
      const link=document.createElement('a');
      const url=new URL('https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do');
      url.searchParams.set('wantedAuthNo',String(item.id));
      url.searchParams.set('infoTypeCd','VALIDATION');
      url.searchParams.set('infoTypeGroup','tb_workinfoworknet');
      link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='고용24 열기';
      td.append(link);
    } else td.textContent='확인 필요';
    row.append(td);tbody.append(row);
  }
  if(!tbody.children.length){
    const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=6;td.textContent='수신된 채용공고가 없습니다. 검색어를 바꿔서 다시 시험하세요.';
    tr.append(td);tbody.append(tr);
  }
  const detailBox=$('details');detailBox.replaceChildren();
  for(const detail of result.details||[]){
    const section=document.createElement('section');section.className='detail';
    const title=document.createElement('b');title.textContent='구인인증번호: '+String(detail.id||'미확인');section.append(title);
    if(detail.error){
      const p=document.createElement('p');p.textContent='상세 응답 파싱 미완료: '+String(detail.error);section.append(p);
    }else{
      const tokens=document.createElement('div');tokens.className='tokens';
      const checks=[
        ['직무내용',detail.jobDescriptionPresent],
        ['자격면허',detail.certificatePresent],
        ['우대조건',detail.preferredConditionsPresent],
        ['전공',detail.majorPresent],
        ['컴퓨터활용',detail.computerSkillsPresent]
      ];
      for(const [label,present] of checks){
        const item=document.createElement('span');
        item.className='token'+(present?'':' missing');
        item.textContent=label+': '+(present?'수신':'값 없음');
        tokens.append(item);
      }
      section.append(tokens);
      const p=document.createElement('p');
      p.textContent='직무내용 일부: '+String(detail.jobDescriptionExcerpt||'내용 없음');
      section.append(p);
    }
    detailBox.append(section);
  }
  if(!detailBox.children.length)detailBox.textContent='상세조회 대상이 없습니다.';
}
function authMessage(){
  const session=getSession();
  if(session)status('authStatus','로그인 세션을 확인했습니다. 실제 API 호출 시 교수자 권한을 다시 검증합니다.','success');
  else status('authStatus','미로그인. 위에 등록된 교수자 이메일을 입력하고 로그인 링크를 요청하세요.');
}
$('sendLogin').addEventListener('click',async()=>{
  const el=$('sendLogin');el.disabled=true;
  status('authStatus','이메일 로그인 요청 중…');
  try{
    await requestMagicLink($('email').value);
    status('authStatus','로그인 링크 발송 요청이 접수됐습니다. 이메일에서 링크를 클릭해 이 화면으로 돌아오세요.','success');
  }catch(error){
    status('authStatus','로그인 실패: '+String(error.message||error),'error');
  }finally{el.disabled=false;}
});
$('logout').addEventListener('click',async()=>{
  await signOutInstructor();authMessage();
});
$('probe').addEventListener('click',async()=>{
  $('results').hidden=true;
  const session=getSession();
  if(!session){status('probeStatus','교수자 이메일 로그인 후 조회할 수 있습니다. Supabase 대시보드 로그인과는 다른 인증입니다.','error');return;}
  const conf=instructorBackendStatus();
  if(!conf.enabled){status('probeStatus','교수자 인증 설정을 확인해야 합니다.','error');return;}
  const keyword=$('keyword').value.trim();
  const career=$('career').value;
  const btn=$('probe');btn.disabled=true;btn.textContent='고용24에서 확인 중…';
  status('probeStatus','공식 API에 조회 요청 중입니다. 조회 결과가 확인될 때만 표를 표시합니다.');
  try{
    const response=await fetch(conf.supabaseUrl+fn,{
      method:'POST',
      headers:{
        'apikey':conf.publishableKey,
        'authorization':'Bearer '+session.accessToken,
        'content-type':'application/json'
      },
      body:JSON.stringify({keyword,career}),
      cache:'no-store'
    });
    let body;
    try{body=await response.json();}catch{throw Error('서버 응답 형식을 읽을 수 없습니다 (HTTP '+response.status+').');}
    if(!response.ok||body?.ok!==true){
      const code=String(body?.error||'unknown_error');
      if(response.status===401)throw Error('교수자 로그인 세션이 유효하지 않습니다. 이메일로 다시 로그인하세요. ('+code+')');
      if(response.status===403)throw Error('INJE2026 교수자 조회 권한이 아직 등록되지 않았습니다. ('+code+')');
      if(response.status===503)throw Error('Supabase 환경변수 또는 서버 설정을 확인하세요. ('+code+')');
      throw Error('실제 API 조회 실패 (HTTP '+response.status+'): '+code);
    }
    render(body);
    status('probeStatus','고용24 응답 수신 성공 · 목록 '+String(body.received)+
      '건 · 상세 '+String(body.detailChecked)+'건 확인. 표의 내용은 실제 조회 응답입니다.','success');
  }catch(error){
    status('probeStatus',String(error.message||error),'error');
  }finally{btn.disabled=false;btn.textContent='실제 API 10건 조회';}
});
status('authStatus','로그인 완료 여부를 확인하고 있습니다.');
void captureAuthCallback().then(result=>{
  if(result?.ok)authMessage();
  else if(result?.reason && (location.hash || location.search))status('authStatus',result.reason,'error');
  else if(result?.reason && /인증 링크|인증 코드|인증 토큰/.test(result.reason))status('authStatus',result.reason,'error');
  else authMessage();
}).catch(()=>status('authStatus','로그인 완료 처리 중 오류가 발생했습니다. 새 로그인 링크로 다시 시도해 주세요.','error'));
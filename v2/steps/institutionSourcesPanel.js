// JOBFIT INJE STEP 7 · official sources organized by the chosen institution.
// Selection and preview are transient: existing student records are never replaced automatically.
import {officialRouteFor,instructorSessionReady,getUniversityRecords,getPublicRecruitment,getDartCompany,getWork24Recruitment} from '../institutionOfficialApi.js?v=1';

const LINKS={
 university:[['대학알리미 교원·연구 API','https://www.data.go.kr/data/15158678/openapi.do'],['대학알리미 공시 원문','https://www.academyinfo.go.kr']],
 public:[['JOB-ALIO 공식 채용공고','https://job.alio.go.kr/recruit.do'],['공공기관 채용정보 API','https://www.data.go.kr/data/15125273/openapi.do']],
 company:[['OpenDART 전자공시','https://dart.fss.or.kr'],['고용24 공식 채용정보','https://www.work24.go.kr']]
};
const KNOWN={
  schlId:'학교아이디',schlKrnNm:'대학명',schulNm:'대학명',schlNm:'대학명',
  clgcpDivCd:'본·분교 구분',svyYr:'공시연도',fullTimeFacultyEnsureRate:'전임교원 확보율'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tidy=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,240);
const norm=s=>tidy(s).replace(/\(주\)|㈜|주식회사|[\s().,·-]/g,'').toLowerCase();
const isUniversity=n=>/(대학교|교육대학|대학원대학교|전문대학|과학기술원|국립대학|사립대학)$/.test(String(n||'').trim());
export function inferInstitutionType(name){
  const n=String(name||'').trim();
  if(!n)return 'unknown';
  if(isUniversity(n))return 'university';
  if(/(공단|공사|공공기관)$/.test(n))return 'public';
  return 'company';
}
function node(tag,cls,text){
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
}
function addLink(container,label,href){
  if(!/^https:\/\//.test(String(href||'')))return;
  const a=node('a','',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';
  container.append(a);
}
function firstFreeSource(root,kind){
  for(let i=1;i<=8;i++){
    const id='S'+i;
    const inputs=[...root.querySelectorAll('[data-kind="'+kind+'"][data-source="'+id+'"][data-source-key]')];
    if(inputs.length===4 && inputs.every(e=>!e.value.trim()))return id;
  }
  return '';
}
function checkedSnapshot(root,kind){
  return [...root.querySelectorAll('[data-kind="'+kind+'"][data-verified]:checked')].map(e=>e.dataset.verified);
}
function restorePreviouslyChecked(root,kind,ids){
  for(const id of ids){
    const box=root.querySelector('[data-kind="'+kind+'"][data-verified="'+id+'"]');
    if(box&&!box.checked){box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));}
  }
}
function inputAndNotify(element,value){
  element.value=value;
  element.dispatchEvent(new Event('input',{bubbles:true}));
}
export function mountInstitutionSourcePanel(root){
  const host=root.querySelector('#jf7InstitutionSources');
  if(!host)return;
  host.innerHTML='<section class="jf7OfficialPanel" aria-label="기관 유형별 공식 데이터">'+
    '<h3>공식 데이터로 기업·기관 확인하기</h3>'+
    '<p class="help">분석 대상 기관에 따라 공식자료를 선택합니다. 조회만으로 STEP 7 표가 바뀌지 않습니다.</p>'+
    '<div class="grid4 jf7OfficialFields">'+
    '<div class="field"><label for="jf7OrgType">기관 유형</label><select id="jf7OrgType" class="input"><option value="auto">자동 구분</option><option value="company">일반기업</option><option value="public">공공기관</option><option value="university">대학</option></select></div>'+
    '<div class="field"><label for="jf7SourceYear">공시연도</label><select id="jf7SourceYear" class="input"><option>2025</option><option>2024</option><option>2023</option><option>2026</option></select></div>'+
    '<div class="field" id="jf7DartField" hidden><label for="jf7CorpCode">DART 기업 고유번호 8자리</label><input class="input" id="jf7CorpCode" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" placeholder="예: 8자리" autocomplete="off"></div>'+
    '<div class="field" id="jf7IndicatorField" hidden><label for="jf7SourceIndicator">대학 조회 항목</label><select id="jf7SourceIndicator" class="input"><option value="ensure">전임교원 확보율</option><option value="research">전임교원 연구실적</option></select></div>'+
    '</div>'+
    '<p class="help" id="jf7OrgStatus" role="status"></p>'+
    '<div class="actions" id="jf7OfficialActions"></div>'+
    '<div class="actions" id="jf7OfficialLinks"></div>'+
    '<div id="jf7OfficialResults" aria-live="polite"></div>'+
    '</section>';
  const style=node('style');
  style.textContent='.jf7OfficialPanel [hidden]{display:none!important}.jf7OfficialPanel{border:1px solid #dce4f1;background:#f9fbff;border-radius:13px;padding:16px;margin:22px 0 26px;line-height:1.7}'+
    '.jf7OfficialPanel h3{margin:0 0 4px}.jf7OfficialPanel .jf7OfficialFields{margin:14px 0;align-items:end}'+
    '.jf7OfficialPanel .jf7OfficialLinks a{font-size:13px;overflow-wrap:anywhere}'+
    '.jf7OfficialPanel .jf7OfficialCard{border:1px solid #d5deeb;background:#fff;border-radius:10px;padding:12px;margin:12px 0}'+
    '.jf7OfficialPanel .jf7OfficialCard p{margin:7px 0;line-height:1.7;overflow-wrap:anywhere}'+
    '.jf7OfficialPanel label.jf7OfficialConfirm{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:9px 0}'+
    '.jf7OfficialPanel .jf7OfficialConfirm input{margin-top:5px}'+
    '@media(max-width:760px){.jf7OfficialPanel{padding:12px}.jf7OfficialPanel .jf7OfficialFields{grid-template-columns:minmax(0,1fr)!important}}';
  host.append(style);

  const query=id=>host.querySelector('#'+id);
  const org=root.querySelector('#jf7-company');
  const orgType=query('jf7OrgType'),year=query('jf7SourceYear'),corpCode=query('jf7CorpCode'),indicator=query('jf7SourceIndicator');
  const status=query('jf7OrgStatus'),actions=query('jf7OfficialActions'),links=query('jf7OfficialLinks'),results=query('jf7OfficialResults');
  let currentType='unknown',requestSerial=0;

  function announce(message){status.textContent=message;}
  function showRoutes(){
    requestSerial++;
    results.replaceChildren();
    const name=tidy(org?.value);
    currentType=orgType.value==='auto'?inferInstitutionType(name):orgType.value;
    const route=officialRouteFor(currentType);
    const hasOrg=Boolean(name);
    query('jf7DartField').hidden=currentType!=='company';
    query('jf7IndicatorField').hidden=currentType!=='university';
    actions.replaceChildren();links.replaceChildren();
    if(!hasOrg){
      announce('01 기본 정보의 분석 기업·기관명을 입력한 후 기관 유형을 확인하세요. 직무명만으로 대학알리미를 표시하지 않습니다.');
      return;
    }
    announce(currentType==='university'
      ?'대학 분석: 대학알리미를 사용합니다. 인제대학교처럼 개별 대학명을 입력하세요.'
      :currentType==='public'
        ?'공공기관 분석: JOB-ALIO 채용공고를 사용합니다. 공공기관 경영지표는 이 조회에 포함되지 않습니다.'
        :currentType==='company'
          ?'일반기업 분석: OpenDART 공시와 고용24 채용공고를 구분합니다. 비상장사는 DART 자료가 없을 수 있습니다.'
          :'기관 유형을 선택하세요.');
    for(const [label,url] of LINKS[currentType]||[])addLink(links,label,url);
    if(!route.primary)return;
    const options=currentType==='company'?[['dart','OpenDART 기업정보 조회'],['work24','고용24 채용공고 조회']]
      :[[route.primary,'공식자료 조회']];
    for(const [kind,label] of options){
      const button=node('button','btn outline',label);
      button.type='button';button.addEventListener('click',()=>lookup(kind,name,button));
      actions.append(button);
    }
    if(!instructorSessionReady()){
      const hint=node('p','help','API 자동조회는 현재 교수자 인증 기능으로만 시험 중입니다. 학생은 위 공식 원문을 직접 열어 확인할 수 있으며, 기존 입력값은 유지됩니다.');
      actions.append(hint);
    }
  }
  function candidateBox(candidate){
    const card=node('div','jf7OfficialCard');
    card.append(node('strong','',candidate.title));
    card.append(node('p','help',candidate.description));
    if(candidate.url)addLink(card,'공식 출처 열기',candidate.url);
    else card.append(node('p','help','원문 링크 미확인 · 표에 반영 불가'));
    if(candidate.status)card.append(node('p','help',candidate.status));
    if(!candidate.url)return card;
    const checkbox=node('input');checkbox.type='checkbox';
    const check=node('label','jf7OfficialConfirm');
    check.append(checkbox,document.createTextNode('원문에서 대학·기관명, 자료 시점과 수치를 확인했습니다. 분석표 반영은 제가 선택합니다.'));
    const apply=node('button','btn secondary','빈 분석표 칸에 반영');
    apply.type='button';
    apply.addEventListener('click',()=>{
      if(!checkbox.checked){announce('공식 원문을 직접 대조한 다음 확인란에 표시해 주세요.');return;}
      if(norm(org?.value)!==norm(candidate.organization)){announce('분석 대상 기관명이 바뀌었습니다. 다시 조회해 주세요.');return;}
      const target=root.querySelector('#company-'+candidate.field);
      if(!target){announce('연결할 분석표 칸을 찾지 못했습니다.');return;}
      if(target.value.trim()){announce('분석표에 이미 작성한 내용이 있어 덮어쓰지 않았습니다. 필요한 내용을 직접 수정해 주세요.');return;}
      const id=firstFreeSource(root,'company');
      if(!id){announce('출처 S1~S8이 모두 사용 중입니다. 기존 출처를 변경하지 않았습니다.');return;}
      const checked=checkedSnapshot(root,'company');
      const text='• '+candidate.description.replace(/[\r\n]+/g,' ').slice(0,490)+' ['+id+']';
      inputAndNotify(target,text);
      const map={issuer:candidate.issuer,title:candidate.title,published:candidate.published,url:candidate.url};
      for(const [key,value] of Object.entries(map)){
        const inp=root.querySelector('[data-kind="company"][data-source="'+id+'"][data-source-key="'+key+'"]');
        if(inp)inputAndNotify(inp,String(value||''));
      }
      restorePreviouslyChecked(root,'company',checked);
      announce('기존 기록을 보호하고 빈 분석표 칸에 ['+id+'] 출처와 함께 반영했습니다. 원문 대조 체크는 자동 완료하지 않았습니다.');
      apply.disabled=true;
    });
    card.append(check,apply);
    return card;
  }
  async function lookup(kind,name,button,schoolId=''){
    if(!instructorSessionReady()){
      announce('현재 API 직접 조회는 교수자 로그인 전용입니다. 공식 원문 링크에서 기관정보를 확인해 주세요.');
      return;
    }
    if(currentType==='university'&&!isUniversity(name)){
      announce('대학알리미는 개별 대학명을 선택했을 때만 조회합니다. 예: 인제대학교');
      return;
    }
    if(kind==='dart'&&!/^\d{8}$/.test(corpCode.value.trim())){
      announce('OpenDART 기업 고유번호 8자리를 입력하세요. 기업명만으로 임의의 고유번호를 선택하지 않습니다.');corpCode.focus();return;
    }
    const request=++requestSerial;
    button.disabled=true;
    results.replaceChildren();announce('공식 API에서 자료를 확인하고 있습니다.');
    try{
      let data;
      if(kind==='university')data=await getUniversityRecords({school:name,year:year.value,kind:indicator.value,schoolId});
      else if(kind==='public')data=await getPublicRecruitment();
      else if(kind==='dart')data=await getDartCompany(corpCode.value.trim());
      else if(kind==='work24')data=await getWork24Recruitment(name);
      else return;
      if(request!==requestSerial)return;
      const candidates=[];
      if(kind==='university'){
        for(const record of (data.rows||[]).slice(0,3)){
          const pairs=Object.entries(record).filter(([k,v])=>String(v??'').trim()&& !/url|link|href/i.test(k)).slice(0,10)
            .map(([k,v])=>(KNOWN[k]||k)+' '+tidy(v));
          candidates.push({organization:name,title:year.value+'년 대학알리미 '+(indicator.value==='ensure'?'전임교원 확보율':'교원 연구실적'),
            description:pairs.join(' · '),field:'other',issuer:'한국대학교육협의회',
            published:'',url:'https://www.data.go.kr/data/15158678/openapi.do',
            status:'원문 API 응답 미리보기 · 공시연도 및 단위 재확인 필요'});
        }
      }else if(kind==='dart'){
        if(norm(data.companyName)!==norm(name)){
          announce('조회된 기업명이 입력한 기관명과 다릅니다. 잘못된 기업을 반영하지 않았습니다.');return;
        }
        const financial=(data.financials||[]).map(x=>tidy(x.label)+' '+tidy(x.amount)+'원').join(' · ');
        candidates.push({organization:name,title:tidy(data.sourceTitle||'OpenDART 기업개황'),issuer:'금융감독원 전자공시시스템',
          published:tidy(data.published),url:tidy(data.url),
          field:financial?'financePerformance':'other',
          description:financial?(data.financialYear+'년 연결 재무정보: '+financial):
            ('기업명 '+tidy(data.companyName)+' · 산업코드 '+tidy(data.industryCode||'미확인')),
          status:'공시 원문과 연결·별도 재무 기준을 확인하세요.'});
      }else{
        const postings=(data.postings||[]).filter(x=>norm(x.company||x.institution)===norm(name)).slice(0,5);
        for(const p of postings){
          const url=tidy(p.sourceUrl),title=tidy(p.title),end=tidy(p.closingDate);
          candidates.push({organization:name,title,issuer:kind==='public'?'공공기관 채용정보 조회서비스':'고용24',
            published:tidy(p.registrationDate||p.openingDate),url,field:'other',
            description:'채용공고 '+title+(end?' · 접수마감 '+end:'')+
              ' · 기관 '+name,
            status:'최대 10건을 조회한 시험 결과입니다. 전체 채용공고나 현재 채용 중이라는 뜻은 아닙니다.'});
        }
        if(!candidates.length){
          announce('시험용 조회 목록에서 해당 기관의 공고를 찾지 못했습니다. 전체 채용공고가 없다는 뜻이 아닙니다. 공식 사이트를 확인하세요.');
          return;
        }
      }
      if(!candidates.length){announce('해당 조건의 공식자료가 확인되지 않았습니다. 다른 연도 또는 공식 원문을 확인하세요.');return;}
      announce(candidates.length+'건 조회 · 자료를 직접 확인한 뒤 필요한 항목만 빈칸에 반영할 수 있습니다.');
      for(const candidate of candidates)results.append(candidateBox(candidate));
    }catch(err){
      if(request!==requestSerial)return;
      if(err?.code==='school_code_ambiguous' && Array.isArray(err.data?.candidates)){
        announce('동명 대학이 여러 학교코드로 확인됩니다. 본교·분교를 확인해 선택하세요.');
        for(const c of err.data.candidates){
          if(!/^[A-Za-z0-9_-]{3,40}$/.test(String(c.schoolId||'')))continue;
          const row=node('div','jf7OfficialCard');
          row.append(node('p','',[(c.name||name),c.campus||'본·분교 구분 확인 필요',c.location||'',c.schoolId].filter(Boolean).join(' · ')));
          const select=node('button','btn outline','이 대학 선택');
          select.type='button';select.addEventListener('click',()=>lookup('university',name,button,c.schoolId));
          row.append(select);results.append(row);
        }
        return;
      }
      announce(String(err?.message||'공식자료를 조회하지 못했습니다.').slice(0,180));
    }finally{button.disabled=false}
  }
  org?.addEventListener('input',showRoutes);
  orgType.addEventListener('change',showRoutes);
  root.querySelector('#jf7LoadEarlier')?.addEventListener('click',()=>queueMicrotask(showRoutes));
  root.querySelector('#jf7Manual')?.addEventListener('click',()=>queueMicrotask(showRoutes));
  showRoutes();
}

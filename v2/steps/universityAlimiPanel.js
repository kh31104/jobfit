// JOBFIT INJE STEP 7: additive, read-only university faculty/research lookup.
// No changes to saved students' artifacts, no direct access to API credentials.
const API='https://hllnoriffbhzpyhpnvsf.supabase.co/functions/v1/univ-alimi-faculty-pilot';
const SOURCE='https://www.data.go.kr/data/15158678/openapi.do';
const LABELS={
  schlKrnNm:'학교명',schulNm:'학교명',schlNm:'학교명',
  svyYr:'공시연도',schlId:'대학 식별코드',clgcpDivCd:'본·분교 구분',
  estbDivNm:'설립구분',regionNm:'지역',
  rate:'비율',cnt:'수',fullTimeFacultyEnsureRate:'전임교원 확보율',
  fullTimeFacultyResearchCrntSt:'전임교원 연구실적'
};
function el(tag,cls,text){
  const x=document.createElement(tag);
  if(cls)x.className=cls;
  if(text!==undefined)x.textContent=String(text);
  return x;
}
function universityName(s){return /(?:대학교|교육대학|전문대학|대학원대학교|^대학)$/.test(String(s).trim())}
export function mountUniversityAlimiPanel(root){
  const host=root.querySelector('#jf7UniversityAlimi');
  if(!host)return;
  host.innerHTML='<section class="jf7UnivPanel" aria-label="대학알리미 공식자료 조회">'+
    '<h3>대학알리미 · 교원·연구 현황</h3>'+
    '<p class="help">대학·교육기관을 분석할 때만 사용하세요. 공공데이터포털의 공식 통계를 조회하되, 기존 산업·기업분석 표를 자동 변경하지 않습니다.</p>'+
    '<div class="grid4 jf7UnivControls">'+
    '<div class="field"><label for="jf7UnivSchool">대학명</label><input class="input" id="jf7UnivSchool" maxlength="48" placeholder="예: 인제대학교" autocomplete="off"></div>'+
    '<div class="field"><label for="jf7UnivYear">공시연도</label><select id="jf7UnivYear" class="input"><option>2025</option><option>2026</option><option>2024</option><option>2023</option></select></div>'+
    '<div class="field"><label for="jf7UnivIndicator">조회 지표</label><select id="jf7UnivIndicator" class="input"><option value="ensure">전임교원 확보율</option><option value="research">전임교원 연구실적</option></select></div>'+
    '<div class="field"><label>&nbsp;</label><button class="btn outline" id="jf7UnivRun" type="button">공식자료 조회</button></div></div>'+
    '<p class="help" id="jf7UnivStatus" role="status">대학명을 확인한 뒤 조회하세요. 실제 모집공고 또는 교수 채용 예정 인원을 뜻하지 않습니다.</p>'+
    '<div id="jf7UnivResults" aria-live="polite"></div>'+
    '<div class="actions"><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">공식 API 설명 · 원문</a>'+
    '<button class="btn outline" type="button" id="jf7UnivCopy" hidden>조회 결과 복사</button></div>'+
    '</section>';
  const styles=el('style');
  styles.textContent='.jf7UnivPanel{margin:18px 0 24px;padding:16px;border:1px solid #dce4f1;border-radius:12px;background:#f9fbff}'+
    '.jf7UnivPanel h3{margin:0 0 8px}.jf7UnivPanel .jf7UnivControls{align-items:end;margin-top:14px}'+
    '.jf7UnivPanel #jf7UnivRun{width:100%}.jf7UnivPanel #jf7UnivResults{margin:12px 0;overflow-x:auto}'+
    '.jf7UnivPanel .jf7UnivCard{padding:11px;margin-bottom:10px;background:white;border:1px solid #e0e7f2;border-radius:8px}'+
    '.jf7UnivPanel .jf7UnivGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px}'+
    '.jf7UnivPanel .jf7UnivGrid div{font-size:13px;overflow-wrap:anywhere}'+
    '.jf7UnivPanel .jf7UnivGrid b{margin-right:7px}'+
    '@media(max-width:760px){.jf7UnivPanel{padding:12px}.jf7UnivPanel .jf7UnivControls{grid-template-columns:minmax(0,1fr)!important}}';
  host.append(styles);
  const company=root.querySelector('#jf7-company');
  const job=root.querySelector('#jf7-job');
  const industry=root.querySelector('#jf7-industry');
  const school=host.querySelector('#jf7UnivSchool');
  const year=host.querySelector('#jf7UnivYear');
  const kind=host.querySelector('#jf7UnivIndicator');
  const button=host.querySelector('#jf7UnivRun');
  const status=host.querySelector('#jf7UnivStatus');
  const results=host.querySelector('#jf7UnivResults');
  const copy=host.querySelector('#jf7UnivCopy');
  let userEdited=false,copyText='';
  const sync=()=>{
    const target=(company?.value||'').trim();
    const nearby=[target,job?.value||'',industry?.value||''].join(' ');
    host.hidden=!/(대학|대학교|교수|교원|고등교육|교육기획|강의)/.test(nearby);
    if(!userEdited)school.value=universityName(target)?target:'';
  };
  school.addEventListener('input',()=>{userEdited=true});
  for(const field of [company,job,industry])field?.addEventListener('input',sync);
  root.querySelector('#jf7LoadEarlier')?.addEventListener('click',()=>queueMicrotask(sync));
  root.querySelector('#jf7Manual')?.addEventListener('click',()=>queueMicrotask(sync));
  sync();
  button.addEventListener('click',async()=>{
    const schoolName=school.value.trim();
    if(!universityName(schoolName)){
      status.textContent='대학 기관명으로 조회해 주세요. 예: 인제대학교. 대학일자리플러스센터 등의 부서명은 제외합니다.';
      school.focus();return;
    }
    results.replaceChildren();copy.hidden=true;copyText='';
    status.textContent='대학알리미 공공데이터를 조회하고 있습니다.';
    button.disabled=true;
    try{
      const url=new URL(API);
      url.searchParams.set('school',schoolName);
      url.searchParams.set('year',year.value);
      url.searchParams.set('kind',kind.value);
      const r=await fetch(url.toString(),{method:'GET',headers:{'Accept':'application/json'},cache:'no-store',signal:AbortSignal.timeout(14000)});
      const out=await r.json();
      if(!r.ok||!out?.ok||!Array.isArray(out.rows)){
        const messages={
          school_matching_unverified:'요청한 대학과 일치하는 자료를 확인하지 못했습니다. 대학명 또는 연도를 바꿔보세요.',
          no_data_or_schema_unverified:'해당 연도 자료가 없거나 제공 형식 확인이 필요합니다. 원문에서 확인하세요.',
          source_api_error:'제공기관 응답 오류입니다. 공식 API 승인·조회 조건을 확인하세요.',
          request_limit:'조회 요청이 많습니다. 잠시 후 다시 시도하세요.',
          university_api_secret_missing:'서버에 대학알리미 인증키가 등록되지 않았습니다.',
          source_network_or_timeout:'공식 API와 연결되지 않았습니다. 다시 시도하세요.'
        };
        status.textContent=messages[out?.error]||'공식자료 조회에 실패했습니다. 오류코드: '+String(out?.error||r.status).slice(0,70);
        return;
      }
      status.textContent='대학알리미 공식자료 '+out.rows.length+'건 조회 · '+String(out.year)+'년 · 출처 원문 대조 전';
      const maxRows=out.rows.slice(0,5);
      const parts=['대학알리미 교원·연구 현황 | '+schoolName+' | '+out.year+'년 | '+SOURCE];
      for(const item of maxRows){
        const card=el('div','jf7UnivCard');
        const grid=el('div','jf7UnivGrid');
        let n=0;
        for(const [key,value] of Object.entries(item)){
          if(!String(value||'').trim()||n++>=16)continue;
          const line=el('div');
          line.append(el('b','',LABELS[key]||key),document.createTextNode(String(value).slice(0,160)));
          grid.append(line);
          parts.push((LABELS[key]||key)+': '+String(value).slice(0,160));
        }
        card.append(grid);results.append(card);
      }
      const note=el('p','help','※ 위 값은 공식 API 응답에 포함된 원자료입니다. 수치·단위·공시연도는 대학알리미 원문에서 재확인하세요. 기업분석표에는 자동으로 반영하지 않습니다.');
      results.append(note);copyText=parts.join('\n');copy.hidden=false;
    }catch{
      status.textContent='네트워크 오류로 조회하지 못했습니다. 브라우저 또는 공식 API 상태를 확인하세요.';
    }finally{button.disabled=false}
  });
  copy.addEventListener('click',async()=>{
    if(!copyText)return;
    try{await navigator.clipboard.writeText(copyText);status.textContent='대학정보를 복사했습니다. STEP 7 표에 필요한 항목만 직접 반영하세요.'}
    catch{status.textContent='브라우저 복사 권한을 확인하세요.'}
  });
}
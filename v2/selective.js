const TOOL_KEY='jobfit:v2:selective:industry-company';
const COMPANY_TYPES=['대기업','중견기업','중소기업','스타트업','공공기관','외국계','기타'];
const HIRING_EVIDENCE=['현재 채용공고 확인','최근 채용공고 확인','공식 직무소개 확인','직무 존재만 확인','아직 미확인'];
const SOURCE_TYPES=['정부·공공기관','산업협회·전문기관','공시·통계','기업 IR·사업보고서','기업 공식 홈페이지','기타 신뢰자료'];
const DEFAULT_STATE={version:1,tool:'industry-company',targetJobs:[],interestKeywords:'',workValues:'',industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:'',updatedAt:null};

const params=new URLSearchParams(location.search);
const tool=params.get('tool')||'';
const picker=document.getElementById('toolPicker');
const root=document.getElementById('toolRoot');

if(tool==='industry-company'){
  picker.hidden=true;
  root.hidden=false;
  renderIndustryCompany();
}

function loadState(){
  try{return {...structuredClone(DEFAULT_STATE),...(JSON.parse(localStorage.getItem(TOOL_KEY)||'null')||{})}}
  catch{return structuredClone(DEFAULT_STATE)}
}
function saveState(state){state.updatedAt=new Date().toISOString();localStorage.setItem(TOOL_KEY,JSON.stringify(state));}
function esc(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function uid(prefix){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}
function today(){return new Date().toISOString().slice(0,10)}
function value(id){return document.getElementById(id)?.value?.trim()||''}
function showStatus(text,type='info'){const el=document.getElementById('selectiveStatus');if(!el)return;el.className=`callout ${type}`;el.innerHTML=esc(text);}
async function copyText(text){try{await navigator.clipboard.writeText(text);showStatus('프롬프트를 복사했습니다.','good')}catch{showStatus('복사하지 못했습니다. 프롬프트를 직접 선택해 복사해 주세요.','warn')}}

function renderIndustryCompany(){
  let state=loadState();
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">SELECTIVE TOOL · 7주차</div><h2>Industry & Company Explorer</h2><p><b>관심 직무 → 산업</b>, <b>가치관 → 기업</b>으로 연결해 나의 취업목표 조합을 만듭니다.</p></div><a class="btn outline" href="./selective.html">다른 모듈 선택</a></div>
    <div class="callout good"><b>이 모듈만 바로 사용할 수 있습니다.</b><br>이전 Jobfit STEP을 하지 않은 학생도 Target Job과 가치기준을 직접 입력해 시작할 수 있습니다.</div>

    <div class="block"><div class="stepLabel">1</div><h3>나의 탐색 기준 설정</h3>
      <p class="help">직무는 강점·경험을 활용하고 싶은 일, 관심사는 오래 살펴보고 싶은 분야, 가치관은 기업을 고를 때 포기하기 어려운 기준입니다.</p>
      <div class="grid2">
        <div class="field"><label>Target Job 1~3개</label><input class="input" id="targetJobs" value="${esc((state.targetJobs||[]).join(', '))}" placeholder="예: 마케팅, HRD, 서비스기획"></div>
        <div class="field"><label>관심 있는 분야·문제·주제</label><input class="input" id="interestKeywords" value="${esc(state.interestKeywords||'')}" placeholder="예: 교육, AI, 지역문제, 친환경"></div>
        <div class="field"><label>기업 선택에서 중요한 가치 3~5개</label><input class="input" id="workValues" value="${esc(state.workValues||'')}" placeholder="예: 성장, 워라밸, 안정성, 자율성, 좋은 리더"></div>
        <div class="field"><label>현재 기준 확인</label><div class="callout info" style="margin:0">직무는 <b>무엇을 할지</b>, 산업은 <b>어떤 시장에서 할지</b>, 기업은 <b>어떤 환경에서 할지</b>를 정하는 기준입니다.</div></div>
      </div>
      <div class="actions"><button class="btn primary" id="saveCriteria">탐색 기준 저장</button><button class="btn secondary" id="importFullJobs">기존 Jobfit Target Job 불러오기</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">2</div><h3>AI 산업탐색</h3>
      <p class="help">산업 인기순위를 받지 말고, 같은 직무가 산업별로 어떤 고객·업무·성과맥락을 갖는지 비교합니다.</p>
      <textarea id="industryPrompt" rows="14"></textarea>
      <div class="actions"><button class="btn secondary" id="copyIndustryPrompt">산업탐색 프롬프트 복사</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">3</div><h3>Industry Evidence</h3>
      <p class="help">AI 답변을 그대로 저장하지 말고, 정부·공공기관·산업협회·공시·기업 IR 등에서 확인한 근거를 기록합니다.</p>
      <div class="grid4">
        ${input('industryName','산업명','예: 반도체')}
        ${selectJob('industryJob','연결 Target Job',state.targetJobs)}
        ${select('industrySourceType','출처 유형',SOURCE_TYPES)}
        ${input('industryDate','확인일','',today())}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${input('industrySource','자료명','예: 산업통상자원부 산업동향')}
        ${input('industryUrl','출처 URL','https://...')}
        ${textarea('industryBusiness','산업 구조·고객','주요 제품·서비스, 고객, 가치사슬')}
        ${textarea('industryChange','최근 변화','기술·수요·규제·채용 변화 중 확인한 내용')}
        ${textarea('industryRole','직무 역할','이 산업에서 목표직무가 어떤 문제를 해결하고 어떤 성과에 기여하는가?')}
        ${textarea('industryDifference','다른 산업과의 차이','같은 직무가 다른 산업과 비교해 Task·Tool·KPI에서 어떻게 달라지는가?')}
      </div>
      <div class="actions"><button class="btn primary" id="addIndustry">산업 Evidence 추가</button></div>
      <div id="industryList" style="margin-top:14px"></div>
      <h4>Target Industry 최대 3개</h4><div id="industryTargets"></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">4</div><h3>AI 기업탐색</h3>
      <p class="help">선택한 산업 안에서 실제로 목표직무가 존재하는 기업을 찾고, 나의 가치관은 기업 선택 기준으로 사용합니다.</p>
      <textarea id="companyPrompt" rows="14"></textarea>
      <div class="actions"><button class="btn secondary" id="copyCompanyPrompt">기업탐색 프롬프트 복사</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">5</div><h3>Company Evidence</h3>
      <div class="grid4">
        ${input('companyName','기업명','예: ○○전자')}
        ${select('companyType','기업유형',COMPANY_TYPES)}
        <div class="field"><label>연결 Target Industry</label><select id="companyIndustry"></select></div>
        ${selectJob('companyJob','연결 Target Job',state.targetJobs)}
      </div>
      <div class="grid3" style="margin-top:12px">
        ${input('companySource','기업 공식자료','예: 사업보고서 / IR / 공식 홈페이지')}
        ${input('companyUrl','기업자료 URL','https://...')}
        ${input('companyDate','확인일','',today())}
        ${select('companyHiring','채용 근거',HIRING_EVIDENCE)}
        ${input('companyJobSource','채용·직무 자료','예: 2026 신입 채용공고')}
        ${input('companyJobUrl','채용·직무 URL','https://...')}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${textarea('companyBusiness','주요 사업·고객','무엇으로 수익을 만들고 누구에게 가치를 제공하는가?')}
        ${textarea('companyRole','직무의 사업 연결','목표직무가 어느 사업·고객·성과와 연결되는가?')}
        ${textarea('companySignals','채용 역량신호','공식 직무소개/채용공고에서 확인되는 Task·KSA·경험')}
        ${textarea('companyValueEvidence','나의 가치관과 연결되는 근거','예: 자율성→직무/조직 운영 근거, 성장→교육·직무확장 근거. 홍보문구만으로 단정하지 않기')}
        ${textarea('companyWhy','내가 더 확인하고 싶은 이유','이 기업을 다음 단계까지 탐색하고 싶은 이유')}
        ${textarea('companyUnknown','아직 모르는 것','추가 확인할 근무환경·사업·채용정보')}
      </div>
      <div class="actions"><button class="btn primary" id="addCompany">기업 Evidence 추가</button></div>
      <div id="companyList" style="margin-top:14px"></div>
      <h4>Target Company 최대 5개</h4><div id="companyTargets"></div>
    </div>

    <div class="hr"></div><div class="block"><div class="stepLabel">6</div><h3>나의 Career Target 조합</h3>
      <div id="finalMap"></div>
      <div class="field" style="margin-top:14px"><label>수업 후 메모</label><textarea id="notes" placeholder="새롭게 알게 된 점, 더 확인할 것">${esc(state.notes||'')}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveAll">결과 저장</button><button class="btn secondary" id="downloadResult">결과 JSON 다운로드</button></div>
      <div id="selectiveStatus" class="callout info">입력내용은 이 브라우저에만 저장됩니다.</div>
    </div>
  </section>`;

  bind();
  renderAll();

  function readCriteria(){
    state.targetJobs=value('targetJobs').split(',').map(x=>x.trim()).filter(Boolean).slice(0,3);
    state.interestKeywords=value('interestKeywords');state.workValues=value('workValues');saveState(state);
    refreshJobSelects();renderPrompts();renderAll();
  }
  function bind(){
    document.getElementById('saveCriteria').addEventListener('click',()=>{readCriteria();showStatus('탐색 기준을 저장했습니다.','good')});
    document.getElementById('importFullJobs').addEventListener('click',()=>{
      try{
        const full=JSON.parse(localStorage.getItem('jobfit:v2:learner')||'null'),j=full?.artifacts?.jobExplorer||{};
        const imported=(j.targets||[]).map(id=>j.candidates?.find(x=>x.id===id)?.title).filter(Boolean).slice(0,3);
        if(!imported.length){showStatus('이 브라우저에서 기존 Target Job을 찾지 못했습니다. 직접 입력해 주세요.','warn');return;}
        state.targetJobs=imported;document.getElementById('targetJobs').value=imported.join(', ');saveState(state);refreshJobSelects();renderPrompts();showStatus('기존 Jobfit Target Job을 불러왔습니다.','good');
      }catch{showStatus('기존 Jobfit 결과를 불러오지 못했습니다.','warn')}
    });
    document.getElementById('copyIndustryPrompt').addEventListener('click',()=>copyText(document.getElementById('industryPrompt').value));
    document.getElementById('copyCompanyPrompt').addEventListener('click',()=>copyText(document.getElementById('companyPrompt').value));
    document.getElementById('addIndustry').addEventListener('click',addIndustry);
    document.getElementById('addCompany').addEventListener('click',addCompany);
    document.getElementById('saveAll').addEventListener('click',()=>{state.notes=value('notes');saveState(state);renderAll();showStatus('선택형 산업·기업 탐색 결과를 저장했습니다.','good')});
    document.getElementById('downloadResult').addEventListener('click',downloadResult);
    ['targetJobs','interestKeywords','workValues'].forEach(id=>document.getElementById(id).addEventListener('change',readCriteria));
  }
  function refreshJobSelects(){['industryJob','companyJob'].forEach(id=>{const el=document.getElementById(id),old=el.value;el.innerHTML='<option value="">선택</option>'+state.targetJobs.map(j=>`<option value="${esc(j)}">${esc(j)}</option>`).join('');if(state.targetJobs.includes(old))el.value=old;});}
  function refreshIndustrySelect(){const el=document.getElementById('companyIndustry'),old=el.value;el.innerHTML='<option value="">선택</option>'+state.industries.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');if(state.industries.some(x=>x.id===old))el.value=old;}
  function renderPrompts(){document.getElementById('industryPrompt').value=buildIndustryPrompt(state);document.getElementById('companyPrompt').value=buildCompanyPrompt(state);}
  function addIndustry(){
    readCriteria();const name=value('industryName'),job=value('industryJob'),source=value('industrySource'),url=value('industryUrl');
    if(!state.targetJobs.length){showStatus('Target Job을 먼저 입력해 주세요.','warn');return}if(!name||!job||!source||!url){showStatus('산업명·연결 직무·자료명·URL을 입력해 주세요.','warn');return}
    state.industries.push({id:uid('ind'),name,job,sourceType:value('industrySourceType'),source,url,checkedAt:value('industryDate'),business:value('industryBusiness'),change:value('industryChange'),role:value('industryRole'),difference:value('industryDifference')});saveState(state);clear(['industryName','industrySource','industryUrl','industryBusiness','industryChange','industryRole','industryDifference']);renderAll();showStatus('산업 Evidence를 추가했습니다.','good');
  }
  function addCompany(){
    readCriteria();const name=value('companyName'),industryId=value('companyIndustry'),job=value('companyJob');if(!name||!industryId||!job){showStatus('기업명·산업·직무를 모두 연결해 주세요.','warn');return}
    const industry=state.industries.find(x=>x.id===industryId);if(industry?.job&&industry.job!==job){showStatus('선택한 산업 Evidence의 Target Job과 기업의 Target Job이 다릅니다.','warn');return}
    state.companies.push({id:uid('co'),name,type:value('companyType'),industryId,industry:industry?.name||'',job,source:value('companySource'),url:value('companyUrl'),checkedAt:value('companyDate'),hiringEvidence:value('companyHiring'),jobSource:value('companyJobSource'),jobUrl:value('companyJobUrl'),business:value('companyBusiness'),role:value('companyRole'),signals:value('companySignals'),valueEvidence:value('companyValueEvidence'),why:value('companyWhy'),unknown:value('companyUnknown')});saveState(state);clear(['companyName','companySource','companyUrl','companyJobSource','companyJobUrl','companyBusiness','companyRole','companySignals','companyValueEvidence','companyWhy','companyUnknown']);renderAll();showStatus('기업 Evidence를 추가했습니다.','good');
  }
  function renderAll(){refreshJobSelects();refreshIndustrySelect();renderPrompts();renderIndustries();renderIndustryTargets();renderCompanies();renderCompanyTargets();renderFinalMap();}
  function renderIndustries(){const box=document.getElementById('industryList');box.innerHTML=state.industries.length?state.industries.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">산업 ${i+1}</span><h3>${esc(x.name)}</h3><div class="muted small">${esc(x.job)} · ${esc(x.sourceType||'출처유형 미입력')}</div></div><button class="btn danger smallBtn" data-del-ind="${x.id}">삭제</button></div><div class="grid2"><div><b>산업 구조·고객</b><p>${esc(x.business||'—')}</p></div><div><b>최근 변화</b><p>${esc(x.change||'—')}</p></div><div><b>직무 역할</b><p>${esc(x.role||'—')}</p></div><div><b>산업별 차이</b><p>${esc(x.difference||'—')}</p></div></div><div class="sourceLine"><b>근거</b> ${esc(x.source)} · <a href="${esc(x.url)}" target="_blank" rel="noopener">원문 열기 ↗</a></div></div>`).join(''):'<div class="placeholder"><b>아직 산업 Evidence가 없습니다.</b>AI로 후보를 넓힌 뒤 공식자료로 확인한 산업만 추가하세요.</div>';box.querySelectorAll('[data-del-ind]').forEach(b=>b.addEventListener('click',()=>{state.industries=state.industries.filter(x=>x.id!==b.dataset.delInd);state.targetIndustries=state.targetIndustries.filter(id=>id!==b.dataset.delInd);state.companies=state.companies.filter(x=>x.industryId!==b.dataset.delInd);state.targetCompanies=state.targetCompanies.filter(id=>state.companies.some(x=>x.id===id));saveState(state);renderAll()}));}
  function renderIndustryTargets(){const box=document.getElementById('industryTargets');box.innerHTML=state.industries.length?state.industries.map(x=>`<label class="checkRow"><input type="checkbox" data-target-ind="${x.id}" ${state.targetIndustries.includes(x.id)?'checked':''}><div><b>${esc(x.name)}</b><span>${esc(x.job)} · ${esc(x.role||'직무 역할 추가 확인')}</span></div></label>`).join(''):'<div class="callout warn">산업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-target-ind]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-target-ind]:checked')].map(x=>x.dataset.targetInd);if(ids.length>3){c.checked=false;showStatus('Target Industry는 최대 3개입니다.','warn');return}state.targetIndustries=ids;saveState(state);renderPrompts();renderFinalMap()}));}
  function renderCompanies(){const box=document.getElementById('companyList');box.innerHTML=state.companies.length?state.companies.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">기업 ${i+1}</span><h3>${esc(x.name)}</h3><div class="muted small">${esc([x.type,x.industry,x.job].filter(Boolean).join(' · '))}</div></div><button class="btn danger smallBtn" data-del-co="${x.id}">삭제</button></div><div class="grid2"><div><b>사업·고객</b><p>${esc(x.business||'—')}</p></div><div><b>직무 연결</b><p>${esc(x.role||'—')}</p></div><div><b>채용 역량신호</b><p>${esc(x.signals||'—')}</p></div><div><b>가치관 연결 근거</b><p>${esc(x.valueEvidence||'—')}</p></div></div><div class="sourceLine"><b>기업근거</b> ${esc(x.source||'미입력')} ${x.url?`· <a href="${esc(x.url)}" target="_blank" rel="noopener">열기</a>`:''}<br><b>채용근거</b> ${esc(x.hiringEvidence||'미확인')} ${x.jobUrl?`· <a href="${esc(x.jobUrl)}" target="_blank" rel="noopener">열기</a>`:''}</div></div>`).join(''):'<div class="placeholder"><b>아직 기업 Evidence가 없습니다.</b>선택한 산업 안에서 목표직무가 실제로 존재하는 기업을 공식자료로 확인하세요.</div>';box.querySelectorAll('[data-del-co]').forEach(b=>b.addEventListener('click',()=>{state.companies=state.companies.filter(x=>x.id!==b.dataset.delCo);state.targetCompanies=state.targetCompanies.filter(id=>id!==b.dataset.delCo);saveState(state);renderAll()}));}
  function renderCompanyTargets(){const box=document.getElementById('companyTargets');box.innerHTML=state.companies.length?state.companies.map(x=>`<label class="checkRow"><input type="checkbox" data-target-co="${x.id}" ${state.targetCompanies.includes(x.id)?'checked':''}><div><b>${esc(x.name)}</b><span>${esc([x.industry,x.job,x.hiringEvidence].filter(Boolean).join(' · '))}</span></div></label>`).join(''):'<div class="callout warn">기업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-target-co]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-target-co]:checked')].map(x=>x.dataset.targetCo);if(ids.length>5){c.checked=false;showStatus('Target Company는 최대 5개입니다.','warn');return}state.targetCompanies=ids;saveState(state);renderFinalMap()}));}
  function renderFinalMap(){const box=document.getElementById('finalMap'),inds=state.targetIndustries.map(id=>state.industries.find(x=>x.id===id)).filter(Boolean),cos=state.targetCompanies.map(id=>state.companies.find(x=>x.id===id)).filter(Boolean);if(!state.targetJobs.length&&!inds.length&&!cos.length){box.innerHTML='<div class="placeholder"><b>아직 Career Target 조합이 없습니다.</b>직무 → 산업 → 기업 순서로 근거를 확인해 선택하세요.</div>';return}box.innerHTML=`<div class="grid3"><div class="callout info"><b>직무 · 무엇을 할지</b><br>${state.targetJobs.map(esc).join('<br>')||'미정'}</div><div class="callout info"><b>산업 · 어떤 시장에서 할지</b><br>${inds.map(x=>esc(x.name)).join('<br>')||'미정'}</div><div class="callout info"><b>기업 · 어떤 환경에서 할지</b><br>${cos.map(x=>esc(x.name)).join('<br>')||'미정'}</div></div><div class="callout good" style="margin-top:12px"><b>Career Roadmap 연결</b><br>강점·경험역량 → 직무 / 관심사 → 산업 / 가치관 → 기업. 아직 선택되지 않은 부분은 ‘미정’으로 남겨도 됩니다.</div>`;}
  function downloadResult(){state.notes=value('notes');saveState(state);const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`jobfit-selective-industry-company-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);showStatus('결과 JSON을 저장했습니다.','good')}
}

function buildIndustryPrompt(s){return `너는 대학생의 산업탐색을 돕는 리서처다.\n\n[내 탐색 기준]\nTarget Job: ${(s.targetJobs||[]).join(', ')||'미정'}\n관심 분야·문제: ${s.interestKeywords||'미정'}\n\n목표는 산업 인기순위를 만드는 것이 아니라, 내가 관심 있는 분야와 목표직무가 만날 수 있는 산업을 넓게 탐색한 뒤 근거로 비교하는 것이다.\n\n규칙:\n1. 서로 성격이 다른 산업 6~10개를 제시한다.\n2. 각 산업의 제품·서비스, 주요 고객, 가치사슬을 간단히 설명한다.\n3. 목표직무가 그 산업에서 해결하는 문제와 기여하는 성과를 설명한다.\n4. 같은 직무가 산업별로 Task·Tool·KPI·고객맥락에서 어떻게 달라지는지 비교한다.\n5. 내 관심 분야와 연결되는 이유는 가설로 표시하고 단정하지 않는다.\n6. 성장성·취업가능성을 출처 없이 평가하지 않는다.\n7. 검증에 쓸 정부·공공기관·산업협회·공시·기업 IR 자료를 제안한다.\n8. 마지막에는 내가 2~3개 산업을 직접 고를 수 있도록 비교질문을 제시한다.\n\n표 형식: 산업 / 주요 제품·서비스 / 고객 / 목표직무 역할 / Task·Tool·KPI 특징 / 관심사 연결 가설 / 확인할 공식자료`}
function buildCompanyPrompt(s){const inds=(s.targetIndustries||[]).map(id=>s.industries.find(x=>x.id===id)?.name).filter(Boolean);return `너는 대학생의 기업탐색을 돕는 취업 리서처다.\n\n[내 탐색 기준]\nTarget Job: ${(s.targetJobs||[]).join(', ')||'미정'}\nTarget Industry: ${inds.join(', ')||'미정'}\n기업 선택에서 중요한 가치: ${s.workValues||'미정'}\n\n목표는 좋은 회사를 대신 골라주는 것이 아니라, 목표직무가 실제로 존재하는 기업을 찾고 나의 가치관과 관련된 조직·근무조건을 공식근거로 확인하는 것이다.\n\n규칙:\n1. 선택 산업별로 목표직무가 존재할 가능성이 있는 기업 후보를 넓게 제시하되, 반드시 확인이 필요한 가설로 표시한다.\n2. 기업 공식 홈페이지·사업보고서·IR과 채용공고/직무소개를 구분한다.\n3. 주요 사업·제품·고객과 목표직무의 사업기여 지점을 설명한다.\n4. 실제 채용공고/직무소개에서 확인되는 Task·KSA·Tool·Experience를 따로 정리한다.\n5. 내 가치관과의 연결은 복지 홍보문구만으로 단정하지 말고 확인할 근거와 질문을 제시한다.\n6. 출처 없이 '잘 맞는다', '좋은 회사다', '취업 가능성이 높다'고 평가하지 않는다.\n7. 최신 정보는 검색·공식자료 확인이 필요하다고 표시한다.\n8. 마지막에는 기업 비교 체크리스트를 만들어 내가 직접 3~5개를 고르게 한다.\n\n표 형식: 기업 / 산업 / 주요 사업·고객 / 목표직무 존재 근거 / 채용 역량신호 / 가치관 확인포인트 / 공식자료·채용자료`}
function input(id,label,placeholder='',val=''){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${esc(val)}" placeholder="${esc(placeholder)}"></div>`}
function textarea(id,label,placeholder=''){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${esc(placeholder)}"></textarea></div>`}
function select(id,label,options){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${options.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div>`}
function selectJob(id,label,jobs){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${(jobs||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div>`}
function clear(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}

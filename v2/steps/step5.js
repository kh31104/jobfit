export async function render(ctx){
  const s=ctx.getState();
  const jobs=getTargetJobs(s);
  const saved=s.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''};
  const root=document.getElementById('stepRoot');
  let data=structuredClone(saved);

  root.innerHTML=`
  <section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 5</div><h2>Industry & Company Explorer</h2><p>같은 직무라도 산업과 기업이 달라지면 고객·업무맥락·요구역량이 달라집니다. 직무를 산업과 기업 안에서 다시 봅니다.</p></div><span class="badge">7주차</span></div>
    <div class="progress"><span style="width:43%"></span></div>

    <div class="block"><h3>1. 직무 기준점</h3><p class="help">이번 탐색은 ‘유명한 기업 찾기’가 아니라 내가 탐색한 직무가 어떤 산업·기업에서 어떻게 쓰이는지 확인하는 과정입니다.</p>
      <div class="pillRow">${jobs.length?jobs.map((j,i)=>`<span class="pill">${i+1}. ${esc(j.title,ctx)}</span>`).join(''):'<span class="pill">STEP 3에서 Target Job을 먼저 선택하세요.</span>'}</div>
    </div>

    <div class="hr"></div>
    <div class="block"><h3>2. AI 산업탐색 프롬프트</h3><textarea id="industryPrompt" rows="12">${esc(buildIndustryPrompt(s),ctx)}</textarea><div class="actions"><button class="btn secondary" id="copyIndustryPrompt">산업탐색 프롬프트 복사</button></div></div>

    <div class="hr"></div>
    <div class="block"><h3>3. Industry Pool</h3><p class="help">산업 후보를 넓게 탐색하되 시장규모 숫자를 억지로 채우지 않습니다. 내가 확인한 공식·신뢰가능 자료만 기록하세요.</p>
      <div class="grid3">
        ${txt('industryName','산업명','','예: 반도체, 금융, 바이오')}
        ${txt('industrySource','확인 출처','','예: 산업협회, 정부자료, 기업 IR')}
        ${txt('industryUrl','출처 URL','','https://...')}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${area('industryWhy','탐색 이유','','왜 이 산업을 더 보고 싶은가?')}
        ${area('industryBusiness','산업 구조·고객','','무엇을 만들거나 제공하며 주요 고객은 누구인가?')}
        ${area('industryChange','최근 변화·이슈','','내가 확인한 변화, 기술, 규제, 채용변화')}
        ${area('industryJobLink','내 직무와의 연결','','이 산업에서 Target Job의 역할은 어떻게 달라지는가?')}
      </div>
      <div class="actions"><button class="btn primary" id="addIndustry">산업 후보 추가</button></div>
      <div id="industryList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div>
    <div class="block"><h3>4. Target Industry 최대 3개</h3><div id="industryTargets"></div></div>

    <div class="hr"></div>
    <div class="block"><h3>5. Company Pool</h3><p class="help">기업명만 모으지 말고 사업·고객·경쟁력·직무연결을 함께 기록합니다.</p>
      <div class="grid3">
        ${txt('companyName','기업명','','예: ○○전자')}
        ${sel('companyType','기업유형','',['대기업','중견기업','중소기업','스타트업','공공기관','외국계','기타'])}
        ${txt('companyIndustry','산업','','예: 반도체')}
        ${txt('companySource','확인 출처','','예: 기업 홈페이지 / 사업보고서')}
        ${txt('companyUrl','출처 URL','','https://...')}
        ${txt('companyJob','연결 직무','','예: 공정기술')}
      </div>
      <div class="grid2" style="margin-top:12px">
        ${area('companyBusiness','주요 사업·고객','','기업이 무엇으로 돈을 벌고 누구에게 가치를 제공하는가?')}
        ${area('companyStrength','경쟁력·최근 방향','','공식자료에서 확인한 핵심 경쟁력 또는 최근 추진방향')}
        ${area('companyRole','직무 연결','','이 기업에서 목표직무가 어떤 사업·성과와 연결되는가?')}
        ${area('companyWhy','나의 관심 근거','','왜 이 기업을 더 확인하고 싶은가?')}
      </div>
      <div class="actions"><button class="btn primary" id="addCompany">기업 후보 추가</button><button class="btn secondary" id="copyCompanyPrompt">기업분석 프롬프트 복사</button></div>
      <div id="companyList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div>
    <div class="block"><h3>6. Target Company 최대 5개</h3><div id="companyTargets"></div>
      <div class="field" style="margin-top:12px"><label>탐색 메모</label><textarea id="notes" placeholder="산업과 기업을 비교하면서 새롭게 알게 된 점">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveAll">산업·기업 탐색 저장</button><button class="btn secondary" id="nextStep">STEP 6 Career Fit Map →</button></div><div class="status" id="status"></div>
    </div>
  </section>`;

  renderIndustries();renderIndustryTargets();renderCompanies();renderCompanyTargets();
  document.getElementById('copyIndustryPrompt').addEventListener('click',()=>copy(document.getElementById('industryPrompt').value,ctx));
  document.getElementById('copyCompanyPrompt').addEventListener('click',()=>copy(buildCompanyPrompt(ctx.getState(),data),ctx));
  document.getElementById('addIndustry').addEventListener('click',addIndustry);
  document.getElementById('addCompany').addEventListener('click',addCompany);
  document.getElementById('saveAll').addEventListener('click',saveAll);
  document.getElementById('nextStep').addEventListener('click',()=>{saveAll();ctx.navigate(6)});

  function addIndustry(){
    const name=v('industryName');if(!name){status('산업명을 입력하세요.');return;}
    data.industries.push({id:`ind_${Date.now()}`,name,source:v('industrySource'),url:v('industryUrl'),why:v('industryWhy'),business:v('industryBusiness'),change:v('industryChange'),jobLink:v('industryJobLink')});
    ['industryName','industrySource','industryUrl','industryWhy','industryBusiness','industryChange','industryJobLink'].forEach(id=>document.getElementById(id).value='');persist();renderIndustries();renderIndustryTargets();status('산업 후보를 추가했습니다.');
  }
  function addCompany(){
    const name=v('companyName');if(!name){status('기업명을 입력하세요.');return;}
    data.companies.push({id:`co_${Date.now()}`,name,type:v('companyType'),industry:v('companyIndustry'),source:v('companySource'),url:v('companyUrl'),job:v('companyJob'),business:v('companyBusiness'),strength:v('companyStrength'),role:v('companyRole'),why:v('companyWhy')});
    ['companyName','companyIndustry','companySource','companyUrl','companyJob','companyBusiness','companyStrength','companyRole','companyWhy'].forEach(id=>document.getElementById(id).value='');document.getElementById('companyType').value='';persist();renderCompanies();renderCompanyTargets();status('기업 후보를 추가했습니다.');
  }
  function renderIndustries(){
    const box=document.getElementById('industryList');if(!data.industries.length){box.innerHTML='<div class="placeholder"><b>Industry Pool이 비어 있습니다.</b>직무가 활용되는 여러 산업을 비교해 보세요.</div>';return;}
    box.innerHTML=data.industries.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">산업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3></div><button class="btn danger smallBtn" data-delind="${x.id}">삭제</button></div><div class="grid2"><div><b>산업 구조·고객</b><p>${esc(x.business||'—',ctx)}</p></div><div><b>최근 변화</b><p>${esc(x.change||'—',ctx)}</p></div><div><b>직무 연결</b><p>${esc(x.jobLink||'—',ctx)}</p></div><div><b>탐색 이유</b><p>${esc(x.why||'—',ctx)}</p></div></div><div class="sourceLine"><b>출처</b> ${esc(x.source||'미입력',ctx)} ${x.url?`· <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div></div>`).join('');
    box.querySelectorAll('[data-delind]').forEach(b=>b.addEventListener('click',()=>{data.industries=data.industries.filter(x=>x.id!==b.dataset.delind);data.targetIndustries=data.targetIndustries.filter(id=>id!==b.dataset.delind);persist();renderIndustries();renderIndustryTargets();}));
  }
  function renderIndustryTargets(){
    const box=document.getElementById('industryTargets');box.innerHTML=data.industries.length?data.industries.map(x=>`<label class="checkRow"><input type="checkbox" data-itarget="${x.id}" ${data.targetIndustries.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc(x.jobLink||'',ctx)}</span></div></label>`).join(''):'<div class="callout warn">산업 후보를 먼저 추가하세요.</div>';
    box.querySelectorAll('[data-itarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-itarget]:checked')].map(x=>x.dataset.itarget);if(ids.length>3){c.checked=false;ctx.toast('Target Industry는 최대 3개입니다.');}}));
  }
  function renderCompanies(){
    const box=document.getElementById('companyList');if(!data.companies.length){box.innerHTML='<div class="placeholder"><b>Company Pool이 비어 있습니다.</b>기업 유형을 섞어 비교하면 선택 기준이 더 선명해집니다.</div>';return;}
    box.innerHTML=data.companies.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">기업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc([x.type,x.industry,x.job].filter(Boolean).join(' · '),ctx)}</div></div><button class="btn danger smallBtn" data-delco="${x.id}">삭제</button></div><div class="grid2"><div><b>사업·고객</b><p>${esc(x.business||'—',ctx)}</p></div><div><b>경쟁력·방향</b><p>${esc(x.strength||'—',ctx)}</p></div><div><b>직무 연결</b><p>${esc(x.role||'—',ctx)}</p></div><div><b>관심 근거</b><p>${esc(x.why||'—',ctx)}</p></div></div><div class="sourceLine"><b>출처</b> ${esc(x.source||'미입력',ctx)} ${x.url?`· <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div></div>`).join('');
    box.querySelectorAll('[data-delco]').forEach(b=>b.addEventListener('click',()=>{data.companies=data.companies.filter(x=>x.id!==b.dataset.delco);data.targetCompanies=data.targetCompanies.filter(id=>id!==b.dataset.delco);persist();renderCompanies();renderCompanyTargets();}));
  }
  function renderCompanyTargets(){
    const box=document.getElementById('companyTargets');box.innerHTML=data.companies.length?data.companies.map(x=>`<label class="checkRow"><input type="checkbox" data-ctarget="${x.id}" ${data.targetCompanies.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc([x.type,x.industry,x.job].filter(Boolean).join(' · '),ctx)}</span></div></label>`).join(''):'<div class="callout warn">기업 후보를 먼저 추가하세요.</div>';
    box.querySelectorAll('[data-ctarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-ctarget]:checked')].map(x=>x.dataset.ctarget);if(ids.length>5){c.checked=false;ctx.toast('Target Company는 최대 5개입니다.');}}));
  }
  function saveAll(){
    data.targetIndustries=[...document.querySelectorAll('[data-itarget]:checked')].map(x=>x.dataset.itarget);data.targetCompanies=[...document.querySelectorAll('[data-ctarget]:checked')].map(x=>x.dataset.ctarget);data.notes=v('notes');persist();status('산업·기업 탐색 결과를 저장했습니다.');
  }
  function persist(){ctx.saveState({artifacts:{industryCompany:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function getTargetJobs(s){const e=s.artifacts?.jobExplorer||{};return (e.targets||[]).map(id=>e.candidates?.find(x=>x.id===id)).filter(Boolean)}
function buildIndustryPrompt(s){const jobs=getTargetJobs(s).map(x=>x.title);return `너는 대학생의 산업탐색을 돕는 리서처다. 내가 탐색 중인 직무는 ${jobs.join(', ')||'아직 미정'}이다.\n\n이 직무가 실제로 채용되는 산업을 6~10개 정도 넓게 제시해줘.\n\n규칙:\n1. 산업명만 나열하지 말고 그 산업의 주요 제품·서비스, 고객, 가치사슬에서 이 직무가 맡는 역할을 설명한다.\n2. 같은 직무가 산업에 따라 어떻게 달라지는지 비교한다.\n3. 최신 동향이나 숫자를 말할 때는 반드시 확인 가능한 출처가 필요하다고 표시한다.\n4. 기업 추천부터 하지 말고 산업 구조를 먼저 이해하게 돕는다.\n5. 성장성이나 전망을 근거 없이 단정하지 않는다.\n6. 내가 다음으로 확인해야 할 정부·산업협회·기업 IR·공식자료의 종류를 제안한다.\n7. 마지막에는 내 직무 기준으로 서로 성격이 다른 산업 후보 3~5개를 비교질문 형태로 제시한다.`}
function buildCompanyPrompt(s,data){const inds=(data.targetIndustries||[]).map(id=>data.industries.find(x=>x.id===id)?.name).filter(Boolean);const jobs=getTargetJobs(s).map(x=>x.title);return `너는 취업용 기업분석 코치다.\n목표직무: ${jobs.join(', ')||'미정'}\n관심산업: ${inds.join(', ')||'미정'}\n\n내가 입력할 기업의 공식자료를 바탕으로만 다음을 분석해줘. 자료에 없으면 '자료에서 확인되지 않음'이라고 표시해줘.\n1. 주요 사업과 고객\n2. 현재 중요하게 추진하는 사업·방향\n3. 목표직무가 사업성과에 기여하는 지점\n4. 직무와 직접 관련된 최근 이슈\n5. 기업 핵심가치·인재상 중 직무관련성이 높은 요소\n6. 내가 추가로 확인해야 할 공식자료\n\n기업의 광고문구를 그대로 반복하지 말고 실제 사업과 직무의 연결을 중심으로 설명해줘.`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

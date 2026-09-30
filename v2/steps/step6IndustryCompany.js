const INDUSTRY_SOURCE_TYPES=['정부·공공기관','산업협회·전문기관','공시·통계','기업 IR·사업보고서','기타 신뢰자료'];
const COMPANY_TYPES=['대기업','중견기업','중소기업','스타트업','공공기관','외국계','기타'];
const HIRING_EVIDENCE=['현재 채용공고 확인','최근 채용공고 확인','공식 직무소개 확인','직무 존재만 확인','아직 미확인'];

export async function render(ctx){
  const s=ctx.getState(),jobs=getTargetJobs(s),saved=s.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''};
  const root=document.getElementById('stepRoot');let data=structuredClone(saved);
  data.industries=data.industries||[];data.companies=data.companies||[];data.targetIndustries=data.targetIndustries||[];data.targetCompanies=data.targetCompanies||[];

  const defaultAccordion=(data.targetCompanies||[]).length?5:(data.targetIndustries||[]).length?4:1;
  root.innerHTML=`<section class="card industryCompanyInje" data-accordion-default="${defaultAccordion}">
    <div class="sectionHead"><div><div class="kicker">STEP 7 · INDUSTRY & COMPANY ANALYSIS</div><h2>내가 지원할 산업과 기업 이해하기</h2><p>STEP 5에서 확인한 Target Job을 기준으로 <b>산업 → 기업 → 직무</b>의 연결을 확인하고, 실제 지원 준비할 기업을 구체화합니다.</p></div><span class="badge">산업·기업분석</span></div>
    <div class="progress"><span style="width:58%"></span></div>
    <div class="callout info"><b>점수로 ‘잘 맞는 기업’을 판정하지 않습니다.</b><br>실제 산업자료·기업자료·채용근거를 확인하고, 학생이 직접 더 준비할 산업과 기업을 선택합니다.</div>

    <div class="block"><h3>01. My Target 확인</h3><p class="help">새 직무를 고르지 않습니다. STEP 5에서 분석한 직무와 JD를 기준점으로 사용합니다.</p>
      <div class="targetSummary">${targetSummaryHtml(s,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>02. Industry Scan · 산업 이해하기</h3><p class="help">이 산업이 무엇으로 돈을 벌고, 누가 고객이며, 최근 무엇이 바뀌는지 확인합니다.</p>
      <textarea id="industryPrompt" rows="14">${esc(buildIndustryPrompt(s),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="copyIndustryPrompt">산업분석 프롬프트 복사</button></div>
      <div class="grid4" style="margin-top:14px">${txt('industryName','산업명',primaryTargetIndustry(s),'예: 뷰티·소비재')}${selectJob('industryJobId','연결 Target Job',jobs)}${sel('industrySourceType','출처 유형','',INDUSTRY_SOURCE_TYPES)}${txt('industryChecked','확인일','',today())}</div>
      <div class="grid2" style="margin-top:12px">${txt('industrySource','확인 자료','','예: 산업동향 보고서 / 협회 자료')}${txt('industryUrl','원문 URL','','https://...')}${area('industryBusiness','산업 구조·주요 고객','','무엇을 팔고 누구에게 가치를 제공하는가? 주요 기업도 함께 기록하세요.')}${area('industryChange','최근 변화','','최근 기술·고객·시장·규제 변화 중 내 직무와 관련된 것')}${area('industryJobLink','내 직무에 미치는 영향','','이 산업에서 Target Job이 어떤 업무를 하고 어떤 역량이 중요해지는가?')}${area('industryDifference','다른 산업과의 차이 · 선택','','같은 직무라도 이 산업에서 달라지는 Task·Tool·KPI')}</div>
      <div class="actions"><button class="btn primary" id="addIndustry">산업분석 저장</button></div><div id="industryList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>03. Industry × Job</h3><p class="help">관심 산업은 최대 3개까지 선택합니다. 같은 직무가 산업마다 어떻게 달라지는지 비교합니다.</p>
      <div id="industryTargets"></div><div id="industryCompare" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>04. Find Company · 기업 후보 찾기</h3><p class="help">선택한 산업에서 Target Job이 실제로 존재하는 기업을 찾습니다. 최대 3개만 남깁니다.</p>
      <textarea id="companyPrompt" rows="14">${esc(buildCompanyPrompt(s,data),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="copyCompanyPrompt">기업분석 프롬프트 복사</button></div>
      <div class="callout info" style="margin-top:12px"><b>기업명만 찾지 마세요.</b><br>기업 공식자료와 실제 채용공고·직무소개 URL을 함께 확인한 기업만 후보로 기록합니다.</div>
    </div>

    <div class="hr"></div><div class="block"><h3>05. Company Analysis · 기업을 취업 관점에서 분석하기</h3><p class="help">Business · Customer · Strategy · Job Link · Hiring Signal 다섯 가지를 확인합니다.</p>
      <div class="grid4">${txt('companyName','기업명','','예: 관심 기업')}${sel('companyType','기업유형','',COMPANY_TYPES)}${selectIndustry('companyIndustryId','연결 산업',data.industries)}${selectJob('companyJobId','연결 Target Job',jobs)}</div>
      <div class="grid3" style="margin-top:12px">${txt('companySource','기업 공식자료','','예: 사업보고서 / IR / 공식 홈페이지')}${txt('companyUrl','기업자료 URL','','https://...')}${txt('companyChecked','확인일','',today())}${sel('companyHiringEvidence','채용 근거','',HIRING_EVIDENCE)}${txt('companyJobSource','채용·직무 자료','','예: 신입 채용공고 / 공식 직무소개')}${txt('companyJobUrl','채용·직무 URL','','https://...')}</div>
      <div class="grid2" style="margin-top:12px">${area('companyBusiness','Business · Customer','','주요 사업·제품·서비스와 핵심 고객')}${area('companyDirection','Strategy','','최근 공식적으로 확인되는 사업·시장·제품 방향')}${area('companyRole','Job Link','','Target Job이 이 기업의 어떤 사업·고객·성과와 연결되는가?')}${area('companySignals','Hiring Signal','','채용공고·직무소개에서 반복되는 역량·경험·Tool')}${area('companyWhy','내가 관심을 두는 이유 · 선택','','왜 이 기업을 더 탐색하려 하는가?')}${area('companyUnknown','확인 필요','','아직 확인하지 못한 사업·직무·근무조건·채용정보')}</div>
      <div class="actions"><button class="btn primary" id="addCompany">기업분석 저장</button></div><div id="companyList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>06. My Target Company · 현재 더 준비할 기업 선택</h3><p class="help">점수순이 아닙니다. 직무 존재, 실제 업무, 내가 가진 Evidence, 핵심 GAP, 정보근거를 읽고 최대 3개를 선택합니다.</p>
      <div id="companyTargets"></div><div id="companyCompare" style="margin-top:14px"></div><div id="companyGuard" style="margin-top:12px"></div>
      <div class="field" style="margin-top:12px"><label>산업·기업분석 메모</label><textarea id="notes" placeholder="내 직무가 이 산업·기업에서 어떻게 달라지는지, 추가 확인할 것은 무엇인지 적어보세요.">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveAll">STEP 7 저장</button><button class="btn secondary" id="nextStep">STEP 8 Resume Lab →</button></div><div class="status" id="status"></div>
    </div>
  </section>`;

  renderAll();
  if(jobs[0]?.id){const ij=document.getElementById('industryJobId'),cj=document.getElementById('companyJobId');if(ij&&!ij.value)ij.value=jobs[0].id;if(cj&&!cj.value)cj.value=jobs[0].id}
  document.getElementById('copyIndustryPrompt').addEventListener('click',()=>copy(document.getElementById('industryPrompt').value,ctx));
  document.getElementById('copyCompanyPrompt').addEventListener('click',()=>copy(document.getElementById('companyPrompt').value,ctx));
  document.getElementById('addIndustry').addEventListener('click',addIndustry);document.getElementById('addCompany').addEventListener('click',addCompany);
  document.getElementById('saveAll').addEventListener('click',saveAll);document.getElementById('nextStep').addEventListener('click',()=>{saveAll();ctx.navigate(7)});

  function addIndustry(){const name=v('industryName'),jobId=v('industryJobId'),source=v('industrySource'),url=v('industryUrl');if(!name||!jobId||!source||!url){status('산업명·연결직무·자료명·URL을 입력하세요.');return;}data.industries.push({id:`ind_${Date.now()}`,name,jobId,sourceType:v('industrySourceType'),source,url,checkedAt:v('industryChecked'),business:v('industryBusiness'),change:v('industryChange'),jobLink:v('industryJobLink'),difference:v('industryDifference'),createdAt:new Date().toISOString()});clear(['industryName','industrySource','industryUrl','industryBusiness','industryChange','industryJobLink','industryDifference']);persist();renderAll();status('산업 Evidence를 추가했습니다.');}
  function addCompany(){const name=v('companyName'),industryId=v('companyIndustryId'),jobId=v('companyJobId');if(data.companies.length>=3){status('기업 후보는 최대 3개까지 분석할 수 있습니다. 기존 기업을 삭제한 뒤 추가하세요.');return;}if(!name||!industryId||!jobId){status('기업명·산업·직무 연결을 모두 선택하세요.');return;}const industry=data.industries.find(x=>x.id===industryId);if(industry?.jobId&&industry.jobId!==jobId){status('선택한 산업 Evidence와 연결된 Target Job이 다릅니다. 조합을 다시 확인하세요.');return;}data.companies.push({id:`co_${Date.now()}`,name,type:v('companyType'),industryId,jobId,industry:industry?.name||'',job:jobs.find(x=>x.id===jobId)?.title||'',source:v('companySource'),url:v('companyUrl'),checkedAt:v('companyChecked'),hiringEvidence:v('companyHiringEvidence'),jobSource:v('companyJobSource'),jobUrl:v('companyJobUrl'),business:v('companyBusiness'),direction:v('companyDirection'),role:v('companyRole'),signals:v('companySignals'),why:v('companyWhy'),unknown:v('companyUnknown'),createdAt:new Date().toISOString()});clear(['companyName','companySource','companyUrl','companyJobSource','companyJobUrl','companyBusiness','companyDirection','companyRole','companySignals','companyWhy','companyUnknown']);persist();renderAll();status('기업 Evidence를 추가했습니다.');}
  function renderAll(){refreshCompanyIndustrySelect();renderIndustries();renderIndustryTargets();renderIndustryCompare();renderCompanies();renderCompanyTargets();renderCompanyCompare();renderCompanyGuard();}
  function refreshCompanyIndustrySelect(){const el=document.getElementById('companyIndustryId');if(!el)return;const current=el.value;el.innerHTML='<option value="">선택</option>'+data.industries.map(x=>`<option value="${esc(x.id,ctx)}">${esc(x.name,ctx)}</option>`).join('');if(data.industries.some(x=>x.id===current))el.value=current;}
  function renderIndustries(){const box=document.getElementById('industryList');if(!data.industries.length){box.innerHTML='<div class="placeholder"><b>Industry Evidence가 없습니다.</b>Target Job이 실제로 활용되는 산업을 근거자료와 함께 추가하세요.</div>';return;}box.innerHTML=data.industries.map((x,i)=>{const job=jobs.find(j=>j.id===x.jobId);return `<div class="listCard"><div class="listHead"><div><span class="rankTag">산업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc(job?.title||'직무 미연결',ctx)} · ${esc(x.sourceType||'출처유형 미입력',ctx)} · 확인 ${esc(x.checkedAt||'미입력',ctx)}</div></div><button class="btn danger smallBtn" data-delind="${x.id}">삭제</button></div><div class="grid2"><div><b>구조·고객</b><p>${esc(x.business||'—',ctx)}</p></div><div><b>최근 변화</b><p>${esc(x.change||'—',ctx)}</p></div><div><b>직무 역할</b><p>${esc(x.jobLink||'—',ctx)}</p></div><div><b>산업별 차이</b><p>${esc(x.difference||'—',ctx)}</p></div></div><div class="sourceLine"><b>근거</b> ${esc(x.source,ctx)} · <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">원문 열기 ↗</a></div></div>`}).join('');box.querySelectorAll('[data-delind]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.delind;data.industries=data.industries.filter(x=>x.id!==id);data.targetIndustries=data.targetIndustries.filter(x=>x!==id);data.companies=data.companies.filter(x=>x.industryId!==id);data.targetCompanies=data.targetCompanies.filter(id=>data.companies.some(c=>c.id===id));persist();renderAll();}));}
  function renderIndustryTargets(){const box=document.getElementById('industryTargets');box.innerHTML=data.industries.length?data.industries.map(x=>`<label class="checkRow"><input type="checkbox" data-itarget="${x.id}" ${data.targetIndustries.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc(jobs.find(j=>j.id===x.jobId)?.title||'',ctx)} · ${esc(x.jobLink||'',ctx)}</span></div></label>`).join(''):'<div class="callout warn">산업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-itarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-itarget]:checked')];if(ids.length>3){c.checked=false;ctx.toast('Target Industry는 최대 3개입니다.');}saveSelections();renderIndustryCompare();}));}
  function renderIndustryCompare(){const box=document.getElementById('industryCompare'),ids=currentIndustryTargets(),arr=ids.map(id=>data.industries.find(x=>x.id===id)).filter(Boolean);if(arr.length<2){box.innerHTML='<div class="callout info">Target Industry를 2개 이상 선택하면 같은 직무의 산업별 차이를 비교할 수 있습니다.</div>';return;}box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>산업</th><th>Target Job</th><th>직무 역할</th><th>산업별 차이</th><th>근거</th></tr></thead><tbody>${arr.map(x=>`<tr><td><b>${esc(x.name,ctx)}</b></td><td>${esc(jobs.find(j=>j.id===x.jobId)?.title||'—',ctx)}</td><td>${esc(x.jobLink||'—',ctx)}</td><td>${esc(x.difference||'—',ctx)}</td><td>${esc(x.source||'—',ctx)}</td></tr>`).join('')}</tbody></table></div>`;}
  function renderCompanies(){const box=document.getElementById('companyList');if(!data.companies.length){box.innerHTML='<div class="placeholder"><b>Company Evidence가 없습니다.</b>사업자료와 채용·직무 근거를 연결해 기업 후보를 추가하세요.</div>';return;}box.innerHTML=data.companies.map((x,i)=>{const ind=data.industries.find(a=>a.id===x.industryId),job=jobs.find(a=>a.id===x.jobId),quality=companyEvidenceQuality(x);return `<div class="listCard"><div class="listHead"><div><span class="rankTag">기업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc([x.type,ind?.name||x.industry,job?.title||x.job].filter(Boolean).join(' · '),ctx)}</div></div><span class="scoreChip">${quality}</span></div><div class="grid2"><div><b>사업·고객</b><p>${esc(x.business||'—',ctx)}</p></div><div><b>최근 방향</b><p>${esc(x.direction||'—',ctx)}</p></div><div><b>직무 연결</b><p>${esc(x.role||'—',ctx)}</p></div><div><b>채용 역량신호</b><p>${esc(x.signals||'—',ctx)}</p></div></div><div class="sourceLine"><b>기업근거</b> ${esc(x.source||'미입력',ctx)} ${x.url?`· <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">열기</a>`:''}<br><b>채용근거</b> ${esc(x.hiringEvidence||'미확인',ctx)} ${x.jobUrl?`· <a href="${esc(x.jobUrl,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div><div class="actions"><button class="btn danger smallBtn" data-delco="${x.id}">삭제</button></div></div>`}).join('');box.querySelectorAll('[data-delco]').forEach(b=>b.addEventListener('click',()=>{data.companies=data.companies.filter(x=>x.id!==b.dataset.delco);data.targetCompanies=data.targetCompanies.filter(id=>id!==b.dataset.delco);persist();renderAll();}));}
  function renderCompanyTargets(){const box=document.getElementById('companyTargets');box.innerHTML=data.companies.length?data.companies.map(x=>`<label class="checkRow"><input type="checkbox" data-ctarget="${x.id}" ${data.targetCompanies.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc([x.industry||data.industries.find(i=>i.id===x.industryId)?.name,x.job||jobs.find(j=>j.id===x.jobId)?.title,x.hiringEvidence].filter(Boolean).join(' · '),ctx)}</span></div></label>`).join(''):'<div class="callout warn">기업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-ctarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-ctarget]:checked')];if(ids.length>3){c.checked=false;ctx.toast('Target Company는 최대 3개입니다.');}saveSelections();renderCompanyCompare();renderCompanyGuard();}));}
  function renderCompanyCompare(){
    const box=document.getElementById('companyCompare');if(!box)return;
    const arr=currentCompanyTargets().map(id=>data.companies.find(x=>x.id===id)).filter(Boolean);
    if(!arr.length){box.innerHTML='<div class="callout info">분석한 기업 중 현재 더 준비할 기업을 선택하세요.</div>';return}
    box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>기업</th><th>Business · Customer</th><th>Strategy</th><th>Job Link</th><th>Hiring Signal</th><th>확인 필요</th></tr></thead><tbody>${arr.map(x=>`<tr><td><b>${esc(x.name,ctx)}</b></td><td>${esc(x.business||'—',ctx)}</td><td>${esc(x.direction||'—',ctx)}</td><td>${esc(x.role||'—',ctx)}</td><td>${esc(x.signals||'—',ctx)}</td><td>${esc(x.unknown||'—',ctx)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderCompanyGuard(){const box=document.getElementById('companyGuard'),arr=currentCompanyTargets().map(id=>data.companies.find(x=>x.id===id)).filter(Boolean);if(!arr.length){box.innerHTML='<div class="callout info">Target Company를 선택하면 근거상태를 점검합니다.</div>';return;}const weak=arr.filter(x=>['직무 존재만 확인','아직 미확인',''].includes(x.hiringEvidence)||!x.url);const orphan=arr.filter(x=>!data.targetIndustries.includes(x.industryId));if(orphan.length)box.innerHTML=`<div class="callout warn"><b>조합 확인 필요</b><br>${orphan.map(x=>esc(x.name,ctx)).join(', ')}은 현재 Target Industry에 포함되지 않습니다.</div>`;else if(weak.length)box.innerHTML=`<div class="callout warn"><b>채용근거 보강 필요</b><br>${weak.map(x=>esc(x.name,ctx)).join(', ')}은 실제 채용공고 또는 공식 직무자료를 더 확인하세요.</div>`;else box.innerHTML='<div class="callout good"><b>기본 연결 확인</b><br>선택한 기업이 Target Industry·Target Job과 연결되고 채용/직무 근거도 기록되어 있습니다.</div>';}
  function saveSelections(){data.targetIndustries=currentIndustryTargets();data.targetCompanies=currentCompanyTargets();persist();}
  function saveAll(){saveSelections();data.notes=v('notes');persist();renderCompanyGuard();status('STEP 7 산업·기업분석 결과를 저장했습니다.');}
  function currentIndustryTargets(){return [...document.querySelectorAll('[data-itarget]:checked')].map(x=>x.dataset.itarget)}function currentCompanyTargets(){return [...document.querySelectorAll('[data-ctarget]:checked')].map(x=>x.dataset.ctarget)}
  function persist(){ctx.saveState({artifacts:{industryCompany:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function clear(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}

function getTargetJobs(s){const e=s.artifacts?.jobExplorer||{};return (e.targets||[]).map(id=>e.candidates?.find(x=>x.id===id)).filter(Boolean)}
function companyEvidenceQuality(x){if(x.url&&x.jobUrl&&['현재 채용공고 확인','최근 채용공고 확인'].includes(x.hiringEvidence))return '근거 높음';if(x.url&&(x.jobUrl||x.hiringEvidence==='공식 직무소개 확인'))return '근거 보통';return '근거 보강'}
function buildIndustryPrompt(s){
  const e=s.artifacts?.jobExplorer||{},jobs=getTargetJobs(s).map(x=>x.title),industries=(e.targetCombos||[]).map(x=>x.industry).filter(Boolean);
  return `나는 ${s.profile?.major||'전공 미입력'} 전공 대학생이고, Target Job은 ${jobs.join(', ')||'미정'}이다.
관심 산업은 ${[...new Set(industries)].join(', ')||'미정'}이다.

웹 검색이 가능하면 현재 기준의 공식·공공 자료를 우선 확인해 취업 관점에서 산업을 분석해줘.

[분석할 내용]
1. 산업 한 줄 설명: 이 산업은 무엇을 팔거나 제공하고 어떻게 수익을 만드는가
2. 주요 고객·가치사슬: 누가 고객이고 어떤 기업들이 연결되는가
3. 주요 기업: 대표 기업을 예시로 제시하되 확인 가능한 기업만 쓴다
4. 최근 변화 3개: 기술·고객·시장·규제 변화 중 Target Job과 관련된 것
5. 직무·채용 영향: 위 변화 때문에 ${jobs.join(', ')||'이 직무'}의 업무·역량·Tool이 어떻게 달라지는가
6. 확인 출처: 정부·공공기관·산업협회·공시·기업 IR 등 원문 확인이 가능한 자료

[중요 규칙]
- 성장성이 높다, 취업이 쉽다 같은 판단을 근거 없이 하지 않는다.
- 최신 숫자와 동향에는 확인 가능한 출처가 필요하다.
- 직무와 관계없는 산업 일반 설명은 줄인다.
- JSON과 코드를 사용하지 않는다.
- 첫 줄부터 아래 제목으로 짧게 답한다.

[산업 한 줄]
• 

[주요 고객·가치사슬]
• 

[주요 기업]
• 

[최근 변화]
• 
• 
• 

[직무·채용 영향]
• 

[확인 출처]
• `;
}
function buildCompanyPrompt(s,data){
  const inds=(data.targetIndustries||[]).map(id=>data.industries.find(x=>x.id===id)?.name).filter(Boolean),jobs=getTargetJobs(s).map(x=>x.title);
  return `나는 ${s.profile?.major||'전공 미입력'} 전공 대학생이고, Target Job은 ${jobs.join(', ')||'미정'}이다.
관심 산업은 ${inds.join(', ')||primaryTargetIndustry(s)||'미정'}이다.

웹 검색이 가능하면 기업 공식 홈페이지·사업보고서·IR·공식 채용페이지를 우선 확인해, 이 직무를 실제로 탐색할 기업을 최대 3개 찾아줘.

[검색 기준]
- Target Job과 실제 업무가 연결되는 기업
- 기업 공식자료를 확인할 수 있는 기업
- 현재 또는 최근 채용공고·공식 직무소개를 확인할 수 있는 기업을 우선
- 단순히 유명한 기업이라는 이유로 넣지 않는다.

각 기업은 아래 5가지만 짧게 분석해줘.

[기업 1]
• 기업명:
• Business · Customer: 무엇을 팔고 주요 고객은 누구인가
• Strategy: 최근 공식자료에서 확인되는 사업·시장 방향
• Job Link: Target Job이 어떤 사업·고객·성과와 연결되는가
• Hiring Signal: 실제 채용공고·직무소개에서 반복되는 역량·경험·Tool
• 기업 공식자료 URL:
• 채용·직무 원문 URL:
• 확인 필요:

같은 형식으로 최대 3개만 작성해줘.

[중요 규칙]
- 확인되지 않은 기업·공고·URL을 만들지 않는다.
- 오래된 공고를 현재 채용 중이라고 표현하지 않는다.
- 적합도 점수나 합격 가능성을 계산하지 않는다.
- JSON·코드블록을 사용하지 않는다.`;
}
function primaryTargetIndustry(s){const e=s.artifacts?.jobExplorer||{},arr=(e.targetCombos||[]).map(x=>x.industry).filter(Boolean);return arr[0]||e.industryInterests?.[0]||''}
function targetSummaryHtml(s,ctx){
  const e=s.artifacts?.jobExplorer||{},deep=s.artifacts?.jobDeepDive||{},combos=(e.targetCombos||[]).length?e.targetCombos:(e.targets||[]).map((jobId,i)=>({id:'target_'+jobId+'_'+(i+1),jobId,industry:'산업 미정'}));
  if(!combos.length)return '<div class="callout warn">STEP 3~5에서 Target Job을 먼저 확정하세요.</div>';
  return combos.map((t,i)=>{
    const job=e.candidates?.find(x=>x.id===t.jobId),a=deep.targetAnalyses?.[t.id]||deep.analyses?.[t.jobId]||{},selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId)||(a.sources||[])[0],jt=a.jobTable||{};
    return `<div class="listCard"><div class="listHead"><div><span class="rankTag">Target ${i+1}</span><h3>${esc(job?.title||'직무 미확인',ctx)} × ${esc(t.industry||'산업 미정',ctx)}</h3></div></div><div class="grid2"><div><b>확인한 JD</b><p>${esc(selected?((selected.companyName?selected.companyName+' · ':'')+selected.name):'선택한 JD 없음',ctx)}</p></div><div><b>주요 과업</b><p>${esc(jt.tasks||'STEP 5 직무분석에서 확인 필요',ctx)}</p></div><div><b>필요역량</b><p>${esc(jt.competencies||'STEP 5 직무분석에서 확인 필요',ctx)}</p></div><div><b>STEP 7에서 확인할 것</b><p>이 직무가 산업과 기업에 따라 어떻게 달라지는지 확인</p></div></div></div>`;
  }).join('');
}
function selectJob(id,label,jobs){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${jobs.map(x=>`<option value="${x.id}">${x.title}</option>`).join('')}</select></div>`}function selectIndustry(id,label,inds){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${inds.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function today(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value||'';return [g('year'),g('month'),g('day')].join('-')}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

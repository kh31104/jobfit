const JOB_FAMILIES=['기획·전략','인사·조직','재무·회계','영업·사업개발','마케팅·브랜드','고객·서비스','구매·물류·SCM','생산·공정·설비','품질·안전·환경','R&D·연구','IT·데이터','디자인·콘텐츠','공공·행정','상담·교육','기타'];
const WORK_ACTIVITIES=['자료·데이터 분석하기','문제 원인 찾아 해결하기','제품·서비스 기획하기','프로그램·시스템 개발하기','기계·장비 다루기','제품·공정 설계하기','기준에 맞는지 검사·점검하기','일정·업무 계획하기','사람들과 협의·조정하기','고객에게 설명·설득하기','콘텐츠 만들기','사람을 교육·지원하기'];
const INDUSTRIES=['IT·플랫폼','반도체·전자','자동차·모빌리티','기계·산업재','바이오·제약','금융','유통·물류','식품','화학·소재','건설·부동산','에너지','콘텐츠·미디어','교육','기타'];
const VERSION='job-explorer-v3';

export async function render(ctx){
  const s=ctx.getState(),dna=s.assessments?.careerDNA||{},exp=s.assessments?.experienceCompetency||{experiences:[]};
  const mapped=Array.isArray(s.artifacts?.experienceMap)?s.artifacts.experienceMap.filter(x=>x?.factChecked):[];
  const experienceMap=mapped.length?mapped:(exp.experiences||[]).filter(x=>x?.factChecked);
  const saved=s.artifacts?.jobExplorer||{};
  const data=structuredClone(saved);
  data.candidates=Array.isArray(data.candidates)?data.candidates:[];
  data.targets=Array.isArray(data.targets)?data.targets:[];
  data.desiredActivities=Array.isArray(data.desiredActivities)?data.desiredActivities:[];
  data.newInterests=Array.isArray(data.newInterests)?data.newInterests:[];
  data.industryInterests=Array.isArray(data.industryInterests)?data.industryInterests:[];
  data.targetCombos=Array.isArray(data.targetCombos)?data.targetCombos:legacyCombos(data);
  const root=document.getElementById('stepRoot');
  const actions=repeatedActions(experienceMap);

  root.innerHTML=`<section class="card jobExplorerV3">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 3 · JOB EXPLORATION</div><h2>어떤 일을, 어느 산업에서 탐색해볼까?</h2><p>STEP 1·2에서 확인한 나의 경험과 관심을 바탕으로 <b>행동 → 업무활동 → 직무 → 산업</b> 순서로 탐색합니다.</p></div><span class="badge">직무탐색</span></div>
    <div class="progress"><span style="width:29%"></span></div>
    <div class="callout info"><b>직무를 결정하는 단계가 아닙니다.</b><br>더 알아볼 직무를 찾고, STEP 4에서 실제 기업·채용정보로 확인할 Target을 2~3개 선택합니다.</div>

    ${block('01','지금까지 확인한 나','새로 검사하지 않고 STEP 1·2 결과를 불러옵니다.',`
      <div class="grid3"><div class="miniCard"><b>Career DNA</b><span>${esc(summaryCareer(dna,s.artifacts?.careerDNAProfile),ctx)}</span></div><div class="miniCard"><b>Best Experience</b><span>${esc(experienceMap.slice(0,3).map(x=>x.title||'경험').join(' · ')||'STEP 2 경험을 먼저 정리하세요.',ctx)}</span></div><div class="miniCard"><b>확인된 역량</b><span>${esc(summaryCompetencies(exp,experienceMap),ctx)}</span></div></div>
      <div class="actions"><button class="btn primary" id="confirmSelf">맞아요, 다음</button><button class="btn outline" id="backStep2">경험 수정하러 가기</button></div>`)}

    ${block('02','내 경험에서 반복된 행동','역량 이름보다 실제로 한 행동을 먼저 봅니다.',`
      <div class="evidenceGrid">${actions.length?actions.map(x=>`<div class="actionEvidence">${esc(x,ctx)}</div>`).join(''):'<div class="placeholder"><b>확인된 행동이 아직 없습니다.</b>STEP 2에서 행동과 Evidence를 정리하면 여기에 자동으로 연결됩니다.</div>'}</div>`)}

    ${block('03','실제 직장에서 해보고 싶은 일','잘했던 일과 앞으로 하고 싶은 일은 다를 수 있습니다. 3~5개를 골라보세요.',`
      <div class="choiceTiles">${WORK_ACTIVITIES.map(x=>choice('activity',x,data.desiredActivities.includes(x),ctx)).join('')}</div>
      <div class="status" id="activityStatus"></div>`)}

    ${block('04','아직 해보지 않았지만 관심 있는 일','과거 경험만으로 미래 가능성을 제한하지 않습니다.',`
      <div class="inlineAdd"><input class="input" id="newInterestInput" placeholder="예: 고객 인터뷰, UX 리서치, 공정 자동화"><button class="btn secondary" id="addInterest">+ 추가</button></div><div id="interestList" class="pillRow" style="margin-top:10px"></div>`)}

    ${block('05','관심 산업 탐색','산업은 고정하지 않습니다. 아직 모르겠다면 ‘아직 잘 모르겠어요’를 선택해도 됩니다.',`
      <div class="choiceTiles">${INDUSTRIES.map(x=>choice('industry',x,data.industryInterests.includes(x),ctx)).join('')}${choice('industry','아직 잘 모르겠어요',data.industryInterests.includes('아직 잘 모르겠어요'),ctx)}</div>`)}

    ${block('06','직무 × 산업 탐색','같은 직무도 산업이 달라지면 고객·Task·Tool이 달라질 수 있습니다.',`
      <div class="callout good"><b>예시</b><br>데이터분석 × 금융 = 고객·거래·리스크 데이터 / 데이터분석 × 제조 = 생산·품질·공정 데이터<br>생산기술 × 자동차 = 생산라인·공정 개선 / 생산기술 × 식품 = 생산공정·설비·품질조건 관리</div>
      <textarea id="jobPrompt" rows="18">${esc(buildPrompt(s,data,experienceMap),ctx)}</textarea><div class="actions"><button class="btn secondary" id="refreshPrompt">현재 선택 반영</button><button class="btn primary" id="copyPrompt">AI 직무탐색 프롬프트 복사</button></div>`)}

    ${block('07','탐색 직무 후보','AI 결과를 그대로 확정하지 말고, 후보가 나온 근거와 아직 확인하지 않은 것을 함께 남깁니다. 최대 5개를 권장합니다.',`
      <div class="grid2">${txt('jobTitle','직무명','','예: CRM 마케팅')}${sel('jobFamily','직무군','',JOB_FAMILIES)}${txt('jobIndustries','가능 산업','','예: 유통·물류, 금융, IT·플랫폼')}${txt('jobSummary','어떤 일인가요?','','1~2문장으로 간단히')}</div>
      <div class="grid2" style="margin-top:12px">${area('jobWhy','관심 근거','','내가 선택한 업무활동과 무엇이 연결되는가?')}${area('jobEvidence','경험·행동 근거','','STEP 2의 어떤 경험·행동과 연결되는가?')}${area('jobUnknown','아직 확인할 것','','실제 세부업무, 요구기술, 근무환경 등')}${area('jobSource','참고한 자료','','선택사항 · NCS/고용24/기업 직무소개 등')}</div>
      <div class="actions"><button class="btn primary" id="addCandidate">직무 후보 추가</button></div><div class="status" id="candidateStatus"></div><div id="candidateList"></div>`)}

    ${block('08','직무 후보 비교','점수로 순위를 정하지 않습니다. 경험근거·관심활동·산업맥락·확인할 점을 나란히 봅니다.',`<div id="compareBox"></div>`)}

    ${block('09','STEP 4에서 확인할 Target','직무 × 산업 조합을 2개, 필요하면 예비 1개까지 선택합니다.',`
      <div id="targetEditor"></div><div class="field" style="margin-top:12px"><label>왜 이 조합을 더 알아보고 싶나요?</label><textarea id="targetReason" placeholder="내 경험·관심과 연결되는 이유를 직접 적어보세요.">${esc(data.targetReason||data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveTargets">Target 저장</button><button class="btn secondary" id="nextStep">STEP 4 실제 직무 확인 →</button></div><div class="status" id="targetStatus"></div>`)}
  </section>`;

  renderInterests();renderCandidates();renderCompare();renderTargets();bindChoices();
  document.getElementById('confirmSelf')?.addEventListener('click',()=>openBlock(2));
  document.getElementById('backStep2')?.addEventListener('click',()=>ctx.navigate(2));
  document.getElementById('addInterest')?.addEventListener('click',addInterest);
  document.getElementById('refreshPrompt')?.addEventListener('click',refreshPrompt);
  document.getElementById('copyPrompt')?.addEventListener('click',()=>copy(document.getElementById('jobPrompt').value,ctx));
  document.getElementById('addCandidate')?.addEventListener('click',addCandidate);
  document.getElementById('saveTargets')?.addEventListener('click',saveTargets);
  document.getElementById('nextStep')?.addEventListener('click',()=>{saveTargets();ctx.navigate(4)});

  function bindChoices(){
    document.querySelectorAll('[data-choice="activity"]').forEach(el=>el.addEventListener('change',()=>{data.desiredActivities=checked('activity');persist(false);refreshPrompt();const st=document.getElementById('activityStatus');if(st)st.textContent=data.desiredActivities.length<3?'3개 이상 선택하는 것을 권장합니다.':`${data.desiredActivities.length}개 선택됨`;}));
    document.querySelectorAll('[data-choice="industry"]').forEach(el=>el.addEventListener('change',()=>{data.industryInterests=checked('industry');persist(false);refreshPrompt();renderTargets();}));
  }
  function checked(type){return [...document.querySelectorAll(`[data-choice="${type}"]:checked`)].map(x=>x.value)}
  function addInterest(){const input=document.getElementById('newInterestInput'),value=input?.value?.trim();if(!value)return; if(!data.newInterests.includes(value))data.newInterests.push(value);input.value='';persist(false);renderInterests();refreshPrompt();}
  function renderInterests(){const box=document.getElementById('interestList');if(!box)return;box.innerHTML=data.newInterests.length?data.newInterests.map((x,i)=>`<span class="pill interestPill">${esc(x,ctx)} <button data-del-interest="${i}" aria-label="삭제">×</button></span>`).join(''):'<span class="muted small">추가한 관심 활동이 없습니다.</span>';box.querySelectorAll('[data-del-interest]').forEach(b=>b.addEventListener('click',()=>{data.newInterests.splice(Number(b.dataset.delInterest),1);persist(false);renderInterests();refreshPrompt();}));}
  function addCandidate(){
    const title=v('jobTitle');if(!title){status('candidateStatus','직무명을 입력하세요.');return}if(data.candidates.length>=5){status('candidateStatus','직무 후보는 5개까지 비교하는 것을 권장합니다. 기존 후보를 정리한 뒤 추가하세요.');return}
    const industries=splitList(v('jobIndustries'));
    data.candidates.push({id:`job_${Date.now()}`,title,family:v('jobFamily'),industries,summary:v('jobSummary'),why:v('jobWhy'),evidence:v('jobEvidence'),unknowns:v('jobUnknown'),source:v('jobSource'),createdAt:new Date().toISOString()});
    ['jobTitle','jobIndustries','jobSummary','jobWhy','jobEvidence','jobUnknown','jobSource'].forEach(id=>set(id,''));set('jobFamily','');persist(false);renderCandidates();renderCompare();renderTargets();status('candidateStatus','직무 후보를 추가했습니다.');
  }
  function renderCandidates(){const box=document.getElementById('candidateList');if(!box)return;if(!data.candidates.length){box.innerHTML='<div class="placeholder"><b>아직 직무 후보가 없습니다.</b>AI 프롬프트로 탐색한 뒤 4~5개 후보를 추가해 비교하세요.</div>';return}box.innerHTML=data.candidates.map((j,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">후보 ${i+1}</span><h3>${esc(j.title,ctx)}</h3><div class="muted small">${esc(j.family||'직무군 미입력',ctx)} · ${(j.industries||[]).map(x=>esc(x,ctx)).join(' / ')||'산업 미정'}</div></div><button class="btn danger smallBtn" data-del="${j.id}">삭제</button></div><p><b>어떤 일?</b> ${esc(j.summary||'—',ctx)}</p><div class="grid2"><div><b>관심 근거</b><p>${esc(j.why||'—',ctx)}</p></div><div><b>경험·행동 근거</b><p>${esc(j.evidence||'—',ctx)}</p></div></div><div class="callout info"><b>아직 확인할 것</b><br>${esc(j.unknowns||'실제 Task·요구기술·근무환경 확인 필요',ctx)}</div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.candidates=data.candidates.filter(x=>x.id!==b.dataset.del);data.targets=data.targets.filter(x=>x!==b.dataset.del);data.targetCombos=data.targetCombos.filter(x=>x.jobId!==b.dataset.del);persist(false);renderCandidates();renderCompare();renderTargets();}));}
  function renderCompare(){const box=document.getElementById('compareBox');if(!box)return;if(!data.candidates.length){box.innerHTML='<div class="callout info">후보를 추가하면 비교표가 만들어집니다.</div>';return}box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>직무</th><th>경험·행동 근거</th><th>관심 근거</th><th>가능 산업</th><th>더 확인할 것</th></tr></thead><tbody>${data.candidates.map(j=>`<tr><td><b>${esc(j.title,ctx)}</b></td><td>${esc(j.evidence||'—',ctx)}</td><td>${esc(j.why||'—',ctx)}</td><td>${esc((j.industries||[]).join(', ')||'미정',ctx)}</td><td>${esc(j.unknowns||'—',ctx)}</td></tr>`).join('')}</tbody></table></div>`;}
  function renderTargets(){const box=document.getElementById('targetEditor');if(!box)return;if(!data.candidates.length){box.innerHTML='<div class="callout warn">직무 후보를 먼저 추가하세요.</div>';return}const combos=[0,1,2].map(i=>data.targetCombos[i]||{});box.innerHTML=combos.map((combo,i)=>`<div class="targetRow"><div><b>${i<2?`${i+1}순위 Target`:'예비 Target'}</b><span>${i<2?'필수 선택':'선택사항'}</span></div><select data-target-job="${i}"><option value="">직무 선택</option>${data.candidates.map(j=>`<option value="${j.id}" ${combo.jobId===j.id?'selected':''}>${esc(j.title,ctx)}</option>`).join('')}</select><select data-target-industry="${i}">${industryOptions(combo.jobId,combo.industry)}</select></div>`).join('');box.querySelectorAll('[data-target-job]').forEach(selEl=>selEl.addEventListener('change',()=>{const i=Number(selEl.dataset.targetJob),ind=box.querySelector(`[data-target-industry="${i}"]`);if(ind)ind.innerHTML=industryOptions(selEl.value,'');}));}
  function industryOptions(jobId,current){const job=data.candidates.find(x=>x.id===jobId),all=[...(job?.industries||[]),...data.industryInterests.filter(x=>x!=='아직 잘 모르겠어요')];const vals=[...new Set(all.filter(Boolean))];if(!vals.length)vals.push('산업 미정');return `<option value="">산업 선택</option>`+vals.map(x=>`<option value="${esc(x,ctx)}" ${current===x?'selected':''}>${esc(x,ctx)}</option>`).join('')}
  function saveTargets(){
    const combos=[0,1,2].map(i=>({jobId:document.querySelector(`[data-target-job="${i}"]`)?.value||'',industry:document.querySelector(`[data-target-industry="${i}"]`)?.value||'',priority:i+1})).filter(x=>x.jobId&&x.industry);
    if(combos.length<2){status('targetStatus','직무 × 산업 Target을 2개 이상 선택하세요.');return false}
    data.targetCombos=combos.map((x,i)=>({...x,id:`target_${x.jobId}_${slug(x.industry)}_${i+1}`}));data.targets=[...new Set(combos.map(x=>x.jobId))];data.targetReason=v('targetReason');data.notes=data.targetReason;persist(true);status('targetStatus',`Target ${combos.length}개를 저장했습니다.`);return true;
  }
  function persist(syncContext){data.version=VERSION;data.updatedAt=new Date().toISOString();const patch={jobExplorer:data};if(syncContext)patch.industryCompany=buildIndustryCompany(ctx.getState(),data);ctx.saveState({artifacts:patch});}
  function refreshPrompt(){persist(false);const el=document.getElementById('jobPrompt');if(el)el.value=buildPrompt(ctx.getState(),data,experienceMap)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function set(id,val){const el=document.getElementById(id);if(el)el.value=val}function status(id,t){const el=document.getElementById(id);if(el)el.textContent=t;ctx.toast(t)}function openBlock(index){const blocks=[...root.querySelectorAll('.block')];window.JobfitStepAccordion?.openBlock?.(blocks[index])}
}

function buildIndustryCompany(state,data){const old=structuredClone(state.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''}),manual=(old.industries||[]).filter(x=>x.generatedBy!=='step3-v3');const generated=(data.targetCombos||[]).map((c,i)=>({id:`ind_${c.jobId}_${slug(c.industry)}_${i+1}`,name:c.industry,jobId:c.jobId,sourceType:'STEP 3 탐색',source:'',url:'',checkedAt:'',jobLink:'',difference:'',generatedBy:'step3-v3'}));const targetIndustries=generated.map(x=>x.id);return {...old,industries:[...manual,...generated],targetIndustries:targetIndustries.length?targetIndustries:(old.targetIndustries||[]),companies:old.companies||[],targetCompanies:old.targetCompanies||[]}}
function legacyCombos(data){return (data.targets||[]).map((id,i)=>({id:`legacy_${id}_${i+1}`,jobId:id,industry:'산업 미정',priority:i+1}))}
function repeatedActions(map){const out=[];for(const x of map||[]){const a=String(x.action||'').trim();if(a&&!out.includes(a))out.push(a);for(const ce of x.competencyEvidence||[]){const e=String(ce?.evidence||'').trim();if(e&&!out.includes(e))out.push(e)}if(out.length>=6)break}return out.slice(0,6)}
function summaryCareer(dna,profile){const h=profile?.hypothesis?.text||dna.hypothesis?.text||'',values=profile?.valueClues||[];return [h,values.length?`가치: ${values.slice(0,3).join(', ')}`:''].filter(Boolean).join(' / ')||'STEP 1 결과를 확인하세요.'}
function summaryCompetencies(exp,map){const src=map.length?map:(exp.experiences||[]).filter(x=>x?.factChecked),comps=[...new Set(src.flatMap(x=>x.competencies||[]))];return comps.slice(0,8).join(', ')||'STEP 2에서 경험기반 역량을 확인하세요.'}
function buildPrompt(s,data,map){const evidence=(map||[]).slice(0,5).map((x,i)=>`${i+1}. ${x.title||'경험'}\n- 행동: ${x.action||'미입력'}\n- 결과: ${x.result||'미입력'}\n- 역량: ${(x.competencies||[]).join(', ')||'미입력'}`).join('\n');return `당신은 대학생의 직무탐색을 돕는 조력자다. 최종 직무를 대신 결정하지 말고, 학생의 실제 경험과 관심 업무를 근거로 탐색할 직무 후보를 만들어라.\n\n[학생이 해보고 싶은 업무]\n${(data.desiredActivities||[]).join(', ')||'아직 선택하지 않음'}\n\n[경험은 없지만 관심 있는 업무]\n${(data.newInterests||[]).join(', ')||'없음'}\n\n[관심 산업]\n${(data.industryInterests||[]).join(', ')||'미정'}\n\n[STEP 2 경험 근거]\n${evidence||'확인된 경험 없음'}\n\n[규칙]\n1. Holland/RIASEC 유형을 임의로 추정하지 않는다.\n2. 전공이나 성격 하나만으로 직무를 정하지 않는다.\n3. 후보는 4~5개만 제안하되 업무 성격이 서로 겹치지 않게 한다.\n4. 각 후보마다 '어떤 일인가 / 경험·행동 근거 / 관심 근거 / 가능한 산업 / 아직 확인할 것'을 구분한다.\n5. 같은 직무가 산업별로 어떻게 달라지는지 예를 들어 설명한다.\n6. 특정 산업, 특히 에너지 산업을 기본값으로 두지 않는다. 학생의 관심 산업이 미정이면 여러 산업 예시를 제안한다.\n7. 적합도 %, 추천순위, 취업성공확률을 만들지 않는다.\n8. 학생이 하지 않은 경험이나 역량을 만들어내지 않는다.\n9. 실제 Task·요구기술·기업조건은 STEP 4에서 공식자료로 확인해야 한다고 표시한다.\n\n[출력]\n표: 직무 후보 | 직무군 | 어떤 일인가 | 연결되는 경험·행동 | 관심 근거 | 가능한 산업 2~4개 | STEP 4에서 확인할 것\n마지막에 학생이 비교할 질문 2개만 제시하라.`}
function block(n,title,desc,body){return `<div class="hr"></div><div class="block"><div class="moduleHead"><span>${n}</span><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`}
function choice(type,label,on,ctx){return `<label class="choiceTile"><input type="checkbox" data-choice="${type}" value="${esc(label,ctx)}" ${on?'checked':''}><span>${esc(label,ctx)}</span></label>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}
function splitList(v){return [...new Set(String(v||'').split(/[,/|]/).map(x=>x.trim()).filter(Boolean))]}
function slug(x=''){return String(x).trim().replace(/[^0-9A-Za-z가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'undecided'}
function esc(x,ctx){return ctx.escapeHtml(String(x??''))}
async function copy(text,ctx){try{await navigator.clipboard.writeText(text);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}
function styleBlock(){return `<style>
.jobExplorerV3 .moduleHead{display:flex;gap:11px;align-items:flex-start}.jobExplorerV3 .moduleHead>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#eef3ff;color:#3152c9;font-weight:950;flex:0 0 auto}.jobExplorerV3 .moduleHead h3{margin:2px 0 3px}.jobExplorerV3 .moduleHead p{margin:0;color:#667085;font-size:12px;line-height:1.5}.choiceTiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.choiceTile{display:flex;align-items:center;gap:8px;border:1px solid #e3e8f2;border-radius:13px;padding:11px;background:#fff;font-size:13px;font-weight:800}.choiceTile:has(input:checked){border-color:#8fa5ff;background:#f4f6ff;color:#244bd7}.inlineAdd{display:flex;gap:8px}.interestPill button{border:0;background:transparent;color:#98a2b3;font-size:16px}.evidenceGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.actionEvidence{border:1px solid #e3e8f2;border-radius:13px;padding:12px;background:#fbfcff;font-size:13px;line-height:1.55}.targetRow{display:grid;grid-template-columns:150px 1fr 1fr;gap:9px;align-items:center;border:1px solid #e3e8f2;border-radius:15px;padding:12px;margin:9px 0}.targetRow b,.targetRow span{display:block}.targetRow span{font-size:11px;color:#667085;margin-top:2px}@media(max-width:700px){.choiceTiles,.evidenceGrid{grid-template-columns:1fr 1fr}.targetRow{grid-template-columns:1fr}.inlineAdd{flex-direction:column}}@media(max-width:460px){.choiceTiles,.evidenceGrid{grid-template-columns:1fr}}
</style>`}

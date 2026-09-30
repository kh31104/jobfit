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
  const actions=confirmedActions(experienceMap);
  let editingCandidateId='';

  root.innerHTML=`<section class="card jobExplorerV3">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 3 · JOB EXPLORATION</div><h2>내가 탐색할 직무 찾기</h2><p>STEP 1·2에서 확인한 나를 다시 입력하지 않고, <b>하고 싶은 일 → 산업 → 직무 후보 → Target Job</b>만 빠르게 정합니다.</p></div><span class="badge">직무탐색</span></div>
    <div class="progress"><span style="width:29%"></span></div>
    <div class="callout info"><b>여기서는 직무를 확정하지 않습니다.</b><br>STEP 4에서 실제 채용공고를 보고 확인할 Target Job만 1~3개 고릅니다.</div>

    ${block('01','나의 직무탐색 근거 확인','STEP 1·2 결과를 자동으로 불러옵니다. 다시 작성하지 않습니다.',`
      <div class="grid3">
        <div class="miniCard"><b>Career DNA</b><span>${esc(summaryCareer(dna,s.artifacts?.careerDNAProfile),ctx)}</span></div>
        <div class="miniCard"><b>Best Experience</b><span>${esc(experienceMap.slice(0,3).map(x=>x.title||'경험').join(' · ')||'STEP 2 경험을 먼저 정리하세요.',ctx)}</span></div>
        <div class="miniCard"><b>확인된 역량</b><span>${esc(summaryCompetencies(exp,experienceMap),ctx)}</span></div>
      </div>
      <div class="evidenceGrid" style="margin-top:10px">${actions.length?actions.map(x=>`<div class="actionEvidence">${esc(x,ctx)}</div>`).join(''):'<div class="placeholder"><b>확인된 행동이 아직 없습니다.</b>STEP 2에서 행동과 Evidence를 정리하면 자동 연결됩니다.</div>'}</div>
      <div class="actions"><button class="btn primary" id="confirmSelf">확인했어요, 다음</button><button class="btn outline" id="backStep2">STEP 2 수정</button></div>`)}

    ${block('02','직장에서 해보고 싶은 일','앞으로 실제로 해보고 싶은 업무를 3~5개 고릅니다.',`
      <div class="choiceTiles">${WORK_ACTIVITIES.map(x=>choice('activity',x,data.desiredActivities.includes(x),ctx)).join('')}</div>
      <div class="status" id="activityStatus"></div>
      <details class="subDetails" style="margin-top:12px"><summary>목록에 없는 관심 업무가 있어요</summary>
        <div class="inlineAdd" style="margin-top:10px"><input class="input" id="newInterestInput" placeholder="예: 고객 인터뷰, UX 리서치, 공정 자동화"><button class="btn secondary" id="addInterest">+ 추가</button></div>
        <div id="interestList" class="pillRow" style="margin-top:10px"></div>
      </details>`)}

    ${block('03','관심 산업·분야','최대 3개까지 고르거나, 아직 모르겠다면 그대로 진행합니다.',`
      <div class="choiceTiles">${INDUSTRIES.map(x=>choice('industry',x,data.industryInterests.includes(x),ctx)).join('')}${choice('industry','아직 잘 모르겠어요',data.industryInterests.includes('아직 잘 모르겠어요'),ctx)}</div>`)}

    ${block('04','직무 후보 찾기','내 경험과 관심을 근거로 4~5개 정도만 탐색합니다.',`
      <textarea id="jobPrompt" rows="16">${esc(buildPrompt(s,data,experienceMap),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="refreshPrompt">현재 선택 반영</button><button class="btn primary" id="copyPrompt">AI 직무탐색 프롬프트 복사</button></div>
      <div class="callout info" style="margin-top:12px"><b>표나 JSON은 사용하지 않습니다.</b><br>AI가 만든 개조식 텍스트 전체를 복사해 아래 칸에 붙여넣으면 후보카드가 자동 생성됩니다.</div>
      <textarea id="jobAiImport" rows="10" placeholder="[후보 1]부터 마지막 후보까지 AI 결과 전체를 그대로 붙여넣으세요."></textarea>
      <div class="actions"><button class="btn secondary" id="importJobAi">AI 후보 한 번에 불러오기</button></div>
      <div class="status" id="candidateStatus"></div>
      <div id="candidateList"></div>
      <details class="subDetails" id="candidateManualEditor" style="margin-top:12px"><summary>직무 후보를 직접 추가·수정할래요</summary>
        <div class="grid2" style="margin-top:10px">${txt('jobTitle','직무명','','예: CRM 마케팅')}${sel('jobFamily','직무군','',JOB_FAMILIES)}${txt('jobIndustries','가능 산업','','예: 유통·물류, 금융')}${txt('jobSummary','어떤 일인가요?','','1~2문장으로 간단히')}</div>
        <div class="grid2" style="margin-top:12px">${area('jobWhy','관심 근거','','내가 선택한 업무활동과 무엇이 연결되는가?')}${area('jobEvidence','경험·행동 근거','','STEP 2의 어떤 경험과 연결되는가?')}${area('jobUnknown','STEP 4에서 확인할 것','','실제 세부업무, 요구기술, 근무환경 등')}${area('jobSource','참고자료','','선택사항')}</div>
        <div class="actions"><button class="btn primary" id="addCandidate">직무 후보 추가</button><button class="btn outline hidden" id="cancelCandidateEdit">수정 취소</button></div>
      </details>`)}

    ${block('05','Target Job 선택','STEP 4에서 실제 JD로 확인할 직무를 1~3개 선택합니다.',`
      <div id="targetEditor"></div>
      <div class="field" style="margin-top:12px"><label>왜 이 직무를 더 알아보고 싶나요?</label><textarea id="targetReason" placeholder="내 경험이나 관심과 연결되는 이유를 짧게 적어보세요.">${esc(data.targetReason||data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveTargets">Target Job 저장</button><button class="btn secondary" id="nextStep">STEP 4 실제 JD 확인 →</button></div>
      <div class="status" id="targetStatus"></div>`)}
  </section>`;
  renderInterests();renderCandidates();renderCompare();renderTargets();bindChoices();
  document.getElementById('confirmSelf')?.addEventListener('click',()=>openBlock(1));
  document.getElementById('backStep2')?.addEventListener('click',()=>ctx.navigate(2));
  document.getElementById('addInterest')?.addEventListener('click',addInterest);
  document.getElementById('refreshPrompt')?.addEventListener('click',refreshPrompt);
  document.getElementById('copyPrompt')?.addEventListener('click',()=>copy(document.getElementById('jobPrompt').value,ctx));
  document.getElementById('importJobAi')?.addEventListener('click',importJobAi);
  document.getElementById('addCandidate')?.addEventListener('click',addCandidate);
  document.getElementById('cancelCandidateEdit')?.addEventListener('click',clearCandidateEditor);
  document.getElementById('saveTargets')?.addEventListener('click',saveTargets);
  document.getElementById('nextStep')?.addEventListener('click',()=>{saveTargets();ctx.navigate(4)});

  function bindChoices(){
    document.querySelectorAll('[data-choice="activity"]').forEach(el=>el.addEventListener('change',()=>{
      let chosen=checked('activity');
      if(chosen.length>5){el.checked=false;chosen=checked('activity');ctx.toast('하고 싶은 업무는 최대 5개까지 선택하세요.')}
      data.desiredActivities=chosen;persist(false);refreshPrompt();
      const st=document.getElementById('activityStatus');if(st)st.textContent=data.desiredActivities.length<3?'3개 이상 선택하는 것을 권장합니다.':`${data.desiredActivities.length}개 선택됨`;
    }));
    document.querySelectorAll('[data-choice="industry"]').forEach(el=>el.addEventListener('change',()=>{
      const undecided='아직 잘 모르겠어요';
      if(el.checked&&el.value===undecided)document.querySelectorAll('[data-choice="industry"]').forEach(x=>{if(x!==el)x.checked=false});
      if(el.checked&&el.value!==undecided){const u=document.querySelector('[data-choice="industry"][value="'+undecided+'"]');if(u)u.checked=false}
      let chosen=checked('industry');
      if(!chosen.includes(undecided)&&chosen.length>3){el.checked=false;chosen=checked('industry');ctx.toast('관심 산업은 최대 3개까지 선택하세요.')}
      data.industryInterests=chosen;persist(false);refreshPrompt();renderTargets();
    }));
  }
  function checked(type){return [...document.querySelectorAll(`[data-choice="${type}"]:checked`)].map(x=>x.value)}
  function addInterest(){const input=document.getElementById('newInterestInput'),value=input?.value?.trim();if(!value)return; if(!data.newInterests.includes(value))data.newInterests.push(value);input.value='';persist(false);renderInterests();refreshPrompt();}
  function renderInterests(){const box=document.getElementById('interestList');if(!box)return;box.innerHTML=data.newInterests.length?data.newInterests.map((x,i)=>`<span class="pill interestPill">${esc(x,ctx)} <button data-del-interest="${i}" aria-label="삭제">×</button></span>`).join(''):'<span class="muted small">추가한 관심 활동이 없습니다.</span>';box.querySelectorAll('[data-del-interest]').forEach(b=>b.addEventListener('click',()=>{data.newInterests.splice(Number(b.dataset.delInterest),1);persist(false);renderInterests();refreshPrompt();}));}
  function importJobAi(){
    const raw=v('jobAiImport');if(!raw){status('candidateStatus','AI 결과를 먼저 붙여넣어 주세요.');return}
    const parsed=parseJsonBlock(raw),rows=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.candidates)?parsed.candidates:[]);
    if(!rows.length){status('candidateStatus','후보 JSON을 읽지 못했습니다. 프롬프트의 JSON 형식 그대로 붙여넣어 주세요.');return}
    const now=Date.now(),normalized=rows.slice(0,5).map((x,i)=>({id:'job_ai_'+now+'_'+i,title:String(x.title||x.job||'').trim(),family:String(x.family||'').trim(),industries:Array.isArray(x.industries)?x.industries.map(v=>String(v).trim()).filter(Boolean):splitList(x.industries||''),summary:String(x.summary||x.description||'').trim(),why:String(x.why||x.interestEvidence||'').trim(),evidence:String(x.evidence||x.experienceEvidence||'').trim(),unknowns:String(x.unknowns||'').trim(),source:'AI 탐색결과 · STEP 4에서 공식자료 확인 필요',createdAt:new Date().toISOString()})).filter(x=>x.title);
    if(!normalized.length){status('candidateStatus','직무명이 있는 후보를 찾지 못했습니다.');return}
    data.candidates=normalized;data.targets=[];data.targetCombos=[];persist(false);renderCandidates();renderCompare();renderTargets();status('candidateStatus','AI 후보 '+normalized.length+'개를 불러왔습니다. 내용을 확인한 뒤 Target을 선택하세요.');
  }
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
    if(combos.length<1){status('targetStatus','STEP 4에서 확인할 Target Job을 1개 이상 선택하세요.');return false}
    data.targetCombos=combos.map((x,i)=>({...x,id:`target_${x.jobId}_${slug(x.industry)}_${i+1}`}));data.targets=[...new Set(combos.map(x=>x.jobId))];data.targetReason=v('targetReason');data.notes=data.targetReason;persist(true);status('targetStatus',`Target Job ${combos.length}개를 저장했습니다.`);return true;
  }
  function persist(syncContext){data.version=VERSION;data.updatedAt=new Date().toISOString();const patch={jobExplorer:data};if(syncContext)patch.industryCompany=buildIndustryCompany(ctx.getState(),data);ctx.saveState({artifacts:patch});}
  function refreshPrompt(){persist(false);const el=document.getElementById('jobPrompt');if(el)el.value=buildPrompt(ctx.getState(),data,experienceMap)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function set(id,val){const el=document.getElementById(id);if(el)el.value=val}function status(id,t){const el=document.getElementById(id);if(el)el.textContent=t;ctx.toast(t)}function openBlock(index){const blocks=[...root.querySelectorAll('.block')];window.JobfitStepAccordion?.openBlock?.(blocks[index])}
}

function buildIndustryCompany(state,data){const old=structuredClone(state.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''}),manual=(old.industries||[]).filter(x=>x.generatedBy!=='step3-v3');const generated=(data.targetCombos||[]).map((c,i)=>({id:`ind_${c.jobId}_${slug(c.industry)}_${i+1}`,name:c.industry,jobId:c.jobId,sourceType:'STEP 3 탐색',source:'',url:'',checkedAt:'',jobLink:'',difference:'',generatedBy:'step3-v3'}));const targetIndustries=generated.map(x=>x.id);return {...old,industries:[...manual,...generated],targetIndustries:targetIndustries.length?targetIndustries:(old.targetIndustries||[]),companies:old.companies||[],targetCompanies:old.targetCompanies||[]}}
function legacyCombos(data){return (data.targets||[]).map((id,i)=>({id:`legacy_${id}_${i+1}`,jobId:id,industry:'산업 미정',priority:i+1}))}
function confirmedActions(map){const out=[];for(const x of map||[]){const a=String(x.action||'').trim();if(a&&!out.includes(a))out.push(a);for(const ce of x.competencyEvidence||[]){const e=String(ce?.evidence||'').trim();if(e&&!out.includes(e))out.push(e)}if(out.length>=6)break}return out.slice(0,6)}
function summaryCareer(dna,profile){const h=profile?.hypothesis?.text||dna.hypothesis?.text||'',values=profile?.valueClues||[];return [h,values.length?`가치: ${values.slice(0,3).join(', ')}`:''].filter(Boolean).join(' / ')||'STEP 1 결과를 확인하세요.'}
function summaryCompetencies(exp,map){const src=map.length?map:(exp.experiences||[]).filter(x=>x?.factChecked),comps=[...new Set(src.flatMap(x=>x.competencies||[]))];return comps.slice(0,8).join(', ')||'STEP 2에서 경험기반 역량을 확인하세요.'}
function buildPrompt(s,data,map){const evidence=(map||[]).slice(0,5).map((x,i)=>`${i+1}. ${x.title||'경험'}\n- 행동: ${x.action||'미입력'}\n- 결과: ${x.result||'미입력'}\n- 역량: ${(x.competencies||[]).join(', ')||'미입력'}`).join('\n'),dna=s.assessments?.careerDNA||{},profile=s.artifacts?.careerDNAProfile||{},values=[...new Set(profile.valueClues||((dna.balance?.answers||[]).filter(Boolean).map(x=>x.value)))].slice(0,5),anchors=(profile.careerAnchorTop||dna.careerAnchor?.ranking||[]).slice(0,3).map(x=>x.name||x.code).filter(Boolean),via=(profile.viaTop5||dna.viaTop5||[]).slice(0,5),hypothesis=profile.hypothesis?.text||dna.hypothesis?.text||'';return `당신은 대학생의 직무탐색을 돕는 조력자다. 최종 직무를 대신 결정하지 말고, 학생의 실제 경험과 관심 업무를 근거로 탐색할 직무 후보를 만들어라.\n\n[STEP 1 Career DNA · 보조근거]\n중요 가치: ${values.join(', ')||'입력 없음'}\nCareer Anchor TOP: ${anchors.join(', ')||'입력 없음'}\nVIA TOP: ${via.join(', ')||'입력 없음'}\nCareer DNA 가설: ${hypothesis||'입력 없음'}\n※ 위 자기이해 결과는 후보를 넓히는 보조근거이며, 직무를 확정하는 단독 근거로 사용하지 않는다.\n\n[학생이 해보고 싶은 업무]\n${(data.desiredActivities||[]).join(', ')||'아직 선택하지 않음'}\n\n[경험은 없지만 관심 있는 업무]\n${(data.newInterests||[]).join(', ')||'없음'}\n\n[관심 산업]\n${(data.industryInterests||[]).join(', ')||'미정'}\n\n[STEP 2 경험 근거 · 우선근거]\n${evidence||'확인된 경험 없음'}\n\n[규칙]\n1. Holland/RIASEC 유형을 임의로 추정하지 않는다.\n2. Career Anchor·VIA·전공·성격 하나만으로 직무를 정하지 않는다.\n3. 실제 경험·행동 Evidence와 학생이 선택한 업무활동을 가장 우선한다.\n4. 후보는 4~5개만 제안하되 업무 성격이 서로 겹치지 않게 한다.\n5. 각 후보마다 '어떤 일인가 / 경험·행동 근거 / 관심 근거 / 가능한 산업 / 아직 확인할 것'을 구분한다.\n6. 같은 직무가 산업별로 어떻게 달라지는지 예를 들어 설명한다.\n7. 특정 산업, 특히 에너지 산업을 기본값으로 두지 않는다. 학생의 관심 산업이 미정이면 여러 산업 예시를 제안한다.\n8. 적합도 %, 추천순위, 취업성공확률을 만들지 않는다.\n9. 학생이 하지 않은 경험이나 역량을 만들어내지 않는다.\n10. 실제 Task·요구기술·기업조건은 STEP 4에서 공식자료로 확인해야 한다고 표시한다.\n\n[출력]\n1. 먼저 표로 제시한다. 열: 직무 후보 | 직무군 | 어떤 일인가 | 연결되는 경험·행동 | 관심 근거 | 가능한 산업 2~4개 | STEP 4에서 확인할 것\n2. 표 다음에는 아래 형식의 유효한 JSON 코드블록을 반드시 함께 출력한다. 키 이름을 바꾸거나 추가하지 않는다.\n{\"candidates\":[{\"title\":\"직무명\",\"family\":\"직무군\",\"summary\":\"1~2문장 설명\",\"evidence\":\"STEP 2 경험·행동 근거\",\"why\":\"학생 관심 근거\",\"industries\":[\"산업1\",\"산업2\"],\"unknowns\":\"STEP 4에서 확인할 것\"}]}\n3. 마지막에 학생이 비교할 질문 2개만 제시하라.`}
function block(n,title,desc,body){return `<div class="hr"></div><div class="block"><div class="moduleHead"><span>${n}</span><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`}
function choice(type,label,on,ctx){return `<label class="choiceTile"><input type="checkbox" data-choice="${type}" value="${esc(label,ctx)}" ${on?'checked':''}><span>${esc(label,ctx)}</span></label>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}
function parseJsonBlock(raw=''){const text=String(raw).trim(),fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i),source=(fenced?.[1]||text).trim();try{return JSON.parse(source)}catch{}const s=source.indexOf('{'),e=source.lastIndexOf('}');if(s>=0&&e>s){try{return JSON.parse(source.slice(s,e+1))}catch{}}const a=source.indexOf('['),b=source.lastIndexOf(']');if(a>=0&&b>a){try{return JSON.parse(source.slice(a,b+1))}catch{}}return null}
function splitList(v){return [...new Set(String(v||'').split(/[,/|]/).map(x=>x.trim()).filter(Boolean))]}
function slug(x=''){return String(x).trim().replace(/[^0-9A-Za-z가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'undecided'}
function esc(x,ctx){return ctx.escapeHtml(String(x??''))}
async function copy(text,ctx){try{await navigator.clipboard.writeText(text);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}
function styleBlock(){return `<style>
.jobExplorerV3 .moduleHead{display:flex;gap:11px;align-items:flex-start}.jobExplorerV3 .moduleHead>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#eef3ff;color:#3152c9;font-weight:950;flex:0 0 auto}.jobExplorerV3 .moduleHead h3{margin:2px 0 3px}.jobExplorerV3 .moduleHead p{margin:0;color:#667085;font-size:12px;line-height:1.5}.choiceTiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.choiceTile{display:flex;align-items:center;gap:8px;border:1px solid #e3e8f2;border-radius:13px;padding:11px;background:#fff;font-size:13px;font-weight:800}.choiceTile:has(input:checked){border-color:#8fa5ff;background:#f4f6ff;color:#244bd7}.inlineAdd{display:flex;gap:8px}.interestPill button{border:0;background:transparent;color:#98a2b3;font-size:16px}.evidenceGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.actionEvidence{border:1px solid #e3e8f2;border-radius:13px;padding:12px;background:#fbfcff;font-size:13px;line-height:1.55}.targetRow{display:grid;grid-template-columns:150px 1fr 1fr;gap:9px;align-items:center;border:1px solid #e3e8f2;border-radius:15px;padding:12px;margin:9px 0}.targetRow b,.targetRow span{display:block}.targetRow span{font-size:11px;color:#667085;margin-top:2px}@media(max-width:700px){.choiceTiles,.evidenceGrid{grid-template-columns:1fr 1fr}.targetRow{grid-template-columns:1fr}.inlineAdd{flex-direction:column}}@media(max-width:460px){.choiceTiles,.evidenceGrid{grid-template-columns:1fr}}
</style>`}

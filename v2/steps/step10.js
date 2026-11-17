import {readField,READABLE_STYLES} from './readableResults.js';
import {printApplicationDocument,downloadApplicationText,escapeDocumentText} from './applicationExport.js';
export async function render(ctx){
  const displayStep=ctx.displayStep??10,injeCompact=displayStep!==10,prevEvidenceStep=injeCompact?'STEP 5 GAP Match 또는 STEP 8 Resume Lab의 근거 카드 입력란':'STEP 8';
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0],allAssets=s.artifacts?.careerAssets?.assets||[],assets=allAssets.filter(a=>(a.evidenceLevel||legacyLevel(a.strength))!=='없음'),resume=s.artifacts?.resumeLab||{items:[]},resumeItems=(resume.items||[]).filter(x=>x.status==='final-ready'||(x.factChecked&&x.assetVerified)),experiences=s.assessments?.experienceCompetency?.experiences||[],saved=s.artifacts?.coverLetterLab||{questions:[]},data=structuredClone(saved),root=document.getElementById('stepRoot');
  data.questions=data.questions||[];let editingQuestionId=null;
  // INJE: STEP 3 경험은 저장 원본을 수정하지 않고 화면의 작성 소재로만 활용합니다.
  const guidedAssets=injeCompact&&!assets.length
    ?experiences.filter(e=>e&&e.id&&String(e.title||e.name||'').trim()).map(e=>({
      id:'inje_step3_'+e.id,experienceId:e.id,experienceTitle:e.title||e.name,
      requirementId:'',requirement:'STEP 3에서 기록한 경험',evidenceLevel:'경험 기록',
      factCheck:e.factChecked?'검증완료':'확인 필요',
      sourceExperienceFactChecked:!!e.factChecked,proof:e.action||'',fact:e.result||e.evidence||''
    })):assets;

  root.innerHTML=`<section class="card jobfitReadable coverReadable">${READABLE_STYLES}
    <div class="sectionHead"><div><div class="kicker">STEP ${displayStep}</div><h2>${injeCompact?'자기소개서 작성':'Cover Letter Lab'}</h2><p>${injeCompact?'기업의 질문을 이해하고 내 경험을 골라 직접 답변을 완성하세요.':'문항 평가의도 → JD Requirement → Career Asset을 연결한 뒤, 학생의 실제 답변으로 자기소개서를 만듭니다.'}</p></div><span class="badge">10주차</span></div><div class="progress"><span style="width:79%"></span></div>
    ${posting?`<div class="callout info"><b>${injeCompact?'지원할 기업·직무':'Target'}</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}
    <div class="block"><h3>0. ${injeCompact?'작성 현황':'Cover Letter Readiness'}</h3><div id="coverDashboard"></div></div>
    ${resumeReuseBlock(resumeItems,ctx)}

    <div class="hr"></div><div class="block"><h3>1. ${injeCompact?'자기소개서 질문 이해하기':'문항 → 평가의도 → JD 연결'}</h3><div class="grid2">${area('question','자기소개서 문항','','문항 전체를 그대로 입력')}${area('intent',injeCompact?'기업이 확인하려는 내용':'내가 해석한 평가의도','','예: 지원 직무를 이해하고 관련 경험이 있는가?')}</div><div class="grid2" style="margin-top:12px">${selectReq('requirementId',injeCompact?'채용공고에서 요구하는 업무·역량':'관련 JD Requirement',posting?.requirements||[],injeCompact)}${area('claim',injeCompact?'가장 말하고 싶은 내용':'이 문항에서 증명할 핵심주장','','예: 고객 리뷰를 분류해 구매 기준을 비교한 경험이 있다')}</div><div id="questionGuard" class="callout info">${injeCompact?'채용공고에서 요구하는 일과 내 경험이 맞는지 확인합니다.':'JD Requirement와 Career Asset을 연결하면 정합성을 확인합니다.'}</div></div>

    <div class="hr"></div><div class="block"><h3>2. ${injeCompact?'자기소개서에 사용할 경험 선택':'사용할 Career Asset 선택'}</h3><p class="help">${injeCompact?'질문에 맞는 실제 경험을 1~2개 고르세요. 경험이 여러 개라도 억지로 섞을 필요는 없습니다.':'원칙적으로 문항당 가장 강한 1~2개 Evidence만 사용합니다. 경험을 많이 섞는 것이 좋은 자소서는 아닙니다.'}</p><div id="assetChecks">${guidedAssets.length?guidedAssets.map(a=>`<label class="checkRow"><input type="checkbox" data-asset="${a.id}"><div><b>${esc(a.experienceTitle,ctx)}</b><span>${esc(a.requirement,ctx)} · ${esc(a.evidenceLevel||legacyLevel(a.strength),ctx)} · ${esc(a.factCheck||'검증상태 미정',ctx)}</span></div></label>`).join(''):(injeCompact?'<div class="callout warn"><b>아직 불러올 경험이 없습니다.</b><br>STEP 3에서 경험을 기록하거나 STEP 8에서 이력서 경험을 확인하세요. 아래에 직접 입력하면 초안으로 저장할 수도 있습니다.</div>':`<div class="callout warn">${prevEvidenceStep}에서 사용 가능한 Career Asset을 먼저 만들어 주세요.</div>`)}</div><div id="assetGuard" class="callout info">${injeCompact?'경험을 선택하면 사실 여부와 직무 연결을 확인합니다.':'Career Asset을 선택하면 사실검증·Requirement 연결을 확인합니다.'}</div><div class="actions"><button class="btn secondary" id="copyPrompt">${injeCompact?'AI에게 경험 질문받기 · 질문문 복사':'AI Experience Interview 프롬프트 복사'}</button></div></div>

    <div class="hr"></div><div class="block"><h3>3. ${injeCompact?'내 경험으로 자기소개서 작성하기':'내 답변에서 초안 만들기'}</h3><div class="grid2">${area('rawAnswer',injeCompact?'내가 실제로 한 일 · 직접 답변':'내 원래 답변 · Raw Voice','','언제, 무슨 일을, 왜, 어떻게 했고 결과는 어땠나요?')}${area('structure',injeCompact?'답변 흐름 메모':'구조화 메모','','핵심 내용 → 상황 → 내 행동과 이유 → 결과·근거 → 지원 직무 연결')}</div><div class="field" style="margin-top:12px"><label>${injeCompact?'AI가 정리한 초안':'AI 초안'}</label><textarea id="draft" rows="8" placeholder="AI가 구조화한 초안. 최종본이 아닙니다."></textarea></div><div class="field" style="margin-top:12px"><label><b>학생이 수정한 최종 답변</b></label><textarea id="finalAnswer" rows="10" placeholder="AI 초안을 사실에 맞게 수정합니다. 내가 하지 않은 일이나 확인되지 않은 수치는 삭제하세요."></textarea><p class="help">${injeCompact?'사실 확인을 마친 최종 답변만 다음 단계에 활용합니다.':'이 내용이 Fact Check 완료 후 포트폴리오에 전달됩니다.'} 작성한 문항은 아래 목록에서 다시 수정할 수 있습니다.</p></div><label class="checkRow"><input type="checkbox" id="factChecked"><div><b>${injeCompact?'작성 내용 사실 확인':'Cover Letter Fact Check'}</b><span>${injeCompact?'내가 한 일·수치·결과가 실제 경험과 일치하며 과장하지 않았습니다.':'경험·수치·역할·결과가 선택한 Career Asset 및 Raw Voice와 일치합니다.'}</span></div></label><div class="actions"><button class="btn primary" id="addQuestion">문항 저장</button><button type="button" class="btn secondary hidden" id="cancelQuestionEdit">수정 취소</button></div><div class="status" id="status"></div></div>

    <div class="block"><h3>4. 저장한 문항 · 수정 및 개별 저장</h3><p class="help">각 문항의 최종답변을 수정하거나 검증된 문항만 개별 PDF로 저장할 수 있습니다. 검증 전 초안은 별도 텍스트 파일로 보관할 수 있습니다.</p><div class="actions"><button type="button" class="btn secondary" id="printAllCovers">검증 완료 문항 전체 PDF</button><button type="button" class="btn secondary" id="downloadAllCovers">문항 전체 TXT 백업</button></div><div id="questionList"></div></div><div class="actions"><button class="btn primary" id="saveAll">${injeCompact?'자기소개서 작성 내용 저장':'Cover Letter Lab 저장'}</button><button class="btn secondary" id="nextStep">STEP ${displayStep+(injeCompact?2:1)} ${injeCompact?'면접 준비':'Interview Lab'} →</button></div>
  <style>.coverReadable .jfDraftText{white-space:pre-wrap;font-size:14px;line-height:1.85;overflow-wrap:anywhere;word-break:keep-all}.coverReadable .jfResultBox>.jfReadFields{margin-top:12px}.coverReadable .jfReadField{min-width:0}@media(max-width:760px){.coverReadable .grid2,.coverReadable .grid3{grid-template-columns:minmax(0,1fr)}} </style></section>`;

  renderAll();wireResumeReuse();document.querySelectorAll('[data-asset]').forEach(x=>x.addEventListener('change',()=>{enforceAssetLimit(x);renderGuards()}));document.getElementById('requirementId').addEventListener('change',renderGuards);document.getElementById('manualRequirement')?.addEventListener('input',renderGuards);document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));document.getElementById('addQuestion').addEventListener('click',addQuestion);document.getElementById('cancelQuestionEdit').addEventListener('click',cancelQuestionEdit);document.getElementById('saveAll').addEventListener('click',()=>{persist();status('자기소개서 작업을 저장했습니다.');});document.getElementById('nextStep').addEventListener('click',()=>{persist();ctx.navigate(11)});

  document.getElementById('printAllCovers')?.addEventListener('click',()=>{
    const finals=data.questions.filter(isQuestionReady);
    if(!finals.length){status(injeCompact?'사실 확인을 마친 최종 답변이 없습니다. 답변을 완성하고 확인한 뒤 PDF를 저장하세요.':'Fact Check 완료 문항이 없습니다. 문항을 검증한 뒤 PDF로 출력하세요.');return;}
    printApplicationDocument('자기소개서',coverPrintHtml(finals),ctx.toast);
  });
  document.getElementById('downloadAllCovers')?.addEventListener('click',()=>{
    if(!data.questions.length){status('저장된 문항이 없습니다.');return;}
    downloadApplicationText('JOBFIT_자기소개서_전체',data.questions.map((q,i)=>coverText(q,i)).join('\n\n---\n\n'),ctx.toast);
  });
  function isQuestionReady(q){return !!q&&(q.status==='final-ready'||(q.factChecked&&q.assetVerified&&q.requirementAligned))&&(!injeCompact||!!String(q.finalAnswer||'').trim());}
  function coverText(q,index){return '문항 '+(index+1)+(isQuestionReady(q)?(injeCompact?' · 최종 완성':' · Fact Check 완료'):(injeCompact?' · 초안/확인 필요':' · 초안/검증필요'))+'\n'+(q.question||'')+'\n\n'+(q.finalAnswer||q.draft||q.rawAnswer||'');}
  function coverPrintHtml(items){
    return '<h1>자기소개서</h1>'+items.map((q,i)=>'<section class="docItem"><h2>문항 '+(i+1)+'</h2><p>'+escapeDocumentText(q.question||'')+'</p><p class="docMeta">Fact Check 완료 · '+escapeDocumentText(q.company||posting?.company||'')+' / '+escapeDocumentText(q.jobTitle||posting?.jobTitle||'')+'</p><div class="docBody">'+escapeDocumentText(q.finalAnswer||q.draft||q.rawAnswer||'')+'</div></section>').join('');
  }
  function renderAll(){renderDashboard();renderQuestions();renderGuards()}
  function wireResumeReuse(){
    const btn=document.getElementById('loadResumeEvidence');if(!btn)return;
    btn.addEventListener('click',()=>{
      const id=document.getElementById('resumeEvidenceSource')?.value||'',item=resumeItems.find(x=>x.id===id);
      if(!item){status('STEP 8에서 불러올 Final Ready 이력서 경험을 선택하세요.');return}
      const asset=allAssets.find(x=>x.id===item.assetId);
      if(!asset){status('선택한 이력서 경험의 Career Asset을 찾지 못했습니다. STEP 8 연결을 확인하세요.');return}
      document.querySelectorAll('[data-asset]').forEach(x=>x.checked=x.dataset.asset===asset.id);
      const req=document.getElementById('requirementId');if(req&&asset.requirementId&&[...req.options].some(o=>o.value===asset.requirementId))req.value=asset.requirementId;
      const claim=document.getElementById('claim');if(claim&&!claim.value)claim.value=item.finalBullet||item.aiBullet||item.rawBullet||asset.requirement||'';
      const exp=experiences.find(x=>x.id===asset.experienceId)||{};
      const raw=document.getElementById('rawAnswer');if(raw&&!raw.value)raw.value=exp.rawVoice||uniqueText([exp.action,exp.result,exp.evidence,asset.proof,asset.fact]);
      const structure=document.getElementById('structure');if(structure&&!structure.value)structure.value=coverStructureFromResume(item,asset,exp);
      renderGuards();status('STEP 8의 이력서 경험과 원경험을 불러왔습니다. 문항과 평가의도만 먼저 확인한 뒤 필요한 내용을 보완하세요.');
    });
  }
  function selectedAssets(){const ids=[...document.querySelectorAll('[data-asset]:checked')].map(x=>x.dataset.asset);return guidedAssets.filter(a=>ids.includes(a.id))}
  function enforceAssetLimit(changed){const checked=[...document.querySelectorAll('[data-asset]:checked')];if(checked.length>2){changed.checked=false;ctx.toast('문항당 Career Asset은 최대 2개를 권장·허용합니다.');}}
  function alignment(){const sel=selectedAssets(),reqId=v('requirementId'),weak=sel.filter(a=>!isAssetVerified(a)),matched=reqId&&reqId!=='__manual'?sel.filter(a=>a.requirementId===reqId):[];return {sel,reqId,weak,matched,aligned:!!reqId&&reqId!=='__manual'&&matched.length>0&&weak.length===0&&sel.length<=2}}
  function renderGuards(){
    if(!injeCompact){const a=alignment(),assetBox=document.getElementById('assetGuard'),qBox=document.getElementById('questionGuard');if(!a.sel.length){assetBox.className='callout info';assetBox.textContent='Career Asset을 선택하면 사실검증·Requirement 연결을 확인합니다.';}else if(a.weak.length){assetBox.className='callout warn';assetBox.innerHTML=`<b>Fact Check 필요</b><br>${a.weak.map(x=>esc(x.experienceTitle,ctx)).join(', ')}의 Career Asset 또는 원경험 Fact Check가 완료되지 않았습니다.`;}else if(a.reqId&&!a.matched.length){assetBox.className='callout warn';assetBox.innerHTML='<b>Requirement 연결 불일치</b><br>선택한 Career Asset 중 현재 JD Requirement를 직접 연결한 자산이 없습니다. 다른 자산을 선택하거나 연결 논리를 다시 확인하세요.';}else{assetBox.className='callout good';assetBox.innerHTML='<b>선택 Evidence 확인</b><br>선택한 Career Asset의 사실검증 및 JD Requirement 연결이 확인되었습니다.';}if(!a.reqId){qBox.className='callout info';qBox.textContent='관련 JD Requirement를 선택하세요.';}else if(a.matched.length){qBox.className='callout good';qBox.textContent='문항의 핵심주장을 실제 JD Requirement와 Career Asset Evidence에 연결할 수 있습니다.';}else{qBox.className='callout warn';qBox.textContent='선택한 JD Requirement와 연결되는 Career Asset Evidence가 아직 없습니다.';}return;}
    const a=alignment(),assetBox=document.getElementById('assetGuard'),qBox=document.getElementById('questionGuard');
    const wrap=document.getElementById('manualRequirementWrap');if(wrap)wrap.hidden=a.reqId!=='__manual';
    if(!a.sel.length){assetBox.className='callout info';assetBox.textContent='선택할 경험이 없으면 아래에서 먼저 실제로 한 일을 입력하고 초안으로 저장할 수 있습니다. 최종 완성 전에는 경험의 근거를 확인해야 합니다.';}
    else if(a.weak.length){assetBox.className='callout warn';assetBox.textContent='선택한 경험의 사실 확인이 아직 끝나지 않았습니다. 먼저 STEP 3의 경험과 수치·결과를 대조하세요.';}
    else if(a.reqId&&a.reqId!=='__manual'&&!a.matched.length){assetBox.className='callout warn';assetBox.textContent='선택한 경험과 채용공고의 요구사항이 아직 직접 연결되지 않았습니다. 초안 작성은 가능합니다.';}
    else {assetBox.className='callout good';assetBox.textContent='선택한 경험의 사실 확인 상태를 확인했습니다. 지원 직무와의 연결도 살펴보세요.';}
    if(!a.reqId){qBox.className='callout info';qBox.textContent='채용공고에서 필요한 업무·역량을 골라 주세요. 목록이 없으면 직접 입력하세요.';}
    else if(a.reqId==='__manual'){qBox.className=v('manualRequirement')?'callout warn':'callout info';qBox.textContent=v('manualRequirement')?'직접 입력한 업무·역량입니다. 채용공고 원문과 비교하기 전까지 초안으로 보관됩니다.':'공고에서 요구하는 업무·역량을 아래에 적어 주세요.';}
    else if(a.matched.length){qBox.className='callout good';qBox.textContent='선택한 경험이 채용공고의 업무·역량과 연결되어 있습니다.';}
    else{qBox.className='callout warn';qBox.textContent='공고의 업무·역량에 해당하는 경험이 있는지 확인하세요. 없으면 초안으로 먼저 작성할 수 있습니다.';}
  }
  function renderDashboard(){const box=document.getElementById('coverDashboard'),finals=data.questions.filter(isQuestionReady).length,drafts=data.questions.length-finals;box.innerHTML=`<div class="grid3"><div class="miniCard"><b>저장 문항</b><span>${data.questions.length}개</span></div><div class="miniCard"><b>Final Ready</b><span>${finals}개</span></div><div class="miniCard"><b>Draft / 검증필요</b><span>${drafts}개</span></div></div>`;}
  function addQuestion(){
    const q=v('question'),a=alignment();
    if(!q){status('자기소개서 문항을 입력하세요.');return;}
    if(!v('intent')){status('평가의도를 먼저 작성하세요.');return;}
    if(!a.reqId){status(injeCompact?'채용공고에서 요구하는 업무·역량을 선택하거나 직접 입력하세요.':'관련 JD Requirement를 선택하세요.');return;}if(injeCompact&&a.reqId==='__manual'&&!v('manualRequirement')){status('공고에서 요구하는 업무·역량을 직접 입력하세요.');return;}
    if(!a.sel.length&&!injeCompact){status('사용할 Career Asset을 1개 이상 선택하세요.');return;}
    if(a.sel.length>2){status('Career Asset은 최대 2개만 선택하세요.');return;}
    if(!v('rawAnswer')){status('AI 초안보다 학생의 Raw Voice 또는 인터뷰 답변을 먼저 남기세요.');return;}
    const r=a.reqId==='__manual'?{id:'__manual',text:v('manualRequirement')}:(posting?.requirements||[]).find(x=>x.id===a.reqId);
    const factChecked=document.getElementById('factChecked').checked,assetVerified=a.weak.length===0,requirementAligned=a.matched.length>0,statusValue=factChecked&&assetVerified&&requirementAligned&&(!injeCompact||!!v('finalAnswer'))?'final-ready':'draft';
    const fields={postingId:posting?.id||'',company:posting?.company||'',jobTitle:posting?.jobTitle||'',question:q,intent:v('intent'),requirementId:r?.id||'',requirement:r?.text||'',claim:v('claim'),assetIds:a.sel.map(x=>x.id),rawAnswer:v('rawAnswer'),structure:v('structure'),draft:v('draft'),finalAnswer:v('finalAnswer'),factChecked,assetVerified,requirementAligned,status:statusValue};
    const updating=!!editingQuestionId;
    if(updating){
      const i=data.questions.findIndex(x=>x.id===editingQuestionId);
      if(i<0){status('수정할 문항을 찾지 못했습니다.');return;}
      data.questions[i]={...data.questions[i],...fields,updatedAt:new Date().toISOString()};
    }else{
      data.questions.push({id:'cl_'+Date.now(),...fields,createdAt:new Date().toISOString()});
    }
    persist();cancelQuestionEdit();renderAll();
    status((updating?'수정':'추가')+' 문항을 '+(statusValue==='final-ready'?'Final Ready':'Draft · 검증필요')+' 상태로 저장했습니다.');
  }
  function editQuestion(id){
    const q=data.questions.find(x=>x.id===id);if(!q)return;
    editingQuestionId=id;
    for(const key of ['question','intent','requirementId','claim','rawAnswer','structure','draft','finalAnswer']){
      const el=document.getElementById(key);if(el)el.value=q[key]||'';
    }
    document.querySelectorAll('[data-asset]').forEach(x=>x.checked=(q.assetIds||[]).includes(x.dataset.asset));
    if(injeCompact&&q.requirementId==='__manual'){const manual=document.getElementById('manualRequirement');if(manual)manual.value=q.requirement||'';}
    document.getElementById('factChecked').checked=false;
    document.getElementById('addQuestion').textContent='문항 수정 저장';
    document.getElementById('cancelQuestionEdit').classList.remove('hidden');
    renderGuards();
    document.getElementById('question').scrollIntoView({behavior:'smooth',block:'center'});
    status('저장 문항을 불러왔습니다. 수정 후 사실을 다시 확인하고 저장하세요.');
  }
  function cancelQuestionEdit(){
    editingQuestionId=null;
    clear(['question','intent','claim','rawAnswer','structure','draft','finalAnswer','manualRequirement']);
    document.getElementById('requirementId').value='';
    document.querySelectorAll('[data-asset]').forEach(x=>x.checked=false);
    document.getElementById('factChecked').checked=false;
    document.getElementById('addQuestion').textContent='문항 저장';
    document.getElementById('cancelQuestionEdit').classList.add('hidden');
    renderGuards();
  }
  function renderQuestions(){
    const box=document.getElementById('questionList');if(!box)return;
    if(!data.questions.length){box.innerHTML='<div class="placeholder"><b>아직 저장한 자소서 문항이 없습니다.</b>'+(injeCompact?'자기소개서 질문을 입력하고 경험을 골라 답변을 작성하세요.':'문항 → 평가의도 → JD Requirement → Career Asset 순서로 연결하세요.')+'</div>';return;}
    box.innerHTML=data.questions.map((q,i)=>{
      const used=(q.assetIds||[]).map(id=>(guidedAssets.find(a=>a.id===id)||allAssets.find(a=>a.id===id))?.experienceTitle).filter(Boolean);
      const ready=isQuestionReady(q);
      return '<div class="listCard jfResultBox"><div class="listHead"><div><span class="rankTag">문항 '+(i+1)+'</span><h3>'+esc(q.question,ctx)+'</h3></div><span class="scoreChip">'+(ready?(injeCompact?'최종 완성':'Final Ready'):(injeCompact?'초안 · 확인 필요':'Draft · 검증필요'))+'</span></div>'+
        '<div class="jfReadFields">'+readField(injeCompact?'기업이 확인하려는 내용':'평가의도',q.intent,ctx)+readField(injeCompact?'채용공고 요구 업무·역량':'JD Requirement',q.requirement,ctx)+readField(injeCompact?'내가 강조할 내용':'핵심 주장',q.claim,ctx)+readField(injeCompact?'사용한 경험':'사용 Evidence',used.join(' / '),ctx)+'</div>'+
        '<div class="jfReadFields"><div class="jfReadField"><b>'+(q.finalAnswer?'학생 최종 답변':'AI 초안 · 원문 그대로')+'</b><div class="jfDraftText">'+esc(q.finalAnswer||q.draft||'아직 입력되지 않았습니다.',ctx)+'</div></div></div>'+
        '<div class="actions"><button type="button" class="btn secondary smallBtn" data-cover-edit="'+esc(q.id,ctx)+'">수정</button><button type="button" class="btn secondary smallBtn" data-cover-pdf="'+esc(q.id,ctx)+'">문항 PDF</button><button type="button" class="btn outline smallBtn" data-cover-txt="'+esc(q.id,ctx)+'">문항 TXT</button><button class="btn danger smallBtn" data-del="'+esc(q.id,ctx)+'">삭제</button></div></div>';
    }).join('');
    box.querySelectorAll('[data-cover-edit]').forEach(b=>b.addEventListener('click',()=>editQuestion(b.dataset.coverEdit)));
    box.querySelectorAll('[data-cover-pdf]').forEach(b=>b.addEventListener('click',()=>{
      const q=data.questions.find(x=>x.id===b.dataset.coverPdf);
      if(!isQuestionReady(q)){status(injeCompact?'최종 답변과 사실 확인이 끝난 문항만 PDF로 저장됩니다. 초안은 텍스트 파일로 보관하세요.':'최종 PDF는 Fact Check 완료 문항만 가능합니다. 검증 전 문항은 TXT로 별도 저장하세요.');return;}
      printApplicationDocument('자기소개서 · '+(q.company||'개별 문항'),coverPrintHtml([q]),ctx.toast);
    }));
    box.querySelectorAll('[data-cover-txt]').forEach(b=>b.addEventListener('click',()=>{
      const i=data.questions.findIndex(x=>x.id===b.dataset.coverTxt);if(i<0)return;
      downloadApplicationText('JOBFIT_자소서_문항'+(i+1),coverText(data.questions[i],i),ctx.toast);
    }));
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
      if(!window.confirm('선택한 자기소개서 문항을 삭제할까요?'))return;
      if(editingQuestionId===b.dataset.del)cancelQuestionEdit();
      data.questions=data.questions.filter(x=>x.id!==b.dataset.del);persist();renderAll();
    }));
  }
  function buildPrompt(){const a=alignment(),r=a.reqId==='__manual'?{text:v('manualRequirement')}:(posting?.requirements||[]).find(x=>x.id===a.reqId);return `지금부터 자기소개서를 대신 써주는 작가가 아니라 내 경험을 검증하고 꺼내는 취업 인터뷰어가 되어줘.\n\n[기업/직무]\n${posting?`${posting.company} / ${posting.jobTitle}`:'미등록'}\n\n[자기소개서 문항]\n${v('question')||'미입력'}\n\n[내가 해석한 평가의도]\n${v('intent')||'미입력'}\n\n[관련 JD Requirement]\n${JSON.stringify(r||{},null,2)}\n\n[내가 증명하려는 핵심주장]\n${v('claim')||'미입력'}\n\n[선택한 Career Asset]\n${JSON.stringify(a.sel,null,2)}\n\n규칙:\n1. 먼저 문항 평가의도와 선택한 JD Requirement 연결이 타당한지 점검한다.\n2. 선택한 Career Asset 중 해당 Requirement에 직접 연결된 자산이 있는지 확인한다.\n3. Career Asset의 Evidence 수준과 사실검증 상태를 확인한다.\n4. 경험은 최대 1~2개로 제한하고 최종 선택은 나에게 묻는다.\n5. 경험이 정해지면 한 번에 질문 하나씩 하며 내가 직접 한 Action, Reasoning, Result, Evidence를 확인한다.\n6. 내가 말하지 않은 수치·성과·역할은 만들지 않는다.\n7. Evidence가 약하거나 Requirement 연결이 약하면 과장하지 말고 GAP라고 말한다.\n8. 충분한 답변이 모이기 전에는 완성문을 쓰지 않는다.\n9. 마지막에 먼저 '핵심주장 → 상황 → Action → Reasoning → Result/Evidence → JD 연결' 구조를 보여주고 내가 확인하면 초안을 작성한다.\n10. 기업 칭찬·상투어를 자동 추가하지 않는다.\n11. 초안 끝에 Career Asset 원자료와 다시 확인해야 할 표현을 표시한다.\n\n첫 질문부터 시작해줘.`}
  function persist(){ctx.saveState({artifacts:{coverLetterLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function clear(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}

function resumeReuseBlock(items,ctx){
  if(!items.length)return '<div class="hr"></div><div class="block"><h3>STEP 8 → STEP 9 연결</h3><div class="callout info"><b>같은 경험을 다시 입력하지 않습니다.</b><br>STEP 8에서 Final Ready 이력서 경험을 먼저 만들면 여기서 Career Asset·원경험을 자동으로 불러올 수 있습니다.</div></div>';
  return '<div class="hr"></div><div class="block" id="resumeReuse"><h3>STEP 8 → STEP 9 · 이력서 경험 불러오기</h3>'
    +'<p class="help">자기소개서 문항과 평가의도는 새로 확인해야 하지만, 같은 경험의 Action·Result·Evidence는 다시 입력하지 않습니다.</p>'
    +'<div class="grid2"><div class="field"><label>Final Ready 이력서 경험</label><select class="jfLongSelect" id="resumeEvidenceSource"><option value="">선택</option>'
    +items.map(function(x){return '<option value="'+esc(x.id,ctx)+'">'+esc((x.assetTitle||x.section||'경험')+' · '+(x.evidenceLevel||''),ctx)+'</option>';}).join('')
    +'</select></div><div class="field"><label>&nbsp;</label><button type="button" class="btn primary" id="loadResumeEvidence">이 경험 불러오기</button></div></div>'
    +'<div class="callout good"><b>자동 연결</b><br>Career Asset · JD Requirement · STEP 3 Raw Voice/Action · Result/Evidence · 구조화 메모<br><b>학생이 직접 확인</b> 자기소개서 문항 · 평가의도 · 최종 주장 · AI 초안 · Fact Check</div></div>';
}
function coverStructureFromResume(item,asset,exp){
  var rows=[
    ['핵심주장',item.finalBullet||item.aiBullet||item.rawBullet||''],
    ['상황·과제',exp.challenge||exp.situation||exp.context||''],
    ['Action',exp.action||asset.proof||''],
    ['Reasoning',exp.reasoning||exp.why||''],
    ['Result / Evidence',uniqueText([exp.result,exp.evidence,asset.fact])],
    ['JD 연결',asset.requirement||item.requirement||'']
  ].filter(function(x){return String(x[1]||'').trim();});
  return rows.map(function(x){return x[0]+': '+String(x[1]).trim();}).join('\n');
}
function uniqueText(values){
  return [...new Set((values||[]).map(function(x){return String(x||'').trim();}).filter(Boolean))].join(' · ');
}

function isAssetVerified(a){return !!a&&a.factCheck==='검증완료'&&a.sourceExperienceFactChecked!==false}
function legacyLevel(n){return n>=5?'A · 직접 증거':n>=3?'B · 관련 증거':n>=2?'C · 간접 증거':'없음'}function selectReq(id,label,items,injeCompact=false){
  if(!injeCompact)return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">[${x.level||'미분류'}] ${x.text}</option>`).join('')}</select></div>`;
  return `<div class="field"><label>${label}</label><p class="help">지원 직무에 필요한 일이나 기술입니다. 예: 고객 데이터 분석, 콘텐츠 제작, 엑셀 활용. STEP 5에서 확인한 채용공고를 선택하거나 직접 입력하세요.</p><select id="${id}"><option value="">선택하세요</option>${items.map(x=>`<option value="${escReq(x.id)}">${escReq(x.text||'내용 확인 필요')}</option>`).join('')}<option value="__manual">목록에 없음 · 직접 입력하기</option></select><div id="manualRequirementWrap" hidden style="margin-top:10px"><label for="manualRequirement">공고에 적힌 업무·역량 직접 입력</label><textarea id="manualRequirement" placeholder="예: 고객 반응 조사와 SNS 콘텐츠 제작"></textarea><p class="help">직접 입력한 내용은 원문과 대조하기 전까지 초안으로 저장됩니다.</p></div></div>`;
}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function escReq(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('자소서 인터뷰 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

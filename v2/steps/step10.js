import {readField,READABLE_STYLES} from './readableResults.js';
import {printApplicationDocument,downloadApplicationText,escapeDocumentText} from './applicationExport.js';
export async function render(ctx){
  const displayStep=ctx.displayStep??10,injeCompact=displayStep!==10,prevEvidenceStep=injeCompact?'STEP 5 GAP Match 또는 STEP 8 Resume Lab의 근거 카드 입력란':'STEP 8';
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0],allAssets=s.artifacts?.careerAssets?.assets||[],assets=allAssets.filter(a=>(a.evidenceLevel||legacyLevel(a.strength))!=='없음'),resume=s.artifacts?.resumeLab||{items:[]},resumeItems=(resume.items||[]).filter(x=>x.status==='final-ready'||(x.factChecked&&x.assetVerified)),experiences=s.assessments?.experienceCompetency?.experiences||[],saved=s.artifacts?.coverLetterLab||{questions:[]},data=structuredClone(saved),root=document.getElementById('stepRoot');
  data.questions=data.questions||[];let editingQuestionId=null;
  let practiceMode=injeCompact?(data.practiceMode===true||(!posting&&data.practiceMode!==false)):false;let selectedReviewId='';
  // INJE: STEP 3 경험은 저장 원본을 수정하지 않고 화면의 작성 소재로만 활용합니다.
  const guidedAssets=injeCompact
    ?[...assets,...experiences.filter(e=>e&&e.id&&String(e.title||e.name||'').trim()&&!assets.some(a=>a.experienceId===e.id)).map(e=>({
      id:'inje_step3_'+e.id,experienceId:e.id,experienceTitle:e.title||e.name,
      requirementId:'',requirement:'STEP 3에서 기록한 경험',evidenceLevel:'경험 기록',
      factCheck:e.factChecked?'검증완료':'확인 필요',
      sourceExperienceFactChecked:!!e.factChecked,proof:e.action||'',fact:e.result||e.evidence||''
    }))]:assets;

  root.innerHTML=`<section class="card jobfitReadable coverReadable">${READABLE_STYLES}
    <div class="sectionHead"><div><div class="kicker">STEP ${displayStep}</div><h2>${injeCompact?'자기소개서 작성':'Cover Letter Lab'}</h2><p>${injeCompact?'기업의 질문을 이해하고 내 경험을 골라 직접 답변을 완성하세요.':'문항 평가의도 → JD Requirement → Career Asset을 연결한 뒤, 학생의 실제 답변으로 자기소개서를 만듭니다.'}</p></div><span class="badge">10주차</span></div><div class="progress"><span style="width:79%"></span></div>
    ${injeCompact?coverPracticeModeBlock(practiceMode,esc(data.practiceTargetJob||'',ctx)):''}
    ${posting?`<div id="coverTargetNotice" class="callout info"><b>${injeCompact?'지원할 기업·직무':'Target'}</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}
    <div class="block"><h3>0. ${injeCompact?'작성 현황':'Cover Letter Readiness'}</h3><div id="coverDashboard"></div></div>
    ${resumeReuseBlock(resumeItems,ctx,injeCompact)}

    <div class="hr"></div><div class="block"><h3>1. ${injeCompact?'자기소개서 질문 이해하기':'문항 → 평가의도 → JD 연결'}</h3><div class="grid2">${area('question','자기소개서 문항','','문항 전체를 그대로 입력')}${area('intent',injeCompact?'기업이 확인하려는 내용':'내가 해석한 평가의도','','예: 지원 직무를 이해하고 관련 경험이 있는가?')}</div>${injeCompact?coverQuestionTypeBlock():''}<div class="grid2" style="margin-top:12px">${injeCompact?'<div id="coverRequirementSlot">':''}${selectReq('requirementId',injeCompact?'채용공고에서 요구하는 업무·역량':'관련 JD Requirement',posting?.requirements||[],injeCompact)}${injeCompact?'</div>':''}${area('claim',injeCompact?'가장 말하고 싶은 내용':'이 문항에서 증명할 핵심주장','','예: 고객 리뷰를 분류해 구매 기준을 비교한 경험이 있다')}</div><div id="questionGuard" class="callout info">${injeCompact?'채용공고에서 요구하는 일과 내 경험이 맞는지 확인합니다.':'JD Requirement와 Career Asset을 연결하면 정합성을 확인합니다.'}</div></div>

    <div class="hr"></div><div class="block"><h3>2. ${injeCompact?'자기소개서에 사용할 경험 선택':'사용할 Career Asset 선택'}</h3><p class="help">${injeCompact?'질문에 맞는 실제 경험을 1~2개 고르세요. 경험이 여러 개라도 억지로 섞을 필요는 없습니다.':'원칙적으로 문항당 가장 강한 1~2개 Evidence만 사용합니다. 경험을 많이 섞는 것이 좋은 자소서는 아닙니다.'}</p><div id="assetChecks">${guidedAssets.length?guidedAssets.map(a=>`<label class="checkRow"><input type="checkbox" data-asset="${a.id}"><div><b>${esc(a.experienceTitle,ctx)}</b><span>${esc(a.requirement,ctx)} · ${esc(a.evidenceLevel||legacyLevel(a.strength),ctx)} · ${esc(a.factCheck||'검증상태 미정',ctx)}</span></div></label>`).join(''):(injeCompact?'<div class="callout warn"><b>불러올 경험이 없어도 괜찮습니다.</b><br>STEP 8 없이도 아래에 실제 경험을 직접 입력해 작성할 수 있습니다.</div>':`<div class="callout warn">${prevEvidenceStep}에서 사용 가능한 Career Asset을 먼저 만들어 주세요.</div>`)}</div><div id="assetGuard" class="callout info">${injeCompact?'경험을 선택하면 사실 여부와 직무 연결을 확인합니다.':'Career Asset을 선택하면 사실검증·Requirement 연결을 확인합니다.'}</div><div class="actions"><button class="btn secondary" id="copyPrompt">${injeCompact?'AI에게 경험 질문받기 · 질문문 복사':'AI Experience Interview 프롬프트 복사'}</button></div></div>

    <div class="hr"></div><div class="block"><h3>3. ${injeCompact?'내 경험으로 자기소개서 작성하기':'내 답변에서 초안 만들기'}</h3><div class="grid2">${area('rawAnswer',injeCompact?'내가 실제로 한 일 · 직접 답변':'내 원래 답변 · Raw Voice','','언제, 무슨 일을, 왜, 어떻게 했고 결과는 어땠나요?')}${area('structure',injeCompact?'답변 흐름 메모':'구조화 메모','','핵심 내용 → 상황 → 내 행동과 이유 → 결과·근거 → 지원 직무 연결')}</div><div class="field" style="margin-top:12px"><label>${injeCompact?'AI가 정리한 초안':'AI 초안'}</label><textarea id="draft" rows="8" placeholder="AI가 구조화한 초안. 최종본이 아닙니다."></textarea></div><div class="field" style="margin-top:12px"><label><b>학생이 수정한 최종 답변</b></label><textarea id="finalAnswer" rows="10" placeholder="AI 초안을 사실에 맞게 수정합니다. 내가 하지 않은 일이나 확인되지 않은 수치는 삭제하세요."></textarea><p class="help">${injeCompact?'사실 확인을 마친 최종 답변만 다음 단계에 활용합니다.':'이 내용이 Fact Check 완료 후 포트폴리오에 전달됩니다.'} 작성한 문항은 아래 목록에서 다시 수정할 수 있습니다.</p></div><label class="checkRow"><input type="checkbox" id="factChecked"><div><b>${injeCompact?'작성 내용 사실 확인':'Cover Letter Fact Check'}</b><span>${injeCompact?'내가 한 일·수치·결과가 실제 경험과 일치하며 과장하지 않았습니다.':'경험·수치·역할·결과가 선택한 Career Asset 및 Raw Voice와 일치합니다.'}</span></div></label><div class="actions"><button class="btn primary" id="addQuestion">문항 저장</button><button type="button" class="btn secondary hidden" id="cancelQuestionEdit">수정 취소</button></div><div class="status" id="status"></div></div>

    ${injeCompact?coverAiReviewBlock():''}
    <div class="block"><h3>${injeCompact?'5':'4'}. 저장한 문항 · 수정 및 개별 저장</h3><p class="help">각 문항의 최종답변을 수정하거나 검증된 문항만 개별 PDF로 저장할 수 있습니다. 검증 전 초안은 별도 텍스트 파일로 보관할 수 있습니다.</p><div class="actions"><button type="button" class="btn secondary" id="printAllCovers">${injeCompact?'최종 완성 문항 전체 PDF':'검증 완료 문항 전체 PDF'}</button><button type="button" class="btn secondary" id="downloadAllCovers">${injeCompact?'전체 문항 텍스트 백업':'문항 전체 TXT 백업'}</button></div><div id="questionList"></div></div><div class="actions"><button class="btn primary" id="saveAll">${injeCompact?'자기소개서 작성 내용 저장':'Cover Letter Lab 저장'}</button><button class="btn secondary" id="nextStep">STEP ${displayStep+(injeCompact?2:1)} ${injeCompact?'면접 준비':'Interview Lab'} →</button></div>
  <style>.coverReadable .jfDraftText{white-space:pre-wrap;font-size:14px;line-height:1.85;overflow-wrap:anywhere;word-break:keep-all}.coverReadable .jfResultBox>.jfReadFields{margin-top:12px}.coverReadable .jfReadField{min-width:0}@media(max-width:760px){.coverReadable .grid2,.coverReadable .grid3{grid-template-columns:minmax(0,1fr)}} </style></section>`;

  if(injeCompact)compactInjeCoverUi(root);
  if(injeCompact)simplifyInjeCoverUi(root);
  renderAll();wireResumeReuse();if(injeCompact){wireInjeWritingControls();document.getElementById('coverReviewQuestion')?.addEventListener('change',e=>{selectedReviewId=e.target.value;renderReviewPanel();});}document.querySelectorAll('[data-asset]').forEach(x=>x.addEventListener('change',()=>{enforceAssetLimit(x);renderGuards()}));document.getElementById('requirementId').addEventListener('change',renderGuards);document.getElementById('manualRequirement')?.addEventListener('input',renderGuards);document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));document.getElementById('addQuestion').addEventListener('click',addQuestion);document.getElementById('cancelQuestionEdit').addEventListener('click',cancelQuestionEdit);document.getElementById('saveAll').addEventListener('click',()=>{persist();status('자기소개서 작업을 저장했습니다.');});document.getElementById('nextStep').addEventListener('click',()=>{persist();ctx.navigate(11)});

  document.getElementById('printAllCovers')?.addEventListener('click',()=>{
    const finals=data.questions.filter(isQuestionReady);
    if(!finals.length){status(injeCompact?'사실 확인을 마친 최종 답변이 없습니다. 답변을 완성하고 확인한 뒤 PDF를 저장하세요.':'Fact Check 완료 문항이 없습니다. 문항을 검증한 뒤 PDF로 출력하세요.');return;}
    printApplicationDocument('자기소개서',coverPrintHtml(finals),ctx.toast);
  });
  document.getElementById('downloadAllCovers')?.addEventListener('click',()=>{
    if(!data.questions.length){status('저장된 문항이 없습니다.');return;}
    downloadApplicationText('JOBFIT_자기소개서_전체',data.questions.map((q,i)=>coverText(q,i)).join('\n\n---\n\n'),ctx.toast);
  });
  function isQuestionReady(q){return !!q&&!q.practiceMode&&(q.status==='final-ready'||(q.factChecked&&q.assetVerified&&q.requirementAligned))&&(!injeCompact||!!String(q.finalAnswer||'').trim());}
  function isPracticePrintable(q){return !!(injeCompact&&q?.practiceMode&&q.factChecked&&String(q.finalAnswer||'').trim());}
  function coverText(q,index){return '문항 '+(index+1)+(isQuestionReady(q)?(injeCompact?' · 최종 완성':' · Fact Check 완료'):(injeCompact?' · 초안/확인 필요':' · 초안/검증필요'))+'\n'+(q.question||'')+'\n\n'+(q.finalAnswer||q.draft||q.rawAnswer||'');}
  function coverPrintHtml(items){
    const practice=items.every(q=>q.practiceMode);
    return '<h1>'+(practice?'자기소개서 · 연습용':'자기소개서')+'</h1>'+items.map((q,i)=>'<section class="docItem"><h2>문항 '+(i+1)+'</h2><p>'+escapeDocumentText(q.question||'')+'</p><p class="docMeta">'+(q.practiceMode?'연습용 · 실제 제출 전 기업·직무 확인 필요':'학생 사실 확인 완료')+' · '+escapeDocumentText(q.practiceMode?'지원기업 미정':q.company||posting?.company||'')+' / '+escapeDocumentText(q.jobTitle||'')+'</p><div class="docBody">'+escapeDocumentText(q.finalAnswer||q.draft||q.rawAnswer||'')+'</div></section>').join('');
  }
  function renderAll(){renderDashboard();renderQuestions();if(injeCompact){renderPracticeMode();renderTypeGuide();renderReviewPanel();}renderGuards()}
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
  function enforceAssetLimit(changed){const checked=[...document.querySelectorAll('[data-asset]:checked')];if(checked.length>2){changed.checked=false;ctx.toast(injeCompact?'문항당 경험은 최대 2개만 선택할 수 있습니다.':'문항당 Career Asset은 최대 2개를 권장·허용합니다.');}}
  function alignment(){const sel=selectedAssets(),reqId=v('requirementId'),weak=sel.filter(a=>!isAssetVerified(a)),matched=reqId&&reqId!=='__manual'?sel.filter(a=>a.requirementId===reqId):[];return {sel,reqId,weak,matched,aligned:!!reqId&&reqId!=='__manual'&&matched.length>0&&weak.length===0&&sel.length<=2}}
  function renderGuards(){
    if(injeCompact&&practiceMode){const ab=document.getElementById('assetGuard'),qb=document.getElementById('questionGuard');if(ab){ab.className='callout info';ab.textContent='연습에서는 실제 경험을 골라도 되고, 아직 경험이 없다면 직접 답변을 입력할 수 있습니다. 없는 성과는 만들지 마세요.';}if(qb){qb.className='callout info';qb.textContent='지원기업 미정 연습입니다. 채용공고와의 일치 여부는 확인되지 않으며 최종 제출용으로 표시되지 않습니다.';}return;}
    if(!injeCompact){const a=alignment(),assetBox=document.getElementById('assetGuard'),qBox=document.getElementById('questionGuard');if(!a.sel.length){assetBox.className='callout info';assetBox.textContent='Career Asset을 선택하면 사실검증·Requirement 연결을 확인합니다.';}else if(a.weak.length){assetBox.className='callout warn';assetBox.innerHTML=`<b>Fact Check 필요</b><br>${a.weak.map(x=>esc(x.experienceTitle,ctx)).join(', ')}의 Career Asset 또는 원경험 Fact Check가 완료되지 않았습니다.`;}else if(a.reqId&&!a.matched.length){assetBox.className='callout warn';assetBox.innerHTML='<b>Requirement 연결 불일치</b><br>선택한 Career Asset 중 현재 JD Requirement를 직접 연결한 자산이 없습니다. 다른 자산을 선택하거나 연결 논리를 다시 확인하세요.';}else{assetBox.className='callout good';assetBox.innerHTML='<b>선택 Evidence 확인</b><br>선택한 Career Asset의 사실검증 및 JD Requirement 연결이 확인되었습니다.';}if(!a.reqId){qBox.className='callout info';qBox.textContent='관련 JD Requirement를 선택하세요.';}else if(a.matched.length){qBox.className='callout good';qBox.textContent='문항의 핵심주장을 실제 JD Requirement와 Career Asset Evidence에 연결할 수 있습니다.';}else{qBox.className='callout warn';qBox.textContent='선택한 JD Requirement와 연결되는 Career Asset Evidence가 아직 없습니다.';}return;}
    const a=alignment(),assetBox=document.getElementById('assetGuard'),qBox=document.getElementById('questionGuard');
    const wrap=document.getElementById('manualRequirementWrap');if(wrap)wrap.hidden=a.reqId!=='__manual';
    if(!a.sel.length){assetBox.className='callout info';assetBox.textContent='이전 단계 자료가 없어도 직접 입력할 수 있습니다. 최종 답변의 사실 여부는 학생이 직접 확인하세요.';}
    else if(a.weak.length){assetBox.className='callout warn';assetBox.textContent='선택한 경험의 사실 확인이 아직 끝나지 않았습니다. 먼저 STEP 3의 경험과 수치·결과를 대조하세요.';}
    else if(a.reqId&&a.reqId!=='__manual'&&!a.matched.length){assetBox.className='callout warn';assetBox.textContent='선택한 경험과 채용공고의 요구사항이 아직 직접 연결되지 않았습니다. 초안 작성은 가능합니다.';}
    else {assetBox.className='callout good';assetBox.textContent='선택한 경험의 사실 확인 상태를 확인했습니다. 지원 직무와의 연결도 살펴보세요.';}
    if(!a.reqId){qBox.className='callout info';qBox.textContent='채용공고에서 필요한 업무·역량을 골라 주세요. 목록이 없으면 직접 입력하세요.';}
    else if(a.reqId==='__manual'){qBox.className=v('manualRequirement')?'callout warn':'callout info';qBox.textContent=v('manualRequirement')?'직접 입력한 업무·역량입니다. 채용공고 원문과 비교하기 전까지 초안으로 보관됩니다.':'공고에서 요구하는 업무·역량을 아래에 적어 주세요.';}
    else if(a.matched.length){qBox.className='callout good';qBox.textContent='선택한 경험이 채용공고의 업무·역량과 연결되어 있습니다.';}
    else{qBox.className='callout warn';qBox.textContent='공고의 업무·역량에 해당하는 경험이 있는지 확인하세요. 없으면 초안으로 먼저 작성할 수 있습니다.';}
  }
  function renderDashboard(){const box=document.getElementById('coverDashboard'),finals=data.questions.filter(isQuestionReady).length,drafts=data.questions.length-finals;box.innerHTML=`<div class="grid3"><div class="miniCard"><b>저장 문항</b><span>${data.questions.length}개</span></div><div class="miniCard"><b>${injeCompact?'최종 완성':'Final Ready'}</b><span>${finals}개</span></div><div class="miniCard"><b>${injeCompact?'초안 · 확인 필요':'Draft / 검증필요'}</b><span>${drafts}개</span></div></div>`;}
  function addQuestion(){
    const q=v('question'),a=alignment();
    if(!q){status('자기소개서 문항을 입력하세요.');return;}
    if(!v('intent')&&!injeCompact){status(injeCompact?'기업이 이 질문으로 무엇을 확인하려는지 적어 주세요.':'평가의도를 먼저 작성하세요.');return;}
    if(!a.reqId&&!injeCompact){status(injeCompact?'채용공고에서 요구하는 업무·역량을 선택하거나 직접 입력하세요.':'관련 JD Requirement를 선택하세요.');return;}/* 선택하지 않은 고급 요구역량 입력은 문항 저장의 필수조건이 아닙니다. */
    if(!a.sel.length&&!injeCompact){status('사용할 Career Asset을 1개 이상 선택하세요.');return;}
    if(a.sel.length>2){status(injeCompact?'자기소개서 질문당 경험은 최대 2개만 선택하세요.':'Career Asset은 최대 2개만 선택하세요.');return;}
    if(!v('rawAnswer')&&!(injeCompact&&v('finalAnswer'))){status(injeCompact?'실제 경험 또는 작성한 자기소개서 답변을 먼저 입력하세요.':'AI 초안보다 학생의 Raw Voice 또는 인터뷰 답변을 먼저 남기세요.');return;}
    const r=practiceMode?null:(a.reqId==='__manual'?{id:'__manual',text:v('manualRequirement')}:(posting?.requirements||[]).find(x=>x.id===a.reqId));
    const factChecked=document.getElementById('factChecked').checked,assetVerified=a.sel.length>0&&a.weak.length===0,requirementAligned=!practiceMode&&a.matched.length>0,statusValue=injeCompact?(!practiceMode&&!!posting&&factChecked&&!!(v('rawAnswer')||v('finalAnswer'))&&!!v('finalAnswer')?'final-ready':'draft'):(!practiceMode&&factChecked&&assetVerified&&requirementAligned?'final-ready':'draft');
    const fields={postingId:practiceMode?'':posting?.id||'',company:practiceMode?'':posting?.company||'',jobTitle:practiceMode?v('practiceTargetJob'):posting?.jobTitle||'',question:q,intent:v('intent'),requirementId:r?.id||'',requirement:r?.text||'',claim:v('claim'),assetIds:a.sel.map(x=>x.id),rawAnswer:v('rawAnswer')||(injeCompact?v('finalAnswer'):''),structure:v('structure'),draft:v('draft'),finalAnswer:v('finalAnswer'),factChecked,assetVerified,requirementAligned,status:statusValue,...(injeCompact?{questionType:v('questionType'),practiceMode}:{} )};
    const updating=!!editingQuestionId;
    if(updating){
      const i=data.questions.findIndex(x=>x.id===editingQuestionId);
      if(i<0){status('수정할 문항을 찾지 못했습니다.');return;}
      data.questions[i]={...data.questions[i],...fields,updatedAt:new Date().toISOString()};
    }else{
      data.questions.push({id:'cl_'+Date.now(),...fields,createdAt:new Date().toISOString()});
    }
    selectedReviewId=updating?editingQuestionId:data.questions[data.questions.length-1].id;
    persist();cancelQuestionEdit();renderAll();
    status((updating?'수정':'추가')+' 문항을 '+(statusValue==='final-ready'?(injeCompact?'최종 완성':'Final Ready'):(injeCompact?'초안 · 확인 필요':'Draft · 검증필요'))+' 상태로 저장했습니다.');
  }
  function editQuestion(id){
    const q=data.questions.find(x=>x.id===id);if(!q)return;
    editingQuestionId=id;
    if(injeCompact){setPracticeMode(!!q.practiceMode);const type=document.getElementById('questionType');if(type)type.value=q.questionType||'';if(q.intent||q.requirement||q.claim)document.getElementById('coverQuestionAdvanced').open=true;if((q.assetIds||[]).length)document.getElementById('coverEvidenceOptional').open=true;if(q.structure||q.draft)document.getElementById('coverDraftOptional').open=true;const target=document.getElementById('practiceTargetJob');if(target&&q.practiceMode)target.value=q.jobTitle||'';renderTypeGuide();}
    for(const key of ['question','intent','requirementId','claim','rawAnswer','structure','draft','finalAnswer']){
      const el=document.getElementById(key);if(el)el.value=q[key]||'';
    }
    document.querySelectorAll('[data-asset]').forEach(x=>x.checked=(q.assetIds||[]).includes(x.dataset.asset));
    if(injeCompact&&q.requirementId==='__manual'){const manual=document.getElementById('manualRequirement');if(manual)manual.value=q.requirement||'';}
    document.getElementById('factChecked').checked=false;
    document.getElementById('addQuestion').textContent='문항 수정 저장';
    document.getElementById('cancelQuestionEdit').classList.remove('hidden');
    renderGuards();
    const editFocus=injeCompact?document.getElementById('finalAnswer'):document.getElementById('question');
    if(injeCompact)window.JobfitStepAccordion?.openBlock?.(editFocus?.closest('.block'));
    editFocus?.scrollIntoView({behavior:'smooth',block:'center'});
    status('저장 문항을 불러왔습니다. 수정 후 사실을 다시 확인하고 저장하세요.');
  }
  function cancelQuestionEdit(){
    editingQuestionId=null;
    clear(['question','intent','claim','rawAnswer','structure','draft','finalAnswer','manualRequirement']);if(injeCompact){const t=document.getElementById('questionType');if(t)t.value='';renderTypeGuide();}
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
      return '<div class="listCard jfResultBox"><div class="listHead"><div><span class="rankTag">문항 '+(i+1)+'</span><h3>'+esc(q.question,ctx)+'</h3></div><span class="scoreChip">'+(q.practiceMode?(isPracticePrintable(q)?'연습본 · 작성완료':'연습본 · 초안'):ready?(injeCompact?'최종 완성':'Final Ready'):(injeCompact?'초안 · 확인 필요':'Draft · 검증필요'))+'</span></div>'+
        '<div class="jfReadFields">'+readField(injeCompact?'기업이 확인하려는 내용':'평가의도',q.intent,ctx)+readField(injeCompact?'채용공고 요구 업무·역량':'JD Requirement',q.requirement,ctx)+readField(injeCompact?'내가 강조할 내용':'핵심 주장',q.claim,ctx)+readField(injeCompact?'사용한 경험':'사용 Evidence',used.join(' / '),ctx)+'</div>'+
        '<div class="jfReadFields"><div class="jfReadField"><b>'+(q.finalAnswer?'학생 최종 답변':'AI 초안 · 원문 그대로')+'</b><div class="jfDraftText">'+esc(q.finalAnswer||q.draft||'아직 입력되지 않았습니다.',ctx)+'</div></div></div>'+
        '<div class="actions">'+(injeCompact?'<button type="button" class="btn primary smallBtn" data-cover-review="'+esc(q.id,ctx)+'">AI 검토·재검토</button>':'')+'<button type="button" class="btn secondary smallBtn" data-cover-edit="'+esc(q.id,ctx)+'">수정</button><button type="button" class="btn secondary smallBtn" data-cover-pdf="'+esc(q.id,ctx)+'">문항 PDF</button><button type="button" class="btn outline smallBtn" data-cover-txt="'+esc(q.id,ctx)+'">문항 TXT</button><button class="btn danger smallBtn" data-del="'+esc(q.id,ctx)+'">삭제</button></div></div>';
    }).join('');
    box.querySelectorAll('[data-cover-edit]').forEach(b=>b.addEventListener('click',()=>editQuestion(b.dataset.coverEdit)));
    if(injeCompact)box.querySelectorAll('[data-cover-review]').forEach(b=>b.addEventListener('click',()=>{selectedReviewId=b.dataset.coverReview;document.getElementById('coverAiReviewDisclosure').open=true;renderReviewPanel();const reviewSection=document.getElementById('coverAiReview');window.JobfitStepAccordion?.openBlock?.(reviewSection);reviewSection?.scrollIntoView({behavior:'smooth',block:'start'});}));
    box.querySelectorAll('[data-cover-pdf]').forEach(b=>b.addEventListener('click',()=>{
      const q=data.questions.find(x=>x.id===b.dataset.coverPdf);
      if(!isQuestionReady(q)&&!isPracticePrintable(q)){status(injeCompact?'최종 답변과 사실 확인이 끝난 문항만 PDF로 저장됩니다. 초안은 텍스트 파일로 보관하세요.':'최종 PDF는 Fact Check 완료 문항만 가능합니다. 검증 전 문항은 TXT로 별도 저장하세요.');return;}
      printApplicationDocument('자기소개서 · '+(q.company||'개별 문항'),coverPrintHtml([q]),ctx.toast);
    }));
    box.querySelectorAll('[data-cover-txt]').forEach(b=>b.addEventListener('click',()=>{
      const i=data.questions.findIndex(x=>x.id===b.dataset.coverTxt);if(i<0)return;
      downloadApplicationText('JOBFIT_자소서_문항'+(i+1),coverText(data.questions[i],i),ctx.toast);
    }));
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
      if(!window.confirm('선택한 자기소개서 문항을 삭제할까요?'))return;
      if(editingQuestionId===b.dataset.del)cancelQuestionEdit();
      data.questions=data.questions.filter(x=>x.id!==b.dataset.del);if(selectedReviewId===b.dataset.del)selectedReviewId='';persist();renderAll();
    }));
  }
  function buildPrompt(){if(injeCompact)return buildInjeInterviewPrompt();const a=alignment(),r=a.reqId==='__manual'?{text:v('manualRequirement')}:(posting?.requirements||[]).find(x=>x.id===a.reqId);return `지금부터 자기소개서를 대신 써주는 작가가 아니라 내 경험을 검증하고 꺼내는 취업 인터뷰어가 되어줘.\n\n[기업/직무]\n${posting?`${posting.company} / ${posting.jobTitle}`:'미등록'}\n\n[자기소개서 문항]\n${v('question')||'미입력'}\n\n[내가 해석한 평가의도]\n${v('intent')||'미입력'}\n\n[관련 JD Requirement]\n${JSON.stringify(r||{},null,2)}\n\n[내가 증명하려는 핵심주장]\n${v('claim')||'미입력'}\n\n[선택한 Career Asset]\n${JSON.stringify(a.sel,null,2)}\n\n규칙:\n1. 먼저 문항 평가의도와 선택한 JD Requirement 연결이 타당한지 점검한다.\n2. 선택한 Career Asset 중 해당 Requirement에 직접 연결된 자산이 있는지 확인한다.\n3. Career Asset의 Evidence 수준과 사실검증 상태를 확인한다.\n4. 경험은 최대 1~2개로 제한하고 최종 선택은 나에게 묻는다.\n5. 경험이 정해지면 한 번에 질문 하나씩 하며 내가 직접 한 Action, Reasoning, Result, Evidence를 확인한다.\n6. 내가 말하지 않은 수치·성과·역할은 만들지 않는다.\n7. Evidence가 약하거나 Requirement 연결이 약하면 과장하지 말고 GAP라고 말한다.\n8. 충분한 답변이 모이기 전에는 완성문을 쓰지 않는다.\n9. 마지막에 먼저 '핵심주장 → 상황 → Action → Reasoning → Result/Evidence → JD 연결' 구조를 보여주고 내가 확인하면 초안을 작성한다.\n10. 기업 칭찬·상투어를 자동 추가하지 않는다.\n11. 초안 끝에 Career Asset 원자료와 다시 확인해야 할 표현을 표시한다.\n\n첫 질문부터 시작해줘.`}
  function setPracticeMode(enabled){
    practiceMode=!!enabled;data.practiceMode=practiceMode;persist();renderPracticeMode();renderGuards();
  }
  function renderPracticeMode(){
    if(!injeCompact)return;
    document.querySelectorAll('[name="coverWorkMode"]').forEach(el=>el.checked=el.value===(practiceMode?'practice':'application'));
    const samples=document.getElementById('coverPracticeSamples');if(samples)samples.hidden=!practiceMode;
    const jobBox=document.getElementById('coverPracticeTarget');if(jobBox)jobBox.hidden=!practiceMode;
    const requirement=document.getElementById('coverRequirementSlot');if(requirement)requirement.hidden=practiceMode;
    const targetNotice=document.getElementById('coverTargetNotice');if(targetNotice)targetNotice.hidden=practiceMode;
  }
  function renderTypeGuide(){
    if(!injeCompact)return;
    const type=v('questionType'),box=document.getElementById('coverTypeGuide');if(!box)return;
    const guide={
      WHY:'지원동기·선택 이유: 먼저 나의 결론을 말하고, 직무와 연결되는 이유를 제시한 뒤 내 경험으로 설명하세요. (PREP: 주장 → 이유 → 경험 → 정리)',
      HOW:'문제해결·도전·협업 경험: 당시 상황과 과제를 짧게 쓰고, 내가 직접 한 행동과 그 이유·결과를 구체적으로 적으세요. (STAR: 상황 → 과제 → 행동 → 결과)',
      CAN:'직무 강점·수행 가능성: 내가 할 수 있는 일을 첫 문장에 쓰고, 관련 경험에서 직접 한 행동과 결과로 보여주세요. (두괄식 + STAR)'
    };
    box.textContent=guide[type]||'질문 유형을 선택하면 답변을 어떤 순서로 써야 하는지 보여드립니다. 유형이 애매하면 직접 고른 뒤 검토해도 됩니다.';
  }
  function wireInjeWritingControls(){
    document.querySelectorAll('[name="coverWorkMode"]').forEach(el=>el.addEventListener('change',()=>setPracticeMode(el.value==='practice')));
    document.getElementById('practiceTargetJob')?.addEventListener('input',e=>{data.practiceTargetJob=e.target.value;persist();});
    document.getElementById('questionType')?.addEventListener('change',renderTypeGuide);
    document.querySelectorAll('[data-cover-sample]').forEach(button=>button.addEventListener('click',()=>{
      const input=document.getElementById('question');
      if(input.value.trim()&&!window.confirm('현재 입력한 질문을 연습 문항으로 바꿀까요?'))return;
      input.value=button.dataset.coverSample||'';
      const type=document.getElementById('questionType');if(type)type.value=button.dataset.coverType||'';
      renderTypeGuide();window.JobfitStepAccordion?.openBlock?.(input.closest('.block'));input.focus();
    }));
  }
  function ensureCoverReviewData(){
    if(!data.reviewHistory||typeof data.reviewHistory!=='object'||Array.isArray(data.reviewHistory))data.reviewHistory={};
    if(!data.reviewWorking||typeof data.reviewWorking!=='object'||Array.isArray(data.reviewWorking))data.reviewWorking={};
  }
  function reviewCurrent(){
    return data.questions.find(q=>q.id===selectedReviewId)||null;
  }
  function reviewRounds(q){
    ensureCoverReviewData();
    return Array.isArray(data.reviewHistory[q.id])?data.reviewHistory[q.id]:(data.reviewHistory[q.id]=[]);
  }
  function buildCoverReviewPrompt(q,round){
    const type=q.questionType||'',guide=type==='WHY'?'지원동기·이유: PREP(주장→이유→경험→정리)':type==='HOW'?'경험·문제해결: STAR(상황→과제→개인 행동→결과)':type==='CAN'?'직무 강점: 두괄식+STAR':'문항 유형을 먼저 검토하고 WHY/HOW/CAN 중 학생에게 제안';
    const facts=(q.assetIds||[]).map(id=>guidedAssets.find(a=>a.id===id)||allAssets.find(a=>a.id===id)).filter(Boolean).map(a=>[a.experienceTitle,a.proof,a.fact,a.factCheck].filter(Boolean).join(' / ')).join(' ; ');
    const prev=(round>1?reviewRounds(q)[round-2]?.feedback||'':'');
    return [
      '당신은 대학생 자기소개서 검토자입니다. 학생의 글을 사실 근거 중심으로 평가해 주세요.',
      '검토 회차: '+round+'차',
      '작성 구분: '+(q.practiceMode?'지원기업 미정 연습본 (실제 채용공고 없음)':'실제 지원서'),
      '기업·직무: '+(q.practiceMode?'기업 미정 / 관심 직무: '+(q.jobTitle||'미정'):(q.company||'미등록')+' / '+(q.jobTitle||'미등록')),
      '원래 문항: '+(q.question||''),
      '평가의도(학생 기록): '+(q.intent||'미입력'),
      '질문 유형과 권장 구조: '+guide,
      '채용공고 요구 업무·역량: '+(q.practiceMode?'없음 · 검증하지 않음':q.requirement||'학생이 입력하지 않음'),
      '학생이 주장하려는 내용: '+(q.claim||'미입력'),
      '학생의 실제 경험 메모: '+(q.rawAnswer||'미입력'),
      '확인된 경험 근거: '+(facts||'연결된 경험 없음'),
      '검토할 학생 답변: '+(q.finalAnswer||q.draft||q.rawAnswer||''),
      ...(round>1?['직전 AI 검토 의견: '+(prev||'없음'),'이번 검토에서는 이전 지적이 실제로 수정되었는지도 확인하세요.']:[]),
      '',
      '검토 기준:',
      '1. 질문에 직접 답했는지, 첫 문장에 핵심 주장이 있는지 확인한다.',
      '2. WHY는 PREP, HOW는 STAR(특히 본인이 직접 한 행동), CAN은 두괄식+STAR가 적합한지 확인한다.',
      '3. 경험의 상황·본인 행동·판단 이유·결과·근거가 구체적인지 확인한다.',
      '4. 공고 정보가 있는 경우에만 해당 직무 요구사항과의 연결을 검토한다. 연습본에서는 기업·공고에 관한 사실을 만들어내지 않는다.',
      '5. 원경험에 없는 성과·수치·역할을 추가하지 않는다. 과장·AI 상투어·불필요한 문장은 구체적으로 짚는다.',
      '6. 정보가 부족하면 확인 질문을 최대 3개 제시하고, 모르는 내용은 확인 필요라고 쓴다.',
      '7. 수정 예시가 필요하면 확인된 사실만 활용한다. 문장을 학생 대신 새 사실로 채우지 않는다.',
      '',
      '출력: (가) 문항 적합성 (나) 유지할 문장 2개 이내 (다) 고칠 부분 최대 3개와 이유 (라) 사실확인 질문 (마) 학생이 직접 수정할 순서.',
      'AI의 평가를 합격 가능성이나 자동 사실검증 완료로 간주하지 마세요.'
    ].join('\n');
  }
  function renderReviewPanel(){
    const select=document.getElementById('coverReviewQuestion'),box=document.getElementById('coverReviewWorkspace');if(!select||!box)return;
    ensureCoverReviewData();
    if(!data.questions.some(q=>q.id===selectedReviewId))selectedReviewId=data.questions[0]?.id||'';
    select.innerHTML='<option value="">문항 선택</option>'+data.questions.map((q,i)=>'<option value="'+esc(q.id,ctx)+'">'+esc('문항 '+(i+1)+' · '+String(q.question||'').slice(0,65),ctx)+'</option>').join('');
    select.value=selectedReviewId;
    const q=reviewCurrent();if(!q){box.innerHTML='<p class="help">먼저 3번에서 자기소개서 문항을 저장해 주세요. 저장된 문항별로 검토할 수 있습니다.</p>';return;}
    const rounds=reviewRounds(q),latest=rounds[rounds.length-1],working=data.reviewWorking[q.id]||{};
    const note=latest?.feedback?'검토 의견 저장됨':'검토 의견을 붙여넣을 수 있습니다';
    const preview=latest?.prompt||buildCoverReviewPrompt(q,rounds.length+1);
    const revisionDefault=q.finalAnswer||q.draft||q.rawAnswer||'';
    const outputHistory=rounds.slice(-6).map((r,i)=>'<div class="jfReadField"><b>'+esc(String(rounds.length-Math.min(6,rounds.length)+i+1)+'차 AI 검토',ctx)+'</b><div class="jfDraftText">'+esc(r.feedback||'검토 의견 미입력',ctx)+'</div>'+(r.revisedAt?'<p class="help">학생 수정 내용 저장됨</p>':'')+'</div>').join('');
    box.innerHTML='<div class="callout info">이 단계는 자기소개서의 작성 내용만 AI로 검토합니다. AI가 실제 경험을 확인한 것은 아니므로 최종 사실확인은 학생이 다시 해야 합니다.</div>'
      +'<p class="help" id="coverReviewRoundStatus">'+esc((rounds.length||0)+'회 검토 요청 · '+note,ctx)+'</p>'
      +'<div class="actions"><button type="button" class="btn secondary" id="previewCoverReview">AI 검토 질문 확인</button><button type="button" class="btn primary" id="copyCoverReview">AI 검토 질문 복사</button></div>'
      +'<div class="field"><label for="coverReviewPrompt">AI에 붙여넣을 검토 질문</label><textarea id="coverReviewPrompt" rows="7" readonly>'+esc(preview,ctx)+'</textarea></div>'
      +'<div class="field"><label for="coverReviewFeedback">AI가 알려준 수정 의견 · 붙여넣고 저장</label><textarea id="coverReviewFeedback" rows="5" placeholder="예: 첫 문장에 강점이 명확하지 않고 내 행동 설명이 부족합니다.">'+esc(working.feedbackDraft??latest?.feedback??'',ctx)+'</textarea></div>'
      +'<div class="actions"><button type="button" class="btn secondary" id="saveCoverReviewFeedback">검토 의견 저장</button></div>'
      +'<div class="field"><label for="coverReviewRevision">학생이 직접 수정한 답변</label><textarea id="coverReviewRevision" rows="10" placeholder="AI 검토 의견을 읽고 내가 직접 답변을 수정하세요.">'+esc(working.revisionDraft??revisionDefault,ctx)+'</textarea><p class="help">저장 후 원문은 수정본으로 바뀌지만, 사실확인 표시는 해제됩니다. 내용을 다시 확인한 다음 최종 완성으로 저장하세요.</p></div>'
      +'<div class="actions"><button type="button" class="btn primary" id="applyCoverRevision">학생 수정 내용 저장</button><button type="button" class="btn secondary" id="redoCoverReview">수정본 다시 AI 검토</button></div>'
      +'<details id="coverReviewHistory"><summary>이전 AI 검토 이력 ('+rounds.length+'회)</summary><div class="jfReadFields">'+(outputHistory||'<p class="help">아직 검토 이력이 없습니다.</p>')+'</div></details>';
    document.getElementById('previewCoverReview').addEventListener('click',()=>{document.getElementById('coverReviewPrompt').value=buildCoverReviewPrompt(q,rounds.length+1);status('검토할 내용을 확인했습니다. 복사한 뒤 ChatGPT에 붙여넣으세요.');});
    document.getElementById('copyCoverReview').addEventListener('click',()=>{const current=startReviewRound(q,false);if(current){document.getElementById('coverReviewPrompt').value=current.prompt;copy(current.prompt,ctx,'AI 검토 질문');renderReviewPanel();}});
    document.getElementById('saveCoverReviewFeedback').addEventListener('click',()=>saveReviewFeedback(q));
    document.getElementById('applyCoverRevision').addEventListener('click',()=>applyReviewRevision(q));
    document.getElementById('redoCoverReview').addEventListener('click',()=>{const last=reviewRounds(q).at(-1);if(!last?.feedback||!last?.revisedAt){status('검토 의견을 저장하고 답변을 직접 수정한 뒤 재검토해 주세요.');return;}if(last.answerSnapshot===(q.finalAnswer||'')){status('수정된 내용이 없습니다. 답변을 수정한 뒤 재검토해 주세요.');return;}const next=startReviewRound(q,true);if(next){document.getElementById('coverReviewPrompt').value=next.prompt;copy(next.prompt,ctx,'재검토 질문');renderReviewPanel();}});
    ['feedback','revision'].forEach(k=>{const el=document.getElementById(k==='feedback'?'coverReviewFeedback':'coverReviewRevision');el.addEventListener('input',()=>{const draft=data.reviewWorking[q.id]||{};draft[k==='feedback'?'feedbackDraft':'revisionDraft']=el.value;data.reviewWorking[q.id]=draft;persist();});});
  }
  function startReviewRound(q,forceNew){
    if(!String(q.finalAnswer||q.draft||'').trim()){status('먼저 자기소개서 초안이나 최종 답변을 작성하고 저장해 주세요.');return null;}
    const rounds=reviewRounds(q),text=String(q.finalAnswer||q.draft||'').trim(),last=rounds.at(-1);
    if(!forceNew&&last&&last.answerSnapshot===text)return last;
    const round={answerSnapshot:text,prompt:buildCoverReviewPrompt(q,rounds.length+1),requestedAt:new Date().toISOString(),feedback:''};
    rounds.push(round);data.reviewWorking[q.id]={feedbackDraft:'',revisionDraft:text};persist();return round;
  }
  function saveReviewFeedback(q){
    const feedback=document.getElementById('coverReviewFeedback')?.value.trim()||'';if(!feedback){status('AI가 알려준 검토 의견을 붙여넣으세요.');return;}
    let last=reviewRounds(q).at(-1);if(!last){last=startReviewRound(q,false);if(!last)return;}
    last.feedback=feedback;data.reviewWorking[q.id]={...(data.reviewWorking[q.id]||{}),feedbackDraft:feedback};persist();renderReviewPanel();status('AI 검토 의견을 저장했습니다. 아래에서 직접 수정하세요.');
  }
  function applyReviewRevision(q){
    const answer=document.getElementById('coverReviewRevision')?.value.trim()||'';if(!answer){status('수정한 답변을 입력하세요.');return;}
    const last=reviewRounds(q).at(-1);if(!last?.feedback){status('먼저 AI 검토 의견을 저장하세요.');return;}
    if(answer===String(q.finalAnswer||q.draft||'').trim()){status('수정 전과 같은 문장입니다. 수정할 부분을 확인해 주세요.');return;}
    q.finalAnswer=answer;q.factChecked=false;q.status='draft';q.updatedAt=new Date().toISOString();
    last.revisedAt=q.updatedAt;last.revisedAnswer=answer;
    data.reviewWorking[q.id]={feedbackDraft:last.feedback,revisionDraft:answer};
    persist();renderAll();status('학생 수정본을 저장했습니다. 사실 확인을 다시 하고 AI 재검토를 진행하세요.');
  }
  function buildInjeInterviewPrompt(){
    const a=alignment(),type=v('questionType'),category=type==='WHY'?'지원동기·이유(PREP)':type==='HOW'?'경험·과정(STAR)':type==='CAN'?'직무 강점(두괄식+STAR)':'학생이 문항 유형을 아직 정하지 않음';
    const req=practiceMode?'해당 없음 · 지원기업 미정 연습':(a.reqId==='__manual'?v('manualRequirement'):(posting?.requirements||[]).find(x=>x.id===a.reqId)?.text||'미선택');
    const info=[
      '당신은 대학생 자기소개서 작성 인터뷰어입니다. 없는 경험을 만들어 대신 써주지 마세요.',
      '작성 상태: '+(practiceMode?'지원기업 미정 · 연습본 (회사 정보와 실제 JD 검증 불가)':'실제 지원기업 자기소개서'),
      '지원 기업·직무: '+(practiceMode?('기업 미정 / 관심 직무: '+(v('practiceTargetJob')||'미정')):((posting?.company||'미등록')+' / '+(posting?.jobTitle||'미등록'))),
      '자기소개서 문항: '+(v('question')||'미입력'),
      '문항 유형: '+category,
      '기업이 확인하려는 내용(학생 작성): '+(v('intent')||'확인 필요'),
      '채용공고 요구 업무·역량: '+req,
      '학생이 강조할 내용: '+(v('claim')||'미입력'),
      '선택한 실제 경험: '+(a.sel.length?a.sel.map(x=>[x.experienceTitle,x.proof,x.fact].filter(Boolean).join(' / ')).join(' ; '):'아직 선택하지 않음'),
      '학생이 직접 말한 내용: '+(v('rawAnswer')||'아직 없음'),
      '',
      '진행 규칙:',
      '1. 질문에 답하기 전에 유형(WHY/HOW/CAN)과 평가의도를 점검하고 학생에게 확인한다.',
      '2. WHY는 PREP(주장→이유→경험→정리), HOW는 STAR(상황→과제→내 행동→결과), CAN은 두괄식+STAR로 안내한다.',
      '3. 정보가 부족하면 한 번에 질문 하나씩, 실제 역할·행동·판단 이유·결과·증거를 묻는다.',
      '4. 학생이 말하지 않은 사실·수치·회사 특징·채용공고 요구사항을 추측해서 만들지 않는다.',
      '5. 연습 모드에서는 특정 기업의 평가의도나 직무 일치성을 사실처럼 단정하지 않는다.',
      '6. 확인된 사실로만 구조를 먼저 보여주고 학생이 승인하면 초안을 제시한다. 부족한 부분은 확인 필요로 표시한다.',
      '7. 기업 칭찬, 범용 다짐, 과장된 역량 표현을 자동으로 넣지 않는다.',
      '',
      '첫 번째 확인 질문부터 시작해 줘.'
    ];
    return info.join('\n');
  }
  function persist(){ctx.saveState({artifacts:{coverLetterLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function clear(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}


function compactInjeCoverUi(root){
  // INJE STEP 9 only: rearrange DOM nodes; do not change storage or input IDs.
  const question=document.getElementById('question')?.closest('.block');
  const experience=document.getElementById('assetChecks')?.closest('.block');
  const answer=document.getElementById('rawAnswer')?.closest('.block');
  const saved=document.getElementById('questionList')?.closest('.block');
  const dashboard=document.getElementById('coverDashboard')?.closest('.block');
  const review=document.getElementById('coverAiReview');
  const reuse=document.getElementById('resumeReuse');
  if(!question||!experience||!answer||!saved||!review)return;
  const detail=(id,label)=>{
    const el=document.createElement('details');el.className='detailsBox';el.id=id;el.style.marginTop='12px';
    const summary=document.createElement('summary');summary.textContent=label;el.appendChild(summary);return el;
  };
  const move=(node,target)=>{
    if(!node)return;
    const previous=node.previousElementSibling;
    if(previous?.classList.contains('hr'))previous.remove();
    target.appendChild(node);
  };
  question.querySelector(':scope > h3').textContent='1. 자기소개서 문항 선택';
  const questionGrid=document.getElementById('question')?.closest('.grid2');
  const advanced=detail('coverQuestionAdvanced','기업 질문 분석 · 채용공고 연결 (선택)');
  move(document.getElementById('intent')?.closest('.field'),advanced);
  move(document.getElementById('coverRequirementSlot'),advanced);
  move(document.getElementById('claim')?.closest('.field'),advanced);
  move(document.getElementById('questionGuard'),advanced);
  questionGrid?.classList.remove('grid2');
  const leftover=question.querySelector(':scope > .grid2');
  if(leftover&&!leftover.children.length)leftover.remove();
  question.appendChild(advanced);

  const prior=detail('coverEvidenceOptional','앞 단계 경험 불러오기 · 선택');
  experience.querySelector(':scope > h3').textContent='자기소개서에 사용할 경험 선택 · 선택사항';
  move(experience,prior);
  if(reuse)move(reuse,prior);
  answer.insertAdjacentElement('beforebegin',prior);

  answer.querySelector(':scope > h3').textContent='2. 실제 경험과 자기소개서 답변 작성';
  const note=document.createElement('p');note.className='help';
  note.textContent='STEP 8을 하지 않아도 됩니다. 본인이 직접 한 일과 최종 답변을 적으세요. 없는 성과나 수치는 만들지 않습니다.';
  answer.querySelector(':scope > h3').insertAdjacentElement('afterend',note);
  const raw=document.getElementById('rawAnswer');
  const rawLabel=raw?.closest('.field')?.querySelector('label');
  if(rawLabel)rawLabel.textContent='내가 실제로 한 일 · 직접 입력';
  if(raw)raw.placeholder='예: 학과 행사 카드뉴스를 만들고, 댓글 질문을 확인해 내용을 수정했습니다.';
  raw?.closest('.grid2')?.classList.remove('grid2');
  const draftPanel=detail('coverDraftOptional','답변 흐름 메모 · AI 초안 (선택)');
  move(document.getElementById('structure')?.closest('.field'),draftPanel);
  move(document.getElementById('draft')?.closest('.field'),draftPanel);
  const finalField=document.getElementById('finalAnswer')?.closest('.field');
  const finalLabel=finalField?.querySelector('label b');
  if(finalLabel)finalLabel.textContent='자기소개서 최종 답변';
  if(finalField)finalField.insertAdjacentElement('beforebegin',draftPanel);

  saved.querySelector(':scope > h3').textContent='3. 저장한 문항 확인 · 수정·PDF';
  const help=saved.querySelector(':scope > p.help');
  if(help)help.textContent='저장한 문항을 수정하거나 PDF로 저장하세요. 연습용 문항은 연습용으로 표시됩니다. 확인 전 초안은 텍스트로 보관하세요.';
  const ai=detail('coverAiReviewDisclosure','AI 검토 · 수정 · 재검토 (선택)');
  move(review,ai);
  saved.insertAdjacentElement('afterend',ai);
  if(dashboard){
    const progress=detail('coverProgressOptional','작성 현황 자세히 보기 (선택)');
    move(dashboard,progress);
    ai.insertAdjacentElement('afterend',progress);
  }
}

// INJE: 문항 하나를 빠르게 완성하는 기본 동선. 기존 필드 ID·저장 구조는 그대로 사용.
function simplifyInjeCoverUi(root){
  const page=root.querySelector('.coverReadable');if(!page)return;
  const blocks=[...page.querySelectorAll(':scope > .block')];
  const byHeading=prefix=>blocks.find(b=>b.querySelector(':scope > h3')?.textContent?.trim()?.startsWith(prefix));
  const question=byHeading('1. '),experience=byHeading('2. '),answer=byHeading('3. ');
  const dashboard=byHeading('0. '),review=document.getElementById('coverAiReview');
  const saved=document.getElementById('questionList')?.closest('.block');
  const reuse=document.getElementById('resumeReuse')||blocks.find(b=>b.querySelector(':scope > h3')?.textContent?.includes('STEP 8에서 작성한 이력서'));
  const disclosure=(title,id)=>{const d=document.createElement('details');d.className='detailsBox';d.id=id;d.style.marginTop='12px';const s=document.createElement('summary');s.textContent=title;d.appendChild(s);return d;};
  if(question){
    question.querySelector(':scope > h3').textContent='1. 자기소개서 질문 선택·입력';
    const extra=disclosure('평가의도·채용공고·질문 유형 설정 (선택)','coverQuestionAdvanced');
    const intent=document.getElementById('intent')?.closest('.field');
    const requirement=document.getElementById('coverRequirementSlot');
    const claim=document.getElementById('claim')?.closest('.field');
    const type=document.getElementById('questionType')?.closest('.field');
    for(const n of [intent,requirement,claim,type])if(n)extra.appendChild(n);
    const first=question.querySelector('.grid2');if(first)first.style.gridTemplateColumns='minmax(0,1fr)';
    question.appendChild(extra);
    const hint=document.createElement('p');hint.className='help';hint.textContent='기업이 없으면 위에서 연습하기를 선택하고 질문을 누르세요. 실제 지원 질문도 직접 입력할 수 있습니다.';
    question.insertBefore(hint,question.querySelector('.grid2'));
  }
  if(experience){
    experience.querySelector(':scope > h3').textContent='2. 사용할 경험 선택 (선택)';
    const help=experience.querySelector(':scope > .help');if(help)help.textContent='STEP 8을 하지 않아도 됩니다. STEP 3 경험을 선택하거나 아래 답변 칸에 직접 작성하세요.';
  }
  if(answer){
    answer.querySelector(':scope > h3').textContent='3. 자기소개서 답변 작성·저장';
    const final=document.getElementById('finalAnswer')?.closest('.field');
    if(final){
      const label=final.querySelector('label');if(label)label.textContent='내가 작성한 자기소개서 답변';
      const hint=final.querySelector('.help');if(hint)hint.textContent='직접 작성한 답변만으로도 초안 저장이 가능합니다. 사실 확인 후 필요하면 AI 검토를 이용하세요.';
    }
    const evidence=disclosure('실제 경험·답변 구성 메모 (선택)','coverEvidenceOptional');
    for(const id of ['rawAnswer','structure']){
      const field=document.getElementById(id)?.closest('.field');if(field)evidence.appendChild(field);
    }
    const draft=disclosure('AI 초안 입력 (선택)','coverDraftOptional');
    const draftField=document.getElementById('draft')?.closest('.field');if(draftField)draft.appendChild(draftField);
    if(final){final.insertAdjacentElement('afterend',evidence);evidence.insertAdjacentElement('afterend',draft);}
    else{answer.appendChild(evidence);answer.appendChild(draft);}
    const initial=answer.querySelector(':scope > .grid2');if(initial&&!initial.children.length)initial.remove();
  }
  if(review)review.querySelector(':scope > h3').textContent='4. AI 검토·학생 수정 (선택)';
  if(saved)saved.querySelector(':scope > h3').textContent='5. 작성한 자기소개서 확인·저장';
  if(saved&&(reuse||dashboard)){
    const extras=disclosure('앞 단계 자료 불러오기·작성 현황 (선택)','coverSupportingTools');
    if(reuse)extras.appendChild(reuse);
    if(dashboard)extras.appendChild(dashboard);
    saved.insertAdjacentElement('afterend',extras);
  }
}
function coverAiReviewBlock(){
  return '<div class="hr"></div><div class="block" id="coverAiReview"><h3>4. AI 검토 → 학생 수정 → 재검토</h3><p class="help">3번에서 문항을 저장한 뒤, 검토할 문항을 선택하세요. AI 검토 의견은 복사해 사용하고, 수정은 학생이 직접 합니다.</p>'
    +'<div class="field"><label for="coverReviewQuestion">검토할 자기소개서 문항</label><select id="coverReviewQuestion"><option value="">문항 선택</option></select></div>'
    +'<div id="coverReviewWorkspace"><p class="help">저장한 문항을 선택해 주세요.</p></div></div>';
}
function coverPracticeModeBlock(practiceMode,job){
  return '<div class="block" id="coverModeBlock"><h3>작성 방식 선택</h3><p class="help">지원할 기업을 정했으면 실제 문항으로 작성하세요. 아직 정하지 않았다면 연습 문항으로 시작해도 됩니다.</p>'
    +'<div class="coverModeChoices"><label class="checkRow"><input type="radio" name="coverWorkMode" value="application" '+(!practiceMode?'checked':'')+'> <span><b>지원기업 자소서 작성</b> · 실제 공고와 문항을 확인합니다</span></label>'
    +'<label class="checkRow"><input type="radio" name="coverWorkMode" value="practice" '+(practiceMode?'checked':'')+'> <span><b>지원기업 미정 · 연습하기</b> · 실제 경험으로 문항을 연습합니다</span></label></div>'
    +'<div id="coverPracticeTarget" style="margin-top:10px" '+(practiceMode?'':'hidden')+'><label for="practiceTargetJob">관심 직무 (선택)</label><input id="practiceTargetJob" type="text" value="'+job+'" placeholder="예: 브랜드 마케팅" style="width:100%;max-width:520px"><p class="help">기업을 지정하지 않은 연습본은 제출용 PDF로 표시하지 않습니다. 최종 지원서 작성 시 실제 채용공고를 확인해 주세요.</p></div>'
    +'<div id="coverPracticeSamples" style="margin-top:12px" '+(practiceMode?'':'hidden')+'><b>연습 질문 선택</b><p class="help">질문을 선택해도 내 경험·답변은 자동으로 만들어지지 않습니다.</p><div class="actions">'
    +'<button type="button" class="btn secondary smallBtn" data-cover-sample="이 직무를 선택한 이유는 무엇인가요?" data-cover-type="WHY">지원동기·이유</button>'
    +'<button type="button" class="btn secondary smallBtn" data-cover-sample="어려운 문제를 해결한 경험과 본인이 한 행동을 적어 주세요." data-cover-type="HOW">문제해결 경험</button>'
    +'<button type="button" class="btn secondary smallBtn" data-cover-sample="희망 직무에 활용할 수 있는 나의 강점을 경험으로 설명해 주세요." data-cover-type="CAN">직무 강점</button></div></div></div>';
}
function coverQuestionTypeBlock(){
  return '<div class="field" style="margin-top:12px"><label for="questionType">자기소개서 질문 유형 · 작성 순서 안내</label><select id="questionType">'
    +'<option value="">선택하세요 · 잘 모르겠으면 AI와 확인</option><option value="WHY">WHY · 지원동기·선택 이유</option><option value="HOW">HOW · 경험·문제해결 과정</option><option value="CAN">CAN · 직무 강점·수행 가능성</option></select>'
    +'<div id="coverTypeGuide" class="callout info" style="margin-top:8px">질문 유형을 선택하면 작성 순서를 알려줍니다.</div></div>';
}
function resumeReuseBlock(items,ctx,injeCompact=false){
  if(injeCompact){
    if(!items.length)return '';
    return '<div class="hr"></div><div class="block" id="resumeReuse"><h3>STEP 8 이력서 경험 불러오기</h3>'
      +'<p class="help">앞에서 작성한 경험을 다시 입력할 필요가 없습니다. 자기소개서 질문에 맞게 필요한 내용만 보완하세요.</p>'
      +'<div class="grid2"><div class="field"><label>불러올 이력서 경험</label><select class="jfLongSelect" id="resumeEvidenceSource"><option value="">선택하세요</option>'
      +items.map(x=>'<option value="'+esc(x.id,ctx)+'">'+esc(x.assetTitle||x.section||'내 경험',ctx)+'</option>').join('')
      +'</select></div><div class="field"><label>&nbsp;</label><button type="button" class="btn primary" id="loadResumeEvidence">이 경험 불러오기</button></div></div>'
      +'<div class="callout good"><b>자동으로 채워지는 내용</b> 내가 한 행동·결과·경험 근거<br><b>학생이 확인할 내용</b> 질문의 의도·지원 직무 연결·최종 답변</div></div>';
  }
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
}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function escReq(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx,label=''){try{await navigator.clipboard.writeText(t);ctx.toast(label?label+' 복사 완료':'자소서 인터뷰 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

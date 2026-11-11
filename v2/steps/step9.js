import {readValue,readField,READABLE_STYLES} from './readableResults.js';
import {printApplicationDocument} from './applicationExport.js';
import {QS_STEP8} from '../quickStart.js?v=1';
export async function render(ctx){
  // INJE 화면 번호 기준: GAP Match와 지원자격 확인은 STEP 5 Job Analysis에 있다.
  const displayStep=ctx.displayStep??9,injeCompact=displayStep!==9,prevEvidenceStep=injeCompact?'STEP 5 GAP Match':'STEP 8',prevGateStep=injeCompact?'STEP 5 Job Analysis':'STEP 7';
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0],assets=s.artifacts?.careerAssets?.assets||[],candidateAssets=assets.filter(a=>(a.evidenceLevel||legacyLevel(a.strength))!=='없음'),experiences=s.assessments?.experienceCompetency?.experiences||[],saved=s.artifacts?.resumeLab||{items:[],summary:'',skills:'',notes:''},data=structuredClone(saved),root=document.getElementById('stepRoot');
  data.items=data.items||[];ensureResumeForms(data);if(injeCompact)ensureResumeTargeting(data,posting);const prior=collectResumePriorData(s,posting,experiences);let editingResumeId=null;

  root.innerHTML=`<section class="card jobfitReadable resumeReadable">${READABLE_STYLES}
    <div class="sectionHead"><div><div class="kicker">STEP ${displayStep}</div><h2>Resume Lab</h2><p>JD와 Career Asset을 연결해 이력서·경험기술서를 만들되, 검증된 사실만 최종 문장으로 사용합니다.</p></div><span class="badge">9주차</span></div><div class="progress"><span style="width:71%"></span></div>
    ${!injeCompact&&posting?`<div class="callout info"><b>Target JD</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}
    ${!injeCompact&&posting?gateNotice(posting,ctx,posting.origin===QS_STEP8?'채용공고 원문':prevGateStep):''}

    ${resumeTemplateBlock(data,ctx,prior,posting,injeCompact)}

    ${injeCompact?`<div class="hr"></div><div class="block" id="resumeEvidenceImport"><h3>2. 이력서에 사용할 경험 확인하기</h3><p class="help">필요한 경우에만 앞 단계의 학력·자격·경험을 선택해 불러오세요. 이미 작성한 내용은 덮어쓰지 않습니다. STEP 3에서 확인한 경험은 다시 검사하지 않고, 새로 쓴 수치·성과만 확인하세요.</p>${resumeAutoImportBlock(prior,data.templateType,ctx,true)}${resumeExperienceEntryTabs(data,ctx)}<div id="resumeGate"></div></div>`:`<div class="hr"></div><div class="block"><h3>2. Resume Evidence Gate</h3><div id="resumeGate"></div><div class="grid3" style="margin-top:12px"><div class="miniCard"><b>Fact</b><span>하지 않은 일·없는 수치를 쓰지 않는다.</span></div><div class="miniCard"><b>Action</b><span>역할명이 아니라 내가 직접 한 행동을 쓴다.</span></div><div class="miniCard"><b>Evidence</b><span>JD Requirement를 증명하는 Career Asset만 사용한다.</span></div></div></div>`}

    <div class="hr"></div><div class="block"><h3>3. ${injeCompact?'경험을 이력서 문장으로 바꾸기':'Career Asset → Resume Bullet'}</h3><p class="help">${injeCompact?'앞에서 확인한 경험을 선택하고, 실제로 한 일과 결과를 이력서 문장으로 정리하세요.':'Fact Check가 끝나지 않은 자산도 초안 연습은 가능하지만, 최종 제출용으로는 표시하지 않습니다.'}</p><div class="grid2">${selectAsset('assetId',injeCompact?'이력서에 쓸 경험':'Career Asset',candidateAssets)}${sel('section','이력서 섹션','',['프로젝트','인턴·경력','대외활동','아르바이트','교육·수업','기타'])}</div><div id="assetContext" class="callout info">${injeCompact?'경험을 선택하면 실제 행동과 확인 근거를 보여줍니다.':'Career Asset을 선택하면 Evidence와 검증상태를 확인합니다.'}</div>
      <div class="grid2" style="margin-top:12px">${area('rawBullet',injeCompact?'내가 직접 쓴 문장':'내 원문','','내가 먼저 사실 중심으로 작성한 문장')}${area('aiBullet',injeCompact?'AI가 정리한 문장':'AI 구조화','','AI가 제안한 문장 또는 구조')}${area('finalBullet',injeCompact?'최종 이력서 문장':'최종 Bullet','','실제로 한 일과 결과만 사용해 최종 수정')}${area('detailText',injeCompact?'경험기술서용 설명':'경험기술서 확장','','필요 시 3~5문장으로 역할·행동·성과를 확장')}</div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>${injeCompact?'이력서 문장 사실확인':'Resume Fact Check'}</b><span>${injeCompact?'STEP 3에서 확인한 사실과 일치하며, 새로 추가한 수치·성과도 사실임을 확인했습니다.':'행동·수치·결과가 Career Asset 및 원경험의 사실과 일치합니다.'}</span></div></label>
      <div class="actions"><button class="btn secondary" id="copyPrompt">Resume AI 프롬프트 복사</button><button class="btn primary" id="addItem">이력서 문장 추가</button><button type="button" class="btn secondary hidden" id="cancelResumeEdit">수정 취소</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="resumeItems"></div></div>
    ${optionalResumeDocsBlock(data,ctx,candidateAssets)}
    <div class="hr"></div><div class="block"><h3>5. 직무맞춤 요약</h3><div class="grid2">${area('summary','직무 요약',data.summary,'내가 어떤 Evidence를 가진 지원자인지 2~3문장')}${area('skills','직무 관련 Skill·Tool'+sourceBadgeHtml(data,'skills'),data.skills,'JD에서 실제로 요구하고 내가 보유한 Skill·Tool만')}</div><div class="field" style="margin-top:12px"><label>점검 메모</label><textarea id="notes" placeholder="추가 보완할 부분">${esc(data.notes||'',ctx)}</textarea></div><div class="actions"><button class="btn primary" id="saveResume">Resume 저장</button><button class="btn secondary" id="nextStep">STEP ${displayStep+(injeCompact?2:1)} Cover Letter Lab →</button></div></div>
    ${injeCompact?resumeReviewBlock(data,ctx):''}
    ${resumePreviewBlock(injeCompact)}
  <style>@media(max-width:760px){.resumeReadable .jfA4Screen{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.resumeReadable .jfA4Screen .resumeA4Sheet{min-width:0;width:100%!important;padding:14px!important}.resumeReadable .grid3,.resumeReadable .grid4{grid-template-columns:minmax(0,1fr)}.resumeReadable .resumeA4Sheet table{display:block;max-width:100%;overflow-x:auto}}.resumeReadable .resumeA4Sheet{overflow-wrap:anywhere;word-break:keep-all}.resumeReadable .injeResumePrint section>div{font-size:9.5pt!important;line-height:1.5!important}.resumeReadable .injeResumePrint section h2{font-size:12pt!important}.resumeReadable .injeResumePrint table,.resumeReadable .injeResumePrint th,.resumeReadable .injeResumePrint td{font-size:9pt!important;line-height:1.45!important}.resumeReadable .injeResumePrint td,.resumeReadable .injeResumePrint th{overflow-wrap:anywhere;word-break:break-word}.resumeReadable .injeResumePrint>div:first-child>div:last-child{font-size:9pt!important}@media(max-width:760px){.resumeReadable .injeResumePrint table,.resumeReadable .injeResumePrint thead,.resumeReadable .injeResumePrint tbody,.resumeReadable .injeResumePrint tr{display:block;width:100%!important}.resumeReadable .injeResumePrint thead{display:none!important}.resumeReadable .injeResumePrint tr{margin:0 0 10px;border:1px solid #d8dde6;border-radius:6px;overflow:hidden;break-inside:avoid}.resumeReadable .injeResumePrint td{display:grid!important;grid-template-columns:minmax(82px,38%) minmax(0,1fr);gap:7px;align-items:start;width:100%!important;min-width:0;max-width:100%;border:0!important;border-bottom:1px solid #e5e7eb!important;padding:6px!important;white-space:normal!important}.resumeReadable .injeResumePrint td:last-child{border-bottom:0!important}.resumeReadable .injeResumePrint td:before{content:attr(data-label);font-weight:700;color:#475569;overflow-wrap:anywhere}}</style></section>`;

  if(injeCompact)compactInjeResumeUi(root,data);
  const aiGuide=injeCompact?wireResumeAiIntake(data,ctx,persist,posting,candidateAssets):null;
  wireResumeFormUi(data,ctx,persist,candidateAssets,experiences,prior,posting,injeCompact,aiGuide);wireResumePreviewUi(data,ctx,posting,assets,persist,injeCompact);if(injeCompact)wireResumeReviewUi(data,ctx,persist,posting,aiGuide);renderAll();document.getElementById('assetId').addEventListener('change',renderAssetContext);document.getElementById('copyPrompt').addEventListener('click',e=>aiGuide?aiGuide.request('bullet',e.currentTarget,buildPrompt):copy(buildPrompt(),ctx));document.getElementById('addItem').addEventListener('click',addItem);document.getElementById('cancelResumeEdit').addEventListener('click',cancelResumeEdit);document.getElementById('saveResume').addEventListener('click',saveBase);document.getElementById('nextStep').addEventListener('click',()=>{saveBase();ctx.navigate(10)});

  ['summary','skills','notes'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{data[id]=document.getElementById(id).value;persist();}));
  function renderAll(){renderGate();renderItems();renderAssetContext();}
  function renderGate(){const box=document.getElementById('resumeGate');if(!box)return;const verified=candidateAssets.filter(isAssetVerified).length,draft=candidateAssets.length-verified,finalItems=data.items.filter(x=>x.factChecked&&x.assetVerified).length,draftItems=data.items.length-finalItems;if(!injeCompact){box.innerHTML=`<div class="grid4"><div class="miniCard"><b>Career Asset 후보</b><span>${candidateAssets.length}개</span></div><div class="miniCard"><b>검증된 Asset</b><span>${verified}개</span></div><div class="miniCard"><b>검증대기 Asset</b><span>${draft}개</span></div><div class="miniCard"><b>최종 사용 가능 Bullet</b><span>${finalItems}개 · 초안 ${draftItems}개</span></div></div>${draft?'<div class="callout warn"><b>검증대기 Career Asset이 있습니다.</b><br>초안 작성은 가능하지만 최종 Resume에는 Career Asset Fact Check와 원경험 Fact Check를 모두 완료한 항목만 사용하세요.</div>':'<div class="callout good"><b>Career Asset 검증상태 양호</b><br>현재 선택 가능한 자산은 사실검증 상태가 확인되었습니다.</div>'}`;return;}
    box.innerHTML=`<div class="grid3"><div class="miniCard"><b>불러온 경험 근거</b><span>${candidateAssets.length}개</span></div><div class="miniCard"><b>확인 필요</b><span>${draft}개</span></div><div class="miniCard"><b>사용 가능한 문장</b><span>${finalItems}개 · 초안 ${draftItems}개</span></div></div>`;
    if(!candidateAssets.length){box.innerHTML+='<div class="callout info"><b>연결된 경험 근거가 없습니다.</b><br>일반 이력서는 위 양식을 작성하고 저장할 수 있습니다. 직무 맞춤형 문장이 필요하면 STEP 3 경험을 STEP 5 공고 요구사항과 연결하거나 2번에서 경험을 불러오거나 새 경험을 직접 추가하세요.</div>';return;}
    if(draft){box.innerHTML+='<div class="callout warn"><b>확인이 필요한 경험 근거가 있습니다.</b><br>초안은 작성할 수 있지만 최종 이력서 문장에 사용하기 전 사실을 확인하세요.</div>';}
    else{box.innerHTML+='<div class="callout good"><b>앞에서 확인한 경험을 불러왔습니다.</b><br>경험 자체를 다시 검증할 필요는 없습니다. 이력서 문장에서 새로 추가한 내용만 확인하세요.</div>';}
  }
  function renderAssetContext(){
    const box=document.getElementById('assetContext'),a=assets.find(x=>x.id===v('assetId'));
    if(!a){box.className='callout info';box.textContent=candidateAssets.length?'Career Asset을 선택하세요.':(injeCompact?`사용 가능한 Career Asset이 없습니다. ${prevEvidenceStep}에서 연결하거나, 2번에서 검증된 경험을 불러오거나 새 경험을 직접 추가하세요.`:`사용 가능한 Career Asset이 없습니다. ${prevEvidenceStep}에서 JD Requirement와 Evidence를 먼저 연결하세요.`);return;}
    const level=a.evidenceLevel||legacyLevel(a.strength),verified=isAssetVerified(a);
    box.className='callout '+(verified?'good':'warn')+' jfResultBox';
    box.innerHTML='<b>'+esc(level,ctx)+' · '+esc(a.experienceTitle,ctx)+'</b><div class="jfReadFields">'+
      readField('연결 Requirement',a.requirement,ctx)+readField('핵심 행동',a.proof,ctx)+readField('확인 가능한 Evidence',a.fact,ctx)+'</div>'+
      '<p class="jfReadNote">Career Asset: '+esc(a.factCheck||'미확인',ctx)+(a.sourceExperienceFactChecked===false?' · 원경험 Fact Check 미완료':'')+' · '+(verified?'최종 Resume 사용 가능':'현재는 초안용 · 검증 후 최종 사용')+'</p>';
  }
  function addItem(){
    const assetId=v('assetId');
    if(!assetId){status('Career Asset을 선택하세요.');return;}
    const a=assets.find(x=>x.id===assetId),level=a?.evidenceLevel||legacyLevel(a?.strength);
    if(level==='없음'){status('Evidence 없음 자산은 Resume에 사용할 수 없습니다.');return;}
    if(!v('rawBullet')&&!v('finalBullet')&&!v('aiBullet')){status('최소한 내 원문 또는 최종 Bullet을 작성하세요.');return;}
    const assetVerified=isAssetVerified(a),resumeChecked=document.getElementById('factChecked').checked;
    const fields={assetId,assetTitle:a?.experienceTitle||'',requirement:a?.requirement||'',requirementLevel:a?.requirementLevel||'',evidenceLevel:level,assetFactCheck:a?.factCheck||'',assetVerified,section:v('section'),rawBullet:v('rawBullet'),aiBullet:v('aiBullet'),finalBullet:v('finalBullet'),detailText:v('detailText'),factChecked:resumeChecked,status:assetVerified&&resumeChecked?'final-ready':'draft'};
    const updating=!!editingResumeId;
    if(updating){
      const i=data.items.findIndex(x=>x.id===editingResumeId);
      if(i<0){status('수정하려는 문장이 없어졌습니다. 목록을 확인하세요.');return;}
      data.items[i]={...data.items[i],...fields,updatedAt:new Date().toISOString()};
    }else{
      data.items.push({id:'resume_'+Date.now(),...fields,createdAt:new Date().toISOString()});
    }
    persist();cancelResumeEdit();renderAll();
    status((updating?'수정':'추가')+'한 문장을 '+(fields.status==='final-ready'?'Final Ready':'Draft · 검증필요')+' 상태로 저장했습니다.');
  }
  function editResumeItem(id){
    const item=data.items.find(x=>x.id===id);if(!item)return;
    editingResumeId=id;
    for(const field of ['assetId','section','rawBullet','aiBullet','finalBullet','detailText']){
      const el=document.getElementById(field);if(el)el.value=item[field]||'';
    }
    document.getElementById('factChecked').checked=false;
    document.getElementById('addItem').textContent='수정 내용 저장';
    document.getElementById('cancelResumeEdit').classList.remove('hidden');
    renderAssetContext();
    document.getElementById('rawBullet').scrollIntoView({behavior:'smooth',block:'center'});
    status('기존 문장을 불러왔습니다. 내용 수정 후 Fact Check를 다시 체크하고 저장하세요.');
  }
  function cancelResumeEdit(){
    editingResumeId=null;
    for(const field of ['assetId','section','rawBullet','aiBullet','finalBullet','detailText']){const el=document.getElementById(field);if(el)el.value='';}
    document.getElementById('factChecked').checked=false;
    document.getElementById('addItem').textContent='이력서 문장 추가';
    document.getElementById('cancelResumeEdit').classList.add('hidden');
    renderAssetContext();
  }
  function renderItems(){
    const box=document.getElementById('resumeItems');if(!box)return;
    if(!data.items.length){box.innerHTML='<div class="placeholder"><b>아직 Resume 문장이 없습니다.</b>Career Asset을 실제 이력서 문장으로 바꾸세요.</div>';return;}
    box.innerHTML=data.items.map((x,i)=>{
      const ready=x.status==='final-ready'||(x.factChecked&&x.assetVerified);
      return '<div class="listCard jfResultBox"><div class="listHead"><div><span class="rankTag">Resume '+(i+1)+'</span><h3>'+esc(x.assetTitle||'경험',ctx)+'</h3><div class="muted small">'+esc([x.section||'섹션 미정',x.evidenceLevel||'',x.requirementLevel||'중요도 미분류'].filter(Boolean).join(' · '),ctx)+'</div></div><span class="scoreChip">'+(ready?'Final Ready':'Draft · 검증필요')+'</span></div>'+
        '<div class="jfReadFields">'+readField('연결 Requirement',x.requirement,ctx)+readField('최종 Bullet',x.finalBullet||x.aiBullet||x.rawBullet,ctx)+(x.detailText?readField('경험기술',x.detailText,ctx):'')+'</div>'+
        '<div class="actions"><button type="button" class="btn secondary smallBtn" data-edit="'+esc(x.id,ctx)+'">수정</button><button class="btn danger smallBtn" data-del="'+esc(x.id,ctx)+'">삭제</button></div></div>';
    }).join('');
    box.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editResumeItem(b.dataset.edit)));
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{if(!window.confirm('선택한 이력서 문장을 삭제할까요?'))return;if(editingResumeId===b.dataset.del)cancelResumeEdit();data.items=data.items.filter(x=>x.id!==b.dataset.del);persist();renderAll();}));
  }
  function buildPrompt(){const a=assets.find(x=>x.id===v('assetId'));const currentJD=injeCompact?(data.applicationMode==='targeted'?`${data.targetCompany||'지원기업 미정'} / ${valueAt(data,resumeTargetJobPath(data.templateType))||posting?.jobTitle||'지원직무 미정'}\n${data.targetJDText||(data.targetCompany===posting?.company?posting?.rawPosting:'')||'공고 내용 확인 필요'}`:'기업·직무 미지정 일반형'):null;return `너는 이력서 문장 코치다. 아래 Career Asset에 기록된 사실만 사용해 Resume bullet을 구조화해라. 없는 숫자·성과·역할은 만들지 마라.\n\n[Target JD]\n${injeCompact?currentJD:posting?`${posting.company} / ${posting.jobTitle}\n${posting.rawPosting||''}`:'미등록'}\n\n[Career Asset]\n${JSON.stringify(a||{},null,2)}\n\n[선택 이력서 양식]\n${resumeTemplateLabel(data.templateType)}\n\n[내가 먼저 쓴 문장]\n${v('rawBullet')||'미작성'}\n\n규칙:\n1. Career Asset의 Evidence 수준이 '없음'이면 문장을 만들지 말고 GAP라고 알려라.\n2. Career Asset 또는 원경험 Fact Check가 미완료이면 결과를 '초안'이라고 명시해라.\n3. 내가 직접 한 Action이 앞에 드러나게 한다.\n4. 대상·방법·결과·Evidence 중 실제 존재하는 정보만 사용한다.\n5. 수치가 없으면 만들지 않는다.\n6. JD 키워드를 억지로 삽입하지 않는다.\n7. 1줄 Bullet 2안과 경험기술서용 3~4문장 1안을 제시한다.\n8. 원문보다 과장된 표현과 사실확인이 필요한 표현을 마지막에 따로 표시한다.`}
  function saveBase(){data.summary=v('summary');data.skills=v('skills');data.notes=v('notes');persist();ctx.toast('Resume Lab 결과를 저장했습니다.');}
  function persist(){ctx.saveState({artifacts:{resumeLab:data}});const p=document.getElementById('resumeSavedProgress');if(p)p.textContent=resumeSavedProgressText(data);}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function gateNotice(p,ctx,prevGateStep='STEP 7'){const fail=(p.gates||[]).filter(x=>x.status==='미충족'),check=(p.gates||[]).filter(x=>x.status==='확인 필요');if(fail.length)return `<div class="callout warn"><b>Application Gate 미충족</b><br>${fail.map(x=>esc(x.text,ctx)).join(' · ')}<br>이력서 작성과 별개로 지원자격 충족 여부를 먼저 확인하세요.</div>`;if(check.length||!p.gateReviewed)return `<div class="callout info"><b>지원자격 확인 미완료</b><br>Resume를 작성할 수는 있지만 실제 지원 전 ${prevGateStep}의 지원자격을 반드시 확인하세요.</div>`;return ''}
function isAssetVerified(a){return !!a&&a.factCheck==='검증완료'&&a.sourceExperienceFactChecked!==false}
function legacyLevel(n){return n>=5?'A · 직접 증거':n>=3?'B · 관련 증거':n>=2?'C · 간접 증거':'없음'}function selectAsset(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">[${x.evidenceLevel||legacyLevel(x.strength)}] ${x.experienceTitle} → ${x.requirement}${isAssetVerified(x)?' · ✓':' · 검증필요'}</option>`).join('')}</select></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('Resume 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}


function ensureResumeForms(data){
  data.templateType=data.templateType||'standard';
  data.forms=data.forms&&typeof data.forms==='object'?data.forms:{};
  data.forms.standard=data.forms.standard||{};
  data.forms.ncs=data.forms.ncs||{};
  data.forms.blind=data.forms.blind||{};
  data.optionalDocument=data.optionalDocument&&typeof data.optionalDocument==='object'?data.optionalDocument:{};
  data.optionalDocument.type=data.optionalDocument.type||'none';
  data.optionalDocument.experience=data.optionalDocument.experience||{};
  data.optionalDocument.career=data.optionalDocument.career||{};
  data.importSources=data.importSources&&typeof data.importSources==='object'?data.importSources:{};
  data.optionalAiDrafts=data.optionalAiDrafts&&typeof data.optionalAiDrafts==='object'?data.optionalAiDrafts:{};
  data.additionalExperiences=Array.isArray(data.additionalExperiences)?data.additionalExperiences:[];
  data.extraExperienceMode=data.extraExperienceMode||'imported';
}
function ensureResumeTargeting(data,posting){
  if(data.applicationMode!=='targeted'&&data.applicationMode!=='general')data.applicationMode=posting?'targeted':'general';
  if(typeof data.targetCompany!=='string')data.targetCompany='';
  if(typeof data.targetJDText!=='string')data.targetJDText='';
  data.resumeJobSearchOpen=data.resumeJobSearchOpen===true;
  if(!data.resumeJobSearchDraft||typeof data.resumeJobSearchDraft!=='object')data.resumeJobSearchDraft={company:'',job:'',url:'',details:''};
  if(!data.reviewFeedbacks||typeof data.reviewFeedbacks!=='object'||Array.isArray(data.reviewFeedbacks))data.reviewFeedbacks={};
  if(!data.reviewHistory||typeof data.reviewHistory!=='object'||Array.isArray(data.reviewHistory))data.reviewHistory={};
  if(!data.aiIntakeAnswers||typeof data.aiIntakeAnswers!=='object'||Array.isArray(data.aiIntakeAnswers))data.aiIntakeAnswers={};
}


const RESUME_AI_ASK_RULE=[
  '[STEP 8 공통 · 정보 부족 시 질문부터]',
  '아래 내용을 먼저 살펴보고, 결과 작성에 반드시 필요한 사실이 부족하거나 서로 모순되면 학생에게 최대 3개의 짧은 질문을 먼저 해. 답변을 받기 전에는 누락된 정보를 추정해 채우지 마.',
  '학생이 답하면 해당 정보를 반영하고, 여전히 필수 사실이 부족할 때만 후속 질문을 해. 앞에서 확인된 내용은 반복해서 묻지 마.',
  '답하지 못한 사실은 [확인 필요]로 표시하고 확인 가능한 범위까지만 작성해. 학생이 제공한 수치·경력·성과는 검증 전 정보이며 사실로 단정하지 마.',
  '채용공고는 실제 원문·모집기간을 확인한 경우만 모집 중이라고 판정하고, 없는 링크·성과·직무 요건을 만들지 마.',
  '최종 이력서나 기술서는 학생이 직접 확인·수정하도록 해. 개인 이름·연락처 등 불필요한 개인정보는 요구하지 마.'
].join('\n');
function resumeAiIntakeScope(scope,data){
  return scope==='review'?'review_'+data.templateType+'_'+data.applicationMode:scope;
}
function resumeAiWithIntakeRules(prompt,scope,data){
  const key=resumeAiIntakeScope(scope,data),answers=data.aiIntakeAnswers?.[key]||{};
  const extra=Object.entries(answers).filter(([,v])=>String(v||'').trim()).map(([k,v])=>'- '+k+': '+String(v).trim()).join('\n');
  return RESUME_AI_ASK_RULE+'\n\n'+(extra?'[학생이 질문에 직접 답한 보충 정보 · 사실 확인 전]\n'+extra+'\n\n':'')+prompt;
}
function resumeAiIntakeQuestions(scope,data,ctx,posting,assets){
  const value=x=>String(x==null?'':x).trim();
  const ask=(key,label,has,placeholder='',target='')=>({key,label,has:!!value(has),placeholder,target});
  const form=data.forms?.[data.templateType]||{},job=value(valueAt(data,resumeTargetJobPath(data.templateType)));
  if(scope==='search'){
    const state=ctx.getState(),explorer=state.artifacts?.jobExplorer||{};
    const combos=explorer.targetCombos||[],candidate=(explorer.candidates||[]).find(x=>x.id===combos[0]?.jobId)||(explorer.candidates||[])[0]||{};
    return [
      ask('job','관심 있는 직무는 무엇인가요?',job||candidate.title||posting?.jobTitle||data.resumeJobSearchDraft?.job,'예: 콘텐츠 마케팅'),
      ask('industry','관심 산업은 어디인가요?',combos[0]?.industry||(explorer.industryInterests||[])[0],'예: 패션·유통 / 정하지 못했으면 관심 분야'),
      ask('major','전공이 무엇인가요?',state.profile?.major,'예: 경영학과')
    ];
  }
  if(scope==='bullet'){
    const el=document.getElementById('assetId'),a=(assets||[]).find(x=>x.id===el?.value)||{};
    const raw=document.getElementById('rawBullet')?.value||'';
    return [
      ask('experience','어떤 경험을 이력서에 쓰려고 하나요?',a.experienceTitle||raw,'예: 캡스톤 프로젝트'),
      ask('action','그 경험에서 직접 한 일은 무엇인가요?',a.proof||raw,'예: 고객 리뷰 30건을 분류'),
      ask('result','확인 가능한 결과나 산출물은 무엇인가요?',a.fact||a.result||'','예: 분류표 작성 / 아직 없다면 모르겠어요')
    ];
  }
  if(scope==='experience'){
    const doc=data.optionalDocument?.experience||{},a=(assets||[]).find(x=>x.id===doc.assetId)||{};
    return [
      ask('title','경험 이름이 무엇인가요?',doc.title||a.experienceTitle,'예: 교내 마케팅 프로젝트','optionalDocument.experience.title'),
      ask('action','직접 수행한 행동은 무엇인가요?',doc.action||a.proof,'예: 설문 40건을 분류','optionalDocument.experience.action'),
      ask('result','확인 가능한 결과·산출물은 무엇인가요?',doc.resultEvidence||a.fact,'예: 분석표·피드백 / 없다면 미확인','optionalDocument.experience.resultEvidence'),
      ask('period','활동 시기는 언제인가요?',doc.period,'예: 2026.03~2026.06','optionalDocument.experience.period')
    ];
  }
  if(scope==='career'){
    const doc=data.optionalDocument?.career||{},a=(assets||[]).find(x=>x.id===doc.assetId)||{};
    return [
      ask('company','어느 회사·기관에서 일했나요?',doc.company,'예: OO기업','optionalDocument.career.company'),
      ask('duties','직접 담당한 업무는 무엇인가요?',doc.duties||a.proof,'예: 고객문의 유형별 분류','optionalDocument.career.duties'),
      ask('achievements','검증 가능한 업무 결과는 무엇인가요?',doc.achievements||a.fact,'예: 업무 기록표 / 없다면 확인 필요','optionalDocument.career.achievements'),
      ask('period','근무 기간은 언제인가요?',doc.period,'예: 2025.07~2025.08','optionalDocument.career.period')
    ];
  }
  if(scope==='review'){
    const targeted=data.applicationMode==='targeted';
    const hasText=v=>typeof v==='string'?!!v.trim():Array.isArray(v)?v.some(hasText):v&&typeof v==='object'?Object.values(v).some(hasText):false;
    const hasExperience=!!(data.items||[]).length||!!(data.additionalExperiences||[]).length||!!(data.summary||'').trim()||Object.entries(form).some(([k,v])=>/^(activities|career|experience|projects|workHistory|internships)$/i.test(k)&&hasText(v));
    return [
      ...(targeted?[
        ask('company','지원하는 회사·기관은 어디인가요?',data.targetCompany||posting?.company,'예: OO기업','targetCompany'),
        ask('job','지원직무는 무엇인가요?',job||posting?.jobTitle,'예: 디지털 마케팅',resumeTargetJobPath(data.templateType)),
        ask('jd','공고의 실제 담당업무나 필수요건을 알고 있나요?',data.targetJDText||posting?.rawPosting,'공고에서 직접 확인한 내용을 붙여넣으세요. 모르면 비워두세요.','targetJDText')
      ]:[]),
      ask('focus','이력서에서 특히 확인할 경험·부분이 있나요?',hasExperience,'예: 고객 분석 경험을 직무와 연결했는지')
    ];
  }
  return [];
}
function wireResumeAiIntake(data,ctx,persist,posting,assets){
  const root=document.getElementById('stepRoot');
  let pending=null;
  function missing(scope){
    const saved=data.aiIntakeAnswers?.[resumeAiIntakeScope(scope,data)]||{};
    return resumeAiIntakeQuestions(scope,data,ctx,posting,assets)
      .filter(q=>!q.has&&!String(saved[q.key]||'').trim());
  }
  function panel(scope,anchor){
    const old=root.querySelector('#resumeAiIntakePanel');if(old)old.remove();
    const questions=missing(scope).slice(0,3);
    if(!questions.length)return false;
    const wrapper=document.createElement('div');wrapper.id='resumeAiIntakePanel';
    wrapper.className='callout info';wrapper.style.marginTop='12px';
    wrapper.innerHTML='<b>AI 답변에 필요한 정보를 먼저 확인할게요.</b>'
      +'<p class="help">앞 단계에서 찾지 못한 정보만 질문합니다. 모르는 항목은 비워두고 진행할 수 있습니다. 입력한 내용은 초안용이며 기존 이력서를 덮어쓰지 않습니다.</p>'
      +questions.map((q,i)=>'<div class="field"><label for="resumeAiQuestion'+i+'">'+(i+1)+'. '+esc(q.label,ctx)+'</label><textarea id="resumeAiQuestion'+i+'" data-ai-intake-answer="'+esc(q.key,ctx)+'" rows="2" placeholder="'+esc(q.placeholder,ctx)+'"></textarea></div>').join('')
      +'<div class="actions"><button type="button" class="btn primary" data-ai-intake-apply>답변 반영하고 프롬프트 완성</button><button type="button" class="btn secondary" data-ai-intake-skip>잘 모르겠어요 · 확인 필요로 진행</button></div>';
    anchor?.closest('.actions')?.insertAdjacentElement('afterend',wrapper);
    if(!wrapper.isConnected)root.appendChild(wrapper);
    pending={scope,questions};
    wrapper.scrollIntoView({behavior:'smooth',block:'nearest'});
    return true;
  }
  function prepare(scope,raw){return resumeAiWithIntakeRules(raw,scope,data);}
  function request(scope,anchor,build){
    pending={scope,build};
    if(panel(scope,anchor)){pending.build=build;return;}
    pending=null;copy(prepare(scope,build()),ctx);
  }
  root.addEventListener('click',function(e){
    const apply=e.target.closest('[data-ai-intake-apply]'),skip=e.target.closest('[data-ai-intake-skip]');
    if(!apply&&!skip||!pending)return;
    const current=pending,pane=root.querySelector('#resumeAiIntakePanel');if(!pane)return;
    const key=resumeAiIntakeScope(current.scope,data);
    data.aiIntakeAnswers=data.aiIntakeAnswers||{};
    const bag=data.aiIntakeAnswers[key]||(data.aiIntakeAnswers[key]={});
    if(apply){
      current.questions.forEach(q=>{
        const field=[...pane.querySelectorAll('[data-ai-intake-answer]')].find(x=>x.dataset.aiIntakeAnswer===q.key);
        const answer=String(field?.value||'').trim();if(!answer)return;
        const unknown=/^(?:모름|모르겠어요|잘 모르겠어요|미정|확인 필요|해당 없음)$/i.test(answer);
        bag[q.key]=unknown?'[확인 필요]':answer;
        if(!unknown&&q.target&&!String(valueAt(data,q.target)||'').trim()){
          setValueAt(data,q.target,answer);
          const active=root.querySelector('[data-resume-bind="'+q.target+'"]');if(active)active.value=answer;
          if(q.target.startsWith('optionalDocument.')){
            const type=q.target.split('.')[1];if(data.optionalDocument?.[type])data.optionalDocument[type].factChecked=false;
          }
        }
      });
      persist();
    }
    pane.remove();
    if(apply&&missing(current.scope).length){
      const nextButton=root.querySelector(current.scope==='search'?'#copyResumeJdSearchPrompt':current.scope==='bullet'?'#copyPrompt':current.scope==='review'?'#copyResumeReviewPrompt':'#copyResumeOptionalAiPrompt');
      pending={scope:current.scope,build:current.build};
      if(panel(current.scope,nextButton)){pending.build=current.build;return;}
    }
    pending=null;
    if(current.scope==='search'){
      const el=document.getElementById('resumeJdSearchPrompt');
      if(el&&apply){
        const original=buildResumeJdSearchPrompt(ctx,data,posting);
        // Preserve any edits the learner made to the existing search prompt.
        if(!el.dataset.manualEdit||el.value.includes('관심 산업 미정')||el.value.includes('관심 직무 미정'))el.value=original;
      }
    }
    if(current.scope==='review'){
      const prompt=prepare(current.scope,current.build());
      const el=document.getElementById('resumeReviewPromptText');if(el)el.value=prompt;
    }
    copy(prepare(current.scope,current.build()),ctx);
    ctx.toast(apply?'답변을 반영한 AI 프롬프트를 복사했습니다.':'부족한 정보는 확인 필요로 남긴 AI 프롬프트를 복사했습니다.');
  });
  root.addEventListener('input',function(e){
    if(e.target.id==='resumeJdSearchPrompt')e.target.dataset.manualEdit='true';
  });
  return {request,prepare};
}

function buildResumeJdSearchPrompt(ctx,data,posting){
  const s=ctx.getState(), explorer=s.artifacts?.jobExplorer||{}, combos=explorer.targetCombos||[];
  const candidate=(explorer.candidates||[]).find(x=>x.id===combos[0]?.jobId)||(explorer.candidates||[])[0]||{};
  const answers=data.aiIntakeAnswers?.search||{};
  const industry=combos[0]?.industry||(explorer.industryInterests||[])[0]||answers.industry||'관심 산업 미정';
  const job=String(valueAt(data,resumeTargetJobPath(data.templateType))||candidate.title||posting?.jobTitle||answers.job||'관심 직무 미정');
  const major=s.profile?.major||answers.major||'전공 미입력';
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return [
    '나는 '+major+' 전공 대학생이며, '+industry+' 산업의 '+job+' 직무를 탐색하고 있어.',
    '확인 기준일: '+date+' (대한민국 표준시 KST). 반드시 오늘 기준 실제 모집 상태를 확인해.',
    '[검색 순서]',
    '1. 기업·기관 공식 채용페이지에서 현재 모집 중인 신입 및 채용연계형 인턴',
    '2. 사람인·잡코리아·고용24의 현재 공고',
    '3. 공공기관이라면 잡알리오·클린아이 잡플러스',
    '4. 모집 중인 적합 공고가 없다면 최근 6개월 이내의 마감 공고를 참고용으로만',
    '[사실 확인 규칙]',
    '- 확인한 접수 시작일·마감일을 기준으로 모집 중 / 마감 / 확인 필요를 구분해.',
    '- 실제 원문 URL이 확인된 경우만 적고 링크를 만들어내지 마.',
    '- 확인하지 못한 사항은 확인 필요라고 적어. 전공만으로 직무 적합성을 판단하지 마.',
    '- 공고 이름이 비슷해도 실제 업무가 다른 직무는 제외해.',
    '[출력 항목: 적합 공고 최대 3개]',
    '기업·기관명 | 공고명 | 지원직무 | 모집상태 | 접수기간 | 원문 URL | 담당업무 | 필수조건 | 우대사항',
    '각 공고 아래에 지원직무에 맞게 이력서에서 강조할 확인된 경험·역량 종류를 최대 3개 제시해.',
    '현재 공고가 없다면 없다고 명확하게 말하고 최근 6개월 공고를 따로 제시해.'
  ].join('\n');
}
function resumeJdSearchPanel(data,ctx,posting){
  const draft=data.resumeJobSearchDraft||{};
  const sites=[
    ['사람인','https://www.saramin.co.kr/','민간기업'],
    ['잡코리아','https://www.jobkorea.co.kr/','민간기업'],
    ['고용24','https://www.work24.go.kr/','정부 채용정보'],
    ['잡알리오','https://job.alio.go.kr/','공공기관'],
    ['클린아이 잡플러스','https://job.cleaneye.go.kr/','지방공공기관']
  ];
  return '<div style="margin-top:12px" id="resumeFindJdPanel">'
    +'<div class="callout info"><b>공고를 찾은 뒤 이력서에 연결하세요.</b><br>기존 이력서는 그대로 유지합니다. 검색 결과는 자동으로 저장되지 않으며 학생이 확인해 선택한 공고만 반영합니다.</div>'
    +'<p class="help" style="margin:10px 0 6px"><b>① 채용공고 직접 찾아보기</b></p>'
    +'<div class="grid3">'+sites.map(x=>'<a class="btn secondary" style="display:block;text-align:left;white-space:normal" href="'+x[1]+'" target="_blank" rel="noopener noreferrer">'+x[0]+'<span class="muted small" style="display:block">'+x[2]+'</span></a>').join('')+'</div>'
    +'<details class="detailsBox" style="margin-top:12px"><summary>② AI에게 현재 채용공고 찾아달라고 하기 · 선택</summary><p class="help">앞 단계 정보로 생성한 프롬프트입니다. 관심 산업·직무가 다르면 직접 고친 뒤 웹 검색이 가능한 AI에 붙여넣으세요. 공고 원문과 접수기간은 직접 확인해야 합니다.</p>'
    +'<textarea id="resumeJdSearchPrompt" rows="13" aria-label="수정 가능한 AI 채용공고 검색 프롬프트">'+esc(buildResumeJdSearchPrompt(ctx,data,posting),ctx)+'</textarea>'
    +'<div class="actions"><button class="btn secondary" type="button" id="copyResumeJdSearchPrompt">내 공고검색 프롬프트 복사</button></div></details>'
    +'<p class="help" style="margin:12px 0 6px"><b>③ 실제 확인한 공고 한 개 기록하기</b></p>'
    +'<div class="grid2">'
    +boundField(data,ctx,'resumeJobSearchDraft.company','기업·기관명 · 필수','기업명')
    +boundField(data,ctx,'resumeJobSearchDraft.job','찾은 지원직무 · 필수','공고의 실제 직무명')
    +'</div>'
    +boundField(data,ctx,'resumeJobSearchDraft.url','공고 원문 URL · 선택','https://...')
    +boundArea(data,ctx,'resumeJobSearchDraft.details','담당업무·필수조건 · 선택','공고의 직무내용을 직접 확인하여 붙여넣으세요. 내용이 없으면 직무 맞춤 검토는 제한됩니다.')
    +(posting?'<div class="actions"><button class="btn secondary smallBtn" type="button" id="resumeSearchUseStep5">STEP 5에서 선택한 공고를 위 빈칸에 불러오기</button></div>':'')
    +'<div class="actions"><button class="btn primary" type="button" id="resumeApplyFoundJD">이 공고로 직무맞춤형 이력서 작성</button><button class="btn secondary" type="button" data-application-mode="general">공고가 없어도 이력서 먼저 작성</button></div>'
    +'<p class="help">공고 탐색은 선택사항입니다. 이력서 작성과 PDF 저장을 막지 않습니다.</p>'
    +'</div>';
}
function resumeTargetingBlock(data,ctx,posting){
  const searching=!!data.resumeJobSearchOpen,selected=data.applicationMode==='targeted';
  return '<div class="listCard" id="resumeTargetMode" style="margin:12px 0">'
    +'<h3>작성 방향 선택 · 지원직무 확인</h3><p class="help">지원처를 찾거나, 아직 정하지 않은 상태로 먼저 작성할 수 있습니다. 어느 쪽이든 기존 입력은 유지됩니다.</p>'
    +'<div class="actions"><button type="button" class="btn '+(!searching&&selected?'primary':'secondary')+'" data-application-mode="targeted">지원 기업·직무가 있어요</button>'
    +'<button type="button" class="btn '+(!searching&&!selected?'primary':'secondary')+'" data-application-mode="general">아직 정하지 않았어요</button>'
    +'<button type="button" class="btn '+(searching?'primary':'secondary')+'" data-application-mode="search">공고 찾아볼래요</button></div>'
    +(searching?resumeJdSearchPanel(data,ctx,posting):selected?'<div class="callout info" style="margin-top:10px"><b>직무맞춤형 작성</b><br>회사와 직무를 확인하고 채용공고의 업무·자격요건에 맞춰 작성하세요. 지원직무는 선택한 이력서의 기본정보에서 직접 수정합니다.</div>'
      +boundField(data,ctx,'targetCompany','지원 기업 · 선택','지원 기업명')
      +boundArea(data,ctx,'targetJDText','채용공고 주요 내용 · 선택','실제 공고의 주요 업무·필수/우대조건. 없다면 비워두세요.')
      +(posting?'<div class="actions"><button type="button" class="btn secondary smallBtn" id="loadSelectedResumeJD">STEP 5 채용공고 불러오기</button></div>':'')
      :'<div class="callout info" style="margin-top:10px"><b>일반 이력서 작성</b><br>지원 기업과 직무가 없어도 학력·경험·경력·자격을 작성할 수 있습니다. 지원직무 항목은 비워도 됩니다. 이후 기업에 지원할 때 직무맞춤형으로 수정하세요.</div>')
    +'</div>';
}

function resumeTargetJobPath(type){
  return type==='ncs'?'forms.ncs.job':type==='blind'?'forms.blind.targetJob':'forms.standard.targetJob';
}
function resumeReviewKey(data){return data.templateType+'_'+data.applicationMode;}
function refreshResumeReview(data,ctx){
  var panel=document.getElementById('resumeAiReview');if(panel)panel.outerHTML=resumeReviewBlock(data,ctx);
}
function resumeRedactForAi(obj){
  if(Array.isArray(obj))return obj.map(resumeRedactForAi);
  if(obj&&typeof obj==='object'){
    var out={};
    Object.keys(obj).forEach(function(key){
      if(/^(name|nameKo|nameEn|phone|mobile|email|address|residentNumber|birthDate)$/i.test(key))out[key]='[개인정보 제외]';
      else out[key]=resumeRedactForAi(obj[key]);
    });return out;
  }
  return obj;
}
function buildResumeReviewPrompt(data,posting=null){
  var form=resumeRedactForAi(data.forms?.[data.templateType]||{}),targeted=data.applicationMode==='targeted';
  var bullet=(data.items||[]).map(function(x){return {section:x.section||'',original:x.rawBullet||'',final:x.finalBullet||x.aiBullet||'',experience:x.assetTitle||'',verified:!!(x.factChecked&&x.assetVerified)};});
  var additional=(data.additionalExperiences||[]).filter(function(x){return x.templateType===data.templateType;}).map(function(x){return {title:x.title,actionResult:x.actionResult,period:x.period};});
  return [
    '역할: 대학생·취업준비생을 위한 한국어 이력서 검토자. 문장을 대신 창작하기보다 학생이 고쳐야 할 부분을 정확히 찾아라.',
    '[검토 대상]',resumeTemplateLabel(data.templateType)+' / '+(targeted?'지원 기업·직무 맞춤형':'기업·직무 미지정 일반형'),
    '[지원 기업]',targeted?(data.targetCompany||posting?.company||'미입력'):'미지정',
    '[채용공고 근거]',targeted?(data.targetJDText||posting?.rawPosting||'미입력 - 직무 키워드를 임의로 만들지 마라'):'미지정 - JD 관련성 점검을 요구하지 마라',
    '[공고 원문 URL · 직접 확인]',targeted?(data.resumeSearchSourceUrl||'미기록'):'해당 없음',
    '[선택 양식에 입력한 내용 - 연락처·이름·주소 등 일부 개인정보 제외]',JSON.stringify(form,null,2),
    '[경험 문장과 확인 상태]',JSON.stringify(bullet,null,2),
    '[이번 단계에서 추가한 경험]',JSON.stringify(additional,null,2),
    '[검토 원칙]',
    '1. 표준/NCS/블라인드 중 해당 양식의 요구항목과 기재 위치를 확인하고, 실제 기업 지정 양식이 우선임을 알린다.',
    '2. 누락, 날짜 역순, 오탈자, 띄어쓰기, 표기 일관성, 지원직무 일치, 자격/어학 취득 상태를 점검한다.',
    '3. 역할명이나 추상어 대신 직접 한 행동·대상·방법·실제 결과가 드러나는지 점검한다.',
    '4. 근거 없는 수치, 역할 확대, 팀 성과를 개인 성과로 바꾼 표현은 사실확인 필요로 표시한다. 숫자를 새로 만들지 않는다.',
    '5. 블라인드 양식은 학교명·출신지역·성별·나이·가족관계 등 직무 무관 개인정보 노출을 특히 점검한다.',
    '6. 직무맞춤형이고 채용공고가 제공된 경우에만 공고 요구사항과 이력의 연결을 확인한다. 일반형에는 JD를 추정하지 않는다.',
    '7. 기존 사실을 유지하며 수정 제안을 제시한다. 확인되지 않은 자격/경력/성과를 새로 추가하지 않는다.',
    '8. 지원직무가 이력서 상단에 명확히 표시되어 있는지, 공고의 주요 업무·필수 요구사항과 직무경험이 실제로 연결되는지를 최우선으로 점검한다.',
    '[우선 출력 - 지원직무 반영 점검]',
    '채용공고 업무·요구사항 | 이력서에 적힌 관련 경험·자격 | 근거 수준(직접/간접/없음) | 학생이 고칠 부분',
    '공고가 없으면 이 표를 생략하고 학생이 선택한 직무와 이력서 일치 여부만 점검한다.',
    '[출력 - 반드시 아래 표 형식]',
    '검토 위치 | 문제 유형 | 원문 | 수정 제안 | 수정 이유 | 학생 확인 필요 여부',
    '표 아래에 ① 바로 수정 가능한 표현 ② 사실확인이 필요한 사항 ③ 누락된 정보(있을 경우)를 구분한다.',
    '원문에 없는 정보는 [확인 필요]로 표시한다. 수정은 학생이 직접 결정한다.'
  ].join('\n');
}
function resumeReviewHistory(data){
  var key=resumeReviewKey(data);
  data.reviewHistory=data.reviewHistory&&typeof data.reviewHistory==='object'?data.reviewHistory:{};
  if(!Array.isArray(data.reviewHistory[key]))data.reviewHistory[key]=[];
  return data.reviewHistory[key];
}
function resumeReviewBlock(data,ctx){
  var key=resumeReviewKey(data),feedback=data.reviewFeedbacks?.[key]||'';
  var history=resumeReviewHistory(data),count=history.length;
  var past=history.slice(0,-1).map(function(item,i){
    return '<div class="listCard" style="margin-top:8px"><b>'+(i+1)+'차 검토</b>'
      +(item.feedback?'<p class="jfResultBox" style="white-space:pre-wrap;margin:8px 0 0">'+esc(item.feedback,ctx)+'</p>':'<p class="muted small">검토 결과를 기록하지 않았습니다.</p>')+'</div>';
  }).join('');
  return '<div class="hr"></div><div class="block" id="resumeAiReview">'
    +'<h3>'+(ctx.displayStep===7?'3. AI 최종 검토 · 학생 직접 수정':'6. AI 검토 → 직접 수정 → 다시 검토')+'</h3>'
    +'<p class="help">필요한 만큼 다시 검토할 수 있습니다. AI 수정 제안은 자동 반영되지 않으며, 이력서 양식에서 학생이 직접 고칩니다. PDF 저장은 학생이 마지막에 선택합니다.</p>'
    +'<div class="callout info"><b>반복할 수 있는 검토 과정</b><br>① AI 검토 프롬프트 복사 → ② ChatGPT 등 AI에서 검토 → ③ 결과 붙여넣기 → ④ 학생이 원본 이력서 수정 → ⑤ 수정한 이력서로 AI 재검토 → ⑥ 원하는 때 PDF 저장 선택</div>'
    +'<div class="callout warn"><b>개인정보 주의</b><br>이름·연락처·주소 입력란은 AI 프롬프트에서 제외합니다. 자유서술에 개인정보가 있다면 복사 전에 직접 확인하세요.</div>'
    +'<p class="help" id="resumeReviewRoundStatus">현재 양식의 AI 검토 요청 '+count+'회'+(count?' · 최신 '+count+'차 결과 입력란 표시':' · 아직 요청하지 않았습니다.')+'</p>'
    +'<div class="actions"><button type="button" class="btn secondary" id="previewResumeReviewPrompt">AI 검토 프롬프트 확인</button>'
    +'<button type="button" class="btn primary" id="copyResumeReviewPrompt">AI 검토 프롬프트 복사</button></div>'
    +'<div class="field" style="margin-top:10px"><label>AI 검토 프롬프트 · 복사 전에 확인</label><textarea id="resumeReviewPromptText" readonly placeholder="검토 프롬프트를 확인한 뒤 AI에 붙여넣으세요." style="min-height:100px"></textarea></div>'
    +'<div class="field"><label>이번 AI 검토 결과 붙여넣기 · '+(data.templateType==='ncs'?'NCS':data.templateType==='blind'?'블라인드':'표준')+' / '+(data.applicationMode==='general'?'일반형':'맞춤형')+'</label><textarea id="resumeReviewFeedback" placeholder="AI가 제안한 수정 사항을 붙여넣으세요. 이 내용은 이력서에 자동 반영되지 않습니다.">'+esc(feedback,ctx)+'</textarea></div>'
    +'<div class="actions"><button type="button" class="btn secondary" id="backToResumeForm">이력서로 돌아가 직접 수정</button>'
    +'<button type="button" class="btn primary" id="redoResumeReview">수정 후 AI 재검토하기</button>'
    +'<button type="button" class="btn secondary" id="goToResumePdf">PDF 저장 선택하기</button></div>'
    +(history.length>1?'<details class="detailsBox" id="resumeReviewHistory" style="margin-top:12px"><summary>이전 AI 검토 결과 '+(history.length-1)+'건 보기</summary>'+past+'</details>':'')
    +'<p class="help">재검토 버튼은 현재 수정한 이력서를 기준으로 새 프롬프트를 만듭니다. 이전 검토 의견은 위 기록에 남습니다. PDF 저장은 자동 실행되지 않습니다.</p>'
    +'</div>';
}
function wireResumeReviewUi(data,ctx,persist,posting=null,aiGuide=null){
  var root=document.getElementById('stepRoot');
  function showPrompt(newRound){
    var key=resumeReviewKey(data),history=resumeReviewHistory(data);
    if(newRound||!history.length){
      if(newRound)data.reviewFeedbacks[key]='';
      history.push({requestedAt:new Date().toISOString(),feedback:newRound?'':(data.reviewFeedbacks[key]||'')});
      persist();
      refreshResumeReview(data,ctx);
    }
    var prompt=aiGuide?aiGuide.prepare('review',buildResumeReviewPrompt(data,posting)):buildResumeReviewPrompt(data,posting),el=document.getElementById('resumeReviewPromptText');
    if(el)el.value=prompt;
    return prompt;
  }
  root.addEventListener('click',function(e){
    if(e.target.closest('#redoResumeReview')){
      showPrompt(true);
      ctx.toast('현재 수정 내용을 기준으로 AI 재검토 프롬프트를 만들었습니다. 다시 AI에 붙여넣어 검토하세요.');
      document.getElementById('resumeReviewPromptText')?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if(e.target.closest('#previewResumeReviewPrompt')){
      showPrompt(false);
      return;
    }
    if(e.target.closest('#copyResumeReviewPrompt')){
      var el=document.getElementById('resumeReviewPromptText');
      var prompt=el?.value||showPrompt(false);
      if(aiGuide)aiGuide.request('review',e.target.closest('#copyResumeReviewPrompt'),()=>buildResumeReviewPrompt(data,posting));
      else copy(prompt,ctx);
      return;
    }
    if(e.target.closest('#backToResumeForm')){
      window.JobfitStepAccordion?.openBlock?.(document.getElementById('resumeTemplateLab'));document.getElementById('resumeTemplateForm')?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    if(e.target.closest('#goToResumePdf')){
      window.JobfitStepAccordion?.openBlock?.(document.getElementById('resumePreviewLab'));document.getElementById('resumePreviewLab')?.scrollIntoView({behavior:'smooth',block:'start'});
      ctx.toast('PDF로 저장할지 선택하세요. 저장하지 않고 다시 수정·검토해도 됩니다.');
    }
  });
  root.addEventListener('input',function(e){
    if(e.target.id==='resumeReviewFeedback'){
      var key=resumeReviewKey(data);
      data.reviewFeedbacks[key]=e.target.value;
      var history=resumeReviewHistory(data);
      if(!history.length)history.push({requestedAt:new Date().toISOString(),feedback:''});
      history[history.length-1].feedback=e.target.value;
      persist();
    }
  });
}
function resumeTemplateLabel(type){
  return type==='ncs'?'NCS 이력서':type==='blind'?'블라인드 이력서':'표준이력서';
}
function resumeTemplateBlock(data,ctx,prior,posting=null,injeCompact=false){
  ensureResumeForms(data);
  return '<div class="block" id="resumeTemplateLab">'
    +'<h3>1. 이력서 양식 선택 · 직접 작성</h3>'
    +'<p class="help">제공해주신 3개 예시를 기준으로 구성했습니다. <b>학생은 하나만 선택해 작성</b>하고, 실제 지원 시에는 해당 기업·기관의 지정 양식을 우선합니다.</p>'
    +'<div class="actions" id="resumeTemplateTabs">'
      +resumeTab('standard','표준이력서',data.templateType)
      +resumeTab('ncs','NCS 이력서',data.templateType)
      +resumeTab('blind','블라인드 이력서',data.templateType)
    +'</div>'
    +(injeCompact?resumeTargetingBlock(data,ctx,posting):'')
    +'<p class="help" id="resumeSavedProgress">'+resumeSavedProgressText(data)+'</p>'
    +'<div id="resumeTemplateGuide">'+resumeTemplateGuide(data.templateType)+'</div>'
    +(!injeCompact?resumeAutoImportBlock(prior,data.templateType,ctx)+resumeExperienceEntryTabs(data,ctx):'')
    +'<div id="resumeTemplateForm">'+resumeTemplateForm(data,ctx)+'</div>'
  +'</div>';
}

function resumeSavedProgressText(data){
  const types=['standard','ncs','blind'],labels={standard:'표준',ncs:'NCS',blind:'블라인드'};
  const saved=types.filter(type=>{
    const inspect=v=>v&&typeof v==='object'?Object.values(v).some(inspect):typeof v==='string'&&v.trim().length>0;
    return inspect(data.forms?.[type]||{});
  });
  return '입력한 이력서 '+saved.length+'/3종'+(saved.length?' · '+saved.map(x=>labels[x]).join(', '):'')+' · 1종 이상 작성한 뒤 아래에서 PDF로 저장하세요.';
}
function compactInjeResumeUi(root,data){
  const outer=root.querySelector('.resumeReadable'),evidence=document.getElementById('resumeEvidenceImport');
  if(!outer||!evidence)return;
  const blockWithHeading=text=>[...outer.querySelectorAll(':scope > .block')].find(x=>x.querySelector(':scope > h3')?.textContent?.trim()?.startsWith(text));
  const bullet=blockWithHeading('3. '),summary=blockWithHeading('5. ');
  const items=document.getElementById('resumeItems')?.parentElement,docs=document.getElementById('optionalResumeDocs');
  const move=node=>{if(!node)return;const prev=node.previousElementSibling;if(prev?.classList?.contains('hr'))prev.remove();return node;};
  const makeDetails=(label,id,open=false)=>{
    const d=document.createElement('details');d.className='detailsBox';d.id=id;d.style.marginTop='14px';
    d.open=!!open;const s=document.createElement('summary');s.textContent=label;d.appendChild(s);return d;
  };
  if(docs){
    const choice=makeDetails('경험기술서·경력기술서 · 필요하면 AI로 작성','resumeOptionalDocsDisclosure',data.optionalDocument?.type!=='none');
    choice.appendChild(move(docs));evidence.appendChild(choice);
    const heading=docs.querySelector(':scope > h3');if(heading)heading.textContent='경험·경력기술서 작성 · 선택';
  }
  const advanced=makeDetails('추가 선택 · 이력서 문장 정리와 직무 요약','resumeAdvancedDisclosure');
  if(bullet){bullet.querySelector(':scope > h3').textContent='이력서 문장 다듬기 · 선택';advanced.appendChild(move(bullet));}
  if(items)advanced.appendChild(move(items));
  if(summary){summary.querySelector(':scope > h3').textContent='직무 요약 · 필요할 때';advanced.appendChild(move(summary));}
  evidence.appendChild(advanced);
  const review=document.getElementById('resumeAiReview');if(review)review.querySelector(':scope > h3').textContent='3. AI 최종 검토 · 학생 직접 수정';
  const preview=document.getElementById('resumePreviewLab');
  if(preview){
    preview.querySelector(':scope > h3').textContent='4. 최종 이력서 확인 · PDF 저장';
    const actions=preview.querySelector(':scope > .actions'),only=document.getElementById('printResumeOnly');
    if(actions&&only){
      const more=makeDetails('다른 저장 방법 · 기술서 포함 또는 별도 PDF','resumeOtherPdfOptions');
      const otherActions=document.createElement('div');otherActions.className='actions';
      ['printResumePdf','printExperienceOnly','printCareerOnly'].forEach(id=>{const b=document.getElementById(id);if(b)otherActions.appendChild(b);});
      more.appendChild(otherActions);actions.insertAdjacentElement('afterend',more);
      only.textContent='선택한 이력서 PDF 저장';only.classList.remove('secondary');only.classList.add('primary');
      const combined=document.getElementById('printResumePdf');if(combined){combined.classList.remove('primary');combined.classList.add('secondary');}
    }
  }
}
function resumeAutoImportBlock(prior,type,ctx,compact=false){
  var edu=prior.education?.institution||prior.education?.major?'학력·전공 1건':'학력·전공 없음';
  var certCount=(prior.certifications||[]).length+(prior.language||[]).length;
  var expCount=(prior.experiences||[]).length;
  var skill=prior.tools?'도구·기술 있음':'도구·기술 없음';
  var blindNote=type==='blind'?'<br><b>블라인드 보호:</b> 학교명은 자동 입력하지 않습니다.':'';
  var ncsNote=type==='ncs'?'<br><b>NCS 보호:</b> 학교명·학점 대신 직무관련 교육·경험만 가져옵니다.':'';
  return '<div class="callout '+(compact?'info':'good')+'" id="resumeAutoImport"><b>'+(compact?'앞 단계 정보 선택 불러오기':'STEP 1~7 자동 불러오기')+'</b><br>'
    +'앞에서 이미 입력한 사실은 다시 쓰지 않습니다. '+(compact?'아래 버튼을 누른 항목만 빈칸에 반영합니다. ':'')+'<b>'+esc(edu,ctx)+' · 자격/어학 '+certCount+'건 · 검증 경험 '+expCount+'건 · '+esc(skill,ctx)+'</b>'
    +blindNote+ncsNote
    +'<br><span class="muted small"><b>'+(compact?'선택해서 불러오기:</b> 지원직무, 학력·전공, 취득한 자격·어학, 검증된 경험·활동, 도구·기술. <b>직접 입력:</b> 성명·연락처와 아직 확인되지 않은 정보. 불러온 항목에는 <b>출처: STEP 1 / STEP 3 / STEP 5</b>를 표시하며 작성한 값은 덮어쓰지 않습니다.':'자동:</b> 선택 JD의 지원직무, 앞 단계의 전공·학력정보, 취득 완료 자격·어학, 검증 완료 경험·활동, 도구·기술. <b>직접 입력:</b> 성명·휴대전화·이메일 등 앞 단계에 없는 개인정보와 자동으로 확인할 수 없는 날짜·기관·점수. 자동 입력값에는 <b>출처: STEP 1 / STEP 3 / STEP 5</b>를 표시하며 기존 입력값을 덮어쓰지 않습니다.')+'</span>'
    +'<div class="actions" style="margin-top:10px"><button type="button" class="btn secondary smallBtn" data-resume-import="education">학력·교육</button><button type="button" class="btn secondary smallBtn" data-resume-import="credentials">자격·어학</button><button type="button" class="btn secondary smallBtn" data-resume-import="experiences">경험·활동</button><button type="button" class="btn primary smallBtn" data-resume-import="all">가능한 항목 모두 불러오기</button></div></div>';
}

function resumeExperienceEntryTabs(data,ctx){
  var imported=data.extraExperienceMode!=='new';
  return '<div class="listCard" id="resumeExperienceEntry" style="margin-top:12px">'
    +'<div class="listHead"><div><span class="rankTag">경험 입력</span><h3>불러온 경험 + 새 경험</h3></div><span class="scoreChip">중간 추가 경험 허용</span></div>'
    +'<p class="help">STEP 3 이후 새로 생긴 프로젝트·대외활동·인턴 등이 있다면 여기서 직접 추가할 수 있습니다.</p>'
    +'<div class="actions"><button type="button" class="btn '+(imported?'primary':'secondary')+'" data-extra-exp-mode="imported">앞 단계 경험 불러오기</button><button type="button" class="btn '+(!imported?'primary':'secondary')+'" data-extra-exp-mode="new">새 경험 직접 추가</button></div>'
    +'<div id="resumeExperienceEntryBody">'+(imported?resumeImportedExperiencePanel(data,ctx):resumeNewExperiencePanel(data,ctx))+'</div>'
    +'</div>';
}
function resumeImportedExperiencePanel(data,ctx){
  return '<div class="callout info"><b>출처: STEP 3 Experience</b><br>Fact Check가 끝난 경험을 현재 이력서 양식에 넣습니다. 이미 불러온 경험은 중복 입력하지 않습니다.<div class="actions" style="margin-top:10px"><button type="button" class="btn secondary smallBtn" data-resume-import="experiences">검증 경험 불러오기</button></div></div>';
}
function resumeNewExperiencePanel(data,ctx){
  var x=data.newExperienceDraft||{};
  return '<div class="callout warn"><b>STEP 8에서 새 경험 직접 추가</b><br>STEP 3 이후 생긴 경험도 입력할 수 있습니다. 이 경험은 <b>출처: STEP 8 직접 추가</b>로 표시됩니다.</div>'
    +'<div class="grid2" style="margin-top:12px">'
      +newExpSelect('type','경험유형',x.type||'프로젝트',['프로젝트','대외활동','인턴·경력','아르바이트','교육·수업','기타'])
      +newExpField('title','경험명',x.title||'','예: 교내 아이디어 공모전')
      +newExpField('period','기간',x.period||'','예: 2026.09~2026.10')
      +newExpField('organization','기관·팀',x.organization||'','예: 프로젝트팀 / 기업명')
      +newExpField('role','내 역할',x.role||'','예: 데이터 분석 담당')
      +newExpField('actionResult','내가 한 일 · 결과',x.actionResult||'','실제로 한 행동과 확인 가능한 결과')
    +'</div>'
    +'<label class="checkRow"><input type="checkbox" id="newExperienceFactChecked" '+(x.factChecked?'checked':'')+'><div><b>추가 경험 Fact Check</b><span>경험명·기간·역할·행동·결과를 실제 사실과 대조했습니다.</span></div></label>'
    +'<div class="actions"><button type="button" class="btn primary" id="addNewResumeExperience">현재 이력서에 추가</button></div>';
}
function newExpField(key,label,value,ph){
  return '<div class="field"><label>'+label+'</label><input data-new-exp="'+key+'" value="'+escapeAttr(value)+'" placeholder="'+escapeAttr(ph||'')+'"></div>';
}
function newExpSelect(key,label,value,opts){
  return '<div class="field"><label>'+label+'</label><select data-new-exp="'+key+'">'+opts.map(function(o){return '<option '+(o===value?'selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
}
function escapeAttr(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function readNewExperienceDraft(root){
  var draft={};root.querySelectorAll('[data-new-exp]').forEach(function(el){draft[el.dataset.newExp]=String(el.value||'').trim();});draft.factChecked=!!root.querySelector('#newExperienceFactChecked')?.checked;return draft;
}
function addNewExperienceToResume(data,type,draft){
  if(!draft.title||!draft.actionResult)return {count:0,message:'경험명과 내가 한 일·결과를 입력하세요.'};
  if(!draft.factChecked)return {count:0,message:'추가 경험의 Fact Check를 먼저 완료하세요.'};
  var exp={id:'resume_extra_'+Date.now(),...draft,source:'STEP 8 직접 추가'},count=0,addedPaths=[];
  function record(base,entry,keys){count+=putResumeRows(data.forms[type],base, [entry],4, keys,function(slot,row){markRowSources(data,'forms.'+type+'.'+base+'.'+slot,row,'STEP 8 직접 추가');Object.keys(row).forEach(function(k){if(String(row[k]||'').trim())addedPaths.push('forms.'+type+'.'+base+'.'+slot+'.'+k);});});}
  if(type==='standard'){
    if(/인턴|경력|아르바이트/.test(draft.type))record('career',{period:draft.period,company:draft.organization,position:draft.role,duty:draft.actionResult,employmentType:draft.type},['company','duty']);
    else record('activities',{period:draft.period,activity:draft.title,organization:draft.organization,note:uniqueJoin([draft.role,draft.actionResult])},['activity','note']);
  }else if(type==='ncs'){
    if(/교육|수업/.test(draft.type))record('training',{type:'기타',name:draft.title,content:draft.actionResult,hours:'',period:draft.period},['name','content']);
    else if(/인턴|경력|아르바이트/.test(draft.type))record('career',{company:draft.organization||draft.title,duty:uniqueJoin([draft.role,draft.actionResult]),period:draft.period},['company','duty']);
    else record('activities',{group:draft.organization||draft.title,role:draft.role,content:draft.actionResult,period:draft.period},['group','content']);
  }else{
    if(/교육|수업/.test(draft.type))record('training',{type:'기타',course:draft.title,hours:'',jobContent:draft.actionResult},['course','jobContent']);
    else record('experience',{type:/인턴|경력|아르바이트/.test(draft.type)?'경력':'경험',organization:safeBlindOrganization(draft.organization||draft.title,/인턴|경력|아르바이트/.test(draft.type)?'career':'experience'),role:draft.role,period:draft.period,activity:draft.actionResult},['organization','activity']);
  }
  if(count){data.additionalExperiences.push({...exp,templateType:type,paths:addedPaths});data.newExperienceDraft={};}
  return {count,message:count?'새 경험을 현재 이력서에 추가했습니다.':'현재 이력서에 빈 행이 없어 추가하지 못했습니다. 기존 행을 정리해 주세요.'};
}

function collectResumePriorData(state,posting,experiences){
  var profile=state.profile||{},spec=findRelevantStudentSpec(state,posting),verified=(experiences||[]).filter(function(x){return x&&x.factChecked;});
  return {
    targetJob:String(posting?.jobTitle||'').trim(),
    education:{institution:String(profile.schoolName||profile.university||profile.educationInstitution||profile.institution||'').trim(),major:String(profile.major||'').trim(),grade:String(profile.grade||'').trim()},
    certifications:splitResumeSpec(spec.certificates),
    language:splitResumeSpec(spec.language),
    tools:cleanResumeSpec(spec.tools),
    portfolio:cleanResumeSpec(spec.portfolio),
    experiences:verified
  };
}
function findRelevantStudentSpec(state,posting){
  var deep=state.artifacts?.jobDeepDive||{},pool=[...Object.values(deep.analyses||{}),...Object.values(deep.targetAnalyses||{})].filter(Boolean);
  var match=pool.find(function(a){var company=String(a?.company?.name||'').trim();return company&&posting?.company&&company===posting.company&&a?.studentSpec;});
  if(!match)match=pool.find(function(a){return a?.studentSpec&&Object.values(a.studentSpec).some(function(v){return String(v||'').trim();});});
  return match?.studentSpec||{};
}
function splitResumeSpec(value){
  return String(value||'').split(/\n|,|;|\s+\/\s+/).map(function(x){return x.trim();}).filter(function(x){return x&&!/^(없음|미확인|해당 없음|해당없음)$/i.test(x)&&!/(준비\s*중|취득\s*예정|공부\s*중)/.test(x);});
}
function cleanResumeSpec(value){
  var x=String(value||'').trim();return /^(없음|미확인|해당 없음|해당없음)$/i.test(x)?'':x;
}
function applyResumePriorData(data,type,prior,scope){
  ensureResumeForms(data);var count=0;
  function doEducation(){
    if(type==='standard'&&(prior.education?.institution||prior.education?.major)){
      count+=putResumeRows(data.forms.standard,'education',[{school:prior.education.institution,major:prior.education.major}],3,['school','major'],function(slot,row){markRowSources(data,'forms.standard.education.'+slot,row,'STEP 1');});
    }
    var educationExp=(prior.experiences||[]).filter(function(x){return experienceKind(x)==='education';});
    if(type==='ncs')count+=putResumeRows(data.forms.ncs,'training',educationExp.map(function(x){return {type:'학교교육',name:x.title||'',content:resumeExperienceContent(x),hours:'',period:x.period||''};}),4,['name','content'],function(slot,row){markRowSources(data,'forms.ncs.training.'+slot,row,'STEP 3');});
    if(type==='blind')count+=putResumeRows(data.forms.blind,'training',educationExp.map(function(x){return {type:'학교교육',course:x.title||'',hours:'',jobContent:resumeExperienceContent(x)};}),4,['course','jobContent'],function(slot,row){markRowSources(data,'forms.blind.training.'+slot,row,'STEP 3');});
  }
  function doCredentials(){
    var entries=[...(prior.certifications||[]),...(prior.language||[])].map(function(x){return {name:x};});
    if(type==='standard')count+=putResumeRows(data.forms.standard,'certifications',entries,4,['name'],function(slot,row){markRowSources(data,'forms.standard.certifications.'+slot,row,'STEP 5');});
    if(type==='ncs')count+=putResumeRows(data.forms.ncs,'certifications',entries.map(function(x){return {name:x.name};}),4,['name'],function(slot,row){markRowSources(data,'forms.ncs.certifications.'+slot,row,'STEP 5');});
    if(type==='blind')count+=putResumeRows(data.forms.blind,'certifications',entries.map(function(x){return {name:x.name};}),4,['name'],function(slot,row){markRowSources(data,'forms.blind.certifications.'+slot,row,'STEP 5');});
  }
  function doExperiences(){
    var exps=(prior.experiences||[]).filter(function(x){return experienceKind(x)!=='education';});
    if(type==='standard'){
      var careers=exps.filter(function(x){return experienceKind(x)==='career';}).map(function(x){return {period:x.period||'',company:x.organization||x.company||'',position:x.roleTitle||x.role||'',duty:resumeExperienceContent(x),employmentType:x.employmentType||''};});
      var acts=exps.filter(function(x){return experienceKind(x)!=='career';}).map(function(x){return {period:x.period||'',activity:x.title||'',organization:x.organization||x.team||'',note:uniqueJoin([x.roleTitle||x.role,x.action,x.result])};});
      count+=putResumeRows(data.forms.standard,'career',careers,3,['company','duty'],function(slot,row){markRowSources(data,'forms.standard.career.'+slot,row,'STEP 3');});
      count+=putResumeRows(data.forms.standard,'activities',acts,4,['activity','note'],function(slot,row){markRowSources(data,'forms.standard.activities.'+slot,row,'STEP 3');});
    }
    if(type==='ncs'){
      var ncsCareers=exps.filter(function(x){return experienceKind(x)==='career';}).map(function(x){return {company:x.organization||x.company||'',duty:resumeExperienceContent(x),period:x.period||''};});
      var ncsActs=exps.filter(function(x){return experienceKind(x)!=='career';}).map(function(x){return {group:x.organization||x.team||x.title||'',role:x.roleTitle||x.role||'',content:resumeExperienceContent(x),period:x.period||''};});
      count+=putResumeRows(data.forms.ncs,'career',ncsCareers,4,['company','duty'],function(slot,row){markRowSources(data,'forms.ncs.career.'+slot,row,'STEP 3');});
      count+=putResumeRows(data.forms.ncs,'activities',ncsActs,4,['group','content'],function(slot,row){markRowSources(data,'forms.ncs.activities.'+slot,row,'STEP 3');});
    }
    if(type==='blind'){
      var blindRows=exps.map(function(x){var kind=experienceKind(x);return {type:kind==='career'?'경력':'경험',organization:safeBlindOrganization(x.organization||x.company||x.team||x.title||'',kind),role:x.roleTitle||x.role||'',period:x.period||'',activity:resumeExperienceContent(x)};});
      count+=putResumeRows(data.forms.blind,'experience',blindRows,4,['organization','activity'],function(slot,row){markRowSources(data,'forms.blind.experience.'+slot,row,'STEP 3');});
    }
  }
  if(scope==='education'||scope==='all')doEducation();
  if(scope==='credentials'||scope==='all')doCredentials();
  if(scope==='experiences'||scope==='all')doExperiences();
  if(scope==='all'&&prior.targetJob){
    if(type==='standard'&&!String(data.forms.standard.targetJob||'').trim()){data.forms.standard.targetJob=prior.targetJob;setImportSource(data,'forms.standard.targetJob','STEP 5 JD');count++;}
    if(type==='ncs'&&!String(data.forms.ncs.job||'').trim()){data.forms.ncs.job=prior.targetJob;setImportSource(data,'forms.ncs.job','STEP 5 JD');count++;}
    if(type==='blind'&&!String(data.forms.blind.targetJob||'').trim()){data.forms.blind.targetJob=prior.targetJob;setImportSource(data,'forms.blind.targetJob','STEP 5 JD');count++;}
  }
  if(scope==='all'&&prior.tools&&!String(data.skills||'').trim()){data.skills=prior.tools;setImportSource(data,'skills','STEP 5 My Spec');count++;}
  var label=scope==='education'?'학력·교육':scope==='credentials'?'자격·어학':scope==='experiences'?'경험·활동':'앞 단계 데이터';
  return {count,message:count?label+' '+count+'개 항목을 빈칸에 불러왔습니다.':'새로 불러올 '+label+' 정보가 없습니다. 기존 입력값은 유지했습니다.'};
}
function putResumeRows(form,key,entries,maxRows,dedupeKeys,onAdded){
  if(!entries.length)return 0;form[key]=form[key]&&typeof form[key]==='object'?form[key]:{};var added=0;
  var existing=Object.values(form[key]).filter(function(x){return x&&typeof x==='object';});
  entries.slice(0,maxRows).forEach(function(entry){
    var sig=dedupeKeys.map(function(k){return String(entry[k]||'').trim();}).join('|');if(!sig.replace(/\|/g,''))return;
    var duplicate=existing.some(function(row){return dedupeKeys.map(function(k){return String(row[k]||'').trim();}).join('|')===sig;});if(duplicate)return;
    var slot='';for(var i=0;i<maxRows;i++){var k='r'+i,row=form[key][k];if(!row||!Object.values(row).some(function(v){return String(v||'').trim();})){slot=k;break;}}
    if(!slot)return;form[key][slot]={...(form[key][slot]||{}),...entry};existing.push(form[key][slot]);added++;if(onAdded)onAdded(slot,form[key][slot]);
  });return added;
}
function setImportSource(data,path,source){data.importSources=data.importSources||{};data.importSources[path]={source:source,edited:false};}
function markRowSources(data,base,row,source){Object.keys(row||{}).forEach(function(k){if(String(row[k]||'').trim())setImportSource(data,base+'.'+k,source);});}
function sourceBadgeHtml(data,path){
  var meta=data.importSources?.[path];if(!meta)return '';
  var label='출처: '+meta.source+(meta.edited?' · 학생 수정':'');
  return ' <span class="pill" data-resume-source-for="'+path+'" style="font-size:10px">'+label+'</span>';
}
function markSourceEdited(data,path,root){
  var meta=data.importSources?.[path];if(!meta)return;meta.edited=true;
  var badge=root.querySelector('[data-resume-source-for="'+path+'"]');if(badge)badge.textContent='출처: '+meta.source+' · 학생 수정';
}
function experienceKind(exp){
  var t=String(exp?.category||exp?.type||'').toLowerCase();
  if(/교육|수업|교과|훈련|강의/.test(t))return 'education';
  if(/인턴|경력|근무|직장|회사|아르바이트|근로/.test(t))return 'career';
  return 'experience';
}
function resumeExperienceContent(exp){
  return uniqueJoin([exp?.action,exp?.result,exp?.evidence]);
}
function safeBlindOrganization(value,kind){
  var x=String(value||'').trim();if(!x)return kind==='career'?'근무기관':'프로젝트·활동팀';
  if(/대학교|대학|고등학교|중학교|초등학교|학교/.test(x))return kind==='career'?'근무기관':'프로젝트·활동팀';
  return x;
}

function resumeTab(type,label,current){
  return '<button type="button" class="btn '+(current===type?'primary':'secondary')+'" data-resume-template="'+type+'">'+label+'</button>';
}
function resumeTemplateGuide(type){
  var common='<br><span class="muted small">기본정보만 먼저 펼쳐지고 나머지는 필요한 항목만 열어 작성합니다. 모바일 표는 해당 영역 안에서 좌우로 밀어 입력할 수 있습니다. Jobfit은 특정 기업의 법정 서식을 대신하지 않으므로 실제 지원에서는 해당 기업·기관의 지정 양식을 우선하세요.</span>';
  if(type==='blind')return '<div class="callout warn"><b>블라인드 작성 원칙</b><br>평가와 무관한 개인정보는 빼고 직무 관련 교육·자격·경험·경력 중심으로 작성합니다. 연락처 등 전형 운영에 필요한 정보는 평가자료와 분리되는 것을 전제로 합니다.'+common+'</div>';
  if(type==='ncs')return '<div class="callout info"><b>NCS 이력서</b><br>지원자 식별에 필요한 최소 정보와 직무 관련 교육·훈련·자격·경험·경력을 중심으로 작성합니다. 학교명·연령·사진처럼 직무와 무관한 요소는 기본 양식에서 제외했습니다.'+common+'</div>';
  return '<div class="callout info"><b>표준이력서</b><br>일반 기업 지원용 기본형입니다. 연락 가능한 정보와 직무 관련 이력은 남기고, 사진·생년월일처럼 채용 판단에 꼭 필요하지 않은 항목은 Jobfit 기본 양식에서 제외했습니다.'+common+'</div>';
}
function resumeTemplateForm(data,ctx){
  if(data.templateType==='ncs')return ncsResumeForm(data,ctx);
  if(data.templateType==='blind')return blindResumeForm(data,ctx);
  return standardResumeForm(data,ctx);
}
function standardResumeForm(data,ctx){
  const general=ctx.displayStep!==undefined&&ctx.displayStep!==9&&data.applicationMode==='general';
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>표준이력서</h3></div><span class="scoreChip">일반 기업형</span></div>'
    +resumeFieldPolicy('standard',general?'general':'targeted')
    +resumeExampleControls('standard')
    +resumeFieldGroup('standard-basic',general?'기본정보 · 연락처 필수 (지원직무 선택)':'기본정보 · 필수','<div class="grid2">'
      +boundField(data,ctx,'forms.standard.targetJob',general?'지원직무 · 선택':'지원직무','예: 생산기술')
      +boundField(data,ctx,'forms.standard.nameKo','성명')
      +boundField(data,ctx,'forms.standard.phone','휴대폰')
      +boundField(data,ctx,'forms.standard.email','이메일','','email')
      +boundField(data,ctx,'forms.standard.nameEn','영문이름 · 선택','해외업무·영문서류 등 필요한 경우')
      +boundField(data,ctx,'forms.standard.address','주소 · 지원처 요구 시','시·군·구 또는 지원처가 요구한 범위')
    +'</div>',true)
    +resumeGridTable(data,ctx,'학력 · 선택','forms.standard.education',[['period','기간'],['school','학교·교육기관'],['major','전공·과정'],['graduation','졸업·이수상태'],['gpa','학점(요구 시)']],3)
    +resumeGridTable(data,ctx,'경력 · 해당 시','forms.standard.career',[['period','기간'],['company','회사·기관'],['position','직무·역할'],['duty','담당업무'],['employmentType','고용형태']],3)
    +resumeGridTable(data,ctx,'자격증 · 어학능력 · 해당 시','forms.standard.certifications',[['date','취득일'],['name','자격·시험'],['score','점수·급수'],['issuer','발급기관']],4)
    +resumeGridTable(data,ctx,'대외활동 · 프로젝트 · 해당 시','forms.standard.activities',[['period','기간'],['activity','활동·프로젝트'],['organization','기관·팀'],['note','역할·성과']],4)
  +'</div>';
}
function ncsResumeForm(data,ctx){
  const general=ctx.displayStep!==undefined&&ctx.displayStep!==9&&data.applicationMode==='general';
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>NCS 이력서</h3></div><span class="scoreChip">직무중심</span></div>'
    +resumeFieldPolicy('ncs',general?'general':'targeted')
    +resumeExampleControls('ncs')
    +resumeFieldGroup('ncs-basic',general?'기본정보 · 연락처 필수 (지원분야·직무 선택)':'기본정보 · 필수','<div class="grid2">'
      +boundField(data,ctx,'forms.ncs.field',general?'지원분야 · 선택':'지원분야')
      +boundField(data,ctx,'forms.ncs.job',general?'직무 · 선택':'직무')
      +boundField(data,ctx,'forms.ncs.nameKo','성명')
      +boundField(data,ctx,'forms.ncs.mobile','휴대전화')
      +boundField(data,ctx,'forms.ncs.email','전자우편','','email')
      +boundField(data,ctx,'forms.ncs.address','주소 · 지원기관 요구 시','평가정보가 아닌 전형 운영용')
    +'</div>',true)
    +resumeGridTable(data,ctx,'직무관련 교육사항 · 공고 평가 시 필수','forms.ncs.training',[['type','교육구분',['학교교육','직업교육','기타']],['name','과목·과정명'],['content','직무관련 주요내용'],['hours','교육시간'],['period','교육기간']],4)
    +resumeGridTable(data,ctx,'자격사항 · 해당 시','forms.ncs.certifications',[['name','자격·수상명'],['issuer','발급기관'],['date','취득일']],4)
    +resumeGridTable(data,ctx,'경력사항 · 해당 시','forms.ncs.career',[['company','회사·기관'],['duty','담당업무'],['period','근무기간']],4)
    +resumeGridTable(data,ctx,'경험 · 대내외활동 · 해당 시','forms.ncs.activities',[['group','활동명·조직'],['role','역할'],['content','직무관련 활동내용'],['period','활동기간']],4)
  +'</div>';
}
function blindResumeForm(data,ctx){
  const general=ctx.displayStep!==undefined&&ctx.displayStep!==9&&data.applicationMode==='general';
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>블라인드 채용 입사지원서</h3></div><span class="scoreChip">차별요소 제외</span></div>'
    +resumeFieldPolicy('blind',general?'general':'targeted')
    +resumeExampleControls('blind')
    +resumeFieldGroup('blind-basic',general?'전형 운영정보 · 연락처 필수 (지원직무 선택)':'전형 운영정보 · 필수','<div class="grid2">'
      +boundSelect(data,ctx,'forms.blind.applicantType','지원구분',['신입','경력'])
      +boundField(data,ctx,'forms.blind.targetJob',general?'지원직무 · 선택':'지원직무')
      +boundField(data,ctx,'forms.blind.name','성명')
      +boundField(data,ctx,'forms.blind.phone','연락처')
      +boundField(data,ctx,'forms.blind.email','전자우편','','email')
      +boundField(data,ctx,'forms.blind.address','주소 · 지원기관 요구 시','평가정보와 분리되는 전형 운영용')
    +'</div>',true)
    +resumeFieldGroup('blind-bonus','가점사항 · 공고에 있는 경우만','<div class="callout info"><b>공고에 가점기준이 있을 때만 체크하세요.</b><br>가점대상 여부는 서류평가용 직무능력 정보와 구분해서 다루는 것이 안전합니다.</div><div class="pillRow" style="margin-top:10px">'
      +boundCheck(data,ctx,'forms.blind.bonusDisability','장애인 가점 대상')
      +boundCheck(data,ctx,'forms.blind.bonusVeteran','취업지원대상자·보훈 가점 대상')
    +'</div>',false)
    +resumeGridTable(data,ctx,'교육사항 · 공고 평가 시 필수','forms.blind.training',[['type','교육구분',['학교교육','직업훈련','기타']],['course','과목·교육과정'],['hours','교육시간'],['jobContent','직무관련 주요내용']],4)
    +resumeGridTable(data,ctx,'자격사항 · 해당 시','forms.blind.certifications',[['name','자격증명'],['issuer','발급기관'],['date','취득일']],4)
    +resumeGridTable(data,ctx,'경험 또는 경력사항 · 해당 시','forms.blind.experience',[['type','구분',['경험','경력']],['organization','소속조직(학교명 제외)'],['role','역할'],['period','활동기간'],['activity','직무관련 활동내용']],4)
    +resumeFieldGroup('blind-job-content','직무관련 주요내용 · 해당 시',boundArea(data,ctx,'forms.blind.jobContent','직무관련 주요내용','직무활동, 팀 프로젝트, 연구회, 재능기부 등 지원직무 관련 내용만 작성'),false)
  +'</div>';
}
function resumeGridTable(data,ctx,title,base,cols,count){
  var head=cols.map(function(c){return '<th>'+c[1]+'</th>';}).join('');
  var body='';
  for(var i=0;i<count;i++){
    body+='<tr>';
    cols.forEach(function(c){
      var path=base+'.r'+i+'.'+c[0],val=valueAt(data,path);
      if(Array.isArray(c[2])){
        body+='<td>'+cellSelect(path,val,c[2],ctx)+sourceBadgeHtml(data,path)+'</td>';
      }else{
        body+='<td><input data-resume-bind="'+path+'" value="'+esc(val,ctx)+'" style="min-width:110px;width:100%;border:0;background:transparent;padding:8px">'+sourceBadgeHtml(data,path)+'</td>';
      }
    });
    body+='</tr>';
  }
  var sectionId=base.replace(/^forms\./,'').replace(/\./g,'-');
  return resumeFieldGroup(sectionId,title,'<div class="muted small" style="margin-bottom:8px">필요한 행만 작성하세요. 모바일에서는 표를 좌우로 밀어 입력할 수 있습니다.</div><div class="matrixWrap"><table class="matrix"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>',false);
}


function resumeFieldPolicy(type,applicationMode='targeted'){
  const general=applicationMode==='general';
  if(type==='ncs')return general
    ? '<div class="callout info"><b>항목 판정 · 일반형</b><br><b>필수</b> 성명·휴대전화·이메일<br><b>선택</b> 지원분야·직무(지원처 미정이면 생략 가능)<br><b>선택·조건부</b> 주소(기관 요구 시), 직무관련 교육·자격·경험·경력<br><b>기본 양식에서 삭제</b> 영문성명, 중복 전화번호, 학교명·입학/졸업연도·전체학점, 자격증 번호, 취미·특기<br><b>지원 시 확인</b> 실제 NCS 채용공고의 지정항목을 우선합니다.</div>'
    : '<div class="callout info"><b>항목 판정</b><br><b>필수</b> 지원분야·직무·성명·휴대전화·이메일<br><b>선택·조건부</b> 주소(기관 요구 시), 직무관련 교육·자격·경험·경력(공고 평가항목일 때 작성)<br><b>기본 양식에서 삭제</b> 영문성명, 중복 전화번호, 학교명·입학/졸업연도·전체학점, 자격증 번호, 취미·특기</div>';
  if(type==='blind')return general
    ? '<div class="callout warn"><b>항목 판정 · 일반형</b><br><b>필수</b> 지원구분·성명·연락처·이메일<br><b>선택</b> 지원직무(지원처 미정이면 생략 가능)<br><b>선택·조건부</b> 주소(기관 요구 시), 교육·자격·경험·경력, 공고에 명시된 가점사항<br><b>기본 양식에서 삭제</b> 사진·성별·생년월일·학교명·졸업일·전체학점·최종학교 소재지·직접 입력 접수번호<br><b>지원 시 확인</b> 실제 블라인드 채용공고의 지정항목을 우선합니다.</div>'
    : '<div class="callout warn"><b>항목 판정</b><br><b>필수</b> 지원구분·지원직무·성명·연락처·이메일<br><b>선택·조건부</b> 주소(기관 요구 시), 교육·자격·경험·경력, 공고에 명시된 가점사항<br><b>기본 양식에서 삭제</b> 사진·성별·생년월일·학교명·졸업일·전체학점·최종학교 소재지·직접 입력 접수번호</div>';
  return general
    ? '<div class="callout info"><b>항목 판정 · 일반형</b><br><b>필수</b> 성명·휴대전화·이메일<br><b>선택</b> 지원직무(지원처 미정이면 생략 가능)<br><b>선택·조건부</b> 영문명, 주소, 학력, 경력, 자격·어학, 프로젝트·대외활동, 학점<br><b>기본 양식에서 삭제</b> 사진·생년월일·성별·가족사항·신체조건<br><b>지원 시 확인</b> 실제 기업의 지정양식을 우선합니다.</div>'
    : '<div class="callout info"><b>항목 판정</b><br><b>필수</b> 지원직무·성명·휴대전화·이메일<br><b>선택·조건부</b> 영문명, 주소, 학력, 경력, 자격·어학, 프로젝트·대외활동, 학점<br><b>기본 양식에서 삭제</b> 사진·생년월일·성별·가족사항·신체조건</div>';
}

function resumeFieldGroup(sectionId,title,inner,open){
  return '<details class="detailsBox resumeFormSection" data-resume-section="'+sectionId+'" '+(open?'open':'')+' style="margin-top:12px"><summary>'+title+'</summary><div style="padding-bottom:14px">'+inner+'</div></details>';
}
function resumeExampleControls(type){
  return '<div class="actions" style="margin-top:0"><button type="button" class="btn outline smallBtn" data-resume-example="'+type+'">예시 입력 보기</button></div>'
    +'<div class="callout info hidden" data-resume-example-panel="'+type+'" style="margin-top:10px">'+resumeExampleHtml(type)+'</div>';
}
function resumeExampleHtml(type){
  if(type==='ncs')return '<b>NCS 이력서 예시</b><br><b>지원분야</b> 기술 · <b>직무</b> 생산기술<br><b>직무관련 교육</b> 학교교육 / 생산관리 / 공정 데이터 정리·조건별 비교 / 45시간<br><b>경험</b> 캡스톤 프로젝트 / 데이터 분석 담당 / 센서 측정조건별 오차 분석 / 2026.03~06<br><span class="muted small">학교명·입학연도·졸업연도·전체학점은 넣지 않고 직무와 연결되는 교육내용을 적는 예시입니다.</span>';
  if(type==='blind')return '<b>블라인드 이력서 예시</b><br><b>지원직무</b> 생산기술 · <b>성명</b> 김민지<br><b>교육사항</b> 학교교육 / 생산관리 / 45시간 / 공정 데이터 정리 및 조건별 비교<br><b>경험사항</b> 경험 / 캡스톤 프로젝트팀 / 데이터 분석 담당 / 2026.03~06 / 센서 측정조건별 오차 분석<br><span class="muted small">학교명·성별·나이·출신지역·가족관계 등 개인 배경정보는 쓰지 않습니다.</span>';
  return '<b>표준이력서 예시</b><br><b>지원직무</b> 생산기술 · <b>성명</b> 김민지<br><b>학력</b> 2023.03~2027.02 / 부경대학교 / 기계공학 / 졸업예정 / 4.12/4.5<br><b>자격·어학</b> 2026.05 / 컴퓨터활용능력 1급 / 합격 / 대한상공회의소<br><b>프로젝트</b> 2026.03~06 / 캡스톤 센서오차 분석 / 캡스톤팀 / 데이터 분석 담당<br><span class="muted small">사진과 생년월일은 Jobfit 기본 양식에서 제외합니다. 실제 기업 지정양식이 있으면 해당 양식을 따르세요.</span>';
}
function boundField(data,ctx,path,label,ph,type){
  return '<div class="field"><label>'+label+sourceBadgeHtml(data,path)+'</label><input type="'+(type||'text')+'" data-resume-bind="'+path+'" value="'+esc(valueAt(data,path),ctx)+'" placeholder="'+esc(ph||'',ctx)+'"></div>';
}
function boundArea(data,ctx,path,label,ph){
  return '<div class="field" style="margin-top:12px"><label>'+label+sourceBadgeHtml(data,path)+'</label><textarea data-resume-bind="'+path+'" placeholder="'+esc(ph||'',ctx)+'">'+esc(valueAt(data,path),ctx)+'</textarea></div>';
}
function boundSelect(data,ctx,path,label,opts){
  var val=valueAt(data,path)||opts[0];
  return '<div class="field"><label>'+label+sourceBadgeHtml(data,path)+'</label><select data-resume-bind="'+path+'">'+opts.map(function(o){return '<option '+(o===val?'selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
}
function boundCheck(data,ctx,path,label){
  return '<label class="pill"><input type="checkbox" data-resume-bind="'+path+'" '+(valueAt(data,path)?'checked':'')+'> '+label+'</label>';
}
function cellSelect(path,val,opts,ctx){
  val=val||opts[0];
  return '<select data-resume-bind="'+path+'" style="min-width:110px;width:100%;border:0;background:transparent;padding:8px">'+opts.map(function(o){return '<option '+(o===val?'selected':'')+'>'+esc(o,ctx)+'</option>';}).join('')+'</select>';
}
function resumeOptionalAiControls(data,ctx,type){
  const example=type==='career'?'회사·직무·기간 → 담당업무 → 직접 한 일 → 주요 성과·근거 → 지원직무 연결':'경험명·기간·역할 → 상황·과제 → 내가 직접 한 행동 → 결과·증빙 → 지원직무 연결';
  return '<div class="callout info" id="resumeOptionalAiHelp" style="margin-top:14px"><b>AI로 기술서 초안 정리하기</b><p class="help">작성 구조: '+example+'. 없는 성과나 수치는 만들지 않습니다. AI 답변을 아래에 붙여넣은 뒤 확인·수정하세요.</p>'
    +'<div class="actions"><button type="button" class="btn primary" id="copyResumeOptionalAiPrompt">AI 작성 프롬프트 복사</button></div>'
    +'<div class="field"><label>AI 답변 붙여넣기 · 학생 확인 후 반영</label><textarea id="resumeOptionalAiAnswer" placeholder="[항목명] 제목에 맞춰 AI가 정리한 답변을 붙여넣으세요.">'+esc(data.optionalAiDrafts?.[type]||'',ctx)+'</textarea></div>'
    +'<div class="actions"><button type="button" class="btn secondary" id="applyResumeOptionalAi">작성된 초안을 빈 입력칸에 반영</button></div>'
    +'<p class="help">이미 작성한 칸은 덮어쓰지 않습니다. AI 초안 반영 후에도 모든 항목을 직접 고칠 수 있고 Fact Check는 다시 확인해야 합니다.</p></div>';
}
function resumeOptionalAiSpec(type){
  return type==='career'?
    [['회사명','company'],['근무기간','period'],['부서·직급·역할','departmentPosition'],['고용형태','employmentType'],['담당업무','duties'],['주요 성과·근거','achievements'],['사용 Skill·Tool','tools'],['지원직무 연결','jobLink']]:
    [['경험명','title'],['기간','period'],['기관·수업·팀','organization'],['내 역할','role'],['상황·과제','task'],['내 행동','action'],['결과·근거','resultEvidence'],['지원직무 연결','jobLink']];
}
function buildResumeOptionalAiPrompt(data,type,posting,assets){
  const x=data.optionalDocument?.[type]||{},a=(assets||[]).find(y=>y.id===x.assetId);
  const targeted=data.applicationMode==='targeted',form=data.forms?.[data.templateType]||{};
  const job=previewIdentity(data.templateType,form).job||posting?.jobTitle||'미지정';
  const jd=targeted?(data.targetJDText||posting?.rawPosting||'공고 정보 없음'):'일반형 이력서 · 지원 직무 공고 미지정';
  const fields=resumeOptionalAiSpec(type);
  const source=a?{experience:a.experienceTitle,action:a.proof,evidence:a.fact,requirement:a.requirement,verification:isAssetVerified(a)?'검증완료':'검증 전 · 초안용'}:{source:'학생 직접 입력 · 별도 검증 필요'};
  return ['역할: 취업준비생의 '+(type==='career'?'경력기술서':'경험기술서')+' 작성 보조자.',
    '목적: 실제 경험과 확인 가능한 근거만 정리하고, 지원직무와 연결되는 부분을 분명히 보여준다.',
    '[작성 구조: 첨부된 예시처럼 큰 항목 네 가지를 분명히 구분]',
    type==='career'?'① 경력 내용(어디서 어떤 일을 했는가) ② 근무기간 ③ 담당업무(내가 실제 수행한 세부 과업) ④ 주요 성과·결과물(확인 가능한 근거)':'① 경험명·내용 ② 활동기간 ③ 내가 직접 수행한 행동·역할 ④ 결과·산출물 및 확인 근거',
    '큰 항목 네 가지가 분명히 드러나도록 하되 아래 [항목명] 형식을 유지한다. 기존 입력값과 확인된 사실을 바꾸지 않는다.',
    '[지원 기업]',targeted?(data.targetCompany||posting?.company||'미입력'):'미지정',
    '[지원직무]',targeted?job:'미지정 · 일반형',
    '[채용공고 주요업무와 요구조건]',jd,
    '[학생이 현재 입력한 사실 - 이름·전화·이메일은 보내지 않음]',JSON.stringify(x,null,2),
    '[STEP 3/5에서 연결된 Career Asset]',JSON.stringify(source,null,2),
    '[작성 규칙]',
    '1. 아래 대괄호 제목을 그대로 사용해 각 항목을 작성한다. 표나 JSON 대신 항목마다 줄바꿈으로 작성한다.',
    '2. 팀이 한 일과 학생이 직접 한 행동을 구분한다. 없는 기간·숫자·역할·성과는 절대로 만들지 않는다.',
    '3. 정보가 없으면 임의로 채우지 말고 [확인 필요]라고 쓴다.',
    '4. 상황·과제와 직접 한 행동은 구체적으로, 결과는 확인 가능한 산출물·기록만 사용한다. 기간·담당업무·성과는 각각 구분하고, 담당업무는 ① ②처럼 번호로, 하위 행동은 • 글머리표로 짧게 정리한다.',
    '5. 직무연결은 제공한 공고의 업무·조건에 근거할 때만 쓰고, 연결 근거가 없으면 [확인 필요]로 둔다.',
    '6. 서류 문장으로 자연스럽고 간결하게 작성하되 과장하거나 사실을 바꾸지 않는다.',
    '[반드시 지킬 출력 형식]',
    ...fields.map(([label])=>'['+label+']\n• 실제 확인된 내용 또는 [확인 필요]'),
    '마지막에 [사실확인 질문]으로 누락된 증거를 최대 3개만 묻는다.'].join('\n');
}
function applyResumeOptionalAiAnswer(data,type,raw){
  const allowed=new Map(resumeOptionalAiSpec(type)),out={},labels=[...allowed.keys()];
  const regex=/^\s*(?:#{1,4}\s*)?\[([^\]]+)\]\s*(?:[:：]\s*)?(.*)$/gm;
  const found=[...String(raw||'').matchAll(regex)];
  for(let i=0;i<found.length;i++){
    const name=found[i][1].trim(),key=allowed.get(name);
    if(!key)continue;
    const begin=found[i].index+found[i][0].length,end=i+1<found.length?found[i+1].index:raw.length;
    let value=[found[i][2],raw.slice(begin,end)].filter(Boolean).join('\n').trim();
    value=value.replace(/^\s*[•-]\s*/gm,'').trim();
    if(value==='[확인 필요]'||!value)continue;
    out[key]=value;
  }
  const doc=data.optionalDocument[type]||{},changed=[];
  Object.entries(out).forEach(([key,value])=>{if(!String(doc[key]||'').trim()){doc[key]=value;changed.push(key);}});
  if(changed.length)doc.factChecked=false;
  data.optionalDocument[type]=doc;
  return {count:changed.length,labels:labels.filter(x=>changed.includes(allowed.get(x)))};
}
function optionalResumeDocsBlock(data,ctx,assets=[]){
  ensureResumeForms(data);
  return '<div class="hr"></div><div class="block" id="optionalResumeDocs">'
    +'<h3>4. 경험기술서 · 경력기술서 <span class="pill">선택사항</span></h3>'
    +'<p class="help">지원 기업이 요구하거나 이력서 한 줄만으로 역할과 성과를 설명하기 어려울 때만 작성합니다. 앞에서 검증한 Career Asset의 사실만 사용합니다.</p>'
    +'<div class="actions" id="optionalDocTabs">'
      +docTab('none','작성 안 함',data.optionalDocument.type)
      +docTab('experience','경험기술서',data.optionalDocument.type)
      +docTab('career','경력기술서',data.optionalDocument.type)
    +'</div>'
    +'<div id="optionalDocBody">'+optionalDocBody(data,ctx,assets)+'</div>'
  +'</div>';
}
function docTab(type,label,current){
  return '<button type="button" class="btn '+(current===type?'primary':'secondary')+'" data-resume-doc="'+type+'">'+label+'</button>';
}
function optionalDocBody(data,ctx,assets=[]){
  if(data.optionalDocument.type==='experience'){
    return '<div class="listCard"><h3>경험기술서</h3>'+assetAutofillControls(data,ctx,'experience',assets)
      +resumeFieldGroup('experience-doc-basic','기본정보','<div class="grid2">'
        +boundArea(data,ctx,'optionalDocument.experience.title','경험명','예: 캡스톤디자인 프로젝트')
        +boundArea(data,ctx,'optionalDocument.experience.period','기간','예: 2026.03~2026.06')
        +boundArea(data,ctx,'optionalDocument.experience.organization','기관·수업·팀','')
        +boundArea(data,ctx,'optionalDocument.experience.role','내 역할','')
      +'</div>',true)
      +resumeFieldGroup('experience-doc-evidence','행동 · 결과 · 직무연결','<div class="grid2">'
        +boundArea(data,ctx,'optionalDocument.experience.task','상황·과제','무엇을 해결해야 했는지')
        +boundArea(data,ctx,'optionalDocument.experience.action','내 행동','내가 직접 한 행동')
        +boundArea(data,ctx,'optionalDocument.experience.resultEvidence','결과·Evidence','수치·산출물·피드백·기록 등')
        +boundArea(data,ctx,'optionalDocument.experience.jobLink','지원직무 연결','어떤 JD 요구를 증명하는지')
      +'</div>',false)
      +optionalFactCheck(data,'experience')+(ctx.displayStep===7?resumeOptionalAiControls(data,ctx,'experience'):'')+'</div>';
  }
  if(data.optionalDocument.type==='career'){
    return '<div class="listCard"><h3>경력기술서</h3>'+assetAutofillControls(data,ctx,'career',assets)
      +resumeFieldGroup('career-doc-basic','기본정보','<div class="grid2">'
        +boundArea(data,ctx,'optionalDocument.career.company','회사명','')
        +boundArea(data,ctx,'optionalDocument.career.period','근무기간','')
        +boundArea(data,ctx,'optionalDocument.career.departmentPosition','부서 · 직급 · 역할','')
        +boundArea(data,ctx,'optionalDocument.career.employmentType','고용형태','')
      +'</div>',true)
      +resumeFieldGroup('career-doc-evidence','담당업무 · 성과 · 직무연결','<div class="grid2">'
        +boundArea(data,ctx,'optionalDocument.career.duties','담당업무','정기적으로 맡은 업무와 책임')
        +boundArea(data,ctx,'optionalDocument.career.achievements','주요 성과 · Evidence','확인 가능한 수치·산출물·개선결과')
        +boundArea(data,ctx,'optionalDocument.career.tools','사용 Skill · Tool','')
        +boundArea(data,ctx,'optionalDocument.career.jobLink','지원직무 연결','어떤 JD 요구와 연결되는지')
      +'</div>',false)
      +optionalFactCheck(data,'career')+(ctx.displayStep===7?resumeOptionalAiControls(data,ctx,'career'):'')+'</div>';
  }
  return '<div class="placeholder"><b>선택사항입니다.</b>이력서만 필요한 경우 여기서는 아무것도 작성하지 않아도 됩니다.</div>';
}
function wireResumeFormUi(data,ctx,persist,assets=[],experiences=[],prior={},posting=null,injeCompact=false,aiGuide=null){
  var lab=document.getElementById('resumeTemplateLab');
  var interactionRoot=lab?.closest('.resumeReadable')||lab;
  if(lab){
    interactionRoot.addEventListener('click',function(e){
      if(injeCompact){
        var appButton=e.target.closest('[data-application-mode]');
        if(appButton){
          const mode=appButton.dataset.applicationMode;
          data.resumeJobSearchOpen=mode==='search';
          if(!data.resumeJobSearchOpen)data.applicationMode=mode;
          persist();
          var target=document.getElementById('resumeTargetMode');if(target)target.outerHTML=resumeTargetingBlock(data,ctx,posting);
          if(!data.resumeJobSearchOpen){
            var activeForm=document.getElementById('resumeTemplateForm');
            if(activeForm)activeForm.innerHTML=resumeTemplateForm(data,ctx);
            refreshResumeReview(data,ctx);
          }
          return;
        }
        if(e.target.closest('#copyResumeJdSearchPrompt')){
          const btn=e.target.closest('#copyResumeJdSearchPrompt');
          if(aiGuide)aiGuide.request('search',btn,()=>document.getElementById('resumeJdSearchPrompt')?.value||buildResumeJdSearchPrompt(ctx,data,posting));
          else copy(document.getElementById('resumeJdSearchPrompt')?.value||'',ctx);
          return;
        }
        if(e.target.closest('#resumeSearchUseStep5')&&posting){
          const draft=data.resumeJobSearchDraft;
          if(!draft.company)draft.company=posting.company||'';
          if(!draft.job)draft.job=posting.jobTitle||'';
          if(!draft.details)draft.details=posting.rawPosting||'';
          if(!draft.url)draft.url=posting.url||posting.jobUrl||'';
          persist();
          const target=document.getElementById('resumeTargetMode');if(target)target.outerHTML=resumeTargetingBlock(data,ctx,posting);
          ctx.toast('STEP 5의 선택 공고를 빈칸에 불러왔습니다. 내용을 확인하세요.');return;
        }
        if(e.target.closest('#resumeApplyFoundJD')){
          const draft=data.resumeJobSearchDraft||{};
          const company=String(draft.company||'').trim(),job=String(draft.job||'').trim();
          if(!company||!job){ctx.toast('기업명과 실제 지원직무를 먼저 입력하세요.');return;}
          const targetJobPath=resumeTargetJobPath(data.templateType);
          const prevJob=String(valueAt(data,targetJobPath)||'').trim();
          const willOverwrite=(data.targetCompany&&data.targetCompany!==company)||(prevJob&&prevJob!==job);
          if(willOverwrite&&!window.confirm('기존 지원 기업 또는 지원직무를 새로 확인한 공고로 변경할까요? 작성한 경험·학력·자격은 유지됩니다.'))return;
          data.applicationMode='targeted';data.resumeJobSearchOpen=false;
          data.targetCompany=company;data.targetJDText=String(draft.details||'').trim();
          data.resumeSearchSourceUrl=String(draft.url||'').trim();
          setValueAt(data,targetJobPath,job);setImportSource(data,targetJobPath,'STEP 8 공고 탐색');
          persist();
          const target=document.getElementById('resumeTargetMode');if(target)target.outerHTML=resumeTargetingBlock(data,ctx,posting);
          const form=document.getElementById('resumeTemplateForm');if(form)form.innerHTML=resumeTemplateForm(data,ctx);
          refreshResumeReview(data,ctx);
          ctx.toast('선택한 공고를 직무맞춤형 이력서에 반영했습니다. 공고 업무와 실제 경험을 확인하세요.');return;
        }
        if(e.target.closest('#loadSelectedResumeJD')&&posting){
          data.targetCompany=posting.company||'';data.targetJDText=posting.rawPosting||'';
          var jobPath=resumeTargetJobPath(data.templateType),priorJob=String(valueAt(data,jobPath)||'').trim();
          if(!priorJob){setValueAt(data,jobPath,posting.jobTitle||'');setImportSource(data,jobPath,'STEP 5 JD');}
          persist();
          var target=document.getElementById('resumeTargetMode');if(target)target.outerHTML=resumeTargetingBlock(data,ctx,posting);
          var form=document.getElementById('resumeTemplateForm');if(form)form.innerHTML=resumeTemplateForm(data,ctx);
          ctx.toast(priorJob?'공고 내용을 불러왔습니다. 기존 지원직무는 유지했으니 확인하세요.':'채용공고를 빈칸에 불러왔습니다.');
          return;
        }
      }
      var modeBtn=e.target.closest('[data-extra-exp-mode]');
      if(modeBtn){
        data.extraExperienceMode=modeBtn.dataset.extraExpMode||'imported';persist();
        var body=document.getElementById('resumeExperienceEntryBody');if(body)body.innerHTML=data.extraExperienceMode==='new'?resumeNewExperiencePanel(data,ctx):resumeImportedExperiencePanel(data,ctx);
        interactionRoot.querySelectorAll('[data-extra-exp-mode]').forEach(function(x){x.classList.toggle('primary',x===modeBtn);x.classList.toggle('secondary',x!==modeBtn);});return;
      }
      var addExtra=e.target.closest('#addNewResumeExperience');
      if(addExtra){
        var panel=document.getElementById('resumeExperienceEntryBody'),draft=readNewExperienceDraft(panel);data.newExperienceDraft=draft;
        var result=addNewExperienceToResume(data,data.templateType,draft);persist();
        var form=document.getElementById('resumeTemplateForm');if(form)form.innerHTML=resumeTemplateForm(data,ctx);
        if(result.count&&panel)panel.innerHTML=resumeNewExperiencePanel(data,ctx);
        ctx.toast(result.message);return;
      }
      var importer=e.target.closest('[data-resume-import]');
      if(importer){
        var importPrior=(injeCompact&&data.applicationMode==='general')?{...prior,targetJob:''}:prior;
        var result=applyResumePriorData(data,data.templateType,importPrior,importer.dataset.resumeImport||'all');persist();
        var form=document.getElementById('resumeTemplateForm');if(form)form.innerHTML=resumeTemplateForm(data,ctx);
        var skills=document.getElementById('skills');if(skills&&!skills.value&&data.skills)skills.value=data.skills;
        ctx.toast(result.message);return;
      }
      var example=e.target.closest('[data-resume-example]');
      if(example){
        var type=example.dataset.resumeExample,panel=lab.querySelector('[data-resume-example-panel="'+type+'"]');
        if(!panel)return;
        var willOpen=panel.classList.contains('hidden');panel.classList.toggle('hidden',!willOpen);example.textContent=willOpen?'예시 닫기':'예시 입력 보기';return;
      }
      var b=e.target.closest('[data-resume-template]');if(!b)return;
      data.templateType=b.dataset.resumeTemplate||'standard';persist();
      var f=document.getElementById('resumeTemplateForm'),g=document.getElementById('resumeTemplateGuide');
      if(f)f.innerHTML=resumeTemplateForm(data,ctx);if(g)g.innerHTML=resumeTemplateGuide(data.templateType);
       var importNotice=document.getElementById('resumeAutoImport');if(importNotice)importNotice.outerHTML=resumeAutoImportBlock(prior,data.templateType,ctx,injeCompact);
      lab.querySelectorAll('[data-resume-template]').forEach(function(x){x.classList.toggle('primary',x===b);x.classList.toggle('secondary',x!==b);});
      if(injeCompact)refreshResumeReview(data,ctx);
    });
    bindResumeInputs(lab,data,persist);
    ['input','change'].forEach(event=>interactionRoot.addEventListener(event,function(e){if(!e.target.matches('[data-new-exp],#newExperienceFactChecked'))return;const panel=document.getElementById('resumeExperienceEntryBody');if(panel){data.newExperienceDraft=readNewExperienceDraft(panel);persist();}}));
  }
  var docs=document.getElementById('optionalResumeDocs');
  if(docs){
    docs.addEventListener('click',function(e){
      if(e.target.closest('#copyResumeOptionalAiPrompt')){
        const type=data.optionalDocument?.type||'none';
        if(type!=='none'){
          const prompt=()=>buildResumeOptionalAiPrompt(data,type,posting,assets);
          if(aiGuide)aiGuide.request(type,e.target.closest('#copyResumeOptionalAiPrompt'),prompt);
          else copy(prompt(),ctx);
        }
        return;
      }
      if(e.target.closest('#applyResumeOptionalAi')){
        const type=data.optionalDocument?.type||'none',el=document.getElementById('resumeOptionalAiAnswer');
        if(type==='none'||!el)return;
        data.optionalAiDrafts[type]=el.value;
        const result=applyResumeOptionalAiAnswer(data,type,el.value);
        persist();
        if(result.count){
          const body=document.getElementById('optionalDocBody');if(body)body.innerHTML=optionalDocBody(data,ctx,assets);
          ctx.toast('AI 초안 '+result.count+'개 항목을 빈칸에 반영했습니다. 사실을 확인하고 직접 수정하세요.');
        }else ctx.toast('반영할 새 항목이 없습니다. [항목명] 제목이 있는지 확인하세요. 기존 입력값은 유지됩니다.');
        return;
      }
      var auto=e.target.closest('[data-auto-asset]');
      if(auto){
        var type=auto.dataset.autoAsset,select=docs.querySelector('[data-asset-source="'+type+'"]'),asset=assets.find(function(x){return x.id===select?.value;});
        if(!asset){ctx.toast('불러올 Career Asset을 먼저 선택하세요.');return}
        autoFillOptionalDoc(data,type,asset,experiences);persist();
        var body=document.getElementById('optionalDocBody');if(body)body.innerHTML=optionalDocBody(data,ctx,assets);
        ctx.toast(isAssetVerified(asset)?'검증된 Career Asset을 불러왔습니다. 기술서 내용을 확인해 주세요.':'Career Asset을 불러왔습니다. 검증 전이므로 초안으로만 사용하세요.');
        return;
      }
      var b=e.target.closest('[data-resume-doc]');if(!b)return;
      data.optionalDocument.type=b.dataset.resumeDoc||'none';persist();
      var body=document.getElementById('optionalDocBody');if(body)body.innerHTML=optionalDocBody(data,ctx,assets);
      docs.querySelectorAll('[data-resume-doc]').forEach(function(x){x.classList.toggle('primary',x===b);x.classList.toggle('secondary',x!==b);});
    });
    bindResumeInputs(docs,data,persist);
    docs.addEventListener('input',function(e){
      if(e.target?.id!=='resumeOptionalAiAnswer')return;
      data.optionalAiDrafts[data.optionalDocument.type]=e.target.value;
      persist();
    });
  }
}
function bindResumeInputs(root,data,persist){
  root.addEventListener('input',function(e){
    var el=e.target.closest('[data-resume-bind]');if(!el||el.type==='checkbox'||el.tagName==='SELECT')return;
    setValueAt(data,el.dataset.resumeBind,el.value);markSourceEdited(data,el.dataset.resumeBind,root);persist();
  });
  root.addEventListener('change',function(e){
    var el=e.target.closest('[data-resume-bind]');if(!el)return;
    setValueAt(data,el.dataset.resumeBind,el.type==='checkbox'?el.checked:el.value);markSourceEdited(data,el.dataset.resumeBind,root);persist();
  });
}
function valueAt(obj,path){
  return String(path||'').split('.').filter(Boolean).reduce(function(cur,key){return cur&&cur[key]!=null?cur[key]:'';},obj);
}
function setValueAt(obj,path,value){
  var parts=String(path||'').split('.').filter(Boolean);if(!parts.length)return;
  var cur=obj;for(var i=0;i<parts.length-1;i++){var key=parts[i];if(!cur[key]||typeof cur[key]!=='object')cur[key]={};cur=cur[key];}
  cur[parts[parts.length-1]]=value;
}



function assetAutofillControls(data,ctx,type,assets){
  var target=data.optionalDocument[type]||{},selected=target.assetId||'';
  return '<div class="callout info"><b>Career Asset 자동 불러오기</b><br>STEP 8 이전 단계에서 검증한 경험 근거를 다시 입력하지 않고 가져옵니다.'
    +'<div class="grid2" style="margin-top:10px"><div class="field"><label>Career Asset</label><select data-resume-bind="optionalDocument.'+type+'.assetId" data-asset-source="'+type+'"><option value="">선택</option>'
    +assets.map(function(a){var level=a.evidenceLevel||legacyLevel(a.strength);return '<option value="'+esc(a.id,ctx)+'" '+(a.id===selected?'selected':'')+'>['+esc(level,ctx)+'] '+esc(a.experienceTitle,ctx)+' → '+esc(a.requirement||'',ctx)+(isAssetVerified(a)?' · ✓':' · 검증필요')+'</option>';}).join('')
    +'</select></div><div class="field"><label>&nbsp;</label><button type="button" class="btn secondary" data-auto-asset="'+type+'">선택한 Career Asset 불러오기</button></div></div></div>';
}
function optionalFactCheck(data,type){
  var checked=!!data.optionalDocument?.[type]?.factChecked;
  return '<label class="checkRow" style="margin-top:12px"><input type="checkbox" data-resume-bind="optionalDocument.'+type+'.factChecked" '+(checked?'checked':'')+'><div><b>기술서 Fact Check</b><span>자동 불러온 내용과 내가 수정한 문장이 실제 경험·기간·역할·성과와 일치합니다.</span></div></label>';
}
function autoFillOptionalDoc(data,type,asset,experiences){
  var exp=experiences.find(function(x){return x.id===asset.experienceId;})||{};
  var target=data.optionalDocument[type]||(data.optionalDocument[type]={});
  target.assetId=asset.id;target.factChecked=false;
  if(type==='experience'){
    target.title=target.title||exp.title||asset.experienceTitle||'';
    target.period=target.period||exp.period||'';
    target.role=target.role||exp.roleTitle||exp.role||'';
    target.task=target.task||exp.challenge||exp.situation||exp.context||'';
    target.action=target.action||asset.proof||exp.action||'';
    target.resultEvidence=target.resultEvidence||uniqueJoin([exp.result,asset.fact]);
    target.jobLink=target.jobLink||asset.jobLink||((asset.requirement||'')?asset.requirement+' 요구와 연결':'');
  }else{
    target.period=target.period||exp.period||'';
    target.departmentPosition=target.departmentPosition||exp.roleTitle||exp.role||'';
    target.duties=target.duties||asset.proof||exp.action||'';
    target.achievements=target.achievements||uniqueJoin([exp.result,asset.fact]);
    target.jobLink=target.jobLink||asset.jobLink||((asset.requirement||'')?asset.requirement+' 요구와 연결':'');
  }
}
function uniqueJoin(values){
  return [...new Set(values.map(function(x){return String(x||'').trim();}).filter(Boolean))].join(' · ');
}
function resumePreviewBlock(injeCompact=false){
  return '<div class="hr"></div><div class="block" id="resumePreviewLab"><h3>'+(injeCompact?'7':'6')+'. A4 이력서 미리보기 · PDF 저장</h3>'
    +'<p class="help">선택한 이력서 양식을 A4 형태로 확인합니다. Resume Bullet은 <b>Final Ready</b>만, 경험·경력기술서는 <b>Fact Check 완료</b> 항목만 최종 문서에 포함됩니다.</p>'
    +'<div class="actions"><button type="button" class="btn secondary" id="refreshResumePreview">A4 미리보기</button><button type="button" class="btn primary" id="printResumePdf">이력서+선택 기술서 PDF</button><button type="button" class="btn secondary" id="printResumeOnly">이력서만 PDF</button><button type="button" class="btn secondary" id="printExperienceOnly">경험기술서만 PDF</button><button type="button" class="btn secondary" id="printCareerOnly">경력기술서만 PDF</button></div>'
    +'<p class="help">표준·NCS·블라인드 이력서는 각각의 작성값을 따로 유지합니다. 양식을 선택한 다음 출력하세요. 경험기술서와 경력기술서는 별도로 작성하고 각각 PDF로 저장할 수 있습니다.</p>'
    +'<div class="callout info"><b>PDF 저장 방법</b><br>버튼을 누르면 인쇄창이 열립니다. PC에서는 ‘PDF로 저장’, iPhone에서는 공유·인쇄 메뉴를 사용하세요. 기술서 단독 PDF는 해당 기술서의 Fact Check가 필요합니다.</div>'
    +'<div id="resumePreviewStatus" class="status"></div><div id="resumeA4Preview" class="hidden jfA4Screen" style="margin-top:14px"></div></div>';
}
function wireResumePreviewUi(data,ctx,posting,assets,persist,injeCompact=false){
  var refresh=document.getElementById('refreshResumePreview'),printBtn=document.getElementById('printResumePdf'),box=document.getElementById('resumeA4Preview');
  if(!refresh||!printBtn||!box)return;
  function syncBase(){
    var summary=document.getElementById('summary'),skills=document.getElementById('skills'),notes=document.getElementById('notes');
    if(summary)data.summary=summary.value.trim();if(skills)data.skills=skills.value.trim();if(notes)data.notes=notes.value.trim();persist();
  }
  function renderPreview(){
    syncBase();box.innerHTML=resumeA4Html(data,ctx,posting,assets,true,injeCompact);box.classList.remove('hidden');
    var omitted=resumeOmittedCount(data);document.getElementById('resumePreviewStatus').textContent=omitted?('검증 전 항목 '+omitted+'개는 최종 문서에서 제외했습니다.'):'검증된 항목만 A4 미리보기에 반영했습니다.';
  }
  document.getElementById('printResumeOnly')?.addEventListener('click',function(){
    syncBase();
    printApplicationDocument(resumeTemplateLabel(data.templateType),resumeA4Html(data,ctx,posting,assets,false,injeCompact),ctx.toast);
  });
  for(const type of ['experience','career']){
    const button=document.getElementById(type==='career'?'printCareerOnly':'printExperienceOnly');
    button?.addEventListener('click',function(){
      syncBase();
      const doc=data.optionalDocument?.[type]||{},title=type==='career'?'경력기술서':'경험기술서';
      if(!hasOptionalContent(doc)){ctx.toast(title+'를 먼저 작성하세요.');return;}
      if(!doc.factChecked){ctx.toast(title+'의 Fact Check가 완료되어야 최종 PDF를 출력할 수 있습니다.');return;}
      printApplicationDocument(title,'<div class="resumeA4Sheet"><h1>'+title+'</h1>'+previewOptionalSection(type,doc)+'</div>',ctx.toast);
    });
  }
  refresh.addEventListener('click',renderPreview);
  printBtn.addEventListener('click',function(){
    renderPreview();
    // iPhone Safari may block a delayed print() call in a hidden iframe.
    // Keep a readable print document in a visible user-opened tab instead.
    printApplicationDocument(resumeTemplateLabel(data.templateType),box.innerHTML,ctx.toast);
  });
}
function resumeOmittedCount(data){
  var draft=(data.items||[]).filter(function(x){return !(x.status==='final-ready'||(x.factChecked&&x.assetVerified));}).length;
  var t=data.optionalDocument?.type||'none',opt=(t!=='none'&&hasOptionalContent(data.optionalDocument?.[t])&&!data.optionalDocument?.[t]?.factChecked)?1:0;
  return draft+opt;
}
function hasOptionalContent(obj){
  if(!obj)return false;return Object.entries(obj).some(function(entry){return !['assetId','factChecked'].includes(entry[0])&&String(entry[1]||'').trim();});
}
function resumeA4Html(data,ctx,posting,assets,withOptional=true,injeCompact=false){
  var form=data.forms?.[data.templateType]||{},title=resumeTemplateLabel(data.templateType),verified=(data.items||[]).filter(function(x){return x.status==='final-ready'||(x.factChecked&&x.assetVerified);});
  var optionalType=data.optionalDocument?.type||'none',optional=data.optionalDocument?.[optionalType]||{},includeOptional=withOptional&&optionalType!=='none'&&optional.factChecked&&hasOptionalContent(optional);
  var identity=previewIdentity(data.templateType,form),sections=previewFormSections(data.templateType,form);
  var jobCaption=injeCompact?(data.applicationMode==='general'?(identity.job||''):([data.targetCompany||'',identity.job||''].filter(Boolean).join(' · '))):(identity.job||posting?.jobTitle||'');
  return '<div class="resumeA4Sheet'+(injeCompact?' injeResumePrint':'')+'" style="width:min(210mm,100%);min-height:297mm;margin:0 auto;background:#fff;color:#111;padding:16mm 15mm;box-sizing:border-box;border:1px solid #d8dde6;box-shadow:0 8px 30px rgba(15,23,42,.08);font-family:Arial,sans-serif">'
    +'<div style="display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px"><div><div style="font-size:12px;color:#64748b">'+escapeText(title)+'</div><h1 style="font-size:25px;margin:4px 0">'+escapeText(identity.name||'지원자')+'</h1><div style="font-size:13px">'+escapeText(jobCaption)+'</div></div><div style="text-align:right;font-size:11px;line-height:1.65">'+identity.contact.map(escapeText).filter(Boolean).join('<br>')+'</div></div>'
    +(data.summary?previewSection('직무 요약','<p style="margin:0;white-space:pre-line">'+escapeText(data.summary)+'</p>'):'')
    +sections
    +(verified.length?previewSection('직무 관련 경험',verified.map(function(x){return '<div style="margin-bottom:8px"><b>'+escapeText(x.assetTitle||x.section||'경험')+'</b><div style="margin-top:3px">• '+escapeText(x.finalBullet||x.aiBullet||x.rawBullet||'')+'</div></div>';}).join('')):'')
    +(data.skills?previewSection('Skill · Tool','<p style="margin:0;white-space:pre-line">'+escapeText(data.skills)+'</p>'):'')
    +(includeOptional?previewOptionalSection(optionalType,optional):'')
    +'<div style="margin-top:18px;padding-top:8px;border-top:1px solid #d9dde4;font-size:9px;color:#64748b">Jobfit Resume Lab · 검증 완료 항목만 출력</div></div>';
}
function previewIdentity(type,form){
  if(type==='ncs')return {name:form.nameKo||'',job:form.job||form.field||'',contact:[form.mobile,form.email,form.address].filter(Boolean)};
  if(type==='blind')return {name:form.name||'',job:form.targetJob||'',contact:[form.phone,form.email,form.address].filter(Boolean)};
  return {name:form.nameKo||form.nameEn||'',job:form.targetJob||'',contact:[form.phone,form.email,form.address].filter(Boolean)};
}
function previewFormSections(type,form){
  if(type==='ncs')return [
    ['직무관련 교육사항',previewRows(form.training,[['type','교육구분'],['name','과목·과정명'],['content','직무관련 내용'],['hours','교육시간'],['period','기간']])],
    ['자격사항',previewRows(form.certifications,[['name','자격·수상'],['issuer','발급기관'],['date','취득일']])],
    ['경력사항',previewRows(form.career,[['company','회사·기관'],['duty','담당업무'],['period','기간']])],
    ['경험 · 대내외활동',previewRows(form.activities,[['group','활동명·조직'],['role','역할'],['content','직무관련 활동'],['period','기간']])]
  ].filter(function(x){return x[1];}).map(function(x){return previewSection(x[0],x[1]);}).join('');
  if(type==='blind')return [
    ['교육사항',previewRows(form.training,[['type','구분'],['course','교육과정'],['hours','교육시간'],['jobContent','직무관련 내용']])],
    ['자격사항',previewRows(form.certifications,[['name','자격증명'],['issuer','발급기관'],['date','취득일']])],
    ['경험 또는 경력사항',previewRows(form.experience,[['type','구분'],['organization','소속조직'],['role','역할'],['period','기간'],['activity','활동내용']])],
    ['직무관련 주요내용',form.jobContent?'<p style="margin:0;white-space:pre-line">'+escapeText(form.jobContent)+'</p>':'']
  ].filter(function(x){return x[1];}).map(function(x){return previewSection(x[0],x[1]);}).join('');
  return [
    ['학력',previewRows(form.education,[['period','기간'],['school','학교·교육기관'],['major','전공·과정'],['graduation','졸업·이수상태'],['gpa','학점']])],
    ['경력',previewRows(form.career,[['period','기간'],['company','회사·기관'],['position','직무·역할'],['duty','담당업무'],['employmentType','고용형태']])],
    ['자격증 · 어학능력',previewRows(form.certifications,[['date','취득일'],['name','자격·시험'],['score','점수·급수'],['issuer','발급기관']])],
    ['대외활동 · 프로젝트',previewRows(form.activities,[['period','기간'],['activity','활동·프로젝트'],['organization','기관·팀'],['note','역할·성과']])]
  ].filter(function(x){return x[1];}).map(function(x){return previewSection(x[0],x[1]);}).join('');
}
function previewRows(group,cols){
  if(!group||typeof group!=='object')return '';
  var rows=Object.keys(group).sort().map(function(k){return group[k];}).filter(function(r){return r&&typeof r==='object'&&cols.some(function(c){return String(r[c[0]]||'').trim();});});
  if(!rows.length)return '';
  return '<table style="width:100%;border-collapse:collapse;font-size:10.5px"><thead><tr>'+cols.map(function(c){return '<th style="border:1px solid #bcc3ce;background:#f4f6f8;padding:5px;text-align:left">'+escapeText(c[1])+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+cols.map(function(c){return '<td data-label="'+escapeText(c[1])+'" style="border:1px solid #d8dde6;padding:5px;vertical-align:top">'+escapeText(r[c[0]]||'')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
}
function previewSection(title,body){
  return '<section style="margin:15px 0"><h2 style="font-size:13px;margin:0 0 7px;border-bottom:1px solid #111;padding-bottom:4px">'+escapeText(title)+'</h2><div style="font-size:10.8px;line-height:1.55">'+body+'</div></section>';
}
function previewOptionalSection(type,obj){
  var title=type==='career'?'경력기술서':'경험기술서',pairs=type==='career'
    ?[['company','회사명'],['period','근무기간'],['departmentPosition','부서 · 직급 · 역할'],['employmentType','고용형태'],['duties','담당업무'],['achievements','주요 성과 · Evidence'],['tools','Skill · Tool'],['jobLink','지원직무 연결']]
    :[['title','경험명'],['period','기간'],['organization','기관 · 수업 · 팀'],['role','내 역할'],['task','상황 · 과제'],['action','내 행동'],['resultEvidence','결과 · Evidence'],['jobLink','지원직무 연결']];
  var body=pairs.filter(function(p){return String(obj[p[0]]||'').trim();}).map(function(p){return '<div style="display:grid;grid-template-columns:30mm 1fr;border-bottom:1px solid #e4e7ec;padding:5px 0"><b>'+escapeText(p[1])+'</b><span style="white-space:pre-line">'+escapeText(obj[p[0]]||'')+'</span></div>';}).join('');
  return previewSection(title,body);
}
function escapeText(x){
  return String(x==null?'':x).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
}
function resumePrintCss(){
  return '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,"Noto Sans KR",sans-serif}.resumeA4Sheet{width:210mm!important;min-height:297mm!important;margin:0!important;box-shadow:none!important;border:0!important;padding:16mm 15mm!important}';
}


export async function render(ctx){
  const displayStep=ctx.displayStep??9,injeCompact=displayStep!==9,prevEvidenceStep=injeCompact?'STEP 4 GAP Match':'STEP 8',prevGateStep=injeCompact?'STEP 4 GAP Match':'STEP 7';
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0],assets=s.artifacts?.careerAssets?.assets||[],candidateAssets=assets.filter(a=>(a.evidenceLevel||legacyLevel(a.strength))!=='없음'),experiences=s.assessments?.experienceCompetency?.experiences||[],saved=s.artifacts?.resumeLab||{items:[],summary:'',skills:'',notes:''},data=structuredClone(saved),root=document.getElementById('stepRoot');
  data.items=data.items||[];ensureResumeForms(data);const prior=collectResumePriorData(s,posting,experiences);

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP ${displayStep}</div><h2>Resume Lab</h2><p>JD와 Career Asset을 연결해 이력서·경험기술서를 만들되, 검증된 사실만 최종 문장으로 사용합니다.</p></div><span class="badge">9주차</span></div><div class="progress"><span style="width:71%"></span></div>
    ${posting?`<div class="callout info"><b>Target JD</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}
    ${posting?gateNotice(posting,ctx,prevGateStep):''}

    ${resumeTemplateBlock(data,ctx,prior)}

    <div class="hr"></div><div class="block"><h3>2. Resume Evidence Gate</h3><div id="resumeGate"></div><div class="grid3" style="margin-top:12px"><div class="miniCard"><b>Fact</b><span>하지 않은 일·없는 수치를 쓰지 않는다.</span></div><div class="miniCard"><b>Action</b><span>역할명이 아니라 내가 직접 한 행동을 쓴다.</span></div><div class="miniCard"><b>Evidence</b><span>JD Requirement를 증명하는 Career Asset만 사용한다.</span></div></div></div>

    <div class="hr"></div><div class="block"><h3>3. Career Asset → Resume Bullet</h3><p class="help">Fact Check가 끝나지 않은 자산도 초안 연습은 가능하지만, 최종 제출용으로는 표시하지 않습니다.</p><div class="grid2">${selectAsset('assetId','Career Asset',candidateAssets)}${sel('section','이력서 섹션','',['프로젝트','인턴·경력','대외활동','아르바이트','교육·수업','기타'])}</div><div id="assetContext" class="callout info">Career Asset을 선택하면 Evidence와 검증상태를 확인합니다.</div>
      <div class="grid2" style="margin-top:12px">${area('rawBullet','내 원문','','내가 먼저 사실 중심으로 작성한 문장')}${area('aiBullet','AI 구조화','','AI가 제안한 문장 또는 구조')}${area('finalBullet','최종 Bullet','','Action + 대상/방법 + Result/Evidence 중심으로 최종 수정')}${area('detailText','경험기술서 확장','','필요 시 3~5문장으로 역할·행동·성과를 확장')}</div>
      <label class="checkRow"><input type="checkbox" id="factChecked"><div><b>Resume Fact Check</b><span>행동·수치·결과가 Career Asset 및 원경험의 사실과 일치합니다.</span></div></label>
      <div class="actions"><button class="btn secondary" id="copyPrompt">Resume AI 프롬프트 복사</button><button class="btn primary" id="addItem">이력서 문장 추가</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="resumeItems"></div></div>
    ${optionalResumeDocsBlock(data,ctx,candidateAssets)}
    <div class="hr"></div><div class="block"><h3>5. 직무맞춤 요약</h3><div class="grid2">${area('summary','직무 요약',data.summary,'내가 어떤 Evidence를 가진 지원자인지 2~3문장')}${area('skills','직무 관련 Skill·Tool',data.skills,'JD에서 실제로 요구하고 내가 보유한 Skill·Tool만')}</div><div class="field" style="margin-top:12px"><label>점검 메모</label><textarea id="notes" placeholder="추가 보완할 부분">${esc(data.notes||'',ctx)}</textarea></div><div class="actions"><button class="btn primary" id="saveResume">Resume 저장</button><button class="btn secondary" id="nextStep">STEP ${displayStep+1} Cover Letter Lab →</button></div></div>
    ${resumePreviewBlock()}
  </section>`;

  wireResumeFormUi(data,ctx,persist,candidateAssets,experiences,prior);wireResumePreviewUi(data,ctx,posting,assets,persist);renderAll();document.getElementById('assetId').addEventListener('change',renderAssetContext);document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));document.getElementById('addItem').addEventListener('click',addItem);document.getElementById('saveResume').addEventListener('click',saveBase);document.getElementById('nextStep').addEventListener('click',()=>{saveBase();ctx.navigate(10)});

  function renderAll(){renderGate();renderItems();renderAssetContext();}
  function renderGate(){const box=document.getElementById('resumeGate');if(!box)return;const verified=candidateAssets.filter(isAssetVerified).length,draft=candidateAssets.length-verified,finalItems=data.items.filter(x=>x.factChecked&&x.assetVerified).length,draftItems=data.items.length-finalItems;box.innerHTML=`<div class="grid4"><div class="miniCard"><b>Career Asset 후보</b><span>${candidateAssets.length}개</span></div><div class="miniCard"><b>검증된 Asset</b><span>${verified}개</span></div><div class="miniCard"><b>검증대기 Asset</b><span>${draft}개</span></div><div class="miniCard"><b>최종 사용 가능 Bullet</b><span>${finalItems}개 · 초안 ${draftItems}개</span></div></div>${draft?'<div class="callout warn"><b>검증대기 Career Asset이 있습니다.</b><br>초안 작성은 가능하지만 최종 Resume에는 Career Asset Fact Check와 원경험 Fact Check를 모두 완료한 항목만 사용하세요.</div>':'<div class="callout good"><b>Career Asset 검증상태 양호</b><br>현재 선택 가능한 자산은 사실검증 상태가 확인되었습니다.</div>'}`;}
  function renderAssetContext(){const box=document.getElementById('assetContext'),a=assets.find(x=>x.id===v('assetId'));if(!a){box.className='callout info';box.textContent=candidateAssets.length?'Career Asset을 선택하세요.':`사용 가능한 Career Asset이 없습니다. ${prevEvidenceStep}에서 JD Requirement와 Evidence를 먼저 연결하세요.`;return;}const level=a.evidenceLevel||legacyLevel(a.strength),verified=isAssetVerified(a);box.className=`callout ${verified?'good':'warn'}`;box.innerHTML=`<b>${esc(level,ctx)} · ${esc(a.experienceTitle,ctx)} → ${esc(a.requirement,ctx)}</b><br>Career Asset 사실검증: ${esc(a.factCheck||'미확인',ctx)}${a.sourceExperienceFactChecked===false?' · 원경험 Fact Check 미완료':''}<br>핵심행동: ${esc(a.proof||'미입력',ctx)}<br>Evidence: ${esc(a.fact||'미입력',ctx)}<br><b>${verified?'최종 Resume 사용 가능':'현재는 초안용 · 검증 후 최종 사용'}</b>`;}
  function addItem(){const assetId=v('assetId');if(!assetId){status('Career Asset을 선택하세요.');return;}const a=assets.find(x=>x.id===assetId),level=a?.evidenceLevel||legacyLevel(a?.strength);if(level==='없음'){status('Evidence 없음 자산은 Resume에 사용할 수 없습니다.');return;}if(!v('rawBullet')&&!v('finalBullet')&&!v('aiBullet')){status('최소한 내 원문 또는 최종 Bullet을 작성하세요.');return;}const assetVerified=isAssetVerified(a),resumeChecked=document.getElementById('factChecked').checked,item={id:`resume_${Date.now()}`,assetId,assetTitle:a?.experienceTitle||'',requirement:a?.requirement||'',requirementLevel:a?.requirementLevel||'',evidenceLevel:level,assetFactCheck:a?.factCheck||'',assetVerified,section:v('section'),rawBullet:v('rawBullet'),aiBullet:v('aiBullet'),finalBullet:v('finalBullet'),detailText:v('detailText'),factChecked:resumeChecked,status:assetVerified&&resumeChecked?'final-ready':'draft'};data.items.push(item);persist();['rawBullet','aiBullet','finalBullet','detailText'].forEach(id=>document.getElementById(id).value='');document.getElementById('factChecked').checked=false;renderAll();status(item.status==='final-ready'?'최종 사용 가능한 Resume 문장을 추가했습니다.':'초안으로 저장했습니다. 사실검증 후 최종 사용하세요.');}
  function renderItems(){const box=document.getElementById('resumeItems');if(!data.items.length){box.innerHTML='<div class="placeholder"><b>아직 Resume 문장이 없습니다.</b>Career Asset을 실제 이력서 문장으로 바꾸세요.</div>';return;}box.innerHTML=data.items.map((x,i)=>{const ready=x.status==='final-ready'||(x.factChecked&&x.assetVerified);return `<div class="listCard"><div class="listHead"><div><span class="rankTag">Resume ${i+1}</span><h3>${esc(x.assetTitle,ctx)}</h3><div class="muted small">${esc(x.section||'섹션 미정',ctx)} · ${esc(x.evidenceLevel||'',ctx)} · ${esc(x.requirementLevel||'중요도 미분류',ctx)}</div></div>${ready?'<span class="scoreChip">Final Ready</span>':'<span class="scoreChip" style="background:#fff8e6;color:#9a6700;border-color:#f3dfaa">Draft · 검증필요</span>'}</div><div><b>연결 Requirement</b><p>${esc(x.requirement||'—',ctx)}</p></div><div><b>최종 Bullet</b><p>${esc(x.finalBullet||x.aiBullet||x.rawBullet||'—',ctx)}</p></div>${x.detailText?`<div><b>경험기술</b><p>${esc(x.detailText,ctx)}</p></div>`:''}<div class="actions"><button class="btn danger smallBtn" data-del="${x.id}">삭제</button></div></div>`}).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.items=data.items.filter(x=>x.id!==b.dataset.del);persist();renderAll();}));}
  function buildPrompt(){const a=assets.find(x=>x.id===v('assetId'));return `너는 이력서 문장 코치다. 아래 Career Asset에 기록된 사실만 사용해 Resume bullet을 구조화해라. 없는 숫자·성과·역할은 만들지 마라.\n\n[Target JD]\n${posting?`${posting.company} / ${posting.jobTitle}\n${posting.rawPosting||''}`:'미등록'}\n\n[Career Asset]\n${JSON.stringify(a||{},null,2)}\n\n[선택 이력서 양식]\n${resumeTemplateLabel(data.templateType)}\n\n[내가 먼저 쓴 문장]\n${v('rawBullet')||'미작성'}\n\n규칙:\n1. Career Asset의 Evidence 수준이 '없음'이면 문장을 만들지 말고 GAP라고 알려라.\n2. Career Asset 또는 원경험 Fact Check가 미완료이면 결과를 '초안'이라고 명시해라.\n3. 내가 직접 한 Action이 앞에 드러나게 한다.\n4. 대상·방법·결과·Evidence 중 실제 존재하는 정보만 사용한다.\n5. 수치가 없으면 만들지 않는다.\n6. JD 키워드를 억지로 삽입하지 않는다.\n7. 1줄 Bullet 2안과 경험기술서용 3~4문장 1안을 제시한다.\n8. 원문보다 과장된 표현과 사실확인이 필요한 표현을 마지막에 따로 표시한다.`}
  function saveBase(){data.summary=v('summary');data.skills=v('skills');data.notes=v('notes');persist();ctx.toast('Resume Lab 결과를 저장했습니다.');}
  function persist(){ctx.saveState({artifacts:{resumeLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
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
}
function resumeTemplateLabel(type){
  return type==='ncs'?'NCS 이력서':type==='blind'?'블라인드 이력서':'표준이력서';
}
function resumeTemplateBlock(data,ctx,prior){
  ensureResumeForms(data);
  return '<div class="block" id="resumeTemplateLab">'
    +'<h3>1. 이력서 양식 선택 · 직접 작성</h3>'
    +'<p class="help">제공해주신 3개 예시를 기준으로 구성했습니다. <b>학생은 하나만 선택해 작성</b>하고, 실제 지원 시에는 해당 기업·기관의 지정 양식을 우선합니다.</p>'
    +'<div class="actions" id="resumeTemplateTabs">'
      +resumeTab('standard','표준이력서',data.templateType)
      +resumeTab('ncs','NCS 이력서',data.templateType)
      +resumeTab('blind','블라인드 이력서',data.templateType)
    +'</div>'
    +'<div id="resumeTemplateGuide">'+resumeTemplateGuide(data.templateType)+'</div>'
    +resumeAutoImportBlock(prior,data.templateType,ctx)
    +'<div id="resumeTemplateForm">'+resumeTemplateForm(data,ctx)+'</div>'
  +'</div>';
}

function resumeAutoImportBlock(prior,type,ctx){
  var edu=prior.education?.institution||prior.education?.major?'학력·전공 1건':'학력·전공 없음';
  var certCount=(prior.certifications||[]).length+(prior.language||[]).length;
  var expCount=(prior.experiences||[]).length;
  var skill=prior.tools?'도구·기술 있음':'도구·기술 없음';
  var blindNote=type==='blind'?'<br><b>블라인드 보호:</b> 학교명은 자동 입력하지 않습니다.':'';
  var ncsNote=type==='ncs'?'<br><b>NCS 보호:</b> 학교명·학점 대신 직무관련 교육·경험만 가져옵니다.':'';
  return '<div class="callout good" id="resumeAutoImport"><b>STEP 1~7 자동 불러오기</b><br>'
    +'앞에서 이미 입력한 사실은 다시 쓰지 않습니다. <b>'+esc(edu,ctx)+' · 자격/어학 '+certCount+'건 · 검증 경험 '+expCount+'건 · '+esc(skill,ctx)+'</b>'
    +blindNote+ncsNote
    +'<br><span class="muted small">자동 불러오기는 빈칸만 채웁니다. 성명·휴대전화·이메일 등 앞 단계에 없는 개인정보는 학생이 직접 입력합니다.</span>'
    +'<div class="actions" style="margin-top:10px"><button type="button" class="btn secondary smallBtn" data-resume-import="education">학력·교육</button><button type="button" class="btn secondary smallBtn" data-resume-import="credentials">자격·어학</button><button type="button" class="btn secondary smallBtn" data-resume-import="experiences">경험·활동</button><button type="button" class="btn primary smallBtn" data-resume-import="all">가능한 항목 모두 불러오기</button></div></div>';
}
function collectResumePriorData(state,posting,experiences){
  var profile=state.profile||{},spec=findRelevantStudentSpec(state,posting),verified=(experiences||[]).filter(function(x){return x&&x.factChecked;});
  return {
    education:{institution:String(profile.schoolName||profile.university||profile.educationInstitution||'').trim(),major:String(profile.major||'').trim(),grade:String(profile.grade||'').trim()},
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
      count+=putResumeRows(data.forms.standard,'education',[{school:prior.education.institution,major:prior.education.major}],3,['school','major']);
    }
    var educationExp=(prior.experiences||[]).filter(function(x){return experienceKind(x)==='education';});
    if(type==='ncs')count+=putResumeRows(data.forms.ncs,'training',educationExp.map(function(x){return {type:'학교교육',name:x.title||'',content:resumeExperienceContent(x),hours:'',period:x.period||''};}),4,['name','content']);
    if(type==='blind')count+=putResumeRows(data.forms.blind,'training',educationExp.map(function(x){return {type:'학교교육',course:x.title||'',hours:'',jobContent:resumeExperienceContent(x)};}),4,['course','jobContent']);
  }
  function doCredentials(){
    var entries=[...(prior.certifications||[]),...(prior.language||[])].map(function(x){return {name:x};});
    if(type==='standard')count+=putResumeRows(data.forms.standard,'certifications',entries,4,['name']);
    if(type==='ncs')count+=putResumeRows(data.forms.ncs,'certifications',entries.map(function(x){return {name:x.name};}),4,['name']);
    if(type==='blind')count+=putResumeRows(data.forms.blind,'certifications',entries.map(function(x){return {name:x.name};}),4,['name']);
  }
  function doExperiences(){
    var exps=(prior.experiences||[]).filter(function(x){return experienceKind(x)!=='education';});
    if(type==='standard'){
      var careers=exps.filter(function(x){return experienceKind(x)==='career';}).map(function(x){return {period:x.period||'',company:x.organization||x.company||'',position:x.roleTitle||x.role||'',duty:resumeExperienceContent(x),employmentType:x.employmentType||''};});
      var acts=exps.filter(function(x){return experienceKind(x)!=='career';}).map(function(x){return {period:x.period||'',activity:x.title||'',organization:x.organization||x.team||'',note:uniqueJoin([x.roleTitle||x.role,x.action,x.result])};});
      count+=putResumeRows(data.forms.standard,'career',careers,3,['company','duty']);
      count+=putResumeRows(data.forms.standard,'activities',acts,4,['activity','note']);
    }
    if(type==='ncs'){
      var ncsCareers=exps.filter(function(x){return experienceKind(x)==='career';}).map(function(x){return {company:x.organization||x.company||'',duty:resumeExperienceContent(x),period:x.period||''};});
      var ncsActs=exps.filter(function(x){return experienceKind(x)!=='career';}).map(function(x){return {group:x.organization||x.team||x.title||'',role:x.roleTitle||x.role||'',content:resumeExperienceContent(x),period:x.period||''};});
      count+=putResumeRows(data.forms.ncs,'career',ncsCareers,4,['company','duty']);
      count+=putResumeRows(data.forms.ncs,'activities',ncsActs,4,['group','content']);
    }
    if(type==='blind'){
      var blindRows=exps.map(function(x){var kind=experienceKind(x);return {type:kind==='career'?'경력':'경험',organization:safeBlindOrganization(x.organization||x.company||x.team||x.title||'',kind),role:x.roleTitle||x.role||'',period:x.period||'',activity:resumeExperienceContent(x)};});
      count+=putResumeRows(data.forms.blind,'experience',blindRows,4,['organization','activity']);
    }
  }
  if(scope==='education'||scope==='all')doEducation();
  if(scope==='credentials'||scope==='all')doCredentials();
  if(scope==='experiences'||scope==='all')doExperiences();
  if(scope==='all'&&prior.tools&&!String(data.skills||'').trim()){data.skills=prior.tools;count++;}
  var label=scope==='education'?'학력·교육':scope==='credentials'?'자격·어학':scope==='experiences'?'경험·활동':'앞 단계 데이터';
  return {count,message:count?label+' '+count+'개 항목을 빈칸에 불러왔습니다.':'새로 불러올 '+label+' 정보가 없습니다. 기존 입력값은 유지했습니다.'};
}
function putResumeRows(form,key,entries,maxRows,dedupeKeys){
  if(!entries.length)return 0;form[key]=form[key]&&typeof form[key]==='object'?form[key]:{};var added=0;
  var existing=Object.values(form[key]).filter(function(x){return x&&typeof x==='object';});
  entries.slice(0,maxRows).forEach(function(entry){
    var sig=dedupeKeys.map(function(k){return String(entry[k]||'').trim();}).join('|');if(!sig.replace(/\|/g,''))return;
    var duplicate=existing.some(function(row){return dedupeKeys.map(function(k){return String(row[k]||'').trim();}).join('|')===sig;});if(duplicate)return;
    var slot='';for(var i=0;i<maxRows;i++){var k='r'+i,row=form[key][k];if(!row||!Object.values(row).some(function(v){return String(v||'').trim();})){slot=k;break;}}
    if(!slot)return;form[key][slot]={...(form[key][slot]||{}),...entry};existing.push(form[key][slot]);added++;
  });return added;
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
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>표준이력서</h3></div><span class="scoreChip">일반 기업형</span></div>'
    +resumeFieldPolicy('standard')
    +resumeExampleControls('standard')
    +resumeFieldGroup('standard-basic','기본정보 · 필수','<div class="grid2">'
      +boundField(data,ctx,'forms.standard.targetJob','지원직무','예: 생산기술')
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
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>NCS 이력서</h3></div><span class="scoreChip">직무중심</span></div>'
    +resumeFieldPolicy('ncs')
    +resumeExampleControls('ncs')
    +resumeFieldGroup('ncs-basic','기본정보 · 필수','<div class="grid2">'
      +boundField(data,ctx,'forms.ncs.field','지원분야')
      +boundField(data,ctx,'forms.ncs.job','직무')
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
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>블라인드 채용 입사지원서</h3></div><span class="scoreChip">차별요소 제외</span></div>'
    +resumeFieldPolicy('blind')
    +resumeExampleControls('blind')
    +resumeFieldGroup('blind-basic','전형 운영정보 · 필수','<div class="grid2">'
      +boundSelect(data,ctx,'forms.blind.applicantType','지원구분',['신입','경력'])
      +boundField(data,ctx,'forms.blind.targetJob','지원직무')
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
        body+='<td>'+cellSelect(path,val,c[2],ctx)+'</td>';
      }else{
        body+='<td><input data-resume-bind="'+path+'" value="'+esc(val,ctx)+'" style="min-width:110px;width:100%;border:0;background:transparent;padding:8px"></td>';
      }
    });
    body+='</tr>';
  }
  var sectionId=base.replace(/^forms\./,'').replace(/\./g,'-');
  return resumeFieldGroup(sectionId,title,'<div class="muted small" style="margin-bottom:8px">필요한 행만 작성하세요. 모바일에서는 표를 좌우로 밀어 입력할 수 있습니다.</div><div class="matrixWrap"><table class="matrix"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>',false);
}


function resumeFieldPolicy(type){
  if(type==='ncs')return '<div class="callout info"><b>항목 판정</b><br><b>필수</b> 지원분야·직무·성명·휴대전화·이메일<br><b>선택·조건부</b> 주소(기관 요구 시), 직무관련 교육·자격·경험·경력(공고 평가항목일 때 작성)<br><b>기본 양식에서 삭제</b> 영문성명, 중복 전화번호, 학교명·입학/졸업연도·전체학점, 자격증 번호, 취미·특기</div>';
  if(type==='blind')return '<div class="callout warn"><b>항목 판정</b><br><b>필수</b> 지원구분·지원직무·성명·연락처·이메일<br><b>선택·조건부</b> 주소(기관 요구 시), 교육·자격·경험·경력, 공고에 명시된 가점사항<br><b>기본 양식에서 삭제</b> 사진·성별·생년월일·학교명·졸업일·전체학점·최종학교 소재지·직접 입력 접수번호</div>';
  return '<div class="callout info"><b>항목 판정</b><br><b>필수</b> 지원직무·성명·휴대전화·이메일<br><b>선택·조건부</b> 영문명, 주소, 학력, 경력, 자격·어학, 프로젝트·대외활동, 학점<br><b>기본 양식에서 삭제</b> 사진·생년월일·성별·가족사항·신체조건</div>';
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
  return '<div class="field"><label>'+label+'</label><input type="'+(type||'text')+'" data-resume-bind="'+path+'" value="'+esc(valueAt(data,path),ctx)+'" placeholder="'+esc(ph||'',ctx)+'"></div>';
}
function boundArea(data,ctx,path,label,ph){
  return '<div class="field" style="margin-top:12px"><label>'+label+'</label><textarea data-resume-bind="'+path+'" placeholder="'+esc(ph||'',ctx)+'">'+esc(valueAt(data,path),ctx)+'</textarea></div>';
}
function boundSelect(data,ctx,path,label,opts){
  var val=valueAt(data,path)||opts[0];
  return '<div class="field"><label>'+label+'</label><select data-resume-bind="'+path+'">'+opts.map(function(o){return '<option '+(o===val?'selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
}
function boundCheck(data,ctx,path,label){
  return '<label class="pill"><input type="checkbox" data-resume-bind="'+path+'" '+(valueAt(data,path)?'checked':'')+'> '+label+'</label>';
}
function cellSelect(path,val,opts,ctx){
  val=val||opts[0];
  return '<select data-resume-bind="'+path+'" style="min-width:110px;width:100%;border:0;background:transparent;padding:8px">'+opts.map(function(o){return '<option '+(o===val?'selected':'')+'>'+esc(o,ctx)+'</option>';}).join('')+'</select>';
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
      +optionalFactCheck(data,'experience')+'</div>';
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
      +optionalFactCheck(data,'career')+'</div>';
  }
  return '<div class="placeholder"><b>선택사항입니다.</b>이력서만 필요한 경우 여기서는 아무것도 작성하지 않아도 됩니다.</div>';
}
function wireResumeFormUi(data,ctx,persist,assets=[],experiences=[],prior={}){
  var lab=document.getElementById('resumeTemplateLab');
  if(lab){
    lab.addEventListener('click',function(e){
      var importer=e.target.closest('[data-resume-import]');
      if(importer){
        var result=applyResumePriorData(data,data.templateType,prior,importer.dataset.resumeImport||'all');persist();
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
      lab.querySelectorAll('[data-resume-template]').forEach(function(x){x.classList.toggle('primary',x===b);x.classList.toggle('secondary',x!==b);});
    });
    bindResumeInputs(lab,data,persist);
  }
  var docs=document.getElementById('optionalResumeDocs');
  if(docs){
    docs.addEventListener('click',function(e){
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
  }
}
function bindResumeInputs(root,data,persist){
  root.addEventListener('input',function(e){
    var el=e.target.closest('[data-resume-bind]');if(!el||el.type==='checkbox'||el.tagName==='SELECT')return;
    setValueAt(data,el.dataset.resumeBind,el.value);persist();
  });
  root.addEventListener('change',function(e){
    var el=e.target.closest('[data-resume-bind]');if(!el)return;
    setValueAt(data,el.dataset.resumeBind,el.type==='checkbox'?el.checked:el.value);persist();
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
    target.action=asset.proof||exp.action||target.action||'';
    target.resultEvidence=uniqueJoin([exp.result,asset.fact,target.resultEvidence]);
    target.jobLink=asset.jobLink||target.jobLink||((asset.requirement||'')?asset.requirement+' 요구와 연결':'');
  }else{
    target.period=target.period||exp.period||'';
    target.departmentPosition=target.departmentPosition||exp.roleTitle||exp.role||'';
    target.duties=asset.proof||exp.action||target.duties||'';
    target.achievements=uniqueJoin([exp.result,asset.fact,target.achievements]);
    target.jobLink=asset.jobLink||target.jobLink||((asset.requirement||'')?asset.requirement+' 요구와 연결':'');
  }
}
function uniqueJoin(values){
  return [...new Set(values.map(function(x){return String(x||'').trim();}).filter(Boolean))].join(' · ');
}
function resumePreviewBlock(){
  return '<div class="hr"></div><div class="block" id="resumePreviewLab"><h3>6. A4 이력서 미리보기 · PDF 저장</h3>'
    +'<p class="help">선택한 이력서 양식을 A4 형태로 확인합니다. Resume Bullet은 <b>Final Ready</b>만, 경험·경력기술서는 <b>Fact Check 완료</b> 항목만 최종 문서에 포함됩니다.</p>'
    +'<div class="actions"><button type="button" class="btn secondary" id="refreshResumePreview">A4 미리보기</button><button type="button" class="btn primary" id="printResumePdf">PDF로 저장</button></div>'
    +'<div class="callout info"><b>PDF 저장 방법</b><br>버튼을 누르면 인쇄창이 열립니다. 프린터에서 ‘PDF로 저장’을 선택하세요.</div>'
    +'<div id="resumePreviewStatus" class="status"></div><div id="resumeA4Preview" class="hidden" style="margin-top:14px"></div></div>';
}
function wireResumePreviewUi(data,ctx,posting,assets,persist){
  var refresh=document.getElementById('refreshResumePreview'),printBtn=document.getElementById('printResumePdf'),box=document.getElementById('resumeA4Preview');
  if(!refresh||!printBtn||!box)return;
  function syncBase(){
    var summary=document.getElementById('summary'),skills=document.getElementById('skills'),notes=document.getElementById('notes');
    if(summary)data.summary=summary.value.trim();if(skills)data.skills=skills.value.trim();if(notes)data.notes=notes.value.trim();persist();
  }
  function renderPreview(){
    syncBase();box.innerHTML=resumeA4Html(data,ctx,posting,assets);box.classList.remove('hidden');
    var omitted=resumeOmittedCount(data);document.getElementById('resumePreviewStatus').textContent=omitted?('검증 전 항목 '+omitted+'개는 최종 문서에서 제외했습니다.'):'검증된 항목만 A4 미리보기에 반영했습니다.';
  }
  refresh.addEventListener('click',renderPreview);
  printBtn.addEventListener('click',function(){
    renderPreview();
    var iframe=document.getElementById('resumePrintFrame');if(iframe)iframe.remove();
    iframe=document.createElement('iframe');iframe.id='resumePrintFrame';iframe.style.position='fixed';iframe.style.right='0';iframe.style.bottom='0';iframe.style.width='1px';iframe.style.height='1px';iframe.style.border='0';document.body.appendChild(iframe);
    var doc=iframe.contentDocument;doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"><title>'+escapeText(resumeTemplateLabel(data.templateType))+'</title><style>'+resumePrintCss()+'</style></head><body>'+box.innerHTML+'</body></html>');doc.close();
    setTimeout(function(){try{iframe.contentWindow.focus();iframe.contentWindow.print();}catch(e){ctx.toast('인쇄창을 열지 못했습니다. A4 미리보기에서 브라우저 인쇄 기능을 사용해 주세요.')}},120);
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
function resumeA4Html(data,ctx,posting,assets){
  var form=data.forms?.[data.templateType]||{},title=resumeTemplateLabel(data.templateType),verified=(data.items||[]).filter(function(x){return x.status==='final-ready'||(x.factChecked&&x.assetVerified);});
  var optionalType=data.optionalDocument?.type||'none',optional=data.optionalDocument?.[optionalType]||{},includeOptional=optionalType!=='none'&&optional.factChecked&&hasOptionalContent(optional);
  var identity=previewIdentity(data.templateType,form),sections=previewFormSections(data.templateType,form);
  return '<div class="resumeA4Sheet" style="width:min(210mm,100%);min-height:297mm;margin:0 auto;background:#fff;color:#111;padding:16mm 15mm;box-sizing:border-box;border:1px solid #d8dde6;box-shadow:0 8px 30px rgba(15,23,42,.08);font-family:Arial,sans-serif">'
    +'<div style="display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px"><div><div style="font-size:12px;color:#64748b">'+escapeText(title)+'</div><h1 style="font-size:25px;margin:4px 0">'+escapeText(identity.name||'지원자')+'</h1><div style="font-size:13px">'+escapeText(identity.job||posting?.jobTitle||'')+'</div></div><div style="text-align:right;font-size:11px;line-height:1.65">'+identity.contact.map(escapeText).filter(Boolean).join('<br>')+'</div></div>'
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
  return '<table style="width:100%;border-collapse:collapse;font-size:10.5px"><thead><tr>'+cols.map(function(c){return '<th style="border:1px solid #bcc3ce;background:#f4f6f8;padding:5px;text-align:left">'+escapeText(c[1])+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+cols.map(function(c){return '<td style="border:1px solid #d8dde6;padding:5px;vertical-align:top">'+escapeText(r[c[0]]||'')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
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


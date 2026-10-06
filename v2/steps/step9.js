export async function render(ctx){
  const displayStep=ctx.displayStep??9,injeCompact=displayStep!==9,prevEvidenceStep=injeCompact?'STEP 4 GAP Match':'STEP 8',prevGateStep=injeCompact?'STEP 4 GAP Match':'STEP 7';
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0],assets=s.artifacts?.careerAssets?.assets||[],candidateAssets=assets.filter(a=>(a.evidenceLevel||legacyLevel(a.strength))!=='없음'),experiences=s.assessments?.experienceCompetency?.experiences||[],saved=s.artifacts?.resumeLab||{items:[],summary:'',skills:'',notes:''},data=structuredClone(saved),root=document.getElementById('stepRoot');
  data.items=data.items||[];ensureResumeForms(data);

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP ${displayStep}</div><h2>Resume Lab</h2><p>JD와 Career Asset을 연결해 이력서·경험기술서를 만들되, 검증된 사실만 최종 문장으로 사용합니다.</p></div><span class="badge">9주차</span></div><div class="progress"><span style="width:71%"></span></div>
    ${posting?`<div class="callout info"><b>Target JD</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}
    ${posting?gateNotice(posting,ctx,prevGateStep):''}

    ${resumeTemplateBlock(data,ctx)}

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

  wireResumeFormUi(data,ctx,persist,candidateAssets,experiences);wireResumePreviewUi(data,ctx,posting,assets,persist);renderAll();document.getElementById('assetId').addEventListener('change',renderAssetContext);document.getElementById('copyPrompt').addEventListener('click',()=>copy(buildPrompt(),ctx));document.getElementById('addItem').addEventListener('click',addItem);document.getElementById('saveResume').addEventListener('click',saveBase);document.getElementById('nextStep').addEventListener('click',()=>{saveBase();ctx.navigate(10)});

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
function resumeTemplateBlock(data,ctx){
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
    +'<div id="resumeTemplateForm">'+resumeTemplateForm(data,ctx)+'</div>'
  +'</div>';
}
function resumeTab(type,label,current){
  return '<button type="button" class="btn '+(current===type?'primary':'secondary')+'" data-resume-template="'+type+'">'+label+'</button>';
}
function resumeTemplateGuide(type){
  if(type==='blind')return '<div class="callout warn"><b>블라인드 작성 주의</b><br>사진·생년월일·성별·출신지역·가족관계·학교명 등 기관이 금지한 개인정보는 쓰지 않습니다. 실제 공고의 블라인드 기준이 우선합니다.</div>';
  if(type==='ncs')return '<div class="callout info"><b>NCS 이력서</b><br>제공해주신 예시를 기준으로 교육·자격·훈련·경험을 직무 관련 내용 중심으로 작성합니다. 기관별 NCS 입사지원서 양식이 있으면 그 양식을 우선합니다.</div>';
  return '<div class="callout info"><b>표준이력서</b><br>일반 기업 지원에 쓰기 쉬운 기본형입니다. 사진·생년월일 등은 기업이 요구할 때만 입력하고 불필요한 개인정보는 비워둘 수 있습니다.</div>';
}
function resumeTemplateForm(data,ctx){
  if(data.templateType==='ncs')return ncsResumeForm(data,ctx);
  if(data.templateType==='blind')return blindResumeForm(data,ctx);
  return standardResumeForm(data,ctx);
}
function standardResumeForm(data,ctx){
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>표준이력서</h3></div><span class="scoreChip">직접 입력</span></div>'
    +'<div class="grid2">'
      +boundField(data,ctx,'forms.standard.targetJob','지원직무','예: 생산기술')
      +'<div class="field"><label>사진 <span class="muted">선택</span></label><input type="file" accept="image/*"><span class="muted small">사진 파일은 Jobfit 저장데이터에 저장하지 않습니다.</span></div>'
      +boundField(data,ctx,'forms.standard.nameKo','한글이름')
      +boundField(data,ctx,'forms.standard.nameEn','영문이름')
      +boundField(data,ctx,'forms.standard.birthDate','생년월일','선택 입력','date')
      +boundField(data,ctx,'forms.standard.phone','휴대폰')
      +boundField(data,ctx,'forms.standard.email','이메일','','email')
      +boundField(data,ctx,'forms.standard.address','주소','선택 입력')
    +'</div>'
    +resumeGridTable(data,ctx,'학력','forms.standard.education',[['period','기간'],['school','학교'],['gpa','학점'],['graduation','졸업여부']],3)
    +resumeGridTable(data,ctx,'경력','forms.standard.career',[['period','기간'],['company','회사명'],['position','직급·역할'],['employmentType','고용형태']],3)
    +resumeGridTable(data,ctx,'자격증 · 어학능력','forms.standard.certifications',[['date','날짜'],['name','자격증·어학'],['score','점수/급수'],['issuer','발급기관']],4)
    +resumeGridTable(data,ctx,'대외활동','forms.standard.activities',[['period','기간'],['activity','활동내용'],['organization','기관'],['note','비고']],4)
  +'</div>';
}
function ncsResumeForm(data,ctx){
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>NCS 이력서</h3></div><span class="scoreChip">직무중심</span></div>'
    +'<div class="grid2">'
      +boundField(data,ctx,'forms.ncs.field','지원분야')
      +boundField(data,ctx,'forms.ncs.job','직무')
      +boundField(data,ctx,'forms.ncs.nameKo','지원자 성명 · 한글')
      +boundField(data,ctx,'forms.ncs.nameEn','지원자 성명 · 영문')
      +boundField(data,ctx,'forms.ncs.address','주소(현거주지)')
      +boundField(data,ctx,'forms.ncs.phone','전화번호')
      +boundField(data,ctx,'forms.ncs.mobile','휴대전화')
      +boundField(data,ctx,'forms.ncs.email','전자우편','','email')
    +'</div>'
    +resumeGridTable(data,ctx,'학력사항','forms.ncs.education',[['school','학교명'],['major','전공'],['graduation','졸업(연·월)']],3)
    +resumeGridTable(data,ctx,'경력사항','forms.ncs.career',[['company','회사명'],['duty','담당 업무(직무내용)'],['period','근무기간']],3)
    +resumeGridTable(data,ctx,'자격사항 · 수상실적','forms.ncs.certifications',[['number','자격증(수상)번호'],['name','자격(수상)종목'],['date','취득년월']],4)
    +resumeGridTable(data,ctx,'직무관련 교육이수사항','forms.ncs.training',[['name','교육명'],['content','교육내용'],['period','교육기간']],3)
    +resumeGridTable(data,ctx,'대내외활동','forms.ncs.activities',[['group','단체명'],['content','활동내용'],['period','활동기간']],3)
    +'<div class="grid2">'+boundField(data,ctx,'forms.ncs.hobby','취미')+boundField(data,ctx,'forms.ncs.specialty','특기')+'</div>'
  +'</div>';
}
function blindResumeForm(data,ctx){
  return '<div class="listCard"><div class="listHead"><div><span class="rankTag">선택 양식</span><h3>블라인드 채용 입사지원서</h3></div><span class="scoreChip">개인정보 주의</span></div>'
    +'<div class="grid2">'
      +boundSelect(data,ctx,'forms.blind.applicantType','지원구분',['신입','경력'])
      +boundField(data,ctx,'forms.blind.targetJob','지원직무')
      +boundField(data,ctx,'forms.blind.receiptNo','접수번호','기관 입력란이면 비워두기')
      +boundField(data,ctx,'forms.blind.name','성명')
      +boundField(data,ctx,'forms.blind.address','현주소')
      +boundField(data,ctx,'forms.blind.phone','연락처')
      +boundField(data,ctx,'forms.blind.email','전자우편','','email')
      +boundField(data,ctx,'forms.blind.finalSchoolRegion','최종학교 소재지','예시 항목 · 실제 기관 기준 확인')
    +'</div>'
    +'<div class="field"><label>가점항목</label><div class="pillRow">'
      +boundCheck(data,ctx,'forms.blind.bonusDisability','장애대상')
      +boundCheck(data,ctx,'forms.blind.bonusVeteran','보훈대상')
    +'</div></div>'
    +resumeGridTable(data,ctx,'교육사항','forms.blind.training',[['type','교육구분',['학교교육','직업훈련','기타']],['course','과목명 및 교육과정'],['hours','교육시간'],['jobContent','직무관련 주요내용']],3)
    +resumeGridTable(data,ctx,'자격사항','forms.blind.certifications',[['name','자격증명'],['issuer','발급기관'],['date','취득일자']],4)
    +resumeGridTable(data,ctx,'경험 또는 경력사항','forms.blind.experience',[['type','구분',['경험','경력']],['organization','소속조직'],['role','역할'],['period','활동기간'],['activity','활동내용']],4)
    +boundArea(data,ctx,'forms.blind.jobContent','직무관련 주요내용','직무활동, 팀 프로젝트, 연구회, 재능기부 등 지원직무 관련 내용만 작성')
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
  return '<div style="margin-top:16px"><h3 style="margin-bottom:8px">'+title+'</h3><div class="matrixWrap"><table class="matrix"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div></div>';
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
    return '<div class="listCard"><h3>경험기술서</h3>'+assetAutofillControls(data,ctx,'experience',assets)+'<div class="grid2">'
      +boundArea(data,ctx,'optionalDocument.experience.title','경험명','예: 캡스톤디자인 프로젝트')
      +boundArea(data,ctx,'optionalDocument.experience.period','기간','예: 2026.03~2026.06')
      +boundArea(data,ctx,'optionalDocument.experience.organization','기관·수업·팀','')
      +boundArea(data,ctx,'optionalDocument.experience.role','내 역할','')
      +boundArea(data,ctx,'optionalDocument.experience.task','상황·과제','무엇을 해결해야 했는지')
      +boundArea(data,ctx,'optionalDocument.experience.action','내 행동','내가 직접 한 행동')
      +boundArea(data,ctx,'optionalDocument.experience.resultEvidence','결과·Evidence','수치·산출물·피드백·기록 등')
      +boundArea(data,ctx,'optionalDocument.experience.jobLink','지원직무 연결','어떤 JD 요구를 증명하는지')
    +'</div>'+optionalFactCheck(data,'experience')+'</div>';
  }
  if(data.optionalDocument.type==='career'){
    return '<div class="listCard"><h3>경력기술서</h3>'+assetAutofillControls(data,ctx,'career',assets)+'<div class="grid2">'
      +boundArea(data,ctx,'optionalDocument.career.company','회사명','')
      +boundArea(data,ctx,'optionalDocument.career.period','근무기간','')
      +boundArea(data,ctx,'optionalDocument.career.departmentPosition','부서 · 직급 · 역할','')
      +boundArea(data,ctx,'optionalDocument.career.employmentType','고용형태','')
      +boundArea(data,ctx,'optionalDocument.career.duties','담당업무','정기적으로 맡은 업무와 책임')
      +boundArea(data,ctx,'optionalDocument.career.achievements','주요 성과 · Evidence','확인 가능한 수치·산출물·개선결과')
      +boundArea(data,ctx,'optionalDocument.career.tools','사용 Skill · Tool','')
      +boundArea(data,ctx,'optionalDocument.career.jobLink','지원직무 연결','어떤 JD 요구와 연결되는지')
    +'</div>'+optionalFactCheck(data,'career')+'</div>';
  }
  return '<div class="placeholder"><b>선택사항입니다.</b>이력서만 필요한 경우 여기서는 아무것도 작성하지 않아도 됩니다.</div>';
}
function wireResumeFormUi(data,ctx,persist,assets=[],experiences=[]){
  var lab=document.getElementById('resumeTemplateLab');
  if(lab){
    lab.addEventListener('click',function(e){
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
  return '<div class="resumeA4Sheet" style="width:min(210mm,100%);min-height:297mm;margin:0 auto;background:#fff;color:#111;padding:16mm 15mm;box-sizing:border-box;border:1px solid #d8dde6;box-shadow:0 8px 30px rgba(15,23,42,.08);font-family:Arial,\\'Noto Sans KR\\',sans-serif">'
    +'<div style="display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px"><div><div style="font-size:12px;color:#64748b">'+escapeText(title)+'</div><h1 style="font-size:25px;margin:4px 0">'+escapeText(identity.name||'지원자')+'</h1><div style="font-size:13px">'+escapeText(identity.job||posting?.jobTitle||'')+'</div></div><div style="text-align:right;font-size:11px;line-height:1.65">'+identity.contact.map(escapeText).filter(Boolean).join('<br>')+'</div></div>'
    +(data.summary?previewSection('직무 요약','<p style="margin:0;white-space:pre-line">'+escapeText(data.summary)+'</p>'):'')
    +sections
    +(verified.length?previewSection('직무 관련 경험',verified.map(function(x){return '<div style="margin-bottom:8px"><b>'+escapeText(x.assetTitle||x.section||'경험')+'</b><div style="margin-top:3px">• '+escapeText(x.finalBullet||x.aiBullet||x.rawBullet||'')+'</div></div>';}).join('')):'')
    +(data.skills?previewSection('Skill · Tool','<p style="margin:0;white-space:pre-line">'+escapeText(data.skills)+'</p>'):'')
    +(includeOptional?previewOptionalSection(optionalType,optional):'')
    +'<div style="margin-top:18px;padding-top:8px;border-top:1px solid #d9dde4;font-size:9px;color:#64748b">Jobfit Resume Lab · 검증 완료 항목만 출력</div></div>';
}
function previewIdentity(type,form){
  if(type==='ncs')return {name:form.nameKo||form.nameEn||'',job:form.job||form.field||'',contact:[form.mobile||form.phone,form.email,form.address].filter(Boolean)};
  if(type==='blind')return {name:form.name||'',job:form.targetJob||'',contact:[form.phone,form.email,form.address].filter(Boolean)};
  return {name:form.nameKo||form.nameEn||'',job:form.targetJob||'',contact:[form.phone,form.email,form.address].filter(Boolean)};
}
function previewFormSections(type,form){
  if(type==='ncs')return [
    ['학력사항',previewRows(form.education,[['school','학교명'],['major','전공'],['graduation','졸업']])],
    ['경력사항',previewRows(form.career,[['company','회사명'],['duty','담당업무'],['period','기간']])],
    ['자격사항 · 수상실적',previewRows(form.certifications,[['name','자격·수상'],['date','취득년월'],['number','번호']])],
    ['직무관련 교육',previewRows(form.training,[['name','교육명'],['content','교육내용'],['period','기간']])],
    ['대내외활동',previewRows(form.activities,[['group','단체명'],['content','활동내용'],['period','기간']])]
  ].filter(function(x){return x[1];}).map(function(x){return previewSection(x[0],x[1]);}).join('');
  if(type==='blind')return [
    ['교육사항',previewRows(form.training,[['type','구분'],['course','교육과정'],['hours','교육시간'],['jobContent','직무관련 내용']])],
    ['자격사항',previewRows(form.certifications,[['name','자격증명'],['issuer','발급기관'],['date','취득일']])],
    ['경험 또는 경력사항',previewRows(form.experience,[['type','구분'],['organization','소속조직'],['role','역할'],['period','기간'],['activity','활동내용']])],
    ['직무관련 주요내용',form.jobContent?'<p style="margin:0;white-space:pre-line">'+escapeText(form.jobContent)+'</p>':'']
  ].filter(function(x){return x[1];}).map(function(x){return previewSection(x[0],x[1]);}).join('');
  return [
    ['학력',previewRows(form.education,[['period','기간'],['school','학교'],['gpa','학점'],['graduation','졸업여부']])],
    ['경력',previewRows(form.career,[['period','기간'],['company','회사명'],['position','직급·역할'],['employmentType','고용형태']])],
    ['자격증 · 어학능력',previewRows(form.certifications,[['date','날짜'],['name','자격·어학'],['score','점수·급수'],['issuer','발급기관']])],
    ['대외활동',previewRows(form.activities,[['period','기간'],['activity','활동내용'],['organization','기관'],['note','비고']])]
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


const SOURCE_TYPES=['기업 공식 채용공고','기업 공식 직무소개','기업 공식 직무기술서','NCS','고용24 직업정보','공공기관·정부자료','산업협회·전문기관','기타 신뢰자료'];
const REQ_TYPES=['Gate · 필수조건','Preference · 우대조건','Knowledge','Skill','Behavior','Experience','Tool·System','기타'];
const GAP_STATUS=['근거 있음','일부 근거 있음','확인 필요','준비 필요'];
const VERSION='job-analysis-inje-v6';
const JOB_SITES=[
  {group:'민간기업',name:'사람인',url:'https://www.saramin.co.kr/',desc:'민간기업 신입 공고'},
  {group:'민간기업',name:'잡코리아',url:'https://www.jobkorea.co.kr/',desc:'대기업·공채'},
  {group:'민간기업',name:'고용24',url:'https://www.work24.go.kr/',desc:'정부 통합 채용정보'},
  {group:'공공기관',name:'잡알리오',url:'https://job.alio.go.kr/',desc:'국가 공공기관'},
  {group:'공공기관',name:'클린아이 잡플러스',url:'https://job.cleaneye.go.kr/',desc:'지방공공기관'}
];

export async function render(ctx){
  const s=ctx.getState(),explorer=s.artifacts?.jobExplorer||{candidates:[],targets:[]},targets=getTargets(explorer);
  const saved=structuredClone(s.artifacts?.jobDeepDive||{analyses:{},targetAnalyses:{}});
  saved.analyses=saved.analyses||{};saved.targetAnalyses=saved.targetAnalyses||{};
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card jobAnalysisInje">${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 5 · JOB ANALYSIS</div><h2>실제 채용공고로 직무 확인하기</h2><p>STEP 4에서 고른 Target Job을 실제 JD로 확인하고, <b>공고 요구 ↔ STEP 3 Evidence ↔ GAP</b>만 남깁니다.</p></div><span class="badge">직무분석</span></div>
    <div class="progress"><span style="width:36%"></span></div>
    <div class="callout info"><b>STEP 3 경험은 다시 쓰지 않습니다.</b><br>STEP 3의 경험근거는 자동으로 불러오고, 학생은 실제 JD와 GAP만 확인합니다.</div>
    <div id="analysisRoot"></div>
  </section>`;
  if(!targets.length){document.getElementById('analysisRoot').innerHTML='<div class="callout warn"><b>Target Job이 없습니다.</b><br>STEP 4에서 먼저 Target Job을 선택하세요.</div>';return}
  let currentId=targets[0].id;paint();

  function paint(){
    const target=targets.find(x=>x.id===currentId)||targets[0],job=target.job,legacy=saved.analyses?.[job?.id]||{};
    const a=structuredClone(saved.targetAnalyses?.[target.id]||defaultAnalysis(target,legacy));
    const section=document.querySelector('.jobAnalysisInje');if(section)section.dataset.accordionDefault=String(recommendedAccordionIndex(a));
    const box=document.getElementById('analysisRoot');
    box.innerHTML=`
      ${block('01','Target Job','STEP 4에서 선택한 직무를 확인합니다. 새로 고르지 않습니다.',`
        <div class="pillRow">${targets.map((t,i)=>`<button class="btn outline smallBtn targetPick ${t.id===target.id?'activePick':''}" data-id="${esc(t.id,ctx)}">${i+1}. ${esc(t.job?.title||'직무',ctx)} × ${esc(t.industry||'산업 미정',ctx)}</button>`).join('')}</div>
        <div class="callout good" style="margin-top:10px"><b>현재 Target</b><br>${esc(job?.title||'직무',ctx)} × ${esc(target.industry||'산업 미정',ctx)}</div>`)}

      ${block('02','Find JD','먼저 관심 직무의 최근 채용공고를 직접 찾아봅니다. 공고가 없거나 마감되어 있어도 괜찮습니다.',`
        <h4 style="margin:14px 0 8px">① 실제 공고 한번 찾아보기</h4>
        <p class="help">아래 채용사이트를 새 창으로 열어 <b>${esc(job?.title||'관심 직무',ctx)} × ${esc(target.industry||'산업 미정',ctx)}</b> 공고를 찾아보세요.</p>
        <div class="siteSection"><b>민간기업</b><div class="jdSiteGrid">${renderJobSites('민간기업')}</div></div>
        <div class="siteSection"><b>공공기관</b><div class="jdSiteGrid">${renderJobSites('공공기관')}</div></div>

        <div class="aiSearchBox" style="margin-top:16px">
          <h4 style="margin:0 0 8px">② AI에게 현재 공고 찾아달라고 하기</h4>
          <div class="callout info"><b>검색 기능이 있는 AI에서 사용하세요.</b><br>프롬프트를 복사해 붙여넣으면 현재 모집 중인 공고를 우선 찾고, 없으면 최근 6개월 공고까지 확인하도록 합니다. 확인되지 않은 링크는 만들지 않게 설정했습니다.</div>
          <textarea id="jdSearchPrompt" rows="16">${esc(buildSearchPrompt(ctx.getState(),target),ctx)}</textarea>
          <div class="actions"><button class="btn primary" id="copyJdSearchPrompt">AI 공고검색 프롬프트 복사</button></div>
        </div>

        <h4 style="margin:18px 0 8px">③ 찾은 공고 기록 · 최대 3개</h4>
        <p class="help">공고 1·2·3을 각각 따로 입력합니다. 기업명도 공고별로 독립 저장되므로 다른 회사명이 자동으로 고정되지 않습니다.</p>
        ${renderJdRecordEditors(a,ctx)}
        <div id="sourceList" class="sourceSavedSummary"></div>`) }

      ${block('03','Choose JD','분석에 사용할 실제 공고 하나를 선택합니다.',`
        <div class="field"><label>분석할 JD</label><select id="chosenSource"></select></div>
        <div id="chosenPreview" class="callout info" style="margin-top:10px"></div>`)}

      ${block('04','선택 직무 AI 분석','선택한 JD의 직무 자체를 먼저 분석합니다. 아직 학생과 비교하지 않습니다.',`
        <div class="callout info"><b>JD 분석과 GAP 분석을 분리합니다.</b><br>여기서는 선택한 공고에 적힌 업무만 보고 직무를 5개 항목으로 정리합니다. 학생 스펙은 아직 비교하지 않습니다.</div>
        <textarea id="jobAiPrompt" rows="16">${esc(buildJobAnalysisPrompt(ctx.getState(),target,a),ctx)}</textarea>
        <div class="actions"><button class="btn secondary" id="refreshJobAiPrompt">현재 JD 반영</button><button class="btn primary" id="copyJobAiPrompt">직무분석 프롬프트 복사</button></div>
        <div class="field" style="margin-top:12px"><label>AI 직무분석 답변 붙여넣기</label><textarea id="jobAiImport" rows="10" placeholder="[고객·성과기준]&#10;• ...&#10;[주요 과업]&#10;• ...&#10;[주요 해결과제]&#10;• ...&#10;[해결방법]&#10;• ...&#10;[필요역량]&#10;• ..."></textarea></div>
        <div class="actions"><button class="btn secondary" id="applyJobAi">AI 답변을 직무분석표에 반영</button></div>`)}

      ${block('05','직무분석 테이블 완성','AI 답변을 확인하고 핵심 5개 항목만 남깁니다. 경력개발은 선택입니다.',`
        <div class="jobAnalysisFields">
          ${txt('jobCustomerKpi','고객(KPI)',a.jobTable?.customerKpi||'','이 직무의 고객과 성과기준')}
          ${txt('jobTasks','주요 과업',a.jobTable?.tasks||'','신입이 실제로 반복 수행하는 일')}
          ${txt('jobChallenge','주요 해결과제',a.jobTable?.challenge||'','업무에서 해결해야 하는 문제')}
          ${txt('jobMethod','해결방법',a.jobTable?.method||'','방법·절차·도구')}
          ${txt('jobCompetencies','필요역량',a.jobTable?.competencies||'','지식·기술·행동')}
          ${txt('jobCareerPlan','경력개발 · 선택',a.jobTable?.careerPlan||'','신입 초기 → 전문성 확장 방향')}
        </div>`)}

      ${block('06','완성된 직무분석표','GAP 분석 전에 내가 선택한 직무를 한눈에 확인합니다.',`
        <div id="jobAnalysisPreview">${jobTablePreviewHtml(a,ctx)}</div>`)}

      ${block('07','My Spec','GAP 분석 전에 현재 스펙을 직접 확인합니다. 빈칸은 없음이 아니라 미확인입니다.',`
        <div class="callout info"><b>해당 사항이 없으면 ‘없음’이라고 입력하세요.</b><br>자격증·어학·도구/기술을 확인해야 GAP 분석을 시작합니다. STEP 3의 사실확인된 경험은 자동으로 연결됩니다.</div>
        <div class="grid3" style="margin-top:12px">
          ${txt('specCertificates','자격증',a.studentSpec?.certificates||'','예: ADsP / 준비 중 / 없음')}
          ${txt('specLanguage','어학',a.studentSpec?.language||'','예: TOEIC 820 / OPIc IM2 / 없음')}
          ${txt('specTools','도구·기술',a.studentSpec?.tools||'','예: Excel, Python, Figma / 없음')}
        </div>
        <div class="field" style="margin-top:10px"><label>추가 포트폴리오·프로젝트 <span class="muted">(선택)</span></label><textarea id="specPortfolio" placeholder="STEP 3에 없지만 직무와 연결되는 프로젝트·포트폴리오가 있으면 적으세요.">${esc(a.studentSpec?.portfolio||'',ctx)}</textarea></div>
        <div id="specReady" class="callout ${specReady(a)?'good':'warn'}" style="margin-top:10px">${specReady(a)?'<b>GAP 분석 준비 완료</b><br>입력한 스펙과 STEP 3 경험만 사용합니다.':'<b>GAP 분석 전 확인 필요</b><br>자격증·어학·도구/기술을 모두 입력하세요. 해당 사항이 없으면 ‘없음’이라고 적으세요.'}</div>`)}

      ${block('08','GAP Match','JD Requirements × My Spec을 비교해 실제로 보완할 것만 남깁니다.',`
        <div class="callout info"><b>AI 답변은 짧은 개조식으로 받습니다.</b><br>JSON·표·긴 설명 없이 ‘내가 가진 것 / 확인 필요 / 핵심 GAP / 3개월 행동’만 받습니다.</div>
        <textarea id="deepPrompt" rows="16">${esc(buildPrompt(ctx.getState(),target,a),ctx)}</textarea>
        <div class="actions"><button class="btn secondary" id="refreshDeepPrompt">현재 JD·직무분석·내 스펙 반영</button><button class="btn primary" id="copyDeepPrompt" ${specReady(a)&&jobTableReady(a)?'':'disabled'}>AI GAP 분석 프롬프트 복사</button></div>
        <div class="callout info" style="margin-top:12px"><b>AI 답변 붙여넣기</b><br>아래 칸에는 AI가 작성한 짧은 개조식 결과만 붙여넣으세요.</div>
        <textarea id="deepAiImport" rows="10" placeholder="[내가 가진 것]&#10;• ...&#10;[확인 필요]&#10;• ...&#10;[핵심 GAP]&#10;• GAP 1: ...&#10;[3개월 행동]&#10;• ..."></textarea>
        <div class="actions"><button class="btn secondary" id="importDeepAi" ${specReady(a)&&jobTableReady(a)?'':'disabled'}>GAP 결과 반영</button></div>
        <div id="gapSummary" style="margin-top:12px"></div>
        <div class="actions"><button class="btn primary" id="saveDeep">GAP Match 저장</button><button class="btn secondary" id="nextStep">STEP 6 MY JOBFIT REPORT v1 →</button></div>
        <div class="status" id="status"></div>`)}
    `;
    bind(target,a);renderSources(target,a);renderChosen(a);renderGap(a);
  }

  function bind(target,a){
    document.querySelectorAll('.targetPick').forEach(b=>b.addEventListener('click',()=>{currentId=b.dataset.id;paint()}));
    [0,1,2].forEach(i=>document.getElementById(i===0?'addSource':'saveSource'+i)?.addEventListener('click',()=>saveSourceSlot(target,a,i)));
    document.getElementById('copyJdSearchPrompt')?.addEventListener('click',()=>copy(document.getElementById('jdSearchPrompt')?.value||buildSearchPrompt(ctx.getState(),target),ctx));
    document.getElementById('refreshJobAiPrompt')?.addEventListener('click',()=>{captureJobTable(a);persist(target,a);const p=document.getElementById('jobAiPrompt');if(p)p.value=buildJobAnalysisPrompt(ctx.getState(),target,a)});
    document.getElementById('copyJobAiPrompt')?.addEventListener('click',()=>copy(document.getElementById('jobAiPrompt')?.value||buildJobAnalysisPrompt(ctx.getState(),target,a),ctx));
    document.getElementById('applyJobAi')?.addEventListener('click',()=>applyJobAnalysis(target,a));
    ['jobCustomerKpi','jobTasks','jobChallenge','jobMethod','jobCompetencies','jobCareerPlan'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{captureJobTable(a);persist(target,a);renderJobTablePreview(a);refreshGapControls(target,a)}));
    ['specCertificates','specLanguage','specTools','specPortfolio'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{captureSpec(a);persist(target,a);refreshGapControls(target,a)}));
    document.getElementById('chosenSource')?.addEventListener('change',e=>{a.selectedSourceId=e.target.value;const chosen=(a.sources||[]).find(x=>x.id===a.selectedSourceId);if(chosen?.companyName)a.company={name:chosen.companyName,url:chosen.companyUrl||'',source:'기업 공식자료'};persist(target,a);renderChosen(a);const jp=document.getElementById('jobAiPrompt');if(jp)jp.value=buildJobAnalysisPrompt(ctx.getState(),target,a);refreshPrompt(target,a)});
    document.getElementById('refreshDeepPrompt')?.addEventListener('click',()=>refreshPrompt(target,a));
    document.getElementById('copyDeepPrompt')?.addEventListener('click',()=>{captureJobTable(a);captureSpec(a);if(!jobTableReady(a)){ctx.toast('직무분석표의 핵심 5개 항목을 먼저 확인하세요.');return}if(!specReady(a)){ctx.toast("자격증·어학·도구/기술을 먼저 확인하세요. 없으면 ‘없음’이라고 입력하세요.");return}refreshPrompt(target,a);copy(document.getElementById('deepPrompt').value,ctx)});
    document.getElementById('importDeepAi')?.addEventListener('click',()=>importDeepAi(target,a));
    document.getElementById('saveDeep')?.addEventListener('click',()=>{capture(a);captureJobTable(a);captureSpec(a);persist(target,a,true);renderGap(a);ctx.toast('GAP Match를 저장했습니다.')});
    document.getElementById('nextStep')?.addEventListener('click',()=>{capture(a);captureJobTable(a);captureSpec(a);persist(target,a,true);ctx.navigate(5)});
  }

  function saveSourceSlot(target,a,i){
    const s=i===0?'':String(i),name=v('sourceName'+s),url=v('sourceUrl'+s);
    if(!name||!url){ctx.toast('공고 '+(i+1)+'의 공고명과 원문 URL을 입력하세요.');return}
    a.sources=a.sources||[];
    const current=a.sources.find(x=>x&&x.slot===i)||a.sources[i]||null;
    const item={id:current?.id||('src_'+Date.now()+'_'+i),slot:i,companyName:v('companyName'+s),companyUrl:v('companyUrl'+s),type:v('sourceType'+s)||'기업 공식 채용공고',name,url,checkedAt:v('sourceChecked'+s)||today(),note:v('sourceNote'+s)};
    const idx=a.sources.findIndex(x=>x&&x.slot===i);
    if(idx>=0)a.sources[idx]=item;else if(current&&a.sources[i]===current)a.sources[i]=item;else a.sources.push(item);
    a.sources=a.sources.filter(Boolean).slice(0,3).sort((x,y)=>(x.slot??99)-(y.slot??99));
    if(!a.selectedSourceId)a.selectedSourceId=item.id;
    if(a.selectedSourceId===item.id)a.company={name:item.companyName,url:item.companyUrl,source:'기업 공식자료'};
    persist(target,a);paint();ctx.toast('공고 '+(i+1)+'을 저장했습니다.');
  }

  function applyJobAnalysis(target,a){
    const raw=v('jobAiImport');
    if(!raw){ctx.toast('AI 직무분석 답변을 먼저 붙여넣어 주세요.');return}
    const x=parseJobAnalysisBullet(raw);
    if(!x.customerKpi&&!x.tasks&&!x.challenge&&!x.method&&!x.competencies){ctx.toast('직무분석 5개 항목을 읽지 못했습니다. AI 답변의 제목 형식을 확인해 주세요.');return}
    a.jobTable={...(a.jobTable||{}),...x,aiResult:raw};
    persist(target,a);paint();ctx.toast('AI 답변을 직무분석표에 반영했습니다. 5개 항목을 확인하세요.');
  }

  function captureJobTable(a){
    a.jobTable={...(a.jobTable||{}),customerKpi:v('jobCustomerKpi')||a.jobTable?.customerKpi||'',tasks:v('jobTasks')||a.jobTable?.tasks||'',challenge:v('jobChallenge')||a.jobTable?.challenge||'',method:v('jobMethod')||a.jobTable?.method||'',competencies:v('jobCompetencies')||a.jobTable?.competencies||'',careerPlan:v('jobCareerPlan')||a.jobTable?.careerPlan||''};
  }
  function captureSpec(a){
    a.studentSpec={...(a.studentSpec||{}),certificates:v('specCertificates'),language:v('specLanguage'),tools:v('specTools'),portfolio:v('specPortfolio')};
  }
  function renderJobTablePreview(a){
    const box=document.getElementById('jobAnalysisPreview');if(box)box.innerHTML=jobTablePreviewHtml(a,ctx);
  }
  function refreshGapControls(target,a){
    const ready=specReady(a)&&jobTableReady(a);
    const info=document.getElementById('specReady');
    if(info){info.className='callout '+(specReady(a)?'good':'warn');info.innerHTML=specReady(a)?'<b>GAP 분석 준비 완료</b><br>입력한 스펙과 STEP 3 경험만 사용합니다.':'<b>GAP 분석 전 확인 필요</b><br>자격증·어학·도구/기술을 모두 입력하세요. 해당 사항이 없으면 ‘없음’이라고 적으세요.'}
    const copyBtn=document.getElementById('copyDeepPrompt'),importBtn=document.getElementById('importDeepAi');if(copyBtn)copyBtn.disabled=!ready;if(importBtn)importBtn.disabled=!ready;
    const p=document.getElementById('deepPrompt');if(p)p.value=buildPrompt(ctx.getState(),target,a);
  }

  function importDeepAi(target,a){
    captureJobTable(a);captureSpec(a);
    if(!jobTableReady(a)){ctx.toast('직무분석표의 핵심 5개 항목을 먼저 확인하세요.');return}
    if(!specReady(a)){ctx.toast("내 스펙을 먼저 확인하세요. 빈칸은 ‘없음’이 아니라 미확인입니다.");return}
    const raw=v('deepAiImport');if(!raw){ctx.toast('AI GAP 분석 결과를 먼저 붙여넣어 주세요.');return}
    const x=parseGapBullet(raw);
    if(!x.have&&!x.verify&&!x.gaps.length&&!x.actions.length){ctx.toast('개조식 GAP 결과를 읽지 못했습니다. [내가 가진 것] 등 제목 형식을 확인해 주세요.');return}
    a.have=x.have;a.verify=x.verify;a.prepare=x.actions.join(' / ');a.conclusion=x.gaps.length?'핵심 GAP '+x.gaps.length+'개 확인':'추가 확인 필요';
    a.requirements=x.gaps.slice(0,3).map((g,i)=>({id:'gap_ai_'+Date.now()+'_'+i,name:g,type:'기타',status:'준비 필요',evidence:'',gap:g}));
    persist(target,a,true);paint();ctx.toast('GAP 결과를 반영했습니다. 입력한 스펙과 STEP 3 경험 기준으로 확인하세요.');
  }
  function renderSources(target,a){
    const box=document.getElementById('sourceList');if(!box)return;
    if(!a.sources?.length){box.innerHTML='<div class="placeholder"><b>아직 JD가 없습니다.</b>기업 공식 채용공고를 우선 등록하세요.</div>';updateChosenSelect(a);return}
    box.innerHTML=a.sources.map((x,i)=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">JD ${i+1}</span><h3>${esc((x.companyName?x.companyName+' · ':'')+x.name,ctx)}</h3><div class="muted small">${esc(x.type,ctx)} · ${esc(x.checkedAt||'',ctx)}</div></div><button class="btn danger smallBtn" data-delsrc="${x.id}">삭제</button></div><p>${esc(x.note||'핵심내용 미입력',ctx)}</p><a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">원문 열기 ↗</a></div>`).join('');
    box.querySelectorAll('[data-delsrc]').forEach(b=>b.addEventListener('click',()=>{a.sources=a.sources.filter(x=>x.id!==b.dataset.delsrc);if(a.selectedSourceId===b.dataset.delsrc)a.selectedSourceId=a.sources[0]?.id||'';persist(target,a);paint()}));updateChosenSelect(a);
  }
  function updateChosenSelect(a){const el=document.getElementById('chosenSource');if(!el)return;el.innerHTML='<option value="">JD 선택</option>'+((a.sources||[]).map(x=>`<option value="${x.id}" ${a.selectedSourceId===x.id?'selected':''}>${esc((x.companyName?x.companyName+' · ':'')+x.name,ctx)}</option>`).join(''))}
  function renderChosen(a){updateChosenSelect(a);const box=document.getElementById('chosenPreview');if(!box)return;const x=(a.sources||[]).find(s=>s.id===a.selectedSourceId);box.innerHTML=x?`<b>${esc((x.companyName?x.companyName+' · ':'')+x.name,ctx)}</b><br>${esc(x.note||'원문 핵심내용을 확인하세요.',ctx)}`:'분석할 JD를 선택하세요.'}
  function renderGap(a){
    const box=document.getElementById('gapSummary');if(!box)return;
    const gaps=(a.requirements||[]).filter(r=>r.gap||r.status==='준비 필요').slice(0,3).map(r=>r.gap||r.name);
    if(!a.have&&!a.verify&&!gaps.length&&!a.prepare){box.innerHTML='<div class="callout info">My Spec 입력 후 AI GAP 분석을 실행하면 핵심만 여기에 정리됩니다.</div>';return}
    box.innerHTML=`
      <div class="grid2"><div class="miniCard"><b>① 내가 가진 것</b><span>${esc(a.have||'확인된 근거 없음',ctx)}</span></div><div class="miniCard"><b>② 확인 필요</b><span>${esc(a.verify||'없음',ctx)}</span></div></div>
      <div class="miniCard" style="margin-top:12px"><b>③ 핵심 GAP · 최대 3개</b><span>${esc(gaps.length?gaps.map((x,i)=>(i+1)+'. '+x).join(' / '):'확인된 GAP 없음',ctx)}</span></div>
      <div class="miniCard" style="margin-top:12px"><b>④ 3개월 행동</b><span>${esc(a.prepare||'아직 입력되지 않음',ctx)}</span></div>`;
  }
  function capture(a){const selected=(a.sources||[]).find(x=>x?.id===a.selectedSourceId);if(selected)a.company={name:selected.companyName||'',url:selected.companyUrl||'',source:'기업 공식자료'};a.version=VERSION;a.updatedAt=new Date().toISOString();}
  function persist(target,a,sync=false){saved.targetAnalyses[target.id]=a;saved.analyses[target.job.id]={...a,jobTitle:target.job.title,industry:target.industry,targetId:target.id};const patch={jobDeepDive:saved};if(sync)Object.assign(patch,syncDownstream(ctx.getState(),target,a));ctx.saveState({artifacts:patch})}
  function refreshPrompt(target,a){capture(a);persist(target,a);const p=document.getElementById('deepPrompt');if(p)p.value=buildPrompt(ctx.getState(),target,a)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}function set(id,x){const el=document.getElementById(id);if(el)el.value=x}
}

function recommendedAccordionIndex(a){
  const sources=a?.sources||[],jt=a?.jobTable||{},hasJobTable=[jt.customerKpi,jt.tasks,jt.challenge,jt.method,jt.competencies].some(v=>String(v||'').trim());
  if(!sources.length)return 1;
  if(!a.selectedSourceId)return 2;
  if(!jobTableReady(a)&&!hasJobTable)return 3;
  if(!jobTableReady(a))return 4;
  if(!specReady(a))return 6;
  return 7;
}
function syncDownstream(state,target,a){
  const selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId)||(a.sources||[])[0];
  const postingId='jd_step4_'+slug(target.id);
  const requirements=(a.requirements||[]).filter(r=>!String(r.type).startsWith('Gate')).map((r,i)=>({id:'jdreq_'+i+'_'+slug(r.name),text:r.name,type:normalizeReqType(r.type),level:requirementLevel(r),explicitness:'공고에 명시',sourceQuote:'',evidenceQuestion:'STEP 3 Evidence와 연결 확인'}));
  const gates=lines(a.gate).map((x,i)=>({id:'gate_'+i,text:x,type:'기타',status:'확인 필요',sourceQuote:''}));
  const jdOld=structuredClone(state.artifacts?.jdAnalyzer||{postings:[],selectedId:''});
  const posting={id:postingId,company:selected?.companyName||a.company?.name||'기업 미정',jobTitle:target.job?.title||'',rawPosting:selected?.note||'',source:selected?.url||'',postingUrl:selected?.url||'',requirements,gates,gateReviewed:!!a.gate,createdAt:new Date().toISOString()};
  jdOld.postings=[...(jdOld.postings||[]).filter(x=>x.id!==postingId),posting];jdOld.selectedId=postingId;
  const experiences=(state.assessments?.experienceCompetency?.experiences||[]).filter(x=>x?.factChecked);
  const assets=(a.requirements||[]).filter(r=>r.name).map((r,i)=>{const ex=findExperience(r.evidence,experiences),level=evidenceLevel(r.status),req=requirements.find(q=>q.text===r.name);return{id:'asset_step4_'+i+'_'+slug(r.name),postingId,experienceId:ex?.id||'',experienceTitle:ex?.title||'',requirementId:req?.id||'',requirement:r.name,requirementType:r.type,requirementLevel:req?.level||'',evidenceQuestion:'',proof:ex?.action||r.evidence||'',fact:r.evidence||ex?.evidence||'',gap:r.gap||'',jobLink:r.name,evidenceLevel:level,strength:level,useFor:'여러 곳',factCheck:ex?.factChecked?'검증완료':'추가확인 필요',sourceExperienceFactChecked:!!ex?.factChecked,createdAt:new Date().toISOString()}});
  const careerAssets={...(state.artifacts?.careerAssets||{}),assets};
  return {jdAnalyzer:jdOld,careerAssets,industryCompany:syncIndustryCompany(state,target,a)};
}
function getTargets(explorer){const combos=Array.isArray(explorer.targetCombos)&&explorer.targetCombos.length?explorer.targetCombos:(explorer.targets||[]).map((jobId,i)=>({id:'target_'+jobId+'_'+(i+1),jobId,industry:'산업 미정',priority:i+1}));return combos.map(c=>({...c,job:explorer.candidates?.find(x=>x.id===c.jobId)})).filter(x=>x.job)}
function defaultAnalysis(target,legacy={}){return {...legacy,targetId:target.id,jobTitle:target.job?.title||'',industry:target.industry||'',company:legacy.company||{name:'',url:'',source:''},sources:(legacy.sources||[]).slice(0,3).map((x,i)=>({...x,slot:Number.isInteger(x?.slot)?x.slot:i})),selectedSourceId:legacy.selectedSourceId||legacy.sources?.[0]?.id||'',jobTable:{customerKpi:'',tasks:'',challenge:'',method:'',competencies:'',careerPlan:'',aiResult:'',...(legacy.jobTable||{})},studentSpec:{certificates:'',language:'',tools:'',portfolio:'',...(legacy.studentSpec||{})},tasks:legacy.tasks||[],requirements:legacy.requirements||[],purpose:legacy.purpose||'',newHireWork:legacy.newHireWork||'',gate:legacy.gate||'',preference:legacy.preference||'',knowledge:legacy.knowledge||'',skills:legacy.skills||'',behaviors:legacy.behaviors||'',experienceRequired:legacy.experienceRequired||'',signals:legacy.signals||'',unknowns:legacy.unknowns||'',have:legacy.have||'',verify:legacy.verify||'',prepare:legacy.prepare||'',conclusion:legacy.conclusion||''}}
function renderJobSites(group){return JOB_SITES.filter(x=>x.group===group).map(x=>`<a class="jdSiteLink" href="${x.url}" target="_blank" rel="noopener"><b>${x.name}</b><span>${x.desc}</span></a>`).join('')}
function buildSearchPrompt(s,target){
  const major=s.profile?.major||'전공 미입력',job=target.job?.title||'관심 직무',industry=target.industry||'산업 미정';
  return `나는 ${major} 전공 대학생이고, ${industry} 산업의 ${job} 직무를 탐색하고 있어.

확인 기준일: ${today()} (대한민국 표준시, KST)\n웹 검색이 가능하면 반드시 위 기준일을 기준으로 실제 채용공고를 찾아줘.

[검색 순서]
1. 기업 공식 채용페이지의 현재 모집 중인 신입·채용연계형 인턴 공고
2. 사람인·잡코리아·고용24의 현재 공고
3. 공공기관이면 잡알리오·클린아이 잡플러스도 확인
4. 현재 모집 중인 적합 공고가 없다면 최근 6개월 이내의 신입 공고\n\n[모집상태 판정]\n- 모집 중: 확인 기준일이 실제 접수기간 안에 있는 공고\n- 마감: 확인 기준일 전에 접수가 끝난 공고\n- 확인 필요: 접수기간이나 현재 상태를 직접 확인할 수 없는 공고\n- 최근 6개월 참고공고: 현재 모집 중인 적합 공고가 없을 때만 별도로 제시\n\n[중요 규칙]
- 확인되지 않은 공고를 만들어내지 않는다.
- 오래된 공고를 현재 모집 중이라고 표현하지 않는다.
- 공고 원문 URL을 직접 확인할 수 있을 때만 URL을 적는다.
- 출처와 모집상태가 불확실하면 '확인 필요'라고 적는다.
- ${job}와 이름만 비슷하고 실제 업무가 다른 공고는 제외한다.
- 내 전공만으로 적합하다고 판단하지 않는다.
- 표, JSON, 코드블록을 사용하지 않는다.
- 답변 앞에 설명을 붙이지 말고 첫 줄부터 [공고 1]로 시작한다.
- 현재 모집 중인지 직접 확인할 수 없으면 반드시 '확인 필요'라고 적는다.

[출력 형식 · 일반 텍스트 개조식]
[공고 1]
• 기업명:
• 공고명:
• 직무:
• 산업:
• 모집상태: 모집 중 / 마감 / 확인 필요
• 모집기간:
• 원문 URL:
• 담당업무 핵심:
• 필수조건:
• 우대사항:
• ${job} 탐색에 참고할 이유:
• 확인 시점: ${today()}

같은 형식으로 최대 3개만 작성해줘.
현재 확인 가능한 공고가 하나도 없으면 '현재 확인 가능한 공고를 찾지 못함'이라고 명확히 말하고, 최근 공고만 별도로 구분해줘.`}
function buildJobAnalysisPrompt(s,target,a){
  const selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId);
  if(!selected)return '먼저 Choose JD에서 분석할 실제 채용공고를 1개 선택하세요.';
  return `너는 대학생이 실제 채용공고를 바탕으로 직무를 이해하도록 돕는 직무분석가다.

[선택 직무]
기업: ${selected.companyName||a.company?.name||'미정'}
산업: ${target.industry||'미정'}
직무: ${target.job?.title||''}
공고명: ${selected.name||''}
공고 URL: ${selected.url||''}

[공고에 적힌 담당업무·직무소개·지원조건]
${selected.note||'미입력'}

[분석 규칙]
- 이 단계에서는 학생의 스펙·경험과 비교하지 않는다.
- 선택한 JD에 적힌 내용과 일반적인 직무지식을 구분한다.
- 공고에 없는 구체적 수치·자격·업무를 사실처럼 만들지 않는다.
- 신입이 실제로 이해할 수 있는 표현으로 쓴다.
- JSON, 표, 코드블록을 사용하지 않는다.
- 설명을 길게 붙이지 말고 아래 5개 항목 중심으로 개조식으로 답한다.
- 경력개발은 근거가 부족하면 생략하거나 '확인 필요'라고 쓴다.

[출력 형식]
[고객·성과기준]
• 이 직무가 누구를 위해 일하고 무엇으로 성과를 확인하는지 1~2줄

[주요 과업]
• 신입이 실제로 반복 수행하는 일 3~5개

[주요 해결과제]
• 업무에서 해결해야 하는 핵심 문제 2~3개

[해결방법]
• 실제 사용하는 방법·절차·도구를 2~4개

[필요역량]
• 지식·기술·행동을 합쳐 핵심 3~5개

[경력개발]
• 신입 초기 → 숙련 후 확장 방향 1줄`;
}

function jobTablePreviewHtml(a,ctx){
  const jt=a.jobTable||{};
  const cells=[['고객(KPI)',jt.customerKpi],['주요 과업',jt.tasks],['주요 해결과제',jt.challenge],['해결방법',jt.method],['필요역량',jt.competencies]];
  return `<div class="matrixWrap"><table class="matrix"><thead><tr>${cells.map(x=>'<th>'+esc(x[0],ctx)+'</th>').join('')}</tr></thead><tbody><tr>${cells.map(x=>'<td>'+esc(x[1]||'-',ctx)+'</td>').join('')}</tr></tbody></table></div>${jt.careerPlan?'<div class="callout info" style="margin-top:10px"><b>경력개발</b><br>'+esc(jt.careerPlan,ctx)+'</div>':''}`;
}

function cleanBulletBlock(x=''){return String(x||'').split(/\r?\n/).map(v=>v.trim().replace(/^[-*•]\s*/,'' )).filter(Boolean).join(' / ')}
function sectionText(text,heading,next=[]){
  const start=text.indexOf('['+heading+']');if(start<0)return '';
  const bodyStart=start+heading.length+2;let end=text.length;
  for(const h of next){const i=text.indexOf('['+h+']',bodyStart);if(i>=0&&i<end)end=i}
  return text.slice(bodyStart,end).trim();
}
function parseJobAnalysisBullet(raw=''){
  const text=String(raw||'').replace(/```[a-z]*|```/gi,'').trim();
  return {
    customerKpi:cleanBulletBlock(sectionText(text,'고객·성과기준',['주요 과업','주요 해결과제','해결방법','필요역량','경력개발'])),
    tasks:cleanBulletBlock(sectionText(text,'주요 과업',['주요 해결과제','해결방법','필요역량','경력개발'])),
    challenge:cleanBulletBlock(sectionText(text,'주요 해결과제',['해결방법','필요역량','경력개발'])),
    method:cleanBulletBlock(sectionText(text,'해결방법',['필요역량','경력개발'])),
    competencies:cleanBulletBlock(sectionText(text,'필요역량',['경력개발'])),
    careerPlan:cleanBulletBlock(sectionText(text,'경력개발',[]))
  };
}
function jobTableReady(a){const x=a?.jobTable||{};return [x.customerKpi,x.tasks,x.challenge,x.method,x.competencies].every(v=>String(v||'').trim())}
function specReady(a){const x=a?.studentSpec||{};return [x.certificates,x.language,x.tools].every(v=>String(v||'').trim())}

function parseGapBullet(raw=''){
  const text=String(raw||'').replace(/```[a-z]*|```/gi,'').trim();
  const have=cleanBulletBlock(sectionText(text,'내가 가진 것',['확인 필요','핵심 GAP','3개월 행동']));
  const verify=cleanBulletBlock(sectionText(text,'확인 필요',['핵심 GAP','3개월 행동']));
  const gaps=String(sectionText(text,'핵심 GAP',['3개월 행동'])||'').split(/\r?\n/).map(v=>v.trim().replace(/^[-*•]\s*/,'' ).replace(/^GAP\s*\d+\s*:\s*/i,'')).filter(Boolean).slice(0,3);
  const actions=String(sectionText(text,'3개월 행동',[])||'').split(/\r?\n/).map(v=>v.trim().replace(/^[-*•]\s*/,'' )).filter(Boolean).slice(0,3);
  return {have,verify,gaps,actions};
}

function buildPrompt(s,target,a){
  const selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId);
  const jt=a.jobTable||{},spec=a.studentSpec||{};
  const ex=(s.assessments?.experienceCompetency?.experiences||[]).filter(x=>x?.factChecked).slice(0,6).map((x,i)=>`${i+1}. ${x.title||'경험'} | 행동: ${x.action||'미입력'} | 결과: ${x.result||'미입력'} | Evidence: ${x.evidence||'미입력'}`).join('\n');
  if(!selected)return '먼저 Choose JD에서 분석할 실제 채용공고를 1개 선택하세요.';
  if(!jobTableReady(a))return '먼저 직무분석 테이블의 핵심 5개 항목을 완성하세요.';
  if(!specReady(a))return "먼저 My Spec에서 자격증·어학·도구/기술을 확인하세요. 해당 사항이 없으면 ‘없음’이라고 입력하세요. 빈칸 상태에서는 GAP을 분석하지 않습니다.";
  return `너는 대학생의 실제 채용공고 요구조건과 학생이 직접 입력한 스펙·경험을 비교하는 GAP 분석가다.

[선택 JD]
기업: ${selected.companyName||a.company?.name||'미정'}
직무: ${target.job?.title||''}
산업: ${target.industry||'미정'}
공고: ${selected.name||''}
공고 핵심내용: ${selected.note||'미입력'}

[완성된 직무분석]
• 고객·성과기준: ${jt.customerKpi}
• 주요 과업: ${jt.tasks}
• 주요 해결과제: ${jt.challenge}
• 해결방법: ${jt.method}
• 필요역량: ${jt.competencies}
${jt.careerPlan?'• 경력개발: '+jt.careerPlan:''}

[학생이 직접 입력한 My Spec]
• 전공: ${s.profile?.major||'미입력'}
• 자격증: ${spec.certificates}
• 어학: ${spec.language}
• 도구·기술: ${spec.tools}
• 추가 포트폴리오·프로젝트: ${spec.portfolio||'미입력'}

[STEP 3에서 사실확인된 경험]
${ex||'확인된 경험 없음'}

[판정 규칙]
- 학생이 직접 입력한 스펙과 STEP 3에서 사실확인된 경험만 학생 근거로 사용한다.
- 빈칸이나 확인되지 않은 항목을 ‘없음’, ‘준비 필요’, ‘GAP’으로 단정하지 않는다.
- 학생이 ‘없음’이라고 직접 입력한 경우에만 없는 것으로 본다.
- 공고의 필수조건과 우대조건을 구분한다.
- 공고에 없는 조건을 추가하지 않는다.
- 합격 가능성·적합도 점수·확률은 만들지 않는다.
- JSON, 표, 코드블록을 사용하지 않는다.
- 긴 설명 없이 아래 4개 영역만 개조식으로 쓴다.
- 각 영역은 최대 3개까지만 쓴다.

[출력 형식]
[내가 가진 것]
• JD 요구 → 내 실제 근거

[확인 필요]
• 학생 입력만으로 아직 판단할 수 없는 항목

[핵심 GAP]
• GAP 1: 실제로 부족하다고 확인된 것
• GAP 2:
• GAP 3:

[3개월 행동]
• GAP → 3개월 안에 만들 수 있는 구체적 결과물

핵심 GAP이 1~2개뿐이면 억지로 3개를 채우지 마라.
‘확인 필요’와 ‘GAP’을 반드시 구분해라.`;
}
function syncIndustryCompany(state,target,a){const old=structuredClone(state.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''});let ind=(old.industries||[]).find(x=>x.jobId===target.job.id&&x.name===target.industry);if(!ind){ind={id:'ind_'+target.job.id+'_'+slug(target.industry),name:target.industry,jobId:target.job.id,generatedBy:'step4-inje'};old.industries=[...(old.industries||[]),ind]}if(!(old.targetIndustries||[]).includes(ind.id))old.targetIndustries=[...(old.targetIndustries||[]),ind.id];const selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId);const selectedCompany=selected?.companyName||a.company?.name||'';if(selectedCompany){const id='co_'+slug(target.id),company={id,name:selectedCompany,industryId:ind.id,jobId:target.job.id,industry:target.industry,job:target.job.title,source:selected?.name||'',url:selected?.companyUrl||a.company?.url||selected?.url||'',jobUrl:selected?.url||'',hiringEvidence:selected?'JD 확인':'미확인',role:a.purpose||'',targetRef:target.id,generatedBy:'step4-inje'};old.companies=[...(old.companies||[]).filter(x=>x.id!==id),company];if(!(old.targetCompanies||[]).includes(id))old.targetCompanies=[...(old.targetCompanies||[]),id]}return old}
function findExperience(evidence,items){const t=String(evidence||'');return items.find(x=>t.includes(x.title||'')||String(x.action||'').split(/\s+/).filter(w=>w.length>2).some(w=>t.includes(w)))||null}
function evidenceLevel(status){if(status==='근거 있음')return 'A · 직접 증거';if(status==='일부 근거 있음')return 'B · 관련 증거';if(status==='확인 필요')return 'C · 간접 증거';return '없음'}
function requirementLevel(r){return String(r.type).startsWith('Preference')?'우대':['준비 필요','확인 필요'].includes(r.status)?'필수':'업무핵심'}
function normalizeReqType(t=''){if(t.includes('Knowledge'))return 'Knowledge';if(t.includes('Skill'))return 'Skill';if(t.includes('Behavior'))return 'Attitude';if(t.includes('Experience'))return 'Experience';if(t.includes('Tool'))return 'Tool';if(t.includes('Preference'))return 'Preferred';return 'Task'}
function lines(x=''){return String(x).split(/\n|·|;/).map(x=>x.trim()).filter(Boolean)}
function renderJdRecordEditors(a,ctx){
  return '<div class="jdRecordGrid">'+[0,1,2].map(i=>{
    const x=(a.sources||[]).find(v=>v&&v.slot===i)||(a.sources||[])[i]||{},s=i===0?'':String(i),n=i+1;
    const title=x.name?esc((x.companyName?x.companyName+' · ':'')+x.name,ctx):'새 공고 입력';
    return '<div class="jdRecordCard">'+
      '<div class="jdRecordHead"><span class="rankTag">공고 '+n+'</span><b>'+title+'</b></div>'+
      '<div class="grid2">'+txt('companyName'+s,'기업명',x.companyName||'','예: 기업명')+txt('companyUrl'+s,'기업 공식페이지',x.companyUrl||'','https://...')+'</div>'+
      '<div class="grid2" style="margin-top:10px">'+sel('sourceType'+s,'자료 유형',x.type||'',SOURCE_TYPES)+txt('sourceChecked'+s,'확인일',x.checkedAt||today(),'YYYY-MM-DD')+'</div>'+
      '<div class="field" style="margin-top:10px"><label>공고명·직무</label><input class="input" id="sourceName'+s+'" value="'+esc(x.name||'',ctx)+'" placeholder="예: 브랜드/콘텐츠 마케터 신입"></div>'+
      '<div class="field" style="margin-top:10px"><label>공고 원문 URL</label><input class="input" id="sourceUrl'+s+'" value="'+esc(x.url||'',ctx)+'" placeholder="https://..."></div>'+
      '<div class="field" style="margin-top:10px"><label>담당업무·지원조건·우대사항</label><textarea id="sourceNote'+s+'" placeholder="공고 원문에서 핵심 내용을 붙여넣으세요.">'+esc(x.note||'',ctx)+'</textarea></div>'+
      '<div class="actions"><button class="btn primary" id="'+(i===0?'addSource':'saveSource'+s)+'">공고 '+n+' 저장</button></div>'+
    '</div>';
  }).join('')+'</div>';
}
function block(n,title,desc,body){return `<div class="hr"></div><div class="block"><div class="moduleHead"><span>${n}</span><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`}
function parseJsonBlock(raw=''){const text=String(raw).trim(),fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i),source=(fenced?.[1]||text).trim();try{return JSON.parse(source)}catch{}const s=source.indexOf('{'),e=source.lastIndexOf('}');if(s>=0&&e>s){try{return JSON.parse(source.slice(s,e+1))}catch{}}return null}
function stateClass(x=''){return x==='근거 있음'?'good':x==='일부 근거 있음'?'partial':x==='준비 필요'?'prepare':'verify'}
function slug(x=''){return String(x||'').trim().replace(/[^0-9A-Za-z가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'item'}
function today(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value||'';return [g('year'),g('month'),g('day')].join('-')}function esc(x,ctx){return ctx.escapeHtml(String(x??''))}
async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}
function styleBlock(){return `<style>.jobAnalysisInje .siteSection{margin-top:14px}.jobAnalysisInje .jdSiteGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px}.jobAnalysisInje .jdSiteLink{display:flex;flex-direction:column;gap:3px;padding:13px 14px;border:1px solid #dfe5f2;border-radius:14px;background:#fff;text-decoration:none;color:#1d2939}.jobAnalysisInje .jdSiteLink:hover{border-color:#8fa5ff;background:#f7f8ff}.jobAnalysisInje .jdSiteLink span{font-size:11px;color:#667085}.jobAnalysisInje .aiSearchBox{border:1px solid #dfe5f2;border-radius:16px;padding:14px;background:#fbfcff}.jobAnalysisInje .jdRecordGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}.jobAnalysisInje .jdRecordCard{border:1px solid #dfe5f2;border-radius:16px;padding:14px;background:#fff}.jobAnalysisInje .jdRecordHead{display:flex;align-items:center;gap:8px;margin-bottom:12px}.jobAnalysisInje .sourceSavedSummary{margin-top:12px}@media(max-width:980px){.jobAnalysisInje .jdRecordGrid{grid-template-columns:1fr}}@media(max-width:700px){.jobAnalysisInje .jdSiteGrid{grid-template-columns:1fr 1fr}}@media(max-width:460px){.jobAnalysisInje .jdSiteGrid{grid-template-columns:1fr}}.jobAnalysisInje .moduleHead{display:flex;gap:11px;align-items:flex-start}.jobAnalysisInje .moduleHead>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#eef3ff;color:#3152c9;font-weight:950;flex:0 0 auto}.jobAnalysisInje .moduleHead h3{margin:2px 0 3px}.jobAnalysisInje .moduleHead p{margin:0;color:#667085;font-size:12px;line-height:1.5}.activePick{background:#eef3ff!important;color:#3152c9!important}.stateTag{display:inline-flex;padding:5px 8px;border-radius:999px;font-weight:900;font-size:11px}.state-good{background:#ecfdf7;color:#087a63}.state-partial{background:#eef3ff;color:#3152c9}.state-prepare{background:#fff8e6;color:#9a6700}.state-verify{background:#f2f4f7;color:#667085}</style>`}

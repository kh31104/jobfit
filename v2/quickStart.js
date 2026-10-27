// Jobfit '새로 시작' (Quick Start)
// STEP 1~6 자료가 이 브라우저에 없는 학생이 STEP 7·8부터 기본 정보만 입력해 진행하도록 돕는다.
// 원칙
// - 기존 저장 데이터는 지우거나 이름을 바꾸지 않는다. 새 항목만 추가한다.
// - 새로 만든 항목에는 origin 표시를 남겨 수업·연구 자료에서 구분할 수 있게 한다.
// - STEP 7 목표는 artifacts.quickStart.step7 에 따로 저장해 STEP 4 자료와 완료 표시를 건드리지 않고,
//   학생이 언제든 STEP 4 목표로 되돌릴 수 있게 한다.
// - 네트워크 호출 없음.

const CODE_RE=/^JF26-[A-Z2-9]{6}$/;
export const QS_STEP7='quick-start-step7';
export const QS_STEP8='quick-start-step8';
const LEVELS=[
  ['근거 있음','A · 직접 증거'],
  ['일부 근거 있음','B · 관련 증거'],
  ['확인 필요','C · 간접 증거'],
  ['근거 없음','없음']
];

function clone(x){return x?structuredClone(x):x}
function nowIso(){return new Date().toISOString()}
function uid(prefix){return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`}
function slug(x=''){return String(x||'').trim().replace(/[^0-9A-Za-z가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'item'}
function splitList(v,max){return [...new Set(String(v||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean))].slice(0,max)}
function lines(v,max){return [...new Set(String(v||'').split(/\n+/).map(x=>x.replace(/^\s*(?:[-•·*]|\d+[.)])\s*/,'').trim()).filter(Boolean))].slice(0,max)}
function escFor(ctx){return v=>ctx.escapeHtml(String(v??''))}

// ---------- 공통 조회 ----------
export function quickStartData(s){return s?.artifacts?.quickStart||{}}
export function explorerTargetJobs(s){const e=s?.artifacts?.jobExplorer||{};return (e.targets||[]).map(id=>e.candidates?.find(x=>x.id===id)).filter(Boolean)}
function explorerCombos(s){const e=s?.artifacts?.jobExplorer||{};return (e.targetCombos||[]).length?e.targetCombos:(e.targets||[]).map((jobId,i)=>({id:'target_'+jobId+'_'+(i+1),jobId,industry:'산업 미정'}))}
export function step7QuickStart(s){const q=quickStartData(s).step7;return q&&q.job?.id&&q.job?.title?q:null}
export function quickStartActive(s){return !!step7QuickStart(s)?.active}
// STEP 7 이후에서 사용할 현재 목표 직무: 새로 시작이 켜져 있으면 그 직무, 아니면 STEP 4 목표
export function activeTargetJobs(s){const q=step7QuickStart(s);return q?.active?[q.job]:explorerTargetJobs(s)}
export function activeTargetCombos(s){
  const q=step7QuickStart(s);
  if(q?.active){const inds=(q.industries||[]).length?q.industries:['산업 미정'];return inds.map((industry,i)=>({id:`target_${q.job.id}_${slug(industry)}_${i+1}`,jobId:q.job.id,industry,priority:i+1,origin:QS_STEP7}))}
  return explorerCombos(s);
}

const PANEL_STYLE=`<style>
.qsPanel{margin:14px 0}
.qsPanel summary{cursor:pointer;font-weight:700;padding:10px 0;list-style-position:inside}
.qsPanel .qsBody{margin-top:10px}
.qsPanel .qsLead{margin:6px 0 10px}
.qsPanel .qsReq{font-size:.78em;font-weight:700;color:#c2410c;margin-left:4px}
.qsPanel .qsHint{display:block;font-size:.85em;opacity:.8;margin-top:4px}
.qsPanel .qsSub{margin:16px 0 6px;font-size:1em}
.qsPanel .qsSwitch{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.qsPanel .qsExp{border:1px solid rgba(127,127,127,.25);border-radius:12px;padding:10px 12px;margin-top:10px}
.qsPanel .qsMapRow{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.8fr);gap:8px;align-items:center;padding:8px 0;border-top:1px solid rgba(127,127,127,.2)}
.qsPanel .qsMapRow select{width:100%}
.qsPanel .qsCheck{display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:.92em}
@media(max-width:760px){.qsPanel .qsMapRow{grid-template-columns:minmax(0,1fr)}.qsPanel .grid2,.qsPanel .grid3{grid-template-columns:minmax(0,1fr)}}
</style>`;

// ---------- STEP 7: 목표 직무·관심 산업 ----------
function _renderStep7QuickStart(s,ctx){
  const esc=escFor(ctx),q=step7QuickStart(s),explorer=explorerTargetJobs(s),active=activeTargetJobs(s);
  const hasCode=!!String(s.profile?.anonCode||'').trim();
  const form=`<div class="grid2">
      ${hasCode?'':`<div class="field"><label>기존 익명코드 (있으면 입력)</label><input class="input" id="qs7Code" placeholder="예: JF26-ABC234" autocomplete="off"><span class="qsHint">없으면 비워 두세요. 저장할 때 새 익명코드가 발급됩니다.</span></div>`}
      <div class="field"><label>전공</label><input class="input" id="qs7Major" value="${esc(s.profile?.major||'')}" placeholder="예: 경영학과"></div>
      <div class="field"><label>목표 직무<span class="qsReq">필수</span></label><input class="input" id="qs7Job" value="${esc(q?.job?.title||'')}" placeholder="예: 마케팅 기획, 품질관리, 병원 행정"></div>
      <div class="field"><label>관심 산업<span class="qsReq">필수</span></label><input class="input" id="qs7Industry" value="${esc((q?.industries||[]).join(', '))}" placeholder="예: 뷰티·소비재, 식품"><span class="qsHint">최대 3개까지, 쉼표로 구분합니다.</span></div>
    </div>
    <div class="actions"><button type="button" class="btn primary" id="qs7Save">${q?'새로 시작 목표 저장':'새로 시작하고 STEP 7 진행'}</button></div><div class="status" id="qs7Status"></div>`;

  if(!active.length){
    return `<div class="callout warn qsPanel" id="qsStep7">${PANEL_STYLE}
      <b>앞 단계(STEP 1~6) 자료가 이 브라우저에 없나요?</b>
      <p class="qsLead">내 학습 백업 파일이 있다면 먼저 불러오세요. 백업이 없어도 아래 기본 정보만 입력하면 STEP 7부터 바로 시작할 수 있습니다.</p>
      <div class="actions"><button type="button" class="btn outline smallBtn" id="qs7Import">내 학습 백업 불러오기</button></div>
      <div class="qsBody">${form}</div>
    </div>`;
  }
  let switcher='';
  if(q&&explorer.length){
    switcher=q.active
      ?`<div class="qsSwitch"><span>지금은 <b>새로 시작한 목표(${esc(q.job.title)})</b>로 진행 중입니다.</span><button type="button" class="btn outline smallBtn" data-qs7-use="explorer">STEP 4 목표로 돌아가기</button></div>`
      :`<div class="qsSwitch"><span>새로 시작한 목표(${esc(q.job.title)})가 저장되어 있습니다.</span><button type="button" class="btn outline smallBtn" data-qs7-use="quick">새로 시작한 목표로 전환</button></div>`;
  }
  const summary=q?.active?`새로 시작한 목표: ${esc(q.job.title)} × ${esc((q.industries||[]).join(', ')||'산업 미정')} <span class="muted">(수정하기)</span>`:'목표 직무를 새로 정해서 시작하기 <span class="muted">(선택)</span>';
  const note=explorer.length?'<p class="qsLead">STEP 4~6 자료는 지워지지 않습니다. 현재 목표만 새로 입력한 직무로 바뀌고, 언제든 STEP 4 목표로 돌아갈 수 있습니다.</p>':'';
  // 전환 버튼은 접힌 칸 밖에 두어 바로 보이게 한다.
  return `<div class="qsPanel" id="qsStep7">${PANEL_STYLE}${switcher}<details class="qsDetails"><summary>${summary}</summary><div class="qsBody">${note}${form}</div></details></div>`;
}

function _wireStep7QuickStart(ctx,{onDone}={}){
  const root=document.getElementById('qsStep7');if(!root)return;
  const val=id=>root.querySelector('#'+id)?.value?.trim()||'';
  const status=t=>{const el=root.querySelector('#qs7Status');if(el)el.textContent=t;ctx.toast(t)};
  root.querySelector('#qs7Import')?.addEventListener('click',()=>document.getElementById('importBtn')?.click());
  root.querySelectorAll('[data-qs7-use]').forEach(b=>b.addEventListener('click',()=>{
    const qs=clone(quickStartData(ctx.getState()));if(!qs.step7)return;
    qs.step7.active=b.dataset.qs7Use==='quick';qs.step7.updatedAt=nowIso();
    ctx.saveState({artifacts:{quickStart:qs}});
    ctx.toast(qs.step7.active?'새로 시작한 목표로 전환했습니다.':'STEP 4 목표로 돌아갔습니다.');
    onDone?.();
  }));
  root.querySelector('#qs7Save')?.addEventListener('click',()=>{
    const title=val('qs7Job'),industries=splitList(val('qs7Industry'),3),major=val('qs7Major'),codeInput=val('qs7Code').toUpperCase();
    if(!title){status('목표 직무를 입력하세요.');root.querySelector('#qs7Job')?.focus();return}
    if(!industries.length){status('관심 산업을 1개 이상 입력하세요.');root.querySelector('#qs7Industry')?.focus();return}
    if(codeInput&&!CODE_RE.test(codeInput)){status('익명코드 형식을 확인하세요. 예: JF26-ABC234');root.querySelector('#qs7Code')?.focus();return}
    let issued='';
    if(!String(ctx.getState().profile?.anonCode||'').trim()){
      if(codeInput)ctx.saveState({profile:{anonCode:codeInput},meta:{anonCodeLocked:true,anonCodeRestoredAt:nowIso()}});
      else issued=ctx.makeAnonCode();
    }
    const qs=clone(quickStartData(ctx.getState())),prev=qs.step7;
    qs.step7={...(prev||{}),active:true,job:{id:prev?.job?.id||uid('qs_job'),title,origin:QS_STEP7},industries,version:1,createdAt:prev?.createdAt||nowIso(),updatedAt:nowIso()};
    qs.log=[...(qs.log||[]),{step:7,at:nowIso()}].slice(-20);
    const patch={artifacts:{quickStart:qs}};if(major)patch.profile={major};
    ctx.saveState(patch);
    status(issued?`새 익명코드 ${issued}가 발급되었습니다. 꼭 메모해 두세요.`:`새로 시작 목표를 저장했습니다: ${title}`);
    onDone?.();
  });
}

// ---------- STEP 8: 지원 공고 요구사항 + 내 경험 → 근거 카드 ----------
function step7Companies(s){
  const ic=s?.artifacts?.industryCompany||{},list=(ic.companies||[]).filter(c=>c&&c.name&&c.generatedBy!=='step4-inje'),ids=new Set(ic.targetCompanies||[]);
  const picked=list.filter(c=>ids.has(c.id));return picked.length?picked:list;
}
function companyDigest(c){
  return [c.business&&`사업·고객: ${c.business}`,c.direction&&`사업 방향: ${c.direction}`,c.role&&`직무 연결: ${c.role}`,c.signals&&`채용 신호: ${c.signals}`].filter(Boolean).join('\n');
}
function existingExperiences(s){return (s?.assessments?.experienceCompetency?.experiences||[]).filter(x=>x&&x.title)}

function _renderStep8QuickStart(s,ctx,{hasAssets=false}={}){
  const esc=escFor(ctx),companies=step7Companies(s),jobs=activeTargetJobs(s),existing=existingExperiences(s);
  const jd=s.artifacts?.jdAnalyzer||{postings:[]},postings=jd.postings||[];
  const first=companies[0],defaultJob=first?.job||jobs[0]?.title||'';
  const companySelect=companies.length?`<div class="field"><label>STEP 7에서 고른 기업 불러오기</label><select id="qs8Company"><option value="">직접 입력</option>${companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}${c.job?` · ${esc(c.job)}`:''}</option>`).join('')}</select><span class="qsHint">고르면 기업명·직무·공고 URL·기업분석 요약이 자동으로 채워집니다.</span></div>`:'';
  const expRow=i=>`<div class="qsExp"><b>경험 ${i}${i===1?'<span class="qsReq">필수</span>':' <span class="muted">(선택)</span>'}</b>
      <div class="grid3" style="margin-top:8px">
        <div class="field"><label>경험명</label><input class="input" id="qs8ExpTitle${i}" placeholder="예: 카페 아르바이트, 팀 프로젝트"></div>
        <div class="field"><label>내가 직접 한 행동</label><textarea id="qs8ExpAction${i}" placeholder="역할명이 아니라 내가 한 일"></textarea></div>
        <div class="field"><label>결과·근거</label><textarea id="qs8ExpResult${i}" placeholder="수치, 산출물, 받은 피드백 등 확인 가능한 것"></textarea></div>
      </div>
      <label class="qsCheck"><input type="checkbox" id="qs8ExpFact${i}"><span>실제로 내가 한 일이 맞고, 없는 수치·성과를 쓰지 않았습니다.</span></label>
    </div>`;
  const postingSwitch=postings.length>1?`<div class="qsSwitch"><label for="qs8Posting"><b>현재 기준 공고</b></label><select id="qs8Posting">${postings.map(p=>`<option value="${esc(p.id)}" ${p.id===jd.selectedId?'selected':''}>${esc(p.company||'기업 미정')} · ${esc(p.jobTitle||'직무 미정')}${p.origin===QS_STEP8?' (새로 시작)':''}</option>`).join('')}</select></div>`:'';
  const body=`<div class="qsBody">
      <h4 class="qsSub">① 지원할 공고</h4>
      ${companySelect}
      <div class="grid2">
        <div class="field"><label>기업명<span class="qsReq">필수</span></label><input class="input" id="qs8CompanyName" value="${esc(companies.length===1?first.name:'')}" placeholder="예: OO식품"></div>
        <div class="field"><label>지원 직무<span class="qsReq">필수</span></label><input class="input" id="qs8JobTitle" value="${esc(companies.length===1?defaultJob:(jobs[0]?.title||''))}" placeholder="예: 마케팅 기획"></div>
        <div class="field"><label>채용공고·직무소개 URL <span class="muted">(선택)</span></label><input class="input" id="qs8Url" value="${esc(companies.length===1?(first.jobUrl||''):'')}" placeholder="https://..."></div>
      </div>
      <div class="field" style="margin-top:10px"><label>공고 내용 붙여넣기 <span class="muted">(선택)</span></label><textarea id="qs8Raw" rows="5" placeholder="채용공고의 담당업무·자격요건·우대사항을 붙여넣으세요.">${esc(companies.length===1?companyDigest(first):'')}</textarea></div>
      <div class="actions"><button type="button" class="btn secondary smallBtn" id="qs8CopyPrompt">요구사항 뽑기 AI 프롬프트 복사</button></div>
      <div class="field" style="margin-top:10px"><label>공고 핵심 요구사항<span class="qsReq">필수</span></label><textarea id="qs8Reqs" rows="5" placeholder="한 줄에 하나씩 2~5개&#10;예: 고객 데이터 분석 능력&#10;예: 협업·커뮤니케이션">${esc(companies.length===1?lines(first.signals,5).join('\n'):'')}</textarea><span class="qsHint">공고에 실제로 적힌 요구사항만 씁니다. AI가 뽑아준 결과도 공고 원문과 대조한 뒤 넣으세요.</span></div>

      <h4 class="qsSub">② 내 경험 (1~3개)</h4>
      ${existing.length?`<p class="qsHint">STEP 3에서 저장한 경험 ${existing.length}개도 아래 연결표에서 함께 고를 수 있습니다.</p>`:''}
      ${expRow(1)}
      <details class="qsMore"><summary>경험 더 추가하기 <span class="muted">(선택, 최대 2개)</span></summary>${expRow(2)}${expRow(3)}</details>

      <h4 class="qsSub">③ 요구사항 × 내 경험 연결</h4>
      <p class="qsHint">요구사항마다 그것을 증명할 경험과 근거 수준을 고르세요. 증명할 경험이 없으면 '근거 없음'으로 두면 보완할 점(GAP)으로 남습니다.</p>
      <div class="actions"><button type="button" class="btn secondary smallBtn" id="qs8BuildMap">연결표 만들기</button></div>
      <div id="qs8Map"></div>
      <div class="actions"><button type="button" class="btn primary" id="qs8Save">근거 카드 만들고 이력서 시작</button></div><div class="status" id="qs8Status"></div>
    </div>`;
  if(!hasAssets){
    return `<div class="callout warn qsPanel" id="qsStep8">${PANEL_STYLE}
      ${postingSwitch}
      <b>근거 카드(Career Asset)가 없어서 이력서 문장을 추가할 수 없나요?</b>
      <p class="qsLead">STEP 5 GAP Match를 하지 못했거나 자료가 사라졌다면, 지원할 공고의 요구사항과 내 경험만 입력해 근거 카드를 바로 만드세요. 만든 카드는 STEP 9 자소서와 STEP 10 면접에서도 그대로 쓰입니다.</p>
      ${body}
    </div>`;
  }
  // 기준 공고 전환은 접힌 칸 밖에 두어 바로 보이게 한다.
  return `<div class="qsPanel" id="qsStep8">${PANEL_STYLE}${postingSwitch}<details class="qsDetails"><summary>다른 공고로 새로 시작하기 <span class="muted">(선택)</span></summary><p class="qsLead">기존 근거 카드와 이력서 문장은 지워지지 않습니다. 새 공고가 현재 기준 공고가 되고, 이 칸 위의 '현재 기준 공고'에서 언제든 되돌릴 수 있습니다.</p>${body}</details></div>`;
}

function _wireStep8QuickStart(ctx,{onDone}={}){
  const root=document.getElementById('qsStep8');if(!root)return;
  const esc=escFor(ctx),val=id=>root.querySelector('#'+id)?.value?.trim()||'',set=(id,v)=>{const el=root.querySelector('#'+id);if(el)el.value=v};
  const status=t=>{const el=root.querySelector('#qs8Status');if(el)el.textContent=t;ctx.toast(t)};
  const s0=ctx.getState(),companies=step7Companies(s0),existing=existingExperiences(s0);

  root.querySelector('#qs8Posting')?.addEventListener('change',e=>{
    const jd=clone(ctx.getState().artifacts?.jdAnalyzer||{postings:[]});if(!(jd.postings||[]).some(p=>p.id===e.target.value))return;
    jd.selectedId=e.target.value;ctx.saveState({artifacts:{jdAnalyzer:jd}});ctx.toast('현재 기준 공고를 바꿨습니다.');onDone?.();
  });
  root.querySelector('#qs8Company')?.addEventListener('change',e=>{
    const c=companies.find(x=>x.id===e.target.value);if(!c)return;
    set('qs8CompanyName',c.name||'');set('qs8JobTitle',c.job||activeTargetJobs(ctx.getState())[0]?.title||'');set('qs8Url',c.jobUrl||'');
    if(!val('qs8Raw'))set('qs8Raw',companyDigest(c));
    if(!val('qs8Reqs'))set('qs8Reqs',lines(c.signals,5).join('\n'));
  });
  root.querySelector('#qs8CopyPrompt')?.addEventListener('click',async()=>{
    const prompt=`아래 채용공고(또는 직무소개)에서 지원자에게 요구하는 핵심 요구사항을 3~5개만 뽑아줘.

[기업·직무]
${val('qs8CompanyName')||'기업 미입력'} / ${val('qs8JobTitle')||'직무 미입력'}

[공고 내용]
${val('qs8Raw')||'(공고 내용을 여기에 붙여넣으세요)'}

[규칙]
- 공고에 실제로 적힌 내용만 쓴다. 없는 요구사항을 만들지 않는다.
- 학력·전공·자격증처럼 지원자격(통과 조건)은 따로 표시하고 요구사항 목록에서는 뺀다.
- 한 줄에 하나씩, 짧은 명사구로만 쓴다. 번호·설명·코드블록 없이 쓴다.`;
    try{await navigator.clipboard.writeText(prompt);ctx.toast('요구사항 뽑기 프롬프트를 복사했습니다.')}
    catch{const ta=document.createElement('textarea');ta.value=prompt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ctx.toast('요구사항 뽑기 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다. 직접 선택해 복사하세요.')}ta.remove()}
  });

  const draftExperiences=()=>[1,2,3].map(i=>({key:`new${i}`,title:val(`qs8ExpTitle${i}`),action:val(`qs8ExpAction${i}`),result:val(`qs8ExpResult${i}`),factChecked:!!root.querySelector(`#qs8ExpFact${i}`)?.checked})).filter(x=>x.title);
  const expOptions=()=>[
    ...draftExperiences().map(x=>({value:x.key,label:x.title})),
    ...existing.map(x=>({value:`old:${x.id}`,label:`[STEP 3] ${x.title}`}))
  ];
  const buildMap=()=>{
    const reqs=lines(val('qs8Reqs'),5),box=root.querySelector('#qs8Map');if(!box)return false;
    if(!reqs.length){status('공고 핵심 요구사항을 한 줄에 하나씩 입력하세요.');return false}
    const opts=expOptions();
    if(!opts.length){status('경험을 1개 이상 입력하세요.');return false}
    const prev={};box.querySelectorAll('[data-qs8-req]').forEach(row=>{prev[row.dataset.qs8Req]={exp:row.querySelector('[data-qs8-exp]')?.value||'',level:row.querySelector('[data-qs8-level]')?.value||''}});
    box.innerHTML=reqs.map((r,i)=>{const p=prev[r]||{};return `<div class="qsMapRow" data-qs8-req="${esc(r)}">
        <div><b>요구사항 ${i+1}</b><br>${esc(r)}</div>
        <select data-qs8-exp aria-label="요구사항 ${i+1}을 증명할 경험"><option value="">증명할 경험 없음</option>${opts.map(o=>`<option value="${esc(o.value)}" ${o.value===p.exp?'selected':''}>${esc(o.label)}</option>`).join('')}</select>
        <select data-qs8-level aria-label="요구사항 ${i+1} 근거 수준">${LEVELS.map(([label])=>`<option ${label===(p.level||'근거 없음')?'selected':''}>${label}</option>`).join('')}</select>
      </div>`}).join('');
    box.querySelectorAll('.qsMapRow').forEach(row=>{
      const exp=row.querySelector('[data-qs8-exp]'),level=row.querySelector('[data-qs8-level]');
      exp.addEventListener('change',()=>{if(exp.value&&level.value==='근거 없음')level.value='확인 필요';if(!exp.value)level.value='근거 없음'});
    });
    return true;
  };
  root.querySelector('#qs8BuildMap')?.addEventListener('click',()=>{if(buildMap())status('연결표를 만들었습니다. 요구사항마다 경험과 근거 수준을 고르세요.')});

  root.querySelector('#qs8Save')?.addEventListener('click',()=>{
    const company=val('qs8CompanyName'),jobTitle=val('qs8JobTitle'),url=val('qs8Url'),raw=val('qs8Raw'),reqs=lines(val('qs8Reqs'),5),drafts=draftExperiences();
    if(!company){status('기업명을 입력하세요.');return}
    if(!jobTitle){status('지원 직무를 입력하세요.');return}
    if(!reqs.length){status('공고 핵심 요구사항을 한 줄에 하나씩 입력하세요.');return}
    const incomplete=drafts.find(x=>!x.action);if(incomplete){status(`'${incomplete.title}' 경험에 내가 직접 한 행동을 적어 주세요.`);return}
    if(!drafts.length&&!existing.length){status('경험을 1개 이상 입력하세요.');return}
    const rows=[...root.querySelectorAll('#qs8Map [data-qs8-req]')];
    const sameReqs=rows.length===reqs.length&&rows.every((r,i)=>r.dataset.qs8Req===reqs[i]);
    if(!sameReqs){buildMap();status('연결표를 새 요구사항에 맞게 다시 만들었습니다. 경험과 근거 수준을 고른 뒤 다시 저장하세요.');return}
    const mapping=rows.map(r=>({req:r.dataset.qs8Req,exp:r.querySelector('[data-qs8-exp]')?.value||'',level:r.querySelector('[data-qs8-level]')?.value||'근거 없음'}));
    if(!mapping.some(m=>m.exp&&m.level!=='근거 없음')){status("요구사항 1개 이상을 내 경험과 연결하세요. 근거 수준이 '근거 없음'이면 이력서에 쓸 수 없습니다.");return}

    const s=clone(ctx.getState()),ts=Date.now().toString(36),at=nowIso(),postingId=`jd_qs_${ts}`;
    const newExps=drafts.map((d,i)=>({key:d.key,item:{id:`exp_qs_${ts}_${i+1}`,title:d.title,category:'',roleTitle:'',situation:'',challenge:'',reason:'',method:'',resultReason:'',action:d.action,actionVerbs:'',result:d.result,evidence:d.result,evidenceGrade:'',competencies:[],competencyEvidence:[],learning:'',factChecked:d.factChecked,quality:{},origin:QS_STEP8,createdAt:at,updatedAt:at}}));
    const findExp=v=>v.startsWith('old:')?existing.find(x=>x.id===v.slice(4)):newExps.find(x=>x.key===v)?.item;
    const requirements=reqs.map((text,i)=>({id:`jdreq_qs_${ts}_${i}`,text,type:'기타',level:'업무핵심',explicitness:'공고에 명시',sourceQuote:'',evidenceQuestion:'내 경험과 연결 확인',origin:QS_STEP8}));
    const posting={id:postingId,company,jobTitle,rawPosting:raw,source:url,postingUrl:url,requirements,gates:[],gateReviewed:false,origin:QS_STEP8,createdAt:at};
    const assets=mapping.map((m,i)=>{
      const ex=m.exp?findExp(m.exp):null,req=requirements[i],level=(LEVELS.find(([label])=>label===m.level)||LEVELS[3])[1];
      return {id:`asset_qs_${ts}_${i}`,postingId,experienceId:ex?.id||'',experienceTitle:ex?.title||'',requirementId:req.id,requirement:req.text,requirementType:req.type,requirementLevel:req.level,evidenceQuestion:'',proof:ex?.action||'',fact:ex?.result||ex?.evidence||'',gap:level==='없음'?'보완 필요':'',jobLink:req.text,evidenceLevel:level,strength:level,useFor:'여러 곳',factCheck:ex?.factChecked?'검증완료':'추가확인 필요',sourceExperienceFactChecked:!!ex?.factChecked,origin:QS_STEP8,createdAt:at};
    });
    const exc=s.assessments?.experienceCompetency||{},jd=s.artifacts?.jdAnalyzer||{},ca=s.artifacts?.careerAssets||{},qs=s.artifacts?.quickStart||{};
    qs.step8={active:true,postingId,company,jobTitle,experienceIds:newExps.map(x=>x.item.id),assetIds:assets.map(a=>a.id),version:1,createdAt:at};
    qs.log=[...(qs.log||[]),{step:8,at,postingId}].slice(-20);
    ctx.saveState({
      assessments:{experienceCompetency:{...exc,experiences:[...(exc.experiences||[]),...newExps.map(x=>x.item)]}},
      artifacts:{
        jdAnalyzer:{...jd,postings:[...(jd.postings||[]),posting],selectedId:postingId},
        careerAssets:{...ca,assets:[...(ca.assets||[]),...assets]},
        quickStart:qs
      }
    });
    const usable=assets.filter(a=>a.evidenceLevel!=='없음').length,unverified=assets.filter(a=>a.evidenceLevel!=='없음'&&a.factCheck!=='검증완료').length;
    status(`근거 카드 ${usable}개를 만들었습니다.${unverified?` 그중 ${unverified}개는 사실 확인 전이라 초안용입니다.`:''}`);
    onDone?.();
  });
}

// 새로 시작 화면에 문제가 생겨도 STEP 7·8 본 화면은 그대로 열리도록 감싼다.
function guard(fn,fallback){return (...args)=>{try{return fn(...args)}catch(err){console.warn('[Jobfit] 새로 시작 화면을 건너뜁니다',err);return fallback}}}
export const renderStep7QuickStart=guard(_renderStep7QuickStart,'');
export const wireStep7QuickStart=guard(_wireStep7QuickStart,undefined);
export const renderStep8QuickStart=guard(_renderStep8QuickStart,'');
export const wireStep8QuickStart=guard(_wireStep8QuickStart,undefined);

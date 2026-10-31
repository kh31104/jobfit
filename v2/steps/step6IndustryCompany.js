import {readValue,readField,readCard,READABLE_STYLES} from './readableResults.js';
import {parseIndustryAi,parseCompanyAi,isHttpUrl} from './industryAiParser.js?v=2';
import {activeTargetJobs,activeTargetCombos,quickStartActive,renderStep7QuickStart,wireStep7QuickStart} from '../quickStart.js?v=1';
const INDUSTRY_SOURCE_TYPES=['정부·공공기관','산업협회·전문기관','공시·통계','기업 IR·사업보고서','기타 신뢰자료'];
const COMPANY_TYPES=['대기업','중견기업','중소기업','스타트업','공공기관','외국계','기타'];
const HIRING_EVIDENCE=['현재 채용공고 확인','최근 채용공고 확인','공식 직무소개 확인','직무 존재만 확인','아직 미확인'];

export async function render(ctx){
  const s=ctx.getState(),jobs=getTargetJobs(s),saved=s.artifacts?.industryCompany||{industries:[],targetIndustries:[],companies:[],targetCompanies:[],notes:''};
  const root=document.getElementById('stepRoot');let data=structuredClone(saved);
  const rawDraft=s.artifacts?.industryCompanyAiDrafts||{};
  const drafts={industry:rawDraft.industry||'',company:rawDraft.company||''};
  let editingIndustryId='',editingCompanyId='',companyCandidates=[];
  const lastAutoIndustry=new Map(),lastAutoCompany=new Map();
  const preservedIndustries=(data.industries||[]).filter(x=>x?.generatedBy==='step4-inje');
  const preservedCompanies=(data.companies||[]).filter(x=>x?.generatedBy==='step4-inje');
  const preservedIndustryTargets=(data.targetIndustries||[]).filter(id=>preservedIndustries.some(x=>x.id===id));
  const preservedCompanyTargets=(data.targetCompanies||[]).filter(id=>preservedCompanies.some(x=>x.id===id));
  data.industries=(data.industries||[]).filter(x=>x?.generatedBy!=='step4-inje');
  data.companies=(data.companies||[]).filter(x=>x?.generatedBy!=='step4-inje');
  data.targetIndustries=(data.targetIndustries||[]).filter(id=>data.industries.some(x=>x.id===id));
  data.targetCompanies=(data.targetCompanies||[]).filter(id=>data.companies.some(x=>x.id===id));

  const defaultAccordion=(data.targetCompanies||[]).length?5:(data.targetIndustries||[]).length?4:1;
  root.innerHTML=`<section class="card industryCompanyInje jobfitReadable" data-accordion-default="${defaultAccordion}">${READABLE_STYLES}
<style>
.industryCompanyInje .industryWorkplaceEditor{margin-top:14px;padding:14px;border:1px solid #dce4f1;border-radius:13px;background:#fff}
.industryCompanyInje .industryWorkplaceEditor h4{margin:0 0 7px;line-height:1.5}
.industryCompanyInje .industryWorkplaceEditor .grid2{margin-top:12px}
.industryCompanyInje .jfWorkplaceTitle{grid-column:1/-1;font-weight:700;font-size:14px;line-height:1.6;border-bottom:1px solid #e8edf5;padding:4px 2px 8px}
.industryCompanyInje .jfWorkplaceNote{grid-column:1/-1;color:#667085;font-size:13px;line-height:1.65}
.industryCompanyInje .industryWorkplaceEditor textarea{min-height:94px;line-height:1.75;overflow-wrap:anywhere}
@media(max-width:760px){.industryCompanyInje .industryWorkplaceEditor{padding:12px}}
</style>
    <div class="sectionHead"><div><div class="kicker">STEP 7 · INDUSTRY & COMPANY ANALYSIS</div><h2>내가 지원할 산업과 기업 이해하기</h2><p>STEP 5에서 확인한 Target Job을 기준으로 <b>산업 → 기업 → 직무</b>의 연결을 확인하고, 실제 지원 준비할 기업을 구체화합니다.</p></div><span class="badge">산업·기업분석</span></div>
    <div class="progress"><span style="width:58%"></span></div>
    <div class="callout info"><b>점수로 ‘잘 맞는 기업’을 판정하지 않습니다.</b><br>실제 산업자료·기업자료·채용근거를 확인하고, 학생이 직접 더 준비할 산업과 기업을 선택합니다.</div>
    ${renderStep7QuickStart(s,ctx)}

    <div class="block"><h3>01. My Target 확인</h3><p class="help">새 직무를 고르지 않습니다. STEP 5에서 분석한 직무와 JD를 기준점으로 사용합니다.</p>
      <div class="targetSummary">${targetSummaryHtml(s,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>02. Industry Scan · 내 직무로 일할 곳 찾기</h3><p class="help"><b>핵심 질문: 내가 선택한 직무로 어디에서 일할 수 있을까?</b> 근무처 유형·대표 조직을 먼저 확인하고 산업과 직무의 변화를 살펴봅니다.</p>
      <textarea id="industryPrompt" rows="20">${esc(buildIndustryPrompt(s),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="copyIndustryPrompt">산업분석 프롬프트 복사</button><button class="btn outline" type="button" id="copyIndustryFactPrompt">AI 팩트체크·수정 프롬프트 복사</button></div>
      <div class="aiImportStage" style="margin-top:14px">
        <h4>① AI 산업분석 답변 붙여넣기</h4>
        <p class="help">근무처 유형·대표 기관·수행 업무·채용 경로를 각각 자동 분리합니다. 학생이 작성한 값은 덮어쓰지 않으며, 아래 입력칸에서 직접 수정할 수 있습니다.</p>
        <textarea id="industryAiImport" rows="12" placeholder="[근무처 유형]&#10;• 유형별 근무처...&#10;[대표 기관·기업군]&#10;• 기관군/기관명...&#10;[그곳에서 하는 일]&#10;• 근무처별 업무...&#10;[진입·채용 경로]&#10;• 공식 확인처...">${esc(drafts.industry,ctx)}</textarea>
        <div id="industryAiPreview" class="callout info" role="status">AI 답변을 붙여넣으면 인식된 항목을 안내합니다.</div>
        <div class="actions"><button class="btn outline" type="button" id="industryAiReplace">AI 내용으로 입력칸 다시 채우기</button></div>
      </div>
      <h4 style="margin-top:16px">② 산업분석 확인·수정 · Fact Check</h4>
      <div class="grid4" style="margin-top:14px">${txt('industryName','산업명',primaryTargetIndustry(s),'예: 뷰티·소비재')}${selectJob('industryJobId','연결 Target Job',jobs)}${sel('industrySourceType','출처 유형','',INDUSTRY_SOURCE_TYPES)}${txt('industryChecked','확인일','',today())}</div>
      <div class="industryWorkplaceEditor">
<h4>내 직무로 어디에서 일할 수 있나?</h4>
<p class="help">민간기업 외에도 공공기관·대학·연구기관·비영리기관 등 해당 직무가 실제 존재하는 조직을 구분하세요. 직무 존재와 현재 채용 중 여부는 별개입니다.</p>
<div class="grid2">
${area('industryWorkplaces','① 근무처 유형','','예: 전국 대학(국공립·사립·전문대), 공공기관, 기업 등 직무가 있는 근무처 유형')}
${area('industryEmployers','② 대표 기관·기업군','','조직군·기관군 및 공식 확인된 실제 기관명. 둘을 구분')}
${area('industryTasks','③ 그곳에서 하는 일','','근무처별 직무명·수행 업무를 개조식으로 기록')}
${area('industryEntry','④ 진입·채용 경로','','공식 채용게시판·교원 임용·공공기관 채용 등 진입 경로와 요건')}
</div></div>
<h4 style="margin-top:16px">산업 배경과 직무 변화</h4>
<div class="grid2" style="margin-top:12px">${area('industryBusiness','산업 구조·주요 고객','','제품·서비스·고객·가치사슬')}${area('industryChange','최근 변화','','최근 12개월 이내의 직무 관련 변화 3가지')}${area('industryJobLink','내 직무에 미치는 영향','','Task·Skill·Tool·KPI와 확인된 채용요건')}${area('industryDifference','다른 산업과의 차이 · 선택','','산업별 업무·도구·성과기준')}</div>
<div class="grid2" style="margin-top:12px">${txt('industrySource','확인 자료','','예: 공식 직무·채용 자료 / 산업 보고서')}${txt('industryUrl','원문 URL','','https://...')}</div>
      <label class="checkRow" style="margin-top:14px"><input type="checkbox" id="industryFactChecked"><div><b>산업자료 원문 대조 완료</b><span>아래 내용을 정부·공공기관·산업협회·기업 공식자료의 실제 원문과 비교했습니다. 검증하지 않은 답변은 '확인 필요'로 저장됩니다.</span></div></label>
      <div class="actions"><button class="btn primary" id="addIndustry">산업분석 저장</button><button class="btn outline" type="button" id="cancelIndustryEdit" hidden>수정 취소</button></div><div id="industryList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>03. Industry × Job</h3><p class="help">관심 산업은 최대 3개까지 선택합니다. 같은 직무가 산업마다 어떻게 달라지는지 비교합니다.</p>
      <div id="industryTargets"></div><div id="industryCompare" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>04. Find Company · 기업 후보 찾기</h3><p class="help">선택한 산업에서 Target Job이 실제로 존재하는 기업을 찾습니다. 최대 3개만 남깁니다.</p>
      <textarea id="companyPrompt" rows="14">${esc(buildCompanyPrompt(s,data),ctx)}</textarea>
      <div class="actions"><button class="btn secondary" id="copyCompanyPrompt">기업분석 프롬프트 복사</button><button class="btn outline" type="button" id="copyCompanyFactPrompt">AI 팩트체크·수정 프롬프트 복사</button></div>
      <div class="aiImportStage" style="margin-top:14px">
        <h4>① AI 기업분석 답변 붙여넣기</h4>
        <p class="help">기업 1~3의 AI 답변을 붙여넣으면 기업별로 분리됩니다. 기업을 선택해 아래 확인·수정 입력칸에 반영하세요.</p>
        <textarea id="companyAiImport" rows="10" placeholder="[기업 1]&#10;• 기업명: ...&#10;• Business · Customer: ...&#10;• Strategy: ...&#10;• Job Link: ...&#10;• Hiring Signal: ...">${esc(drafts.company,ctx)}</textarea>
        <div id="companyAiPreview" class="callout info" role="status">AI 기업분석 답변을 붙여넣으세요.</div>
        <div class="grid2" style="margin-top:10px"><div class="field"><label>분석할 기업 선택</label><select id="companyAiCandidate"><option value="">AI 답변을 먼저 붙여넣으세요</option></select></div></div>
        <div class="actions"><button type="button" class="btn outline" id="companyAiReplace">선택 기업 AI 내용으로 다시 채우기</button></div>
      </div>
      <div class="callout info" style="margin-top:12px"><b>기업명만 찾지 마세요.</b><br>기업 공식자료와 실제 채용공고·직무소개 URL을 함께 확인한 기업만 후보로 기록합니다.</div>
    </div>

    <div class="hr"></div><div class="block"><h3>05. Company Analysis · 기업을 취업 관점에서 분석하기</h3><p class="help">Business · Customer · Strategy · Job Link · Hiring Signal 다섯 가지를 확인합니다.</p>
      <h4 style="margin-top:16px">② 기업분석 확인·수정 · Fact Check</h4>
      <div class="grid4">${txt('companyName','기업명','','예: 관심 기업')}${sel('companyType','기업유형','',COMPANY_TYPES)}${selectIndustry('companyIndustryId','연결 산업',data.industries)}${selectJob('companyJobId','연결 Target Job',jobs)}</div>
      <div class="grid3" style="margin-top:12px">${txt('companySource','기업 공식자료','','예: 사업보고서 / IR / 공식 홈페이지')}${txt('companyUrl','기업자료 URL','','https://...')}${txt('companyChecked','확인일','',today())}${sel('companyHiringEvidence','채용 근거','',HIRING_EVIDENCE)}${txt('companyJobSource','채용·직무 자료','','예: 신입 채용공고 / 공식 직무소개')}${txt('companyJobUrl','채용·직무 URL','','https://...')}</div>
      <div class="grid2" style="margin-top:12px">${area('companyBusiness','Business · Customer','','주요 사업·제품·서비스와 핵심 고객')}${area('companyDirection','Strategy','','최근 공식적으로 확인되는 사업·시장·제품 방향')}${area('companyRole','Job Link','','Target Job이 이 기업의 어떤 사업·고객·성과와 연결되는가?')}${area('companySignals','Hiring Signal','','채용공고·직무소개에서 반복되는 역량·경험·Tool')}${area('companyWhy','내가 관심을 두는 이유 · 선택','','왜 이 기업을 더 탐색하려 하는가?')}${area('companyUnknown','확인 필요','','아직 확인하지 못한 사업·직무·근무조건·채용정보')}</div>
      <label class="checkRow" style="margin-top:14px"><input type="checkbox" id="companyFactChecked"><div><b>기업·채용자료 원문 대조 완료</b><span>기업 공식자료와 채용공고·공식 직무소개를 실제 원문으로 확인했습니다. 확인하지 않았다면 체크하지 마세요.</span></div></label>
      <div class="actions"><button class="btn primary" id="addCompany">기업분석 저장</button><button class="btn outline" type="button" id="cancelCompanyEdit" hidden>수정 취소</button></div><div id="companyList" style="margin-top:14px"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>06. My Target Company · 현재 더 준비할 기업 선택</h3><p class="help">점수순이 아닙니다. 직무 존재, 실제 업무, 내가 가진 Evidence, 핵심 GAP, 정보근거를 읽고 최대 3개를 선택합니다.</p>
      <div id="companyTargets"></div><div id="companyCompare" style="margin-top:14px"></div><div id="companyGuard" style="margin-top:12px"></div>
      <div class="field" style="margin-top:12px"><label>산업·기업분석 메모</label><textarea id="notes" placeholder="내 직무가 이 산업·기업에서 어떻게 달라지는지, 추가 확인할 것은 무엇인지 적어보세요.">${esc(data.notes||'',ctx)}</textarea></div>
      <div class="actions"><button class="btn primary" id="saveAll">STEP 7 저장</button><button class="btn secondary" id="nextStep">STEP 8 Resume Lab →</button></div><div class="status" id="status"></div>
    </div>
  </section>`;

  renderAll();
  if(jobs[0]?.id){const ij=document.getElementById('industryJobId'),cj=document.getElementById('companyJobId');if(ij&&!ij.value)ij.value=jobs[0].id;if(cj&&!cj.value)cj.value=jobs[0].id}

  // Apply only empty or previously AI-generated, unchanged inputs. Saved records win by default.
  const industryFieldMap={name:'industryName',sourceType:'industrySourceType',source:'industrySource',url:'industryUrl',checkedAt:'industryChecked',workplaces:'industryWorkplaces',employers:'industryEmployers',tasks:'industryTasks',entry:'industryEntry',business:'industryBusiness',change:'industryChange',jobLink:'industryJobLink',difference:'industryDifference'};
  const companyFieldMap={name:'companyName',type:'companyType',business:'companyBusiness',direction:'companyDirection',role:'companyRole',signals:'companySignals',source:'companySource',url:'companyUrl',jobSource:'companyJobSource',jobUrl:'companyJobUrl',hiringEvidence:'companyHiringEvidence',checkedAt:'companyChecked',why:'companyWhy',unknown:'companyUnknown'};
  const clearFact=(kind)=>{const cb=document.getElementById(kind+'FactChecked');if(cb)cb.checked=false};
  function autofill(values,ids,previous,{replace=false,kind='industry'}={}){
    let applied=0,protectedCount=0;
    for(const [key,id] of Object.entries(ids)){
      const value=String(values?.[key]||'').trim(),el=document.getElementById(id);
      if(!value||!el)continue;
      const old=el.value.trim(),owned=previous.get(id);
      if(replace||!old||(owned!==undefined&&old===owned)){
        if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===value||o.textContent===value)){protectedCount++;continue}
        if(old!==value){el.value=value;applied++;}previous.set(id,value);
      }else protectedCount++;
    }
    if(kind==='company'){
      const industryName=String(values?.industry||'').trim(),indEl=document.getElementById('companyIndustryId');
      const found=data.industries.find(x=>x.name===industryName);
      if(found&&indEl&&(replace||!indEl.value))indEl.value=found.id;
      const jobEl=document.getElementById('companyJobId');
      if(jobEl&&!jobEl.value&&jobs.length===1)jobEl.value=jobs[0].id;
      if(indEl&&!indEl.value&&data.industries.length===1)indEl.value=data.industries[0].id;
    }
    if(applied)clearFact(kind);
    return {applied,protectedCount};
  }
  function saveAiDraft(kind,raw){
    drafts[kind]=raw;
    ctx.saveState({artifacts:{industryCompanyAiDrafts:{...drafts}}});
  }
  function importIndustry({replace=false}={}){
    const raw=document.getElementById('industryAiImport')?.value||'',p=parseIndustryAi(raw);
    const feedback=document.getElementById('industryAiPreview');
    if(!p.recognized){feedback.textContent=raw?'산업 항목을 인식하지 못했습니다. 프롬프트의 [제목] 형식인지 확인하세요.':'AI 답변을 붙여넣으세요.';return}
    const r=autofill(p.fields,industryFieldMap,lastAutoIndustry,{replace,kind:'industry'});
    const missing=['workplaces','employers','tasks','entry'].filter(k=>!String(p.fields[k]||'').trim());
    feedback.textContent='산업분석 항목 '+p.recognized+'개 인식 · '+r.applied+'개 입력칸 반영'
      +(r.protectedCount?' · 기존 값 '+r.protectedCount+'개 보호':'')
      +(missing.length?' · 확인 필요: '+missing.join(', '):'')
      +' · AI 내용은 검증 전 초안입니다.';
  }
  function importCompany({replace=false,resetSelect=false}={}){
    const raw=document.getElementById('companyAiImport')?.value||'',p=parseCompanyAi(raw);
    companyCandidates=p.companies;
    const pick=document.getElementById('companyAiCandidate'),previous=resetSelect?'':pick.value;
    pick.innerHTML='<option value="">분석할 기업 선택</option>'+companyCandidates.map((co,i)=>'<option value="'+i+'">'+esc(co.name||'기업 '+(i+1),ctx)+'</option>').join('');
    if(companyCandidates.length){pick.value=previous&&companyCandidates[Number(previous)]?previous:'0';}
    const feedback=document.getElementById('companyAiPreview');
    if(!companyCandidates.length){feedback.textContent=raw?'기업분석 구조를 인식하지 못했습니다. [기업 1]과 항목명을 확인하세요.':'AI 기업분석 답변을 붙여넣으세요.';return}
    const selected=companyCandidates[Number(pick.value)]||companyCandidates[0];
    const r=autofill(selected,companyFieldMap,lastAutoCompany,{replace,kind:'company'});
    feedback.textContent=companyCandidates.length+'개 기업 분석 인식 · '+r.applied+'개 항목 자동 반영'
      +(r.protectedCount?' · 기존 내용 '+r.protectedCount+'개 보호':'')
      +' · 원문 대조 후 수정·저장하세요.';
  }
  document.getElementById('industryAiImport')?.addEventListener('input',()=>{importIndustry();saveAiDraft('industry',document.getElementById('industryAiImport').value)});
  document.getElementById('companyAiImport')?.addEventListener('input',()=>{importCompany();saveAiDraft('company',document.getElementById('companyAiImport').value)});
  document.getElementById('industryAiReplace')?.addEventListener('click',()=>importIndustry({replace:true}));
  document.getElementById('companyAiReplace')?.addEventListener('click',()=>importCompany({replace:true}));
  document.getElementById('companyAiCandidate')?.addEventListener('change',()=>importCompany());
  document.getElementById('cancelIndustryEdit')?.addEventListener('click',()=>{editingIndustryId='';document.getElementById('addIndustry').textContent='산업분석 저장';document.getElementById('cancelIndustryEdit').hidden=true;clear(Object.values(industryFieldMap));clearFact('industry');lastAutoIndustry.clear()});
  document.getElementById('cancelCompanyEdit')?.addEventListener('click',()=>{editingCompanyId='';document.getElementById('addCompany').textContent='기업분석 저장';document.getElementById('cancelCompanyEdit').hidden=true;clear(Object.values(companyFieldMap));clearFact('company');lastAutoCompany.clear()});
  // Loading a previously saved analysis is read-only until the user explicitly presses Save.
  function editIndustry(id){
    const item=data.industries.find(x=>x.id===id);if(!item)return;
    editingIndustryId=id;lastAutoIndustry.clear();
    for(const [key,fieldId] of Object.entries(industryFieldMap)){const el=document.getElementById(fieldId);if(el)el.value=item[key]||'';}
    document.getElementById('industryJobId').value=item.jobId||'';
    document.getElementById('industryFactChecked').checked=item.factCheck==='원문 대조 완료';
    document.getElementById('addIndustry').textContent='수정한 산업분석 저장';
    document.getElementById('cancelIndustryEdit').hidden=false;
    document.getElementById('industryName').focus();
  }
  function editCompany(id){
    const item=data.companies.find(x=>x.id===id);if(!item)return;
    editingCompanyId=id;lastAutoCompany.clear();
    for(const [key,fieldId] of Object.entries(companyFieldMap)){const el=document.getElementById(fieldId);if(el)el.value=item[key]||'';}
    document.getElementById('companyIndustryId').value=item.industryId||'';
    document.getElementById('companyJobId').value=item.jobId||'';
    document.getElementById('companyFactChecked').checked=item.factCheck==='원문 대조 완료';
    document.getElementById('addCompany').textContent='수정한 기업분석 저장';
    document.getElementById('cancelCompanyEdit').hidden=false;
    document.getElementById('companyName').focus();
  }
  // If the student edits verified content, verification must be renewed.
  for(const [kind,ids] of [['industry',industryFieldMap],['company',companyFieldMap]]){
    for(const id of Object.values(ids)){document.getElementById(id)?.addEventListener('input',()=>clearFact(kind));document.getElementById(id)?.addEventListener('change',()=>clearFact(kind));}
  }

  if(drafts.industry)importIndustry();
  if(drafts.company)importCompany();
  function factPrompt(kind){
    const isIndustry=kind==='industry',original=document.getElementById(isIndustry?'industryAiImport':'companyAiImport')?.value||'';
    const fields=isIndustry?industryFieldMap:companyFieldMap;
    const detail=Object.entries(fields).map(([label,id])=>label+': '+(document.getElementById(id)?.value||'미입력')).join('\n');
    return [
      '역할: 채용준비용 산업·기업 정보의 팩트체커. 웹 검색이 가능하면 정부·공공·공시·기업 공식 원문부터 직접 확인하세요.',
      '아래 AI 초안과 학생이 수정한 현재 입력값을 대조하십시오.',
      '',
      '[반드시 확인할 것]',
      '1. 통계·정책·사업변화·실제 조직·채용 여부·직무 요구사항의 사실성',
       '1-1. 근무처 유형·대표 기관·기업군의 직무 존재 여부와 조직군/기관명 구분',
       '1-2. 직무 존재와 현재 채용 중 여부를 구분하고 대학·공공기관 등이 누락되지 않았는지',
      '2. 원문 URL이 실제 존재하고 주장과 일치하는지, 자료명·발행일·확인일이 맞는지',
      '3. 이미 마감된 채용공고를 모집 중이라고 표현하지 않았는지',
      '4. 근거가 없거나 문서를 열 수 없으면 확인 필요로 표시하고 숫자·사례·URL을 임의로 만들지 마세요.',
      '5. 실제 확인된 정보와 추정을 구분하세요.',
      '',
      '[AI가 작성한 원문]',
      original||'(아직 AI 초안 없음)',
      '',
      '[학생이 확인·수정한 현재 입력값]',
      detail,
      '',
      '[응답 형식]',
      '먼저 [확인·정정 내역]에 오류와 추가 확인이 필요한 내용을 항목별로 짧게 정리하세요.',
      '그다음 아래의 원래 분석 프롬프트 [출력 형식] 표제어를 그대로 유지한 수정본 전체를 출력하세요.',
      '학생은 수정본을 STEP 7 AI 답변 칸에 다시 붙여넣고 원문 확인 후 저장합니다.',
      '',
      '[원래 분석 프롬프트]',
      document.getElementById(isIndustry?'industryPrompt':'companyPrompt')?.value||''
    ].join('\n');
  }
  document.getElementById('copyIndustryFactPrompt').addEventListener('click',()=>copy(factPrompt('industry'),ctx));
  document.getElementById('copyCompanyFactPrompt').addEventListener('click',()=>copy(factPrompt('company'),ctx));
  document.getElementById('copyIndustryPrompt').addEventListener('click',()=>copy(document.getElementById('industryPrompt').value,ctx));
  document.getElementById('copyCompanyPrompt').addEventListener('click',()=>copy(document.getElementById('companyPrompt').value,ctx));
  document.getElementById('addIndustry').addEventListener('click',addIndustry);document.getElementById('addCompany').addEventListener('click',addCompany);
  document.getElementById('saveAll').addEventListener('click',saveAll);document.getElementById('nextStep').addEventListener('click',()=>{saveAll();ctx.navigate(7)});
  wireStep7QuickStart(ctx,{onDone:()=>ctx.navigate(6)});

  function addIndustry(){
    const name=v('industryName'),jobId=v('industryJobId'),source=v('industrySource'),url=v('industryUrl');
    if(!name||!jobId||!source||!url){status('산업명·연결 직무·확인자료명·원문 URL을 입력하세요.');return}
    if(!isHttpUrl(url)){status('산업 원문 URL은 실제 http(s) 주소를 입력하세요.');return}
    const confirmed=!!document.getElementById('industryFactChecked').checked;
    const existing=data.industries.find(x=>x.id===editingIndustryId);
    const now=new Date().toISOString();
    const item={...(existing||{}),id:existing?.id||'ind_'+Date.now(),name,jobId,
      sourceType:v('industrySourceType'),source,url,checkedAt:v('industryChecked'),
      workplaces:v('industryWorkplaces'),employers:v('industryEmployers'),tasks:v('industryTasks'),entry:v('industryEntry'),
       business:v('industryBusiness'),change:v('industryChange'),jobLink:v('industryJobLink'),
      difference:v('industryDifference'),factCheck:confirmed?'원문 대조 완료':'확인 필요',
      factCheckedAt:confirmed?now:null,
      createdAt:existing?.createdAt||now,updatedAt:now};
    if(existing)data.industries=data.industries.map(x=>x.id===existing.id?item:x);
    else data.industries.push(item);
    const modified=!!existing;
    editingIndustryId='';lastAutoIndustry.clear();
    clear(Object.values(industryFieldMap));clearFact('industry');
    document.getElementById('addIndustry').textContent='산업분석 저장';
    document.getElementById('cancelIndustryEdit').hidden=true;
    persist();renderAll();
    status((modified?'산업분석 수정사항':'산업분석')+'을 저장했습니다. '+(confirmed?'학생 원문 대조 완료':'출처 원문 확인 필요'));
  }
  function addCompany(){
    const name=v('companyName'),industryId=v('companyIndustryId'),jobId=v('companyJobId');
    const existing=data.companies.find(x=>x.id===editingCompanyId);
    if(!existing&&data.companies.length>=3){status('기업 후보는 최대 3개입니다. 저장된 기업은 수정 버튼으로 바꿀 수 있습니다.');return}
    if(!name||!industryId||!jobId){status('기업명·산업·연결 직무를 모두 선택하세요.');return}
    const industry=data.industries.find(x=>x.id===industryId);
    if(industry?.jobId&&industry.jobId!==jobId){status('선택한 산업과 Target Job의 연결이 다릅니다.');return}
    const url=v('companyUrl'),jobUrl=v('companyJobUrl');
    if((url&&!isHttpUrl(url))||(jobUrl&&!isHttpUrl(jobUrl))){status('기업자료와 채용자료 URL은 유효한 http(s) 주소를 입력하세요.');return}
    const confirmed=!!document.getElementById('companyFactChecked').checked;
    if(confirmed&&(!url||!jobUrl)){status('원문 대조 완료를 체크하려면 기업 공식자료 URL과 채용·직무 원문 URL을 모두 입력하세요.');return}
    const now=new Date().toISOString();
    const item={...(existing||{}),id:existing?.id||'co_'+Date.now(),name,type:v('companyType'),
      industryId,jobId,industry:industry?.name||'',job:jobs.find(x=>x.id===jobId)?.title||'',
      source:v('companySource'),url,checkedAt:v('companyChecked'),
      hiringEvidence:v('companyHiringEvidence'),jobSource:v('companyJobSource'),jobUrl,
      business:v('companyBusiness'),direction:v('companyDirection'),role:v('companyRole'),
      signals:v('companySignals'),why:v('companyWhy'),unknown:v('companyUnknown'),
      factCheck:confirmed?'원문 대조 완료':'확인 필요',
      factCheckedAt:confirmed?now:null,createdAt:existing?.createdAt||now,updatedAt:now};
    if(existing)data.companies=data.companies.map(x=>x.id===existing.id?item:x);
    else data.companies.push(item);
    const modified=!!existing;
    editingCompanyId='';lastAutoCompany.clear();
    clear(Object.values(companyFieldMap));clearFact('company');
    document.getElementById('addCompany').textContent='기업분석 저장';
    document.getElementById('cancelCompanyEdit').hidden=true;
    persist();renderAll();
    status((modified?'기업분석 수정사항':'기업분석')+'을 저장했습니다. '+(confirmed?'학생 원문 대조 완료':'원문 확인 필요'));
  }
  function renderAll(){refreshCompanyIndustrySelect();renderIndustries();renderIndustryTargets();renderIndustryCompare();renderCompanies();renderCompanyTargets();renderCompanyCompare();renderCompanyGuard();}
  function refreshCompanyIndustrySelect(){const el=document.getElementById('companyIndustryId');if(!el)return;const current=el.value;el.innerHTML='<option value="">선택</option>'+data.industries.map(x=>`<option value="${esc(x.id,ctx)}">${esc(x.name,ctx)}</option>`).join('');if(data.industries.some(x=>x.id===current))el.value=current;}
  function renderIndustries(){const box=document.getElementById('industryList');if(!data.industries.length){box.innerHTML='<div class="placeholder"><b>Industry Evidence가 없습니다.</b>Target Job이 실제로 활용되는 산업을 근거자료와 함께 추가하세요.</div>';return;}box.innerHTML=data.industries.map((x,i)=>{const job=jobs.find(j=>j.id===x.jobId);return `<div class="listCard jfResultBox"><div class="listHead"><div><span class="rankTag">산업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc(job?.title||'직무 미연결',ctx)} · ${esc(x.sourceType||'출처유형 미입력',ctx)} · 확인 ${esc(x.checkedAt||'미입력',ctx)}</div></div><div class="actions"><button class="btn outline smallBtn" data-editind="${esc(x.id,ctx)}">수정</button><button class="btn danger smallBtn" data-delind="${esc(x.id,ctx)}">삭제</button></div></div><div class="jfReadFields">${industryWorkplaceSummary(x,ctx)}<div class="jfWorkplaceTitle">산업 배경·직무 변화</div>${readField("구조·고객",x.business,ctx)}${readField("최근 변화",x.change,ctx)}${readField("직무 영향",x.jobLink,ctx)}${readField("산업별 차이",x.difference,ctx)}</div><div class="sourceLine"><b>사실확인</b> ${esc(x.factCheck||"확인 필요",ctx)} · <b>근거</b> ${esc(x.source,ctx)} · <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">원문 열기 ↗</a></div></div>`}).join('');box.querySelectorAll('[data-editind]').forEach(b=>b.addEventListener('click',()=>editIndustry(b.dataset.editind)));box.querySelectorAll('[data-delind]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.delind;data.industries=data.industries.filter(x=>x.id!==id);data.targetIndustries=data.targetIndustries.filter(x=>x!==id);data.companies=data.companies.filter(x=>x.industryId!==id);data.targetCompanies=data.targetCompanies.filter(id=>data.companies.some(c=>c.id===id));persist();renderAll();}));}
  function renderIndustryTargets(){const box=document.getElementById('industryTargets');box.innerHTML=data.industries.length?data.industries.map(x=>`<label class="checkRow"><input type="checkbox" data-itarget="${x.id}" ${data.targetIndustries.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc(jobs.find(j=>j.id===x.jobId)?.title||'',ctx)} · ${esc((x.workplaces||x.jobLink||'').replace(/\s*\n\s*/g,' · ').slice(0,120),ctx)}</span></div></label>`).join(''):'<div class="callout warn">산업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-itarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-itarget]:checked')];if(ids.length>3){c.checked=false;ctx.toast('Target Industry는 최대 3개입니다.');}saveSelections();renderIndustryCompare();}));}
  function renderIndustryCompare(){
    const box=document.getElementById('industryCompare'),ids=currentIndustryTargets(),arr=ids.map(id=>data.industries.find(x=>x.id===id)).filter(Boolean);
    if(arr.length<2){box.innerHTML='<div class="callout info">Target Industry를 2개 이상 선택하면 같은 직무의 산업별 차이를 비교할 수 있습니다.</div>';return;}
    box.innerHTML='<div class="jfReadCards">'+arr.map(x=>readCard(x.name,[
      ['Target Job',jobs.find(j=>j.id===x.jobId)?.title||'—'],
      ['근무처 유형',x.workplaces],
       ['대표 기관·기업군',x.employers],
       ['그곳에서 하는 일',x.tasks],
       ['진입·채용 경로',x.entry],
       ['직무 영향',x.jobLink],
      ['산업별 차이',x.difference],
      ['근거',x.source]
    ],ctx)).join('')+'</div>';
  }
  function renderCompanies(){const box=document.getElementById('companyList');if(!data.companies.length){box.innerHTML='<div class="placeholder"><b>Company Evidence가 없습니다.</b>사업자료와 채용·직무 근거를 연결해 기업 후보를 추가하세요.</div>';return;}box.innerHTML=data.companies.map((x,i)=>{const ind=data.industries.find(a=>a.id===x.industryId),job=jobs.find(a=>a.id===x.jobId),quality=companyEvidenceQuality(x);return `<div class="listCard jfResultBox"><div class="listHead"><div><span class="rankTag">기업 ${i+1}</span><h3>${esc(x.name,ctx)}</h3><div class="muted small">${esc([x.type,ind?.name||x.industry,job?.title||x.job].filter(Boolean).join(' · '),ctx)}</div></div><span class="scoreChip">${quality}</span></div><div class="jfReadFields">${readField("사업·고객",x.business,ctx)}${readField("최근 방향",x.direction,ctx)}${readField("직무 연결",x.role,ctx)}${readField("채용 역량신호",x.signals,ctx)}</div><div class="sourceLine"><b>사실확인</b> ${esc(x.factCheck||"확인 필요",ctx)}<br><b>기업근거</b> ${esc(x.source||'미입력',ctx)} ${x.url?`· <a href="${esc(x.url,ctx)}" target="_blank" rel="noopener">열기</a>`:''}<br><b>채용근거</b> ${esc(x.hiringEvidence||'미확인',ctx)} ${x.jobUrl?`· <a href="${esc(x.jobUrl,ctx)}" target="_blank" rel="noopener">열기</a>`:''}</div><div class="actions"><button class="btn outline smallBtn" data-editco="${esc(x.id,ctx)}">수정</button><button class="btn danger smallBtn" data-delco="${esc(x.id,ctx)}">삭제</button></div></div>`}).join('');box.querySelectorAll('[data-editco]').forEach(b=>b.addEventListener('click',()=>editCompany(b.dataset.editco)));box.querySelectorAll('[data-delco]').forEach(b=>b.addEventListener('click',()=>{data.companies=data.companies.filter(x=>x.id!==b.dataset.delco);data.targetCompanies=data.targetCompanies.filter(id=>id!==b.dataset.delco);persist();renderAll();}));}
  function renderCompanyTargets(){const box=document.getElementById('companyTargets');box.innerHTML=data.companies.length?data.companies.map(x=>`<label class="checkRow"><input type="checkbox" data-ctarget="${x.id}" ${data.targetCompanies.includes(x.id)?'checked':''}><div><b>${esc(x.name,ctx)}</b><span>${esc([x.industry||data.industries.find(i=>i.id===x.industryId)?.name,x.job||jobs.find(j=>j.id===x.jobId)?.title,x.hiringEvidence].filter(Boolean).join(' · '),ctx)}</span></div></label>`).join(''):'<div class="callout warn">기업 Evidence를 먼저 추가하세요.</div>';box.querySelectorAll('[data-ctarget]').forEach(c=>c.addEventListener('change',()=>{const ids=[...box.querySelectorAll('[data-ctarget]:checked')];if(ids.length>3){c.checked=false;ctx.toast('Target Company는 최대 3개입니다.');}saveSelections();renderCompanyCompare();renderCompanyGuard();}));}
  function renderCompanyCompare(){
    const box=document.getElementById('companyCompare');if(!box)return;
    const arr=currentCompanyTargets().map(id=>data.companies.find(x=>x.id===id)).filter(Boolean);
    if(!arr.length){box.innerHTML='<div class="callout info">분석한 기업 중 현재 더 준비할 기업을 선택하세요.</div>';return;}
    box.innerHTML='<div class="jfReadCards">'+arr.map(x=>readCard(x.name,[
      ['사업·고객',x.business],
      ['최근 방향',x.direction],
      ['직무 연결',x.role],
      ['채용 역량신호',x.signals],
      ['확인 필요',x.unknown]
    ],ctx)).join('')+'</div>';
  }
  function renderCompanyGuard(){const box=document.getElementById('companyGuard'),arr=currentCompanyTargets().map(id=>data.companies.find(x=>x.id===id)).filter(Boolean);if(!arr.length){box.innerHTML='<div class="callout info">Target Company를 선택하면 근거상태를 점검합니다.</div>';return;}const weak=arr.filter(x=>['직무 존재만 확인','아직 미확인',''].includes(x.hiringEvidence)||!x.url);const orphan=arr.filter(x=>!data.targetIndustries.includes(x.industryId));if(orphan.length)box.innerHTML=`<div class="callout warn"><b>조합 확인 필요</b><br>${orphan.map(x=>esc(x.name,ctx)).join(', ')}은 현재 Target Industry에 포함되지 않습니다.</div>`;else if(weak.length)box.innerHTML=`<div class="callout warn"><b>채용근거 보강 필요</b><br>${weak.map(x=>esc(x.name,ctx)).join(', ')}은 실제 채용공고 또는 공식 직무자료를 더 확인하세요.</div>`;else box.innerHTML='<div class="callout good"><b>기본 연결 확인</b><br>선택한 기업이 Target Industry·Target Job과 연결되고 채용/직무 근거도 기록되어 있습니다.</div>';}
  function saveSelections(){data.targetIndustries=currentIndustryTargets();data.targetCompanies=currentCompanyTargets();const cp=document.getElementById('companyPrompt');if(cp)cp.value=buildCompanyPrompt(ctx.getState(),data);persist();}
  function saveAll(){saveSelections();data.notes=v('notes');persist();renderCompanyGuard();status('STEP 7 산업·기업분석 결과를 저장했습니다.');}
  function currentIndustryTargets(){return [...document.querySelectorAll('[data-itarget]:checked')].map(x=>x.dataset.itarget)}function currentCompanyTargets(){return [...document.querySelectorAll('[data-ctarget]:checked')].map(x=>x.dataset.ctarget)}
  function persist(){
    // Preserve every preexisting record's position and value, except explicit user edits/deletes.
    const originalOrder=(all,visible,preserved)=>{
      const byId=new Map([...preserved,...visible].map(x=>[x.id,x]));
      const oldIds=new Set((all||[]).map(x=>x.id));
      return [...(all||[]).map(x=>byId.get(x.id)).filter(Boolean),...visible.filter(x=>!oldIds.has(x.id))];
    };
    const selectedOrder=(original,current,preserved)=>{
      const set=new Set([...preserved,...current]);
      const previous=(original||[]).filter(x=>set.has(x));
      return [...previous,...current.filter(x=>!previous.includes(x))];
    };
    ctx.saveState({artifacts:{industryCompany:{...data,
      industries:originalOrder(saved.industries,data.industries,preservedIndustries),
      companies:originalOrder(saved.companies,data.companies,preservedCompanies),
      targetIndustries:selectedOrder(saved.targetIndustries,data.targetIndustries,preservedIndustryTargets),
      targetCompanies:selectedOrder(saved.targetCompanies,data.targetCompanies,preservedCompanyTargets)}}});
  }function v(id){return document.getElementById(id)?.value?.trim()||''}function clear(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}

// '새로 시작' 목표가 켜져 있으면 그 직무를, 아니면 STEP 4 목표를 사용한다(v2/quickStart.js).
function getTargetJobs(s){return activeTargetJobs(s)}
function companyEvidenceQuality(x){if(x.url&&x.jobUrl&&['현재 채용공고 확인','최근 채용공고 확인'].includes(x.hiringEvidence))return '근거 높음';if(x.url&&(x.jobUrl||x.hiringEvidence==='공식 직무소개 확인'))return '근거 보통';return '근거 보강'}
function buildIndustryPrompt(s){
  const jobs=getTargetJobs(s).map(x=>x.title),industries=activeTargetCombos(s).map(x=>x.industry).filter(x=>x&&x!=='산업 미정');
  const special=jobs.some(x=>/대학교수|교수|교원|강사/.test(x))
    ? '9. 대학교수·강의 직무는 먼저 전국 대학(국공립·사립·전문대학) 같은 근무처 유형을 제시하고, 개별 대학 몇 곳만 열거하거나 민간기업으로 대체하지 마세요. 교수 임용·강사 채용·교육기획 채용을 구별합니다.'
    : '9. 민간기업·공공기관·대학·학교·연구기관·비영리조직 등 해당 직무가 존재하는 조직군을 확인하되 관련성이 없는 유형은 제외합니다.';
  return [
    '당신은 한국 대학생을 위한 산업·직무 리서처입니다.',
    '전공: '+(s.profile?.major||'미입력'),
    'Target Job: '+(jobs.join(', ')||'미정'),
    '관심 산업: '+([...new Set(industries)].join(', ')||'미정'),
    '',
    '[핵심 질문]',
    '학생이 산업분석 결과만 보고 “내가 선택한 직무로 어디에서 일할 수 있는가?”를 한눈에 파악하도록 작성합니다.',
    '가장 먼저 근무처 유형 → 대표 기관·기업군 → 그곳에서 하는 일 → 진입·채용 경로 순서로 답합니다.',
    '기업 명단보다는 해당 직무가 존재하는 조직의 범위와 실제 업무를 우선합니다.',
    'Target Job이 2개 이상이면 근무처·업무·채용경로를 직무별로 구분합니다.',
    '',
    '[검색·사실확인 규칙]',
    '1. 근무처를 사기업으로 한정하지 않습니다. 해당 직무가 실제 존재하는 교육기관·공공기관·연구소·비영리기관도 검토합니다.',
    '2. 조직 유형(예: 전국 대학·국공립대·사립대)과 특정 조직명(예: 개별 대학교)은 구분합니다. 실명은 공식 근거를 확인했을 때만 작성합니다.',
    '3. 직무의 존재, 과거 채용 이력, 현재 모집 중 여부는 별개입니다. 현재 모집 중이라는 표현은 실제 접수기간 확인 시에만 씁니다.',
    '4. 정부·공공기관·대학·기업 공식 직무소개·채용공고·공시·산업협회 자료 등 원문을 우선 검색합니다.',
    '5. 확인한 자료명·발행기관·발행일·원문 URL만 작성하며 불확실한 사례와 채용 여부는 확인 필요로 표시합니다.',
    '6. 최근 12개월의 산업 변화를 우선하되 산업구조는 이전 자료를 활용해도 됩니다.',
    '7. PEST(정책·경제·사회·기술) 중 직무 관련 변화 3개를 선택하고 JD에 명시된 요구와 예상되는 변화는 구별합니다.',
    '8. 학생 경험, 적합도, 취업 가능성, 조직 규모와 채용 수요를 임의로 단정하지 않습니다.',
    special,
    '',
    '[출력 형식 · 아래 대괄호 제목을 그대로 사용]',
    '[산업명]',
    '• 분석할 산업 1개. 범위가 너무 넓으면 선택 직무 중심으로 한정',
    '[근무처 유형]',
    '• 근무처 유형 1 — 해당 Target Job — 직무 존재: 공식 확인 / 확인 필요',
    '• 근무처 유형 2 — 해당 Target Job — 직무 존재: 공식 확인 / 확인 필요',
    '• 직무가 있는 유형만 제시하고, 없는 조직 유형을 억지로 채우지 않음',
    '[대표 기관·기업군]',
    '• 유형 1 — 전국 단위 조직군·기관군 또는 주요 기업군. 실명은 공식자료로 확인한 경우에만',
    '• 유형 2 — 같은 형식. 특정 지역·대학 몇 곳만 나열하여 전국적 근무처 유형을 대신하지 않음',
    '[그곳에서 하는 일]',
    '• 유형 1 — 실제 직무명: 주요 Task 2~3개 (공식 직무자료 확인 / 일반적 업무 추정 구별)',
    '• 유형 2 — 실제 직무명: 주요 Task 2~3개',
    '[진입·채용 경로]',
    '• 유형 1 — 채용·임용·모집 경로 / 확인된 자격요건 / 공식 확인처 또는 확인 필요',
    '• 유형 2 — 같은 형식. 과거 공고를 현재 모집 중이라고 표시하지 않음',
    '[산업 구조·주요 고객]',
    '• 이 산업의 제품·서비스 / 주요 고객 / 가치사슬 / 수익 또는 재원 구조',
    '[최근 변화]',
    '• 변화 1: PEST 유형 / 확인된 변화 / 직무 관련성 / 문서명·발행일',
    '• 변화 2: ...',
    '• 변화 3: ...',
    '[내 직무에 미치는 영향]',
    '• 변화에 따른 Task·Skill·Tool·KPI 및 대학생 준비사항. 공식 채용근거와 예상 구분',
    '[다른 산업과의 차이·선택]',
    '• 같은 직무의 타 산업 대비 주요 업무·도구·성과기준 차이',
    '[출처 유형]',
    '• 정부·공공기관 / 산업협회·전문기관 / 공시·통계 / 기업 IR·사업보고서 / 기타 신뢰자료 중 하나',
    '[확인 자료]',
    '• 핵심 공식 자료의 정확한 명칭·기관·발행일. 실제 확인했을 때만 기록',
    '[원문 URL]',
    '• 위 자료의 확인된 원문 링크 1개. 확인하지 못했다면 공란',
    '[확인일]',
    '• 실제 확인일(YYYY-MM-DD). 확인하지 않았다면 공란',
    '',
    '반드시 줄바꿈과 개조식으로 답변하세요. JSON·마크다운 표·코드블록은 사용하지 마세요.'
  ].join('\n');
}
function industryWorkplaceSummary(x,ctx){
  const fields=[['① 근무처 유형',x.workplaces],['② 대표 기관·기업군',x.employers],['③ 그곳에서 하는 일',x.tasks],['④ 진입·채용 경로',x.entry]];
  if(!fields.some(([,value])=>String(value||'').trim()))
    return '<div class="jfWorkplaceNote">기존 산업분석 기록입니다. ‘수정’에서 근무처 정보를 추가할 수 있습니다.</div>';
  return '<div class="jfWorkplaceTitle">내 직무로 일할 수 있는 곳</div>'+fields.map(([label,value])=>readField(label,value,ctx)).join('');
}
function buildCompanyPrompt(s,data){
  const inds=(data.targetIndustries||[]).map(id=>data.industries.find(x=>x.id===id)?.name).filter(Boolean),jobs=getTargetJobs(s).map(x=>x.title);
  return [
    '당신은 한국 취업준비생을 위한 기업·직무 리서처입니다.',
    '전공: '+(s.profile?.major||'미입력'),
    'Target Job: '+(jobs.join(', ')||'미정'),
    '관심 산업: '+(inds.join(', ')||primaryTargetIndustry(s)||'미정'),
    '',
    '[검색·사실확인 규칙]',
    '1. 관심 산업에서 선택 직무가 실제 확인되는 기업 1~3개를 제시합니다.',
    '2. 기업 공식 홈페이지, DART 사업보고서, IR, 공식 채용공고·직무소개를 우선합니다.',
    '3. 실제 확인한 원문 URL만 적고 현재 모집 여부와 최근 참고공고를 구분합니다.',
    '4. 최근 전략·제품·고객 변화는 발행일과 문서명을 근거로 씁니다.',
    '5. 공식 JD에서 확인된 채용 역량신호와 일반적 직무 추론을 구분합니다.',
    '6. 학력·규모·매출·인원·공고 접수기간은 확인하지 못했으면 확인 필요라고 씁니다.',
    '7. 합격가능성, 기업 적합도 점수, 지원자 개인의 의견은 만들어내지 않습니다.',
    '',
    '[출력 형식 · 기업마다 아래 표제어 그대로 사용]',
    '[기업 1]',
    '• 기업명: ',
    '• 기업유형: 대기업/중견기업/중소기업/스타트업/공공기관/외국계/기타 중 확인된 하나',
    '• 연결 산업: ',
    '• Business · Customer: 주 사업과 주요 고객',
    '• Strategy: 최근 공식자료에 확인된 방향과 발표일',
    '• Job Link: 선택 직무의 실제 업무·성과 연결',
    '• Hiring Signal: JD에 명시된 주요 과업·역량·Tool',
    '• 기업 공식자료: 문서명·발행기관·발행일',
    '• 기업 공식자료 URL: 검증 가능한 실제 원문 링크',
    '• 채용·직무 자료: 공고 또는 공식 직무소개 이름과 발표일',
    '• 채용 근거: 현재 채용공고 확인/최근 채용공고 확인/공식 직무소개 확인/직무 존재만 확인/아직 미확인',
    '• 채용·직무 원문 URL: 실제 원문 링크',
    '• 확인일: YYYY-MM-DD',
    '• 확인 필요: 검증할 부분',
    '',
    '[기업 2]',
    '• 위 항목과 동일 (실제 확인된 기업이 없으면 생략)',
    '[기업 3]',
    '• 위 항목과 동일 (실제 확인된 기업이 없으면 생략)',
    '',
    '기업당 1개의 기록으로 분리할 수 있도록 줄바꿈만 사용하세요. JSON·코드블록·표는 금지합니다.'
  ].join('\n');
}
function primaryTargetIndustry(s){const e=s.artifacts?.jobExplorer||{},arr=activeTargetCombos(s).map(x=>x.industry).filter(x=>x&&x!=='산업 미정');return arr[0]||(quickStartActive(s)?'':e.industryInterests?.[0])||''}
function targetSummaryHtml(s,ctx){
  const e=s.artifacts?.jobExplorer||{},deep=s.artifacts?.jobDeepDive||{},combos=activeTargetCombos(s),jobs=getTargetJobs(s);
  if(!combos.length)return '<div class="callout warn">STEP 4~5에서 Target Job을 확정했거나, 위 \'새로 시작\'에서 목표 직무와 관심 산업을 입력하세요.</div>';
  return combos.map((t,i)=>{
    const job=jobs.find(x=>x.id===t.jobId)||e.candidates?.find(x=>x.id===t.jobId);
    if(t.origin==='quick-start-step7')return `<div class="listCard"><div class="listHead"><div><span class="rankTag">Target ${i+1} · 새로 시작</span><h3>${esc(job?.title||'직무 미확인',ctx)} × ${esc(t.industry||'산업 미정',ctx)}</h3></div></div><div class="grid2"><div><b>출발점</b><p>STEP 5 직무분석 없이 기본 정보로 시작했습니다.</p></div><div><b>STEP 7에서 확인할 것</b><p>이 직무가 산업과 기업에 따라 어떻게 달라지는지, 실제 채용공고에서 무엇을 요구하는지 확인</p></div></div></div>`;
    const a=deep.targetAnalyses?.[t.id]||deep.analyses?.[t.jobId]||{},selected=(a.sources||[]).find(x=>x.id===a.selectedSourceId)||(a.sources||[])[0],jt=a.jobTable||{};
    return `<div class="listCard"><div class="listHead"><div><span class="rankTag">Target ${i+1}</span><h3>${esc(job?.title||'직무 미확인',ctx)} × ${esc(t.industry||'산업 미정',ctx)}</h3></div></div><div class="grid2"><div><b>확인한 JD</b><p>${esc(selected?((selected.companyName?selected.companyName+' · ':'')+selected.name):'선택한 JD 없음',ctx)}</p></div><div><b>주요 과업</b><p>${esc(jt.tasks||'STEP 5 직무분석에서 확인 필요',ctx)}</p></div><div><b>필요역량</b><p>${esc(jt.competencies||'STEP 5 직무분석에서 확인 필요',ctx)}</p></div><div><b>STEP 7에서 확인할 것</b><p>이 직무가 산업과 기업에 따라 어떻게 달라지는지 확인</p></div></div></div>`;
  }).join('');
}
function selectJob(id,label,jobs){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${jobs.map(x=>`<option value="${x.id}">${x.title}</option>`).join('')}</select></div>`}function selectIndustry(id,label,inds){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${inds.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function today(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value||'';return [g('year'),g('month'),g('day')].join('-')}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

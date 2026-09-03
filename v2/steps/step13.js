import {renderMeasurePanel,bindMeasurePanel} from '../researchMeasures.js';

export async function render(ctx){
  const s=ctx.getState(),jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''},posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const saved=s.artifacts?.jobPortfolio||{positioning:'',gap:'',plan30:'',plan90:'',finalChecks:{gate:false,jd:false,facts:false,consistency:false,ready:false}};
  const data=structuredClone(saved);data.finalChecks=data.finalChecks||{};
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card portfolioStage">
    <div class="sectionHead"><div><div class="kicker">STEP 13</div><h2>AI Job Portfolio</h2><p>한 학기 동안 검증한 Career Evidence를 실제 지원 가능한 Job Application Package로 조립합니다.</p></div><span class="badge">14주차 · Workshop</span></div>
    <div class="progress"><span style="width:100%"></span></div>
    <div class="callout good"><b>14주차의 역할</b><br>새로운 내용을 만들어 채우는 시간이 아닙니다. Jobfit에 누적된 결과 중 <b>검증된 자료를 선택·편집·최종확인</b>합니다.</div>

    <div class="block"><h3>1. Portfolio Readiness</h3><div id="portfolioReadiness">${readinessHtml(s,ctx)}</div></div>

    <div class="hr"></div><div class="block"><h3>2. 최종 Positioning & GAP</h3>
      <div class="grid2">${area('positioning','한 문장 Positioning',data.positioning,'예: ○○ 경험을 통해 △△ 역량을 증명한 □□직무 지원자')}${area('gap','현재 핵심 GAP',data.gap,'지원 직무 기준으로 지금 가장 보완해야 할 1~3가지')}</div>
      <div class="grid2" style="margin-top:12px">${area('plan30','30일 Action Plan',data.plan30,'30일 안에 실행할 구체 행동·산출물')}${area('plan90','90일 Action Plan',data.plan90,'90일 안에 만들 경험·역량·지원행동')}</div>
      <div class="actions"><button class="btn primary" id="buildPortfolio">Portfolio 갱신</button><button class="btn outline" id="copyPortfolio">전체 내용 복사</button><button class="btn secondary" id="printPortfolio">인쇄 / PDF 저장</button></div>
    </div>

    <div class="hr"></div><div class="block"><h3>3. 최종 검증</h3>
      ${check('checkGate','Application Gate의 필수 지원자격을 원문과 대조했다.',data.finalChecks.gate)}
      ${check('checkJd','실제 지원할 기업·직무·채용공고를 기준으로 작성했다.',data.finalChecks.jd)}
      ${check('checkFacts','Portfolio에 포함된 행동·수치·성과를 원경험과 사실확인했다.',data.finalChecks.facts)}
      ${check('checkConsistency','이력서·자소서·면접에서 역할·기간·수치·핵심메시지가 일치한다.',data.finalChecks.consistency)}
      ${check('checkReady','Final Ready 자료와 아직 보완할 Draft/GAP를 구분했다.',data.finalChecks.ready)}
      <div id="portfolioGuard" style="margin-top:12px">${portfolioGuardHtml(s,ctx)}</div><div class="actions"><button class="btn primary" id="savePortfolio">최종 Job Portfolio 저장</button></div><div class="status" id="status"></div>
    </div>

    ${ctx.courseConfig.researchMeasures?renderMeasurePanel(ctx,'post'):''}
    <div class="hr"></div><div class="block"><h3>4. Portfolio Preview</h3><p class="help">Resume·Cover Letter·Interview는 Final Ready 상태를 우선 반영합니다. Draft는 최종 지원자료에 자동 포함하지 않습니다.</p><div id="portfolioPrint" class="portfolioPaper"></div></div>
  </section>`;

  renderPreview();
  document.getElementById('buildPortfolio').addEventListener('click',()=>{save(false);renderAll();ctx.toast('Portfolio를 갱신했습니다.');});
  document.getElementById('copyPortfolio').addEventListener('click',()=>copy(portfolioText(ctx.getState(),data),ctx));
  document.getElementById('printPortfolio').addEventListener('click',()=>{save(false);renderAll();window.print();});
  document.getElementById('savePortfolio').addEventListener('click',()=>save(true));
  if(ctx.courseConfig.researchMeasures)bindMeasurePanel(ctx,'post');

  function save(show){data.positioning=v('positioning');data.gap=v('gap');data.plan30=v('plan30');data.plan90=v('plan90');data.finalChecks={gate:document.getElementById('checkGate').checked,jd:document.getElementById('checkJd').checked,facts:document.getElementById('checkFacts').checked,consistency:document.getElementById('checkConsistency').checked,ready:document.getElementById('checkReady').checked};const systemReady=portfolioSystemReady(ctx.getState());data.status=systemReady&&Object.values(data.finalChecks).every(Boolean)?'final-ready':'draft';data.completedAt=data.status==='final-ready'?new Date().toISOString():data.completedAt||'';ctx.saveState({artifacts:{jobPortfolio:data}});if(show){document.getElementById('status').textContent=data.status==='final-ready'?'최종 Job Portfolio가 Final Ready로 저장되었습니다.':'Portfolio Draft를 저장했습니다. 위 경고와 검증항목을 확인하세요.';ctx.toast(data.status==='final-ready'?'Job Portfolio Final Ready':'Portfolio Draft 저장');}renderAll();}
  function renderAll(){const r=document.getElementById('portfolioReadiness'),g=document.getElementById('portfolioGuard');if(r)r.innerHTML=readinessHtml(ctx.getState(),ctx);if(g)g.innerHTML=portfolioGuardHtml(ctx.getState(),ctx);renderPreview()}
  function renderPreview(){document.getElementById('portfolioPrint').innerHTML=portfolioHtml(ctx.getState(),data,ctx)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}
}

function readiness(s){const p=selectedPosting(s),resume=s.artifacts?.resumeLab?.items||[],cover=s.artifacts?.coverLetterLab?.questions||[],human=s.artifacts?.humanFirst?.items||[],interview=s.artifacts?.interviewLab?.questions||[],assets=s.artifacts?.careerAssets?.assets||[],gate=gateState(p),verifiedAssets=assets.filter(isAssetVerified),resumeReady=resume.filter(isResumeReady),coverReady=cover.filter(isCoverReady),humanReady=human.filter(isHumanReady),interviewReady=interview.filter(isInterviewReady),core=(p?.requirements||[]).filter(r=>['업무핵심','필수'].includes(r.level)),critical=core.filter(r=>{const matches=assets.filter(a=>a.requirementId===r.id),best=bestEvidence(matches);return best==='없음'||best.startsWith('C')});return {p,gate,assets,verifiedAssets,resume,resumeReady,cover,coverReady,human,humanReady,interview,interviewReady,critical}}
function readinessHtml(s,ctx){const r=readiness(s);return `<div class="grid4"><div class="miniCard"><b>Application Gate</b><span>${r.gate.fail?`미충족 ${r.gate.fail}`:r.gate.check?`확인필요 ${r.gate.check}`:r.gate.ready?'확인완료':'검토필요'}</span></div><div class="miniCard"><b>Verified Career Asset</b><span>${r.verifiedAssets.length}/${r.assets.length}개</span></div><div class="miniCard"><b>Final Ready 지원서</b><span>Resume ${r.resumeReady.length} · Cover ${r.humanReady.length||r.coverReady.length}</span></div><div class="miniCard"><b>Interview / Critical GAP</b><span>Ready ${r.interviewReady.length} · GAP ${r.critical.length}</span></div></div>${r.critical.length?`<div class="callout warn"><b>핵심·필수 Critical GAP ${r.critical.length}개</b><br>${r.critical.map(x=>esc(x.text,ctx)).join(' · ')}</div>`:''}`}
function portfolioGuardHtml(s,ctx){const r=readiness(s),issues=[];if(!r.p)issues.push('Target JD 미등록');if(!r.gate.ready)issues.push(r.gate.fail?`Application Gate 미충족 ${r.gate.fail}개`:r.gate.check?`Application Gate 확인필요 ${r.gate.check}개`:'Application Gate 검토 미완료');if(!r.verifiedAssets.length)issues.push('검증된 Career Asset 없음');if(!r.resumeReady.length)issues.push('Final Ready Resume 없음');if(!r.humanReady.length&&!r.coverReady.length)issues.push('Final Ready Cover Letter 없음');if(!r.interviewReady.length)issues.push('Ready Interview Evidence 없음');if(r.critical.length)issues.push(`Critical GAP ${r.critical.length}개`);return issues.length?`<div class="callout warn"><b>현재 Portfolio는 Draft입니다.</b><br>${issues.map(x=>esc(x,ctx)).join(' · ')}<br><span class="muted">Critical GAP가 있다고 Portfolio 작성이 불가능한 것은 아니지만, 실제 지원 전 반드시 인지·보완전략을 정해야 합니다.</span></div>`:'<div class="callout good"><b>System Readiness 기본조건 충족</b><br>지원자격·Career Asset·Resume·Cover Letter·Interview의 검증된 자료가 연결되어 있습니다. 학생의 최종 체크 후 제출하세요.</div>'}
function portfolioSystemReady(s){const r=readiness(s);return !!r.p&&r.gate.ready&&r.verifiedAssets.length>0&&r.resumeReady.length>0&&(r.humanReady.length>0||r.coverReady.length>0)&&r.interviewReady.length>0}

function portfolioHtml(s,data,ctx){const p=selectedPosting(s),fit=s.artifacts?.careerFit||{},selected=fit.comparisons?.find(x=>x.id===fit.selectedId),jobs=getTargetJobs(s),ic=s.artifacts?.industryCompany||{},r=readiness(s),resumeReady=r.resumeReady,humanReady=r.humanReady,coverReady=r.coverReady,interviewReady=r.interviewReady,verifiedAssets=r.verifiedAssets;return `<article class="portfolioDoc"><div class="portfolioCover"><div class="kicker">AI JOB APPLICATION PORTFOLIO</div><h1>${esc(p?`${p.company} · ${p.jobTitle}`:'My Job Application Portfolio',ctx)}</h1><p>${esc(data.positioning||'한 문장 Positioning을 입력하세요.',ctx)}</p><div class="muted small">Jobfit Code: ${esc(s.profile?.anonCode||'—',ctx)} · Status: ${esc(data.status||'DRAFT',ctx)}</div></div>
  ${section('01 WHO I AM',careerProfile(s,ctx))}
  ${section('02 TARGET JOB',jobs.length?jobs.map((j,i)=>`<p><b>${i+1}. ${esc(j.title,ctx)}</b> · ${esc(j.family||'',ctx)}</p>`).join(''):'<p>Target Job 미입력</p>')}
  ${section('03 INDUSTRY & COMPANY',industryCompany(ic,ctx))}
  ${section('04 TARGET JD & APPLICATION GATE',p?targetJdHtml(p,ctx):'<p>Target JD 미등록</p>')}
  ${section('05 VERIFIED CAREER ASSETS',verifiedAssets.length?verifiedAssets.map((a,i)=>`<div class="portfolioItem"><b>Asset ${i+1}. ${esc(a.experienceTitle,ctx)}</b><p>${esc(a.proof||'',ctx)}</p><p><span class="muted">Evidence:</span> ${esc(a.fact||'',ctx)}</p><p><span class="muted">JD:</span> ${esc(a.requirement||'',ctx)} · ${esc(a.evidenceLevel||'',ctx)}</p></div>`).join(''):'<p>검증된 Career Asset 없음</p>')}
  ${section('06 RESUME · FINAL READY',resumeReady.length?resumeReady.map(x=>`<p>• ${esc(x.finalBullet||x.aiBullet||x.rawBullet||'',ctx)}</p>`).join(''):'<p>Final Ready Resume 없음</p>')}
  ${section('07 COVER LETTER · HUMAN-FIRST',humanReady.length?humanReady.map((x,i)=>`<div class="portfolioItem"><b>문항 ${i+1}</b><p>${esc(x.finalText||'',ctx)}</p></div>`).join(''):coverReady.length?coverReady.map((x,i)=>`<div class="portfolioItem"><b>문항 ${i+1} · Human-First 편집 전</b><p>${esc(x.draft||x.rawAnswer||'',ctx)}</p></div>`).join(''):'<p>Final Ready Cover Letter 없음</p>')}
  ${section('08 INTERVIEW EVIDENCE · READY',interviewReady.length?interviewReady.slice(0,10).map(q=>`<div class="portfolioItem"><b>${esc(q.question,ctx)}</b><p>${esc(q.answerOutline||'',ctx)}</p></div>`).join(''):'<p>Ready Interview Evidence 없음</p>')}
  ${section('09 CAREER FIT',selected?`<p>${esc(resolveFit(selected,s),ctx)}</p><p>${esc(selected.reasons||'',ctx)}</p><p><b>Risk/GAP</b> ${esc(selected.risks||'',ctx)}</p>`:'<p>중간 FIT 우선방향 미선택</p>')}
  ${section('10 CRITICAL GAP & ACTION PLAN',`${r.critical.length?`<p><b>JD Critical GAP</b><br>${r.critical.map(x=>esc(x.text,ctx)).join(' · ')}</p>`:''}<p><b>나의 핵심 GAP</b><br>${esc(data.gap||'—',ctx)}</p><p><b>30일</b><br>${esc(data.plan30||'—',ctx)}</p><p><b>90일</b><br>${esc(data.plan90||'—',ctx)}</p>`)}
  </article>`}
function targetJdHtml(p,ctx){const gates=p.gates||[];return `<p><b>${esc(p.company,ctx)} · ${esc(p.jobTitle,ctx)}</b></p><p>${esc(p.analysisNote||'JD 핵심해석을 입력하세요.',ctx)}</p>${gates.length?`<p><b>Application Gate</b><br>${gates.map(g=>`${esc(g.text,ctx)} — ${esc(g.status||'미확인',ctx)}`).join('<br>')}</p>`:'<p><b>Application Gate</b> 별도 조건 미등록 / 확인 필요</p>'}<p class="muted small">${esc(p.url||'',ctx)}</p>`}
function portfolioText(s,data){const temp={escapeHtml:x=>String(x??'')};return portfolioHtml(s,data,temp).replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<\/div>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\n{3,}/g,'\n\n').trim()}
function selectedPosting(s){const jd=s.artifacts?.jdAnalyzer||{};return jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0]}
function gateState(p){const fail=(p?.gates||[]).filter(x=>x.status==='미충족').length,check=(p?.gates||[]).filter(x=>x.status==='확인 필요').length;return {fail,check,ready:!!p?.gateReviewed&&!fail&&!check}}
function isAssetVerified(a){return !!a&&a.factCheck==='검증완료'&&a.sourceExperienceFactChecked!==false&&(a.evidenceLevel||legacyLevel(a.strength))!=='없음'}
function isResumeReady(x){return x.status==='final-ready'||(x.factChecked&&x.assetVerified)}function isCoverReady(x){return x.status==='final-ready'||(x.factChecked&&x.assetVerified&&x.requirementAligned)}function isHumanReady(x){return x.status==='final-ready'||(x.factChecked&&x.coverReady&&x.assetsVerified)}function isInterviewReady(x){return x.status==='ready'||(x.factCheck==='검증완료'&&x.evidenceVerified&&x.answerOutline)}
function bestEvidence(items=[]){if(!items.length)return '없음';const rank={'A · 직접 증거':4,'B · 관련 증거':3,'C · 간접 증거':2,'없음':1};return [...items].sort((a,b)=>(rank[b.evidenceLevel||legacyLevel(b.strength)]||0)-(rank[a.evidenceLevel||legacyLevel(a.strength)]||0))[0]?.evidenceLevel||legacyLevel(items[0]?.strength)}function legacyLevel(n){return n>=5?'A · 직접 증거':n>=3?'B · 관련 증거':n>=2?'C · 간접 증거':'없음'}
function careerProfile(s,ctx){const d=s.assessments?.careerDNA||{},ex=s.assessments?.experienceCompetency?.experiences||[],profile=s.artifacts?.careerDNAProfile||{};const comps=[...new Set(ex.flatMap(x=>x.competencies||[]))].slice(0,8),riasec=profile.riasecTop?.map(x=>x.code).join('·')||'',vals=profile.valueTop?.map(x=>x.name).join(', ')||'';return `<p><b>Career DNA</b> ${esc([riasec,vals].filter(Boolean).join(' / ')||'STEP 1 결과 참고',ctx)}</p><p><b>Evidence 기반 역량</b> ${esc(comps.join(', ')||'STEP 2 결과 참고',ctx)}</p>`}
function industryCompany(ic,ctx){const inds=(ic.targetIndustries||[]).map(id=>ic.industries?.find(x=>x.id===id)?.name).filter(Boolean),cos=(ic.targetCompanies||[]).map(id=>ic.companies?.find(x=>x.id===id)?.name).filter(Boolean);return `<p><b>Target Industry</b> ${esc(inds.join(', ')||'—',ctx)}</p><p><b>Target Company</b> ${esc(cos.join(', ')||'—',ctx)}</p>`}
function resolveFit(x,s){const jobs=getTargetJobs(s),ic=s.artifacts?.industryCompany||{};return `${jobs.find(j=>j.id===x.jobId)?.title||'직무'} × ${ic.industries?.find(i=>i.id===x.industryId)?.name||'산업'} × ${ic.companies?.find(c=>c.id===x.companyId)?.name||'기업'}`}
function getTargetJobs(s){const e=s.artifacts?.jobExplorer||{};return (e.targets||[]).map(id=>e.candidates?.find(x=>x.id===id)).filter(Boolean)}function section(title,body){return `<section class="portfolioSection"><h2>${title}</h2>${body}</section>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function check(id,text,on){return `<label class="checkRow"><input type="checkbox" id="${id}" ${on?'checked':''}><div><b>${text}</b></div></label>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('Portfolio 내용을 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

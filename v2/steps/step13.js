export async function render(ctx){
  const s=ctx.getState();
  const jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const saved=s.artifacts?.jobPortfolio||{positioning:'',gap:'',plan30:'',plan90:'',finalChecks:{jd:false,facts:false,consistency:false,ready:false}};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card portfolioStage">
    <div class="sectionHead"><div><div class="kicker">STEP 13</div><h2>AI Job Portfolio</h2><p>한 학기 동안 쌓인 데이터를 실제 지원 가능한 하나의 Job Application Package로 조립합니다.</p></div><span class="badge">14주차 · Workshop</span></div>
    <div class="progress"><span style="width:100%"></span></div>
    <div class="callout good"><b>14주차의 역할</b><br>새로운 자료를 처음부터 만드는 시간이 아닙니다. Jobfit에 누적된 결과를 불러와 <b>선택·편집·검증·완성</b>합니다.</div>

    <div class="block"><h3>1. 최종 Positioning & GAP</h3>
      <div class="grid2">${area('positioning','한 문장 Positioning',data.positioning,'예: ○○ 경험을 통해 △△ 역량을 증명한 □□직무 지원자')}${area('gap','현재 핵심 GAP',data.gap,'지원 직무 기준으로 지금 가장 보완해야 할 1~3가지')}</div>
      <div class="grid2" style="margin-top:12px">${area('plan30','30일 Action Plan',data.plan30,'30일 안에 실행할 구체 행동·산출물')}${area('plan90','90일 Action Plan',data.plan90,'90일 안에 만들 경험·역량·지원행동')}</div>
      <div class="actions"><button class="btn primary" id="buildPortfolio">Portfolio 갱신</button><button class="btn outline" id="copyPortfolio">전체 내용 복사</button><button class="btn secondary" id="printPortfolio">인쇄 / PDF 저장</button></div>
    </div>

    <div class="hr"></div><div class="block"><h3>2. 최종 검증</h3>
      ${check('checkJd','실제 지원할 기업·직무·채용공고를 기준으로 작성했다.',data.finalChecks.jd)}
      ${check('checkFacts','이력서·자소서·포트폴리오의 행동·수치·성과를 사실확인했다.',data.finalChecks.facts)}
      ${check('checkConsistency','서류와 면접에서 역할·기간·수치·핵심메시지가 일치한다.',data.finalChecks.consistency)}
      ${check('checkReady','현재 상태로 실제 지원에 사용할 수 있는 부분과 추가 보완할 부분을 구분했다.',data.finalChecks.ready)}
      <div class="actions"><button class="btn primary" id="savePortfolio">최종 Job Portfolio 저장</button></div><div class="status" id="status"></div>
    </div>

    <div class="hr"></div><div class="block"><h3>3. Portfolio Preview</h3><div id="portfolioPrint" class="portfolioPaper"></div></div>
  </section>`;

  renderPreview();
  document.getElementById('buildPortfolio').addEventListener('click',()=>{save(false);renderPreview();ctx.toast('Portfolio를 갱신했습니다.');});
  document.getElementById('copyPortfolio').addEventListener('click',()=>copy(portfolioText(ctx.getState(),data),ctx));
  document.getElementById('printPortfolio').addEventListener('click',()=>{save(false);renderPreview();window.print();});
  document.getElementById('savePortfolio').addEventListener('click',()=>save(true));

  function save(show){data.positioning=v('positioning');data.gap=v('gap');data.plan30=v('plan30');data.plan90=v('plan90');data.finalChecks={jd:document.getElementById('checkJd').checked,facts:document.getElementById('checkFacts').checked,consistency:document.getElementById('checkConsistency').checked,ready:document.getElementById('checkReady').checked};data.completedAt=data.finalChecks.jd&&data.finalChecks.facts&&data.finalChecks.consistency?new Date().toISOString():data.completedAt||'';ctx.saveState({artifacts:{jobPortfolio:data}});if(show){document.getElementById('status').textContent='최종 Job Portfolio를 저장했습니다.';ctx.toast('Job Portfolio 저장 완료');}renderPreview();}
  function renderPreview(){document.getElementById('portfolioPrint').innerHTML=portfolioHtml(ctx.getState(),data,ctx)}
  function v(id){return document.getElementById(id)?.value?.trim()||''}
}
function portfolioHtml(s,data,ctx){
  const jd=s.artifacts?.jdAnalyzer||{},p=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const fit=s.artifacts?.careerFit||{},selected=fit.comparisons?.find(x=>x.id===fit.selectedId);
  const jobs=getTargetJobs(s);const ic=s.artifacts?.industryCompany||{};const assets=s.artifacts?.careerAssets?.assets||[];const resume=s.artifacts?.resumeLab||{};const hf=s.artifacts?.humanFirst||{};const interview=s.artifacts?.interviewLab||{};
  return `<article class="portfolioDoc"><div class="portfolioCover"><div class="kicker">AI JOB APPLICATION PORTFOLIO</div><h1>${esc(p?`${p.company} · ${p.jobTitle}`:'My Job Application Portfolio',ctx)}</h1><p>${esc(data.positioning||'한 문장 Positioning을 입력하세요.',ctx)}</p><div class="muted small">Jobfit Code: ${esc(s.profile?.anonCode||'—',ctx)}</div></div>
  ${section('01 WHO I AM',careerProfile(s,ctx))}
  ${section('02 TARGET JOB',jobs.length?jobs.map((j,i)=>`<p><b>${i+1}. ${esc(j.title,ctx)}</b> · ${esc(j.family||'',ctx)}</p>`).join(''):'<p>Target Job 미입력</p>')}
  ${section('03 INDUSTRY & COMPANY',industryCompany(ic,ctx))}
  ${section('04 TARGET JD',p?`<p><b>${esc(p.company,ctx)} · ${esc(p.jobTitle,ctx)}</b></p><p>${esc(p.analysisNote||'JD 핵심해석을 입력하세요.',ctx)}</p><p class="muted small">${esc(p.url||'',ctx)}</p>`:'<p>Target JD 미등록</p>')}
  ${section('05 CAREER ASSETS',assets.length?assets.map((a,i)=>`<div class="portfolioItem"><b>Asset ${i+1}. ${esc(a.experienceTitle,ctx)}</b><p>${esc(a.proof||'',ctx)}</p><p><span class="muted">Evidence:</span> ${esc(a.fact||'',ctx)}</p><p><span class="muted">JD:</span> ${esc(a.requirement||'',ctx)}</p></div>`).join(''):'<p>Career Asset 미입력</p>')}
  ${section('06 RESUME',resume.items?.length?resume.items.map(x=>`<p>• ${esc(x.finalBullet||x.aiBullet||x.rawBullet||'',ctx)}</p>`).join(''):'<p>Resume 미입력</p>')}
  ${section('07 COVER LETTER',hf.items?.length?hf.items.map((x,i)=>`<div class="portfolioItem"><b>문항 ${i+1}</b><p>${esc(x.finalText||'',ctx)}</p></div>`).join(''):'<p>Human-First 최종 자소서 미입력</p>')}
  ${section('08 INTERVIEW EVIDENCE',interview.questions?.length?interview.questions.slice(0,10).map(q=>`<div class="portfolioItem"><b>${esc(q.question,ctx)}</b><p>${esc(q.answerOutline||'',ctx)}</p></div>`).join(''):'<p>Interview Evidence 미입력</p>')}
  ${section('09 CAREER FIT',selected?`<p>${esc(resolveFit(selected,s),ctx)}</p><p>${esc(selected.reasons||'',ctx)}</p><p><b>Risk/GAP</b> ${esc(selected.risks||'',ctx)}</p>`:'<p>중간 FIT 우선방향 미선택</p>')}
  ${section('10 GAP & ACTION PLAN',`<p><b>핵심 GAP</b><br>${esc(data.gap||'—',ctx)}</p><p><b>30일</b><br>${esc(data.plan30||'—',ctx)}</p><p><b>90일</b><br>${esc(data.plan90||'—',ctx)}</p>`)}
  </article>`;
}
function portfolioText(s,data){const temp={escapeHtml:x=>String(x??'')};return portfolioHtml(s,data,temp).replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<\/div>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\n{3,}/g,'\n\n').trim()}
function careerProfile(s,ctx){const d=s.assessments?.careerDNA||{};const ex=s.assessments?.experienceCompetency?.experiences||[];const comps=[...new Set(ex.flatMap(x=>x.competencies||[]))].slice(0,8);return `<p><b>Career DNA</b> ${esc(d.summary||d.reflection||'STEP 1 결과 참고',ctx)}</p><p><b>Evidence 기반 역량</b> ${esc(comps.join(', ')||'STEP 2 결과 참고',ctx)}</p>`}
function industryCompany(ic,ctx){const inds=(ic.targetIndustries||[]).map(id=>ic.industries?.find(x=>x.id===id)?.name).filter(Boolean);const cos=(ic.targetCompanies||[]).map(id=>ic.companies?.find(x=>x.id===id)?.name).filter(Boolean);return `<p><b>Target Industry</b> ${esc(inds.join(', ')||'—',ctx)}</p><p><b>Target Company</b> ${esc(cos.join(', ')||'—',ctx)}</p>`}
function resolveFit(x,s){const jobs=getTargetJobs(s),ic=s.artifacts?.industryCompany||{};return `${jobs.find(j=>j.id===x.jobId)?.title||'직무'} × ${ic.industries?.find(i=>i.id===x.industryId)?.name||'산업'} × ${ic.companies?.find(c=>c.id===x.companyId)?.name||'기업'}`}
function getTargetJobs(s){const e=s.artifacts?.jobExplorer||{};return (e.targets||[]).map(id=>e.candidates?.find(x=>x.id===id)).filter(Boolean)}function section(title,body){return `<section class="portfolioSection"><h2>${title}</h2>${body}</section>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function check(id,text,on){return `<label class="checkRow"><input type="checkbox" id="${id}" ${on?'checked':''}><div><b>${text}</b></div></label>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('Portfolio 내용을 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

export async function render(ctx){
  const s=ctx.getState();
  const saved=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 7</div><h2>JD Analyzer</h2><p>실제 채용공고 한 건을 기준으로 기업이 요구하는 Task·KSA·경험·도구·우대신호를 분해합니다.</p></div><span class="badge">9주차</span></div>
    <div class="progress"><span style="width:57%"></span></div>
    <div class="callout info"><b>원칙</b><br>AI가 일반적인 직무지식을 보태는 것이 아니라, <b>내가 붙여넣은 실제 채용공고에 적힌 내용</b>을 우선 분석합니다. 공고에 없는 내용은 별도로 표시합니다.</div>

    <div class="block"><h3>1. 실제 채용공고 등록</h3>
      <div class="grid3">
        ${txt('company','기업명','','예: ○○전자')}${txt('postingTitle','공고명','','예: 2026 하반기 신입채용')}${txt('jobTitle','지원직무','','예: 설비기술')}
        ${txt('source','공고 출처','','예: 기업 채용사이트')}${txt('url','공고 URL','','https://...')}${txt('closeDate','마감일','','YYYY-MM-DD')}
      </div>
      <div class="field" style="margin-top:12px"><label>채용공고 원문</label><textarea id="rawPosting" rows="12" placeholder="직무내용, 자격요건, 우대사항 등 분석할 공고 내용을 붙여넣으세요."></textarea></div>
      <div class="actions"><button class="btn primary" id="addPosting">채용공고 저장</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="postingList"></div></div>
    <div id="detailRoot"></div>
  </section>`;

  renderPostings();renderDetail();
  document.getElementById('addPosting').addEventListener('click',addPosting);

  function addPosting(){
    const company=v('company'),jobTitle=v('jobTitle');if(!company||!jobTitle){status('기업명과 지원직무를 입력하세요.');return;}
    const p={id:`jd_${Date.now()}`,company,postingTitle:v('postingTitle'),jobTitle,source:v('source'),url:v('url'),closeDate:v('closeDate'),rawPosting:v('rawPosting'),requirements:[],analysisNote:'',createdAt:new Date().toISOString()};
    data.postings.push(p);data.selectedId=p.id;persist();['company','postingTitle','jobTitle','source','url','closeDate','rawPosting'].forEach(id=>document.getElementById(id).value='');renderPostings();renderDetail();status('채용공고를 저장했습니다.');
  }
  function renderPostings(){
    const box=document.getElementById('postingList');if(!data.postings.length){box.innerHTML='<div class="placeholder"><b>등록된 채용공고가 없습니다.</b>실제로 지원해볼 공고를 하나 선택해 등록하세요.</div>';return;}
    box.innerHTML=data.postings.map(p=>`<div class="listCard"><div class="listHead"><div><span class="rankTag">JD</span><h3>${esc(p.company,ctx)} · ${esc(p.jobTitle,ctx)}</h3><div class="muted small">${esc(p.postingTitle||'',ctx)} ${p.closeDate?`· 마감 ${esc(p.closeDate,ctx)}`:''}</div></div><div class="actions" style="margin-top:0"><button class="btn ${data.selectedId===p.id?'primary':'outline'} smallBtn" data-select="${p.id}">분석</button><button class="btn danger smallBtn" data-del="${p.id}">삭제</button></div></div><div class="sourceLine"><b>출처</b> ${esc(p.source||'미입력',ctx)} ${p.url?`· <a href="${esc(p.url,ctx)}" target="_blank" rel="noopener">공고 열기</a>`:''}</div></div>`).join('');
    box.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>{data.selectedId=b.dataset.select;persist();renderPostings();renderDetail();}));
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.postings=data.postings.filter(x=>x.id!==b.dataset.del);if(data.selectedId===b.dataset.del)data.selectedId=data.postings[0]?.id||'';persist();renderPostings();renderDetail();}));
  }
  function renderDetail(){
    const box=document.getElementById('detailRoot');const p=data.postings.find(x=>x.id===data.selectedId);if(!p){box.innerHTML='';return;}
    box.innerHTML=`<div class="hr"></div><div class="block"><h3>2. ${esc(p.company,ctx)} ${esc(p.jobTitle,ctx)} — JD 구조화</h3>
      <div class="field"><label>AI 분석 프롬프트</label><textarea id="jdPrompt" rows="14">${esc(buildPrompt(p),ctx)}</textarea></div><div class="actions"><button class="btn secondary" id="copyJdPrompt">프롬프트 복사</button></div>
    </div>
    <div class="block"><h3>3. 공고에서 확인한 Requirement</h3><p class="help">공고의 요구를 하나씩 분리해 입력하세요. 가능하면 원문 의미를 훼손하지 않고 요약합니다.</p>
      <div class="grid3">${txt('reqText','요구사항','','예: 생산설비 데이터 분석 및 개선')}${sel('reqType','구분','',['Task','Knowledge','Skill','Attitude','Tool','Experience','Qualification','Preferred','기타'])}${sel('reqLevel','공고상 중요도','',['필수','우대','업무핵심','참고'])}</div>
      <div class="grid2" style="margin-top:12px">${area('reqSignal','역량 신호','','이 요구에서 드러나는 행동·역량 신호')}${area('reqSource','공고 근거','','어느 문구/섹션에서 확인했는지 요약')}</div>
      <div class="actions"><button class="btn primary" id="addReq">Requirement 추가</button></div><div id="reqList" style="margin-top:14px"></div>
    </div>
    <div class="hr"></div><div class="block"><h3>4. JD 핵심해석</h3>${area('analysisNote','내 해석',p.analysisNote,'이 공고가 실제로 가장 중요하게 보는 것은 무엇인지 3가지로 요약')}
      <div class="actions"><button class="btn primary" id="saveJD">JD 분석 저장</button><button class="btn secondary" id="nextStep">STEP 8 Career Asset Match →</button></div><div class="status" id="detailStatus"></div>
    </div>`;
    renderReqs(p);
    document.getElementById('copyJdPrompt').addEventListener('click',()=>copy(document.getElementById('jdPrompt').value,ctx));
    document.getElementById('addReq').addEventListener('click',()=>{const text=val('reqText');if(!text){ctx.toast('요구사항을 입력하세요.');return;}p.requirements.push({id:`jdr_${Date.now()}`,text,type:val('reqType'),level:val('reqLevel'),signal:val('reqSignal'),source:val('reqSource')});persist();['reqText','reqSignal','reqSource'].forEach(id=>document.getElementById(id).value='');renderReqs(p);ctx.toast('Requirement를 추가했습니다.');});
    document.getElementById('saveJD').addEventListener('click',()=>{p.analysisNote=val('analysisNote');persist();document.getElementById('detailStatus').textContent='JD 분석을 저장했습니다.';ctx.toast('JD 분석 저장 완료');});
    document.getElementById('nextStep').addEventListener('click',()=>{p.analysisNote=val('analysisNote');persist();ctx.navigate(8)});
  }
  function renderReqs(p){const box=document.getElementById('reqList');if(!p.requirements.length){box.innerHTML='<div class="placeholder"><b>Requirement가 아직 없습니다.</b>Task·자격·우대·도구·경험 요구를 분리해 입력하세요.</div>';return;}box.innerHTML=`<div class="matrixWrap"><table class="matrix"><thead><tr><th>요구사항</th><th>구분</th><th>중요도</th><th>역량신호</th><th>근거</th><th></th></tr></thead><tbody>${p.requirements.map(r=>`<tr><td><b>${esc(r.text,ctx)}</b></td><td>${esc(r.type,ctx)}</td><td>${esc(r.level,ctx)}</td><td>${esc(r.signal||'—',ctx)}</td><td>${esc(r.source||'—',ctx)}</td><td><button class="btn danger smallBtn" data-delreq="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table></div>`;box.querySelectorAll('[data-delreq]').forEach(b=>b.addEventListener('click',()=>{p.requirements=p.requirements.filter(x=>x.id!==b.dataset.delreq);persist();renderReqs(p);}));}
  function persist(){ctx.saveState({artifacts:{jdAnalyzer:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function val(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function buildPrompt(p){return `너는 채용공고 분석가다. 아래에 붙여넣은 실제 공고만 근거로 분석해줘. 일반적인 직무상식이나 기업정보를 임의로 추가하지 마. 공고에 없으면 '공고에서 확인되지 않음'이라고 표시해줘.\n\n[기업] ${p.company}\n[직무] ${p.jobTitle}\n[공고명] ${p.postingTitle||''}\n\n[채용공고 원문]\n${p.rawPosting||'(원문 미입력)'}\n\n다음 순서로 정리해줘.\n1. 실제 주요업무 Task\n2. 필수 자격요건\n3. 우대요건\n4. Knowledge / Skill / Attitude 신호\n5. 명시된 Tool·시스템·자격·언어\n6. 경험을 요구하거나 암시하는 부분\n7. 반복되는 핵심 키워드\n8. 이 공고가 중요하게 보는 것으로 판단되는 3가지와 그 근거 문구\n9. 지원자가 반드시 증명해야 할 Evidence 질문\n10. 자료에서 확인되지 않는 부분\n\n표현은 간결하게 하고, 각각 공고의 어느 내용에서 판단했는지 연결해줘.`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${value||''}" placeholder="${ph||''}"></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('JD 분석 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

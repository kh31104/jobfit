const params=new URLSearchParams(location.search);
const tool=params.get('tool')||'';
const picker=document.getElementById('toolPicker');

const MODULES=[
  {id:0,group:'START',title:'Career Start',desc:'현재 준비상태와 AI 활용 출발점을 기록합니다.',tag:'선택 · 장기과정 시작점'},
  {id:1,group:'SELF',title:'Career DNA',desc:'가치·강점·커리어 선호를 비교해 자기이해 가설을 만듭니다.',tag:'자기이해'},
  {id:2,group:'EXPERIENCE',title:'Experience & Competency',desc:'경험을 행동·결과·증거로 구조화하고 역량키워드를 찾습니다.',tag:'경험·역량'},
  {id:3,group:'JOB',title:'Job Explorer',desc:'강점과 경험역량을 활용할 수 있는 직무 후보를 넓게 탐색합니다.',tag:'직무탐색'},
  {id:4,group:'JOB',title:'Job Deep Dive',desc:'직무의 Task·KSA·KPI와 나의 경험 근거를 대조합니다.',tag:'직무분석'},
  {id:5,group:'MARKET',title:'Industry & Company',desc:'관심사와 가치기준을 산업·기업 탐색에 연결합니다.',tag:'산업·기업'},
  {id:6,group:'MARKET',title:'Career Fit Map',desc:'나·직무·산업·기업의 근거를 한 화면에서 비교합니다.',tag:'FIT 비교'},
  {id:7,group:'JD',title:'JD Analyzer',desc:'실제 채용공고에서 업무·자격·우대·역량신호를 읽습니다.',tag:'채용공고'},
  {id:8,group:'JD',title:'Career Asset Match',desc:'채용공고 요구사항과 나의 경험·역량 증거를 매칭합니다.',tag:'요구역량 매칭'},
  {id:9,group:'APPLICATION',title:'Resume Lab',desc:'검증된 경험을 직무 중심 이력서·경험기술 문장으로 바꿉니다.',tag:'이력서'},
  {id:10,group:'APPLICATION',title:'Cover Letter Lab',desc:'문항 의도와 경험 근거를 연결해 자기소개서 초안을 만듭니다.',tag:'자기소개서'},
  {id:11,group:'APPLICATION',title:'Interview Lab',desc:'경험 근거를 바탕으로 예상질문·답변·꼬리질문을 연습합니다.',tag:'면접'},
  {id:12,group:'APPLICATION',title:'Human-First Check',desc:'AI 문장을 사실과 자신의 언어에 맞게 다시 점검합니다.',tag:'최종검토'},
  {id:13,group:'PORTFOLIO',title:'AI Job Portfolio',desc:'선택한 결과물을 한 번에 모아 지원용 포트폴리오로 정리합니다.',tag:'포트폴리오'}
];
const GROUP_LABELS={START:'시작 설정',SELF:'자기이해',EXPERIENCE:'경험·역량',JOB:'직무',MARKET:'산업·기업·FIT',JD:'채용공고·매칭',APPLICATION:'지원서·면접',PORTFOLIO:'포트폴리오'};
const RECOMMENDED_DEPS={3:[1,2],4:[3],5:[3],6:[1,3,5],8:[2,7],9:[8],10:[8],11:[8],12:[9,10,11],13:[1,2,3,5,8,9,10,11,12]};
const COMPOSER_KEY='jobfit:v2:selective:composer';

installScheduleNeutralizer();
if(!tool)renderComposer();

function renderComposer(){
  picker.hidden=false;
  const saved=loadComposer();
  const selected=new Set(saved.selected||[]);
  picker.innerHTML=`
    <div class="sectionHead"><div><div class="kicker">BUILD YOUR CLASS</div><h2>사용할 모듈을 선택하세요</h2><p>하나만 선택해도 되고, 여러 개를 묶어 강의 흐름으로 사용할 수도 있습니다.</p></div></div>
    <div class="callout good"><b>선택형 운영 원칙</b><br>학생 화면에는 학교별 수업 일정 정보가 표시되지 않습니다. 선택한 모듈만 보이며, 저장 데이터도 선택형 수업용으로 분리됩니다.</div>
    <div id="moduleGroups"></div>
    <div class="composerBar">
      <p class="selectedSummary" id="selectedSummary"></p>
      <div id="dependencyNote"></div>
      <div class="composerActions">
        <button class="btn outline smallBtn" id="selectAll">전체 선택</button>
        <button class="btn outline smallBtn" id="clearAll">선택 해제</button>
        <button class="btn secondary" id="addRecommended">추천 선행모듈 함께 넣기</button>
        <button class="btn primary" id="makeClassLink">학생용 수업 링크 만들기</button>
      </div>
      <div id="linkResult"></div>
    </div>`;
  const groups=document.getElementById('moduleGroups');
  groups.innerHTML=Object.keys(GROUP_LABELS).map(group=>{
    const mods=MODULES.filter(m=>m.group===group);if(!mods.length)return '';
    return `<div class="moduleGroup"><h3>${GROUP_LABELS[group]}</h3><div class="moduleGrid">${mods.map(moduleCard).join('')}</div></div>`;
  }).join('');
  document.querySelectorAll('[data-module]').forEach(card=>{
    const input=card.querySelector('input');
    input.checked=selected.has(Number(card.dataset.module));card.classList.toggle('on',input.checked);
    input.addEventListener('change',()=>{card.classList.toggle('on',input.checked);saveAndRefresh();});
  });
  document.getElementById('selectAll').addEventListener('click',()=>{document.querySelectorAll('[data-module] input').forEach(x=>x.checked=true);refreshCards();saveAndRefresh();});
  document.getElementById('clearAll').addEventListener('click',()=>{document.querySelectorAll('[data-module] input').forEach(x=>x.checked=false);refreshCards();saveAndRefresh();});
  document.getElementById('addRecommended').addEventListener('click',()=>{const ids=currentSelection();const add=new Set(ids);ids.forEach(id=>(RECOMMENDED_DEPS[id]||[]).forEach(dep=>add.add(dep)));document.querySelectorAll('[data-module] input').forEach(x=>x.checked=add.has(Number(x.closest('[data-module]').dataset.module)));refreshCards();saveAndRefresh();});
  document.getElementById('makeClassLink').addEventListener('click',makeClassLink);
  refreshSummary();
}
function moduleCard(m){return `<label class="moduleCard" data-module="${m.id}"><div class="moduleCardTop"><input type="checkbox"><div><h4>${m.title}</h4><p>${m.desc}</p><span class="moduleTag">${m.tag}</span></div></div></label>`}
function currentSelection(){return [...document.querySelectorAll('[data-module] input:checked')].map(x=>Number(x.closest('[data-module]').dataset.module)).sort((a,b)=>a-b)}
function refreshCards(){document.querySelectorAll('[data-module]').forEach(c=>c.classList.toggle('on',c.querySelector('input').checked))}
function saveAndRefresh(){localStorage.setItem(COMPOSER_KEY,JSON.stringify({selected:currentSelection(),updatedAt:new Date().toISOString()}));refreshSummary();document.getElementById('linkResult').innerHTML=''}
function refreshSummary(){const ids=currentSelection(),titles=ids.map(id=>MODULES.find(m=>m.id===id)?.title).filter(Boolean);document.getElementById('selectedSummary').innerHTML=ids.length?`<b>${ids.length}개 선택:</b> ${titles.join(' → ')}`:'아직 선택한 모듈이 없습니다.';const missing=findMissingDeps(ids);document.getElementById('dependencyNote').innerHTML=missing.length?`<div class="callout warn" style="margin:0 0 10px"><b>선행 모듈 확인</b><br>${missing.map(x=>`${x.title}: ${x.missing.map(id=>MODULES.find(m=>m.id===id)?.title).join(', ')}`).join('<br>')}</div>`:'<div class="callout info" style="margin:0 0 10px">선택한 모듈은 기본 학습 흐름 순서로 실행됩니다.</div>'}
function findMissingDeps(ids){const set=new Set(ids);return ids.map(id=>{const deps=(RECOMMENDED_DEPS[id]||[]).filter(dep=>!set.has(dep));return {title:MODULES.find(m=>m.id===id)?.title,missing:deps}}).filter(x=>x.missing.length)}
function makeClassLink(){const ids=currentSelection();if(!ids.length){document.getElementById('linkResult').innerHTML='<div class="callout warn" style="margin-top:12px">사용할 모듈을 하나 이상 선택하세요.</div>';return;}const url=new URL('./index.html',location.href);url.searchParams.set('mode','selective');url.searchParams.set('modules',ids.join(','));url.searchParams.set('set',`custom-${ids.join('-')}`);const link=url.toString();document.getElementById('linkResult').innerHTML=`<div class="generatedLink" id="generatedLink">${escapeHtml(link)}</div><div class="composerActions" style="margin-top:8px"><button class="btn secondary smallBtn" id="copyClassLink">링크 복사</button><a class="btn outline smallBtn" id="previewClassLink" href="${escapeHtml(link)}" target="_blank" rel="noopener">학생 화면 미리보기 ↗</a></div>`;document.getElementById('copyClassLink').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(link);document.getElementById('copyClassLink').textContent='복사됨 ✓'}catch{document.getElementById('copyClassLink').textContent='직접 복사해 주세요'}})}
function loadComposer(){try{return JSON.parse(localStorage.getItem(COMPOSER_KEY)||'null')||{selected:[]}}catch{return {selected:[]}}}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function installScheduleNeutralizer(){
  const clean=root=>{
    root.querySelectorAll?.('.stepMeta').forEach(el=>el.remove());
    root.querySelectorAll?.('.badge,.kicker').forEach(el=>{if(/주차/.test(el.textContent||'')){const cleaned=(el.textContent||'').replace(/\s*[·•]?\s*\d+(?:\s*[–-]\s*\d+)?주차/g,'').trim();if(cleaned)el.textContent=cleaned;else el.remove();}});
  };
  clean(document);
  const observer=new MutationObserver(()=>clean(document));observer.observe(document.body,{childList:true,subtree:true});
}

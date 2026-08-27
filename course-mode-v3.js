(function(){
 const MODE_KEY='careerNavigationCourseModeV3';
 const VALID_MODES=['full','class'];
 let selectedMode='';

 function modeFromUrl(){
  const value=(new URLSearchParams(location.search).get('mode')||'').trim().toLowerCase();
  return VALID_MODES.includes(value)?value:'';
 }
 function readMode(){
  const fromUrl=modeFromUrl();
  if(fromUrl)return fromUrl;
  const saved=String(localStorage.getItem(MODE_KEY)||'').trim();
  return VALID_MODES.includes(saved)?saved:'';
 }
 function writeMode(mode){
  if(!VALID_MODES.includes(mode))return;
  selectedMode=mode;
  localStorage.setItem(MODE_KEY,mode);
 }
 function appNodes(){
  return ['progress','stepText','mobileStage','stageToggle','stageNav'].map(id=>document.getElementById(id)).filter(Boolean);
 }
 function setMainVisible(visible){
  appNodes().forEach(node=>node.classList.toggle('courseModeHidden',!visible));
  const main=document.querySelector('.wrap > main');
  if(main)main.classList.toggle('courseModeHidden',!visible);
 }
 function updateBranding(){
  const brandTitle=document.querySelector('.top .brand>div:last-child>div:first-child');
  const brandSub=document.querySelector('.top .brand>div:last-child .small');
  if(brandTitle)brandTitle.textContent='Career Navigation';
  if(brandSub)brandSub.textContent='Self Understanding → Career Roadmap';
  const hero=document.querySelector('.hero');
  if(hero){
   const h1=hero.querySelector('h1');
   const p=hero.querySelector('p');
   if(h1)h1.innerHTML='나를 이해하고,<br>커리어를 설계하다.';
   if(p)p.innerHTML='흥미·가치관·강점·경험·업무스타일 등 <b>오늘 수업에서 확인한 자기이해 결과</b>를 직무·산업·기업 탐색과 실제 채용공고 검증으로 연결해 나만의 <b>Career Roadmap</b>을 만들어 갑니다.';
  }
 }
 function modeLabel(mode){return mode==='class'?'오늘의 선택형 수업':'전체 Career Roadmap'}
 function renderActiveBanner(){
  let box=document.getElementById('courseModeActiveBanner');
  if(!box){
   box=document.createElement('div');
   box.id='courseModeActiveBanner';
   const progress=document.getElementById('progress');
   if(progress&&progress.parentNode)progress.parentNode.insertBefore(box,progress);
  }
  box.className='courseModeActiveBanner';
  box.innerHTML=`<div><span>현재 수업모드</span><b>${modeLabel(selectedMode)}</b></div><button class="ghost" type="button" onclick="changeCourseModeV3()">수업모드 변경</button>`;
 }
 function renderModeScreen(){
  let screen=document.getElementById('courseModeScreenV3');
  if(!screen){
   screen=document.createElement('section');
   screen.id='courseModeScreenV3';
   const hero=document.querySelector('.hero');
   if(hero&&hero.parentNode)hero.parentNode.insertBefore(screen,hero.nextSibling);
  }
  screen.className='courseModeScreenV3';
  screen.innerHTML=`
   <div class="courseModeIntro">
    <span class="courseModeEyebrow">CAREER ROADMAP START</span>
    <h2>오늘은 어떤 방식으로 진행할까요?</h2>
    <p>모든 검사를 한 번에 할 필요는 없습니다. 전체 로드맵을 차례대로 진행하거나, 오늘 수업에 필요한 자기이해 활동만 선택해 진행할 수 있습니다.</p>
   </div>
   <div class="courseModeGrid">
    <button class="courseModeCard" type="button" onclick="selectCourseModeV3('full')">
     <span class="courseModeIcon">◎</span>
     <span class="courseModeText"><b>전체 Career Roadmap</b><small>자기이해부터 직무·기업 탐색, GAP 분석, 30일 Action Plan까지 전체 과정을 진행합니다.</small></span>
     <span class="courseModeArrow">→</span>
    </button>
    <button class="courseModeCard" type="button" onclick="selectCourseModeV3('class')">
     <span class="courseModeIcon">▦</span>
     <span class="courseModeText"><b>오늘의 선택형 수업</b><small>수업 주제에 맞는 자기이해 모듈만 선택해 진행하고, 가능한 범위에서 결과와 다음 행동을 정리합니다.</small></span>
     <span class="courseModeArrow">→</span>
    </button>
   </div>
   <div class="courseModeNote"><b>기억하세요.</b> 검사를 많이 하는 것이 목표가 아닙니다. 오늘 얻은 자기이해 결과를 실제 진로탐색과 행동으로 연결하는 것이 목표입니다.</div>`;
 }
 function openModeScreen(){
  renderModeScreen();
  const screen=document.getElementById('courseModeScreenV3');
  if(screen)screen.classList.remove('courseModeHidden');
  const banner=document.getElementById('courseModeActiveBanner');
  if(banner)banner.classList.add('courseModeHidden');
  setMainVisible(false);
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function activateMode(mode,firstSelection){
  writeMode(mode);
  const screen=document.getElementById('courseModeScreenV3');
  if(screen)screen.classList.add('courseModeHidden');
  setMainVisible(true);
  renderActiveBanner();
  if(firstSelection&&typeof window.goStep==='function'){
   try{window.goStep(1)}catch(e){console.error(e)}
  }else if(typeof window.renderProgress==='function'){
   try{window.renderProgress()}catch(e){console.error(e)}
  }
 }
 window.selectCourseModeV3=function(mode){activateMode(mode,true)};
 window.changeCourseModeV3=function(){openModeScreen()};
 window.getCourseModeV3=function(){return selectedMode||readMode()};

 function install(){
  if(!document.querySelector('.hero')||!document.querySelector('.wrap > main')){setTimeout(install,60);return}
  if(!document.getElementById('courseModeV3Style')){
   const style=document.createElement('style');
   style.id='courseModeV3Style';
   style.textContent=`
    .courseModeHidden{display:none!important}
    .courseModeScreenV3{background:#fff;border:1px solid var(--line);border-radius:24px;padding:22px;margin:14px 0;box-shadow:0 8px 24px rgba(26,38,68,.05)}
    .courseModeIntro{text-align:center;max-width:760px;margin:0 auto 18px}.courseModeEyebrow{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.08em;color:#5448d7;background:#f0efff;border-radius:999px;padding:6px 9px}.courseModeIntro h2{font-size:26px;margin:12px 0 7px}.courseModeIntro p{color:var(--muted);line-height:1.65;margin:0}
    .courseModeGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.courseModeCard{width:100%;display:grid;grid-template-columns:50px 1fr 30px;gap:12px;align-items:center;text-align:left;border:2px solid var(--line);border-radius:19px;background:#fff;padding:18px;cursor:pointer;color:var(--text);transition:.18s ease}.courseModeCard:hover,.courseModeCard:focus{border-color:#8f87f3;background:#faf9ff;transform:translateY(-1px);outline:none}.courseModeIcon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#eef0ff,#f4edff);color:#5547dd;font-size:22px;font-weight:900}.courseModeText b,.courseModeText small{display:block}.courseModeText b{font-size:18px;margin-bottom:6px}.courseModeText small{font-size:13px;color:var(--muted);line-height:1.55}.courseModeArrow{font-size:22px;color:#6d63d8;font-weight:900}.courseModeNote{margin-top:14px;background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:12px 14px;color:#56627a;line-height:1.55;font-size:13px}
    .courseModeActiveBanner{display:flex;justify-content:space-between;align-items:center;gap:10px;border:1px solid #dcddff;background:#f8f8ff;border-radius:15px;padding:10px 12px;margin:12px 0}.courseModeActiveBanner span,.courseModeActiveBanner b{display:block}.courseModeActiveBanner span{font-size:11px;color:var(--muted);margin-bottom:2px}.courseModeActiveBanner b{font-size:14px;color:#37308f}.courseModeActiveBanner .ghost{padding:7px 10px;font-size:12px}
    @media(max-width:700px){.courseModeGrid{grid-template-columns:1fr}.courseModeScreenV3{padding:17px}.courseModeIntro h2{font-size:23px}.courseModeCard{grid-template-columns:44px 1fr 24px;padding:15px}.courseModeIcon{width:42px;height:42px}.courseModeText b{font-size:17px}.courseModeActiveBanner{align-items:flex-start}}
   `;
   document.head.appendChild(style);
  }
  updateBranding();
  renderModeScreen();
  selectedMode=readMode();
  if(selectedMode)activateMode(selectedMode,false);else openModeScreen();
 }
 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();

import {buildResearchExportPayload} from './research.js';
import {createResearchSyncToken,researchSyncStatus,submitResearchSnapshot} from './researchBackend.js';

const params=new URLSearchParams(location.search);
const REQUESTED_MODE=(params.get('mode')||'').toLowerCase();
const SELECTIVE_MODULES=parseSelectiveModules(params.get('modules'));
const SELECTIVE_SET=(params.get('set')||`modules-${SELECTIVE_MODULES.join('-')||'all'}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'custom';
const STORAGE_KEY=REQUESTED_MODE==='selective'?`jobfit:v2:selective-run:${SELECTIVE_SET}`:'jobfit:v2:learner';
const MAX_BACKUP_BYTES=5*1024*1024;

const STEPS=[
  ['Career Start','1주차'],['Career DNA','3주차'],['Experience & Competency','4주차'],['Job Explorer','6주차'],['Job Deep Dive','6주차'],['Industry & Company','7주차'],['Career Fit Map','8주차'],['JD Analyzer','9주차'],['Career Asset Match','9주차'],['Resume Lab','9주차'],['Cover Letter Lab','10주차'],['Interview Lab','11–12주차'],['Human-First Check','13주차'],['AI Job Portfolio','14주차']
];

const COURSE_PRESETS={
  INJE2026:{mode:'full',lockMode:true,interest:'CHOICE',research:false,researchMeasures:true,institution:'인제대학교'},
  'INJE-2026-2':{mode:'full',lockMode:true,interest:'CHOICE',research:false,researchMeasures:true,institution:'인제대학교'}
};

const DEFAULT_STATE={version:2.2,activeStep:0,mode:'full',profile:{},baseline:{},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{careerDNA:{},experienceCompetency:{experiences:[]}},artifacts:{},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}};

function parseSelectiveModules(raw){return [...new Set(String(raw||'').split(',').map(x=>Number(x.trim())).filter(x=>Number.isInteger(x)&&x>=0&&x<=13))].sort((a,b)=>a-b)}
function deepMerge(base,extra){if(!extra||typeof extra!=='object')return structuredClone(base);const out=structuredClone(base);for(const [k,v] of Object.entries(extra)){if(['__proto__','prototype','constructor'].includes(k))continue;if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]=deepMerge(out[k],v);else out[k]=v}return out}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?deepMerge(DEFAULT_STATE,JSON.parse(raw)):structuredClone(DEFAULT_STATE)}catch(e){console.warn(e);return structuredClone(DEFAULT_STATE)}}
let state=loadState();

const courseCode=(params.get('course')||state.profile.courseCode||'').trim();
const preset=COURSE_PRESETS[courseCode.toUpperCase()]||{};
const courseConfig={
  course:courseCode,
  mode:(params.get('mode')||preset.mode||'').toLowerCase(),
  lockMode:params.has('lockMode')?toBool(params.get('lockMode')):!!preset.lockMode,
  interest:(params.get('interest')||preset.interest||'choice').toUpperCase(),
  research:params.has('research')?toBool(params.get('research')):!!preset.research,
  researchMeasures:params.has('measures')?toBool(params.get('measures')):!!preset.researchMeasures,
  institution:preset.institution||'',
  preset:!!COURSE_PRESETS[courseCode.toUpperCase()]
};
if(!['S','L','CHOICE'].includes(courseConfig.interest))courseConfig.interest='CHOICE';
applyCourseConstraints();
if(state.mode==='selective'&&SELECTIVE_MODULES.length&&!SELECTIVE_MODULES.includes(Number(state.activeStep)))state.activeStep=SELECTIVE_MODULES[0];

function applyCourseConstraints(){if(['full','selective'].includes(courseConfig.mode))state.mode=courseConfig.mode;if(courseConfig.course)state.profile.courseCode=courseConfig.course;if(courseConfig.institution)state.profile.institution=courseConfig.institution;}
function toBool(v){return ['1','true','yes','on'].includes(String(v||'').toLowerCase())}
function saveState(patch){if(patch)state=deepMerge(state,patch);applyCourseConstraints();state.meta=state.meta||{};state.meta.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const el=document.getElementById('saveState');if(el){el.textContent='저장됨';setTimeout(()=>el.textContent='이 브라우저에 자동 저장',900)}renderHeroMeta();renderNav();return state}
function getState(){return state}function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2200)}function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function makeAnonCode(){
  const existing=String(state.profile?.anonCode||'');
  if(existing.startsWith('JF26-')){
    if(!state.meta?.anonCodeLocked||!state.meta?.anonCodeIssuedAt){
      saveState({meta:{anonCodeLocked:true,anonCodeIssuedAt:state.meta?.anonCodeIssuedAt||new Date().toISOString()}});
    }
    return existing;
  }
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',arr=new Uint32Array(6);
  crypto.getRandomValues(arr);
  const code=`JF26-${[...arr].map(n=>chars[n%chars.length]).join('')}`;
  saveState({profile:{anonCode:code},meta:{anonCodeLocked:true,anonCodeIssuedAt:new Date().toISOString()}});
  return code;
}
function backupFileName(){return `jobfit-${state.profile.anonCode||'mydata'}-${new Date().toISOString().slice(0,10)}.json`}
function makeBackupFile(){const exportedAt=new Date().toISOString(),backup=structuredClone(state);backup.meta=backup.meta||{};backup.meta.backupExportedAt=exportedAt;return {file:new File([JSON.stringify(backup,null,2)],backupFileName(),{type:'application/json'}),exportedAt}}
function markBackup(method,exportedAt){saveState({meta:{lastBackupAt:exportedAt,lastBackupMethod:method,backupConfirmed:false,backupConfirmedAt:null}})}
function downloadJSON(){const {file,exportedAt}=makeBackupFile(),a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);markBackup('download',exportedAt);toast('백업파일을 저장했습니다. 이메일·카카오톡·클라우드에도 보관하세요.');return file.name}
function downloadResearchJSON(){
  if(!state.profile?.anonCode){toast('익명코드를 먼저 생성해 주세요.');return null}
  const completedSteps=STEPS.map((_,i)=>i).filter(i=>isStepComplete(i,state));
  const payload=buildResearchExportPayload(state,{context:{cohortId:courseConfig.course||state.profile?.courseCode,institutionCode:courseConfig.institution||state.profile?.institution,programType:'university-course',programDuration:'semester'},completedSteps});
  const name=`jobfit-research-${state.profile.anonCode}-${new Date().toISOString().slice(0,10)}.json`;
  const file=new File([JSON.stringify(payload,null,2)],name,{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(file);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  saveState({meta:{lastResearchExportAt:payload.export_metadata.exported_at}});
  toast('연구용 파일을 저장했습니다. 활동 원문은 포함되지 않습니다.');
  return name;
}
async function syncResearchData(){
  const status=researchSyncStatus();if(!status.enabled)throw new Error('승인된 연구동의와 중앙 DB 연결이 아직 활성화되지 않았습니다.');
  if(!state.profile?.anonCode)throw new Error('익명코드를 먼저 생성해 주세요.');
  const completedSteps=STEPS.map((_,i)=>i).filter(i=>isStepComplete(i,state)),syncToken=state.research?.syncToken||createResearchSyncToken();
  const payload=buildResearchExportPayload(state,{context:{cohortId:courseConfig.course||state.profile?.courseCode,institutionCode:courseConfig.institution||state.profile?.institution,programType:'university-course',programDuration:'semester'},completedSteps});
  payload.consent_version=status.consentVersion;
  const result=await submitResearchSnapshot(payload,{consent:true,syncToken});
  saveState({research:{...state.research,syncToken,consent:{agreed:true,version:status.consentVersion,agreedAt:new Date().toISOString(),documentUrl:status.consentDocumentUrl}},meta:{lastResearchSyncAt:result.received_at||new Date().toISOString()}});
  return result;
}
async function shareBackup(){const {file,exportedAt}=makeBackupFile();if(!navigator.share||!navigator.canShare?.({files:[file]})){downloadJSON();return {shared:false,fallback:true}}try{await navigator.share({title:'Jobfit 백업파일',text:`Jobfit ${state.profile.anonCode||''} 백업파일입니다. 다음 수업 전까지 보관하세요.`,files:[file]});markBackup('share',exportedAt);toast('공유가 완료되었습니다. 보관 완료 체크를 눌러주세요.');return {shared:true,fallback:false}}catch(err){if(err?.name!=='AbortError')toast('공유하지 못했습니다. 백업 저장 버튼을 이용해 주세요.');return {shared:false,fallback:false,cancelled:err?.name==='AbortError'}}}
function requestImport(){const file=document.getElementById('importFile');if(file){file.value='';file.click()}}
async function importJSONFile(file){if(!file)return;if(file.size>MAX_BACKUP_BYTES){toast('백업 파일이 너무 큽니다. 5MB 이하 JSON 파일을 선택하세요.');return;}try{const text=await file.text(),parsed=JSON.parse(text),clean=sanitizeBackup(parsed);validateBackup(clean);const code=clean.profile?.anonCode||'코드 없음';const ok=confirm(`백업 ${code}을(를) 불러오면 현재 이 브라우저의 Jobfit 데이터가 교체됩니다. 계속할까요?`);if(!ok)return;state=deepMerge(DEFAULT_STATE,clean);state.activeStep=Number.isInteger(Number(state.activeStep))?Math.max(0,Math.min(13,Number(state.activeStep))):0;if(state.mode==='selective'&&SELECTIVE_MODULES.length&&!SELECTIVE_MODULES.includes(state.activeStep))state.activeStep=SELECTIVE_MODULES[0];state.meta=state.meta||{};state.meta.restoredAt=new Date().toISOString();applyCourseConstraints();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderHeroMeta();renderNav();await navigate(state.activeStep,{skipSave:true});toast(`백업을 복구했습니다: ${state.profile?.anonCode||'Jobfit 데이터'}`);}catch(err){console.error(err);toast(`백업을 불러오지 못했습니다: ${err.message||'파일을 확인하세요.'}`)}}
function sanitizeBackup(value){if(Array.isArray(value))return value.map(sanitizeBackup);if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))continue;out[k]=sanitizeBackup(v)}return out}return value}
function validateBackup(x){if(!x||typeof x!=='object'||Array.isArray(x))throw new Error('Jobfit JSON 형식이 아닙니다.');const version=Number(x.version);if(!Number.isFinite(version)||version<2)throw new Error('지원하지 않는 이전 버전입니다.');if(!x.profile||typeof x.profile!=='object')throw new Error('프로필 정보가 없습니다.');if(!x.assessments||typeof x.assessments!=='object')throw new Error('검사·경험 데이터 구조가 없습니다.');if(!x.artifacts||typeof x.artifacts!=='object')throw new Error('Career Roadmap 데이터 구조가 없습니다.')}
function applyCourseCode(code){const c=String(code||'').trim();if(!c)return;const q=new URLSearchParams(location.search);q.set('course',c);q.delete('mode');q.delete('modules');q.delete('set');q.delete('lockMode');q.delete('interest');q.delete('research');q.delete('measures');location.search=q.toString()}
function renderHeroMeta(){const el=document.getElementById('heroMeta'),bits=[];bits.push(state.mode==='full'?'전체 Career Roadmap':'선택형 Career Tools');if(state.mode==='full'&&state.profile.courseCode)bits.push(`수업 ${state.profile.courseCode}`);if(state.profile.anonCode)bits.push(state.profile.anonCode);if(state.mode==='full'&&courseConfig.interest!=='CHOICE')bits.push(`지정검사 ${courseConfig.interest}형`);if(state.mode==='full'&&courseConfig.researchMeasures)bits.push('PRE/POST 측정');el.innerHTML=bits.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}
function visibleStepIndexes(){return state.mode==='selective'&&SELECTIVE_MODULES.length?SELECTIVE_MODULES:STEPS.map((_,i)=>i)}
function renderNav(){const nav=document.getElementById('stepNav');if(!nav)return;const visible=visibleStepIndexes();nav.innerHTML=`<div class="sideTitle">${state.mode==='full'?'CAREER ROADMAP':'SELECTED CAREER TOOLS'}</div>`+visible.map((i,order)=>{const s=STEPS[i],meta=state.mode==='full'?`<span class="stepMeta">${s[1]}</span>`:'';return `<button class="stepBtn ${i===state.activeStep?'active':''}" data-step="${i}"><span class="stepN">${isStepComplete(i,state)?'✓':state.mode==='selective'?order+1:i}</span><span>${s[0]}${meta}</span></button>`}).join('');nav.querySelectorAll('.stepBtn').forEach(b=>b.addEventListener('click',()=>navigate(Number(b.dataset.step))))}
function isStepComplete(i,s){const a=s.artifacts||{},d=s.assessments||{};switch(i){case 0:return !!(s.profile?.anonCode&&s.baseline?.jobDecision);case 1:return !!(d.careerDNA?.hypothesis||d.careerDNA?.reflection||d.careerDNA?.selfSelectedStrengths?.length||d.careerDNA?.viaTop5?.length);case 2:return !!d.experienceCompetency?.experiences?.some?.(x=>x?.factChecked&&String(x?.action||'').trim());case 3:return !!a.jobExplorer?.targets?.length;case 4:return !!Object.keys(a.jobDeepDive?.analyses||{}).length;case 5:return !!(a.industryCompany?.targetIndustries?.length&&a.industryCompany?.targetCompanies?.length);case 6:return !!a.careerFit?.selectedId;case 7:return !!(a.jdAnalyzer?.selectedId&&a.jdAnalyzer?.postings?.length);case 8:return !!a.careerAssets?.assets?.length;case 9:return !!a.resumeLab?.items?.length;case 10:return !!a.coverLetterLab?.questions?.length;case 11:return !!a.interviewLab?.questions?.length;case 12:return !!a.humanFirst?.items?.length;case 13:return !!a.jobPortfolio?.finalChecks?.facts;default:return false}}
function resolveNavigationStep(requested){const step=Math.max(0,Math.min(13,Number(requested)));if(state.mode!=='selective'||!SELECTIVE_MODULES.length||SELECTIVE_MODULES.includes(step))return step;const current=Number(state.activeStep);if(step>current)return SELECTIVE_MODULES.find(x=>x>current)??current;if(step<current)return [...SELECTIVE_MODULES].reverse().find(x=>x<current)??current;return SELECTIVE_MODULES[0]}
function neutralizeSelectiveLabels(root){if(state.mode!=='selective')return;root.querySelectorAll('.badge').forEach(el=>{if(/주차/.test(el.textContent||''))el.remove()});root.querySelectorAll('.kicker').forEach(el=>{const t=(el.textContent||'').trim();if(/^STEP\s*\d+/i.test(t))el.textContent='SELECTIVE MODULE';else if(/주차/.test(t))el.textContent=t.replace(/\s*[·•]?\s*\d+(?:\s*[–-]\s*\d+)?주차/g,'').trim()||'SELECTIVE MODULE'});root.querySelectorAll('.stepMeta').forEach(el=>el.remove())}

let stepAccordionObserver=null;
function installStepAccordion(root,step){
  stepAccordionObserver?.disconnect?.();stepAccordionObserver=null;
  // STEP 0은 입력·저장 안정성을 위해 공통 아코디언을 적용하지 않는다.
  // STEP 1은 Career DNA 전용 토글(careerDnaUx.js)만 사용해 이중 클릭 핸들러를 방지한다.
  if(step===0||step===1){delete window.JobfitStepAccordion;return;}
  const section=root.querySelector(':scope > .card')||root.querySelector('.card');if(!section)return;
  const storageKey=`jobfit:accordion:${courseConfig.course||'default'}:${step}`;
  const readMode=()=>{try{return sessionStorage.getItem(storageKey)}catch{return null}};
  const writeMode=value=>{try{sessionStorage.setItem(storageKey,String(value))}catch{}};
  const rawBlocks=()=>[...section.querySelectorAll('.block')].filter(b=>!b.parentElement?.closest('.block'));
  const triggerFor=block=>block?.querySelector(':scope > .moduleHead')||block?.querySelector(':scope > .sectionHead')||block?.querySelector(':scope > h3')||null;
  const groups=()=>{
    const out=[];let current=null;
    rawBlocks().forEach(block=>{
      if(triggerFor(block)){current={block,followers:[]};out.push(current)}
      else if(current)current.followers.push(block);
    });
    return out;
  };
  const setOpen=(block,open)=>{
    if(!block)return;
    block.classList.toggle('jobfitAccordionOpen',!!open);
    const trigger=block.querySelector(':scope > .jobfitAccordionTrigger');
    trigger?.setAttribute('aria-expanded',open?'true':'false');
    const icon=trigger?.querySelector('.jobfitAccordionChevron');const iconText=open?'−':'+';if(icon&&icon.textContent!==iconText)icon.textContent=iconText;
    const group=groups().find(g=>g.block===block);
    (group?.followers||[]).forEach(follower=>follower.classList.toggle('jobfitAccordionFollowerHidden',!open));
  };
  const primaryBlocks=()=>groups().map(g=>g.block);
  const openOnly=block=>{
    const all=primaryBlocks();all.forEach(b=>setOpen(b,b===block));
    const idx=all.indexOf(block);if(idx>=0)writeMode(idx);
    block?.scrollIntoView?.({behavior:'smooth',block:'start'});
  };
  const toggleBlock=block=>{
    const isOpen=block.classList.contains('jobfitAccordionOpen');
    if(isOpen){setOpen(block,false);writeMode('none')}else openOnly(block);
  };
  const prepare=()=>{
    const gs=groups(),all=gs.map(g=>g.block);if(!all.length)return;
    gs.forEach(({block,followers})=>{
      followers.forEach(f=>f.classList.add('jobfitAccordionFollower'));
      if(block.dataset.jobfitAccordionReady==='1')return;
      const trigger=triggerFor(block);if(!trigger)return;
      block.dataset.jobfitAccordionReady='1';block.classList.add('jobfitAccordionBlock');
      trigger.classList.add('jobfitAccordionTrigger');trigger.setAttribute('role','button');trigger.setAttribute('tabindex','0');trigger.setAttribute('aria-expanded','false');
      if(!trigger.querySelector(':scope > .jobfitAccordionChevron')){
        const icon=document.createElement('span');icon.className='jobfitAccordionChevron';icon.textContent='+';icon.setAttribute('aria-hidden','true');trigger.appendChild(icon);
      }
      trigger.addEventListener('click',e=>{if(e.target.closest('button,a,input,select,textarea'))return;toggleBlock(block)});
      trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleBlock(block)}});
      setOpen(block,false);
    });
    let toolbar=section.querySelector(':scope > .jobfitAccordionToolbar');
    if(!toolbar){
      toolbar=document.createElement('div');toolbar.className='jobfitAccordionToolbar';
      toolbar.innerHTML='<span>항목 제목을 눌러 필요한 내용만 펼쳐보세요.</span><div><button type="button" class="btn outline smallBtn" data-acc-expand>전체 펼치기</button><button type="button" class="btn outline smallBtn" data-acc-collapse>전체 접기</button></div>';
      const head=section.querySelector(':scope > .sectionHead');(head||section.firstElementChild)?.insertAdjacentElement('afterend',toolbar);
      toolbar.querySelector('[data-acc-expand]')?.addEventListener('click',()=>{primaryBlocks().forEach(b=>setOpen(b,true));writeMode('all')});
      toolbar.querySelector('[data-acc-collapse]')?.addEventListener('click',()=>{primaryBlocks().forEach(b=>setOpen(b,false));writeMode('none')});
    }
    const mode=readMode();
    if(mode===null&&navigator.webdriver){all.forEach(b=>setOpen(b,true));return}
    if(mode==='all'){all.forEach(b=>setOpen(b,true));return}
    if(mode==='none'){all.forEach(b=>setOpen(b,false));return}
    if(all.some(b=>b.classList.contains('jobfitAccordionOpen')))return;
    const idx=mode!==null&&/^\d+$/.test(mode)?Number(mode):0;
    setOpen(all[Math.min(idx,all.length-1)],true);
  };
  window.JobfitStepAccordion={openBlock:block=>{prepare();const target=triggerFor(block)?block:groups().find(g=>g.followers.includes(block))?.block;if(target)openOnly(target)},refresh:prepare};
  prepare();
  stepAccordionObserver=new MutationObserver(()=>prepare());
  stepAccordionObserver.observe(section,{childList:true,subtree:true});
}
async function navigate(step,{skipSave=false}={}){state.activeStep=resolveNavigationStep(step);if(!skipSave)saveState();else{renderHeroMeta();renderNav()}const root=document.getElementById('stepRoot');root.innerHTML='<div class="card placeholder"><b>불러오는 중</b>선택한 모듈을 준비하고 있습니다.</div>';try{const mod=await import(`./steps/step${state.activeStep}.js?v=23`);root.innerHTML='';await mod.render(context);neutralizeSelectiveLabels(root);installStepAccordion(root,state.activeStep)}catch(err){console.error(err);root.innerHTML=`<div class="card callout warn"><b>선택한 모듈 화면을 불러오지 못했습니다.</b><br>새로고침 후 다시 시도해 주세요.<br><small>${escapeHtml(err.message)}</small></div>`}scrollTo({top:0,behavior:'smooth'})}

const context={STEPS,getState,saveState,toast,escapeHtml,makeAnonCode,courseConfig,navigate,applyCourseCode,downloadJSON,downloadResearchJSON,shareBackup,researchSyncStatus,syncResearchData};
document.getElementById('exportBtn').addEventListener('click',downloadJSON);document.getElementById('researchExportBtn')?.addEventListener('click',downloadResearchJSON);document.getElementById('importBtn').addEventListener('click',requestImport);document.getElementById('importFile').addEventListener('change',e=>importJSONFile(e.target.files?.[0]));renderHeroMeta();renderNav();navigate(state.activeStep||visibleStepIndexes()[0]||0);
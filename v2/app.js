import {buildResearchExportPayload} from './research.js';
import {createResearchSyncToken,researchSyncStatus,submitResearchSnapshot} from './researchBackend.js';

const STORAGE_KEY='jobfit:v2:learner';
const MAX_BACKUP_BYTES=5*1024*1024;

const STEPS=[
  ['Career Start','1주차'],['Career DNA','3주차'],['Career Roadmap','4주차'],['Job Explorer','6주차'],['Job Deep Dive','6주차'],['Industry & Company','7주차'],['Career Fit Map','8주차'],['JD Analyzer','9주차'],['Career Asset Match','9주차'],['Resume Lab','9주차'],['Cover Letter Lab','10주차'],['Interview Lab','11–12주차'],['Human-First Check','13주차'],['AI Job Portfolio','14주차']
];

const COURSE_PRESETS={
  INJE2026:{mode:'full',lockMode:true,interest:'CHOICE',research:false,researchMeasures:true,institution:'인제대학교'},
  'INJE-2026-2':{mode:'full',lockMode:true,interest:'CHOICE',research:false,researchMeasures:true,institution:'인제대학교'}
};

const DEFAULT_STATE={version:2.2,activeStep:0,mode:'full',profile:{},baseline:{},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{careerDNA:{},experienceCompetency:{experiences:[]}},artifacts:{},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}};

function deepMerge(base,extra){if(!extra||typeof extra!=='object')return structuredClone(base);const out=structuredClone(base);for(const [k,v] of Object.entries(extra)){if(['__proto__','prototype','constructor'].includes(k))continue;if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]=deepMerge(out[k],v);else out[k]=v}return out}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?deepMerge(DEFAULT_STATE,JSON.parse(raw)):structuredClone(DEFAULT_STATE)}catch(e){console.warn(e);return structuredClone(DEFAULT_STATE)}}
let state=loadState();

const params=new URLSearchParams(location.search);
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

function renderNav(){
  const nav=document.getElementById('stepNav'),allowed=allowedSteps();nav.innerHTML='';
  STEPS.forEach((s,i)=>{if(!allowed.includes(i))return;const b=document.createElement('button');b.className=`stepBtn ${state.activeStep===i?'active':''}`;b.dataset.step=i;b.innerHTML=`<span class="stepN">${isStepComplete(i,state)?'✓':i}</span><span><b>${escapeHtml(s[0])}</b><small>${escapeHtml(s[1])}</small></span>`;b.onclick=()=>navigate(i);nav.appendChild(b)});
}
function renderHeroMeta(){
  const modeEl=document.getElementById('modeState');if(modeEl)modeEl.textContent=state.mode==='full'?'전체 Career Roadmap':'선택형 수업';
  const courseEl=document.getElementById('courseState');if(courseEl)courseEl.textContent=courseConfig.course||'기본 코스';
  const savedEl=document.getElementById('saveState');if(savedEl&&!['저장됨','저장 중…'].includes(savedEl.textContent))savedEl.textContent='이 브라우저에 자동 저장';
}
function allowedSteps(){
  if(state.mode==='full')return STEPS.map((_,i)=>i);
  const selected=state.selectedModules||[];const set=new Set([0,...selected]);return [...set].filter(n=>Number.isInteger(n)&&n>=0&&n<STEPS.length).sort((a,b)=>a-b)
}
function navigate(step){const n=Number(step);if(!allowedSteps().includes(n)){toast('현재 코스에서 선택되지 않은 단계입니다.');return}state.activeStep=n;saveState();loadStep(n)}
async function loadStep(n){
  const root=document.getElementById('stepRoot');root.innerHTML='<div class="card"><div class="placeholder">화면을 불러오는 중입니다…</div></div>';
  try{const mod=await import(`./steps/step${n}.js?v=13`);await mod.render(ctx)}catch(e){console.error(e);root.innerHTML=`<div class="card"><div class="callout warn"><b>화면을 불러오지 못했습니다.</b><br>${escapeHtml(e.message||String(e))}</div></div>`}
}
function isStepComplete(i,s){
  if(i===0)return !!s.artifacts?.careerStartProfile?.statement;
  if(i===1)return !!s.assessments?.careerDNA?.interest?.type;
  if(i===2)return (s.assessments?.experienceCompetency?.experiences||[]).length>0;
  if(i===3)return (s.artifacts?.jobList||[]).length>0;
  if(i===4)return (s.artifacts?.jobCards||[]).length>0;
  if(i===5)return (s.artifacts?.companyCards||[]).length>0;
  if(i===6)return !!s.artifacts?.careerFitMap?.selectedJob;
  if(i===7)return (s.artifacts?.jdAnalysis||[]).length>0;
  if(i===8)return (s.artifacts?.careerAssetMatch||[]).length>0;
  if(i===9)return !!s.artifacts?.resume?.master;
  if(i===10)return !!s.artifacts?.coverLetter?.master;
  if(i===11)return (s.artifacts?.interviewBank||[]).length>0;
  if(i===12)return !!s.artifacts?.humanFirst?.checked;
  if(i===13)return !!s.artifacts?.portfolio?.complete;
  return false;
}
async function applyCoursePreset(){
  if(courseConfig.course)document.getElementById('courseInput').value=courseConfig.course;
  if(courseConfig.lockMode){document.getElementById('modeSelect').value=courseConfig.mode||'full';document.getElementById('modeSelect').disabled=true;document.getElementById('modeHint').textContent='이 수업은 교수자가 전체 로드맵 모드로 고정했습니다.'}
  if(courseConfig.mode&&['full','selective'].includes(courseConfig.mode)){state.mode=courseConfig.mode;saveState()}
}

const ctx={getState,saveState,navigate,toast,escapeHtml,courseConfig,STEPS};
await applyCoursePreset();renderHeroMeta();renderNav();await loadStep(state.activeStep);

document.getElementById('modeSelect').addEventListener('change',e=>{if(courseConfig.lockMode){e.target.value=courseConfig.mode;toast('이 수업은 모드가 고정되어 있습니다.');return}state.mode=e.target.value;saveState();if(state.mode==='selective')navigate(0)});
document.getElementById('exportBtn').addEventListener('click',downloadJSON);
document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>MAX_BACKUP_BYTES){toast('백업파일이 너무 큽니다. 5MB 이하의 Jobfit JSON을 선택해 주세요.');e.target.value='';return}try{const obj=JSON.parse(await file.text());if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('객체 형식 아님');if(!String(obj.version||'').match(/^2(?:\.|$)/))throw new Error('지원하지 않는 버전');state=deepMerge(DEFAULT_STATE,obj);applyCourseConstraints();saveState();await loadStep(state.activeStep);toast('백업을 불러왔습니다. 이어서 진행하세요.')}catch(err){console.warn(err);toast('Jobfit 백업파일을 확인해 주세요.')}finally{e.target.value=''}});
document.getElementById('researchExportBtn')?.addEventListener('click',downloadResearchJSON);
document.getElementById('researchSyncBtn')?.addEventListener('click',async()=>{try{const r=await syncResearchData();toast(`연구 DB 제출 완료 · ${r.snapshot_id||'저장됨'}`)}catch(e){toast(e.message||'연구 DB 제출에 실패했습니다.')}});
document.getElementById('courseInput').addEventListener('input',e=>{state.profile.courseCode=e.target.value.trim();saveState()});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveState()});
window.addEventListener('beforeunload',()=>saveState());

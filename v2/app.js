const STORAGE_KEY='jobfit:v2:learner';

const STEPS=[
  ['Career Start','1주차'],['Career DNA','3주차'],['Experience & Competency','4주차'],['Job Explorer','6주차'],['Job Deep Dive','6주차'],['Industry & Company','7주차'],['Career Fit Map','8주차'],['JD Analyzer','9주차'],['Career Asset Match','9주차'],['Resume Lab','9주차'],['Cover Letter Lab','10주차'],['Interview Lab','11–12주차'],['Human-First Check','13주차'],['AI Job Portfolio','14주차']
];

const COURSE_PRESETS={
  INJE2026:{mode:'full',lockMode:true,interest:'CHOICE',research:false},
  'INJE-2026-2':{mode:'full',lockMode:true,interest:'CHOICE',research:false}
};

const DEFAULT_STATE={version:2.1,activeStep:0,mode:'full',profile:{},baseline:{},research:{consent:false},assessments:{careerDNA:{},experienceCompetency:{experiences:[]}},artifacts:{},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}};

function deepMerge(base,extra){if(!extra||typeof extra!=='object')return structuredClone(base);const out=structuredClone(base);for(const [k,v] of Object.entries(extra)){if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]=deepMerge(out[k],v);else out[k]=v}return out}
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
  preset:!!COURSE_PRESETS[courseCode.toUpperCase()]
};
if(!['S','L','CHOICE'].includes(courseConfig.interest))courseConfig.interest='CHOICE';
if(['full','selective'].includes(courseConfig.mode))state.mode=courseConfig.mode;if(courseConfig.course)state.profile.courseCode=courseConfig.course;

function toBool(v){return ['1','true','yes','on'].includes(String(v||'').toLowerCase())}
function saveState(patch){if(patch)state=deepMerge(state,patch);state.meta.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const el=document.getElementById('saveState');if(el){el.textContent='저장됨';setTimeout(()=>el.textContent='이 브라우저에 자동 저장',900)}renderHeroMeta();renderNav();return state}
function getState(){return state}function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),1800)}function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function makeAnonCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',arr=new Uint32Array(6);crypto.getRandomValues(arr);return `JF26-${[...arr].map(n=>chars[n%chars.length]).join('')}`}
function downloadJSON(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`jobfit-${state.profile.anonCode||'mydata'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('내 데이터를 파일로 저장했습니다.')}
function applyCourseCode(code){const c=String(code||'').trim();if(!c)return;const q=new URLSearchParams(location.search);q.set('course',c);q.delete('mode');q.delete('lockMode');q.delete('interest');q.delete('research');location.search=q.toString()}
function renderHeroMeta(){const el=document.getElementById('heroMeta'),bits=[];bits.push(state.mode==='full'?'전체 Career Roadmap':'선택형 Career Tools');if(state.profile.courseCode)bits.push(`수업 ${state.profile.courseCode}`);if(state.profile.anonCode)bits.push(state.profile.anonCode);if(courseConfig.interest!=='CHOICE')bits.push(`지정검사 ${courseConfig.interest}형`);el.innerHTML=bits.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}
function renderNav(){const nav=document.getElementById('stepNav');if(!nav)return;nav.innerHTML=`<div class="sideTitle">${state.mode==='full'?'CAREER ROADMAP':'SELECT A CAREER TOOL'}</div>`+STEPS.map((s,i)=>`<button class="stepBtn ${i===state.activeStep?'active':''}" data-step="${i}"><span class="stepN">${isStepComplete(i,state)?'✓':i}</span><span>${s[0]}<span class="stepMeta">${s[1]}</span></span></button>`).join('');nav.querySelectorAll('.stepBtn').forEach(b=>b.addEventListener('click',()=>navigate(Number(b.dataset.step))))}
function isStepComplete(i,s){const a=s.artifacts||{},d=s.assessments||{};switch(i){case 0:return !!(s.profile?.anonCode&&s.baseline?.jobDecision);case 1:return !!d.careerDNA?.interest?.type;case 2:return !!d.experienceCompetency?.experiences?.length;case 3:return !!a.jobExplorer?.targets?.length;case 4:return !!Object.keys(a.jobDeepDive?.analyses||{}).length;case 5:return !!(a.industryCompany?.targetIndustries?.length&&a.industryCompany?.targetCompanies?.length);case 6:return !!a.careerFit?.selectedId;case 7:return !!(a.jdAnalyzer?.selectedId&&a.jdAnalyzer?.postings?.length);case 8:return !!a.careerAssets?.assets?.length;case 9:return !!a.resumeLab?.items?.length;case 10:return !!a.coverLetterLab?.questions?.length;case 11:return !!a.interviewLab?.questions?.length;case 12:return !!a.humanFirst?.items?.length;case 13:return !!a.jobPortfolio?.finalChecks?.facts;default:return false}}
async function navigate(step){state.activeStep=Math.max(0,Math.min(13,step));saveState();const root=document.getElementById('stepRoot');root.innerHTML='<div class="card placeholder"><b>불러오는 중</b>STEP을 준비하고 있습니다.</div>';try{const mod=await import(`./steps/step${state.activeStep}.js`);root.innerHTML='';await mod.render(context)}catch(err){console.error(err);root.innerHTML=`<div class="card callout warn"><b>STEP ${state.activeStep} 화면을 불러오지 못했습니다.</b><br>새로고침 후 다시 시도해 주세요.<br><small>${escapeHtml(err.message)}</small></div>`}scrollTo({top:0,behavior:'smooth'})}

const context={STEPS,getState,saveState,toast,escapeHtml,makeAnonCode,courseConfig,navigate,applyCourseCode};
document.getElementById('exportBtn').addEventListener('click',downloadJSON);renderHeroMeta();renderNav();navigate(state.activeStep||0);

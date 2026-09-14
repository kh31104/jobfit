const STORAGE_KEY='jobfit:v2:learner';
const DB_NAME='jobfit-v2-continuity';
const STORE_NAME='snapshots';
const SNAPSHOT_KEY='learner';
const INJE_CODES=new Set(['INJE2026','INJE-2026-2']);

function parseState(raw){try{return raw?JSON.parse(raw):null}catch{return null}}
function nonEmpty(v){return v!==undefined&&v!==null&&String(v).trim()!==''}
function hasLearningData(s){
  if(!s||typeof s!=='object')return false;
  if(nonEmpty(s.profile?.anonCode))return true;
  if(Object.values(s.baseline||{}).some(nonEmpty))return true;
  if(nonEmpty(s.assessments?.careerDNA?.interest?.type))return true;
  if((s.assessments?.experienceCompetency?.experiences||[]).length)return true;
  if(Object.keys(s.artifacts||{}).length)return true;
  const pre=s.research?.measurements?.pre||{};
  return Object.keys(pre).some(k=>pre[k]&&Object.keys(pre[k]).length);
}
function richness(s){
  if(!hasLearningData(s))return 0;
  let score=0;
  if(nonEmpty(s.profile?.anonCode))score+=20;
  score+=Object.values(s.profile||{}).filter(nonEmpty).length;
  score+=Object.values(s.baseline||{}).filter(nonEmpty).length*2;
  score+=Object.keys(s.artifacts||{}).length*3;
  score+=(s.assessments?.experienceCompetency?.experiences||[]).length*3;
  if(nonEmpty(s.assessments?.careerDNA?.interest?.type))score+=5;
  return score;
}
function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){resolve(null);return;}
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB unavailable'));
  });
}
async function readMirror(){
  const db=await openDb();if(!db)return null;
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,'readonly');const req=tx.objectStore(STORE_NAME).get(SNAPSHOT_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}finally{db.close()}
}
async function writeMirror(state){
  if(!hasLearningData(state))return false;
  const db=await openDb();if(!db)return false;
  try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(state,SNAPSHOT_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});return true}finally{db.close()}
}
function shouldRestore(current,mirror){
  if(!hasLearningData(mirror))return false;
  if(!hasLearningData(current))return true;
  const a=String(current?.profile?.anonCode||''),b=String(mirror?.profile?.anonCode||'');
  if(a&&b&&a!==b)return false;
  return richness(mirror)>richness(current)+2;
}
export async function restoreBeforeApp(){
  try{
    const current=parseState(localStorage.getItem(STORAGE_KEY));
    const mirror=await readMirror();
    if(shouldRestore(current,mirror)){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(mirror));
      sessionStorage.setItem('jobfit:continuity-restored','1');
      return true;
    }
    if(hasLearningData(current))await writeMirror(current);
  }catch(err){console.warn('Jobfit continuity restore skipped',err)}
  return false;
}

let lastRaw='';
async function syncNow(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY)||'';
    if(!raw||raw===lastRaw)return false;
    const state=parseState(raw);
    if(!hasLearningData(state))return false;
    const ok=await writeMirror(state);if(ok)lastRaw=raw;return ok;
  }catch(err){console.warn('Jobfit continuity mirror skipped',err);return false}
}
function formatSavedAt(value){
  if(!value)return '저장 시각 기록 없음';
  const d=new Date(value);if(Number.isNaN(d.getTime()))return '저장 시각 기록 없음';
  return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
}
function currentCourse(){return (new URLSearchParams(location.search).get('course')||'').trim().toUpperCase()}
function mountStatus(){
  if(!INJE_CODES.has(currentCourse()))return;
  const root=document.getElementById('stepRoot');if(!root)return;
  const kicker=root.querySelector('.kicker');if(!kicker||!kicker.textContent.includes('STEP 0'))return;
  const existing=root.querySelector('#jobfitContinuityStatus');
  const state=parseState(localStorage.getItem(STORAGE_KEY))||{};
  const found=hasLearningData(state),code=String(state.profile?.anonCode||'');
  const restored=sessionStorage.getItem('jobfit:continuity-restored')==='1';
  const html=found
    ? `<b>${restored?'이 브라우저의 보조 저장에서 이전 자료를 복구했습니다.':'이 브라우저의 이전 Jobfit 자료를 찾았습니다.'}</b><br>${code?`익명코드 <b>${code}</b> · `:''}마지막 저장 ${formatSavedAt(state.meta?.updatedAt)}<br><span class="muted">같은 기기에서도 <b>매주 같은 브라우저</b>로 접속하면 이전 결과가 이어집니다. 기기나 브라우저를 바꿀 때는 내 학습 백업파일(JSON)을 불러오세요.</span>`
    : `<b>이 브라우저에서 이전 Jobfit 자료를 찾지 못했습니다.</b><br><span class="muted">다른 기기·다른 브라우저에서 접속했거나 브라우저 자료가 지워졌다면 <b>내 학습 백업파일(JSON)</b>을 불러오세요. 저장해 둔 익명코드만 있다면 아래 ‘기존 코드 불러오기’로 같은 학생 코드는 유지할 수 있지만, 과거 작성내용 자체는 복구되지 않습니다.</span><div class="actions" style="margin-top:10px"><button class="btn secondary smallBtn" id="continuityImportBtn" type="button">내 학습 백업 불러오기</button></div>`;
  if(existing){if(existing.dataset.mode!==(found?'found':'missing')){existing.dataset.mode=found?'found':'missing';existing.innerHTML=html}return;}
  const box=document.createElement('div');box.id='jobfitContinuityStatus';box.className=`callout ${found?'good':'warn'}`;box.dataset.mode=found?'found':'missing';box.style.marginTop='12px';box.innerHTML=html;
  const anchor=root.querySelector('.journeyStrip')||root.querySelector('.sectionHead');anchor?.insertAdjacentElement('afterend',box);
  box.querySelector('#continuityImportBtn')?.addEventListener('click',()=>document.getElementById('importBtn')?.click());
}
async function requestPersistentStorage(){try{if(navigator.storage?.persisted&&navigator.storage?.persist){if(!(await navigator.storage.persisted()))await navigator.storage.persist()}}catch{}}

export function startContinuity(){
  requestPersistentStorage();
  syncNow();
  const timer=setInterval(()=>syncNow(),1200);
  const observer=new MutationObserver(()=>mountStatus());observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>syncNow());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncNow()});
  mountStatus();
  window.JobfitStorageContinuity={syncNow,hasLearningData:()=>hasLearningData(parseState(localStorage.getItem(STORAGE_KEY))),stop:()=>{clearInterval(timer);observer.disconnect()}};
}

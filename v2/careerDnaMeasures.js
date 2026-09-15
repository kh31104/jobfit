const FUNCTION_NAME='career-dna-measures';
const SESSION_KEY='jobfit:career-dna-measures:v1';

function config(){return globalThis.JOBFIT_RESEARCH_CONFIG||{}}
function readCache(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
function validScale(scale){return !!(scale&&scale.version&&Array.isArray(scale.items)&&scale.items.length===40&&scale.response?.min===1&&scale.response?.max===6&&scale.scoring&&Array.isArray(scale.anchors)&&scale.anchors.length===8)}

export async function loadCareerAnchorScale(course){
  const cached=readCache();
  if(validScale(cached))return cached;
  const c=config();
  if(!c.supabaseUrl||!c.publishableKey)throw new Error('Career Anchor 검사 연결 설정을 확인해 주세요.');
  const res=await fetch(`${String(c.supabaseUrl).replace(/\/$/,'')}/functions/v1/${FUNCTION_NAME}`,{
    method:'POST',
    headers:{apikey:c.publishableKey,'Content-Type':'application/json'},
    body:JSON.stringify({course:String(course||'').trim().toUpperCase()})
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok||!body?.ok||!validScale(body.careerAnchor))throw new Error('Career Anchor 문항을 불러오지 못했습니다.');
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(body.careerAnchor));
  return body.careerAnchor;
}

export function clearCareerAnchorScaleCache(){sessionStorage.removeItem(SESSION_KEY)}

const PARTICIPANT_KEY='jobfit:classroom-vote-id:v1';

function config(){return globalThis.JOBFIT_RESEARCH_CONFIG||{}}
function koreaDate(){
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return `${p.year}${p.month}${p.day}`;
  }catch{
    const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
}
function uuid(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const a=new Uint8Array(16);globalThis.crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
  const h=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function participantId(){let id=localStorage.getItem(PARTICIPANT_KEY);if(!id){id=uuid();localStorage.setItem(PARTICIPANT_KEY,id)}return id}
export function classSessionCode(course='CLASS'){
  const explicit=(new URLSearchParams(location.search).get('session')||'').trim();
  if(/^[A-Za-z0-9._:-]{1,80}$/.test(explicit))return explicit;
  const safe=String(course||'CLASS').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32)||'CLASS';
  return `${safe}-${koreaDate()}`;
}
async function rpc(name,payload){
  const c=config();if(!c.supabaseUrl||!c.publishableKey)throw new Error('수업 투표 연결 설정이 없습니다.');
  const res=await fetch(`${String(c.supabaseUrl).replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
  const text=await res.text();if(!res.ok)throw new Error(`vote_http_${res.status}`);if(!text)return null;try{return JSON.parse(text)}catch{return text}
}
export async function castBalanceVote(course,questionIndex,choice){
  await rpc('cast_value_vote',{p_participant_id:participantId(),p_session_code:classSessionCode(course),p_question_no:Number(questionIndex)+1,p_choice:String(choice).toUpperCase()});
  return getBalanceCounts(course,questionIndex);
}
export async function getBalanceCounts(course,questionIndex){
  const data=await rpc('get_value_vote_counts',{p_question_no:Number(questionIndex)+1,p_session_code:classSessionCode(course)});
  const row=Array.isArray(data)?data[0]:data||{};const a=Number(row.a_count||0),b=Number(row.b_count||0),total=Number(row.total_count||0);
  return{a,b,total,aPercent:Number(row.a_percent??(total?a/total*100:0)),bPercent:Number(row.b_percent??(total?b/total*100:0))};
}

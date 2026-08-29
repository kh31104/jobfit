(function(){
 const SUPABASE_URL='https://hllnoriffbhzpyhpnvsf.supabase.co';
 const SUPABASE_KEY='sb_publishable_5rar9UtV4SbceAOwoAbwBw_LEp6XB7L';
 const PARTICIPANT_KEY='careerNavigationParticipantIdV1';

 function explicitSessionCode(){
  const raw=(new URLSearchParams(location.search).get('session')||'').trim();
  return /^[A-Za-z0-9._:-]{1,80}$/.test(raw)?raw:'';
 }
 function koreaDateCode(){
  try{
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
   const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
   return `${p.year}${p.month}${p.day}`;
  }catch(e){
   const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
 }
 function sessionCode(){
  return explicitSessionCode()||`DAILY2-${koreaDateCode()}`;
 }
 function sessionLabel(){return explicitSessionCode()?'이 수업':'오늘 참여자'}

 function createUuid(){
  if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
  const b=new Uint8Array(16);window.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
 }

 function participantId(){
  let id=localStorage.getItem(PARTICIPANT_KEY);
  if(!id){id=createUuid();localStorage.setItem(PARTICIPANT_KEY,id)}
  return id;
 }

 async function rpc(name,payload){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
   method:'POST',
   headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(payload)
  });
  const text=await res.text();
  if(!res.ok)throw new Error(`HTTP ${res.status} ${text||''}`.trim());
  if(!text)return null;
  try{return JSON.parse(text)}catch(e){return text}
 }

 async function castVote(questionIndex,choice){
  return rpc('cast_value_vote',{
   p_participant_id:participantId(),
   p_session_code:sessionCode(),
   p_question_no:Number(questionIndex)+1,
   p_choice:String(choice).toUpperCase()
  });
 }

 async function voteCounts(questionIndex){
  const data=await rpc('get_value_vote_counts',{
   p_question_no:Number(questionIndex)+1,
   p_session_code:sessionCode()
  });
  const row=Array.isArray(data)?data[0]:data;
  return row||{a_count:0,b_count:0,total_count:0,a_percent:0,b_percent:0};
 }

 window.CareerVoteRepository={
  mode:'supabase',
  sessionCode,
  sessionLabel,
  participantId,
  async vote(questionIndex,choice){
   await castVote(questionIndex,choice);
   return this.counts(questionIndex);
  },
  async counts(questionIndex){
   const c=await voteCounts(questionIndex);
   const a=Number(c.a_count||0),b=Number(c.b_count||0),total=Number(c.total_count||0);
   return{
    a,b,total,
    aPercent:Number(c.a_percent??(total?a/total*100:0)),
    bPercent:Number(c.b_percent??(total?b/total*100:0))
   };
  }
 };

 function install(){
  if(typeof window.chooseBalance!=='function'||typeof window.renderBalance!=='function'){
   setTimeout(install,60);return;
  }

  window.chooseBalance=async function(i,choice){
   const normalized=String(choice).toLowerCase();
   balanceAnswers[i]=normalized;
   buildValueProfile();
   save();
   window.renderBalance();
   renderValueSelection();
   try{
    await castVote(i,normalized);
    window.__careerVoteConnectionError='';
   }catch(err){
    console.error('Supabase value vote failed',err);
    window.__careerVoteConnectionError='투표 저장 연결이 원활하지 않습니다.';
   }
   window.renderBalance();
  };

  window.renderBalance=function(){
   const box=el('balanceQuestions');if(!box)return;
   const scopeLabel=sessionLabel();
   box.innerHTML=BALANCE_QUESTIONS.map((q,i)=>{
    const answer=String(balanceAnswers[i]||'').toLowerCase();
    const voteArea=answer
     ?`<div class="voteResult" id="voteResult${i}"><div class="voteStat" style="grid-column:1/-1">${scopeLabel} 투표율 불러오는 중...</div></div>`
     :`<div class="voteResult" id="voteResult${i}"><div class="voteStat" style="grid-column:1/-1">먼저 선택하면 실제 참여자 투표율이 표시됩니다.</div></div>`;
    return `<div class="balanceCard"><h3>${i+1}. 나의 선택은?</h3><div class="choiceGrid"><button class="choiceBtn ${answer==='a'?'selected':''}" onclick="chooseBalance(${i},'a')"><b>A</b><br>${esc(q.a)}</button><button class="choiceBtn ${answer==='b'?'selected':''}" onclick="chooseBalance(${i},'b')"><b>B</b><br>${esc(q.b)}</button></div>${voteArea}${answer?`<div class="valueHint">나의 선택 키워드 · ${esc(valueLabel(answer==='a'?q.av:q.bv))}</div>`:''}</div>`;
   }).join('');

   BALANCE_QUESTIONS.forEach(async(_,i)=>{
    const answer=String(balanceAnswers[i]||'').toLowerCase();if(!answer)return;
    const r=el('voteResult'+i);if(!r)return;
    try{
     const c=await voteCounts(i);
     const a=Number(c.a_count||0),b=Number(c.b_count||0),total=Number(c.total_count||0);
     const ap=Number(c.a_percent||0),bp=Number(c.b_percent||0);
     r.innerHTML=`<div class="voteStat"><b>A ${ap.toFixed(1)}%</b> · ${a}표</div><div class="voteStat"><b>B ${bp.toFixed(1)}%</b> · ${b}표</div><div class="small muted" style="grid-column:1/-1;margin-top:6px">${scopeLabel} ${total}명 기준 · 내 선택 후 공개</div>`;
    }catch(err){
     console.error('Supabase vote counts failed',err);
     r.innerHTML='<div class="voteStat" style="grid-column:1/-1">현재 투표율을 불러오지 못했습니다. 내 선택은 저장되며 다음 활동은 계속 진행할 수 있습니다.</div>';
    }
   });

   const ranked=competitionRanking(),summary=el('valueSummary');
   if(summary)summary.innerHTML=balanceAnswers.filter(Boolean).length===7?`<div class="valueSummary"><div class="small">나의 직업가치관 힌트</div><h2 style="margin:5px 0 10px">밸런스게임에서 자주 선택한 가치</h2><div class="pillbox">${ranked.slice(0,3).map(x=>`<span class="pill">${esc(valueLabel(x.value))} ${x.count}회</span>`).join('')}</div></div>`:'';
  };

  window.renderBalance();
 }

 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();

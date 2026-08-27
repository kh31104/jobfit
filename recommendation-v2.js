(function(){
 const MODEL_VERSION='role-signal-v2.0';

 function install(){
  if(typeof window.integratedScores!=='function'||typeof window.roleRecommendations!=='function'||typeof VIA==='undefined'||typeof MI==='undefined'){
   setTimeout(install,60);return;
  }

  const ORIGINAL_INTEGRATED=window.integratedScores;
  const ORIGINAL_RENDER_INTEGRATED=window.renderIntegrated;

  function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function roleUniverse(){
   return uniq([...VIA.flatMap(x=>x.roles||[]),...MI.flatMap(x=>x.roles||[])]);
  }
  function roleFrequency(source,role){
   return source.reduce((n,item)=>n+((item.roles||[]).includes(role)?1:0),0);
  }
  function sourceMeanVariance(total,supportCount){
   const weights=[3,2,1],p=supportCount/total;
   const mean=weights.reduce((a,w)=>a+w*p,0);
   let variance=weights.reduce((a,w)=>a+w*w*p*(1-p),0);
   if(total>1){
    const p2=supportCount*(supportCount-1)/(total*(total-1));
    const covariance=p2-p*p;
    for(let i=0;i<weights.length;i++)for(let j=i+1;j<weights.length;j++)variance+=2*weights[i]*weights[j]*covariance;
   }
   return {mean,variance:Math.max(variance,0)};
  }
  function roleSignalData(vr=readRanks('via'),mr=readRanks('mi')){
   const roles=roleUniverse();
   return roles.map(role=>{
    const viaHits=vr.map((key,i)=>({key,rank:i+1,weight:VIA_W[i]||0,item:VIA.find(x=>x.key===key)}))
      .filter(x=>x.item&&(x.item.roles||[]).includes(role));
    const miHits=mr.map((key,i)=>({key,rank:i+1,weight:MI_W[i]||0,item:MI.find(x=>x.key===key)}))
      .filter(x=>x.item&&(x.item.roles||[]).includes(role));
    const raw=[...viaHits,...miHits].reduce((n,x)=>n+x.weight,0);
    if(!raw)return null;

    const dfV=roleFrequency(VIA,role),dfM=roleFrequency(MI,role);
    const v=sourceMeanVariance(VIA.length,dfV),m=sourceMeanVariance(MI.length,dfM);
    const baseline=v.mean+m.mean,sd=Math.sqrt(Math.max(v.variance+m.variance,0.000001));
    let signal=(raw-baseline)/sd;
    const cross=viaHits.length>0&&miHits.length>0;
    signal+=cross?0.35:-0.30;
    if(viaHits.length+miHits.length===1)signal-=0.20;

    const index=clamp(Math.round(5+signal),1,10);
    const level=signal>=2?'우선 검증':signal>=1?'관심 탐색':signal>=0?'보조 탐색':'확장 탐색';
    return {role,raw,baseline,sd,signal,index,level,cross,viaHits,miHits,dfV,dfM};
   }).filter(Boolean).sort((a,b)=>b.signal-a.signal||b.raw-a.raw||a.role.localeCompare(b.role,'ko'));
  }

  window.integratedScores=function(){
   const base=ORIGINAL_INTEGRATED();
   const roleMeta=roleSignalData(base.vr,base.mr);
   window.__careerRoleSignalV2=roleMeta;
   return {...base,roles:roleMeta.map(x=>[x.role,x.index]),roleMeta,roleModelVersion:MODEL_VERSION};
  };

  window.roleRecommendations=function(){
   const s=integratedScores(),meta=s.roleMeta||roleSignalData(s.vr,s.mr);
   return meta.slice(0,8).map(r=>{
    const via=s.details.filter(x=>x.source==='VIA'&&(x.d.roles||[]).includes(r.role));
    const mi=s.details.filter(x=>x.source==='MI'&&(x.d.roles||[]).includes(r.role));
    const skillScores={};
    [...via,...mi].forEach(x=>(x.d.competencies||[]).forEach(c=>addScore(skillScores,c,x.w)));
    const skills=Object.entries(skillScores).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
    const reasons=[];
    if(via.length)reasons.push('VIA · '+via.slice(0,2).map(x=>x.d.key).join(' + '));
    if(mi.length)reasons.push('다중지능 · '+mi.slice(0,2).map(x=>x.d.key).join(' + '));
    if(r.cross)reasons.push('두 검사 모두에서 이 직무와 연결됨');

    const hints=ROLE_STRENGTH_HINTS[r.role]||[];
    const common=hints.filter(x=>experienceCommonStrengths.includes(x)).slice(0,2);
    const peer=hints.filter(x=>experiencePeerStrengths.includes(x)).slice(0,2);
    const self=hints.filter(x=>selfStrengths.includes(x)).slice(0,2);
    if(common.length)reasons.push('나와 타인이 함께 발견 · '+common.join(' + '));
    else if(peer.length)reasons.push('짝의 경험 피드백 · '+peer.join(' + '));
    if(self.length&&reasons.length<5)reasons.push('내가 생각하는 강점 · '+self.join(' + '));
    const value=(ROLE_VALUE_HINTS[r.role]||[]).find(x=>selectedValues.includes(x));
    if(value&&reasons.length<5)reasons.push('직업가치관 · '+value+(reinforcedValues.includes(value)?' (반복 확인)':''));

    return {
     role:r.role,
     score:r.index,
     index:r.index,
     percent:clamp(Math.round(50+r.signal*10),20,95),
     signal:r.signal,
     level:r.level,
     cross:r.cross,
     raw:r.raw,
     baseline:r.baseline,
     skills,
     reasons:reasons.slice(0,5)
    };
   });
  };

  window.recommendationLevel=function(value){
   const n=Number(value)||0;
   return n>=80?'우선 검증':n>=65?'관심 탐색':n>=50?'보조 탐색':'확장 탐색';
  };

  window.renderCareerRoles=function(){
   const box=el('recommendedRoleCards');if(!box)return;
   const roles=roleRecommendations();
   box.innerHTML=roles.length
    ?`<div class="callout"><b>나의 결과에서 먼저 살펴볼 직무</b><br>
       VIA와 다중지능 결과를 함께 고려해 탐색해볼 직무를 제안합니다.<br>
       <span class="small">탐색지수(1~10)는 직무 적합도나 능력 점수가 아니라, <b>현재 결과에서 먼저 확인해볼 정도</b>를 나타냅니다.</span></div>`
      +roles.map((r,i)=>`<article class="roleCard ${careerTarget.role===r.role&&careerTarget.roleSource==='recommendation'?'selected':''}">
       <div class="roleHead"><h3>${i+1}. ${esc(r.role)}</h3><span class="scoreBadge">${esc(r.level)} · 탐색지수 ${r.index}/10</span></div>
       <div><b class="small">이 직무가 나온 근거</b><ul class="reasonList">${r.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
       <div><b class="small">관련 핵심 직무역량</b><div class="pillbox">${r.skills.map(x=>`<span class="pill skill">${esc(x)}</span>`).join('')}</div></div>
       <button class="btn ${careerTarget.role===r.role?'btnSecondary':'btnPrimary'}" onclick="selectCareerRole('${esc(r.role)}','recommendation')">${careerTarget.role===r.role?'✓ 선택됨':'희망직무로 선택'}</button>
      </article>`).join('')
    :'<div class="callout">추천 직무를 보려면 VIA TOP3와 다중지능 TOP3을 먼저 입력해 주세요.</div>';
   const custom=el('customRoleInput');if(custom&&careerTarget.roleSource==='custom')custom.value=careerTarget.role;
   renderCareerTargetSummary();
  };

  if(typeof ORIGINAL_RENDER_INTEGRATED==='function'){
   window.renderIntegrated=function(){
    ORIGINAL_RENDER_INTEGRATED();
    const root=el('integratedResult');if(!root)return;
    const boxes=[...root.querySelectorAll('.recBox')];
    const roleBox=boxes.find(box=>box.querySelector('h3')?.textContent.trim()==='탐색 후보 직무');
    if(roleBox){
     const p=roleBox.querySelector('p');
     if(p)p.innerHTML='VIA와 다중지능 결과를 함께 고려해 <b>먼저 살펴볼 직무</b>를 제안합니다. <b>탐색지수는 적합도 점수가 아니라 진로탐색을 위한 참고값</b>입니다.';
     roleBox.querySelectorAll('.pill.role').forEach(pill=>{
      pill.textContent=pill.textContent.replace(/ · 연결 (\d+)/,' · 탐색지수 $1/10');
     });
     if(!roleBox.querySelector('.roleModelNote')){
      const note=document.createElement('div');note.className='small muted roleModelNote';note.style.marginTop='10px';
      note.textContent='관심이 가는 직무는 실제 경험, RIASEC, 전공·기술, 최신 채용공고와 함께 확인해보세요.';
      roleBox.appendChild(note);
     }
    }
   };
  }

  window.CAREER_RECOMMENDATION_MODEL={
   version:MODEL_VERSION,
   description:'rank-weighted role signals with per-role baseline frequency standardization and cross-source support',
   getRoleSignals:()=>roleSignalData()
  };

  try{
   if(current===6)renderIntegrated();
   if(current===7)renderCareerFitMap();
   if(current===8&&typeof renderCareerTargetAnalysis==='function')renderCareerTargetAnalysis();
  }catch(e){console.error('Career recommendation V2 rerender failed',e)}
 }

 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();
(function(){
 function install(){
  if(typeof window.renderIntegrated!=='function'||typeof window.integratedScores!=='function'||typeof window.synergyPairs!=='function'){
   setTimeout(install,60);return;
  }

  if(!document.getElementById('step6IntegrationUiStyle')){
   const style=document.createElement('style');style.id='step6IntegrationUiStyle';style.textContent=`
    .profileResultColumns{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
    .profileResultColumn{border:1px solid var(--line);border-radius:18px;padding:16px;background:#fff}
    .profileResultColumn h3{margin:0 0 5px;font-size:18px}.profileResultColumn>p{margin:0 0 12px;font-size:13px}
    .profileResultStack{display:grid;gap:9px}.profileResultItem{display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;border:1px solid var(--line);border-radius:15px;padding:12px;background:#fbfcff}
    .profileResultItem.miItem{background:#f7fffb}.profileRank{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:12px;font-weight:900;background:#eef4ff;color:#2459a4}.miItem .profileRank{background:#e9fbf3;color:#087858}
    .profileResultItem b{display:block;font-size:16px}.profileResultItem span{display:block;font-size:12px;color:var(--muted);margin-top:3px;line-height:1.45}
    .skillUseGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.skillUseCard{border:1px solid #d8ebc9;border-radius:15px;padding:13px;background:#fbfff8}.skillUseHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.skillUseScore{white-space:nowrap;font-size:11px;font-weight:900;color:#3d6d22;background:#eef8e8;border-radius:999px;padding:4px 7px}.skillUseCard p{font-size:12px;margin:7px 0 0;line-height:1.55}
    .useGuideGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.useGuideItem{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.useGuideItem b{display:block;margin-bottom:5px}.useGuideItem span{font-size:12px;color:var(--muted);line-height:1.5}
    @media(max-width:720px){.profileResultColumns,.skillUseGrid,.useGuideGrid{grid-template-columns:1fr}.profileResultColumn{padding:13px}}
   `;document.head.appendChild(style);
  }

  function competencyUseText(name){
   const s=String(name||'');
   if(/학습|지식|연구/.test(s))return '새로운 지식·도구를 배우거나 직무교육·프로젝트 학습계획을 세울 때 활용할 수 있습니다.';
   if(/분석|리서치|데이터|논리|판단|비판|문제 정의|문제 구조|정보 종합|패턴/.test(s))return '자료 조사, 문제 정의, 데이터 해석, 의사결정 근거를 정리할 때 활용할 수 있습니다.';
   if(/관리|계획|목표|일정|정확|규정|위험|리스크|완성도/.test(s))return '업무 일정·목표 관리, 품질 점검, 위험·규정 확인 같은 관리 업무에서 활용할 수 있습니다.';
   if(/소통|커뮤니케이션|설득|프레젠|스토리|언어|관계|협업|공감|조율|경청|라포/.test(s))return '팀 협업, 고객·이해관계자 소통, 발표·면접, 의견 조율 상황에서 활용할 수 있습니다.';
   if(/창의|아이디어|디자인|변화|개선|시각|표현|구성/.test(s))return '기획, 아이디어 도출, 콘텐츠·서비스 설계, 기존 방식 개선에 활용할 수 있습니다.';
   if(/실행|도전|현장|도구|완수|추진|대응/.test(s))return '프로젝트 실행, 현장 대응, 목표 달성, 실습 중심 업무에서 활용할 수 있습니다.';
   if(/윤리|신뢰|공정|책임|투명/.test(s))return '품질·감사·컴플라이언스, 공정한 판단, 책임 있는 의사결정에서 활용할 수 있습니다.';
   if(/자기|메타인지|성찰|가치|의미/.test(s))return '진로목표 설정, 우선순위 판단, 자기관리와 경험 회고에 활용할 수 있습니다.';
   return '채용공고의 담당업무·요구역량과 비교해 이 역량이 실제로 필요한 장면을 확인해보세요.';
  }

  function resultItem(label,rank,data,cls=''){
   return `<div class="profileResultItem ${cls}"><div class="profileRank">${rank}위</div><div><b>${esc(label)}</b><span>${esc(data?.desc||'')}</span></div></div>`;
  }

  window.renderIntegrated=function(){
   if(!validateRanks('via','VIA')||!validateRanks('mi','다중지능')){current=6;currentSub=3;renderProgress();return}
   const s=integratedScores();
   const topSkills=s.skills.slice(0,6),topRoles=s.roles.slice(0,8),topTags=s.tags.slice(0,5),max=Math.max(...topTags.map(x=>x[1]),1);
   const viaItems=s.vr.map((x,i)=>resultItem(x,i+1,VIA.find(d=>d.key===x),'')).join('');
   const miItems=s.mr.map((x,i)=>resultItem(x,i+1,MI.find(d=>d.key===x),'miItem')).join('');
   const skillCards=topSkills.map(([name,score])=>`<div class="skillUseCard"><div class="skillUseHead"><b>${esc(name)}</b><span class="skillUseScore">연결 ${score}</span></div><p>${esc(competencyUseText(name))}</p></div>`).join('');
   const details=s.details.map(x=>`<div class="detailRec"><div class="detailRecHead"><b>${x.source==='VIA'?'VIA 강점':'다중지능'} ${x.rank}위 · ${esc(x.d.key)}</b><span class="rankTag">가중치 ${x.w}</span></div><p>${esc(x.d.desc)}</p><div class="small muted"><b>연결된 직무역량</b></div><div class="pillbox">${x.d.competencies.map(z=>`<span class="pill skill">${esc(z)}</span>`).join('')}</div><div class="small muted" style="margin-top:10px"><b>탐색해볼 수 있는 직무군</b></div><div class="pillbox">${x.d.roles.map(z=>`<span class="pill role">${esc(z)}</span>`).join('')}</div></div>`).join('');
   const syn=synergyPairs().map((x,i)=>`<div class="synergy"><h3>조합 ${i+1} · ${esc(x.v.key)} × ${esc(x.m.key)}</h3><p>${esc(x.v.key)}의 행동 경향과 ${esc(x.m.key)}의 정보처리 방식이 함께 나타날 때 참고할 수 있는 조합입니다.</p><div class="small muted"><b>함께 활용해볼 역량</b></div><div class="pillbox">${x.skills.map(z=>`<span class="pill skill">${esc(z)}</span>`).join('')}</div></div>`).join('');

   el('integratedResult').innerHTML=`<div class="resultCard"><div class="small muted">${esc(el('classTitleBadge').textContent)}</div><h2 style="margin-top:4px">나의 VIA × 다중지능 통합 Career Profile</h2>
    <div class="integrationHero"><div class="small muted"><b>입력한 6개 핵심 결과</b></div><div class="profileResultColumns"><section class="profileResultColumn"><h3>VIA 강점 TOP3</h3><p>내가 자주 보일 수 있는 <b>행동 경향</b></p><div class="profileResultStack">${viaItems}</div></section><section class="profileResultColumn"><h3>다중지능 TOP3</h3><p>정보를 이해하고 문제를 풀 때의 <b>선호 방식</b></p><div class="profileResultStack">${miItems}</div></section></div></div>
    <div class="recBox"><h3>통합 추천 직무역량</h3><p class="small muted">VIA TOP3와 다중지능 TOP3에 연결된 역량 중 반복적으로 나타난 항목입니다. <b>숫자는 적합도나 실제 능력 수준이 아니라 3·2·1 가중치에 따른 연결 정도</b>입니다.</p><div class="skillUseGrid">${skillCards}</div><div class="callout"><b>이 역량을 어디에 활용하나요?</b><div class="useGuideGrid"><div class="useGuideItem"><b>STEP 7 · 직무 탐색</b><span>어떤 직무에서 이 역량을 활용할 수 있을지 탐색하는 참고 키워드로 사용합니다.</span></div><div class="useGuideItem"><b>STEP 9 · 채용공고 검증</b><span>기업이 실제로 요구하는 역량과 비교해 내 결과와 일치하는지 확인합니다.</span></div><div class="useGuideItem"><b>STEP 10~11 · GAP·Action Plan</b><span>내 경험근거가 있는 역량과 앞으로 보완할 역량을 구분해 실행계획으로 연결합니다.</span></div></div></div></div>
    <div class="recBox" style="margin-top:14px"><h3>탐색 후보 직무</h3><p class="small muted">현재 6개 결과에 연결된 직무군을 단순 합산한 <b>탐색 후보</b>입니다. 적성·합격가능성·직무적합도를 판정하는 점수가 아닙니다.</p><div class="pillbox">${topRoles.map(([x,v])=>`<span class="pill role">${esc(x)} · 연결 ${v}</span>`).join('')}</div></div>
    <h3>나의 활동 경향</h3>${topTags.map(([a,v])=>`<div class="scoreBar"><div>${esc(a)}</div><div class="bar"><span style="width:${Math.round(v/max*100)}%"></span></div><div class="small muted">${v}</div></div>`).join('')}
    <h3>대표 강점 × 지능 시너지 3개</h3><div class="synergyGrid">${syn}</div>
    <h3>6개 결과별 연결 근거</h3>${details}
    <div class="callout"><b>해석 순서</b><br>① 역량을 ‘내가 이미 잘한다’고 단정하지 않기 → ② 실제 경험에서 근거 찾기 → ③ 관심 직무의 최근 채용공고와 비교하기 → ④ 일치하면 강점 근거로, 부족하면 개발 과제로 활용하기</div>
    <div class="warnBox"><b>주의</b> 이 결과는 VIA Institute 또는 다중지능 검사 사이트의 공식 직업추천이 아닙니다. 강점·지능 결과를 수업용 직무역량 언어로 연결한 <b>진로탐색 가설</b>이며, 채용·배치·적성 판정에 사용하지 않습니다.</div></div>`;
  };
 }

 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();

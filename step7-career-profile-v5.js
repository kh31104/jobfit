(function(){
 const SELF_KEY='careerNavigationSelfAwarenessV4';
 const INTEREST_LABEL={R:'직접 만들고 움직이기',I:'분석하고 탐구하기',A:'표현하고 창작하기',S:'돕고 가르치기',E:'설득하고 이끌기',C:'정리하고 체계화하기'};
 const RIASEC_LABEL={R:'현실형',I:'탐구형',A:'예술형',S:'사회형',E:'진취형',C:'관습형'};
 const VALUE_BRIDGE={
  '일과 삶의 균형':['워라밸'],
  '직업안정':['안정'],
  '경제적 보상':['보상'],
  '성취':['성취'],
  '사회적 인정':['인정'],
  '자율성':['자율성'],
  '변화지향':['도전','성장','창의성'],
  '자기개발':['성장','학습기회','전문성'],
  '사회적 공헌':['사회기여','일의 의미']
 };
 function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function readSelf(){try{return JSON.parse(localStorage.getItem(SELF_KEY)||'{}')}catch(e){return{}}}
 function work(){try{return typeof window.getWork24AssessmentResultsV4==='function'?window.getWork24AssessmentResultsV4():{}}catch(e){return{}}}
 function globals(name){try{const v=window[name];return Array.isArray(v)?v:[]}catch(e){return[]}}
 function selectedValues(){try{return Array.isArray(window.selectedValues)?window.selectedValues:[]}catch(e){try{return Array.isArray(selectedValues)?selectedValues:[]}catch(_){return[]}}}
 function viaTop(){try{if(typeof window.readRanks==='function')return window.readRanks('via').slice(0,5)}catch(e){}try{const d=JSON.parse(localStorage.getItem('careerCompassV64')||'{}');return Array.isArray(d.via)?d.via.slice(0,5):[]}catch(e){return[]}}
 function topInterest(r){return Object.entries(r.riasec?.scores||{}).filter(([,v])=>v!==''&&v!=null&&Number.isFinite(Number(v))).map(([id,score])=>({id,score:Number(score)})).sort((a,b)=>b.score-a.score).slice(0,3)}
 function valueTop(r){return (r.workvalue?.topValues||[]).filter(x=>x&&x.value&&x.score!==''&&x.score!=null).slice(0,5)}
 function valueLabelSafe(v){try{return typeof window.valueLabel==='function'?window.valueLabel(v):v}catch(e){return v}}
 function pill(items,cls=''){return items.length?items.map(x=>`<span class="pill ${cls}">${esc(x)}</span>`).join(''):'<span class="muted">미입력</span>'}
 function ensureStyle(){
  if(document.getElementById('careerProfileV5Style'))return;
  const s=document.createElement('style');s.id='careerProfileV5Style';
  s.textContent=`.cp5Intro{background:linear-gradient(135deg,#302a86,#6654df);color:#fff;border-radius:20px;padding:19px;margin:12px 0 16px}.cp5Intro b{display:block;font-size:12px;opacity:.8;margin-bottom:6px}.cp5Intro strong{font-size:20px;line-height:1.55}.cp5Principle{border:1px solid #d8def8;background:#f8f9ff;border-radius:15px;padding:12px 14px;color:#4e5c75;font-size:12px;line-height:1.65;margin-bottom:14px}.cp5Axis{border:1px solid var(--line);border-radius:19px;padding:16px;background:#fff;margin:12px 0}.cp5AxisHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:11px}.cp5AxisHead h3{margin:0;font-size:19px}.cp5Signal{white-space:nowrap;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900;background:#eef0ff;color:#493fc4}.cp5Grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cp5Box{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fbfcff}.cp5Box b{font-size:12px}.cp5Read{margin-top:10px;border-radius:13px;background:#f3fbf6;border:1px solid #d7e9df;padding:10px 12px;color:#315c46;font-size:12px;line-height:1.6}.cp5Next{border:1px solid #d8d5ff;background:linear-gradient(180deg,#faf9ff,#fff);border-radius:19px;padding:16px;margin-top:14px}.cp5Next h3{margin:0 0 8px}.cp5NextGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.cp5NextItem{border:1px solid var(--line);border-radius:13px;padding:11px;background:#fff}.cp5NextItem b{display:block;font-size:11px;color:#65708a;margin-bottom:5px}.cp5Caution{margin-top:12px;font-size:11px;line-height:1.55;color:#6b7280}@media(max-width:720px){.cp5Grid,.cp5NextGrid{grid-template-columns:1fr}.cp5AxisHead{align-items:flex-start}.cp5Intro strong{font-size:18px}}`;
  document.head.appendChild(s);
 }
 function render(){
  const root=document.getElementById('careerFlowV4');if(!root)return;
  ensureStyle();
  const r=work(),self=readSelf();
  const myInterest=Array.isArray(self.interest?.selected)?self.interest.selected.slice(0,3):[];
  const testInterest=topInterest(r);
  const interestCommon=myInterest.filter(id=>testInterest.some(x=>x.id===id));
  const myValues=selectedValues().slice(0,5);
  const testValues=valueTop(r);
  const valueMatches=testValues.filter(x=>(VALUE_BRIDGE[x.value]||[]).some(v=>myValues.includes(v)));
  const via=viaTop();
  const selfS=globals('selfStrengths').slice(0,5);
  const peerS=globals('experiencePeerStrengths').slice(0,5);
  const experienceCommon=selfS.filter(x=>peerS.includes(x));
  const sameVia=[...new Set(via.filter(x=>selfS.includes(x)||peerS.includes(x)))];
  const interestSignal=interestCommon.length>=2?'공통 신호 높음':interestCommon.length===1?'일부 공통':'차이 탐색 필요';
  const valueSignal=valueMatches.length>=2?'유사 신호 있음':valueMatches.length===1?'일부 유사':'차이 탐색 필요';
  const interestLead=testInterest[0]?.id||myInterest[0]||'';
  const valueLead=testValues[0]?.value||valueLabelSafe(myValues[0]||'');
  const strengthLead=via.slice(0,2).join('·')||selfS.slice(0,2).join('·')||'강점 미입력';
  const sentence=`나는 ${interestLead?`${RIASEC_LABEL[interestLead]||interestLead}(${INTEREST_LABEL[interestLead]||interestLead}) 활동을 우선 탐색하고, `:''}${valueLead?`${valueLead}을(를) 중요한 직업선택 기준으로 살피며, `:''}${strengthLead} 강점을 실제 경험에서 어떻게 활용하는지 확인해 볼 수 있습니다.`;
  const interestRead=interestCommon.length?`검사 전 자기인식과 S형 TOP3에서 ${interestCommon.map(id=>`${id} ${RIASEC_LABEL[id]}`).join(' · ')}가 함께 나타났습니다. 공통 항목은 우선 탐색 신호로 사용하되, 다른 항목도 배제하지 않습니다.`:'자기인식 TOP3와 S형 TOP3가 바로 겹치지 않습니다. 검사 오류로 단정하지 말고 최근 경험, 선호 활동, 실제 몰입 장면을 비교해 차이가 생긴 이유를 확인합니다.';
  const valueRead=valueMatches.length?`직접 선택한 가치와 고용24 상위가치 사이에 의미가 비슷한 항목이 ${valueMatches.length}개 있습니다. 이것은 동일 척도 점수의 일치도가 아니라 가치명 간 의미 연결을 활용한 참고 신호입니다.`:'직접 선택한 가치와 고용24 상위가치에서 뚜렷한 의미 연결이 보이지 않습니다. 실제 기업 선택 상황에서 어떤 기준을 포기하기 어려운지 사례로 다시 확인합니다.';
  const strengthRead=experienceCommon.length?`내가 생각한 강점과 경험 속 타인 피드백에서 ${experienceCommon.join(' · ')}가 반복되었습니다. 이 항목은 자기평가만 있는 강점보다 실제 경험 근거를 추가로 확보하기 좋습니다.`:'자기인식 강점과 타인 피드백의 동일 표현이 없어도 문제는 아닙니다. VIA, 자기평가, 경험피드백은 서로 다른 관점이므로 총점으로 합치지 않고 각각의 근거를 유지합니다.';
  root.className='flowV4Screen';
  root.innerHTML=`<div class="f4Head"><span class="f4Eyebrow">STEP 7 · CAREER ROADMAP</span><h2>통합 Career Profile</h2><p>흥미·가치·강점을 하나의 점수로 섞지 않고, 자기인식·공식검사·경험근거를 나란히 비교해 다음 탐색에 사용할 신호를 정리합니다.</p></div>
   <div class="cp5Intro"><b>현재 Career Profile 한 문장</b><strong>${esc(sentence)}</strong></div>
   <div class="cp5Principle"><b>해석 원칙</b> · 서로 다른 검사의 점수는 직접 합산하지 않습니다. 공통으로 반복되는 신호는 우선 탐색 근거로, 서로 다른 결과는 추가 탐색 질문으로 사용합니다. STEP 7에서는 직무를 확정하거나 적합도 점수를 만들지 않습니다.</div>
   <section class="cp5Axis"><div class="cp5AxisHead"><h3>① 흥미 · 내가 좋아하는 활동</h3><span class="cp5Signal">${interestSignal}</span></div><div class="cp5Grid"><div class="cp5Box"><b>검사 전 · 내가 생각한 흥미 TOP3</b><div class="pillbox">${myInterest.length?myInterest.map((id,i)=>`<span class="pill">${i+1}. ${esc(INTEREST_LABEL[id]||id)}</span>`).join(''):'<span class="muted">미입력</span>'}</div></div><div class="cp5Box"><b>고용24 S형 · TOP3</b><div class="pillbox">${testInterest.length?testInterest.map((x,i)=>`<span class="pill via">${i+1}. ${x.id} ${esc(RIASEC_LABEL[x.id]||'')} · ${x.score}</span>`).join(''):'<span class="muted">미입력</span>'}</div></div></div><div class="cp5Read"><b>읽는 법</b> · ${esc(interestRead)}</div></section>
   <section class="cp5Axis"><div class="cp5AxisHead"><h3>② 가치 · 내가 포기하기 어려운 기준</h3><span class="cp5Signal">${valueSignal}</span></div><div class="cp5Grid"><div class="cp5Box"><b>검사 전 · 내가 직접 선택한 가치</b><div class="pillbox">${pill(myValues.map(valueLabelSafe))}</div></div><div class="cp5Box"><b>고용24 직업가치 · TOP3~5</b><div class="pillbox">${testValues.length?testValues.map((x,i)=>`<span class="pill via">${i+1}. ${esc(x.value)} · ${esc(x.score)}</span>`).join(''):'<span class="muted">미입력</span>'}</div></div></div><div class="cp5Read"><b>읽는 법</b> · ${esc(valueRead)}</div></section>
   <section class="cp5Axis"><div class="cp5AxisHead"><h3>③ 강점 · 내가 활용할 수 있는 자원</h3><span class="cp5Signal">경험 근거 확인</span></div><div class="cp5Grid"><div class="cp5Box"><b>내가 생각하는 강점</b><div class="pillbox">${pill(selfS)}</div><div style="margin-top:10px"><b>경험에서 타인이 발견한 강점</b><div class="pillbox">${pill(peerS,'role')}</div></div></div><div class="cp5Box"><b>VIA 성격강점 TOP5</b><div class="pillbox">${via.length?via.map((x,i)=>`<span class="pill via">${i+1}. ${esc(x)}</span>`).join(''):'<span class="muted">미입력</span>'}</div>${sameVia.length?`<div class="small muted" style="margin-top:10px">동일한 표현이 반복된 항목 · ${esc(sameVia.join(' · '))}</div>`:''}</div></div><div class="cp5Read"><b>읽는 법</b> · ${esc(strengthRead)}</div></section>
   <div class="cp5Next"><h3>STEP 8로 넘길 탐색 신호</h3><div class="cp5NextGrid"><div class="cp5NextItem"><b>우선 탐색 흥미</b>${esc(testInterest.map(x=>x.id).join(' · ')||myInterest.join(' · ')||'미입력')}</div><div class="cp5NextItem"><b>우선 확인 가치</b>${esc(testValues.slice(0,3).map(x=>x.value).join(' · ')||myValues.slice(0,3).map(valueLabelSafe).join(' · ')||'미입력')}</div><div class="cp5NextItem"><b>VIA 활용 강점</b>${esc(via.join(' · ')||'미입력')}</div><div class="cp5NextItem"><b>경험으로 검증할 강점</b>${esc(experienceCommon.join(' · ')||peerS.slice(0,3).join(' · ')||selfS.slice(0,3).join(' · ')||'미입력')}</div></div><div class="cp5Caution">이 신호들은 직업 적합성을 확정하지 않습니다. 다음 단계에서 실제 직무의 업무내용·필요역량·채용공고와 비교하면서 후보를 좁힙니다.</div></div>
   <div class="f4Actions"><button class="btn btnSecondary" onclick="goCareerFlowV4(6)">← VIA</button><div><button class="btn btnPrimary" onclick="goCareerFlowV4(8)">직무·산업·기업 탐색 →</button></div></div>`;
 }
 function install(){
  if(typeof window.goCareerFlowV4!=='function'){setTimeout(install,60);return}
  if(window.goCareerFlowV4.__careerProfileV5)return;
  const original=window.goCareerFlowV4;
  const wrapped=function(step){const r=original.apply(this,arguments);if(Number(step)===7)setTimeout(render,0);return r};
  wrapped.__careerProfileV5=true;window.goCareerFlowV4=wrapped;
  window.renderCareerProfileV5=render;
  if(/^STEP\s*7\s*\/\s*13/.test(document.getElementById('stepText')?.textContent||''))setTimeout(render,0);
 }
 install();
})();

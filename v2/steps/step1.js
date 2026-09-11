const WORK24='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const VIA='https://www.viacharacter.org/';
const RIASEC=[['R','현실형'],['I','탐구형'],['A','예술형'],['S','사회형'],['E','진취형'],['C','관습형']];
const BIG5=['외향성','호감성','성실성','정서적 불안정성','경험에 대한 개방성'];
const VALIDITY=['사회적 바람직성','부주의성','온전성'];
const FACETS=['사교성','리더십','적극성','긍정성','타인에 대한 믿음','도덕성','타인에 대한 배려','수용성','겸손','휴머니즘','유능성','조직화능력','책임감','목표지향','자기통제력','완벽성','불안','분노','우울','자의식','충동성','스트레스 취약성','상상력','문화','정서','경험추구','지적호기심','대인관계지향'];
const LIFE=['독립심','가족친화','야망','학업성취','예술성','운동선호','종교성','직무만족'];
const VALUES=['사회적 공헌','변화 지향성','성취','경제적 보상','자기개발','일과 삶의 균형','사회적 인정','자율성','직업안정성'];
const PROMPT_VERSION='career-dna-dynamic-v1';

export async function render(ctx){
  const state=ctx.getState();
  const saved=state.assessments?.careerDNA||{};
  const forced=ctx.courseConfig.interest;
  const selected=forced!=='CHOICE'?forced:(saved.interest?.type||'S');
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 1</div><h2>Career DNA</h2><p>고용24 검사결과와 나의 실제 경험을 분리해서 보고, 나중에 직무탐색의 근거로 사용합니다.</p></div><span class="badge">3주차</span></div>
    <div class="progress"><span style="width:14%"></span></div>
    <div class="callout info"><b>중요</b> · 검사결과는 직무의 정답이 아닙니다. 모든 검사를 한 번에 끝낼 필요도 없습니다. <b>현재 완료한 자료만으로 Career DNA 인터뷰를 시작</b>하고, 다른 결과는 나중에 추가할 수 있습니다.</div>

    <div class="block"><h3>1. 직업선호도검사 선택</h3><p class="help">현재 고용24의 <b>직업선호도검사 S형(개정)</b> 또는 <b>L형(개정)</b> 중 하나만 시행합니다. 같은 학생이 둘 다 시행하지 않습니다.</p>
      <div class="choiceGrid">
        ${choice('S','고용24 S형(개정)','흥미 중심 · 약 25분',selected,forced)}
        ${choice('L','고용24 L형(개정)','흥미 + 성격 + 생활사 · 약 60분',selected,forced)}
      </div>
      ${forced!=='CHOICE'?`<div class="callout good">이 수업의 지정검사는 <b>${forced}형</b>입니다.</div>`:''}
      <div class="actions"><a class="btn primary linkBtn" href="${WORK24}" target="_blank" rel="noopener">고용24 직업심리검사 열기 ↗</a></div>
    </div>

    <div class="hr"></div><div class="block"><h3>2. ${selected}형 결과 입력</h3><p class="help">고용24 결과표의 RIASEC 6개 원점수와 표준점수를 그대로 입력합니다. S형·L형 모두 동일한 6개 흥미유형 점수를 저장합니다.</p>
      <div class="grid3">
        ${dateField('examDate','검사일',saved.interest?.examDate)}
        ${txt('resultVersion','결과표 표기/버전',saved.interest?.resultVersion||`${selected}형(개정)`,'예: 직업선호도검사 S형(개정)')}
        ${sel('resultSource','입력 출처',saved.interest?.resultSource,['','고용24 결과표 직접입력','교수자 제공 결과표','기타'])}
      </div>
      <div class="grid3" style="margin-top:12px">${RIASEC.map(([k,n])=>riasecCard(k,n,saved)).join('')}</div>
      ${selected==='L'?lFields(saved):''}
      <details class="detailsBox block"><summary>고용24 결과표의 추천직업 기록 <span class="muted">(선택 · 참고용)</span></summary><p class="help">고용24 결과표에 제시된 추천직업/적합직업을 보관할 수 있습니다. <b>이 값은 STEP 3 직무 후보를 자동 생성하거나 우선순위를 매기는 데 사용하지 않습니다.</b></p><textarea id="work24SuggestedJobs" placeholder="결과표에 표시된 추천직업을 필요한 경우 그대로 기록">${ctx.escapeHtml(saved.interest?.work24SuggestedJobs||'')}</textarea></details>
    </div>

    <div class="hr"></div><div class="block"><h3>3. 성인용 직업가치관검사 <span class="muted">(추후 추가 가능)</span></h3><p class="help">시간이 되는 경우 현재 고용24가 안내하는 9개 직업가치 결과를 기록합니다. 이번 시간에 하지 않아도 Career DNA 인터뷰는 가능합니다.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${WORK24}" target="_blank" rel="noopener">성인용 직업가치관검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${VALUES.map((n,i)=>scoreField(`val_${i}`,n,saved.workValues?.[n])).join('')}</div>
      <div class="grid2" style="margin-top:12px">${dateField('workValuesDate','검사일',saved.workValuesDate)}${txt('workValuesVersion','결과표 표기/버전',saved.workValuesVersion||'성인용 직업가치관검사','결과표에 표시된 명칭')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>4. VIA 강점 TOP5 <span class="muted">(교육용 · 선택)</span></h3><p class="help">VIA는 자기이해와 경험탐색을 위한 보조자료입니다. 입력한 경우에만 AI 인터뷰에 사용하며, 강점명만으로 역량이나 직무를 단정하지 않습니다.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${VIA}" target="_blank" rel="noopener">VIA 검사 사이트 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2,3,4].map(i=>`<div class="field"><label>TOP ${i+1}</label><input class="input" id="via_${i}" value="${ctx.escapeHtml(saved.viaTop5?.[i]||'')}" placeholder="결과에 표시된 강점명"></div>`).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>5. 검사결과와 실제 나 비교</h3><p class="help">AI보다 먼저 본인이 결과를 검토합니다. ‘맞다/아니다’보다 실제 경험 근거를 적는 것이 중요합니다. 입력한 내용이 있으면 AI가 그 부분부터 확인합니다.</p>
      <div class="grid3">
        ${area('fit','일치하는 결과','어떤 실제 경험 때문에 이 결과가 나와 비슷하다고 느끼나요?',saved.reflection?.fit,ctx)}
        ${area('question','확인이 필요한 결과','왜 이렇게 나왔는지 더 확인하고 싶은 부분은?',saved.reflection?.question,ctx)}
        ${area('disagree','동의하기 어려운 결과','어떤 실제 경험과 달라서 동의하기 어렵나요?',saved.reflection?.disagree,ctx)}
      </div>
      <label class="checkRow"><input type="checkbox" id="resultChecked" ${saved.resultChecked?'checked':''}><div><b>결과표 대조 완료</b><span>입력한 숫자가 고용24 결과표와 일치하는지 다시 확인했습니다.</span></div></label>
    </div>

    <div class="hr"></div><div class="block"><h3>6. Career DNA 요약 + AI LAB</h3><div class="summaryBox" id="dnaSummary">${summaryHtml(saved,selected,ctx)}</div>
      <p class="help" style="margin-top:12px"><b>완료한 자료만 사용합니다.</b> 직업가치관이나 VIA를 하지 않았어도 괜찮습니다. AI는 현재 입력된 결과에서 한 번에 질문 하나씩 하고, 실제 경험으로 확인합니다.</p>
      <div class="actions"><button class="btn secondary" id="makePrompt">현재 결과로 Career DNA 인터뷰 시작</button><button class="btn outline hidden" id="copyPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="promptBox"></div>
    </div>

    <div class="actions"><button class="btn primary" id="saveDNA">Career DNA 저장</button><button class="btn secondary" id="nextStep">STEP 2 경험·역량 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('.choiceCard[data-type]').forEach(card=>card.addEventListener('click',()=>{
    if(forced!=='CHOICE')return;
    const type=card.dataset.type;ctx.saveState({assessments:{careerDNA:{...ctx.getState().assessments.careerDNA,interest:{...(ctx.getState().assessments.careerDNA.interest||{}),type}}}});ctx.navigate(1);
  }));
  document.getElementById('saveDNA').addEventListener('click',()=>saveData(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveData(false);ctx.navigate(2)});
  document.getElementById('makePrompt').addEventListener('click',()=>{const data=saveData(false);const prompt=makePromptText(data);const box=document.getElementById('promptBox');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyPrompt').classList.remove('hidden');});
  document.getElementById('copyPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('promptBox').textContent);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사가 차단되었습니다. 직접 선택해 복사해 주세요.')}});

  function saveData(showToast){
    const riasecRaw={},riasecStandard={};RIASEC.forEach(([k])=>{riasecRaw[k]=num(`raw_${k}`);riasecStandard[k]=num(`std_${k}`)});
    const personalityBig5={},personalityValidity={},personalityFacets={},lifeHistory={};
    if(selected==='L'){
      BIG5.forEach((n,i)=>personalityBig5[n]=num(`big5_${i}`));VALIDITY.forEach((n,i)=>personalityValidity[n]=num(`valid_${i}`));FACETS.forEach((n,i)=>personalityFacets[n]=num(`facet_${i}`));LIFE.forEach((n,i)=>lifeHistory[n]=num(`life_${i}`));
    }
    const workValues={};VALUES.forEach((n,i)=>workValues[n]=num(`val_${i}`));
    const viaTop5=[0,1,2,3,4].map(i=>v(`via_${i}`)).filter(Boolean);
    const data={
      interest:{type:selected,examDate:v('examDate'),resultVersion:v('resultVersion'),resultSource:v('resultSource'),riasecRaw,riasecStandard,work24SuggestedJobs:v('work24SuggestedJobs'),suggestedJobsPolicy:'reference-only-not-used-for-job-ranking'},
      personalityBig5,personalityValidity,personalityFacets,lifeHistory,
      workValues,workValuesDate:v('workValuesDate'),workValuesVersion:v('workValuesVersion'),viaTop5,
      reflection:{fit:v('fit'),question:v('question'),disagree:v('disagree')},resultChecked:document.getElementById('resultChecked').checked
    };
    data.promptMeta={version:PROMPT_VERSION,moduleStatus:getModuleStatus(data)};
    ctx.saveState({assessments:{careerDNA:data},artifacts:{careerDNAProfile:buildSummary(data)}});document.getElementById('dnaSummary').innerHTML=summaryHtml(data,selected,ctx);document.getElementById('status').textContent='저장되었습니다.';if(showToast)ctx.toast('Career DNA를 저장했습니다.');return data;
  }
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
  function num(id){const x=v(id);return x===''?null:Number(x)}
}

function choice(type,title,desc,selected,forced){return `<div class="choiceCard ${selected===type?'on':''}" data-type="${type}" style="${forced!=='CHOICE'&&forced!==type?'opacity:.45':''}"><b>${title}</b><span>${desc}</span></div>`}
function riasecCard(k,n,saved){const raw=saved.interest?.riasecRaw?.[k]??'',std=saved.interest?.riasecStandard?.[k]??'';return `<div class="metricCard"><b>${k} · ${n}</b><div class="scorePair"><label><small>원점수</small><input class="input scoreInput" type="number" step="any" id="raw_${k}" value="${raw}"></label><label><small>표준점수</small><input class="input scoreInput" type="number" step="any" id="std_${k}" value="${std}"></label></div></div>`}
function scoreField(id,label,value){return `<div class="field"><label>${label}</label><input class="input scoreInput" type="number" step="any" id="${id}" value="${value??''}" placeholder="점수"></div>`}
function lFields(saved){return `<div class="block"><h3>L형 성격 5요인</h3><p class="help">고용24 L형 결과에서 외향성·호감성·성실성·정서적 불안정성·경험에 대한 개방성 점수를 기록합니다.</p><div class="grid3">${BIG5.map((n,i)=>scoreField(`big5_${i}`,n,saved.personalityBig5?.[n])).join('')}</div></div>
<details class="detailsBox block"><summary>L형 상세 점수 입력 · 타당도 / 성격 하위요인 / 생활사</summary><p class="help">결과표에 상세 점수가 제공되는 경우 입력합니다. Jobfit은 이 상세점수를 직무 자동추천에 사용하지 않습니다.</p><h4>응답·타당도 관련</h4><div class="grid3">${VALIDITY.map((n,i)=>scoreField(`valid_${i}`,n,saved.personalityValidity?.[n])).join('')}</div><h4>성격 하위요인</h4><div class="grid4">${FACETS.map((n,i)=>scoreField(`facet_${i}`,n,saved.personalityFacets?.[n])).join('')}</div><h4>생활사</h4><div class="grid4">${LIFE.map((n,i)=>scoreField(`life_${i}`,n,saved.lifeHistory?.[n])).join('')}</div></details>`}
function area(id,title,ph,value,ctx){return `<div class="field"><label>${title}</label><textarea id="${id}" placeholder="${ph}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function txt(id,label,value,ph){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${String(value||'').replace(/"/g,'&quot;')}" placeholder="${ph||''}"></div>`}
function dateField(id,label,value){return `<div class="field"><label>${label}</label><input class="input" type="date" id="${id}" value="${value||''}"></div>`}
function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${o}" ${o===value?'selected':''}>${o||'선택'}</option>`).join('')}</select></div>`}
function ranked(obj,n=3){return Object.entries(obj||{}).filter(([,v])=>Number.isFinite(v)).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function countScores(obj){return Object.values(obj||{}).filter(Number.isFinite).length}
function statusFromCount(count,total){return count===0?'none':count===total?'complete':'partial'}
function getModuleStatus(d){
  const stdCount=countScores(d.interest?.riasecStandard),rawCount=countScores(d.interest?.riasecRaw);
  const riasecCount=stdCount||rawCount;
  const valueCount=countScores(d.workValues);
  const big5Count=d.interest?.type==='L'?countScores(d.personalityBig5):0;
  const viaCount=Array.isArray(d.viaTop5)?d.viaTop5.filter(Boolean).length:0;
  const reflectionCount=['fit','question','disagree'].filter(k=>String(d.reflection?.[k]||'').trim()).length;
  return {
    riasec:{status:statusFromCount(riasecCount,6),count:riasecCount,total:6,scoreType:stdCount?'standard':rawCount?'raw':null},
    values:{status:statusFromCount(valueCount,9),count:valueCount,total:9},
    big5:{status:d.interest?.type==='L'?statusFromCount(big5Count,5):'not-applicable',count:big5Count,total:5},
    via:{status:statusFromCount(viaCount,5),count:viaCount,total:5},
    reflection:{status:reflectionCount?'available':'none',count:reflectionCount,total:3}
  };
}
function buildSummary(d){return {interestType:d.interest?.type,riasecTop:ranked(d.interest?.riasecStandard,3).map(([k,v])=>({code:k,score:v})),valueTop:ranked(d.workValues,3).map(([name,score])=>({name,score})),personalityTop:ranked(d.personalityBig5,2).map(([name,score])=>({name,score})),viaTop5:d.viaTop5||[],studentReflection:d.reflection||{},resultChecked:!!d.resultChecked,moduleStatus:getModuleStatus(d),promptVersion:PROMPT_VERSION,updatedAt:new Date().toISOString()}}
function statusLabel(x,label){if(!x||x.status==='none')return `${label}: 추후 추가 가능`;if(x.status==='not-applicable')return `${label}: 해당 없음`;if(x.status==='complete')return `${label}: 완료`;return `${label}: 부분입력 ${x.count}/${x.total}`}
function summaryHtml(d,selected,ctx){
  const x=buildSummary({...d,interest:{...(d.interest||{}),type:selected}}),m=x.moduleStatus;
  const interestText=x.riasecTop.length?x.riasecTop.map(a=>`${a.code} ${a.score}`).join(' · '):m.riasec.status==='partial'?`RIASEC 일부 입력 ${m.riasec.count}/6`:'아직 입력하지 않았습니다.';
  const valueText=x.valueTop.length?x.valueTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'추후 추가 가능';
  const personalityText=x.personalityTop.length?x.personalityTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'추후 추가 가능';
  const viaText=x.viaTop5.length?x.viaTop5.map(ctx.escapeHtml).join(' · '):'추후 추가 가능';
  return `<h4>나의 Career DNA · 현재 자료</h4><div class="resultGrid"><div class="resultCard"><strong>흥미 · ${selected}형(개정)</strong><p>${interestText}</p></div><div class="resultCard"><strong>직업가치</strong><p>${valueText}</p></div>${selected==='L'?`<div class="resultCard"><strong>성격 5요인</strong><p>${personalityText}</p></div>`:''}<div class="resultCard"><strong>VIA TOP5</strong><p>${viaText}</p></div></div><div class="callout info"><b>인터뷰 사용 상태</b> · ${statusLabel(m.riasec,'직업흥미')} · ${statusLabel(m.values,'직업가치')} · ${statusLabel(m.via,'VIA')}${selected==='L'?` · ${statusLabel(m.big5,'성격 5요인')}`:''}</div><div class="callout ${x.resultChecked?'good':'warn'}">${x.resultChecked?'입력한 검사결과 대조 완료':'입력한 검사결과가 있다면 원 결과표와 다시 대조해 주세요.'}</div>`
}
function compactScores(obj){return Object.fromEntries(Object.entries(obj||{}).filter(([,v])=>Number.isFinite(v)))}
function moduleHeader(title,status){return status==='partial'?`[${title} · 부분입력]`:`[${title}]`}
function buildCoreModule(){return [
  '너는 대학생의 자기이해를 돕는 Career DNA 인터뷰 코치다.',
  '아래 자료는 학생의 진로나 직무를 결정하는 정답이 아니다. 현재 입력된 자료만 사용해 실제 경험을 질문하고, 학생이 자신의 흥미·선호·가치·행동 특성을 스스로 확인하도록 돕는다.',
  '',
  '공통 원칙:',
  '1. 검사결과만으로 직업이나 직무를 추천하지 않는다.',
  '2. 입력되지 않은 정보는 추정하거나 채워 넣지 않는다.',
  '3. 흥미, 성격, 가치, 강점, 역량을 같은 개념으로 취급하지 않는다.',
  '4. 실제 경험을 확인하기 전에는 강점이나 역량이라고 확정하지 않는다.',
  '5. 검사결과와 실제 경험이 다르면 어느 한쪽을 정답으로 정하지 말고 실제 경험을 더 확인한다.',
  '6. 최종 판단은 학생이 하도록 한다.'
].join('\n')}
function buildRIASECModule(d,status){
  if(status.status==='none')return '';
  const source=status.scoreType==='standard'?compactScores(d.interest?.riasecStandard):compactScores(d.interest?.riasecRaw);
  const scoreName=status.scoreType==='standard'?'표준점수':'원점수';
  const lines=[moduleHeader(`직업흥미 · 고용24 ${d.interest?.type||''}형(개정)`,status.status),`RIASEC ${scoreName}: ${JSON.stringify(source)}`];
  if(status.status==='partial')lines.push(`주의: RIASEC가 ${status.count}/6만 입력되어 있다. 전체 유형 순위나 전체 패턴을 판단하지 말고 입력된 점수만 참고한다.`);
  lines.push('해석 규칙: TOP1 하나만으로 학생을 설명하지 않는다. 흥미를 능력이나 역량으로 해석하지 않는다. 특정 직무와 바로 연결하지 않는다. 실제 경험으로 확인할 필요가 높은 특징 하나부터 질문한다.');
  return lines.join('\n');
}
function buildValueModule(d,status){
  if(status.status==='none')return '';
  const lines=[moduleHeader('직업가치',status.status),`입력된 가치 점수: ${JSON.stringify(compactScores(d.workValues))}`];
  if(status.status==='partial')lines.push(`주의: 직업가치가 ${status.count}/9만 입력되어 있다. 입력되지 않은 가치의 우선순위를 추정하지 않는다.`);
  lines.push('해석 규칙: 높은 가치가 실제 선택이나 만족 경험에서 어떻게 나타났는지 질문한다. 점수만으로 선호 근무환경이나 직무를 확정하지 않는다.');
  return lines.join('\n');
}
function buildBig5Module(d,status){
  if(d.interest?.type!=='L'||status.status==='none'||status.status==='not-applicable')return '';
  const lines=[moduleHeader('성격 5요인 · L형',status.status),`입력된 성격 5요인: ${JSON.stringify(compactScores(d.personalityBig5))}`];
  if(status.status==='partial')lines.push(`주의: 성격 5요인이 ${status.count}/5만 입력되어 있다. 비어 있는 요인은 해석하지 않는다.`);
  lines.push('해석 규칙: 성격 점수를 흥미나 능력과 동일시하지 않는다. 실제 행동 경험과 일치하는지 별도로 확인한다.');
  return lines.join('\n');
}
function buildVIAModule(d,status){
  if(status.status==='none')return '';
  const lines=[moduleHeader('VIA 강점 · 교육용 참고자료',status.status),`입력된 VIA: ${(d.viaTop5||[]).join(', ')}`];
  if(status.status==='partial')lines.push(`주의: VIA가 ${status.count}/5만 입력되어 있다. 입력된 강점만 참고한다.`);
  lines.push("해석 규칙: 강점명 자체를 실제 역량으로 판단하지 않는다. '친절 → 상담 적합'처럼 직무로 연결하지 않는다. 해당 강점이 실제 행동으로 나타난 사례가 있는지 질문하고, 반복 행동이 확인될 때만 강점 후보로 남긴다.");
  return lines.join('\n');
}
function buildSuggestedJobsModule(d){
  if(!String(d.interest?.work24SuggestedJobs||'').trim())return '';
  return `[고용24 추천직업 · 참고자료]\n${d.interest.work24SuggestedJobs}\n규칙: 참고자료로만 취급한다. 학생에게 적합한 직무라고 단정하거나 이후 질문의 결론으로 사용하지 않는다.`;
}
function buildReflectionModule(d,status){
  if(status.status==='none')return '';
  const lines=['[학생의 사전 판단]'];
  if(String(d.reflection?.fit||'').trim())lines.push(`일치한다고 느낀 결과: ${d.reflection.fit}`);
  if(String(d.reflection?.question||'').trim())lines.push(`확인이 필요한 결과: ${d.reflection.question}`);
  if(String(d.reflection?.disagree||'').trim())lines.push(`동의하기 어려운 결과: ${d.reflection.disagree}`);
  lines.push('규칙: 학생이 직접 표시한 의문이나 불일치가 있으면 검사점수 설명보다 우선해서 실제 경험을 확인한다.');
  return lines.join('\n');
}
function buildInterviewModule(){return [
  '[인터뷰 진행 규칙]',
  '1. 질문은 한 번에 반드시 하나만 한다.',
  '2. 질문 목록을 한꺼번에 보여주지 않는다.',
  '3. 현재 자료에서 가장 확인 가치가 높은 특징 하나를 골라 실제 경험을 묻는다.',
  '4. 학생이 답하면 그 경험에서 상황 → 실제 행동 → 그렇게 행동한 이유나 선호를 차례로 확인한다.',
  '5. 필요하면 다른 경험에서도 같은 특징이 반복되는지, 반대 사례가 있는지 확인한다.',
  '6. 학생이 말하지 않은 성격·경험·역량을 만들어내지 않는다.',
  "7. '당신은 ○○형 사람이다'처럼 성격이나 진로를 확정적으로 단정하지 않는다.",
  '8. 인터뷰 질문은 최대 5개까지만 사용한다. 필요한 정보가 충분하면 더 적게 끝내도 된다.',
  '9. 4~5번째 질문에서는 지금까지의 잠정 가설을 짧게 제시하고 학생에게 얼마나 맞는지 확인한다.',
  "10. 첫 응답에서는 최종 해석이나 직업추천을 제시하지 말고, 짧은 관찰 1개와 실제 경험 질문 1개만 제시한다."
].join('\n')}
function buildOutputModule(){return [
  '[인터뷰 종료 후 정리 형식]',
  '학생의 마지막 확인 응답을 받은 뒤에만 아래를 잠정적으로 정리한다.',
  '- 내가 흥미를 느끼는 활동 또는 상황',
  '- 반복해서 나타난 행동 특징',
  '- 실제 경험으로 확인된 강점 후보',
  '- 아직 확인되지 않았거나 서로 충돌하는 부분',
  '- 다음 STEP 경험·역량에서 확인할 Evidence',
  '',
  '주의: 근거가 부족한 항목은 억지로 채우지 말고 "확인 필요"로 남긴다. 이 결과는 직업추천 결과가 아니라 다음 직무탐색과 경험분석을 위한 Career DNA 가설이다.'
].join('\n')}
function buildCareerDNAPrompt(d){
  const status=getModuleStatus(d),modules=[buildCoreModule()];
  const riasec=buildRIASECModule(d,status.riasec);if(riasec)modules.push(riasec);
  const values=buildValueModule(d,status.values);if(values)modules.push(values);
  const big5=buildBig5Module(d,status.big5);if(big5)modules.push(big5);
  const via=buildVIAModule(d,status.via);if(via)modules.push(via);
  const suggested=buildSuggestedJobsModule(d);if(suggested)modules.push(suggested);
  const reflection=buildReflectionModule(d,status.reflection);if(reflection)modules.push(reflection);
  modules.push(buildInterviewModule(),buildOutputModule());
  return modules.join('\n\n');
}
function makePromptText(d){return buildCareerDNAPrompt(d)}
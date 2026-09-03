const WORK24='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const VIA='https://www.viacharacter.org/';
const RIASEC=[['R','현실형'],['I','탐구형'],['A','예술형'],['S','사회형'],['E','진취형'],['C','관습형']];
const BIG5=['외향성','호감성','성실성','정서적 불안정성','경험에 대한 개방성'];
const VALIDITY=['사회적 바람직성','부주의성','온전성'];
const FACETS=['사교성','리더십','적극성','긍정성','타인에 대한 믿음','도덕성','타인에 대한 배려','수용성','겸손','휴머니즘','유능성','조직화능력','책임감','목표지향','자기통제력','완벽성','불안','분노','우울','자의식','충동성','스트레스 취약성','상상력','문화','정서','경험추구','지적호기심','대인관계지향'];
const LIFE=['독립심','가족친화','야망','학업성취','예술성','운동선호','종교성','직무만족'];
const VALUES=['사회적 공헌','변화 지향성','성취','경제적 보상','자기개발','일과 삶의 균형','사회적 인정','자율성','직업안정성'];

export async function render(ctx){
  const state=ctx.getState();
  const saved=state.assessments?.careerDNA||{};
  const forced=ctx.courseConfig.interest;
  const selected=forced!=='CHOICE'?forced:(saved.interest?.type||'S');
  const root=document.getElementById('stepRoot');
  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 1</div><h2>Career DNA</h2><p>고용24 검사결과와 나의 실제 경험을 분리해서 보고, 나중에 직무탐색의 근거로 사용합니다.</p></div><span class="badge">3주차</span></div>
    <div class="progress"><span style="width:14%"></span></div>
    <div class="callout info"><b>중요</b> · 검사결과는 직무의 정답이 아닙니다. 고용24도 직업선호도 결과만으로 직업을 결정하지 말고 가치관·희망직업·개인 상황을 함께 고려하도록 안내합니다. Jobfit은 검사결과로 직무를 자동 배정하지 않습니다.</div>

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

    <div class="hr"></div><div class="block"><h3>3. 성인용 직업가치관검사</h3><p class="help">현재 고용24가 안내하는 9개 직업가치 결과를 기록합니다. 검사시간은 약 20분입니다.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${WORK24}" target="_blank" rel="noopener">성인용 직업가치관검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${VALUES.map((n,i)=>scoreField(`val_${i}`,n,saved.workValues?.[n])).join('')}</div>
      <div class="grid2" style="margin-top:12px">${dateField('workValuesDate','검사일',saved.workValuesDate)}${txt('workValuesVersion','결과표 표기/버전',saved.workValuesVersion||'성인용 직업가치관검사','결과표에 표시된 명칭')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>4. VIA 강점 TOP5 <span class="muted">(교육용)</span></h3><p class="help">VIA는 자기이해와 경험탐색을 위한 보조자료입니다. 검사결과만으로 직무를 추천하지 않습니다.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${VIA}" target="_blank" rel="noopener">VIA 검사 사이트 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2,3,4].map(i=>`<div class="field"><label>TOP ${i+1}</label><input class="input" id="via_${i}" value="${ctx.escapeHtml(saved.viaTop5?.[i]||'')}" placeholder="결과에 표시된 강점명"></div>`).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>5. 검사결과와 실제 나 비교</h3><p class="help">AI보다 먼저 본인이 결과를 검토합니다. ‘맞다/아니다’보다 실제 경험 근거를 적는 것이 중요합니다.</p>
      <div class="grid3">
        ${area('fit','일치하는 결과','어떤 실제 경험 때문에 이 결과가 나와 비슷하다고 느끼나요?',saved.reflection?.fit,ctx)}
        ${area('question','확인이 필요한 결과','왜 이렇게 나왔는지 더 확인하고 싶은 부분은?',saved.reflection?.question,ctx)}
        ${area('disagree','동의하기 어려운 결과','어떤 실제 경험과 달라서 동의하기 어렵나요?',saved.reflection?.disagree,ctx)}
      </div>
      <label class="checkRow"><input type="checkbox" id="resultChecked" ${saved.resultChecked?'checked':''}><div><b>결과표 대조 완료</b><span>입력한 숫자가 고용24 결과표와 일치하는지 다시 확인했습니다.</span></div></label>
    </div>

    <div class="hr"></div><div class="block"><h3>6. Career DNA 요약 + AI LAB</h3><div class="summaryBox" id="dnaSummary">${summaryHtml(saved,selected,ctx)}</div>
      <p class="help" style="margin-top:12px">AI는 검사결과를 직무로 변환하는 추천기가 아니라, 결과와 실제 경험 사이의 일치·충돌을 질문하는 역할로 사용합니다.</p>
      <div class="actions"><button class="btn secondary" id="makePrompt">AI 통합해석 프롬프트 만들기</button><button class="btn outline hidden" id="copyPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="promptBox"></div>
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
      interest:{type:selected,examDate:v('examDate')||new Date().toISOString().slice(0,10),resultVersion:v('resultVersion'),resultSource:v('resultSource'),riasecRaw,riasecStandard,work24SuggestedJobs:v('work24SuggestedJobs'),suggestedJobsPolicy:'reference-only-not-used-for-job-ranking'},
      personalityBig5,personalityValidity,personalityFacets,lifeHistory,
      workValues,workValuesDate:v('workValuesDate'),workValuesVersion:v('workValuesVersion'),viaTop5,
      reflection:{fit:v('fit'),question:v('question'),disagree:v('disagree')},resultChecked:document.getElementById('resultChecked').checked
    };
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
function buildSummary(d){return {interestType:d.interest?.type,riasecTop:ranked(d.interest?.riasecStandard,3).map(([k,v])=>({code:k,score:v})),valueTop:ranked(d.workValues,3).map(([name,score])=>({name,score})),personalityTop:ranked(d.personalityBig5,2).map(([name,score])=>({name,score})),viaTop5:d.viaTop5||[],studentReflection:d.reflection||{},resultChecked:!!d.resultChecked,updatedAt:new Date().toISOString()}}
function summaryHtml(d,selected,ctx){const x=buildSummary({...d,interest:{...(d.interest||{}),type:selected}});return `<h4>나의 Career DNA</h4><div class="resultGrid"><div class="resultCard"><strong>흥미 · ${selected}형(개정)</strong><p>${x.riasecTop.length?x.riasecTop.map(a=>`${a.code} ${a.score}`).join(' · '):'RIASEC 표준점수를 입력하면 상위 3개가 표시됩니다.'}</p></div><div class="resultCard"><strong>직업가치 TOP3</strong><p>${x.valueTop.length?x.valueTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'9개 가치 점수를 입력해 주세요.'}</p></div>${selected==='L'?`<div class="resultCard"><strong>성격 5요인 상위</strong><p>${x.personalityTop.length?x.personalityTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'성격 5요인 점수를 입력해 주세요.'}</p></div>`:''}<div class="resultCard"><strong>VIA TOP5</strong><p>${x.viaTop5.length?x.viaTop5.map(ctx.escapeHtml).join(' · '):'교육용 강점을 입력해 주세요.'}</p></div></div><div class="callout ${x.resultChecked?'good':'warn'}">${x.resultChecked?'결과표 대조 완료':'저장 전 고용24 결과표와 입력값을 다시 대조하세요.'}</div>`}
function makePromptText(d){return `너는 대학생의 Career DNA를 해석하는 진로코치다. 아래 자료를 직무추천의 정답처럼 사용하지 말고, 내가 실제 경험으로 확인할 수 있도록 질문해줘.\n\n[직업선호도] ${d.interest.type}형(개정)\nRIASEC 표준점수: ${JSON.stringify(d.interest.riasecStandard)}\n[직업가치] ${JSON.stringify(d.workValues)}\n[성격 5요인] ${JSON.stringify(d.personalityBig5)}\n[VIA TOP5] ${d.viaTop5.join(', ')}\n[내가 일치한다고 느낀 결과] ${d.reflection.fit||'없음'}\n[확인이 필요한 결과] ${d.reflection.question||'없음'}\n[동의하기 어려운 결과] ${d.reflection.disagree||'없음'}\n\n규칙:\n1. 검사점수만 보고 직무명을 추천하지 않는다.\n2. 먼저 결과 간 공통점과 충돌점을 구분한다.\n3. 각 해석마다 '이 해석을 확인할 수 있는 실제 경험이 있는가?'를 질문한다.\n4. 내가 말하지 않은 성격·경험·역량을 만들어내지 않는다.\n5. 고용24 추천직업이 입력돼 있더라도 참고자료로만 취급한다.\n6. 마지막에는 확정 결론 대신 다음 단계에서 확인해야 할 경험 질문 5개를 제시한다.`}

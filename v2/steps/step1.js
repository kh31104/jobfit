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
    <div class="sectionHead"><div><div class="kicker">STEP 1</div><h2>Career DNA</h2><p>흥미·성격·가치·강점을 한 번에 보고, 검사결과와 실제 나를 비교합니다.</p></div><span class="badge">3주차</span></div>
    <div class="progress"><span style="width:14%"></span></div>
    <div class="callout info"><b>검사는 정답이 아니라 탐색자료입니다.</b> 높은 점수를 곧바로 직무추천으로 연결하지 않고, 실제 경험·선호와 맞는지 확인합니다.</div>

    <div class="block"><h3>1. 직업선호도검사 선택</h3><p class="help">S형과 L형은 같은 학생이 중복 시행하지 않습니다. 일반 사용자는 하나를 고르고, 수업에서는 교수자가 지정할 수 있습니다.</p>
      <div class="choiceGrid">
        ${choice('S','고용24 S형','흥미 중심 · 약 25분',selected,forced)}
        ${choice('L','고용24 L형','흥미 + 성격 + 생활사 · 약 60분',selected,forced)}
      </div>
      ${forced!=='CHOICE'?`<div class="callout good">이 수업의 지정검사는 <b>${forced}형</b>입니다.</div>`:''}
      <div class="actions"><a class="btn primary linkBtn" href="${WORK24}" target="_blank" rel="noopener">고용24 직업심리검사 열기 ↗</a></div>
    </div>

    <div class="hr"></div><div class="block"><h3>2. ${selected}형 결과 입력</h3><p class="help">결과표의 RIASEC 6개 점수를 입력합니다. 연구 활용을 고려해 원점수와 표준점수를 모두 저장할 수 있게 합니다.</p>
      <div class="grid3">${RIASEC.map(([k,n])=>riasecCard(k,n,saved)).join('')}</div>
      ${selected==='L'?lFields(saved):''}
    </div>

    <div class="hr"></div><div class="block"><h3>3. 직업가치관</h3><p class="help">현재 고용24 성인용 직업가치관검사의 9개 가치 결과를 기록합니다. 결과표에 표시된 점수를 그대로 입력하세요.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${WORK24}" target="_blank" rel="noopener">직업가치관검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${VALUES.map((n,i)=>scoreField(`val_${i}`,n,saved.workValues?.[n])).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>4. VIA 강점 TOP5 <span class="muted">(교육용)</span></h3><p class="help">VIA는 수업의 자기이해와 경험탐색에 사용합니다. 현재 Research Core의 필수 변수로는 두지 않습니다.</p>
      <div class="actions"><a class="btn secondary linkBtn" href="${VIA}" target="_blank" rel="noopener">VIA 검사 사이트 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2,3,4].map(i=>`<div class="field"><label>TOP ${i+1}</label><input class="input" id="via_${i}" value="${ctx.escapeHtml(saved.viaTop5?.[i]||'')}" placeholder="결과에 표시된 강점명"></div>`).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><h3>5. 검사결과와 실제 나 비교</h3><p class="help">AI보다 먼저 학생 본인이 해석합니다. 이 기록이 Career DNA 통합해석의 핵심입니다.</p>
      <div class="grid3">
        ${area('fit','가장 나와 맞는 결과','이 결과는 실제 내 모습과 왜 비슷한가?',saved.reflection?.fit,ctx)}
        ${area('question','아직 잘 모르겠는 결과','왜 이렇게 나왔는지 궁금한 점은?',saved.reflection?.question,ctx)}
        ${area('disagree','동의하기 어려운 결과','내 경험과 다르다고 느끼는 이유는?',saved.reflection?.disagree,ctx)}
      </div>
    </div>

    <div class="hr"></div><div class="block"><h3>6. Career DNA 요약 + AI LAB</h3><div class="summaryBox" id="dnaSummary">${summaryHtml(saved,selected,ctx)}</div>
      <p class="help" style="margin-top:12px">AI는 결과를 단정하지 않고, 학생의 경험을 확인하는 질문자 역할로 사용합니다.</p>
      <div class="actions"><button class="btn secondary" id="makePrompt">AI 통합해석 프롬프트 만들기</button><button class="btn outline hidden" id="copyPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="promptBox"></div>
    </div>

    <div class="actions"><button class="btn primary" id="saveDNA">Career DNA 저장</button><button class="btn secondary" id="nextStep">STEP 2 경험·역량 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('.choiceCard[data-type]').forEach(card=>card.addEventListener('click',()=>{
    if(forced!=='CHOICE') return;
    const type=card.dataset.type;ctx.saveState({assessments:{careerDNA:{...ctx.getState().assessments.careerDNA,interest:{...(ctx.getState().assessments.careerDNA.interest||{}),type}}}});ctx.navigate(1);
  }));
  document.getElementById('saveDNA').addEventListener('click',()=>saveData(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveData(false);ctx.navigate(2)});
  document.getElementById('makePrompt').addEventListener('click',()=>{const data=saveData(false);const prompt=makePromptText(data);const box=document.getElementById('promptBox');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyPrompt').classList.remove('hidden');});
  document.getElementById('copyPrompt').addEventListener('click',async()=>{const text=document.getElementById('promptBox').textContent;try{await navigator.clipboard.writeText(text);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사가 차단되었습니다. 텍스트를 직접 선택해 복사해 주세요.')}});

  function saveData(showToast){
    const riasecRaw={},riasecStandard={};RIASEC.forEach(([k])=>{riasecRaw[k]=num(`raw_${k}`);riasecStandard[k]=num(`std_${k}`)});
    const personalityBig5={},personalityValidity={},personalityFacets={},lifeHistory={};
    if(selected==='L'){
      BIG5.forEach((n,i)=>personalityBig5[n]=num(`big5_${i}`));VALIDITY.forEach((n,i)=>personalityValidity[n]=num(`valid_${i}`));FACETS.forEach((n,i)=>personalityFacets[n]=num(`facet_${i}`));LIFE.forEach((n,i)=>lifeHistory[n]=num(`life_${i}`));
    }
    const workValues={};VALUES.forEach((n,i)=>workValues[n]=num(`val_${i}`));
    const viaTop5=[0,1,2,3,4].map(i=>v(`via_${i}`)).filter(Boolean);
    const data={interest:{type:selected,examDate:new Date().toISOString().slice(0,10),riasecRaw,riasecStandard},personalityBig5,personalityValidity,personalityFacets,lifeHistory,workValues,viaTop5,reflection:{fit:v('fit'),question:v('question'),disagree:v('disagree')}};
    ctx.saveState({assessments:{careerDNA:data},artifacts:{careerDNAProfile:buildSummary(data)}});document.getElementById('dnaSummary').innerHTML=summaryHtml(data,selected,ctx);document.getElementById('status').textContent='저장되었습니다.';if(showToast)ctx.toast('Career DNA를 저장했습니다.');return data;
  }
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
  function num(id){const x=v(id);return x===''?null:Number(x)}
}

function choice(type,title,desc,selected,forced){return `<div class="choiceCard ${selected===type?'on':''}" data-type="${type}" style="${forced!=='CHOICE'&&forced!==type?'opacity:.45':''}"><b>${title}</b><span>${desc}</span></div>`}
function riasecCard(k,n,saved){const raw=saved.interest?.riasecRaw?.[k]??'',std=saved.interest?.riasecStandard?.[k]??'';return `<div class="metricCard"><b>${k} · ${n}</b><div class="scorePair"><label><small>원점수</small><input class="input scoreInput" type="number" step="any" id="raw_${k}" value="${raw}"></label><label><small>표준점수</small><input class="input scoreInput" type="number" step="any" id="std_${k}" value="${std}"></label></div></div>`}
function scoreField(id,label,value){return `<div class="field"><label>${label}</label><input class="input scoreInput" type="number" step="any" id="${id}" value="${value??''}" placeholder="점수"></div>`}
function lFields(saved){return `<div class="block"><h3>L형 성격 5요인</h3><p class="help">L형을 선택한 경우 결과표의 성격 5요인 전체 점수를 기록합니다.</p><div class="grid3">${BIG5.map((n,i)=>scoreField(`big5_${i}`,n,saved.personalityBig5?.[n])).join('')}</div></div>
<details class="detailsBox block"><summary>L형 상세 성격·생활사 점수 입력 (연구 상세저장용)</summary><p class="help">결과표에 상세 점수가 제공되는 경우 입력합니다. 향후 API 연동 시 자동수집 대상으로 전환할 수 있습니다.</p><h4>응답·타당도 관련</h4><div class="grid3">${VALIDITY.map((n,i)=>scoreField(`valid_${i}`,n,saved.personalityValidity?.[n])).join('')}</div><h4>성격 하위요인</h4><div class="grid4">${FACETS.map((n,i)=>scoreField(`facet_${i}`,n,saved.personalityFacets?.[n])).join('')}</div><h4>생활사</h4><div class="grid4">${LIFE.map((n,i)=>scoreField(`life_${i}`,n,saved.lifeHistory?.[n])).join('')}</div></details>`}
function area(id,title,ph,value,ctx){return `<div class="field"><label>${title}</label><textarea id="${id}" placeholder="${ph}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function ranked(obj,n=3){return Object.entries(obj||{}).filter(([,v])=>Number.isFinite(v)).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function buildSummary(d){return {interestType:d.interest.type,riasecTop:ranked(d.interest.riasecStandard,2).map(([k,v])=>({code:k,score:v})),valueTop:ranked(d.workValues,3).map(([name,score])=>({name,score})),personalityTop:ranked(d.personalityBig5,2).map(([name,score])=>({name,score})),viaTop5:d.viaTop5,studentReflection:d.reflection,updatedAt:new Date().toISOString()}}
function summaryHtml(d,selected,ctx){const x=buildSummary({...d,interest:{...(d.interest||{}),type:selected}});return `<h4>나의 Career DNA</h4><div class="resultGrid"><div class="resultCard"><strong>흥미 · ${selected}형</strong><p>${x.riasecTop.length?x.riasecTop.map(a=>`${a.code} ${a.score}`).join(' · '):'RIASEC 표준점수를 입력하면 TOP2가 표시됩니다.'}</p></div><div class="resultCard"><strong>직업가치 TOP3</strong><p>${x.valueTop.length?x.valueTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'9개 가치 점수를 입력해 주세요.'}</p></div>${selected==='L'?`<div class="resultCard"><strong>성격 5요인 상위</strong><p>${x.personalityTop.length?x.personalityTop.map(a=>`${ctx.escapeHtml(a.name)} ${a.score}`).join(' · '):'성격 5요인 점수를 입력해 주세요.'}</p></div>`:''}<div class="resultCard"><strong>VIA TOP5</strong><p>${x.viaTop5?.length?x.viaTop5.map(ctx.escapeHtml).join(' · '):'VIA 결과를 입력해 주세요.'}</p></div></div>`}
function makePromptText(d){const r=ranked(d.interest.riasecStandard,6).map(([k,v])=>`${k}:${v}`).join(', ');const vals=ranked(d.workValues,9).map(([k,v])=>`${k}:${v}`).join(', ');const p=ranked(d.personalityBig5,5).map(([k,v])=>`${k}:${v}`).join(', ');return `너는 대학생 진로탐색을 돕는 Career Interviewer다. 아래 검사결과를 근거로 직무를 단정하거나 새로운 사실을 만들지 마라. 먼저 결과 간 공통패턴과 충돌 가능성을 구분하고, 반드시 내 실제 경험을 확인하는 질문을 한 번에 하나씩 총 3개 해줘. 내가 답한 뒤에만 통합해석을 작성해줘.\n\n[직업선호도 ${d.interest.type}형 / RIASEC 표준점수]\n${r||'미입력'}\n\n[직업가치]\n${vals||'미입력'}\n${d.interest.type==='L'?`\n[성격 5요인]\n${p||'미입력'}\n`:''}\n[VIA TOP5]\n${d.viaTop5?.join(', ')||'미입력'}\n\n[내가 가장 맞다고 느낀 결과]\n${d.reflection?.fit||'미입력'}\n\n[아직 잘 모르겠는 결과]\n${d.reflection?.question||'미입력'}\n\n[동의하기 어려운 결과]\n${d.reflection?.disagree||'미입력'}\n\n규칙:\n1. 검사결과를 성격의 정답처럼 표현하지 말 것.\n2. 검사점수만으로 직업을 추천하지 말 것.\n3. 내가 실제로 한 경험과 행동을 질문해 검증할 것.\n4. 최종 해석은 '확인된 패턴 / 추가 확인이 필요한 부분 / 다음 경험탐색 질문'으로 구분할 것.`}

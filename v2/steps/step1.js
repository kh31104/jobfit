import {castBalanceVote,getBalanceCounts,classSessionCode} from '../classroomVotes.js';

const PROMPT_VERSION='career-dna-research-v1';
const VIA_URL='https://www.viacharacter.org/Survey//Account/Register';
const WORK24_URL='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const RIASEC=['R','I','A','S','E','C'];
const STRENGTHS=['감사','공감','도전','사랑','시간관리','온화함','자기관리','조화','추진력','학습','감수성','글쓰기','동기부여','설득력','신중함','용기','자신감','진정성','친절','행동력','개인화','끈기','리더십','설명력','심미안','유머','자제력','진행력','통찰력','협력','겸손','낙관주의','박학다식','섬세함','연결성','유쾌함','적응력','집중력','평등심','호기심','경청','논리성','분석력','성장','열린 마음','의사소통','전략','창의성','포용력','활력','계획','대중성','사교성','승부욕','열정','이해력','정리정돈','책임감','피드백','회복탄력성'];
const BALANCE=[
  {title:'고연봉 vs 저녁이 있는 삶',a:'연봉 7,500만 원',b:'저녁이 있는 삶',av:'보상',bv:'일과 삶의 균형'},
  {title:'빠른 성장 vs 오래 다닐 안정성',a:'3년 뒤 몸값 2배',b:'평생 다닐 수 있는 회사',av:'성장',bv:'안정성'},
  {title:'회사 이름 vs 내가 쌓는 실력',a:'모두가 아는 회사',b:'진짜 실력이 느는 회사',av:'기업 브랜드',bv:'전문성 성장'},
  {title:'근무 편의 vs 최고의 사수',a:'침대에서 10분 만에 출근',b:'왕복 2시간 40분, 최고의 사수',av:'근무 편의',bv:'학습·멘토'},
  {title:'높은 보상 vs 좋은 리더',a:'연봉 7,000만 원',b:'좋은 리더와 일하기',av:'보상',bv:'관계·리더십'},
  {title:'서울의 기회 vs 지역의 삶',a:'서울의 꿈의 회사',b:'지역에서의 편안한 삶',av:'커리어 기회',bv:'생활 기반'},
  {title:'좋아하는 일 vs 잘하는 일',a:'좋아하지만 아직 서툰 일',b:'아주 좋아하진 않지만 잘하는 일',av:'흥미',bv:'강점·역량'}
];

export async function render(ctx){
  const state=ctx.getState();
  const saved=state.assessments?.careerDNA||{};
  const root=document.getElementById('stepRoot');
  const balanceAnswers=normalizeBalance(saved.balance?.answers);
  const selfStrengths=Array.isArray(saved.selfStrengths)?saved.selfStrengths.slice(0,5):[];
  const selfInterest=Array.isArray(saved.selfInterest?.clues)?saved.selfInterest.clues.slice(0,3):[];
  while(selfInterest.length<3)selfInterest.push('');
  const interest=saved.interest||{};
  const selfValues=Array.isArray(saved.selfValues?.items)?saved.selfValues.items.slice(0,5):[];
  while(selfValues.length<5)selfValues.push('');
  const workValueEntries=Object.entries(saved.workValues||{}).slice(0,9);
  while(workValueEntries.length<9)workValueEntries.push(['','']);
  const viaTop5=Array.isArray(saved.viaTop5)?saved.viaTop5.slice(0,5):[];
  const comparison=saved.comparison||{};

  root.innerHTML=`<section class="card careerDnaStandard">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 1 · RESEARCH-SAFE v1</div><h2>Career DNA</h2><p>내가 생각하는 나와 검사에서 나타난 나를 비교해 <b>자기이해 가설</b>을 만듭니다.</p></div><span class="badge">3주차</span></div>
    <div class="progress"><span style="width:14%"></span></div>
    <div class="callout info"><b>오늘의 흐름</b> · 커리어 밸런스게임 → 나의 흥미 → 고용24 S형 → 나의 직업가치 → 고용24 직업가치관 → 나의 강점 → VIA → 직접 비교 → AI 통합분석</div>
    <div class="callout good"><b>이번 학기 운영</b> · 개인 검사결과와 활동내용은 교수자에게 자동 전송하지 않습니다. 이 브라우저에 저장하고, 다른 기기에서는 내 학습 백업파일을 사용합니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>커리어 밸런스게임 (Balance Game)</h3><p>수업용 워밍업입니다. 심리검사나 직업적합성 판정에 사용하지 않습니다.</p></div></div>
      <div class="callout warn"><b>먼저 내 선택을 확정합니다.</b> 다른 참여자의 비율은 선택한 뒤에만 보입니다. 한 번 확정한 선택은 친구들의 결과를 보고 바꾸지 않습니다.</div>
      <div id="balanceQuestions">${balanceHtml(balanceAnswers,ctx)}</div>
      <div id="balanceSummary">${balanceSummaryHtml(balanceAnswers,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>내가 생각하는 나의 흥미</h3><p>공식검사 결과를 보기 전에, 평소 자연스럽게 끌리는 활동을 먼저 기록합니다.</p></div></div>
      <div class="callout info"><b>자기인식 활동</b> · 심리검사가 아닙니다. 검사 결과에 맞추기보다 실제로 좋아하거나 반복해서 선택하는 활동을 적으세요.</div>
      <div class="grid3">${[0,1,2].map(i=>field(`selfInterest_${i}`,`흥미 단서 ${i+1}`,selfInterest[i]||'','예: 자료를 찾아 비교하기, 사람에게 설명하기',ctx)).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>고용24 직업선호도검사 S형</h3><p>고용24 공식검사를 실시한 뒤 결과표의 RIASEC 점수를 입력합니다.</p></div></div>
      <div class="callout warn"><b>공식검사는 고용24에서 실시합니다.</b> Jobfit은 검사 문항을 복제하지 않으며 결과점수만 저장합니다. 같은 시점에 S형과 L형을 모두 요구하지 않습니다.</div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 직업심리검사 열기 ↗</a></div>
      <div class="field" style="margin-top:12px"><label>검사일</label><input class="input" id="interestExamDate" type="date" value="${ctx.escapeHtml(interest.examDate||'')}"></div>
      <div class="summaryBox" style="margin-top:12px"><h4>RIASEC 결과 입력</h4><p class="help">결과표에 원점수와 표준점수가 모두 있으면 둘 다 입력합니다. 한 종류만 확인되면 해당 점수만 입력해도 됩니다.</p><div class="grid3">${RIASEC.map(code=>`<div class="field"><label>${code} 원점수</label><input class="input" type="number" step="0.01" id="riasecRaw_${code}" value="${ctx.escapeHtml(interest.riasecRaw?.[code]??'')}" placeholder="있으면 입력"><label style="margin-top:5px">${code} 표준점수</label><input class="input" type="number" step="0.01" id="riasecStandard_${code}" value="${ctx.escapeHtml(interest.riasecStandard?.[code]??'')}" placeholder="있으면 입력"></div>`).join('')}</div></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>내가 생각하는 나의 직업가치</h3><p>공식 직업가치관검사를 보기 전에, 일과 회사를 선택할 때 중요하게 생각하는 기준을 적습니다.</p></div></div>
      <div class="callout info"><b>자기인식 활동</b> · 정답이나 점수는 없습니다. 현재 중요하게 보는 기준을 최대 5개까지 적습니다.</div>
      <div class="grid3">${[0,1,2,3,4].map(i=>field(`selfValue_${i}`,`가치 단서 ${i+1}`,selfValues[i]||'','예: 안정성, 성장, 자율성, 관계, 보상',ctx)).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>05</span><div><h3>고용24 성인용 직업가치관검사</h3><p>공식검사 결과표에 표시된 가치요인 이름과 점수를 그대로 입력합니다.</p></div></div>
      <div class="callout warn"><b>결과표의 명칭을 그대로 사용하세요.</b> Jobfit이 임의로 가치요인 명칭이나 점수를 바꾸지 않습니다.</div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 직업가치관검사 열기 ↗</a></div>
      <div class="field" style="margin-top:12px"><label>검사일</label><input class="input" id="workValuesDate" type="date" value="${ctx.escapeHtml(saved.workValuesDate||'')}"></div>
      <div class="grid2" style="margin-top:12px">${workValueEntries.map(([name,score],i)=>`<div class="summaryBox"><div class="field"><label>가치요인 ${i+1} 이름</label><input class="input" id="workValueName_${i}" value="${ctx.escapeHtml(name||'')}" placeholder="결과표 명칭"></div><div class="field"><label>점수</label><input class="input" type="number" step="0.01" id="workValueScore_${i}" value="${ctx.escapeHtml(score??'')}" placeholder="결과표 점수"></div></div>`).join('')}</div>
    </div>
    <div class="hr"></div><div class="block"><div class="moduleHead"><span>06</span><div><h3>내가 생각하는 나의 강점</h3><p>검사결과를 보기 전에, 평소 스스로 생각하는 대표 강점 5개를 선택합니다.</p></div></div>
      <div class="strengthCounter" id="strengthCounter">${selfStrengths.length}/5 선택</div><div class="strengthGrid" id="strengthGrid">${strengthHtml(selfStrengths,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>07</span><div><h3>VIA 성격강점</h3><p>공식 VIA 검사 후 상위 5개 강점만 Jobfit에 입력합니다.</p></div></div>
      <div class="callout info">VIA는 <b>성격강점에 대한 자기보고 자료</b>입니다. 현재 결과에서 상대적으로 상위에 나타난 강점으로 읽고, 직업·역량·성격의 확정판정에 사용하지 않습니다.</div>
      <div class="actions"><a class="btn secondary" href="${VIA_URL}" target="_blank" rel="noopener">VIA 공식 검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2,3,4].map(i=>field(`via_${i}`,`TOP ${i+1}`,viaTop5[i]||'','결과에 표시된 강점명',ctx)).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>08</span><div><h3>내가 생각하는 나 × 검사에서 나타난 나</h3><p>AI보다 먼저 직접 비교합니다. 검사가 ‘실제 나’의 정답은 아닙니다.</p></div></div>
      <div class="compareColumns"><div class="compareCard qualitative"><b>내가 생각하는 나 · 정성</b><div id="qualSummary">${qualSummaryHtml(balanceAnswers,selfInterest,selfValues,selfStrengths,ctx)}</div></div><div class="compareCard quantitative"><b>검사에서 나타난 나 · 정량</b><div id="quantSummary">${quantSummaryHtml(interest,saved.workValues||{},viaTop5,ctx)}</div></div></div>
      <div class="grid2" style="margin-top:14px">
        ${area('compare_repeat','반복해서 나타난 부분','여러 결과에서 비슷하게 나타난 특징은?',comparison.repeat||saved.reflection?.fit||'',ctx)}
        ${area('compare_connect','서로 연결된다고 느끼는 부분','표현은 달라도 서로 연결된다고 느끼는 결과는?',comparison.connect||'',ctx)}
        ${area('compare_unexpected','예상과 달랐던 부분','내 생각과 다르게 나온 결과는?',comparison.unexpected||saved.reflection?.disagree||'',ctx)}
        ${area('compare_verify','더 확인하고 싶은 부분','실제 경험으로 확인해보고 싶은 것은?',comparison.verify||saved.reflection?.question||'',ctx)}
      </div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>09</span><div><h3>AI 자기이해 통합분석</h3><p>현재 입력된 결과만 사용해 자기이해 가설을 만드는 프롬프트를 생성합니다.</p></div></div>
      <div class="callout info" id="careerDnaAiGuide"><b>AI LAB 사용 순서</b><br>① 현재 내용 저장 → ② 통합분석 프롬프트 만들기 → ③ 복사 → ④ 수업에서 사용하는 AI에 붙여넣기<br><span class="muted">Jobfit이 입력내용을 AI로 자동 전송하지는 않습니다.</span></div>
      <div class="actions"><button class="btn secondary" id="makePrompt">현재 결과로 자기이해 통합하기</button><button class="btn outline hidden" id="copyPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="promptBox"></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>10</span><div><h3>Career DNA 가설 v1</h3><p>자기인식과 검사결과를 바탕으로 만든 현재 시점의 가설입니다. 개인의 고정적 특성이나 직무적합성 판정이 아니며, 4주차 실제 경험에서 수정·확인합니다.</p></div></div>
      <div class="field"><label>AI 통합분석 결과 · 내가 확인한 내용</label><textarea id="aiHypothesis" placeholder="AI 결과를 그대로 믿지 말고, 입력자료와 맞는지 확인한 뒤 가설로 유지할 부분·수정할 부분·실제 경험에서 확인할 부분을 남기세요.">${ctx.escapeHtml(saved.hypothesis?.text||'')}</textarea></div>
      <div class="field" style="margin-top:12px"><label>현재 결과가 나를 얼마나 잘 설명하나요?</label><select class="input" id="hypothesisFit"><option value="">선택</option>${['매우 맞음','어느 정도 맞음','잘 모르겠음','맞지 않음'].map(x=>`<option ${saved.hypothesis?.selfCheck===x?'selected':''}>${x}</option>`).join('')}</select></div>
    </div>

    <div class="actions"><button class="btn primary" id="saveDNA">3주차 Career DNA 저장</button><button class="btn secondary" id="nextStep">4주차로 이동 →</button></div><div class="status" id="status"></div>
  </section>`;

  let strengthSelection=[...selfStrengths];
  let voteTimer=null;
  bindBalance();
  bindStrengths();
  ['via_0','via_1','via_2','via_3','via_4',...RIASEC.flatMap(code=>[`riasecRaw_${code}`,`riasecStandard_${code}`]),...Array.from({length:9},(_,i)=>`workValueScore_${i}`)].forEach(id=>document.getElementById(id)?.addEventListener('change',refreshCompare));
  document.getElementById('saveDNA').addEventListener('click',()=>saveData(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveData(false);ctx.navigate(2)});
  document.getElementById('makePrompt').addEventListener('click',()=>{const data=saveData(false);const prompt=buildPrompt(data);const box=document.getElementById('promptBox');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyPrompt').classList.remove('hidden')});
  document.getElementById('copyPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('promptBox').textContent);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사가 차단되었습니다. 직접 선택해 복사해 주세요.')}});

  function bindBalance(){
    root.querySelectorAll('[data-balance-choice]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=Number(btn.dataset.index),choice=btn.dataset.balanceChoice;
      if(balanceAnswers[i])return;
      if(!confirm('이 선택으로 확정할까요? 확정 후 다른 참여자의 선택 비율이 공개됩니다.'))return;
      const q=BALANCE[i];balanceAnswers[i]={questionId:i+1,choice,label:choice==='A'?q.a:q.b,value:choice==='A'?q.av:q.bv,confirmedAt:new Date().toISOString()};
      saveData(false);renderBalanceSection();
      try{await castBalanceVote(ctx.courseConfig.course||'INJE2026',i,choice);await updateVote(i)}catch{setVoteMessage(i,'현재 수업 선택 비율을 불러오지 못했습니다. 내 선택은 개인 화면에 저장되었습니다.')}
      startVotePolling();
    }));
    startVotePolling();
  }
  function renderBalanceSection(){const el=document.getElementById('balanceQuestions');if(el)el.innerHTML=balanceHtml(balanceAnswers,ctx);const s=document.getElementById('balanceSummary');if(s)s.innerHTML=balanceSummaryHtml(balanceAnswers,ctx);bindBalance();refreshCompare()}
  function startVotePolling(){if(voteTimer)return;const answered=()=>balanceAnswers.map((x,i)=>x?i:null).filter(x=>x!==null);if(!answered().length)return;voteTimer=setInterval(async()=>{if(!document.body.contains(root)){clearInterval(voteTimer);voteTimer=null;return}for(const i of answered())await updateVote(i)},2500);for(const i of answered())updateVote(i)}
  async function updateVote(i){try{const c=await getBalanceCounts(ctx.courseConfig.course||'INJE2026',i),el=document.getElementById(`vote_${i}`);if(el)el.innerHTML=`<div><b>A ${c.aPercent.toFixed(1)}%</b> · ${c.a}명</div><div><b>B ${c.bPercent.toFixed(1)}%</b> · ${c.b}명</div><small>현재 수업 ${c.total}명 기준 · 약 2.5초 간격 업데이트</small>`}catch{setVoteMessage(i,'수업 선택 비율 연결 확인 중...')}}
  function setVoteMessage(i,msg){const el=document.getElementById(`vote_${i}`);if(el)el.innerHTML=`<small>${ctx.escapeHtml(msg)}</small>`}

  function bindStrengths(){root.querySelectorAll('[data-strength]').forEach(btn=>btn.addEventListener('click',()=>{const s=btn.dataset.strength,i=strengthSelection.indexOf(s);if(i>=0)strengthSelection.splice(i,1);else{if(strengthSelection.length>=5){ctx.toast('대표 강점은 5개까지 선택합니다.');return}strengthSelection.push(s)}const g=document.getElementById('strengthGrid');if(g)g.innerHTML=strengthHtml(strengthSelection,ctx);const c=document.getElementById('strengthCounter');if(c)c.textContent=`${strengthSelection.length}/5 선택`;bindStrengths();refreshCompare()}))}
  function refreshCompare(){const via=readVia(),selfI=readSelfInterest(),selfV=readSelfValues(),interestData=readInterest(),workValueData=readWorkValues();const q=document.getElementById('qualSummary');if(q)q.innerHTML=qualSummaryHtml(balanceAnswers,selfI,selfV,strengthSelection,ctx);const n=document.getElementById('quantSummary');if(n)n.innerHTML=quantSummaryHtml(interestData,workValueData.scores,via,ctx)}
  function readVia(){return [0,1,2,3,4].map(i=>document.getElementById(`via_${i}`)?.value?.trim()||'').filter(Boolean)}
  function readSelfInterest(){return [0,1,2].map(i=>v(`selfInterest_${i}`)).filter(Boolean)}
  function readSelfValues(){return [0,1,2,3,4].map(i=>v(`selfValue_${i}`)).filter(Boolean)}
  function readInterest(){const raw={},standard={};RIASEC.forEach(code=>{const rv=document.getElementById(`riasecRaw_${code}`)?.value,sv=document.getElementById(`riasecStandard_${code}`)?.value;if(rv!==''&&Number.isFinite(Number(rv)))raw[code]=Number(rv);if(sv!==''&&Number.isFinite(Number(sv)))standard[code]=Number(sv)});return {type:'S',examDate:v('interestExamDate'),riasecRaw:raw,riasecStandard:standard,resultVersion:'Work24-S-current'}}
  function readWorkValues(){const scores={};for(let i=0;i<9;i++){const name=v(`workValueName_${i}`),raw=document.getElementById(`workValueScore_${i}`)?.value;if(name&&raw!==''&&Number.isFinite(Number(raw)))scores[name]=Number(raw)}return {scores,date:v('workValuesDate')}}
  function saveData(showToast){
    const via=readVia(),selfInterestData=readSelfInterest(),selfValueData=readSelfValues(),interestData=readInterest(),workValueData=readWorkValues();
    const data={...saved,
      standard:{version:'career-dna-research-v1',savedAt:new Date().toISOString(),sourceModules:['balanceWarmup','selfInterest','work24InterestS','selfValues','work24Values','selfStrengths','via','comparison','aiIntegration']},
      balance:{answers:balanceAnswers,sessionCode:classSessionCode(ctx.courseConfig.course||'INJE2026'),policy:'warmup-only-not-core-psychometric-evidence'},
      selfInterest:{clues:selfInterestData},interest:interestData,selfValues:{items:selfValueData},workValues:workValueData.scores,workValuesDate:workValueData.date,workValuesVersion:'Work24-adult-work-values-current',
      selfStrengths:[...strengthSelection],viaTop5:via,
      comparison:{repeat:v('compare_repeat'),connect:v('compare_connect'),unexpected:v('compare_unexpected'),verify:v('compare_verify')},
      reflection:{fit:v('compare_repeat'),question:v('compare_verify'),disagree:v('compare_unexpected')},
      hypothesis:{text:v('aiHypothesis'),selfCheck:v('hypothesisFit'),version:'career-dna-hypothesis-v1',updatedAt:new Date().toISOString()},
      promptMeta:{version:PROMPT_VERSION,moduleStatus:moduleStatus(selfInterestData,interestData,selfValueData,workValueData.scores,strengthSelection,via)}
    };
    const profile=buildProfile(data);
    ctx.saveState({assessments:{careerDNA:data},artifacts:{careerDNAProfile:profile}});document.getElementById('status').textContent='3주차 Career DNA가 이 브라우저에 저장되었습니다.';if(showToast)ctx.toast('3주차 Career DNA를 저장했습니다.');return data;
  }
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
}

function normalizeBalance(x){const a=Array.isArray(x)?x.slice(0,7):[];while(a.length<7)a.push(null);return a}
function balanceHtml(answers,ctx){return BALANCE.map((q,i)=>{const ans=answers[i],locked=!!ans;return `<article class="balanceCard"><div class="balanceTitle"><span>${i+1}/7</span><h4>${ctx.escapeHtml(q.title)}</h4></div><div class="balanceChoices"><button type="button" class="balanceChoice ${ans?.choice==='A'?'selected':''}" data-balance-choice="A" data-index="${i}" ${locked?'disabled':''}><b>A</b><span>${ctx.escapeHtml(q.a)}</span></button><div class="vs">VS</div><button type="button" class="balanceChoice ${ans?.choice==='B'?'selected':''}" data-balance-choice="B" data-index="${i}" ${locked?'disabled':''}><b>B</b><span>${ctx.escapeHtml(q.b)}</span></button></div>${locked?`<div class="valueHint">내 선택 · <b>${ctx.escapeHtml(ans.label)}</b> <span>${ctx.escapeHtml(ans.value)}</span></div><div class="liveVote" id="vote_${i}"><small>현재 수업 선택 비율 불러오는 중...</small></div>`:`<div class="liveVote muted"><small>내 선택을 확정하면 다른 참여자의 비율이 표시됩니다.</small></div>`}</article>`}).join('')}
function balanceSummaryHtml(answers,ctx){const done=answers.filter(Boolean);if(!done.length)return '';const counts={};done.forEach(x=>counts[x.value]=(counts[x.value]||0)+1);const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return `<div class="summaryBox"><b>내 선택에서 나타난 가치 단서</b><div class="pillbox" style="margin-top:8px">${ranked.map(([k,n])=>`<span class="pill">${ctx.escapeHtml(k)}${n>1?` · ${n}회`:''}</span>`).join('')}</div><p class="help">진단점수가 아니라 선택 상황에서 나타난 선호 단서입니다.</p></div>`}
function anchorItemsHtml(scale,responses,ctx){return scale.items.map((item,i)=>`<div class="anchorItem"><div><b>${i+1}</b><span>${ctx.escapeHtml(item)}</span></div><div class="anchorScale">${[1,2,3,4,5,6].map(n=>`<label><input type="radio" name="anchor_${i}" data-anchor-item="${i}" value="${n}" ${Number(responses[i])===n?'checked':''}><span>${n}</span></label>`).join('')}</div></div>`).join('')}
function bonusHtml(scale,bonusItems,ctx){return scale.items.map((item,i)=>`<label class="bonusItem"><input type="checkbox" data-bonus-item value="${i+1}" ${bonusItems.includes(i+1)?'checked':''}><b>${i+1}</b><span>${ctx.escapeHtml(item)}</span></label>`).join('')}
function scoreAnchor(scale,responses,bonusItems){const complete=responses.length===40&&responses.every(x=>Number.isFinite(Number(x))&&Number(x)>=1&&Number(x)<=6);const scores={};for(const a of scale.anchors){const nums=scale.scoring[a.code]||[];scores[a.code]=nums.reduce((sum,n)=>sum+Number(responses[n-1]||0)+(bonusItems.includes(n)?Number(scale.bonusRule?.addPoints||4):0),0)}const ranking=Object.entries(scores).map(([code,score])=>({code,score,name:scale.anchors.find(a=>a.code===code)?.name||code})).sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code));return{complete:complete&&bonusItems.length===3,scores,ranking}}
function anchorResultHtml(scale,responses,bonusItems,ctx){if(!scale)return '';const r=scoreAnchor(scale,responses,bonusItems),answered=responses.filter(x=>Number(x)>=1&&Number(x)<=6).length;if(answered<40)return `<p class="muted">${answered}/40 응답 · 40문항을 모두 완료하면 점수를 보여줍니다.</p>`;if(bonusItems.length!==3)return `<p class="muted">40문항 완료 · 가장 적합한 문항 3개를 선택하면 최종 점수를 보여줍니다.</p>`;const max=r.ranking[0]?.score,min=r.ranking.at(-1)?.score,top=r.ranking.filter(x=>x.score===max),lowest=r.ranking.filter(x=>x.score===min),secondScore=r.ranking.find(x=>x.score<max)?.score,second=secondScore===undefined?[]:r.ranking.filter(x=>x.score===secondScore);return `<div class="anchorResultCards"><div><small>주 앵커</small><b>${top.map(x=>`${x.code} ${ctx.escapeHtml(x.name)}`).join(' · ')}</b><span>${max}점${top.length>1?' · 공동 상위':''}</span></div><div><small>보조 앵커</small><b>${second.length?second.map(x=>`${x.code} ${ctx.escapeHtml(x.name)}`).join(' · '):'동점으로 별도 구분 없음'}</b><span>${secondScore??'—'}${secondScore!==undefined?'점':''}</span></div><div><small>가장 낮은 앵커</small><b>${lowest.map(x=>`${x.code} ${ctx.escapeHtml(x.name)}`).join(' · ')}</b><span>${min}점</span></div></div><div class="anchorBars">${r.ranking.map(x=>`<div><span>${x.code} ${ctx.escapeHtml(x.name)}</span><b>${x.score}</b></div>`).join('')}</div>`}
function strengthHtml(selected,ctx){return STRENGTHS.map(s=>`<button type="button" class="strengthPick ${selected.includes(s)?'selected':''}" data-strength="${ctx.escapeHtml(s)}">${ctx.escapeHtml(s)}</button>`).join('')}
function qualSummaryHtml(balance,selfInterest,selfValues,selfStrengths,ctx){const warm=balance.filter(Boolean).map(x=>x.value);return `<p><b>워밍업 가치 단서</b><br>${warm.length?warm.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">아직 선택 전</span>'}</p><p><b>내가 적은 흥미 단서</b><br>${selfInterest.length?selfInterest.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>내가 적은 직업가치</b><br>${selfValues.length?selfValues.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>내가 고른 강점</b><br>${selfStrengths.length?selfStrengths.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p>`}
function quantSummaryHtml(interest,workValues,via,ctx){const scores=(Object.keys(interest?.riasecStandard||{}).length?interest.riasecStandard:interest?.riasecRaw)||{},riasec=Object.entries(scores).sort((a,b)=>Number(b[1])-Number(a[1])).map(([k,v])=>`${k} ${v}`),values=Object.entries(workValues||{}).sort((a,b)=>Number(b[1])-Number(a[1])).map(([k,v])=>`${k} ${v}`);return `<p><b>고용24 직업선호도 S형</b><br>${riasec.length?riasec.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>고용24 직업가치관</b><br>${values.length?values.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>VIA TOP5</b><br>${via.length?via.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p>`}
function field(id,label,value,placeholder,ctx){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value)}" placeholder="${ctx.escapeHtml(placeholder)}"></div>`}
function selectField(id,label,value,options){return `<div class="field"><label>${label}</label><select class="input" id="${id}"><option value="">선택</option>${options.map(x=>`<option ${value===x?'selected':''}>${x}</option>`).join('')}</select></div>`}
function area(id,label,placeholder,value,ctx){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ctx.escapeHtml(placeholder)}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function moduleStatus(selfInterest,interest,selfValues,workValues,strengths,via){const iCount=Object.keys(interest?.riasecStandard||{}).length||Object.keys(interest?.riasecRaw||{}).length;return{selfInterest:{status:selfInterest.length?'complete':'none',count:selfInterest.length,total:3},work24Interest:{status:iCount===6?'complete':iCount?'partial':'none',count:iCount,total:6},selfValues:{status:selfValues.length?'complete':'none',count:selfValues.length,total:5},work24Values:{status:Object.keys(workValues||{}).length?'complete':'none',count:Object.keys(workValues||{}).length,total:9},selfStrengths:{status:strengths.length===5?'complete':strengths.length?'partial':'none',count:strengths.length,total:5},via:{status:via.length===5?'complete':via.length?'partial':'none',count:via.length,total:5}}}
function buildProfile(data){const scores=Object.keys(data.interest?.riasecStandard||{}).length?data.interest.riasecStandard:data.interest?.riasecRaw||{},riasecTop=Object.entries(scores).map(([code,score])=>({code,score:Number(score)})).sort((a,b)=>b.score-a.score).slice(0,3),valueTop=Object.entries(data.workValues||{}).map(([name,score])=>({name,score:Number(score)})).sort((a,b)=>b.score-a.score).slice(0,5);return{version:'career-dna-profile-research-v1',riasecTop,valueTop,selfInterest:data.selfInterest?.clues||[],selfValues:data.selfValues?.items||[],selfStrengths:data.selfStrengths||[],viaTop5:data.viaTop5||[],comparison:data.comparison||{},hypothesis:data.hypothesis||{},updatedAt:new Date().toISOString()}}
function buildPrompt(d){const lines=[];lines.push('당신은 대학생의 자기이해를 돕는 Career DNA 분석 파트너다. 아래 자료는 현재 시점의 자기이해 단서이며 고정된 성격·직무역량·적합 직업을 판정하는 자료가 아니다.');lines.push('','[분석 원칙]','1. 자기인식 단서와 검사 단서를 구분한다.','2. 두 자료 중 어느 하나를 더 진짜라고 판단하지 않는다.','3. 입력되지 않은 정보는 추정하지 않는다.','4. 서로 다른 자료에서 비슷한 특징이 보여도 “반복 단서”라고만 표현한다.','5. “행동 근거”는 실제 경험의 행동·결과·증거가 확인된 STEP 2 이후에만 사용한다.','6. VIA 결과 하나로 직무역량이나 적합 직업을 단정하지 않는다.','7. 직업을 추천하지 않는다. 확인이 필요한 내용은 가설로 남긴다.','8. 다음 주 실제 경험으로 확인할 질문을 정확히 3개 만든다.');if(d.selfInterest?.clues?.length)lines.push('','[자기인식 단서 · 흥미]',...d.selfInterest.clues.map((x,i)=>`${i+1}. ${x}`));const r=Object.keys(d.interest?.riasecStandard||{}).length?d.interest.riasecStandard:d.interest?.riasecRaw||{};if(Object.keys(r).length)lines.push('','[검사 단서 · 고용24 직업선호도 S형]',...Object.entries(r).map(([k,v])=>`${k}: ${v}`));if(d.selfValues?.items?.length)lines.push('','[자기인식 단서 · 직업가치]',...d.selfValues.items.map((x,i)=>`${i+1}. ${x}`));if(Object.keys(d.workValues||{}).length)lines.push('','[검사 단서 · 고용24 직업가치관]',...Object.entries(d.workValues).map(([k,v])=>`${k}: ${v}`));if(d.selfStrengths?.length)lines.push('','[자기인식 단서 · 강점]',d.selfStrengths.join(' · '));if(d.viaTop5?.length)lines.push('','[검사 단서 · VIA 성격강점]',d.viaTop5.join(' · '));const c=d.comparison||{};if(c.repeat||c.connect||c.unexpected||c.verify){lines.push('','[학생이 직접 비교한 결과]');if(c.repeat)lines.push(`반복해서 나타난 단서: ${c.repeat}`);if(c.connect)lines.push(`서로 연결된다고 느끼는 부분: ${c.connect}`);if(c.unexpected)lines.push(`예상과 달랐던 부분: ${c.unexpected}`);if(c.verify)lines.push(`실제 경험에서 더 확인할 부분: ${c.verify}`)}lines.push('','[출력 형식 · Career DNA 가설 v1]','1. 현재 중요하게 생각하는 일의 조건','2. 여러 자료에서 반복해서 나타난 단서','3. 흥미·가치·강점에서 서로 연결되는 부분','4. 자기인식과 검사결과가 다르거나 예상 밖인 부분','5. 아직 확인이 필요한 부분','6. STEP 2 실제 경험에서 확인할 질문 3개','','각 문장 끝에 근거가 된 입력자료를 괄호 안에 짧게 표시한다. “확정”, “적합 직업”, “직무역량이 높다” 같은 표현을 쓰지 않는다. 실제 경험으로 확인되지 않은 내용은 “가설”, “단서”, “확인 필요” 수준으로 표현한다.');return lines.join('\n')}
function styleBlock(){return `<style>
.careerDnaStandard .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.careerDnaStandard .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.careerDnaStandard .moduleHead h3{margin:0 0 3px}.careerDnaStandard .moduleHead p{margin:0;color:var(--muted);font-size:13px}.balanceCard{border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:10px}.balanceTitle{display:flex;gap:8px;align-items:center}.balanceTitle span{font-size:11px;color:var(--muted)}.balanceTitle h4{margin:0}.balanceChoices{display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center;margin-top:10px}.balanceChoice{border:1px solid var(--line);border-radius:14px;background:#fff;padding:15px;cursor:pointer;text-align:center;color:var(--text)}.balanceChoice b,.balanceChoice span{display:block}.balanceChoice b{font-size:12px;color:#5b50dd;margin-bottom:5px}.balanceChoice.selected{border-color:#655ae7;background:#f7f6ff}.balanceChoice:disabled{cursor:default;opacity:.75}.vs{font-size:11px;color:var(--muted);font-weight:900}.valueHint{margin-top:10px;font-size:12px}.valueHint span{margin-left:8px;color:var(--muted)}.liveVote{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px;padding:9px 11px;background:#f7f8fb;border-radius:10px;font-size:12px}.liveVote small{grid-column:1/-1;color:var(--muted)}.anchorProgress{display:flex;justify-content:space-between;gap:8px;padding:10px 12px;background:#f7f8fb;border-radius:12px;margin:12px 0;font-size:12px}.anchorItem{border:1px solid var(--line);border-radius:13px;padding:12px;margin-top:8px}.anchorItem>div:first-child{display:flex;gap:8px;line-height:1.55}.anchorItem>div:first-child b{color:#5b50dd}.anchorScale{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:10px}.anchorScale label input{position:absolute;opacity:0}.anchorScale label span{display:grid;place-items:center;height:36px;border:1px solid var(--line);border-radius:9px;cursor:pointer}.anchorScale label input:checked+span{background:#5b50dd;color:#fff;border-color:#5b50dd}.bonusGrid{max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:8px}.bonusItem{display:grid;grid-template-columns:auto 28px 1fr;gap:7px;padding:8px;border-bottom:1px solid #f0f1f5;font-size:12px;line-height:1.45}.anchorResultCards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.anchorResultCards>div{border:1px solid var(--line);border-radius:12px;padding:12px}.anchorResultCards small,.anchorResultCards b,.anchorResultCards span{display:block}.anchorResultCards small{color:var(--muted)}.anchorResultCards b{margin:5px 0}.anchorBars{margin-top:10px}.anchorBars>div{display:flex;justify-content:space-between;border-bottom:1px solid #f0f1f5;padding:6px 2px;font-size:12px}.strengthCounter{text-align:right;font-size:12px;color:var(--muted);margin-bottom:7px}.strengthGrid{display:flex;flex-wrap:wrap;gap:7px}.strengthPick{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;cursor:pointer;color:var(--text)}.strengthPick.selected{background:#5b50dd;color:#fff;border-color:#5b50dd}.compareColumns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.compareCard{border:1px solid var(--line);border-radius:15px;padding:14px}.compareCard> b{display:block;margin-bottom:10px}.compareCard p{font-size:12px;line-height:1.6}.qualitative{background:#fffaf5}.quantitative{background:#f7f9ff}@media(max-width:680px){.balanceChoices,.compareColumns,.anchorResultCards{grid-template-columns:1fr}.vs{text-align:center}.anchorScale{grid-template-columns:repeat(6,1fr)}.liveVote{grid-template-columns:1fr}.liveVote small{grid-column:auto}.anchorProgress{display:block}.anchorProgress span{display:block;margin-top:3px}}
</style>`}

import {castBalanceVote,getBalanceCounts,classSessionCode} from '../classroomVotes.js';

const PROMPT_VERSION='career-dna-research-v1.0';
const WORK24_URL='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const VIA_URL='https://www.viacharacter.org/Survey//Account/Register';
const RIASEC=[
  {code:'R',label:'R 현실형'},{code:'I',label:'I 탐구형'},{code:'A',label:'A 예술형'},
  {code:'S',label:'S 사회형'},{code:'E',label:'E 진취형'},{code:'C',label:'C 관습형'}
];
const WORK_VALUE_LABELS=['사회적 공헌','변화지향','성취','경제적 보상','자기계발','일과 삶의 균형','사회적 인정','자율성','직업안정'];
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
  const state=ctx.getState(),saved=state.assessments?.careerDNA||{},root=document.getElementById('stepRoot');
  const balanceAnswers=normalizeBalance(saved.balance?.answers);
  const selfInterest=saved.selfInterest?.text||'';
  const interest=saved.interest||{};
  const selfWorkValues=saved.selfWorkValues?.text||'';
  const workValues=saved.workValues||{};
  const selfStrengths=Array.isArray(saved.selfStrengths)?saved.selfStrengths.slice(0,5):[];
  const viaTop5=Array.isArray(saved.viaTop5)?saved.viaTop5.slice(0,5):[];
  const comparison=saved.comparison||{};

  root.innerHTML=`<section class="card careerDnaStandard">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 1 · RESEARCH STANDARD v1.0</div><h2>Career DNA</h2><p>자기인식과 공식 검사결과를 비교해 <b>현재 시점의 자기이해 가설</b>을 만듭니다.</p></div><span class="badge">3주차</span></div>
    <div class="progress"><span style="width:10%"></span></div>
    <div class="callout info"><b>오늘의 흐름</b> · 워밍업 → 흥미 자기인식 → 고용24 흥미검사 → 가치 자기인식 → 고용24 가치검사 → 강점 자기인식 → VIA → 직접 비교 → AI 통합분석 → Career DNA 가설</div>
    <div class="callout good"><b>해석 원칙</b> · 검사결과는 정답이 아닙니다. STEP 1에서 만든 내용은 ‘단서’와 ‘가설’이며, 다음 STEP의 실제 경험에서 행동근거를 확인합니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>커리어 밸런스게임</h3><p>수업을 여는 워밍업입니다. 심리검사가 아니며 AI 통합분석의 핵심 근거로 사용하지 않습니다.</p></div></div>
      <div class="callout warn"><b>먼저 내 선택을 확정합니다.</b> 다른 참여자의 비율은 선택한 뒤에만 보입니다. 친구들의 비율을 본 뒤 선택을 바꾸는 용도로 사용하지 않습니다.</div>
      <div id="balanceQuestions">${balanceHtml(balanceAnswers,ctx)}</div><div id="balanceSummary">${balanceSummaryHtml(balanceAnswers,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>내가 생각하는 나의 흥미</h3><p>공식 검사결과를 보기 전에 좋아하거나 몰입하는 활동을 내 말로 기록합니다.</p></div></div>
      <div class="callout info"><b>자기인식 활동</b> · 심리검사가 아닙니다. 직업명보다 ‘시간 가는 줄 모르고 하는 활동, 자주 찾아보는 주제, 자발적으로 하는 일’을 적어보세요.</div>
      ${area('selfInterest','내가 좋아하거나 자연스럽게 끌리는 활동','예: 새로운 자료를 비교해서 원인을 찾는 일, 사람에게 설명해 주는 일, 직접 만들어 보는 일',selfInterest,ctx)}
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>고용24 직업선호도검사 S형</h3><p>고용24 공식 사이트에서 검사를 실시한 뒤 R·I·A·S·E·C 결과점수만 입력합니다.</p></div></div>
      <div class="callout info"><b>공식 외부검사</b> · Jobfit은 검사문항을 복제하지 않습니다. 결과는 흥미에 관한 검사 단서이며 직업을 자동 결정하지 않습니다.</div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 직업심리검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px"><div class="field"><label>검사일</label><input class="input" id="interestExamDate" type="date" value="${ctx.escapeHtml(interest.examDate||'')}"></div>${RIASEC.map(x=>scoreField(`riasec_${x.code}`,x.label,interest.riasecStandard?.[x.code],ctx)).join('')}</div>
      <p class="help">결과표에 표시된 여섯 영역의 점수를 그대로 입력하세요. 입력하지 않은 점수는 0점으로 처리하지 않습니다.</p>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>내가 생각하는 나의 직업가치</h3><p>공식 검사결과를 보기 전에 직업과 회사를 선택할 때 포기하기 어려운 조건을 내 말로 기록합니다.</p></div></div>
      <div class="callout info"><b>자기인식 활동</b> · 심리검사가 아닙니다. 급여·안정성·성장·자율성·워라밸처럼 평소 실제 선택에서 중요하게 생각하는 조건과 이유를 적어보세요.</div>
      ${area('selfWorkValues','내가 중요하게 생각하는 일의 조건','예: 새로운 것을 계속 배우는 환경, 퇴근 후 시간을 지킬 수 있는 근무방식, 노력에 맞는 보상',selfWorkValues,ctx)}
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>05</span><div><h3>고용24 성인용 직업가치관검사</h3><p>고용24에서 검사를 실시한 뒤 9개 직업가치 결과점수를 입력합니다.</p></div></div>
      <div class="callout info"><b>공식 외부검사</b> · Jobfit은 검사문항을 복제하지 않습니다. 결과는 직업선택 기준을 살펴보는 검사 단서로 사용합니다.</div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 직업심리검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px"><div class="field"><label>검사일</label><input class="input" id="workValuesDate" type="date" value="${ctx.escapeHtml(saved.workValuesDate||'')}"></div>${WORK_VALUE_LABELS.map((x,i)=>scoreField(`workValue_${i}`,x,workValues[x],ctx)).join('')}</div>
      <p class="help">결과표의 값을 그대로 입력하세요. TOP 값만 저장하지 않고 입력한 전체 하위점수를 보존합니다.</p>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>06</span><div><h3>내가 생각하는 나의 강점</h3><p>VIA 결과를 보기 전에 평소 스스로 생각하는 대표 강점 5개를 선택합니다.</p></div></div>
      <div class="strengthCounter" id="strengthCounter">${selfStrengths.length}/5 선택</div><div class="strengthGrid" id="strengthGrid">${strengthHtml(selfStrengths,ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>07</span><div><h3>VIA 성격강점 TOP5</h3><p>공식 VIA에서 검사한 뒤 상위 5개 강점명만 입력합니다.</p></div></div>
      <div class="callout info">VIA 결과는 <b>성격강점에 대한 보조 자기이해 자료</b>입니다. 직무역량·채용적합성·고정된 성격유형을 판정하는 데 사용하지 않습니다.</div>
      <div class="actions"><a class="btn secondary" href="${VIA_URL}" target="_blank" rel="noopener">VIA 공식 검사 열기 ↗</a></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2,3,4].map(i=>field(`via_${i}`,`TOP ${i+1}`,viaTop5[i]||'','결과에 표시된 강점명',ctx)).join('')}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>08</span><div><h3>내가 생각하는 나 × 검사에서 나타난 나</h3><p>AI보다 먼저 학생이 직접 비교합니다. 자기인식과 검사결과 중 어느 한쪽을 ‘진짜 나’라고 보지 않습니다.</p></div></div>
      <div class="compareColumns"><div class="compareCard qualitative"><b>자기인식 단서</b><div id="qualSummary">${qualSummaryHtml(selfInterest,selfWorkValues,selfStrengths,ctx)}</div></div><div class="compareCard quantitative"><b>검사 단서</b><div id="quantSummary">${testSummaryHtml(interest,workValues,viaTop5,ctx)}</div></div></div>
      <div class="grid2" style="margin-top:14px">
        ${area('compare_repeat','반복해서 나타난 단서','서로 다른 자료에서 비슷하게 나타났지만 아직 경험 확인이 필요한 특징은?',comparison.repeat||saved.reflection?.fit||'',ctx)}
        ${area('compare_connect','서로 연결된다고 느끼는 부분','표현은 달라도 서로 연결된다고 느끼는 결과는?',comparison.connect||'',ctx)}
        ${area('compare_unexpected','예상과 달랐던 부분','내 생각과 다르게 나온 결과는?',comparison.unexpected||saved.reflection?.disagree||'',ctx)}
        ${area('compare_verify','실제 경험에서 확인할 부분','다음 STEP에서 행동과 결과로 확인해보고 싶은 것은?',comparison.verify||saved.reflection?.question||'',ctx)}
      </div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>09</span><div><h3>AI 자기이해 통합분석</h3><p>입력된 자료만 사용해 ‘자기이해 가설’을 만드는 프롬프트를 생성합니다.</p></div></div>
      <div class="callout info" id="careerDnaAiGuide"><b>AI LAB 사용 원칙</b><br>AI는 단서를 정리하고 확인 질문을 만드는 역할만 합니다. 검사점수만으로 강점·약점·직무역량·적합 직업을 확정하지 않습니다.<br><span class="muted">Jobfit이 입력내용을 외부 AI로 자동 전송하지 않습니다. 복사할 때 이름·학번·연락처·타인의 실명 등 개인정보를 포함하지 마세요.</span></div>
      <div class="actions"><button class="btn secondary" id="makePrompt">현재 결과로 자기이해 통합하기</button><button class="btn outline hidden" id="copyPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="promptBox"></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>10</span><div><h3>Career DNA 가설 v1</h3><p>현재 시점의 가설입니다. 고정된 성격이나 직무적합성 판정이 아니며 다음 STEP의 실제 경험에 따라 수정할 수 있습니다.</p></div></div>
      <div class="field"><label>AI 통합분석 결과 · 내가 검토한 내용</label><textarea id="aiHypothesis" placeholder="AI 결과를 그대로 믿지 말고, 맞는 부분·수정할 부분·실제 경험으로 확인할 부분만 남기세요.">${ctx.escapeHtml(saved.hypothesis?.text||'')}</textarea></div>
      <div class="field" style="margin-top:12px"><label>현재 가설이 나를 얼마나 잘 설명하나요?</label><select class="input" id="hypothesisFit"><option value="">선택</option>${['매우 맞음','어느 정도 맞음','잘 모르겠음','맞지 않음'].map(x=>`<option ${saved.hypothesis?.selfCheck===x?'selected':''}>${x}</option>`).join('')}</select></div>
    </div>

    <div class="actions"><button class="btn primary" id="saveDNA">3주차 Career DNA 저장</button><button class="btn secondary" id="nextStep">4주차로 이동 →</button></div><div class="status" id="status"></div>
  </section>`;

  let strengthSelection=[...selfStrengths],voteTimer=null;
  bindBalance();bindStrengths();
  ['selfInterest','selfWorkValues','interestExamDate','workValuesDate','via_0','via_1','via_2','via_3','via_4',...RIASEC.map(x=>`riasec_${x.code}`),...WORK_VALUE_LABELS.map((_,i)=>`workValue_${i}`)].forEach(id=>document.getElementById(id)?.addEventListener('input',refreshCompare));
  document.getElementById('saveDNA').addEventListener('click',()=>saveData(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveData(false);ctx.navigate(2)});
  document.getElementById('makePrompt').addEventListener('click',()=>{const data=saveData(false),prompt=buildPrompt(data);const box=document.getElementById('promptBox');box.textContent=prompt;box.classList.remove('hidden');document.getElementById('copyPrompt').classList.remove('hidden')});
  document.getElementById('copyPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('promptBox').textContent);ctx.toast('프롬프트를 복사했습니다.')}catch{ctx.toast('복사가 차단되었습니다. 직접 선택해 복사해 주세요.')}});

  function bindBalance(){
    root.querySelectorAll('[data-balance-choice]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=Number(btn.dataset.index),choice=btn.dataset.balanceChoice;if(balanceAnswers[i])return;
      if(!confirm('이 선택으로 확정할까요? 확정 후 다른 참여자의 선택 비율이 공개됩니다.'))return;
      const q=BALANCE[i];balanceAnswers[i]={questionId:i+1,choice,label:choice==='A'?q.a:q.b,value:choice==='A'?q.av:q.bv,confirmedAt:new Date().toISOString()};
      saveData(false);renderBalanceSection();
      try{await castBalanceVote(ctx.courseConfig.course||'INJE2026',i,choice);await updateVote(i)}catch{setVoteMessage(i,'현재 수업 선택 비율을 불러오지 못했습니다. 내 선택은 개인 화면에 저장되었습니다.')}
      startVotePolling();
    }));startVotePolling();
  }
  function renderBalanceSection(){const el=document.getElementById('balanceQuestions');if(el)el.innerHTML=balanceHtml(balanceAnswers,ctx);const s=document.getElementById('balanceSummary');if(s)s.innerHTML=balanceSummaryHtml(balanceAnswers,ctx);bindBalance();refreshCompare()}
  function startVotePolling(){if(voteTimer)return;const answered=()=>balanceAnswers.map((x,i)=>x?i:null).filter(x=>x!==null);if(!answered().length)return;voteTimer=setInterval(async()=>{if(!document.body.contains(root)){clearInterval(voteTimer);voteTimer=null;return}for(const i of answered())await updateVote(i)},2500);for(const i of answered())updateVote(i)}
  async function updateVote(i){try{const c=await getBalanceCounts(ctx.courseConfig.course||'INJE2026',i),el=document.getElementById(`vote_${i}`);if(el)el.innerHTML=`<div><b>A ${c.aPercent.toFixed(1)}%</b> · ${c.a}명</div><div><b>B ${c.bPercent.toFixed(1)}%</b> · ${c.b}명</div><small>현재 수업 ${c.total}명 기준 · 약 2.5초 간격 업데이트</small>`}catch{setVoteMessage(i,'수업 선택 비율 연결 확인 중...')}}
  function setVoteMessage(i,msg){const el=document.getElementById(`vote_${i}`);if(el)el.innerHTML=`<small>${ctx.escapeHtml(msg)}</small>`}
  function bindStrengths(){root.querySelectorAll('[data-strength]').forEach(btn=>btn.addEventListener('click',()=>{const s=btn.dataset.strength,i=strengthSelection.indexOf(s);if(i>=0)strengthSelection.splice(i,1);else{if(strengthSelection.length>=5){ctx.toast('대표 강점은 5개까지 선택합니다.');return}strengthSelection.push(s)}const g=document.getElementById('strengthGrid');if(g)g.innerHTML=strengthHtml(strengthSelection,ctx);const c=document.getElementById('strengthCounter');if(c)c.textContent=`${strengthSelection.length}/5 선택`;bindStrengths();refreshCompare()}))}
  function readVia(){return [0,1,2,3,4].map(i=>document.getElementById(`via_${i}`)?.value?.trim()||'').filter(Boolean)}
  function readRiasec(){const out={};RIASEC.forEach(x=>{const n=numberValue(`riasec_${x.code}`);if(n!==null)out[x.code]=n});return out}
  function readWorkValues(){const out={};WORK_VALUE_LABELS.forEach((x,i)=>{const n=numberValue(`workValue_${i}`);if(n!==null)out[x]=n});return out}
  function refreshCompare(){const q=document.getElementById('qualSummary');if(q)q.innerHTML=qualSummaryHtml(v('selfInterest'),v('selfWorkValues'),strengthSelection,ctx);const n=document.getElementById('quantSummary');if(n)n.innerHTML=testSummaryHtml({riasecStandard:readRiasec()},readWorkValues(),readVia(),ctx)}
  function saveData(showToast){
    const legacy={careerAnchor:saved.careerAnchor||null,multipleIntelligence:saved.multipleIntelligence||null,legacyStandard:saved.standard?.version||null};
    const data={...saved,
      standard:{version:'career-dna-research-v1.0',savedAt:new Date().toISOString(),sourceModules:['selfInterest','work24InterestS','selfWorkValues','work24WorkValues','selfStrengths','via','comparison','aiIntegration'],interpretation:'current-hypothesis-not-diagnosis'},
      balance:{answers:balanceAnswers,sessionCode:classSessionCode(ctx.courseConfig.course||'INJE2026'),policy:'warmup-classroom-live-aggregate-not-ai-evidence'},
      selfInterest:{text:v('selfInterest'),source:'learner-self-reflection'},
      interest:{type:'S',examDate:v('interestExamDate'),riasecRaw:{},riasecStandard:readRiasec(),source:'Work24 official external assessment'},
      selfWorkValues:{text:v('selfWorkValues'),source:'learner-self-reflection'},
      workValues:readWorkValues(),workValuesDate:v('workValuesDate'),workValuesVersion:'Work24-adult-work-values-current',
      selfStrengths:[...strengthSelection],viaTop5:readVia(),
      careerAnchor:null,multipleIntelligence:null,legacyCareerDnaV1:legacy,
      comparison:{repeat:v('compare_repeat'),connect:v('compare_connect'),unexpected:v('compare_unexpected'),verify:v('compare_verify')},
      reflection:{fit:v('compare_repeat'),question:v('compare_verify'),disagree:v('compare_unexpected')},
      hypothesis:{...(saved.hypothesis||{}),text:v('aiHypothesis'),selfCheck:v('hypothesisFit'),version:'career-dna-hypothesis-v1',updatedAt:new Date().toISOString()},
      promptMeta:{version:PROMPT_VERSION,moduleStatus:moduleStatus(balanceAnswers,v('selfInterest'),readRiasec(),v('selfWorkValues'),readWorkValues(),strengthSelection,readVia(),v('compare_repeat'),v('compare_connect'),v('compare_unexpected'),v('compare_verify'))}
    };
    const profile=buildProfile(data);
    ctx.saveState({assessments:{careerDNA:data},artifacts:{careerDNAProfile:profile}});
    document.getElementById('status').textContent='3주차 Career DNA가 저장되었습니다. 이 결과는 다음 STEP의 실제 경험에서 다시 확인합니다.';if(showToast)ctx.toast('3주차 Career DNA를 저장했습니다.');return data;
  }
  function numberValue(id){const raw=document.getElementById(id)?.value;if(raw===''||raw===undefined||raw===null)return null;const n=Number(raw);return Number.isFinite(n)?n:null}
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
}

function normalizeBalance(x){const a=Array.isArray(x)?x.slice(0,7):[];while(a.length<7)a.push(null);return a}
function balanceHtml(answers,ctx){return BALANCE.map((q,i)=>{const ans=answers[i],locked=!!ans;return `<article class="balanceCard"><div class="balanceTitle"><span>${i+1}/7</span><h4>${ctx.escapeHtml(q.title)}</h4></div><div class="balanceChoices"><button type="button" class="balanceChoice ${ans?.choice==='A'?'selected':''}" data-balance-choice="A" data-index="${i}" ${locked?'disabled':''}><b>A</b><span>${ctx.escapeHtml(q.a)}</span></button><div class="vs">VS</div><button type="button" class="balanceChoice ${ans?.choice==='B'?'selected':''}" data-balance-choice="B" data-index="${i}" ${locked?'disabled':''}><b>B</b><span>${ctx.escapeHtml(q.b)}</span></button></div>${locked?`<div class="valueHint">내 선택 · <b>${ctx.escapeHtml(ans.label)}</b> <span>${ctx.escapeHtml(ans.value)}</span></div><div class="liveVote" id="vote_${i}"><small>현재 수업 선택 비율 불러오는 중...</small></div>`:'<div class="liveVote muted"><small>내 선택을 확정하면 다른 참여자의 비율이 표시됩니다.</small></div>'}</article>`}).join('')}
function balanceSummaryHtml(answers,ctx){const done=answers.filter(Boolean);if(!done.length)return '';const counts={};done.forEach(x=>counts[x.value]=(counts[x.value]||0)+1);const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return `<div class="summaryBox"><b>워밍업에서 나타난 선택 단서</b><div class="pillbox" style="margin-top:8px">${ranked.map(([k,n])=>`<span class="pill">${ctx.escapeHtml(k)}${n>1?` · ${n}회`:''}</span>`).join('')}</div><p class="help">심리검사나 진단점수가 아니며 AI 통합분석의 핵심 근거에는 포함하지 않습니다.</p></div>`}
function strengthHtml(selected,ctx){return STRENGTHS.map(s=>`<button type="button" class="strengthPick ${selected.includes(s)?'selected':''}" data-strength="${ctx.escapeHtml(s)}">${ctx.escapeHtml(s)}</button>`).join('')}
function topEntries(obj,n=3){return Object.entries(obj||{}).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,n)}
function qualSummaryHtml(interest,values,strengths,ctx){return `<p><b>흥미 자기인식</b><br>${interest?ctx.escapeHtml(interest):'<span class="muted">미입력</span>'}</p><p><b>직업가치 자기인식</b><br>${values?ctx.escapeHtml(values):'<span class="muted">미입력</span>'}</p><p><b>내가 고른 강점</b><br>${strengths.length?strengths.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p>`}
function testSummaryHtml(interest,workValues,via,ctx){const r=topEntries(interest?.riasecStandard,3),w=topEntries(workValues,3);return `<p><b>고용24 직업선호도 S형</b><br>${r.length?r.map(([k,v])=>`${ctx.escapeHtml(k)} ${ctx.escapeHtml(v)}`).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>고용24 직업가치관</b><br>${w.length?w.map(([k,v])=>`${ctx.escapeHtml(k)} ${ctx.escapeHtml(v)}`).join(' · '):'<span class="muted">미입력</span>'}</p><p><b>VIA TOP5</b><br>${via.length?via.map(x=>ctx.escapeHtml(x)).join(' · '):'<span class="muted">미입력</span>'}</p>`}
function field(id,label,value,placeholder,ctx){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value)}" placeholder="${ctx.escapeHtml(placeholder)}"></div>`}
function scoreField(id,label,value,ctx){return `<div class="field"><label>${ctx.escapeHtml(label)}</label><input class="input scoreInput" id="${id}" type="number" step="0.01" value="${ctx.escapeHtml(value??'')}" placeholder="결과표 점수"></div>`}
function area(id,label,placeholder,value,ctx){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ctx.escapeHtml(placeholder)}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function moduleStatus(balance,selfInterest,riasec,selfValues,workValues,strengths,via,...comparison){return{
  balance:{status:balance.filter(Boolean).length===7?'complete':balance.filter(Boolean).length?'partial':'none',count:balance.filter(Boolean).length,total:7},
  selfInterest:{status:selfInterest?'complete':'none'},work24Interest:{status:Object.keys(riasec||{}).length===6?'complete':Object.keys(riasec||{}).length?'partial':'none'},
  selfWorkValues:{status:selfValues?'complete':'none'},work24Values:{status:Object.keys(workValues||{}).length===9?'complete':Object.keys(workValues||{}).length?'partial':'none'},
  selfStrengths:{status:strengths.length===5?'complete':strengths.length?'partial':'none'},via:{status:via.length===5?'complete':via.length?'partial':'none'},
  comparison:{status:comparison.filter(Boolean).length===4?'complete':comparison.some(Boolean)?'partial':'none'}
}}
function buildProfile(data){const riasecTop=topEntries(data.interest?.riasecStandard,3).map(([code,score])=>({code,score})),valueTop=topEntries(data.workValues,3).map(([name,score])=>({name,score}));return{version:'career-dna-profile-v3',riasecTop,valueTop,valueClues:valueTop.map(x=>x.name),selfStrengths:data.selfStrengths||[],viaTop5:data.viaTop5||[],comparison:data.comparison||{},hypothesis:data.hypothesis||{},updatedAt:new Date().toISOString()}}
function buildPrompt(d){
  const lines=[];
  lines.push('당신은 대학생의 자기이해를 돕는 Career DNA 분석 파트너다. 아래 자료는 현재 시점의 자기인식과 검사 단서다. 이를 고정된 성격, 능력, 직무적합성의 판정으로 바꾸지 마라.');
  lines.push('','[분석 원칙]',
    '1. 자기인식 자료는 자기인식 단서, 고용24·VIA 결과는 검사 단서라고 구분한다.',
    '2. 서로 다른 자료에서 비슷한 특징이 나타나도 ‘반복 단서’라고만 표현한다. 아직 행동 근거가 아니다.',
    '3. 강점·역량을 확정하려면 다음 STEP의 실제 경험에서 행동·판단·결과·증거를 확인해야 한다.',
    '4. 자기인식과 검사결과 중 어느 한쪽을 더 진짜라고 판단하지 않는다.',
    '5. 입력되지 않은 내용은 추정하지 않는다.',
    '6. 검사점수만으로 약점, 능력, 직무역량, 적합 직업을 단정하거나 직업을 추천하지 않는다.',
    '7. 다음 STEP의 실제 경험에서 확인할 질문을 정확히 3개 만든다.'
  );
  if(d.selfInterest?.text)lines.push('','[자기인식 단서 · 내가 생각하는 흥미]',d.selfInterest.text);
  const r=Object.entries(d.interest?.riasecStandard||{});if(r.length)lines.push('','[검사 단서 · 고용24 직업선호도검사 S형]',...r.map(([k,v])=>`${k}: ${v}`));
  if(d.selfWorkValues?.text)lines.push('','[자기인식 단서 · 내가 생각하는 직업가치]',d.selfWorkValues.text);
  const w=Object.entries(d.workValues||{});if(w.length)lines.push('','[검사 단서 · 고용24 성인용 직업가치관검사]',...w.map(([k,v])=>`${k}: ${v}`));
  if(d.selfStrengths?.length)lines.push('','[자기인식 단서 · 내가 생각하는 강점]',d.selfStrengths.join(' · '));
  if(d.viaTop5?.length)lines.push('','[검사 단서 · VIA 성격강점 TOP5]',d.viaTop5.join(' · '),'※ VIA 결과만으로 직무역량을 확정하지 말 것.');
  const c=d.comparison||{};if(c.repeat||c.connect||c.unexpected||c.verify){lines.push('','[학생이 직접 비교한 결과]');if(c.repeat)lines.push(`반복 단서: ${c.repeat}`);if(c.connect)lines.push(`연결된다고 느끼는 부분: ${c.connect}`);if(c.unexpected)lines.push(`예상과 달랐던 부분: ${c.unexpected}`);if(c.verify)lines.push(`실제 경험에서 확인할 부분: ${c.verify}`)}
  lines.push('','[출력 형식 · Career DNA 가설 v1]',
    '1. 현재 중요하게 생각하는 일의 조건',
    '2. 현재 반복해서 나타난 자기이해 단서',
    '3. 흥미와 강점에서 탐색해볼 활동 방식',
    '4. 자기인식과 검사결과가 일치하거나 연결되는 부분',
    '5. 서로 다르거나 아직 확인이 필요한 부분',
    '6. STEP 2 실제 경험에서 확인할 질문 3개',
    '',
    '각 문장 뒤에 (자기인식 단서 / 검사 단서 / 학생 비교) 중 근거 유형을 표시한다. “확정”, “증명”, “적합한 직업” 같은 표현은 쓰지 않는다. 행동 근거가 아직 없으면 반드시 “경험 확인 필요”라고 표시한다.'
  );
  return lines.join('\n');
}
function styleBlock(){return `<style>
.careerDnaStandard .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.careerDnaStandard .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.careerDnaStandard .moduleHead h3{margin:0 0 3px}.careerDnaStandard .moduleHead p{margin:0;color:var(--muted);font-size:13px}.balanceCard{border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:10px}.balanceTitle{display:flex;gap:8px;align-items:center}.balanceTitle span{font-size:11px;color:var(--muted)}.balanceTitle h4{margin:0}.balanceChoices{display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center;margin-top:10px}.balanceChoice{border:1px solid var(--line);border-radius:14px;background:#fff;padding:15px;cursor:pointer;text-align:center;color:var(--text)}.balanceChoice b,.balanceChoice span{display:block}.balanceChoice b{font-size:12px;color:#5b50dd;margin-bottom:5px}.balanceChoice.selected{border-color:#655ae7;background:#f7f6ff}.balanceChoice:disabled{cursor:default;opacity:.75}.vs{font-size:11px;color:var(--muted);font-weight:900}.valueHint{margin-top:10px;font-size:12px}.valueHint span{margin-left:8px;color:var(--muted)}.liveVote{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px;padding:9px 11px;background:#f7f8fb;border-radius:10px;font-size:12px}.liveVote small{grid-column:1/-1;color:var(--muted)}.strengthCounter{text-align:right;font-size:12px;color:var(--muted);margin-bottom:7px}.strengthGrid{display:flex;flex-wrap:wrap;gap:7px}.strengthPick{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;cursor:pointer;color:var(--text)}.strengthPick.selected{background:#5b50dd;color:#fff;border-color:#5b50dd}.compareColumns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.compareCard{border:1px solid var(--line);border-radius:15px;padding:14px}.compareCard>b{display:block;margin-bottom:10px}.compareCard p{font-size:12px;line-height:1.6}.qualitative{background:#fffaf5}.quantitative{background:#f7f9ff}@media(max-width:680px){.balanceChoices,.compareColumns{grid-template-columns:1fr}.vs{text-align:center}.liveVote{grid-template-columns:1fr}.liveVote small{grid-column:auto}}
</style>`}

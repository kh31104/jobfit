export async function render(ctx){
  const s=ctx.getState();
  const jd=s.artifacts?.jdAnalyzer||{postings:[],selectedId:''};
  const posting=jd.postings?.find(x=>x.id===jd.selectedId)||jd.postings?.[0];
  const resume=s.artifacts?.resumeLab||{items:[]};
  const cover=s.artifacts?.coverLetterLab||{questions:[]};
  const assets=s.artifacts?.careerAssets?.assets||[];
  const saved=s.artifacts?.interviewLab||{questions:[],practiceNotes:''};
  const data=structuredClone(saved);
  const root=document.getElementById('stepRoot');

  root.innerHTML=`<section class="card">
    <div class="sectionHead"><div><div class="kicker">STEP 11</div><h2>Interview Lab</h2><p>이력서·자소서에 쓴 같은 Evidence를 면접에서 말로 증명합니다.</p></div><span class="badge">11–12주차</span></div>
    <div class="progress"><span style="width:86%"></span></div>
    ${posting?`<div class="callout info"><b>Target</b><br>${esc(posting.company,ctx)} · ${esc(posting.jobTitle,ctx)}</div>`:''}

    <div class="block"><h3>1. AI 예상질문 프롬프트</h3><p class="help">정답을 만들어 달라고 하지 않고, 내 서류에서 검증해야 할 지점을 질문하게 합니다.</p><textarea id="interviewPrompt" rows="14">${esc(buildPrompt(posting,resume,cover,assets),ctx)}</textarea><div class="actions"><button class="btn secondary" id="copyPrompt">면접 프롬프트 복사</button></div></div>

    <div class="hr"></div><div class="block"><h3>2. Question Bank</h3>
      <div class="grid3">${sel('category','질문유형','',['인성','경험','지원동기','직무','상황','협업','갈등','실패','압박·꼬리질문','PT·발표','기타'])}${area('question','질문','','실제 질문을 입력')}${selectAsset('assetId','답변 Evidence',assets)}</div>
      <div class="grid2" style="margin-top:12px">${area('answerOutline','내 답변 구조','','결론 → 상황 → 내가 한 행동 → 결과 → 직무연결')}${area('followUps','예상 꼬리질문','','사실을 검증할 후속질문')}${area('practice','연습 피드백','','말해본 뒤 길이·논리·모호한 표현을 기록')}${area('improve','다음 수정','','다음 연습에서 바꿀 한 가지')}</div>
      <div class="actions"><button class="btn primary" id="addQuestion">질문 저장</button></div><div class="status" id="status"></div>
    </div>

    <div class="block"><div id="questionList"></div></div>

    <div class="hr"></div><div class="block"><h3>3. 실전연습 메모</h3><textarea id="practiceNotes" rows="8" placeholder="반복해서 막힌 질문, 말이 길어진 부분, 추가로 필요한 Evidence">${esc(data.practiceNotes||'',ctx)}</textarea>
      <div class="actions"><button class="btn primary" id="saveAll">Interview Lab 저장</button><button class="btn secondary" id="nextStep">STEP 12 Human-First Check →</button></div></div>
  </section>`;

  renderQuestions();
  document.getElementById('copyPrompt').addEventListener('click',()=>copy(document.getElementById('interviewPrompt').value,ctx));
  document.getElementById('addQuestion').addEventListener('click',addQuestion);
  document.getElementById('saveAll').addEventListener('click',saveAll);
  document.getElementById('nextStep').addEventListener('click',()=>{saveAll();ctx.navigate(12)});

  function addQuestion(){const q=v('question');if(!q){status('질문을 입력하세요.');return;}const item={id:`iq_${Date.now()}`,category:v('category'),question:q,assetId:v('assetId'),answerOutline:v('answerOutline'),followUps:v('followUps'),practice:v('practice'),improve:v('improve')};data.questions.push(item);persist();['question','answerOutline','followUps','practice','improve'].forEach(id=>document.getElementById(id).value='');renderQuestions();status('면접 질문을 저장했습니다.');}
  function renderQuestions(){const box=document.getElementById('questionList');if(!data.questions.length){box.innerHTML='<div class="placeholder"><b>아직 Interview Question Bank가 없습니다.</b>자소서와 이력서를 검증할 질문부터 쌓아보세요.</div>';return;}box.innerHTML=data.questions.map((q,i)=>{const a=assets.find(x=>x.id===q.assetId);return `<div class="listCard"><div class="listHead"><div><span class="rankTag">${esc(q.category||'질문',ctx)} ${i+1}</span><h3>${esc(q.question,ctx)}</h3><div class="muted small">Evidence: ${esc(a?.experienceTitle||'미연결',ctx)}</div></div><button class="btn danger smallBtn" data-del="${q.id}">삭제</button></div><div class="grid2"><div><b>답변 구조</b><p>${esc(q.answerOutline||'—',ctx)}</p></div><div><b>꼬리질문</b><p>${esc(q.followUps||'—',ctx)}</p></div><div><b>연습 피드백</b><p>${esc(q.practice||'—',ctx)}</p></div><div><b>다음 수정</b><p>${esc(q.improve||'—',ctx)}</p></div></div></div>`}).join('');box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{data.questions=data.questions.filter(x=>x.id!==b.dataset.del);persist();renderQuestions();}));}
  function saveAll(){data.practiceNotes=v('practiceNotes');persist();ctx.toast('Interview Lab을 저장했습니다.');}
  function persist(){ctx.saveState({artifacts:{interviewLab:data}})}function v(id){return document.getElementById(id)?.value?.trim()||''}function status(t){document.getElementById('status').textContent=t;ctx.toast(t)}
}
function buildPrompt(posting,resume,cover,assets){return `너는 채용면접관이다. 모범답안을 만들어주지 말고, 아래 지원서에서 사실과 직무적합성을 검증할 질문을 만들어 실제 면접처럼 한 번에 하나씩 질문해줘.\n\n[기업/직무]\n${posting?`${posting.company} / ${posting.jobTitle}`:'미등록'}\n\n[이력서]\n${JSON.stringify(resume,null,2)}\n\n[자기소개서]\n${JSON.stringify(cover,null,2)}\n\n[Career Asset]\n${JSON.stringify(assets,null,2)}\n\n진행 규칙:\n1. 질문유형을 인성 / 경험 / 지원동기 / 직무 / 상황으로 섞는다.\n2. 이력서·자소서에 쓴 주장 중 검증이 필요한 부분을 우선 질문한다.\n3. 답변을 들은 뒤 '본인이 직접 한 행동', '왜 그렇게 했는지', '결과의 근거'를 꼬리질문한다.\n4. 내가 말하지 않은 사실을 보완해주지 않는다.\n5. 답변이 모호하면 구체화를 요구한다.\n6. 매 답변 후에는 ① 결론 선명도 ② Evidence ③ 직무연결 ④ 불필요하게 긴 표현을 짧게 피드백한다.\n7. 피드백 후 바로 다음 질문으로 넘어간다.\n8. 압박질문은 공격적 표현이 아니라 논리와 사실을 재검증하는 방식으로 한다.\n\n첫 질문부터 시작해줘.`}
function selectAsset(id,label,items){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${items.map(x=>`<option value="${x.id}">${x.experienceTitle} → ${x.requirement}</option>`).join('')}</select></div>`}function area(id,label,value,ph){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ph||''}">${value||''}</textarea></div>`}function sel(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`}function esc(x,ctx){return ctx.escapeHtml(x==null?'':x)}async function copy(t,ctx){try{await navigator.clipboard.writeText(t);ctx.toast('면접 프롬프트를 복사했습니다.')}catch{ctx.toast('복사하지 못했습니다.')}}

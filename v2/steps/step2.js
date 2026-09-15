import {prepareResearchMeasures,renderStrengthMeasure,bindStrengthMeasure} from '../researchMeasures.js';

const ROADMAP_VERSION='career-roadmap-week4-v1';
const CATEGORIES=['수업·과제','팀프로젝트','캡스톤·연구','동아리·학생회','공모전·대외활동','인턴·현장실습','아르바이트·근로','봉사활동','개인프로젝트','기타'];
const EVIDENCE_TYPES=['수치·지표','산출물·문서','교수·상사·고객 피드백','수상·선발·평가결과','작업기록·로그','동료·팀 피드백','자기기억만'];
const STORY_QUESTIONS=[
  {key:'roleModel',title:'롤모델',q:'닮고 싶은 사람은 누구이며, 그 사람의 어떤 점이 끌리나요?'},
  {key:'content',title:'자주 보는 콘텐츠',q:'반복해서 보는 TV·사이트·SNS·콘텐츠는 무엇이며, 왜 계속 관심이 가나요?'},
  {key:'story',title:'좋아하는 이야기',q:'기억에 남는 책·영화·이야기는 무엇이며, 어떤 장면이나 인물에 끌리나요?'},
  {key:'motto',title:'좌우명',q:'중요한 선택을 할 때 기준이 되는 말이나 문장은 무엇인가요?'},
  {key:'memory',title:'초기 기억',q:'어릴 때부터 이상하게 오래 기억나는 장면은 무엇인가요?'}
];

export async function render(ctx){
  if(ctx.courseConfig.researchMeasures)await prepareResearchMeasures(ctx);
  const state=ctx.getState();
  const savedExp=state.assessments?.experienceCompetency||{experiences:[]};
  const experiences=Array.isArray(savedExp.experiences)?savedExp.experiences:[];
  const dna=state.assessments?.careerDNA||{};
  const roadmap=state.assessments?.careerRoadmap||{};
  const root=document.getElementById('stepRoot');
  const best3=normalizeBest3(roadmap.best3);
  const story=roadmap.careerStory||{};
  const selectedStory=Array.isArray(story.selected)?story.selected.slice(0,3):[];
  const directions=Array.isArray(roadmap.directions)?roadmap.directions.slice(0,3):[];
  while(directions.length<3)directions.push('');

  root.innerHTML=`<section class="card careerRoadmapWeek4">
    ${styleBlock()}
    <div class="sectionHead"><div><div class="kicker">STEP 2 · CAREER ROADMAP v0</div><h2>Career Roadmap</h2><p>3주차의 자기이해 가설을 <b>실제 경험으로 확인</b>하고, 다음에 검증할 커리어 방향을 만듭니다.</p></div><span class="badge">4주차</span></div>
    <div class="progress"><span style="width:21%"></span></div>
    <div class="callout info"><b>오늘의 흐름</b> · Career DNA 다시보기 → 경험검증 인터뷰 → My Best 3 Experience → 대표 경험 Evidence Interview → Career Story → Career Theme → Career Direction → 1개월 Career Experiment</div>
    <div class="callout good"><b>AI의 역할</b> · 답을 정해주는 것이 아니라 실제 경험을 묻고, 학생이 말한 사실을 구조화하고, 다음에 확인할 가설을 만드는 데만 사용합니다. 없는 경험·수치·역할·직업적합성을 만들지 않습니다.</div>

    <div class="block"><div class="moduleHead"><span>01</span><div><h3>지난주 Career DNA 다시보기</h3><p>검사결과 자체보다 내가 직접 비교하고 검토한 내용을 출발점으로 사용합니다.</p></div></div>
      ${dnaBridgeHtml(dna,ctx)}
    </div>

    ${ctx.courseConfig.researchMeasures?renderStrengthMeasure(ctx,'pre'):''}

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>02</span><div><h3>Career DNA 경험검증 인터뷰</h3><p>3주차 가설을 맞다고 가정하지 않고 최근의 실제 경험으로 확인합니다.</p></div></div>
      <div class="callout warn"><b>한 번에 질문 하나.</b> AI는 최근의 구체적인 경험을 묻고, 반대되는 경험도 확인합니다. 충분한 근거가 없으면 ‘아직 확인 어려움’으로 남깁니다.</div>
      <div class="actions"><button class="btn secondary" id="makeDnaInterviewPrompt">Career DNA 경험검증 프롬프트 만들기</button><button class="btn outline hidden" id="copyDnaInterviewPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="dnaInterviewPrompt"></div>
      <div class="grid3" style="margin-top:14px">
        ${area('dnaConfirmed','경험으로 확인된 부분','어떤 특징이 어떤 경험에서 반복해서 확인되었나요?',roadmap.dnaValidation?.confirmed||'',ctx)}
        ${area('dnaPartial','부분적으로 확인된 부분','상황에 따라 다르거나 일부만 맞았던 것은?',roadmap.dnaValidation?.partial||'',ctx)}
        ${area('dnaUnresolved','아직 확인하기 어려운 부분','경험 근거가 부족하거나 반대 사례가 있었던 것은?',roadmap.dnaValidation?.unresolved||'',ctx)}
      </div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>03</span><div><h3>My Best 3 Experience</h3><p>화려한 경험보다 내가 실제로 행동한 경험 세 가지를 먼저 찾습니다.</p></div></div>
      ${best3Row('best','내가 꽤 잘했다고 생각하는 경험',best3.best,ctx)}
      ${best3Row('flow','시간 가는 줄 모르고 몰입한 경험',best3.flow,ctx)}
      ${best3Row('recognition','다른 사람에게 인정·감사를 받은 경험',best3.recognition,ctx)}
      <div class="summaryBox" style="margin-top:12px"><h4>오늘 깊게 분석할 대표 경험</h4><p class="help">세 경험 중 하나를 고르세요. 아래 Evidence Interview의 시작자료로 가져올 수 있습니다.</p><div class="repChoices">${['best','flow','recognition'].map(k=>`<label><input type="radio" name="representative" value="${k}" ${roadmap.representativeKey===k?'checked':''}><span>${k==='best'?'잘한 경험':k==='flow'?'몰입 경험':'인정받은 경험'}</span></label>`).join('')}</div><div class="actions"><button class="btn outline" id="useRepresentative">선택한 경험을 아래 분석칸으로 가져오기</button></div></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>04</span><div><h3>대표 경험 Evidence Interview</h3><p>기존 Jobfit의 경험·증거 구조를 유지합니다. 행동과 결과를 실제 근거에 묶습니다.</p></div></div>
      <div id="experienceList">${listHtml(experiences,ctx)}</div><div class="actions"><button class="btn secondary" id="newExp">+ 새 경험 추가</button></div>
      <input type="hidden" id="editId" value="">
      <div class="grid3" style="margin-top:14px">${sel('category','경험 유형','',CATEGORIES,ctx)}${txt('title','경험 이름','','예: 캡스톤 센서 프로젝트',ctx)}${txt('period','기간','','예: 2026.03–06',ctx)}</div>
      <div class="grid3" style="margin-top:12px">${sel('workMode','진행 방식','',['개인','팀','조직/부서'],ctx)}${score('contribution','내 기여도')}${txt('roleTitle','내 역할 한 줄','','예: 회로설계 담당 / 고객응대 / 자료분석',ctx)}</div>
      <div class="grid2" style="margin-top:12px">${area('context','경험 배경','무엇을 하기 위한 경험이었나요? 목적과 상황만 짧게.','',ctx)}${area('role','내 책임 범위','팀 전체가 아니라 내가 맡은 책임과 의사결정 범위는 무엇이었나요?','',ctx)}</div>
      <div class="actions" style="margin-top:12px"><button class="btn secondary" id="makeInterviewPrompt">대표 경험 인터뷰 프롬프트 만들기</button><button class="btn outline hidden" id="copyInterviewPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="interviewPrompt"></div>
      <div class="grid2" style="margin-top:14px">${area('challenge','문제·과제','내가 해결하거나 달성해야 했던 핵심 과제는?','',ctx)}${area('action','내가 직접 한 행동','내가 실제로 한 행동을 동사 중심으로 적으세요.','',ctx)}${area('reason','판단·이유','왜 그 행동을 선택했나요? 비교한 대안이나 판단기준은?','',ctx)}${area('result','결과','무엇이 달라졌나요? 확인 가능한 결과만 적으세요.','',ctx)}${area('evidence','증거','수치·산출물·피드백·기록 등 결과를 입증하는 근거는?','',ctx)}${area('learning','전이 가능한 배움','다른 상황에서도 다시 사용할 수 있는 방식·원칙은?','',ctx)}</div>
      <div class="grid3" style="margin-top:12px">${sel('evidenceType','가장 강한 증거 유형','',EVIDENCE_TYPES,ctx)}${sel('evidenceGrade','증거 강도','',['A · 객관적 자료로 확인 가능','B · 타인의 피드백/평가로 확인','C · 본인 설명 중심'],ctx)}${txt('actionVerbs','핵심 행동동사','','예: 비교했다, 분석했다, 조율했다',ctx)}</div>
      <div class="field" style="margin-top:12px"><label>내 원래 말 · Raw Voice</label><textarea id="rawVoice" placeholder="AI가 다듬기 전 내가 실제로 설명한 문장이나 메모"></textarea><span class="hint">STEP 12 Human-First에서 내 언어를 복원할 때 사용합니다.</span></div>
      <div class="field" style="margin-top:12px"><label>AI 구조화 결과 <span class="muted">(선택)</span></label><textarea id="aiStructured" placeholder="AI가 정리한 구조가 있다면 붙여넣되, 사실확인 후 사용"></textarea></div>
      <div class="grid3" style="margin-top:14px">${competencyRow(1)}${competencyRow(2)}${competencyRow(3)}</div>
      <div class="field" style="margin-top:12px"><label>추가 역량 키워드 <span class="muted">(선택)</span></label><input class="input" id="competencies" placeholder="예: 데이터분석, 조율, 책임감"><span class="hint">쉼표로 구분. 이후 실제 채용공고의 Task·KSA와 다시 대조합니다.</span></div>
      <div class="qualityBox" style="margin-top:14px">
        ${check('ownershipChecked','팀의 행동과 내가 직접 한 행동을 구분했다.')}
        ${check('evidenceChecked','결과를 뒷받침하는 증거 수준을 확인했다.')}
        ${check('noFabrication','내가 하지 않은 행동·확인되지 않은 수치·과장된 결과가 없다.')}
        ${check('transferChecked','이 경험의 행동이 다른 상황에서 어떻게 재사용될지 설명할 수 있다.')}
      </div>
      <div class="actions"><button class="btn primary" id="saveExp">이 경험 저장</button><button class="btn outline" id="clearForm">입력 초기화</button></div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>05</span><div><h3>Career Story</h3><p>나를 더 잘 보여주는 질문 3개를 골라 답합니다. 정답을 찾기보다 반복되는 관심과 기준을 봅니다.</p></div></div>
      <div class="storyGrid">${STORY_QUESTIONS.map(q=>storyCard(q,story,selectedStory,ctx)).join('')}</div><div class="status" id="storyStatus">${selectedStory.length}/3 선택</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>06</span><div><h3>Career Theme</h3><p>좋아하는 것 × 중요하게 생각하는 것 × 일로 만들고 싶은 것을 한 문장으로 연결합니다.</p></div></div>
      <div class="grid3">${area('themeLike','내가 좋아하는 것','배우기, 설명하기, 만들기처럼 활동 중심으로 적어보세요.',roadmap.theme?.like||'',ctx)}${area('themeValue','내가 중요하게 생각하는 것','전문성, 성장, 자율성, 관계, 삶의 여유 등',roadmap.theme?.value||'',ctx)}${area('themeWork','내가 일로 만들고 싶은 것','누구에게 어떤 도움이나 가치를 주는 일인지 적어보세요.',roadmap.theme?.work||'',ctx)}</div>
      <div class="actions"><button class="btn secondary" id="makeThemePrompt">Career Theme 문장 후보 만들기</button><button class="btn outline hidden" id="copyThemePrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="themePrompt"></div>
      ${area('careerTheme','내가 선택·수정한 Career Theme','AI 문장을 그대로 복사하지 말고 내 말로 수정해 한 문장으로 저장하세요.',roadmap.theme?.statement||'',ctx)}
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>07</span><div><h3>Career Direction · 방향 가설 2~3개</h3><p>직업을 확정하지 않습니다. 다음 단계에서 실제 직무정보와 채용공고로 확인할 방향을 만듭니다.</p></div></div>
      <div class="actions"><button class="btn secondary" id="makeDirectionPrompt">방향 가설 프롬프트 만들기</button><button class="btn outline hidden" id="copyDirectionPrompt">프롬프트 복사</button></div><div class="promptBox hidden" id="directionPrompt"></div>
      <div class="grid3" style="margin-top:12px">${[0,1,2].map(i=>txt(`direction_${i}`,`방향 가설 ${i+1}`,directions[i]||'',i===0?'예: 사람의 진로·학습·성장을 돕는 방향':'',ctx)).join('')}</div>
      <div class="grid2" style="margin-top:14px">${area('gapHave','지금 가진 것','현재 확인된 강점, 경험, 관심, 기술은?',roadmap.miniGap?.have||'',ctx)}${area('gapVerify','다음에 확인할 것','직무의 실제 업무, 필요한 역량, 채용공고 요구조건 중 무엇을 확인해야 하나요?',roadmap.miniGap?.verify||'',ctx)}</div>
    </div>

    <div class="hr"></div><div class="block"><div class="moduleHead"><span>08</span><div><h3>1개월 Career Experiment</h3><p>방향을 결정하는 대신 작은 행동으로 확인합니다.</p></div></div>
      <div class="grid3">${txt('experimentAction','무엇을 할 것인가',roadmap.experiment?.action||'','예: 관심 직무 채용공고 5개 분석하기',ctx)}${txt('experimentDeadline','언제까지',roadmap.experiment?.deadline||'','예: 10월 15일까지',ctx)}${txt('experimentEvidence','무엇을 남길 것인가',roadmap.experiment?.evidence||'','예: 공고 분석표 1개',ctx)}</div>
      <div class="summaryBox" style="margin-top:14px"><h4>Career Roadmap v0</h4><p class="help">오늘 만든 방향은 확정된 진로가 아니라 다음 단계에서 검증할 가설입니다.</p><div id="roadmapPreview">${roadmapPreviewHtml(roadmap,ctx)}</div></div>
    </div>

    <div class="actions"><button class="btn primary" id="saveRoadmap">4주차 Career Roadmap 저장</button><button class="btn secondary" id="nextStep">STEP 3 직무탐색 →</button></div><div class="status" id="status"></div>
  </section>`;

  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>loadExperience(b.dataset.edit)));
  root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteExperience(b.dataset.delete)));
  root.querySelectorAll('[data-story-select]').forEach(el=>el.addEventListener('change',handleStorySelection));
  document.getElementById('newExp').addEventListener('click',clearForm);
  document.getElementById('clearForm').addEventListener('click',clearForm);
  document.getElementById('saveExp').addEventListener('click',saveExperience);
  document.getElementById('useRepresentative').addEventListener('click',useRepresentative);
  document.getElementById('saveRoadmap').addEventListener('click',()=>saveRoadmap(true));
  document.getElementById('nextStep').addEventListener('click',()=>{saveRoadmap(false);ctx.navigate(3)});
  document.getElementById('makeDnaInterviewPrompt').addEventListener('click',()=>showPrompt('dnaInterviewPrompt','copyDnaInterviewPrompt',makeDnaValidationPrompt()));
  document.getElementById('makeInterviewPrompt').addEventListener('click',()=>showPrompt('interviewPrompt','copyInterviewPrompt',makeExperiencePrompt()));
  document.getElementById('makeThemePrompt').addEventListener('click',()=>showPrompt('themePrompt','copyThemePrompt',makeThemePrompt()));
  document.getElementById('makeDirectionPrompt').addEventListener('click',()=>showPrompt('directionPrompt','copyDirectionPrompt',makeDirectionPrompt()));
  bindCopy('copyDnaInterviewPrompt','dnaInterviewPrompt','Career DNA 경험검증 프롬프트를 복사했습니다.');
  bindCopy('copyInterviewPrompt','interviewPrompt','대표 경험 인터뷰 프롬프트를 복사했습니다.');
  bindCopy('copyThemePrompt','themePrompt','Career Theme 프롬프트를 복사했습니다.');
  bindCopy('copyDirectionPrompt','directionPrompt','방향 가설 프롬프트를 복사했습니다.');
  ['dnaConfirmed','dnaPartial','dnaUnresolved','careerTheme','direction_0','direction_1','direction_2','gapHave','gapVerify','experimentAction','experimentDeadline','experimentEvidence'].forEach(id=>document.getElementById(id)?.addEventListener('input',refreshPreview));
  if(ctx.courseConfig.researchMeasures)bindStrengthMeasure(ctx,'pre');

  function showPrompt(boxId,copyId,prompt){const box=document.getElementById(boxId);box.textContent=prompt;box.classList.remove('hidden');document.getElementById(copyId)?.classList.remove('hidden')}
  function bindCopy(buttonId,boxId,message){document.getElementById(buttonId)?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(boxId)?.textContent||'');ctx.toast(message)}catch{ctx.toast('직접 선택해 복사해 주세요.')}})}
  function currentExperiences(){return ctx.getState().assessments?.experienceCompetency?.experiences||[]}
  function saveExperience(){
    const title=v('title');if(!title){ctx.toast('경험 이름을 먼저 입력해 주세요.');return}
    saveRoadmap(false);
    const oldId=v('editId');
    const competencyEvidence=[1,2,3].map(i=>({keyword:v(`comp_${i}`),evidence:v(`compEv_${i}`)})).filter(x=>x.keyword||x.evidence);
    const extra=v('competencies').split(',').map(x=>x.trim()).filter(Boolean);
    const competencies=[...new Set([...competencyEvidence.map(x=>x.keyword).filter(Boolean),...extra])];
    const quality={ownership:ck('ownershipChecked'),evidence:ck('evidenceChecked'),noFabrication:ck('noFabrication'),transfer:ck('transferChecked')};
    const item={id:oldId||`EXP-${Date.now()}`,category:v('category'),title,period:v('period'),workMode:v('workMode'),contribution:n('contribution'),roleTitle:v('roleTitle'),context:v('context'),role:v('role'),challenge:v('challenge'),action:v('action'),reason:v('reason'),result:v('result'),evidence:v('evidence'),evidenceType:v('evidenceType'),evidenceGrade:v('evidenceGrade'),actionVerbs:v('actionVerbs'),learning:v('learning'),rawVoice:v('rawVoice'),aiStructured:v('aiStructured'),competencies,competencyEvidence,quality,factChecked:quality.noFabrication&&quality.ownership,updatedAt:new Date().toISOString()};
    const arr=[...currentExperiences()];const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]=item;else arr.push(item);
    ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:experienceMap(arr)}});ctx.toast('경험을 Evidence 기반 Career Asset 후보로 저장했습니다.');ctx.navigate(2);
  }
  function loadExperience(id){const x=currentExperiences().find(e=>e.id===id);if(!x)return;set('editId',x.id);['category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured'].forEach(k=>set(k,x[k]||''));set('contribution',x.contribution||3);set('competencies',(x.competencies||[]).filter(c=>!(x.competencyEvidence||[]).some(e=>e.keyword===c)).join(', '));[1,2,3].forEach((i,idx)=>{set(`comp_${i}`,x.competencyEvidence?.[idx]?.keyword||'');set(`compEv_${i}`,x.competencyEvidence?.[idx]?.evidence||'')});document.getElementById('ownershipChecked').checked=!!x.quality?.ownership;document.getElementById('evidenceChecked').checked=!!x.quality?.evidence;document.getElementById('noFabrication').checked=!!x.quality?.noFabrication;document.getElementById('transferChecked').checked=!!x.quality?.transfer;document.getElementById('title').focus();}
  function deleteExperience(id){if(!confirm('이 경험을 삭제할까요?'))return;saveRoadmap(false);const arr=currentExperiences().filter(x=>x.id!==id);ctx.saveState({assessments:{experienceCompetency:{experiences:arr}},artifacts:{experienceMap:experienceMap(arr)}});ctx.toast('삭제했습니다.');ctx.navigate(2)}
  function clearForm(){['editId','category','title','period','workMode','roleTitle','context','role','challenge','action','reason','result','evidence','evidenceType','evidenceGrade','actionVerbs','learning','rawVoice','aiStructured','competencies','comp_1','compEv_1','comp_2','compEv_2','comp_3','compEv_3'].forEach(k=>set(k,''));set('contribution',3);['ownershipChecked','evidenceChecked','noFabrication','transferChecked'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false});document.getElementById('title')?.focus()}
  function useRepresentative(){const key=document.querySelector('input[name="representative"]:checked')?.value;if(!key){ctx.toast('대표 경험을 먼저 선택해 주세요.');return}const title=v(`best3_${key}_title`),summary=v(`best3_${key}_summary`);if(!title&&!summary){ctx.toast('선택한 경험의 제목이나 설명을 먼저 적어 주세요.');return}if(!v('title'))set('title',title);if(!v('context'))set('context',summary);document.getElementById('title')?.scrollIntoView({behavior:'smooth',block:'center'});ctx.toast('대표 경험을 분석칸에 가져왔습니다.')}
  function handleStorySelection(e){const checked=[...document.querySelectorAll('[data-story-select]:checked')];if(checked.length>3){e.target.checked=false;ctx.toast('Career Story 질문은 최대 3개까지 선택할 수 있습니다.')}document.getElementById('storyStatus').textContent=`${document.querySelectorAll('[data-story-select]:checked').length}/3 선택`}
  function collectRoadmap(){
    const selected=[...document.querySelectorAll('[data-story-select]:checked')].map(x=>x.value);
    const answers={};STORY_QUESTIONS.forEach(q=>{answers[q.key]=v(`story_${q.key}`)});
    return {version:ROADMAP_VERSION,updatedAt:new Date().toISOString(),sourceCareerDNAVersion:dna.hypothesis?.version||dna.standard?.version||'',dnaValidation:{confirmed:v('dnaConfirmed'),partial:v('dnaPartial'),unresolved:v('dnaUnresolved')},best3:{best:{title:v('best3_best_title'),summary:v('best3_best_summary')},flow:{title:v('best3_flow_title'),summary:v('best3_flow_summary')},recognition:{title:v('best3_recognition_title'),summary:v('best3_recognition_summary')}},representativeKey:document.querySelector('input[name="representative"]:checked')?.value||'',careerStory:{selected,answers},theme:{like:v('themeLike'),value:v('themeValue'),work:v('themeWork'),statement:v('careerTheme')},directions:[0,1,2].map(i=>v(`direction_${i}`)).filter(Boolean),miniGap:{have:v('gapHave'),verify:v('gapVerify')},experiment:{action:v('experimentAction'),deadline:v('experimentDeadline'),evidence:v('experimentEvidence')}}
  }
  function saveRoadmap(showToast){const data=collectRoadmap();const artifact={version:'career-roadmap-artifact-v0',dnaValidation:data.dnaValidation,representativeExperience:data.best3?.[data.representativeKey]||null,careerTheme:data.theme.statement,directions:data.directions,miniGap:data.miniGap,experiment:data.experiment,updatedAt:data.updatedAt};ctx.saveState({assessments:{careerRoadmap:data},artifacts:{careerRoadmap:artifact}});if(showToast){document.getElementById('status').textContent='4주차 Career Roadmap이 이 브라우저에 저장되었습니다.';ctx.toast('4주차 Career Roadmap을 저장했습니다.')}refreshPreview();return data}
  function refreshPreview(){const el=document.getElementById('roadmapPreview');if(el)el.innerHTML=roadmapPreviewHtml(collectRoadmap(),ctx)}
  function makeDnaValidationPrompt(){
    const c=dna.comparison||{},r=dna.reflection||{},h=dna.hypothesis||{};
    const lines=['당신은 대학생의 자기이해 가설을 실제 경험으로 검증하는 Career DNA 인터뷰어다. 목표는 검사결과를 다시 해석하거나 직업을 추천하는 것이 아니라, 학생의 실제 경험에서 가설을 확인·수정·보류하는 것이다.','','[3주차에서 학생이 검토한 자료]'];
    if(h.text)lines.push(`Career DNA 가설 v1: ${h.text}`);if(h.selfCheck)lines.push(`학생의 자기평가: ${h.selfCheck}`);if(c.repeat||r.fit)lines.push(`반복해서 나타난다고 본 부분: ${c.repeat||r.fit}`);if(c.unexpected||r.disagree)lines.push(`예상과 달랐던 부분: ${c.unexpected||r.disagree}`);if(c.verify||r.question)lines.push(`더 확인하고 싶은 부분: ${c.verify||r.question}`);if(lines.length===3)lines.push('학생이 3주차 요약을 충분히 저장하지 않았다. 먼저 확인하고 싶은 자기특징 한 가지를 학생에게 물어라.');
    lines.push('','[인터뷰 규칙]','1. 한 번에 질문 하나만 한다.','2. 최근의 구체적인 경험을 우선 묻는다.','3. 상황 설명보다 학생이 실제로 한 행동, 선택 이유, 결과를 확인한다.','4. 한 경험만으로 특징을 확정하지 말고 가능하면 다른 경험이나 반대 사례도 확인한다.','5. 학생의 답에 없는 경험·수치·역할을 만들지 않는다.','6. 검사명만으로 성격·역량·직업적합성을 단정하지 않는다.','7. 직업을 추천하지 않는다.','8. 약 5~6개의 질문 안에서 충분한 근거가 모이면 정리한다.','','[마지막 정리 형식]','- 경험으로 확인됨: 특징 + 근거 경험','- 부분적으로 확인됨: 어떤 상황에서 맞고 다른지','- 아직 확인 어려움: 근거 부족 또는 반대 사례','- 다음에 더 확인할 질문 1~2개','','첫 질문부터 시작해줘.');return lines.join('\n')
  }
  function makeExperiencePrompt(){
    const dnaBlock=[v('dnaConfirmed')&&`경험으로 확인된 Career DNA: ${v('dnaConfirmed')}`,v('dnaPartial')&&`부분확인: ${v('dnaPartial')}`,v('dnaUnresolved')&&`미확인: ${v('dnaUnresolved')}`].filter(Boolean);
    return `지금부터 내 대표 경험을 분석하는 증거 중심 인터뷰어가 되어줘. 목표는 자소서를 대신 쓰는 것이 아니라 내가 실제로 한 행동과 증거를 정확히 꺼내는 것이다.\n\n[경험 기본정보]\n유형: ${v('category')||'미입력'}\n경험명: ${v('title')||'미입력'}\n기간: ${v('period')||'미입력'}\n진행방식: ${v('workMode')||'미입력'}\n내 역할: ${v('roleTitle')||'미입력'}\n배경: ${v('context')||'미입력'}\n책임범위: ${v('role')||'미입력'}${dnaBlock.length?`\n\n[앞선 Career DNA 검증 결과 · 참고 가설]\n${dnaBlock.join('\n')}`:''}\n\n[인터뷰 규칙]\n1. 한 번에 질문 하나만 한다.\n2. 팀 전체가 한 일과 내가 직접 한 일을 분리한다.\n3. 문제·과제 → 내 행동 → 판단이유 → 결과 → 증거 → 배움 순으로 확인한다.\n4. 수치나 결과를 추측하지 말고 확인 가능한 근거가 없으면 없다고 둔다.\n5. 역량 이름부터 붙이지 말고 행동을 충분히 확인한 뒤 후보로 제시한다.\n6. 내가 하지 않은 행동이나 과장된 성과를 만들지 않는다.\n7. 마지막에는 핵심 행동동사, 확인 가능한 증거, 역량 후보와 그 근거행동을 표로 정리한다.\n\n첫 질문부터 시작해줘.`
  }
  function makeThemePrompt(){
    const storyLines=STORY_QUESTIONS.filter(q=>document.querySelector(`[data-story-select][value="${q.key}"]`)?.checked&&v(`story_${q.key}`)).map(q=>`${q.title}: ${v(`story_${q.key}`)}`);
    return `당신은 학생의 Career Theme 문장을 다듬는 조력자다. 아래 입력만 사용하고, 직업을 추천하거나 새로운 성격특성을 만들어내지 말아줘.\n\n[내가 좋아하는 것]\n${v('themeLike')||'미입력'}\n\n[내가 중요하게 생각하는 것]\n${v('themeValue')||'미입력'}\n\n[내가 일로 만들고 싶은 것]\n${v('themeWork')||'미입력'}${v('dnaConfirmed')?`\n\n[경험으로 확인된 특징]\n${v('dnaConfirmed')}`:''}${storyLines.length?`\n\n[Career Story에서 선택한 단서]\n${storyLines.join('\n')}`:''}\n\n[요청]\n1. 학생이 입력한 표현을 최대한 살려 Career Theme 문장 후보 3개를 만들어줘.\n2. 각 후보는 한 문장으로 짧게 쓴다.\n3. 특정 직업명이나 기업명을 넣지 않는다.\n4. 입력에 없는 가치·강점·경험을 추가하지 않는다.\n5. 마지막에 학생에게 세 문장 중 가장 자기답다고 느끼는 문장을 직접 고쳐 쓰라고 안내해줘.`
  }
  function makeDirectionPrompt(){
    const exp=currentExperiences().slice(0,3).map(x=>`${x.title}: 행동=${x.action||'미입력'} / 결과=${x.result||'미입력'} / 역량후보=${(x.competencies||[]).join(', ')||'미입력'}`);
    return `당신은 커리어 방향을 확정하는 추천자가 아니라 다음 탐색을 위한 가설을 만드는 조력자다.\n\n[Career Theme]\n${v('careerTheme')||'미입력'}${v('dnaConfirmed')?`\n\n[경험으로 확인된 특징]\n${v('dnaConfirmed')}`:''}${exp.length?`\n\n[저장된 경험 근거]\n${exp.join('\n')}`:''}\n\n[요청]\n1. 다음 단계에서 탐색해볼 '일의 방향 가설'을 최대 3개 제안한다.\n2. 특정 직업을 나와 잘 맞는다고 확정하거나 추천하지 않는다.\n3. 각 방향은 '어떤 문제를 / 어떤 방식으로 / 누구에게 가치로 연결하는가'가 보이게 한 문장으로 쓴다.\n4. 각 방향마다 다음 STEP에서 실제 직무정보·채용공고로 확인해야 할 질문 1개를 붙인다.\n5. 입력에 없는 경험이나 능력을 추정하지 않는다.`
  }
  function v(id){return document.getElementById(id)?.value?.trim?.()||''}
  function n(id){return Number(document.getElementById(id)?.value||0)}
  function ck(id){return !!document.getElementById(id)?.checked}
  function set(id,val){const el=document.getElementById(id);if(el)el.value=val}
}

function normalizeBest3(x){return{best:{title:x?.best?.title||'',summary:x?.best?.summary||''},flow:{title:x?.flow?.title||'',summary:x?.flow?.summary||''},recognition:{title:x?.recognition?.title||'',summary:x?.recognition?.summary||''}}}
function experienceMap(arr){return arr.map(x=>({id:x.id,title:x.title,category:x.category,action:x.action,result:x.result,evidence:x.evidence,evidenceGrade:x.evidenceGrade,competencies:x.competencies,competencyEvidence:x.competencyEvidence,factChecked:x.factChecked}))}
function dnaBridgeHtml(dna,ctx){
  const h=dna.hypothesis||{},c=dna.comparison||{},r=dna.reflection||{};
  const rows=[];
  if(h.text)rows.push(['Career DNA 가설 v1',h.text]);
  if(h.selfCheck)rows.push(['내가 본 정확도',h.selfCheck]);
  if(c.repeat||r.fit)rows.push(['반복해서 나타난 부분',c.repeat||r.fit]);
  if(c.connect)rows.push(['서로 연결된 부분',c.connect]);
  if(c.unexpected||r.disagree)rows.push(['예상과 달랐던 부분',c.unexpected||r.disagree]);
  if(c.verify||r.question)rows.push(['더 확인하고 싶은 부분',c.verify||r.question]);
  if(!rows.length)return '<div class="callout good"><b>STEP 1 → STEP 2</b> · 저장된 Career DNA 요약이 없습니다. 4주차에서는 현재 기억나는 자기특징을 가설로 두고 실제 경험부터 확인할 수 있습니다.</div>';
  return `<div class="dnaBridge"><div class="dnaBridgeHead"><b>STEP 1 → STEP 2 · 경험으로 검증하기</b><span>검사점수가 정답은 아닙니다.</span></div>${rows.map(([k,val])=>`<div class="dnaBridgeRow"><small>${ctx.escapeHtml(k)}</small><p>${ctx.escapeHtml(val)}</p></div>`).join('')}</div>`
}
function best3Row(key,label,saved,ctx){return `<div class="best3Row"><div class="best3Label"><b>${ctx.escapeHtml(label)}</b></div><input class="input" id="best3_${key}_title" value="${ctx.escapeHtml(saved?.title||'')}" placeholder="경험 이름"><textarea id="best3_${key}_summary" placeholder="무엇을 했고 왜 이 경험이 떠오르는지 한두 문장">${ctx.escapeHtml(saved?.summary||'')}</textarea></div>`}
function storyCard(q,story,selected,ctx){return `<div class="storyCard"><label class="storyPick"><input type="checkbox" data-story-select value="${q.key}" ${selected.includes(q.key)?'checked':''}><span>이 질문 선택</span></label><b>${ctx.escapeHtml(q.title)}</b><p>${ctx.escapeHtml(q.q)}</p><textarea id="story_${q.key}" placeholder="선택한 질문이라면 내 답을 적어보세요.">${ctx.escapeHtml(story?.answers?.[q.key]||'')}</textarea></div>`}
function roadmapPreviewHtml(data,ctx){const dirs=(data.directions||[]).filter(Boolean);return `<div class="roadmapPreview"><div><small>경험으로 확인된 Career DNA</small><p>${ctx.escapeHtml(data.dnaValidation?.confirmed||'아직 입력하지 않음')}</p></div><div><small>Career Theme</small><p>${ctx.escapeHtml(data.theme?.statement||'아직 입력하지 않음')}</p></div><div><small>탐색할 방향</small><p>${dirs.length?dirs.map((x,i)=>`${i+1}. ${ctx.escapeHtml(x)}`).join('<br>'):'아직 입력하지 않음'}</p></div><div><small>1개월 Career Experiment</small><p>${ctx.escapeHtml(data.experiment?.action||'아직 입력하지 않음')}${data.experiment?.deadline?` · ${ctx.escapeHtml(data.experiment.deadline)}`:''}${data.experiment?.evidence?` · 결과물: ${ctx.escapeHtml(data.experiment.evidence)}`:''}</p></div></div>`}
function competencyRow(i){return `<div class="metricCard"><b>역량 ${i}</b><div class="field"><label>키워드</label><input class="input" id="comp_${i}" placeholder="예: 문제해결"></div><div class="field" style="margin-top:8px"><label>근거 행동</label><textarea id="compEv_${i}" placeholder="이 역량을 보여주는 실제 행동 한 문장"></textarea></div></div>`}
function score(id,label){return `<div class="field"><label>${label} <span class="muted">1–5</span></label><select id="${id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}${n===1?' 낮음':n===5?' 높음':''}</option>`).join('')}</select></div>`}
function check(id,text){return `<label class="checkRow"><input type="checkbox" id="${id}"><div><b>${text}</b></div></label>`}
function txt(id,label,value,ph,ctx){return `<div class="field"><label>${label}</label><input class="input" id="${id}" value="${ctx.escapeHtml(value||'')}" placeholder="${ctx.escapeHtml(ph||'')}"></div>`}
function area(id,label,ph,value,ctx){return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${ctx.escapeHtml(ph||'')}">${ctx.escapeHtml(value||'')}</textarea></div>`}
function sel(id,label,value,opts,ctx){return `<div class="field"><label>${label}</label><select id="${id}"><option value="">선택</option>${opts.map(o=>`<option value="${ctx.escapeHtml(o)}" ${o===value?'selected':''}>${ctx.escapeHtml(o)}</option>`).join('')}</select></div>`}
function listHtml(items,ctx){if(!items.length)return '<div class="placeholder"><b>아직 저장한 경험이 없습니다.</b> 대표 경험 하나를 골라 Evidence Interview를 시작해 보세요.</div>';return `<div class="resultGrid">${items.map(x=>`<div class="resultCard"><strong>${ctx.escapeHtml(x.title)}</strong><p>${ctx.escapeHtml(x.category||'경험')} · ${(x.competencies||[]).map(c=>ctx.escapeHtml(c)).join(' · ')||'역량 미입력'}</p><div class="pillRow" style="margin-top:10px"><span class="pill">${ctx.escapeHtml(x.evidenceGrade||'증거등급 미정')}</span>${x.factChecked?'<span class="pill">Fact Checked</span>':'<span class="pill">검증 필요</span>'}</div><div class="actions"><button class="btn outline smallBtn" data-edit="${x.id}">수정</button><button class="btn danger smallBtn" data-delete="${x.id}">삭제</button></div></div>`).join('')}</div>`}
function styleBlock(){return `<style>
.careerRoadmapWeek4 .moduleHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.careerRoadmapWeek4 .moduleHead>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eef0ff;color:#4940b8;font-weight:900;flex:0 0 auto}.careerRoadmapWeek4 .moduleHead h3{margin:0 0 3px}.careerRoadmapWeek4 .moduleHead p{margin:0;color:var(--muted);font-size:13px}.dnaBridge{border:1px solid var(--line);border-radius:16px;overflow:hidden}.dnaBridgeHead{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;background:#f7f8ff}.dnaBridgeHead span{font-size:12px;color:var(--muted)}.dnaBridgeRow{padding:10px 14px;border-top:1px solid var(--line)}.dnaBridgeRow small{color:var(--muted);font-weight:800}.dnaBridgeRow p{margin:4px 0 0;white-space:pre-wrap}.best3Row{display:grid;grid-template-columns:220px 1fr 1.5fr;gap:9px;align-items:stretch;margin-top:9px}.best3Label{display:flex;align-items:center;padding:10px 12px;background:#fafafa;border:1px solid var(--line);border-radius:12px}.best3Row textarea{min-height:70px}.repChoices{display:flex;flex-wrap:wrap;gap:8px}.repChoices label input{position:absolute;opacity:0}.repChoices label span{display:block;padding:8px 12px;border:1px solid var(--line);border-radius:999px;cursor:pointer}.repChoices label input:checked+span{background:#5b50dd;color:#fff;border-color:#5b50dd}.qualityBox{border:1px solid var(--line);border-radius:14px;padding:10px}.storyGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.storyCard{border:1px solid var(--line);border-radius:14px;padding:12px}.storyCard>p{font-size:12px;color:var(--muted);min-height:38px}.storyCard textarea{min-height:90px}.storyPick{display:flex;gap:6px;align-items:center;font-size:12px;margin-bottom:8px}.roadmapPreview{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.roadmapPreview>div{border:1px solid var(--line);border-radius:12px;padding:11px}.roadmapPreview small{color:var(--muted);font-weight:800}.roadmapPreview p{margin:5px 0 0;line-height:1.6}.summaryBox{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fafbff}.summaryBox h4{margin:0 0 6px}@media(max-width:760px){.best3Row{grid-template-columns:1fr}.storyGrid,.roadmapPreview{grid-template-columns:1fr}.dnaBridgeHead{display:block}.dnaBridgeHead span{display:block;margin-top:4px}}
</style>`}

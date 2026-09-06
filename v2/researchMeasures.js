const WORK24_URL='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const WORK24_LABELS=['경제적 취약성 적응도','가족의 지지','사회적 지지','자아 존중감','자기 효능감','구직기술','의사전달','대인관계 활용','구직정보 수집'];
const MEASURE_SESSION_KEY='jobfit:research-measures:loaded:v2';
const MEASURE_FUNCTION_NAME='research-measures';
let measureBundle=readMeasureSession();

export async function prepareResearchMeasures(ctx){
  if(hasVerifiedBundle())return true;
  try{
    measureBundle=await fetchMeasureBundle(ctx);
    sessionStorage.setItem(MEASURE_SESSION_KEY,JSON.stringify(measureBundle));
    return true;
  }catch(error){
    console.error(error);
    return false;
  }
}

export function renderMeasurePanel(ctx,timepoint='pre'){
  if(!hasVerifiedBundle())return renderLoadError();
  const KCAAS_SCALE=measureBundle.kcaas,SUDCO_SCALE=measureBundle.sudco;
  const saved=ctx.getState().research?.measurements?.[timepoint]||{};
  const w=saved.work24JobReadiness||{},k=saved.kcaas||{},u=saved.sudco||{};
  const kItems=lockedSavedItems(k,KCAAS_SCALE),uItems=lockedSavedItems(u,SUDCO_SCALE);
  const prefix=timepoint==='post'?'post':'pre';
  const includeStrengthDeficit=timepoint==='post';
  const title=timepoint==='post'?'POST · 수업 후(학기 말) 측정':'PRE · 수업 전(시작점) 측정';
  const timing=timepoint==='post'?'수업을 모두 마친 뒤':'수업 시작 전';
  return `<div class="hr"></div><div class="block researchMeasurePanel" data-timepoint="${prefix}">
    <div class="sectionHead"><div><h3>${title}</h3><p class="help"><b>PRE는 수업 전(Before), POST는 수업 후(After)</b>를 뜻합니다. ${timing} 같은 익명코드로 측정하며 두 결과를 비교해 변화를 확인합니다.</p></div><span class="badge">수업 전 / 수업 후</span></div>
    <div class="callout info"><b>권장 순서</b><br>${includeStrengthDeficit?'① 고용24 구직준비도검사 → ② 진로적응성 12문항 → ③ 강점활용·약점교정 9문항 → ④ 한 번에 저장':'① 고용24 구직준비도검사 → ② 진로적응성 12문항 → ③ 한 번에 저장'}</div>

    <div class="summaryBox">
      <div class="sectionHead"><div><div class="kicker">PRIMARY OUTCOME · WORK24</div><h3>고용24 구직준비도검사 · 대학생·성인용</h3><p class="help">아래 버튼을 누르면 고용24 공식 직업심리검사 화면이 열립니다. 대상이 <b>‘대학생·성인’</b>으로 표시된 구직준비도검사를 실시한 뒤 결과표의 9개 점수를 이 화면에 입력합니다.</p></div><span class="badge">대학생 대상 · 약 20분</span></div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">대학생용 구직준비도검사 화면 열기 ↗</a><a class="btn outline" href="https://www.work24.go.kr/wk/r/c/1000/jobPsyExamRsltList.do" target="_blank" rel="noopener">내 검사 결과 확인 ↗</a></div>
      <div class="callout warn"><b>고용24 화면에서 ‘구직준비도검사’를 선택하세요.</b><br>검사대상에 ‘대학생·성인’, 검사시간에 ‘20분’이라고 표시된 검사입니다. 직업선호도 S형·L형과는 다른 검사이며 PRE와 POST에서 동일한 검사를 사용합니다.</div>
      <div class="grid3" style="margin-top:12px"><div class="field"><label>검사일</label><input class="input" id="${prefix}Work24Date" type="date" value="${ctx.escapeHtml(w.examDate||'')}"></div>${WORK24_LABELS.map((label,i)=>`<div class="field"><label>${i+1}. ${label}</label><input class="input scoreInput" type="number" step="0.01" data-measure="${prefix}-work24" data-key="w${i+1}" value="${ctx.escapeHtml(w.scores?.[i]??'')}" placeholder="결과표 점수"></div>`).join('')}</div>
      <div class="status" id="${prefix}Work24Status">${complete(w.scores,9)?'9개 결과점수 입력 완료':''}</div>
    </div>

    <details class="summaryBox" style="margin-top:14px" ${timepoint==='pre'?'open':''} data-scale-version="${KCAAS_SCALE.version}">
      <summary><b>K-CAAS-SF · 진로적응성 12문항</b> <span class="muted">(약 3–4분)</span></summary>
      <div style="margin-top:12px"><div class="callout info"><b>한국판 원문 확인 · PRE/POST 동일</b><br>김민선·고은영(2020) 논문 부록의 K-CAAS-SF 12문항과 동일한 문항·순서·응답척도를 사용합니다. 이전 다른 버전의 응답값은 자동 이관하지 않습니다.</div>
      <p class="help scaleInstruction" data-scale="kcaas">각 문항을 읽고 현재 자신과 일치하는 정도를 ${KCAAS_SCALE.response.min}(${KCAAS_SCALE.response.minLabel})–${KCAAS_SCALE.response.max}(${KCAAS_SCALE.response.maxLabel}) 중 하나로 응답하세요. 12문항에 모두 답한 뒤 아래의 ‘한 번에 저장’을 누르면 이 브라우저에 저장됩니다.</p>
      <div class="measureItems">${itemStatementInputs(ctx,prefix,'kcaas',KCAAS_SCALE,kItems)}</div>
      <div class="grid4" style="margin-top:12px">${scoreBox(`${prefix}KConcern`,'관심',k.concern)}${scoreBox(`${prefix}KControl`,'통제',k.control)}${scoreBox(`${prefix}KCuriosity`,'호기심',k.curiosity)}${scoreBox(`${prefix}KConfidence`,'자신감',k.confidence)}</div>
      <div class="status" id="${prefix}KTotal"></div></div>
    </details>

    ${includeStrengthDeficit?`<details class="summaryBox" style="margin-top:14px" data-scale-version="${SUDCO_SCALE.version}">
      <summary><b>강점활용·약점교정 행동 · 9문항</b> <span class="muted">(약 2–3분)</span></summary>
      <div style="margin-top:12px"><div class="callout info"><b>조영아(2019) 최종 한국판 · 5+4 총 9문항</b><br>한국 대학생 타당화 결과에 따라 원척도 6번 문항을 삭제한 최종 9문항을 사용합니다. 문항은 논문 &lt;표 8&gt;의 최종 척도와 동일합니다.</div>
      <p class="help scaleInstruction" data-scale="sudco">각 문항은 ${SUDCO_SCALE.response.min}(${SUDCO_SCALE.response.minLabel})–${SUDCO_SCALE.response.max}(${SUDCO_SCALE.response.maxLabel})로 응답하세요.</p>
      <div class="measureItems">${itemStatementInputs(ctx,prefix,'sudco',SUDCO_SCALE,uItems)}</div>
      <div class="grid2" style="margin-top:12px">${scoreBox(`${prefix}StrengthUse`,'강점활용',u.strengthUse)}${scoreBox(`${prefix}DeficitCorrection`,'약점교정',u.deficitCorrection)}</div></div>
    </details>`:''}

    <div class="actions"><button class="btn primary" id="${prefix}MeasureSave">${title} 한 번에 저장</button></div><div class="status" id="${prefix}MeasureStatus"></div>
  </div>`;
}

export function bindMeasurePanel(ctx,timepoint='pre'){
  if(!hasVerifiedBundle())return;
  const KCAAS_SCALE=measureBundle.kcaas,SUDCO_SCALE=measureBundle.sudco;
  const prefix=timepoint==='post'?'post':'pre';
  const saveBtn=document.getElementById(`${prefix}MeasureSave`);if(!saveBtn)return;
  const wInputs=[...document.querySelectorAll(`[data-measure="${prefix}-work24"]`)];
  const kInputs=[...document.querySelectorAll(`[data-measure="${prefix}-kcaas"]`)];
  const uInputs=[...document.querySelectorAll(`[data-measure="${prefix}-sudco"]`)];
  const update=()=>{
    const w=vals(wInputs),k=vals(kInputs),u=vals(uInputs),ks=kcaasScores(k),us=sudcoScores(u);
    set(`${prefix}KConcern`,ks.concern);set(`${prefix}KControl`,ks.control);set(`${prefix}KCuriosity`,ks.curiosity);set(`${prefix}KConfidence`,ks.confidence);
    const ktEl=document.getElementById(`${prefix}KTotal`);if(ktEl)ktEl.textContent=ks.total===null?'':'진로적응성 전체 평균 '+ks.total.toFixed(2);
    set(`${prefix}StrengthUse`,us.strengthUse);set(`${prefix}DeficitCorrection`,us.deficitCorrection);
    const ws=document.getElementById(`${prefix}Work24Status`);if(ws)ws.textContent=complete(w,9)?'9개 결과점수 입력 완료':`${w.filter(x=>x!==null).length}/9 입력`;
  };
  [...wInputs,...kInputs,...uInputs].forEach(el=>el.addEventListener('input',update));update();
  saveBtn.addEventListener('click',()=>{
    update();
    const w=vals(wInputs),k=vals(kInputs),u=vals(uInputs),state=ctx.getState();
    const prior=state.research?.measurements?.[timepoint]||{};
    const block={
      ...prior,
      capturedAt:new Date().toISOString(),
      work24JobReadiness:{instrument:'고용24 구직준비도검사',source:'Work24/Korea Employment Information Service',examDate:document.getElementById(`${prefix}Work24Date`)?.value||'',itemCount:9,scores:w,labels:WORK24_LABELS,scoreSchema:'official-result-fields-score1-score9',wordingStatus:'official-external-test-results-only'},
      kcaas:kcaasBlock(k),
      ...(uInputs.length?{sudco:strengthDeficitBlock(u,'post-course')}: {})
    };
    ctx.saveState({research:{...state.research,measurements:{...(state.research?.measurements||{}),[timepoint]:block}}});
    const missing=[];if(!complete(w,9))missing.push('고용24 9개 점수');if(!complete(k,KCAAS_SCALE.itemCount))missing.push('진로적응성 12문항');if(uInputs.length&&!complete(u,SUDCO_SCALE.itemCount))missing.push('강점활용·약점교정 9문항');
    document.getElementById(`${prefix}MeasureStatus`).textContent=missing.length?`저장했습니다. 미완료: ${missing.join(' · ')}`:`${uInputs.length?'세':'두'} 측정이 모두 저장되었습니다.`;
    ctx.toast(`${prefix.toUpperCase()} 측정 저장 완료`);
  });
}

export function renderStrengthMeasure(ctx,timepoint='pre'){
  if(!hasVerifiedBundle())return renderLoadError();
  const SUDCO_SCALE=measureBundle.sudco;
  const saved=ctx.getState().research?.measurements?.[timepoint]?.sudco||{};
  const items=lockedSavedItems(saved,SUDCO_SCALE);
  const prefix=timepoint==='post'?'post':'pre';
  return `<div class="hr"></div><div class="block strengthMeasurePanel" data-scale-version="${SUDCO_SCALE.version}">
    <div class="sectionHead"><div><div class="kicker">STRENGTH BEHAVIOUR CHECK</div><h3>경험에서 강점을 찾기 전, 현재 행동 확인</h3><p class="help">강점을 먼저 설명하기보다 실제 경험을 분석하는 수업에서 측정합니다. 최근 대학생활·학습·진로준비에서의 행동을 기준으로 응답하세요.</p></div><span class="badge">STEP 2 · 약 2–3분</span></div>
    <details class="summaryBox" open>
      <summary><b>강점활용·약점교정 행동 · 9문항</b></summary>
      <div style="margin-top:12px"><div class="callout info"><b>조영아(2019) 최종 한국판 · 5+4 총 9문항</b><br>한국 대학생 650명을 대상으로 번안·타당화한 연구의 최종 척도입니다. 원척도 6번 문항은 타당화 과정에서 삭제되었습니다.</div>
      <p class="help scaleInstruction" data-scale="sudco">각 문항은 ${SUDCO_SCALE.response.min}(${SUDCO_SCALE.response.minLabel})–${SUDCO_SCALE.response.max}(${SUDCO_SCALE.response.maxLabel})로 응답하세요.</p>
      <div class="measureItems">${itemStatementInputs(ctx,prefix,'sudco',SUDCO_SCALE,items)}</div>
      <div class="grid2" style="margin-top:12px">${scoreBox(`${prefix}StrengthUse`,'강점활용',saved.strengthUse)}${scoreBox(`${prefix}DeficitCorrection`,'약점교정',saved.deficitCorrection)}</div></div>
    </details>
    <div class="actions"><button class="btn primary" id="${prefix}StrengthMeasureSave">강점행동 측정 저장</button></div><div class="status" id="${prefix}StrengthMeasureStatus"></div>
  </div>`;
}

export function bindStrengthMeasure(ctx,timepoint='pre'){
  if(!hasVerifiedBundle())return;
  const SUDCO_SCALE=measureBundle.sudco;
  const prefix=timepoint==='post'?'post':'pre';
  const saveBtn=document.getElementById(`${prefix}StrengthMeasureSave`);if(!saveBtn)return;
  const inputs=[...document.querySelectorAll(`[data-measure="${prefix}-sudco"]`)];
  const update=()=>{const values=vals(inputs),scores=sudcoScores(values);set(`${prefix}StrengthUse`,scores.strengthUse);set(`${prefix}DeficitCorrection`,scores.deficitCorrection)};
  inputs.forEach(el=>el.addEventListener('input',update));update();
  saveBtn.addEventListener('click',()=>{
    update();
    const values=vals(inputs),state=ctx.getState(),measurements=state.research?.measurements||{},prior=measurements[timepoint]||{};
    const block={...prior,strengthMeasureCapturedAt:new Date().toISOString(),sudco:strengthDeficitBlock(values,'step2-before-experience-strength-analysis')};
    ctx.saveState({research:{...state.research,measurements:{...measurements,[timepoint]:block}}});
    document.getElementById(`${prefix}StrengthMeasureStatus`).textContent=complete(values,SUDCO_SCALE.itemCount)?'9문항이 저장되었습니다. 이제 경험에서 강점의 근거를 찾아보세요.':`저장했습니다. ${values.filter(x=>x!==null).length}/9 입력`;
    ctx.toast('강점활용·약점교정 측정 저장 완료');
  });
}

function renderLoadError(){return `<div class="hr"></div><div class="block"><div class="callout warn"><b>검사 문항을 불러오지 못했습니다.</b><br>인터넷 연결을 확인한 뒤 새로고침해 주세요. 계속 표시되면 교수자에게 알려주세요.</div></div>`}

async function fetchMeasureBundle(ctx){
  const config=window.JOBFIT_RESEARCH_CONFIG||{},base=String(config.supabaseUrl||'').replace(/\/$/,'');
  if(!base||!config.publishableKey)throw new Error('검사 서버 설정을 확인해 주세요.');
  const response=await fetch(`${base}/functions/v1/${MEASURE_FUNCTION_NAME}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':config.publishableKey},body:JSON.stringify({course:ctx.courseConfig?.course||''})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('검사 문항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  const bundle=body?.measures;if(!verifyBundle(bundle))throw new Error('검사 버전 검증에 실패했습니다. 교수자에게 알려 주세요.');return bundle;
}

function readMeasureSession(){try{const value=JSON.parse(sessionStorage.getItem(MEASURE_SESSION_KEY)||'null');return verifyBundle(value)?value:null}catch{return null}}
function hasVerifiedBundle(){return verifyBundle(measureBundle)}
function verifyBundle(bundle){return !!(bundle&&bundle.schemaVersion==='jobfit-research-measures-v1'&&bundle.kcaas?.version==='K-CAAS-SF-KR-2020-v1'&&bundle.kcaas?.itemCount===12&&Array.isArray(bundle.kcaas?.items)&&bundle.kcaas.items.length===12&&bundle.sudco?.version==='SUDCO-CHO-KR-2019-9-v1'&&bundle.sudco?.itemCount===9&&Array.isArray(bundle.sudco?.items)&&bundle.sudco.items.length===9&&JSON.stringify(bundle.sudco.itemNumbers)===JSON.stringify([1,2,3,4,5,7,8,9,10]))}
function kcaasScores(items){return {concern:avg(items.slice(0,3)),control:avg(items.slice(3,6)),curiosity:avg(items.slice(6,9)),confidence:avg(items.slice(9,12)),total:avg(items)}}
function sudcoScores(items){return {strengthUse:avg(items.slice(0,5)),deficitCorrection:avg(items.slice(5,9))}}
function kcaasBlock(items){const scale=measureBundle.kcaas,s=kcaasScores(items);return {instrument:scale.instrument,itemCount:scale.itemCount,responseRange:`${scale.response.min}-${scale.response.max}`,responseAnchors:{min:scale.response.minLabel,max:scale.response.maxLabel},itemNumbers:[...scale.itemNumbers],items,...s,scoring:'mean; concern=items1-3, control=items4-6, curiosity=items7-9, confidence=items10-12, total=items1-12',wordingVersion:scale.version,wordingStatus:'official-appendix-12-items-verified',locked:true,source:scale.source}}
function strengthDeficitBlock(items,captureContext){const scale=measureBundle.sudco,s=sudcoScores(items);return {instrument:scale.instrument,itemCount:scale.itemCount,responseRange:`${scale.response.min}-${scale.response.max}`,responseAnchors:{min:scale.response.minLabel,max:scale.response.maxLabel},itemNumbers:[...scale.itemNumbers],items,...s,scoring:'mean; strengthUse=stored items1-5 (original items 1-5), deficitCorrection=stored items6-9 (original items 7-10)',wordingVersion:scale.version,wordingStatus:'official-cho-2019-final-9-items',locked:true,source:scale.source,captureContext}}
function lockedSavedItems(saved,scale){return saved?.wordingVersion===scale.version&&Array.isArray(saved?.items)&&saved.items.length===scale.itemCount?saved.items:[]}
function itemStatementInputs(ctx,prefix,key,scale,items=[]){return scale.items.map((text,i)=>{const n=scale.itemNumbers[i];return `<div class="measureItem" data-original-item-number="${n}"><div class="measureStatement"><b>${n}</b><span>${ctx.escapeHtml(text)}</span></div><div class="field"><label class="srOnly">문항 ${n}</label><input class="input scoreInput" type="number" inputmode="numeric" min="${scale.response.min}" max="${scale.response.max}" step="1" data-measure="${prefix}-${key}" data-scale-version="${scale.version}" data-original-item-number="${n}" value="${ctx.escapeHtml(items?.[i]??'')}" placeholder="${scale.response.min}–${scale.response.max}"></div></div>`}).join('')}
function scoreBox(id,label,value){return `<div class="field"><label>${label} 평균</label><input class="input scoreInput" id="${id}" value="${value??''}" readonly></div>`}
function vals(nodes){return nodes.map(x=>{const v=x.value;if(v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null})}
function avg(arr){const v=arr.filter(x=>x!==null&&Number.isFinite(x));return v.length===arr.length&&v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function set(id,n){const el=document.getElementById(id);if(el)el.value=n===null?'':n.toFixed(2)}
function complete(arr,n){return Array.isArray(arr)&&arr.length===n&&arr.every(x=>x!==null&&x!==''&&Number.isFinite(Number(x)))}

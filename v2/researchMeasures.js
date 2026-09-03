const WORK24_URL='https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do';
const WORK24_LABELS=['경제적 취약성 적응도','가족의 지지','사회적 지지','자아 존중감','자기 효능감','구직기술','의사전달','대인관계 활용','구직정보 수집'];
const MEASURE_SESSION_KEY='jobfit:research-measures:authorized:v1';
const MEASURE_FUNCTION_NAME='research-measures';
let measureBundle=readMeasureSession();

export function renderMeasurePanel(ctx,timepoint='pre'){
  if(!hasVerifiedBundle())return renderAccessGate(ctx,`measure-${timepoint}`);
  const KCAAS_SCALE=measureBundle.kcaas,SUDCO_SCALE=measureBundle.sudco;
  const saved=ctx.getState().research?.measurements?.[timepoint]||{};
  const w=saved.work24JobReadiness||{},k=saved.kcaas||{},u=saved.sudco||{};
  const kItems=lockedSavedItems(k,KCAAS_SCALE),uItems=lockedSavedItems(u,SUDCO_SCALE);
  const prefix=timepoint==='post'?'post':'pre';
  const includeStrengthDeficit=timepoint==='post';
  const title=timepoint==='post'?'POST · 학기 말 측정':'PRE · 시작점 측정';
  const timing=timepoint==='post'?'수업을 모두 마친 뒤':'수업 시작 전';
  return `<div class="hr"></div><div class="block researchMeasurePanel" data-timepoint="${prefix}">
    <div class="sectionHead"><div><h3>${title}</h3><p class="help">${timing} 같은 익명코드로 측정합니다. ${includeStrengthDeficit?'세 측정':'두 측정'}은 서로 다른 변화를 보기 위한 자료입니다.</p></div><span class="badge">PRE / POST</span></div>
    <div class="callout info"><b>권장 순서</b><br>${includeStrengthDeficit?'① 고용24 구직준비도검사 → ② 진로적응성 12문항 → ③ 강점활용·약점교정 9문항 → ④ 한 번에 저장':'① 고용24 구직준비도검사 → ② 진로적응성 12문항 → ③ 한 번에 저장'}</div>

    <div class="summaryBox">
      <div class="sectionHead"><div><div class="kicker">PRIMARY OUTCOME · WORK24</div><h3>고용24 구직준비도검사</h3><p class="help">고용24에서 직접 검사한 뒤 결과표의 9개 점수를 그대로 입력합니다. Jobfit이 문항을 복제하지 않습니다.</p></div><span class="badge">약 20분</span></div>
      <div class="actions"><a class="btn secondary" href="${WORK24_URL}" target="_blank" rel="noopener">고용24 검사 페이지 열기 ↗</a><a class="btn outline" href="https://www.work24.go.kr/wk/r/c/1000/jobPsyExamRsltList.do" target="_blank" rel="noopener">검사 결과 확인 ↗</a></div>
      <div class="callout warn"><b>고용24에서 ‘구직준비도검사’를 선택하세요.</b><br>S형/L형이나 대학생 진로준비도검사와 다른 검사입니다. PRE와 POST에서 반드시 같은 검사명을 사용합니다.</div>
      <div class="grid3" style="margin-top:12px"><div class="field"><label>검사일</label><input class="input" id="${prefix}Work24Date" type="date" value="${ctx.escapeHtml(w.examDate||'')}"></div>${WORK24_LABELS.map((label,i)=>`<div class="field"><label>${i+1}. ${label}</label><input class="input scoreInput" type="number" step="0.01" data-measure="${prefix}-work24" data-key="w${i+1}" value="${ctx.escapeHtml(w.scores?.[i]??'')}" placeholder="결과표 점수"></div>`).join('')}</div>
      <div class="status" id="${prefix}Work24Status">${complete(w.scores,9)?'9개 결과점수 입력 완료':''}</div>
    </div>

    <details class="summaryBox" style="margin-top:14px" ${timepoint==='pre'?'open':''} data-scale-version="${KCAAS_SCALE.version}">
      <summary><b>K-CAAS-SF · 진로적응성 12문항</b> <span class="muted">(약 3–4분)</span></summary>
      <div style="margin-top:12px"><div class="callout info"><b>한국판 원문 확인 · PRE/POST 동일</b><br>김민선·고은영(2020) 논문 부록의 K-CAAS-SF 12문항과 동일한 문항·순서·응답척도를 사용합니다. 이전 다른 버전의 응답값은 자동 이관하지 않습니다.</div>
      <p class="help scaleInstruction" data-scale="kcaas">각 문항은 ${KCAAS_SCALE.response.min}(${KCAAS_SCALE.response.minLabel})–${KCAAS_SCALE.response.max}(${KCAAS_SCALE.response.maxLabel})로 응답하세요.</p>
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
  if(!hasVerifiedBundle()){bindAccessGate(ctx,`measure-${timepoint}`);return}
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
  if(!hasVerifiedBundle())return renderAccessGate(ctx,`strength-${timepoint}`);
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
  if(!hasVerifiedBundle()){bindAccessGate(ctx,`strength-${timepoint}`);return}
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

function renderAccessGate(ctx,gateId){
  const course=String(ctx.courseConfig?.course||'').toUpperCase();
  const allowed=['INJE2026','INJE-2026-2'].includes(course);
  return `<div class="hr"></div><div class="block researchAccessGate" data-gate-id="${ctx.escapeHtml(gateId)}">
    <div class="sectionHead"><div><div class="kicker">CLASS PARTICIPANT ONLY</div><h3>수업 참여자 전용 검사</h3><p class="help">척도 문항은 연구대상 수업 참여자에게만 제공됩니다. 교수자가 수업에서 안내한 접근코드를 입력하면 현재 브라우저 세션 동안 검사가 열립니다.</p></div><span class="badge">접근 제한</span></div>
    ${allowed?`<div class="grid2"><div class="field"><label>수업 접근코드</label><input class="input researchAccessCode" type="password" autocomplete="off" placeholder="접근코드 입력"></div><div class="field"><label>&nbsp;</label><button class="btn primary researchAccessBtn">검사 열기</button></div></div><div class="status researchAccessStatus"></div>`:'<div class="callout warn"><b>이 검사는 지정된 수업 링크에서만 이용할 수 있습니다.</b></div>'}
  </div>`;
}

function bindAccessGate(ctx,gateId){
  const gate=document.querySelector(`.researchAccessGate[data-gate-id="${gateId}"]`);if(!gate)return;
  const input=gate.querySelector('.researchAccessCode'),button=gate.querySelector('.researchAccessBtn'),status=gate.querySelector('.researchAccessStatus');if(!input||!button)return;
  const submit=async()=>{
    const code=input.value;status.textContent='접근코드를 확인하고 있습니다.';button.disabled=true;
    try{
      const bundle=await fetchMeasureBundle(ctx,code);
      measureBundle=bundle;sessionStorage.setItem(MEASURE_SESSION_KEY,JSON.stringify(bundle));input.value='';ctx.toast('수업 참여자 검사가 열렸습니다.');
      await ctx.navigate(ctx.getState().activeStep,{skipSave:true});
    }catch(err){status.textContent=err.message||'접근코드를 확인할 수 없습니다.';input.select();ctx.toast('접근코드를 확인해 주세요.');}
    finally{button.disabled=false}
  };
  button.addEventListener('click',submit);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}});
}

async function fetchMeasureBundle(ctx,accessCode){
  const config=window.JOBFIT_RESEARCH_CONFIG||{},base=String(config.supabaseUrl||'').replace(/\/$/,'');
  if(!base||!config.publishableKey)throw new Error('검사 서버 설정을 확인해 주세요.');
  const response=await fetch(`${base}/functions/v1/${MEASURE_FUNCTION_NAME}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':config.publishableKey},body:JSON.stringify({course:ctx.courseConfig?.course||'',access_code:accessCode})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===403)throw new Error('접근코드가 올바르지 않습니다.');throw new Error('검사 문항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');}
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

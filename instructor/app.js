import {WORK24_LABELS,normalizeResearchRecord,mergeResearchRecords,researchRows,toCsv} from './researchData.js';
import {captureAuthCallback,getSession,instructorBackendStatus,loadCentralResearch,requestMagicLink,signOutInstructor} from './centralBackend.js';

let records=[];
const el=id=>document.getElementById(id),fmt=v=>v===null||v===undefined||v===''?'—':String(v),mean=values=>{const nums=values.map(Number).filter(Number.isFinite);return nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1):'—'};

el('fileInput').addEventListener('change',async e=>{
  const accepted=[],errors=[];
  for(const file of e.target.files){try{accepted.push(normalizeResearchRecord(JSON.parse(await file.text())))}catch(err){errors.push(`${file.name}: ${err.message}`)}}
  records=mergeResearchRecords([...records,...accepted]);e.target.value='';render();
  el('message').textContent=`${accepted.length}개 파일을 불러왔습니다.${errors.length?` 제외 ${errors.length}개 · ${errors.join(' / ')}`:''}`;
});
el('pickFiles').addEventListener('click',()=>el('fileInput').click());
el('clearBtn').addEventListener('click',()=>{records=[];render();el('message').textContent='화면에서 모두 지웠습니다. 서버나 브라우저 저장소에는 남지 않습니다.'});
el('csvBtn').addEventListener('click',()=>download(new Blob([toCsv(records)],{type:'text/csv;charset=utf-8'}),`jobfit-research-${date()}.csv`));
el('jsonBtn').addEventListener('click',()=>download(new Blob([JSON.stringify({schema_version:'jobfit-research-cohort-v1',exported_at:new Date().toISOString(),record_count:records.length,records},null,2)],{type:'application/json'}),`jobfit-research-cohort-${date()}.json`));
el('closeDetail').addEventListener('click',()=>el('detail').close());
el('magicLinkBtn').addEventListener('click',async()=>{try{await requestMagicLink(el('instructorEmail').value);setCentralStatus('로그인 링크를 보냈습니다. 메일에서 링크를 눌러 이 화면으로 돌아오세요.','good')}catch(err){setCentralStatus(err.message,'error')}});
el('centralLoadBtn').addEventListener('click',async()=>{try{setCentralStatus('중앙 연구데이터를 불러오는 중입니다.');const loaded=(await loadCentralResearch(el('cohortSelect').value)).map(normalizeResearchRecord);records=mergeResearchRecords(loaded);render();el('message').textContent=`중앙 DB에서 ${records.length}명의 최신 연구자료를 불러왔습니다.`;setCentralStatus('교수자 인증 완료 · 중앙 DB 연결됨','good')}catch(err){setCentralStatus(err.message,'error')}});
el('signOutBtn').addEventListener('click',async()=>{await signOutInstructor();updateCentralPanel()});

function render(){
  const rows=researchRows(records),preWork=records.map(r=>average(r.pre_measurements?.work24_job_readiness?.scores)),preCaas=records.map(r=>r.pre_measurements?.kcaas?.total);
  el('count').textContent=records.length;el('preCount').textContent=records.filter(r=>r.pre_measurements?.work24_job_readiness||r.pre_measurements?.kcaas).length;el('postCount').textContent=records.filter(r=>r.post_measurements?.work24_job_readiness||r.post_measurements?.kcaas).length;el('progressMean').textContent=`${mean(records.map(r=>r.progress?.completion_percent))}%`;el('work24Mean').textContent=mean(preWork);el('caasMean').textContent=mean(preCaas);
  el('csvBtn').disabled=!records.length;el('jsonBtn').disabled=!records.length;el('clearBtn').disabled=!records.length;
  el('empty').hidden=records.length>0;el('tableWrap').hidden=!records.length;
  el('tbody').innerHTML=rows.map((r,i)=>`<tr data-index="${i}"><td><button class="codeLink" data-index="${i}">${safe(r.익명코드)}</button></td><td>${safe(r.학년)}</td><td>${safe(r.전공계열)}</td><td>${safe(average(records[i].pre_measurements?.work24_job_readiness?.scores))}</td><td>${safe(r.PRE_진로적응성_전체)}</td><td>${safe(r.PRE_강점활용)}</td><td>${safe(r.PRE_약점교정)}</td><td>${safe(r.진행률)}%</td><td>STEP ${safe(r.현재STEP)}</td></tr>`).join('');
  document.querySelectorAll('.codeLink').forEach(b=>b.addEventListener('click',()=>showDetail(records[Number(b.dataset.index)])));
}
function showDetail(r){
  el('detailTitle').textContent=`${r.participant_code} · 검사결과`;
  const blocks=[['PRE',r.pre_measurements],['POST',r.post_measurements]];
  el('detailBody').innerHTML=blocks.map(([label,m])=>`<section><h3>${label}</h3><div class="detailGrid">${WORK24_LABELS.map((x,i)=>metric(`고용24 · ${x}`,m?.work24_job_readiness?.scores?.[i])).join('')}${metric('진로적응성 · 관심',m?.kcaas?.concern)}${metric('진로적응성 · 통제',m?.kcaas?.control)}${metric('진로적응성 · 호기심',m?.kcaas?.curiosity)}${metric('진로적응성 · 자신감',m?.kcaas?.confidence)}${metric('진로적응성 · 전체',m?.kcaas?.total)}${metric('강점활용',m?.strength_deficit?.strength_use)}${metric('약점교정',m?.strength_deficit?.deficit_correction)}</div></section>`).join('');
  el('detail').showModal();
}
function metric(label,value){return `<div class="metric"><span>${safe(label)}</span><b>${safe(value)}</b></div>`}
function average(values){const nums=(values||[]).map(Number).filter(Number.isFinite);return nums.length===9?nums.reduce((a,b)=>a+b,0)/nums.length:null}
function safe(v){return escapeHtml(fmt(v))}function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function download(blob,name){if(!records.length)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}function date(){return new Date().toISOString().slice(0,10)}
function setCentralStatus(message,type=''){el('centralStatus').textContent=message;el('centralStatus').className=type}
function updateCentralPanel(){const status=instructorBackendStatus(),session=getSession(),enabled=status.enabled;el('instructorEmail').disabled=!enabled||!!session;el('magicLinkBtn').disabled=!enabled||!!session;el('centralLoadBtn').disabled=!enabled||!session;el('signOutBtn').disabled=!session;if(!enabled)setCentralStatus('운영 DB는 준비되었습니다. 교수자 계정과 연구동의 승인 후 중앙 로그인을 활성화합니다. 파일 취합 모드는 지금 사용할 수 있습니다.');else if(session)setCentralStatus('교수자 로그인 완료 · 중앙 DB에서 자료를 불러올 수 있습니다.','good');else setCentralStatus('등록된 교수자 이메일로 로그인 링크를 받아 접속하세요.')}
captureAuthCallback();updateCentralPanel();render();

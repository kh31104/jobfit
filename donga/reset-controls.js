/* JOBFIT DONG-A - independent same-browser resets, not shared with INJE/FLEX */
(function(){
"use strict";
const step=document.currentScript?.dataset?.dongaStep;
const keys={step1:"jobfit:donga:step1:v1",step2:"jobfit:donga:step2:v1",step3:"jobfit:donga:step3:v1"};
const ids={step1:"JOBFIT_DONGA",step2:"JOBFIT_DONGA_STEP2",step3:"JOBFIT_DONGA_STEP3"};
const names={step1:"CAREER DNA",step2:"JOB ANALYSIS",step3:"CAREER DESIGN"};
const all=Object.keys(keys);
if(!keys[step])return;
function status(t){const e=document.getElementById("dongaResetStatus");if(e)e.textContent=t;}
function download(file,text){
 const blob=new Blob([text],{type:"application/json;charset=utf-8"}),u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);
}
function backupCurrent(){
 const existing={step1:"backup",step2:"exportJsonBtn",step3:"export"}[step];
 const button=document.getElementById(existing);
 if(button){button.click();return;}
 const raw=localStorage.getItem(keys[step]);if(raw===null){status("저장된 데이터가 없습니다.");return;}
 download("JOBFIT_DONGA_"+step+"_backup.json",raw);
}
function backupAll(){
 try{
 const entries={};let count=0;
 for(const s of all){entries[s]=localStorage.getItem(keys[s]);if(entries[s]!==null)count++;}
 if(!count){status("저장된 데이터가 없습니다.");return;}
 const b={type:"JOBFIT_DONGA_ALL_BACKUP",version:1,createdAt:new Date().toISOString(),steps:entries};
 download("JOBFIT_DONGA_ALL_STEPS_"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(b,null,2));
 status("통합 백업 다운로드를 요청했습니다. 다운로드 폴더에서 파일을 확인하세요.");
 }catch(e){status("백업에 실패했습니다. 브라우저 저장 권한을 확인해 주세요.");}
}
function restoreAll(file){
 if(!file)return;if(file.size>10*1024*1024){status("10MB 이하 JSON 백업을 선택해 주세요.");return;}
 const reader=new FileReader();
 reader.onload=()=>{
 try{
 const b=JSON.parse(reader.result);
 if(b?.type!=="JOBFIT_DONGA_ALL_BACKUP"||b.version!==1||!b.steps||!all.every(s=>Object.hasOwn(b.steps,s)))throw Error("type");
 for(const s of all){const v=b.steps[s];if(v===null)continue;if(typeof v!=="string"||JSON.parse(v)?.app!==ids[s])throw Error("app");}
 if(!confirm("STEP 1~3 저장값을 이 백업 내용으로 교체할까요?\n잡핏인제·잡핏플렉스는 변경하지 않습니다."))return;
 const old={};for(const s of all)old[s]=localStorage.getItem(keys[s]);
 try{for(const s of all){if(b.steps[s]===null)localStorage.removeItem(keys[s]);else localStorage.setItem(keys[s],b.steps[s]);}}
 catch(e){for(const s of all){try{if(old[s]===null)localStorage.removeItem(keys[s]);else localStorage.setItem(keys[s],old[s]);}catch{}}throw e;}
 location.reload();
 }catch(e){status("통합 백업 파일이 올바르지 않거나 복원에 실패했습니다. 현재 저장값을 확인해 주세요.");}
 };
 reader.onerror=()=>status("백업 파일을 읽을 수 없습니다.");
 reader.readAsText(file,"utf-8");
}
function reset(entire){
 const label=entire?"STEP 1~3 전체":"현재 STEP "+step.slice(-1);
 const note=entire?"새 학생을 위해 STEP 1·2·3 전체를 초기화합니다.":"현재 STEP만 초기화합니다. 다른 STEP의 이전 학생 답변은 남아 있습니다.";
 if(!confirm(note+"\n\n"+label+"의 저장값을 삭제할까요?\n먼저 백업 파일을 저장했는지 확인해 주세요."))return;
 if(!confirm("마지막 확인: "+label+"의 입력값을 삭제합니다.\n삭제 후 백업이 없으면 복구할 수 없습니다. 계속할까요?"))return;
 try{
 for(const s of entire?all:[step])localStorage.removeItem(keys[s]);
 if(entire&&step!=="step1")location.assign(new URL("../",location.href).href);
 else location.reload();
 }catch(e){status("초기화에 실패했습니다. 브라우저 저장 권한을 확인하세요.");}
}
function mount(){
 const panel=document.createElement("details");
 panel.className="donga-reset-panel";
 panel.innerHTML='<summary>↻ 초기화 · 새 응답 시작 <span>같은 브라우저에서 다시 작성</span></summary>'+
 '<div class="donga-reset-body"><p><b>현재 STEP '+step.slice(-1)+' · '+names[step]+'</b><br>현재 STEP만 지우거나, 새 학생을 위해 1~3 전체 응답을 초기화할 수 있습니다.</p>'+
 '<div class="donga-reset-actions">'+
 '<button type="button" data-reset-action="backup-one">현재 STEP 백업</button>'+
 '<button type="button" data-reset-action="backup-all">1~3 전체 백업</button>'+
 '<button type="button" class="donga-reset-warning" data-reset-action="reset-one">현재 STEP만 초기화</button>'+
 '<button type="button" class="donga-reset-danger" data-reset-action="reset-all">새 학생 시작 · 1~3 전체 초기화</button>'+
 '<button type="button" class="donga-reset-restore-btn" data-reset-action="restore-all">통합 백업 불러오기</button></div>'+
 '<p class="donga-reset-explain">초기화는 이 브라우저의 잡핏동아 저장값만 삭제합니다. AI 채팅 기록이나 다운로드 파일은 삭제하지 않습니다. 다른 학생이 같은 기기를 쓰기 전에는 전체 초기화를 권장합니다.</p>'+
 '<p id="dongaResetStatus" role="status" aria-live="polite"></p></div>';
 let container,anchor;
 if(step==="step1"){container=document.querySelector(".donga-main");anchor=container?.firstChild;}
 else {container=document.querySelector(step==="step2"?".wrap":"main");anchor=container?.querySelector(".hero");}
 if(!container)return;
 container.insertBefore(panel,anchor||null);
 panel.addEventListener("click",e=>{
 const btn=e.target.closest("button[data-reset-action]");if(!btn)return;
 const a=btn.dataset.resetAction;
 if(a==="backup-one")backupCurrent();if(a==="backup-all")backupAll();
 if(a==="reset-one")reset(false);if(a==="reset-all")reset(true);
 if(a==="restore-all"){
   const input=document.createElement("input");
   input.type="file";input.accept=".json,application/json";input.style.display="none";
   document.body.appendChild(input);
   input.addEventListener("change",e=>{
     const f=e.target.files?.[0];if(f)restoreAll(f);input.remove();
   });
   input.click();
 }
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
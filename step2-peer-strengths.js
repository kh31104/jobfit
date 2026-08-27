(function(){
 const CUSTOM_KEY='careerNavigationCustomPeerStrengthsV1';

 function cleanCustom(values){
  return [...new Set((Array.isArray(values)?values:[]).map(x=>String(x||'').trim()).filter(Boolean).map(x=>x.slice(0,20)))].slice(0,3);
 }
 function readCustom(){try{return cleanCustom(JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]'))}catch(e){return[]}}
 function writeCustom(values){localStorage.setItem(CUSTOM_KEY,JSON.stringify(cleanCustom(values)))}

 function install(){
  if(typeof window.renderExperienceStrengths!=='function'||typeof window.renderExperiences!=='function'||typeof window.save!=='function'){
   setTimeout(install,60);return;
  }

  let custom=readCustom();
  custom=custom.filter(x=>!STRENGTH_WORDS.includes(x));
  writeCustom(custom);
  experiencePeerStrengths=[...new Set([...experiencePeerStrengths,...custom])].slice(0,3);
  peerStrengthFeedback.strengths=[...experiencePeerStrengths];
  recalculateExperienceCommonStrengths();

  try{
   STAGE_NAMES[1]='경험과 타인 피드백';
   const section=document.querySelector('section.step[data-step="2"]');
   if(section){
    const h2=section.querySelector('h2');if(h2)h2.textContent='경험에서 나의 강점 찾기';
    const ps=section.querySelectorAll(':scope > p');
    if(ps[0])ps[0].innerHTML='내 경험 3가지를 간단히 적어보세요. 그중 <b>이야기하고 싶은 경험 하나를 자유롭게</b> 짝에게 들려주면 됩니다.';
    if(ps[1])ps[1].textContent='앱에서 대표 경험을 따로 고를 필요는 없습니다. 각 항목은 핵심만 1~2문장으로 작성하세요.';
   }
  }catch(e){}

  window.renderRepresentativeExperience=function(){
   const box=el('representativeExperienceChoice');if(box)box.innerHTML='';
  };
  window.selectRepresentativeExperience=function(){};

  function persist(){
   const customNow=experiencePeerStrengths.filter(x=>!STRENGTH_WORDS.includes(x));
   writeCustom(customNow);
   peerStrengthFeedback.strengths=[...experiencePeerStrengths];
   recalculateExperienceCommonStrengths();
   save();
  }

  window.toggleExperienceStrength=function(kind,value){
   if(kind!=='peer')return;
   value=String(value||'').trim();if(!value)return;
   if(experiencePeerStrengths.includes(value))experiencePeerStrengths=experiencePeerStrengths.filter(x=>x!==value);
   else{
    if(experiencePeerStrengths.length>=3){alert('짝이 발견한 나의 강점은 최대 3개까지 입력할 수 있습니다.');return}
    experiencePeerStrengths=[...experiencePeerStrengths,value];
   }
   persist();renderExperienceStrengths();
  };

  window.addCustomPeerStrength=function(){
   const input=el('customPeerStrengthInput'),value=String(input?.value||'').trim();
   if(!value){if(input)input.focus();return}
   if(value.length>20){alert('강점은 20자 이내로 입력해 주세요.');return}
   if(experiencePeerStrengths.includes(value)){alert('이미 입력한 강점입니다.');return}
   if(experiencePeerStrengths.length>=3){alert('짝이 발견한 나의 강점은 최대 3개까지 입력할 수 있습니다.');return}
   experiencePeerStrengths.push(value);persist();renderExperienceStrengths();
  };

  window.removePeerStrength=function(encoded){
   let value='';try{value=decodeURIComponent(encoded)}catch(e){return}
   experiencePeerStrengths=experiencePeerStrengths.filter(x=>x!==value);persist();renderExperienceStrengths();
  };

  window.experienceStrengthPickerGrid=function(kind,selected){
   const query=experienceStrengthSearch.trim().toLocaleLowerCase('ko');
   const words=STRENGTH_WORDS.filter(x=>!query||x.toLocaleLowerCase('ko').includes(query));
   return `<div class="strengthGrid">${words.length?words.map(x=>`<button class="strengthPick ${selected.includes(x)?'selected':''}" onclick="toggleExperienceStrength('peer','${esc(x)}')">${esc(x)}</button>`).join(''):'<div class="strengthSearchEmpty">목록에서 찾지 못했습니다. 아래 직접 입력을 이용해 주세요.</div>'}</div>`;
  };

  window.experienceStrengthPicker=function(kind,selected){
   return `<div class="strengthSearch"><label for="experienceStrengthSearch"><b>강점 목록에서 찾기</b></label><input id="experienceStrengthSearch" type="search" value="${esc(experienceStrengthSearch)}" placeholder="예: 책임감, 설명력, 끈기" oninput="updateExperienceStrengthSearch(this.value)"></div><div id="experienceStrengthPickerGrid">${experienceStrengthPickerGrid('peer',selected)}</div><div class="entryAdd" style="margin-top:12px"><input id="customPeerStrengthInput" type="text" maxlength="20" placeholder="목록에 없으면 직접 입력 (예: 침착함)" onkeydown="if(event.key==='Enter'){event.preventDefault();addCustomPeerStrength()}"><button class="btn btnOutline" onclick="addCustomPeerStrength()">+ 직접 입력</button></div>`;
  };

  window.updateExperienceStrengthSearch=function(value){
   experienceStrengthSearch=String(value||'');const box=el('experienceStrengthPickerGrid');if(box)box.innerHTML=experienceStrengthPickerGrid('peer',experiencePeerStrengths);
  };

  window.renderExperienceStrengths=function(){
   const box=el('experienceStrengthAreas');if(!box)return;
   const selected=experiencePeerStrengths.map(x=>`<button class="pill mi" title="눌러서 삭제" onclick="removePeerStrength('${encodeURIComponent(x)}')">${esc(x)} ×</button>`).join('')||'<span class="muted">아직 입력하지 않았습니다.</span>';
   box.innerHTML=`<section class="experienceStrengthCard" style="margin-top:18px"><div class="experienceStrengthBody"><h3 style="margin-top:0">짝이 발견한 나의 강점</h3><div class="callout"><b>무엇을 입력하나요?</b><br>짝이 <b>내 경험을 듣고</b> “너에게 이런 강점이 보여”라고 말해준 <b>나의 강점</b>을 아래에 입력합니다.<br><span class="small">타인의 강점을 평가하는 칸이 아닙니다.</span></div><div class="activityFlow">① 내 경험 하나 이야기 → ② 짝이 내 행동에서 강점 찾기 → ③ 짝이 말해준 강점을 내가 입력 → ④ 역할 교대</div><p><b>최대 3개</b>까지 선택하거나 직접 입력할 수 있습니다. 선택한 강점을 누르면 삭제됩니다.</p><div class="pillbox">${selected}</div>${experienceStrengthPicker('peer',experiencePeerStrengths)}<div class="peerReason"><label for="peerStrengthReason">짝이 그렇게 느낀 이유 <span class="small muted">· 선택사항</span></label><input id="peerStrengthReason" type="text" maxlength="120" value="${esc(peerStrengthFeedback.reason)}" placeholder="예: 문제가 생겼을 때 끝까지 방법을 찾아 해결했기 때문" oninput="updatePeerReason(this.value)"></div></div></section>`;
   renderExperienceStrengthResult();
  };

  window.renderExperienceStrengthResult=function(){const box=el('experienceStrengthResult');if(box)box.innerHTML=''};

  renderRepresentativeExperience();
  renderExperienceStrengths();
  if(typeof renderProgress==='function')renderProgress();
 }

 if(document.readyState==='complete')install();
 else window.addEventListener('load',install,{once:true});
})();

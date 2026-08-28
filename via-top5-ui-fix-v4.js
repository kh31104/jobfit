(function(){
 const VIA_EXTRA_KEY='careerNavigationViaTop5ExtraV4';
 let installing=false;
 function escV(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function readExtra(){try{const x=JSON.parse(localStorage.getItem(VIA_EXTRA_KEY)||'{}');return{x4:String(x.x4||''),x5:String(x.x5||'')}}catch(e){return{x4:'',x5:''}}}
 function writeExtra(n,v){const x=readExtra();x['x'+n]=String(v||'');localStorage.setItem(VIA_EXTRA_KEY,JSON.stringify(x))}
 function currentViaValues(){const extra=readExtra();return [1,2,3,4,5].map(n=>n<=3?(document.getElementById('via'+n)?.value||''):(document.getElementById('via'+n)?.value||extra['x'+n]||''))}
 function optionHtml(selected){if(typeof VIA==='undefined')return '<option value="">선택하세요</option>';return '<option value="">선택하세요</option>'+VIA.map(x=>`<option value="${escV(x.key)}" ${selected===x.key?'selected':''}>${escV(x.key)} · ${escV(x.en)}</option>`).join('')}
 function previewHtml(value){if(!value||typeof VIA==='undefined')return '결과를 선택하면 특징이 표시됩니다.';const d=VIA.find(x=>x.key===value);if(!d)return '결과를 선택하면 특징이 표시됩니다.';const skills=(d.competencies||[]).slice(0,3).map(x=>`<span class="pill skill">${escV(x)}</span>`).join('');return `<b>${escV(d.key)}</b> · ${escV(d.desc)}<div class="pillbox">${skills}</div>`}
 function makeRow(n,value){const row=document.createElement('div');row.className='rankRow viaTop5ExtraRowV4';row.dataset.viaRank=String(n);row.innerHTML=`<div class="rankHead"><div class="rankN">${n}</div><b>VIA 강점 ${n}위</b></div><select id="via${n}">${optionHtml(value)}</select><div class="rankPreview" id="viaPreview${n}">${previewHtml(value)}</div>`;const sel=row.querySelector('select');sel.addEventListener('change',()=>{const v=sel.value,vals=currentViaValues();if(v&&vals.filter(x=>x===v).length>1){alert('같은 결과를 중복 선택할 수 없습니다.');sel.value='';writeExtra(n,'');row.querySelector('.rankPreview').innerHTML=previewHtml('');return}writeExtra(n,v);row.querySelector('.rankPreview').innerHTML=previewHtml(v);try{if(typeof save==='function')save()}catch(e){}});return row}
 function ensureTop5Rows(){
  if(installing)return;const box=document.getElementById('viaRankRows');if(!box||box.offsetParent===null)return;
  installing=true;
  try{
   const extra=readExtra();
   [4,5].forEach(n=>{let row=document.getElementById('via'+n)?.closest('.rankRow');if(!row){row=makeRow(n,extra['x'+n]||'');box.appendChild(row)}else{const sel=document.getElementById('via'+n);if(sel&&!sel.value&&extra['x'+n])sel.value=extra['x'+n]}});
   const heading=box.closest('.step')?.querySelector('h2');if(heading)heading.textContent='3. VIA 강점검사 상위 5개 입력';
   const callout=box.closest('.step')?.querySelector('.callout');if(callout)callout.innerHTML='아래 1위·2위·3위·4위·5위 드롭다운에서 각각 하나씩 선택하세요. <b>다섯 칸을 모두 입력해야 다음 단계로 넘어갑니다.</b>';
  }finally{installing=false}
 }
 function overrideReadAndValidate(){
  const oldRead=window.readRanks;
  if(typeof oldRead==='function'&&!oldRead.__viaTop5DomFix){const fn=function(prefix){if(prefix!=='via')return oldRead(prefix);const extra=readExtra();return [1,2,3,4,5].map(n=>document.getElementById('via'+n)?.value||(n>3?extra['x'+n]:'')||'').filter(Boolean)};fn.__viaTop5DomFix=true;window.readRanks=fn}
  const oldValidate=window.validateRanks;
  if(typeof oldValidate==='function'&&!oldValidate.__viaTop5DomFix){const fn=function(prefix,label){if(prefix!=='via')return oldValidate(prefix,label);const a=window.readRanks('via');if(a.length<5){alert('VIA 상위 5개를 모두 선택해 주세요.');return false}if(new Set(a).size<5){alert('VIA 결과가 중복되어 있습니다.');return false}return true};fn.__viaTop5DomFix=true;window.validateRanks=fn}
 }
 function install(){overrideReadAndValidate();ensureTop5Rows();const observer=new MutationObserver(()=>{overrideReadAndValidate();ensureTop5Rows()});observer.observe(document.body,{childList:true,subtree:true});setInterval(()=>{overrideReadAndValidate();ensureTop5Rows()},400)}
 if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();

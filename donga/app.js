/* JOBFIT DONG-A · STEP 1. Storage and functions are isolated from other JOBFIT apps. */
(function(){
'use strict';
var KEY='jobfit:donga:step1:v1';
var FIELDS=[['top5','가치관 TOP 5'],['core','핵심 가치 1위'],['must','절대 포기 못 하는 것'],['can','의외로 포기 가능한 것'],['conflict','가장 큰 가치관 충돌'],['dating','연애에서 중요한 가치'],['relationship','인간관계에서 중요한 가치'],['sentence','나를 가장 잘 설명하는 한 문장']];
var ALIASES={top5:['가치관 TOP 5','가치관 TOP5'],core:['핵심 가치 1위','핵심 가치'],must:['절대 포기 못 하는 것','포기하기 어려운 것'],can:['의외로 포기 가능한 것','상대적으로 포기 가능한 것'],conflict:['가장 큰 가치관 충돌','가장 큰 가치 충돌'],dating:['연애에서 중요한 가치','연애의 핵심 기준'],relationship:['인간관계에서 중요한 가치','인간관계의 핵심 기준'],sentence:['나를 가장 잘 설명하는 한 문장']};
var COMP=[['repeat','여러 결과에서 반복적으로 나타난 부분'],['connect','서로 연결된다고 느끼는 부분'],['unexpected','예상과 달랐던 부분'],['verify','실제 경험으로 확인하고 싶은 부분']];
var DNA=[['values','내가 확인한 핵심 가치와 선택 기준'],['fit','가치관·커리어 기준·강점이 연결되는 부분'],['caution','내가 확인한 보완할 행동 또는 강점 과잉 사용'],['next','다음 실제 경험에서 검증할 질문']];
var STRENGTHS='감사,공감,도전,사랑,시간관리,온화함,자기관리,조화,추진력,학습,감수성,글쓰기,동기부여,설득력,신중함,용기,자신감,진정성,친절,행동력,개인화,끈기,리더십,설명력,심미안,유머,자제력,진행력,통찰력,협력,겸손,낙관주의,박학다식,섬세함,연결성,유쾌함,적응력,집중력,평등심,호기심,경청,논리성,분석력,성장,열린 마음,의사소통,전략,창의성,포용력,활력,계획,대중성,사교성,승부욕,열정,이해력,정리정돈,책임감,피드백,회복탄력성'.split(',');
var TYPES={A:'전문성 추구형',B:'리더십 추구형',C:'자율성/독립성 추구형',D:'안전/안정성 추구형',E:'기업가적 창의성 추구형',F:'봉사/헌신 추구형',G:'순수 도전 추구형',H:'삶의 질 추구형'};
/* 새로 작성된 수업용 문항: 각 유형 다섯 문항을 섞어 배치 */
var ITEMS=[
['A','한 분야의 전문지식을 깊이 쌓는 일이 나에게 중요하다.'],
['D','오랫동안 안정적으로 일할 수 있는 조건을 우선한다.'],
['F','내 일이 다른 사람의 어려움을 줄이는 데 쓰였으면 좋겠다.'],
['C','업무 방법을 스스로 결정할 때 더 만족스럽다.'],
['H','일 때문에 가족·개인 생활이 계속 밀리는 것은 원하지 않는다.'],
['B','팀의 목표와 방향을 정하고 사람을 이끄는 역할을 선호한다.'],
['G','어려운 문제에 도전할 기회가 있으면 의욕이 생긴다.'],
['E','기존에 없던 상품이나 서비스를 직접 만들어 보고 싶다.'],
['B','서로 다른 일을 조율하고 최종 결정을 내리는 일이 매력적이다.'],
['H','일의 성취만큼 내 생활의 균형을 유지하는 것이 중요하다.'],
['A','전문가로 인정받을 만큼 한 기술을 숙련하고 싶다.'],
['E','나만의 아이디어를 사업이나 프로젝트로 발전시키고 싶다.'],
['C','세세한 지시보다 일의 목표만 주어지고 방법은 맡겨지는 편이 좋다.'],
['G','실패할 가능성이 있어도 풀기 어려운 과제에 끌린다.'],
['F','금전적 보상보다 누군가에게 실제로 도움이 되는 성과가 더 보람차다.'],
['D','예측 가능한 급여와 근로조건을 특히 중요하게 여긴다.'],
['C','조직의 정해진 방식과 달라도 내 판단에 따라 일하고 싶다.'],
['F','사회적으로 필요한 문제를 해결하는 일을 해보고 싶다.'],
['D','이직이나 고용 불안이 적은 근무환경을 선호한다.'],
['A','관리자가 되기보다 전문 분야를 더 깊이 연구하는 길도 좋다.'],
['E','새로운 일을 기획하고 처음부터 실행하는 과정이 즐겁다.'],
['H','직장 밖에서 중요하게 생각하는 일에 쓸 시간을 확보하고 싶다.'],
['B','팀 전체의 결과에 대한 책임을 맡아도 리더 역할에 도전하고 싶다.'],
['G','다른 사람들이 어렵다고 여기는 목표를 달성하면 뿌듯하다.'],
['G','해결 방법이 분명하지 않은 문제일수록 더 흥미롭다.'],
['E','내 이름을 건 프로젝트나 서비스를 만들고 싶다.'],
['B','조직 전체를 보는 시야를 갖추고 의사결정에 참여하고 싶다.'],
['D','새로운 기회가 있더라도 기존의 안정적 기반을 쉽게 버리지 않는다.'],
['A','성과에 대한 평가보다 전문성을 발휘하는 업무 내용이 더 중요할 때가 많다.'],
['H','근무시간과 장소를 조정할 수 있는 유연성이 중요하다.'],
['C','타인의 지속적인 승인 없이 독립적으로 일할 수 있으면 좋겠다.'],
['F','내가 믿는 가치를 지키는 일을 직업으로 삼는 데 관심이 있다.'],
['H','직업적 성공과 삶의 만족이 함께 유지되기를 바란다.'],
['A','내 지식을 계속 갱신하고 실력을 쌓는 환경을 선호한다.'],
['D','장기적인 경제계획을 세울 수 있는 직장을 선호한다.'],
['G','도전적인 목표를 해결할 때 일의 재미를 가장 크게 느낀다.'],
['F','누군가의 성장이나 회복에 실질적인 도움을 주는 것이 뿌듯하다.'],
['B','개인의 성과보다 팀 전체의 성과를 만드는 리더 역할에 끌린다.'],
['E','안정적인 반복 업무보다 새로운 기회를 발견하고 실험하는 일이 좋다.'],
['C','내 업무의 우선순위와 속도를 스스로 정할 수 있는 것이 중요하다.']
];
function fresh(){return{app:'JOBFIT_DONGA',version:1,values:{},valuesSaved:false,anchor:{answers:Array(40).fill(0),bonus:[]},strengths:[],via:{top:Array(5).fill(''),low:Array(3).fill('')},compare:{},aiReviewed:false,dna:{},dnaSaved:false,updatedAt:null}}
function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.app==='JOBFIT_DONGA'&&s.version===1&&s.anchor&&Array.isArray(s.anchor.answers)&&s.anchor.answers.length===40){var d=fresh();return Object.assign(d,s,{anchor:Object.assign(d.anchor,s.anchor),via:Object.assign(d.via,s.via)});}}catch(e){}return fresh()}
var data=load(),page=0,valuePrompt='',analysisPrompt='',timer=0;
function $(id){return document.getElementById(id)}
function txt(v){return String(v===null||v===undefined?'':v)}
function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function filled(v){return typeof v==='string'&&v.trim().length>0}
function toast(m){clearTimeout(timer);$('toast').textContent=m;$('toast').style.display='block';timer=setTimeout(function(){$('toast').style.display='none'},3000)}
function persist(){data.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(data));$('savedat').textContent='이 브라우저에 자동 저장 · '+new Date().toLocaleTimeString('ko-KR')}catch(e){$('savedat').textContent='브라우저 저장 실패 · JSON 백업 사용';toast('저장할 수 없습니다. 백업 내용 복사를 이용하세요.')}refresh()}
function allFields(list,obj){return list.every(function(x){return filled(obj[x[0]])})}
function anchorDone(){return data.anchor.answers.every(function(n){return Number.isInteger(n)&&n>=1&&n<=6})&&data.anchor.bonus.length===3}
function done(n){if(n===1)return !!data.valuesSaved&&allFields(FIELDS,data.values);if(n===2)return anchorDone();if(n===3)return data.strengths.length===5;if(n===4)return data.via.top.every(filled)&&data.via.low.every(filled);if(n===5)return allFields(COMP,data.compare);if(n===6)return !!data.aiReviewed;if(n===7)return !!data.dnaSaved&&allFields(DNA,data.dna)}
function ranking(){return Object.keys(TYPES).map(function(code){var score=0;ITEMS.forEach(function(q,i){if(q[0]===code){score+=Number(data.anchor.answers[i]||0);if(data.anchor.bonus.includes(i))score+=4}});return{code:code,name:TYPES[code],score:score}}).sort(function(a,b){return b.score-a.score||a.code.localeCompare(b.code)})}
function refresh(){var count=0;for(var n=1;n<=7;n++){var b=$('tag'+n);if(done(n)){count++;b.textContent='완료';b.className='tag done'}else{b.textContent='진행 중';b.className='tag'}}$('meter').style.width=(count/7*100)+'%';$('progress').textContent=count+' / 7 완료';renderComparePreview();renderDnaPreview()}
function fields(target,list,key,obj,multi){$(target).innerHTML=list.map(function(item){var v=obj[item[0]]||'';if(key==='dna')v=compactText(v);var useArea=multi||(key==='val'&&item[0]==='top5');return '<label class="field"><span>'+esc(item[1])+'</span>'+(useArea?'<textarea data-'+key+'="'+esc(item[0])+'" placeholder="'+esc(item[1])+'">'+esc(v)+'</textarea>':'<input type="text" data-'+key+'="'+esc(item[0])+'" value="'+esc(v)+'" placeholder="'+esc(item[1])+'">')+'</label>'}).join('')}
function syncFields(key,obj){document.querySelectorAll('[data-'+key+']').forEach(function(i){obj[i.getAttribute('data-'+key)]=i.value.trim()})}
function copy(s){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(s).then(function(){toast('복사했습니다.')},function(){legacyCopy(s)})}else legacyCopy(s)}
function legacyCopy(s){var a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();var success=false;try{success=document.execCommand('copy')}catch(e){}a.remove();toast(success?'복사했습니다.':'복사를 허용하지 않습니다. 텍스트를 직접 복사하세요.')}
fetch('./value-prompt.txt').then(function(r){if(!r.ok)throw Error('prompt missing');return r.text()}).then(function(t){valuePrompt=t;$('promptvalue').textContent=t}).catch(function(){$('promptvalue').textContent='프롬프트를 불러오지 못했습니다. 인터넷 연결을 확인하세요.'});
function parseValues(){var original=$('pastevalue').value.trim();if(!original){toast('⑩ 최종 프로필을 붙여넣으세요.');return}var p=original.lastIndexOf('⑩');if(p>=0)original=original.slice(p);else if(/[①②③④⑤⑥⑦⑧⑨]/.test(original)){toast('⑩ 부분만 붙여넣으세요.');return}
var found={},current='';original.replace(/\r/g,'').replace(/\*\*/g,'').split('\n').forEach(function(line){var v=line.replace(/^[\s|>*•\-]+/,'').replace(/\s*\|\s*$/,'').trim();if(!v)return;var item=null,matched='';FIELDS.forEach(function(f){(ALIASES[f[0]]||[]).forEach(function(word){if(!item&&v.includes(word)){item=f[0];matched=word}})});if(item){current=item;var rest=v.slice(v.indexOf(matched)+matched.length).replace(/^\s*[:：|·\-]\s*/,'').trim();if(rest)found[current]=(found[current]?found[current]+'\n':'')+rest}else if(current&&!/^(⑩|MY VALUES PROFILE)/.test(v)){found[current]=(found[current]?found[current]+'\n':'')+v}});
if(!found.sentence){var tail=original.split('\n').reverse().map(function(s){return s.replace(/^[\s>*•-]+/,'').trim()}).find(function(s){return /^(나는|내가)\s/.test(s)});if(tail)found.sentence=tail;}var count=0;FIELDS.forEach(function(x){if(found[x[0]]){data.values[x[0]]=found[x[0]];count++}});if(!count){toast('항목 제목을 찾지 못했습니다. 아래에 직접 입력하세요.');return}data.valuesSaved=false;fields('valuefields',FIELDS,'val',data.values,false);$('pastevalue').value='';persist();toast(count+'개 항목을 채웠습니다. 확인 후 저장하세요.')}
$('parsevalue').onclick=parseValues;
$('copyvalue').onclick=function(){if(!valuePrompt){toast('프롬프트가 아직 준비되지 않았습니다.');return}copy(valuePrompt)};
$('valuefields').addEventListener('input',function(e){var k=e.target.getAttribute('data-val');if(k){data.values[k]=e.target.value;data.valuesSaved=false;persist()}});
$('savevalue').onclick=function(){syncFields('val',data.values);if(!allFields(FIELDS,data.values)){toast('⑩ 최종 프로필의 8개 항목을 작성하세요.');return}data.valuesSaved=true;persist();toast('⑩ 최종 가치관 프로필 8개 항목만 저장했습니다.')};
function drawQ(){var answered=data.anchor.answers.filter(function(x){return Number.isInteger(x)&&x>=1&&x<=6}).length;$('qcount').textContent=answered+' / 40 응답';$('qpage').textContent=(page+1)+' / 4 묶음';$('qprev').disabled=page===0;$('qnext').disabled=page===3;$('qarea').innerHTML=ITEMS.slice(page*10,(page+1)*10).map(function(it,j){var i=page*10+j;return '<div class="question"><b>'+(i+1)+'. '+esc(it[1])+'</b><div class="choices">'+[1,2,3,4,5,6].map(function(n){return '<label><input type="radio" name="q'+i+'" data-answer="'+i+'" value="'+n+'" '+(data.anchor.answers[i]===n?'checked':'')+'>'+n+'</label>'}).join('')+'</div></div>'}).join('');var complete=answered===40;$('bonusarea').classList.toggle('hidden',!complete);if(complete){$('bonuslist').innerHTML=ITEMS.map(function(it,i){return '<label class="bonusopt"><input type="checkbox" data-bonus="'+i+'" '+(data.anchor.bonus.includes(i)?'checked':'')+'> <b>'+(i+1)+'.</b> '+esc(it[1])+'</label>'}).join('');$('bonuscount').textContent=data.anchor.bonus.length+' / 3 선택'}drawAnchorResult()}
function drawAnchorResult(){if(!anchorDone()){$('anchorresult').innerHTML='<div class="note info">40문항 응답과 가산 문항 3개를 완료하면 주 앵커·보조 앵커·상대적으로 낮은 앵커가 나타납니다.</div>';return}var a=ranking(),best=a[0].score,least=a[a.length-1].score,sec=a.find(function(x){return x.score<best});var title=function(s){return s.map(function(x){return x.name}).join(' · ')||'—'};$('anchorresult').innerHTML='<h3>Career Anchor 결과</h3><div class="box">주 앵커: '+esc(title(a.filter(function(x){return x.score===best})))+' ('+best+'점)\n보조 앵커: '+esc(title(sec?a.filter(function(x){return x.score===sec.score}):[]))+'\n가장 낮은 앵커: '+esc(title(a.filter(function(x){return x.score===least})))+' ('+least+'점)</div><h3>8개 유형 점수</h3>'+a.map(function(x){return '<div class="rank"><span>'+esc(x.name)+'</span><b>'+x.score+'</b><em><i style="width:'+Math.min(100,100*x.score/42)+'%"></i></em></div>'}).join('')+'<p class="small">낮은 점수는 해당 조건을 싫어한다는 뜻이 아닙니다. 자기이해 가설로 비교하세요.</p>'}
$('qarea').addEventListener('change',function(e){var i=e.target.getAttribute('data-answer');if(i!==null){data.anchor.answers[Number(i)]=Number(e.target.value);persist();drawQ()}});
$('qprev').onclick=function(){if(page>0){page--;drawQ()}};$('qnext').onclick=function(){if(page<3){page++;drawQ()}};
$('bonuslist').addEventListener('change',function(e){var x=e.target.getAttribute('data-bonus');if(x===null)return;var i=Number(x);if(e.target.checked){if(data.anchor.bonus.length>=3){toast('가산 문항은 3개까지만 선택합니다.');e.target.checked=false;return}data.anchor.bonus.push(i)}else{data.anchor.bonus=data.anchor.bonus.filter(function(n){return n!==i})}persist();drawQ()});
function drawStrengths(){$('strengthcount').textContent=data.strengths.length+' / 5 선택';$('strengtharea').innerHTML=STRENGTHS.map(function(s){return '<button type="button" data-strength="'+esc(s)+'" class="'+(data.strengths.includes(s)?'selected':'')+'">'+esc(s)+'</button>'}).join('')}
$('strengtharea').addEventListener('click',function(e){var b=e.target.closest('[data-strength]');if(!b)return;var s=b.getAttribute('data-strength');if(data.strengths.includes(s)){data.strengths=data.strengths.filter(function(x){return x!==s})}else if(data.strengths.length<5){data.strengths.push(s)}else{toast('강점은 5개까지 고를 수 있습니다.');return}persist();drawStrengths()});
function drawVia(){['top','low'].forEach(function(k){$('via'+k).innerHTML=data.via[k].map(function(v,i){return '<label class="field"><span>'+(k==='top'?'TOP ':'하위 ')+(i+1)+'</span><input type="text" data-via="'+k+':'+i+'" value="'+esc(v)+'" placeholder="공식 결과에 표시된 강점명"></label>'}).join('')})}
['viatop','vialow'].forEach(function(id){$(id).addEventListener('input',function(e){var a=e.target.getAttribute('data-via');if(a){var p=a.split(':');data.via[p[0]][Number(p[1])]=e.target.value;persist()}})});
function renderComparePreview(){$('viewself').textContent='⑩ 최종 가치관 TOP 5\n'+(data.values.top5||'미입력')+'\n\n내가 선택한 강점\n'+(data.strengths.join(' · ')||'미선택');$('viewtest').textContent='커리어 앵커\n'+(anchorDone()?ranking().slice(0,3).map(function(x){return x.name+' '+x.score+'점'}).join('\n'):'미완료')+'\n\nVIA 상위\n'+(data.via.top.filter(filled).join(' · ')||'미입력')+'\n\nVIA 하위\n'+(data.via.low.filter(filled).join(' · ')||'미입력')}
fields('comparefields',COMP,'comp',data.compare,true);
$('comparefields').addEventListener('input',function(e){var k=e.target.getAttribute('data-comp');if(k){data.compare[k]=e.target.value;persist()}});
function analysis(){
var c=FIELDS.map(function(f){return f[1]+': '+(data.values[f[0]]||'미입력')}).join('\n');
var references=[
'너는 대학생의 자기이해를 돕는 진로상담 조력자다. 아래 학생 자료만 사용하여 Career DNA를 간결하게 분석하라.',
'없는 경험·성과·강점 사용 사례를 만들어내지 말고, 확인된 자료와 가설을 구분하라.',
'',
'[가치관 인터뷰 ⑩ 최종 결과]',
c,
'',
'[Career Anchor]',
anchorDone()?ranking().slice(0,3).map(function(x){return x.name+' '+x.score+'점'}).join(' / '):'미완료',
'[학생이 고른 강점]',
data.strengths.join(' · ')||'미선택',
'[VIA 강점]',
'상위: '+(data.via.top.filter(filled).join(' · ')||'미입력'),
'하위: '+(data.via.low.filter(filled).join(' · ')||'미입력'),
'[학생의 직접 비교]',
COMP.map(function(x){return x[1]+': '+(data.compare[x[0]]||'미작성')}).join('\n'),
'',
'[출력 규칙]',
'전체 결과를 600자 이내로 작성한다. 한 항목은 최대 2줄이며, 줄 사이 빈 줄을 넣지 않는다.',
'마크다운 표, 긴 서론, 겹치는 설명, 불필요한 별표, 격려 문장은 쓰지 않는다.',
'구체적인 경험 근거가 없으면 [확인 필요]라고 쓰고, 결과보다 강한 결론을 내리지 않는다.',
'다음 네 섹션만 아래 순서로 출력한다.',
'1. [핵심 가치와 직업 선택 기준] — 자료로 확인되는 내용 2줄',
'2. [강점과 보완할 행동] — 강점의 일치·차이와 과잉사용 주의점을 각 1줄로 제시한다.',
'3. [SWOT 요약] — S, W, O, T를 각 1줄씩. 근거가 없는 O/T는 확인 필요라고 기재한다.',
'4. [MY CAREER DNA v1] — 반드시 다음 4개 제목만 각각 1줄로 출력한다.',
'• 내가 확인한 핵심 가치와 선택 기준:',
'• 가치관·커리어 기준·강점이 연결되는 부분:',
'• 내가 확인한 보완할 행동 또는 강점 과잉 사용:',
'• 다음 실제 경험에서 검증할 질문:',
'모든 문장은 확인된 근거 또는 [AI 가설] 여부를 표시한다.'
];
analysisPrompt=references.join('\n');$('analysispreview').textContent=analysisPrompt;toast('간결한 Career DNA 분석 프롬프트를 만들었습니다.');
}
function compactText(value){return txt(value).replace(/\r\n?/g,'\n').replace(/[\u00a0\u200b]/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]*\n+/g,'\n').trim()}
function compactPaste(el,done){el.addEventListener('paste',function(e){var raw=e.clipboardData&&e.clipboardData.getData('text');if(!raw)return;var normalized=compactText(raw);if(normalized===raw)return;e.preventDefault();var start=el.selectionStart,end=el.selectionEnd;el.setRangeText(normalized,start,end,'end');el.dispatchEvent(new Event('input',{bubbles:true}));if(done)done()})}

$('makeanalysis').onclick=analysis;$('copyanalysis').onclick=function(){if(!analysisPrompt)analysis();copy(analysisPrompt)};
$('aireview').checked=!!data.aiReviewed;$('aireview').onchange=function(e){data.aiReviewed=e.target.checked;persist()};
fields('dnafields',DNA,'dna',data.dna,true);
document.querySelectorAll('#dnafields textarea').forEach(function(t){compactPaste(t)});compactPaste($('aiscratch'));

$('dnafields').addEventListener('input',function(e){var k=e.target.getAttribute('data-dna');if(k){data.dna[k]=e.target.value;data.dnaSaved=false;$('confirmdna').checked=false;persist()}});
$('savedna').onclick=function(){syncFields('dna',data.dna);if(!allFields(DNA,data.dna)){toast('Career DNA의 4개 항목을 모두 작성하세요.');return}if(!$('confirmdna').checked){toast('본인이 검토했다는 확인란에 체크하세요.');return}data.dnaSaved=true;persist();toast('MY CAREER DNA v1을 저장했습니다.')};
function renderDnaPreview(){$('dnapreview').textContent=data.dnaSaved?'MY CAREER DNA v1 · 저장 완료\n'+DNA.map(function(x){return '■ '+x[1]+'\n'+compactText(data.dna[x[0]]||'')}).join('\n'):'아직 최종 저장하지 않았습니다.'}
$('printdna').onclick=function(){if(!data.dnaSaved){toast('Career DNA를 먼저 저장하세요.');return}var h='<h1>JOBFIT DONG-A · MY CAREER DNA v1</h1><p>학생이 직접 확인하고 저장한 자기이해 가설 · 직무 적합도 판정이 아닙니다.</p>';h+='<section><h2>⑩ 최종 가치관 프로필</h2>'+FIELDS.map(function(f){return '<p><b>'+esc(f[1])+'</b>\n'+esc(data.values[f[0]]||'')+'</p>'}).join('')+'</section>';h+='<section><h2>Career Anchor</h2><p>'+esc(anchorDone()?ranking().map(function(x){return x.name+' '+x.score+'점'}).join('\n'):'미완료')+'</p></section>';h+='<section><h2>강점</h2><p>내가 고른 강점: '+esc(data.strengths.join(' · '))+'\nVIA 상위: '+esc(data.via.top.join(' · '))+'\nVIA 하위: '+esc(data.via.low.join(' · '))+'</p></section>';h+='<section><h2>MY CAREER DNA v1</h2>'+DNA.map(function(x){return '<p><b>'+esc(x[1])+'</b>\n'+esc(compactText(data.dna[x[0]]||''))+'</p>'}).join('')+'</section>';$('printarea').innerHTML=h;window.print()};
$('backup').onclick=function(){var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='JOBFIT_DONGA_STEP1_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},3000);toast('파일 앱이나 다운로드 폴더에서 백업 파일을 확인하세요.')};
$('copybackup').onclick=function(){copy(JSON.stringify(data,null,2))};
$('restore').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(){try{var s=JSON.parse(reader.result);if(s.app!=='JOBFIT_DONGA'||s.version!==1||!s.anchor||!Array.isArray(s.anchor.answers)||s.anchor.answers.length!==40){toast('잡핏동아 STEP 1 백업 파일이 아닙니다.');return}if(confirm('현재 잡핏동아 STEP 1 입력값을 백업 파일로 교체할까요? 기존 잡핏인제·플렉스에는 영향이 없습니다.')){data=Object.assign(fresh(),s);persist();location.reload()}}catch(err){toast('백업 JSON을 읽을 수 없습니다.')}};reader.readAsText(f);e.target.value=''});
document.querySelectorAll('.next').forEach(function(b){b.addEventListener('click',function(){var x=$(b.getAttribute('data-next'));x.open=true;x.scrollIntoView({behavior:'smooth',block:'start'})})});
fields('valuefields',FIELDS,'val',data.values,false);drawQ();drawStrengths();drawVia();refresh();
})();

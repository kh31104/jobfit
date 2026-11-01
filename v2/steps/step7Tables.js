// INJE STEP 7 · editable PEST/5-forces and company/SWOT tables.
// Additive schema. Existing industryCompany records and localStorage keys are not migrated or erased.
import {activeTargetJobs,activeTargetCombos} from '../quickStart.js?v=1';

const INDUSTRY = [
  ['policy','Policy · 정책/법규'],['economy','Economy · 경제'],['society','Society · 사회/문화'],['technology','Technology · 기술'],
  ['opportunity','Opportunity · 기회'],['threat','Threat · 위협'],
  ['rivalry','1. 산업 내 경쟁'],['entrants','2. 잠재적 진입자'],['buyers','3. 구매자·공급자 교섭력'],
  ['substitutes','4. 대체재'],['growth','5. 성장성']
];
const COMPANY = [
  ['productStrength','Product · 핵심상품·강점'],['customer','Customer · 주요 고객'],['financePerformance','Financial · 매출·영업이익'],['competitorAdvantage','Competitor · 경쟁우위'],['futureGrowth','Future · 성장 방향'],
  ['productWeakness','Product · 약점'],['customerChange','Customer · 고객 변화'],['financeRisks','Financial · 재무 변동'],['competitorThreat','Competitor · 경쟁 위험'],['futureExpansion','Future · 신규 시장'],
  ['swotStrength','SWOT · Strength 강점'],['swotWeakness','SWOT · Weakness 약점'],['swotOpportunity','SWOT · Opportunity 기회'],['swotThreat','SWOT · Threat 위협'],
  ['other','기타 주요 이슈']
];
const FIELD_MAP = {industry:INDUSTRY,company:COMPANY};
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl = u => {try{const x=new URL(String(u||''));return (x.protocol==='https:'||x.protocol==='http:')&&!!x.hostname}catch{return false}};
const date = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const fieldsOf = kind => Object.fromEntries(FIELD_MAP[kind].map(x=>[x[0],'']));
const blank = () => ({version:1,target:{major:'',job:'',industry:'',company:'',jd:''},industry:{fields:fieldsOf('industry'),sources:[]},company:{fields:fieldsOf('company'),sources:[]},syncedIndustryId:'',syncedCompanyId:''});
const bullets = text => String(text||'').split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/,'').trim()).filter(Boolean).map(x=>'• '+x).join('\n');
const refs = text => [...new Set([...String(text||'').matchAll(/\[(S\d{1,2})\]/gi)].map(m=>m[1].toUpperCase()))];
const sourceStatus = (item, data) => {
  const ids=refs(item), sources=data.sources||[];
  if(!String(item||'').trim())return '미작성';
  if(!ids.length)return '근거번호 없음 · 확인 필요';
  const miss=ids.filter(id=>!sources.some(s=>s.id===id&&validUrl(s.url)));
  if(miss.length)return miss.join(', ')+' 원문 URL 확인 필요';
  return ids.every(id=>sources.find(s=>s.id===id)?.checked)?'학생 원문 대조 완료':'원문 대조 필요';
};
function earlier(s){
  const job=activeTargetJobs(s)[0]||{}, combo=activeTargetCombos(s)[0]||{};
  const deep=s.artifacts?.jobDeepDive||{};
  const analyses=deep.targetAnalyses||deep.analyses||{};
  const a=analyses[combo.id]||analyses[job.id]||Object.values(analyses)[0]||{};
  const jd=(a.sources||[]).find(x=>x.id===a.selectedSourceId)||(a.sources||[])[0]||{};
  const priorCompany=(s.artifacts?.industryCompany?.companies||[]).find(x=>x.generatedBy!=='step4-inje')||{};
  const priorIndustry=(s.artifacts?.industryCompany?.industries||[]).find(x=>x.generatedBy!=='step4-inje')||{};
  return {
    major:String(s.profile?.major||''),
    job:String(job.title||''),
    industry:String(combo.industry&&combo.industry!=='산업 미정'?combo.industry:priorIndustry.name||''),
    company:String(jd.companyName||priorCompany.name||''),
    jd:String([jd.companyName,jd.name].filter(Boolean).join(' · '))
  };
}
function makePrompt(kind,d){
  const isIndustry=kind==='industry',t=d.target,needed=[];
  if(!t.job.trim())needed.push('지원할 목표 직무는 무엇입니까?');
  if(!t.industry.trim())needed.push('관심 산업은 무엇입니까?');
  if(!isIndustry&&!t.company.trim())needed.push('분석할 기업 또는 기관 한 곳은 어디입니까?');
  const heading=FIELD_MAP[kind].map(([key,label])=>'['+key+']\n• 확인된 사실 1~3개와 근거번호 [S1] (없으면 "확인 필요")').join('\n\n');
  return [
    '당신은 한국 대학생을 위한 산업·기업분석 리서처입니다. 오늘 검색 가능한 공식 1차 자료를 우선합니다.',
    '분석 유형: '+(isIndustry?'산업 PEST + 기회/위협 + 경쟁요인':'단일 기업 5개 영역 + SWOT'),
    '전공: '+(t.major||'미입력'),'목표 직무: '+(t.job||'미입력'),'관심 산업: '+(t.industry||'미입력'),
    '분석 대상 기업·기관: '+(t.company||'미선택'),'확인한 JD: '+(t.jd||'미입력'),
    '',
    '[작업 순서]',
    needed.length?'1. 분석 전 반드시 사용자에게 다음 질문을 먼저 하고 답을 기다리세요:\n'+needed.map((q,i)=>(i+1)+') '+q).join('\n'):'1. 입력 정보가 충분하면 바로 조사하세요. 판단에 필수적인 정보가 부족하면 질문 최대 3개를 하고 답을 기다리세요.',
    '2. 정부·공공기관·산업협회·공시·기업 공식 홈페이지·IR·대학 공식 자료를 우선 검색하세요.',
    '3. 최근 12개월 변화부터 확인하되 비교를 위해 장기자료를 활용할 수 있습니다.',
    '4. 정책·통계·시장·재무·경쟁·고용 관련 주장 옆에 반드시 [S번호]를 달아 주세요.',
    '5. 자료명, 발행기관, 발행일, 실제 원문 URL을 대조하고 찾지 못한 URL이나 숫자는 만들지 마세요.',
    '6. AI가 내용을 작성한 것과 사용자가 원문을 직접 대조한 것은 다릅니다. 확인되지 않은 내용은 "확인 필요"로 표시하세요.',
    '7. 직무가 존재하는 조직 유형을 기업뿐 아니라 공공기관·전국 대학(국공립·사립·전문대)·연구기관·비영리기관까지 탐색하세요. 실제 직무가 존재하는 범주만 적고, 특정 대학을 무리하게 열거하지 마세요.',
    '8. 직무 존재, 채용공고 확인, 현재 채용 중을 구분하고 공식 원문으로 확인된 것만 모집 중이라고 하세요.',
    isIndustry?'9. 기회와 위협은 PEST 근거를 토대로 해석하고, 5개 경쟁요인은 해당 산업에 적합한 범위만 설명하세요. 성장성은 자료와 시점을 근거로 서술하세요.':
      '9. Product(강점·약점), Customer, Financial(매출·영업이익·손익과 시점), Competitor, Future direction을 확인하고 SWOT는 기업 내부 S/W와 외부 O/T를 구분하세요. 대학·공공기관처럼 영리기업 지표가 맞지 않으면 재정·사업수행 자료로 바꾸고 해당 이유를 밝히세요.',
    '10. 모든 칸을 채우려고 사실을 추정하지 말고, 항목별 1~3개 개조식 문장으로 작성하세요.',
    '11. 표 셀로 자동 반영됩니다. 반드시 다음 [영문 필드키]를 하나도 바꾸지 마세요. 표나 JSON·코드블록 없이 순수 텍스트로 답하세요.',
    '',
    '[출력 형식]',
    heading,
    '',
    '[Sources]',
    '[S1] 발행기관 | 자료명 | 발행일 YYYY-MM-DD | https://실제원문URL',
    '[S2] 발행기관 | 자료명 | 발행일 YYYY-MM-DD | https://실제원문URL',
    '최대 8개까지. 실제 검색·원문 확인이 불가능한 경우 URL을 꾸며내지 말고 확인 필요를 작성하세요.',
    '',
    '[누락·추가 질문]',
    '분석 불가능한 핵심 공백만 짧게 질문하세요. 답을 받기 전 임의로 채우지 마세요.'
  ].join('\n');
}
export function parseTableAi(kind,raw) {
  const known=new Set(FIELD_MAP[kind].map(x=>x[0]));
  const result={fields:{},sources:[]};
  let key='',sources=false;
  for(const line of String(raw||'').replace(/\r/g,'').split('\n')){
    const trimmed=line.trim(),header=trimmed.match(/^\[([^\]]+)\]\s*$/);
    if(header){
      if(header[1].toLowerCase()==='sources'){sources=true;key='';continue}
      if(known.has(header[1])){key=header[1];sources=false;continue}
      if(/^(?:누락|추가 질문)/.test(header[1])){key='';sources=false;continue}
    }
    if(sources){
      const sm=trimmed.match(/^\[(S\d{1,2})\]\s*(.+)$/i);
      if(sm){const parts=sm[2].split(/\s*\|\s*/);const url=(parts.find(p=>/^https?:\/\//i.test(p))||'').trim();
        result.sources.push({id:sm[1].toUpperCase(),issuer:(parts[0]||'').trim(),title:(parts[1]||'').trim(),published:(parts[2]||'').trim(),url:validUrl(url)?url:'',checked:false});}
    }else if(key&&trimmed){result.fields[key]=[result.fields[key],trimmed].filter(Boolean).join('\n');}
  }
  result.sources=[...new Map(result.sources.filter(s=>/^S[1-8]$/.test(s.id)).map(s=>[s.id,s])).values()];
  return result;
}
function tableHtml(kind,d,ids){
  const lines=FIELD_MAP[kind], headings=ids.map(k=>lines.find(x=>x[0]===k)),part=d[kind];
  return '<div class="jf7Scroll"><table class="jf7Table"><thead><tr>'+
    headings.map(x=>'<th scope="col">'+esc(x[1])+'</th>').join('')+
    '</tr></thead><tbody><tr>'+headings.map(([key,label])=>
    '<td><label class="jf7CellLabel" for="'+kind+'-'+key+'">'+esc(label)+'</label>'+
    '<textarea rows="5" id="'+kind+'-'+key+'" data-kind="'+kind+'" data-field="'+key+'" placeholder="• 근거 있는 내용 작성&#10;• 주장 끝에 [S1] 표시">'+esc(part.fields[key]||'')+'</textarea>'+
    '<div class="jf7SourceHint" data-status="'+kind+'-'+key+'">'+esc(sourceStatus(part.fields[key],part))+'</div></td>').join('')+
    '</tr></tbody></table></div>';
}
function sourceHtml(kind,d){
  const sources=d[kind].sources||[];
  const body=Array.from({length:8},(_,i)=>{
    const id='S'+(i+1),x=sources.find(s=>s.id===id)||{id,title:'',issuer:'',published:'',url:'',checked:false};
    return '<tr data-source-row="'+id+'"><th scope="row">'+id+'</th>'+
      ['issuer','title','published','url'].map(k=>'<td><input class="input" data-kind="'+kind+'" data-source="'+id+'" data-source-key="'+k+'" aria-label="'+id+' '+k+'" value="'+esc(x[k]||'')+'" placeholder="'+({issuer:'발행기관',title:'자료명',published:'YYYY-MM-DD',url:'https://원문'}[k])+'"></td>').join('')+
      '<td><label class="jf7Verify"><input type="checkbox" data-kind="'+kind+'" data-verified="'+id+'" '+(x.checked?'checked':'')+'>원문 대조</label><span class="jf7Open" data-open="'+kind+'-'+id+'">'+(validUrl(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">원문 열기</a>':'확인 필요')+'</span></td></tr>';
  }).join('');
  return '<div class="jf7Scroll"><table class="jf7Sources"><thead><tr><th>번호</th><th>발행기관</th><th>자료명</th><th>발행일</th><th>원문 URL</th><th>검증</th></tr></thead><tbody>'+body+'</tbody></table></div>';
}
function statusHtml(kind,d){
  const part=d[kind],filled=Object.values(part.fields||{}).filter(x=>String(x).trim()).length,valid=(part.sources||[]).filter(x=>validUrl(x.url)).length;
  return '작성 '+filled+'/'+FIELD_MAP[kind].length+'칸 · 원문 링크 '+valid+'건 · 검증 체크는 학생이 직접 원문을 대조한 후 선택';
}
function renderPart(kind,d){
  const ind=kind==='industry';
  return '<section class="jf7Part" data-table="'+kind+'"><h3>'+(ind?'02. 산업분석 · PEST와 경쟁요인':'03. 기업분석 · 5개 영역과 SWOT')+'</h3>'+
    '<p class="help">AI 답변을 한 번 붙여넣으면 아래 표에 바로 반영됩니다. 표 안에서 수정하고 저장할 수 있습니다. 각 사실 뒤에 [S1]처럼 출처번호를 넣으세요.</p>'+
    '<div class="actions"><button class="btn secondary" type="button" data-prompt="'+kind+'">분석 프롬프트 복사</button><button class="btn outline" type="button" data-fact="'+kind+'">팩트체크 프롬프트 복사</button></div>'+
    '<div class="field jf7Paste"><label for="jf7Import-'+kind+'">AI 답변 붙여넣기 · '+(ind?'산업':'기업')+' 1회 입력</label>'+
    '<textarea id="jf7Import-'+kind+'" rows="3" placeholder="AI에서 복사한 [필드키] 형식 답변 전체를 여기에 붙여넣으세요. 내용을 인식하면 즉시 표에 적용하고 입력창은 비웁니다."></textarea></div>'+
    '<p class="jf7Status" data-feedback="'+kind+'">'+esc(statusHtml(kind,d))+'</p>'+
    (ind?'<h4>PEST 분석</h4>'+tableHtml(kind,d,['policy','economy','society','technology'])+
      '<h4>기회·위협</h4>'+tableHtml(kind,d,['opportunity','threat'])+
      '<h4>5개 경쟁요인</h4>'+tableHtml(kind,d,['rivalry','entrants','buyers','substitutes','growth']):
      '<h4>제품·고객·재무·경쟁사·미래방향</h4>'+tableHtml(kind,d,['productStrength','customer','financePerformance','competitorAdvantage','futureGrowth'])+
      tableHtml(kind,d,['productWeakness','customerChange','financeRisks','competitorThreat','futureExpansion'])+
      '<h4>SWOT 분석</h4>'+tableHtml(kind,d,['swotStrength','swotWeakness','swotOpportunity','swotThreat'])+
      '<h4>기타 주요 이슈</h4>'+tableHtml(kind,d,['other']))+
    '<h4>출처 · 원문 크로스체크</h4><p class="help">AI가 적어준 출처도 검증 전 상태입니다. URL을 열어 자료명·기관·발행일·해당 주장을 직접 확인한 후에만 체크하세요. 링크가 없는 내용은 확인 필요로 남깁니다.</p>'+
    sourceHtml(kind,d)+'</section>';
}
const STYLE = '<style>'+
'.jf7Workspace{--jf7Blue:#bfd9ff;line-height:1.65}.jf7Workspace .jf7Scroll{max-width:100%;overflow-x:auto;margin:10px 0 22px}'+
'.jf7Workspace .jf7Table,.jf7Workspace .jf7Sources{width:100%;border-collapse:separate;border-spacing:1px;table-layout:fixed;background:#d5deeb}'+
'.jf7Workspace .jf7Table th{background:#b4d2fc;color:#173b65;padding:12px 8px;font-size:13px;text-align:center;line-height:1.45}'+
'.jf7Workspace .jf7Table td{background:#f5f9ff;vertical-align:top;padding:9px;min-width:0}'+
'.jf7Workspace .jf7CellLabel{display:none}.jf7Workspace .jf7Table textarea{box-sizing:border-box;width:100%;min-height:158px;padding:10px;border:1px solid #ccd9eb;border-radius:8px;background:#fff;font-size:14px;line-height:1.85;resize:vertical;overflow-wrap:anywhere;white-space:pre-wrap}'+
'.jf7Workspace .jf7Table textarea:focus,.jf7Workspace .jf7Sources input:focus{outline:2px solid #2d6cdf;outline-offset:1px}'+
'.jf7Workspace .jf7SourceHint{font-size:12px;line-height:1.5;margin-top:7px;color:#8b4513;overflow-wrap:anywhere}'+
'.jf7Workspace .jf7Sources th,.jf7Workspace .jf7Sources td{background:#f7faff;text-align:left;padding:7px;vertical-align:middle;font-size:12px;overflow-wrap:anywhere}'+
'.jf7Workspace .jf7Sources thead th{background:#dceafb;color:#1d3657}'+
'.jf7Workspace .jf7Sources .input{min-width:0;box-sizing:border-box;width:100%;font-size:12px;padding:7px}'+
'.jf7Workspace .jf7Sources th:first-child{width:37px}.jf7Workspace .jf7Sources td:last-child{width:100px}'+
'.jf7Workspace .jf7Verify{display:flex;gap:5px;align-items:center;white-space:nowrap;font-size:12px}'+
'.jf7Workspace .jf7Open{display:block;font-size:12px}.jf7Workspace .jf7Part{margin:22px 0 32px;padding:12px;border:1px solid #dce4f1;border-radius:12px}'+
'.jf7Workspace .jf7Part h4{margin:17px 0 5px}.jf7Workspace .jf7Paste textarea{min-height:78px}.jf7Workspace .jf7Status{font-size:13px;color:#315077;margin:8px 0}'+
'.jf7Workspace .jf7Target{margin:12px 0}.jf7Workspace .jf7Target .field{min-width:0}.jf7Workspace .jf7Target input{box-sizing:border-box;width:100%}'+
'@media(max-width:810px){.jf7Workspace .jf7Table,.jf7Workspace .jf7Table tbody,.jf7Workspace .jf7Table tr,.jf7Workspace .jf7Table td{display:block;width:100%;box-sizing:border-box}'+
'.jf7Workspace .jf7Table thead{display:none}.jf7Workspace .jf7Table td{margin-bottom:10px;border-radius:10px}.jf7Workspace .jf7CellLabel{display:block;font-weight:700;color:#1b457b;margin:2px 0 8px}'+
'.jf7Workspace .jf7Table textarea{min-height:120px}.jf7Workspace .jf7Sources{min-width:760px}'+
'.jf7Workspace .jf7Part{padding:8px}.jf7Workspace .grid4{grid-template-columns:minmax(0,1fr) !important}'+
'}</style>';
function putState(ctx,d){ctx.saveState({artifacts:{industryCompanyTableV1:structuredClone(d)}});}
function transferToLegacy(ctx,d){
  // Explicit finalization only. Append or update *our own* tagged records, never existing student records.
  const s=ctx.getState(),old=s.artifacts?.industryCompany||{};
  const industries=[...(old.industries||[])],companies=[...(old.companies||[])];
  const targetIndustries=[...(old.targetIndustries||[])],targetCompanies=[...(old.targetCompanies||[])];
  const origTarget=activeTargetJobs(s)[0]||{};
  const industryId=d.syncedIndustryId||('jf7-table-ind-'+Date.now());
  const companyId=d.syncedCompanyId||('jf7-table-co-'+Date.now());
  const verified=kind=>Object.values(d[kind].fields||{}).some(Boolean)&&Object.values(d[kind].fields||{}).filter(Boolean).every(v=>sourceStatus(v,d[kind])==='학생 원문 대조 완료');
  const first=kind=>(d[kind].sources||[]).find(x=>validUrl(x.url))||{};
  const i={id:industryId,generatedBy:'step7-table-v1',name:d.target.industry,jobId:origTarget.id||'',job:d.target.job,
    business:[d.industry.fields.policy,d.industry.fields.economy,d.industry.fields.society,d.industry.fields.technology].filter(Boolean).join('\n'),
    change:[d.industry.fields.opportunity,d.industry.fields.threat].filter(Boolean).join('\n'),
    jobLink:[d.industry.fields.rivalry,d.industry.fields.entrants,d.industry.fields.buyers,d.industry.fields.substitutes,d.industry.fields.growth].filter(Boolean).join('\n'),
    source:[first('industry').issuer,first('industry').title].filter(Boolean).join(' · '),url:first('industry').url||'',
    factCheck:verified('industry')?'원문 대조 완료':'확인 필요',tableV1:true};
  if(d.target.industry.trim()){
    const ix=industries.findIndex(x=>x.id===industryId);
    if(ix>=0 && industries[ix]?.generatedBy==='step7-table-v1')industries[ix]=i;
    else if(ix<0)industries.push(i);
    if(!targetIndustries.includes(industryId)&&targetIndustries.length<3)targetIndustries.push(industryId);
    d.syncedIndustryId=industryId;
  }
  const c={id:companyId,generatedBy:'step7-table-v1',name:d.target.company,jobId:origTarget.id||'',job:d.target.job,
    industryId:d.syncedIndustryId||'',industry:d.target.industry,
    business:[d.company.fields.productStrength,d.company.fields.productWeakness,d.company.fields.customer].filter(Boolean).join('\n'),
    direction:[d.company.fields.futureGrowth,d.company.fields.futureExpansion].filter(Boolean).join('\n'),
    role:d.target.job,signals:d.target.jd,
    source:[first('company').issuer,first('company').title].filter(Boolean).join(' · '),url:first('company').url||'',
    factCheck:verified('company')?'원문 대조 완료':'확인 필요',
    unknown:Object.values(d.company.fields).some(v=>sourceStatus(v,d.company).includes('필요'))?'일부 출처 확인 필요':'',tableV1:true};
  if(d.target.company.trim()){
    const ix=companies.findIndex(x=>x.id===companyId);
    if(ix>=0 && companies[ix]?.generatedBy==='step7-table-v1')companies[ix]=c;
    else if(ix<0)companies.push(c);
    if(!targetCompanies.includes(companyId)&&targetCompanies.length<3)targetCompanies.push(companyId);
    d.syncedCompanyId=companyId;
  }
  ctx.saveState({artifacts:{industryCompanyTableV1:structuredClone(d),industryCompany:{...old,industries,companies,targetIndustries,targetCompanies}}});
}
export function renderInjeStep7Tables(ctx,openLegacy){
  const s=ctx.getState(),original=s.artifacts?.industryCompanyTableV1||null,d=blank();
  const prior=earlier(s);
  Object.assign(d.target,prior);
  if(original&&original.version===1){
    d.target={...d.target,...(original.target||{})};
    for(const k of ['industry','company'])d[k]={fields:{...fieldsOf(k),...(original[k]?.fields||{})},sources:structuredClone(original[k]?.sources||[])};
    d.syncedIndustryId=original.syncedIndustryId||'';d.syncedCompanyId=original.syncedCompanyId||'';
  }
  const root=document.getElementById('stepRoot');
  root.innerHTML='<section class="card jf7Workspace jobfitReadable">'+STYLE+
    '<div class="sectionHead"><div><div class="kicker">STEP 7 · INDUSTRY & COMPANY ANALYSIS</div><h2>내가 지원할 산업과 기업 이해하기</h2>'+
    '<p>앞 단계 데이터를 불러오거나 새로 입력한 뒤, AI 분석 결과를 표에 한 번만 반영합니다. 모든 칸을 직접 수정할 수 있습니다.</p></div></div>'+
    '<div class="block"><h3>01. 기본 정보 확인</h3><p class="help">기존 데이터는 읽어오기만 합니다. 직접 수정해도 STEP 1~6의 원본은 바뀌지 않습니다.</p>'+
    '<div class="grid4 jf7Target">'+[['major','전공'],['job','목표 직무'],['industry','관심 산업'],['company','분석 기업·기관'],['jd','선택한 채용공고']].map(([k,label])=>
       '<div class="field"><label for="jf7-'+k+'">'+label+'</label><input id="jf7-'+k+'" class="input" data-target="'+k+'" value="'+esc(d.target[k])+'" placeholder="'+label+'을 입력하세요"></div>').join('')+'</div>'+
    '<div class="actions"><button id="jf7LoadEarlier" type="button" class="btn outline">앞 STEP 정보 불러오기</button>'+
    '<button id="jf7Manual" type="button" class="btn outline">새 목표 직접 입력</button></div>'+
    '<p class="help" id="jf7Missing">정보가 부족한 경우 프롬프트가 필요한 질문을 먼저 하도록 안내합니다.</p></div>'+
    renderPart('industry',d)+renderPart('company',d)+
    '<div class="actions"><button class="btn primary" id="jf7Finish" type="button">STEP 7 표 저장 · STEP 8 연계</button>'+
    '<button class="btn secondary" id="jf7Next" type="button">STEP 8 Resume Lab →</button>'+
    '<button class="btn outline" id="jf7Legacy" type="button">이전 산업·기업분석 기록 보기</button></div>'+
    '<div class="status" id="jf7Saved">입력 내용은 이 브라우저에 자동 저장됩니다.</div></section>';
  const q=id=>root.querySelector('#'+id);
  function announce(kind,msg){const el=root.querySelector('[data-feedback="'+kind+'"]');if(el)el.textContent=msg;}
  function updateHints(kind){
    root.querySelectorAll('[data-status^="'+kind+'-"]').forEach(el=>{
      const key=el.dataset.status.slice(kind.length+1);
      el.textContent=sourceStatus(d[kind].fields[key],d[kind]);
      const ids=refs(d[kind].fields[key]), links=ids.map(id=>d[kind].sources.find(x=>x.id===id)).filter(x=>x&&validUrl(x.url));
      links.forEach(x=>{const a=document.createElement('a');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · '+x.id+' 원문';el.append(a)});
    });
    announce(kind,statusHtml(kind,d));
  }
  function persist(message){putState(ctx,d);if(message)q('jf7Saved').textContent=message;}
  const targetInputs=[...root.querySelectorAll('[data-target]')];
  function setMissing(){
    const miss=[['job','목표 직무'],['industry','관심 산업'],['company','분석할 기업·기관']].filter(([k])=>!d.target[k].trim()).map(x=>x[1]);
    q('jf7Missing').textContent=miss.length?'추가 질문 대상: '+miss.join(' · ')+' (AI가 필요한 내용을 질문하도록 프롬프트에 반영됨)':'기본 정보 확인됨. 원문 조사에서 추가 정보가 필요할 때만 AI가 질문합니다.';
  }
  targetInputs.forEach(el=>el.addEventListener('input',()=>{d.target[el.dataset.target]=el.value;persist();setMissing()}));
  q('jf7LoadEarlier').addEventListener('click',()=>{
    const now=earlier(ctx.getState());let count=0;
    for(const el of targetInputs){const k=el.dataset.target;if(!d.target[k].trim()&&now[k]){el.value=d.target[k]=now[k];count++;}}
    persist('앞 단계 정보 '+count+'개를 빈칸에 불러왔습니다. 기존 입력은 유지했습니다.');setMissing();
  });
  q('jf7Manual').addEventListener('click',()=>{
    if(!window.confirm('기본 정보 5칸만 비우고 새 목표를 직접 입력할까요? 분석 표와 앞 STEP 데이터는 그대로 둡니다.'))return;
    targetInputs.forEach(el=>{el.value='';d.target[el.dataset.target]='';});
    persist('기본 정보만 새로 입력할 수 있습니다. 기존 표는 유지됩니다.');setMissing();q('jf7-job').focus();
  });
  root.querySelectorAll('[data-field]').forEach(el=>{
    el.addEventListener('input',()=>{d[el.dataset.kind].fields[el.dataset.field]=el.value;persist();updateHints(el.dataset.kind)});
    el.addEventListener('blur',()=>{const v=bullets(el.value);if(v!==el.value){el.value=v;d[el.dataset.kind].fields[el.dataset.field]=v;persist();updateHints(el.dataset.kind)}});
  });
  root.querySelectorAll('[data-source]').forEach(el=>el.addEventListener('input',()=>{
    const kind=el.dataset.kind,id=el.dataset.source,k=el.dataset.sourceKey;
    let row=d[kind].sources.find(x=>x.id===id);
    if(!row){row={id,issuer:'',title:'',published:'',url:'',checked:false};d[kind].sources.push(row);}
    row[k]=el.value;row.checked=false;
    const checked=root.querySelector('[data-verified="'+id+'"][data-kind="'+kind+'"]');if(checked)checked.checked=false;
    const open=root.querySelector('[data-open="'+kind+'-'+id+'"]');
    if(open)open.textContent='변경됨 · 다시 확인 필요';
    persist();updateHints(kind);
  }));
  root.querySelectorAll('[data-verified]').forEach(el=>el.addEventListener('change',()=>{
    const kind=el.dataset.kind,id=el.dataset.verified,row=d[kind].sources.find(x=>x.id===id);
    if(!row||!validUrl(row.url)){el.checked=false;ctx.toast('유효한 원문 URL을 먼저 입력하세요.');return;}
    row.checked=el.checked;persist();updateHints(kind);
  }));
  root.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',async()=>{
    const t=makePrompt(b.dataset.prompt,d);
    try{await navigator.clipboard.writeText(t);ctx.toast('분석 프롬프트를 복사했습니다.')}catch{const pad=q('jf7Import-'+b.dataset.prompt);pad.value=t;pad.select();ctx.toast('복사가 안 되어 입력칸에 표시했습니다. 직접 복사해 사용하세요.');}
  }));
  root.querySelectorAll('[data-fact]').forEach(b=>b.addEventListener('click',async()=>{
    const kind=b.dataset.fact,t='다음 '+(kind==='industry'?'산업':'기업')+' 분석표를 공식 1차 자료로 팩트체크해 주세요.\n'+makePrompt(kind,d)+
      '\n[현재 표 내용]\n'+FIELD_MAP[kind].map(([k])=>'['+k+']\n'+(d[kind].fields[k]||'확인 필요')).join('\n')+
      '\n[현재 출처]\n'+(d[kind].sources||[]).map(x=>'['+x.id+'] '+[x.issuer,x.title,x.published,x.url].join(' | ')).join('\n')+
      '\n오류를 바로잡고 전체 [출력 형식]에 맞춰 답하세요. 실제 원문으로 확인하지 못했다면 확인 필요로 남기고 URL을 지어내지 마세요.';
    try{await navigator.clipboard.writeText(t);ctx.toast('팩트체크 프롬프트를 복사했습니다.')}catch{ctx.toast('복사 실패. 브라우저의 클립보드 권한을 확인하세요.')}
  }));
  root.querySelectorAll('.jf7Paste textarea').forEach(el=>el.addEventListener('input',()=>{
    const kind=el.id.endsWith('industry')?'industry':'company',text=el.value,p=parseTableAi(kind,text);
    if(!Object.keys(p.fields).length)return;
    let applied=0,protectedCount=0;
    for(const [key,value] of Object.entries(p.fields)){
      if(!value.trim())continue;
      const cell=q(kind+'-'+key);
      if(!cell)continue;
      if(d[kind].fields[key]?.trim()){protectedCount++;continue;}
      cell.value=d[kind].fields[key]=bullets(value);applied++;
    }
    for(const src of p.sources){
      const old=d[kind].sources.find(x=>x.id===src.id);
      if(!old){d[kind].sources.push(src);}
      else if(!old.checked && !old.url && !old.title)Object.assign(old,src);
    }
    // The original AI response is not duplicated in a second preview or saved field.
    el.value='';
    root.querySelectorAll('[data-kind="'+kind+'"][data-source]').forEach(input=>{
      const row=d[kind].sources.find(x=>x.id===input.dataset.source);
      if(row){input.value=row[input.dataset.sourceKey]||'';const chk=root.querySelector('[data-kind="'+kind+'"][data-verified="'+row.id+'"]');if(chk)chk.checked=!!row.checked;}
    });
    persist('AI 내용이 표에 반영되었습니다. 원문 대조 전에는 검증 완료로 표시되지 않습니다.');
    updateHints(kind);
    announce(kind,applied+'개 칸 반영'+(protectedCount?' · 학생이 작성한 '+protectedCount+'개 칸 보호':'')+' · 자료는 원문 확인 필요');
  }));
  q('jf7Finish').addEventListener('click',()=>{
    if(!d.target.job.trim()||!d.target.industry.trim()){ctx.toast('목표 직무와 관심 산업을 입력하세요.');return;}
    transferToLegacy(ctx,d);
    q('jf7Saved').textContent='STEP 7 표와 기존 STEP 8 연계 데이터에 저장했습니다. 이전 학생 기록은 유지했습니다.';
    ctx.toast('STEP 7 저장 완료');
  });
  q('jf7Next').addEventListener('click',()=>{
    if(!d.target.job.trim()||!d.target.industry.trim()){ctx.toast('목표 직무와 관심 산업을 입력하세요.');return;}
    transferToLegacy(ctx,d);ctx.navigate(9);
  });
  q('jf7Legacy').addEventListener('click',()=>{if(typeof openLegacy==='function')openLegacy()});
  setMissing();updateHints('industry');updateHints('company');
}

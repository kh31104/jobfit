// INJE STEP 7 table schema. Additive fields only; existing saved records remain readable.
const p=(key,label,hint)=>({key,label,hint});
export const INDUSTRY_GROUPS=[
 {title:'PEST · 산업환경 분석',subtitle:'정책·경제·사회·기술 변화 중 선택 직무 관련 사실을 기록합니다.',columns:4,fields:[
  p('pestPolicy','Policy · 정책/법규','• 정책·법규 변화와 시행일\n• 직무 관련성 [출처①]'),
  p('pestEconomy','Economy · 거시/미시경제','• 경기·투자·수요 변화\n• 직무 관련성 [출처②]'),
  p('pestSociety','Society · 사회/문화','• 인구·소비·가치관 변화\n• 직무 관련성 [출처③]'),
  p('pestTechnology','Technology · 기술','• AI·자동화·기술 변화\n• 직무 관련성 [출처④]')
 ]},
 {title:'Opportunity · 기회요인',subtitle:'PEST에서 확인된 변화 중 산업과 Target Job에 기회가 되는 내용을 선별합니다.',columns:1,fields:[
  p('opportunity','기회요인 · 근거와 직무 영향','• 어떤 변화인가?\n• 누구에게 어떤 기회인가?\n• 확인 근거 [출처①]')
 ]},
 {title:'Threat · 산업 위험요인',subtitle:'경쟁구조와 성장 위험을 구분합니다. 확인되지 않은 위험은 가설로 표시합니다.',columns:5,fields:[
  p('competitionRisk','1. 산업 내 경쟁 Risk','• 경쟁강도와 독과점 여부\n• 근거 [출처①]'),
  p('entrantRisk','2. 잠재적 경쟁 Risk','• 신규 진입 가능성과 장벽\n• 근거 [출처②]'),
  p('buyerRisk','3. 구매자·공급자 Risk','• 구매자·공급자 교섭력\n• 근거 [출처③]'),
  p('substituteRisk','4. 대체재 Risk','• 대체 기술·제품·서비스\n• 근거 [출처④]'),
  p('growthRisk','5. 성장성 Risk','• 수요·시장 확장/축소 조건\n• 근거 [출처⑤]')
 ]}
];
export const COMPANY_GROUPS=[
 {title:'기업분석 · 5가지 관점',subtitle:'기업·기관 유형에 따라 재무정보 공개 범위가 다릅니다. 미공개 정보는 추정하지 않습니다.',columns:5,fields:[
  p('productStrength','Product · 상품/서비스 강점','• 핵심 제품·서비스\n• 경쟁우위 [출처①]'),
  p('customerProfile','Customer · 주요 고객','• 고객층·구매 특징\n• 공식 근거 [출처②]'),
  p('financePerformance','Financial state · 재무상태','• 매출·영업이익·순이익\n• 기준연도·단위 [출처③]'),
  p('competitorStrategy','Competitor · 경쟁사','• 경쟁사·차별화 전략\n• 공식 근거 [출처④]'),
  p('futureGrowth','Future direction · 미래방향','• 성장동력·공식 발표\n• 연도 [출처⑤]')
 ]},
 {title:'추가 확인 · 약점과 향후 전략',subtitle:'상품 약점·재무비율·진입장벽·신규 시장을 확인합니다.',columns:4,fields:[
  p('productWeakness','상품/서비스 약점','• 검증된 약점 또는 확인 필요'),
  p('financeRatios','재무비율·변화','• 주요 지표 전년 비교\n• 기준연도 [출처③]'),
  p('entryAdvantage','진입장벽·경쟁우위','• 진입장벽과 방어 전략\n• 근거 [출처④]'),
  p('newMarkets','신규 진출 시장','• 지역·고객·제품군 확장\n• 근거 [출처⑤]')
 ]},
 {title:'SWOT · 기업분석과 산업분석 연결',subtitle:'S·W는 기업 내부 자료, O·T는 산업환경 자료로 근거를 구분합니다.',columns:4,fields:[
  p('swotStrength','Strength · 강점','• 내부 강점 [출처①]'),
  p('swotWeakness','Weakness · 약점','• 내부 약점 [출처②]'),
  p('swotOpportunity','Opportunity · 기회','• 산업 기회 [산업 출처①]'),
  p('swotThreat','Threat · 위협','• 산업 위협 [산업 출처②]')
 ]}
];
export const TABLE_CSS=[
'<style>',
'.industryCompanyInje .jfAnalysisTable{margin:16px 0 20px}',
'.industryCompanyInje .jfAnalysisTable h4{margin:0 0 6px;font-size:17px;line-height:1.5}',
'.industryCompanyInje .jfAnalysisTable .help{margin:0 0 10px}',
'.industryCompanyInje .jfTableScroll{overflow-x:auto;border:1px solid #dbe6f4;border-radius:12px;background:#fff}',
'.industryCompanyInje .jfTableGrid{display:grid;grid-template-columns:repeat(var(--jf-cols),minmax(155px,1fr));min-width:calc(var(--jf-cols) * 155px)}',
'.industryCompanyInje .jfTableCell{min-width:0;border-right:1px solid #dbe6f4}',
'.industryCompanyInje .jfTableCell:last-child{border-right:0}',
'.industryCompanyInje .jfTableCell label{display:block;min-height:64px;padding:12px 10px;background:#b7d6ff;color:#172b49;font-weight:750;line-height:1.5;overflow-wrap:anywhere}',
'.industryCompanyInje .jfTableCell textarea{display:block;width:100%;min-height:145px;padding:13px;border:0;border-top:1px solid #dbe6f4;border-radius:0;background:#fff;line-height:1.7;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere;resize:vertical;box-sizing:border-box}',
'.industryCompanyInje .jfTableCell textarea:focus{outline:2px solid #4d84ee;outline-offset:-2px}',
'.industryCompanyInje .jfSavedContent{padding:12px;min-height:75px;font-size:14px;line-height:1.75;overflow-wrap:anywhere}',
'.industryCompanyInje .jfSavedBullet{white-space:pre-wrap;margin-bottom:7px}',
'.industryCompanyInje .jfSourcesField textarea{width:100%;min-height:125px;line-height:1.75;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere}',
'.industryCompanyInje .jfResearchInputs{padding:14px;margin:12px 0;background:#f4f8ff;border:1px solid #dce7f6;border-radius:12px}',
'.industryCompanyInje .jfRecordLinks{line-height:1.75;overflow-wrap:anywhere}',
'.industryCompanyInje .jfRecordLinks a{display:inline-block;margin-right:12px}',
'@media(max-width:760px){.industryCompanyInje .jfTableGrid{display:block;min-width:0}.industryCompanyInje .jfTableCell{border-right:0;border-bottom:1px solid #dbe6f4}.industryCompanyInje .jfTableCell:last-child{border-bottom:0}.industryCompanyInje .jfTableCell label{min-height:auto;padding:9px 12px}.industryCompanyInje .jfTableCell textarea{min-height:100px}}',
'</style>'
].join('');
export function getTableFields(kind){return (kind==='industry'?INDUSTRY_GROUPS:COMPANY_GROUPS).flatMap(g=>g.fields);}
export function tableFieldIds(kind){return Object.fromEntries(getTableFields(kind).map(f=>[f.key,kind+f.key.charAt(0).toUpperCase()+f.key.slice(1)]));}
function htmlEsc(value){return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function renderAnalysisTable(kind){
 const groups=kind==='industry'?INDUSTRY_GROUPS:COMPANY_GROUPS;
 return groups.map(group=>'<section class="jfAnalysisTable"><h4>'+htmlEsc(group.title)+'</h4><p class="help">'+htmlEsc(group.subtitle)+'</p><div class="jfTableScroll"><div class="jfTableGrid" style="--jf-cols:'+group.columns+'">'+group.fields.map(f=>'<div class="jfTableCell"><label for="'+kind+f.key.charAt(0).toUpperCase()+f.key.slice(1)+'">'+htmlEsc(f.label)+'</label><textarea id="'+kind+f.key.charAt(0).toUpperCase()+f.key.slice(1)+'" rows="5" placeholder="'+htmlEsc(f.hint)+'"></textarea></div>').join('')+'</div></div></section>').join('')+
 '<div class="field jfSourcesField"><label for="'+kind+'Sources">출처 목록 · 학생 교차검증용</label><textarea id="'+kind+'Sources" placeholder="• [출처①] 자료명 | 발행기관 | 발행일 | https://원문주소&#10;• [출처②] 자료명 | 발행기관 | 발행일 | https://원문주소&#10;• 확인 못한 항목: 확인 필요"></textarea><p class="help">표의 각 주장 끝에 [출처①]처럼 번호를 붙이고, 이 목록에서 실제 원문을 확인하세요. URL이 없는 주장은 확인 필요로 남깁니다.</p></div>';
}
// Saved results use the exact same grid as the editor. Do not mutate record data.
export function renderSavedTable(kind,record,escapeHtml){
 const groups=kind==='industry'?INDUSTRY_GROUPS:COMPANY_GROUPS;
 const esc=escapeHtml||htmlEsc;
 return groups.filter(g=>g.fields.some(f=>String(record[f.key]||'').trim())).map(group=>
 '<section class="jfAnalysisTable jfSavedTable"><h4>'+esc(group.title)+'</h4><div class="jfTableScroll"><div class="jfTableGrid" style="--jf-cols:'+group.columns+'">'+
 group.fields.map(f=>'<div class="jfTableCell"><label>'+esc(f.label)+'</label><div class="jfSavedContent">'+
 (String(record[f.key]||'').trim()?String(record[f.key]).split(/\\n/).filter(Boolean).map(x=>'<div class="jfSavedBullet">'+esc(/^[•\\-]/.test(x.trim())?x.trim():'• '+x.trim())+'</div>').join(''):'<span class="muted">확인 필요</span>')+
 '</div></div>').join('')+'</div></div></section>').join('');
}
export function tablePromptLines(kind){
 const groups=kind==='industry'?INDUSTRY_GROUPS:COMPANY_GROUPS;
 const rows=groups.flatMap(g=>['', ...g.fields.map(f=>'['+f.label+']\n• 공식 근거가 있는 핵심 사실 1~3개와 Target Job 관련성. 문장 끝 [출처①] 등 출처번호 표기. 근거 없으면 확인 필요')]);
 return [...rows,'','[출처 목록]','• [출처①] 실제 자료명 | 발행기관 | 발행일(YYYY-MM-DD) | 실제 원문 URL','• 주장마다 출처번호 연결, 임의 URL·발행일 금지, 확인 불가이면 확인 필요',''];
}

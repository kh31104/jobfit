// Pure parsers for STEP 7. AI output is an unverified draft, never a fact-checked record.
const trim=s=>String(s??'').trim();
const normalize=s=>trim(s).replace(/^[\s#>*•\-·]+/,'').replace(/[\[\]【】*#]/g,'').replace(/[\s_:：·\-\/()]+/g,'').toLowerCase();
const strip=s=>trim(s).replace(/^\s*(?:[-•*·]|\d+[.)])\s*/,'');
const urls=s=>trim(s).match(/https?:\/\/[^\s<>()[\]"']+/gi)||[];
function matchKey(key, aliases){
  const norm=normalize(key);
  return Object.entries(aliases).find(([,variants])=>variants.some(a=>normalize(a)===norm))?.[0]||'';
}
const industryKeys={
 name:['산업명','산업 이름','관심 산업'],
 workplaces:['근무처 유형','일할 수 있는 곳','내 직무로 일할 수 있는 곳','직무별 근무처','취업처 유형','근무처·조직 유형','어디에서 일할 수 있나'],
 employers:['대표 기관·기업군','대표 기관·기업','대표기관·기업군','대표 기관 및 기업군','대표 기업·기관','기관·기업군','대표 근무처','대표 기관'],
 tasks:['그곳에서 하는 일','근무처별 담당업무','근무처별 업무','기관 유형별 직무','근무처별 수행 업무'],
 entry:['진입·채용 경로','진입 경로','채용 경로','직무 진입 경로','채용·진입 경로','취업·임용 경로'],
 business:['산업 한 줄','산업 정의','산업 구조·주요 고객','산업구조','주요 고객·가치사슬','주요 고객','주요 기업','수익구조','가치사슬','산업 구조'],
 change:['최근 변화','산업 변화','PEST','PEST 분석','최근 산업 변화'],
 jobLink:['직무·채용 영향','내 직무에 미치는 영향','직무 영향','직무 변화','직무·채용영향'],
 difference:['다른 산업과의 차이·선택','다른 산업과의 차이','산업별 차이','선택 근거'],
 sourceType:['출처 유형','자료 유형'],
 source:['확인 자료','확인 출처','자료명','출처 자료','근거 자료','자료 출처'],
 url:['원문 URL','출처 URL','산업 원문 URL'],
 checkedAt:['확인일','확인 날짜','확인 기준일']
};
const companyKeys={
 name:['기업명','회사명'],
 type:['기업유형','기업 유형','기업 규모'],
 industry:['산업명','연결 산업','관심 산업'],
 business:['Business · Customer','Business / Customer','Business & Customer','사업·고객','주요 사업·고객','사업·고객 분석'],
 direction:['Strategy','기업 전략','사업 방향','최근 방향','전략'],
 role:['Job Link','직무 연결','직무 관련성','직무 역할'],
 signals:['Hiring Signal','Hiring Signals','채용 역량신호','채용 신호','직무 요구조건'],
 source:['기업 공식자료','기업 자료명','기업 공식자료명','사업보고서','확인 자료'],
 url:['기업 공식자료 URL','기업자료 URL','기업 URL','사업보고서 URL','공식 홈페이지 URL','공식자료 URL'],
 jobSource:['채용·직무 자료','채용 자료명','채용·직무소개 자료'],
 jobUrl:['채용·직무 원문 URL','채용공고 URL','채용 URL','직무소개 URL','채용·직무 URL'],
 hiringEvidence:['채용 근거','채용상태','모집상태','공고 상태'],
 checkedAt:['확인일','확인 날짜'],
 why:['내가 관심을 두는 이유·선택','선택 이유','관심 이유'],
 unknown:['확인 필요','확인되지 않은 사항','추가 확인 사항','추가 확인']
};
function parseSections(raw,aliases){
  const out={};let key='';let seen=0;
  for(const src of trim(raw).replace(/\r/g,'').split('\n')){
    const line=trim(src);if(!line)continue;
    const section=line.match(/^\s{0,5}(?:#{1,5}\s*)?[\[【]([^\]】]+)[\]】]\s*(.*)$/);
    if(section){
      const mapped=matchKey(section[1],aliases);
      if(mapped){key=mapped;seen++;if(section[2])out[key]=[out[key],strip(section[2])].filter(Boolean).join('\n');continue;}
      key='';continue;
    }
    const field=line.match(/^\s*(?:[-*•·]\s*)?([^:：]{2,45})\s*[:：]\s*(.*)$/);
    if(field){
      const mapped=matchKey(field[1],aliases);
      if(mapped){key=mapped;seen++;if(field[2])out[key]=[out[key],trim(field[2])].filter(Boolean).join('\n');continue;}
    }
    if(key)out[key]=[out[key],strip(line)].filter(Boolean).join('\n');
  }
  return {fields:out,recognized:seen};
}
function cleanOne(s){return trim(s).split('\n')[0].replace(/^[-•\s]+/,'').trim();}
function pickUrl(s){return urls(s)[0]||'';}
function assembleIndustry(raw){
  const parsed=parseSections(raw,industryKeys),f=parsed.fields;
  const out={...f};
  for(const k of ['name','checkedAt','sourceType'])if(out[k])out[k]=cleanOne(out[k]);
  if(f.url)out.url=pickUrl(f.url);
  if(f.source){const u=pickUrl(f.source);if(u&&!out.url)out.url=u;}
  // Do not invent source names, dates, links, or verification status.
  return {fields:out,recognized:parsed.recognized,unparsed:!parsed.recognized};
}
export function parseIndustryAi(raw){return assembleIndustry(raw);}
export function parseCompanyAi(raw){
  const text=trim(raw).replace(/\r/g,'');
  if(!text)return {companies:[],recognized:0};
  // AI can return [기업 1], [기업 2], ... or a single company's labeled fields.
  const chunks=text.split(/(?:^|\n)\s*(?:#{1,5}\s*)?[\[【]\s*기업\s*\d+\s*[\]】]\s*/m).filter(Boolean);
  const companies=[];let recognized=0;
  for(const chunk of chunks){
    const {fields,recognized:n}=parseSections(chunk,companyKeys);if(!n)continue;
    recognized+=n;const f={...fields};
    for(const k of ['name','type','industry','hiringEvidence','checkedAt','source','jobSource'])if(f[k])f[k]=cleanOne(f[k]);
    if(f.url)f.url=pickUrl(f.url);
    if(f.jobUrl)f.jobUrl=pickUrl(f.jobUrl);
    companies.push(f);
  }
  return {companies:companies.slice(0,5),recognized};
}
export function isHttpUrl(value){
  if(!trim(value))return false;
  try{const u=new URL(trim(value));return ['https:','http:'].includes(u.protocol)&&!!u.hostname;}catch{return false;}
}

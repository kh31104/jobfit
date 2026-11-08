// Professor pilot: conservative source selection against three VERIFIED public CSV files.
// These are candidate matches, not confirmed sector trends, job openings or eligibility.
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ').slice(0,70);
const matches=(s,re)=>re.test(s);
export function industryJobPlan(industry,targetJob=''){
 const name=norm(industry), job=norm(targetJob);
 if(!name)return {sector:'missing',sectorLabel:'산업 미입력',suggestions:[],
  note:'관심 산업을 먼저 입력하세요. 산업이 정해지지 않으면 출처를 자동 추천하지 않습니다.',
  uncovered:'학생의 산업·직무와 데이터의 관련성이 확인되기 전에는 표에 자동 적용하지 않습니다.'};
 const edu=/교육|교육학|대학|학교|교원|교사|평생|에듀|edtech|학원|직업훈련|인재개발|hrd/.test(name);
 const manufacturing=/제조|반도체|디스플레이|자동차|조선|석유화학|화학|화공|기계|금속|철강|전자|배터리|이차전지|제약제조|의료기기|생산|항공우주|식품제조/.test(name);
 const technology=/인공지능|ai|소프트웨어|software|sw|it|정보통신|디지털|데이터|사이버|정보보안|클라우드|플랫폼|게임|컴퓨터/.test(name);
 const finance=/금융|은행|보험|증권|핀테크|카드사/.test(name);
 const publicSector=/공공|행정|공기업|지방공기업|지방자치|정부기관|연구기관/.test(name);
 const marketing=/유통|커머스|온라인쇼핑|소비재|마케팅|광고|브랜드|패션|리테일/.test(name);
 let sector='other',sectorLabel='미분류',suggestions=[],uncovered='';
 const add=(kind,keyword,level,why)=>suggestions.push({kind,keyword,level,why});
 if(edu){
   sector='education';sectorLabel='교육·대학·HRD';
   add('support','교육','보조 자료','중소기업 지원사업 목록에서 교육 관련 사업을 찾습니다. 일반 교육정책 전체를 대표하지 않습니다.');
   if(/ai|인공지능|디지털|에듀테크|edtech|컴퓨터|정보|기획|교수|강의|hrd/.test(name+' '+job))
     add('ethics','교육','조건부 자료','디지털윤리 자료 중 교육이 언급된 문서만 찾습니다. 교육산업의 시장통계로 사용하지 않습니다.');
   uncovered='교육부 교육통계·대학정보·평생교육 관련 원자료는 현재 3종에 포함되지 않습니다. 제조업 BSI는 추천하지 않습니다.';
 }else if(manufacturing){
   sector='manufacturing';sectorLabel='제조업';
   const keys=[['반도체','반도체'],['디스플레이','디스플레이'],['자동차','자동차'],['조선','조선'],['화학','화학'],['화공','화학'],['기계','기계'],['철강','철강'],['전자','전자'],['식품','식품']];
   const keyword=keys.find(([pattern])=>name.includes(pattern))?.[1]||'제조업전체';
   add('bsi',keyword,'직접 관련 통계','제조업 업종별 경기실사지수입니다. 현황·전망은 구분하고 채용 증가로 해석하지 않습니다.');
   if(/인력|채용|생산|품질|연구개발|공정|기술/.test(job))
     add('support','스마트공장','보조 자료','제조업 생산·기술 관련 지원사업 사례를 조회합니다. 선택한 기업·직무의 채용현황은 아닙니다.');
   uncovered='기업별 모집공고와 직무 요구사항은 별도 채용공고(JD)로 확인해야 합니다.';
 }else if(technology){
   sector='technology';sectorLabel='AI·SW·디지털';
   const ai=/ai|인공지능/.test(name+' '+job);
   add('ethics',ai?'인공지능':'디지털','보조 자료','AI·디지털 분야의 윤리·사회적 논의입니다. 시장규모·취업전망 자료는 아닙니다.');
   add('support',ai?'인공지능':'소프트웨어','보조 자료','중소기업 지원사업 중 관련 기술의 정책 지원 사례를 탐색합니다.');
   uncovered='SWSTAT 등의 산업 생산·종사자 수 통계는 이번 3개 연결 자료에 없습니다.';
 }else if(finance){
   sector='finance';sectorLabel='금융';
   add('support','금융','조건부 자료','금융 관련 지원사업이 있다면 정책 사례로만 활용합니다. 금융산업 전체 통계는 아닙니다.');
   uncovered='금융감독원·한국은행·금융위원회 산업통계 등은 아직 연결하지 않았습니다. 제조업 BSI는 제외합니다.';
 }else if(publicSector){
   sector='public';sectorLabel='공공·행정';
   add('support',/채용|인력|교육|hrd/.test(job)?'인력':'공공','조건부 자료','공공 또는 인력 관련 지원사업이 있을 때만 참고합니다. 공공기관 채용 데이터가 아닙니다.');
   uncovered='나라일터·잡알리오 및 공공기관 통계는 현재 공개 CSV 3종에 포함되지 않습니다.';
 }else if(marketing){
   sector='retail';sectorLabel='유통·마케팅·소비재';
   add('support',/마케팅|광고|브랜드/.test(name+' '+job)?'마케팅':'유통','조건부 자료','관련 중소기업 지원사업 사례만 찾습니다. 시장규모나 기업 채용수요로 해석하지 않습니다.');
   uncovered='유통업 매출·소비통계 및 개별 기업 JD는 별도 공식 원문이 필요합니다.';
 }else{
   sector='other';sectorLabel='기타 / 자료 연결 미확인';
   uncovered='현재 검증된 공개 CSV 3종과 이 산업의 직접적인 연결을 확인하지 못했습니다. 임의로 제조업 지표를 추천하지 않습니다.';
 }
 return {sector,sectorLabel,industry:name,targetJob:job,suggestions,note:'추천은 산업명·직무명에 따른 규칙 기반 후보 선별이며, 각 문서의 실제 관련성은 원문 검토가 필요합니다.',uncovered};
}
export function suggestedSource(plan,kind){
 return (plan?.suggestions||[]).find(s=>s.kind===kind)||null;
}

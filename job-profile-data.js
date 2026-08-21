/*
 * 직무 프로필 공식자료 검증 원칙
 * 1. 직무명·주요업무 → 고용24 / 커리어넷
 * 2. 관련 전공·학과 → 커리어넷 / 고용24
 * 3. Knowledge / Skill / Attitude → 대응 NCS가 명확한 경우 NCS
 * 4. competencyKeywords → 공식 직무정보 + NCS를 바탕으로 교육용 요약
 * 5. 임금·전망 → 기준연도와 공식 출처가 확인되는 경우에만 사용
 * 6. 특정 기업의 실제 요구사항 → STEP 8에 넣지 않고 STEP 9 실제 채용공고에서 확인
 * NCS와 정확히 대응되지 않는 현대 직무는 억지로 하나의 NCS 직무에 연결하지 않는다.
 * 공식 직업정보나 NCS가 직무군의 일부만 지원하면 supports에 해당 항목을 기록하되
 * verification은 summary를 유지한다. verified는 현재 항목 전체가 공식자료와 충분히
 * 일치한다고 검토자가 판단한 경우에만 사용한다.
 */
(function(){
 const dataVersion='1.0';
 const lastContentReview='';
 const profiles=[
  {role:'교육·HRD',aliases:['HRD','교육기획','인재개발','사내교육'],tasks:['교육 요구를 분석합니다.','학습 프로그램과 콘텐츠를 기획·운영합니다.','교육 효과를 평가하고 개선합니다.'],education:{majors:['교육학','심리학','경영학'],note:'전공 외에도 교육기획·운영 경험과 포트폴리오가 도움이 됩니다.'},knowledge:['교육설계','학습이론','조직·인재개발'],skills:['요구분석','프로그램 운영','강의·퍼실리테이션','성과분석'],attitudes:['학습지향','공감','피드백 수용'],competencyKeywords:['교육기획','요구분석','프로그램운영','의사소통','성과분석']},
  {role:'데이터·리서치',aliases:['데이터분석','데이터 분석가','리서처','시장조사'],tasks:['문제를 정의하고 필요한 데이터를 수집합니다.','데이터를 분석해 패턴과 의미를 찾습니다.','의사결정에 필요한 인사이트를 보고합니다.'],education:{majors:['통계학','수학','컴퓨터공학','사회과학'],note:'분석 기초와 함께 탐색하려는 산업의 도메인 지식이 도움이 됩니다.'},knowledge:['통계·조사방법','데이터 구조','산업·도메인 지식'],skills:['데이터 분석','리서치 설계','시각화·보고'],attitudes:['논리성','호기심','정확성'],competencyKeywords:['문제정의','데이터수집','분석','시각화','인사이트도출']},
  {role:'서비스·제품기획',aliases:['서비스기획','제품기획','PM','프로덕트매니저'],tasks:['고객과 시장의 문제를 발견합니다.','제품 목표와 요구사항·우선순위를 정합니다.','개발·디자인·운영 구성원과 실행을 조율합니다.'],education:{majors:['경영학','산업공학','컴퓨터공학','디자인'],note:'전공 제한보다 사용자 이해, 기획 산출물과 협업 경험을 함께 보는 경우가 많습니다.'},knowledge:['시장·고객 이해','제품개발 과정','비즈니스 모델'],skills:['문제정의','요구사항 작성','프로젝트 조율'],attitudes:['고객중심','전략적 사고','책임감'],competencyKeywords:['고객문제발견','제품전략','요구사항정의','우선순위','협업조율']},
  {role:'마케팅·콘텐츠',aliases:['마케팅','콘텐츠마케팅','브랜드마케팅','콘텐츠기획'],tasks:['고객과 시장을 분석합니다.','브랜드 메시지·콘텐츠·캠페인을 기획합니다.','채널별 성과를 측정하고 개선합니다.'],education:{majors:['경영학','광고홍보학','미디어학','문화콘텐츠학'],note:'관련 전공과 함께 콘텐츠·캠페인 포트폴리오가 도움이 됩니다.'},knowledge:['마케팅 원리','고객·브랜드 이해','미디어 채널'],skills:['콘텐츠 제작','캠페인 기획','성과분석'],attitudes:['창의성','고객관점','실행력'],competencyKeywords:['시장분석','콘텐츠기획','브랜딩','채널운영','성과분석']},
  {role:'UX·디자인',aliases:['UX디자인','UIUX','UI·UX 디자이너','프로덕트디자인'],tasks:['사용자의 행동과 요구를 조사합니다.','정보구조·화면·상호작용을 설계합니다.','프로토타입을 검증해 사용성을 개선합니다.'],education:{majors:['시각디자인','산업디자인','HCI','심리학'],note:'학력보다 문제해결 과정과 결과를 보여주는 포트폴리오가 중요한 경우가 많습니다.'},knowledge:['UX 원리','사용자 조사','디자인 시스템'],skills:['프로토타이핑','시각화','사용성 테스트'],attitudes:['공감','심미안','개선지향'],competencyKeywords:['사용자조사','정보구조','인터랙션설계','프로토타이핑','사용성평가']},
  {role:'전략·기획',aliases:['경영기획','사업기획','전략기획'],tasks:['조직의 목표와 환경을 분석합니다.','실행 가능한 전략과 계획을 수립합니다.','성과지표를 관리하고 의사결정을 지원합니다.'],education:{majors:['경영학','경제학','산업공학'],note:'산업 이해, 논리적 문서작성과 데이터 기반 문제해결 경험이 도움이 됩니다.'},knowledge:['경영·산업 이해','전략 프레임워크','재무 기초'],skills:['분석·문서화','문제 구조화','의사결정 지원'],attitudes:['통찰력','신중함','목표지향'],competencyKeywords:['환경분석','전략수립','사업계획','성과관리','의사결정지원']},
  {role:'프로젝트·운영관리',aliases:['프로젝트관리','PMO','운영관리','사업운영'],tasks:['프로젝트 목표·일정·자원을 계획합니다.','이해관계자와 업무를 조율합니다.','위험과 이슈를 관리해 결과물을 완수합니다.'],education:{majors:['경영학','산업공학','관련 산업 전공'],note:'산업별 업무지식과 실제 프로젝트 경험이 중요합니다.'},knowledge:['프로젝트 관리','업무 프로세스','위험관리'],skills:['일정·자원관리','협업 조율','문제해결'],attitudes:['책임감','추진력','적응력'],competencyKeywords:['목표관리','일정관리','자원관리','이해관계자조율','리스크관리']},
  {role:'HR·조직개발',aliases:['HR','인사','조직개발','채용'],tasks:['채용·육성·평가 등 인사제도를 운영합니다.','구성원과 조직의 문제를 분석합니다.','조직문화와 일하는 방식을 개선합니다.'],education:{majors:['경영학','심리학','교육학','법학'],note:'사람과 조직 문제를 다룬 경험 및 노동관계 기초지식이 도움이 됩니다.'},knowledge:['인사관리','조직행동','노동관계 기초'],skills:['면담·커뮤니케이션','제도 운영','데이터 정리'],attitudes:['공정성','공감','신뢰성'],competencyKeywords:['인사제도','채용운영','조직진단','커뮤니케이션','데이터관리']},
  {role:'영업·사업개발',aliases:['영업','B2B영업','사업개발','BD'],tasks:['고객과 시장의 기회를 발굴합니다.','제품·서비스를 제안하고 협상합니다.','고객 관계와 목표 성과를 관리합니다.'],education:{majors:['경영학','경제학','관련 산업 전공'],note:'전공보다 제품·산업 지식과 고객 대응 경험이 중요한 경우가 많습니다.'},knowledge:['제품·산업 지식','고객·시장 이해','계약 기초'],skills:['제안·협상','관계관리','목표관리'],attitudes:['도전성','회복탄력성','고객지향'],competencyKeywords:['고객발굴','제안','협상','관계관리','성과관리']},
  {role:'상담·코칭',aliases:['상담','코칭','커리어코칭','심리상담'],tasks:['상대의 상황과 목표를 이해합니다.','질문과 경청으로 문제와 자원을 탐색합니다.','변화 목표와 실행을 지원합니다.'],education:{majors:['상담학','심리학','교육학','사회복지학'],note:'활동 분야에 따라 공식 수련·자격 요건이 다르므로 반드시 별도 확인이 필요합니다.'},knowledge:['상담·코칭 이론','윤리·비밀보장','발달·심리 이해'],skills:['경청·질문','관계형성','피드백'],attitudes:['공감','인내','진정성'],competencyKeywords:['관계형성','경청','질문','목표설정','피드백']},
  {role:'R&D·연구',aliases:['R&D','연구개발','연구원'],tasks:['연구문제를 정의하고 자료와 선행연구를 검토합니다.','실험·조사·개발을 수행합니다.','결과를 분석해 보고서·논문·기술로 정리합니다.'],education:{majors:['탐색 분야 관련 이공계·인문사회 전공'],note:'분야에 따라 학위와 연구경험 요구가 크게 다릅니다.'},knowledge:['전공 전문지식','연구방법론','기술·산업 동향'],skills:['실험·조사설계','분석','연구문서 작성'],attitudes:['학구열','인내','정확성'],competencyKeywords:['문제정의','문헌조사','실험설계','분석','연구보고']},
  {role:'품질·컴플라이언스',aliases:['품질관리','QA','컴플라이언스','준법'],tasks:['품질·법규·내부 기준을 확인합니다.','위험과 부적합 원인을 분석합니다.','개선조치와 재발방지 체계를 운영합니다.'],education:{majors:['산업공학','법학','경영학','관련 기술 전공'],note:'산업별 법규와 품질규격 지식이 중요합니다.'},knowledge:['품질관리 체계','관련 법규·규정','위험관리'],skills:['감사·점검','원인분석','문서화'],attitudes:['공정성','신중성','책임감'],competencyKeywords:['기준관리','품질점검','리스크평가','원인분석','개선조치']},
  {role:'회계·재무·감사',aliases:['회계','재무','감사','재무회계'],tasks:['재무자료와 거래를 정확히 기록·검토합니다.','예산과 자금 흐름을 분석합니다.','내부통제와 보고의 신뢰성을 확인합니다.'],education:{majors:['회계학','경영학','경제학'],note:'세부 직무에 따라 관련 자격과 회계·세무 기준 지식이 도움이 됩니다.'},knowledge:['회계원리','재무관리','세무·내부통제 기초'],skills:['재무분석','결산·보고','정확한 문서처리'],attitudes:['정확성','윤리성','신중함'],competencyKeywords:['회계처리','재무분석','예산관리','내부통제','보고']},
  {role:'컨설팅',aliases:['컨설턴트','경영컨설팅','전략컨설팅'],tasks:['고객의 문제와 현황을 진단합니다.','자료를 분석해 해결방안을 설계합니다.','제안과 실행 변화를 지원합니다.'],education:{majors:['경영학','경제학','산업공학','관련 전문분야'],note:'분석력, 문서작성, 발표와 프로젝트 경험이 도움이 됩니다.'},knowledge:['문제해결 방법론','경영·산업 지식','조사방법'],skills:['문제 구조화','분석·리서치','제안·프레젠테이션'],attitudes:['학습민첩성','객관성','고객지향'],competencyKeywords:['문제진단','자료분석','해결안설계','보고서작성','프레젠테이션']},
  {role:'창업·신사업',aliases:['창업','신사업','신사업개발','벤처기획'],tasks:['새로운 고객문제와 사업기회를 찾습니다.','비즈니스 모델과 가설을 설계합니다.','작은 실험으로 시장성을 검증하고 사업을 실행합니다.'],education:{majors:['경영학','공학','디자인 등 사업 분야 관련 전공'],note:'전공보다 고객검증·실행·협업 경험이 중요할 수 있습니다.'},knowledge:['비즈니스 모델','시장·고객 이해','재무·투자 기초'],skills:['기회발굴','가설검증','자원확보·실행'],attitudes:['도전성','회복탄력성','주도성'],competencyKeywords:['기회발굴','비즈니스모델','고객검증','실험','실행']},
  {role:'공공·비영리',aliases:['공공기관','공공행정','비영리','NGO'],tasks:['공공문제와 이해관계자의 요구를 파악합니다.','사업·정책·서비스를 기획하고 운영합니다.','성과와 예산을 관리하고 공공가치를 설명합니다.'],education:{majors:['행정학','정책학','사회복지학','관련 사업 전공'],note:'기관과 직무에 따라 전공·자격·채용절차가 다릅니다.'},knowledge:['공공정책·행정','예산·사업관리','관련 법규'],skills:['사업기획·운영','이해관계자 소통','공문·보고'],attitudes:['공정성','책임감','사회기여'],competencyKeywords:['공공문제이해','사업기획','예산관리','행정처리','이해관계자소통']},
  {role:'고객경험·서비스',aliases:['고객경험','CX','고객서비스','CS'],tasks:['고객의 문의와 불편을 파악합니다.','서비스 접점과 응대 과정을 운영합니다.','고객 의견을 분석해 경험을 개선합니다.'],education:{majors:['경영학','소비자학','서비스 관련 전공'],note:'전공보다 고객응대·문제해결과 서비스 개선 경험을 보는 경우가 많습니다.'},knowledge:['고객경험 원리','서비스 프로세스','제품·서비스 지식'],skills:['상담·응대','문제해결','VOC 분석'],attitudes:['공감','친절','침착성'],competencyKeywords:['고객이해','상담응대','문제해결','VOC분석','서비스개선']},
  {role:'보건·복지',aliases:['보건','복지','사회복지','헬스케어 서비스'],tasks:['대상자의 건강·생활 욕구를 파악합니다.','지원·돌봄·연계 서비스를 제공합니다.','기록과 협업을 통해 서비스의 연속성을 관리합니다.'],education:{majors:['보건학','간호학','사회복지학','관련 치료·재활 전공'],note:'세부 직업에 따라 법정 면허·자격이 필요할 수 있습니다.'},knowledge:['보건·복지 제도','대상자 이해','윤리·안전'],skills:['상담·관찰','서비스 연계','기록·사례관리'],attitudes:['공감','책임감','인내'],competencyKeywords:['욕구파악','대상자지원','사례관리','협업연계','윤리안전']},
  {role:'공간·건축·설계',aliases:['건축설계','공간디자인','CAD설계','설계'],tasks:['사용 목적과 현장 조건을 분석합니다.','공간·구조·도면을 설계합니다.','법규·품질·시공 과정과 결과를 조율합니다.'],education:{majors:['건축학','건축공학','실내디자인','관련 공학'],note:'세부 직무에 따라 자격·도구·학위 요건이 다릅니다.'},knowledge:['공간·구조 원리','건축 법규','재료·시공 기초'],skills:['도면·모델링','공간기획','설계협업'],attitudes:['정확성','심미안','안전의식'],competencyKeywords:['요구분석','공간설계','도면작성','법규검토','협업조율']},
  {role:'스포츠·퍼포먼스',aliases:['스포츠','트레이너','퍼포먼스','생활체육'],tasks:['대상자의 신체 상태와 목표를 파악합니다.','운동·훈련 프로그램을 설계하고 지도합니다.','수행 결과와 안전을 점검합니다.'],education:{majors:['체육학','스포츠과학','운동처방 관련 전공'],note:'활동 분야에 따라 지도자 자격과 안전교육이 필요할 수 있습니다.'},knowledge:['운동생리·해부','훈련 원리','안전·부상예방'],skills:['동작 지도','프로그램 설계','수행평가'],attitudes:['활력','책임감','동기부여'],competencyKeywords:['상태평가','훈련설계','동작지도','안전관리','동기부여']},
  {role:'현장기술·생산',aliases:['생산기술','현장기술','생산관리','제조기술'],tasks:['생산 공정과 설비 상태를 확인합니다.','현장 문제의 원인을 찾아 개선합니다.','품질·안전·생산성을 관리합니다.'],education:{majors:['기계공학','전기전자공학','산업공학','관련 기술 전공'],note:'산업별 설비·공정 지식과 현장 자격 요구가 다릅니다.'},knowledge:['생산공정','설비·도면 기초','품질·안전 기준'],skills:['설비·도구 활용','공정개선','현장 문제해결'],attitudes:['안전의식','정확성','협업'],competencyKeywords:['공정이해','설비운영','문제해결','품질관리','안전관리']},
  {role:'음악·음향',aliases:['음악','음향','사운드','음악제작'],tasks:['음악·소리의 목적과 콘셉트를 설계합니다.','연주·녹음·편집·믹싱 등 제작을 수행합니다.','결과물을 검토하고 협업해 완성도를 높입니다.'],education:{majors:['음악','음향제작','미디어음악 관련 전공'],note:'학력보다 실기 능력과 포트폴리오가 중요한 분야가 많습니다.'},knowledge:['음악이론','음향 원리','저작권 기초'],skills:['연주·제작','녹음·편집','청각적 분석'],attitudes:['집중력','창의성','완성도 지향'],competencyKeywords:['콘셉트기획','음악제작','녹음편집','협업','품질검토']},
  {role:'미디어·공연',aliases:['미디어','공연기획','방송','영상콘텐츠'],tasks:['콘텐츠·공연의 목적과 콘셉트를 기획합니다.','제작 인력·일정·현장을 운영합니다.','관객 반응과 결과를 분석해 다음 기획에 반영합니다.'],education:{majors:['미디어학','공연예술학','문화콘텐츠학'],note:'기획·제작 포트폴리오와 현장 협업 경험이 도움이 됩니다.'},knowledge:['콘텐츠·공연 산업','제작 프로세스','저작권·안전 기초'],skills:['콘텐츠 기획','제작·현장운영','스토리텔링'],attitudes:['창의성','활력','적응력'],competencyKeywords:['콘셉트기획','제작운영','일정관리','현장대응','관객분석']},
  {role:'자연·환경·생명',aliases:['환경','생명과학','자연생태','환경연구'],tasks:['자연·생물·환경 현상을 관찰하고 조사합니다.','자료와 시료를 분류·분석합니다.','보전·관리·기술 적용 방안을 제안합니다.'],education:{majors:['환경공학','생명과학','생태학','농림·해양 관련 전공'],note:'연구·기술·공공 분야에 따라 학위와 자격 요구가 다릅니다.'},knowledge:['생태·생명과학','환경 정책·기준','조사방법'],skills:['현장조사','분류·분석','연구보고'],attitudes:['관찰력','정확성','지속가능성 지향'],competencyKeywords:['현장조사','관찰분류','환경분석','데이터해석','보전관리']}
 ];
 const officialReferences=[
  {name:'고용24 직업정보',publisher:'고용노동부·한국고용정보원',url:'https://www.work24.go.kr/',use:'개별 직업의 하는 일·교육·훈련·임금·전망 최신 확인'},
  {name:'커리어넷 직업정보',publisher:'교육부·한국직업능력연구원',url:'https://www.career.go.kr/',use:'대표 직업의 직업개요·관련 학과·취업현황·전망 확인'}
 ];
 const verificationBatches={
  1:['교육·HRD','데이터·리서치','서비스·제품기획','마케팅·콘텐츠','UX·디자인','전략·기획'],
  2:['프로젝트·운영관리','HR·조직개발','영업·사업개발','상담·코칭','R&D·연구','품질·컴플라이언스'],
  3:['회계·재무·감사','컨설팅','창업·신사업','공공·비영리','고객경험·서비스','보건·복지'],
  4:['공간·건축·설계','스포츠·퍼포먼스','현장기술·생산','음악·음향','미디어·공연','자연·환경·생명']
 };
 const batch1OccupationSources={
  '교육·HRD':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=462',matchedOccupation:'사이버교육운영자',supports:['tasks','education'],note:'교육·HRD 직무군 중 교육과정·프로그램 기획·운영·평가 및 교육 관련 전공 영역을 지원'}
  ],
  '데이터·리서치':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=10032',matchedOccupation:'빅 데이터 전문가',supports:['tasks','education','knowledge'],note:'데이터·리서치 직무군 중 데이터 수집·분석·시각화 및 데이터분석 관련 전공·지식 영역을 지원. 리서치 직무 전체를 의미하지 않음'}
  ],
  '마케팅·콘텐츠':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=1068',matchedOccupation:'마케팅전문가',supports:['tasks','education'],note:'시장·소비자 분석과 마케팅 전략 영역을 지원'},
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=232',matchedOccupation:'광고 및 홍보전문가',supports:['tasks','education'],note:'광고·홍보·콘텐츠 기획과 관련된 영역을 보완적으로 지원'}
  ],
  'UX·디자인':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=10003',matchedOccupation:'UX 디자인 컨설턴트',supports:['tasks','education'],note:'사용자 조사·이해, 사용자 중심 설계 및 UX 관련 전공 영역을 직접적으로 지원'}
  ],
  '전략·기획':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=202',matchedOccupation:'경영컨설턴트',supports:['tasks','education'],note:'기업 문제 분석·대책 수립·경영 자문 영역을 지원. 기업 내부 전략기획 직무 전체와 동일한 직무는 아님'}
  ]
 };
 const batch2OccupationSources={
  'HR·조직개발':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=1279',matchedOccupation:'헤드헌터',supports:['tasks'],note:'HR·조직개발 직무군 중 기업의 채용요구 파악, 인재 선정·평가·채용 영역을 부분적으로 지원'},
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=205',matchedOccupation:'노무사',supports:['tasks','education','knowledge'],note:'HR·조직개발 직무군 중 인사제도, 노무관리, HR컨설팅, 채용·교육 및 노동관계 영역을 부분적으로 지원. 조직개발 전체를 의미하지 않음'}
  ],
  '영업·사업개발':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=474',matchedOccupation:'아이티(IT)기술영업원',supports:['tasks','knowledge','skills','competencyKeywords'],note:'영업·사업개발 직무군 중 제품·서비스에 대한 전문지식 기반 고객 제안·판매·상담·협상 영역을 지원. 사업개발(BD) 전체를 의미하지 않음'}
  ],
  '상담·코칭':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=380',matchedOccupation:'상담전문가',supports:['tasks','education'],note:'상담·코칭 직무군 중 내담자 문제 파악, 상담, 심리검사, 변화 방향 탐색 및 상담 관련 전공 영역을 지원'},
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=408',matchedOccupation:'직업상담 및 취업알선원',supports:['tasks','education'],note:'상담·코칭 직무군 중 진로·경력개발상담, 직업정보 제공, 구직자 특성 파악 영역을 보완적으로 지원. 코칭 직무 전체를 의미하지 않음'}
  ],
  'R&D·연구':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=56',matchedOccupation:'기계공학 기술자·연구원',supports:['tasks','education'],note:'R&D·연구 직무군 중 이공계 연구·개발·설계 영역을 지원'},
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=203',matchedOccupation:'경제학연구원',supports:['tasks','education'],note:'R&D·연구 직무군 중 사회과학 분야 자료수집·이론 및 실증연구·분석·연구결과 제시 영역을 지원'}
  ],
  '품질·컴플라이언스':[
   {name:'커리어넷',url:'https://www.career.go.kr/cloud/m/job/view?seq=952',matchedOccupation:'화학공학기술자',supports:['tasks','knowledge','skills','competencyKeywords'],note:'품질·컴플라이언스 직무군 중 품질표준 확인, 품질통제, 품질관리 프로그램 운영 및 기준 설정 영역을 부분적으로 지원. 컴플라이언스·준법 영역의 근거는 아님'}
  ]
 };
 const batch1NcsSources={
  '교육·HRD':[
   {name:'NCS',url:'https://m.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20260420105501',matchedNcs:'기업교육(04030102)',supports:['tasks','knowledge','skills','attitudes','competencyKeywords'],note:'교육·HRD와 직접성이 높은 NCS. 이 URL은 NCS 공정채용에서 기업교육 능력단위 적용을 확인하기 위한 근거이며 K/S/A 문장 전체를 직접 검증한 것은 아님.'}
  ],
  '데이터·리서치':[
   {name:'NCS',url:'',matchedNcs:'빅데이터분석(20010105)',supports:['tasks','knowledge','skills','competencyKeywords'],note:'데이터·리서치 중 대규모 데이터 수집·처리·분석 영역과의 관련성을 기록. 검증된 구체적 URL은 아직 등록하지 않음.'},
   {name:'NCS',url:'https://www.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20260507104349',matchedNcs:'통계조사(02010303)',supports:['tasks','knowledge','skills','competencyKeywords'],note:'데이터·리서치 중 조사설계·자료처리·통계분석·정성조사 영역을 지원'}
  ],
  '마케팅·콘텐츠':[
   {name:'NCS',url:'https://pdms.ncs.go.kr/cdv/sch/pub/retrieveTracseDevRptSchDtl.do?schRptTy=NPDMS&schTracseReqstSeq=58969&schTracseSeq=52752',matchedNcs:'마케팅전략기획(02010301)',supports:['tasks','knowledge','skills','competencyKeywords'],note:'마케팅전략 계획수립, 시장환경분석, 신상품기획, 마케팅 성과관리 등 능력단위 확인'},
   {name:'NCS',url:'https://www.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20180725112201',matchedNcs:'PR/광고',supports:['tasks','knowledge','skills','competencyKeywords'],note:'마케팅·콘텐츠 중 PR·광고·홍보 영역을 지원'}
  ],
  'UX·디자인':[
   {name:'NCS',url:'https://www.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20191008165948',matchedNcs:'UI/UX엔지니어링',supports:['tasks','knowledge','skills','competencyKeywords'],note:'UI/UX 환경 분석, 계획수립, 요구분석, UI 아키텍처 설계, UI 디자인, 구현, 테스트, 가이드 제작 영역 확인'}
  ],
  '전략·기획':[
   {name:'NCS',url:'https://m.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20260729113657',matchedNcs:'경영기획(02010101)',supports:['tasks','knowledge','skills','attitudes','competencyKeywords'],note:'전략·기획 직무군의 사업환경 분석·계획 수립·신규사업 기획 영역을 직접적으로 지원'}
  ]
 };
 const batch1AttitudeRefinements={
  '교육·HRD':['지속적으로 교육방법과 직무지식을 학습하려는 태도','교육대상자의 요구와 관점을 존중하는 태도','교육 결과와 피드백을 반영해 개선하려는 태도'],
  '데이터·리서치':['분석 기준과 절차를 일관되게 적용하는 태도','필요한 자료와 정보를 적극적으로 탐색하는 태도','데이터와 분석결과의 정확성을 반복 확인하는 태도'],
  '마케팅·콘텐츠':['목표와 고객에 맞는 다양한 메시지와 대안을 탐색하는 태도','고객의 반응과 관점에서 결과를 점검하는 태도','일정과 집행기준을 관리하며 계획을 실행하는 태도'],
  'UX·디자인':['사용자 요구를 추측하지 않고 자료와 관찰을 통해 확인하려는 태도','UI 가이드와 일관성·사용성 기준을 준수하려는 태도','사용성 테스트와 피드백 결과를 반영해 지속적으로 개선하는 태도'],
  '전략·기획':['객관적 자료를 종합하여 시사점을 도출하려는 태도','의사결정 전에 근거와 위험요인을 충분히 검토하는 태도','계획과 성과지표를 지속적으로 점검하는 태도']
 };
 const batch1CompetencyKeywordRefinements={
  '교육·HRD':['인재개발전략','교육체계수립','교육과정설계','교육과정운영','교육성과평가'],
  '전략·기획':['사업환경분석','경영계획수립','신규사업기획','경영실적분석','경영리스크관리']
 };
 const allowedVerificationStatuses=['verified','ncs-based','summary','needs-review'];
 const allowedSourceSupports=['tasks','education','knowledge','skills','attitudes','competencyKeywords','pay','outlook'];
 const sourceSchemas={
  occupation:{name:'',url:'',matchedOccupation:'',supports:[],note:''},
  ncs:{name:'NCS',url:'',matchedNcs:'',supports:[],note:''}
 };
 profiles.forEach(p=>{
  if(batch1AttitudeRefinements[p.role])p.attitudes=[...batch1AttitudeRefinements[p.role]];
  if(batch1CompetencyKeywordRefinements[p.role])p.competencyKeywords=[...batch1CompetencyKeywordRefinements[p.role]];
  p.pay=p.pay||{text:'',year:'',source:''};
  p.outlook=p.outlook||{text:'',year:'',source:''};
  p.verification={tasks:'summary',education:'summary',knowledge:'summary',skills:'summary',attitudes:'summary',competencyKeywords:'summary',pay:'needs-review',outlook:'needs-review'};
  if(batch1CompetencyKeywordRefinements[p.role])p.verification.competencyKeywords='ncs-based';
  const occupationSources=batch1OccupationSources[p.role]||batch2OccupationSources[p.role]||[];
  p.sources={occupation:occupationSources.map(x=>({...x,supports:[...x.supports]})),ncs:(batch1NcsSources[p.role]||[]).map(x=>({...x,supports:[...x.supports]})),pay:[],outlook:[],checkedDate:occupationSources.length?'2026-08-21':''};
  p.verificationBatch=Number(Object.keys(verificationBatches).find(batch=>verificationBatches[batch].includes(p.role)))||0;
  });
 function getJobProfileVerificationSummary(){
  const counts={verified:0,'ncs-based':0,summary:0,'needs-review':0};
  profiles.forEach(profile=>Object.values(profile.verification).forEach(status=>{if(allowedVerificationStatuses.includes(status))counts[status]++}));
  return{totalProfiles:profiles.length,...counts,occupationSourceProfiles:profiles.filter(p=>p.sources.occupation.length>0).length,ncsSourceProfiles:profiles.filter(p=>p.sources.ncs.length>0).length};
 }
 function validateJobProfileSource(kind,entry){
  if(!['occupation','ncs'].includes(kind)||!entry||typeof entry!=='object')return false;
  const matchedKey=kind==='occupation'?'matchedOccupation':'matchedNcs';
  const supports=Array.isArray(entry.supports)?entry.supports:[];
  const url=String(entry.url||'');
  const urlIsValid=kind==='ncs'?!url||/^https:\/\//i.test(url):/^https:\/\//i.test(url);
  return Boolean(String(entry.name||'').trim()&&urlIsValid&&String(entry[matchedKey]||'').trim()&&supports.length&&new Set(supports).size===supports.length&&supports.every(x=>allowedSourceSupports.includes(x)));
 }
  window.getJobProfileVerificationSummary=getJobProfileVerificationSummary;
 window.JOB_PROFILE_DATA={dataVersion,lastContentReview,profiles,verificationBatches,allowedVerificationStatuses,allowedSourceSupports,sourceSchemas,officialReferences,officialLinks:{work24:'https://www.work24.go.kr/',careerNet:'https://www.career.go.kr/'},missingText:'최신 직업정보에서 확인 필요',getJobProfileVerificationSummary,validateJobProfileSource};
})();

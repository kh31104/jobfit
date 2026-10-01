const STORAGE_KEY = "jobfit:flexlab:job-analysis:v1";

const steps = [
  ["Target Job","직무 설정"],
  ["Find JD","실제 공고 찾기"],
  ["Choose JD","직무분석 테이블"],
  ["My Evidence","전공·경험 → 역량"],
  ["GAP Match","공고조건 × 내 스펙"],
  ["Portfolio","자소서·면접 연결"]
];

const emptyPosting=()=>({company:"",title:"",sourceUrl:"",text:"",notes:"",tasks:"",required:"",preferred:"",other:""});
const emptyExperience=()=>({title:"",type:"",summary:""});
const emptyMatch=()=>({requirement:"",evidence:"",status:"",note:""});
const emptyJobTable=()=>({customerKpi:"",tasks:"",challenge:"",method:"",competencies:"",careerPlan:"",aiResult:""});
const emptyRequirements=()=>[0,1,2].map(()=>({condition:"",status:"",note:""}));
const emptyFit=()=>({assets:"",gaps:"",actions:""});
const emptyCustomJob=()=>({
  id:"custom",type:"직접 입력",company:"",title:"",role:"",period:"",sourceUrl:"",
  source:"학생 직접 입력",facts:"",required:"",preferred:"",
  note:"내가 찾은 기업·직무·공고 정보를 직접 입력해 분석합니다."
});
const emptyAnalysisCase=()=>({
  jobTable:emptyJobTable(),
  requirements:emptyRequirements(),
  fit:emptyFit(),
  promptDrafts:{job:"",keyword:"",gap:"",selfIntro:"",interview:""},
  keywordResult:"",
  gapResult:"",
  selfIntroResult:"",
  interviewResult:""
});

const CURATED_JOBS=[
  {
    id:"kea-2026-h2",
    type:"공공기관 · 신입",
    company:"한국에너지공단",
    title:"2026년도 하반기 신입직원(채용형 인턴) 채용",
    role:"사무·기술",
    period:"2026.09.21 ~ 2026.10.01 14:00",
    sourceUrl:"https://kea.recruitlab.co.kr/app/recruitment-announcement/view/1020",
    source:"한국에너지공단 2026년도 하반기 신입직원 채용 · RecruitLab 공고",
    facts:"채용형 인턴 총 93명 · 일반 77명, 보훈 2명, 사회형평 5명, 고졸 9명 · 본사(울산) 및 전국 사무소 · 정규직 전환평가 실시",
    required:"공통: 성별·학력·전공·연령 제한 없음(정년 기준 제외) · 병역의무 불이행 사실 없음 · 2026.12.28부터 즉시 근무 가능 · 공단 결격사유 없음",
    preferred:"직무별 시험·평가 및 우대사항은 공식 공고문·별첨 직무기술서 확인",
    note:"현재 2026년 하반기 신입 채용의 공개경쟁 모집직무 중 하나를 선택해 분석합니다."
  },
  {
    id:"hdelectric-2026-h2",
    type:"대기업 · 신입",
    company:"HD현대일렉트릭",
    title:"HD현대 2026년 하반기 신입사원 모집 · HD현대일렉트릭",
    role:"전기설계·구조설계·품질경영·ICT/DT·HR·영업·기술경영",
    period:"2026.09.01 ~ 2026.09.27 23:59",
    sourceUrl:"https://hd-recruit2026.com/",
    source:"HD현대 2026년 하반기 신입사원 공식 채용페이지 · HD현대일렉트릭",
    facts:"정규직 신입 · 전기설계, 구조설계, 품질경영, ICT/DT, HR, 영업, 기술경영 모집 · 울산 및 분당(GRC) 근무",
    required:"공통: 학사 이상 기졸업자 또는 2027년 2월 졸업예정자 · 2027년 1월 정규직 입사 가능 · TOEIC Speaking 120점 이상 또는 OPIc IM2 이상 유효성적 · 해외여행 결격사유 없음(남성 병역필/면제)",
    preferred:"직무별 우대 전공·자격·경험이 다르므로 선택 직무의 공식 직무소개를 기준으로 비교",
    note:"2026년 하반기 공식 신입공채를 수업용 사기업 예시로 사용합니다. 선택한 직무의 공식 직무소개와 우대사항만 사실 근거로 사용합니다."
  }
];

const KEA_COMMON_RECRUITMENT={
  employment:"채용형 인턴 93일(2026.12.28~2027.03.30), 정규직 전환평가 후 전환",
  commonEligibility:"성별·학력·전공·연령 제한 없음(정년 기준 제외) · 병역의무 불이행 사실 없음 · 2026.12.28부터 즉시 근무 가능 · 공단 인사규정상 결격사유 없음",
  documentOffice:"사무 직군: 외국어 50점(TOEIC 기준점수÷850×50, 850 이상 만점) · 직무기술자격 40점(최대 2개) · 사무자동화 10점 · 한국사 가점 최대 5점",
  documentTech:"기술 직군: 외국어 50점(TOEIC 기준점수÷800×50, 800 이상 만점) · 직무기술자격 40점(최대 2개) · 사무자동화 10점 · 한국사 가점 최대 5점",
  languageTests:"TOEIC, TOEFL, New TEPS, G-TELP(Level2), FLEX(듣기/읽기), TOEIC-S 중 최상위 1개 인정. TOEIC 외 시험은 공단 통합환산표의 TOEIC 기준점수로 환산",
  officeAutomation:"사무자동화: 정보처리기사·컴퓨터활용능력 1급 10점 / 정보처리산업기사·사무자동화산업기사·컴퓨터활용능력 2급 5점(최상위 1개)",
  written:"채용형 인턴(일반): NCS 직업공통능력검사 50점 + 직무능력평가시험(전공시험) 50점 + 인성검사 적·부. NCS는 의사소통·수리·문제해결·자기관리·디지털능력",
  interview:"직무수행능력면접 60점(발표면접·질의응답: 직무이해도20, 직무지식15, 직무기술15, 직무수행태도10) + 직업공통능력면접 40점(경험·상황면접: 의사소통15, 대인관계15, 직업윤리10)",
  selfIntro:[
    "직무능력 경험·능력을 바탕으로 한국에너지공단 발전 및 미래성장동력 확보에 기여할 수 있는 바(300~500자)",
    "공동과업 중 어려움·갈등을 극복하기 위해 적극 협력한 경험과 갈등 극복 과정(300~500자)",
    "예상치 못한 문제에서 이전과 다른 방식으로 해결한 경험: 문제상황과 해결방안 포함(300~500자)",
    "지원 직무 관련 경력 또는 경험사항(300~1000자)"
  ],
  blind:"자기소개서에는 성별·연령·출신학교·가족관계 등 개인 식별정보 노출 금지. 기관명 오기재, 문항 간 50% 이상 동일내용 반복, 무관한 내용·의미없는 반복, 300자 미만 문항은 불성실 작성 판단 기준"
};

const KEA_ROLE_LIBRARY={
  sourceLabel:"한국에너지공단 2026년도 하반기 신입직원 채용 RecruitLab 공고 + [별첨] NCS 기반 직무기술서 + [별첨8] 직무기술자격 기준",
  groupLabel:"직군",
  roleLabel:"분석할 모집직무",
  majorNote:"공통 응시자격은 성별·학력·전공 제한이 없습니다. 전공은 탐색 참고정보이고, 실제 선택은 직무수행내용·필기범위·자격요건을 함께 비교해 결정하세요.",
  selectionNote:"모집직무는 채용을 위한 구분이며 입사 후 순환근무가 원칙입니다. 아래 정보는 2026년 하반기 공식 공고와 직무기술서에서 해당 직무에 해당하는 내용만 사용합니다.",
  groups:{
    "사무":{
      headcount:"공개경쟁 채용형 인턴(일반) · 사무",
      roles:{
        "경영·경제":{
          headcount:"14명",
          ncs:"경영기획(사업환경분석·경영계획·예산관리), PR(언론홍보·PR전략), 인사(인사기획·직무관리·인력이동·임금관리), 사무행정(문서작성·업무관리·사무자동화), 회계·감사(전표·자금·결산·회계감사)",
          tasks:"경영전략·경영계획·예산관리와 의사결정 지원, PR·대외커뮤니케이션, 인사·보수제도 운영, 문서·데이터·사무행정 관리, 회계·감사 및 공시, 해외 에너지정책 조사와 국제협력사업 기획·운영",
          knowledge:"거시환경·전략목표·경영계획·KPI·예산관리, 홍보전략·매체 특성, 인적자원관리·근로기준법·4대보험, 자료분류·회계규정, 회계·감사 규정, 해외 에너지 기술용어·정책동향",
          skills:"경영환경·성과·KPI 분석, 기획서·예산 작성, PR 기획·매체선택, 인력운영·직무평가 분석, 문서·업무용 프로그램 활용과 의견조율, 결산·재무제표 작성·검증, 해외정책 조사·외국어 활용",
          attitudes:"전략적 관점·책임감·기준준수·부서간 소통, 민첩한 상황대응과 창의성, 공정한 인사운영·경청·협업, 세밀한 자료분석, 회계규정·정확성 준수",
          exam:"경영학, 경제학, 회계학 등",
          certs:"40점: 경영지도사(생산관리·인적자원관리·재무관리) / 20점: 신용분석사, 자산관리사(FP), 투자자산운용사, 사회조사분석사1급 / 15점: 전산회계운용사1급, 전산세무1급, 재경관리사 / 10점: 전산회계운용사2급, 전산세무2급, 사회조사분석사2급",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "법·행정":{
          headcount:"12명",
          ncs:"경영기획, PR, 인사, 사무행정, 법무(법령·제규정 관리, 법률검토, 소송·분쟁관리)",
          tasks:"경영기획·PR·인사·사무행정과 함께 법령·제규정 관리, 합리적 법규 해석, 소송·분쟁 대응을 통한 법적 리스크 예방 및 의사결정 지원, 해외 에너지정책 조사와 국제협력",
          knowledge:"경영계획·KPI·예산, 홍보전략, 인적자원관리, 문서·회계 기초, 국회·정부·공공기관 운영 지침, 에너지 법령, 민사소송·집행, 형사절차, 행정절차·행정쟁송, 근로관계법, 해외 에너지정책",
          skills:"환경·성과분석과 기획서 작성, PR·인사·사무행정 실무, 법령·규정 제개정안 작성, 개정 일정관리, 판례·행정심판례 활용, 해외정책 조사와 외국어 활용",
          attitudes:"전략적·책임감 있는 태도, 공정·객관적 인사운영, 세밀한 자료분석, 논리적·치밀한 검토, 객관성·공정성, 균형감 있는 종합판단",
          exam:"민법, 행정법, 행정학, 정책학 등",
          certs:"40점: 행정사(일반·외국어번역) / 20점: 행정관리사1급, 사회조사분석사1급 / 15점: 행정관리사2급 / 10점: 행정관리사3급, 사회조사분석사2급",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        }
      }
    },
    "기술":{
      headcount:"공개경쟁 채용형 인턴(일반) · 기술",
      roles:{
        "건축":{
          headcount:"2명",
          ncs:"경영기획(이해관계자관리), 사무행정, 설계기획관리, 건축설비설계(에너지계획), 건축설비유지관리(에너지관리·고객지원)",
          tasks:"사업·신청서 검토와 이해관계자 대응, 건물·에너지관리 제도 및 보조금 사업관리, Zero Energy 건물·BEMS 기반 건물 에너지사용량 관리, 신재생·에너지절감 시설 현장확인·심사",
          knowledge:"건설법·지침과 설계업무 절차, 공조 열원설비·신재생에너지·에너지인증·녹색건축, BAS·BMS·BEMS·패시브시스템, 건물에너지해석 프로그램, 에너지진단·실내공기질",
          skills:"설계절차 관리·위험요소 식별·도면/설계도서 검토·규정 적용, 에너지 사용량 평가·토탈에너지시스템·에너지회수 적용, 건축물 에너지분석 Tool 활용, 설비효율·에너지손실 분석",
          attitudes:"공정·투명한 이해관계자 대응, 객관적 자료분석, 규정 숙지와 사전대응, 에너지절약 관점, 종합적 분석·정확한 판단·고객관점",
          exam:"건축계획, 건축시공, 건축구조, 건축설비, 건축관계법규 등",
          certs:"20점 기사: 건축, 건축설비, 건설기계설비, 온실가스관리, 건설안전, 산업안전, 건축물에너지평가사, 에너지관리, 신재생에너지발전설비(태양광) / 15점 기사: 품질경영 / 10점 산업기사: 건축, 건축설비, 건설기계설비, 건설안전, 산업안전, 에너지관리, 신재생에너지발전설비(태양광) / 7점 산업기사: 품질경영",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "기계":{
          headcount:"14명",
          ncs:"경영기획(이해관계자관리), 사무행정, 플랜트설비감리(공정·품질관리), 기계설계기획(경제성·신뢰성 검토)",
          tasks:"에너지절약계획서·자금지원 기술검토, 에너지다소비사업장 에너지진단, 열사용기자재 검사·기술검토, 생산단계 현장검증, 사업·신청서 검토와 이해관계자 대응, 국제협력",
          knowledge:"설계도서·품질관리계획서, 국내외 기술규격·기준, 기계설계 기초, 설계수명·허용응력설계, 구조역학·금속역학·기계공학, 해외 에너지 기술·정책",
          skills:"설계도면 확인·이해관계자 요구관리, 최적설계, 보일러·압력용기 설계이론, 수처리 최신기술, 제안·발표·비즈니스 문서, 해외정책 조사",
          attitudes:"공정한 업무·투명한 정보공유, 지속적 확인·검토, 세밀한 자료분석, 고객만족, 협업과 의견수용",
          exam:"열역학, 재료역학, 유체역학 등",
          certs:"20점 기사: 일반기계, 공조냉동기계, 금속재료, 자동차정비, 산업안전, 건축물에너지평가사, 에너지관리, 신재생에너지발전설비(태양광) / 15점 기사: 건설기계설비, 가스, 품질경영 / 10점 산업기사: 공조냉동기계, 금속재료, 자동차정비, 설비보전, 컴퓨터응용가공, 산업안전, 에너지관리, 신재생에너지발전설비(태양광) / 7점 산업기사: 건설기계설비, 가스, 품질경영",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "데이터분석":{
          headcount:"6명",
          ncs:"통계조사, 빅데이터분석, 빅데이터기획, DB엔지니어링, 생성형AI 엔지니어링",
          tasks:"에너지·온실가스·AI 통계조사 기획·표본설계·데이터 검증·분석·시각화·보고서, 에너지 마이데이터·빅데이터 플랫폼 구축·운영, AI·빅데이터 분석·응용, DB 인프라·인터페이스·솔루션 기획·구축·운영, 생성형AI 데이터 수집·전처리·검증·모델학습·법규검토",
          knowledge:"응용·기술통계와 통계결과 해석, 빅데이터 분석방법론·모델 예측력/안정성/효율성, 데이터 구조·비즈니스 의미, 정보·데이터공학·AI·기계학습, DB구조·보안·개인정보보호, 생성형AI 모델·프롬프트 엔지니어링·딥러닝·AI 법규와 윤리",
          skills:"SPSS·SAS·Excel 통계분석, 연구기획·보고서·논문작성, 기술·추론통계와 교차검증, Keras·TensorFlow 등 오픈소스 활용, SQL·DB 물리구조 관리, 데이터수집·벤치마킹·전처리·실시간처리, 프롬프트 작성·템플릿 설계·프로그래밍",
          attitudes:"요구사항을 정확히 정의하고 정확성을 높이려는 태도, 적합한 분석방법 탐색, 데이터 누락 방지와 집중력, 데이터 출처 신뢰성 검토, AI 법규·윤리 준수",
          exam:"데이터분석, 데이터 모델링, SQL 고급 활용 및 튜닝 등",
          certs:"20점: 사회조사분석사1급, 데이터아키텍처전문가(DAP), 데이터분석전문가(ADP), SQL전문가(SQLP), 빅데이터분석기사 / 10점: 사회조사분석사2급, 데이터아키텍처준전문가(DAsP), 데이터분석준전문가(ADsP), SQL개발자(SQLD)",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "전기":{
          headcount:"20명",
          ncs:"경영기획(이해관계자관리), 사무행정, 지능형전력망설비, 전기기기유지보수",
          tasks:"BEMS·FEMS 기술개발·보급, 에너지수요관리·신산업 시책 기획, 신재생에너지 설치의무화·설비 모니터링·표준화·인증·자금지원, 에너지효율등급·대기전력·고효율기자재 인증, 전력효율향상사업, 에너지진단·이행실태 관리",
          knowledge:"EMS·HAN, 계통연계·독립운전, 배전계통·분산전원 연계기준, 스마트홈·전력망 통신, 신재생 발전원리·전력계통, 전기기기·고효율기기, 전기도면·전기설비기술기준·내선규정",
          skills:"ESS연계·감시제어·네트워크 설계, 부하·신재생 발전량 계산, 빌딩자동화·에너지매니지먼트·시스템엔지니어링, 신재생 설비 설치·운영, 검사판정·기준적용·효율측정·전기사용분석·측정데이터 분석",
          attitudes:"사용자·보안·성능에 대한 책임, 규격·업무절차 준수, 도면·현장 분석적 사고, 측정·판정의 정확성, 현장 안전 최우선, 협업",
          exam:"전기기기, 회로이론, 전력공학 등",
          certs:"20점 기사: 전기, 전기공사, 전자, 산업안전, 건축물에너지평가사, 에너지관리, 신재생에너지발전설비(태양광) / 15점 기사: 무선설비, 품질경영 / 10점 산업기사: 전기, 전기공사, 전자, 산업안전, 에너지관리, 신재생에너지발전설비(태양광) / 7점 산업기사: 무선설비, 품질경영",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "전산":{
          headcount:"3명",
          ncs:"정보기술기획, DB엔지니어링, IT시스템관리, 개인정보보호관리운영",
          tasks:"SW·HW·운영아키텍처 환경분석과 IT 목표·투자·운영전략 수립, DB 요구사항·모델링·설계·성능개선, 정보시스템 중장기계획과 인프라 안정운영, 개인정보보호 법령·정책 분석·위험평가·대책·모니터링·감사",
          knowledge:"IT 정책·기술동향·조직·프로세스·OS/DBMS/WAS, DBMS·ERD·SQL·데이터모델링·보안·성능개선, ITSM·HW·네트워크·SW 구조·테스트, 개인정보보호 거버넌스·위험관리·ISMS-P·관련 법령",
          skills:"기술동향·시스템 확장성·성능·안정성 분석, ERD·데이터모델링·DB 성능모니터링, 포털·애플리케이션·테스트·SQL·로그·Unix/Linux·네트워크·서버 운영, 보안 위협·취약성 평가와 접근통제·권한관리",
          attitudes:"사용자 관점·도전적 목표·개방적 소통·분석적 태도, 데이터 품질·효율성 개선 의지, 무결점 코딩·테스트 완전성·다양한 해결방법 추구, 개인정보보호·컴플라이언스 준수",
          exam:"데이터베이스, 운영체제, IT 및 정보통신 개론 등",
          certs:"20점: SQL전문가(SQLP), 데이터아키텍처전문가(DAP), 정보보안기사, 컴퓨터시스템기사 / 15점: 정보통신기사, 빅데이터분석기사, 무선설비기사 / 10점: SQL개발자(SQLD), 정보보안산업기사 / 7점: 정보통신산업기사, 무선설비산업기사, 네트워크관리사1·2급, 리눅스마스터1급",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        },
        "화공·환경":{
          headcount:"6명",
          ncs:"경영기획(이해관계자관리), 사무행정, 환경설비설계(에너지자원 절감산정), 온실가스관리, 기후변화적응",
          tasks:"업종별 공정·에너지·물질수지 분석과 온실가스 배출량 산정, 정부정책·에너지절약 지원, 에너지다소비사업장 온실가스 감축방안·기술지원, 기후변화 적응 국제동향·지원정책, 사업·신청서 검토와 국제협력",
          knowledge:"업종별 시설특성·공정프로세스·온실가스 배출량 산정, 신재생·환경·에너지이용합리화 법규·정책, 온실가스 발생원·감축기술·BAT·배출계수·물리화학 단위조작, 기후변화 적응·정부지원제도·국제동향",
          skills:"공정의 연료·에너지 흐름 파악과 배출량 산정, 에너지·온실가스 단위변환, 국가별 기후정책 분석, 감축수단 비교, 공정배출량 조사·평가, 에너지·온실가스 통계분석, 기후변화 자료수집·정보검색",
          attitudes:"법령 준수, 온실가스 배출원·산정절차 이해 노력, 관련 동향과 감축기술 학습, 창의적 정책지원 방안 발굴, 피해사례 분석과 극복방안 마련",
          exam:"열역학, 공업화학, 연소공학 등",
          certs:"20점 기사: 대기환경, 화공, 폐기물처리, 온실가스관리, 산업안전, 건축물에너지평가사, 에너지관리, 신재생에너지발전설비(태양광) / 15점 기사: 수질환경, 소음진동, 가스, 품질경영 / 10점 산업기사: 대기환경, 폐기물처리, 산업안전, 에너지관리, 신재생에너지발전설비(태양광) / 7점 산업기사: 수질환경, 소음진동, 가스, 품질경영",
          commonAbilities:"의사소통·수리·문제해결·자기관리·대인관계·디지털·직업윤리"
        }
      }
    }
  }
};

const HDELECTRIC_ROLE_LIBRARY={
  sourceLabel:"HD현대 2026년 하반기 신입사원 공식 채용페이지 · HD현대일렉트릭 모집직무",
  groupLabel:"직무군(실습 분류)",
  roleLabel:"분석할 세부직무",
  majorNote:"HD현대일렉트릭은 직무별 우대 전공·자격·경험을 제시합니다. 아래 직무군은 수업에서 찾기 쉽게 묶은 분류이며 공식 모집단위는 각 세부직무입니다.",
  selectionNote:"공식 공고에 확인되는 '직무소개·우대사항·근무지'는 사실로 사용하고, 필요지식·기술·태도는 AI가 직무특성에서 도출할 경우 반드시 [추론]으로 표시합니다.",
  groups:{
    "설계·품질":{
      headcount:"실습 분류 · 울산",
      roles:{
        "전기설계":{
          tasks:"변압기·고압차단기·배전반·회전기 등 주요 제품 상세 전기설계 및 개발, 도면 일정·완성도 관리, 설계 외주·설계 품질 관리, 설계도면 제도·표준 관리",
          knowledge:"공식 공고 별도 명시 없음. 직무소개를 근거로 전력기기·전기설계·도면·규격 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 설계·도면 검토·일정/품질 관리 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 정확성·표준준수·협업 등은 [추론]으로만 도출",
          preferred:"전기 및 관련 전공자 · 관련 자격 보유자",
          location:"울산",
          focus:"전력기기 상세 전기설계 → 도면 완성도 → 표준·품질 → 외주설계 관리"
        },
        "구조설계":{
          tasks:"변압기·고압차단기·배전반·회전기 등 주요 제품 상세 구조설계 및 개발, 도면 일정·완성도 관리, 설계 외주·설계 품질 관리, 설계도면 제도·표준 관리",
          knowledge:"공식 공고 별도 명시 없음. 기계구조·재료·도면·설계규격 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 구조설계·도면 검토·일정/품질 관리 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 정확성·표준준수·협업 등은 [추론]으로만 도출",
          preferred:"기계 및 관련 전공자 · 관련 자격 보유자",
          location:"울산",
          focus:"전력기기 상세 구조설계 → 도면 완성도 → 표준·품질 → 외주설계 관리"
        },
        "품질경영":{
          tasks:"품질지표 수립·관리(실패비용·불량률 등), 품질시스템 인증 관리(ISO 9001·원자력 품질보증·방폭품질보증 등), 협력사 부품 품질검사·기술지도·평가, 부적합사항(NCR) 발행·사후관리",
          knowledge:"공식 공고 별도 명시 없음. 품질시스템·품질지표·인증·협력사 품질관리 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 품질데이터 분석·부적합 원인분석·시정조치·협력사 커뮤니케이션 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 기준준수·객관성·재발방지 관점은 [추론]으로만 도출",
          preferred:"전기·기계 등 이공계열 및 관련 전공자 · 관련 자격 보유자",
          location:"울산",
          focus:"품질지표 → 인증체계 → 협력사 품질 → NCR·사후관리"
        }
      }
    },
    "디지털·경영지원":{
      headcount:"실습 분류 · 울산",
      roles:{
        "ICT/DT":{
          tasks:"SAP/ERP 시스템 운영·유지보수, LEGACY 시스템 개선 및 IT/DT 기술기획, 업무 프로세스 설계·표준화, CAD/PLM 시스템 개발·운영",
          knowledge:"공식 공고 별도 명시 없음. ERP·정보시스템·업무프로세스·CAD/PLM 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 시스템 운영·요구사항 분석·프로세스 개선·데이터/시스템 연계 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 사용자 관점·안정적 운영·표준화·협업은 [추론]으로만 도출",
          preferred:"컴퓨터·전산 및 관련 전공자 · 관련 자격 보유자",
          location:"울산",
          focus:"ERP 운영 → Legacy 개선 → 프로세스 표준화 → CAD/PLM 개발·운영"
        },
        "HR":{
          tasks:"채용·평가·승진·보상 등 인적자원 관리, 조직문화 개선 및 임직원 교육 운영, 복지제도 기획·운영",
          knowledge:"공식 공고 별도 명시 없음. 인사제도·평가보상·조직문화·교육·복지 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 제도기획·데이터 정리·이해관계자 커뮤니케이션 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 공정성·기밀성·경청·조율은 [추론]으로만 도출",
          preferred:"상경계열 관련 전공자 · 관련 자격 보유자",
          location:"울산",
          focus:"채용·평가·보상 → 조직문화·교육 → 복지제도 운영"
        }
      }
    },
    "영업·기술전략":{
      headcount:"실습 분류 · 분당(GRC)",
      roles:{
        "영업":{
          tasks:"변압기·고압차단기·배전반·회전기 등 주요 제품 영업, 영업전략 수립·프로젝트 진행, 가격협상·대리점 영업관리, 시장조사·제품홍보·경쟁사 분석",
          knowledge:"공식 공고 별도 명시 없음. 전력기기 제품·시장·프로젝트 영업 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 제안·협상·시장분석·프로젝트 관리·고객커뮤니케이션은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 고객관점·책임감·협업·사업감각은 [추론]으로만 도출",
          preferred:"전기·기계 등 이공계열 및 관련 전공자 · 직무 관련 경험 보유자",
          location:"분당(GRC)",
          focus:"전력기기 제품이해 → 영업전략 → 프로젝트·가격협상 → 시장·경쟁사 분석"
        },
        "기술경영":{
          tasks:"전사 기술·제품 개발전략 수립, 제품·기술 로드맵(PRM/TRM) 기획, R&D 과제 발굴·관리와 프로젝트 운영·성과관리, 특허·지식재산(IP) 전략·분석·권리화 지원, IP 포트폴리오 관리·활용",
          knowledge:"공식 공고 별도 명시 없음. 기술전략·로드맵·R&D관리·특허/IP 관련 지식은 [추론]으로만 도출",
          skills:"공식 공고 별도 명시 없음. 기술·시장 분석, 로드맵 기획, 프로젝트·성과관리, 특허정보 분석 역량은 [추론]으로만 도출",
          attitudes:"공식 공고 별도 명시 없음. 전략적 사고·분석적 태도·협업·성과관리 관점은 [추론]으로만 도출",
          preferred:"전기·기계·산업공학 등 이공계열 및 관련 전공자 · 직무 관련 경험 보유자",
          location:"분당(GRC)",
          focus:"기술·제품 전략 → PRM/TRM → R&D 포트폴리오 → IP 전략·권리화"
        }
      }
    }
  }
};

const HDELECTRIC_ROLE_PROMPT_GUIDES={
  "전기설계":{
    analysis:"공식 직무소개를 전력기기 상세 전기설계·개발 → 도면 일정·완성도 관리 → 외주·설계품질 관리 → 설계도면 제도·표준 관리의 4개 업무축으로 분리",
    challenge:"요구사양 반영, 도면 정확성·완성도, 일정·변경관리, 외주설계 품질과 표준 준수에서 발생할 수 있는 문제를 업무축별로 연결하되 공고에 없는 상황은 [추론] 표시",
    method:"공식 업무를 기준으로 요구사항/규격 확인 → 설계·도면 검토 → 일정·품질 점검 → 표준 반영의 흐름으로 정리. 구체 설계도구·해석기법은 공식 자료에 없으면 [추론] 또는 [추가 확인 필요]",
    career:"전기·전력기기 기초와 관련 자격 준비 → 상세설계·도면품질 경험 → 제품·설계표준·설계품질 영역으로 전문성 확장"
  },
  "구조설계":{
    analysis:"공식 직무소개를 주요 제품 상세 구조설계·개발 → 도면 일정·완성도 관리 → 외주·설계품질 관리 → 설계도면 제도·표준 관리의 4개 업무축으로 분리",
    challenge:"구조 요구조건 반영, 도면 정확성·완성도, 일정·변경관리, 외주설계 품질과 표준 준수 문제를 연결하되 구조해석·재료선정 등 공고에 직접 없는 내용은 [추론] 표시",
    method:"요구사항/도면 기준 확인 → 구조설계·도면 검토 → 일정·품질 관리 → 표준 반영 순서로 정리. CAD·해석도구 등은 공식 자료에 없으면 사실처럼 단정하지 않음",
    career:"기계·구조설계 기초와 관련 자격 준비 → 상세 구조설계·도면품질 경험 → 제품개발·설계표준·설계품질 영역으로 확장"
  },
  "품질경영":{
    analysis:"품질지표 수립·관리(실패비용·불량률) → 품질시스템 인증 → 협력사 부품 품질검사·기술지도·평가 → NCR 발행·사후관리의 4개 업무축을 반드시 분리",
    challenge:"지표 이상, 인증요건 준수, 협력사 부품 부적합, NCR 재발·사후관리 문제를 각 공식 업무와 연결. 원인분석 기법이나 개선도구는 공고에 없으면 [추론] 표시",
    method:"품질데이터/기준 확인 → 이상·부적합 식별 → 관련 부서·협력사와 조치 → 재발·사후 확인의 흐름으로 정리하되 ISO 9001 등 공식 인증명은 그대로 유지",
    career:"이공계 기초·관련 자격 준비 → 품질지표·협력사·NCR 실무 → 품질시스템·품질기획·공급망 품질 영역으로 전문성 확장"
  },
  "ICT/DT":{
    analysis:"SAP/ERP 운영·유지보수 → Legacy 시스템 개선·IT/DT 기술기획 → 업무 프로세스 설계·표준화 → CAD/PLM 시스템 개발·운영의 4개 업무축을 분리",
    challenge:"시스템 안정운영, 사용자 요구와 Legacy 개선, 프로세스 표준화, CAD/PLM 연계·운영 이슈를 공식 업무에 맞춰 도출. 특정 기술스택은 공고에 없으면 [추론] 표시",
    method:"현업 요구/운영현황 확인 → 프로세스·시스템 분석 → 개선·개발 → 테스트·운영·표준화 순서로 정리하되 구체 플랫폼·언어는 공식 자료 밖이면 단정하지 않음",
    career:"컴퓨터·전산 기초와 관련 자격 준비 → ERP·업무시스템 운영/개선 경험 → IT/DT 기획·프로세스 혁신·PLM 영역으로 확장"
  },
  "HR":{
    analysis:"채용·평가·승진·보상 등 HR 제도운영 → 조직문화 개선·임직원 교육 → 복지제도 기획·운영의 3개 업무축을 분리",
    challenge:"제도 기준의 일관성, 인사데이터 정확성, 구성원 문의·이해관계 조율, 교육·복지 운영상 문제를 공식 업무와 연결하되 법규·시스템 등 공고에 없는 세부사항은 [추론] 표시",
    method:"제도·기준 확인 → 대상자/데이터 검토 → 운영·커뮤니케이션 → 결과 점검·개선 순서로 정리. 공정성·기밀성 등 행동요건은 [직무특성상 추론]으로 표시",
    career:"상경계열·HR 기초와 관련 자격 준비 → 채용·평가·교육·복지 운영 경험 → HR 제도기획·조직문화·보상 영역으로 확장"
  },
  "영업":{
    analysis:"전력기기 제품 영업 → 영업전략 수립·프로젝트 진행 → 가격협상·대리점 영업관리 → 시장조사·제품홍보·경쟁사 분석의 4개 업무축을 분리",
    challenge:"고객 요구 파악, 프로젝트 진행·납기/조건 조율, 가격협상, 대리점 관리, 시장·경쟁정보 판단 문제를 공식 업무별로 연결하고 내부 가격기준·매출목표 등 미공개 수치는 만들지 않음",
    method:"제품·고객/시장 정보 확인 → 제안·협상/프로젝트 진행 → 대리점·고객 커뮤니케이션 → 시장·경쟁정보 피드백의 흐름으로 정리",
    career:"전기·기계 제품기초와 직무 관련 경험 준비 → 제품·프로젝트 영업 경험 → 핵심고객·시장전략·사업개발 영역으로 확장"
  },
  "기술경영":{
    analysis:"전사 기술·제품 개발전략 → PRM/TRM 기획 → R&D 과제 발굴·관리·성과관리 → 특허/IP 전략·분석·권리화 → IP 포트폴리오 관리·활용의 5개 업무축을 분리",
    challenge:"기술·시장정보를 전략으로 연결하는 판단, 로드맵 우선순위, R&D 과제 성과관리, 특허/IP 중복·권리화·활용 이슈를 공식 업무별로 구분. 평가모형·수치기준은 공고에 없으면 [추론] 표시",
    method:"기술·제품/시장 정보 수집 → 로드맵·과제 기획 → 프로젝트·성과 모니터링 → 특허/IP 분석·권리화·활용 순서로 정리",
    career:"전기·기계·산업공학 기초와 기술/시장 분석 경험 → R&D 과제·로드맵·IP 실무 → 기술전략·R&D 포트폴리오·IP 전략 영역으로 확장"
  }
};

function hdElectricRolePromptGuide(role){
  return HDELECTRIC_ROLE_PROMPT_GUIDES[role]||{
    analysis:"공식 직무소개에 적힌 업무를 서로 섞지 말고 업무축별로 구분",
    challenge:"공식 업무에서 실제로 발생할 수 있는 문제를 도출하되 공고에 없는 내용은 [추론] 표시",
    method:"공식 업무 흐름을 기준으로 확인 → 분석/설계/운영 → 검증/보고 순서로 정리",
    career:"공식 우대사항과 실제 업무를 바탕으로 지금 준비 → 신입 초기 → 전문성 확장 순서로 제시"
  };
}

const KEA_ROLE_PROMPT_GUIDES={
  "경영·경제":{
    analysis:"경영기획·예산/KPI · PR/대외커뮤니케이션 · 인사/보수 · 사무행정 · 회계/감사 · 해외정책/국제협력을 서로 섞지 말고 업무축별로 구분",
    interview:"예산·성과지표 판단, 대외커뮤니케이션 상황대응, 공정한 인사·규정 적용, 회계 정확성, 해외정책 자료분석 중 선택 직무기술서와 연결되는 상황"
  },
  "법·행정":{
    analysis:"경영기획·PR·인사·사무행정과 법무를 구분하고, 법무는 법령·제규정 관리 · 법률검토 · 소송/분쟁관리 축으로 세분화",
    interview:"에너지 관련 법령·지침 해석, 규정 제·개정, 판례/행정심판례 활용, 이해관계 충돌과 법적 리스크 예방 상황"
  },
  "건축":{
    analysis:"이해관계자/사무행정 · 설계기획관리 · 건축설비설계 · 건축설비유지관리 축으로 구분하고 Zero Energy·BEMS·에너지 사용량·보조금 현장심사를 연결",
    interview:"제로에너지 건물·BEMS, 설계도서/법규 검토, 에너지 사용량 분석, 신재생·절감시설 현장확인, 보조금 심사 상황"
  },
  "기계":{
    analysis:"이해관계자/사무행정 · 플랜트설비감리 · 기계설계기획 축으로 구분하고 에너지절약계획서·자금지원 기술검토·에너지진단·열사용기자재 검사·현장검증을 연결",
    interview:"에너지진단, 설계도서·품질관리계획서 검토, 열사용기자재 검사, 보일러·압력용기 설계, 현장검증과 이해관계자 협업 상황"
  },
  "데이터분석":{
    analysis:"통계조사 · 빅데이터 분석/기획 · DB엔지니어링 · 생성형AI 엔지니어링을 반드시 분리하고, 데이터 수집→전처리→분석/모델링→검증→시각화/보고→운영까지 흐름으로 연결",
    interview:"표본·통계분석, 데이터 전처리·모델평가, SQL/DB 설계·성능, 에너지 빅데이터 플랫폼, 생성형AI 데이터·프롬프트·법규/윤리 상황"
  },
  "전기":{
    analysis:"이해관계자/사무행정 · 지능형전력망설비 · 전기기기유지보수 축으로 구분하고 BEMS/FEMS·신재생 계통연계·효율등급/고효율기자재·에너지진단을 연결",
    interview:"ESS·계통연계·부하/발전량, BEMS/FEMS, 전기기기 효율측정·검사판정, 관련 기준 적용, 현장 안전과 측정데이터 분석 상황"
  },
  "전산":{
    analysis:"정보기술기획 · DB엔지니어링 · IT시스템관리 · 개인정보보호관리운영을 분리하고 기획→설계/구축→운영→보안/컴플라이언스 흐름으로 연결",
    interview:"IT전략·아키텍처, ERD/SQL·DB성능, 장애·로그·서버/네트워크 운영, 테스트/변경관리, 개인정보보호·ISMS-P·접근통제 상황"
  },
  "화공·환경":{
    analysis:"이해관계자/사무행정 · 환경설비설계 · 온실가스관리 · 기후변화적응 축으로 구분하고 공정·에너지/물질수지→배출량 산정→감축→정책/적응까지 흐름으로 연결",
    interview:"공정의 연료·에너지 흐름, 온실가스 배출량·배출계수, 감축기술/BAT, 통계자료 분석, 기후변화 정책·적응방안과 법령준수 상황"
  }
};

function keaRolePromptGuide(role){
  return KEA_ROLE_PROMPT_GUIDES[role]||{analysis:"공식 NCS 세분류와 직무수행내용을 업무축별로 구분",interview:"공식 직무수행내용·필요지식·필요기술·직무수행태도를 직접 묻는 상황"};
}

const CURATED_ROLE_LIBRARIES={
  "kea-2026-h2":KEA_ROLE_LIBRARY,
  "hdelectric-2026-h2":HDELECTRIC_ROLE_LIBRARY
};

function emptyCuratedSelection(){return {
  "kea-2026-h2":{group:"",role:""},
  "hdelectric-2026-h2":{group:"",role:""}
};}

function normalizeAnalysisCase(c={}){
  const b=emptyAnalysisCase();
  return {
    jobTable:{...emptyJobTable(),...(c.jobTable||{})},
    requirements:[0,1,2].map(i=>({condition:"",status:"",note:"",...(c.requirements?.[i]||{})})),
    fit:{...emptyFit(),...(c.fit||{})},
    promptDrafts:{...b.promptDrafts,...(c.promptDrafts||{})},
    keywordResult:c.keywordResult||"",
    gapResult:c.gapResult||"",
    selfIntroResult:c.selfIntroResult||"",
    interviewResult:c.interviewResult||""
  };
}

function roleCaseKey(id=state?.sampleJobId){
  if(!id||id==="custom")return id||"";
  const sel=state?.curatedSelection?.[id]||{};
  return sel.group&&sel.role?id+"::"+sel.group+"::"+sel.role:id;
}

const defaults=()=>({
  version:11,currentStep:1,updatedAt:"",
  target:{industry:"",job:"",company:"",initialView:""},
  student:{major:"",majorEvidence:"",certificates:"",language:"",tools:"",otherSpec:""},
  step2Search:{company:"",title:"",sourceUrl:"",facts:"",memo:""},
  sampleJobId:"",
  curatedSelection:emptyCuratedSelection(),
  customJob:emptyCustomJob(),
  analysisCases:{
    "kea-2026-h2":emptyAnalysisCase(),
    "hdelectric-2026-h2":emptyAnalysisCase(),
    "custom":emptyAnalysisCase(),
    "searched":emptyAnalysisCase()
  },
  jobTable:emptyJobTable(),
  context:{change:"",problem:""},
  profile:{solve:"",output:""},
  postings:[emptyPosting(),emptyPosting(),emptyPosting()],
  competency:{knowledge:"",skill:"",behavior:"",experience:"",signal:"",top5:""},
  comparison:{common:"",differences:""},
  experiences:[emptyExperience(),emptyExperience(),emptyExperience()],
  selectedExperience:0,
  star:{competency:"",experience:"",situation:"",task:"",actionWhat:"",actionWhy:"",actionHow:"",result:"",evidence:""},
  requirements:emptyRequirements(),
  matchRows:[0,1,2].map(emptyMatch),
  fit:emptyFit(),
  interviewMode:"6",
  promptDrafts:{search:"",job:"",keyword:"",gap:"",selfIntro:"",interview:""},
  ai:{keywordResult:"",gapResult:"",selfIntroResult:"",interviewResult:""}
});

let state=load(), activePosting=0;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!x)return defaults();
    const b=defaults();
    const legacyStep=Number(x.currentStep||1);
    const oldVersion=Number(x.version||1);
    let mappedStep;
    if(oldVersion<5){
      const v5Step=({1:1,2:2,3:3,4:3,5:5,6:7,7:7,8:7}[legacyStep]||1);
      mappedStep=({1:1,2:2,3:3,4:4,5:4,6:5,7:6}[v5Step]||1);
    }else if(oldVersion<6){
      mappedStep=({1:1,2:2,3:3,4:4,5:4,6:5,7:6}[legacyStep]||1);
    }else{
      mappedStep=Math.max(1,Math.min(6,legacyStep));
    }

    const postings=[0,1,2].map(i=>{
      const old=x.postings?.[i]||{};
      return {...emptyPosting(),...old,sourceUrl:old.sourceUrl||old.url||""};
    });

    const oldStar=x.star||{};
    const experiences=Array.isArray(x.experiences)&&x.experiences.length
      ? [0,1,2].map(i=>{
          const e=x.experiences[i]||{};
          return {...emptyExperience(),...e,summary:e.summary||e.note||""};
        })
      : [0,1,2].map(i=>i===0?{title:oldStar.experience||x.fit?.evidence||"",type:"",summary:""}:emptyExperience());

    const requirements=Array.isArray(x.requirements)&&x.requirements.length
      ? [0,1,2].map(i=>({condition:"",status:"",note:"",...(x.requirements[i]||{})}))
      : b.requirements;

    const oldMatches=Array.isArray(x.matchRows)?x.matchRows:(Array.isArray(x.matches)?x.matches:[]);
    const matchRows=[0,1,2].map(i=>({...emptyMatch(),...(oldMatches[i]||{})}));

    const star={
      ...b.star,...oldStar,
      experience:oldStar.experience||x.fit?.evidence||experiences[0]?.title||"",
      situation:oldStar.situation||oldStar.situationTask||"",
      actionWhat:oldStar.actionWhat||oldStar.action||""
    };

    const analysisCases={...b.analysisCases};
    Object.entries(x.analysisCases||{}).forEach(([id,oldCase])=>{analysisCases[id]=normalizeAnalysisCase(oldCase);});
    Object.keys(analysisCases).forEach(id=>{analysisCases[id]=normalizeAnalysisCase(analysisCases[id]);});
    if(x.sampleJobId&&analysisCases[x.sampleJobId]&&!x.analysisCases){
      analysisCases[x.sampleJobId]={
        jobTable:{...emptyJobTable(),...(x.jobTable||{})},
        requirements:[0,1,2].map(i=>({condition:"",status:"",note:"",...(x.requirements?.[i]||{})})),
        fit:{...emptyFit(),...(x.fit||{})},
        keywordResult:x.ai?.keywordResult||"",
        gapResult:x.ai?.gapResult||""
      };
    }

    return {
      ...b,...x,version:11,currentStep:mappedStep,
      target:{...b.target,...(x.target||{})},
      student:{...b.student,...(x.student||{})},
      step2Search:{...b.step2Search,...(x.step2Search||{})},
      sampleJobId:["komipo-2026-3","skenergy-2026-clx","hdoilbank-2026-h2"].includes(x.sampleJobId)?"":(x.sampleJobId||""),
      curatedSelection:{
        ...emptyCuratedSelection(),
        ...(x.curatedSelection||{}),
        "kea-2026-h2":{...emptyCuratedSelection()["kea-2026-h2"],...(x.curatedSelection?.["kea-2026-h2"]||{})},
        "hdelectric-2026-h2":{...emptyCuratedSelection()["hdelectric-2026-h2"],...(x.curatedSelection?.["hdelectric-2026-h2"]||{})}
      },
      customJob:{...emptyCustomJob(),...(x.customJob||{})},
      analysisCases,
      jobTable:{...b.jobTable,...(x.jobTable||{})},
      context:{...b.context,...(x.context||{})},
      profile:{...b.profile,...(x.profile||{})},
      competency:{...b.competency,...(x.competency||{})},
      comparison:{...b.comparison,...(x.comparison||{})},
      postings,experiences,requirements:requirements.slice(0,3),matchRows:matchRows.slice(0,3),star,
      selectedExperience:Math.max(0,Math.min(2,Number(x.selectedExperience||0))),
      fit:{...b.fit,...(x.fit||{})},
      promptDrafts:{...b.promptDrafts,...(x.promptDrafts||{})},
      ai:{...b.ai,...(x.ai||{})}
    };
  }catch(e){return defaults();}
}

function snapshotActiveCase(){
  const id=roleCaseKey();
  if(!id)return;
  state.analysisCases??={};
  state.analysisCases[id]={
    jobTable:{...emptyJobTable(),...state.jobTable},
    requirements:[0,1,2].map(i=>({condition:"",status:"",note:"",...(state.requirements?.[i]||{})})),
    fit:{...emptyFit(),...state.fit},
    promptDrafts:{
      job:state.promptDrafts?.job||"",
      keyword:state.promptDrafts?.keyword||"",
      gap:state.promptDrafts?.gap||"",
      selfIntro:state.promptDrafts?.selfIntro||"",
      interview:state.promptDrafts?.interview||""
    },
    keywordResult:state.ai?.keywordResult||"",
    gapResult:state.ai?.gapResult||"",
    selfIntroResult:state.ai?.selfIntroResult||"",
    interviewResult:state.ai?.interviewResult||""
  };
}

function restoreAnalysisCase(id=roleCaseKey()){
  const c=normalizeAnalysisCase(state.analysisCases?.[id]||emptyAnalysisCase());
  state.jobTable={...emptyJobTable(),...(c.jobTable||{})};
  state.requirements=[0,1,2].map(i=>({condition:"",status:"",note:"",...(c.requirements?.[i]||{})}));
  state.fit={...emptyFit(),...(c.fit||{})};
  state.promptDrafts={
    ...(state.promptDrafts||{}),
    job:c.promptDrafts.job||"",
    keyword:c.promptDrafts.keyword||"",
    gap:c.promptDrafts.gap||"",
    selfIntro:c.promptDrafts.selfIntro||"",
    interview:c.promptDrafts.interview||""
  };
  state.ai={
    ...(state.ai||{}),
    keywordResult:c.keywordResult||"",
    gapResult:c.gapResult||"",
    selfIntroResult:c.selfIntroResult||"",
    interviewResult:c.interviewResult||""
  };
}

function save(){
  snapshotActiveCase();
  state.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const el=document.getElementById("saveState");
  if(el)el.textContent="저장됨 "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  progress();
}

function h(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function get(path){return path.split(".").reduce((o,k)=>o?.[k],state);}
function set(path,val){const a=path.split(".");let o=state;a.slice(0,-1).forEach(k=>{o[k]??={};o=o[k];});o[a.at(-1)]=val;}
function filled(v){return String(v||"").trim().length>0;}
function toast(msg){const e=document.getElementById("toast");if(!e)return;e.textContent=msg;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),1800);}

function field(path,label,ph,area=true,optional=false){
  const val=h(get(path)||"");
  const opt=optional?' <span class="hint">(선택)</span>':"";
  if(area)return '<div class="field"><label>'+label+opt+'</label><textarea class="input" data-path="'+path+'" placeholder="'+h(ph)+'">'+val+'</textarea></div>';
  return '<div class="field"><label>'+label+opt+'</label><input class="input" data-path="'+path+'" value="'+val+'" placeholder="'+h(ph)+'" /></div>';
}

function done(n){
  if(n===1)return filled(state.target.job)&&filled(state.student.major);
  if(n===2)return filled(state.step2Search.company)||filled(state.step2Search.title)||filled(state.step2Search.memo);
  if(n===3)return filled(state.sampleJobId)&&filled(state.jobTable.tasks)&&filled(state.jobTable.competencies);
  if(n===4)return state.experiences.some(e=>filled(e.title))&&(filled(state.ai.keywordResult)||filled(state.star.actionWhat)||filled(state.student.majorEvidence));
  if(n===5)return filled(state.fit.gaps)||state.matchRows.some(m=>filled(m.requirement)&&filled(m.status));
  if(n===6)return done(1)&&done(3)&&done(4)&&done(5);
}

function nav(){
  document.getElementById("stepNav").innerHTML='<div class="navTitle">JOB ANALYSIS</div>'+steps.map((s,i)=>{
    const n=i+1,d=done(n),a=state.currentStep===n;
    return '<button class="stepBtn '+(a?"active ":"")+(d?"done":"")+'" data-step="'+n+'" aria-label="STEP '+n+' '+h(s[0])+' · '+h(s[1])+'" '+(a?'aria-current="step"':'')+'><span class="stepN">'+(d?"✓":String(n).padStart(2,"0"))+'</span><span class="stepText">'+s[0]+'<small>'+s[1]+'</small></span></button>';
  }).join("");
  document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>go(Number(b.dataset.step)));
}

function progress(){
  const n=steps.filter((_,i)=>done(i+1)).length,p=Math.round(n/6*100);
  const l=document.getElementById("progressLabel"),b=document.getElementById("progressBar");
  if(l)l.textContent="진행 "+p+"% · "+n+"/6";
  const current=document.getElementById("currentStepLabel");
  if(current){const s=steps[state.currentStep-1];current.textContent="STEP "+String(state.currentStep).padStart(2,"0")+" · "+s[0]+" · "+s[1];}
  if(b)b.style.width=p+"%";
  nav();
}

function shell(n,title,desc,body,badge="실습"){
  return '<section class="card stepCard"><div class="sectionHead"><div><div class="kicker">STEP '+String(n).padStart(2,"0")+'</div><h2>'+title+'</h2><p>'+desc+'</p></div><span class="badge">'+badge+'</span></div><div class="autosaveNote">✓ 입력 즉시 같은 브라우저에 자동 저장</div>'+body+'<div class="actions stepFooter">'+(n>1?'<button class="btn secondary" data-prev="'+(n-1)+'">이전</button>':"")+(n<6?'<button class="btn primary" data-next="'+(n+1)+'">저장하고 다음</button>':"")+'</div></section>';
}

function bulletOutputRules(){
  return [
    "",
    "[출력 형식]",
    "- 긴 문단으로 쓰지 말고 반드시 개조식으로 작성한다.",
    "- 각 항목은 한 줄 중심으로 짧고 명확하게 쓴다.",
    "- 큰 제목은 기본적으로 [제목], 세부내용은 '• ' bullet을 사용한다. 단, 프롬프트에서 제목 형식을 따로 지정하면 그 형식을 최우선으로 따른다.",
    "- 한 bullet에는 핵심 내용 1개만 쓴다.",
    "- 중요 키워드는 문장 앞쪽에 배치한다.",
    "- 확인된 사실과 추론은 같은 bullet에 섞지 말고 분리한다.",
    "- 불필요한 인사말·서론·마무리 문장은 쓰지 않는다."
  ];
}

function koreaToday(){
  const parts=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(new Date());
  const getPart=type=>parts.find(x=>x.type===type)?.value||"";
  return [getPart("year"),getPart("month"),getPart("day")].join(".");
}

function energySearchPrompt(){
  const industry=state.target.industry||"관심 산업";
  const job=state.target.job||"관심 직무";
  const major=state.student.major||"전공 미입력";
  const today=koreaToday();
  return [
    "확인 기준일: "+today+" (대한민국 표준시, KST)",
    "반드시 위 기준일 현재의 모집상태를 확인해서 답해줘.",
    "",
    "나는 "+major+" 전공 대학생이고, "+industry+" 산업의 "+job+"를 탐색하고 있어.",
    "",
    "[검색 순서]",
    "1. 기업 공식 채용페이지의 현재 모집 중인 신입·채용연계형 인턴 공고",
    "2. 사람인·잡코리아·고용24의 현재 공고",
    "3. 공공기관이면 잡알리오·클린아이 잡플러스도 확인",
    "4. 현재 모집 중인 적합 공고가 없다면 최근 6개월 이내의 신입 공고",
    "",
    "[모집상태 판정]",
    "- 현재 모집 중: 확인 기준일이 실제 접수기간 안에 있는 공고",
    "- 마감: 확인 기준일 전에 접수가 끝난 공고",
    "- 최근 6개월 참고공고: 현재 모집 중인 적합 공고가 없을 때만 제시하는 최근 6개월 이내 마감 공고",
    "- 접수기간을 확인할 수 없으면 '확인 필요'로 표시하고 현재 모집 중이라고 단정하지 않는다.",
    "",
    "[직무 적합성]",
    "- 공고명이 비슷하다는 이유만으로 포함하지 말고 실제 담당업무가 "+job+"와 연결되는지 확인한다.",
    "- 내 전공 '"+major+"'만으로 적합하다고 판단하지 않는다.",
    "- 담당업무·필수조건·우대조건을 함께 보고 직무 관련성을 판단한다.",
    "",
    "각 공고마다 아래 항목만 정리해줘.",
    "[기업명]",
    "• 모집상태: 현재 모집 중 / 마감 / 최근 6개월 참고공고 / 확인 필요 중 하나",
    "• 공고명:",
    "• 직무:",
    "• 모집기간:",
    "• 출처: 기업 공식 / 사람인 / 잡코리아 / 고용24 / 잡알리오 / 클린아이 잡플러스 중 해당 출처",
    "• 공고 원문 URL:",
    "• "+job+"와 연결되는 실제 담당업무:",
    "• 내 전공·관심직무와 연결되는 이유: 한 줄",
    "",
    "[중요 규칙]",
    "- 확인되지 않은 공고를 만들어내지 않는다.",
    "- 오래된 공고를 현재 모집 중이라고 표현하지 않는다.",
    "- 공고 원문 URL을 직접 확인할 수 있을 때만 URL을 적는다.",
    "- 출처와 모집상태가 불확실하면 '확인 필요'라고 적는다.",
    "- "+job+"와 이름만 비슷하고 실제 업무가 다른 공고는 제외한다.",
    ...bulletOutputRules()
  ].join("\n");
}

function step1(){
  return shell(1,"Target Job","먼저 분석할 직무와 내 전공을 정합니다. 이후 모든 AI 프롬프트가 이 입력을 사용합니다.",
    '<div class="grid2">'+
      field("target.industry","관심 산업","예: 에너지, 반도체, 자동차, 금융, 콘텐츠",false)+
      field("target.job","분석할 직무","예: 생산기술, 데이터분석, 영업, 품질관리, 인사",false)+
      field("student.major","내 전공","예: 전기공학, 경영학, 화학공학, 컴퓨터공학",false)+
      field("target.initialView","지금 생각하는 이 직무 <span class=\"hint\">(선택)</span>","이 직무는 어떤 일을 하는 사람이라고 생각하나요?")+
    '</div>'+
    '<div class="callout good"><b>여기까지 입력하면 충분합니다.</b> 다음 단계부터 직무·전공에 맞춰 AI 프롬프트가 자동으로 달라집니다.</div>');
}

function jobSite(name,url,desc){
  return '<a class="jobSite" href="'+url+'" target="_blank" rel="noopener"><b>'+name+'</b><span>'+desc+'</span></a>';
}

function searchPromptValue(){
  const generated=energySearchPrompt();
  const draft=state.promptDrafts?.search;
  if(!filled(draft))return generated;
  const genLines=generated.split("\n");
  let value=String(draft);
  if(/^확인 기준일:.*$/m.test(value))value=value.replace(/^확인 기준일:.*$/m,genLines[0]);
  else value=genLines[0]+"\n"+genLines[1]+"\n\n"+value;
  const identity=genLines.find(x=>x.startsWith("나는 "))||"";
  if(/^나는 .* 전공 대학생이고, .* 산업의 .*를 탐색하고 있어\.$/m.test(value))value=value.replace(/^나는 .* 전공 대학생이고, .* 산업의 .*를 탐색하고 있어\.$/m,identity);
  return value;
}

function step2SearchPromptBox(){
  const searchPrompt=searchPromptValue();
  return '<details class="optionBox"><summary>AI에게 현재 공고 찾아달라고 하기 · 선택</summary><div class="optionBody">'+
    '<p class="help">STEP 1의 전공·산업·직무와 오늘 날짜(KST)를 넣어 자동 생성합니다. 다시 접속하거나 날짜가 바뀌면 기준일도 새로 계산됩니다.</p>'+
    '<textarea class="promptBox promptEditor" id="searchPromptPreview" data-prompt-key="search">'+h(searchPrompt)+'</textarea>'+
    '<div class="actions compactActions"><button class="btn secondary" id="copySearchPromptBtn">내 검색 프롬프트 복사</button></div></div></details>';
}

function step2(){
  return shell(2,"Find JD","먼저 내가 관심 있는 산업의 최근 채용공고를 직접 찾아봅니다. 공고가 없거나 마감되어 있어도 괜찮습니다.",
    '<div class="block"><h3>① 실제 공고 한번 찾아보기</h3><p class="help">공고가 있으면 기록하고, 없으면 “현재 찾지 못함”이라고 적고 STEP 3으로 이동합니다.</p><div class="siteSection"><b>민간기업</b><div class="jobSiteGrid">'+
      jobSite("사람인","https://www.saramin.co.kr/","민간기업 신입 공고")+
      jobSite("잡코리아","https://www.jobkorea.co.kr/","대기업·공채")+
      jobSite("고용24","https://www.work24.go.kr/","정부 통합 채용정보")+
    '</div></div><div class="siteSection"><b>공공기관</b><div class="jobSiteGrid">'+
      jobSite("잡알리오","https://job.alio.go.kr/","국가 공공기관")+
      jobSite("클린아이 잡플러스","https://job.cleaneye.go.kr/","지방공공기관")+
    '</div></div></div>'+
    '<div class="block"><h3>② 검색 결과 한 줄만 기록</h3><div class="grid2">'+
      field("step2Search.company","찾은 기업","예: 관심 기업명 / 찾지 못함",false)+
      field("step2Search.title","찾은 직무·공고","예: 기술직 신입 / 현재 관련 공고 없음",false)+
      '<div class="field span2"><label>공고 주소 <span class="hint">(선택)</span></label><input class="input" data-path="step2Search.sourceUrl" value="'+h(state.step2Search.sourceUrl||"")+'" placeholder="https://..." /></div>'+
      field("step2Search.facts","담당업무·직무소개 <span class=\"hint\">(가능하면 붙여넣기)</span>","공고의 담당업무·직무소개를 그대로 붙여넣으면 STEP 3에서 다시 입력하지 않아도 됩니다.")+
      field("step2Search.memo","검색 메모 <span class=\"hint\">(선택)</span>","어떤 검색어를 썼는지, 왜 적절한 공고를 찾기 어려웠는지 간단히 적어도 됩니다.")+
    '</div><div class="actions compactActions"><button class="btn primary" id="useStep2JobBtn">이 공고로 STEP 3 직무분석하기</button></div></div>'+step2SearchPromptBox()+
    '<div class="callout info"><b>공고가 없어도 수업은 계속됩니다.</b> STEP 3에서는 수업용 예시로 한국에너지공단과 HD현대일렉트릭의 2026년 신입 채용을 제공합니다.</div>');
}

function postingLines(text=""){
  return String(text).split(/\r?\n/).map(x=>x.replace(/^[\s·•▶▷■□▪\-–—*]+/,"").trim()).filter(Boolean);
}

const sectionRules=[
  ["tasks",/(담당\s*업무|주요\s*업무|업무\s*내용|직무\s*내용|수행\s*업무|주요\s*역할|하는\s*일)/i],
  ["required",/(자격\s*요건|지원\s*자격|필수\s*요건|필수\s*사항|필수\s*조건|요구\s*사항|응시\s*자격)/i],
  ["preferred",/(우대\s*사항|우대\s*조건|우대\s*요건|가점|preferred)/i],
  ["other",/(기타|근무\s*조건|복리\s*후생|채용\s*절차|전형\s*절차|전형\s*방법)/i]
];

function lineSection(line,current="other"){
  const hit=sectionRules.find(([,rx])=>rx.test(line));
  if(hit)return hit[0];
  if(current==="tasks"||current==="required"||current==="preferred")return current;
  if(/우대|가점|preferred/i.test(line))return "preferred";
  if(/필수|자격|졸업|학위|전공|경력\s*\d|어학|자격증|지원\s*가능/i.test(line))return "required";
  if(/담당|수행|관리|분석|기획|개선|운영|개발|설계|검토|대응|지원|최적화|모니터링|정비|점검/i.test(line))return "tasks";
  return current;
}

function parsePosting(text=""){
  const out={tasks:[],required:[],preferred:[],other:[]};
  let current="other";
  postingLines(text).forEach(line=>{
    const hit=sectionRules.find(([,rx])=>rx.test(line));
    if(hit){
      current=hit[0];
      const rest=line.replace(hit[1],"").replace(/^[\s:：\-–—]+/,"").trim();
      if(rest)out[current].push(rest);
      return;
    }
    current=lineSection(line,current);
    out[current].push(line);
  });
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,[...new Set(v)].join("\n")]));
}

function postingSection(p,key){
  if(filled(p[key]))return p[key];
  return parsePosting(p.text)[key]||"";
}

function autoParsePosting(){
  const p=state.postings[activePosting];
  if(!filled(p.text)){toast("먼저 채용공고 원문을 붙여넣어 주세요.");return;}
  const parsed=parsePosting(p.text);
  ["tasks","required","preferred","other"].forEach(k=>{if(!filled(p[k]))p[k]=parsed[k];});
  save();render();toast("공고를 TASK · GATE · 우대 · 전형/기타로 나눴습니다.");
}

const dict={
  "지식(Knowledge)":["공정","품질","회계","재무","마케팅","시장","전기","전자","기계","화학","에너지","안전","환경","법규","제품","산업","원가","생산","설비","전력","전공"],
  "기술(Skill)":["분석","Excel","엑셀","Python","파이썬","SQL","CAD","GIS","ArcGIS","Minitab","미니탭","통계","데이터","보고서","프레젠테이션","영어","어학","문서","설계","개선","최적화","모니터링"],
  "행동(Behavior)":["협업","소통","문제해결","문제 해결","주도","책임","고객","커뮤니케이션","조율","적극","논리","꼼꼼","유관부서","유관 부서"],
  "경험(Experience)":["인턴","프로젝트","실험","연구","현장","공모전","아르바이트","실습","경력","경험","캡스톤","교육","자격증"]
};

function rx(x){return x.replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");}

function signals(){
  const text=state.postings.map(p=>p.text).join("\n"),out={};
  Object.entries(dict).forEach(([cat,words])=>{
    out[cat]=words.map(w=>({w,count:(text.match(new RegExp(rx(w),"gi"))||[]).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);
  });
  return out;
}

function lineSignals(line){
  const found=[];
  Object.entries(dict).forEach(([cat,words])=>{
    const hits=words.filter(w=>new RegExp(rx(w),"i").test(line));
    if(hits.length)found.push({cat,words:hits});
  });
  return found;
}

function evidenceRows(){
  const rows=[];
  state.postings.forEach((p,i)=>{
    if(!filled(p.text))return;
    [["TASK","tasks"],["GATE","required"],["PREFERENCE","preferred"]].forEach(([label,key])=>{
      postingLines(postingSection(p,key)).forEach(line=>rows.push({posting:i+1,section:label,line,signals:lineSignals(line)}));
    });
  });
  return rows;
}

function signalLabel(items){
  if(!items.length)return '<span class="hint">직접 판단</span>';
  return items.map(x=>'<span class="pill">'+h(x.cat.split("(")[0].trim())+' · '+h(x.words.slice(0,3).join(", "))+'</span>').join(" ");
}

const signalGroups=[
  {label:"데이터 분석",terms:["데이터 분석","데이터","통계","Excel","엑셀","Python","파이썬","SQL","Minitab","미니탭"]},
  {label:"문제해결·개선",terms:["문제해결","문제 해결","개선","원인 분석","최적화"]},
  {label:"협업·소통",terms:["협업","소통","커뮤니케이션","유관부서","유관 부서","조율"]},
  {label:"공정·생산·설비",terms:["공정","생산","설비","수율","가동","품질","정비","점검"]},
  {label:"안전·환경",terms:["안전","환경","PSM","위험성평가","법규"]},
  {label:"현장·프로젝트 경험",terms:["인턴","프로젝트","현장","실습","캡스톤","경험","경력"]}
];

function firstEvidence(text,terms){
  return postingLines(text).find(line=>terms.some(w=>new RegExp(rx(w),"i").test(line)))||"";
}

function commonSignalRows(){
  return signalGroups.map(g=>{
    const cells=state.postings.map(p=>{
      if(!filled(p.text))return {hit:false,evidence:""};
      const evidence=firstEvidence(p.text,g.terms);
      return {hit:!!evidence,evidence};
    });
    return {label:g.label,n:cells.filter(x=>x.hit).length,cells};
  }).filter(x=>x.n).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,"ko"));
}

function optionalComparison(){
  const valid=state.postings.filter(p=>filled(p.text)).length,rows=commonSignalRows();
  const trs=rows.length?rows.map(r=>'<tr><td><b>'+h(r.label)+'</b></td><td>'+r.n+'</td>'+r.cells.map(c=>'<td>'+(c.hit?'<b>✓</b><br><span class="hint">'+h(c.evidence.slice(0,90))+'</span>':'-')+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="5">공고 2~3개를 입력하면 비교표가 만들어집니다.</td></tr>';
  return '<details class="optionBox comparisonOption"><summary>심화 OPTION · 같은 직무 공고 2~3개 비교하기</summary><div class="optionBody">'+
    '<div class="callout '+(valid>=2?"good":"info")+'">현재 공고 <b>'+valid+'개</b>가 입력되어 있습니다. 이번 수업은 공고 1개만 분석해도 충분합니다.</div>'+
    '<div class="tableWrap"><table><thead><tr><th>요구 신호</th><th>등장 공고 수</th><th>공고 1 근거</th><th>공고 2 근거</th><th>공고 3 근거</th></tr></thead><tbody>'+trs+'</tbody></table></div>'+
    '<div class="grid2">'+field("comparison.common","여러 공고의 공통 요구","여러 회사에서 반복되는 요구")+field("comparison.differences","기업별 차이","특정 회사에서만 강조되는 요구")+'</div></div></details>';
}

function selectedRoleData(id=state.sampleJobId){
  const lib=CURATED_ROLE_LIBRARIES[id], sel=state.curatedSelection?.[id]||{};
  return lib?.groups?.[sel.group]?.roles?.[sel.role]||null;
}

function keaRecruitmentContext(group,roleData){
  if(state.sampleJobId!=="kea-2026-h2"||!roleData)return "";
  const documentRule=group==="사무"?KEA_COMMON_RECRUITMENT.documentOffice:KEA_COMMON_RECRUITMENT.documentTech;
  return [
    "채용인원: "+(roleData.headcount||"공고 확인"),
    "공통 응시자격: "+KEA_COMMON_RECRUITMENT.commonEligibility,
    "서류전형: "+documentRule,
    "인정 외국어시험: "+KEA_COMMON_RECRUITMENT.languageTests,
    "직무기술자격: "+(roleData.certs||"공고 확인"),
    "필기전형: "+KEA_COMMON_RECRUITMENT.written,
    "직무별 전공시험 범위: "+(roleData.exam||"공고 확인"),
    "면접전형: "+KEA_COMMON_RECRUITMENT.interview
  ].join("\n");
}

function hdElectricRecruitmentContext(roleData){
  if(state.sampleJobId!=="hdelectric-2026-h2"||!roleData)return "";
  return [
    "공통 지원자격: 학사 이상 기졸업자 또는 2027년 2월 졸업예정자 · 2027년 1월 정규직 입사 가능",
    "어학: TOEIC Speaking 120점 이상 또는 OPIc IM2 이상(마감일 기준 유효성적)",
    "기타: 해외여행 결격사유 없음 · 남성은 병역필 또는 면제",
    "선택 직무 우대사항: "+(roleData.preferred||"공고 별도 확인"),
    "근무지: "+(roleData.location||"공고 확인"),
    "공식 직무소개 핵심축: "+(roleData.focus||roleData.tasks)
  ].join("\n");
}

function searchedJob(){
  const x=state.step2Search||{};
  const ready=filled(x.company)&&filled(x.title)&&(filled(x.sourceUrl)||filled(x.facts)||filled(x.memo));
  if(!ready)return null;
  return {
    id:"searched",
    type:"STEP 2 직접 검색",
    company:x.company,
    title:x.title,
    role:state.target.job||"관심 직무",
    period:"",
    sourceUrl:x.sourceUrl||"",
    source:"STEP 2에서 학생이 직접 찾은 공고",
    facts:x.facts||x.memo||"",
    required:"",
    preferred:"",
    note:"STEP 2에서 직접 찾은 공고입니다. 입력하지 않은 지원조건은 공고 원문에서 추가 확인합니다."
  };
}

function selectedJob(){
  if(state.sampleJobId==="custom")return {...emptyCustomJob(),...(state.customJob||{})};
  if(state.sampleJobId==="searched")return searchedJob();
  const base=CURATED_JOBS.find(x=>x.id===state.sampleJobId);
  if(!base)return null;
  const sel=state.curatedSelection?.[base.id]||{};
  const roleData=selectedRoleData(base.id);
  if(!roleData)return {...base,selectedGroup:sel.group||"",selectedRole:sel.role||"",roleData:null};
  const roleFacts=[
    roleData.ncs?"NCS/직무분류: "+roleData.ncs:"",
    "직무수행내용: "+roleData.tasks,
    "필요지식: "+roleData.knowledge,
    "필요기술: "+roleData.skills,
    "직무수행태도: "+roleData.attitudes,
    roleData.preferred?"공식 우대사항: "+roleData.preferred:"",
    roleData.location?"근무지: "+roleData.location:"",
    roleData.commonAbilities?"직업공통능력: "+roleData.commonAbilities:""
  ].filter(Boolean).join("\n");
  const recruitmentInfo=base.id==="kea-2026-h2"
    ?keaRecruitmentContext(sel.group,roleData)
    :base.id==="hdelectric-2026-h2"
      ?hdElectricRecruitmentContext(roleData)
      :"";
  return {
    ...base,
    role:sel.group+" · "+sel.role,
    selectedGroup:sel.group,
    selectedRole:sel.role,
    roleData,
    facts:roleFacts,
    recruitmentInfo,
    note:(CURATED_ROLE_LIBRARIES[base.id]?.sourceLabel||base.source)+" 중 '"+sel.role+"' 관련 기준자료만 사용합니다."
  };
}

function selectedCuratedJob(){return selectedJob();}

function curatedRoleReady(id=state.sampleJobId){
  if(id==="custom")return filled(state.customJob?.company)&&filled(state.customJob?.role)&&filled(state.customJob?.facts);
  const lib=CURATED_ROLE_LIBRARIES[id];
  if(!lib)return true;
  if(!Object.keys(lib.groups||{}).length)return false;
  const sel=state.curatedSelection?.[id]||{};
  return !!(sel.group&&sel.role&&lib.groups?.[sel.group]?.roles?.[sel.role]);
}

function majorExplorationHint(major=""){
  return "내 전공 '"+(major||"미입력")+"'을 참고하되, 전공만으로 직무를 자동 결정하지 않습니다. 공고의 직무별 필수조건과 실제 업무를 비교해 직접 선택하세요.";
}

function clearPromptDrafts(keys=["job","keyword","gap","selfIntro","interview"]){
  state.promptDrafts??={};
  keys.forEach(k=>state.promptDrafts[k]="");
}

function promptValue(key,generated){
  return state.promptDrafts?.[key]||generated;
}

function updatePromptDraft(key,value){
  state.promptDrafts??={};
  state.promptDrafts[key]=value;
  save();
}

function syncPromptPreview(key,generator,elementId){
  const value=generator();
  state.promptDrafts??={};
  state.promptDrafts[key]=value;
  const el=document.getElementById(elementId);
  if(el)el.value=value;
}

function refreshStep4Prompt(){
  if(document.getElementById("keywordPromptPreview"))syncPromptPreview("keyword",competencyKeywordPrompt,"keywordPromptPreview");
}

function refreshStep5Derived(){
  if(!document.getElementById("gapPromptPreview"))return;
  syncRequirementEvidence();
  state.requirements.forEach((r,i)=>{
    const note=document.querySelector('[data-req="'+i+'"][data-reqkey="note"]');
    if(note&&note.value!==r.note)note.value=r.note||"";
  });
  const assets=document.getElementById("derivedGapAssetsPreview");
  if(assets)assets.textContent=derivedGapAssets()||"아직 입력된 스펙·충족 근거가 없습니다.";
  syncPromptPreview("gap",gapPrompt,"gapPromptPreview");
}

function jobAnalysisPrompt(){
  const j=selectedJob();
  if(!j)return "먼저 STEP 3에서 분석 방법을 선택하세요.";
  const custom=state.sampleJobId==="custom";
  const isKea=state.sampleJobId==="kea-2026-h2";
  const isHd=state.sampleJobId==="hdelectric-2026-h2";
  const rd=j.roleData||{};
  const keaGuide=isKea?keaRolePromptGuide(j.selectedRole):null;
  const hdGuide=isHd?hdElectricRolePromptGuide(j.selectedRole):null;
  if(!custom&&!curatedRoleReady())return "먼저 내 전공을 확인하고, 이 기업의 지원 직군과 분석할 세부직무를 하나 선택하세요.";
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 대학생이다.",
    "",
    custom?"[내가 직접 입력한 분석 대상]":"[교수자가 제공한 실제 채용자료에서 내가 선택한 분석 대상]",
    "기업: "+(j.company||"미입력"),
    "공고: "+(j.title||"미입력"),
    "선택한 직군·직무: "+(j.role||"미입력"),
    ...(!custom&&filled(j.period)?["모집기간: "+j.period]:[]),
    "",
    custom?"[내가 입력한 공고·직무 정보]":"[선택한 직무 기준자료]",
    j.facts||"미입력",
    ...(j.recruitmentInfo?["","[채용전형·지원조건]",j.recruitmentInfo]:[]),
    "",
    "필수·지원자격: "+(j.required||"미입력"),
    "공통/기타 우대사항: "+(j.preferred||"미입력"),
    "출처 링크: "+(j.sourceUrl||"미입력"),
    "",
    custom
      ?"내가 붙여넣은 '담당업무·직무기술서 핵심내용'을 1차 사실 근거로 사용해. 공고 URL을 열 수 있다면 원문과 대조하고, 열 수 없다면 붙여넣은 내용만 근거로 분석해. 직무명만 보고 일반적인 업무를 사실처럼 추가하지 마."
      :"위에 제공된 '"+(j.selectedRole||j.role)+"' 직무만 분석해줘. 같은 기업의 다른 직무는 섞지 마.",
    custom?"[직접입력 분석 절차]":"",
    custom?"1. 붙여넣은 담당업무를 서로 겹치지 않는 3~5개 업무축으로 먼저 묶는다.":"",
    custom?"2. 각 업무축에서 고객/이해관계자, 반복 과업, 해결과제, 해결방법을 연결한다.":"",
    custom?"3. 공고에 직접 적힌 내용은 [공고근거], 직무 특성에서 도출한 내용은 [추론], 판단할 수 없는 내용은 [추가 확인 필요]로 표시한다.":"",
    custom?"4. 지원자격·우대사항은 직무 수행내용과 구분하며, 우대사항을 필수조건이나 실제 업무로 바꾸지 않는다.":"",
    custom?"5. 필요역량은 반드시 앞에서 정리한 과업 또는 해결과제와 연결한다. '소통·책임감·문제해결' 같은 범용어만 단독으로 쓰지 않는다.":"",
    custom?"6. 경력개발은 공고의 업무·우대사항을 기준으로 '지금 준비 → 신입 초기 → 전문성 확장' 순서로 제시하며 회사 내부 직급·연차·승진경로는 만들지 않는다.":"",
    isKea?"한국에너지공단은 모집직무가 채용을 위한 구분이고 입사 후 순환근무가 원칙이라는 점을 별도로 표시해줘. 현재 직무분석은 내가 선택한 모집직무의 공식 NCS 직무기술서만 기준으로 해줘.":"",
    isKea?"[선택 직무 세부분석 지침] "+keaGuide.analysis:"",
    isHd?"HD현대일렉트릭은 공식 공고에서 직무소개·우대사항·근무지만 확인된다. 필요지식·기술·태도를 추가할 때는 반드시 [직무특성상 추론]으로 표시하고 공식 공고에 적힌 것처럼 쓰지 마.":"",
    isHd?"[선택 직무 세부분석 지침] "+hdGuide.analysis:"",
    isHd?"[주요 해결과제 지침] "+hdGuide.challenge:"",
    isHd?"[해결방법 지침] "+hdGuide.method:"",
    isHd?"[경력개발 지침] "+hdGuide.career:"",
    "확인되지 않은 내용은 사실처럼 만들지 말고 [추론] 또는 [추가 확인 필요]라고 표시해줘.",
    "",
    "아래 핵심 5개 제목을 정확히 그대로 사용하고 각 제목 아래에 '• ' bullet 2~4개로 답해줘. 마지막 경력개발은 선택 참고정보로 짧게 작성해줘. 제목에 번호·굵게표시·이모지를 붙이지 말고, 표 형식으로 바꾸지 마.",
    "고객·KPI:",
    "• 실제 업무의 고객/이해관계자를 먼저 쓰고, KPI는 공식 자료에 없으면 [추론]으로 업무 품질·정확성·일정·성과 관점만 제시",
    "주요 과업:",
    isKea
      ?"• 공식 NCS/직무수행내용의 서로 다른 업무축을 유지해 4~6개 과업으로 작성하고, 각 bullet 끝에 '(근거: NCS/직무수행내용)'을 붙인다."
      :"• 공식 직무수행내용/직무소개에서 3~5개 핵심 과업을 동사형으로 압축",
    "주요 해결과제:",
    isKea
      ?"• 위 주요 과업 각각에서 신입이 마주칠 수 있는 판단·정확성·규정·데이터·이해관계자 문제를 연결하되, 공식 자료에 직접 없는 상황은 [추론]으로 표시"
      :"• 각 과업에서 실제로 해결해야 하는 문제를 2~4개 도출하되 자료에 없으면 [추론] 표시",
    "해결방법:",
    "• 필요지식·필요기술 또는 공식 직무소개를 바탕으로 '무엇을 확인 → 어떤 기준/도구로 분석·설계·관리 → 무엇으로 검증/보고' 순서로 작성",
    isKea?"• 한국에너지공단 공식 필요지식과 필요기술의 용어를 가능한 한 그대로 연결하고, 일반론으로 바꾸지 않는다.":"",
    "필요역량:",
    "• Knowledge / Skill / Behavior를 구분하고 각 역량 옆에 [공식] 또는 [추론] 표시",
    isKea?"• Knowledge는 공식 '필요지식', Skill은 공식 '필요기술', Behavior는 공식 '직무수행태도'에서 우선 추출하고 직업공통능력은 별도 bullet로 표시한다.":"",
    "경력개발(선택):",
    isKea
      ?"• 전공시험 범위("+((rd.exam)||"공고 확인")+")와 직무기술자격을 반영해 '지금 준비 → 첫 직무 → 확장 분야'를 현실적으로 제시"
      :isHd
        ?"• 위 [경력개발 지침]과 선택 직무 우대사항("+((rd.preferred)||"공고 확인")+")을 함께 사용해 '지금 준비 → 신입 초기 → 전문성 확장'을 제시"
        :"• 현재 준비 → 신입 초기 → 전문성 확장 순서로 제시",
    "",
    "추가 분석 규칙:",
    "- 내 전공 '"+(state.student.major||"미입력")+"'과 이 직무의 연결점을 '직접 연결 / 보완 필요 / 전공무관' 중 하나로 설명한다.",
    isKea?"- 한국에너지공단 서류·필기·면접 정보는 직무분석의 근거로 활용하되 합격 가능성이나 확률은 계산하지 않는다.":"",
    isKea?"- 선택 직무의 NCS 세부 업무축을 하나의 '에너지 업무'로 뭉뚱그리지 않는다. 각 bullet이 어떤 세부 업무축과 연결되는지 드러나게 쓴다.":"",
    isHd?"- HD현대일렉트릭의 우대전공·자격·경험은 '필수'로 바꾸어 쓰지 않는다.":"",
    "- KPI가 자료에 없으면 임의의 수치 목표를 만들지 않는다.",
    "- 내가 제공하지 않은 기업 내부 프로세스나 수치를 만들지 않는다.",
    "- 한 bullet은 가능한 한 1~2줄 이내로 작성한다.",
    ...bulletOutputRules()
  ].filter(Boolean).join("\n");
}

function parseJobTableResult(raw){
  const map=[
    ["customerKpi",/^(?:고객\s*[·/&]\s*KPI|고객\s*및\s*KPI|고객|KPI)\s*[:：]?/i],
    ["tasks",/^(?:주요\s*과업|과업|주요\s*업무)\s*[:：]?/i],
    ["challenge",/^(?:주요\s*해결과제|해결과제|과제)\s*[:：]?/i],
    ["method",/^(?:해결방법|해결\s*방법|방법)\s*[:：]?/i],
    ["competencies",/^(?:필요역량|필요\s*역량|역량)\s*[:：]?/i],
    ["careerPlan",/^(?:경력개발(?:\(선택\))?|경력\s*개발|경력계획)\s*[:：]?/i]
  ];
  const out={};let current="";
  for(const original of String(raw||"").split(/\r?\n/)){
    const line=original.trim();if(!line)continue;
    const normalized=line
      .replace(/^(?:[-*•]\s*)/,"")
      .replace(/^(?:#{1,6}\s*)/,"")
      .replace(/^(?:\d+\s*[.)]\s*)/,"")
      .replace(/\*\*/g,"")
      .replace(/__/g,"")
      .replace(/^\[([^\]]+)\](?=\s*[:：]?)/,"$1")
      .trim();
    const hit=map.find(([,re])=>re.test(normalized));
    if(hit){
      current=hit[0];
      const rest=normalized.replace(hit[1],"").trim().replace(/^[-*•]\s*/,"");
      if(rest)out[current]=rest;
      continue;
    }
    if(current)out[current]=(out[current]?out[current]+"\n":"")+line.replace(/^[-*•]\s*/,"").replace(/^\*\*(.*?)\*\*$/,"$1");
  }
  return out;
}

function analysisMethodCards(){
  const custom=state.customJob||emptyCustomJob();
  const cards=[
    ...CURATED_JOBS.map((j,i)=>({
      ...j,
      method:"방법 "+(i+1),
      desc:i===0?"현재 한국에너지공단 신입 채용에서 직무를 골라 분석":"HD현대일렉트릭 신입공채의 7개 직무 중 하나를 골라 분석"
    })),
    {
      ...custom,id:"custom",method:"방법 3",type:"직접 입력",
      company:custom.company||"내가 찾은 기업",
      title:custom.title||"기업·직무·공고정보 직접 입력",
      period:custom.period||"아래 입력칸 사용",
      desc:"아래에 항상 보이는 입력칸에 내 공고 정보를 직접 입력"
    }
  ];
  return '<div class="curatedJobGrid threeMethods">'+cards.map(j=>{
    const on=state.sampleJobId===j.id;
    const pending=j.id==="skenergy-2026-clx"&&!Object.keys(CURATED_ROLE_LIBRARIES[j.id]?.groups||{}).length;
    return '<article class="curatedJob '+(on?"selected":"")+'">'+
      '<div class="curatedMeta"><span>'+h(j.method+" · "+j.type)+'</span><small>'+h(j.period||"")+'</small></div>'+
      '<h3>'+h(j.company)+'</h3><b>'+h(j.title)+'</b>'+
      '<p>'+h(j.desc||j.facts)+'</p>'+
      (pending?'<div class="sourcePending">직무자료 등록 대기 · 자료를 주시면 직무 선택목록이 열립니다.</div>':'')+
      '<div class="curatedLinks">'+
        (j.id!=="custom"&&j.sourceUrl?'<a href="'+h(j.sourceUrl)+'" target="_blank" rel="noopener">공고 원문</a>':'<span class="hint">아래 직접입력란</span>')+
        '<button class="btn '+(on?"primary":"secondary")+'" data-analysis-method="'+h(j.id)+'">'+(j.id==="custom"?"직접 입력하기":on?"현재 선택":"이 기업 선택")+'</button>'+
      '</div>'+
    '</article>';
  }).join("")+'</div>';
}

function curatedRoleSelector(id){
  const lib=CURATED_ROLE_LIBRARIES[id];
  if(!lib)return "";
  const groups=Object.keys(lib.groups||{});
  const sel=state.curatedSelection?.[id]||{group:"",role:""};
  const groupLabel=lib.groupLabel||"직군";
  const roleLabel=lib.roleLabel||"분석할 직무";
  const groupOpts='<option value="">'+h(groupLabel)+' 선택</option>'+groups.map(g=>'<option value="'+h(g)+'" '+(sel.group===g?"selected":"")+'>'+h(g)+' · '+h(lib.groups[g].headcount||"")+'</option>').join("");
  const roles=sel.group?Object.keys(lib.groups[sel.group]?.roles||{}):[];
  const roleOpts='<option value="">'+h(roleLabel)+' 선택</option>'+roles.map(r=>'<option value="'+h(r)+'" '+(sel.role===r?"selected":"")+'>'+h(r)+'</option>').join("");
  const role=selectedRoleData(id);
  const majorInfo=lib.majorNote||majorExplorationHint(state.student.major);
  const summary=role?[
    role.headcount?'<span>채용인원 · '+h(role.headcount)+'</span>':"",
    role.location?'<span>근무지 · '+h(role.location)+'</span>':"",
    '<span>공식 업무 · '+h(role.tasks)+'</span>',
    role.preferred?'<span>공식 우대사항 · '+h(role.preferred)+'</span>':"",
    role.exam?'<span>전공시험 · '+h(role.exam)+'</span>':""
  ].filter(Boolean).join(""):"";
  const detail=role?[
    role.ncs?'<p><b>NCS/직무분류</b><br>'+h(role.ncs)+'</p>':"",
    '<p><b>필요지식</b><br>'+h(role.knowledge)+'</p>',
    '<p><b>필요기술</b><br>'+h(role.skills)+'</p>',
    '<p><b>직무수행태도</b><br>'+h(role.attitudes)+'</p>',
    role.certs?'<p><b>직무기술자격</b><br>'+h(role.certs)+'</p>':""
  ].filter(Boolean).join(""):"";
  return '<div class="rolePicker">'+
    '<div class="majorStrip"><span>내 전공</span><b>'+h(state.student.major||"STEP 1에서 전공을 입력하세요.")+'</b></div>'+
    '<div class="callout info">'+h(majorInfo)+'</div>'+
    (lib.selectionNote?'<div class="callout warn"><b>공고 구조 확인</b> '+h(lib.selectionNote)+'</div>':'')+
    '<div class="grid2">'+
      '<div class="field"><label>1. '+h(groupLabel)+' 선택</label><select class="input" data-curated-group="'+h(id)+'">'+groupOpts+'</select></div>'+
      '<div class="field"><label>2. '+h(roleLabel)+' 선택</label><select class="input" data-curated-role="'+h(id)+'" '+(sel.group?"":"disabled")+'>'+roleOpts+'</select></div>'+
    '</div>'+
    '<p class="help">기준자료 · '+h(lib.sourceLabel)+'</p>'+
    (role
      ?'<div class="roleEvidence"><b>'+h(sel.group+" → "+sel.role)+'</b>'+summary+'</div><details class="optionBox compactRoleDetails"><summary>선택 직무 기준자료 더 보기</summary><div class="optionBody">'+detail+'</div></details>'
      :'<div class="callout good"><b>'+h(roleLabel)+'를 하나 고르세요.</b> 선택한 항목의 자료만 다음 AI 직무분석에 사용됩니다.</div>')+
  '</div>';
}

function customJobFields(){
  const j=state.customJob||emptyCustomJob();
  const ready=filled(j.company)&&filled(j.role)&&filled(j.facts);
  return '<div class="customJobBox customAlways" id="customJobEntry">'+
    '<div class="customEntryHead"><div><span>방법 3</span><h3>내가 찾은 기업 · 직무 · 공고정보 직접 입력</h3><p>기업명·직무와 공고의 담당업무를 입력한 뒤 ③ AI 직무분석으로 이어갑니다.</p></div><button class="btn '+(ready?"primary":"secondary")+'" id="useCustomJobBtn">'+(ready?"③ AI 직무분석 열기":"② 입력 완료 → ③ AI 직무분석 열기")+'</button></div>'+
    '<div class="callout good"><b>정확한 분석에 필요한 최소 자료</b> 기업명 + 직무 + 공고에 적힌 담당업무가 필요합니다. 공고 URL과 지원자격·우대사항까지 넣으면 분석 근거가 더 선명해집니다.</div>'+
    '<div class="grid2">'+
      '<div class="field"><label>기업명</label><input class="input" data-customjob="company" value="'+h(j.company)+'" placeholder="예: 한화솔루션" /></div>'+
      '<div class="field"><label>직무·분야</label><input class="input" data-customjob="role" value="'+h(j.role)+'" placeholder="예: 생산기술 / 전기설비 / 안전환경" /></div>'+
      '<div class="field"><label>공고명 <span class="hint">(선택)</span></label><input class="input" data-customjob="title" value="'+h(j.title)+'" placeholder="예: 2026 하반기 생산기술 신입" /></div>'+
      '<div class="field"><label>공고 URL <span class="hint">(선택)</span></label><input class="input" data-customjob="sourceUrl" value="'+h(j.sourceUrl)+'" placeholder="https://..." /></div>'+
    '</div>'+
    '<div class="field"><label>공고의 담당업무·직무소개 <span class="hint">(필수)</span></label><textarea class="input" data-customjob="facts" placeholder="채용공고의 담당업무·직무소개를 그대로 붙여넣으세요. 여러 항목이면 줄바꿈해서 입력하세요.">'+h(j.facts)+'</textarea></div>'+
    '<details class="optionBox"><summary>지원자격·우대사항도 입력하기 · 선택</summary><div class="optionBody"><div class="grid2">'+
      '<div class="field"><label>필수·지원자격</label><textarea class="input" data-customjob="required" placeholder="전공, 학력, 어학, 자격증 등">'+h(j.required)+'</textarea></div>'+
      '<div class="field"><label>우대사항</label><textarea class="input" data-customjob="preferred" placeholder="자격증, 경험, 기술 등">'+h(j.preferred)+'</textarea></div>'+
    '</div></div></details>'+
  '</div>';
}

function jobTableFields(){
  return '<div class="jobTableCards">'+
    '<div class="jobTableItem"><span>01</span>'+field("jobTable.customerKpi","고객(KPI)","이 직무의 고객은 누구이며 성과는 무엇으로 확인할까?")+'</div>'+
    '<div class="jobTableItem"><span>02</span>'+field("jobTable.tasks","주요 과업","실제로 반복해서 수행하는 일은 무엇인가?")+'</div>'+
    '<div class="jobTableItem"><span>03</span>'+field("jobTable.challenge","주요 해결과제","업무에서 해결해야 하는 문제는 무엇인가?")+'</div>'+
    '<div class="jobTableItem"><span>04</span>'+field("jobTable.method","해결방법","어떤 방법·절차·도구로 해결하는가?")+'</div>'+
    '<div class="jobTableItem"><span>05</span>'+field("jobTable.competencies","필요역량","필요한 지식·기술·행동은 무엇인가?")+'</div>'+
    '<details class="optionBox"><summary>경력개발 방향 보기 · 선택</summary><div class="optionBody">'+field("jobTable.careerPlan","경력개발 <span class=\"hint\">(선택)</span>","지금 준비 → 신입 초기 → 전문성 확장 방향")+'</div></details>'+
  '</div>';
}

function jobTablePreview(){
  const cells=[
    ["고객(KPI)","jobTable.customerKpi",state.jobTable.customerKpi],
    ["과업","jobTable.tasks",state.jobTable.tasks],
    ["주요 해결과제","jobTable.challenge",state.jobTable.challenge],
    ["해결방법","jobTable.method",state.jobTable.method],
    ["필요역량","jobTable.competencies",state.jobTable.competencies]
  ];
  return '<div class="tableWrap jobAnalysisPreview"><table><thead><tr>'+cells.map(x=>'<th>'+x[0]+'</th>').join("")+'</tr></thead><tbody><tr>'+cells.map(x=>'<td data-preview="'+x[1]+'">'+h(x[2]||"-")+'</td>').join("")+'</tr></tbody></table></div>';
}

function step3(){
  const j=selectedJob();
  const isCustom=state.sampleJobId==="custom";
  const ready=isCustom?curatedRoleReady("custom"):curatedRoleReady(state.sampleJobId);
  const analyzedCount=Object.values(state.analysisCases||{}).filter(c=>
    c?.jobTable&&["customerKpi","tasks","challenge","method","competencies","careerPlan"].some(k=>filled(c.jobTable[k]))
  ).length;
  const methodSpecific = state.sampleJobId&&state.sampleJobId!=="custom"
    ? '<div class="block"><h3>② 내 전공 확인 → 이 기업에서 분석할 직무 선택</h3>'+curatedRoleSelector(state.sampleJobId)+'</div>'
    : "";
  const customEntry = isCustom
    ? '<div class="block customEntryBlock"><h3>② 내 전공 확인 → 이 기업에서 분석할 직무 입력</h3><div class="majorStrip"><span>내 전공</span><b>'+h(state.student.major||"STEP 1에서 전공을 입력하세요.")+'</b></div><div class="callout info">'+h(majorExplorationHint(state.student.major))+'</div>'+customJobFields()+'</div>'
    : "";
  const sourceDetails = j&&ready
    ? '<details class="optionBox"><summary>선택 직무의 기준자료 보기</summary><div class="optionBody">'+
        '<div class="callout info"><b>'+h(isCustom?"직접 입력한 공고·직무 자료":j.source||"공고 기준자료")+'</b><br>'+h(j.facts||"담당업무·직무기술서 핵심내용 미입력").replace(/\n/g,"<br>")+'</div>'+
        '<div class="callout warn"><b>필수·지원자격:</b><br>'+h(j.required||"입력 또는 공고 확인 필요").replace(/\n/g,"<br>")+'<br><br><b>우대·확인사항:</b><br>'+h(j.preferred||"입력 또는 공고 확인 필요").replace(/\n/g,"<br>")+'</div>'+
        (j.sourceUrl?'<div class="actions compactActions"><a class="btn ghost" href="'+h(j.sourceUrl)+'" target="_blank" rel="noopener">선택 직무 공고 원문 열기</a></div>':"")+
      '</div></details>'
    : "";
  const lockedFlow = state.sampleJobId&&!ready
    ? '<div class="divider"></div>'+
      '<div class="block"><h3>③ AI에게 선택한 직무만 분석시키기</h3><div class="callout info"><b>②를 먼저 완료하세요.</b> '+(isCustom?"기업명·직무·공고의 담당업무를 입력한 뒤 “② 입력 완료 → ③ AI 직무분석 열기”를 누르면":"직무군과 세부직무를 하나 선택하면")+' 이 영역이 바로 열립니다.</div></div>'+
      '<div class="block"><h3>④ 직무분석 테이블 완성</h3><p class="help">③에서 받은 AI 답변을 붙여넣어 핵심 5개 항목을 완성합니다. 경력개발은 선택적으로 확인합니다.</p></div>'+
      '<div class="block"><h3>⑤ 완성된 직무분석표</h3><p class="help">④에서 입력한 내용을 한 표로 확인합니다.</p></div>'
    : "";
  const analysisArea = j&&ready
    ? '<div class="selectedJobSummary"><b>현재 분석 대상 · '+h(j.company||"직접 입력")+" / "+h(j.role||j.title||"직무 미입력")+'</b><span>'+h(j.note||"이 분석 결과는 다른 방법과 별도로 저장됩니다.")+'</span></div>'+
      '<div class="block"><h3>③ AI에게 선택한 직무만 분석시키기</h3><p class="help">현재 선택한 기업·세부직무와 내 전공만 들어갑니다. 같은 기업의 다른 직무는 프롬프트에 섞지 않습니다.</p>'+
        '<textarea class="promptBox promptEditor shortPrompt" id="jobPromptPreview" data-prompt-key="job">'+h(promptValue("job",jobAnalysisPrompt()))+'</textarea>'+
        '<div class="actions compactActions"><button class="btn ghost" id="refreshJobPromptBtn">현재 선택 반영</button><button class="btn secondary" id="copyReviewedJobPromptBtn">내 직무분석 프롬프트 복사</button></div>'+
        '<div class="field aiPaste"><label>AI 답변 붙여넣기 <span class="hint">(선택)</span></label><textarea class="input" data-path="jobTable.aiResult" id="jobTableAiResult" placeholder="AI 답변을 붙여넣으면 핵심 5개 항목과 선택형 경력개발로 나눕니다.">'+h(state.jobTable.aiResult||"")+'</textarea></div>'+
        '<div class="actions compactActions"><button class="btn secondary" id="applyJobTableAiBtn">AI 답변을 직무분석표에 반영</button></div>'+
      '</div>'+
      '<div class="divider"></div><div class="block"><h3>④ 직무분석 테이블 완성</h3><p class="help">이 표는 현재 선택한 세부직무의 작업공간에 따로 저장됩니다.</p>'+jobTableFields()+'</div>'+
      '<div class="block"><h3>⑤ 완성된 직무분석표</h3><p class="help">모바일에서는 좌우로 밀어서 전체 표를 확인합니다.</p>'+jobTablePreview()+'</div>'+
      sourceDetails
    : lockedFlow;
  return shell(3,"3 Ways → Job Analysis","공기업 예시, 대기업 예시, 직접 입력 중 원하는 방법을 선택하고, 그 안에서 분석할 직무 하나를 정합니다.",
    '<div class="block"><h3>① 분석 방법 선택</h3><p class="help">한국에너지공단, HD현대일렉트릭, 직접 입력 모두 ② 직무선택 → ③ AI 분석 → ④ 직무분석 테이블 → ⑤ 완성표의 같은 순서로 진행합니다. 기업을 바꾸거나 같은 기업 안에서 직무를 바꿔도 각 직무의 분석표는 별도로 저장됩니다. 현재 저장된 분석: <b>'+analyzedCount+'개</b></p>'+analysisMethodCards()+'</div>'+
    methodSpecific+
    customEntry+
    analysisArea
  );
}

function experienceRows(){
  return state.experiences.map((e,i)=>{
    const optional=i>0?' <span class="hint">(선택)</span>':'';
    return '<div class="experienceRow '+(state.selectedExperience===i?"selected":"")+'">'+
      '<label class="experiencePick"><input type="radio" name="selectedExperience" data-exp-select="'+i+'" '+(state.selectedExperience===i?"checked":"")+' /> '+(i===0?"대표 경험":"추가 경험 "+(i+1))+optional+'</label>'+
      '<div class="field"><label>경험 이름</label><input class="input" data-exp="'+i+'" data-expkey="title" value="'+h(e.title)+'" placeholder="예: 캡스톤 에너지효율 프로젝트" /></div>'+
      '<div class="field"><label>내가 한 일 한 줄</label><input class="input" data-exp="'+i+'" data-expkey="summary" value="'+h(e.summary)+'" placeholder="예: 운전 데이터를 정리하고 이상값 원인을 비교했다" /></div>'+
    '</div>';
  }).join("");
}

function step4EvidenceDiagnostics(){
  const rep=state.experiences[state.selectedExperience]||emptyExperience();
  const usable=state.experiences.filter(e=>filled(e.title)&&filled(e.summary));
  const required=[];
  const enrich=[];

  if(!filled(state.student.majorEvidence))required.push("전공에서 직무와 연결되는 수업·과제·프로젝트 근거");
  if(usable.length<2)required.push("서로 다른 경험 최소 2개의 '내가 한 일' 근거");
  if(!filled(rep.title||state.star.experience))required.push("대표 경험 선택");
  if(!filled(state.star.actionWhat))required.push("대표 경험에서 내가 직접 한 행동");
  if(!filled(state.star.result)&&!filled(state.star.evidence))required.push("행동 뒤 결과 또는 확인 가능한 증거");

  if(!filled(state.star.situation)&&!filled(state.star.task))enrich.push("대표 경험의 상황 또는 맡은 과제");
  if(!filled(state.star.actionWhy))enrich.push("왜 그 방법을 선택했는지 판단 이유");
  if(!filled(state.star.actionHow))enrich.push("실행 순서·사용 도구·판단 기준");

  const status=required.length
    ?"추가질문 필요"
    :(enrich.length?"기본 분석 가능하지만 보강질문 권장":"분석에 필요한 핵심 근거 확보");

  return {required,enrich,status};
}

function step4EvidenceDiagnosticText(){
  const d=step4EvidenceDiagnostics();
  return [
    "현재 상태: "+d.status,
    "필수적으로 부족한 정보: "+(d.required.length?d.required.join(" / "):"없음"),
    "보강하면 분석 품질이 좋아지는 정보: "+(d.enrich.length?d.enrich.join(" / "):"없음")
  ].join("\n");
}

function competencyKeywordPrompt(){
  const j=selectedCuratedJob(), rd=j?.roleData||selectedRoleData()||{};
  const allExperiences=state.experiences.map((e,i)=>({
    no:i+1,
    title:e.title||"",
    summary:e.summary||""
  })).filter(e=>filled(e.title)||filled(e.summary));
  const rep=state.experiences[state.selectedExperience]||emptyExperience();
  return [
    "너는 취업준비생의 경험을 직무역량 근거로 바꾸는 분석가다. 아래 학생이 실제 입력한 정보만 사용해 분석해줘.",
    "",
    "[학생]",
    "전공: "+(state.student.major||"미입력"),
    "전공에서 찾은 직무 근거: "+(state.student.majorEvidence||"미입력"),
    "",
    "[선택 기업·직무]",
    j?j.company+" / "+j.title+" / "+j.role:"공고 미선택",
    j?"공식/입력 직무자료: "+(j.facts||"미입력"):"",
    j?.required?"지원자격: "+j.required:"",
    j?.preferred?"우대사항: "+j.preferred:"",
    rd.preferred?"직무별 공식 우대사항: "+rd.preferred:"",
    rd.exam?"전공시험 범위: "+rd.exam:"",
    rd.certs?"직무기술자격: "+rd.certs:"",
    "",
    "[STEP 3 직무분석]",
    "고객·KPI: "+(state.jobTable.customerKpi||"미입력"),
    "주요 과업: "+(state.jobTable.tasks||rd.tasks||"미입력"),
    "주요 해결과제: "+(state.jobTable.challenge||"미입력"),
    "해결방법: "+(state.jobTable.method||"미입력"),
    "필요역량: "+(state.jobTable.competencies||[rd.knowledge,rd.skills,rd.attitudes].filter(filled).join(" / ")||"미입력"),
    "경력개발: "+(state.jobTable.careerPlan||"미입력"),
    "",
    "[학생이 입력한 경험 전체]",
    ...(allExperiences.length?allExperiences.map(e=>e.no+". "+(e.title||"경험")+" / 내가 한 일: "+(e.summary||"미입력")):["경험 미입력"]),
    "",
    "[대표 경험의 행동 근거]",
    "대표 경험: "+(rep.title||state.star.experience||"미입력"),
    "S 상황: "+(state.star.situation||"미입력"),
    "T 역할·과제: "+(state.star.task||"미입력"),
    "내가 직접 한 행동: "+(state.star.actionWhat||"미입력"),
    "WHY 판단 이유: "+(state.star.actionWhy||"미입력"),
    "HOW 실행 방식·도구: "+(state.star.actionHow||"미입력"),
    "결과: "+(state.star.result||"미입력"),
    "확인 가능한 증거: "+(state.star.evidence||"미입력"),
    "",
    "[Jobfit의 현재 정보충분도 진단]",
    step4EvidenceDiagnosticText(),
    "",
    "[정보가 부족할 때의 AI 인터뷰 규칙]",
    "1. 최종 역량분석을 시작하기 전에, 지금 자료만으로 직무역량 3~5개를 각각 구체적인 행동근거와 연결할 수 있는지 먼저 판단해라.",
    "2. 정보가 부족하면 최종 분석을 하지 말고 [추가질문] 하나만 제시한 뒤 학생의 답을 기다려라.",
    "3. 한 번에 여러 질문을 묶지 말고 가장 중요한 질문 1개만 물어라. 답을 받으면 기존 정보와 합쳐 다시 충분성을 판단해라.",
    "4. 이미 입력되었거나 이전 답변으로 확인된 내용은 다시 묻지 마라.",
    "5. 질문은 '더 자세히 말해줘'처럼 넓게 묻지 말고, 선택 직무와 대표 경험을 직접 언급해 답하기 쉽게 구체적으로 물어라.",
    "6. 질문 우선순위는 ① 내가 실제로 한 행동 ② 사용한 기준·도구·방법 ③ 결과·산출물·증거 ④ 판단 이유 ⑤ 상황·역할 순서다. 이미 충분한 항목은 건너뛰어라.",
    "7. 필요한 질문은 정보가 충분해질 때까지 이어가되, 학생이 '모르겠다/없다'고 답한 정보는 사실처럼 만들어 채우지 마라.",
    "8. 모든 STAR 항목을 억지로 채우는 것이 목적이 아니다. 직무역량을 행동근거로 설명할 수 있을 만큼만 질문해라.",
    "",
    "[분석 시작 기준]",
    "• 대표 경험에서 본인의 행동이 무엇인지 구체적으로 확인됨",
    "• 행동의 방법·도구·판단기준 중 최소 하나가 확인됨",
    "• 결과·산출물·증거 중 최소 하나가 확인됨",
    "• 최소 2개 경험에서 서로 다른 행동근거를 확인할 수 있음",
    "• 핵심역량 3개 이상을 '직무 과업 ↔ 학생 행동'으로 연결할 수 있음",
    "위 기준을 충족하면 추가질문을 멈추고 아래 분석을 시작해라.",
    "",
    "[추가질문 출력 형식]",
    "[추가질문]",
    "• 질문: (학생의 실제 경험명과 선택 직무를 넣어 한 문장으로 질문)",
    "• 이 질문이 필요한 이유: (한 줄)",
    "이 단계에서는 역량분석 결과를 함께 출력하지 마라.",
    "",
    "[분석 절차]",
    "1. 먼저 직무의 주요 과업·해결과제·필요역량을 기준축으로 잡아라.",
    "2. 경험 1~3을 각각 따로 비교해 어느 과업과 연결되는지 확인하라. 연결이 약한 경험은 억지로 맞추지 마라.",
    "3. 학생이 실제로 쓴 행동에서 동사, 판단기준, 사용한 도구·방법, 산출물·결과를 추출하라.",
    "4. 역량명은 직무자료의 표현을 우선 사용하되, 공식 자료에 없는 역량명은 [직무특성상 추론]으로 표시하라.",
    "5. '소통능력·책임감·문제해결력'처럼 누구에게나 붙일 수 있는 단어만 제시하지 말고 반드시 학생의 행동 근거를 붙여라.",
    "6. 경험 근거가 없는 역량은 학생의 강점으로 확정하지 말고 '현재 근거 부족'으로 남겨라.",
    "7. 모든 학생에게 같은 역량 목록을 주지 말고, 이 학생이 입력한 경험과 선택 직무의 교집합에서만 핵심역량 3~5개를 선정하라.",
    "",
    "[출력 1 · 경험별 직무 연결]",
    "경험 1~3 각각:",
    "• 연결되는 공식 과업/요구:",
    "• 학생의 실제 행동근거:",
    "• 연결 수준: 직접 연결 / 일부 연결 / 근거 약함",
    "",
    "[출력 2 · 이 학생의 핵심 직무역량 3~5개]",
    "각 역량마다:",
    "• 역량명:",
    "• 근거 구분: [공식 직무자료] / [직무특성상 추론]",
    "• 연결되는 직무 과업·해결과제:",
    "• 학생 경험·행동 근거:",
    "• 행동을 직무언어로 바꾼 한 문장:",
    "• 근거 수준: 충분 / 일부 / 부족",
    "",
    "[출력 3 · 자기소개서·면접에 가장 쓸 만한 경험]",
    "• 1순위 경험과 이유:",
    "• 보여줄 핵심 행동:",
    "• 사용할 결과·증거:",
    "• 예상 실무면접 확인 질문 2개:",
    "",
    "[출력 4 · 아직 증거가 부족한 직무역량]",
    "• 부족한 역량 → 현재 부족한 근거 → 앞으로 만들 수 있는 경험/결과물",
    "",
    "[Portfolio용 핵심역량 요약]",
    "• 핵심역량 3~5개만 작성한다.",
    "• 한 줄 형식: 역량명 → 연결 직무과업 → 학생의 실제 행동근거 → 근거수준(충분/일부)",
    "• 위 상세분석을 그대로 반복하지 말고 각 역량을 1줄로 압축한다.",
    "",
    "학생이 입력하지 않은 역할·수치·성과·자격·도구는 만들지 마.",
    "근거가 약하면 그 사실을 그대로 표시하고 과장하지 마.",
    ...bulletOutputRules()
  ].filter(Boolean).join("\n");
}

function extractPortfolioCompetency(raw=""){
  const text=String(raw||"");
  const m=text.match(/\[Portfolio용 핵심역량 요약\]([\s\S]*?)(?=\n\s*\[[^\]]+\]|$)/i);
  if(!m)return "";
  return m[1].split(/\r?\n/).map(x=>x.trim().replace(/^[-*•]\s*/,"")).filter(Boolean).slice(0,5).map(x=>"• "+x).join("\n");
}

function applyCompetencySummary(){
  const raw=document.querySelector('[data-path="ai.keywordResult"]')?.value||state.ai.keywordResult||"";
  if(!filled(raw)){toast("먼저 AI 역량분석 결과를 붙여넣어 주세요.");return;}
  state.ai.keywordResult=raw;
  const summary=extractPortfolioCompetency(raw);
  if(!filled(summary)){toast("‘Portfolio용 핵심역량 요약’ 부분을 찾지 못했습니다. AI 결과 형식을 확인해 주세요.");return;}
  state.star.competency=summary;
  save();render();toast("핵심역량 3~5개만 Portfolio에 반영했습니다.");
}

function step4(){
  const e=state.experiences[state.selectedExperience]||emptyExperience();
  if(filled(e.title)&&(!filled(state.star.experience)||state.star.experience!==e.title))state.star.experience=e.title;
  return shell(4,"Major & Experience → Competency","입력은 줄이고, 학생이 실제로 한 행동을 선택 직무의 언어로 바꿉니다.",
    '<div class="block"><h3>① 전공에서 직무 근거 하나 찾기</h3><div class="selectedEvidence"><span>내 전공</span><b>'+h(state.student.major||"STEP 1에서 전공을 입력하세요.")+'</b></div>'+
      field("student.majorEvidence","직무와 연결되는 수업·실험·과제·프로젝트","예: 공정제어 프로젝트에서 데이터를 분석 / 전력계통 수업에서 부하흐름 계산")+
    '</div>'+
    '<div class="divider"></div><div class="block starBlock"><h3>② 경험 3개 + 행동 근거 한 번에 정리</h3>'+
      '<p class="help">경험은 최대 3개만 적습니다. 그중 자기소개서·면접에서 가장 설명하기 좋은 경험 하나를 선택하고, 바로 아래에서 내가 한 행동·결과·증거만 확인합니다.</p>'+
      '<div class="experienceList">'+experienceRows()+'</div>'+
      '<div class="selectedEvidence"><span>대표 경험</span><b>'+h(e.title||state.star.experience||"위 경험 중 하나를 선택하세요.")+'</b></div>'+
      field("star.actionWhat","내가 직접 한 행동","팀 전체가 아니라 내가 실제로 무엇을 했나요?")+
      '<div class="grid2">'+field("star.result","결과","내 행동 뒤 무엇이 달라졌나요?")+field("star.evidence","확인 가능한 증거","수치·산출물·기록·피드백 등")+'</div>'+
      '<details class="optionBox"><summary>필요할 때만 STAR+ 세부내용 추가</summary><div class="optionBody"><div class="grid2">'+
        field("star.situation","S · 상황","어떤 상황이었나요?")+
        field("star.task","T · 역할과 과제","내 역할과 해결해야 했던 문제는?")+
        field("star.actionWhy","WHY · 판단 이유","왜 그 방법을 선택했나요?")+
        field("star.actionHow","HOW · 실행 방식·도구","어떤 순서·도구·방법으로 진행했나요?")+
      '</div></div></details>'+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>③ AI로 나만의 직무역량 찾기</h3><p class="help">선택 직무의 실제 과업과 내가 입력한 전공·경험·행동을 교차 비교한 개인 프롬프트입니다.</p>'+
      '<div class="callout info"><b>답변 품질 보완 방식</b> AI가 먼저 입력정보가 충분한지 확인합니다. 근거가 부족하면 분석을 서두르지 않고 질문을 한 번에 하나씩 이어갑니다. 학생은 질문에 답하면 되고, 필요한 근거가 확보되면 역량분석을 시작합니다.</div>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="keywordPromptPreview" data-prompt-key="keyword">'+h(competencyKeywordPrompt())+'</textarea>'+
      '<div class="actions compactActions"><button class="btn secondary" id="copyKeywordPromptBtn">내 역량분석 프롬프트 복사</button></div>'+
      field("ai.keywordResult","AI 결과 붙여넣기 <span class=\"hint\">(선택)</span>","AI가 정리한 경험별 직무 연결과 핵심역량을 붙여넣으세요.")+
      '<div class="actions compactActions"><button class="btn secondary" id="applyCompetencySummaryBtn">핵심역량 3~5개만 Portfolio에 반영</button></div>'+
      '<div class="selectedEvidence"><span>Portfolio에 남을 핵심역량</span><b>'+h(state.star.competency||"아직 반영하지 않았습니다.")+'</b></div>'+
    '</div>'+
    '<div class="callout warn"><b>확인 원칙:</b> 내 경험·행동으로 설명할 수 없는 역량은 최종 강점에서 제외합니다.</div>');
}

function step5TargetValue(){
  if(state.sampleJobId==="custom")return "custom";
  if(state.sampleJobId==="searched")return "searched";
  const sel=state.curatedSelection?.[state.sampleJobId]||{};
  return sel.group&&sel.role?["curated",state.sampleJobId,sel.group,sel.role].join("|"):"";
}

function step5TargetOptions(){
  const groups=[];
  for(const job of CURATED_JOBS){
    const lib=CURATED_ROLE_LIBRARIES[job.id];
    if(!lib?.groups)continue;
    const options=[];
    for(const [groupName,group] of Object.entries(lib.groups)){
      for(const roleName of Object.keys(group.roles||{})){
        const value=["curated",job.id,groupName,roleName].join("|");
        const selected=step5TargetValue()===value?" selected":"";
        options.push('<option value="'+h(value)+'"'+selected+'>'+h(groupName+" → "+roleName)+'</option>');
      }
    }
    if(options.length)groups.push('<optgroup label="'+h(job.company)+'">'+options.join("")+'</optgroup>');
  }
  const custom=state.customJob||emptyCustomJob();
  if(filled(custom.company)&&filled(custom.role)&&filled(custom.facts)){
    groups.push('<optgroup label="STEP 3 · 내가 직접 입력한 기업"><option value="custom" '+(step5TargetValue()==="custom"?"selected":"")+'>'+h(custom.company+" → "+custom.role)+'</option></optgroup>');
  }
  const searched=searchedJob();
  if(searched){
    groups.push('<optgroup label="STEP 2 · 내가 직접 찾은 공고"><option value="searched" '+(step5TargetValue()==="searched"?"selected":"")+'>'+h(searched.company+" → "+searched.role+" · "+searched.title)+'</option></optgroup>');
  }
  return '<option value="">비교 대상을 선택하세요</option>'+groups.join("");
}

function step5TargetPicker(){
  const j=selectedJob();
  const roleData=selectedRoleData();
  const hasAnalysis=["tasks","competencies","challenge","method"].some(k=>filled(state.jobTable?.[k]));
  const sourceNote=hasAnalysis
    ?"STEP 3에서 작성한 직무분석 결과를 함께 사용합니다."
    :(roleData?"STEP 3 분석표는 비어 있지만, 등록된 공고·직무자료를 기준으로 비교할 수 있습니다.":"STEP 3 직무분석 결과가 없으면 공고 조건 중심으로 비교합니다.");
  return '<div class="block gapTargetBlock"><h3>① 비교 대상 확인·선택</h3>'+
    '<p class="help">한국에너지공단·HD현대일렉트릭뿐 아니라 STEP 3에서 직접 입력한 기업과 STEP 2에서 직접 찾은 공고도 선택할 수 있습니다.</p>'+
    '<div class="selectedJobSummary"><b>현재 비교 대상 · '+h(j?j.company:"미선택")+'</b><span>'+h(j?(j.role+" · "+j.title):"비교할 기업·직무를 선택하세요.")+'</span></div>'+
    '<div class="field"><label>비교 대상 직접 선택</label><select class="input" id="step5TargetSelect">'+step5TargetOptions()+'</select></div>'+
    '<div class="targetSourceNote">'+h(sourceNote)+'</div>'+
  '</div>';
}

function selectStep5Target(value){
  if(!value)return;
  snapshotActiveCase();
  if(value==="custom"){
    if(!filled(state.customJob?.company)||!filled(state.customJob?.role)||!filled(state.customJob?.facts)){
      toast("STEP 3 직접입력에서 기업명·직무·담당업무를 먼저 입력해 주세요.");
      return;
    }
    state.sampleJobId="custom";
    restoreAnalysisCase("custom");
  }else if(value==="searched"){
    if(!searchedJob()){
      toast("STEP 2에서 기업·공고·출처 또는 메모를 먼저 입력해 주세요.");
      return;
    }
    state.sampleJobId="searched";
    restoreAnalysisCase("searched");
  }else{
    const [kind,id,group,role]=String(value).split("|");
    if(kind!=="curated"||!id||!group||!role)return;
    state.sampleJobId=id;
    state.curatedSelection??=emptyCuratedSelection();
    state.curatedSelection[id]={group,role};
    restoreAnalysisCase(roleCaseKey(id));
  }
  syncSelectedPosting();
  save();render();
  toast("STEP 5 비교 대상을 변경했습니다.");
}

function ensureRequirements(){
  const j=selectedCuratedJob();
  const roleData=selectedRoleData();
  const src=[];
  if(j){
    if(state.sampleJobId==="kea-2026-h2"){
      src.push("공통 지원자격: "+j.required);
      if(roleData?.certs)src.push("직무기술자격: "+roleData.certs);
      if(roleData?.exam)src.push("전공시험·면접 준비: "+roleData.exam+" / "+KEA_COMMON_RECRUITMENT.interview);
    }else if(state.sampleJobId==="hdelectric-2026-h2"){
      src.push("공통 지원자격: "+j.required);
      if(roleData?.preferred)src.push("선택 직무 우대사항: "+roleData.preferred);
      if(roleData?.tasks)src.push("선택 직무 핵심업무 준비: "+roleData.tasks);
    }else if(state.sampleJobId==="custom"){
      if(filled(j.required))src.push("필수·지원자격: "+j.required);
      if(filled(j.preferred))src.push("우대사항: "+j.preferred);
      const competencyText=state.jobTable.competencies||"";
      if(src.length<3&&filled(competencyText))src.push("직무 필요역량: "+competencyText);
      if(src.length<3&&filled(j.facts))src.push("담당업무 수행 준비: "+j.facts);
    }else if(state.sampleJobId==="searched"){
      String(j.facts||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,3).forEach(x=>src.push("공고 메모: "+x));
      if(src.length<3)src.push("공고 원문에서 필수 지원자격 확인 필요");
      if(src.length<3)src.push("공고 원문에서 직무별 우대사항 확인 필요");
      if(src.length<3)src.push("공고 원문에서 핵심업무·필요역량 확인 필요");
    }else{
      String(j.required||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach(x=>src.push(x));
      const competencyText=state.jobTable.competencies||[roleData?.knowledge,roleData?.skills,roleData?.attitudes].filter(filled).join(" / ");
      const taskText=state.jobTable.tasks||roleData?.tasks||"";
      if(src.length<3&&filled(competencyText))src.push("직무 필요역량: "+competencyText);
      if(src.length<3&&filled(taskText))src.push("주요 과업 수행 준비: "+taskText);
    }
  }
  src.slice(0,3).forEach((line,i)=>{if(!filled(state.requirements[i]?.condition))state.requirements[i].condition=line;});
}

function buildRequirementEvidence(condition=""){
  const c=String(condition||"");
  const parts=[];
  if(/전공|학력|학사/.test(c)&&filled(state.student.major))parts.push("전공: "+state.student.major);
  if(/어학|TOEIC|OPIc|영어|외국어/.test(c)&&filled(state.student.language))parts.push("어학: "+state.student.language);
  if(/자격|기사|산업기사|컴퓨터활용|한국사|면허/.test(c)&&filled(state.student.certificates))parts.push("자격증: "+state.student.certificates);
  if(/도구|기술|CAD|Python|Excel|Minitab|SAP|ERP|PLM|SQL|컴퓨터|디지털/.test(c)&&filled(state.student.tools))parts.push("도구·기술: "+state.student.tools);
  if(/경험|업무|과업|역량|설계|품질|영업|인사|데이터|분석|개발|운영|프로젝트|인턴|교육|수상|현장|실습/.test(c)){
    const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary)).slice(0,2).map(e=>(e.title||"경험")+(e.summary?" - "+e.summary:""));
    if(exps.length)parts.push("경험: "+exps.join(" / "));
  }
  return parts.join(" / ");
}

function syncRequirementEvidence(){
  state.requirements.forEach(r=>{
    if(!filled(r.condition))return;
    const auto=buildRequirementEvidence(r.condition);
    if((!filled(r.note)||String(r.note).startsWith("자동 불러오기 ·"))&&filled(auto))r.note="자동 불러오기 · "+auto;
  });
}

function requirementRows(){
  ensureRequirements();
  syncRequirementEvidence();
  return state.requirements.map((r,i)=>'<div class="requirementRow">'+
    '<div class="field"><label>공고·직무 조건 '+(i+1)+'</label><div class="selectedEvidence requirementSource"><b>'+h(r.condition||"원문 확인 필요")+'</b></div></div>'+
    '<div class="field"><label>내 현재 상태</label><select class="input" data-req="'+i+'" data-reqkey="status"><option value="">선택</option><option value="충족" '+(r.status==="충족"?"selected":"")+'>충족</option><option value="일부 준비" '+(r.status==="일부 준비"?"selected":"")+'>일부 준비</option><option value="현재 GAP" '+(r.status==="현재 GAP"?"selected":"")+'>현재 GAP</option><option value="원문 확인 필요" '+(r.status==="원문 확인 필요"?"selected":"")+'>원문 확인 필요</option></select></div>'+
    '<div class="field"><label>내 근거 <span class="hint">(자동 불러오기 · 필요시 수정)</span></label><input class="input" data-req="'+i+'" data-reqkey="note" value="'+h(r.note)+'" placeholder="예: TOEIC 820 / 전기기사 준비 중 / 관련 경험 없음" /></div>'+
  '</div>').join("");
}

function step5EvidenceDiagnostics(){
  const j=selectedCuratedJob();
  const rd=j?.roleData||selectedRoleData()||{};
  const reqs=state.requirements.filter(r=>filled(r.condition));
  const required=[];
  const enrich=[];

  if(!j)required.push("비교할 기업·직무 선택");
  if(!reqs.length)required.push("공고에서 비교할 지원·우대·직무조건");
  const unclassified=reqs.filter(r=>!filled(r.status));
  if(unclassified.length)required.push("아직 판정하지 않은 공고조건 "+unclassified.length+"개");
  const claimedWithoutEvidence=reqs.filter(r=>["충족","일부 준비"].includes(r.status)&&!filled(r.note));
  if(claimedWithoutEvidence.length)required.push("'충족/일부 준비'라고 판정했지만 근거가 없는 조건 "+claimedWithoutEvidence.length+"개");

  const hasJobBasis=filled(state.jobTable.tasks)||filled(state.jobTable.competencies)||filled(rd.tasks)||filled(j?.facts);
  if(!hasJobBasis)required.push("선택 직무의 실제 업무·필요역량 정보");

  const hasStudentBasis=
    filled(state.student.majorEvidence)||
    state.experiences.some(e=>filled(e.title)&&filled(e.summary))||
    filled(state.ai.keywordResult);
  if(!hasStudentBasis)required.push("직무와 비교할 전공·경험·역량 근거");

  const gapWithoutReason=reqs.filter(r=>r.status==="현재 GAP"&&!filled(r.note));
  if(gapWithoutReason.length)enrich.push("현재 GAP으로 판단한 이유 또는 현재 부족한 근거");
  if(!filled(state.ai.keywordResult))enrich.push("STEP 4에서 정리한 핵심 직무역량 결과");

  const status=required.length
    ?"추가질문 필요"
    :(enrich.length?"GAP 분석 가능하지만 보강질문 권장":"GAP 분석 준비 완료");
  return {required,enrich,status};
}

function step5EvidenceDiagnosticText(){
  const d=step5EvidenceDiagnostics();
  return [
    "현재 상태: "+d.status,
    "필수적으로 부족한 정보: "+(d.required.length?d.required.join(" / "):"없음"),
    "보강하면 GAP 우선순위가 더 정확해지는 정보: "+(d.enrich.length?d.enrich.join(" / "):"없음")
  ].join("\n");
}

function gapPrompt(){
  const j=selectedCuratedJob(), rd=j?.roleData||selectedRoleData()||{};
  const taskText=state.jobTable.tasks||rd.tasks||"미입력";
  const competencyText=state.jobTable.competencies||[rd.knowledge,rd.skills,rd.attitudes].filter(filled).join(" / ")||"미입력";
  const reqs=state.requirements.filter(r=>filled(r.condition)).map((r,i)=>(i+1)+". "+r.condition+" / 내 판정: "+(r.status||"미판정")+" / 근거: "+(r.note||"없음"));
  const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary)).map((e,i)=>(i+1)+". "+(e.title||"경험")+" - "+(e.summary||""));
  return [
    "나는 "+(state.student.major||"전공 미입력")+" 전공 취업준비생이고, "+(j?.role||state.target.job||"관심 직무")+"를 준비하고 있다.",
    "",
    "[선택 공고]",
    j?j.company+" / "+j.title+" / "+j.role:"공고 미선택",
    j?"공식 직무정보: "+j.facts:"",
    j?.recruitmentInfo?"채용전형·지원조건: "+j.recruitmentInfo:"",
    j?"공고 링크: "+j.sourceUrl:"",
    "",
    "[직무에서 하는 일]",
    taskText,
    "[직무 필요역량]",
    competencyText,
    rd.preferred?"[직무별 공식 우대사항]\n"+rd.preferred:"",
    rd.exam?"[직무별 전공시험]\n"+rd.exam:"",
    rd.certs?"[직무기술자격]\n"+rd.certs:"",
    "",
    "[공고조건과 내가 직접 판정한 상태]",
    ...(reqs.length?reqs:["아직 입력하지 않음"]),
    "",
    "[나의 스펙]",
    "전공: "+(state.student.major||"미입력"),
    "자격증: "+(state.student.certificates||"없음/미입력"),
    "어학: "+(state.student.language||"없음/미입력"),
    "도구·기술: "+(state.student.tools||"없음/미입력"),
    "전공 근거: "+(state.student.majorEvidence||"미입력"),
    "",
    "[내 경험]",
    ...(exps.length?exps:["경험 미입력"]),
    "",
    "[Jobfit의 현재 GAP 정보충분도 진단]",
    step5EvidenceDiagnosticText(),
    "",
    "[정보가 부족할 때의 GAP 확인 인터뷰 규칙]",
    "1. 최종 GAP 분석 전에 공고조건별 현재상태와 그 판정 근거가 충분한지 먼저 확인해라.",
    "2. '필수적으로 부족한 정보'가 있으면 최종 GAP 분석을 하지 말고 [추가질문] 하나만 제시한 뒤 학생의 답을 기다려라.",
    "3. 한 번에 여러 질문을 묶지 말고 GAP 우선순위를 가장 크게 바꿀 질문 1개만 물어라.",
    "4. 이미 입력된 자격증·어학·도구·경험·판정은 다시 묻지 마라.",
    "5. 질문 우선순위는 ① 미판정 공고조건의 현재상태 ② 충족/일부 준비 판정의 실제 근거 ③ 직무업무·필요역량 근거 ④ 현재 GAP 판단 이유 순서다.",
    "6. 학생이 '없다'고 답하면 그 자체를 현재 상태로 사용하고, 없는 자격·경험을 만들거나 취득한 것으로 바꾸지 마라.",
    "7. '보강하면 좋은 정보'만 남은 경우, 그 정보가 GAP 1~3순위를 바꿀 가능성이 클 때만 질문 1개를 하고 그렇지 않으면 분석을 진행하되 불확실성을 표시해라.",
    "8. 공고의 '우대'를 '필수'로 바꾸지 말고, 회사 내부 기준이나 합격 가능성을 임의로 추정하지 마라.",
    "",
    "[GAP 분석 시작 기준]",
    "• 비교할 기업·직무와 공고조건이 확인됨",
    "• 공고조건마다 학생이 충족 / 일부 준비 / 현재 GAP / 원문 확인 필요 중 하나로 판정함",
    "• 충족·일부 준비 판정에는 실제 스펙·경험 근거가 연결됨",
    "• 직무의 주요 업무 또는 필요역량과 학생의 전공·경험 근거를 비교할 수 있음",
    "위 기준을 충족하면 추가질문을 멈추고 GAP을 최대 3개로 분석해라.",
    "",
    "[추가질문 출력 형식]",
    "[추가질문]",
    "• 질문: (현재 공고조건과 학생 입력값을 직접 언급해 한 문장으로 질문)",
    "• 이 질문이 필요한 이유: (GAP 판정 또는 우선순위에 어떤 정보가 필요한지 한 줄)",
    "이 단계에서는 GAP 1~3순위나 3개월 행동계획을 함께 출력하지 마라.",
    "",
    "공식 공고·직무기술서와 내 입력정보를 대조해 GAP을 분석해줘.",
    "공고에서 '우대'인 항목을 '필수'로 바꾸지 말고, 내가 준비 중인 자격은 취득한 것으로 처리하지 마.",
    "",
    "아래 제목과 순서를 그대로 사용해줘.",
    "[1. 이 직무에서 실제로 하는 일]",
    "• 핵심업무 1",
    "• 핵심업무 2",
    "• 핵심업무 3",
    "[2. 공고상 지원·평가·우대조건]",
    "• 공통 지원조건:",
    "• 직무별 우대/자격:",
    "• 시험·면접 준비:",
    "[3. 내가 이미 갖춘 근거]",
    "• 조건/역량 → 내 근거 → 근거 수준",
    "[4. 일부 준비된 항목]",
    "• 준비 중인 것과 아직 부족한 부분을 구분",
    "[5. 현재 GAP · 최대 3개]",
    "• GAP 1:",
    "• GAP 2:",
    "• GAP 3:",
    "[6. 우선순위]",
    "• 1순위:",
    "• 2순위:",
    "• 3순위:",
    "[7. 3개월 보완 행동]",
    "• GAP → 행동 → 확인 가능한 결과물 형식",
    "",
    "내가 입력하지 않은 자격증·점수·경험을 있다고 가정하지 마.",
    "채용 가능성을 점수나 확률로 계산하지 마.",
    "확인되지 않은 내용은 '추가 확인 필요'로 남겨줘.",
    ...bulletOutputRules()
  ].filter(Boolean).join("\n");
}

function extractGapAndActions(raw=""){
  const text=String(raw||"");
  const gapBlock=(text.match(/\[5\.\s*현재 GAP[^\]]*\]([\s\S]*?)(?=\n\s*\[6\.|\n\s*\[7\.|$)/i)||[])[1]||"";
  const actionBlock=(text.match(/\[7\.\s*3개월 보완 행동\]([\s\S]*?)(?=\n\s*\[[^\]]+\]|$)/i)||[])[1]||"";
  const clean=(block,max)=>block.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
    .map(x=>x.replace(/^[-*•]\s*/,"").replace(/^GAP\s*\d+\s*:\s*/i,""))
    .filter(Boolean).slice(0,max);
  return {
    gaps:clean(gapBlock,3).map((x,i)=>(i+1)+". "+x).join("\n"),
    actions:clean(actionBlock,5).map(x=>"• "+x).join("\n")
  };
}

function applyGapResult(){
  const raw=document.querySelector('[data-path="ai.gapResult"]')?.value||state.ai.gapResult||"";
  if(!filled(raw)){toast("먼저 AI GAP 분석 결과를 붙여넣어 주세요.");return;}
  state.ai.gapResult=raw;
  const parsed=extractGapAndActions(raw);
  if(!filled(parsed.gaps)&&!filled(parsed.actions)){toast("GAP 또는 3개월 행동 항목을 찾지 못했습니다. AI 결과 형식을 확인해 주세요.");return;}
  if(filled(parsed.gaps))state.fit.gaps=parsed.gaps;
  if(filled(parsed.actions))state.fit.actions=parsed.actions;
  save();render();toast("GAP과 3개월 행동을 자동 반영했습니다. 필요한 부분만 수정하세요.");
}

function derivedGapAssets(){
  const met=state.requirements
    .filter(r=>r.status==="충족"&&filled(r.note))
    .map(r=>r.note.replace(/^자동 불러오기 ·\s*/,""));
  if(met.length)return met.join(" / ");
  const base=[
    filled(state.student.certificates)?"자격증: "+state.student.certificates:"",
    filled(state.student.language)?"어학: "+state.student.language:"",
    filled(state.student.tools)?"도구·기술: "+state.student.tools:"",
    filled(state.student.majorEvidence)?"전공 근거: "+state.student.majorEvidence:""
  ].filter(Boolean);
  return base.join(" / ");
}

function step5(){
  return shell(5,"JD Requirements × My Spec → GAP","공고 요구조건과 내가 실제로 입력한 스펙을 한 화면에서 비교하고, 준비할 GAP을 정합니다.",
    step5TargetPicker()+
    '<div class="block"><h3>② 공고 요구조건 × 내 스펙 한 번에 비교</h3>'+
      '<div class="callout info"><b>자동 연결</b> 기업·직무를 선택하면 공고 요구조건이 자동으로 들어옵니다. 전공·경험은 이전 STEP 값을 사용하고, 자격증·어학·도구만 필요한 만큼 입력하세요. 없는 스펙은 만들지 않습니다.</div>'+
      '<div class="grid2 compactSpecGrid">'+
        '<div class="field"><label>내 전공 · 자동</label><input class="input" value="'+h(state.student.major||"")+'" disabled /></div>'+
        field("student.certificates","자격증 <span class=\"hint\">(없으면 비워도 됨)</span>","예: 전기기사 / 대기환경기사 준비 중",false)+
        field("student.language","어학 <span class=\"hint\">(없으면 비워도 됨)</span>","예: TOEIC 820 / OPIc IM2",false)+
        field("student.tools","도구·기술 <span class=\"hint\">(없으면 비워도 됨)</span>","예: Excel, Python, CAD, SAP",false)+
      '</div>'+
      '<p class="help">아래 조건은 공고·직무자료에서 가져옵니다. ‘내 근거’는 앞서 입력한 스펙·경험과 연결하고, 충족 여부만 직접 확인하세요.</p>'+
      '<div class="requirementList">'+requirementRows()+'</div>'+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>③ AI로 내 GAP 분석</h3><p class="help">공고·직무분석·전공·경험·현재 스펙을 합쳐 개인별 GAP을 분석합니다.</p>'+
      '<div class="callout info"><b>GAP 분석 전 확인</b> AI가 공고조건별 판정과 근거가 충분한지 먼저 확인합니다. 부족하면 가장 중요한 질문을 한 번에 하나씩 하고, 근거가 확보되면 GAP 1~3순위와 3개월 행동을 분석합니다.</div>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="gapPromptPreview" data-prompt-key="gap">'+h(gapPrompt())+'</textarea>'+
      '<div class="actions compactActions"><button class="btn secondary" id="copyGapPromptBtn">내 GAP 분석 프롬프트 복사</button></div>'+
      field("ai.gapResult","AI GAP 분석 결과 <span class=\"hint\">(선택)</span>","AI의 GAP 분석 결과를 붙여넣으세요.")+
      '<div class="actions compactActions"><button class="btn secondary" id="applyGapResultBtn">GAP·3개월 행동 자동 반영</button></div>'+
    '</div>'+
    '<div class="divider"></div><div class="block"><h3>④ 최종 GAP과 3개월 행동 · 확인·수정</h3>'+
      '<div class="selectedEvidence"><span>현재 확인된 근거</span><b id="derivedGapAssetsPreview">'+h(derivedGapAssets()||"아직 입력된 스펙·충족 근거가 없습니다.")+'</b></div>'+
      '<div class="grid2">'+
        field("fit.gaps","우선 보완할 GAP","AI 결과를 보고 최대 3개만 남기세요.")+
        field("fit.actions","3개월 행동계획","무엇을 언제까지 어떤 결과물로 만들 것인가?")+
      '</div></div>');
}

function portfolio(){
  const st=state.student, jt=state.jobTable, f=state.fit, star=state.star;
  const j=selectedCuratedJob();
  const req=state.requirements.filter(r=>filled(r.condition));
  const exps=state.experiences.filter(e=>filled(e.title)||filled(e.summary));
  const a=["MY JOB PORTFOLIO","",
    "1. TARGET JOB",
    "기업: "+(j?.company||state.target.company||"-"),
    "직무: "+(j?.role||state.target.job||"-"),
    "전공: "+(st.major||"-"),
    "공고·출처: "+(j?.sourceUrl||"-"),"",
    "2. JOB ANALYSIS",
    "고객·성과기준: "+(jt.customerKpi||"-"),
    "주요 과업: "+(jt.tasks||"-"),
    "주요 해결과제: "+(jt.challenge||"-"),
    "해결방법: "+(jt.method||"-"),
    "필요역량: "+(jt.competencies||"-"),"",
    "3. MY EVIDENCE",
    "전공 근거: "+(st.majorEvidence||"-")
  ];
  if(exps.length)exps.forEach((e,i)=>a.push("경험 "+(i+1)+": "+(e.title||"-")+" / "+(e.summary||"-")));
  else a.push("경험: -");
  a.push(
    "대표 경험 행동: "+(star.actionWhat||"-"),
    "대표 경험 결과: "+(star.result||"-"),
    "대표 경험 증거: "+(star.evidence||"-"),"",
    "4. MY COMPETENCY",
    state.star.competency||extractPortfolioCompetency(state.ai.keywordResult)||"핵심역량 요약 미반영","",
    "5. SPEC & GAP",
    "자격증: "+(st.certificates||"-"),
    "어학: "+(st.language||"-"),
    "도구·기술: "+(st.tools||"-")
  );
  if(req.length)req.forEach((r,i)=>a.push(
    "조건 "+(i+1)+": "+r.condition+" / "+(r.status||"미판정")+" / 내 근거: "+(r.note||"-")
  ));
  else a.push("공고조건 비교: -");
  a.push(
    "현재 확인된 근거: "+(derivedGapAssets()||"-"),
    "우선 보완 GAP: "+(f.gaps||"-"),
    "3개월 행동계획: "+(f.actions||"-")
  );
  return a.join("\n");
}

function selfIntroPrompt(){
  const j=selectedCuratedJob(), rd=j?.roleData||selectedRoleData()||{}, e=state.experiences[state.selectedExperience]||emptyExperience();
  const isKea=state.sampleJobId==="kea-2026-h2";
  const keaGuide=isKea?keaRolePromptGuide(j?.selectedRole):null;
  return [
    "아래는 내가 직접 정리한 직무분석과 경험 자료다. 이 정보 밖의 사실을 만들지 말아줘.",
    "",
    "[지원 기업/직무] "+(j?j.company+" / "+j.role:(state.target.job||"-")),
    "[공식 직무 주요 과업] "+(rd.tasks||state.jobTable.tasks||"-"),
    "[STEP 3 직무분석] "+(state.jobTable.tasks||"-")+" / "+(state.jobTable.competencies||"-"),
    rd.preferred?"[공식 우대사항] "+rd.preferred:"",
    "[내 전공] "+(state.student.major||"-"),
    "[전공 근거] "+(state.student.majorEvidence||"-"),
    "[대표 경험] "+(e.title||state.star.experience||"-"),
    "[내 행동] "+(state.star.actionWhat||"-"),
    "[결과] "+(state.star.result||"-"),
    "[증거] "+(state.star.evidence||"-"),
    "[역량 키워드 분석] "+(state.ai.keywordResult||"-"),
    "[현재 GAP과 준비] "+(state.fit.gaps||"-")+" / "+(state.fit.actions||"-"),
    ...(isKea?[
      "",
      "[한국에너지공단 2026 자기소개서 실제 문항]",
      ...KEA_COMMON_RECRUITMENT.selfIntro.map((q,i)=>(i+1)+". "+q),
      "[블라인드·불성실 작성 기준]",
      KEA_COMMON_RECRUITMENT.blind,
      "[선택 직무 소재 연결 지침]",
      keaGuide.analysis
    ]:[]),
    "",
    isKea
      ?"한국에너지공단 실제 4개 문항별로 어떤 경험과 직무역량을 배치할지 먼저 설계해줘. 아직 완성문은 쓰지 마."
      :"이 기업·직무에 맞춰 자기소개서 소재를 먼저 구조화해줘. 아직 완성문은 쓰지 마.",
    "",
    "아래 형식을 사용해줘.",
    isKea?"[문항 1~4 소재배치]":"[핵심 직무역량]",
    "• 문항/주제 → 사용할 경험 → 연결할 공식 NCS/업무축 → 직무역량 → 핵심 행동 → 결과/증거",
    "[기업·직무 요구와 연결]",
    "• 공식 업무/우대사항 → 내 근거",
    "[대표 경험 STAR Evidence]",
    "• 상황:",
    "• 과제:",
    "• 내가 한 행동:",
    "• 판단 이유:",
    "• 결과/증거:",
    "[자기소개서에서 강조할 포인트]",
    "• 포인트 1:",
    "• 포인트 2:",
    "• 포인트 3:",
    "[추가로 확인할 정보]",
    "• 없다면 '없음'",
    "",
    "기업 칭찬이나 추상적인 성격 표현보다 '직무 요구 → 내 행동 근거 → 결과'가 보이게 정리해줘.",
    "내가 말하지 않은 수치·성과·역할은 추가하지 마.",
    isKea?"블라인드 위반 가능 정보와 기관명 오기재 위험을 점검해줘.":"",
    isKea?"각 문항마다 선택 직무의 공식 업무축 중 어떤 부분을 보여주는지 표시하고, 한 경험을 여러 문항에 반복 배치하지 않는다.":"",
    "과장된 AI 문체 대신 실제 대학생이 자기소개서로 발전시키기 쉬운 자연스러운 표현을 사용해줘.",
    ...bulletOutputRules()
  ].filter(Boolean).join("\n");
}

function interviewQuestionCount(){
  return state.interviewMode==="12"?12:6;
}

function interviewPrompt(){
  const j=selectedCuratedJob(), rd=j?.roleData||selectedRoleData()||{}, e=state.experiences[state.selectedExperience]||emptyExperience();
  const isKea=state.sampleJobId==="kea-2026-h2";
  const isHd=state.sampleJobId==="hdelectric-2026-h2";
  const keaGuide=isKea?keaRolePromptGuide(j?.selectedRole):null;
  const total=interviewQuestionCount();
  const modeLabel=total===12?"12문항 심화모드":"6문항 실전면접 모드";
  return [
    "너는 지금부터 내가 지원하려는 기업의 해당 직무를 담당하는 실무면접관이다.",
    "아래에 제공되는 기업·직무정보와 내가 실제로 입력한 경험·전공·역량·GAP만 사용하여 실전 모의면접을 진행해라.",
    "",
    "[지원 기업·직무]",
    (j?.company||"지원 기업")+" / "+(j?.selectedRole||j?.role||state.target.job||"지원 직무"),
    "",
    "[공식 직무정보]",
    rd.tasks||state.jobTable.tasks||"-",
    "",
    "[공식 필요지식·기술·태도]",
    "필요지식: "+(rd.knowledge||"-"),
    "필요기술: "+(rd.skills||"-"),
    "직무수행태도: "+(rd.attitudes||"-"),
    "",
    "[공식 우대사항·지원조건]",
    (rd.preferred||j?.preferred||"-"),
    j?.recruitmentInfo||"",
    rd.exam?"전공시험 범위: "+rd.exam:"",
    isKea?"한국에너지공단 면접평가: "+KEA_COMMON_RECRUITMENT.interview:"",
    isKea?"선택 직무 질문 설계축: "+keaGuide.interview:"",
    "",
    "[내 직무분석]",
    "고객·KPI: "+(state.jobTable.customerKpi||"-"),
    "주요 과업: "+(state.jobTable.tasks||"-"),
    "주요 해결과제: "+(state.jobTable.challenge||"-"),
    "해결방법: "+(state.jobTable.method||"-"),
    "필요역량: "+(state.jobTable.competencies||"-"),
    "",
    "[내 전공]",
    state.student.major||"-",
    "",
    "[전공에서 찾은 직무 근거]",
    state.student.majorEvidence||"-",
    "",
    "[대표 경험]",
    e.title||state.star.experience||"-",
    "S 상황: "+(state.star.situation||"-"),
    "T 역할·과제: "+(state.star.task||"-"),
    "",
    "[내가 실제로 한 행동]",
    state.star.actionWhat||"-",
    "판단 이유: "+(state.star.actionWhy||"-"),
    "실행 방식·도구: "+(state.star.actionHow||"-"),
    "",
    "[결과·Evidence]",
    "결과: "+(state.star.result||"-"),
    "Evidence: "+(state.star.evidence||"-"),
    "",
    "[현재 확인된 직무역량]",
    state.star.competency||state.ai.keywordResult||"-",
    "",
    "[현재 GAP]",
    state.fit.gaps||"-",
    "",
    "[보완 계획]",
    state.fit.actions||"-",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "[실전 모의면접 진행 방식]",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "현재 모드: "+modeLabel,
    "기본 면접질문 수: "+total+"문항",
    "추가질문·꼬리질문은 기본 "+total+"문항 수에 포함하지 않는다.",
    total===6
      ?"6문항 실전면접 모드에서는 핵심 영역을 빠르게 점검한다: 직무이해 / 직무지식·기술 / 문제상황·판단 / 실제 경험 / 협업·의사소통 / GAP·준비."
      :"12문항 심화모드에서는 직무이해·지식·기술·문제상황·전공적용·경험검증·협업·직업공통능력·직무준비를 더 깊게 나누어 확인한다.",
    "",
    "지금부터 실제 면접처럼 진행한다.",
    "",
    "중요:",
    "처음부터 전체 예상질문 목록을 보여주지 마라.",
    "반드시 한 번에 질문 하나만 제시하고 내 답변을 기다려라.",
    "",
    "1. 먼저 지원 기업과 선택 직무에 맞는 첫 번째 실무면접 질문 하나만 제시한다.",
    "2. 내가 답하면 다음 네 가지 기준으로 답변이 충분한지 판단한다.",
    "- 질문에 직접 답했는가",
    "- 내가 실제로 한 행동이 구체적으로 드러나는가",
    "- 선택 직무와 연결되는가",
    "- 결과·근거·판단기준 중 필요한 내용이 확인되는가",
    "3. 답변이 충분하면 추가질문을 하지 말고 바로 해당 답변에 대한 피드백을 제공한다.",
    "4. 답변이 부족하거나 모호하면 가장 필요한 내용 하나만 확인하는 꼬리질문 또는 추가질문을 한다.",
    "5. 추가질문은 한 번에 하나만 한다.",
    "6. 하나의 최초 질문에 대해 추가질문은 최대 3회까지만 한다.",
    "7. 3번의 추가질문 이후에도 답변이 충분하지 않다면 더 이상 질문하지 말고 현재까지의 답변을 기준으로 피드백한다.",
    "8. 학생이 말하지 않은 경험·역할·수치·성과·도구·자격은 만들어내지 않는다.",
    "9. 학생이 '없다', '모르겠다', '해본 적 없다'고 답하면 그 사실을 그대로 인정한다. 없는 경험을 만들어 답하도록 유도하지 않는다.",
    "10. 기업 공식자료에 없는 내부 업무나 평가기준은 사실처럼 말하지 않는다.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "[꼬리질문 원칙]",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "추가질문은 답변의 부족한 부분을 확인하기 위해 사용한다.",
    "우선순위는 다음과 같다.",
    "1순위: 본인이 실제로 한 행동",
    "2순위: 그렇게 판단하거나 행동한 이유",
    "3순위: 사용한 방법·도구·기준",
    "4순위: 결과 또는 확인 가능한 Evidence",
    "5순위: 선택 직무와의 연결",
    "",
    "추가질문은 [추가질문 1/3], [추가질문 2/3], [추가질문 3/3]으로 표시한다.",
    "이미 답한 내용은 다시 묻지 않는다.",
    "'조금 더 자세히 설명해 주세요'처럼 넓게 묻지 말고 학생의 실제 경험과 선택 직무를 넣어 구체적으로 묻는다.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "[답변 피드백 방식]",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "답변이 충분해졌거나 추가질문 3회가 끝나면 아래 형식으로 짧게 피드백한다.",
    "",
    "[답변 피드백]",
    "• 잘된 점: 학생의 답변에서 실제로 확인되는 강점을 1~2개만 구체적으로 설명",
    "• 보완할 점: 면접관 입장에서 아직 부족하거나 불명확한 부분을 1~2개 설명",
    "• 직무 연결: 이 답변이 선택 직무의 어떤 업무·역량과 연결되는지 설명. 연결이 약하면 '직무 연결 근거가 약함'이라고 표시",
    "• 답변 정리 방향: 학생이 이미 말한 사실만 사용하여 '상황 → 내가 한 행동 → 판단기준/방법 → 결과 → 직무 연결' 중 무엇을 앞세우면 더 명확한지 안내",
    "",
    "완성된 모범답안을 대신 작성하지 마라.",
    "학생이 자신의 답변을 직접 수정할 수 있게 피드백하라.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "[다음 질문]",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "피드백이 끝나면 아직 기본질문 "+total+"개를 모두 마치지 않았다면 다음 실무면접 질문 하나만 제시하고 다시 학생의 답변을 기다린다.",
    "질문은 같은 유형을 반복하지 않는다.",
    "기본질문 "+total+"개를 모두 마치면 다음 질문을 만들지 말고 [면접 종료 피드백]을 제시한다.",
    "",
    "[면접 종료 피드백]",
    "• 반복해서 잘된 점 2개",
    "• 가장 먼저 보완할 점 2개",
    "• 선택 직무와 연결이 가장 강했던 답변 1개",
    "• 추가 준비가 필요한 직무지식·경험 1~2개",
    "• 다음 면접 전 연습할 행동 2개",
    "",
    "기업별 실제 면접방식이나 공식 평가기준이 제공되어 있다면 그것을 우선 반영한다.",
    isKea?"한국에너지공단은 공식 NCS·직무수행내용·필요지식·필요기술·직무수행태도와 면접평가 정보를 우선 사용하고 다른 직무의 세부내용을 섞지 않는다.":"",
    isHd?"HD현대일렉트릭은 선택 직무의 공식 직무소개와 우대사항을 우선 사용하고, 공식자료에 없는 내용은 [일반 직무지식] 수준으로만 사용한다.":"",
    "공식 자료에 없는 세부 기술을 질문에 활용할 경우 [일반 직무지식]이라고 표시하고 회사 내부사실처럼 표현하지 마.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "[질문 출력 형식]",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "면접을 시작할 때는 설명하지 말고 아래 형식으로 첫 질문 하나만 제시한다.",
    "",
    "[실전면접 Q1/"+total+"]",
    "• 질문: (지원기업과 선택직무에 맞는 질문 한 개)",
    "",
    "내 답변을 기다려라.",
    "내가 답하기 전에는 피드백, 다음 질문, 예상답변, 전체 질문목록을 보여주지 마라."
  ].filter(Boolean).join("\n");
}

function interviewPromptValue(){
  const generated=interviewPrompt();
  const draft=state.promptDrafts?.interview||"";
  const modeLabel=interviewQuestionCount()===12?"12문항 심화모드":"6문항 실전면접 모드";
  if(draft.includes("[실전 모의면접 진행 방식]")&&draft.includes("현재 모드: "+modeLabel))return draft;
  return generated;
}

function step6(){
  return '<section class="card stepCard printTarget"><div class="sectionHead noPrint"><div><div class="kicker">STEP 06</div><h2>My Job Portfolio</h2><p>지원에 실제로 사용할 직무분석·경험근거·역량·GAP만 한 파일로 정리합니다.</p></div><span class="badge">Portfolio</span></div>'+
    '<div class="block noPrint"><h3>① 핵심 Portfolio 확인</h3><p class="help">검색과정·초기 생각처럼 최종 지원에 직접 쓰지 않는 기록은 제외했습니다. 아래 5개 영역만 Word/PDF로 저장됩니다.</p></div>'+
    '<div class="preview">'+h(portfolio())+'</div>'+
    '<div class="divider noPrint"></div><div class="block noPrint"><h3>② 내 AI로 자기소개서 준비</h3><p class="help">선택한 기업·직무와 내 전공·경험·GAP이 반영됩니다. 한국에너지공단 선택 시 실제 자기소개서 문항과 블라인드 기준도 함께 들어갑니다.</p>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="selfIntroPromptPreview" data-prompt-key="selfIntro">'+h(promptValue("selfIntro",selfIntroPrompt()))+'</textarea>'+
      '<div class="actions compactActions"><button class="btn ghost" id="refreshSelfIntroPromptBtn">현재 입력 반영</button><button class="btn secondary" id="copySelfIntroPromptBtn">자기소개서 프롬프트 복사</button></div>'+
      field("ai.selfIntroResult","AI 자기소개서 소재정리 결과 <span class=\"hint\">(선택)</span>","내 AI가 정리한 문항별 소재·핵심역량을 붙여넣으세요. 같은 브라우저에 자동 저장됩니다.")+
    '</div>'+
    '<div class="block noPrint"><h3>③ 내 AI로 실전 모의면접 하기</h3><p class="help">선택 기업·직무와 내 전공·경험·GAP을 바탕으로 AI가 질문을 하나씩 합니다. 답변이 부족하면 꼬리질문을 최대 3회 한 뒤 피드백하고 다음 질문으로 넘어갑니다.</p>'+
      '<div class="grid2"><div class="field"><label>면접 모드</label><select class="input" id="interviewModeSelect"><option value="6" '+(state.interviewMode!=="12"?"selected":"")+'>6문항 실전면접 모드</option><option value="12" '+(state.interviewMode==="12"?"selected":"")+'>12문항 심화모드</option></select></div><div class="selectedEvidence"><span>진행 방식</span><b>질문 1개 → 답변 → 필요 시 꼬리질문 최대 3회 → 피드백 → 다음 질문</b></div></div>'+
      '<textarea class="promptBox promptEditor shortPrompt" id="interviewPromptPreview" data-prompt-key="interview">'+h(interviewPromptValue())+'</textarea>'+
      '<div class="actions compactActions"><button class="btn ghost" id="refreshInterviewPromptBtn">현재 입력 반영</button><button class="btn secondary" id="copyInterviewPromptBtn">AI 실전면접 시작하기</button></div>'+
      field("ai.interviewResult","AI 실전면접 기록 <span class=\"hint\">(선택)</span>","면접이 끝난 뒤 핵심 피드백이나 면접 기록을 붙여넣으세요. 같은 브라우저에 자동 저장됩니다.")+
    '</div>'+
    '<div class="callout good noPrint"><b>자동 저장</b> STEP 1~6의 입력값과 붙여넣은 AI 결과는 이 브라우저에 저장됩니다. 같은 기기·같은 브라우저로 다시 열면 이어서 사용할 수 있습니다.</div>'+
    '<div class="divider noPrint"></div><div class="exportGrid noPrint"><div class="exportCard"><b>Word용 문서</b><p>직무분석 Portfolio를 Word에서 수정합니다.</p><button class="btn primary" id="docBtn">Word 파일 저장</button></div><div class="exportCard"><b>PDF</b><p>인쇄 화면에서 PDF로 저장합니다.</p><button class="btn secondary" id="printBtn">PDF 저장 화면</button></div><div class="exportCard"><b>학습 백업</b><p>브라우저 저장과 별도로 보관할 JSON입니다.</p><button class="btn secondary" id="jsonBtn2">JSON 백업 저장</button></div></div>'+
    '<div class="actions stepFooter noPrint"><button class="btn secondary" data-prev="5">이전</button><button class="btn secondary" id="copyBtn">Portfolio 텍스트 복사</button><button class="btn danger" id="resetBtn">FLEX 데이터 새로 시작</button></div></section>';
}

async function copyText(text,msg){
  try{await navigator.clipboard.writeText(text);toast(msg);}catch(e){toast("복사 권한을 확인해 주세요.");}
}

function syncSelectedPosting(){
  const j=selectedJob();if(!j)return;
  state.target.company=j.company||state.target.company||"";
  state.postings[0]={
    ...emptyPosting(),
    company:j.company||"",title:j.title||"",sourceUrl:j.sourceUrl||"",
    text:j.facts?"[선택 직무 기준정보]\n"+j.facts:"",
    required:j.required||"",preferred:j.preferred||"",
    notes:j.note||""
  };
}

function step2CuratedMatch(){
  const x=state.step2Search||{};
  const company=String(x.company||"").replace(/\s/g,"").toLowerCase();
  const target=String(state.target.job||"").trim();
  for(const job of CURATED_JOBS){
    const jobName=String(job.company||"").replace(/\s/g,"").toLowerCase();
    if(!company||!(company.includes(jobName)||jobName.includes(company)))continue;
    const lib=CURATED_ROLE_LIBRARIES[job.id];
    for(const [groupName,group] of Object.entries(lib?.groups||{})){
      const role=Object.keys(group.roles||{}).find(r=>r===target||target.includes(r)||r.includes(target));
      if(role)return {id:job.id,group:groupName,role};
    }
    return {id:job.id,group:"",role:""};
  }
  return null;
}

function useStep2JobInStep3(){
  const x=state.step2Search||{};
  if(!filled(x.company)||!filled(x.title)){toast("STEP 2에서 찾은 기업과 공고명을 먼저 입력해 주세요.");return;}
  snapshotActiveCase();
  const matched=step2CuratedMatch();
  if(matched){
    state.sampleJobId=matched.id;
    state.curatedSelection??=emptyCuratedSelection();
    state.curatedSelection[matched.id]={group:matched.group||"",role:matched.role||""};
    restoreAnalysisCase(roleCaseKey(matched.id));
    syncSelectedPosting();
    state.currentStep=3;
    save();render();
    toast(matched.role?"찾은 공고와 같은 기업·직무를 STEP 3에서 자동 선택했습니다.":"찾은 기업을 STEP 3에서 열었습니다. 세부직무만 선택해 주세요.");
    return;
  }
  state.customJob={
    ...emptyCustomJob(),
    ...(state.customJob||{}),
    company:x.company,
    title:x.title,
    role:state.target.job||x.title,
    sourceUrl:x.sourceUrl||"",
    facts:x.facts||"",
    note:"STEP 2에서 찾은 실제 공고를 이어서 분석합니다."
  };
  state.sampleJobId="custom";
  restoreAnalysisCase("custom");
  syncSelectedPosting();
  state.currentStep=3;
  save();render();
  toast(filled(x.facts)?"STEP 2 공고를 STEP 3으로 가져왔습니다.":"기업·공고·URL을 가져왔습니다. 담당업무만 추가해 주세요.");
}

function selectAnalysisMethod(id){
  if(!["kea-2026-h2","hdelectric-2026-h2","custom"].includes(id))return;
  snapshotActiveCase();
  state.sampleJobId=id;
  restoreAnalysisCase(roleCaseKey(id));
  syncSelectedPosting();
  save();render();
  if(id==="custom"){
    requestAnimationFrame(()=>{
      const entry=document.getElementById("customJobEntry");
      if(!entry)return;
      const mobile=window.matchMedia("(max-width:650px)").matches;
      const offset=mobile?92:24;
      const y=entry.getBoundingClientRect().top+window.scrollY-offset;
      window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
    });
  }
  const j=selectedJob();
  toast((id==="custom"?"직접 입력":j?.company||"선택한 공고")+" 작업공간을 열었습니다.");
}

function selectCuratedGroup(id,group){
  snapshotActiveCase();
  state.curatedSelection??=emptyCuratedSelection();
  state.curatedSelection[id]={group,role:""};
  state.sampleJobId=id;
  restoreAnalysisCase(roleCaseKey(id));
  syncSelectedPosting();
  save();render();
}

function selectCuratedRole(id,role){
  snapshotActiveCase();
  state.curatedSelection??=emptyCuratedSelection();
  const prev=state.curatedSelection[id]||{group:"",role:""};
  state.curatedSelection[id]={...prev,role};
  state.sampleJobId=id;
  restoreAnalysisCase(roleCaseKey(id));
  syncSelectedPosting();
  save();render();
  if(role){
    toast(role+" 직무만 분석하도록 선택했습니다.");
    requestAnimationFrame(()=>{
      const p=document.getElementById("jobPromptPreview");
      if(p)p.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }
}

function useCustomJob(){
  if(!filled(state.customJob?.company)||!filled(state.customJob?.role)){
    toast("기업명과 직무·분야를 먼저 입력해 주세요.");
    return;
  }
  if(!filled(state.customJob?.facts)){
    toast("정확한 분석을 위해 공고의 담당업무·직무소개를 붙여넣어 주세요.");
    return;
  }
  selectAnalysisMethod("custom");
  requestAnimationFrame(()=>{
    const p=document.getElementById("jobPromptPreview");
    if(p)p.scrollIntoView({behavior:"smooth",block:"center"});
  });
}

function applyJobTableAi(){
  const raw=document.getElementById("jobTableAiResult")?.value||state.jobTable.aiResult||"";
  if(!filled(raw)){toast("먼저 AI 답변을 붙여넣어 주세요.");return;}
  const parsed=parseJobTableResult(raw);
  const keys=["customerKpi","tasks","challenge","method","competencies","careerPlan"];
  const count=keys.filter(k=>filled(parsed[k])).length;
  if(!count){toast("직무분석 제목을 찾지 못했습니다. 직접 입력해 주세요.");return;}
  keys.forEach(k=>{if(filled(parsed[k]))state.jobTable[k]=parsed[k];});
  state.jobTable.aiResult=raw;
  state.postings[0].tasks=state.jobTable.tasks;
  state.competency.top5=state.jobTable.competencies;
  save();render();toast("AI 답변에서 "+count+"개 항목을 직무분석표에 반영했습니다.");
}

function bind(){
  document.querySelectorAll("[data-prompt-key]").forEach(e=>{
    const handler=()=>{state.promptDrafts??={};state.promptDrafts[e.dataset.promptKey]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-path]").forEach(e=>{
    const handler=()=>{
      set(e.dataset.path,e.value);
      const preview=document.querySelector('[data-preview="'+e.dataset.path+'"]');
      if(preview)preview.textContent=e.value||"-";
      const path=e.dataset.path||"";
      if(path==="student.majorEvidence"||path.startsWith("star."))refreshStep4Prompt();
      if(["student.certificates","student.language","student.tools","student.majorEvidence"].includes(path))refreshStep5Derived();
      save();
    };
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-pf]").forEach(e=>{
    const handler=()=>{state.postings[activePosting][e.dataset.pf]=e.value;save();};
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-analysis-method]").forEach(e=>e.onclick=()=>selectAnalysisMethod(e.dataset.analysisMethod));
  document.querySelectorAll("[data-curated-group]").forEach(e=>e.onchange=()=>selectCuratedGroup(e.dataset.curatedGroup,e.value));
  document.querySelectorAll("[data-curated-role]").forEach(e=>e.onchange=()=>selectCuratedRole(e.dataset.curatedRole,e.value));
  document.getElementById("useStep2JobBtn")?.addEventListener("click",useStep2JobInStep3);
  document.getElementById("useCustomJobBtn")?.addEventListener("click",useCustomJob);
  document.querySelectorAll("[data-customjob]").forEach(e=>{
    const handler=()=>{
      const k=e.dataset.customjob;
      state.customJob={...emptyCustomJob(),...(state.customJob||{}),[k]:e.value};
      if(k==="company"&&state.sampleJobId==="custom")state.target.company=e.value;
      if(state.sampleJobId==="custom")syncSelectedPosting();
      save();
    };
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-exp]").forEach(e=>{
    const handler=()=>{
      const i=Number(e.dataset.exp),k=e.dataset.expkey;
      state.experiences[i]??=emptyExperience();
      state.experiences[i][k]=e.value;
      if(i===state.selectedExperience&&k==="title")state.star.experience=e.value;
      refreshStep4Prompt();
      refreshStep5Derived();
      save();
    };
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-exp-select]").forEach(e=>e.onchange=()=>{
    if(e.checked){
      state.selectedExperience=Number(e.dataset.expSelect);
      const title=state.experiences[state.selectedExperience]?.title||"";
      if(title)state.star.experience=title;
      save();render();
    }
  });
  document.querySelectorAll("[data-req]").forEach(e=>{
    const handler=()=>{
      const i=Number(e.dataset.req),k=e.dataset.reqkey;
      state.requirements[i]??={condition:"",status:"",note:""};
      state.requirements[i][k]=e.value;
      if(k==="condition"){
        const auto=buildRequirementEvidence(e.value);
        if(!filled(state.requirements[i].note)||String(state.requirements[i].note).startsWith("자동 불러오기 ·")){
          state.requirements[i].note=filled(auto)?"자동 불러오기 · "+auto:"";
          const note=document.querySelector('[data-req="'+i+'"][data-reqkey="note"]');
          if(note)note.value=state.requirements[i].note;
        }
      }
      refreshStep5Derived();
      save();
    };
    e.oninput=handler;e.onchange=handler;
  });
  document.querySelectorAll("[data-next]").forEach(e=>e.onclick=()=>go(Number(e.dataset.next)));
  document.querySelectorAll("[data-prev]").forEach(e=>e.onclick=()=>go(Number(e.dataset.prev)));
  document.getElementById("step5TargetSelect")?.addEventListener("change",e=>selectStep5Target(e.target.value));

  document.getElementById("copySearchPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("searchPromptPreview")?.value||energySearchPrompt(),"내 채용공고 검색 프롬프트를 복사했습니다."));
  document.getElementById("refreshJobPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("jobPromptPreview"),v=jobAnalysisPrompt();if(e)e.value=v;updatePromptDraft("job",v);toast("현재 분석 대상 정보를 프롬프트에 반영했습니다.");});
  document.getElementById("copyReviewedJobPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("jobPromptPreview")?.value||jobAnalysisPrompt(),"내 직무분석 프롬프트를 복사했습니다."));
  document.getElementById("applyJobTableAiBtn")?.addEventListener("click",applyJobTableAi);
  document.getElementById("copyKeywordPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("keywordPromptPreview")?.value||competencyKeywordPrompt(),"내 역량분석 프롬프트를 복사했습니다."));
  document.getElementById("applyCompetencySummaryBtn")?.addEventListener("click",applyCompetencySummary);
  document.getElementById("copyGapPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("gapPromptPreview")?.value||gapPrompt(),"내 GAP 분석 프롬프트를 복사했습니다."));
  document.getElementById("applyGapResultBtn")?.addEventListener("click",applyGapResult);
  document.getElementById("refreshSelfIntroPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("selfIntroPromptPreview"),v=selfIntroPrompt();if(e)e.value=v;updatePromptDraft("selfIntro",v);toast("현재 입력을 자기소개서 프롬프트에 반영했습니다.");});
  document.getElementById("copySelfIntroPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("selfIntroPromptPreview")?.value||selfIntroPrompt(),"내 자기소개서 프롬프트를 복사했습니다."));
  document.getElementById("interviewModeSelect")?.addEventListener("change",e=>{
    state.interviewMode=e.target.value==="12"?"12":"6";
    const p=document.getElementById("interviewPromptPreview"),v=interviewPrompt();
    if(p)p.value=v;
    updatePromptDraft("interview",v);
    toast((state.interviewMode==="12"?"12문항 심화모드":"6문항 실전면접 모드")+"로 바꿨습니다.");
  });
  document.getElementById("refreshInterviewPromptBtn")?.addEventListener("click",()=>{const e=document.getElementById("interviewPromptPreview"),v=interviewPrompt();if(e)e.value=v;updatePromptDraft("interview",v);toast("현재 입력을 실전면접 프롬프트에 반영했습니다.");});
  document.getElementById("copyInterviewPromptBtn")?.addEventListener("click",()=>copyText(document.getElementById("interviewPromptPreview")?.value||interviewPrompt(),"실전면접 프롬프트를 복사했습니다. AI 채팅창에 붙여넣고 면접을 시작하세요."));
  document.getElementById("docBtn")?.addEventListener("click",exportDoc);
  document.getElementById("printBtn")?.addEventListener("click",()=>window.print());
  document.getElementById("jsonBtn2")?.addEventListener("click",exportJson);
  document.getElementById("copyBtn")?.addEventListener("click",()=>copyText(portfolio(),"Portfolio 텍스트를 복사했습니다."));
  document.getElementById("resetBtn")?.addEventListener("click",()=>{
    if(confirm("Jobfit FLEX 직무분석 데이터만 새로 시작할까요? INJE Jobfit 데이터에는 영향을 주지 않습니다.")){
      localStorage.removeItem(STORAGE_KEY);state=defaults();activePosting=0;render();toast("FLEX 데이터만 초기화했습니다.");
    }
  });
}

function render(){
  nav();
  const pages=[null,step1,step2,step3,step4,step5,step6];
  document.getElementById("stepRoot").innerHTML=pages[state.currentStep]();
  bind();progress();
}

function go(n){
  save();
  state.currentStep=Math.max(1,Math.min(6,n));
  save();render();
  requestAnimationFrame(()=>{
    const root=document.getElementById("stepRoot");
    if(!root)return;
    const mobile=window.matchMedia("(max-width:650px)").matches;
    const offset=mobile?86:24;
    const y=root.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
  });
}

function download(name,content,type){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}

function base(){return "Jobfit_FLEX_"+(state.target.job||"직무분석").replace(/[\\/:*?"<>|]/g,"_");}
function exportJson(){save();download(base()+"_backup.json",JSON.stringify(state,null,2),"application/json;charset=utf-8");toast("FLEX 백업파일을 저장했습니다.");}
function exportDoc(){
  const body=portfolio().split("\n").map(x=>"<p>"+(h(x)||"&nbsp;")+"</p>").join("");
  const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"Malgun Gothic",sans-serif;line-height:1.55;color:#222}p{margin:5px 0}p:first-child{font-size:22px;font-weight:700;margin-bottom:18px}</style></head><body>'+body+"</body></html>";
  download(base()+".doc","\ufeff"+html,"application/msword");toast("Word용 문서를 저장했습니다.");
}
function importJson(file){
  const r=new FileReader();
  r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw new Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(x));state=load();render();toast("FLEX 백업을 불러왔습니다.");}catch(e){toast("Jobfit FLEX 백업파일인지 확인해 주세요.");}};
  r.readAsText(file,"utf-8");
}

document.getElementById("exportJsonBtn").onclick=exportJson;
document.getElementById("importJsonBtn").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=e=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";};

render();

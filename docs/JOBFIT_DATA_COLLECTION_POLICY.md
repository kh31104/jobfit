# Jobfit 중앙 운영 DB 수집 기준

목적: 수업 운영 중 Jobfit 참여코드별 진행상태와 구조화 결과를 중앙에 백업한다. 현재 학생 화면과 STEP 0~13 흐름은 변경하지 않는다. 연구용 중앙 DB(research_*)와 운영 DB(jobfit_*)는 분리한다.

| STEP | 중앙 운영 DB에 저장 | 저장하지 않음 |
|---|---|---|
| 0 Career Start | Jobfit 참여코드 연결정보, 수업코드, 학년·전공 등 기본정보, 준비상태, 현재 STEP/완료율 | 이름, 학번, 이메일, 전화번호, AI Check-in 원문, PRE 연구측정 원자료 |
| 1 Career DNA | Balance 선택, 고용24 직업선호도 S형 RIASEC 점수·검사일, 고용24 직업가치관 9개 점수·검사일, 자기선택 강점, VIA TOP5, 확인된 강점·보완 키워드 | 흥미·가치 자기성찰 자유서술 원문, AI 통합분석 전체 원문, 비교·성찰 자유서술 원문, Career Anchor·다중지능 신규자료 |
| 2 Experience & Competency | 경험 개수, 경험 유형, 참여도 자기평가, 증거유형, 근거 확인 수준(학생 자기평가), 행동근거가 있는 역량 후보 키워드, 학생 사실확인 상태 | 경험명, 상황·행동·결과·증거 원문, AI 구조화 원문, PRE 연구측정 원자료 |
| 3 Job Explorer | 직무 후보명·직무군, Target Job 선택 | 자유서술 메모 |
| 4 Job Deep Dive | 직무별 출처·Task·Requirement 개수 | Task/Requirement 자유서술 원문, 출처 메모 원문 |
| 5 Industry & Company | 산업·기업 후보명, 유형, 연결 직무, Target 선택, 채용근거 상태 | 산업/기업 분석 자유서술 원문, URL·메모 원문 |
| 6 Career Fit Map | 비교 조합, 1~5 자기평가 점수, Evidence/정보 커버리지, 최종 선택 | 선택 이유·리스크·성찰 자유서술 |
| 7 JD Analyzer | 기업·직무명, 공고 제목, 마감일, Gate 상태, Requirement 유형/중요도 분포 | 채용공고 원문, 발췌문, 분석메모 |
| 8 Career Asset Match | Evidence 수준, Requirement 연결, 활용처, Fact Check 상태 | 개인 경험 근거 문장, 사실 Evidence 문장, GAP 자유서술 |
| 9 Resume Lab | STEP 완료 여부만 | 이력서 문장·요약·스킬 원문 |
| 10 Cover Letter Lab | STEP 완료 여부만 | 자기소개서 문항·답변 원문 |
| 11 Interview Lab | STEP 완료 여부만 | 면접질문·답변·연습메모 원문 |
| 12 Human-First Check | STEP 완료 여부만 | 검토 문장·메모 원문 |
| 13 AI Job Portfolio | Final Ready/Draft, 최종 체크 상태, 완료시각 | 포지셔닝·GAP·30/90일 계획 원문, POST 연구측정 원자료 |

## 서버 차단 항목

Edge Function에서 허용목록 방식으로 정제한다. 브라우저가 전체 상태를 전송하더라도 다음 항목은 DB payload에 기록하지 않는다.

- 이름, 학번, 이메일, 전화번호
- research.measurements 전체
- 경험 서술 원문
- AI 대화 및 AI 분석 전체 원문
- Resume/Cover Letter/Interview 원문
- Job Portfolio 자유서술 원문

## 연구 활용

jobfit_* 운영 DB에 쌓인 자료가 자동으로 연구자료가 되는 것은 아니다. Jobfit 참여코드는 연구문서에서 가명화된 참여자 코드(pseudonymous participant code)로 취급한다. 연구 활용은 승인된 연구계획, 동의 범위, IRB 필요 여부를 별도로 확인한 뒤 research_* 파이프라인으로 분리한다.

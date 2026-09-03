# Jobfit 학생 DB 구조안

## 1. 현재 상태

현재 Jobfit은 `localStorage + JSON 백업파일` 방식이다.

- 학생 답변: 학생이 사용한 브라우저에 저장
- 기기 변경: JSON 백업파일을 새 기기에서 불러와 복구
- 교수자 열람: 불가능
- 중앙 서버 전송: 비활성화
- 익명코드: PRE/POST와 주차별 데이터를 연결하는 식별자이며 로그인 비밀번호가 아님

따라서 현재 교수자는 학생의 개별 답변이나 전체 진행률을 홈페이지에서 볼 수 없다.

## 2. 목표 UX

### 학생

1. `INJE2026` 접속
2. 익명코드 + 개인 복구키 입력
3. 서버에서 최신 학습상태 불러오기
4. 어느 기기에서든 이어서 진행
5. 입력할 때마다 로컬에 우선 저장하고 서버와 동기화
6. 필요하면 JSON으로 별도 백업

### 교수자

1. 교수자 계정으로 로그인
2. `INJE2026` 대시보드 접속
3. 익명코드별 주차 진행률·PRE/POST 완료상태 확인
4. 연구동의가 완료된 자료만 연구용 데이터셋으로 분리
5. CSV/XLSX 내보내기

## 3. 익명코드만으로 로그인하면 안 되는 이유

`JF26-XXXXXX` 익명코드는 학생을 구분하는 공개 식별자다. 이것만 입력해 데이터를 불러오게 하면 코드를 우연히 알게 된 다른 사람이 해당 학생의 답변을 읽거나 바꿀 수 있다.

권장 구조:

- `participant_code`: 수업에서 사용하는 익명코드
- `recovery_key`: 학생만 보관하는 복구키
- 서버에는 복구키 원문이 아니라 안전한 해시만 저장

학생 화면에서는 두 값을 한 번에 보관할 수 있는 복구카드 또는 QR을 제공한다. 같은 기기에서는 복구키를 다시 묻지 않고, 새 기기에서만 익명코드와 복구키를 요구한다.

## 4. 권장 데이터 모델

### courses

- `id`
- `course_code` — 예: INJE2026
- `institution`
- `term`
- `status`
- `created_at`

### participants

- `id` — 내부 UUID
- `course_id`
- `participant_code` — JF26-XXXXXX
- `status`
- `created_at`
- `last_seen_at`

고유조건: `(course_id, participant_code)`

### participant_credentials

- `participant_id`
- `recovery_key_hash`
- `key_version`
- `failed_attempts`
- `locked_until`
- `rotated_at`

### learner_states

- `participant_id`
- `schema_version`
- `state_json`
- `active_step`
- `revision`
- `client_updated_at`
- `server_updated_at`

학생의 전체 로드맵 상태를 버전이 있는 JSON으로 저장한다. `revision`을 사용해 휴대폰과 노트북에서 동시에 수정했을 때 덮어쓰기를 막는다.

### measurements

- `id`
- `participant_id`
- `instrument_code`
- `timepoint` — pre/post
- `capture_context` — step0, step2-before-experience-strength-analysis, step13 등
- `wording_version`
- `scores_json`
- `items_json`
- `captured_at`

측정자료는 전체 학습상태와 별도 테이블에 저장해 PRE/POST 분석과 문항버전 관리를 쉽게 한다.

### consents

- `participant_id`
- `consent_type` — education/research
- `document_version`
- `status`
- `consented_at`
- `withdrawn_at`

교육을 위한 저장과 연구 활용 동의를 분리한다.

### step_progress

- `participant_id`
- `step_no`
- `completion_status`
- `completed_at`
- `last_updated_at`

교수자 대시보드는 전체 답변 원문보다 이 진행상태를 기본 화면으로 사용한다.

### audit_logs

- `id`
- `actor_type`
- `actor_id`
- `action`
- `target_type`
- `target_id`
- `created_at`

교수자 열람·내보내기·학생 복구 등 중요한 접근 기록을 남긴다.

## 5. 동기화 원칙

1. 입력 즉시 브라우저에 저장한다.
2. 온라인이면 1–3초 지연 후 서버에 동기화한다.
3. 서버는 `revision`이 일치할 때만 저장한다.
4. 충돌 시 자동으로 최근값을 덮어쓰지 않고 학생에게 두 버전을 보여준다.
5. 오프라인에서는 로컬 저장을 계속하고 온라인 복귀 후 재동기화한다.
6. JSON 백업·복구 기능은 서버 도입 후에도 유지한다.

## 6. 교수자 대시보드 최소 화면

### 수업 현황

- 등록 익명코드 수
- 최근 접속 학생 수
- STEP 0–13 완료율
- PRE/POST 완료율
- 백업 또는 서버동기화 상태

### 학생별 현황

- 익명코드
- 현재 STEP
- 마지막 저장시각
- 고용24 PRE/POST 완료
- CAAS PRE/POST 완료
- 강점활용·약점교정 STEP 2/POST 완료
- 데이터 누락 경고

### 연구 데이터

- 연구동의 완료자만 포함
- 이름·학번·전화번호 제외
- 측정도구·시점·문항버전·결측률 확인
- CSV/XLSX 내보내기

## 7. 권한과 보안

- 학생은 자신의 데이터만 읽고 수정
- 교수자는 자신이 담당한 수업의 익명 진행자료만 열람
- 연구자료 열람은 별도 권한
- 관리자용 비밀키는 웹페이지 코드와 공개 저장소에 절대 포함하지 않음
- 모든 통신은 HTTPS
- 복구키 원문 저장 금지
- 반복 로그인 실패 제한
- 교수자 내보내기와 열람 로그 기록
- 보존기간 종료 후 익명 학습자료와 연구자료를 정책에 따라 분리 삭제

## 8. 단계별 도입

### Phase 1 — 현재 적용

- 브라우저 자동저장
- JSON 다운로드·공유
- 기기 밖 보관 선택 확인
- 다른 기기에서 JSON 복구

### Phase 2 — 파일 제출형 교수자 수집

- 학생이 학기 중 지정 시점에 JSON을 LMS 과제로 제출
- 교수자는 제출파일을 일괄 병합
- 서버 개발 전 연구자료 수집의 임시방식

### Phase 3 — 학생 클라우드 동기화

- 익명코드 + 복구키 등록
- 어느 기기에서든 이어하기
- 로컬 우선 + 서버 동기화
- 교수자 진행률 대시보드

### Phase 4 — 연구 데이터 파이프라인

- 연구동의 분리
- 측정자료 정규화
- 문항버전·시점 검증
- 분석용 CSV/XLSX 내보내기

## 9. 구현 전 확정할 결정

1. 학생 데이터의 중앙저장을 수업운영용으로 먼저 사용할지
2. 연구동의와 교육저장 동의를 어떤 화면에서 분리할지
3. 교수자가 학생 원문까지 볼지, 진행률·측정점수만 볼지
4. 데이터 보존기간
5. 복구키 분실 시 재발급 정책
6. 학교 계정 로그인을 사용할지, 완전 익명방식을 유지할지

권장 기본값은 `완전 익명 + 익명코드/복구키 + 교수자는 진행률과 연구승인 데이터만 열람`이다.

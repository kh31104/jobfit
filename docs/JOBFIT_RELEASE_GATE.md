# Jobfit 배포 게이트

## 목적
학생용 GitHub Pages에는 회귀검사를 통과한 코드만 반영한다.

## 운영 원칙
1. 기능 수정은 `main`이 아니라 `jobfit-v2-build`에서 시작한다.
2. `Jobfit regression checks`의 `syntax-and-contracts`와 `browser-regression`이 모두 성공해야 한다.
3. `jobfit-v2-build`에서 두 검사가 성공하면 `release-ready`가 해당 커밋 SHA를 배포 가능 상태로 표시한다.
4. 운영 반영 시에는 검사를 통과한 **정확한 SHA**만 `main`으로 승격한다.
5. `main` 반영 후 같은 `Jobfit regression checks`의 `live-production`이 해당 SHA의 GitHub Pages 배포 성공을 기다린 뒤 실제 학생용 주소를 모바일과 데스크톱에서 다시 검사한다.
6. 실제 운영 중 문제가 확인되면 수정은 다시 `jobfit-v2-build`에서 시작한다.

## 검사 범위
- STEP 0–13 전체 로딩
- 수업 URL의 `course=INJE2026` 유지
- 익명코드 및 localStorage 저장 유지
- 중앙 연구 제출 비활성화 계약
- Career DNA 동적 프롬프트의 입력자료 선택 사용
- 부분 입력 시 미입력값 추정 금지
- S/L 검사별 모듈 분리
- 고용24 S/L 기기 지원 안내
- AI 인터뷰 프롬프트 복사·사용 순서와 자동전송 아님 안내
- STEP 간 데이터 연결
- 백업·복구
- 모바일/데스크톱 렌더링 및 가로 넘침
- 배포 후 학생용 실주소 확인

## 하드 락 주의
현재 저장소의 `main` 브랜치는 GitHub 서버 차원 Branch Protection이 켜져 있지 않다. ChatGPT 작업에서는 이 문서의 게이트를 기본 규칙으로 사용하고 `main`을 직접 수정하지 않는다. GitHub UI에서 Branch Protection 또는 Ruleset을 추가하면 수동 직접 push까지 차단할 수 있다.

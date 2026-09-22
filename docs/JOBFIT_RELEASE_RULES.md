# Jobfit 운영 배포 규칙

기준 운영본: `production-stable-20260922`

## 1. main 직접 수정 금지

운영 변경은 다음 순서만 사용한다.

1. 작업 브랜치 생성
2. 코드 수정
3. Pull Request 생성
4. 자동검사 통과
5. Merge commit 방식으로 main 병합
6. GitHub Pages 배포 성공 확인
7. live-production 데스크톱·모바일 검사 확인

`main-pr-guard.yml`은 main에 직접 push되거나 squash/rebase 방식으로 들어온 단일-parent 커밋을 실패로 표시한다.

## 2. 병합 전 필수 자동검사

최소 다음 검사를 모두 통과한다.

- syntax-and-contracts
- browser-regression
- Jobfit stabilization smoke

main 병합 후에는 다음도 확인한다.

- Pages exact SHA 배포
- live-production desktop
- live-production mobile

## 3. 학생 데이터 보호

운영 변경에서 아래 항목은 별도 마이그레이션 검증 없이 변경하지 않는다.

- localStorage key: `jobfit:v2:learner`
- IndexedDB continuity DB: `jobfit-v2-continuity`
- 기존 STEP 0/STEP 1 저장 데이터의 읽기 호환성

운영 코드에 `localStorage.clear()` 또는 `removeItem('jobfit:v2:learner')`를 추가하지 않는다.

## 4. 장애 복구

문제가 생기면 먼저 `production-stable-20260922`를 기준으로 비교한다. 실제 학생 데이터가 저장된 상태에서는 저장 스키마 호환성 검증 없이 과거 버전으로 즉시 롤백하지 않는다.

## 5. GitHub 관리자 설정 권장값

GitHub Settings에서 main branch protection/ruleset을 설정할 때:

- Require a pull request before merging: ON
- Require status checks before merging: ON
- 필수 검사: `syntax-and-contracts`, `browser-regression`, `smoke`
- Require branches to be up to date before merging: ON
- Allow force pushes: OFF
- Allow deletions: OFF
- 가능하면 관리자도 규칙 우회 금지

이 관리자 설정이 켜져야 GitHub 서버가 직접 push 자체를 사전에 차단한다. 저장소 안의 guard workflow는 직접 push를 사후 감지하는 보조장치다.

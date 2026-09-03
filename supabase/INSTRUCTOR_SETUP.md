# Jobfit 중앙 연구 DB 운영 전환

중앙 전송은 최종 연구 설명문·동의서가 승인된 뒤에만 활성화한다.

## 1. 운영 DB

research_schema.sql을 적용하면 다음이 생성된다.

- research_cohorts
- research_instructors
- research_participants
- research_consents
- research_snapshots
- 교수자 전용 RPC get_research_dashboard

연구 테이블은 anon, authenticated에 직접 공개하지 않는다. 교수자
대시보드는 배정된 수업의 최신 연구 전용 스냅샷만 RPC로 받는다.

## 2. 교수자 계정 연결

운영 교수자 이메일은 `kh21003@naver.com`이며, Supabase Auth 사용자와
`INJE2026`의 `owner` 권한 연결을 완료했다. 재연결이 필요할 때만 아래 SQL을 실행한다.

```sql
insert into public.research_instructors(cohort_id,user_id,role)
select c.id,u.id,'owner'
from public.research_cohorts c
join auth.users u on lower(u.email)=lower('kh21003@naver.com')
where c.cohort_code='INJE2026'
on conflict (cohort_id,user_id) do update set role=excluded.role;
```

Auth URL Configuration의 허용 Redirect URL에 다음 주소를 등록한다.

https://kh31104.github.io/jobfit/instructor/

## 3. 연구동의 확정 후 전송 개방

Edge Function secret RESEARCH_CONSENT_VERSION에는 승인된 동의서의
버전 식별자만 입력한다. 예: inje-jobfit-consent-2026-09-v1

이후 research-sync-config.js에서 다음 네 값만 최종 배포한다.

```js
enabled:true,
instructorAuthEnabled:true,
consentApproved:true,
consentVersion:'inje-jobfit-consent-2026-09-v1',
consentDocumentUrl:'https://승인된-연구동의서-주소'
```

교수자 계정만 먼저 확인할 때는 instructorAuthEnabled만 true로 켤 수 있다.
학생 제출은 enabled, consentApproved, consentVersion, consentDocumentUrl이
모두 유효해야 열리므로 교수자 로그인과 별도로 통제된다.

동의서 URL과 버전값이 비어 있거나 승인 플래그가 꺼져 있으면 학생
중앙 제출은 작동하지 않는다.

## 4. 수업 전 확인

1. 등록된 교수자 이메일로 Magic Link 로그인
2. 중앙 DB 조회 시 INJE2026만 열리는지 확인
3. 미등록 이메일은 새 계정이 생성되지 않는지 확인
4. 승인된 동의 버전과 다른 제출은 거절되는지 확인
5. 교수자 화면과 CSV에 활동 원문이 없는지 확인

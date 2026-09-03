# jobfit
VIA 강점과 다중지능을 활용한 청년 진로·직무 탐색 웹앱

## INJE2026 운영 링크

- 학생 화면: `https://kh31104.github.io/jobfit/?course=INJE2026`
- 교수자 연구 대시보드: `https://kh31104.github.io/jobfit/instructor/`

교수자 대시보드의 현재 운영 모드는 학생이 내려받은 `jobfit-research-*.json` 파일을 여러 개 불러와 브라우저 메모리에서 취합하고 CSV/통합 JSON으로 저장하는 방식이다. 활동 원문은 가져오지 않는다. 중앙 DB 스키마와 Edge Function은 `supabase/`에 준비되어 있으나 연구동의·교수자 인증·운영 Supabase 적용 전까지 네트워크 수집은 비활성화한다.

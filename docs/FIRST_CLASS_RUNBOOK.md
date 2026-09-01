# First Class Runbook — Inje University

## Goal
Run Week 1 safely before central research collection is enabled.

## Production assumption
After v2 is reviewed and merged, keep the existing public Jobfit entry URL and route it to the v2 app so existing QR usage does not fragment.

## Course preset
Course code: `INJE2026`

Preset behavior:
- full Career Roadmap
- selective mode locked off for this course
- interest test not yet forced in Week 1
- research collection OFF
- anonymous Jobfit code used instead of login

## Week 1 student flow
1. Open Jobfit.
2. Apply course code `INJE2026` if the distributed URL does not already contain it.
3. Generate anonymous Jobfit code.
4. Save the code personally.
5. Enter background profile and career baseline.
6. Enter AI-use baseline.
7. Write My AI Career Rule.
8. Save Career Start.

## Instructor wording to emphasize
- This is not a test score for grading.
- “아직 모르겠다” is valid baseline data.
- Do not enter name, student number or phone number.
- The anonymous code is needed to reconnect the student's own data.
- Current first-class build stores learning data in the browser; central research collection is not yet active.

## Browser/data warning
Until the approved central backend is enabled, clearing browser storage or switching devices will not restore local Jobfit state. Students should export their Jobfit JSON periodically using “내 데이터 내보내기”.

## Fallback if Wi-Fi fails
Collect only a temporary student-held worksheet with:
- anonymous code;
- career decision baseline;
- AI baseline;
- My AI Career Rule.
Students enter it later. The instructor should not collect names linked to research data at this stage.

## Week 3 test assignment
General public/selective users can choose S or L.
For a class-assigned administration, the instructor can distribute a URL parameter:
- `interest=S`
- `interest=L`

S and L should not both be required from the same student for the same Career DNA administration.

## Before going live
- mobile Chrome test
- iPhone Safari test
- course-code test
- local save/reload test
- JSON export test
- STEP 0 → STEP 1 navigation test
- S/L forced URL test
- review wording for research/consent before ever enabling `research=1`

# Jobfit research measure provenance lock

이 문서는 Jobfit 연구·수업용 척도의 출처 혼동, 동명이인 오인, 임의 번역의 공식판 오표기를 방지하기 위한 잠금 기록이다.

## 1. K-CAAS-SF — 12 items

- Korean validation: 김민선·고은영 (2020), 「한국판 진로적응성 단축형척도(K-CAAS-SF) 타당화」, 교원교육, 36(4), 261–281.
- DOI: 10.14333/KJTE.2020.36.4.261
- Primary-source item location: 논문 pp. 280의 <부록> 「한국판 진로적응성 단축형척도(K-CAAS-SF) 문항」.
- Original short form: Maggiori, Rossier, & Savickas (2017), Career Adapt-Abilities Scale–Short Form (CAAS-SF): Construction and Validation.
- Locked structure: 12 items = concern 3 + control 3 + curiosity 3 + confidence 3.
- Response scale in Korean validation: 1 (전혀 그렇지 않다) to 5 (매우 그렇다).
- Jobfit version: `K-CAAS-SF-KR-2020-v1`
- Rule: do not replace, reorder, shorten, or paraphrase the 12 Korean items without a newly documented primary source and a new version identifier.

## 2. Korean strengths use / deficit correction — final 9 items

- Korean validation: 조영아 (2019), 「한국판 강점활용 및 약점교정 척도 타당화」, 학습자중심교과교육연구, 19(9), 245–274.
- DOI: 10.22251/jlcci.2019.19.9.245
- Author identity lock: the article itself identifies 조영아 / Younga Cho as Sangji University. Do not substitute a same-name researcher from another university.
- Original student form: Mostert, Theron, & De Beer (2017), “Validating strengths use and deficit correction behaviour scales for South African first-year students.”
- Original form structure: 10 items = strengths use 5 + deficit correction 5.
- Korean validation procedure: 조영아(2019)는 10문항을 번안해 분석한 뒤, 탐색적 요인분석에서 원척도 6번 문항 「나는 내 계발분야에 집중한다」가 강점활용과 약점교정을 잘 변별하지 못한다고 판단하여 삭제하였다.
- Primary-source final item location: 조영아(2019) p. 262, <표 8> 「최종 척도 및 신뢰도」.
- Locked final structure: 9 items = strengths use 5 + deficit correction 4; original item numbers 1,2,3,4,5,7,8,9,10.
- Response scale reported in the Korean validation: 0 (전혀 그렇지 않다) to 6 (매우 그렇다).
- Reliability reported for final 9 items: total α=.87; strengths use α=.88; deficit correction α=.83.
- Jobfit version: `SUDCO-CHO-KR-2019-9-v1`
- The previous Jobfit 10-item Korean classroom translation (`SUDCO-STUDENT-2017-KOCLASS-v1`) is retired and must not be automatically migrated into the 9-item Korean validation version.
- PRE timing lock: **4주차 STEP 2 Experience & Competency 수업에서 경험·강점 분석 활동을 시작하기 직전에 측정한다.** 1주차 전체수업 시작점 측정으로 해석하지 않는다.
- POST timing lock: 학기 말 STEP 13에서 동일한 9문항·동일 응답척도로 측정한다.
- Analysis rule: SUDCO의 PRE–POST 해석은 ‘4주차 강점·경험 교육 직전 → 학기 말’ 변화로 정의하고, 측정일시(capturedAt)와 버전 정보를 함께 보존한다.

## 3. Restricted delivery rule

The repository is public, so full scale wording must not be embedded in GitHub JavaScript files.

- Public Jobfit code may contain instrument/version/source metadata, but not the complete item text.
- For the designated Inje course (`INJE2026`, `INJE-2026-2`), scale items are delivered only after the classroom access code is validated by the Supabase Edge Function `research-measures`.
- The access code itself must never be committed to the GitHub repository.
- Authorized measure data is kept in browser `sessionStorage`, so closing the browser session requires re-authentication; reloading the same tab does not require re-entry.
- Learner-side network safety checks permit only the restricted measure-retrieval call; research-data submission remains separately disabled until the research consent configuration is approved.
- This is a classroom/research-participant access control, not DRM; authorized participants can still see the items they are asked to answer.

## 4. Research-data rule

Each saved/exported response must retain at minimum:
- instrument name
- item count
- response range and anchors
- original item numbering
- wording version/status
- citation / DOI source metadata

Legacy 10-item SUDCO responses and final Korean 9-item responses must remain distinguishable by version and item count.

## 5. Change-control rule

Any future change to item wording, order, number, response anchors, scoring, or source must:
1. be checked against a primary or official source;
2. be given a new version identifier;
3. update the restricted measure service, research export metadata, and tests together;
4. never be inferred solely from an author name, secondary summary, search snippet, or an unverified prior ChatGPT answer.

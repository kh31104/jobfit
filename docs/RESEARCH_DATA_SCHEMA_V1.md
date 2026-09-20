# Jobfit Research Core Data Schema v1.2

## Principle
Research Core is an allowlist, not a copy of learner state. Personal career narratives, resume/cover-letter text, Raw Voice and raw AI chats are excluded by default.

## Current collection status
- Learning/diagnostic values can be stored locally in the student's browser and JSON backup.
- Central research transmission is currently disabled.
- Local educational measurement does not automatically mean the data may later be used for research.
- Actual research use must follow the final consent/IRB/institutional procedure and scale-use conditions applicable to that study.

## Keys / context
- schema_version
- participant_code: random Jobfit pseudonymous code
- cohort_id
- institution_code
- program_type: regular_course / external_lecture / self_use / other
- roadmap_mode: full / selective
- assessment_timepoint: baseline / pre / post / followup / single
- collected_at

## Demographic / academic background
Recommended minimum:
- age
- gender
- grade
- major_raw (retain only if approved; derive major_group for analysis)
- major_group
- enrollment_status
- graduation_horizon
- GPA_band

Avoid by default:
- name
- student number
- phone
- personal email
- home address
- exact birth date
- family income / parents' education unless specifically needed in an approved study

## Career preparation baseline
- job_decision_level
- industry_decision_level
- preparation_stage
- internship_field_experience
- career_program_participation
- certificate_preparation_band
- prior_application_experience
- paid_work_experience

## AI-use baseline
- generative_ai_frequency
- ai_tools_used
- ai_career_use_level
- ai_career_use_categories

# Work24 assessments

## Work24 interest assessment
Research-standard Career DNA administration:
- interest_test_type: S
- test_date
- R/I/A/S/E/C raw scores
- R/I/A/S/E/C standard scores

For legacy records, retain the original `interest_test_type` and never merge S/L results as if they were the same administration.

## Work24 work-values assessment
- test_version if known
- test_date
- all nine reported value scores used by Jobfit

Store all subscale scores; TOP values are display derivatives only.

## Work24 대학생진로준비도검사 — PRIMARY PRE/POST OUTCOME
Administration principle:
- Student completes the official test on Work24.
- Jobfit does not reproduce the official question items.
- Jobfit stores the result date and 14 reported subfactor T-scores.
- Use the same test name and score structure at PRE and POST.

Store:
- instrument = 고용24 대학생진로준비도검사
- exam_date
- score_type = T-score
- score_1 계획성
- score_2 독립성
- score_3 자신지식(자기이해)
- score_4 진로활동경험
- score_5 자기이해노력
- score_6 진로수업경험
- score_7 사회적 지지자 지원
- score_8 진로의사결정
- score_9 적극적 직업탐색
- score_10 비공식적 직업탐색
- score_11 예비적 직업탐색
- score_12 공식적 직업탐색
- score_13 취업준비노력
- score_14 취업준비강도
- score_schema/version metadata when available
- timepoint PRE / POST

Do not collapse the 14 scores into an ad hoc total. Preserve the official subfactor T-scores for analysis.

# Additional PRE/POST instruments

## Career Adapt-Abilities Short Form slot — SECONDARY OUTCOME
Current research-program lock:
- Korean validation source and 12-item structure are recorded in `v2/MEASURE_PROVENANCE.md`.
- Jobfit version: `K-CAAS-SF-KR-2020-v1`.
- 12 items = Concern 3 + Control 3 + Curiosity 3 + Confidence 3.
- Response range: 1–5.
- Wording/order/scoring must not be changed without a new version identifier.
- Web delivery/reuse permission conditions must be separately verified and documented before research collection is opened.
- Different wording versions must never be pooled without measurement-comparability review.

Preferred storage:
- 12 item responses
- Concern
- Control
- Curiosity
- Confidence
- total/mean
- wording_version
- wording_status
- administration date/timepoint

## Strength Use & Deficit Correction Behaviour slot — EXPLORATORY / MECHANISM
Current research-program lock:
- Korean validation source is recorded in `v2/MEASURE_PROVENANCE.md`.
- Jobfit version: `SUDCO-CHO-KR-2019-9-v1`.
- Final Korean structure: 9 items = strengths use 5 + deficit correction 4.
- Response range: 0–6.
- PRE timing: STEP 2 immediately before experience/strength analysis.
- POST timing: STEP 13.
- Web delivery/reuse permission conditions must be separately verified and documented before research collection is opened.
- Legacy provisional/10-item data remain separate and are not migrated automatically.

Preferred storage:
- 9 item responses
- Strength Use mean
- Deficit Correction mean
- wording_version
- wording_status
- administration date/timepoint

# PRE/POST analysis safeguards
A one-group PRE–POST difference by itself is not proof that the course caused the change.

Before research analysis, check:
- same participant_code at PRE and POST
- same instrument and wording version at both timepoints
- attrition and missingness
- scale reliability in the collected sample
- distribution/outliers
- baseline preparation level and relevant covariates
- whether comparison/control data are available
- whether retrospective use is permitted by the approved research process

## Explicitly excluded learner artifacts
- raw personal experiences
- Raw Voice
- AI-structured experience text
- Career Asset narrative text
- target company/application narrative
- resume bullets
- cover letters
- interview transcripts
- raw AI conversations
- uploaded documents

A future study may define derived/non-identifying variables from these artifacts only with a study-specific data plan.

## Consent separation
Recommended structure when central research collection is enabled:
- consent record separate from research response rows
- participant_code used in research table
- no name/student-number map inside the research dataset
- refusal/non-participation does not disable learning functions

## Multi-university sampling metadata
Retain where appropriate:
- institution_code
- institution_type
- institution-level region
- program_type
- program_duration
- instructor/course cohort
- roadmap mode
- assessment assigned by instructor vs learner-selected

These variables describe instructional conditions and do not make convenience samples representative.

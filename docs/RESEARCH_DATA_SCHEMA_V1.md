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
Exactly one assessment per administration:
- interest_test_type: S or L
- test_date
- R/I/A/S/E/C raw scores
- R/I/A/S/E/C standard scores

If L:
- Big Five reported scores
- validity/response indices when present
- personality facets when present
- life-history scores when present

Never treat S and L as two independent measures from the same student administration. Retain `interest_test_type`.

## Work24 work-values assessment
- test_version if known
- test_date
- all nine reported value scores used by Jobfit

Store all subscale scores; TOP values are display derivatives only.

## Work24 구직준비도검사 — PRIMARY PRE/POST OUTCOME
Administration principle:
- Student completes the official test on Work24.
- Jobfit does not reproduce the official question items.
- Jobfit stores the result date and nine official result-score fields.
- Use the same test name at PRE and POST.

Store:
- instrument = 고용24 구직준비도검사
- exam_date
- score_1 경제적 취약성 적응도
- score_2 가족의 지지
- score_3 사회적 지지
- score_4 자아 존중감
- score_5 자기 효능감
- score_6 구직기술
- score_7 의사전달
- score_8 대인관계 활용
- score_9 구직정보 수집
- score_schema/version metadata when available
- timepoint PRE / POST

Do not collapse the nine scores into one unvalidated total unless a scoring manual explicitly supports that total.

# Additional PRE/POST instruments

## Career Adapt-Abilities Short Form slot — SECONDARY OUTCOME
Current implementation:
- 12 response items
- Concern 3
- Control 3
- Curiosity 3
- Confidence 3
- 1–5 response range
- four subscale means + overall mean

Current wording version:
`provisional-ko-v1-from-published-caas-sf-english`

Important version rule:
- Current Korean statements are a provisional educational translation based on publicly available CAAS-SF English items.
- They must not automatically be labelled as the validated Korean K-CAAS-SF in a paper.
- When the Korean validator/author provides official wording or permission conditions, replace wording and increment the version.
- Never pool different wording versions without first evaluating measurement comparability.

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
Current implementation:
- undergraduate/student 5 + 5 structure
- Strength Use 5 items
- Deficit Correction 5 items
- provisional 0–6 response range

Current wording version:
`provisional-student-ko-v1`

Important version rule:
- Current Korean statements are provisional learning-context wording based on the published student structure and original construct/items.
- They must not automatically be labelled as the final validated Korean scale in a paper.
- Replace wording/scoring metadata when the Korean validation author provides the official version.
- Keep pre-existing provisional data separated by wording version.

Preferred storage:
- 10 item responses
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

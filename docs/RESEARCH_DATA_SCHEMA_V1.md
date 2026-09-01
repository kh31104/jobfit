# Jobfit Research Core Data Schema v1

## Principle
Research Core is an allowlist, not a copy of the learner state. Personal career narratives, resume/cover-letter text, raw AI chats and voice samples are excluded by default.

## Collection status
Central collection is NOT enabled in the current development build. A backend, institution-approved consent text and final research/IRB process must be configured before transmission.

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
- gender: female / male / other / prefer_not_to_say
- grade
- major_raw (retain only if approved; derive major_group for analysis)
- major_group
- enrollment_status
- graduation_horizon
- GPA_band (optional; use ranges, not exact GPA, unless a study specifically requires exact values)

Avoid by default:
- name
- student number
- phone
- personal email
- home address
- exact birth date
- family income / parents' education unless a specific approved study requires them

## Career preparation baseline
- job_decision_level
- industry_decision_level
- preparation_stage
- internship_field_experience
- career_program_participation
- certificate_preparation_band
- prior_job_application_experience (candidate for STEP 0 expansion)

## AI-use baseline
- generative_ai_frequency
- ai_tools_used (coded multi-select preferred in production)
- ai_career_use_level
- ai_career_use_categories (candidate for production expansion)

## Work24 interest assessment
Exactly one assessment per administration:
- interest_test_type: S or L
- test_date
- R_raw / I_raw / A_raw / S_raw / E_raw / C_raw
- R_standard / I_standard / A_standard / S_standard / E_standard / C_standard

If L:
- Big Five full reported scores
- validity/response indices when present in the official result
- personality facets when present
- life-history scores when present

Never interpret S and L as two independent measures from the same administration. The database must retain `interest_test_type`.

## Work24 work-values assessment
- test_version if known
- test_date
- all nine reported value scores used by the current Jobfit v2 implementation

Store all subscale scores; derive TOP3 for display only.

## Potential PRE/POST instruments — pending permission
### K-CAAS-SF
Do not activate until use/permission conditions are confirmed.
If approved, preferred research storage:
- 12 item responses
- Concern score
- Control score
- Curiosity score
- Confidence score
- total/mean score
- instrument version / administration date / timepoint

### Korean Strength Use & Deficit Correction scale
Do not activate until use/permission conditions are confirmed.
If approved, preferred research storage:
- item responses
- Strength Use score
- Deficit Correction score
- version / administration date / timepoint

## Work24 university career-readiness assessment
Candidate PRE/POST core instrument. If used, retain all official subscale scores and test/version/date metadata rather than only a summary classification.

## Explicitly excluded learner artifacts
- raw personal experiences
- Raw Voice
- AI Structured experience text
- Career Asset narrative text
- target company/application text
- resume bullets
- cover letters
- interview transcripts
- raw AI conversations
- uploaded documents

A future study may define derived/non-identifying variables from these artifacts, but that requires a study-specific approved data plan.

## Consent separation
Recommended structure:
- consent record stored separately from research response rows
- participant_code used in research table
- no name/student number mapping in the research dataset
- refusal/non-participation must not disable learning functions

## Multi-university sampling metadata
To make external-lecture data analyzable, retain:
- institution_code
- institution_type if needed
- region at institution level (prefer course metadata over asking exact residence)
- program_type
- program_duration
- instructor/course cohort
- roadmap mode
- assessment assigned by instructor vs learner-selected

These variables are necessary to distinguish convenience samples and instructional conditions during later analysis.

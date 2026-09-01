# Jobfit v2 MASTER

## Goal
Jobfit is one integrated AI Career & Job Application platform used across full-roadmap classes, selective modules, regular university courses, and external workshops.

## Core learning flow
SELF → EXPERIENCE → COMPETENCY → JOB → INDUSTRY/COMPANY → FIT → JD → EVIDENCE → APPLICATION → INTERVIEW → PORTFOLIO

## Modes
1. **Full Career Roadmap**: STEP 0→13 전체 결과를 누적한다.
2. **Selective Career Tools**: 현재 필요한 모듈을 선택해 사용한다.
3. **Course configuration** is not a third mode. A course code can lock the roadmap mode and an instructor URL can specify the S/L interest assessment and future research settings.

## Current Inje preset
Course code: `INJE2026` (alias `INJE-2026-2`)
- mode: full
- full roadmap lock: on
- Work24 interest test: choice until instructor specifies S or L
- central research collection: off
- anonymous Jobfit code: used instead of login

## STEP 0–13
- STEP 0 **Career Start**: anonymous code, background profile, course code, career baseline, AI baseline.
- STEP 1 **Career DNA**: Work24 S or L (not both), Work24 work values, VIA TOP5 for learning use, student reflection.
- STEP 2 **Experience & Competency**: raw experience → AI interview → Action/Reason/Result/Evidence/competency; Raw Voice preserved.
- STEP 3 **Job Explorer**: broad evidence-led job exploration; no fixed occupation mapping; student manually chooses Target Job 1–3.
- STEP 4 **Job Deep Dive**: source-grounded Task/KSA/KPI/tools/work context/entry experience + Requirement × My Evidence matrix.
- STEP 5 **Industry & Company Explorer**: industry/customer/business/job connection + company pool and official-source analysis.
- STEP 6 **Career Fit Map**: ME × JOB × INDUSTRY × COMPANY comparison; numeric display is a decision aid, not a psychometric fit score.
- STEP 7 **JD Analyzer**: one real posting → Task/KSA/qualification/preference/competency signals.
- STEP 8 **Career Asset Match**: connect actual JD requirements to verified personal experience evidence and gaps.
- STEP 9 **Resume Lab**: job-targeted resume bullets and experience descriptions, Fact Check.
- STEP 10 **Cover Letter Lab**: question intent → Career Asset selection → AI interview → structured draft, Fact Check.
- STEP 11 **Interview Lab**: personal question bank, evidence-linked answers, follow-ups and practice feedback.
- STEP 12 **Human-First Check**: Raw Voice reference, KEEP/HUMANIZE/DELETE, Fact Lock, resume-cover letter-interview consistency.
- STEP 13 **AI Job Portfolio**: automatically assemble accumulated artifacts + GAP + 30/90-day action plan + print/PDF view.

## Course mapping
- Week 1: STEP 0 Career Start
- Week 2: AI 시대 직업·채용 트렌드와 AI career literacy (no new STEP)
- Week 3: STEP 1 Career DNA
- Week 4: STEP 2 Experience & Competency
- Week 5: holiday / make-up schedule
- Week 6: STEP 3–4 Job Explorer & Job Deep Dive
- Week 7: STEP 5 Industry & Company Explorer
- Week 8: STEP 6 midterm FIT Report
- Week 9: STEP 7–9 actual JD → Career Asset Match → Resume/Experience Description
- Week 10: STEP 10 Cover Letter Lab
- Week 11–12: STEP 11 Interview Lab
- Week 13: STEP 12 Human-First Check
- Week 14: STEP 13 AI Job Portfolio Workshop
- Week 15: make-up/final revision
- Week 16: final Job Portfolio submission

## AI use rule
Jobfit stores learner data, evidence, selected outputs and portfolio artifacts. External AI (ChatGPT/Gemini/Claude etc.) is used for prompt practice, interviewing, analysis, critique and drafting. Jobfit provides evidence-grounded prompts, storage and student verification rather than automating every AI action.

## Research architecture
Learning data and Research Core are separated by an explicit allowlist.

### Learner data
Experience, Raw Voice, competency evidence, job/company/JD analysis, resume, cover letter, interview artifacts and portfolio.

### Research Core — only after approved consent/collection process
- anonymous participant code
- cohort/program/institution metadata
- age, gender, grade, major/major group, academic status, graduation horizon, optional GPA band
- career/employment baseline
- AI-use baseline
- Work24 S OR L result (never require both in the same administration)
- Work24 work-values result
- Work24 university career-readiness result when used
- PRE/POST assessment slots
- K-CAAS-SF only after permission is confirmed
- Korean Strength Use & Deficit Correction scale only after permission is confirmed

VIA TOP5 remains primarily a teaching tool and is not a required research variable.

## Data principles
- Preserve raw student response separately from AI-structured response.
- Store assessment name, version, date and full scores/items where permission and collection method allow.
- Do not store names/student numbers in the Research Core table.
- Research opt-out must not block learning functionality.
- Static GitHub Pages cannot provide a secure central research database by itself; backend/database integration remains a separate implementation layer.
- Current v2 central research submission is intentionally disabled.

## Final portfolio
Career DNA → Target Job → Industry/Company → Target JD → Career Assets → FIT → Resume/Experience Description → Human-First Cover Letter → Interview Evidence → Career GAP → 30/90-day Action Plan.

## Quality control
- `v2/` is the single v2 implementation source.
- JavaScript syntax and required STEP 0–13 module presence are checked through GitHub Actions on the build branch/PR.
- Live `main` remains untouched until production review and explicit approval.

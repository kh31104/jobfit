# Jobfit v2 Build Status

## Production status
- [x] v2 routed from production root
- [x] public GitHub Pages URL preserved
- [x] Inje course preset live: `?course=INJE2026`
- [x] full STEP 0–13 Career Roadmap live
- [x] central research submission remains disabled
- [x] research-only JSON export excludes activity narratives and application text
- [x] interim instructor dashboard imports research JSON files and exports CSV/combined JSON
- [x] central research DB schema, instructor RLS and consent-gated Edge Function scaffold added

## Implemented — Career Roadmap
- [x] STEP 0 Career Start + guided 7-step first-class flow + AI LAB 00
- [x] STEP 1 Career DNA — Work24 S/L one-only, values, VIA education input
- [x] STEP 2 Experience & Competency — Evidence Interview / Raw Voice / Fact Check
- [x] STEP 3 Job Explorer — Anti-Collapse diversity guard / student-selected Target Job
- [x] STEP 4 Job Deep Dive — sources / Task / KSA / KPI / Tool / Requirement Evidence
- [x] STEP 5 Industry & Company — explicit Job→Industry→Company ID relations and hiring evidence
- [x] STEP 6 Career Fit Map — Preference / My Evidence / Information / GAP separated
- [x] STEP 7 JD Analyzer — Application Gate separated from Job Requirements
- [x] STEP 8 Career Asset Match — A/B/C/none + Critical GAP
- [x] STEP 9 Resume Lab — Draft vs Final Ready evidence gates
- [x] STEP 10 Cover Letter Lab — intent→JD Requirement→Career Asset alignment
- [x] STEP 11 Interview Lab — JD/supporting-document claim verification
- [x] STEP 12 Human-First Check — Raw Voice / Fact Lock / cross-document consistency
- [x] STEP 13 AI Job Portfolio — Final Ready evidence + Critical GAP + Action Plan
- [x] print/PDF-friendly final portfolio

## Implemented — first-class operation
- [x] anonymous Jobfit code
- [x] INJE2026 automatic institution/full-roadmap configuration
- [x] course setup collapsed for preset learners
- [x] seven-step learner journey strip
- [x] minimum profile + current preparation baseline
- [x] AI-use baseline + My AI Career Rule
- [x] AI LAB 00 Career Check-in
- [x] Career Start save
- [x] local automatic persistence
- [x] JSON backup export
- [x] JSON backup restore/import
- [x] course preset reapplied after backup import
- [x] first-class backup button inside STEP 0
- [x] Week 1 lesson plan aligned with current STEP 0

## Implemented — PRE / POST measurement preparation
### Primary
- [x] Work24 구직준비도검사 external official-test workflow
- [x] PRE / POST exam date
- [x] nine Work24 result score fields
- [x] Work24 scores included in Research Core allowlist

### Secondary
- [x] Career Adapt-Abilities Short Form 12-item slot
- [x] Concern / Control / Curiosity / Confidence + overall mean
- [x] provisional Korean wording visible with explicit provisional-version label
- [x] wording version retained in saved data

### Exploratory / mechanism
- [x] Strength Use / Deficit Correction student 5+5 slot
- [x] provisional 0–6 response structure
- [x] provisional Korean learning-context wording visible with explicit version label
- [x] wording version retained in saved data

### Measurement placement
- [x] PRE at STEP 0
- [x] POST at STEP 13
- [x] same local anonymous learner state
- [x] same JSON backup includes PRE/POST data

## Research safeguards
- [x] Research Core is an allowlist, not learner-state copy
- [x] central research submission disabled by default
- [x] Raw Voice / resume / cover letter / interview raw text excluded from default Research Core
- [x] provisional scale wording is version-tagged
- [x] provisional scales are not labelled as final validated Korean versions in research schema
- [ ] receive K-CAAS-SF Korean validator/author response
- [ ] receive Korean Strength Use/Deficit Correction validator/author response
- [ ] replace provisional wording/scoring if official Korean version conditions require it
- [ ] select institution-approved central backend
- [ ] finalize consent/IRB process before central research collection

## Automated quality checks
- [x] JavaScript syntax check
- [x] required module / STEP 0–13 presence
- [x] research-network guard
- [x] INJE2026 full-roadmap lock
- [x] anonymous code creation / reload persistence
- [x] forced S/L assessment
- [x] STEP 0–13 module load
- [x] seeded semester → final portfolio integration
- [x] mobile-width core navigation
- [x] Job→Industry→Company relationship integrity
- [x] invalid FIT combination rejection
- [x] Application Gate / Critical GAP / Final Ready rules
- [x] JSON backup restore test
- [x] Work24 PRE/POST result storage test
- [x] CAAS/SUDCO PRE/POST save and score test
- [x] latest post-measurement browser regression suite green

## Highest priority before first class
- [ ] manual Android Chrome pass on production URL
- [ ] manual iPhone Safari pass on production URL
- [ ] verify production QR and `?course=INJE2026` classroom link
- [ ] confirm Work24 student login/access flow in the actual classroom network
- [ ] test one complete student path: code → profile → baseline → AI LAB 00 → Work24 9 scores → 12 + 10 measures → save → JSON backup

## Current deployment rule
Jobfit v2 is live on `main`. Continue improving production UX while keeping central research submission disabled until the research-governance track is ready.

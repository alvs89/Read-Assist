# ReadAssist Expert System Audit Report

## Scope
This audit compares the current ReadAssist implementation with the requirements implied by the ReadAssist Concept Proposal and the Phil-IRI Manual 2018. The review is limited to Grades 3 to 6 only. The focus is on GST screening, starting-passage logic, oral reading scoring, reading-level classification, miscues, interventions, assessment flow, reporting, and dataset integration.

## Executive Summary
The system is a solid rule-based prototype, but it is not yet a full Phil-IRI digital implementation. The strongest parts are the GST gate, the oral-reading scoring engine, the 97/80 and 90/59 profile bands, the miscue tracker, the basic intervention mapping, and the now-expanded A/B passage sets for Grades 3 to 6. The largest remaining gaps are the absence of silent-reading and listening-comprehension branches, the lack of full Phil-IRI form/report workflows, and the fact that the current validation datasets are synthetic and partly generated from the same rules the system is trying to validate.

Manual anchors used in this audit include the GST cutoff and passage-start rules [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L261), the passage-start and profile bands [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L589), the oral-reading profile table [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L1095), and the optional listening/silent branches plus Appendix H guidance [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L614).

---

## Implementation Checklist

### Core Phil-IRI Screening Logic
- ✅ GST cutoff at 14 is implemented in the roster flow and determines exemption vs intervention in [src/App.tsx](src/App.tsx#L24).
- ✅ Students with GST 14 and above are marked Exempted; below 14 are routed for intervention in [src/App.tsx](src/App.tsx#L24).
- ⚠️ Starting passage selection is implemented only as a 2- or 3-grade reduction in [src/App.tsx](src/App.tsx#L24), but the passage library does not include parallel sets or enough grade-specific variants for a fully handbook-aligned flow.
- ❌ The full Phil-IRI GST content is not implemented. The app stores only a raw GST score, not the 20-item literal/inferential/critical breakdown described in the manual.
- ❌ Phil-IRI Form 1A/1B and Form 2 style class/school reports are not generated.

### Passage Library and Placement
- ✅ Passage lookup exists in [src/components/Assessment.tsx](src/components/Assessment.tsx#L176), and the library now includes Grade 3 to 6 A/B passage sets in [src/data/knowledgeBase.ts](src/data/knowledgeBase.ts#L1).
- ⚠️ The bank now supports pre-test and post-test selection, but it still does not provide the full A-D passage matrix used by the manual.
- ⚠️ Parallel pre-test/posttest passage sets A to D are still incomplete for full handbook parity.

### Oral Reading Assessment
- ✅ Reading time is captured and converted into WPM in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L47).
- ✅ The miscue inventory includes the seven handbook miscue types: mispronunciation, omission, substitution, insertion, repetition, transposition, and reversal in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L10).
- ✅ Word-reading percentage is computed from passage words minus total miscues in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L51).
- ✅ Comprehension percentage is computed from correct answers over total questions in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L54).
- ✅ The oral-reading profile bands match the manual thresholds: Independent 97-100, Instructional 90-96, Frustration below 90 for word reading, and 80 / 59 / below for comprehension in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L57).
- ⚠️ The system classifies the final profile from one assessed passage, while the manual expects iterative passage movement to find independent, instructional, and frustration levels across passages.
- ❌ Silent reading is not implemented as a separate assessment mode.
- ❌ Listening comprehension is not implemented as a separate assessment mode for nonreaders.
- ❌ Looked Back (LB) scoring and the manual’s question-by-question correction workflow are not captured.

### Miscue and Behavior Analysis
- ✅ The UI captures counts for all seven oral-reading miscues.
- ⚠️ The handbook says dialectal variations are not errors and self-correction should not be counted. The system does not provide a self-correction control, and dialect handling is not explicit in the UI or scoring rules.
- ⚠️ The qualitative checklist is present, but it only covers four behavior flags: word-by-word reading, lacks expression, hardly audible, and disregards punctuation in [src/components/Assessment.tsx](src/components/Assessment.tsx#L322).
- ❌ The manual’s broader observation items, such as pointing to each word and employing little or no method of analysis, are missing from the data entry model.
- ⚠️ Appendix H style behavior analysis is only partially represented. The app turns behaviors into guidance text, but it does not model the full case-based decision structure from the handbook [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L1146).

### Intervention Recommendations
- ✅ The inference engine provides miscue-based intervention rules in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L99).
- ✅ The system includes rule-specific guidance for phonological deficit, comprehension deficit, and a high-speed/low-comprehension fallback in [src/lib/inferenceEngine.ts](src/lib/inferenceEngine.ts#L107).
- ⚠️ The intervention engine is useful, but it is narrower than Appendix H. The manual discusses broader instructional planning, listening-comprehension support, fluency development, phonics sequences, and case-based recommendations.
- ⚠️ Intervention text is embedded in TypeScript rather than maintained as a separate rule base or knowledge table, which makes handbook traceability harder.
- ❌ The system does not expose a distinct rule authoring layer for teachers or reviewers.

### Assessment Flow and Reports
- ✅ Pre-test and post-test states are supported in the student model and report flow.
- ✅ Growth reporting exists when both pre-test and post-test are available in [src/components/Report.tsx](src/components/Report.tsx#L677).
- ⚠️ The assessment UI allows the user to toggle pre-test/post-test manually, but the workflow is not strictly tied to Phil-IRI administration timing.
- ⚠️ Reports are strong visually, but they are not Phil-IRI form-equivalent outputs.
- ❌ There is no explicit export of the GST class report, school reading profile, or the individual summary record in the same structure as the manual forms.

### Batch Validation and Dataset Integration
- ⚠️ Batch validation exists, but it validates the system against a CSV/Excel file rather than a verified human expert gold standard in [src/components/BatchValidation.tsx](src/components/BatchValidation.tsx#L21).
- ⚠️ The validator expects 19 columns, but the current data generators are inconsistent about language support and still omit some manual concepts.
- ❌ The synthetic datasets are not a true external validation set. The `reading_level` label is generated using the same thresholds the system uses, so accuracy can be circular.
- ❌ The dataset pipeline does not yet preserve manual concepts like passage set A-D, assessment mode, looked-back responses, self-correction, or full miscues-per-passage provenance.

---

## Gap and Consistency Analysis

### 1) Passage coverage is too narrow
The manual expects comparable pre-test/posttest sets and level progression that supports the assessed student bands. The app now ships A/B passage sets per grade and language in [src/data/knowledgeBase.ts](src/data/knowledgeBase.ts#L1), which is a meaningful improvement over the original single-passage setup. What remains missing for full handbook parity is the broader A-D matrix and any deeper grade-specific alternates beyond the current Grade 3 to 6 band.

### 2) The system does not implement the full iterative Phil-IRI flow
The manual describes a process of moving up or down through passages until independent, instructional, and frustration levels are found [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L589). The current app computes one diagnosis from one selected passage and one captured score set. That is adequate for a prototype, but it is not the full handbook workflow.

### 3) Silent reading and listening comprehension are missing as real branches
The manual explicitly treats silent reading and listening comprehension as optional but important branches [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L614). The current app records only oral-reading-style data, even though the data model has enough room to grow. This is the most visible feature gap after the passage-bank problem.

### 4) The behavior checklist is incomplete
The manual’s observation checklist includes more than the four flags currently in the UI. The code captures word-by-word reading, expression, audibility, and punctuation behavior, but not the fuller observation set described in Appendix H [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L1148). This weakens the qualitative diagnosis portion.

### 5) The validation dataset is not independent
This is the most important consistency issue in the current workspace. The synthetic dataset scripts generate `reading_level` using the same thresholds implemented by the app, and the batch validator then compares the system output to that generated label. That means the validation can overstate accuracy because the label is not a separate human-expert ground truth. In other words, the current batch validation is a rule-consistency check, not a real external validation.

### 6) Intervention logic is only partially handbook-derived
The current `diagnosticRules` table is useful and readable, but it covers only a subset of the handbook’s case-based remediation content. Appendix H discusses reading behaviors, fluency support, phonics sequences, oral language, listening comprehension, and reading vocabulary development in more depth than the app currently reflects [Phil-IRI Manual 2018.txt](Phil-IRI%20Manual%202018.txt#L16226). The app should be treated as a first-pass intervention engine, not a complete handbook encoder.

### 7) Terminology in the proposal should be cleaned up
The concept proposal consistently describes a rule-based expert system, but some wording still sounds like a machine learning project. The codebase is clearly deterministic, not probabilistic. The documentation should be aligned so the project is not described as both an ML system and a rule-based expert system at the same time.

---

## Actionable Improvements

### P0 - Must fix first
1. Add the remaining A-D passage alternates if you want full Phil-IRI matrix coverage.
2. Add separate silent-reading and listening-comprehension assessment modes, including the nonreader branch.
3. Replace the synthetic-only validation approach with a real expert-labeled dataset and keep synthetic data only for stress testing.

### P1 - Strongly recommended
1. Convert the intervention rules into a more explicit rule table so handbook traceability is clearer.
2. Add full qualitative observations, including self-correction handling, looked-back responses, and the remaining handbook behaviors.
3. Add Phil-IRI-style report exports for GST class reading reports, school reading profile, and individual summary records.
4. Store language, assessment mode, passage set, and source-of-label metadata in every dataset row.

### P2 - Quality and maintainability
1. Split the synthetic dataset generators from the evaluation datasets so there is no confusion about gold labels.
2. Add per-language and per-grade validation summaries instead of one pooled accuracy score.
3. Add versioning for the manual rule set so future handbook updates can be traced.

---

## Dataset Integration Guide

### Recommended canonical row schema
A practical dataset row should include:
- student_id
- grade_level
- language
- assessment_mode: GST, oral_reading, silent_reading, listening_comprehension
- gst_raw_score
- passage_set: A, B, C, or D
- assigned_passage_grade
- total_words_of_passage
- time_in_seconds
- words_per_minute
- correct_comprehension_answers
- total_comprehension_questions
- word_reading_score
- comprehension_score
- all seven miscue counts
- behavior flags
- system_label
- human_label
- label_source
- manual_version

### Recommended pipeline
1. Use institutional Phil-IRI records as the primary labeled dataset.
2. Keep synthetic records in a separate folder and label them as synthetic so they cannot be mistaken for expert truth.
3. Split train/validation/test by student, not by row, to avoid leakage across pre-test and post-test records.
4. Record the handbook version and reviewer identity for every gold label.
5. Report metrics by language, grade, passage set, and assessment mode.

### Current generator support
The generator scripts now emit `language`, `assessment_type`, and `passage_set` fields so validation rows can be aligned with the updated passage model.

### Validation note
If the goal is to measure alignment with the Phil-IRI manual, the validator should compare system output to human expert labels, not to labels synthesized from the same rule logic. Otherwise the reported accuracy measures internal consistency, not real-world correctness.

---

## Bottom Line
ReadAssist already implements the core expert-system idea correctly, but it is currently a partial Phil-IRI digital assistant, not a full handbook-aligned engine. The strongest next step is to fix passage coverage and dataset validity first, then add the missing listening/silent branches and full handbook-based reporting. Those changes will move the system from a good prototype to a defensible Phil-IRI implementation.

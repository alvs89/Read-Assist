const XLSX = require('xlsx');
const fs = require('fs');

// Match the workbook layout used by the app's batch validator.
const passages = [
  { gradeLevel: 3, language: 'English', passageSet: 'A', wordCount: 57 },
  { gradeLevel: 3, language: 'English', passageSet: 'B', wordCount: 58 },
  { gradeLevel: 4, language: 'English', passageSet: 'A', wordCount: 67 },
  { gradeLevel: 4, language: 'English', passageSet: 'B', wordCount: 68 },
  { gradeLevel: 5, language: 'English', passageSet: 'A', wordCount: 101 },
  { gradeLevel: 5, language: 'English', passageSet: 'B', wordCount: 103 },
  { gradeLevel: 6, language: 'English', passageSet: 'A', wordCount: 130 },
  { gradeLevel: 6, language: 'English', passageSet: 'B', wordCount: 132 },
  { gradeLevel: 3, language: 'Filipino', passageSet: 'A', wordCount: 57 },
  { gradeLevel: 3, language: 'Filipino', passageSet: 'B', wordCount: 58 },
  { gradeLevel: 4, language: 'Filipino', passageSet: 'A', wordCount: 67 },
  { gradeLevel: 4, language: 'Filipino', passageSet: 'B', wordCount: 68 },
  { gradeLevel: 5, language: 'Filipino', passageSet: 'A', wordCount: 101 },
  { gradeLevel: 5, language: 'Filipino', passageSet: 'B', wordCount: 103 },
  { gradeLevel: 6, language: 'Filipino', passageSet: 'A', wordCount: 130 },
  { gradeLevel: 6, language: 'Filipino', passageSet: 'B', wordCount: 132 }
];

const numRows = 750;
const data = [];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

for (let i = 1; i <= numRows; i++) {
  const student_id = `STUD_${String(i).padStart(4, '0')}`;

  let grade_level;
  if (i <= 187) grade_level = 3;
  else if (i <= 375) grade_level = 4;
  else if (i <= 562) grade_level = 5;
  else grade_level = 6;

  const minAge = grade_level + 5;
  const age = randInt(minAge, Math.min(15, minAge + 4));
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const language = Math.random() > 0.5 ? 'English' : 'Filipino';
  // Alternate rows so the export contains both assessment modes.
  const assessment_type = i % 2 === 0 ? 'Post-test' : 'Pre-test';
  const passage_set = assessment_type === 'Pre-test' ? 'A' : 'B';

  let gst_score = randInt(0, 20);
  if (i === 10) gst_score = 0;
  if (i === 20) gst_score = 20;

  let assigned_passage_grade;
  if (gst_score >= 14) {
    assigned_passage_grade = grade_level;
  } else {
    assigned_passage_grade = Math.max(1, grade_level - randInt(2, 3));
  }

  const passage = passages.find(p => p.gradeLevel === assigned_passage_grade && p.language === language && p.passageSet === passage_set)
    || passages.find(p => p.gradeLevel === assigned_passage_grade && p.language === language)
    || passages.find(p => p.language === language)
    || passages[0];

  const total_words_of_passage = passage.wordCount;

  // Spread the records across the three reading-level outcomes used by the rule engine.
  let targetProfileRnd = Math.random();
  let targetProfile;
  if (grade_level === 3 || grade_level === 4) {
    if (targetProfileRnd < 0.5) targetProfile = 'Frustration';
    else if (targetProfileRnd < 0.8) targetProfile = 'Instructional';
    else targetProfile = 'Independent';
  } else {
    if (targetProfileRnd < 0.3) targetProfile = 'Frustration';
    else if (targetProfileRnd < 0.7) targetProfile = 'Instructional';
    else targetProfile = 'Independent';
  }

  // A few fixed rows help validate that the generated workbook still hits edge cases.
  if (i === 30) targetProfile = 'Independent';
  if (i === 40) targetProfile = 'Frustration';

  let comprehension_score;
  if (targetProfile === 'Independent') comprehension_score = randInt(80, 100);
  else if (targetProfile === 'Instructional') comprehension_score = randInt(59, 79);
  else comprehension_score = randInt(0, 58);

  let target_wr;
  if (targetProfile === 'Independent') target_wr = randInt(97, 100);
  else if (targetProfile === 'Instructional') target_wr = randInt(90, 96);
  else target_wr = randInt(50, 89);

  if (i === 30) target_wr = 100;

  let total_miscues = Math.round(total_words_of_passage - (target_wr / 100 * total_words_of_passage));
  if (total_miscues < 0) total_miscues = 0;
  if (i === 30) total_miscues = 0;

  let mispronunciation_count = 0, omission_count = 0, substitution_count = 0, insertion_count = 0, repetition_count = 0;
  let remaining_miscues = total_miscues;

  while (remaining_miscues > 0) {
    const type = randInt(1, 5);
    if (type === 1) mispronunciation_count++;
    else if (type === 2) omission_count++;
    else if (type === 3) substitution_count++;
    else if (type === 4) insertion_count++;
    else repetition_count++;
    remaining_miscues--;
  }

  const actual_total_miscues = mispronunciation_count + omission_count + substitution_count + insertion_count + repetition_count;
  const word_recognition_rate = Math.round(((total_words_of_passage - actual_total_miscues) / total_words_of_passage) * 100);

  let wordProfile, compProfile;
  if (word_recognition_rate >= 97) wordProfile = 3;
  else if (word_recognition_rate >= 90) wordProfile = 2;
  else wordProfile = 1;

  if (comprehension_score >= 80) compProfile = 3;
  else if (comprehension_score >= 59) compProfile = 2;
  else compProfile = 1;

  const overallScore = Math.min(wordProfile, compProfile);
  let reading_level;
  if (overallScore === 3) reading_level = 'Independent';
  else if (overallScore === 2) reading_level = 'Instructional';
  else reading_level = 'Frustration';

  let words_per_minute;
  if (reading_level === 'Frustration') words_per_minute = randInt(35, 85);
  else if (reading_level === 'Instructional') words_per_minute = randInt(60, 120);
  else words_per_minute = randInt(80, 160);

  const year = randInt(2025, 2026);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  const session_date = `${year}-${month}-${day}`;
  const session_start_hour = randInt(7, 14);
  const session_duration_min = randInt(5, 25);

  data.push({
    student_id,
    grade_level,
    age,
    gender,
    language,
    gst_score,
    word_recognition_rate,
    comprehension_score,
    mispronunciation_count,
    omission_count,
    substitution_count,
    insertion_count,
    repetition_count,
    reading_level,
    assigned_passage_grade,
    total_words_of_passage,
    session_date,
    session_start_hour,
    session_duration_min,
    words_per_minute,
    assessment_type,
    passage_set
  });
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'readassist_test_dataset_v3');
XLSX.writeFile(wb, 'readassist_test_dataset_v3.xlsx');
console.log('Excel dataset generated successfully!');

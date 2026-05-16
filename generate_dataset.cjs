const fs = require('fs');

// This generator mirrors the app's passage lookup rules so the synthetic dataset stays realistic.
const passages = [
  { gradeLevel: 3, language: 'English', passageSet: 'A', wordCount: 57, questionCount: 6 },
  { gradeLevel: 3, language: 'English', passageSet: 'B', wordCount: 58, questionCount: 6 },
  { gradeLevel: 4, language: 'English', passageSet: 'A', wordCount: 67, questionCount: 6 },
  { gradeLevel: 4, language: 'English', passageSet: 'B', wordCount: 68, questionCount: 6 },
  { gradeLevel: 5, language: 'English', passageSet: 'A', wordCount: 101, questionCount: 7 },
  { gradeLevel: 5, language: 'English', passageSet: 'B', wordCount: 103, questionCount: 7 },
  { gradeLevel: 6, language: 'English', passageSet: 'A', wordCount: 130, questionCount: 8 },
  { gradeLevel: 6, language: 'English', passageSet: 'B', wordCount: 132, questionCount: 8 },
  { gradeLevel: 3, language: 'Filipino', passageSet: 'A', wordCount: 57, questionCount: 6 },
  { gradeLevel: 3, language: 'Filipino', passageSet: 'B', wordCount: 58, questionCount: 6 },
  { gradeLevel: 4, language: 'Filipino', passageSet: 'A', wordCount: 67, questionCount: 6 },
  { gradeLevel: 4, language: 'Filipino', passageSet: 'B', wordCount: 68, questionCount: 6 },
  { gradeLevel: 5, language: 'Filipino', passageSet: 'A', wordCount: 101, questionCount: 7 },
  { gradeLevel: 5, language: 'Filipino', passageSet: 'B', wordCount: 103, questionCount: 7 },
  { gradeLevel: 6, language: 'Filipino', passageSet: 'A', wordCount: 130, questionCount: 8 },
  { gradeLevel: 6, language: 'Filipino', passageSet: 'B', wordCount: 132, questionCount: 8 }
];

function generateData(numRows) {
  const headers = [
    'student_id', 'grade_level', 'age', 'gender', 'language', 'gst_score', 
    'word_recognition_rate', 'comprehension_score', 'mispronunciation_count', 
    'omission_count', 'substitution_count', 'insertion_count', 'repetition_count', 
    'reading_level', 'assigned_passage_grade', 'total_words_of_passage', 
    'session_date', 'session_start_hour', 'session_duration_min', 'words_per_minute',
    'assessment_type', 'passage_set'
  ];

  let csvContent = headers.join(',') + '\n';

  for (let i = 1; i <= numRows; i++) {
    const student_id = `S${String(i).padStart(3, '0')}`;
    const grade_level = Math.floor(Math.random() * 4) + 3; // 3 to 6
    const age = grade_level + 5;
    const gender = Math.random() > 0.5 ? 'M' : 'F';
    const language = Math.random() > 0.5 ? 'English' : 'Filipino';
    const gst_score = Math.floor(Math.random() * 21); // 0 to 20
    // Alternate pre/post rows so downstream validation always sees both assessment modes.
    const assessment_type = i % 2 === 0 ? 'Post-test' : 'Pre-test';
    const passage_set = assessment_type === 'Pre-test' ? 'A' : 'B';
    
    const assigned_passage_grade = grade_level;
    const passage = passages.find(p => p.gradeLevel === assigned_passage_grade && p.language === language && p.passageSet === passage_set)
      || passages.find(p => p.gradeLevel === assigned_passage_grade && p.language === language)
      || passages.find(p => p.language === language)
      || passages[0];
    const total_words_of_passage = passage.wordCount;
    const totalQuizQuestions = passage.questionCount;

    // Randomize miscues while keeping the counts low enough to resemble classroom assessment data.
    const mispronunciation_count = Math.floor(Math.random() * 4);
    const omission_count = Math.floor(Math.random() * 3);
    const substitution_count = Math.floor(Math.random() * 3);
    const insertion_count = Math.floor(Math.random() * 2);
    const repetition_count = Math.floor(Math.random() * 2);
    
    const totalMiscues = mispronunciation_count + omission_count + substitution_count + insertion_count + repetition_count;
    
    // Word score is derived from the passage length minus all miscues.
    const word_recognition_rate = Math.round(((total_words_of_passage - totalMiscues) / total_words_of_passage) * 100);
    
    // Comprehension stays bounded by the passage question count.
    const comprehension_score = Math.floor(Math.random() * (totalQuizQuestions + 1)); // 0 to max questions
    const compScorePct = Math.round((comprehension_score / totalQuizQuestions) * 100);

    // Profiles follow the same thresholds as the rule engine in the app.
    let wordProfile;
    if (word_recognition_rate >= 97) wordProfile = 'Independent';
    else if (word_recognition_rate >= 90) wordProfile = 'Instructional';
    else wordProfile = 'Frustration';

    let compProfile;
    if (compScorePct >= 80) compProfile = 'Independent';
    else if (compScorePct >= 59) compProfile = 'Instructional';
    else compProfile = 'Frustration';

    const profileScores = { 'Frustration': 1, 'Instructional': 2, 'Independent': 3 };
    const profilesByScore = { 1: 'Frustration', 2: 'Instructional', 3: 'Independent' };
    
    const overallScore = Math.min(profileScores[wordProfile], profileScores[compProfile]);
    const reading_level = profilesByScore[overallScore];

    const session_date = '2024-01-15';
    const session_start_hour = '09:00';
    const session_duration_min = Math.floor(Math.random() * 4) + 1; // 1 to 4 mins
    const timeInSeconds = session_duration_min * 60;
    const words_per_minute = Math.round((total_words_of_passage / timeInSeconds) * 60);

    const row = [
      student_id, grade_level, age, gender, language, gst_score,
      word_recognition_rate, comprehension_score, mispronunciation_count,
      omission_count, substitution_count, insertion_count, repetition_count,
      reading_level, assigned_passage_grade, total_words_of_passage,
      session_date, session_start_hour, session_duration_min, words_per_minute,
      assessment_type, passage_set
    ];

    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync('dataset_750.csv', csvContent);
  console.log('Dataset generated successfully!');
}

generateData(750);

export type PassageLanguage = 'English' | 'Filipino';
export type PassageSet = 'A' | 'B' | 'C' | 'D';
export type PassageAssessmentType = 'Pre-test' | 'Post-test';

export interface Passage {
  gradeLevel: number;
  language: PassageLanguage;
  assessmentType: PassageAssessmentType;
  passageSet: PassageSet;
  title: string;
  wordCount: number;
  questionCount: number;
}

interface PassageRow {
  gradeLevel: number;
  titles: Record<PassageSet, string>;
  wordCounts: Record<PassageSet, number>;
  questionCount: number;
}

const questionCountByGrade: Record<number, number> = {
  3: 6,
  4: 6,
  5: 7,
  6: 8,
};

function expandPassages(
  language: PassageLanguage,
  assessmentType: PassageAssessmentType,
  rows: PassageRow[]
): Passage[] {
  // Each handbook row expands to the four passage sets used by the app and batch validator.
  return rows.flatMap(row => (['A', 'B', 'C', 'D'] as PassageSet[]).map(passageSet => ({
    gradeLevel: row.gradeLevel,
    language,
    assessmentType,
    passageSet,
    title: row.titles[passageSet],
    wordCount: row.wordCounts[passageSet],
    questionCount: row.questionCount,
  })));
}

const englishPreTestRows: PassageRow[] = [
  {
    gradeLevel: 3,
    titles: {
      A: 'Summer Fun',
      B: 'A Rainy Day',
      C: "Ben's Store",
      D: 'Waiting for Her Sister',
    },
    wordCounts: {
      A: 57,
      B: 66,
      C: 58,
      D: 58,
    },
    questionCount: questionCountByGrade[3],
  },
  {
    gradeLevel: 4,
    titles: {
      A: 'Get Up, Jacky!',
      B: 'Waiting for the Peddler',
      C: "Anansi's Web",
      D: 'Wake Up!',
    },
    wordCounts: {
      A: 67,
      B: 68,
      C: 86,
      D: 60,
    },
    questionCount: questionCountByGrade[4],
  },
  {
    gradeLevel: 5,
    titles: {
      A: "Frog's Lunch",
      B: 'The Cow and the Carabao',
      C: "Pedrito's Snack",
      D: "Amy's Good Deed",
    },
    wordCounts: {
      A: 101,
      B: 103,
      C: 144,
      D: 106,
    },
    questionCount: questionCountByGrade[5],
  },
  {
    gradeLevel: 6,
    titles: {
      A: 'Yawning',
      B: 'Laughter',
      C: 'Effects of Anger',
      D: 'Dreams',
    },
    wordCounts: {
      A: 130,
      B: 132,
      C: 141,
      D: 143,
    },
    questionCount: questionCountByGrade[6],
  },
];

const englishPostTestRows: PassageRow[] = [
  {
    gradeLevel: 3,
    titles: {
      A: 'The Egg on the Grass',
      B: 'The Caps and the Kittens',
      C: 'A Happy Place',
      D: 'In the Park',
    },
    wordCounts: {
      A: 57,
      B: 58,
      C: 55,
      D: 66,
    },
    questionCount: questionCountByGrade[3],
  },
  {
    gradeLevel: 4,
    titles: {
      A: 'The Tricycle Man',
      B: 'Cat and Mouse',
      C: "Marian's Experiment",
      D: 'On Market Day',
    },
    wordCounts: {
      A: 67,
      B: 68,
      C: 43,
      D: 60,
    },
    questionCount: questionCountByGrade[4],
  },
  {
    gradeLevel: 5,
    titles: {
      A: 'The Snail with the Biggest House',
      B: 'The Great Runner',
      C: 'Trading Places',
      D: 'The Legend of the Firefly',
    },
    wordCounts: {
      A: 101,
      B: 103,
      C: 99,
      D: 143,
    },
    questionCount: questionCountByGrade[5],
  },
  {
    gradeLevel: 6,
    titles: {
      A: 'Rocks from Outer Space',
      B: 'Beetles',
      C: 'Just How Fast',
      D: 'Flying Rocks',
    },
    wordCounts: {
      A: 130,
      B: 132,
      C: 143,
      D: 141,
    },
    questionCount: questionCountByGrade[6],
  },
];

const filipinoPreTestRows: PassageRow[] = [
  {
    gradeLevel: 3,
    titles: {
      A: 'Magpalipad Tayo ng Saranggola',
      B: 'Maliit na Duhat, Malaking Pakwan',
      C: 'Ang Matalinong Bulate',
      D: 'Laruang Dyip',
    },
    wordCounts: {
      A: 57,
      B: 91,
      C: 58,
      D: 137,
    },
    questionCount: questionCountByGrade[3],
  },
  {
    gradeLevel: 4,
    titles: {
      A: 'Isang Pangarap',
      B: 'Parol sa may Bintana',
      C: 'Bakasyon ni Heber',
      D: 'Galing sa Japan',
    },
    wordCounts: {
      A: 67,
      B: 130,
      C: 138,
      D: 134,
    },
    questionCount: questionCountByGrade[4],
  },
  {
    gradeLevel: 5,
    titles: {
      A: 'Tagtuyot Hatid ng El Nino',
      B: 'Pista ng Bulaklak',
      C: 'Biyaya ng Bulkan',
      D: 'Ama ng Wikang Pambansa',
    },
    wordCounts: {
      A: 101,
      B: 169,
      C: 132,
      D: 167,
    },
    questionCount: questionCountByGrade[5],
  },
  {
    gradeLevel: 6,
    titles: {
      A: 'Buhayin ang Kabundukan',
      B: 'Ang Puerto Princesa Underground River',
      C: 'Kalabanin ang Dengue',
      D: 'Puno pa rin ng Buhay',
    },
    wordCounts: {
      A: 130,
      B: 132,
      C: 202,
      D: 143,
    },
    questionCount: questionCountByGrade[6],
  },
];

const filipinoPostTestRows: PassageRow[] = [
  {
    gradeLevel: 3,
    titles: {
      A: 'Magtulungan Tayo',
      B: 'Sabado na naman',
      C: 'Si Paruparo at Si Alitaptap',
      D: 'Ang Asong Gubat',
    },
    wordCounts: {
      A: 57,
      B: 58,
      C: 90,
      D: 86,
    },
    questionCount: questionCountByGrade[3],
  },
  {
    gradeLevel: 4,
    titles: {
      A: 'Bote Dyaryo',
      B: 'Kay Daming Gawain',
      C: 'Pahiyas Festival',
      D: 'Ang Kakaibang Mundo',
    },
    wordCounts: {
      A: 67,
      B: 130,
      C: 132,
      D: 138,
    },
    questionCount: questionCountByGrade[4],
  },
  {
    gradeLevel: 5,
    titles: {
      A: 'Kapaligiran',
      B: 'May Magagawa ba sa Isang Tambak na Basura?',
      C: 'Pagpapa-unlad ng Kultura',
      D: 'Eid-ul-Fitr',
    },
    wordCounts: {
      A: 101,
      B: 169,
      C: 103,
      D: 169,
    },
    questionCount: questionCountByGrade[5],
  },
  {
    gradeLevel: 6,
    titles: {
      A: 'Si Jose Rizal sa Dapitan',
      B: 'Mga Makabagong Bayani',
      C: 'Alamin ang Iyong Karapatan',
      D: 'Populasyon',
    },
    wordCounts: {
      A: 130,
      B: 132,
      C: 202,
      D: 143,
    },
    questionCount: questionCountByGrade[6],
  },
];

export const passages: Passage[] = [
  ...expandPassages('English', 'Pre-test', englishPreTestRows),
  ...expandPassages('English', 'Post-test', englishPostTestRows),
  ...expandPassages('Filipino', 'Pre-test', filipinoPreTestRows),
  ...expandPassages('Filipino', 'Post-test', filipinoPostTestRows),
];

// Pre-tests fall back to Set A and post-tests fall back to Set B when imports omit passage_set.
const assessmentSetByType: Record<PassageAssessmentType, PassageSet> = {
  'Pre-test': 'A',
  'Post-test': 'B',
};

export function getPassageForAssessment(
  gradeLevel: number,
  language: PassageLanguage,
  assessmentType: PassageAssessmentType,
  passageSet?: PassageSet
) {
  // Search from the most specific match down to the broadest fallback so legacy rows still resolve.
  const preferredSet = passageSet ?? assessmentSetByType[assessmentType];

  return (
    passages.find(
      passage =>
        passage.gradeLevel === gradeLevel &&
        passage.language === language &&
        passage.assessmentType === assessmentType &&
        passage.passageSet === preferredSet
    ) ||
    passages.find(
      passage =>
        passage.gradeLevel === gradeLevel &&
        passage.language === language &&
        passage.assessmentType === assessmentType
    ) ||
    passages.find(
      passage =>
        passage.gradeLevel === gradeLevel &&
        passage.language === language
    ) ||
    passages.find(passage => passage.language === language) ||
    passages[0]
  );
}

export const diagnosticRules = {
  Mispronunciation: { 
    rootCause: "Regional interference or reading English words phonetically", 
    intervention: "Emphasize correct pronunciation and provide extra instruction in reading English words.",
    detailedGuidance: "According to the Phil-IRI 2018 Manual, mispronunciation often stems from regional language interference or phonetic confusion.\n\nTEACHER-LED STRATEGIES:\n• Explicit Phonemic Instruction: Teach the specific differences between the student's mother tongue sounds and English phonemes.\n• Minimal Pair Drills: Practice contrasting word pairs (e.g., bit/beat, pat/fat) to train auditory discrimination.\n\nGUIDED PRACTICE:\n• Echo Reading: Model the correct pronunciation of difficult words or phrases, having the student repeat immediately.\n• Choral Reading: Read aloud together to build confidence and rhythm.\n\nINDEPENDENT & HOME SUPPORT:\n• Sight Word Flashcards: Create a personal deck of frequently mispronounced words for daily review.\n• Audio-Assisted Reading: Encourage listening to recorded stories while following along with the text."
  },
  Omission: { 
    rootCause: "Reading too fast or inability to decode the word", 
    intervention: "Advise the reader to slow down and use a line marker.",
    detailedGuidance: "The Phil-IRI 2018 Manual states that omission occurs when a reader reads too fast or lacks the decoding skills for specific words.\n\nTEACHER-LED STRATEGIES:\n• Pacing Techniques: Explicitly teach the student to slow down. Use a line marker, reading window, or finger-pointing to track text.\n• Phonics Review: Identify the specific syllable types or phonics patterns the student is omitting and provide targeted decoding practice.\n\nGUIDED PRACTICE:\n• Stop-and-Think: Pause the student when an omission occurs and ask, 'Did that make sense?' to build self-monitoring skills.\n• Choral Reading: Read together at a measured, deliberate pace to establish a steady reading rhythm.\n\nINDEPENDENT & HOME SUPPORT:\n• Tracking Tools: Provide a physical bookmark or reading ruler for the student to use during independent reading.\n• Repeated Reading: Have the student read a short, familiar passage multiple times to build accuracy before focusing on speed."
  },
  Substitution: { 
    rootCause: "Guessing based on graphic similarity or context", 
    intervention: "Encourage careful attention to word details and avoid guessing.",
    detailedGuidance: "Substitution happens when a reader guesses a word based on graphic similarity (e.g., 'house' for 'horse') or context, often due to weak decoding skills.\n\nTEACHER-LED STRATEGIES:\n• Visual Discrimination: Train the student to look closely at the middle and end of words, not just the initial letter.\n• Word Analysis: Break commonly substituted words into syllables or phonemes on the board.\n\nGUIDED PRACTICE:\n• Meaning vs. Visual Cues: When a substitution occurs, ask: 'Does that look right?' (visual) and 'Does that make sense?' (meaning).\n• Cloze Exercises: Provide sentences with missing words to help the student practice using context clues accurately without guessing wildly.\n\nINDEPENDENT & HOME SUPPORT:\n• Word Sorts: Have the student sort words with similar spelling patterns to improve visual recognition.\n• Slower Reading Pace: Encourage the student to read aloud to a parent or peer, focusing on reading exactly what is on the page."
  },
  Insertion: { 
    rootCause: "Reading too fast and anticipating words", 
    intervention: "Call the reader's attention to look carefully at the text.",
    detailedGuidance: "Insertion results when a pupil reads too fast and anticipates words that are not actually part of the text, often inserting articles or prepositions.\n\nTEACHER-LED STRATEGIES:\n• Text Tracking: Require the use of a finger or pointer to establish a 1-to-1 correspondence between spoken and written words.\n• Pacing Awareness: Discuss the importance of reading exactly what the author wrote, rather than rushing to finish.\n\nGUIDED PRACTICE:\n• Partner Reading: Pair the student with a peer who can gently tap the desk when an extra word is inserted.\n• Echo Reading: Model a precise, unhurried reading pace for the student to mimic.\n\nINDEPENDENT & HOME SUPPORT:\n• Audio Recording: Have the student record themselves reading and listen back to catch their own insertions.\n• Reading Rulers: Use a slotted reading ruler to isolate one line of text at a time, reducing visual distraction and anticipation."
  },
  Repetition: { 
    rootCause: "Needing time to recognize the next word or fully understand the text", 
    intervention: "Provide word recognition and fluency support.",
    detailedGuidance: "A reader repeats words or phrases to give themselves time to decode the next difficult word, or to process the meaning of the text.\n\nTEACHER-LED STRATEGIES:\n• Root Cause Analysis: Determine if the repetition is due to a decoding bottleneck (word recognition) or a comprehension delay.\n• Pre-teaching Vocabulary: Introduce difficult or unfamiliar words before reading the passage to reduce stumbling blocks.\n\nGUIDED PRACTICE:\n• Phrase-Cued Text: Provide text marked with slash marks (/) to show natural phrasing and pausing points, reducing the need to loop back.\n• Reader's Theater: Practice reading scripts to build smooth, expressive fluency without repetitions.\n\nINDEPENDENT & HOME SUPPORT:\n• Repeated Reading: Build confidence by having the student read the same passage 3-4 times until it flows smoothly.\n• Easy Reading Materials: Provide independent reading books at a slightly lower level to build a habit of continuous, forward-moving reading."
  },
  Transposition: { 
    rootCause: "Recognizing a familiar word at the end of a sentence first", 
    intervention: "Ask the reader to reread the sentence or word.",
    detailedGuidance: "Transposition occurs when the order of words is reversed. The Phil-IRI Manual suggests this may indicate a fundamental problem with word recognition or visual tracking.\n\nTEACHER-LED STRATEGIES:\n• Directionality Training: Reinforce left-to-right reading motion using a sweeping hand gesture or pointer.\n• Sentence Unscrambling: Provide cut-up sentences and have the student physically arrange the words in the correct order.\n\nGUIDED PRACTICE:\n• Immediate Correction: Ask the reader to stop and reread the specific sentence or phrase as soon as a transposition occurs.\n• Point-and-Read: Have the student point to each word individually as they read it to enforce strict word order.\n\nINDEPENDENT & HOME SUPPORT:\n• Line Markers: Use a blank index card under the line being read to keep the eyes focused.\n• Copywork: Have the student copy short sentences by hand to reinforce the exact sequence of words."
  },
  Reversal: { 
    rootCause: "Confusion with letter or word order (e.g., saw/was)", 
    intervention: "Ask the reader to reread the sentence or word.",
    detailedGuidance: "Reversal is common when a reader confuses letter order (e.g., 'saw' as 'was', 'on' as 'no'), often substituting a more familiar word.\n\nTEACHER-LED STRATEGIES:\n• Visual Discrimination Drills: Practice distinguishing commonly reversed words using flashcards or highlighting the first letter.\n• Tactile Tracing: Have the student trace the letters of frequently reversed words in sand or on a textured surface while saying the sounds left-to-right.\n\nGUIDED PRACTICE:\n• Stop and Reread: Prompt the student to pause and look at the very first letter of the word when a reversal happens.\n• Phonics Decoding: Force the student to sound out the word phoneme by phoneme rather than recognizing it as a whole shape.\n\nINDEPENDENT & HOME SUPPORT:\n• Color-Coded Cues: Put a green dot at the beginning of commonly reversed words to signal where to start reading.\n• Word Building: Use magnetic letters to build and take apart words, emphasizing the left-to-right sequence."
  }
};

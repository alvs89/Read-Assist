import { diagnosticRules } from '../data/knowledgeBase';
import type { PassageSet } from '../data/knowledgeBase';

type ReadingProfile = 'Independent' | 'Instructional' | 'Frustration';
type DecisionKind = 'Comprehension Deficit' | 'Miscue Analysis';

interface InferenceFacts extends AssessmentData {
  wpm?: number;
  wordScore?: number;
  compScore?: number;
  totalMiscues?: number;
  wordProfile?: ReadingProfile;
  compProfile?: ReadingProfile;
  profile?: ReadingProfile;
  highestMiscues: string[];
  highestMiscueLabel: string;
  primaryDecision?: DecisionKind;
  rootCause: string;
  intervention: string;
  detailedGuidance: string;
  explanation: string;
  behaviorIssues: string[];
  behaviorGuidanceAdded: boolean;
  ruleTrace: string[];
}

interface Rule {
  name: string;
  when: (facts: InferenceFacts) => boolean;
  then: (facts: InferenceFacts) => boolean;
}

const profileRank: Record<ReadingProfile, number> = {
  Frustration: 1,
  Instructional: 2,
  Independent: 3,
};

const defaultRootCause = 'N/A';
const defaultIntervention = 'General reading practice.';
const defaultGuidance = 'Continue providing varied reading materials to build fluency and comprehension.';

function formatMiscueLabel(miscues: string[], count: number) {
  if (miscues.length === 0) {
    return 'None';
  }

  const tallyWord = count === 1 ? 'tally' : 'tallies';
  return `${miscues.join(' & ')} (${count} ${tallyWord}${miscues.length > 1 ? ' each' : ''})`;
}

function addRuleTrace(facts: InferenceFacts, ruleName: string) {
  if (!facts.ruleTrace.includes(ruleName)) {
    facts.ruleTrace.push(ruleName);
  }
}

function forwardChain(initialFacts: InferenceFacts, rules: Rule[]) {
  const facts = initialFacts;
  let changed = true;
  let guard = 0;

  // Use a small guard so a bad rule cannot loop forever if it keeps re-triggering itself.
  while (changed && guard < 50) {
    changed = false;
    guard += 1;

    for (const rule of rules) {
      if (!rule.when(facts)) {
        continue;
      }

      if (rule.then(facts)) {
        addRuleTrace(facts, rule.name);
        changed = true;
      }
    }
  }

  return facts;
}

function buildBehaviorIssues(data: AssessmentData) {
  const behaviorIssues: string[] = [];
  // Behavior notes stay separate from the main miscue decision so they can be appended later.
  if (data.behaviors?.wordByWord) behaviorIssues.push('Word-by-word reading');
  if (data.behaviors?.lacksExpression) behaviorIssues.push('Lacks expression / monotonous tone');
  if (data.behaviors?.hardlyAudible) behaviorIssues.push('Voice is hardly audible');
  if (data.behaviors?.disregardsPunctuation) behaviorIssues.push('Disregards punctuation');
  return behaviorIssues;
}

function buildMiscueSummary(miscues: string[]) {
  const knownMiscues = miscues.filter(miscue => miscue in diagnosticRules) as Array<keyof typeof diagnosticRules>;

  const causes = knownMiscues.map(miscue => `${miscue}: ${diagnosticRules[miscue].rootCause}`);
  const interventions = knownMiscues.map(miscue => `${miscue}: ${diagnosticRules[miscue].intervention}`);
  const guidances = knownMiscues.map(miscue => `--- ${miscue.toUpperCase()} ---\n${diagnosticRules[miscue].detailedGuidance}`);

  return { causes, interventions, guidances };
}

function shouldAddMarungkoSupport(facts: InferenceFacts) {
  if (facts.language !== 'Filipino') {
    return false;
  }

  if (facts.primaryDecision === 'Miscue Analysis') {
    return true;
  }

  return /phonics|word recognition|decoding/i.test(`${facts.intervention} ${facts.detailedGuidance}`);
}

function appendMarungkoSupport(facts: InferenceFacts) {
  if (!shouldAddMarungkoSupport(facts)) {
    return false;
  }

  if (facts.intervention.includes('Marungko Approach') || facts.detailedGuidance.includes('Marungko Approach')) {
    return false;
  }

  const marungkoIntervention = 'Marungko Approach: Use Filipino letter-sound and syllable-pattern drills, then move from modeled to guided reading to strengthen word recognition.';
  const marungkoGuidance = 'Marungko Approach: Start with short, patterned Filipino words, then progress to phrases and sentences so the student can practice decoding in a familiar sound-symbol sequence.';

  facts.intervention = `${facts.intervention}\n${marungkoIntervention}`;
  facts.detailedGuidance = `${facts.detailedGuidance}\n\n${marungkoGuidance}`;
  return true;
}

function createRules(): Rule[] {
  return [
    // Derive numeric scores first, then classify profiles, then select the final recommendation.
    {
      name: 'Derive Reading Speed',
      when: facts => facts.wpm === undefined && facts.timeInSeconds > 0,
      then: facts => {
        const nextWpm = Math.round((facts.totalPassageWords / facts.timeInSeconds) * 60);
        if (facts.wpm === nextWpm) return false;
        facts.wpm = nextWpm;
        return true;
      },
    },
    {
      name: 'Derive Total Miscues',
      when: facts => facts.totalMiscues === undefined,
      then: facts => {
        const nextTotalMiscues = Object.values(facts.miscues).reduce((sum, count) => sum + count, 0);
        if (facts.totalMiscues === nextTotalMiscues) return false;
        facts.totalMiscues = nextTotalMiscues;
        return true;
      },
    },
    {
      name: 'Derive Word Recognition Score',
      when: facts => facts.wordScore === undefined && facts.totalPassageWords > 0 && facts.totalMiscues !== undefined,
      then: facts => {
        const nextWordScore = Math.round(((facts.totalPassageWords - (facts.totalMiscues ?? 0)) / facts.totalPassageWords) * 100);
        if (facts.wordScore === nextWordScore) return false;
        facts.wordScore = nextWordScore;
        return true;
      },
    },
    {
      name: 'Derive Comprehension Score',
      when: facts => facts.compScore === undefined && facts.totalQuizQuestions > 0,
      then: facts => {
        const nextCompScore = Math.round((facts.correctQuizAnswers / facts.totalQuizQuestions) * 100);
        if (facts.compScore === nextCompScore) return false;
        facts.compScore = nextCompScore;
        return true;
      },
    },
    {
      name: 'Classify Word Recognition Profile',
      when: facts => facts.wordScore !== undefined && facts.wordProfile === undefined,
      then: facts => {
        const nextProfile: ReadingProfile = (facts.wordScore ?? 0) >= 97
          ? 'Independent'
          : (facts.wordScore ?? 0) >= 90
            ? 'Instructional'
            : 'Frustration';

        if (facts.wordProfile === nextProfile) return false;
        facts.wordProfile = nextProfile;
        return true;
      },
    },
    {
      name: 'Classify Comprehension Profile',
      when: facts => facts.compScore !== undefined && facts.compProfile === undefined,
      then: facts => {
        const nextProfile: ReadingProfile = (facts.compScore ?? 0) >= 80
          ? 'Independent'
          : (facts.compScore ?? 0) >= 59
            ? 'Instructional'
            : 'Frustration';

        if (facts.compProfile === nextProfile) return false;
        facts.compProfile = nextProfile;
        return true;
      },
    },
    {
      name: 'Combine Reading Profiles',
      when: facts => Boolean(facts.wordProfile && facts.compProfile && facts.profile === undefined),
      then: facts => {
        const overallScore = Math.min(
          profileRank[facts.wordProfile as ReadingProfile],
          profileRank[facts.compProfile as ReadingProfile]
        );

        const nextProfile = (overallScore === 3 ? 'Independent' : overallScore === 2 ? 'Instructional' : 'Frustration') as ReadingProfile;
        if (facts.profile === nextProfile) return false;
        facts.profile = nextProfile;
        return true;
      },
    },
    {
      name: 'Compose Explanation',
      when: facts => Boolean(facts.profile && facts.wordScore !== undefined && facts.compScore !== undefined && !facts.explanation),
      then: facts => {
        const nextExplanation = `The system classified this student as ${facts.profile!.toUpperCase()} based on the Phil-IRI 2018 Manual (Table 8). Their Word Reading Score is ${facts.wordScore}% (${facts.wordProfile}) and Comprehension Score is ${facts.compScore}% (${facts.compProfile}).`;
        if (facts.explanation === nextExplanation) return false;
        facts.explanation = nextExplanation;
        return true;
      },
    },
    {
      name: 'Capture Highest Miscues',
      when: facts => facts.totalMiscues !== undefined && facts.highestMiscues.length === 0,
      then: facts => {
        const maxCount = Math.max(...Object.values(facts.miscues));
        const highestMiscues = maxCount > 0
          ? Object.entries(facts.miscues)
              .filter(([, count]) => count === maxCount)
              .map(([miscue]) => miscue)
          : [];

        const nextLabel = highestMiscues.length > 0
          ? formatMiscueLabel(highestMiscues, maxCount)
          : 'None';

        const nextHighest = JSON.stringify(highestMiscues);
        const currentHighest = JSON.stringify(facts.highestMiscues);

        let changed = false;
        if (currentHighest !== nextHighest) {
          facts.highestMiscues = highestMiscues;
          changed = true;
        }
        if (facts.highestMiscueLabel !== nextLabel) {
          facts.highestMiscueLabel = nextLabel;
          changed = true;
        }

        return changed;
      },
    },
    {
      name: 'Register Behavior Issues',
      when: facts => facts.behaviorIssues.length === 0,
      then: facts => {
        const nextBehaviorIssues = buildBehaviorIssues(facts);
        const current = JSON.stringify(facts.behaviorIssues);
        const next = JSON.stringify(nextBehaviorIssues);
        if (current === next) return false;
        facts.behaviorIssues = nextBehaviorIssues;
        return true;
      },
    },
    {
      name: 'Independent Level Note',
      when: facts => Boolean(
        facts.profile === 'Independent' &&
        facts.compProfile === 'Independent' &&
        facts.primaryDecision === undefined &&
        facts.highestMiscues.length === 0
      ),
      then: facts => {
        // Independent readers get a next-step note instead of an intervention label.
        facts.highestMiscueLabel = 'No dominant reading problem identified';
        facts.rootCause = 'No dominant reading problem identified.';
        facts.intervention = 'Provide a reading passage one grade level higher to find the Instructional level.';
        facts.detailedGuidance = 'The student has mastered this level. Challenge them with more complex texts to continue their growth.';
        return true;
      },
    },
    {
      name: 'Comprehension Deficit Decision',
      when: facts => Boolean(
        facts.primaryDecision === undefined &&
        (facts.wordProfile === 'Independent' || facts.wordProfile === 'Instructional') &&
        facts.compProfile === 'Frustration'
      ),
      then: facts => {
        // When decoding is adequate but comprehension drops, the report should pivot to meaning-making support.
        facts.primaryDecision = 'Comprehension Deficit';
        facts.highestMiscueLabel = 'Comprehension Deficit';
        facts.rootCause = 'Poor Vocabulary and Schema Activation';
        facts.intervention = "Build oral language and vocabulary first, then use listening comprehension activities and rereading of the relevant part of the text.";
        facts.detailedGuidance = "The student can decode words but struggles to understand the meaning. Before reading, pre-teach difficult vocabulary and activate background knowledge. During reading, guide the student to reread the relevant part of the text, stop at the end of a paragraph to summarize, and use listening comprehension and oral language activities to strengthen understanding.";
        return true;
      },
    },
    {
      name: 'Miscue Analysis Decision',
      when: facts => Boolean(facts.primaryDecision === undefined && facts.highestMiscues.length > 0),
      then: facts => {
        facts.primaryDecision = 'Miscue Analysis';

        const maxCount = Math.max(...Object.values(facts.miscues));
        facts.highestMiscueLabel = formatMiscueLabel(facts.highestMiscues, maxCount);

        if (facts.highestMiscues.length === 1) {
          const rule = diagnosticRules[facts.highestMiscues[0] as keyof typeof diagnosticRules];
          facts.rootCause = `${facts.highestMiscues[0]}: ${rule.rootCause}`;
          facts.intervention = rule.intervention;
          facts.detailedGuidance = `--- ${facts.highestMiscues[0].toUpperCase()} ---\n${rule.detailedGuidance}`;
          return true;
        }

        const { causes, interventions, guidances } = buildMiscueSummary(facts.highestMiscues);

        facts.rootCause = causes.join('\n');
        facts.intervention = interventions.join('\n');
        facts.detailedGuidance = [
          'The student shows more than one dominant miscue. Treat the highest-frequency miscues as the basis for intervention and address each one specifically before layering behavior support.',
          ...guidances,
        ].join('\n\n');
        return true;
      },
    },
    {
      name: 'Comprehension No-Miscue Fallback',
      when: facts => Boolean(
        facts.primaryDecision === undefined &&
        facts.compProfile === 'Frustration' &&
        facts.highestMiscues.length === 0
      ),
      then: facts => {
        facts.primaryDecision = 'Comprehension Deficit';
        facts.highestMiscueLabel = 'Comprehension Deficit';

        if (facts.wordProfile === 'Frustration') {
          facts.rootCause = 'Weak decoding and poor comprehension without a dominant miscue pattern';
          facts.intervention = 'Strengthen decoding and comprehension together with phonics review, oral reading practice, and guided rereading.';
          facts.detailedGuidance = 'The student shows both decoding and comprehension difficulty, but no single miscue dominates. Start with phonics and word recognition support, then use guided rereading and comprehension questioning to rebuild meaning-making.';
          return true;
        }

        facts.rootCause = 'Poor Vocabulary and Schema Activation';
        facts.intervention = 'Build oral language and vocabulary first, then use listening comprehension activities and rereading of the relevant part of the text.';
        facts.detailedGuidance = 'The student can decode words but struggles to understand the meaning. Before reading, pre-teach difficult vocabulary and activate background knowledge. During reading, guide the student to reread the relevant part of the text, stop at the end of a paragraph to summarize, and use listening comprehension and oral language activities to strengthen understanding.';
        return true;
      },
    },
    {
      name: 'Append Behavior Guidance',
      when: facts => facts.behaviorIssues.length > 0 && !facts.behaviorGuidanceAdded,
      then: facts => {
        // Append behavior support after the core diagnosis so it adds detail instead of replacing the rule result.
        const behaviorBlock = `\n\n--- OBSERVED BEHAVIORS ---\n${facts.behaviorIssues.join(', ')}. `;
        let appended = behaviorBlock;
        if (facts.behaviorIssues.some(issue => issue === 'Word-by-word reading' || issue === 'Lacks expression / monotonous tone')) {
          appended += 'The student shows a fluency concern. Model fluent reading, use repeated reading, and guide phrasing with short chunks of text. ';
        }
        if (facts.behaviorIssues.includes('Voice is hardly audible')) {
          appended += 'Support reading confidence by modeling an audible reading voice and practicing at a comfortable pace. ';
        }
        if (facts.behaviorIssues.includes('Disregards punctuation')) {
          appended += 'Teach the student to use punctuation marks as cues for phrasing and intonation. ';
        }

        facts.detailedGuidance = `${facts.detailedGuidance || defaultGuidance}${appended}`;
        facts.behaviorGuidanceAdded = true;
        return true;
      },
    },
    {
      name: 'Append Marungko Support',
      when: facts => shouldAddMarungkoSupport(facts),
      then: facts => appendMarungkoSupport(facts),
    },
  ];
}

export interface AssessmentData {
  timeInSeconds: number;
  totalPassageWords: number;
  totalQuizQuestions: number;
  correctQuizAnswers: number;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  language?: 'English' | 'Filipino';
  passageSet?: PassageSet;
  miscues: {
    Mispronunciation: number;
    Omission: number;
    Substitution: number;
    Insertion: number;
    Repetition: number;
    Transposition: number;
    Reversal: number;
  };
  behaviors: {
    wordByWord: boolean;
    lacksExpression: boolean;
    hardlyAudible: boolean;
    disregardsPunctuation: boolean;
  };
  assessmentType: 'Pre-test' | 'Post-test';
}

export interface DiagnosisResult {
  wpm: number;
  wordScore: number;
  compScore: number;
  profile: 'Independent' | 'Instructional' | 'Frustration';
  explanation: string;
  primaryDecision?: DecisionKind;
  highestMiscue: string;
  rootCause: string;
  intervention: string;
  detailedGuidance: string;
  ruleTrace: string[];
}

export function generateDiagnosis(data: AssessmentData): DiagnosisResult {
  const facts = forwardChain(
    {
      ...data,
      highestMiscues: [],
      highestMiscueLabel: 'None',
      rootCause: defaultRootCause,
      intervention: defaultIntervention,
      detailedGuidance: defaultGuidance,
      explanation: '',
      behaviorIssues: [],
      behaviorGuidanceAdded: false,
      ruleTrace: [],
    },
    createRules()
  );

  return {
    wpm: facts.wpm ?? 0,
    wordScore: facts.wordScore ?? 0,
    compScore: facts.compScore ?? 0,
    profile: facts.profile ?? 'Frustration',
    explanation: facts.explanation || `The system classified this student as ${(facts.profile ?? 'Frustration').toUpperCase()} based on the Phil-IRI 2018 Manual (Table 8). Their Word Reading Score is ${facts.wordScore ?? 0}% (${facts.wordProfile ?? 'Frustration'}) and Comprehension Score is ${facts.compScore ?? 0}% (${facts.compProfile ?? 'Frustration'}).`,
    primaryDecision: facts.primaryDecision,
    highestMiscue: facts.highestMiscueLabel,
    rootCause: facts.rootCause,
    intervention: facts.intervention,
    detailedGuidance: facts.detailedGuidance,
    ruleTrace: facts.ruleTrace,
  };
}

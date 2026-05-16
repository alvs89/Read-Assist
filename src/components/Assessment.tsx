import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Student } from '../types';
import { getPassageForAssessment, PassageSet } from '../data/knowledgeBase';
import { AssessmentData } from '../lib/inferenceEngine';
import { Play, Square, CheckCircle, ArrowLeft, Plus, Minus, User, BookOpen, Timer, ListChecks, HelpCircle, Sparkles, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface AssessmentProps {
  student: Student;
  onComplete: (data: AssessmentData) => void;
  onCancel: () => void;
}

const ScrollColumn = ({ items, value, onChange }: { items: string[], value: string, onChange: (val: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 48;

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(e.currentTarget.scrollTop / ITEM_HEIGHT);
    if (items[index] && items[index] !== value) {
      onChange(items[index]);
    }
  };

  const handleItemClick = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
      onChange(items[index]);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[144px] w-16 overflow-y-auto overscroll-contain snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10"
    >
      <div className="h-[48px] shrink-0" />
      {items.map((item, index) => (
        <div 
          key={item}
          onClick={() => handleItemClick(index)}
          className={`h-[48px] shrink-0 flex items-center justify-center snap-center text-xl transition-all duration-200 cursor-pointer select-none ${item === value ? 'font-bold text-[#0038A8] scale-110' : 'font-medium text-gray-400 hover:text-gray-600'}`}
        >
          {item}
        </div>
      ))}
      <div className="h-[48px] shrink-0" />
    </div>
  );
};

const SpinnerTimePicker = ({ value, onChange, label, disabled = false }: { value: string, onChange: (v: string) => void, label: string, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [hours24, minutes] = value.split(':').map(Number);
  const initialPeriod = hours24 >= 12 ? 'PM' : 'AM';
  const initialHours12 = hours24 % 12 || 12;

  const [tempHour, setTempHour] = useState(initialHours12.toString().padStart(2, '0'));
  const [tempMinute, setTempMinute] = useState(minutes.toString().padStart(2, '0'));
  const [tempPeriod, setTempPeriod] = useState(initialPeriod);

  const openModal = () => {
    if (disabled) return;
    setTempHour(initialHours12.toString().padStart(2, '0'));
    setTempMinute(minutes.toString().padStart(2, '0'));
    setTempPeriod(initialPeriod);
    setIsOpen(true);
  };

  const handleOk = () => {
    let h24 = parseInt(tempHour, 10);
    if (tempPeriod === 'PM' && h24 !== 12) h24 += 12;
    if (tempPeriod === 'AM' && h24 === 12) h24 = 0;
    onChange(`${h24.toString().padStart(2, '0')}:${tempMinute}`);
    setIsOpen(false);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periodsList = ['AM', 'PM'];

  return (
    <>
      <div>
        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className={`w-full flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-gray-50 transition-colors focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-100'}`}
        >
          <span className="text-gray-900 font-medium">
            {initialHours12.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')} {initialPeriod}
          </span>
          <Clock size={18} className="text-gray-500" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[320px] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-sm font-bold text-gray-800 uppercase tracking-wider text-center">{label}</div>
            
            <div className="relative flex justify-center items-center h-[144px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              {/* Selection Highlight Overlay */}
              <div className="absolute top-[48px] left-0 right-0 h-[48px] bg-blue-100/40 border-y border-blue-200 pointer-events-none" />
              
              <ScrollColumn items={hoursList} value={tempHour} onChange={setTempHour} />
              <div className="text-2xl font-bold text-gray-400 pb-1 z-10">:</div>
              <ScrollColumn items={minutesList} value={tempMinute} onChange={setTempMinute} />
              <div className="w-4 z-10" />
              <ScrollColumn items={periodsList} value={tempPeriod} onChange={setTempPeriod} />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">CANCEL</button>
              <button onClick={handleOk} className="px-5 py-2.5 text-sm font-bold text-[#0038A8] hover:bg-blue-50 rounded-xl transition-colors">OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const calculateEndTime = (startTime: string, durationSeconds: number) => {
  const [hoursPart, minutesPart] = startTime.split(':').map(Number);
  const normalizedHours = Number.isFinite(hoursPart) ? hoursPart : 0;
  const normalizedMinutes = Number.isFinite(minutesPart) ? minutesPart : 0;
  const totalMinutes = (normalizedHours * 60) + normalizedMinutes + Math.max(0, Math.floor(durationSeconds / 60));
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

type TooltipProps = {
  title: string;
  lines: string[];
  align?: 'left' | 'right';
};

const Tooltip = ({ title, lines, align = 'right' }: TooltipProps) => (
  <div className="relative group inline-flex items-center">
    <HelpCircle size={14} className="opacity-60 hover:opacity-100 cursor-help" />
    <div className={`absolute bottom-full ${align === 'left' ? 'left-0' : 'right-0'} mb-2 w-80 max-w-[calc(100vw-1rem)] rounded-lg bg-gray-900 p-3 text-xs text-white shadow-xl opacity-0 invisible transition-all pointer-events-none group-hover:opacity-100 group-hover:visible z-20`}>
      <p className="font-semibold mb-2 text-white">{title}</p>
      <div className="space-y-2 text-white/90">
        {lines.map(line => (
          <p key={line} className="leading-relaxed">
            {line}
          </p>
        ))}
      </div>
      <div className="absolute -bottom-1 right-2 h-2 w-2 rotate-45 bg-gray-900" />
    </div>
  </div>
);

export function Assessment({ student, onComplete, onCancel }: AssessmentProps) {
  const today = new Date().toISOString().split('T')[0];
  const defaultTimeString = '12:00';
  const assignedPassageLevel = Math.max(3, student.recommendedPassageLevel ?? student.gradeLevel);
  const filipinoGstScore = student.gstRecords?.Filipino?.score;
  const englishGstScore = student.gstRecords?.English?.score;
  const primaryGstLanguage: 'English' | 'Filipino' =
    student.primaryGstLanguage === 'English' || student.primaryGstLanguage === 'Filipino'
      ? student.primaryGstLanguage
      : (filipinoGstScore !== undefined && englishGstScore !== undefined && englishGstScore < filipinoGstScore
          ? 'English'
          : 'Filipino');
  const bothGstScoresLow =
    filipinoGstScore !== undefined &&
    englishGstScore !== undefined &&
    filipinoGstScore < 14 &&
    englishGstScore < 14;
  const defaultAssessmentLanguage: 'English' | 'Filipino' = primaryGstLanguage;
  const canUseEnglish = student.gradeLevel >= 4 && (primaryGstLanguage === 'English' || bothGstScoresLow);
  const canUseFilipino = student.gradeLevel < 4 || primaryGstLanguage === 'Filipino' || bothGstScoresLow;

  const createEmptyMiscues = () => ({
    Mispronunciation: 0, Omission: 0, Substitution: 0, Insertion: 0, Repetition: 0, Transposition: 0, Reversal: 0,
  });

  const createEmptyBehaviors = () => ({
    wordByWord: false, lacksExpression: false, hardlyAudible: false, disregardsPunctuation: false,
  });
  // Keep separate drafts per assessment type so switching tabs does not erase entered observations.
  const [preTestDraft, setPreTestDraft] = useState<AssessmentData | null>(
    student.preTest?.raw || (student.rawAssessmentData?.assessmentType !== 'Post-test' ? student.rawAssessmentData : null) || null
  );
  const [postTestDraft, setPostTestDraft] = useState<AssessmentData | null>(
    student.postTest?.raw || (student.rawAssessmentData?.assessmentType === 'Post-test' ? student.rawAssessmentData : null) || null
  );

  const initialType = student.rawAssessmentData?.assessmentType || 'Pre-test';
  const initialData = initialType === 'Pre-test' ? preTestDraft : postTestDraft;

  const [assessmentType, setAssessmentType] = useState<'Pre-test' | 'Post-test'>(initialType);

  const [isRunning, setIsRunning] = useState(false);
  const [timeInSeconds, setTimeInSeconds] = useState(initialData?.timeInSeconds || 0);
  const [quizScore, setQuizScore] = useState<number>(initialData?.correctQuizAnswers || 0);
  
  const [sessionDate, setSessionDate] = useState(
    initialData?.sessionDate ? initialData.sessionDate.split('T')[0] : today
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || defaultTimeString);

  const [miscues, setMiscues] = useState(initialData?.miscues || {
    Mispronunciation: 0, Omission: 0, Substitution: 0, Insertion: 0, Repetition: 0, Transposition: 0, Reversal: 0,
  });

  const [behaviors, setBehaviors] = useState(initialData?.behaviors || {
    wordByWord: false, lacksExpression: false, hardlyAudible: false, disregardsPunctuation: false,
  });
  const [isResetTimerModalOpen, setIsResetTimerModalOpen] = useState(false);

  const [language, setLanguage] = useState<'English' | 'Filipino'>(initialData?.language || defaultAssessmentLanguage);
  const [passageSet, setPassageSet] = useState<PassageSet>(initialData?.passageSet || (initialType === 'Pre-test' ? 'A' : 'B'));

  useEffect(() => {
    // Keep the reading language aligned with the primary GST result unless both GST scores are low.
    if ((!canUseEnglish && language === 'English') || (!canUseFilipino && language === 'Filipino')) {
      setLanguage(defaultAssessmentLanguage);
    }
    // Grade 3 assessments remain Filipino-only, so auto-correct any imported English selection.
    if (student.gradeLevel < 4 && language === 'English') {
      setLanguage('Filipino');
    }
  }, [canUseEnglish, canUseFilipino, defaultAssessmentLanguage, language, student.gradeLevel]);

  const endTime = calculateEndTime(startTime, timeInSeconds);

  // Passage lookup follows the assigned level, language, assessment type, and set so saved runs stay reproducible.
  const passage = getPassageForAssessment(assignedPassageLevel, language, assessmentType, passageSet);
  const wordCount: number = Number(passage.wordCount);
  const maxMiscuesPerStory = wordCount;
  const totalMiscues = (Object.values(miscues) as number[]).reduce((sum: number, count: number) => sum + count, 0);
  const miscueTypes = Object.keys(miscues) as Array<keyof typeof miscues>;

  const canIncreaseMiscue = () => {
    return totalMiscues < maxMiscuesPerStory;
  };

  const handleTypeToggle = (newType: 'Pre-test' | 'Post-test') => {
    if (newType === assessmentType) return;
    
    // Save the current form state before loading the other assessment type.
    const currentData: AssessmentData = {
      timeInSeconds,
      totalPassageWords: wordCount,
      totalQuizQuestions: passage.questionCount,
      correctQuizAnswers: quizScore,
      sessionDate: `${sessionDate}T12:00:00.000Z`,
      startTime,
      endTime,
      language,
      passageSet,
      miscues,
      behaviors,
      assessmentType,
    };
    
    if (assessmentType === 'Pre-test') {
      setPreTestDraft(currentData);
    } else {
      setPostTestDraft(currentData);
    }

    // Restore the other draft, or fall back to a clean form when nothing has been captured yet.
    const newData = newType === 'Pre-test' ? preTestDraft : postTestDraft;
    
    if (newData) {
      setTimeInSeconds(newData.timeInSeconds || 0);
      setQuizScore(newData.correctQuizAnswers || 0);
      setSessionDate(newData.sessionDate ? newData.sessionDate.split('T')[0] : today);
      setStartTime(newData.startTime || defaultTimeString);
      setLanguage(newData.language || defaultAssessmentLanguage);
      setPassageSet(newData.passageSet || (newType === 'Pre-test' ? 'A' : 'B'));
      setMiscues(newData.miscues || {
        Mispronunciation: 0, Omission: 0, Substitution: 0, Insertion: 0, Repetition: 0, Transposition: 0, Reversal: 0,
      });
      setBehaviors(newData.behaviors || {
        wordByWord: false, lacksExpression: false, hardlyAudible: false, disregardsPunctuation: false,
      });
    } else {
      setTimeInSeconds(0);
      setQuizScore(0);
      setSessionDate(today);
      setStartTime(defaultTimeString);
      setLanguage(defaultAssessmentLanguage);
      setPassageSet(newType === 'Pre-test' ? 'A' : 'B');
      setMiscues({
        Mispronunciation: 0, Omission: 0, Substitution: 0, Insertion: 0, Repetition: 0, Transposition: 0, Reversal: 0,
      });
      setBehaviors({
        wordByWord: false, lacksExpression: false, hardlyAudible: false, disregardsPunctuation: false,
      });
    }
    
      setIsRunning(false);
    setAssessmentType(newType);
    toast.success(`Assessment type switched to ${newType}.`);
  };

  const currentAccuracy: number = Math.max(0, ((wordCount - totalMiscues) / wordCount) * 100);

  const getTrackerColorClass = (accuracyPercentage: number) => {
    if (accuracyPercentage >= 97) {
      return 'bg-gray-50 border-gray-200 text-gray-700';
    } else if (accuracyPercentage >= 90) {
      return 'bg-orange-50 border-orange-300 text-orange-700';
    } else {
      return 'bg-red-50 border-red-300 text-red-700';
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeInSeconds((prev: number) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleMiscueChange = (type: keyof typeof miscues, delta: number) => {
    const currentValue = miscues[type];

    if (delta < 0 && currentValue <= 0) {
      toast.error(`Counts cannot go below 0.`);
      return;
    }

    if (delta > 0 && totalMiscues >= maxMiscuesPerStory) {
      toast.error(`You have reached the story limit of ${maxMiscuesPerStory} miscues.`);
      return;
    }

    setMiscues((prev: typeof miscues) => ({
      ...prev,
      [type]: Math.min(Math.max(0, prev[type] + delta), maxMiscuesPerStory),
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const miscueDescriptions: Record<string, string> = {
    Mispronunciation: "Pronouncing a word incorrectly (e.g., 'is-land' for 'island').",
    Omission: "Skipping a word or group of words (e.g., skipping 'big' in 'the big dog').",
    Substitution: "Replacing a word with another word (e.g., 'house' for 'home').",
    Insertion: "Adding a word that is not in the text (e.g., adding 'big' to 'the dog').",
    Repetition: "Reading a word or phrase more than once (e.g., saying 'the, the dog').",
    Transposition: "Reading words in the wrong order (e.g., 'dog black' for 'black dog').",
    Reversal: "Reversing letters within a word (e.g., 'was' for 'saw').",
  };

  const handleSubmit = () => {
    if (timeInSeconds < 1) {
      toast.error('Please set the reading timer to at least 1 second before generating a diagnosis.');
      return;
    }

    toast.success('Assessment saved successfully.');
    // Save the resolved passage metadata together with the observations so the report can be regenerated later.
    onComplete({
      timeInSeconds,
      totalPassageWords: passage.wordCount,
      totalQuizQuestions: passage.questionCount,
      correctQuizAnswers: quizScore,
      sessionDate,
      startTime,
      endTime,
      language,
      passageSet,
      miscues,
      behaviors,
      assessmentType
    });
  };

  const handleTimerToggle = () => {
    setIsRunning((prev: boolean) => !prev);
    toast.success(isRunning ? 'Reading timer stopped.' : 'Reading timer started.');
  };

  const handleTimerReset = () => {
    setIsRunning(false);
    setTimeInSeconds(0);
    toast.success('Reading timer reset to 00:00.');
    setIsResetTimerModalOpen(false);
  };

  const handleCancel = () => {
    toast('Assessment cancelled. Returning to roster.');
    onCancel();
  };

  const canGenerateDiagnosis = timeInSeconds >= 1;
  const submitButtonLabel = `Generate ${assessmentType} Expert Diagnosis`;

  const sessionDetailsTooltip = {
    title: 'What this section does',
    lines: [
      'It stores the assessment type, passage set, language, date, and time window for the session.',
      'Choose the correct settings before you start so the saved assessment matches the passage and result.',
    ],
  };
  const readingTimerTooltip = {
    title: 'What this control does',
    lines: [
      'It measures how long the student takes to read the passage.',
      'Start the timer when the student begins reading, stop it when reading ends, and reset only if the attempt needs to be cleared.',
    ],
  };
  const comprehensionTooltip = {
    title: 'What this control does',
    lines: [
      'It records the number of correct quiz answers for the passage.',
      'Select the score from 0 up to the total number of questions.',
    ],
  };
  const miscueTrackerTooltip = {
    title: 'What this control does',
    lines: [
      'It counts the reading miscues observed during the passage.',
      'Use the plus and minus buttons to record each miscue type, and keep the total within the story limit.',
    ],
  };
  const qualitativeChecklistTooltip = {
    title: 'What this control does',
    lines: [
      'It records qualitative observations about how the student read.',
      'Check only the behaviors that were actually observed during the session.',
    ],
  };

  return (
    <div className="px-4 md:px-8 max-w-[1600px] mx-auto w-full pb-12">
      {/* Top Actions */}
      <div className="flex mb-8 print:hidden">
        <button 
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-500 hover:text-[#0038A8] font-semibold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow"
        >
          <ArrowLeft size={20} />
          Back to Roster
        </button>
      </div>

      {/* Student Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-blue-50 text-[#0038A8] p-4 rounded-2xl hidden sm:block">
            <User size={36} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Reading Assessment</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{student.name}</h2>
            <p className="text-gray-600 mt-2 font-medium text-lg">Grade {student.gradeLevel}{student.section ? ` - ${student.section}` : ''}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8] mt-2">Current Passage Level: {assignedPassageLevel} • Set {passage.passageSet}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-6 py-5 rounded-2xl border-2 border-blue-100 bg-blue-50 w-full md:w-auto justify-center md:justify-start">
          <BookOpen className="text-[#0038A8] hidden sm:block" size={32} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8] opacity-80 mb-0.5">Assigned Passage (Level {assignedPassageLevel} • Set {passage.passageSet})</p>
            <p className="text-xl font-black text-gray-900 tracking-tight">{passage.title}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">{passage.wordCount} words • {passage.questionCount} questions</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Session Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                <Calendar size={20} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
                <Tooltip {...sessionDetailsTooltip} align="left" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Assessment Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('Pre-test')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border ${assessmentType === 'Pre-test' ? 'bg-[#0038A8] text-white border-[#0038A8]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Pre-test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('Post-test')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border ${assessmentType === 'Post-test' ? 'bg-[#0038A8] text-white border-[#0038A8]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Post-test
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Passage Set</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as PassageSet[]).map(set => (
                    <button
                      key={set}
                      type="button"
                      onClick={() => setPassageSet(set)}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-colors border ${passageSet === set ? 'bg-[#0038A8] text-white border-[#0038A8]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                      Set {set}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Language</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => canUseEnglish && setLanguage('English')}
                    disabled={!canUseEnglish}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border ${language === 'English' ? 'bg-[#0038A8] text-white border-[#0038A8]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} ${!canUseEnglish ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => canUseFilipino && setLanguage('Filipino')}
                    disabled={!canUseFilipino}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border ${language === 'Filipino' ? 'bg-[#0038A8] text-white border-[#0038A8]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} ${!canUseFilipino ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
                  >
                    Filipino
                  </button>
                </div>
                {!canUseEnglish || !canUseFilipino ? (
                  <p className="mt-2 text-xs text-gray-500 font-medium">
                    {student.gradeLevel < 4
                      ? 'Grade 3 uses Filipino passages only.'
                      : 'Phil-IRI uses the lower GST language first; the second language is only available when both GST scores are below cutoff.'}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500 font-medium">
                    Phil-IRI allows one or both languages when both GST scores are below cutoff.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                <input 
                  type="date" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SpinnerTimePicker 
                  label="Start Time" 
                  value={startTime} 
                  onChange={setStartTime} 
                />
                <SpinnerTimePicker 
                  label="End Time" 
                  value={endTime} 
                  onChange={() => undefined}
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                End time is calculated automatically from the start time and reading timer.
              </p>
            </div>
          </div>

          {/* Timer Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                <Timer size={20} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Reading timer</h3>
                <Tooltip {...readingTimerTooltip} align="left" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-6xl md:text-7xl font-mono font-black text-gray-900 mb-8 tracking-tight">
              {formatTime(timeInSeconds)}
            </div>
            <button
              onClick={handleTimerToggle}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-sm ${
                isRunning 
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' 
                  : 'bg-[#0038A8] text-white hover:bg-blue-800 hover:shadow-md'
              }`}
            >
              {isRunning ? (
                <>
                  <Square size={20} className="fill-current" />
                  Stop Timer
                </>
              ) : (
                <>
                  <Play size={20} className="fill-current" />
                  Start Reading
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsResetTimerModalOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base md:text-lg font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              Reset Timer
            </button>
            </div>
          </div>

          {/* Comprehension Quiz Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                <HelpCircle size={20} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Comprehension</h3>
                <Tooltip {...comprehensionTooltip} />
              </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Quiz Score</p>
                <p className="text-xs text-gray-500 font-medium">Out of {passage.questionCount} questions</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={quizScore}
                  onChange={(e) => setQuizScore(Number(e.target.value))}
                  className="text-2xl font-black p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#0038A8] outline-none w-24 text-center shadow-sm cursor-pointer"
                >
                  {Array.from({ length: passage.questionCount + 1 }, (_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <span className="text-2xl font-black text-gray-400">/ {passage.questionCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Miscue Tracker Card */}
          <div className={`rounded-2xl shadow-sm border p-6 md:p-8 flex-1 transition-colors duration-300 ${getTrackerColorClass(currentAccuracy)}`}>
            <div className="flex items-center justify-between mb-6 border-b border-current/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/80 p-2 rounded-lg shadow-sm">
                  <ListChecks size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-current">Miscue Tracker</h3>
                  <Tooltip {...miscueTrackerTooltip} />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">Current Accuracy</span>
                  <div className="relative group flex items-center">
                    <HelpCircle size={14} className="opacity-60 hover:opacity-100 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                      <p className="font-semibold mb-1">How is this calculated?</p>
                      <p className="opacity-90">((Total Words - Total Miscues) / Total Words) × 100</p>
                      <div className="absolute -bottom-1 right-1.5 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
                <span className="text-2xl font-black">{currentAccuracy.toFixed(1)}%</span>
                <span className="text-xs font-semibold opacity-75 mt-1">Total miscues: {totalMiscues} / {maxMiscuesPerStory}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {miscueTypes.map((type) => {
                const count = miscues[type];
                return (
                <div key={type} className="flex items-center justify-between bg-white/60 p-4 rounded-xl border border-current/10 hover:border-current/30 transition-colors">
                  <div>
                    <span className="font-semibold text-gray-900 block">{type}</span>
                    <span className="text-xs text-gray-600 mt-0.5 block">{miscueDescriptions[type]}</span>
                    <span className="text-[11px] font-semibold text-gray-500 mt-1 block">Story limit: {maxMiscuesPerStory}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <button 
                      onClick={() => handleMiscueChange(type as keyof typeof miscues, -1)}
                      className={`w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center transition-all shadow-sm ${count > 0 ? 'text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'text-gray-300 cursor-not-allowed hover:bg-white hover:text-gray-300 hover:border-gray-200'}`}
                      aria-disabled={count === 0}
                    >
                      <Minus size={18} strokeWidth={2.5} />
                    </button>
                    <span className="w-8 text-center font-black text-xl text-gray-900">{count}</span>
                    <button 
                      onClick={() => handleMiscueChange(type as keyof typeof miscues, 1)}
                      className={`w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center transition-all shadow-sm ${canIncreaseMiscue() ? 'text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200' : 'text-gray-300 cursor-not-allowed hover:bg-white hover:text-gray-300 hover:border-gray-200'}`}
                      aria-disabled={!canIncreaseMiscue()}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Qualitative Behavior Checklist */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                <ListChecks size={20} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Qualitative Behavior Checklist</h3>
                <Tooltip {...qualitativeChecklistTooltip} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={behaviors.wordByWord}
                  onChange={(e) => setBehaviors(prev => ({ ...prev, wordByWord: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0038A8] focus:ring-[#0038A8]" 
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Word-by-word reading</span>
                  <span className="text-xs text-gray-500 block">Reads slowly, pausing between words</span>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={behaviors.lacksExpression}
                  onChange={(e) => setBehaviors(prev => ({ ...prev, lacksExpression: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0038A8] focus:ring-[#0038A8]" 
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Lacks expression</span>
                  <span className="text-xs text-gray-500 block">Reads in a monotonous tone</span>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={behaviors.hardlyAudible}
                  onChange={(e) => setBehaviors(prev => ({ ...prev, hardlyAudible: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0038A8] focus:ring-[#0038A8]" 
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Hardly audible</span>
                  <span className="text-xs text-gray-500 block">Voice is very soft or hesitant</span>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={behaviors.disregardsPunctuation}
                  onChange={(e) => setBehaviors(prev => ({ ...prev, disregardsPunctuation: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0038A8] focus:ring-[#0038A8]" 
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Disregards punctuation</span>
                  <span className="text-xs text-gray-500 block">Does not pause at periods or commas</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleSubmit}
            disabled={!canGenerateDiagnosis}
            className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-sm ${
              canGenerateDiagnosis
                ? 'bg-[#0038A8] text-white hover:bg-blue-800 hover:shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Sparkles size={24} />
            {submitButtonLabel}
          </button>
          <p className="mt-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center leading-tight">
            {canGenerateDiagnosis
              ? `Saves the current ${assessmentType.toLowerCase()} assessment to the student record.`
              : 'Start the reading timer and record at least 1 second before generating a diagnosis.'}
          </p>
        </div>
      </div>

      {isResetTimerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 p-4 text-white flex items-center gap-3">
              <AlertTriangle size={22} />
              <h2 className="text-xl font-bold">Reset Reading Timer</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">Do you want to reset the timer? This action cannot be undone.</p>
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 mb-6">
                <p className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1">Current Timer</p>
                <p className="text-4xl font-black text-red-700 font-mono tracking-tight">{formatTime(timeInSeconds)}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetTimerModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTimerReset}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

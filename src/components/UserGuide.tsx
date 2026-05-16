import React from 'react';
import { ArrowLeft, BookOpenText, Calculator, CheckCircle2, ClipboardList, FileText, Info, ShieldCheck, Users, Activity } from 'lucide-react';

interface UserGuideProps {
  onBack: () => void;
  backLabel: string;
}

const quickLinks = [
  { id: 'overview', label: 'Overview' },
  { id: 'roster', label: 'Class Roster' },
  { id: 'assessment', label: 'Reading Assessment' },
  { id: 'report', label: 'Expert Diagnosis' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'tips', label: 'Best Practices' },
];

const formulaCards = [
  {
    title: 'Primary GST selection',
    formula: 'Primary GST = lower of the available language GST scores',
    note: 'If Filipino and English are both recorded, the lower score becomes the placement score. A tie is recorded as Tie.',
  },
  {
    title: 'Status and placement',
    formula: 'GST >= 14 -> Exempted; GST <= 13 -> For Intervention; GST 8-13 -> max(3, grade - 2); GST 0-7 -> max(3, grade - 3)',
    note: 'The system never recommends a passage below Grade 3.',
  },
  {
    title: 'Reading speed',
    formula: 'WPM = (totalPassageWords / timeInSeconds) * 60',
    note: 'Use the time spent reading the passage in seconds.',
  },
  {
    title: 'Word recognition score',
    formula: 'Word Score = ((totalPassageWords - totalMiscues) / totalPassageWords) * 100',
    note: 'Total miscues is the sum of all observed miscues.',
  },
  {
    title: 'Comprehension score',
    formula: 'Comprehension Score = (correctQuizAnswers / totalQuizQuestions) * 100',
    note: 'Round using the same whole-number behavior the system uses internally.',
  },
];

const checklistItems = [
  'Use the roster to add or edit students before running an assessment.',
  'Keep GST entries consistent and include Filipino and English records for Grades 4-6 when available.',
  'Use the assessment screen to capture reading time, quiz answers, miscues, and behaviors.',
  'Review the generated report before printing or exporting it as PDF.',
];

const workflowCards = [
  {
    title: 'Roster setup',
    description: 'Create or update student records, then confirm grade level, section, and GST data before assessment.',
  },
  {
    title: 'Assessment entry',
    description: 'Record reading time, correct answers, miscues, and behavior observations while the student reads the passage.',
  },
  {
    title: 'Report review',
    description: 'Check the profile, root cause, intervention, and guidance before sharing or printing the result.',
  },
];

const guideNotes = [
  'ReadAssist is rule-based. It does not train on teacher input during the assessment session.',
  'Always review the generated report before using it for instructional planning.',
  'If a student has both Filipino and English GST results, the system uses the lower score for placement.',
  'For Grades 4-6, English GST support is available alongside Filipino GST records when the school collects both.',
];

export function UserGuide({ onBack, backLabel }: UserGuideProps) {
  return (
    <div className="px-4 md:px-8 max-w-[1600px] mx-auto w-full pb-12">
      <div className="flex mb-8 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-[#0038A8] font-semibold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow"
        >
          <ArrowLeft size={20} />
          {backLabel}
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0038A8] text-white flex items-center justify-center shadow-sm">
                <BookOpenText size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">User Guide</h2>
                <p className="text-sm text-slate-500">ReadAssist workflow and formulas</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              ReadAssist is a rule-based expert system. It uses GST results, assessment data, miscues, and passage metadata to generate a reading diagnosis and recommendation.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">On this page</h3>
            <nav className="space-y-2">
              {quickLinks.map(link => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#0038A8] hover:bg-blue-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8">
          <section id="overview" className="bg-gradient-to-br from-white via-white to-blue-50 rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 overflow-hidden">
            <div className="flex flex-col gap-6">
              <div className="w-full rounded-2xl border border-blue-100 bg-white/80 p-6 md:p-8 shadow-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#0038A8] mb-4">
                  <Info size={14} />
                  Start here
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-4">How to use ReadAssist</h1>
                <p className="max-w-none text-lg md:text-xl leading-9 text-slate-600">
                  Follow the workflow in order: create the roster, run the reading assessment, review the expert diagnosis, and use the formulas and best practices below to interpret results clearly. The guide mirrors the actual behavior of the system.
                </p>
              </div>
            </div>
          </section>

          <section id="roster" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">1. Class Roster</h2>
                <p className="text-slate-600">Add, organize, edit, and review student records before assessment.</p>
              </div>
            </div>

            <ol className="grid gap-4 md:grid-cols-2">
              <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-2">Step 1</p>
                <p className="text-slate-700 leading-7">Enter the student name, section, grade level, and GST information. Grades 4-6 may store both Filipino and English GST records.</p>
              </li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-2">Step 2</p>
                <p className="text-slate-700 leading-7">Use search and filters to find a student quickly. Edit a record if a score changes or if the grade level was entered incorrectly.</p>
              </li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-2">Step 3</p>
                <p className="text-slate-700 leading-7">The roster labels each student as Pending, For Intervention, or Exempted based on GST score and placement rules.</p>
              </li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-2">Step 4</p>
                <p className="text-slate-700 leading-7">Choose Start Assessment for students who need reading screening, or View Report if the diagnosis already exists.</p>
              </li>
            </ol>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">Before you start</p>
              <ul className="space-y-2.5 text-slate-700 leading-7">
                <li>Confirm the student&apos;s name, section, and grade level before saving.</li>
                <li>Enter GST as accurately as possible, because it affects both placement and the recommended passage level.</li>
                <li>If the student is in Grade 4, 5, or 6, add the English GST record when it exists so the primary GST can be selected correctly.</li>
              </ul>
            </div>
          </section>

          <section id="assessment" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center">
                <ClipboardList size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">2. Reading Assessment</h2>
                <p className="text-slate-600">Collect the reading evidence that powers the expert diagnosis.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">What to record</p>
                <ul className="space-y-3 text-slate-700 leading-7">
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 text-green-600" size={18} /><span><strong>Time in seconds</strong> spent reading the passage.</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 text-green-600" size={18} /><span><strong>Quiz answers</strong> to measure comprehension.</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 text-green-600" size={18} /><span><strong>Miscues</strong> such as mispronunciation, omission, substitution, insertion, repetition, transposition, and reversal.</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 text-green-600" size={18} /><span><strong>Behaviors</strong> such as word-by-word reading, weak expression, barely audible voice, or ignoring punctuation.</span></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">How the passage is chosen</p>
                <ul className="space-y-3 text-slate-700 leading-7">
                  <li>The system uses the student&apos;s grade level, language, and assessment type to load the correct passage.</li>
                  <li>For Grade 3, the interface stays Filipino-only.</li>
                  <li>For Grades 4-6, the assessment may use Filipino or English depending on the stored record.</li>
                  <li>Pre-test and Post-test are saved separately so growth can be compared later in the report.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800 mb-3">How to score the session</p>
              <ol className="space-y-2.5 text-slate-700 leading-7 list-decimal list-inside">
                <li>Count the total words in the assigned passage.</li>
                <li>Measure the reading time in seconds.</li>
                <li>Count each miscue type separately, then let the system compute the total miscues and scores.</li>
                <li>Enter the number of correct quiz answers to capture comprehension.</li>
                <li>Save the session so the report can use the scores and observations later.</li>
              </ol>
            </div>
          </section>

          <section id="report" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center">
                <FileText size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">3. Expert Diagnosis and Report</h2>
                <p className="text-slate-600">Read the result, verify the recommendation, and print or export it when needed.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-bold text-slate-900 mb-2">Primary reading profile</p>
                <p className="text-slate-700 leading-7">The system combines the word recognition profile and the comprehension profile, then keeps the lower-ranked result as the overall reading profile.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-bold text-slate-900 mb-2">Root cause and intervention</p>
                <p className="text-slate-700 leading-7">Review the root cause label, the recommended intervention, and the detailed guidance. These are derived from the dominant miscue pattern or comprehension deficit rule.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-bold text-slate-900 mb-2">Growth reporting</p>
                <p className="text-slate-700 leading-7">If both pre-test and post-test exist, the report shows the growth narrative and compares reading speed, word recognition, and comprehension.</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">How to read the report</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-900 mb-1">If the student is Independent</p>
                  <p className="text-slate-700 leading-7">Use the next-step recommendation to select a more challenging passage and continue building fluency.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">If the student is For Intervention</p>
                  <p className="text-slate-700 leading-7">Follow the root cause and intervention closely, because the dominant miscue or comprehension rule is the main basis for the recommendation.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">If behaviors are listed</p>
                  <p className="text-slate-700 leading-7">Treat behaviors as supporting notes. They do not override the main reading diagnosis.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">If growth data is present</p>
                  <p className="text-slate-700 leading-7">Compare pre-test and post-test results to check whether fluency and comprehension improved over time.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="formulas" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center">
                <Calculator size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">4. Formulas used by ReadAssist</h2>
                <p className="text-slate-600">These are the calculations used by the application when it evaluates a student record.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {formulaCards.map(card => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-bold text-slate-900 mb-3">{card.title}</p>
                  <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm md:text-base text-white font-mono leading-7 break-words">
                    {card.formula}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">Workflow summary</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {workflowCards.map(card => (
                  <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="font-bold text-slate-900 mb-2">{card.title}</p>
                    <p className="text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="tips" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">5. Best practices and checks</h2>
                <p className="text-slate-600">Use these checks to keep the workflow accurate and easy to review.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">Recommended habits</p>
                <ul className="space-y-3 text-slate-700 leading-7">
                  {checklistItems.map(item => (
                    <li key={item} className="flex gap-3">
                      <Activity size={18} className="mt-1 text-[#0038A8] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">Quick interpretation guide</p>
                <ul className="space-y-3 text-slate-700 leading-7">
                  <li><strong>Independent:</strong> strong reading performance at the current level.</li>
                  <li><strong>Instructional:</strong> the student can read with support and continued practice.</li>
                  <li><strong>Frustration:</strong> the student needs targeted intervention or simpler text.</li>
                  <li><strong>Comprehension deficit:</strong> decoding is adequate, but meaning-making is weak.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0038A8] mb-3">Quick reminders</p>
              <ul className="space-y-2.5 text-slate-700 leading-7">
                {guideNotes.map(note => (
                  <li key={note} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0038A8] shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
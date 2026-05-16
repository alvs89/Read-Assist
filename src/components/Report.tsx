import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Student } from '../types';
import { ArrowLeft, Printer, AlertTriangle, CheckCircle, Download, Edit, Activity, BrainCircuit, Target, Lightbulb, User, Clock, FileText, HelpCircle, Calendar, Info } from 'lucide-react';
import { diagnosticRules } from '../data/knowledgeBase';
import { downloadBlobFile } from '../lib/reportExport';
import { hasGstBreakdownComponents } from '../lib/gst';

interface ReportProps {
  student: Student;
  onBack: () => void;
  onEdit: () => void;
}

export function Report({ student, onBack, onEdit }: ReportProps) {
  const result = student.assessmentResult;
  const pdfRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const gstBreakdown = student.gstBreakdown;

  const rootCauseText = typeof result?.rootCause === 'string' ? result.rootCause : '';
  const interventionText = typeof result?.intervention === 'string' ? result.intervention : '';
  const detailedGuidanceText = typeof result?.detailedGuidance === 'string' ? result.detailedGuidance : '';
  const highestMiscueText = typeof result?.highestMiscue === 'string' ? result.highestMiscue : 'None';

  const metricTooltipClass = 'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-80 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] font-semibold leading-relaxed text-white shadow-2xl opacity-0 invisible isolate whitespace-normal break-words group-hover:opacity-100 group-hover:visible';

  const MetricTooltip = ({ title, lines }: { title: string; lines: string[] }) => (
    <div className="relative group inline-flex items-center">
      <HelpCircle size={14} className="cursor-help text-gray-400 hover:text-gray-700" />
      <div className={metricTooltipClass}>
        <p className="mb-2 font-semibold text-white">{title}</p>
        <div className="space-y-2 text-white/90">
          {lines.map(line => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );

  if (!result) {
    return <div>No report available.</div>;
  }

  const isComprehensionDriven = result.primaryDecision === 'Comprehension Deficit' || (
    result.primaryDecision === undefined && (
      rootCauseText.includes('Poor Vocabulary and Schema Activation') ||
      interventionText.includes('Build oral language and vocabulary first') ||
      detailedGuidanceText.includes('pre-teach difficult vocabulary') ||
      (highestMiscueText === 'None' && result.compScore < 60 && result.wordScore >= 90)
    )
  );
  const isIndependentReader = result.profile === 'Independent' && rootCauseText.startsWith('No dominant reading problem');
  const primaryIssueLabel = isIndependentReader
    ? 'No dominant reading problem identified'
    : isComprehensionDriven
    ? 'Comprehension Deficit'
    : highestMiscueText;
  const interventionSectionTitle = isComprehensionDriven
    ? 'Primary Comprehension-Based Intervention'
    : isIndependentReader
    ? 'Instructional Next Step'
    : 'Primary Miscue-Based Intervention';
  const guidanceSectionTitle = isIndependentReader
    ? 'Instructional Next Step'
    : 'Comprehension Support Notes and Observed Behaviors';

  const primaryIssueSourceText = isIndependentReader
    ? 'The system shows this because the student reached the Independent level and no main reading problem was found.'
    : isComprehensionDriven
    ? 'The system shows this because the student can read the words, but understanding the passage is still low.'
    : 'The system shows this because the reading error that happened most often was the strongest one.';

  const rootCauseSourceText = isIndependentReader
    ? 'The system shows this because the student already handled the current level well, so there is no main problem to fix.'
    : isComprehensionDriven
    ? 'The system shows this because the student can read the words, but the meaning of the passage is still difficult.'
    : 'The system shows this because the most frequent reading error was matched with the handbook guide.';

  const interventionSourceText = isIndependentReader
    ? 'This is the next step to help the student move to a harder level.'
    : isComprehensionDriven
    ? 'This is the help recommended to build understanding, word meaning, and rereading skills.'
    : 'This is the help matched to the reading error that happened most often.';

  const tooltipBaseClass = 'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] font-semibold leading-relaxed text-white shadow-2xl opacity-0 invisible isolate whitespace-normal break-words group-hover:opacity-100 group-hover:visible';

  // Older saved reports may not have detailed guidance, so rebuild it from the miscue label when possible.
  let displayGuidance = detailedGuidanceText;
  if (!displayGuidance) {
    const miscueMatch = highestMiscueText.match(/^([a-zA-Z]+)/);
    if (miscueMatch && miscueMatch[1] in diagnosticRules) {
      displayGuidance = diagnosticRules[miscueMatch[1] as keyof typeof diagnosticRules].detailedGuidance;
    } else {
      displayGuidance = "Continue providing varied reading materials to build fluency and comprehension.\n\nTEACHER-LED STRATEGIES:\n• Differentiated Instruction: Provide reading materials that match the student's current independent reading level.\n\nGUIDED PRACTICE:\n• Literature Circles: Encourage peer discussion about books to deepen comprehension.\n\nINDEPENDENT & HOME SUPPORT:\n• Daily Reading Habit: Encourage at least 20 minutes of reading for pleasure every day.";
    }
  }

  const formatGuidanceText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((trimmedLine, index) => {
      const hyphenMatch = trimmedLine.match(/^---\s*(.+?)\s*---$/);
      if (hyphenMatch) {
        return (
          <div key={index} className={`break-inside-avoid ${index === 0 ? 'mt-2' : 'mt-8'} mb-4 pb-2 border-b-2 border-blue-100 flex items-center gap-3`}>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 text-[#0038A8] p-1.5 rounded-lg shadow-sm border border-blue-200">
              <Target size={18} />
            </div>
            <h3 className="font-black text-lg text-[#0038A8] uppercase tracking-wider">
              {hyphenMatch[1]}
            </h3>
          </div>
        );
      }

      if (trimmedLine.endsWith(':') && trimmedLine === trimmedLine.toUpperCase()) {
        return (
          <div key={index} className={`break-inside-avoid ${index === 0 ? 'mt-2' : 'mt-6'} mb-3`}>
            <h4 className="font-bold text-indigo-900 tracking-wider text-xs uppercase bg-[#eef2ffcc] inline-flex items-center px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
              {trimmedLine.replace(':', '')}
            </h4>
          </div>
        );
      }

      if (trimmedLine.startsWith('•')) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
          const boldPart = trimmedLine.substring(1, colonIndex + 1).trim();
          const restPart = trimmedLine.substring(colonIndex + 1).trim();
          return (
            <div key={index} className="break-inside-avoid flex gap-3 mb-2.5 text-sm md:text-base text-gray-700 leading-relaxed">
              <span className="text-[#0038A8] font-bold mt-0.5">•</span>
              <p>
                <span className="font-bold text-gray-900">{boldPart}</span> {restPart}
              </p>
            </div>
          );
        }
        return (
          <div key={index} className="break-inside-avoid flex gap-3 mb-2.5 text-sm md:text-base text-gray-700 leading-relaxed">
            <span className="text-[#0038A8] font-bold mt-0.5">•</span>
            <p>{trimmedLine.substring(1).trim()}</p>
          </div>
        );
      }

      return <p key={index} className="break-inside-avoid mb-3 text-sm md:text-base text-gray-800 leading-relaxed">{trimmedLine}</p>;
    });
  };

  const formatAcademicGuidance = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((trimmedLine, index) => {
      const hyphenMatch = trimmedLine.match(/^---\s*(.+?)\s*---$/);
      if (hyphenMatch) {
        return (
          <h5 key={index} className="font-bold uppercase mt-4 mb-1 text-black">
            {hyphenMatch[1]}
          </h5>
        );
      }

      if (trimmedLine.endsWith(':') && trimmedLine === trimmedLine.toUpperCase()) {
        return (
          <h6 key={index} className="font-semibold uppercase mt-3 mb-1 text-gray-800">
            {trimmedLine.replace(':', '')}
          </h6>
        );
      }

      if (trimmedLine.startsWith('•')) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
          const boldPart = trimmedLine.substring(1, colonIndex + 1).trim();
          const restPart = trimmedLine.substring(colonIndex + 1).trim();
          return (
            <div key={index} className="flex gap-2 mb-1 ml-4">
              <span>•</span>
              <p>
                <span className="font-semibold">{boldPart}</span> {restPart}
              </p>
            </div>
          );
        }
        return (
          <div key={index} className="flex gap-2 mb-1 ml-4">
            <span>•</span>
            <p>{trimmedLine.substring(1).trim()}</p>
          </div>
        );
      }

      return <p key={index} className="mb-2">{trimmedLine}</p>;
    });
  };

  const getWordProfile = (score: number) => {
    if (score >= 97) return 'Independent';
    if (score >= 90) return 'Instructional';
    return 'Frustration';
  };

  const getCompProfile = (score: number) => {
    if (score >= 80) return 'Independent';
    if (score >= 59) return 'Instructional';
    return 'Frustration';
  };

  const getProfileRank = (profile: string) => {
    switch (profile) {
      case 'Independent':
        return 2;
      case 'Instructional':
        return 1;
      default:
        return 0;
    }
  };

  const describeMetricChange = (label: string, preValue: number, postValue: number, unit: string) => {
    if (postValue > preValue) {
      return `${label} improved from ${preValue}${unit} to ${postValue}${unit}`;
    }

    if (postValue < preValue) {
      return `${label} decreased from ${preValue}${unit} to ${postValue}${unit}`;
    }

    return `${label} remained steady at ${postValue}${unit}`;
  };

  const buildGrowthNarrative = () => {
    if (!student.preTest || !student.postTest) {
      return '';
    }

    // Compare pre/post runs only when both exist, otherwise the growth section stays hidden.
    const pre = student.preTest.result;
    const post = student.postTest.result;
    const changes = [
      post.wpm - pre.wpm,
      post.wordScore - pre.wordScore,
      post.compScore - pre.compScore,
    ];
    const improvementCount = changes.filter(change => change > 0).length;
    const declineCount = changes.filter(change => change < 0).length;
    const profileChange = getProfileRank(post.profile) - getProfileRank(pre.profile);

    let opening = `${student.name} has`;
    if (improvementCount > 0 && declineCount === 0) {
      opening += ' shown encouraging progress';
    } else if (improvementCount > 0 && declineCount > 0) {
      opening += ' shown a mixed pattern of growth';
    } else if (improvementCount === 0 && declineCount > 0) {
      opening += ' shown results that call for continued support';
    } else {
      opening += ' maintained a steady level of performance';
    }

    const metricSentence = [
      describeMetricChange('Reading speed', pre.wpm, post.wpm, ' WPM'),
      describeMetricChange('word recognition', pre.wordScore, post.wordScore, '%'),
      describeMetricChange('comprehension', pre.compScore, post.compScore, '%'),
    ].join(', ');

    let closing = 'This pattern suggests that the student would benefit from continued guided practice to strengthen reading consistency.';
    if (improvementCount > 0 && declineCount === 0) {
      closing = 'This pattern suggests stronger fluency, more accurate word reading, and a clearer understanding of the passage.';
    } else if (improvementCount > 0 && declineCount > 0) {
      closing = 'This pattern suggests developing skills that are still becoming more consistent and should be reinforced through targeted practice.';
    } else if (improvementCount === 0 && declineCount > 0) {
      closing = 'This pattern suggests the student still needs targeted support to build decoding accuracy and comprehension.';
    } else if (profileChange > 0) {
      closing = 'This steady performance reflects a positive shift toward greater reading confidence and stability.';
    }

    return `${opening} between the pre-test and post-test. ${metricSentence}. ${closing}`;
  };

  const growthNarrative = buildGrowthNarrative();
  const hasGrowthData = Boolean(student.preTest && student.postTest);
  const growthAvailabilityText = hasGrowthData
    ? 'Both pre-test and post-test results are available. The Growth Report below summarizes the student\'s progress over time.'
    : 'Complete both a Pre-test and a Post-test to unlock the Growth Report. The Generate Expert Diagnosis button saves the current assessment to the student record.';
  const preTestIntervention = student.preTest?.result.intervention ?? '';
  const postTestIntervention = student.postTest?.result.intervention ?? '';

  const splitInterventionItems = (text: string) => text
    .replace(/\r?\n/g, '|')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);

  const renderInterventionItems = (text: string, emptyLabel: string) => {
    const items = splitInterventionItems(text);

    if (!items.length) {
      return <p className="text-sm leading-relaxed text-slate-600">{emptyLabel}</p>;
    }

    return (
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const colonIndex = item.indexOf(':');
          if (colonIndex !== -1) {
            const name = item.substring(0, colonIndex).trim();
            const desc = item.substring(colonIndex + 1).trim();
            return (
              <p key={index} className="text-sm leading-relaxed text-slate-700">
                <span className="font-bold text-slate-900">{name}:</span>{' '}
                <span className="font-medium">{desc}</span>
              </p>
            );
          }

          return (
            <div key={index} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span className="mt-0.5 text-[#0038A8] font-bold">•</span>
              <p>{item}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import('jspdf');
      const fileName = `${student.name.replace(/\s+/g, '_')}_Phil-IRI_Report.pdf`;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;
      const topMargin = 14;
      const bottomMargin = 14;
      const contentWidth = pageWidth - marginX * 2;
      const columnGap = 4;
      const statBoxWidth = (contentWidth - columnGap * 2) / 3;
      let y = topMargin;

      const normalizePdfText = (text: string) => text
        // Clean legacy encoding artifacts before sending text into jsPDF.
        .replace(/â€¢/g, '•')
        .replace(/â€”/g, '-')
        .replace(/â€“/g, '-')
        .replace(/â€™/g, "'")
        .replace(/â€œ|â€\u009d/g, '"')
        .replace(/â€¦/g, '...')
        .replace(/â†’/g, '->')
        .replace(/\u00a0/g, ' ')
        .trim();

      const getSessionDateLabel = () => {
        if (!student.rawAssessmentData?.sessionDate) return 'N/A';
        try {
          const dateStr = student.rawAssessmentData.sessionDate;
          const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
          }
        } catch (error) {}
        return student.rawAssessmentData.sessionDate;
      };

      const getSessionTimeLabel = () => {
        if (!student.rawAssessmentData?.startTime || !student.rawAssessmentData?.endTime) return 'N/A';
        const formatTime = (timeStr: string) => {
          try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
            return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          } catch (error) {
            return timeStr;
          }
        };

        return `${formatTime(student.rawAssessmentData.startTime)} - ${formatTime(student.rawAssessmentData.endTime)}`;
      };

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight <= pageHeight - bottomMargin) return;
        doc.addPage();
        y = topMargin;
      };

      const drawWrappedText = (
        text: string,
        opts: { x?: number; maxWidth?: number; fontSize?: number; fontStyle?: 'normal' | 'bold'; gapAfter?: number } = {}
      ) => {
        const {
          x = marginX,
          maxWidth = contentWidth,
          fontSize = 10,
          fontStyle = 'normal',
          gapAfter = 1.8,
        } = opts;
        const sanitizedText = normalizePdfText(text);
        if (!sanitizedText) return;
        const lineHeight = fontSize * 0.42 + 1.4;
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(sanitizedText, maxWidth);
        ensureSpace(lines.length * lineHeight + gapAfter + 1);
        doc.text(lines, x, y);
        y += lines.length * lineHeight + gapAfter;
      };

      const drawBulletItem = (text: string) => {
        const bulletX = marginX + 2;
        const textX = marginX + 7;
        const maxWidth = contentWidth - 7;
        const lineHeight = 5;
        const lines = doc.splitTextToSize(normalizePdfText(text), maxWidth);
        ensureSpace(lines.length * lineHeight + 1.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('•', bulletX, y);
        doc.text(lines, textX, y);
        y += lines.length * lineHeight + 1.5;
      };

      const drawSectionHeader = (title: string) => {
        ensureSpace(12);
        doc.setFillColor(219, 234, 254);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(marginX, y, contentWidth, 8, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 56, 168);
        doc.text(normalizePdfText(title), marginX + 3, y + 5.3);
        doc.setTextColor(0, 0, 0);
        y += 11;
      };

      const drawInfoRow = (label: string, value: string) => {
        drawWrappedText(`${label}: ${value}`, { fontSize: 10, fontStyle: 'normal', gapAfter: 1.4 });
      };

      const drawStatBox = (x: number, top: number, label: string, value: string, unit: string) => {
        const boxHeight = 24;
        const labelLines = doc.splitTextToSize(normalizePdfText(label), statBoxWidth - 6);
        doc.setDrawColor(209, 213, 219);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(x, top, statBoxWidth, boxHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        labelLines.forEach((line, index) => {
          const textWidth = doc.getTextWidth(line);
          doc.text(line, x + (statBoxWidth - textWidth) / 2, top + 5.5 + (index * 3.6));
        });

        const combinedValue = `${value}${unit ? ` ${unit}` : ''}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(0, 56, 168);
        const valueWidth = doc.getTextWidth(combinedValue);
        doc.text(combinedValue, x + (statBoxWidth - valueWidth) / 2, top + 18);
        doc.setTextColor(0, 0, 0);
      };

      const drawDivider = () => {
        ensureSpace(3);
        doc.setDrawColor(229, 231, 235);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 4;
      };

      doc.setProperties({
        title: `${student.name} Phil-IRI Report`,
        subject: 'ReadAssist Academic Reading Profile',
        author: 'ReadAssist',
        creator: 'ReadAssist',
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 56, 168);
      doc.text('Official School Report', pageWidth / 2, y, { align: 'center' });
      y += 5;

      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39);
      doc.text('ReadAssist Academic Reading Profile', pageWidth / 2, y, { align: 'center' });
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Prepared for teacher review and school submission', pageWidth / 2, y, { align: 'center' });
      y += 7;

      doc.setDrawColor(0, 56, 168);
      doc.setLineWidth(0.8);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 6;

      drawSectionHeader('Student Information');
      drawInfoRow('Student', student.name);
      drawInfoRow('Grade & Section', `Grade ${student.gradeLevel}${student.section ? ` - ${student.section}` : ''}`);
      drawInfoRow('Assessment Type', student.rawAssessmentData?.assessmentType || 'N/A');
      drawInfoRow('Passage Set', student.rawAssessmentData?.passageSet ? `Set ${student.rawAssessmentData.passageSet}` : 'N/A');
      drawInfoRow('Date', getSessionDateLabel());
      drawInfoRow('Time', getSessionTimeLabel());
      y += 2;

      drawSectionHeader('Assessment Results');
      ensureSpace(30);
      const statTop = y;
      drawStatBox(marginX, statTop, 'Reading Speed', `${result.wpm}`, 'WPM');
      drawStatBox(marginX + statBoxWidth + columnGap, statTop, 'Word Recognition', `${result.wordScore}`, '%');
      drawStatBox(marginX + (statBoxWidth + columnGap) * 2, statTop, 'Comprehension', `${result.compScore}`, '%');
      y += 27;
      drawWrappedText(
        `Final Reading Profile: ${result.profile} | Word Profile: ${getWordProfile(result.wordScore)} | Comprehension Profile: ${getCompProfile(result.compScore)}`,
        { fontSize: 10, fontStyle: 'bold', gapAfter: 2.5 }
      );

      drawSectionHeader('GST Screening Record');
      if (student.gstRecords?.Filipino) {
        drawInfoRow('Filipino GST', `${student.gstRecords.Filipino.score} / 20`);
        drawInfoRow(
          'Filipino Breakdown',
          student.gstRecords.Filipino.breakdown
            ? `Literal ${student.gstRecords.Filipino.breakdown.literal}, Inferential ${student.gstRecords.Filipino.breakdown.inferential}, Critical ${student.gstRecords.Filipino.breakdown.critical}`
            : 'No breakdown provided'
        );
      }
      if (student.gstRecords?.English) {
        drawInfoRow('English GST', `${student.gstRecords.English.score} / 20`);
        drawInfoRow(
          'English Breakdown',
          student.gstRecords.English.breakdown
            ? `Literal ${student.gstRecords.English.breakdown.literal}, Inferential ${student.gstRecords.English.breakdown.inferential}, Critical ${student.gstRecords.English.breakdown.critical}`
            : 'No breakdown provided'
        );
      }
      if (!student.gstRecords?.Filipino && !student.gstRecords?.English && gstBreakdown) {
        drawInfoRow('Raw Total', `${gstBreakdown.total} / 20`);
        drawInfoRow(
          'Component Sum',
          `${gstBreakdown.componentTotal ?? (gstBreakdown.literal + gstBreakdown.inferential + gstBreakdown.critical)} / 20`
        );
      }
      if (!student.gstRecords && !gstBreakdown) {
        drawInfoRow('GST Breakdown', 'Not provided');
      }
      y += 1;

      drawSectionHeader('Diagnostic Analysis');
      drawWrappedText(`Primary Issue(s) Identified: ${primaryIssueLabel}`, { fontSize: 10, fontStyle: 'bold' });
      drawWrappedText('Root Cause Analysis:', { fontSize: 10, fontStyle: 'bold', gapAfter: 1 });
      rootCauseText.split(/\s*(?:\||\n)\s*/).filter(Boolean).forEach(cause => drawBulletItem(cause));
      drawWrappedText(`Expert System Explanation: ${result.explanation}`, { fontSize: 10 });

      drawSectionHeader('Remedial Action Plan');
      drawWrappedText(`${interventionSectionTitle}:`, { fontSize: 10, fontStyle: 'bold', gapAfter: 1 });
      interventionText.split(/\s*(?:\||\n)\s*/).filter(Boolean).forEach(intervention => drawBulletItem(intervention));
      drawDivider();
      drawWrappedText('Detailed Guidance:', { fontSize: 10, fontStyle: 'bold', gapAfter: 1 });
      normalizePdfText(displayGuidance)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
          const sectionMatch = line.match(/^---\s*(.+?)\s*---$/);
          if (sectionMatch) {
            drawWrappedText(sectionMatch[1], { fontSize: 10, fontStyle: 'bold', gapAfter: 1.2 });
            return;
          }

          if (line.startsWith('•')) {
            drawBulletItem(line.substring(1).trim());
            return;
          }

          if (line.endsWith(':') && line === line.toUpperCase()) {
            drawWrappedText(line.replace(':', ''), { fontSize: 10, fontStyle: 'bold', gapAfter: 1.2 });
            return;
          }

          drawWrappedText(line, { fontSize: 10 });
        });

      if (hasGrowthData) {
        drawSectionHeader('Growth Report (Pre-test vs Post-test)');
        drawInfoRow('Reading Speed', `${student.preTest.result.wpm} WPM -> ${student.postTest.result.wpm} WPM`);
        drawInfoRow('Word Recognition', `${student.preTest.result.wordScore}% -> ${student.postTest.result.wordScore}%`);
        drawInfoRow('Comprehension', `${student.preTest.result.compScore}% -> ${student.postTest.result.compScore}%`);
        drawInfoRow('Overall Profile Shift', `${student.preTest.result.profile} -> ${student.postTest.result.profile}`);
        drawInfoRow('Narrative Summary', growthNarrative);
      } else {
        drawSectionHeader('Growth Report (Pre-test vs Post-test)');
        drawWrappedText(growthAvailabilityText, { fontSize: 10, gapAfter: 1.5 });
      }

      ensureSpace(12);
      y = Math.max(y, pageHeight - 18);
      doc.setDrawColor(209, 213, 219);
      doc.line(marginX, y - 3, pageWidth - marginX, y - 3);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated by ReadAssist Expert System • ${new Date().toLocaleDateString()} • Confidential School Record`, pageWidth / 2, y + 1, { align: 'center' });

      downloadBlobFile(fileName, doc.output('blob'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened.');
  };

  const handleDownloadPDFStructured = async () => {
    const loadingToast = toast.loading('Generating PDF report...');
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import('jspdf');
      const fileName = `${student.name.replace(/\s+/g, '_')}_Phil-IRI_Report.pdf`;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 12;
      const topMargin = 12;
      const bottomMargin = 12;
      const contentWidth = pageWidth - marginX * 2;
      const panelGap = 4;
      const columnGap = 4;
      const panelPadding = 3;
      const panelHeaderHeight = 8;
      const lineHeight = (fontSize: number) => fontSize * 0.42;
      let y = topMargin;

      const normalizePdfText = (value: unknown) => String(value ?? '')
        .replace(/Ã¢â‚¬Â¢|â€¢|•/g, '-')
        .replace(/Ã¢â‚¬â€|Ã¢â‚¬â€œ|â€”|â€“|—|–/g, '-')
        .replace(/Ã¢â‚¬â„¢|â€™|’/g, "'")
        .replace(/Ã¢â‚¬Å“|Ã¢â‚¬\u009d|â€œ|â€|“|”/g, '"')
        .replace(/Ã¢â‚¬Â¦|â€¦|…/g, '...')
        .replace(/Ã¢â€ â€™|â†’|→/g, '->')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const splitLines = (
        text: unknown,
        width: number,
        fontSize = 9,
        fontStyle: 'normal' | 'bold' = 'normal'
      ) => {
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        return doc.splitTextToSize(normalizePdfText(text), Math.max(1, width));
      };

      const measureLines = (lines: string[], fontSize = 9, extra = 0) => (
        (lines.length ? lines.length * lineHeight(fontSize) : 0) + extra
      );

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight <= pageHeight - bottomMargin) return;
        doc.addPage();
        y = topMargin;
      };

      const drawTextLines = (
        lines: string[],
        x: number,
        top: number,
        fontSize = 9,
        fontStyle: 'normal' | 'bold' = 'normal',
        color: [number, number, number] = [0, 0, 0]
      ) => {
        if (!lines.length) return 0;
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(lines, x, top, { lineHeightFactor: 1.2 });
        doc.setTextColor(0, 0, 0);
        return measureLines(lines, fontSize);
      };

      const drawCenteredLines = (
        lines: string[],
        centerX: number,
        top: number,
        fontSize = 9,
        fontStyle: 'normal' | 'bold' = 'normal',
        color: [number, number, number] = [0, 0, 0]
      ) => {
        if (!lines.length) return 0;
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        lines.forEach((line, index) => {
          doc.text(line, centerX, top + (index * lineHeight(fontSize)), { align: 'center' });
        });
        doc.setTextColor(0, 0, 0);
        return measureLines(lines, fontSize);
      };

      const drawPanel = (x: number, top: number, width: number, height: number, title: string) => {
        doc.setDrawColor(0, 56, 168);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, top, width, height, 'FD');
        doc.setFillColor(0, 56, 168);
        doc.rect(x, top, width, panelHeaderHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(255, 255, 255);
        doc.text(normalizePdfText(title), x + 2.5, top + 5.2);
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(191, 219, 254);
        doc.line(x, top + panelHeaderHeight, x + width, top + panelHeaderHeight);
        return top + panelHeaderHeight + panelPadding;
      };

      const splitInterventionItemsPdf = (text: unknown) => normalizePdfText(text)
        .replace(/\n+/g, '|')
        .split(/\|/)
        .map(item => item.trim())
        .filter(Boolean);

      const measureInterventionBoxHeight = (items: string[], width: number, title: string) => {
        const normalizedItems = items.length ? items : ['No intervention provided.'];
        const titleHeight = measureLines(splitLines(title, width - 4, 8, 'bold'), 8, 1);
        const bodyHeight = normalizedItems.reduce((sum, item) => sum + measureLines(splitLines(item, width - 8, 8.1), 8.1, 1), 0);
        return titleHeight + bodyHeight + 4;
      };

      const drawInterventionBox = (x: number, top: number, width: number, title: string, items: string[]) => {
        const normalizedItems = items.length ? items : ['No intervention provided.'];
        let innerCursor = top + 3;

        innerCursor += drawTextLines(splitLines(title, width - 4, 8, 'bold'), x + 2, innerCursor, 8, 'bold', [0, 56, 168]) + 1;

        normalizedItems.forEach(item => {
          const lines = splitLines(item, width - 8, 8.1);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.1);
          doc.setTextColor(55, 65, 81);
          doc.text('•', x + 2, innerCursor);
          doc.text(lines, x + 6, innerCursor, { lineHeightFactor: 1.2 });
          innerCursor += measureLines(lines, 8.1, 1);
        });

        return innerCursor - top;
      };

      const measureKeyValueRowHeight = (
        width: number,
        label: string,
        value: string,
        options: { labelRatio?: number; labelFontSize?: number; valueFontSize?: number; valueBold?: boolean } = {}
      ) => {
        const labelRatio = options.labelRatio ?? 0.34;
        const labelWidth = width * labelRatio;
        const valueWidth = width - labelWidth;
        const labelLines = splitLines(label, labelWidth - 4, options.labelFontSize ?? 7.6, 'bold');
        const valueLines = splitLines(value, valueWidth - 4, options.valueFontSize ?? 8.2, options.valueBold ? 'bold' : 'normal');
        return Math.max(measureLines(labelLines, options.labelFontSize ?? 7.6, 2.4), measureLines(valueLines, options.valueFontSize ?? 8.2, 2.4));
      };

      const measureListRowHeight = (
        width: number,
        label: string,
        items: string[],
        options: { labelRatio?: number; labelFontSize?: number; valueFontSize?: number; emptyText?: string } = {}
      ) => {
        const labelRatio = options.labelRatio ?? 0.34;
        const labelWidth = width * labelRatio;
        const valueWidth = width - labelWidth;
        const normalizedItems = items.length ? items : [options.emptyText ?? 'Not provided'];
        const labelLines = splitLines(label, labelWidth - 4, options.labelFontSize ?? 7.6, 'bold');
        const valueLineHeight = options.valueFontSize ?? 8.1;
        const valueHeight = normalizedItems.reduce((sum, item) => sum + measureLines(splitLines(item, valueWidth - 8, valueLineHeight), valueLineHeight, 1), 0);
        return Math.max(measureLines(labelLines, options.labelFontSize ?? 7.6, 2.4), valueHeight + 2.4);
      };

      const drawKeyValueRow = (
        x: number,
        top: number,
        width: number,
        label: string,
        value: string,
        options: { labelRatio?: number; labelFontSize?: number; valueFontSize?: number; valueBold?: boolean; valueColor?: [number, number, number] } = {}
      ) => {
        const labelRatio = options.labelRatio ?? 0.34;
        const labelWidth = width * labelRatio;
        const valueWidth = width - labelWidth;
        const rowHeight = measureKeyValueRowHeight(width, label, value, options);
        const labelLines = splitLines(label, labelWidth - 4, options.labelFontSize ?? 7.6, 'bold');
        const valueLines = splitLines(value, valueWidth - 4, options.valueFontSize ?? 8.2, options.valueBold ? 'bold' : 'normal');

        doc.setDrawColor(191, 219, 254);
        doc.setFillColor(248, 250, 252);
        doc.rect(x, top, width, rowHeight, 'FD');
        doc.setFillColor(219, 234, 254);
        doc.rect(x, top, labelWidth, rowHeight, 'F');
        doc.setDrawColor(191, 219, 254);
        doc.line(x + labelWidth, top, x + labelWidth, top + rowHeight);
        drawTextLines(labelLines, x + 2, top + 3.1, options.labelFontSize ?? 7.6, 'bold', [0, 56, 168]);
        drawTextLines(valueLines, x + labelWidth + 2, top + 3.1, options.valueFontSize ?? 8.2, options.valueBold ? 'bold' : 'normal', options.valueColor ?? [17, 24, 39]);
        return rowHeight;
      };

      const drawListRow = (
        x: number,
        top: number,
        width: number,
        label: string,
        items: string[],
        options: { labelRatio?: number; labelFontSize?: number; valueFontSize?: number; emptyText?: string } = {}
      ) => {
        const labelRatio = options.labelRatio ?? 0.34;
        const labelWidth = width * labelRatio;
        const valueWidth = width - labelWidth;
        const normalizedItems = items.length ? items : [options.emptyText ?? 'Not provided'];
        const labelLines = splitLines(label, labelWidth - 4, options.labelFontSize ?? 7.6, 'bold');
        const valueLineHeight = options.valueFontSize ?? 8.1;
        const rowHeight = measureListRowHeight(width, label, normalizedItems, options);

        doc.setDrawColor(191, 219, 254);
        doc.setFillColor(248, 250, 252);
        doc.rect(x, top, width, rowHeight, 'FD');
        doc.setFillColor(219, 234, 254);
        doc.rect(x, top, labelWidth, rowHeight, 'F');
        doc.setDrawColor(191, 219, 254);
        doc.line(x + labelWidth, top, x + labelWidth, top + rowHeight);
        drawTextLines(labelLines, x + 2, top + 3.1, options.labelFontSize ?? 7.6, 'bold', [0, 56, 168]);

        let cursor = top + 3.1;
        normalizedItems.forEach(item => {
          const lines = splitLines(item, valueWidth - 8, valueLineHeight);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(valueLineHeight);
          doc.setTextColor(17, 24, 39);
          doc.text('-', x + labelWidth + 2, cursor);
          doc.text(lines, x + labelWidth + 6, cursor, { lineHeightFactor: 1.2 });
          cursor += measureLines(lines, valueLineHeight, 1);
        });
        doc.setTextColor(0, 0, 0);
        return rowHeight;
      };

      const drawBadge = (centerX: number, top: number, label: string) => {
        const text = normalizePdfText(label);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const badgeWidth = doc.getTextWidth(text) + 10;
        const badgeX = centerX - (badgeWidth / 2);
        doc.setDrawColor(0, 56, 168);
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(badgeX, top, badgeWidth, 5.6, 1, 1, 'FD');
        doc.setTextColor(0, 56, 168);
        doc.text(text, centerX, top + 3.8, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      };

      const getListItems = (text: string) => normalizePdfText(text)
        .split(/\s*(?:\||\n)\s*/)
        .map(item => item.trim())
        .filter(Boolean);

      const drawBulletList = (
        items: string[],
        x: number,
        top: number,
        width: number,
        fontSize = 8.1
      ) => {
        let cursor = top;
        items.forEach(item => {
          const lines = splitLines(item, width - 5, fontSize);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.text('-', x, cursor);
          doc.text(lines, x + 4, cursor, { lineHeightFactor: 1.2 });
          cursor += measureLines(lines, fontSize, 1);
        });
        return cursor - top;
      };

      const getSessionDateLabel = () => {
        if (!student.rawAssessmentData?.sessionDate) return 'N/A';
        try {
          const dateStr = student.rawAssessmentData.sessionDate;
          const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
          }
        } catch (error) {}
        return student.rawAssessmentData.sessionDate;
      };

      const getSessionTimeLabel = () => {
        if (!student.rawAssessmentData?.startTime || !student.rawAssessmentData?.endTime) return 'N/A';

        const formatTime = (timeStr: string) => {
          try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
            return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          } catch (error) {
            return timeStr;
          }
        };

        return `${formatTime(student.rawAssessmentData.startTime)} - ${formatTime(student.rawAssessmentData.endTime)}`;
      };

      const assessmentTypeLabel = student.rawAssessmentData?.assessmentType || 'N/A';
      const studentInfoRows = [
        ['Student Name', student.name],
        ['Grade & Section', `Grade ${student.gradeLevel}${student.section ? ` - ${student.section}` : ''}`],
        ['Assessment Type', assessmentTypeLabel],
        ['Passage Set', student.rawAssessmentData?.passageSet ? `Set ${student.rawAssessmentData.passageSet}` : 'N/A'],
        ['Assessment Date', getSessionDateLabel()],
        ['Assessment Time', getSessionTimeLabel()],
      ] as const;
      const resultRows = [
        ['Reading Speed', `${result.wpm} WPM`],
        ['Word Recognition', `${result.wordScore}%`],
        ['Comprehension', `${result.compScore}%`],
        ['Final Reading Profile', result.profile],
      ] as const;
      const rootCauseItems = getListItems(result.rootCause);
      const interventionItems = getListItems(result.intervention);
      const gstRows = (() => {
        const rows: Array<[string, string]> = [];
        if (student.gstRecords?.Filipino) {
          rows.push(['Filipino GST', `${student.gstRecords.Filipino.score} / 20`]);
          if (hasGstBreakdownComponents(student.gstRecords.Filipino.breakdown)) {
            rows.push([
              'Filipino Breakdown',
              `Literal ${student.gstRecords.Filipino.breakdown?.literal}, Inferential ${student.gstRecords.Filipino.breakdown?.inferential}, Critical ${student.gstRecords.Filipino.breakdown?.critical}`,
            ]);
          }
        }
        if (student.gstRecords?.English) {
          rows.push(['English GST', `${student.gstRecords.English.score} / 20`]);
          if (hasGstBreakdownComponents(student.gstRecords.English.breakdown)) {
            rows.push([
              'English Breakdown',
              `Literal ${student.gstRecords.English.breakdown?.literal}, Inferential ${student.gstRecords.English.breakdown?.inferential}, Critical ${student.gstRecords.English.breakdown?.critical}`,
            ]);
          }
        }
        if (!student.gstRecords?.Filipino && !student.gstRecords?.English && gstBreakdown) {
          rows.push(['Raw Total', `${gstBreakdown.total} / 20`]);
          rows.push([
            'Component Sum',
            `${gstBreakdown.componentTotal ?? (gstBreakdown.literal + gstBreakdown.inferential + gstBreakdown.critical)} / 20`,
          ]);
        }
        if (!rows.length) {
          rows.push(['GST Breakdown', 'Not provided']);
        }
        return rows;
      })();
      const guidanceBlocks = displayGuidance
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(rawLine => {
          const headingMatch = rawLine.match(/^---\s*(.+?)\s*---$/);
          if (headingMatch) {
            return { type: 'heading' as const, text: normalizePdfText(headingMatch[1]) };
          }
          if (/^(â€¢|•|-)\s*/.test(rawLine)) {
            return { type: 'bullet' as const, text: normalizePdfText(rawLine.replace(/^(â€¢|•|-)\s*/, '')) };
          }
          if (rawLine.endsWith(':') && rawLine === rawLine.toUpperCase()) {
            return { type: 'subheading' as const, text: normalizePdfText(rawLine.replace(':', '')) };
          }
          return { type: 'text' as const, text: normalizePdfText(rawLine) };
        });

      doc.setProperties({
        title: `${student.name} Phil-IRI Report`,
        subject: 'ReadAssist Academic Reading Profile',
        author: 'ReadAssist',
        creator: 'ReadAssist',
      });

      ensureSpace(55);
      drawCenteredLines(['Official School Report'], pageWidth / 2, y + 1.5, 9, 'bold', [0, 56, 168]);
      drawCenteredLines(['ReadAssist Academic Reading Profile'], pageWidth / 2, y + 7, 16, 'bold', [17, 24, 39]);
      drawCenteredLines(['Prepared for teacher review and school submission'], pageWidth / 2, y + 14.5, 9, 'normal', [75, 85, 99]);
      doc.setDrawColor(0, 56, 168);
      doc.setLineWidth(0.8);
      doc.line(marginX, y + 20, pageWidth - marginX, y + 20);
      y += 24;

      const bannerHeight = 39;
      ensureSpace(bannerHeight + 4);
      doc.setDrawColor(0, 0, 0);
      doc.rect(marginX, y, contentWidth, bannerHeight);
      doc.line(marginX, y + 18.5, pageWidth - marginX, y + 18.5);
      drawCenteredLines(['Department of Education'], pageWidth / 2, y + 4.5, 8.5, 'bold');
      drawCenteredLines(['Philippine Informal Reading Inventory (Phil-IRI)'], pageWidth / 2, y + 8.8, 11, 'bold');
      drawCenteredLines(['Individual Reading Profile Report'], pageWidth / 2, y + 13.5, 9.5, 'bold', [0, 56, 168]);
      drawBadge(pageWidth / 2, y + 15.3, `Assessment Type: ${assessmentTypeLabel}`);

      const infoCellGap = 3;
      const infoCellWidth = (contentWidth - (infoCellGap * 3)) / 4;
      const infoCellHeight = 12;
      [
        ['Student', student.name],
        ['Grade & Section', `Grade ${student.gradeLevel}${student.section ? ` - ${student.section}` : ''}`],
        ['Passage Set', student.rawAssessmentData?.passageSet ? `Set ${student.rawAssessmentData.passageSet}` : 'N/A'],
        ['Date', getSessionDateLabel()],
      ].forEach(([label, value], index) => {
        const cellX = marginX + (index * (infoCellWidth + infoCellGap));
        doc.setDrawColor(209, 213, 219);
        doc.setFillColor(249, 250, 251);
        doc.rect(cellX, y + 22, infoCellWidth, infoCellHeight, 'FD');
        drawTextLines(splitLines(label, infoCellWidth - 4, 7.5, 'bold'), cellX + 2, y + 25.2, 7.5, 'bold', [107, 114, 128]);
        drawTextLines(splitLines(value, infoCellWidth - 4, 8.2, 'bold'), cellX + 2, y + 29.6, 8.2, 'bold');
      });
      y += bannerHeight + 4;

      const halfWidth = (contentWidth - panelGap) / 2;
      const tableInnerWidth = halfWidth - (panelPadding * 2);

      const studentPanelHeight = panelHeaderHeight + (panelPadding * 2) + studentInfoRows.reduce((sum, [label, value], index) => (
        sum + measureKeyValueRowHeight(tableInnerWidth, label, value, { labelRatio: 0.36, valueBold: index === 0 }) + (index < studentInfoRows.length - 1 ? 1 : 0)
      ), 0);

      const resultsPanelHeight = panelHeaderHeight + (panelPadding * 2) + resultRows.reduce((sum, [label, value], index) => (
        sum + measureKeyValueRowHeight(tableInnerWidth, label, value, { labelRatio: 0.38, valueBold: index < 3, valueFontSize: index < 3 ? 8.8 : 8.4, valueColor: index < 3 ? [0, 56, 168] : [17, 24, 39] }) + (index < resultRows.length - 1 ? 1 : 0)
      ), 0);
      const firstRowHeight = Math.max(studentPanelHeight, resultsPanelHeight);
      ensureSpace(firstRowHeight + 4);
      const firstRowTop = y;

      let cursor = drawPanel(marginX, firstRowTop, halfWidth, firstRowHeight, 'I. Student Information');
      studentInfoRows.forEach(([label, value], index) => {
        cursor += drawKeyValueRow(marginX + panelPadding, cursor, tableInnerWidth, label, value, {
          labelRatio: 0.36,
          valueBold: index === 0,
        });
        if (index < studentInfoRows.length - 1) {
          cursor += 1;
        }
      });

      cursor = drawPanel(marginX + halfWidth + panelGap, firstRowTop, halfWidth, firstRowHeight, 'II. Assessment Results');
      resultRows.forEach(([label, value], index) => {
        cursor += drawKeyValueRow(marginX + halfWidth + panelGap + panelPadding, cursor, tableInnerWidth, label, value, {
          labelRatio: 0.38,
          valueBold: true,
          valueFontSize: index < 3 ? 8.8 : 8.4,
          valueColor: index < 3 ? [0, 56, 168] : [17, 24, 39],
        });
        if (index < resultRows.length - 1) {
          cursor += 1;
        }
      });
      y += firstRowHeight + 4;

      const gstInnerWidth = halfWidth - (panelPadding * 2);
      const gstPanelHeight = panelHeaderHeight + (panelPadding * 2) + gstRows.reduce((sum, [label, value], index) => (
        sum + measureKeyValueRowHeight(gstInnerWidth, label, value, { labelRatio: 0.38, valueFontSize: 8 }) + (index < gstRows.length - 1 ? 1 : 0)
      ), 0);

      const diagnosticInnerWidth = halfWidth - (panelPadding * 2);
      const diagnosticPanelHeight = panelHeaderHeight + (panelPadding * 2)
        + measureKeyValueRowHeight(diagnosticInnerWidth, 'Primary Issue(s) Identified', primaryIssueLabel, { labelRatio: 0.38, valueBold: true, valueFontSize: 8.2 }) + 1
        + measureListRowHeight(diagnosticInnerWidth, 'Root Cause Analysis', rootCauseItems.length ? rootCauseItems : ['No root cause identified.'], { labelRatio: 0.38, valueFontSize: 8.1 }) + 1
        + measureKeyValueRowHeight(diagnosticInnerWidth, 'Expert System Explanation', result.explanation, { labelRatio: 0.38, valueFontSize: 8.1 });
      const secondRowHeight = Math.max(gstPanelHeight, diagnosticPanelHeight);
      ensureSpace(secondRowHeight + 4);
      const secondRowTop = y;

      cursor = drawPanel(marginX, secondRowTop, halfWidth, secondRowHeight, 'III. GST Screening Record');
      gstRows.forEach(([label, value], index) => {
        cursor += drawKeyValueRow(marginX + panelPadding, cursor, gstInnerWidth, label, value, {
          labelRatio: 0.38,
          valueFontSize: 8,
        });
        if (index < gstRows.length - 1) {
          cursor += 1;
        }
      });

      cursor = drawPanel(marginX + halfWidth + panelGap, secondRowTop, halfWidth, secondRowHeight, 'IV. Diagnostic Analysis');
      cursor += drawKeyValueRow(marginX + halfWidth + panelGap + panelPadding, cursor, diagnosticInnerWidth, 'Primary Issue(s) Identified', primaryIssueLabel, {
        labelRatio: 0.38,
        valueBold: true,
        valueFontSize: 8.2,
      });
      cursor += 1;
      cursor += drawListRow(marginX + halfWidth + panelGap + panelPadding, cursor, diagnosticInnerWidth, 'Root Cause Analysis', rootCauseItems.length ? rootCauseItems : ['No root cause identified.'], {
        labelRatio: 0.38,
        valueFontSize: 8.1,
      });
      cursor += 1;
      cursor += drawKeyValueRow(marginX + halfWidth + panelGap + panelPadding, cursor, diagnosticInnerWidth, 'Expert System Explanation', result.explanation, {
        labelRatio: 0.38,
        valueFontSize: 8.1,
      });
      y += secondRowHeight + 4;

      const remedialInnerWidth = (contentWidth - (panelPadding * 2) - columnGap) / 2;
      const interventionBoxHeight = 5 + measureLines(splitLines('Recommended Intervention', remedialInnerWidth - 4, 8, 'bold'), 8) + interventionItems.reduce(
        (sum, item) => sum + measureLines(splitLines(item, remedialInnerWidth - 9, 8.1), 8.1, 1),
        0
      );
      const guidanceBoxHeight = (() => {
        let total = 5 + measureLines(splitLines('Detailed Guidance', remedialInnerWidth - 4, 8, 'bold'), 8);
        guidanceBlocks.forEach(block => {
          if (block.type === 'heading' || block.type === 'subheading') {
            total += measureLines(splitLines(block.text, remedialInnerWidth - 4, 8.1, 'bold'), 8.1, 1);
            return;
          }
          if (block.type === 'bullet') {
            total += measureLines(splitLines(block.text, remedialInnerWidth - 9, 8.1), 8.1, 1);
            return;
          }
          total += measureLines(splitLines(block.text, remedialInnerWidth - 4, 8.1), 8.1, 1);
        });
        return total;
      })();
      const remedialPanelHeight = panelHeaderHeight + (panelPadding * 2) + Math.max(interventionBoxHeight, guidanceBoxHeight);
      ensureSpace(remedialPanelHeight + 4);
      const remedialTop = y;
      cursor = drawPanel(marginX, remedialTop, contentWidth, remedialPanelHeight, 'V. Remedial Action Plan');
      const leftBoxX = marginX + panelPadding;
      const rightBoxX = leftBoxX + remedialInnerWidth + columnGap;
      const boxHeight = Math.max(interventionBoxHeight, guidanceBoxHeight);
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(249, 250, 251);
      doc.rect(leftBoxX, cursor, remedialInnerWidth, boxHeight, 'FD');
      doc.rect(rightBoxX, cursor, remedialInnerWidth, boxHeight, 'FD');

      let innerCursor = cursor + 3;
      innerCursor += drawTextLines(splitLines('Recommended Intervention', remedialInnerWidth - 4, 8, 'bold'), leftBoxX + 2, innerCursor, 8, 'bold') + 1;
      drawBulletList(interventionItems, leftBoxX + 2, innerCursor, remedialInnerWidth - 4, 8.1);

      innerCursor = cursor + 3;
      innerCursor += drawTextLines(splitLines('Detailed Guidance', remedialInnerWidth - 4, 8, 'bold'), rightBoxX + 2, innerCursor, 8, 'bold') + 1;
      guidanceBlocks.forEach(block => {
        if (block.type === 'heading' || block.type === 'subheading') {
          innerCursor += drawTextLines(splitLines(block.text, remedialInnerWidth - 4, 8.1, 'bold'), rightBoxX + 2, innerCursor, 8.1, 'bold') + 0.5;
          return;
        }
        if (block.type === 'bullet') {
          const lines = splitLines(block.text, remedialInnerWidth - 9, 8.1);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.1);
          doc.text('-', rightBoxX + 2, innerCursor);
          doc.text(lines, rightBoxX + 6, innerCursor, { lineHeightFactor: 1.2 });
          innerCursor += measureLines(lines, 8.1, 1);
          return;
        }
        innerCursor += drawTextLines(splitLines(block.text, remedialInnerWidth - 4, 8.1), rightBoxX + 2, innerCursor, 8.1) + 0.5;
      });
      y += remedialPanelHeight + 4;

      if (hasGrowthData) {
        const growthRows = [
          ['Reading Speed', `Pre: ${student.preTest.result.wpm} WPM | Post: ${student.postTest.result.wpm} WPM`],
          ['Word Recognition', `Pre: ${student.preTest.result.wordScore}% | Post: ${student.postTest.result.wordScore}%`],
          ['Comprehension', `Pre: ${student.preTest.result.compScore}% | Post: ${student.postTest.result.compScore}%`],
          ['Overall Profile Shift', `${student.preTest.result.profile} -> ${student.postTest.result.profile}`],
        ] as const;
        const growthPanelContentWidth = contentWidth - (panelPadding * 2);
        const narrativeLines = splitLines(growthNarrative, growthPanelContentWidth - 4, 8.1);
        const narrativeHeight = measureLines(narrativeLines, 8.1, 3);
        const growthPanelHeight = panelHeaderHeight + (panelPadding * 2) + growthRows.reduce((sum, [label, value], index) => (
          sum + measureKeyValueRowHeight(growthPanelContentWidth, label, value, {
            labelRatio: 0.38,
            valueBold: index === growthRows.length - 1,
            valueFontSize: 8.1,
            valueColor: index === growthRows.length - 1 ? [0, 56, 168] : [17, 24, 39],
          }) + (index < growthRows.length - 1 ? 1 : 0)
        ), 0) + narrativeHeight + 7;
        ensureSpace(growthPanelHeight + 4);
        const growthTop = y;
        cursor = drawPanel(marginX, growthTop, contentWidth, growthPanelHeight, 'VI. Growth Report (Pre-test vs Post-test)');
        growthRows.forEach(([label, value], index) => {
          cursor += drawKeyValueRow(marginX + panelPadding, cursor, growthPanelContentWidth, label, value, {
            labelRatio: 0.38,
            valueBold: index === growthRows.length - 1,
            valueFontSize: 8.1,
            valueColor: index === growthRows.length - 1 ? [0, 56, 168] : [17, 24, 39],
          });
          if (index < growthRows.length - 1) {
            cursor += 1;
          }
        });
        cursor += 2;
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(191, 219, 254);
        doc.rect(marginX + panelPadding, cursor, growthPanelContentWidth, narrativeHeight + 4, 'FD');
        const narrativeHeaderLines = splitLines('Narrative Summary', growthPanelContentWidth - 4, 8, 'bold');
        cursor += drawTextLines(narrativeHeaderLines, marginX + panelPadding + 2, cursor + 3, 8, 'bold', [0, 56, 168]) + 1;
        drawTextLines(narrativeLines, marginX + panelPadding + 2, cursor, 8.1, 'normal', [75, 85, 99]);
        y += growthPanelHeight + 4;
      } else {
        const noticeLines = splitLines(growthAvailabilityText, contentWidth - (panelPadding * 2) - 4, 8.8);
        const noticeHeight = panelHeaderHeight + (panelPadding * 2) + measureLines(noticeLines, 8.8, 2.5);
        ensureSpace(noticeHeight + 4);
        const noticeTop = y;
        const noticeCursor = drawPanel(marginX, noticeTop, contentWidth, noticeHeight, 'VI. Growth Report (Pre-test vs Post-test)');
        drawTextLines(noticeLines, marginX + panelPadding + 2, noticeCursor, 8.8, 'normal', [55, 65, 81]);
        y += noticeHeight + 4;
      }

      if (hasGrowthData) {
        const interventionBoxWidth = (contentWidth - (panelPadding * 2) - columnGap) / 2;
        const preInterventionItems = splitInterventionItemsPdf(student.preTest.result.intervention);
        const postInterventionItems = splitInterventionItemsPdf(student.postTest.result.intervention);
        const preInterventionHeight = measureInterventionBoxHeight(preInterventionItems, interventionBoxWidth, 'Pre-test Primary Intervention');
        const postInterventionHeight = measureInterventionBoxHeight(postInterventionItems, interventionBoxWidth, 'Post-test Primary Intervention');
        const interventionBoxHeight = Math.max(preInterventionHeight, postInterventionHeight);
        const interventionPanelHeight = panelHeaderHeight + (panelPadding * 2) + interventionBoxHeight;

        ensureSpace(interventionPanelHeight + 4);
        const interventionTop = y;
        cursor = drawPanel(marginX, interventionTop, contentWidth, interventionPanelHeight, 'VII. Intervention Comparison');

        const leftBoxX = marginX + panelPadding;
        const rightBoxX = leftBoxX + interventionBoxWidth + columnGap;
        doc.setDrawColor(209, 213, 219);
        doc.setFillColor(249, 250, 251);
        doc.rect(leftBoxX, cursor, interventionBoxWidth, interventionBoxHeight, 'FD');
        doc.rect(rightBoxX, cursor, interventionBoxWidth, interventionBoxHeight, 'FD');
        drawInterventionBox(leftBoxX, cursor, interventionBoxWidth, 'Pre-test Primary Intervention', preInterventionItems);
        drawInterventionBox(rightBoxX, cursor, interventionBoxWidth, 'Post-test Primary Intervention', postInterventionItems);
        y += interventionPanelHeight + 4;
      }

      const footerHeight = 18;
      ensureSpace(footerHeight + 8);
      const footerTop = y;
      doc.setDrawColor(0, 0, 0);
      doc.rect(marginX, footerTop, contentWidth, footerHeight);
      const signatureWidth = (contentWidth - 8) / 2;
      doc.line(marginX + signatureWidth + 4, footerTop + 2, marginX + signatureWidth + 4, footerTop + footerHeight - 6);
      doc.line(marginX + 6, footerTop + 8, marginX + signatureWidth - 2, footerTop + 8);
      doc.line(marginX + signatureWidth + 10, footerTop + 8, pageWidth - marginX - 6, footerTop + 8);
      drawCenteredLines(['Reading Teacher / Adviser'], marginX + (signatureWidth / 2), footerTop + 11.8, 8.1, 'bold');
      drawCenteredLines(['School Principal / Head'], marginX + signatureWidth + 8 + (signatureWidth / 2), footerTop + 11.8, 8.1, 'bold');
      doc.setDrawColor(209, 213, 219);
      doc.line(marginX, footerTop + footerHeight + 2.5, pageWidth - marginX, footerTop + footerHeight + 2.5);
      drawCenteredLines(
        [`Generated by ReadAssist Expert System - ${new Date().toLocaleDateString()} - Confidential School Record`],
        pageWidth / 2,
        footerTop + footerHeight + 6,
        7.8,
        'normal',
        [107, 114, 128]
      );

      downloadBlobFile(fileName, doc.output('blob'));
      toast.success('PDF download started.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate PDF report.';
      toast.error(message);
    } finally {
      setIsGeneratingPdf(false);
      toast.dismiss(loadingToast);
    }
  };

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'Independent': return 'text-green-700 bg-green-100 border-green-200';
      case 'Instructional': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Frustration': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getProfileIcon = (profile: string) => {
    switch (profile) {
      case 'Independent': return <CheckCircle className="text-green-600" size={32} />;
      case 'Instructional': return <Info className="text-yellow-600" size={32} />;
      case 'Frustration': return <AlertTriangle className="text-red-600" size={32} />;
      default: return null;
    }
  };

  return (
    <div className={`w-full pb-12 print:p-0 print:m-0 print:pb-0 ${isGeneratingPdf ? 'pdf-generating' : ''}`}>
      
      {/* Main UI - Hidden during print */}
      <div ref={uiRef} className="print-ui px-4 md:px-8 max-w-[1600px] mx-auto">
        {/* Top Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <button 
            onClick={() => {
              toast('Returning to roster.');
              onBack();
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-[#0038A8] font-semibold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow"
          >
            <ArrowLeft size={20} />
            Back to Roster
          </button>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                toast('Opening assessment editor.');
                onEdit();
              }}
              className="flex items-center gap-2 bg-white text-[#0038A8] border border-[#0038A8] px-4 py-2 rounded-xl hover:bg-blue-50 font-semibold transition-colors shadow-sm"
            >
              <Edit size={20} />
              Edit Assessment
            </button>
            <button 
              onClick={handleDownloadPDFStructured}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 bg-[#0038A8] text-white px-4 py-2 rounded-xl hover:bg-blue-800 font-semibold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
            >
              <Download size={20} />
              {isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF'}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 font-semibold transition-colors shadow-sm"
            >
              <Printer size={20} />
              Print Report
            </button>
          </div>
        </div>

        {/* Colorful UI Report Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 break-inside-avoid">
          <div className="flex items-center gap-5">
            <div className="bg-blue-50 text-[#0038A8] p-4 rounded-2xl hidden sm:block">
              <User size={36} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Student Profile</p>
                {student.rawAssessmentData?.assessmentType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0038A8] text-white text-xs font-bold uppercase tracking-wider">
                    {student.rawAssessmentData.assessmentType}
                  </span>
                )}
                {student.rawAssessmentData?.passageSet && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider">
                    Set {student.rawAssessmentData.passageSet}
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{student.name}</h2>
              <p className="text-gray-600 mt-2 font-medium text-lg">Grade {student.gradeLevel}{student.section ? ` - ${student.section}` : ''}</p>
              {student.rawAssessmentData?.sessionDate && (
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-gray-500 text-sm flex items-center gap-1.5">
                    <Calendar size={14} />
                    {(() => {
                      try {
                        const dateStr = student.rawAssessmentData.sessionDate;
                        const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                        }
                      } catch (e) {}
                      return student.rawAssessmentData.sessionDate;
                    })()}
                  </p>
                  {student.rawAssessmentData.startTime && student.rawAssessmentData.endTime && (
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                      <Clock size={14} />
                      {(() => {
                        const formatTime = (timeStr: string) => {
                          try {
                            const [h, m] = timeStr.split(':');
                            const d = new Date();
                            d.setHours(parseInt(h, 10), parseInt(m, 10));
                            return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                          } catch (e) {
                            return timeStr;
                          }
                        };
                        return `${formatTime(student.rawAssessmentData.startTime)} - ${formatTime(student.rawAssessmentData.endTime)}`;
                      })()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-4 px-6 py-5 rounded-2xl border-2 w-full md:w-auto justify-center md:justify-start ${getProfileColor(result.profile)}`}>
            {getProfileIcon(result.profile)}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">Final Reading Profile</p>
              <p className="text-2xl font-black tracking-tight">{result.profile}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-8 break-inside-avoid">
          <div className="flex items-center gap-2 mb-3 text-[#0038A8] font-bold uppercase tracking-wider text-xs">
            <BrainCircuit size={16} />
            GST Breakdown
          </div>
          {student.gstRecords ? (
            <div className="space-y-3 text-sm text-gray-700 font-medium leading-6">
              {student.gstRecords.Filipino && (
                <div>
                  <p>Filipino GST: <span className="font-semibold text-gray-900">{student.gstRecords.Filipino.score} / 20</span></p>
                  {hasGstBreakdownComponents(student.gstRecords.Filipino.breakdown) && (
                    <p className="text-xs text-gray-500">Literal {student.gstRecords.Filipino.breakdown.literal}, Inferential {student.gstRecords.Filipino.breakdown.inferential}, Critical {student.gstRecords.Filipino.breakdown.critical}</p>
                  )}
                </div>
              )}
              {student.gstRecords.English && (
                <div>
                  <p>English GST: <span className="font-semibold text-gray-900">{student.gstRecords.English.score} / 20</span></p>
                  {hasGstBreakdownComponents(student.gstRecords.English.breakdown) && (
                    <p className="text-xs text-gray-500">Literal {student.gstRecords.English.breakdown.literal}, Inferential {student.gstRecords.English.breakdown.inferential}, Critical {student.gstRecords.English.breakdown.critical}</p>
                  )}
                </div>
              )}
            </div>
          ) : gstBreakdown ? (
            <>
              <div className="space-y-1 text-sm text-gray-700 font-medium leading-6">
                <p>Literal: <span className="font-semibold text-gray-900">{gstBreakdown.literal}</span></p>
                <p>Inferential: <span className="font-semibold text-gray-900">{gstBreakdown.inferential}</span></p>
                <p>Critical: <span className="font-semibold text-gray-900">{gstBreakdown.critical}</span></p>
              </div>
              <p className="text-sm text-gray-600 mt-3">Component Sum: <span className="font-bold text-gray-900">{gstBreakdown.componentTotal ?? (gstBreakdown.literal + gstBreakdown.inferential + gstBreakdown.critical)} / 20</span></p>
            </>
          ) : (
            <p className="text-sm text-gray-600">GST component breakdown not provided.</p>
          )}
          <p className="text-sm text-gray-600 mt-1">Raw Total: <span className="font-bold text-gray-900">{student.gstScore} / 20</span></p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Quantitative Results */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 break-inside-avoid">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                  <Activity size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quantitative Results</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Clock className="text-gray-400" size={20} />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Reading Speed</span>
                        <MetricTooltip
                          title="How this metric is calculated"
                          lines={[
                            'Reading speed = (total passage words / time in seconds) × 60.',
                            'The system rounds the result to the nearest whole number.',
                          ]}
                        />
                      </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#0038A8]">{result.wpm}</span>
                    <span className="text-xs text-gray-500 ml-1 font-bold">WPM</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText className="text-gray-400" size={20} />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Word Recognition</span>
                        <MetricTooltip
                          title="How this metric is calculated"
                          lines={[
                            'Word recognition = ((total passage words - total miscues) / total passage words) × 100.',
                            'The system rounds the result to the nearest whole number.',
                          ]}
                        />
                      </div>
                  </div>
                  <span className="text-2xl font-black text-[#0038A8]">{result.wordScore}%</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="text-gray-400" size={20} />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Comprehension</span>
                        <MetricTooltip
                          title="How this metric is calculated"
                          lines={[
                            'Comprehension = (correct quiz answers / total quiz questions) × 100.',
                            'The system rounds the result to the nearest whole number.',
                          ]}
                        />
                      </div>
                  </div>
                  <span className="text-2xl font-black text-[#0038A8]">{result.compScore}%</span>
                </div>
              </div>
            </div>

            {/* Expert Analysis */}
            <div className="bg-gradient-to-br from-blue-50 to-[#eef2ff80] rounded-2xl shadow-sm border border-[#bfdbfe80] p-6 md:p-8 break-inside-avoid">
              <div className="flex items-center gap-3 mb-3 border-b border-[#bfdbfe80] pb-3">
                <div className="bg-white p-2 rounded-lg text-[#0038A8] shadow-sm">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Expert Analysis</h3>
              </div>
              <p className="text-gray-800 leading-relaxed text-base font-medium">{result.explanation}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8">
            {/* Remedial Action Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4 break-inside-avoid">
                <div className="bg-blue-50 p-2 rounded-lg text-[#0038A8]">
                  <Target size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Remedial Action Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 break-inside-avoid">
                <div className="bg-gradient-to-br from-red-50 to-[#ffe4e699] rounded-2xl p-6 md:p-8 border border-red-200 shadow-sm relative overflow-visible">
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.07]">
                    <AlertTriangle size={120} />
                  </div>
                  <div className="flex items-center gap-2.5 mb-4 relative z-10 overflow-visible">
                    <div className="bg-red-100 p-1.5 rounded-lg text-red-600">
                      <AlertTriangle size={18} strokeWidth={2.5} />
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <p className="text-xs text-red-700 font-bold uppercase tracking-widest">
                        {primaryIssueLabel.includes('&') ? 'Primary Issues Identified' : 'Primary Issue Identified'}
                      </p>
                      <div className="group relative inline-flex items-center justify-center z-30 isolate">
                        <HelpCircle size={13} className="text-red-500 cursor-help" />
                        <div className={tooltipBaseClass}>
                          This is the main result the system chose from the student&apos;s scores and reading pattern.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col gap-3">
                    {(() => {
                      const match = primaryIssueLabel.match(/^(.*?)(?:\s*\((.*?)\))?$/);
                      const issuesText = match ? match[1] : primaryIssueLabel;
                      const tallyText = match ? match[2] : null;
                      const issues = issuesText.split('&').map(s => s.trim()).filter(Boolean);

                      return (
                        <>
                          <ul className="space-y-2.5">
                            {issues.map((issue, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                <span className="text-lg font-bold text-gray-900 leading-snug">{issue}</span>
                              </li>
                            ))}
                          </ul>
                          {tallyText && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#fee2e2cc] text-red-800 text-xs font-bold uppercase tracking-wider w-fit mt-1 border border-[#fecaca80]">
                              {tallyText}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="relative z-10 mt-5 rounded-xl border border-red-100 bg-white/80 p-4">
                    <div className="inline-flex items-center gap-2 text-red-700 font-bold text-[11px] mb-2">
                      <span>Reason for result</span>
                      <div className="group relative inline-flex items-center justify-center z-30 isolate">
                        <HelpCircle size={14} className="cursor-help" />
                        <div className={tooltipBaseClass}>
                          The system shows this because it found the strongest reading result from the assessment.
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {primaryIssueSourceText}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-[#fef3c799] rounded-2xl p-6 md:p-8 border border-orange-200 shadow-sm relative overflow-visible">
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.07]">
                    <BrainCircuit size={120} />
                  </div>
                  <div className="flex items-center gap-2.5 mb-4 relative z-10 overflow-visible">
                    <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                      <BrainCircuit size={18} strokeWidth={2.5} />
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <p className="text-xs text-orange-800 font-bold uppercase tracking-widest">
                        {rootCauseText.includes('\n') || rootCauseText.includes('|') ? 'Diagnosed Root Causes' : 'Diagnosed Root Cause'}
                      </p>
                      <div className="group relative inline-flex items-center justify-center z-30 isolate">
                        <HelpCircle size={13} className="text-orange-500 cursor-help" />
                        <div className={tooltipBaseClass}>
                          This explains the likely reason behind the result, based on the reading pattern and handbook rule.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col gap-2">
                    {rootCauseText.split(/\s*(?:\||\n)\s*/).filter(Boolean).map((cause, i) => {
                      const colonIdx = cause.indexOf(':');
                      if (colonIdx !== -1) {
                        const name = cause.substring(0, colonIdx);
                        const desc = cause.substring(colonIdx + 1);
                        return (
                          <p key={i} className="text-sm md:text-base text-gray-800 leading-snug">
                            <span className="font-bold text-gray-900">{name}:</span>{desc}
                          </p>
                        );
                      }
                      return (
                        <p key={i} className="text-sm md:text-base text-gray-800 leading-snug font-medium">
                          {cause}
                        </p>
                      );
                    })}
                  </div>
                  <div className="relative z-10 mt-5 rounded-xl border border-orange-100 bg-white/80 p-4">
                    <div className="inline-flex items-center gap-2 text-orange-700 font-bold text-[11px] mb-2">
                      <span>Reason for diagnosis</span>
                      <div className="group relative inline-flex items-center justify-center z-30 isolate">
                        <HelpCircle size={14} className="cursor-help" />
                        <div className={tooltipBaseClass}>
                          The system shows this because it matched the strongest reading pattern with the handbook guide.
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {rootCauseSourceText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="break-inside-avoid">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-4 ml-1">
                  {interventionText.includes('\n') || interventionText.includes('|') ? interventionSectionTitle.replace('Intervention', 'Interventions') : interventionSectionTitle}
                </p>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl shrink-0 shadow-inner">
                      <Lightbulb size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg md:text-xl text-gray-800 leading-snug mb-5 flex flex-col gap-3">
                        {interventionText.split(/\s*(?:\||\n)\s*/).filter(Boolean).map((inv, i) => {
                          const colonIdx = inv.indexOf(':');
                          if (colonIdx !== -1) {
                            const name = inv.substring(0, colonIdx);
                            const desc = inv.substring(colonIdx + 1);
                            return (
                              <p key={i}><span className="font-bold text-gray-900">{name}:</span><span className="font-semibold text-gray-800">{desc}</span></p>
                            );
                          }
                          return <p key={i} className="font-bold text-gray-900">{inv}</p>;
                        })}
                      </div>
                      <div className="rounded-xl border border-yellow-100 bg-yellow-50/70 p-4 mb-5">
                        <div className="inline-flex items-center gap-2 text-yellow-700 font-bold text-[11px] mb-2">
                          <span>Reason for support</span>
                          <div className="group relative inline-flex items-center justify-center z-30 isolate">
                            <HelpCircle size={14} className="cursor-help" />
                            <div className={tooltipBaseClass}>
                              This is the help the system suggests to match the student&apos;s reading need.
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {interventionSourceText}
                        </p>
                      </div>
                      <div className="pt-5 border-t border-gray-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{guidanceSectionTitle}</p>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                          {isIndependentReader
                            ? 'This section provides an instructional next step for a student who has already reached the current level.'
                            : 'This section combines the comprehension intervention with teacher-led support strategies and any observed reading behaviors recorded during the assessment.'}
                        </p>
                        {formatGuidanceText(displayGuidance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Report Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 break-inside-avoid">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <Activity size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Growth Report (Pre-test vs Post-test)</h3>
            </div>
            {hasGrowthData ? (
              <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Reading Speed</p>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Pre-test</span>
                    <span className="text-xl font-bold text-gray-700">{student.preTest.result.wpm} WPM</span>
                  </div>
                  <div className="text-gray-300 mb-1">→</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Post-test</span>
                    <span className="text-2xl font-black text-[#0038A8]">{student.postTest.result.wpm} WPM</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Word Recognition</p>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Pre-test</span>
                    <span className="text-xl font-bold text-gray-700">{student.preTest.result.wordScore}%</span>
                  </div>
                  <div className="text-gray-300 mb-1">→</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Post-test</span>
                    <span className="text-2xl font-black text-[#0038A8]">{student.postTest.result.wordScore}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Comprehension</p>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Pre-test</span>
                    <span className="text-xl font-bold text-gray-700">{student.preTest.result.compScore}%</span>
                  </div>
                  <div className="text-gray-300 mb-1">→</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Post-test</span>
                    <span className="text-2xl font-black text-[#0038A8]">{student.postTest.result.compScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-4 bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">Overall Profile Shift</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-600 uppercase">{student.preTest.result.profile}</span>
                    <ArrowLeft size={16} className="text-blue-400 rotate-180" />
                    <span className="text-2xl font-black text-[#0038A8] uppercase">{student.postTest.result.profile}</span>
                  </div>
                </div>
                {student.postTest.result.profile === 'Independent' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-100 px-4 py-2 rounded-lg font-bold">
                    <CheckCircle size={20} />
                    Target Reached
                  </div>
                )}
              </div>
              <div className="border-t border-blue-100 pt-4">
                <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Narrative Summary</p>
                <p className="text-sm md:text-base leading-relaxed text-slate-700">
                  {growthNarrative}
                </p>
              </div>
              <div className="border-t border-blue-100 pt-4">
                <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3">Intervention Comparison</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8] mb-3">Pre-test Primary Intervention</p>
                    {renderInterventionItems(preTestIntervention, 'No pre-test intervention available.')}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8] mb-3">Post-test Primary Intervention</p>
                    {renderInterventionItems(postTestIntervention, 'No post-test intervention available.')}
                  </div>
                </div>
              </div>
            </div>
              </>
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Not Yet Available</p>
                <p className="text-sm md:text-base leading-relaxed text-slate-700">
                  {growthAvailabilityText}
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Academic Report - Visible during print, or when generating PDF */}
      <div
        ref={pdfRef}
        className={`print-academic bg-white text-black w-[210mm] min-h-[297mm] mx-auto px-8 py-8 font-sans ${isGeneratingPdf ? 'block pdf-sheet' : 'hidden'}`}
      >
        <div className="space-y-6">
          <section className="report-document-header border-b-4 border-[#0038A8] pb-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#0038A8]">Official School Report</p>
              <h1 className="text-lg font-black uppercase tracking-[0.22em] text-gray-900">ReadAssist Academic Reading Profile</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">Prepared for teacher review and school submission</p>
            </div>
          </section>

          <section className="report-banner border-2 border-black px-6 py-5 rounded-sm bg-white pdf-card">
            <div className="text-center space-y-2 border-b-2 border-[#0038A8] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em]">Department of Education</p>
              <h1 className="text-xl font-bold uppercase tracking-wide leading-tight">Philippine Informal Reading Inventory (Phil-IRI)</h1>
              <h2 className="text-base font-semibold uppercase tracking-[0.22em] text-[#0038A8]">Individual Reading Profile Report</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#0038A8] text-xs font-bold uppercase tracking-wider bg-[#dbeafe] text-[#0038A8] mx-auto mt-2 rounded-sm">
                <span>Assessment Type:</span>
                <span>{student.rawAssessmentData?.assessmentType || 'N/A'}</span>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-[0.22em]">Teacher Submission Copy</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {[
                ['Student', student.name],
                ['Grade & Section', `Grade ${student.gradeLevel}${student.section ? ` - ${student.section}` : ''}`],
                ['Passage Set', student.rawAssessmentData?.passageSet ? `Set ${student.rawAssessmentData.passageSet}` : 'N/A'],
                ['Date', (() => {
                  if (!student.rawAssessmentData?.sessionDate) return 'N/A';
                  try {
                    const dateStr = student.rawAssessmentData.sessionDate;
                    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
                    if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  } catch (error) {}
                  return student.rawAssessmentData.sessionDate;
                })()],
              ].map(([label, value]) => (
                <div key={label} className="border border-gray-300 bg-gray-50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="report-section grid grid-cols-1 xl:grid-cols-2 gap-4 pdf-card break-inside-avoid">
            <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white">
              <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">I. Student Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="font-bold">Name:</span> {student.name}</div>
                <div><span className="font-bold">Grade & Section:</span> Grade {student.gradeLevel}{student.section ? ` - ${student.section}` : ''}</div>
                <div><span className="font-bold">Assessment Type:</span> {student.rawAssessmentData?.assessmentType || 'N/A'}</div>
                <div><span className="font-bold">Passage Set:</span> {student.rawAssessmentData?.passageSet ? `Set ${student.rawAssessmentData.passageSet}` : 'N/A'}</div>
              </div>
            </div>

            <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white">
              <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">II. Assessment Results</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Reading Speed', `${result.wpm}`, 'WPM'],
                  ['Word Recognition', `${result.wordScore}`, '%'],
                  ['Comprehension', `${result.compScore}`, '%'],
                ].map(([label, value, unit]) => (
                  <div key={label} className="bg-gray-50 border border-gray-200 px-3 py-3 text-center">
                    <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-gray-500 leading-tight [overflow-wrap:anywhere] min-h-8 flex items-center justify-center">{label}</p>
                    <p className="text-2xl font-black text-[#0038A8] leading-none mt-2">{value}<span className="text-xs font-bold text-gray-500 ml-1">{unit}</span></p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-2 border-black px-3 py-2 text-center bg-white">
                <span className="font-bold uppercase mr-2 text-sm">Final Reading Profile:</span>
                <span className="font-black uppercase text-base tracking-wide">{result.profile}</span>
              </div>
            </div>
          </section>

          <section className="report-section grid grid-cols-1 lg:grid-cols-2 gap-4 pdf-card break-inside-avoid">
            <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white">
              <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">III. GST Screening Record</h4>
              <div className="space-y-3 text-sm">
                {student.gstRecords?.Filipino && (
                  <div className="border border-gray-300 bg-gray-50 p-3">
                    <p className="font-bold uppercase tracking-wide text-[11px] mb-1">Filipino</p>
                    <p><span className="font-semibold">Raw Score:</span> {student.gstRecords.Filipino.score} / 20</p>
                    {hasGstBreakdownComponents(student.gstRecords.Filipino.breakdown) && (
                      <p><span className="font-semibold">Breakdown:</span> {`L${student.gstRecords.Filipino.breakdown?.literal} / I${student.gstRecords.Filipino.breakdown?.inferential} / C${student.gstRecords.Filipino.breakdown?.critical}`}</p>
                    )}
                  </div>
                )}
                {student.gstRecords?.English && (
                  <div className="border border-gray-300 bg-gray-50 p-3">
                    <p className="font-bold uppercase tracking-wide text-[11px] mb-1">English</p>
                    <p><span className="font-semibold">Raw Score:</span> {student.gstRecords.English.score} / 20</p>
                    {hasGstBreakdownComponents(student.gstRecords.English.breakdown) && (
                      <p><span className="font-semibold">Breakdown:</span> {`L${student.gstRecords.English.breakdown?.literal} / I${student.gstRecords.English.breakdown?.inferential} / C${student.gstRecords.English.breakdown?.critical}`}</p>
                    )}
                  </div>
                )}
                {!student.gstRecords?.Filipino && !student.gstRecords?.English && gstBreakdown && (
                  <div className="border border-gray-300 bg-gray-50 p-3">
                    <p><span className="font-semibold">Raw Total:</span> {gstBreakdown.total} / 20</p>
                    <p><span className="font-semibold">Component Sum:</span> {gstBreakdown.componentTotal ?? (gstBreakdown.literal + gstBreakdown.inferential + gstBreakdown.critical)} / 20</p>
                  </div>
                )}
              </div>
            </div>

            <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white">
              <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">IV. Diagnostic Analysis</h4>
              <div className="space-y-3 text-sm leading-relaxed">
                <p><span className="font-bold">Primary Issue(s) Identified:</span> {primaryIssueLabel}</p>
                <div>
                  <p className="font-bold mb-1">Root Cause Analysis:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {rootCauseText.split(/\s*(?:\||\n)\s*/).filter(Boolean).map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <p><span className="font-bold">Expert System Explanation:</span> {result.explanation}</p>
              </div>
            </div>
          </section>

          <section className="report-section grid grid-cols-1 gap-4 pdf-card break-inside-avoid">
            <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white">
              <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">V. Remedial Action Plan</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="font-bold mb-2 uppercase tracking-wide text-[11px]">{interventionSectionTitle}</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                    {interventionText.split(/\s*(?:\||\n)\s*/).filter(Boolean).map((inv, index) => (
                      <li key={index}>{inv}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="font-bold mb-2 uppercase tracking-wide text-[11px]">{guidanceSectionTitle}</p>
                  {isIndependentReader && (
                    <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                      This section provides the next instructional step for a student who has already mastered the current level.
                    </p>
                  )}
                  <div className="space-y-3 text-sm leading-relaxed">
                    {formatAcademicGuidance(displayGuidance)}
                  </div>
                </div>
              </div>
            </div>

            {student.preTest && student.postTest && (
              <div className="report-panel border border-black px-5 py-4 rounded-sm bg-white mt-6">
                <h4 className="report-section-title text-sm font-bold uppercase tracking-[0.18em] border-b border-gray-300 pb-2 mb-3">VI. Growth Report (Pre-test vs Post-test)</h4>
                <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                  The scores show overall progress, while the intervention comparison keeps the primary miscue-based recommendation separate from the support notes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    ['Reading Speed', student.preTest.result.wpm, student.postTest.result.wpm, 'WPM'],
                    ['Word Recognition', student.preTest.result.wordScore, student.postTest.result.wordScore, '%'],
                    ['Comprehension', student.preTest.result.compScore, student.postTest.result.compScore, '%'],
                  ].map(([label, preValue, postValue, unit]) => (
                    <div key={label} className="border border-gray-200 bg-gray-50 px-3 py-3">
                      <p className="font-bold uppercase text-[11px] tracking-wide text-gray-500 mb-2">{label}</p>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span><span className="font-semibold">Pre:</span> {preValue}{unit}</span>
                        <span><span className="font-semibold">Post:</span> {postValue}{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-2 border-black px-4 py-3 bg-white">
                  <div className="text-center pb-3 border-b border-gray-300">
                    <span className="font-bold uppercase mr-2 text-sm">Overall Profile Shift:</span>
                    <span className="font-semibold">{student.preTest.result.profile}</span>
                    <span className="mx-2">→</span>
                    <span className="font-black uppercase">{student.postTest.result.profile}</span>
                  </div>
                  <p className="font-bold uppercase text-sm mt-3 mb-1 text-center">Narrative Summary</p>
                  <p className="text-sm leading-relaxed text-slate-700 text-justify">
                    {growthNarrative}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="report-footer border border-black px-5 py-4 rounded-sm bg-white pdf-card break-inside-avoid">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="text-center">
                <div className="border-b border-black h-8 mb-2"></div>
                <div className="font-bold">Reading Teacher / Adviser</div>
                <div className="text-xs text-gray-500">Signature over Printed Name</div>
              </div>
              <div className="text-center">
                <div className="border-b border-black h-8 mb-2"></div>
                <div className="font-bold">School Principal / Head</div>
                <div className="text-xs text-gray-500">Signature over Printed Name</div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-gray-300 text-center text-[11px] italic text-gray-500">
              Generated by ReadAssist Expert System • {new Date().toLocaleDateString()} • Confidential School Record
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Student } from './types';
import { Roster } from './components/Roster';
import { Assessment } from './components/Assessment';
import { Report } from './components/Report';
import { BatchValidation } from './components/BatchValidation';
import { UserGuide } from './components/UserGuide';
import { AssessmentData, generateDiagnosis } from './lib/inferenceEngine';
import { normalizeGstBreakdown } from './lib/gst';
import { BookOpenCheck, BookOpenText, Check, Database } from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('readassist_students');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentView, setCurrentView] = useState<'roster' | 'assessment' | 'report' | 'batch' | 'guide'>('roster');
  const [guideReturnView, setGuideReturnView] = useState<'roster' | 'assessment' | 'report' | 'batch'>('roster');
  const [batchReturnView, setBatchReturnView] = useState<'roster' | 'assessment' | 'report' | 'guide'>('roster');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  // Persist the roster locally so a refresh does not clear already entered students.
  useEffect(() => {
    localStorage.setItem('readassist_students', JSON.stringify(students));
  }, [students]);

  const buildStoredBreakdown = (studentData: Omit<Student, 'id' | 'status' | 'recommendedPassageLevel' | 'assessmentResult' | 'rawAssessmentData'>) => {
    // Normalize any partial GST component entry before storing it with the student record.
    const normalizedBreakdown = normalizeGstBreakdown(studentData.gstBreakdown, studentData.gstScore);

    return normalizedBreakdown;
  };

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'status' | 'recommendedPassageLevel'>) => {
    const gstScore = Number(studentData.gstScore);
    const gstBreakdown = buildStoredBreakdown(studentData as Omit<Student, 'id' | 'status' | 'recommendedPassageLevel' | 'assessmentResult' | 'rawAssessmentData'>);
    let status: Student['status'] = 'Pending';
    let recommendedPassageLevel: number | undefined;

    if (gstScore >= 14) {
      status = 'Exempted';
    } else if (gstScore <= 13) {
      status = 'For Intervention';
      if (gstScore >= 8) {
        recommendedPassageLevel = Math.max(3, studentData.gradeLevel - 2);
      } else {
        recommendedPassageLevel = Math.max(3, studentData.gradeLevel - 3);
      }
    }

    const newStudent: Student = {
      ...studentData,
      gstScore,
      ...(gstBreakdown ? { gstBreakdown } : {}),
      id: crypto.randomUUID(),
      status,
      recommendedPassageLevel
    };

    setStudents(prev => [...prev, newStudent]);
  };

  const handleClearAllStudents = () => {
    setStudents([]);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleEditStudent = (id: string, studentData: Omit<Student, 'id' | 'status' | 'recommendedPassageLevel' | 'assessmentResult' | 'rawAssessmentData'>) => {
    setStudents(prev => prev.map(student => {
      if (student.id !== id) return student;

      const gstScore = Number(studentData.gstScore);
      const gstBreakdown = buildStoredBreakdown(studentData);
      let status: Student['status'] = 'Pending';
      let recommendedPassageLevel: number | undefined;

      if (gstScore >= 14) {
        status = 'Exempted';
      } else if (gstScore <= 13) {
        status = 'For Intervention';
        if (gstScore >= 8) {
            recommendedPassageLevel = Math.max(3, studentData.gradeLevel - 2);
        } else {
            recommendedPassageLevel = Math.max(3, studentData.gradeLevel - 3);
        }
      }

      return {
        ...student,
        ...studentData,
        gstScore,
        ...(gstBreakdown ? { gstBreakdown } : { gstBreakdown: undefined }),
        status,
        recommendedPassageLevel,
        // Clear assessment data if the student is now exempted
        ...(status === 'Exempted' ? { assessmentResult: undefined, rawAssessmentData: undefined } : {})
      };
    }));
  };

  const handleStartAssessment = (studentId: string) => {
    setActiveStudentId(studentId);
    setCurrentView('assessment');
  };

  const handleOpenGuide = () => {
    if (currentView !== 'guide') {
      setGuideReturnView(currentView);
    }
    setCurrentView('guide');
  };

  const handleCloseGuide = () => {
    setCurrentView(guideReturnView);
  };

  const handleOpenBatchValidation = () => {
    if (currentView !== 'batch') {
      setBatchReturnView(currentView);
    }
    setCurrentView('batch');
  };

  const handleCloseBatchValidation = () => {
    setCurrentView(batchReturnView);
  };

  const handleViewReport = (studentId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        // Older saved reports may not have a primary decision, so regenerate the diagnosis when needed.
        const shouldRefreshDiagnosis = Boolean(
          student.rawAssessmentData && (
            !student.assessmentResult ||
            student.assessmentResult.primaryDecision === undefined
          )
        );

        if (shouldRefreshDiagnosis) {
          return { ...student, assessmentResult: generateDiagnosis(student.rawAssessmentData!) };
        }
      }
      return student;
    }));
    setActiveStudentId(studentId);
    setCurrentView('report');
  };

  const handleAssessmentComplete = (data: AssessmentData) => {
    if (!activeStudentId) return;

    const diagnosis = generateDiagnosis(data);

    setStudents(prev => prev.map(student => {
      if (student.id === activeStudentId) {
        // Store pre-test and post-test runs separately so the report can compare them later.
        const updatedStudent = { ...student, assessmentResult: diagnosis, rawAssessmentData: data };
        if (data.assessmentType === 'Post-test') {
          updatedStudent.postTest = { raw: data, result: diagnosis };
        } else {
          updatedStudent.preTest = { raw: data, result: diagnosis };
        }
        return updatedStudent;
      }
      return student;
    }));

    setCurrentView('report');
  };

  const activeStudent = students.find(s => s.id === activeStudentId);
  const currentStep = currentView === 'roster' ? 0 : currentView === 'assessment' ? 1 : 2;
  const showStepIndicator = currentView !== 'batch' && currentView !== 'guide';

  const isGuideOpen = currentView === 'guide';
  const isBatchOpen = currentView === 'batch';
  const mainView = isGuideOpen ? guideReturnView : isBatchOpen ? batchReturnView : currentView;

  const renderCurrentView = (view: 'roster' | 'assessment' | 'report' | 'batch') => {
    if (view === 'roster') {
      return (
        <Roster 
          students={students} 
          onAddStudent={handleAddStudent}
          onClearAll={handleClearAllStudents}
          onDeleteStudent={handleDeleteStudent}
          onEditStudent={handleEditStudent}
          onStartAssessment={handleStartAssessment}
          onViewReport={handleViewReport}
        />
      );
    }

    if (view === 'assessment' && activeStudent) {
      return (
        <Assessment 
          student={activeStudent}
          onComplete={handleAssessmentComplete}
          onCancel={() => setCurrentView('roster')}
        />
      );
    }

    if (view === 'report' && activeStudent) {
      return (
        <Report 
          student={activeStudent}
          onBack={() => setCurrentView('roster')}
          onEdit={() => setCurrentView('assessment')}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster position="top-right" />
      <header className="bg-[#0038A8] text-white py-4 px-4 md:px-8 shadow-md print:hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FCD116] rounded-lg flex items-center justify-center text-[#0038A8] shadow-sm">
              <BookOpenCheck size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-wide">ReadAssist Expert System</h1>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button 
              onClick={() => {
                toast.success('Batch validation opened.');
                handleOpenBatchValidation();
              }}
              className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              <Database size={16} />
              Batch Validation
            </button>
            <button
              onClick={handleOpenGuide}
              className="flex items-center gap-2 bg-white/95 hover:bg-white text-[#0038A8] px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm border border-blue-100"
            >
              <BookOpenText size={16} />
              User Guide
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">
        {showStepIndicator && (
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 mb-8 print:hidden">
          <div className="flex justify-between max-w-4xl mx-auto">
            {['Class Roster', 'Reading Assessment', 'Expert Diagnosis'].map((label, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={label} className="relative flex flex-col items-center flex-1">
                  {/* Connecting Line Background */}
                  {index !== 0 && (
                    <div className="absolute top-4 left-[-50%] w-full h-1 bg-gray-200 z-0 transform -translate-y-1/2"></div>
                  )}
                  {/* Connecting Line Active */}
                  {index !== 0 && (
                    <div 
                      className="absolute top-4 left-[-50%] h-1 bg-[#0038A8] z-0 transform -translate-y-1/2 transition-all duration-500" 
                      style={{ width: isCompleted || isActive ? '100%' : '0%' }}
                    ></div>
                  )}
                  
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                    isActive ? 'bg-[#0038A8] border-[#0038A8] text-white shadow-md ring-4 ring-blue-100 text-sm' :
                    isCompleted ? 'bg-[#0038A8] border-[#0038A8] text-white text-sm' :
                    'bg-white border-gray-300 text-gray-400 text-sm'
                  }`}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
                  </div>
                  <span className={`mt-2 text-xs font-bold text-center ${
                    isActive ? 'text-[#0038A8]' :
                    isCompleted ? 'text-gray-800' :
                    'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div className={(isGuideOpen || isBatchOpen) ? 'hidden' : ''}>
          {renderCurrentView(mainView)}
        </div>

        {isBatchOpen && (
          <BatchValidation onBack={handleCloseBatchValidation} />
        )}

        {currentView === 'guide' && (
          <UserGuide
            onBack={handleCloseGuide}
            backLabel={
              guideReturnView === 'assessment'
                ? 'Back to Reading Assessment'
                : guideReturnView === 'report'
                ? 'Back to Expert Diagnosis'
                : guideReturnView === 'batch'
                ? 'Back to Batch Validation'
                : 'Back to Roster'
            }
          />
        )}
      </main>
    </div>
  );
}

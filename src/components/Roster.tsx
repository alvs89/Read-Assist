import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Student, GstLanguage, GstRecord, PrimaryGstLanguage } from '../types';
import { Plus, Play, FileText, Search, ChevronLeft, ChevronRight, Trash2, X, Edit2 } from 'lucide-react';
import { generateDiagnosis } from '../lib/inferenceEngine';
import { hasGstBreakdownComponents } from '../lib/gst';

interface RosterProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'status' | 'recommendedPassageLevel'>) => void;
  onClearAll: () => void;
  onDeleteStudent: (studentId: string) => void;
  onEditStudent: (id: string, studentData: Omit<Student, 'id' | 'status' | 'recommendedPassageLevel' | 'assessmentResult' | 'rawAssessmentData'>) => void;
  onStartAssessment: (studentId: string) => void;
  onViewReport: (studentId: string) => void;
}

export function Roster({ students, onAddStudent, onClearAll, onDeleteStudent, onEditStudent, onStartAssessment, onViewReport }: RosterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  type GstFormState = {
    score: number | '';
    literal: number | '';
    inferential: number | '';
    critical: number | '';
  };
  const createEmptyGstForm = (): GstFormState => ({ score: '', literal: '', inferential: '', critical: '' });
  
  // Add form state
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number>(3);
  const [gstScore, setGstScore] = useState<number | ''>('');
  const [gstLiteral, setGstLiteral] = useState<number | ''>('');
  const [gstInferential, setGstInferential] = useState<number | ''>('');
  const [gstCritical, setGstCritical] = useState<number | ''>('');
  const [englishGstScore, setEnglishGstScore] = useState<number | ''>('');
  const [englishGstLiteral, setEnglishGstLiteral] = useState<number | ''>('');
  const [englishGstInferential, setEnglishGstInferential] = useState<number | ''>('');
  const [englishGstCritical, setEnglishGstCritical] = useState<number | ''>('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState<number>(3);
  const [editGstScore, setEditGstScore] = useState<number | ''>('');
  const [editGstLiteral, setEditGstLiteral] = useState<number | ''>('');
  const [editGstInferential, setEditGstInferential] = useState<number | ''>('');
  const [editGstCritical, setEditGstCritical] = useState<number | ''>('');
  const [editEnglishGstScore, setEditEnglishGstScore] = useState<number | ''>('');
  const [editEnglishGstLiteral, setEditEnglishGstLiteral] = useState<number | ''>('');
  const [editEnglishGstInferential, setEditEnglishGstInferential] = useState<number | ''>('');
  const [editEnglishGstCritical, setEditEnglishGstCritical] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sanitizeStudentName = (value: string) => value.replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trimStart();

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.section || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === 'All' || (student.section || '') === filterSection;
    const matchesGrade = filterGrade === 'All' || student.gradeLevel.toString() === filterGrade;
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
    
    return matchesSearch && matchesSection && matchesGrade && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Get unique sections for the filter dropdown
  const uniqueSections = Array.from(new Set(students.map(s => s.section || ''))).filter(Boolean).sort();

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSection, filterGrade, filterStatus]);

  React.useEffect(() => {
    if (gradeLevel < 4) {
      setEnglishGstScore('');
      setEnglishGstLiteral('');
      setEnglishGstInferential('');
      setEnglishGstCritical('');
    }
  }, [gradeLevel]);

  React.useEffect(() => {
    if (editGradeLevel < 4) {
      setEditEnglishGstScore('');
      setEditEnglishGstLiteral('');
      setEditEnglishGstInferential('');
      setEditEnglishGstCritical('');
    }
  }, [editGradeLevel]);

  const parseScore = (value: number | '') => (value === '' ? 0 : Number(value));

  const buildBreakdown = (literal: number | '', inferential: number | '', critical: number | '', fallbackTotal: number) => {
    // Only store a breakdown when the teacher actually entered at least one component score.
    const hasComponentInput = [literal, inferential, critical].some(value => value !== '');

    if (!hasComponentInput) {
      return undefined;
    }

    const literalScore = parseScore(literal);
    const inferentialScore = parseScore(inferential);
    const criticalScore = parseScore(critical);
    const componentTotal = literalScore + inferentialScore + criticalScore;

    if (componentTotal === 0) {
      return undefined;
    }

    return {
      literal: literalScore,
      inferential: inferentialScore,
      critical: criticalScore,
      total: fallbackTotal,
      componentTotal,
    };
  };

  const buildGstRecord = (score: number | '', literal: number | '', inferential: number | '', critical: number | ''): GstRecord | undefined => {
    if (score === '') {
      return undefined;
    }

    const breakdown = buildBreakdown(literal, inferential, critical, Number(score));

    return {
      score: Number(score),
      ...(breakdown ? { breakdown } : {}),
    };
  };

  const resolvePrimaryGst = (records: Partial<Record<GstLanguage, GstRecord>>) => {
    const availableRecords = Object.values(records).filter((record): record is GstRecord => Boolean(record));

    if (availableRecords.length === 0) {
      return { score: 0, language: 'Filipino' as GstLanguage, record: undefined as GstRecord | undefined };
    }

    // The lower GST score wins because the roster uses the weakest language performance for placement.
    const primaryRecord = availableRecords.reduce((lowest, current) => (current.score < lowest.score ? current : lowest));
    const matchingLanguages = Object.entries(records)
      .filter(([, record]) => record?.score === primaryRecord.score)
      .map(([language]) => language as GstLanguage);

    const primaryLanguage: PrimaryGstLanguage = matchingLanguages.length > 1 ? 'Tie' : (matchingLanguages[0] || 'Filipino');

    return {
      score: primaryRecord.score,
      language: primaryLanguage,
      record: primaryRecord,
    };
  };

  const resetAddForm = () => {
    setName('');
    setSection('');
    setGradeLevel(3);
    setGstScore('');
    setGstLiteral('');
    setGstInferential('');
    setGstCritical('');
    setEnglishGstScore('');
    setEnglishGstLiteral('');
    setEnglishGstInferential('');
    setEnglishGstCritical('');
  };

  const resetEditForm = () => {
    setStudentToEdit(null);
    setEditName('');
    setEditSection('');
    setEditGradeLevel(3);
    setEditGstScore('');
    setEditGstLiteral('');
    setEditGstInferential('');
    setEditGstCritical('');
    setEditEnglishGstScore('');
    setEditEnglishGstLiteral('');
    setEditEnglishGstInferential('');
    setEditEnglishGstCritical('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = sanitizeStudentName(name).trim();
    if (cleanedName && section && gradeLevel && (gstScore !== '' || englishGstScore !== '')) {
      // Grade 3 stays Filipino-only; grades 4-6 may keep a second English GST record.
      const filipinoRecord = buildGstRecord(gstScore, gstLiteral, gstInferential, gstCritical);
      const englishRecord = gradeLevel >= 4 ? buildGstRecord(englishGstScore, englishGstLiteral, englishGstInferential, englishGstCritical) : undefined;
      const records: Partial<Record<GstLanguage, GstRecord>> = {
        ...(filipinoRecord ? { Filipino: filipinoRecord } : {}),
        ...(englishRecord ? { English: englishRecord } : {}),
      };
      const primary = resolvePrimaryGst(records);

      onAddStudent({
        name: cleanedName,
        section,
        gradeLevel,
        gstScore: primary.score,
        ...(primary.record?.breakdown ? { gstBreakdown: primary.record.breakdown } : {}),
        gstRecords: records,
        primaryGstLanguage: primary.language,
      });
      toast.success(`Student "${cleanedName}" added successfully.`);
      setIsModalOpen(false);
      resetAddForm();
    } else {
      toast.error('Please complete the student details and at least one GST score before saving.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEditName = sanitizeStudentName(editName).trim();
    if (studentToEdit && cleanedEditName && editSection && editGradeLevel && (editGstScore !== '' || editEnglishGstScore !== '')) {
      // Editing reuses the same resolution rules so the stored primary language stays consistent.
      const filipinoRecord = buildGstRecord(editGstScore, editGstLiteral, editGstInferential, editGstCritical);
      const englishRecord = editGradeLevel >= 4 ? buildGstRecord(editEnglishGstScore, editEnglishGstLiteral, editEnglishGstInferential, editEnglishGstCritical) : undefined;
      const records: Partial<Record<GstLanguage, GstRecord>> = {
        ...(filipinoRecord ? { Filipino: filipinoRecord } : {}),
        ...(englishRecord ? { English: englishRecord } : {}),
      };
      const primary = resolvePrimaryGst(records);

      onEditStudent(studentToEdit.id, {
        name: cleanedEditName,
        section: editSection,
        gradeLevel: editGradeLevel,
        gstScore: primary.score,
        ...(primary.record?.breakdown ? { gstBreakdown: primary.record.breakdown } : {}),
        gstRecords: records,
        primaryGstLanguage: primary.language,
      });
      toast.success(`Student "${cleanedEditName}" updated successfully.`);
      resetEditForm();
    } else {
      toast.error('Please complete the edited student details and at least one GST score before saving.');
    }
  };

  const openEditModal = (student: Student) => {
    // Hydrate the edit form from stored records so teachers can revise the original entry instead of starting over.
    setStudentToEdit(student);
    setEditName(student.name);
    setEditSection(student.section || '');
    setEditGradeLevel(student.gradeLevel);
    setEditGstScore(student.gstScore);
    setEditGstLiteral(student.gstBreakdown?.literal ?? '');
    setEditGstInferential(student.gstBreakdown?.inferential ?? '');
    setEditGstCritical(student.gstBreakdown?.critical ?? '');
    setEditEnglishGstScore(student.gstRecords?.English?.score ?? '');
    setEditEnglishGstLiteral(student.gstRecords?.English?.breakdown?.literal ?? '');
    setEditEnglishGstInferential(student.gstRecords?.English?.breakdown?.inferential ?? '');
    setEditEnglishGstCritical(student.gstRecords?.English?.breakdown?.critical ?? '');
  };

  return (
    <div className="px-4 md:px-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0038A8]">Class Roster & GST Screening</h1>
          <p className="text-gray-600 mt-1">Manage students and view Group Screening Test (GST) results.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="bg-white text-red-600 border border-red-600 px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-red-50 transition-colors"
            title="Clear all students from roster"
          >
            <Trash2 size={20} />
            Clear All
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0038A8] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors"
          >
            <Plus size={20} />
            Add Student
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, section, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none shadow-sm bg-white min-w-[140px] text-gray-700"
          >
            <option value="All">All Sections</option>
            {uniqueSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none shadow-sm bg-white min-w-[140px] text-gray-700"
          >
            <option value="All">All Grades</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none shadow-sm bg-white min-w-[160px] text-gray-700"
          >
            <option value="All">All Statuses</option>
            <option value="Exempted">Exempted</option>
            <option value="For Intervention">For Intervention</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-700 w-[25%]">Student Name</th>
              <th className="p-4 font-semibold text-gray-700 w-[15%]">Section</th>
              <th className="p-4 font-semibold text-gray-700 w-[10%]">Grade</th>
              <th className="p-4 font-semibold text-gray-700 w-[10%]">GST Records</th>
              <th className="p-4 font-semibold text-gray-700 w-[15%]">Status</th>
              <th className="p-4 font-semibold text-gray-700 w-[15%]">Assessment</th>
              <th className="p-4 font-semibold text-gray-700 text-right w-[10%]">Manage</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No students added yet. Click "Add Student" to begin.
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {(() => {
                    let msg = "No";
                    if (filterGrade !== 'All') msg += ` Grade ${filterGrade}`;
                    if (filterSection !== 'All') msg += ` ${filterSection}`;
                    msg += " students";
                    if (filterStatus !== 'All') msg += ` with status "${filterStatus}"`;
                    msg += " found";
                    if (searchQuery) msg += ` matching "${searchQuery}"`;
                    return msg + ".";
                  })()}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{student.name}</td>
                  <td className="p-4 text-gray-600">{student.section || '-'}</td>
                  <td className="p-4 text-gray-600">Grade {student.gradeLevel}</td>
                  <td className="p-4 text-gray-600">
                    <div className="font-semibold text-gray-800">Primary GST Score: {student.gstScore} / 20</div>
                    {student.primaryGstLanguage && (
                      <div className="mt-1 text-xs text-gray-500">
                        {student.primaryGstLanguage === 'Tie'
                          ? 'Primary language: Tie (Filipino and English have the same GST score)'
                          : `Primary language: ${student.primaryGstLanguage}`}
                      </div>
                    )}
                    <div className="mt-2 space-y-1 text-xs leading-5 text-gray-500">
                      {student.gstRecords ? (
                        <>
                          {student.gstRecords.Filipino && (
                            <p><span className="font-semibold text-gray-600">Filipino:</span> {student.gstRecords.Filipino.score}{hasGstBreakdownComponents(student.gstRecords.Filipino.breakdown) ? ` (L${student.gstRecords.Filipino.breakdown?.literal}/I${student.gstRecords.Filipino.breakdown?.inferential}/C${student.gstRecords.Filipino.breakdown?.critical})` : ''}</p>
                          )}
                          {student.gstRecords.English && (
                            <p><span className="font-semibold text-gray-600">English:</span> {student.gstRecords.English.score}{hasGstBreakdownComponents(student.gstRecords.English.breakdown) ? ` (L${student.gstRecords.English.breakdown?.literal}/I${student.gstRecords.English.breakdown?.inferential}/C${student.gstRecords.English.breakdown?.critical})` : ''}</p>
                          )}
                        </>
                      ) : student.gstBreakdown ? (
                        <>
                          <p><span className="font-semibold text-gray-600">Literal:</span> {student.gstBreakdown.literal}</p>
                          <p><span className="font-semibold text-gray-600">Inferential:</span> {student.gstBreakdown.inferential}</p>
                          <p><span className="font-semibold text-gray-600">Critical:</span> {student.gstBreakdown.critical}</p>
                        </>
                      ) : (
                        <p className="italic text-gray-400">GST component breakdown not provided.</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        student.status === 'Exempted'
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'For Intervention'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {student.status === 'Exempted' ? (
                        <span className="text-gray-400 text-sm">No action needed</span>
                      ) : student.assessmentResult || student.rawAssessmentData ? (
                        <button
                          onClick={() => {
                            toast.success(`Opening report for ${student.name}.`);
                            onViewReport(student.id);
                          }}
                          className="flex items-center gap-1 text-[#0038A8] hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors w-max"
                        >
                          <FileText size={18} />
                          View Report
                        </button>
                      ) : student.status === 'For Intervention' ? (
                        <button
                          onClick={() => {
                            toast.success(`Starting assessment for ${student.name}.`);
                            onStartAssessment(student.id);
                          }}
                          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors w-max"
                        >
                          <Play size={18} className="fill-current" />
                          Start Test
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No action needed</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit student"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setStudentToDelete(student)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {filteredStudents.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-medium">{filteredStudents.length}</span> students
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="bg-red-600 p-4 text-white">
              <h2 className="text-xl font-bold">Clear All Students</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">Are you sure you want to remove all students from the roster? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAll();
                    setIsClearModalOpen(false);
                    toast.success('All students have been cleared from the roster.');
                  }}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 p-4 text-white">
              <h2 className="text-xl font-bold">Delete Student</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">Are you sure you want to remove <strong>{studentToDelete.name}</strong> from the roster? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteStudent(studentToDelete.id);
                    setStudentToDelete(null);
                    toast.success(`Student "${studentToDelete.name}" deleted successfully.`);
                  }}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {studentToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center overflow-y-auto p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden min-h-0">
            <div className="bg-[#0038A8] p-4 text-white shrink-0">
              <h2 className="text-xl font-bold">Edit Student</h2>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(sanitizeStudentName(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  placeholder="e.g., Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  required
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  placeholder="e.g., Mabini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade Level</label>
                <select
                  value={editGradeLevel}
                  onChange={(e) => setEditGradeLevel(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none bg-white"
                >
                  {[3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8]">Filipino GST Breakdown</p>
                  <p className="text-xs text-gray-600">Required for the current assessment.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Filipino GST Raw Score (0-20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editGstScore}
                    onChange={(e) => setEditGstScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Literal</label>
                    <input
                      type="number"
                      min="0"
                      value={editGstLiteral}
                      onChange={(e) => setEditGstLiteral(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inferential</label>
                    <input
                      type="number"
                      min="0"
                      value={editGstInferential}
                      onChange={(e) => setEditGstInferential(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
                    <input
                      type="number"
                      min="0"
                      value={editGstCritical}
                      onChange={(e) => setEditGstCritical(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                  <p className="text-sm text-gray-600">
                  {buildBreakdown(editGstLiteral, editGstInferential, editGstCritical, Number(editGstScore) || 0) ? (
                    <>Component Sum Preview: <span className="font-bold text-gray-900">{buildBreakdown(editGstLiteral, editGstInferential, editGstCritical, Number(editGstScore) || 0)?.componentTotal} / 20</span></>
                  ) : (
                    <span className="italic text-gray-500">No GST component breakdown entered.</span>
                  )}
                  </p>
              </div>
              {editGradeLevel >= 4 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">English GST Breakdown</p>
                    <p className="text-xs text-gray-600">Optional for Grades 4-6.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">English GST Raw Score (0-20)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editEnglishGstScore}
                      onChange={(e) => setEditEnglishGstScore(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Literal</label>
                      <input
                        type="number"
                        min="0"
                        value={editEnglishGstLiteral}
                        onChange={(e) => setEditEnglishGstLiteral(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inferential</label>
                      <input
                        type="number"
                        min="0"
                        value={editEnglishGstInferential}
                        onChange={(e) => setEditEnglishGstInferential(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
                      <input
                        type="number"
                        min="0"
                        value={editEnglishGstCritical}
                        onChange={(e) => setEditEnglishGstCritical(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {buildBreakdown(editEnglishGstLiteral, editEnglishGstInferential, editEnglishGstCritical, Number(editEnglishGstScore) || 0) ? (
                      <>Component Sum Preview: <span className="font-bold text-gray-900">{buildBreakdown(editEnglishGstLiteral, editEnglishGstInferential, editEnglishGstCritical, Number(editEnglishGstScore) || 0)?.componentTotal} / 20</span></>
                    ) : (
                      <span className="italic text-gray-500">No GST component breakdown entered.</span>
                    )}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0038A8] text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center overflow-y-auto p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden min-h-0">
            <div className="bg-[#0038A8] p-4 text-white shrink-0">
              <h2 className="text-xl font-bold">Add New Student</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(sanitizeStudentName(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  placeholder="e.g., Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  placeholder="e.g., Mabini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none bg-white"
                >
                  {[3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0038A8]">Filipino GST Breakdown</p>
                  <p className="text-xs text-gray-600">Required for the current assessment.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Filipino GST Raw Score (0-20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gstScore}
                    onChange={(e) => setGstScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Literal</label>
                    <input
                      type="number"
                      min="0"
                      value={gstLiteral}
                      onChange={(e) => setGstLiteral(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inferential</label>
                    <input
                      type="number"
                      min="0"
                      value={gstInferential}
                      onChange={(e) => setGstInferential(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
                    <input
                      type="number"
                      min="0"
                      value={gstCritical}
                      onChange={(e) => setGstCritical(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                  <p className="text-sm text-gray-600">
                  {buildBreakdown(gstLiteral, gstInferential, gstCritical, Number(gstScore) || 0) ? (
                    <>Component Sum Preview: <span className="font-bold text-gray-900">{buildBreakdown(gstLiteral, gstInferential, gstCritical, Number(gstScore) || 0)?.componentTotal} / 20</span></>
                  ) : (
                    <span className="italic text-gray-500">No GST component breakdown entered.</span>
                  )}
                  </p>
              </div>
              {gradeLevel >= 4 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">English GST Breakdown</p>
                    <p className="text-xs text-gray-600">Optional for Grades 4-6.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">English GST Raw Score (0-20)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={englishGstScore}
                      onChange={(e) => setEnglishGstScore(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Literal</label>
                      <input
                        type="number"
                        min="0"
                        value={englishGstLiteral}
                        onChange={(e) => setEnglishGstLiteral(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inferential</label>
                      <input
                        type="number"
                        min="0"
                        value={englishGstInferential}
                        onChange={(e) => setEnglishGstInferential(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
                      <input
                        type="number"
                        min="0"
                        value={englishGstCritical}
                        onChange={(e) => setEnglishGstCritical(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0038A8] focus:border-[#0038A8] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {buildBreakdown(englishGstLiteral, englishGstInferential, englishGstCritical, Number(englishGstScore) || 0) ? (
                      <>Component Sum Preview: <span className="font-bold text-gray-900">{buildBreakdown(englishGstLiteral, englishGstInferential, englishGstCritical, Number(englishGstScore) || 0)?.componentTotal} / 20</span></>
                    ) : (
                      <span className="italic text-gray-500">No GST component breakdown entered.</span>
                    )}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0038A8] text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, UploadCloud, CheckCircle, AlertTriangle, Play, FileText, X, Loader2 } from 'lucide-react';
import { generateDiagnosis, AssessmentData } from '../lib/inferenceEngine';
import { getPassageForAssessment, passages, PassageSet } from '../data/knowledgeBase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface BatchValidationProps {
  onBack: () => void;
}

export function BatchValidation({ onBack }: BatchValidationProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = [
    'student_id', 'grade_level', 'age', 'gender', 'gst_score', 
    'word_recognition_rate', 'comprehension_score', 'mispronunciation_count', 
    'omission_count', 'substitution_count', 'insertion_count', 'repetition_count', 
    'reading_level', 'assigned_passage_grade', 'total_words_of_passage', 
    'session_date', 'session_start_hour', 'session_duration_min', 'words_per_minute'
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isValidType = file.type === 'text/csv' || 
                        file.name.endsWith('.csv') || 
                        file.name.endsWith('.xlsx') || 
                        file.name.endsWith('.xls') ||
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel';
                        
    if (!isValidType) {
      toast.error('Invalid file format. Please upload a CSV or Excel file.');
      return;
    }
    setSelectedFile(file);
    setResults([]); // Clear previous results
    toast.success(`File "${file.name}" selected successfully.`);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processData = (data: any[]) => {
    try {
      // Batch mode mirrors the single-student rules so the exported file is judged the same way as the UI.
      const parsedResults = data.map((row, index) => {
        // Resolve the passage from the row metadata; older datasets may omit passage_set or language details.
        const assignedGrade = Number(row.assigned_passage_grade) || 2;
        const requestedLanguage = row.language === 'Filipino' ? 'Filipino' : 'English';
        const language = assignedGrade < 4 ? 'Filipino' : requestedLanguage;
        const assessmentLabel = row.assessment_type ?? row.mode;
        const assessmentType = assessmentLabel
          ? (assessmentLabel === 'Post-test' ? 'Post-test' : 'Pre-test')
          : (index % 2 === 0 ? 'Pre-test' : 'Post-test');
        const passageSet = typeof row.passage_set === 'string' ? row.passage_set.trim().toUpperCase() : '';
        const selectedPassageSet = ['A', 'B', 'C', 'D'].includes(passageSet) ? passageSet as PassageSet : undefined;
        const passage = selectedPassageSet
          ? passages.find(p => p.gradeLevel === assignedGrade && p.language === language && p.assessmentType === assessmentType && p.passageSet === selectedPassageSet)
          : getPassageForAssessment(assignedGrade, language, assessmentType);

        const resolvedPassage = passage || getPassageForAssessment(assignedGrade, language, assessmentType);

        const assessmentData: AssessmentData = {
          timeInSeconds: Number(row.session_duration_min || 0) * 60,
          totalPassageWords: Number(row.total_words_of_passage || resolvedPassage.wordCount),
          totalQuizQuestions: resolvedPassage.questionCount,
          correctQuizAnswers: Math.round((Number(row.comprehension_score || 0) / 100) * resolvedPassage.questionCount),
          sessionDate: row.session_date ? new Date(row.session_date).toISOString() : new Date().toISOString(),
          language: language as 'English' | 'Filipino',
          passageSet: resolvedPassage.passageSet,
          miscues: {
            Mispronunciation: Number(row.mispronunciation_count || 0),
            Omission: Number(row.omission_count || 0),
            Substitution: Number(row.substitution_count || 0),
            Insertion: Number(row.insertion_count || 0),
            Repetition: Number(row.repetition_count || 0),
            Transposition: 0, // Not in the new 19-column format
            Reversal: 0,      // Not in the new 19-column format
          },
          behaviors: {
            wordByWord: false,
            lacksExpression: false,
            hardlyAudible: false,
            disregardsPunctuation: false,
          },
          assessmentType
        };

        const expertProfile = row.reading_level?.trim();
        const diagnosis = generateDiagnosis(assessmentData);
        
        return {
          // +2 because the first data row sits on row 2 in the spreadsheet.
          row: index + 2,
          studentId: row.student_id,
          systemProfile: diagnosis.profile,
          expertProfile,
          passageSet: resolvedPassage.passageSet,
          assessmentType,
          wordScore: diagnosis.wordScore,
          compScore: diagnosis.compScore,
          match: diagnosis.profile.toLowerCase() === expertProfile?.toLowerCase()
        };
      });

      setResults(parsedResults);
      toast.success(`Successfully processed ${parsedResults.length} records.`);
    } catch (error) {
      console.error("Error processing CSV data:", error);
      toast.error("An error occurred while processing the data. Please check the file contents.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing dataset...", { id: 'processing-toast' });

    const validateAndProcess = (data: any[], sourceLabel: 'CSV' | 'Excel') => {
      if (data.length === 0) {
        toast.error(sourceLabel === 'Excel'
          ? "The uploaded Excel file does not contain any readable rows."
          : "The uploaded CSV file is empty.");
        setIsProcessing(false);
        return;
      }

      // Accept either the newer assessment_type column or the older mode column.
      const actualHeaders = Object.keys(data[0]);
      const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
      const hasAssessmentTypeHeader = actualHeaders.includes('assessment_type') || actualHeaders.includes('mode');
      
      if (!hasAssessmentTypeHeader) {
        missingHeaders.unshift('assessment_type or mode');
      }

      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.slice(0, 3).join(', ')}${missingHeaders.length > 3 ? '...' : ''}`);
        setIsProcessing(false);
        return;
      }

      // Yield once so the loading toast can render before the file parsing work begins.
      setTimeout(() => {
        processData(data);
      }, 100);
    };

    if (selectedFile.name.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          toast.dismiss('processing-toast');
          
          if (results.errors.length > 0) {
            console.error("CSV Parsing Errors:", results.errors);
            toast.error("Failed to parse CSV. Please ensure it is correctly formatted.");
            setIsProcessing(false);
            return;
          }

          validateAndProcess(results.data as any[], 'CSV');
        },
        error: (error) => {
          toast.dismiss('processing-toast');
          toast.error(`Error reading file: ${error.message}`);
          setIsProcessing(false);
        }
      });
    } else {
      // Excel Processing
      const reader = new FileReader();
      reader.onload = (e) => {
        toast.dismiss('processing-toast');
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            toast.error("The uploaded Excel file does not contain a readable worksheet.");
            setIsProcessing(false);
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            toast.error("The uploaded Excel file does not contain a readable worksheet.");
            setIsProcessing(false);
            return;
          }
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          validateAndProcess(jsonData, 'Excel');
        } catch (error) {
          console.error("Excel Parsing Error:", error);
          toast.error("Failed to parse Excel file. Please ensure it is correctly formatted.");
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        toast.dismiss('processing-toast');
        toast.error("Error reading Excel file.");
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const matchCount = results.filter(r => r.match).length;
  const accuracy = results.length > 0 ? ((matchCount / results.length) * 100).toFixed(1) : 0;

  return (
    <div className="px-4 md:px-8 max-w-[1600px] mx-auto w-full pb-12">
      <div className="flex mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-[#0038A8] font-semibold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow"
        >
          <ArrowLeft size={20} />
          Back to Roster
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Batch Validation Module</h2>
        <p className="text-gray-600 mb-8 max-w-3xl">
          Upload your 750-record dataset (CSV or Excel format) to validate the Expert System's accuracy against human expert grading. The system expects 19 specific columns aligned with the Phil-IRI Manual 2018.
        </p>

        {/* Drag and Drop Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 mb-6 ${
            isDragging 
              ? 'border-[#0038A8] bg-blue-50' 
              : selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-[#0038A8]">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Drag & Drop your CSV or Excel file here</h3>
              <p className="text-gray-500 mb-6">or click to browse from your computer</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-green-600">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedFile.name}</h3>
              <p className="text-gray-500 mb-6">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              <button 
                onClick={clearFile}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition-colors bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm"
              >
                <X size={16} />
                Remove File
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="flex items-center gap-2 bg-[#0038A8] text-white px-8 py-3.5 rounded-xl hover:bg-blue-800 font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing Dataset...
              </>
            ) : (
              <>
                <Play size={20} />
                Run Validation
              </>
            )}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Validation Results</h3>
              <p className="text-gray-500 mt-1">Processed {results.length} records</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">System Accuracy</p>
                <p className="text-3xl font-black text-[#0038A8]">{accuracy}%</p>
              </div>
              <div className="h-10 w-px bg-blue-200"></div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Matches</p>
                <p className="text-xl font-bold text-[#0038A8]">{matchCount} / {results.length}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Row</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Student ID</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Passage Set</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Mode</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">System Output</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Expert Output</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Sys Word %</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Sys Comp %</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r, i) => (
                  <tr key={i} className={`hover:bg-gray-50 transition-colors ${!r.match ? 'bg-red-50/30' : ''}`}>
                    <td className="p-4 text-sm text-gray-500">{r.row}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{r.studentId}</td>
                    <td className="p-4 text-sm font-medium text-gray-700">{r.passageSet}</td>
                    <td className="p-4 text-sm font-medium text-gray-700">{r.assessmentType}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{r.systemProfile}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{r.expertProfile}</td>
                    <td className="p-4 text-sm font-mono text-gray-600">{r.wordScore}%</td>
                    <td className="p-4 text-sm font-mono text-gray-600">{r.compScore}%</td>
                    <td className="p-4">
                      {r.match ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                          <CheckCircle size={14} /> Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                          <AlertTriangle size={14} /> Mismatch
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

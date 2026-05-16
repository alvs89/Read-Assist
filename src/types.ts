import { DiagnosisResult, AssessmentData } from './lib/inferenceEngine';
import type { GstBreakdown } from './lib/gst';

export type GstLanguage = 'Filipino' | 'English';
export type PrimaryGstLanguage = GstLanguage | 'Tie';

export interface GstRecord {
  score: number;
  breakdown?: GstBreakdown;
}

export interface Student {
  id: string;
  name: string;
  section: string;
  gradeLevel: number;
  gstScore: number;
  gstBreakdown?: GstBreakdown;
  // Keep separate GST results so Grades 4-6 can store Filipino and English scores independently.
  gstRecords?: Partial<Record<GstLanguage, GstRecord>>;
  // A tie means both language records produced the same GST score.
  primaryGstLanguage?: PrimaryGstLanguage;
  status: 'Exempted' | 'For Intervention' | 'Pending';
  recommendedPassageLevel?: number;
  assessmentResult?: DiagnosisResult;
  rawAssessmentData?: AssessmentData;
  preTest?: {
    raw: AssessmentData;
    result: DiagnosisResult;
  };
  postTest?: {
    raw: AssessmentData;
    result: DiagnosisResult;
  };
}

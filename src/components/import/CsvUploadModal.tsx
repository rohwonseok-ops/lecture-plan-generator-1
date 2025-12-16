'use client';

import React, { useRef, useState } from 'react';
import { X, Download, UploadCloud } from 'lucide-react';
import { parseCsv } from '@/lib/csv';
import { useClassPlanStore } from '@/store/classPlanStore';
import { ClassPlan, WeeklyItem } from '@/lib/types';
import { recordActivity } from '@/lib/activityLogger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CsvUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClassPlan } = useClassPlanStore();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    success: number;
    fail: number;
    errors: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const downloadSampleCsv = () => {
    const headers = [
      '등록자',
      '반명/강좌명',
      '대상 학생',
      '수업요일',
      '수업시간',
      '학습과정1',
      '학습과정1 교재',
      '학습과정2',
      '학습과정2 교재',
      '학습목표',
      '수업계획 (진도계획)',
      '학습관리 (테스트/클리닉/피드백 계획)',
      '기타 내용 (홍보문구/특이사항 등)',
      '파일첨부',
      '수정일',
      '수정자'
    ];
    
    const sampleData = [
      [
        '홍길동',
        '수학 몰입특강',
        '김철수, 이영희, 박민수',
        '월수금',
        '13:00-17:00',
        '3-1 개념',
        '개념플러스유형',
        '3-1 응용',
        '쎈',
        '기초 개념 완벽 이해',
        '1주차 - 자연수의 혼합 계산\n2주차 - 약수와 배수\n3주차 - 규칙과 대응',
        '주간 테스트 및 피드백',
        '특별 할인 이벤트 진행 중',
        '',
        '2025-12-16 16:00',
        '홍길동'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '강의계획서_샘플.csv';
    link.click();
    recordActivity('csv.sample', '샘플 CSV 다운로드');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    setErrorMessage(null);
    try {
      const { rows, headers } = await parseCsv(file);
      if (!rows.length) {
        setErrorMessage('CSV에서 데이터를 찾지 못했습니다. 헤더 및 내용이 있는지 확인해주세요.');
        return;
      }
      
      // 한글 헤더와 영문 헤더 모두 지원하는 매핑 테이블
      const headerMapping: Record<string, string> = {
        '등록자': 'teacherName',
        '반명/강좌명': 'title',
        '대상 학생': 'targetStudentDetail',
        '수업요일': 'classDay',
        '수업시간': 'classTime',
        '학습과정1': 'course1',
        '학습과정1 교재': 'material1',
        '학습과정2': 'course2',
        '학습과정2 교재': 'material2',
        '학습목표': 'learningGoal',
        '수업계획 (진도계획)': 'weeklyPlanRaw',
        '학습관리 (테스트/클리닉/피드백 계획)': 'management',
        '기타 내용 (홍보문구/특이사항 등)': 'etc',
        '수정일': 'lastSaved',
        // 영문 헤더도 지원 (하위 호환성)
        'title': 'title',
        'teachername': 'teacherName',
        'targetstudent': 'targetStudent',
        'targetstudentdetail': 'targetStudentDetail',
        'classday': 'classDay',
        'classtime': 'classTime',
        'course1': 'course1',
        'material1': 'material1',
        'course2': 'course2',
        'material2': 'material2',
        'learninggoal': 'learningGoal',
        'weeklyplanraw': 'weeklyPlanRaw',
        'management': 'management',
        'etc': 'etc',
        'lastsaved': 'lastSaved'
      };

      // 헤더를 시스템 필드명으로 매핑
      const mapping: Record<string, string> = {};
      headers.forEach(header => {
        const trimmed = header.trim();
        // 한글 헤더 매핑
        if (headerMapping[trimmed]) {
          mapping[headerMapping[trimmed]] = trimmed;
        } else {
          // 영문 헤더 정규화 후 매핑
          const normalized = trimmed.toLowerCase();
          if (headerMapping[normalized]) {
            mapping[headerMapping[normalized]] = trimmed;
          }
        }
      });

      // 필수 헤더 검증 (한글 또는 영문)
      const requiredFields = ['title', 'teacherName', 'classDay', 'classTime'];
      const requiredKoreanHeaders = ['반명/강좌명', '등록자', '수업요일', '수업시간'];
      const missing: string[] = [];
      
      requiredFields.forEach(field => {
        if (!mapping[field]) {
          // 한글 헤더명으로 에러 메시지 표시
          const koreanHeader = requiredKoreanHeaders[requiredFields.indexOf(field)];
          missing.push(koreanHeader || field);
        }
      });

      if (missing.length) {
        setErrorMessage(`필수 헤더가 없습니다: ${missing.join(', ')} (샘플 파일을 다시 받아 확인해주세요)`);
        setIsUploading(false);
        return;
      }

      let success = 0;
      const errors: string[] = [];

      // CSV 데이터를 ClassPlan으로 변환
      for (const [idx, row] of rows.entries()) {
        try {
          // 주차별 계획 파싱
          const weeklyPlanRaw = row[mapping['weeklyPlanRaw']] || '';
          const weeklyPlan: WeeklyItem[] = weeklyPlanRaw
            ? weeklyPlanRaw.split('\n').map((line: string, wIdx: number) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                
                // "1주차 - 주제" 형식 처리
                const weekMatch = trimmed.match(/^(\d+)주차\s*[-:]\s*(.+)$/);
                if (weekMatch) {
                  return {
                    weekLabel: `${weekMatch[1]}주차`,
                    topic: weekMatch[2].trim()
                  };
                }
                
                // "1주 - 주제" 또는 "1주: 주제" 형식 처리
                const weekMatch2 = trimmed.match(/^(\d+)주\s*[-:]\s*(.+)$/);
                if (weekMatch2) {
                  return {
                    weekLabel: `${weekMatch2[1]}주차`,
                    topic: weekMatch2[2].trim()
                  };
                }
                
                // 일반적인 "-" 또는 ":" 구분자 처리
                const parts = trimmed.split(/[-:]/);
                if (parts.length > 1) {
                  return {
                    weekLabel: parts[0]?.trim() || `${wIdx + 1}주차`,
                    topic: parts.slice(1).join(' ').trim()
                  };
                }
                
                // 구분자가 없는 경우
                return {
                  weekLabel: `${wIdx + 1}주차`,
                  topic: trimmed
                };
              }).filter((item): item is WeeklyItem => item !== null)
            : Array.from({ length: 8 }, () => ({
                weekLabel: '',
                topic: ''
              }));

          // CSV 행에서 필드 값 추출 (한글 헤더 사용)
          const getFieldValue = (fieldName: string): string => {
            const headerName = mapping[fieldName];
            return headerName ? (row[headerName] || '') : '';
          };

          // 대상 학생에서 학년 정보 추출 시도 (예: "예비고2,3" -> "예비고2,3")
          const targetStudentDetail = getFieldValue('targetStudentDetail');
          const targetStudent = targetStudentDetail.match(/예비?고?[1-3]|중[1-3]|초[1-6]/)?.[0] || '';

          const newPlan: ClassPlan = {
            id: crypto.randomUUID(),
            title: getFieldValue('title') || '제목 없음',
            teacherName: getFieldValue('teacherName') || '',
            targetStudent: targetStudent,
            targetStudentDetail: targetStudentDetail,
            classDay: getFieldValue('classDay') || '',
            classTime: getFieldValue('classTime') || '',
            course1: getFieldValue('course1') || '',
            material1: getFieldValue('material1') || '',
            course2: getFieldValue('course2') || '',
            material2: getFieldValue('material2') || '',
            learningGoal: getFieldValue('learningGoal') || '',
            management: getFieldValue('management') || '',
            etc: getFieldValue('etc') || '',
            weeklyPlan: weeklyPlan,
            templateId: 'style1-blue',
            sizePreset: 'A4',
            lastSaved: getFieldValue('lastSaved') || undefined
          };

          await addClassPlan(newPlan);
          success += 1;
        } catch (err) {
          console.error('행 업로드 실패', err);
          const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
          errors.push(`${idx + 2}행: ${errorMsg} (헤더 행 제외)`);
        }
      }

      const fail = rows.length - success;
      setResult({ total: rows.length, success, fail, errors });

      if (success > 0) {
        recordActivity('csv.upload', `CSV 일괄등록 ${success}건 성공, 실패 ${fail}건`);
      }

      if (fail > 0 && success === 0) {
        setErrorMessage(`모든 행의 업로드에 실패했습니다. CSV 파일 형식을 확인해주세요. (필수 헤더: 등록자, 반명/강좌명, 수업요일, 수업시간)`);
      }
    } catch (error) {
      console.error('CSV 업로드 실패:', error);
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      setErrorMessage(`CSV 파일 업로드에 실패했습니다: ${errorMsg}. 파일 형식을 확인해주세요. (샘플 파일을 다운로드하여 형식을 확인하세요)`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-zinc-800 mb-6">CSV 일괄 등록</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="font-bold text-sm text-blue-900 mb-1">샘플 CSV 다운로드</h3>
              <p className="text-xs text-blue-700">업로드 형식을 확인하세요</p>
            </div>
            <button
              onClick={downloadSampleCsv}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">샘플 다운로드</span>
            </button>
          </div>

          <div
            className="border-2 border-dashed border-zinc-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">CSV 파일 업로드</h3>
            <p className="text-sm text-zinc-500">
              {isUploading ? '업로드 중...' : '이곳을 클릭하거나 파일을 드래그하여 업로드하세요'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-zinc-800">업로드 결과</div>
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  결과 지우기
                </button>
              </div>
              <div className="flex gap-4 text-zinc-700">
                <span>총 {result.total}건</span>
                <span className="text-green-600">성공 {result.success}건</span>
                <span className="text-red-600">실패 {result.fail}건</span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium text-red-700">실패 상세</div>
                  <ul className="list-disc list-inside text-red-700">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvUploadModal;


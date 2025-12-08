import { ClassPlan } from './types';
import { useAuthStore, ApiEndpointConfig } from '@/store/authStore';

export interface AiGenerateOptions {
  type: 'parentIntro' | 'learningGoal' | 'promoCopy' | 'keywords' | 'management';
  tone?: 'formal' | 'friendly' | 'passionate';
}

export type AiServiceType = 'copy' | 'design';

export const resolveApiConfig = (service: AiServiceType): ApiEndpointConfig => {
  const { apiKeys } = useAuthStore.getState();
  const shared = apiKeys.shared || {};
  if (service === 'design') {
    return apiKeys.useSharedForDesign === false ? { ...shared, ...(apiKeys.design || {}) } : shared;
  }
  return apiKeys.useSharedForCopy === false ? { ...shared, ...(apiKeys.copy || {}) } : shared;
};

export const generateTextForClassPlan = async (
  plan: ClassPlan,
  options: AiGenerateOptions
): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const subject = plan.subject || plan.title || '수업';
  const target = plan.targetStudent || '학생';
  const teacher = plan.teacherName || '선생님';

  switch (options.type) {
    case 'parentIntro':
      return `안녕하세요, 학부모님. ${teacher} 강사입니다. 이번 ${subject} 특강은 ${target} 아이들이 가장 어려워하는 부분을 쉽고 재미있게 풀어내는 데 초점을 맞추었습니다. 단순 암기가 아닌 원리 이해를 통해 자기주도 학습 능력을 키울 수 있도록 지도하겠습니다.`;
      
    case 'learningGoal':
      return `1. ${subject}의 핵심 개념을 완벽하게 이해하고 실전 문제에 적용합니다.\n2. ${plan.course1 ? plan.course1 + ' 과정을 통해 ' : ''}취약 유형을 분석하고 집중 보완합니다.\n3. 능동적인 학습 태도를 기르고 성취감을 고취시킵니다.`;
      
    case 'management':
      return `[테스트]\n- 매 수업 시작 시 지난 시간 복습 데일리 테스트 진행\n- 주 1회 주간 성취도 평가\n\n[피드백]\n- 테스트 결과 및 오답 노트 학부모 문자 전송\n- 수업 후 1:1 질의응답 및 개별 클리닉 운영`;
      
    case 'promoCopy':
      return `놓치면 후회할 ${subject} 특강! ${teacher} 선생님만의 특별한 노하우로 성적 수직 상승의 기회를 잡으세요. ${target} 맞춤형 커리큘럼으로 빈틈없는 실력을 완성해 드립니다.`;
      
    case 'keywords':
      const keys = [subject, target, '실력향상', '완벽대비', '집중관리', '성적상승'];
      if (plan.course1) keys.push(plan.course1.replace(/\s+/g, ''));
      return keys.map(k => `#${k}`).join(' ');
      
    default:
      return '';
  }
};


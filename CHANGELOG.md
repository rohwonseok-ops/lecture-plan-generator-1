# 강의계획서 매니저 v2.0 업그레이드 변경사항

**작성일**: 2025-12-20
**버전**: 2.0.0

---

## 개요

UPGRADE_PLAN.md에 따라 다음 영역들을 개선했습니다:
- UI/UX 개선 (Phase 2)
- 성능 최적화 (Phase 3)
- 타입 안전성 강화 (Phase 5)

---

## 1. UI/UX 개선

### 1.1 툴바 레이아웃 최적화 (Phase 2.1)

**변경 전**: 2줄로 구성된 복잡한 툴바
```
┌─────────────────────────────────────────────────────────┐
│ 스타일(3버튼) | 제목폰트 | 제목굵기 | 제목크기 | 본문폰트 │
│ 색상(6버튼) | 레이아웃편집 |           줌 | 다운로드 │
└─────────────────────────────────────────────────────────┘
```

**변경 후**: 1줄 컴팩트 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ 스타일▾ | ●●●●●● | 폰트▾ | 편집 |    ━━●━━ | JPG │
└─────────────────────────────────────────────────────────┘
```

**주요 변경사항**:
- 템플릿 스타일: 버튼 그룹 → 드롭다운 메뉴
- 색상 선택: 텍스트 버튼 → 원형 컬러 버튼 (hover시 확대 효과)
- 폰트 설정: 여러 개의 select → 하나의 드롭다운 패널로 통합
- 다운로드 버튼: "JPG 다운로드" → "JPG" (간결화)

**수정 파일**: `src/app/page.tsx`

---

### 1.2 Class Selector 영역 정리 (Phase 2.2)

**주요 변경사항**:
- `SaveStatus` 컴포넌트 통합 (상대 시간 표시: "2분 전 저장됨")
- 상태 버튼(draft/teacher-reviewed/admin-reviewed)을 라디오 그룹 스타일로 변경
- 삭제/휴지통 버튼을 hover 드롭다운으로 통합

**수정 파일**: `src/app/page.tsx`

---

### 1.3 레이아웃 편집 UX 개선 (Phase 2.4)

**편집 모드 배너 개선**:
```tsx
// 변경 전
<div className="text-amber-700 bg-amber-100">
  드래그하여 요소 이동, 모서리 드래그하여 크기 조절
</div>

// 변경 후
<div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100">
  <Layout icon /> 레이아웃 편집 모드 │ 요소를 드래그하여 이동...
</div>
```

**키보드 단축키 안내 추가**:
```
단축키: ↑↓←→ 1px 이동 | Shift+↑↓←→ 10px | Ctrl+클릭 다중선택 | Del 초기화 | Esc 선택해제
```

**수정 파일**:
- `src/app/page.tsx`
- `src/components/templates/TemplateEditOverlay.tsx`

---

## 2. 성능 최적화

### 2.1 입력 디바운싱 (Phase 3.1.A)

**새로운 컴포넌트 생성**: `src/components/ui/DebouncedTextField.tsx`

```typescript
// DebouncedInput - 텍스트 입력용
export function DebouncedInput({
  value,
  onChange,
  debounceMs = 150,
  ...props
}: DebouncedInputProps)

// DebouncedTextarea - 멀티라인 입력용
export function DebouncedTextarea({
  value,
  onChange,
  debounceMs = 150,
  ...props
}: DebouncedTextareaProps)
```

**특징**:
- 로컬 상태로 즉각적인 타이핑 반응
- 디바운스 후 부모에 값 전달 (기본 150ms)
- 포커스 아웃 시 즉시 반영
- 외부 값 변경 시 자동 동기화

**적용 파일**: `src/components/editor/sections/BasicInfoSection.tsx`
- 10개 이상의 입력 필드에 디바운싱 적용

---

### 2.2 템플릿 컴포넌트 메모이제이션 (Phase 3.1.B)

**적용 파일**:
- `src/components/templates/TemplateStyle1.tsx`
- `src/components/templates/TemplateStyle2.tsx`
- `src/components/templates/TemplateStyle3.tsx`

**변경사항**:

1. **React.memo 적용**
```typescript
// 변경 전
export default TemplateStyle1;

// 변경 후
export default React.memo(TemplateStyle1);
```

2. **useMemo로 비용이 큰 계산 캐싱**
```typescript
// 월별 그룹화
const groupedByMonth = useMemo(() => {...}, [feeInfo?.rows]);

// 수업일정 계산
const scheduleRows = useMemo(
  () => buildScheduleRows(classPlan.classDay, classPlan.classTime),
  [classPlan.classDay, classPlan.classTime]
);

// 그리드 비율 계산
const gridRatio = useMemo(
  () => calculateTeacherScheduleRatio(classPlan.classDay, classPlan.classTime),
  [classPlan.classDay, classPlan.classTime]
);

// 주차별 계획 분할
const { leftWeeks, rightWeeks, midPoint } = useMemo(() => {...}, [weeklyPlan]);

// 학습과정/교재 행 데이터
const courseRows = useMemo(() => [...], [classPlan.course1, ...]);
```

3. **useCallback으로 함수 메모이제이션**
```typescript
const getSize = useCallback((field: keyof FieldFontSizes): number => {
  return getFieldFontSize(fieldFontSizes, field, typography.bodySize);
}, [fieldFontSizes, typography.bodySize]);
```

---

## 3. 타입 안전성 강화

### 3.1 Zod 스키마 추가 (Phase 5.1)

**패키지 설치**: `npm install zod`

**수정 파일**: `src/lib/types.ts`

**추가된 스키마들**:

```typescript
// 레이아웃 제한 상수
export const LAYOUT_LIMITS = {
  POSITION_MIN: -100,
  POSITION_MAX: 100,
  SIZE_MIN: -50,
  SIZE_MAX: 50,
} as const;

// ElementLayout 스키마
export const elementLayoutSchema = z.object({
  x: z.number().min(-100).max(100).optional(),
  y: z.number().min(-100).max(100).optional(),
  width: z.number().min(-50).max(50).optional(),
  height: z.number().min(-50).max(50).optional(),
  visible: z.boolean().optional(),
});

// TemplateLayoutConfig 스키마
export const templateLayoutConfigSchema = z.object({
  header: elementLayoutSchema.optional(),
  teacherInfo: elementLayoutSchema.optional(),
  // ... 기타 섹션들
});

// WeeklyItem, FeeRow, FeeInfo 스키마
export const weeklyItemSchema = z.object({...});
export const feeRowSchema = z.object({...});
export const feeInfoSchema = z.object({...});

// Enum 스키마들
export const colorThemeSchema = z.enum(['green', 'blue', 'purple', 'orange', 'teal', 'dancheong']);
export const templateCategorySchema = z.enum(['style1', 'style2', 'style3']);
export const fontFamilySchema = z.enum([...]);
export const classPlanStatusSchema = z.enum(['draft', 'teacher-reviewed', 'admin-reviewed']);

// ClassPlan 부분 스키마
export const classPlanPartialSchema = z.object({...}).partial();
```

**검증 헬퍼 함수들**:

```typescript
// 레이아웃 값 검증
export const validateElementLayout = (layout: unknown): ElementLayout | null => {
  const result = elementLayoutSchema.safeParse(layout);
  return result.success ? result.data : null;
};

// 템플릿 레이아웃 설정 검증
export const validateTemplateLayoutConfig = (config: unknown): TemplateLayoutConfig | null => {
  const result = templateLayoutConfigSchema.safeParse(config);
  return result.success ? result.data : null;
};

// ClassPlan 부분 업데이트 검증
export const validateClassPlanPatch = (patch: unknown): Partial<ClassPlan> | null => {
  const result = classPlanPartialSchema.safeParse(patch);
  return result.success ? (result.data as Partial<ClassPlan>) : null;
};
```

---

## 4. 에러 처리

### 4.1 ErrorBoundary 컴포넌트 (Phase 5.2)

**새로운 파일**: `src/components/ErrorBoundary.tsx`

```typescript
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface Props {
  children: React.ReactNode;
  title?: string;
  compact?: boolean;
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export default function ErrorBoundary({ children, title, compact, onReset, onError }: Props)
export function SectionErrorBoundary({ children, title, onReset }: {...})
```

**특징**:
- 두 가지 모드: 일반 / 컴팩트
- 에러 메시지 및 스택 트레이스 표시
- "다시 시도" 버튼으로 복구 가능
- `onError` 콜백으로 에러 로깅 지원

**적용 위치** (`src/app/page.tsx`):
- EditorPanel 래핑
- 템플릿 미리보기 래핑

---

## 5. 기타 개선사항

### 5.1 useDebounce 훅

**파일**: `src/hooks/useDebounce.ts`

```typescript
// 값 디바운싱
export function useDebounce<T>(value: T, delay: number): T

// 콜백 디바운싱
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T
```

---

## 수정된 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/page.tsx` | 수정 | 툴바 레이아웃, SaveStatus, ErrorBoundary 통합 |
| `src/lib/types.ts` | 수정 | Zod 스키마 추가 |
| `src/components/templates/TemplateStyle1.tsx` | 수정 | 메모이제이션 적용 |
| `src/components/templates/TemplateStyle2.tsx` | 수정 | 메모이제이션 적용 |
| `src/components/templates/TemplateStyle3.tsx` | 수정 | 메모이제이션 적용 |
| `src/components/templates/TemplateEditOverlay.tsx` | 수정 | 키보드 단축키 안내 추가 |
| `src/components/editor/sections/BasicInfoSection.tsx` | 수정 | 디바운싱 적용 |
| `src/components/ui/DebouncedTextField.tsx` | 신규 | 디바운싱 입력 컴포넌트 |
| `src/components/ErrorBoundary.tsx` | 신규 | 에러 바운더리 컴포넌트 |
| `src/hooks/useDebounce.ts` | 신규 | 디바운싱 훅 |

---

## 설치된 패키지

```bash
npm install zod                    # 타입 검증
npm install react-error-boundary   # 에러 바운더리 (기존 설치됨)
npm install sonner                 # 토스트 알림 (기존 설치됨)
npm install react-rnd              # 드래그/리사이즈 (기존 설치됨)
```

---

## 빌드 결과

```
Route (app)                    Size     First Load JS
┌ ○ /                         38 kB    313 kB
├ ○ /admin/accounts           8.04 kB  165 kB
├ ○ /design                   9.67 kB  173 kB
├ ○ /login                    4.02 kB  163 kB
├ ƒ /preview/[id]             2.59 kB  272 kB
└ ○ /trash                    6.96 kB  173 kB

+ First Load JS shared by all  102 kB
```

---

## 6. 테스트 추가 (Phase 5.3)

### 6.1 테스트 환경 설정

**설치된 패키지**:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**새로운 파일**:
- `vitest.config.ts` - Vitest 설정
- `src/__tests__/setup.ts` - 테스트 설정 파일

**package.json 스크립트 추가**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 6.2 a4Utils 테스트

**파일**: `src/lib/__tests__/a4Utils.test.ts`

테스트 케이스 (13개):
- A4 상수 검증 (A4_RATIO, A4_WIDTH_PX, A4_HEIGHT_PX)
- `calculateA4Width()` 함수 테스트
- `calculateA4Scale()` 함수 테스트
- 부동소수점 연산 정확도 검증

### 6.3 templateEditStore 테스트

**파일**: `src/store/__tests__/templateEditStore.test.ts`

테스트 케이스 (29개):
- 상수 검증 (LAYOUT_POSITION_LIMIT, LAYOUT_SIZE_LIMIT)
- `clampPosition()`, `clampSize()` 함수 테스트
- `normalizeElementLayout()` 함수 테스트
- `isValidPosition()`, `isValidSize()` 함수 테스트
- `sectionIdToConfigKey` 매핑 검증
- Zustand 스토어 액션 테스트 (setEditMode, updateElementLayout, 스냅샷 등)

### 6.4 테스트 결과

```
 ✓ src/lib/__tests__/a4Utils.test.ts (13 tests)
 ✓ src/store/__tests__/templateEditStore.test.ts (29 tests)

 Test Files  2 passed (2)
      Tests  42 passed (42)
```

---

## 향후 작업 (미완료)

UPGRADE_PLAN.md에서 아직 진행되지 않은 항목들:

- Phase 3.1.C: 섹션별 독립 컴포넌트화 (복잡도 높음, 메모이제이션으로 대체)
- Phase 4.1.A: 미사용 패키지 제거 (@dnd-kit 사용 중, html2canvas 폴백 유지)
- 반응형 디자인 개선

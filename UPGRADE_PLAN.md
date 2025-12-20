# 강의계획서 매니저 v2.0 종합 업그레이드 플랜

**작성일**: 2025-12-20
**목표**: 템플릿 시스템, UX, 성능의 전면 개선

---

## 📦 추천 라이브러리 스택 (Quick Start)

```bash
# 설치할 패키지
npm install react-rnd sonner react-error-boundary @uidotdev/usehooks
npm install -D @next/bundle-analyzer

# 제거할 패키지
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities html2canvas
```

| 영역 | 현재 | 변경 후 |
|------|------|---------|
| 드래그/리사이즈 | 커스텀 DOM 조작 | **react-rnd** |
| 토스트 알림 | alert() | **sonner** |
| 에러 처리 | 없음 | **react-error-boundary** |
| Undo/Redo | 없음 | **@uidotdev/usehooks** (useHistoryState) |
| 이미지 변환 | html-to-image + html2canvas | **html-to-image만** |
| 번들 분석 | 없음 | **@next/bundle-analyzer** |

---

## 개요

6가지 핵심 영역에 대한 체계적인 개선을 진행합니다:

| # | 영역 | 현재 상태 | 목표 |
|---|------|----------|------|
| 1 | 템플릿 레이아웃 편집/저장 | 불완전, 저장 이슈 | 안정적이고 직관적인 편집 |
| 2 | 입력-템플릿 동적 연동 | 작동하나 부정확 | 정교하고 반응형 연동 |
| 3 | A4 비율 조정 | 기능하나 불안정 | 정교하고 일관된 비율 유지 |
| 4 | UI 레이아웃/버튼 배치 | 혼잡하고 비효율적 | 깔끔하고 효율적인 구성 |
| 5 | UX 정교함 | 불편함 산재 | 부드럽고 직관적인 경험 |
| 6 | 성능 최적화 | 최적화 부재 | 빠르고 반응적인 앱 |

---

## Phase 1: 핵심 기능 안정화 (우선순위 최상)

### 1.1 템플릿 레이아웃 편집 시스템 재설계

#### 현재 문제점
- `templateEditStore.ts`: 값 범위 제한이 너무 엄격 (±50px 위치, ±30px 크기)
- `TemplateEditOverlay.tsx`: DOM 직접 조작으로 React 상태 불일치
- 저장 시 비동기 처리 순차 실행으로 느림
- 취소 시 원본 복원 불완전

#### 🔧 도입 라이브러리
| 패키지 | 용도 | 설치 |
|--------|------|------|
| **react-rnd** | 드래그/리사이즈 통합 | `npm install react-rnd` |
| **react-error-boundary** | 편집 오류 격리 | `npm install react-error-boundary` |

#### 개선 계획

**A. react-rnd로 드래그/리사이즈 전환** ⭐ 핵심 변경
```typescript
// 현재: 커스텀 DOM 조작
element.style.transform = `translate(${x}px, ${y}px)`;

// 변경: react-rnd 컴포넌트
import { Rnd } from 'react-rnd';

<Rnd
  position={{ x: layout.x, y: layout.y }}
  size={{ width: layout.width, height: layout.height }}
  onDragStop={(e, d) => updateLayout(sectionId, { x: d.x, y: d.y })}
  onResizeStop={(e, dir, ref) => updateLayout(sectionId, {
    width: ref.offsetWidth,
    height: ref.offsetHeight
  })}
  dragGrid={[5, 5]}      // 5px 스냅
  scale={zoomLevel}       // 줌 레벨 대응
  bounds="parent"         // 부모 요소 내 제한
/>
```

**B. 레이아웃 범위 제한 완화**
```
파일: src/store/templateEditStore.ts
- LAYOUT_POSITION_LIMIT: 50 → 100 (또는 비율 기반으로 변경)
- LAYOUT_SIZE_LIMIT: 30 → 50
- 섹션별로 다른 제한값 적용 가능하도록 확장
```

**C. 저장 로직 병렬화 및 에러 처리 강화**
```
파일: src/app/page.tsx - handleLayoutSave()
현재: for...of 순차 저장
변경: Promise.allSettled() 병렬 저장
- 부분 실패 시 실패한 항목만 재시도
- 저장 진행률 표시 (n/total)
```

**D. 취소 시 완벽 복원 메커니즘**
```
파일: src/store/templateEditStore.ts
- 편집 모드 진입 시 전체 레이아웃 스냅샷 저장
- 취소 시 스냅샷에서 복원
- isSaving 플래그로 저장/취소 구분 불필요하게 단순화
```

---

### 1.2 A4 비율 조정 시스템 통합 및 정교화

#### 현재 문제점
- `page.tsx`의 `adjustToA4()`와 `download.ts`의 `resizeToA4()` 로직 분리
- ResizeObserver 콜백 중복 호출 가능
- 무한 루프 방지 로직이 불완전 (adjustCountRef 기반)

#### 개선 계획

**A. A4 비율 계산 유틸리티 통합**
```
새 파일: src/lib/a4Utils.ts

export const A4_RATIO = 297 / 210; // 1.414
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export function calculateA4Dimensions(
  contentWidth: number,
  contentHeight: number,
  options?: { maxScale?: number; padding?: number }
): { width: number; height: number; scale: number }

export function measureContentSize(element: HTMLElement): { width: number; height: number }
```

**B. ResizeObserver 로직 개선**
```
파일: src/app/page.tsx

현재 방식:
- 300ms setTimeout으로 디바운싱
- adjustCountRef로 무한 루프 방지 (불완전)

변경 방식:
- requestAnimationFrame 기반 디바운싱
- 실제 크기 변화량 기준 업데이트 (threshold 기반)
- 편집 모드 중에도 비율 유지 (현재는 비활성화)
```

**C. 미리보기-다운로드 일관성 보장**
```
파일: src/lib/download.ts

- a4Utils.ts의 공통 함수 사용
- 다운로드 전 adjustToA4() 호출하여 미리보기와 동일 상태 보장
- 스케일 계산 로직 통합
```

---

## Phase 2: UI/UX 개선 (우선순위 상)

### 🔧 Phase 2 도입 라이브러리
| 패키지 | 용도 | 설치 |
|--------|------|------|
| **sonner** | 토스트 알림 (alert 대체) | `npm install sonner` |
| **@uidotdev/usehooks** | useHistoryState (Undo/Redo) | `npm install @uidotdev/usehooks` |

### 2.1 UI 레이아웃 재구성

#### 현재 문제점
- Preview Toolbar가 두 줄 차지 → 미리보기 공간 축소
- 버튼 우선순위 불명확, 시각적 구분 약함
- 반응형 디자인 부재 (min-w-[700px] 고정)

#### 개선 계획

**A. 툴바 레이아웃 최적화**
```
현재 구조 (2줄):
┌─────────────────────────────────────────────┐
│ 스타일(3) | 제목폰트 | 제목굵기 | 제목크기 | 본문폰트 │
│ 색상(6) | 레이아웃편집 |        줌 | 다운로드 │
└─────────────────────────────────────────────┘

변경 구조 (1줄 + 컴팩트):
┌─────────────────────────────────────────────┐
│ 스타일▾ | 색상● | 폰트▾ | 편집 | ━━○━━ | ⬇ │
└─────────────────────────────────────────────┘
- 드롭다운/팝오버로 상세 옵션 숨김
- 색상은 작은 원형 버튼으로 표시
- 폰트 설정은 하나의 드롭다운으로 통합
```

**B. 버튼 그룹화 및 시각적 구분**
```
파일: src/app/page.tsx의 Preview 영역

| 그룹 | 내용 | 스타일 |
|------|------|--------|
| 템플릿 스타일 | Style1/2/3 + 색상 | 좌측 배치, 구분선 |
| 타이포그래피 | 폰트 드롭다운 | 중앙 배치 |
| 편집 도구 | 레이아웃 편집 | 아이콘 버튼 |
| 미리보기 조절 | 줌 슬라이더 | 우측 배치 |
| 내보내기 | JPG 다운로드 | 우측 끝, 강조색 |
```

**C. 반응형 디자인 추가**
```
파일: src/app/page.tsx

- min-w-[700px] 제거
- Tailwind 반응형 클래스 적용 (sm:, md:, lg:)
- 작은 화면: 좌우 패널 → 상하 탭 전환
- 중간 화면: 좌측 패널 축소 가능
- 큰 화면: 현재 레이아웃 유지
```

---

### 2.2 Class Selector 영역 정리

#### 현재 상태
```
┌─ 강사 필터 ─┬─ 강의 선택 ─┬─ + ─┬─ 🗑 ─┬─ 📥 ─┬─ 마지막 저장 ─┬─ 임시저장 ─┬─ 상태버튼들 ─┐
```

#### 개선 계획
```
변경 구조:
┌─────────────────────────────────────────────────────────────────┐
│  📚 [강사▾] [강의 선택▾]  [+] [🗑]     ⏱ 2분 전 저장    [저장] │
│                                         draft ○ reviewed ○      │
└─────────────────────────────────────────────────────────────────┘

개선 사항:
- 휴지통 이동(Archive) 버튼: 삭제 드롭다운 메뉴 안으로 이동
- 저장 시간: "마지막 저장: HH:MM" → "n분 전 저장" 상대 시간
- 임시저장 버튼: 더 눈에 띄게 (배경색 강조)
- 상태 버튼들: 토글 스위치 또는 라디오 그룹 스타일
```

---

### 2.3 저장/로딩 상태 피드백 개선

#### 현재 문제점
- 저장 중 Save 아이콘만 animate-pulse (너무 미묘)
- 에러 발생 시 alert + 상태 표시 중복
- 저장 진행 상황 표시 없음

#### 개선 계획

**A. 저장 상태 표시 개선**
```
새 컴포넌트: src/components/ui/SaveStatus.tsx

상태별 표시:
- idle: 체크 아이콘 + "저장됨"
- saving: 스피너 + "저장 중..."
- error: 경고 아이콘 + "저장 실패" + 재시도 버튼
- unsaved: 점 + "변경사항 있음"
```

**B. Sonner 토스트 알림 도입** ⭐ 핵심 변경
```typescript
// src/app/layout.tsx에 Toaster 추가
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

// 기존 alert() 호출을 toast로 변경
// Before: alert('저장되었습니다');
// After:
import { toast } from 'sonner';
toast.success('저장되었습니다');

// 로딩 → 완료 패턴
const toastId = toast.loading('저장 중...');
await savePlan(id);
toast.success('저장 완료!', { id: toastId });
```

**C. 저장 중 입력 필드 비활성화**
```
파일: src/components/EditorPanel.tsx

- isSaving prop 전달
- 저장 중 모든 입력 필드 disabled + 반투명 오버레이
- 저장 완료 후 자동 focus 복원
```

---

### 2.4 레이아웃 편집 모드 UX 개선

#### 현재 문제점
- Ctrl+클릭 다중 선택이 직관적이지 않음 (모바일 미지원)
- 선택된 요소 순서 표시가 너무 작음
- 편집 모드 진입/종료 상태 불명확

#### 개선 계획

**A. 편집 모드 진입/종료 개선**
```
파일: src/components/TemplateEditOverlay.tsx

진입 시:
- 배경 딤 처리 (overlay)
- 상단에 "레이아웃 편집 모드" 배너 표시
- 저장/취소 버튼을 항상 보이는 플로팅 위치로

종료 시:
- 변경사항 있으면 "저장하지 않고 나가시겠습니까?" 확인
- 애니메이션으로 부드럽게 전환
```

**B. 요소 선택 UI 개선**
```
현재: Ctrl+클릭으로 다중 선택
변경:
- 각 요소에 체크박스 아이콘 표시 (hover 시)
- 클릭으로 토글 선택
- "모두 선택" / "선택 해제" 버튼 추가
- 선택된 요소 목록 사이드 패널에 표시
```

**C. 키보드 단축키 안내**
```
편집 모드 하단에 단축키 안내 표시:
- ←→↑↓: 1px 이동
- Shift+화살표: 10px 이동
- Delete: 위치 초기화
- Escape: 선택 해제
- Ctrl+S: 저장
- Ctrl+Z: 실행 취소 (새로 추가)
```

---

## Phase 3: 입력-템플릿 동적 연동 정교화 (우선순위 상)

### 🔧 Phase 3 도입 라이브러리/패턴
| 패키지/패턴 | 용도 | 비고 |
|------------|------|------|
| **useDebounce 훅** | 입력 디바운싱 | 커스텀 구현 (부록 D 참조) |
| **React.memo** | 템플릿 섹션 메모이제이션 | React 내장 |
| **useMemo/useCallback** | 계산 캐싱 | React 내장 |
| **useShallow** | Zustand 선택적 구독 | `zustand/react/shallow` |

### 3.1 실시간 미리보기 최적화

#### 현재 문제점
- 각 입력마다 ResizeObserver 콜백 → 렌더링 폭증
- debouncing 없음
- 선택적 업데이트 부재 (전체 템플릿 리렌더링)

#### 개선 계획

**A. 입력 디바운싱 적용**
```
파일: src/components/EditorPanel.tsx

- 텍스트 입력에 150ms 디바운스 적용
- 드롭다운 변경은 즉시 반영
- 숫자 입력에는 300ms 디바운스 (연속 입력 고려)
```

**B. 템플릿 컴포넌트 메모이제이션**
```
파일: src/components/templates/TemplateStyle1.tsx (및 2, 3)

- React.memo() 적용
- useMemo로 복잡한 계산 캐싱 (스케줄 파싱, 비용 행 등)
- 변경된 섹션만 리렌더링하도록 분리
```

**C. 섹션별 독립 컴포넌트화**
```
새 구조:
TemplateStyle1
├── HeaderSection (memo)
├── TeacherScheduleSection (memo)
├── CurriculumSection (memo)
├── WeeklyPlanSection (memo)
├── FeeSection (memo)
└── TargetStudentSection (memo)

각 섹션은 해당 데이터만 props로 받아 독립 렌더링
```

---

### 3.2 스케줄 텍스트 길이 기반 레이아웃 조정

#### 현재 구현
```typescript
// src/lib/utils.ts - calculateTeacherScheduleRatio()
텍스트 길이에 따라 그리드 비율 조정
```

#### 개선 계획

**A. 텍스트 오버플로우 처리 개선**
```
- 긴 텍스트: 자동 줄바꿈 + 폰트 크기 축소 (단계별)
- 매우 긴 텍스트: 말줄임표(...) 처리 + 툴팁
- 실시간 미리보기에서 오버플로우 경고 표시
```

**B. 그리드 비율 동적 조정 정교화**
```
파일: src/lib/utils.ts

현재: 고정된 breakpoint 기반
변경:
- 실제 렌더링된 텍스트 크기 측정 (getBoundingClientRect)
- 컨테이너 대비 비율로 동적 조정
- 최소/최대 비율 제한 (가독성 보장)
```

---

## Phase 4: 성능 최적화 (우선순위 중상)

### 🔧 Phase 4 패키지 변경
| 작업 | 패키지 | 명령어 |
|------|--------|--------|
| ❌ 제거 | @dnd-kit/* | `npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| ❌ 제거 | html2canvas | `npm uninstall html2canvas` (html-to-image만 유지) |
| ✅ 추가 | @next/bundle-analyzer | `npm install -D @next/bundle-analyzer` |

### 4.1 번들 크기 최적화

#### 현재 문제점
- @dnd-kit: 미사용 (~15-20KB)
- html-to-image + html2canvas 중복 (~100KB)
- 불필요한 의존성 존재 가능

#### 개선 계획

**A. 미사용 패키지 제거**
```bash
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**B. 이미지 변환 라이브러리 통합**
```
선택: html-to-image 유지 (더 가벼움)
변경:
- html2canvas 제거
- html-to-image 실패 시 에러 처리 강화 (재시도 로직)
- 또는 html-to-image 실패 빈도 모니터링 후 결정
```

**C. 동적 임포트 적용**
```
// 무거운 컴포넌트는 동적 로딩
const BulkDownloadModal = dynamic(() => import('./BulkDownloadModal'));
const TemplateEditOverlay = dynamic(() => import('./TemplateEditOverlay'));
```

---

### 4.2 렌더링 성능 최적화

#### 현재 문제점
- TemplateEditOverlay: 드래그 중 매 mousemove마다 렌더링
- Snap guides 계산 O(n²)
- ResizeObserver 콜백 체이닝

#### 개선 계획

**A. 드래그 성능 개선**
```
파일: src/components/TemplateEditOverlay.tsx

- requestAnimationFrame으로 업데이트 제한
- Snap guides: 사전 계산 후 캐싱
- 드래그 중 간단한 시각적 피드백만 표시
- 드래그 종료 시 전체 업데이트
```

**B. 상태 업데이트 최적화**
```
파일: src/store/templateEditStore.ts

- Zustand의 shallow 비교 활용
- 불변성 유지하며 필요한 부분만 업데이트
- selector 함수로 구독 최소화
```

---

### 4.3 이미지 다운로드 최적화

#### 현재 문제점
- pixelRatio 4 → 약 57MB 메모리 사용
- 폰트 로딩 대기 시간 불확실
- 진행 표시 없음 (단일 다운로드)

#### 개선 계획

**A. 메모리 사용량 감소**
```
파일: src/lib/download.ts

- pixelRatio: 4 → 2 (여전히 300dpi 수준, 인쇄 품질)
- 또는 사용자 선택 옵션 제공 (웹용/인쇄용)
```

**B. 다운로드 진행 표시**
```
새 컴포넌트: src/components/ui/DownloadProgress.tsx

단계별 표시:
1. 폰트 로딩 중...
2. 이미지 생성 중...
3. 파일 준비 중...
4. 다운로드 완료!
```

---

## Phase 5: 코드 품질 및 안정성 (우선순위 중)

### 5.1 타입 안전성 강화

```
파일: src/lib/types.ts

- TemplateLayoutConfig 타입 확장 (섹션별 제한값)
- 레이아웃 값 검증을 위한 Zod 스키마 추가
- API 응답 타입 엄격화
```

### 5.2 에러 바운더리 추가

```
새 컴포넌트: src/components/ErrorBoundary.tsx

- 템플릿 렌더링 오류 격리
- 레이아웃 편집 오류 격리
- 사용자 친화적 에러 메시지
- 복구 버튼 (새로고침/초기화)
```

### 5.3 테스트 추가

```
새 파일들:
- src/lib/__tests__/a4Utils.test.ts
- src/store/__tests__/templateEditStore.test.ts
- src/components/__tests__/TemplateStyle1.test.tsx

핵심 로직에 대한 단위 테스트:
- A4 비율 계산
- 레이아웃 범위 제한
- 스케줄 파싱
```

---

## 구현 순서 및 예상 작업량

### Phase 1: 핵심 기능 안정화 (1주차)
| 작업 | 파일 | 복잡도 |
|------|------|--------|
| 1.1.A 레이아웃 범위 제한 완화 | templateEditStore.ts | 낮음 |
| 1.1.B 상태 기반 스타일 관리 | TemplateEditOverlay.tsx | 높음 |
| 1.1.C 저장 로직 병렬화 | page.tsx | 중간 |
| 1.1.D 취소 시 복원 | templateEditStore.ts | 중간 |
| 1.2.A A4 유틸리티 통합 | 신규 a4Utils.ts | 중간 |
| 1.2.B ResizeObserver 개선 | page.tsx | 중간 |
| 1.2.C 미리보기-다운로드 일관성 | download.ts | 낮음 |

### Phase 2: UI/UX 개선 (2주차)
| 작업 | 파일 | 복잡도 |
|------|------|--------|
| 2.1.A 툴바 레이아웃 최적화 | page.tsx | 중간 |
| 2.1.B 버튼 그룹화 | page.tsx | 낮음 |
| 2.1.C 반응형 디자인 | page.tsx | 중간 |
| 2.2 Class Selector 정리 | page.tsx | 낮음 |
| 2.3.A 저장 상태 표시 개선 | 신규 SaveStatus.tsx | 낮음 |
| 2.3.B 토스트 알림 시스템 | 신규 Toast.tsx | 중간 |
| 2.3.C 저장 중 비활성화 | EditorPanel.tsx | 낮음 |
| 2.4 레이아웃 편집 UX | TemplateEditOverlay.tsx | 중간 |

### Phase 3: 동적 연동 정교화 (3주차)
| 작업 | 파일 | 복잡도 |
|------|------|--------|
| 3.1.A 입력 디바운싱 | EditorPanel.tsx | 낮음 |
| 3.1.B 템플릿 메모이제이션 | TemplateStyle*.tsx | 중간 |
| 3.1.C 섹션별 컴포넌트화 | templates/ | 높음 |
| 3.2 텍스트 길이 기반 조정 | utils.ts | 중간 |

### Phase 4: 성능 최적화 (4주차)
| 작업 | 파일 | 복잡도 |
|------|------|--------|
| 4.1.A 미사용 패키지 제거 | package.json | 낮음 |
| 4.1.B 이미지 라이브러리 통합 | download.ts | 중간 |
| 4.1.C 동적 임포트 | 여러 파일 | 낮음 |
| 4.2 드래그 성능 개선 | TemplateEditOverlay.tsx | 높음 |
| 4.3 다운로드 최적화 | download.ts | 중간 |

### Phase 5: 코드 품질 (5주차)
| 작업 | 파일 | 복잡도 |
|------|------|--------|
| 5.1 타입 안전성 | types.ts | 중간 |
| 5.2 에러 바운더리 | 신규 ErrorBoundary.tsx | 중간 |
| 5.3 테스트 추가 | __tests__/ | 높음 |

---

## 위험 요소 및 대응 방안

### 1. 레이아웃 편집 상태 기반 전환
- **위험**: 기존 DOM 조작 방식과 충돌
- **대응**: 점진적 마이그레이션, 두 방식 병행 테스트

### 2. 템플릿 섹션 분리
- **위험**: props drilling, 상태 동기화 복잡도 증가
- **대응**: Context API 또는 Zustand selector 활용

### 3. 번들 크기 변경
- **위험**: 다운로드 기능 오류
- **대응**: html2canvas 완전 제거 전 충분한 테스트

### 4. 반응형 디자인
- **위험**: 기존 레이아웃 깨짐
- **대응**: 데스크톱 우선, 점진적 반응형 적용

---

## 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 레이아웃 저장 성공률 | ~90% | 99%+ |
| 미리보기-다운로드 일치율 | ~85% | 99%+ |
| 첫 로딩 시간 (LCP) | 측정 필요 | < 2.5초 |
| 번들 크기 | 측정 필요 | -20% 감소 |
| 드래그 프레임률 | ~30fps | 60fps |
| 저장 응답 시간 | ~2초 | < 1초 |

---

## 결론

이 업그레이드 플랜은 5개 Phase로 구성되며, 각 Phase는 독립적으로 실행 가능합니다. 우선순위에 따라 Phase 1과 2를 먼저 진행하여 사용자 경험을 즉시 개선하고, 이후 Phase 3-5로 기술적 부채를 해소합니다.

**핵심 원칙**:
1. 기존 기능 깨지지 않도록 점진적 개선
2. 각 변경사항은 독립적으로 테스트 가능
3. 사용자 피드백 기반 우선순위 조정 가능

---

## 부록: 외부 사례 및 라이브러리 추천

### A. 레이아웃 편집 - 드래그/리사이즈 라이브러리

현재 커스텀 구현된 드래그/리사이즈 기능을 개선하거나 대체할 수 있는 검증된 라이브러리들:

| 라이브러리 | 특징 | 적용 가능성 |
|-----------|------|------------|
| [**react-rnd**](https://github.com/bokuweb/react-rnd) | 드래그 + 리사이즈 통합, `lockAspectRatio`, `dragGrid` 스냅 지원, scale 옵션으로 줌 대응 | ⭐ **강력 추천** |
| [**React Grid Layout**](https://github.com/react-grid-layout/react-grid-layout) | 그리드 기반 레이아웃, 반응형 breakpoints, 자동 충돌 방지 | 그리드 기반 템플릿에 적합 |
| [**Gridstack.js**](https://gridstackjs.com/) | 대시보드 스타일 레이아웃, 드래그/리사이즈/스냅 | React 통합 약간 복잡 |

**react-rnd 적용 시 이점:**
```typescript
// 현재 커스텀 구현
element.style.transform = `translate(${x}px, ${y}px)`;

// react-rnd로 변경 시
<Rnd
  position={{ x, y }}
  size={{ width, height }}
  onDragStop={(e, d) => updateLayout(id, { x: d.x, y: d.y })}
  onResizeStop={(e, dir, ref, delta, pos) => updateLayout(id, { width: ref.offsetWidth })}
  dragGrid={[10, 10]}  // 10px 스냅
  lockAspectRatio={true}  // 비율 유지
  scale={zoomLevel}  // 줌 레벨 대응
/>
```

**참고 자료:**
- [Top 5 Drag-and-Drop Libraries for React in 2025 (Puck)](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [Best React Grid Layout Components Libraries 2025](https://themeselection.com/react-grid-layout/)

---

### B. 대시보드 UI/툴바 디자인 패턴

현대적인 Next.js 대시보드 템플릿들에서 발견된 공통 패턴:

**1. 툴바 레이아웃 패턴**
```
┌─────────────────────────────────────────────────────────┐
│  [≡] Logo     [🔍 Search...]     [🔔] [⚙] [👤 User ▾]  │  ← 상단 네비게이션
├─────────────────────────────────────────────────────────┤
│  Template ▾ │ Colors ●●●●●● │ Font ▾ │ ━━●━━ │ [⬇ JPG]│  ← 컨텍스트 툴바
└─────────────────────────────────────────────────────────┘
```

**2. 핵심 디자인 원칙 (2025 트렌드)**
- **Collapsible Sidebar**: 좌측 패널 접기/펼치기
- **Dark Mode 지원**: CSS 변수 기반 테마 전환
- **컴포넌트 모듈화**: 재사용 가능한 UI 컴포넌트
- **Mobile-first 반응형**: Tailwind breakpoints 활용

**추천 참고 템플릿:**
- [TailAdmin Next.js V2](https://tailadmin.com/nextjs-components) - 500+ 컴포넌트, 6가지 대시보드 변형
- [NextAdmin](https://nextadmin.co/) - Next.js 15 + Tailwind CSS, 200+ UI 컴포넌트

---

### C. A4 비율 PDF/이미지 내보내기 Best Practices

**1. html2canvas + jsPDF 조합 패턴**
```typescript
// 고품질 A4 내보내기 패턴
const exportToA4 = async (element: HTMLElement) => {
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 2,  // 고해상도 (4는 과도함)
    logging: false,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;  // 비율 유지

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfWidth, pdfHeight);
};
```

**2. react-to-pdf 라이브러리 옵션**
```typescript
import { usePDF } from 'react-to-pdf';

const { toPDF, targetRef } = usePDF({
  filename: 'lecture-plan.pdf',
  page: { format: 'A4', orientation: 'portrait' },
  resolution: Resolution.MEDIUM,  // 3x (HIGH = 5x는 성능 이슈)
});
```

**주의사항:**
- pixelRatio 10 이상: 페이지 크래시 위험
- 외부 스타일시트: jsPDF에서 무시됨 → 인라인 스타일 권장
- 웹폰트: `document.fonts.ready` 대기 필수

**참고 자료:**
- [Generate PDFs from HTML in React with jsPDF](https://www.nutrient.io/blog/how-to-convert-html-to-pdf-using-react/)
- [react-to-pdf npm](https://www.npmjs.com/package/react-to-pdf)

---

### D. 실시간 미리보기 디바운싱 패턴

**1. useDebounce 훅 구현**
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 사용 예시
const [inputValue, setInputValue] = useState('');
const debouncedValue = useDebounce(inputValue, 300);

useEffect(() => {
  updateClassPlan(selectedId, { title: debouncedValue });
}, [debouncedValue]);
```

**2. 콜백 디바운싱 (useMemo + lodash)**
```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedUpdate = useMemo(
  () => debounce((value) => updateClassPlan(selectedId, value), 300),
  [selectedId]
);

// cleanup 필수!
useEffect(() => {
  return () => debouncedUpdate.cancel();
}, [debouncedUpdate]);
```

**3. Throttle vs Debounce 선택 기준**
| 상황 | 추천 | 이유 |
|------|------|------|
| 검색 입력 | Debounce (300ms) | 타이핑 완료 후 검색 |
| 자동 저장 | Throttle (5s) | 주기적 저장으로 데이터 손실 방지 |
| 리사이즈 | Debounce (150ms) | 최종 크기만 필요 |
| 스크롤 | Throttle (100ms) | 부드러운 반응 필요 |

**참고 자료:**
- [How to debounce and throttle in React](https://www.developerway.com/posts/debouncing-in-react)
- [useDebounce Hook](https://usehooks.com/usedebounce)

---

### E. Zustand 성능 최적화 패턴

**1. useShallow로 불필요한 리렌더링 방지**
```typescript
// ❌ 문제: 매 렌더링마다 새 객체 생성 → 항상 리렌더링
const { plans, updatePlan } = useClassPlanStore(state => ({
  plans: state.classPlans,
  updatePlan: state.updateClassPlan,
}));

// ✅ 해결: useShallow 사용
import { useShallow } from 'zustand/react/shallow';

const { plans, updatePlan } = useClassPlanStore(
  useShallow(state => ({
    plans: state.classPlans,
    updatePlan: state.updateClassPlan,
  }))
);
```

**2. 액션 분리 패턴**
```typescript
// 액션은 절대 변경되지 않으므로 별도 훅으로 분리
export const useClassPlanActions = () =>
  useClassPlanStore(state => ({
    updatePlan: state.updateClassPlan,
    savePlan: state.savePlan,
    deletePlan: state.deletePlan,
  }));

// 컴포넌트에서 사용 - 액션 변경으로 인한 리렌더링 없음
const { updatePlan, savePlan } = useClassPlanActions();
```

**3. 선택적 구독**
```typescript
// ❌ 전체 상태 구독
const store = useClassPlanStore();

// ✅ 필요한 상태만 구독
const selectedPlan = useClassPlanStore(state =>
  state.classPlans.find(p => p.id === selectedId)
);
```

**참고 자료:**
- [Optimizing React Performance with Zustand](https://tillitsdone.com/blogs/react-performance-with-zustand/)
- [useShallow - Zustand Docs](https://zustand.docs.pmnd.rs/hooks/use-shallow)
- [Working with Zustand - TkDodo](https://tkdodo.eu/blog/working-with-zustand)

---

### F. React 컴포넌트 메모이제이션 가이드

**1. React.memo 적용 기준**
```typescript
// ✅ 적합한 경우: 자주 렌더링, 비용이 큼, props가 잘 변하지 않음
const TemplateSection = React.memo(({ data, layoutConfig }) => {
  // 복잡한 렌더링 로직
});

// ❌ 불필요한 경우: 간단한 컴포넌트, props가 자주 변함
const SimpleButton = ({ onClick }) => <button onClick={onClick}>Click</button>;
```

**2. useMemo로 계산 캐싱**
```typescript
const TemplateStyle1 = memo(({ classPlan, colorTheme }) => {
  // 스케줄 파싱 결과 캐싱
  const scheduleRows = useMemo(
    () => parseScheduleWithPeriod(classPlan.classDays, classPlan.classTime),
    [classPlan.classDays, classPlan.classTime]
  );

  // 비용 행 계산 캐싱
  const feeTotal = useMemo(
    () => classPlan.feeRows.reduce((sum, row) => sum + row.amount, 0),
    [classPlan.feeRows]
  );

  return <div>...</div>;
});
```

**3. useCallback으로 함수 참조 안정화**
```typescript
const EditorPanel = ({ planId, onUpdate }) => {
  // ❌ 매 렌더링마다 새 함수 → 자식 리렌더링 유발
  const handleChange = (field, value) => onUpdate(planId, { [field]: value });

  // ✅ 함수 참조 유지
  const handleChange = useCallback(
    (field, value) => onUpdate(planId, { [field]: value }),
    [planId, onUpdate]
  );

  return <MemoizedInput onChange={handleChange} />;
};
```

**4. React 19 컴파일러 고려사항**
React 19의 새 컴파일러는 자동 메모이제이션을 지원하지만, 다음 경우에는 여전히 수동 최적화 필요:
- 서드파티 라이브러리와의 호환성
- 매우 비용이 큰 계산
- strict reference equality가 필요한 경우

**참고 자료:**
- [React.memo 공식 문서](https://react.dev/reference/react/memo)
- [useMemo 공식 문서](https://react.dev/reference/react/useMemo)
- [React Memoization Explained](https://dev.to/maurya-sachin/react-memoization-reactmemo-usecallback-and-usememo-explained-with-real-use-cases-48e8)

---

### G. 토스트 알림 라이브러리 비교

현재 `alert()` 호출을 대체할 모던 토스트 라이브러리:

| 라이브러리 | 번들 크기 | 특징 | 추천 |
|-----------|----------|------|------|
| [**Sonner**](https://github.com/emilkowalski/sonner) | ~5KB | shadcn/ui 기본 컴포넌트, TypeScript-first, 스와이프 애니메이션, Hook 불필요 | ⭐ **강력 추천** |
| [**React Hot Toast**](https://react-hot-toast.com/) | ~5KB | 미니멀, 커스텀 JSX 지원, useToaster headless 모드 | 심플 프로젝트에 적합 |

**Sonner 사용 예시:**
```typescript
// 설치: npm install sonner

// layout.tsx에 Toaster 추가
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}

// 어디서든 호출 가능 (Hook 불필요!)
import { toast } from 'sonner';

// 저장 성공
toast.success('강의계획서가 저장되었습니다');

// 저장 실패 + 재시도
toast.error('저장 실패', {
  action: {
    label: '재시도',
    onClick: () => savePlan(id),
  },
});

// 로딩 상태 → 완료
const toastId = toast.loading('저장 중...');
await savePlan(id);
toast.success('저장 완료!', { id: toastId });
```

**참고 자료:**
- [Comparing React toast libraries 2025 (LogRocket)](https://blog.logrocket.com/react-toast-libraries-compared-2025/)
- [Sonner - shadcn/ui](https://ui.shadcn.com/docs/components/sonner)
- [Top 9 React notification libraries (Knock)](https://knock.app/blog/the-top-notification-libraries-for-react)

---

### H. Next.js 번들 최적화 전략

**1. Dynamic Import 패턴**
```typescript
// 무거운 컴포넌트 동적 로딩
import dynamic from 'next/dynamic';

// 클라이언트 전용 컴포넌트
const TemplateEditOverlay = dynamic(
  () => import('@/components/TemplateEditOverlay'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse">Loading editor...</div>
  }
);

// 모달 컴포넌트 (필요할 때만 로드)
const BulkDownloadModal = dynamic(
  () => import('@/components/BulkDownloadModal'),
  { ssr: false }
);

// 조건부 로딩
const [showModal, setShowModal] = useState(false);
{showModal && <BulkDownloadModal />}  // 모달 열릴 때만 chunk 로드
```

**2. 번들 분석 설정**
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});
```

```bash
# 분석 실행
ANALYZE=true npm run build
```

**3. 패키지 최적화 설정**
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
};
```

**예상 효과:**
- html2canvas 제거: ~50KB 절감
- @dnd-kit 제거: ~20KB 절감
- Dynamic import: 초기 로드 375KB+ 감소 가능

**참고 자료:**
- [Dynamic Imports in Next.js (Leapcell)](https://leapcell.io/blog/optimizing-web-performance-with-dynamic-imports-and-bundle-analysis-in-next-js)
- [Reducing NextJS Bundle Size by 30%](https://www.coteries.com/en/articles/reduce-size-nextjs-bundle)
- [Code Splitting in Next.js (Blazity)](https://blazity.com/blog/code-splitting-next-js)

---

### I. React Error Boundary 패턴

**1. react-error-boundary 라이브러리 사용**
```typescript
// 설치: npm install react-error-boundary

import { ErrorBoundary } from 'react-error-boundary';

// 에러 폴백 컴포넌트
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-red-800 font-semibold">오류가 발생했습니다</h3>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        다시 시도
      </button>
    </div>
  );
}

// 사용 예시
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, info) => {
    // 에러 로깅 (Sentry 등)
    console.error('Error caught:', error, info);
  }}
  onReset={() => {
    // 상태 초기화 로직
    resetLayoutConfig();
  }}
>
  <TemplateEditOverlay />
</ErrorBoundary>
```

**2. 배치 전략**
```
App
├── ErrorBoundary (전역 - 앱 크래시 방지)
│   ├── Header
│   ├── ErrorBoundary (에디터 영역 격리)
│   │   ├── EditorPanel
│   │   └── TemplatePreview
│   └── ErrorBoundary (템플릿 편집 격리)
│       └── TemplateEditOverlay
```

**3. 주의사항**
- Event handlers: try-catch 필요 (ErrorBoundary 미적용)
- Async code: try-catch 필요
- SSR: 서버 에러는 별도 처리

**참고 자료:**
- [Error Boundaries (React 공식)](https://legacy.reactjs.org/docs/error-boundaries.html)
- [Error Handling in React Apps (Medium)](https://medium.com/@rajeevranjan2k11/error-handling-in-react-apps-a-complete-guide-to-error-boundaries-and-best-practices-094aa0e4a641)
- [React Error Boundary (TatvaSoft)](https://www.tatvasoft.com/outsourcing/2025/02/react-error-boundary.html)

---

### J. Tailwind 반응형 사이드바/툴바 패턴

**1. Collapsible 사이드바 구현**
```typescript
// 상태 관리
const [isCollapsed, setIsCollapsed] = useState(false);

// 사이드바 컴포넌트
<aside className={cn(
  "transition-all duration-300 border-r bg-white",
  isCollapsed ? "w-16" : "w-64"
)}>
  {/* 토글 버튼 */}
  <button
    onClick={() => setIsCollapsed(!isCollapsed)}
    className="absolute -right-3 top-6 p-1 bg-white border rounded-full"
  >
    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
  </button>

  {/* 네비게이션 아이템 */}
  <nav className="p-4">
    {menuItems.map(item => (
      <div className="flex items-center gap-3">
        <item.icon className="w-5 h-5" />
        {!isCollapsed && <span>{item.label}</span>}
      </div>
    ))}
  </nav>
</aside>
```

**2. 반응형 툴바 패턴**
```typescript
// 모바일: 햄버거 메뉴, 데스크톱: 전체 표시
<div className="flex items-center gap-2">
  {/* 모바일 메뉴 토글 */}
  <button className="lg:hidden">
    <Menu className="w-5 h-5" />
  </button>

  {/* 데스크톱 툴바 */}
  <div className="hidden lg:flex items-center gap-4">
    <TemplateSelector />
    <ColorPicker />
    <FontSettings />
  </div>

  {/* 항상 표시되는 액션 */}
  <div className="ml-auto flex items-center gap-2">
    <ZoomSlider />
    <DownloadButton />
  </div>
</div>

// 모바일 드로어
{isMobileMenuOpen && (
  <div className="fixed inset-0 z-50 lg:hidden">
    <div className="absolute inset-0 bg-black/50" onClick={close} />
    <div className="absolute left-0 top-0 h-full w-64 bg-white p-4">
      <TemplateSelector />
      <ColorPicker />
      <FontSettings />
    </div>
  </div>
)}
```

**3. 컴포넌트 라이브러리 참고**
- [Flowbite Sidebar](https://flowbite.com/docs/components/sidebar/) - Multi-level 메뉴, 토글
- [Preline Sidebar](https://preline.co/docs/sidebar.html) - Offcanvas 스타일
- [FlyonUI Sidebar](https://flyonui.com/docs/navigations/sidebar/) - 자동 닫힘 반응형

**참고 자료:**
- [Tailwind Sidebar Layouts (공식)](https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/sidebar)
- [Collapsible Sidebar React + Tailwind](https://reacthustle.com/blog/nextjs-react-responsive-collapsible-sidebar-tailwind)
- [26 Tailwind Sidebars (FreeFrontend)](https://freefrontend.com/tailwind-sidebars/)

---

### K. ResizeObserver 성능 최적화 패턴

**1. requestAnimationFrame 통합**
```typescript
// 현재 문제: ResizeObserver 콜백에서 직접 상태 업데이트 → 무한 루프 위험

// ✅ 개선된 패턴
useEffect(() => {
  let rafId: number;
  let lastWidth = 0;
  let lastHeight = 0;

  const observer = new ResizeObserver((entries) => {
    // 이전 RAF 취소
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;

      // 변화량 체크 (threshold 기반)
      const widthDiff = Math.abs(width - lastWidth);
      const heightDiff = Math.abs(height - lastHeight);

      if (widthDiff > 5 || heightDiff > 5) {  // 5px 이상 변화만 처리
        lastWidth = width;
        lastHeight = height;
        adjustToA4({ width, height });
      }
    });
  });

  if (canvasRef.current) {
    observer.observe(canvasRef.current);
  }

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
  };
}, [adjustToA4]);
```

**2. 무한 루프 방지 패턴**
```typescript
// 상태 변경 추적으로 불필요한 업데이트 방지
const isAdjustingRef = useRef(false);

const adjustToA4 = useCallback(({ width, height }) => {
  if (isAdjustingRef.current) return;  // 조정 중이면 스킵

  isAdjustingRef.current = true;

  // ... A4 비율 계산 및 적용

  // 다음 프레임에 플래그 리셋
  requestAnimationFrame(() => {
    isAdjustingRef.current = false;
  });
}, []);
```

**참고 자료:**
- [ResizeObserver API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [ResizeObserver API in React (DhiWise)](https://www.dhiwise.com/blog/design-converter/resolving-resizeobserver-loop-completed-with)
- [requestAnimationFrame Scheduling (Paul Irish)](https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4)

---

### L. Next.js 폰트 최적화

**1. next/font 사용 패턴**
```typescript
// src/app/layout.tsx
import { Noto_Sans_KR, Nanum_Gothic } from 'next/font/google';

// Variable 폰트 사용 (단일 파일로 모든 굵기)
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],  // 또는 'variable'
  display: 'swap',  // FOUT 방지
  preload: true,
  variable: '--font-noto-sans-kr',
});

// 글로벌 적용
export default function RootLayout({ children }) {
  return (
    <html className={`${notoSansKR.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**2. Tailwind 통합**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', 'sans-serif'],
        gothic: ['var(--font-nanum-gothic)', 'sans-serif'],
      },
    },
  },
};
```

**3. 다운로드 시 폰트 로딩 대기**
```typescript
// 현재: document.fonts.ready (불확실)
// 개선: 명시적 폰트 로딩 확인

const waitForFonts = async () => {
  // 사용 중인 폰트만 체크
  const fontsToCheck = [
    'Noto Sans KR',
    'Nanum Gothic',
  ];

  await Promise.all(
    fontsToCheck.map(font =>
      document.fonts.load(`16px "${font}"`)
    )
  );
};

// 다운로드 전 호출
await waitForFonts();
const blob = await getJpgAsBlob(element);
```

**효과:**
- 네트워크 요청 제거 (빌드 시 다운로드)
- CLS (레이아웃 시프트) 방지
- LCP 개선

**참고 자료:**
- [Font Optimization (Next.js 공식)](https://nextjs.org/docs/app/getting-started/fonts)
- [Optimizing Fonts in Next.js (Blazity)](https://blazity.com/blog/next-js-fonts-optimization)
- [Next.js Fonts (Contentful)](https://www.contentful.com/blog/next-js-fonts/)

---

### M. 자동 저장 및 Undo/Redo 패턴

**1. react-hook-form-autosave (추천)**
```typescript
// 설치: npm install react-hook-form-autosave

import { useAutoSave } from 'react-hook-form-autosave';
import { useForm } from 'react-hook-form';

const form = useForm({ defaultValues: classPlan });

const { isPending, undo, redo, canUndo, canRedo } = useAutoSave({
  form,
  onSave: async (data) => {
    await savePlan(selectedId, data);
  },
  debounceMs: 1000,  // 1초 디바운스
});

// UI
<button onClick={undo} disabled={!canUndo}>↩ Undo</button>
<button onClick={redo} disabled={!canRedo}>↪ Redo</button>
{isPending && <span>저장 중...</span>}
```

**2. useHistoryState 훅 (간단한 구현)**
```typescript
// 설치: npm install @uidotdev/usehooks

import { useHistoryState } from '@uidotdev/usehooks';

const { state, set, undo, redo, clear, canUndo, canRedo } = useHistoryState({
  title: '',
  teacher: '',
  // ... 초기값
});

// 값 변경
const handleChange = (field, value) => {
  set({ ...state, [field]: value });
};

// 키보드 단축키
useEffect(() => {
  const handler = (e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      if ((e.key === 'z' && e.shiftKey || e.key === 'y') && canRedo) {
        e.preventDefault();
        redo();
      }
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [undo, redo, canUndo, canRedo]);
```

**3. Throttled Auto-Save (데이터 손실 방지)**
```typescript
// Throttle: 5초마다 자동 저장 (디바운스와 다름)
import { useCallback, useRef } from 'react';
import { throttle } from 'lodash';

const throttledSave = useRef(
  throttle(async (data) => {
    await savePlan(data);
  }, 5000)  // 5초 간격
).current;

// 모든 변경에서 호출 (5초에 한 번만 실행됨)
useEffect(() => {
  throttledSave(classPlan);
}, [classPlan]);

// cleanup
useEffect(() => {
  return () => throttledSave.cancel();
}, []);
```

**참고 자료:**
- [react-hook-form-autosave](https://github.com/ziadeh/react-hook-form-autosave)
- [useHistoryState Hook](https://usehooks.com/usehistorystate)
- [Auto-Saving Forms Done Right (Codeminer42)](https://blog.codeminer42.com/auto-saving-forms-done-right-2-2/)

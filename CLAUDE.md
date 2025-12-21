# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

강의계획서 매니저 - A lecture plan management system built with Next.js 15, React 18, TypeScript, and Supabase. Teachers create and manage lecture plans with customizable templates, which can be exported as JPG images.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc              # TypeScript type check
```

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `OPENAI_API_KEY` - OpenAI API key (for AI text generation)
- `OPENAI_MODEL` - OpenAI model name (default: `GPT-5.2`)
- `OPENAI_BASE_URL` - Optional custom base URL (default: `https://api.openai.com/v1`)

## Architecture

### State Management
- **Zustand stores** in `src/store/`:
  - `classPlanStore.ts` - Main data store for ClassPlan CRUD, syncs with Supabase via REST API
  - `authStore.ts` - Authentication state (persisted)
  - `templateEditStore.ts` - Template layout editing mode state

### Data Flow Pattern
1. User actions trigger Zustand store methods
2. Store methods call Next.js API routes (`/api/*`)
3. API routes use Supabase admin client for database operations
4. Store updates local state from API response

### Key Types (`src/lib/types.ts`)
- `ClassPlan` - Main entity containing all lecture plan data
- `TemplateId` - Format: `{category}-{color}` (e.g., `style1-blue`)
- `TemplateCategory` - `style1` | `style2` | `style3`
- `ColorTheme` - `green` | `blue` | `purple` | `orange` | `teal` | `dancheong`
- `TypographySettings` - Font family, size, weight settings
- `TemplateLayoutConfig` - Section positioning/sizing for template customization

### Template System
Three template styles in `src/components/templates/`:
- `TemplateStyle1.tsx` - Card-based clean layout (222 lines)
- `TemplateStyle2.tsx` - Icon box + colored bar layout (~312 lines)
- `TemplateStyle3.tsx` - Gradient header + decorative triangle layout (~659 lines)

Each template receives `ClassPlan` and `ColorTheme` props. Layout customization is applied via `layoutConfig` property with `getLayoutStyle()` helper.

### Template Section Architecture (`src/components/templates/sections/`)

공유 헬퍼 및 섹션 컴포넌트를 통해 코드 중복을 최소화:

#### Core Types & Helpers (`types.ts`)
```typescript
// 스타일 헬퍼 인터페이스
interface SectionStyleHelpers {
  getLayoutStyle: (sectionId: string) => CSSProperties;
  getHeaderStyle: (index: number) => CSSProperties;
  getHeaderTextClass: () => string;
  getSize: (field: keyof FieldFontSizes) => number;
}

// 공통 섹션 Props
interface BaseSectionProps {
  classPlan: ClassPlan;
  colors: ColorPalette;
  typography: TypographySettings;
  titleFontClass: string;
  bodyFontClass: string;
  titleWeight: number;
  bodyWeight: number;
  helpers: SectionStyleHelpers;
}

// 헬퍼 함수들
createStyleHelpers(classPlan, colorTheme, colors)  // 타이포그래피, 레이아웃 헬퍼 생성
createAccentHelpers(colors, isDancheong)           // Style2용 단청 액센트 헬퍼
getColorPalette(colorTheme)                        // ColorTheme → ColorPalette 변환
```

#### 공유 상수
- `textColors` - 기본 텍스트 색상 (`{ primary: '#3f3f46', strong: '#27272a' }`)
- `dancheongHeaderGradients` - 단청 테마용 그라데이션 배열
- `dancheongAccents` - 단청 테마용 액센트 색상 배열

#### Section Components (TemplateStyle1용)
| 컴포넌트 | 설명 |
|----------|------|
| `HeaderSection` | 템플릿 헤더 + 로고 |
| `TeacherScheduleSection` | 담임강사 + 수업일정 카드 |
| `CourseInfoSection` | 학습과정/교재 정보 |
| `GoalsManagementSection` | 학습목표 + 학습관리 |
| `WeeklyPlanTemplateSection` | 주차별 계획 그리드 |
| `CalendarSection` | 월간계획 달력 래퍼 |
| `FeeTableSection` | 수강료 테이블 (월별 그룹핑) |

#### 패턴별 적용 방식
- **TemplateStyle1**: 섹션 컴포넌트 직접 import하여 사용
- **TemplateStyle2/3**: 공유 헬퍼 사용 + 렌더 함수 패턴 (고유 디자인 유지)

```typescript
// TemplateStyle1 예시
import { HeaderSection, TeacherScheduleSection, createStyleHelpers } from './sections';

// TemplateStyle2/3 예시 (렌더 함수 패턴)
const renderSectionTitle = (icon, title, accentIndex) => ( ... );
const renderScheduleRow = (row, i) => ( ... );
```

#### 폴더 구조
```
src/components/templates/
├── sections/
│   ├── index.ts                    # 모든 컴포넌트/헬퍼 re-export
│   ├── types.ts                    # 공유 타입, 헬퍼 함수, 상수
│   ├── HeaderSection.tsx           # 헤더 섹션
│   ├── TeacherScheduleSection.tsx  # 담임강사 + 수업일정
│   ├── CourseInfoSection.tsx       # 학습과정/교재
│   ├── GoalsManagementSection.tsx  # 학습목표 + 학습관리
│   ├── WeeklyPlanTemplateSection.tsx # 주차별 계획
│   ├── CalendarSection.tsx         # 월간계획
│   └── FeeTableSection.tsx         # 수강료 테이블
├── TemplateStyle1.tsx              # 222줄 (섹션 컴포넌트 사용)
├── TemplateStyle2.tsx              # ~312줄 (렌더 함수 패턴)
├── TemplateStyle3.tsx              # ~659줄 (렌더 함수 패턴)
└── MonthlyCalendar.tsx             # 월간 달력 컴포넌트
```

### Supabase Clients (`src/lib/`)
- `supabaseClient.ts` - Browser client with anon key
- `supabaseServer.ts` - Server-side admin client with service key
- `supabaseAuthClient.ts` - Auth-specific client
- `supabaseRequestClient.ts` - Per-request client with user token

### API Structure
- `/api/class-plans` - CRUD for lecture plans (GET, POST)
- `/api/class-plans/[id]` - Single plan operations (GET, PUT, DELETE)
- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin-only endpoints
- `/api/ai/*` - AI-powered features (copy generation, design)

### Database Schema
Main tables (managed via Supabase):
- `class_plans` - Lecture plan metadata
- `weekly_plan_items` - Weekly schedule items (FK to class_plans)
- `fee_rows` - Fee information rows (FK to class_plans)
- `profiles` - User profiles

### Path Alias
Use `@/*` for imports from `src/` (configured in tsconfig.json).

## Key Patterns

### ClassPlan Normalization
`normalizePlan()` in `classPlanStore.ts` ensures required fields have defaults. Always use this when creating/loading plans.

### Template ID Parsing
Use `parseTemplateId(templateId)` to safely extract `{ category, color }` from legacy or new format IDs.

### Schedule Parsing
Multi-line schedule format: `기간|요일` (e.g., `12월|월수금\n1월|화목토`)
- `parseScheduleWithPeriod()` - Parse to structured data
- `buildScheduleRows()` - Build table rows
- `calculateTeacherScheduleRatio()` - Dynamic grid ratio based on text length

### Image Export
`downloadAsJpg()` in `src/lib/download.ts` uses html-to-image for JPG export. Template canvas ref is passed for capture.

## Performance Optimizations

### Input Debouncing (Phase 3.1.A)
- `useDebounce` hook for delayed state updates
- Prevents excessive re-renders during rapid typing
- Applied to form inputs in BasicInfoSection

### Template Memoization (Phase 3.1.B)
- `React.memo()` wrapping for all template components
- `useMemo()` for computed data:
  - `scheduleRows` - 수업일정 행 계산
  - `courseRows` - 학습과정/교재 데이터
  - `weeklyPlan` split - 주차별 계획 2열 분할
  - `groupedByMonth` - 수강료 월별 그룹핑
  - `gridRatio` - 담임강사/수업일정 그리드 비율

### Zod Schema Validation (Phase 5.1)
- `classPlanSchema` in `src/lib/schemas.ts`
- Type-safe validation for ClassPlan data
- Used in API routes for input validation

### ErrorBoundary (Phase 5.2)
- Global error boundary for graceful error handling
- Prevents entire app crash on component errors

### Custom Drag Hook (Phase 4.1)
- Replaced `@dnd-kit` with lightweight custom `useDrag` hook
- Reduced bundle size
- Located in `src/hooks/useDrag.ts`

## Testing

### Test Framework
- Vitest for unit testing
- Test files: `src/**/__tests__/*.test.ts`

### Test Commands
```bash
npm run test:run      # Run all tests once
npx vitest run        # Alternative: run tests directly
npx vitest            # Watch mode
```

### Current Test Coverage
- `src/lib/__tests__/a4Utils.test.ts` - A4 utility functions (13 tests)
- `src/store/__tests__/templateEditStore.test.ts` - Template edit store (29 tests)

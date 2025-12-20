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
- `TemplateStyle1.tsx` - Card-based clean layout
- `TemplateStyle2.tsx` - Alternative layout
- `TemplateStyle3.tsx` - Alternative layout

Each template receives `ClassPlan` and `ColorTheme` props. Layout customization is applied via `layoutConfig` property with `getLayoutStyle()` helper.

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

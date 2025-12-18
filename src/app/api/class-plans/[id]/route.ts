import { NextRequest, NextResponse } from 'next/server';
import { getClientAndUser, unauthorized, notFound, serverError, badRequest } from '@/lib/apiHelpers';
import { supabaseAdmin } from '@/lib/supabaseServer';
import type { TablesInsert } from '@/lib/supabase.types';

export const GET = async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(_req);
  if (!pair) return unauthorized();
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return notFound();
  if (error) return serverError(error.message);
  return NextResponse.json({ data });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  console.log('[PUT /api/class-plans/:id] 요청 시작:', { id });
  
  const pair = await getClientAndUser(req);
  if (!pair) {
    console.warn('[PUT /api/class-plans/:id] 인증 실패:', { id });
    return unauthorized();
  }
  const { userId } = pair;
  const admin = supabaseAdmin();
  console.log('[PUT /api/class-plans/:id] 인증 성공:', { id, userId });

  type PutRequestBody = {
    patch?: Partial<TablesInsert<'class_plans'>>;
    weeklyItems?: TablesInsert<'weekly_plan_items'>[];
    feeRows?: TablesInsert<'fee_rows'>[];
  };

  let body: PutRequestBody = {};
  try {
    body = await req.json() as PutRequestBody;
  } catch (parseError) {
    console.error('[PUT /api/class-plans/:id] 요청 본문 파싱 실패:', {
      id,
      error: parseError,
    });
    return badRequest('Invalid JSON in request body');
  }

  const {
    patch = {},
    weeklyItems,
    feeRows,
  } = body;

  console.log('[PUT /api/class-plans/:id] 업데이트 시도:', {
    id,
    patchKeys: Object.keys(patch),
    teacher_name: patch.teacher_name,
    teacher_name_type: typeof patch.teacher_name,
    teacher_name_hasNewline: patch.teacher_name?.includes('\n'),
    teacher_name_length: patch.teacher_name?.length,
    hasWeeklyItems: !!weeklyItems,
    weeklyItemsCount: weeklyItems?.length ?? 0,
    hasFeeRows: !!feeRows,
    feeRowsCount: feeRows?.length ?? 0,
  });

  // class_plans에 없는 컬럼(status 등)이 들어오면 PostgREST schema cache 에러가 발생하므로 제거
  const patchWithoutStatus = { ...(patch || {}) } as Record<string, unknown>;
  delete patchWithoutStatus.status;
  // owner_id는 감사/추적용 컬럼으로 유지하되, 수정 API에서는 임의 변경을 막습니다.
  delete patchWithoutStatus.owner_id;

  const { error } = await admin
    .from('class_plans')
    .update(patchWithoutStatus as Partial<TablesInsert<'class_plans'>>)
    .eq('id', id);
    
  if (error) {
    console.error('[PUT /api/class-plans/:id] 강의 수정 실패:', {
      id,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      patchKeys: Object.keys(patch),
    });
    return serverError(error.message);
  }

  console.log('[PUT /api/class-plans/:id] 강의 기본 정보 업데이트 성공:', { id });

  if (weeklyItems) {
    const { error: deleteError } = await admin.from('weekly_plan_items').delete().eq('class_plan_id', id);
    if (deleteError) {
      console.error('[PUT /api/class-plans/:id] 주간 계획 항목 삭제 실패:', {
        id,
        error: deleteError.message,
        code: deleteError.code,
      });
      // 삭제 실패해도 계속 진행
    } else {
      console.log('[PUT /api/class-plans/:id] 주간 계획 항목 삭제 성공:', { id });
    }
    
    if (weeklyItems.length) {
      const { error: insertError } = await admin.from('weekly_plan_items').insert(
        weeklyItems.map((w, idx) => ({
          ...w,
          class_plan_id: id,
          position: w.position ?? idx,
        }))
      );
      if (insertError) {
        console.error('[PUT /api/class-plans/:id] 주간 계획 항목 삽입 실패:', {
          id,
          error: insertError.message,
          code: insertError.code,
          count: weeklyItems.length,
        });
        // 삽입 실패해도 계속 진행
      } else {
        console.log('[PUT /api/class-plans/:id] 주간 계획 항목 삽입 성공:', {
          id,
          count: weeklyItems.length,
        });
      }
    }
  }

  if (feeRows) {
    const { error: deleteError } = await admin.from('fee_rows').delete().eq('class_plan_id', id);
    if (deleteError) {
      console.error('[PUT /api/class-plans/:id] 수강료 행 삭제 실패:', {
        id,
        error: deleteError.message,
        code: deleteError.code,
      });
      // 삭제 실패해도 계속 진행
    } else {
      console.log('[PUT /api/class-plans/:id] 수강료 행 삭제 성공:', { id });
    }
    
    if (feeRows.length) {
      const { error: insertError } = await admin.from('fee_rows').insert(
        feeRows.map((f) => ({
          ...f,
          class_plan_id: id,
        }))
      );
      if (insertError) {
        console.error('[PUT /api/class-plans/:id] 수강료 행 삽입 실패:', {
          id,
          error: insertError.message,
          code: insertError.code,
          count: feeRows.length,
        });
        // 삽입 실패해도 계속 진행
      } else {
        console.log('[PUT /api/class-plans/:id] 수강료 행 삽입 성공:', {
          id,
          count: feeRows.length,
        });
      }
    }
  }

  const { data: full, error: fullError } = await admin
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', id)
    .single();

  if (fullError) {
    console.error('[PUT /api/class-plans/:id] 전체 데이터 조회 실패:', {
      id,
      error: fullError.message,
      code: fullError.code,
    });
    return serverError(fullError.message);
  }
  
  // 디버깅: 저장 후 teacher_name 값 확인
  console.log('[PUT /api/class-plans/:id] 저장 후 teacher_name 확인:', {
    id: full.id,
    teacher_name: full.teacher_name,
    teacher_name_type: typeof full.teacher_name,
    teacher_name_hasNewline: full.teacher_name?.includes('\n'),
    teacher_name_length: full.teacher_name?.length,
    rawValue: JSON.stringify(full.teacher_name),
  });
  
  console.log('[PUT /api/class-plans/:id] 요청 완료:', { id });
  return NextResponse.json({ data: full });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from('class_plans')
    .delete()
    .eq('id', id);
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
};


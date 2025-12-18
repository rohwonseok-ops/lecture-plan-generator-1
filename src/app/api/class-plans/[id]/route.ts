import { NextRequest, NextResponse } from 'next/server';
import { getClientAndUser, unauthorized, notFound, serverError, badRequest } from '@/lib/apiHelpers';
import type { TablesInsert } from '@/lib/supabase.types';

export const GET = async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(_req);
  if (!pair) return unauthorized();
  const { client } = pair;

  const { data, error } = await client
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
  const { client, userId } = pair;
  console.log('[PUT /api/class-plans/:id] 인증 성공:', { id, userId });

  let body: any = {};
  try {
    body = await req.json();
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
  }: {
    patch?: Partial<TablesInsert<'class_plans'>>;
    weeklyItems?: TablesInsert<'weekly_plan_items'>[];
    feeRows?: TablesInsert<'fee_rows'>[];
  } = body;

  console.log('[PUT /api/class-plans/:id] 업데이트 시도:', {
    id,
    patchKeys: Object.keys(patch),
    hasWeeklyItems: !!weeklyItems,
    weeklyItemsCount: weeklyItems?.length ?? 0,
    hasFeeRows: !!feeRows,
    feeRowsCount: feeRows?.length ?? 0,
  });

  const { error } = await client
    .from('class_plans')
    .update(patch)
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
    const { error: deleteError } = await client.from('weekly_plan_items').delete().eq('class_plan_id', id);
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
      const { error: insertError } = await client.from('weekly_plan_items').insert(
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
    const { error: deleteError } = await client.from('fee_rows').delete().eq('class_plan_id', id);
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
      const { error: insertError } = await client.from('fee_rows').insert(
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

  const { data: full, error: fullError } = await client
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
  
  console.log('[PUT /api/class-plans/:id] 요청 완료:', { id });
  return NextResponse.json({ data: full });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client } = pair;

  const { error } = await client
    .from('class_plans')
    .delete()
    .eq('id', id);
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
};


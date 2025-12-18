import { NextRequest, NextResponse } from 'next/server';
import { getClientAndUser, unauthorized, badRequest, serverError } from '@/lib/apiHelpers';
import type { TablesInsert } from '@/lib/supabase.types';

export const GET = async (req: NextRequest) => {
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client } = pair;

  const { data, error } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('강의 목록 조회 실패:', error);
    return serverError(error.message);
  }
  return NextResponse.json({ data: data || [] });
};

export const POST = async (req: NextRequest) => {
  console.log('[POST /api/class-plans] 요청 시작');
  
  const pair = await getClientAndUser(req);
  if (!pair) {
    console.warn('[POST /api/class-plans] 인증 실패');
    return unauthorized();
  }
  const { client, userId } = pair;
  console.log('[POST /api/class-plans] 인증 성공:', { userId });

  type PostRequestBody = {
    plan?: TablesInsert<'class_plans'>;
    weeklyItems?: TablesInsert<'weekly_plan_items'>[];
    feeRows?: TablesInsert<'fee_rows'>[];
  };

  let body: PostRequestBody = {};
  try {
    body = await req.json() as PostRequestBody;
  } catch (parseError) {
    console.error('[POST /api/class-plans] 요청 본문 파싱 실패:', parseError);
    return badRequest('Invalid JSON in request body');
  }

  const {
    plan,
    weeklyItems = [],
    feeRows = [],
  } = body;

  if (!plan?.title) {
    console.warn('[POST /api/class-plans] 필수 필드 누락:', { hasPlan: !!plan, hasTitle: !!plan?.title });
    return badRequest('title is required');
  }

  console.log('[POST /api/class-plans] 강의 생성 시도:', {
    title: plan.title,
    teacher_name: plan.teacher_name,
    teacher_name_type: typeof plan.teacher_name,
    teacher_name_hasNewline: plan.teacher_name?.includes('\n'),
    teacher_name_length: plan.teacher_name?.length,
    weeklyItemsCount: weeklyItems.length,
    feeRowsCount: feeRows.length,
  });

  const { data, error } = await client
    .from('class_plans')
    .insert({ ...(plan || {}), owner_id: userId })
    .select()
    .single();
    
  if (error || !data) {
    console.error('[POST /api/class-plans] 강의 생성 실패:', {
      error: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return serverError(error?.message ?? 'insert failed');
  }

  console.log('[POST /api/class-plans] 강의 생성 성공:', { id: data.id });

  if (weeklyItems.length) {
    const { error: weeklyError } = await client.from('weekly_plan_items').insert(
      weeklyItems.map((w, idx) => ({
        ...w,
        class_plan_id: data.id,
        position: w.position ?? idx,
      }))
    );
    if (weeklyError) {
      console.error('[POST /api/class-plans] 주간 계획 항목 삽입 실패:', {
        error: weeklyError.message,
        code: weeklyError.code,
        classPlanId: data.id,
      });
      // 주간 계획 항목 실패해도 강의는 생성되었으므로 계속 진행
    } else {
      console.log('[POST /api/class-plans] 주간 계획 항목 삽입 성공:', { count: weeklyItems.length });
    }
  }
  
  if (feeRows.length) {
    const { error: feeError } = await client.from('fee_rows').insert(
      feeRows.map((f) => ({
        ...f,
        class_plan_id: data.id,
      }))
    );
    if (feeError) {
      console.error('[POST /api/class-plans] 수강료 행 삽입 실패:', {
        error: feeError.message,
        code: feeError.code,
        classPlanId: data.id,
      });
      // 수강료 행 실패해도 강의는 생성되었으므로 계속 진행
    } else {
      console.log('[POST /api/class-plans] 수강료 행 삽입 성공:', { count: feeRows.length });
    }
  }

  const { data: full, error: fullError } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', data.id)
    .single();

  if (fullError) {
    console.error('[POST /api/class-plans] 전체 데이터 조회 실패:', {
      error: fullError.message,
      code: fullError.code,
      id: data.id,
    });
    return serverError(fullError.message);
  }
  
  // 디버깅: 저장 후 teacher_name 값 확인
  console.log('[POST /api/class-plans] 저장 후 teacher_name 확인:', {
    id: full.id,
    teacher_name: full.teacher_name,
    teacher_name_type: typeof full.teacher_name,
    teacher_name_hasNewline: full.teacher_name?.includes('\n'),
    teacher_name_length: full.teacher_name?.length,
    rawValue: JSON.stringify(full.teacher_name),
  });
  
  console.log('[POST /api/class-plans] 요청 완료:', { id: full.id });
  return NextResponse.json({ data: full });
};


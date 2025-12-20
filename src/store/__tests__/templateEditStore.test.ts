import { describe, it, expect, beforeEach } from 'vitest';
import {
  LAYOUT_POSITION_LIMIT,
  LAYOUT_SIZE_LIMIT,
  clampPosition,
  clampSize,
  normalizeElementLayout,
  isValidPosition,
  isValidSize,
  sectionIdToConfigKey,
  useTemplateEditStore,
} from '../templateEditStore';

describe('templateEditStore', () => {
  describe('상수', () => {
    it('LAYOUT_POSITION_LIMIT는 100 이어야 함', () => {
      expect(LAYOUT_POSITION_LIMIT).toBe(100);
    });

    it('LAYOUT_SIZE_LIMIT는 50 이어야 함', () => {
      expect(LAYOUT_SIZE_LIMIT).toBe(50);
    });
  });

  describe('clampPosition', () => {
    it('범위 내 값은 그대로 반환', () => {
      expect(clampPosition(0)).toBe(0);
      expect(clampPosition(50)).toBe(50);
      expect(clampPosition(-50)).toBe(-50);
    });

    it('최대값을 초과하면 최대값으로 클램핑', () => {
      expect(clampPosition(150)).toBe(LAYOUT_POSITION_LIMIT);
      expect(clampPosition(1000)).toBe(LAYOUT_POSITION_LIMIT);
    });

    it('최소값 미만이면 최소값으로 클램핑', () => {
      expect(clampPosition(-150)).toBe(-LAYOUT_POSITION_LIMIT);
      expect(clampPosition(-1000)).toBe(-LAYOUT_POSITION_LIMIT);
    });

    it('NaN은 0으로 반환', () => {
      expect(clampPosition(NaN)).toBe(0);
    });

    it('숫자가 아닌 값은 0으로 반환', () => {
      expect(clampPosition('50' as unknown as number)).toBe(0);
      expect(clampPosition(undefined as unknown as number)).toBe(0);
    });
  });

  describe('clampSize', () => {
    it('범위 내 값은 그대로 반환', () => {
      expect(clampSize(0)).toBe(0);
      expect(clampSize(30)).toBe(30);
      expect(clampSize(-30)).toBe(-30);
    });

    it('최대값을 초과하면 최대값으로 클램핑', () => {
      expect(clampSize(100)).toBe(LAYOUT_SIZE_LIMIT);
      expect(clampSize(500)).toBe(LAYOUT_SIZE_LIMIT);
    });

    it('최소값 미만이면 최소값으로 클램핑', () => {
      expect(clampSize(-100)).toBe(-LAYOUT_SIZE_LIMIT);
      expect(clampSize(-500)).toBe(-LAYOUT_SIZE_LIMIT);
    });

    it('NaN은 0으로 반환', () => {
      expect(clampSize(NaN)).toBe(0);
    });
  });

  describe('normalizeElementLayout', () => {
    it('빈 객체는 빈 객체 반환', () => {
      expect(normalizeElementLayout({})).toEqual({});
    });

    it('x, y 값을 정규화', () => {
      const result = normalizeElementLayout({ x: 200, y: -200 });
      expect(result.x).toBe(LAYOUT_POSITION_LIMIT);
      expect(result.y).toBe(-LAYOUT_POSITION_LIMIT);
    });

    it('width, height 값을 정규화', () => {
      const result = normalizeElementLayout({ width: 100, height: -100 });
      expect(result.width).toBe(LAYOUT_SIZE_LIMIT);
      expect(result.height).toBe(-LAYOUT_SIZE_LIMIT);
    });

    it('undefined 값은 무시', () => {
      const result = normalizeElementLayout({ x: 10 });
      expect(result).toEqual({ x: 10 });
      expect(result.y).toBeUndefined();
    });
  });

  describe('isValidPosition', () => {
    it('범위 내 숫자는 true', () => {
      expect(isValidPosition(0)).toBe(true);
      expect(isValidPosition(50)).toBe(true);
      expect(isValidPosition(-50)).toBe(true);
      expect(isValidPosition(LAYOUT_POSITION_LIMIT)).toBe(true);
      expect(isValidPosition(-LAYOUT_POSITION_LIMIT)).toBe(true);
    });

    it('범위를 벗어난 값은 false', () => {
      expect(isValidPosition(LAYOUT_POSITION_LIMIT + 1)).toBe(false);
      expect(isValidPosition(-LAYOUT_POSITION_LIMIT - 1)).toBe(false);
    });

    it('숫자가 아닌 값은 false', () => {
      expect(isValidPosition('50')).toBe(false);
      expect(isValidPosition(null)).toBe(false);
      expect(isValidPosition(undefined)).toBe(false);
      expect(isValidPosition(NaN)).toBe(false);
    });
  });

  describe('isValidSize', () => {
    it('범위 내 숫자는 true', () => {
      expect(isValidSize(0)).toBe(true);
      expect(isValidSize(25)).toBe(true);
      expect(isValidSize(-25)).toBe(true);
      expect(isValidSize(LAYOUT_SIZE_LIMIT)).toBe(true);
      expect(isValidSize(-LAYOUT_SIZE_LIMIT)).toBe(true);
    });

    it('범위를 벗어난 값은 false', () => {
      expect(isValidSize(LAYOUT_SIZE_LIMIT + 1)).toBe(false);
      expect(isValidSize(-LAYOUT_SIZE_LIMIT - 1)).toBe(false);
    });

    it('숫자가 아닌 값은 false', () => {
      expect(isValidSize('25')).toBe(false);
      expect(isValidSize(null)).toBe(false);
      expect(isValidSize(undefined)).toBe(false);
      expect(isValidSize(NaN)).toBe(false);
    });
  });

  describe('sectionIdToConfigKey', () => {
    it('주요 섹션 ID 매핑이 올바르게 되어야 함', () => {
      expect(sectionIdToConfigKey['header']).toBe('header');
      expect(sectionIdToConfigKey['target-student']).toBe('targetStudent');
      expect(sectionIdToConfigKey['parent-intro']).toBe('parentIntro');
      expect(sectionIdToConfigKey['teacher-info']).toBe('teacherInfo');
      expect(sectionIdToConfigKey['schedule-info']).toBe('scheduleInfo');
      expect(sectionIdToConfigKey['course-info']).toBe('courseInfo');
      expect(sectionIdToConfigKey['learning-goal']).toBe('learningGoal');
      expect(sectionIdToConfigKey['weekly-plan']).toBe('weeklyPlan');
      expect(sectionIdToConfigKey['monthly-calendar']).toBe('monthlyCalendar');
      expect(sectionIdToConfigKey['fee-table']).toBe('feeTable');
    });
  });

  describe('useTemplateEditStore', () => {
    beforeEach(() => {
      // 스토어 상태 초기화
      useTemplateEditStore.setState({
        isEditMode: false,
        pendingLayoutChanges: {},
        baseLayoutConfig: null,
        applyToCategory: false,
        selectedCategory: null,
        originalDOMStyles: {},
        isSaving: false,
        initialLayoutSnapshot: null,
      });
    });

    it('초기 상태가 올바르게 설정되어야 함', () => {
      const state = useTemplateEditStore.getState();
      expect(state.isEditMode).toBe(false);
      expect(state.pendingLayoutChanges).toEqual({});
      expect(state.baseLayoutConfig).toBeNull();
      expect(state.applyToCategory).toBe(false);
    });

    it('setEditMode로 편집 모드 변경', () => {
      useTemplateEditStore.getState().setEditMode(true);
      expect(useTemplateEditStore.getState().isEditMode).toBe(true);

      useTemplateEditStore.getState().setEditMode(false);
      expect(useTemplateEditStore.getState().isEditMode).toBe(false);
    });

    it('toggleEditMode로 편집 모드 토글', () => {
      expect(useTemplateEditStore.getState().isEditMode).toBe(false);

      useTemplateEditStore.getState().toggleEditMode();
      expect(useTemplateEditStore.getState().isEditMode).toBe(true);

      useTemplateEditStore.getState().toggleEditMode();
      expect(useTemplateEditStore.getState().isEditMode).toBe(false);
    });

    it('updateElementLayout으로 레이아웃 업데이트', () => {
      useTemplateEditStore.getState().updateElementLayout('header', { x: 10, y: 20 });

      const changes = useTemplateEditStore.getState().pendingLayoutChanges;
      expect(changes['header']).toEqual({ x: 10, y: 20 });
    });

    it('clearPendingChanges로 변경사항 초기화', () => {
      useTemplateEditStore.getState().updateElementLayout('header', { x: 10 });
      useTemplateEditStore.getState().clearPendingChanges();

      expect(useTemplateEditStore.getState().pendingLayoutChanges).toEqual({});
    });

    it('getPendingChanges로 정규화된 레이아웃 설정 반환', () => {
      useTemplateEditStore.getState().updateElementLayout('header', { x: 200, y: -200 });

      const config = useTemplateEditStore.getState().getPendingChanges();
      expect(config.header?.x).toBe(LAYOUT_POSITION_LIMIT);
      expect(config.header?.y).toBe(-LAYOUT_POSITION_LIMIT);
    });

    it('스냅샷 저장 및 복원', () => {
      const initialConfig = { header: { x: 10, y: 20 } };
      useTemplateEditStore.getState().saveInitialSnapshot(initialConfig);

      // 스냅샷 저장 확인
      expect(useTemplateEditStore.getState().getInitialSnapshot()).toEqual(initialConfig);

      // 변경 후 복원
      useTemplateEditStore.getState().setBaseLayoutConfig({ header: { x: 100, y: 200 } });
      useTemplateEditStore.getState().restoreFromSnapshot();

      expect(useTemplateEditStore.getState().baseLayoutConfig).toEqual(initialConfig);
    });
  });
});

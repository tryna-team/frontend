import { useCallback, useState } from 'react';

import { endOfDay, format, isValid, isWithinInterval, parseISO, startOfDay } from 'date-fns';

import type { ActionItemScheduleValue } from '@/features/event/components/create';
import type { RecommendationCandidate } from '@/stores/types';

import type { RecommendationEditDraft } from '../types';

type UseRecommendationEditParams = {
  isSaving: boolean;
  startDate: Date;
  endDate: Date;
  editCandidate: (candidateId: string, patch: Partial<RecommendationCandidate>) => void;
};

export function useRecommendationEdit({
  isSaving,
  startDate,
  endDate,
  editCandidate,
}: UseRecommendationEditParams) {
  const [recommendationEditDraft, setRecommendationEditDraft] =
    useState<RecommendationEditDraft | null>(null);

  const handleOpenRecommendationEdit = useCallback(
    (candidate: RecommendationCandidate) => {
      if (isSaving || !candidate.selected) {
        return;
      }

      const parsedDisplayDate = candidate.displayDate ? parseISO(candidate.displayDate) : startDate;
      const initialDate = isValid(parsedDisplayDate) ? parsedDisplayDate : startDate;
      const originalApiItemType =
        candidate.apiItemType ??
        (candidate.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'UNTIMED_PREP');

      setRecommendationEditDraft({
        candidateId: candidate.candidateId,
        title: candidate.title,
        date: initialDate,
        originalItemType: candidate.itemType,
        originalApiItemType,
        originalDisplayDate: candidate.displayDate ?? null,
      });
    },
    [isSaving, startDate],
  );

  const handleChangeRecommendationEdit = useCallback((value: ActionItemScheduleValue) => {
    setRecommendationEditDraft((current) =>
      current
        ? {
            ...current,
            date: value.date,
          }
        : current,
    );
  }, []);

  const handleSaveRecommendationEdit = useCallback(() => {
    if (!recommendationEditDraft) {
      return;
    }

    // 상위 일정이 범위 일정이든 하루짜리이든, 선택 날짜가 [startDate, endDate] 범위 안이면 당일(비시간형)으로 취급한다.
    const isWithinParentRange = isWithinInterval(recommendationEditDraft.date, {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });
    const isTimedAction = !isWithinParentRange;

    const nextItemType = isTimedAction ? 'TIMED_ACTION' : 'CHECKLIST';
    const nextApiItemType = isTimedAction ? 'TIMED_ACTION' : 'UNTIMED_PREP';
    const nextDisplayDate = isTimedAction
      ? format(recommendationEditDraft.date, 'yyyy-MM-dd')
      : null;
    const hasScheduleChanged =
      nextItemType !== recommendationEditDraft.originalItemType ||
      nextApiItemType !== recommendationEditDraft.originalApiItemType ||
      nextDisplayDate !== recommendationEditDraft.originalDisplayDate;

    if (hasScheduleChanged) {
      editCandidate(recommendationEditDraft.candidateId, {
        itemType: nextItemType,
        apiItemType: nextApiItemType,
        displayDate: nextDisplayDate,
        displayEndDate: null,
        displayTime: null,
      });
    }
    setRecommendationEditDraft(null);
  }, [editCandidate, endDate, recommendationEditDraft, startDate]);

  return {
    recommendationEditDraft,
    handleOpenRecommendationEdit,
    handleChangeRecommendationEdit,
    handleSaveRecommendationEdit,
  };
}

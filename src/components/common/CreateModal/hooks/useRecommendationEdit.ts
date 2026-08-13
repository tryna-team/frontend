import { useCallback, useState } from 'react';

import { format, isSameDay, isValid, parseISO } from 'date-fns';

import type { ActionItemScheduleValue } from '@/features/event/components/create';
import type { RecommendationCandidate } from '@/stores/types';

import type { RecommendationEditDraft } from '../types';

type UseRecommendationEditParams = {
  isSaving: boolean;
  startDate: Date;
  editCandidate: (candidateId: string, patch: Partial<RecommendationCandidate>) => void;
};

export function useRecommendationEdit({
  isSaving,
  startDate,
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

    const isTimedAction =
      Boolean(recommendationEditDraft.originalDisplayDate) ||
      !isSameDay(recommendationEditDraft.date, startDate);

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
  }, [editCandidate, recommendationEditDraft, startDate]);

  return {
    recommendationEditDraft,
    handleOpenRecommendationEdit,
    handleChangeRecommendationEdit,
    handleSaveRecommendationEdit,
  };
}

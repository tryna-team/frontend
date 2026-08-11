import { useCallback, useState } from 'react';

import { format, isSameDay, isValid, parseISO } from 'date-fns';

import type { ActionItemScheduleValue } from '@/features/event/components/create';
import type { RecommendationCandidate } from '@/stores/types';

import type { RecommendationEditDraft } from '../types';
import { formatApiTimeForPicker, normalizeTime } from '../utils/dateTime';

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
      const parsedDisplayEndDate = candidate.displayEndDate
        ? parseISO(candidate.displayEndDate)
        : initialDate;
      const initialEndDate = isValid(parsedDisplayEndDate) ? parsedDisplayEndDate : initialDate;
      const initialTime = formatApiTimeForPicker(candidate.displayTime);
      const originalApiItemType =
        candidate.apiItemType ??
        (candidate.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'UNTIMED_PREP');

      setRecommendationEditDraft({
        candidateId: candidate.candidateId,
        title: candidate.title,
        startDate: initialDate,
        endDate: initialEndDate,
        startTime: initialTime,
        endTime: initialTime,
        originalItemType: candidate.itemType,
        originalApiItemType,
        originalDisplayDate: candidate.displayDate ?? null,
        originalDisplayEndDate: candidate.displayEndDate ?? null,
        originalDisplayTime: candidate.displayTime ? normalizeTime(candidate.displayTime) : null,
        hasTimeChanged: false,
      });
    },
    [isSaving, startDate],
  );

  const handleChangeRecommendationEdit = useCallback((value: ActionItemScheduleValue) => {
    setRecommendationEditDraft((current) =>
      current
        ? {
            ...current,
            ...value,
            hasTimeChanged:
              current.hasTimeChanged ||
              current.startTime !== value.startTime ||
              current.endTime !== value.endTime,
          }
        : current,
    );
  }, []);

  const handleSaveRecommendationEdit = useCallback(() => {
    if (!recommendationEditDraft) {
      return;
    }

    const isDateRange = !isSameDay(
      recommendationEditDraft.startDate,
      recommendationEditDraft.endDate,
    );
    const isTimedAction = isDateRange || !isSameDay(recommendationEditDraft.startDate, startDate);

    const nextItemType = isTimedAction ? 'TIMED_ACTION' : 'CHECKLIST';
    const nextApiItemType = isTimedAction ? 'TIMED_ACTION' : 'UNTIMED_PREP';
    const nextDisplayDate = isTimedAction
      ? format(recommendationEditDraft.startDate, 'yyyy-MM-dd')
      : null;
    const nextDisplayEndDate =
      isTimedAction && isDateRange ? format(recommendationEditDraft.endDate, 'yyyy-MM-dd') : null;
    // Keep the existing null value unless the user edits time explicitly.
    const nextDisplayTime = isTimedAction
      ? recommendationEditDraft.hasTimeChanged
        ? normalizeTime(recommendationEditDraft.startTime)
        : (recommendationEditDraft.originalDisplayTime ??
          normalizeTime(recommendationEditDraft.startTime))
      : null;
    const hasScheduleChanged =
      nextItemType !== recommendationEditDraft.originalItemType ||
      nextApiItemType !== recommendationEditDraft.originalApiItemType ||
      nextDisplayDate !== recommendationEditDraft.originalDisplayDate ||
      nextDisplayEndDate !== recommendationEditDraft.originalDisplayEndDate ||
      nextDisplayTime !== recommendationEditDraft.originalDisplayTime;

    if (hasScheduleChanged) {
      editCandidate(recommendationEditDraft.candidateId, {
        itemType: nextItemType,
        apiItemType: nextApiItemType,
        displayDate: nextDisplayDate,
        displayEndDate: nextDisplayEndDate,
        displayTime: nextDisplayTime,
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

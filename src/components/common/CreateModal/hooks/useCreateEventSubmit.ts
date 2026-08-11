import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import { format } from 'date-fns';

import { eventService } from '@/apis/services/eventService';
import { queryClient } from '@/apis/queryClient';
import type { RepeatOption } from '@/features/event/components/create';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { ParsedEventCandidate, RecommendationCandidate } from '@/stores/types';

import { buildCreateEventRequest, getTimedActionDates } from '../utils/submit';

type UseCreateEventSubmitParams = {
  trimmedInput: string;
  selectedLabelId: number | null;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  hasStartTimeChanged: boolean;
  hasEndTimeChanged: boolean;
  hasEndDateChanged: boolean;
  hasRepeatChanged: boolean;
  repeat: RepeatOption;
  parsedCandidate: ParsedEventCandidate | null;
  recommendationCandidates: RecommendationCandidate[];
  inputRevisionRef: MutableRefObject<number>;
  isSaving: boolean;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  resetCreation: () => void;
  onCreate?: (createdDate: string) => void;
};

export function useCreateEventSubmit({
  trimmedInput,
  selectedLabelId,
  startDate,
  endDate,
  startTime,
  endTime,
  hasStartTimeChanged,
  hasEndTimeChanged,
  hasEndDateChanged,
  hasRepeatChanged,
  repeat,
  parsedCandidate,
  recommendationCandidates,
  inputRevisionRef,
  isSaving,
  setIsSaving,
  resetCreation,
  onCreate,
}: UseCreateEventSubmitParams) {
  const createAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      createAbortControllerRef.current?.abort();
      resetCreation();
    };
  }, [resetCreation]);

  const handleCreate = useCallback(async () => {
    if (isSaving || !trimmedInput) {
      return;
    }

    const createRevision = inputRevisionRef.current;
    const selectedCandidates = recommendationCandidates.filter((candidate) => candidate.selected);
    if (selectedCandidates.some((candidate) => !candidate.title.trim())) {
      window.alert('추천 항목의 제목을 입력해주세요.');
      return;
    }

    const controller = new AbortController();
    createAbortControllerRef.current = controller;
    const createRequest = buildCreateEventRequest({
      trimmedInput,
      selectedLabelId,
      startDate,
      endDate,
      startTime,
      endTime,
      hasStartTimeChanged,
      hasEndTimeChanged,
      hasEndDateChanged,
      hasRepeatChanged,
      repeat,
      parsedCandidate,
      recommendationCandidates,
    });
    setIsSaving(true);

    try {
      const createResponse = await eventService.create(createRequest, controller.signal);
      const timedActionDates = getTimedActionDates(createResponse);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all }),
        ...(createResponse.eventId !== undefined
          ? [
              queryClient.invalidateQueries({
                queryKey: queryKeys.actionItems.byEvent(createResponse.eventId),
              }),
            ]
          : []),
        ...timedActionDates.map((date) =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.actionItems.calendarTimed(date),
          }),
        ),
      ]);

      if (!isMountedRef.current || createRevision !== inputRevisionRef.current) {
        return;
      }

      resetCreation();
      onCreate?.(format(startDate, 'yyyy-MM-dd'));
    } catch {
      if (
        controller.signal.aborted ||
        !isMountedRef.current ||
        createRevision !== inputRevisionRef.current
      ) {
        return;
      }

      window.alert('일정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (createAbortControllerRef.current === controller) {
        createAbortControllerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    endDate,
    endTime,
    hasEndDateChanged,
    hasEndTimeChanged,
    hasRepeatChanged,
    hasStartTimeChanged,
    inputRevisionRef,
    isSaving,
    onCreate,
    parsedCandidate,
    recommendationCandidates,
    repeat,
    resetCreation,
    selectedLabelId,
    startDate,
    startTime,
    setIsSaving,
    trimmedInput,
  ]);

  return {
    handleCreate,
  };
}

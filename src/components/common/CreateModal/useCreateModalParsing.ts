import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import { isValid, parseISO } from 'date-fns';

import { eventService } from '@/apis/services/eventService';
import { useEventCreationStore } from '@/stores';

import { PARSING_THROTTLE_DELAY } from './CreateModal.constants';
import { createParseFallback, mapParseResponse } from './CreateModal.mappers';

type UseCreateModalParsingParams = {
  inputValue: string;
  trimmedInput: string;
  parseSelectedDate: string;
  inputRevisionRef: MutableRefObject<number>;
  hasRecommendedRef: MutableRefObject<boolean>;
  createFallbackTempEventId: () => string;
  setStartDate: Dispatch<SetStateAction<Date>>;
  setEndDate: Dispatch<SetStateAction<Date>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
};

export const useCreateModalParsing = ({
  inputValue,
  trimmedInput,
  parseSelectedDate,
  inputRevisionRef,
  hasRecommendedRef,
  createFallbackTempEventId,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
}: UseCreateModalParsingParams) => {
  const parseDraftRevisionRef = useRef(0);
  const lastParseRequestedAtRef = useRef(0);
  const parseAbortControllerRef = useRef<AbortController | null>(null);
  const setTempEventId = useEventCreationStore((state) => state.setTempEventId);
  const setStep = useEventCreationStore((state) => state.setStep);
  const setParsedCandidate = useEventCreationStore((state) => state.setParsedCandidate);

  useEffect(() => {
    return () => {
      parseAbortControllerRef.current?.abort();
    };
  }, []);

  // 입력 중 최신 원문을 최대 0.3초 간격으로 파싱한다.
  useEffect(() => {
    if (!trimmedInput) {
      parseAbortControllerRef.current?.abort();
      return;
    }

    const request = {
      input: inputValue,
      inputRevision: inputRevisionRef.current,
      tempEventId: useEventCreationStore.getState().tempEventId,
    };
    const elapsed = Date.now() - lastParseRequestedAtRef.current;
    const delay = Math.max(0, PARSING_THROTTLE_DELAY - elapsed);

    const timerId = window.setTimeout(async () => {
      lastParseRequestedAtRef.current = Date.now();
      parseAbortControllerRef.current?.abort();
      const controller = new AbortController();
      parseAbortControllerRef.current = controller;
      const draftRevision = parseDraftRevisionRef.current;
      parseDraftRevisionRef.current += 1;
      setStep('parsing');

      try {
        const response = await eventService.parse(
          {
            eventTitle: request.input,
            draftRevision,
            selectedDate: parseSelectedDate,
            ...(request.tempEventId ? { tempEventId: request.tempEventId } : {}),
          },
          controller.signal,
        );
        const nextTempEventId = response.tempEventId ?? request.tempEventId ?? null;
        const parsedCandidate = mapParseResponse(request.input, response, nextTempEventId);

        // TODO: 파싱 API가 revision을 지원하면 로컬 revision 비교를 서버 값으로 교체한다.
        if (
          controller.signal.aborted ||
          request.inputRevision !== inputRevisionRef.current ||
          (response.draftRevision !== undefined && response.draftRevision !== draftRevision)
        ) {
          return;
        }

        setTempEventId(nextTempEventId);
        setParsedCandidate(parsedCandidate);

        // 파싱 결과를 사용자가 직접 고른 일정값보다 우선한다.
        if (parsedCandidate.dateCandidate) {
          const parsedDate = parseISO(parsedCandidate.dateCandidate);

          if (isValid(parsedDate)) {
            setStartDate(parsedDate);
            const parsedEndDate = parsedCandidate.endDateCandidate
              ? parseISO(parsedCandidate.endDateCandidate)
              : parsedDate;

            setEndDate(isValid(parsedEndDate) ? parsedEndDate : parsedDate);
          }
        }

        if (parsedCandidate.timeCandidate) {
          setStartTime(parsedCandidate.timeCandidate);
        }

        // 종료 시간은 파싱 응답에 명시된 경우에만 반영한다.
        if (parsedCandidate.endTimeCandidate) {
          setEndTime(parsedCandidate.endTimeCandidate);
        }

        setStep(hasRecommendedRef.current ? 'recommendation' : 'input');
      } catch {
        if (controller.signal.aborted || request.inputRevision !== inputRevisionRef.current) {
          return;
        }

        // 파싱 실패가 일정 생성 흐름을 중단하지 않게 원문을 유지한다.
        const fallbackTempEventId = request.tempEventId ?? createFallbackTempEventId();
        setTempEventId(fallbackTempEventId);
        setParsedCandidate(createParseFallback(request.input, fallbackTempEventId));
        setStep(hasRecommendedRef.current ? 'recommendation' : 'input');
      }
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [
    createFallbackTempEventId,
    hasRecommendedRef,
    inputRevisionRef,
    inputValue,
    parseSelectedDate,
    setEndDate,
    setEndTime,
    setParsedCandidate,
    setStartDate,
    setStartTime,
    setStep,
    setTempEventId,
    trimmedInput,
  ]);
};

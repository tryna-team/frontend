import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

import { format } from 'date-fns';

import { recommendationService } from '@/apis/services/recommendationService';
import { useEventCreationStore } from '@/stores';

import { RECOMMENDATION_DEBOUNCE_DELAY } from './CreateModal.constants';
import { hasRecommendationFailed, mapRecommendationCandidate } from './CreateModal.mappers';

type UseCreateModalRecommendationsParams = {
  mode: 'default' | 'recommend';
  inputValue: string;
  trimmedInput: string;
  inputRevisionRef: MutableRefObject<number>;
  startDate: Date;
  createFallbackTempEventId: () => string;
};

export const useCreateModalRecommendations = ({
  mode,
  inputValue,
  trimmedInput,
  inputRevisionRef,
  startDate,
  createFallbackTempEventId,
}: UseCreateModalRecommendationsParams) => {
  const recommendationDraftRevisionRef = useRef(0);
  const recommendationAbortControllerRef = useRef<AbortController | null>(null);
  const lastInputChangedAtRef = useRef<number | null>(null);
  const hasRecommendedRef = useRef(mode === 'recommend');
  const startDateRef = useRef(startDate);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [recommendedTitle, setRecommendedTitle] = useState('');
  const [isRecommendationUnavailable, setIsRecommendationUnavailable] = useState(false);
  const [hasRecommendationResponse, setHasRecommendationResponse] = useState(false);
  const setTempEventId = useEventCreationStore((state) => state.setTempEventId);
  const setStep = useEventCreationStore((state) => state.setStep);
  const setLoadingRecommendations = useEventCreationStore(
    (state) => state.setLoadingRecommendations,
  );
  const setRecommendationCandidates = useEventCreationStore(
    (state) => state.setRecommendationCandidates,
  );
  const parsedCandidate = useEventCreationStore((state) => state.parsedCandidate);

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  const handleRecommendationInputChange = useCallback(() => {
    lastInputChangedAtRef.current = Date.now();
    recommendationAbortControllerRef.current?.abort();
    setLoadingRecommendations(false);
    setStep(hasRecommendedRef.current ? 'recommendation' : 'input');
  }, [setLoadingRecommendations, setStep]);

  const hideRecommendationUnavailable = useCallback(() => {
    setIsRecommendationUnavailable(false);
  }, []);

  // recommend 진입 전에 마지막 입력 1초 후 추천 요청을 시작한다.
  useEffect(() => {
    if (mode === 'recommend' || hasRecommended || !trimmedInput) {
      return;
    }

    const request = {
      input: inputValue,
      inputRevision: inputRevisionRef.current,
    };
    const remainingDelay = lastInputChangedAtRef.current
      ? Math.max(0, RECOMMENDATION_DEBOUNCE_DELAY - (Date.now() - lastInputChangedAtRef.current))
      : RECOMMENDATION_DEBOUNCE_DELAY;

    const timerId = window.setTimeout(async () => {
      const latestParsedCandidate = useEventCreationStore.getState().parsedCandidate;

      // 최신 입력의 파싱 결과가 준비된 뒤에만 추천을 요청한다.
      if (
        request.inputRevision !== inputRevisionRef.current ||
        latestParsedCandidate?.sourceText !== request.input
      ) {
        return;
      }

      recommendationAbortControllerRef.current?.abort();
      const controller = new AbortController();
      recommendationAbortControllerRef.current = controller;
      const draftRevision = recommendationDraftRevisionRef.current;
      recommendationDraftRevisionRef.current += 1;
      const currentTempEventId = useEventCreationStore.getState().tempEventId;
      const recommendationTempEventId =
        latestParsedCandidate.tempEventId ?? currentTempEventId ?? createFallbackTempEventId();
      setTempEventId(recommendationTempEventId);
      setLoadingRecommendations(true);
      setIsRecommendationUnavailable(false);

      const showRecommendationUnavailable = () => {
        setRecommendationCandidates([]);
        setRecommendedTitle(latestParsedCandidate.titleCandidate ?? request.input);
        setIsRecommendationUnavailable(true);
        setHasRecommendationResponse(false);
        hasRecommendedRef.current = true;
        setHasRecommended(true);
        setStep('recommendation');
      };

      try {
        const response = await recommendationService.getRecommendations(
          {
            tempEventId: recommendationTempEventId,
            draftRevision,
            eventTitle: latestParsedCandidate.titleCandidate ?? request.input,
            sourceType: 'USER_NATURAL_LANGUAGE',
            startDateCandidate:
              latestParsedCandidate.dateCandidate ?? format(startDateRef.current, 'yyyy-MM-dd'),
            startTimeCandidate: latestParsedCandidate.timeCandidate,
            endDateCandidate: latestParsedCandidate.endDateCandidate,
            endTimeCandidate: latestParsedCandidate.endTimeCandidate,
            ...(latestParsedCandidate.dateSource
              ? { startDateSource: latestParsedCandidate.dateSource }
              : {}),
            placeCandidate: latestParsedCandidate.placeCandidate,
            description: null,
            embeddingWords: latestParsedCandidate.embeddingWords ?? [],
          },
          controller.signal,
        );

        if (
          controller.signal.aborted ||
          request.inputRevision !== inputRevisionRef.current ||
          (response.draftRevision !== undefined && response.draftRevision !== draftRevision) ||
          (response.tempEventId !== undefined && response.tempEventId !== recommendationTempEventId)
        ) {
          return;
        }

        if (hasRecommendationFailed(response) || !response.suggestions?.length) {
          showRecommendationUnavailable();
          return;
        }

        const candidates = response.suggestions
          .map(mapRecommendationCandidate)
          .filter((candidate) => candidate.title.length > 0);

        if (candidates.length === 0) {
          showRecommendationUnavailable();
          return;
        }

        setRecommendationCandidates(candidates);
        setIsRecommendationUnavailable(false);
        setHasRecommendationResponse(true);
        setRecommendedTitle(latestParsedCandidate.titleCandidate ?? request.input);
        hasRecommendedRef.current = true;
        setHasRecommended(true);
        setStep('recommendation');
      } catch {
        if (!controller.signal.aborted && request.inputRevision === inputRevisionRef.current) {
          showRecommendationUnavailable();
        }
      } finally {
        if (request.inputRevision === inputRevisionRef.current) {
          setLoadingRecommendations(false);
        }
      }
    }, remainingDelay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    createFallbackTempEventId,
    hasRecommended,
    inputRevisionRef,
    inputValue,
    mode,
    parsedCandidate,
    setLoadingRecommendations,
    setRecommendationCandidates,
    setStep,
    setTempEventId,
    trimmedInput,
  ]);

  useEffect(
    () => () => {
      recommendationAbortControllerRef.current?.abort();
      setLoadingRecommendations(false);
    },
    [setLoadingRecommendations],
  );

  return {
    hasRecommended,
    recommendedTitle,
    isRecommendationUnavailable,
    hasRecommendationResponse,
    hasRecommendedRef,
    handleRecommendationInputChange,
    hideRecommendationUnavailable,
  };
};

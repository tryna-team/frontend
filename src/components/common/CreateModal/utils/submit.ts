import { differenceInCalendarDays, format, isSameDay, isValid, parseISO } from 'date-fns';

import type {
  EventCreateRequest,
  EventCreateResponse,
  EventRecurrenceType,
} from '@/apis/types/event';
import type { ActionItemSaveRequest, RecommendationFeedback } from '@/apis/types/recommendation';
import type { RepeatOption } from '@/features/event/components/create';
import type { RecommendationCandidate } from '@/stores/types';

import { RECURRENCE_TYPE } from '../constants';
import { detectRepeatOptionFromText, formatActionItemDisplayTime, normalizeTime } from './dateTime';

export const buildRecurrencePayload = (hasRepeatChanged: boolean, repeat: RepeatOption) => {
  const recurrenceType = hasRepeatChanged ? (RECURRENCE_TYPE[repeat] ?? 'NONE') : 'NONE';

  if (recurrenceType === 'NONE') {
    return {
      isRecurring: false,
      recurrenceType: 'NONE' as EventRecurrenceType,
      recurrenceInterval: null,
      recurrenceEndDate: null,
    };
  }

  return {
    isRecurring: true,
    recurrenceType,
    recurrenceInterval: 1,
    // 반복 종료일 설정 UI가 추가되기 전까지 무기한 반복으로 저장한다.
    recurrenceEndDate: null,
  };
};

export const buildFeedbackLogs = (
  recommendationCandidates: RecommendationCandidate[],
): RecommendationFeedback[] =>
  recommendationCandidates
    .filter((candidate) => candidate.createdBy !== 'USER')
    .map((candidate) => ({
      actionType: candidate.selected ? (candidate.edited ? 'EDITED' : 'SELECTED') : 'REJECTED',
      sourceTemplateId: candidate.sourceTemplateId ?? null,
      originalTitle: candidate.originalTitle ?? candidate.title,
      editedTitle: candidate.edited ? candidate.title : null,
      reason: null,
    }));

export const buildActionItemsPayload = (
  recommendationCandidates: RecommendationCandidate[],
  eventStartDate: Date,
  isRecurring: boolean,
): ActionItemSaveRequest | null => {
  if (recommendationCandidates.length === 0) {
    return null;
  }

  const selectedCandidates = recommendationCandidates.filter((candidate) => candidate.selected);

  return {
    // 생성 모달의 add 상태인 항목만 최종 저장한다.
    items: selectedCandidates.map((candidate) => {
      const apiItemType =
        candidate.apiItemType ??
        (candidate.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'UNTIMED_PREP');
      const displayDate = apiItemType === 'TIMED_ACTION' ? (candidate.displayDate ?? null) : null;
      const parsedDisplayDate = displayDate ? parseISO(displayDate) : null;
      const offsetDays =
        apiItemType !== 'TIMED_ACTION'
          ? 0
          : isRecurring && parsedDisplayDate && isValid(parsedDisplayDate)
            ? differenceInCalendarDays(parsedDisplayDate, eventStartDate)
            : (candidate.offsetDays ?? null);

      return {
        title: candidate.title,
        itemType: apiItemType,
        createdBy:
          candidate.createdBy === 'USER' ? 'USER' : candidate.edited ? 'USER_EDITED' : 'SYSTEM',
        displayDate,
        displayTime:
          apiItemType === 'TIMED_ACTION'
            ? formatActionItemDisplayTime(candidate.displayDate, candidate.displayTime)
            : null,
        offsetDays,
        sourceTemplateId: candidate.sourceTemplateId ?? null,
      };
    }),
    // 제외/수정 여부를 추천 개선용 피드백으로 전달한다.
    feedbackLogs: buildFeedbackLogs(recommendationCandidates),
  };
};

type BuildCreateEventRequestParams = {
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
  parsedCandidate?: {
    timeCandidate?: string | null;
    endTimeCandidate?: string | null;
    endDateCandidate?: string | null;
    placeCandidate?: string | null;
    eventTypeCandidate?: string | null;
  } | null;
  recommendationCandidates: RecommendationCandidate[];
  isScheduleAllDay?: boolean;
};

export const buildCreateEventRequest = ({
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
  isScheduleAllDay = false,
}: BuildCreateEventRequestParams): EventCreateRequest => {
  const detectedRepeat = detectRepeatOptionFromText(trimmedInput);
  const hasParsedStartTime = Boolean(parsedCandidate?.timeCandidate);
  const hasParsedEndTime = Boolean(parsedCandidate?.endTimeCandidate);
  const hasEffectiveStartTime = hasStartTimeChanged || hasParsedStartTime || Boolean(startTime);
  const hasEffectiveEndTime = hasEndTimeChanged || hasParsedEndTime || Boolean(endTime);
  const effectiveRepeat = detectedRepeat ?? repeat;
  const effectiveHasRepeatChanged = hasRepeatChanged || detectedRepeat !== null;
  const startTimeValue = isScheduleAllDay
    ? null
    : hasEffectiveStartTime
      ? normalizeTime(startTime || parsedCandidate?.timeCandidate || '')
      : null;
  const endTimeValue = isScheduleAllDay
    ? null
    : hasEffectiveEndTime
      ? normalizeTime(endTime || parsedCandidate?.endTimeCandidate || '')
      : null;
  const recurrencePayload = buildRecurrencePayload(effectiveHasRepeatChanged, effectiveRepeat);
  const shouldSaveEndDate =
    Boolean(endTimeValue) ||
    hasEndDateChanged ||
    Boolean(parsedCandidate?.endDateCandidate) ||
    !isSameDay(startDate, endDate);

  return {
    eventTitle: trimmedInput,
    // null이면 서버가 현재 사용자의 기본 라벨과 연결한다.
    labelId: selectedLabelId,
    description: null,
    startDate: format(startDate, 'yyyy-MM-dd'),
    startTime: startTimeValue,
    endDate: shouldSaveEndDate ? format(endDate, 'yyyy-MM-dd') : null,
    endTime: endTimeValue,
    isAllDay: isScheduleAllDay || (!startTimeValue && !endTimeValue),
    location: parsedCandidate?.placeCandidate ?? null,
    eventType: parsedCandidate?.eventTypeCandidate ?? null,
    ...recurrencePayload,
    actionItems: buildActionItemsPayload(
      recommendationCandidates,
      startDate,
      recurrencePayload.isRecurring,
    ),
  };
};

export const getTimedActionDates = (createResponse: EventCreateResponse) => [
  ...new Set(
    (createResponse.savedActionItems ?? [])
      .filter((item) => item.itemType === 'TIMED_ACTION' && Boolean(item.displayDate))
      .map((item) => item.displayDate as string),
  ),
];

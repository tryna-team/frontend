import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { format, isSameDay, isToday, isValid, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { eventService } from '@/apis/services/eventService';
import { labelService } from '@/apis/services/labelService';
import { recommendationService } from '@/apis/services/recommendationService';
import type { EventParseResponse, EventRecurrenceType } from '@/apis/types/event';
import type { RecommendationResponse, RecommendationSuggestion } from '@/apis/types/recommendation';
import { queryClient } from '@/apis/queryClient';
import Button from '@/components/common/Buttons/Button';
import Checklist, { type ChecklistItemData } from '@/components/common/Checklist/Checklist';
import LabelModal, { type LabelItemData } from '@/components/common/LabelModal/LabelModal';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import {
  ActionItemScheduleBottomSheet,
  RepeatScheduleBottomSheet,
  type ActionItemScheduleValue,
  type RepeatOption,
} from '@/features/event/components/create';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useEventCreationStore } from '@/stores';
import type { ActionItemType, ParsedEventCandidate, RecommendationCandidate } from '@/stores/types';

import type { ChecklistStatus } from '@/components/common/Checklist/ChecklistItem';

import CreateModalSkeleton from './CreateModalSkeleton';

export type LabelColor = 'apricot' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow';

export type CalendarStatus =
  | {
      type: 'default';
    }
  | {
      type: 'repeat';
      text: string;
    };

export type LabelStatus =
  | {
      type: 'default';
    }
  | {
      type: 'selected';
      id: number;
      label: string;
      color: LabelColor;
    };

// 기존 CreateModal에서 사용하던 체크리스트 데이터 타입을 유지
type CreateModalChecklistItem = {
  id: number;
  label: string;
  status?: ChecklistStatus;
  itemType?: ActionItemType;
  // status=add, done일 때 사용. 없으면 '당일'로 표시
  date?: string;
};

export type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: CreateModalChecklistItem[];
  initialScheduleDate?: Date;
  calendarStatus?: CalendarStatus;
  labelStatus?: LabelStatus;
  labels?: LabelItemData[];
  // 라벨 생성 시트(LabelCreateSheet)에서 방금 새로 만든 라벨의 id. 값이 바뀔 때마다
  // 그 라벨을 선택 상태로 반영한다(라벨 목록 관리 화면과 달리, 이벤트 생성 흐름에선
  // 라벨을 새로 만들면 바로 그 라벨이 선택돼 있어야 자연스럽다).
  pendingSelectedLabelId?: number | null;
  onInputChange?: (value: string) => void;
  onOpenCalendar?: () => void;
  onOpenLabel?: () => void;
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
  onAddChecklist?: () => void;
  onToggleChecklist?: (id: number) => void;
  onCreate?: (createdDate: string) => void;
  onClose?: () => void;
};

const COLOR_ICON = {
  apricot: '/icon/color_picker/apricot_small.svg',
  blue: '/icon/color_picker/blue_small.svg',
  green: '/icon/color_picker/green_small.svg',
  pink: '/icon/color_picker/pink_small.svg',
  purple: '/icon/color_picker/purple_small.svg',
  yellow: '/icon/color_picker/yellow_small.svg',
} as const;

// 직접 추가 항목에 사용하는 내부 전용 ID
// 실제 체크리스트 ID와 겹치지 않도록 음수를 사용
const ADD_CHECKLIST_ITEM_ID = -1;

const createManualCandidateId = () =>
  `manual-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  }`;

const PARSING_THROTTLE_DELAY = 300;
const RECOMMENDATION_DEBOUNCE_DELAY = 1000;

const formatChecklistDate = (
  date: string | null | undefined,
  endDate: string | null | undefined,
  fallbackDate: Date,
) => {
  const parsedDate = date ? parseISO(date) : fallbackDate;
  const validStartDate = isValid(parsedDate) ? parsedDate : fallbackDate;
  const parsedEndDate = endDate ? parseISO(endDate) : null;
  const startText = format(validStartDate, 'MM. dd.');

  return parsedEndDate && isValid(parsedEndDate) && !isSameDay(validStartDate, parsedEndDate)
    ? `${startText} - ${format(parsedEndDate, 'MM. dd.')}`
    : startText;
};

type RevisionRequest = {
  input: string;
  revision: number;
};

type RecommendationEditDraft = {
  candidateId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  originalItemType: RecommendationCandidate['itemType'];
  originalApiItemType: NonNullable<RecommendationCandidate['apiItemType']>;
  originalDisplayDate: string | null;
  originalDisplayEndDate: string | null;
  originalDisplayTime: string | null;
  hasTimeChanged: boolean;
};

// 실제 API 연결 시 내부만 파싱 요청으로 교체한다.
const mapParseResponse = (input: string, response: EventParseResponse): ParsedEventCandidate => ({
  sourceText: input,
  titleCandidate: response.eventTitle ?? input,
  dateCandidate: response.startDate ?? null,
  timeCandidate: response.startTime ?? null,
  placeCandidate: response.placeCandidate ?? null,
  eventTypeCandidate: null,
  tempEventId: response.tempEventId ?? null,
  dateSource: response.dateSource ?? null,
  endDateCandidate: response.endDate ?? null,
  endTimeCandidate: response.endTime ?? null,
  embeddingWords: response.toEmbedding ?? [],
  isAllDayCandidate: response.isAllDayCandidate ?? false,
  needsConfirmation: response.needsConfirmation ?? false,
  warnings: response.warnings ?? [],
});

const createParseFallback = (input: string): ParsedEventCandidate => ({
  sourceText: input,
  titleCandidate: input,
  dateCandidate: null,
  timeCandidate: null,
  placeCandidate: null,
  eventTypeCandidate: null,
  tempEventId: null,
  dateSource: null,
  endDateCandidate: null,
  endTimeCandidate: null,
  embeddingWords: [],
  isAllDayCandidate: true,
  needsConfirmation: true,
  warnings: [],
});

const mapRecommendationCandidate = (
  suggestion: RecommendationSuggestion,
  index: number,
): RecommendationCandidate => ({
  candidateId: suggestion.sourceCode ?? `recommendation-${index}`,
  title: suggestion.displayText ?? suggestion.sourceCode ?? '',
  // 공용 체크리스트에서는 비시간형 항목을 CHECKLIST로 표현한다.
  itemType: suggestion.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'CHECKLIST',
  apiItemType: suggestion.itemType ?? 'UNRESOLVED',
  sourceTemplateId: suggestion.sourceCode ?? null,
  offsetDays: suggestion.offsetDays ?? null,
  originalTitle: suggestion.displayText ?? suggestion.sourceCode ?? '',
  displayDate: suggestion.displayDate ?? null,
  displayTime: null,
  // 추천 항목은 모두 저장 대상인 상태로 시작한다.
  selected: true,
  edited: false,
});

const hasRecommendationFailed = (response: RecommendationResponse) =>
  response.suggestionStatus === 'ERROR' || response.suggestionStatus === 'EMPTY';

const RECURRENCE_TYPE: Record<RepeatOption, EventRecurrenceType> = {
  매일: 'DAILY',
  매주: 'WEEKLY',
  매월: 'MONTHLY',
  매년: 'YEARLY',
};

const buildRecurrencePayload = (hasRepeatChanged: boolean, repeat: RepeatOption) => {
  if (!hasRepeatChanged) {
    return {
      isRecurring: false,
      recurrenceType: 'NONE' as const,
      recurrenceInterval: null,
      recurrenceEndDate: null,
    };
  }

  return {
    isRecurring: true,
    recurrenceType: RECURRENCE_TYPE[repeat],
    recurrenceInterval: 1,
    // 반복 종료일 설정 UI가 추가되기 전까지 무기한 반복으로 저장한다.
    recurrenceEndDate: null,
  };
};

const normalizeTime = (time: string) => {
  const apiTime = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);

  if (apiTime) {
    return `${apiTime[1]}:${apiTime[2]}:${apiTime[3] ?? '00'}`;
  }

  const displayTime = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(time);

  if (!displayTime) {
    return null;
  }

  const hour = (Number(displayTime[1]) % 12) + (displayTime[3] === 'PM' ? 12 : 0);

  return `${String(hour).padStart(2, '0')}:${displayTime[2]}:00`;
};

const formatActionItemDisplayTime = (
  displayDate: string | null | undefined,
  displayTime: string | null | undefined,
) => {
  if (!displayDate || !displayTime) {
    return null;
  }

  const time = displayTime.includes('T') ? displayTime.split('T')[1] : displayTime;
  const normalizedTime = normalizeTime(time);

  return normalizedTime ? `${displayDate}T${normalizedTime}` : null;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const formatTime = ({ meridiem, hour, minute }: TimePickerValue) =>
  `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;

const formatTriggerDate = (date: Date) => (isToday(date) ? '오늘' : format(date, 'MM.dd'));

const formatTriggerTime = (time: string) => normalizeTime(time)?.slice(0, 5) ?? time;

const getCurrentTime = () => format(new Date(), 'h:mm a').toUpperCase();

const formatApiTimeForPicker = (time: string | null | undefined) => {
  const normalizedTime = time ? normalizeTime(time) : null;

  if (!normalizedTime) {
    return getCurrentTime();
  }

  const [hourText, minute] = normalizedTime.split(':');
  const hour = Number(hourText);
  const meridiem = hour >= 12 ? 'PM' : 'AM';

  return `${hour % 12 || 12}:${minute} ${meridiem}`;
};

export default function CreateModal({
  mode = 'default',
  inputValue = '',
  keyword = '',
  message = '',
  checklistItems = [],
  initialScheduleDate,
  calendarStatus = { type: 'default' },
  labelStatus = { type: 'default' },
  labels = [],
  pendingSelectedLabelId,
  onInputChange,
  onOpenCalendar,
  onOpenLabel,
  onSelectLabel,
  onCreateLabel,
  onAddChecklist,
  onToggleChecklist,
  onCreate,
  onClose,
}: CreateModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelButtonRef = useRef<HTMLButtonElement>(null);
  // 추천 초안 revision은 실제 추천 요청 횟수만 센다.
  const draftRevisionRef = useRef(0);
  const revisionRef = useRef(0);
  const lastParseRequestedAtRef = useRef(0);
  const parseAbortControllerRef = useRef<AbortController | null>(null);
  const recommendationAbortControllerRef = useRef<AbortController | null>(null);
  const createAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastInputChangedAtRef = useRef<number | null>(null);
  const hasRecommendedRef = useRef(mode === 'recommend');
  const keepKeyboardOpenRef = useRef(true);
  const isScheduleOpeningRef = useRef(false);
  const isKeyboardNavigationRef = useRef(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(
    labelStatus.type === 'selected' ? labelStatus.id : null,
  );

  // pendingSelectedLabelId가 바뀔 때(라벨 생성 시트에서 방금 새 라벨을 만들었을 때)만
  // 그 라벨을 선택 상태로 반영한다 — CreateModal은 그 사이 계속 마운트돼 있어
  // selectedLabelId의 초기값(위 labelStatus)만으로는 갱신되지 않는다.
  // (effect + setState 대신, "prop이 바뀌면 렌더 중에 state를 조정"하는 React 권장 패턴 —
  // eslint react-hooks/set-state-in-effect가 지적하는 불필요한 추가 렌더링을 피한다)
  const [appliedPendingLabelId, setAppliedPendingLabelId] = useState(pendingSelectedLabelId);
  if (pendingSelectedLabelId !== appliedPendingLabelId) {
    setAppliedPendingLabelId(pendingSelectedLabelId);
    if (pendingSelectedLabelId != null) {
      setSelectedLabelId(pendingSelectedLabelId);
    }
  }
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [recommendedTitle, setRecommendedTitle] = useState('');
  const [startDate, setStartDate] = useState(() => new Date(initialScheduleDate ?? new Date()));
  const [endDate, setEndDate] = useState(() => new Date(initialScheduleDate ?? new Date()));
  // 진입 경로의 날짜를 C103 파싱 기준일로 고정한다.
  const [parseSelectedDate] = useState(() =>
    format(initialScheduleDate ?? new Date(), 'yyyy-MM-dd'),
  );
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleOpenedAtTime, setScheduleOpenedAtTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatOption>('매주');
  const [hasScheduleChanged, setHasScheduleChanged] = useState(false);
  const [hasRepeatChanged, setHasRepeatChanged] = useState(false);
  const [hasEndDateChanged, setHasEndDateChanged] = useState(false);
  const [hasStartTimeChanged, setHasStartTimeChanged] = useState(false);
  const [hasEndTimeChanged, setHasEndTimeChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isRecommendationUnavailable, setIsRecommendationUnavailable] = useState(false);
  const [hasRecommendationResponse, setHasRecommendationResponse] = useState(false);
  const [recommendationEditDraft, setRecommendationEditDraft] =
    useState<RecommendationEditDraft | null>(null);
  const [hasInputInteractionStarted, setHasInputInteractionStarted] = useState(false);
  const startDateRef = useRef(startDate);
  const [visualViewportRect, setVisualViewportRect] = useState(() => ({
    top: window.visualViewport?.offsetTop ?? 0,
    height: window.visualViewport?.height ?? window.innerHeight,
  }));
  const [appFrameRect, setAppFrameRect] = useState(() => {
    const appFrame = document.querySelector<HTMLElement>('.transform-gpu');
    const { left = 0, width = window.innerWidth } = appFrame?.getBoundingClientRect() ?? {};

    return { left, width };
  });
  const isRecommendationLoading = useEventCreationStore((state) => state.isLoadingRecommendations);
  const recommendationCandidates = useEventCreationStore((state) => state.recommendationCandidates);
  const parsedCandidate = useEventCreationStore((state) => state.parsedCandidate);
  const setRawInput = useEventCreationStore((state) => state.setRawInput);
  const setStep = useEventCreationStore((state) => state.setStep);
  const setParsedCandidate = useEventCreationStore((state) => state.setParsedCandidate);
  const setLoadingRecommendations = useEventCreationStore(
    (state) => state.setLoadingRecommendations,
  );
  const setRecommendationCandidates = useEventCreationStore(
    (state) => state.setRecommendationCandidates,
  );
  const toggleCandidateSelected = useEventCreationStore((state) => state.toggleCandidateSelected);
  const editCandidate = useEventCreationStore((state) => state.editCandidate);
  const addManualCandidate = useEventCreationStore((state) => state.addManualCandidate);
  const resetCreation = useEventCreationStore((state) => state.reset);
  const { data: labelData } = useQuery({
    queryKey: queryKeys.labels.list(),
    queryFn: labelService.getLabels,
  });

  const apiLabels = useMemo<LabelItemData[]>(
    () =>
      (labelData?.labels ?? [])
        .filter((label) => label.isVisible)
        .map((label) => ({
          id: label.labelId,
          label: label.name,
          color: label.color.toLowerCase() as LabelColor,
        })),
    [labelData],
  );
  const selectableLabels = useMemo(
    () => Array.from(new Map([...labels, ...apiLabels].map((label) => [label.id, label])).values()),
    [apiLabels, labels],
  );
  const selectedLabel = selectableLabels.find((label) => label.id === selectedLabelId);

  const trimmedInput = inputValue.trim();
  const isRecommendMode = mode === 'recommend' || hasRecommended;
  const hasEmptySelectedRecommendationTitle =
    isRecommendMode &&
    recommendationCandidates.some((candidate) => candidate.selected && !candidate.title.trim());
  const recommendationKeyword = keyword || recommendedTitle || trimmedInput;
  const recommendationMessage = message || '에 필요한 체크리스트를 추천했어요.';
  const showRecommendationHeader =
    isRecommendMode &&
    !isRecommendationUnavailable &&
    hasRecommendationResponse &&
    recommendationCandidates.length > 0;

  const propCalendarText =
    calendarStatus.type === 'default' ? '오늘 · 반복 없음' : `${calendarStatus.text}마다`;
  const initialCalendarText = initialScheduleDate
    ? `${formatTriggerDate(startDate)} · 반복 없음`
    : propCalendarText;
  const hasDateRange =
    Boolean(parsedCandidate?.dateCandidate && parsedCandidate.endDateCandidate) ||
    hasEndDateChanged ||
    !isSameDay(startDate, endDate);
  const selectedDateText = hasDateRange
    ? `${format(startDate, 'MM.dd')}-${format(endDate, 'MM.dd')}`
    : formatTriggerDate(startDate);
  const hasParsedScheduleDate = Boolean(parsedCandidate?.dateCandidate);
  const hasConfiguredStartTime =
    Boolean(startTime) && (hasStartTimeChanged || Boolean(parsedCandidate?.timeCandidate));
  const hasConfiguredEndTime =
    Boolean(endTime) && (hasEndTimeChanged || Boolean(parsedCandidate?.endTimeCandidate));
  const hasParsedScheduleTime = Boolean(
    parsedCandidate?.timeCandidate || parsedCandidate?.endTimeCandidate,
  );
  const repeatText = hasRepeatChanged ? repeat : '반복 없음';
  // 단일 일정의 실제로 설정된 시간만 24시간제로 표시한다.
  const selectedTimeText = hasConfiguredStartTime
    ? `시작 ${formatTriggerTime(startTime)}${
        hasConfiguredEndTime ? ` - 종료 ${formatTriggerTime(endTime)}` : ''
      }`
    : hasConfiguredEndTime
      ? `종료 ${formatTriggerTime(endTime)}`
      : '';
  const selectedScheduleText =
    !hasDateRange && selectedTimeText
      ? `${selectedDateText} ${selectedTimeText}`
      : `${selectedDateText} · ${repeatText}`;
  const calendarText =
    hasScheduleChanged || hasParsedScheduleDate || hasParsedScheduleTime
      ? selectedScheduleText
      : initialCalendarText;

  const handleCloseRequest = useCallback(() => {
    if (trimmedInput && !isSaving) {
      setIsExitConfirmOpen(true);
      return;
    }

    onClose?.();
  }, [isSaving, onClose, trimmedInput]);

  const handleExitConfirmClose = useCallback(() => {
    setIsExitConfirmOpen(false);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleCreateOverlayClick = useCallback(() => {
    if (isLabelModalOpen) {
      // 라벨 선택 배경을 누르면 라벨 모달만 닫는다.
      setIsLabelModalOpen(false);
      window.requestAnimationFrame(() => {
        labelButtonRef.current?.focus();
      });
      return;
    }

    handleCloseRequest();
  }, [handleCloseRequest, isLabelModalOpen]);

  const handleExitConfirm = () => {
    // 확인한 경우에만 작성 중인 입력과 생성 후보를 삭제한다.
    onInputChange?.('');
    resetCreation();
    setIsExitConfirmOpen(false);
    onClose?.();
  };

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      createAbortControllerRef.current?.abort();
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
      revision: revisionRef.current,
    };
    const elapsed = Date.now() - lastParseRequestedAtRef.current;
    const delay = Math.max(0, PARSING_THROTTLE_DELAY - elapsed);

    const timerId = window.setTimeout(async () => {
      lastParseRequestedAtRef.current = Date.now();
      parseAbortControllerRef.current?.abort();
      const controller = new AbortController();
      parseAbortControllerRef.current = controller;
      setStep('parsing');
      try {
        const response = await eventService.parse(
          {
            eventTitle: request.input,
            selectedDate: parseSelectedDate,
          },
          controller.signal,
        );
        const parsedCandidate = mapParseResponse(request.input, response);

        // TODO: 파싱 API가 revision을 지원하면 로컬 revision 비교를 서버 값으로 교체한다.
        if (request.revision !== revisionRef.current) {
          return;
        }

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
        if (controller.signal.aborted || request.revision !== revisionRef.current) {
          return;
        }

        // 파싱 실패가 일정 생성 흐름을 중단하지 않게 원문을 유지한다.
        setParsedCandidate(createParseFallback(request.input));
        setStep(hasRecommendedRef.current ? 'recommendation' : 'input');
      }
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [inputValue, parseSelectedDate, setParsedCandidate, setStep, trimmedInput]);

  useEffect(
    () => () => {
      parseAbortControllerRef.current?.abort();
    },
    [],
  );

  // recommend 진입 전에는 마지막 입력 1초 후 추천 요청을 시작한다.
  useEffect(() => {
    if (mode === 'recommend' || hasRecommended || !trimmedInput) {
      return;
    }

    // 공백과 Backspace를 포함한 실제 마지막 입력을 기준으로 대기 시간을 계산한다.
    const request: RevisionRequest = { input: inputValue, revision: revisionRef.current };
    const remainingDelay = lastInputChangedAtRef.current
      ? Math.max(0, RECOMMENDATION_DEBOUNCE_DELAY - (Date.now() - lastInputChangedAtRef.current))
      : RECOMMENDATION_DEBOUNCE_DELAY;

    const timerId = window.setTimeout(async () => {
      const latestParsedCandidate = useEventCreationStore.getState().parsedCandidate;

      // 최신 입력의 파싱 결과가 준비된 뒤에만 추천을 요청한다.
      if (
        request.revision !== revisionRef.current ||
        latestParsedCandidate?.sourceText !== request.input ||
        !latestParsedCandidate.tempEventId
      ) {
        return;
      }

      recommendationAbortControllerRef.current?.abort();
      const controller = new AbortController();
      recommendationAbortControllerRef.current = controller;
      const draftRevision = draftRevisionRef.current;
      draftRevisionRef.current += 1;
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
            tempEventId: latestParsedCandidate.tempEventId,
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
          request.revision !== revisionRef.current ||
          (response.draftRevision !== undefined && response.draftRevision !== draftRevision) ||
          (response.tempEventId !== undefined &&
            response.tempEventId !== latestParsedCandidate.tempEventId)
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
        if (!controller.signal.aborted && request.revision === revisionRef.current) {
          showRecommendationUnavailable();
        }
      } finally {
        if (request.revision === revisionRef.current) {
          setLoadingRecommendations(false);
        }
      }
    }, remainingDelay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    hasRecommended,
    mode,
    parsedCandidate,
    setLoadingRecommendations,
    setRecommendationCandidates,
    setStep,
    inputValue,
    trimmedInput,
  ]);

  useEffect(
    () => () => {
      recommendationAbortControllerRef.current?.abort();
      setLoadingRecommendations(false);
    },
    [setLoadingRecommendations],
  );

  // 모달이 열려 있는 동안 배경 페이지의 스크롤을 잠근다.
  useEffect(() => {
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Tab 포커스를 생성 모달 안에서 순환시키고 Escape로 닫는다.
  useEffect(() => {
    const handleDialogKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isScheduleOpen) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();

        if (isExitConfirmOpen) {
          handleExitConfirmClose();
          return;
        }

        if (isLabelModalOpen) {
          setIsLabelModalOpen(false);
          window.requestAnimationFrame(() => {
            labelButtonRef.current?.focus();
          });
          return;
        }

        handleCloseRequest();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const isFocusOutside = !dialog.contains(activeElement);

      if (event.shiftKey && (activeElement === firstElement || isFocusOutside)) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && (activeElement === lastElement || isFocusOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);

    return () => document.removeEventListener('keydown', handleDialogKeyDown);
  }, [
    handleCloseRequest,
    handleExitConfirmClose,
    isExitConfirmOpen,
    isLabelModalOpen,
    isScheduleOpen,
  ]);

  // 오버레이를 키보드를 제외한 실제 화면 영역에 맞춘다.
  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const updateVisualViewport = () => {
      setVisualViewportRect({
        top: viewport.offsetTop,
        height: viewport.height,
      });
    };

    viewport.addEventListener('resize', updateVisualViewport);
    viewport.addEventListener('scroll', updateVisualViewport);
    const frameId = window.requestAnimationFrame(updateVisualViewport);

    return () => {
      window.cancelAnimationFrame(frameId);
      viewport.removeEventListener('resize', updateVisualViewport);
      viewport.removeEventListener('scroll', updateVisualViewport);
    };
  }, []);

  // Portal 내부 콘텐츠를 실제 캘린더 앱 프레임에 맞춘다.
  useEffect(() => {
    const appFrame = document.querySelector<HTMLElement>('.transform-gpu');

    if (!appFrame) {
      return;
    }

    const updateAppFrameRect = () => {
      const { left, width } = appFrame.getBoundingClientRect();
      setAppFrameRect({ left, width });
    };
    const resizeObserver = new ResizeObserver(updateAppFrameRect);

    updateAppFrameRect();
    resizeObserver.observe(appFrame);
    window.addEventListener('resize', updateAppFrameRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateAppFrameRect);
    };
  }, []);

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

  const handleSaveRecommendationEdit = () => {
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
    // 사용자가 시간을 직접 바꾸지 않았다면 기존 null 값을 유지한다.
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

    // 상위 일정과 다른 날짜 또는 날짜 범위는 시간형 항목으로 분류한다.
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
  };

  // CreateModal에서 전달받은 기존 체크리스트 데이터를 공용 Checklist 컴포넌트의 데이터 형식으로 변환
  const renderedChecklistItems = useMemo<ChecklistItemData[]>(() => {
    const hasRecommendationCandidates = recommendationCandidates.length > 0;
    const effectiveChecklistItems = hasRecommendationCandidates
      ? recommendationCandidates.map((candidate, index) => ({
          id: index + 1,
          label: candidate.title,
          status: candidate.selected ? ('add' as const) : ('done' as const),
          itemType: candidate.itemType,
          date: candidate.displayDate ?? undefined,
        }))
      : checklistItems;

    const recommendedItems = effectiveChecklistItems.map((item, index) => {
      const status = item.status ?? 'add';
      const hasDateTrailing = status === 'add' || status === 'done';
      const candidate = hasRecommendationCandidates ? recommendationCandidates[index] : undefined;
      const trailingText =
        item.itemType === 'TIMED_ACTION'
          ? formatChecklistDate(item.date, candidate?.displayEndDate, startDate)
          : '당일';

      return {
        id: item.id,
        label: item.label,
        labelContent: candidate ? (
          <input
            data-recommendation-title-input="true"
            aria-label={`${candidate.title || '추천 항목'} 제목 수정`}
            value={candidate.title}
            placeholder={candidate.createdBy === 'USER' ? '하위 목록을 작성하세요' : undefined}
            disabled={isSaving || !candidate.selected}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onChange={(event) =>
              editCandidate(candidate.candidateId, {
                title: event.target.value,
              })
            }
            className="min-w-0 w-full bg-transparent text-left text-text-default outline-none disabled:cursor-default disabled:text-text-disable default-body-large"
          />
        ) : undefined,
        status,
        trailing: hasDateTrailing
          ? {
              type: 'date' as const,
              text: trailingText,
              onClick:
                candidate?.selected && !isSaving
                  ? () => handleOpenRecommendationEdit(candidate)
                  : undefined,
            }
          : {
              type: 'none' as const,
            },
      };
    });

    return recommendedItems;
  }, [
    checklistItems,
    editCandidate,
    handleOpenRecommendationEdit,
    isSaving,
    recommendationCandidates,
    startDate,
  ]);

  const directAddChecklistItem = useMemo<ChecklistItemData[]>(
    () => [
      {
        id: ADD_CHECKLIST_ITEM_ID,
        label: '직접 추가',
        status: 'plus',
        trailing: {
          type: 'none',
        },
      },
    ],
    [],
  );

  // 항목이 늘어나면 모달이 위로 확장되고, 남은 공간부터 목록만 스크롤한다.
  const checklistScrollMaxHeight = Math.max(52, Math.min(312, visualViewportRect.height - 188));

  const handleChecklistClick = (id: number) => {
    if (isSaving) {
      return;
    }

    if (id === ADD_CHECKLIST_ITEM_ID) {
      // 직접 추가 항목이 생기면 모달 확장 공간을 위해 오류 안내를 닫는다.
      setIsRecommendationUnavailable(false);
      addManualCandidate({
        candidateId: createManualCandidateId(),
        title: '',
        createdBy: 'USER',
        itemType: 'CHECKLIST',
        apiItemType: 'UNTIMED_PREP',
        sourceTemplateId: null,
        offsetDays: null,
        originalTitle: '',
        displayDate: null,
        displayEndDate: null,
        displayTime: null,
        selected: true,
        edited: false,
      });
      onAddChecklist?.();
      return;
    }

    if (recommendationCandidates.length > 0) {
      const candidate = recommendationCandidates[id - 1];

      if (candidate) {
        toggleCandidateSelected(candidate.candidateId);
      }

      return;
    }

    onToggleChecklist?.(id);
  };

  const handleLabelClick = () => {
    if (isSaving) {
      return;
    }

    setIsLabelModalOpen((isOpen) => !isOpen);
    onOpenLabel?.();
  };

  const handleCalendarClick = () => {
    if (isSaving || isScheduleOpeningRef.current) {
      return;
    }

    const currentTime = getCurrentTime();

    // 바텀시트가 열린 시각을 미설정 시간 필드의 피커 초기값으로 사용한다.
    setScheduleOpenedAtTime(currentTime);

    isScheduleOpeningRef.current = true;
    keepKeyboardOpenRef.current = false;
    setIsLabelModalOpen(false);
    setIsScheduleOpen(true);
    inputRef.current?.blur();
    onOpenCalendar?.();
  };

  // 생성 모달 안에서는 입력 포커스를 유지한다.
  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    // 추천 항목 제목을 누르면 해당 입력창으로 포커스를 넘긴다.
    if (
      event.relatedTarget instanceof HTMLElement &&
      event.relatedTarget.dataset.recommendationTitleInput === 'true'
    ) {
      return;
    }

    if (isKeyboardNavigationRef.current && event.relatedTarget instanceof HTMLElement) {
      isKeyboardNavigationRef.current = false;
      return;
    }

    isKeyboardNavigationRef.current = false;

    window.requestAnimationFrame(() => {
      if (keepKeyboardOpenRef.current) {
        inputRef.current?.focus();
      }
    });
  };

  // Tab 이동은 다른 컨트롤의 포커스를 유지한다.
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      isKeyboardNavigationRef.current = true;
    }
  };

  const handleInputChange = (value: string) => {
    if (isSaving) {
      return;
    }

    if (value) {
      setHasInputInteractionStarted(true);
    }

    // revision을 올려 이전 파싱·추천 응답을 무효화한다.
    revisionRef.current += 1;
    lastInputChangedAtRef.current = Date.now();
    recommendationAbortControllerRef.current?.abort();
    setRawInput(value);
    setLoadingRecommendations(false);
    setStep(hasRecommendedRef.current ? 'recommendation' : 'input');
    onInputChange?.(value);
  };

  // 스케줄 설정 화면에서는 키보드를 내린다.
  const handleCalendarPointerDown = () => {
    handleCalendarClick();
  };

  // 생성 모달로 돌아오면 키보드를 다시 연다.
  const handleScheduleClose = () => {
    setIsScheduleOpen(false);
    isScheduleOpeningRef.current = false;
    keepKeyboardOpenRef.current = true;

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleSelectLabel = (id: number) => {
    if (isSaving) {
      return;
    }

    setSelectedLabelId(id);
    setIsLabelModalOpen(false);
    onSelectLabel?.(id);
  };

  const handleCreateLabel = () => {
    if (isSaving) {
      return;
    }

    setIsLabelModalOpen(false);
    onCreateLabel?.();
  };

  const handleCreate = async () => {
    if (isSaving || !trimmedInput) {
      return;
    }

    const createRevision = revisionRef.current;
    const selectedCandidates = recommendationCandidates.filter((candidate) => candidate.selected);
    if (selectedCandidates.some((candidate) => !candidate.title.trim())) {
      window.alert('추천 항목의 제목을 입력해주세요.');
      return;
    }
    const controller = new AbortController();
    createAbortControllerRef.current = controller;
    const hasParsedStartTime = Boolean(parsedCandidate?.timeCandidate);
    const hasParsedEndTime = Boolean(parsedCandidate?.endTimeCandidate);
    const startTimeValue =
      hasStartTimeChanged || hasParsedStartTime ? normalizeTime(startTime) : null;
    const endTimeValue = hasEndTimeChanged || hasParsedEndTime ? normalizeTime(endTime) : null;
    // 종료 시간이 있으면 단일 날짜 일정도 종료 날짜를 함께 저장한다.
    const shouldSaveEndDate =
      Boolean(endTimeValue) ||
      hasEndDateChanged ||
      Boolean(parsedCandidate?.endDateCandidate) ||
      !isSameDay(startDate, endDate);
    // 주간 요일과 월간·연간 기준일은 서버가 시작 날짜에서 계산한다.
    const recurrencePayload = buildRecurrencePayload(hasRepeatChanged, repeat);

    setIsSaving(true);

    try {
      const createResponse = await eventService.create(
        {
          eventTitle: trimmedInput,
          // null이면 서버가 현재 사용자의 기본 라벨을 연결한다.
          labelId: selectedLabelId,
          description: null,
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime: startTimeValue,
          endDate: shouldSaveEndDate ? format(endDate, 'yyyy-MM-dd') : null,
          endTime: endTimeValue,
          isAllDay: !startTimeValue && !endTimeValue,
          location: parsedCandidate?.placeCandidate ?? null,
          eventType: parsedCandidate?.eventTypeCandidate ?? null,
          ...recurrencePayload,
          actionItems:
            recommendationCandidates.length > 0
              ? {
                  // 생성 모달의 add 상태인 항목만 최종 저장한다.
                  items: selectedCandidates.map((candidate) => {
                    const apiItemType =
                      candidate.apiItemType ??
                      (candidate.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'UNTIMED_PREP');

                    return {
                      title: candidate.title,
                      itemType: apiItemType,
                      createdBy:
                        candidate.createdBy === 'USER'
                          ? 'USER'
                          : candidate.edited
                            ? 'USER_EDITED'
                            : 'SYSTEM',
                      occurrenceDate: format(startDate, 'yyyy-MM-dd'),
                      displayDate:
                        apiItemType === 'TIMED_ACTION' ? (candidate.displayDate ?? null) : null,
                      displayTime:
                        apiItemType === 'TIMED_ACTION'
                          ? formatActionItemDisplayTime(
                              candidate.displayDate,
                              candidate.displayTime,
                            )
                          : null,
                      offsetDays: candidate.offsetDays ?? null,
                      sourceTemplateId: candidate.sourceTemplateId ?? null,
                    };
                  }),
                  // 제외·수정 여부도 추천 개선용 피드백으로 전달한다.
                  feedbackLogs: recommendationCandidates
                    .filter((candidate) => candidate.createdBy !== 'USER')
                    .map((candidate) => ({
                      actionType: candidate.selected
                        ? candidate.edited
                          ? 'EDITED'
                          : 'SELECTED'
                        : 'REJECTED',
                      sourceTemplateId: candidate.sourceTemplateId ?? null,
                      originalTitle: candidate.originalTitle ?? candidate.title,
                      editedTitle: candidate.edited ? candidate.title : null,
                      reason: null,
                    })),
                }
              : null,
        },
        controller.signal,
      );

      const timedActionDates = [
        ...new Set(
          (createResponse.savedActionItems ?? [])
            .filter((item) => item.itemType === 'TIMED_ACTION' && Boolean(item.displayDate))
            .map((item) => item.displayDate as string),
        ),
      ];

      // 생성된 일정과 시간형 항목을 각 화면에서 다시 조회한다.
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

      // 이전 초안의 완료 응답은 현재 생성 세션을 변경하지 않는다.
      if (!isMountedRef.current || createRevision !== revisionRef.current) {
        return;
      }

      resetCreation();
      onCreate?.(format(startDate, 'yyyy-MM-dd'));
    } catch {
      if (
        controller.signal.aborted ||
        !isMountedRef.current ||
        createRevision !== revisionRef.current
      ) {
        return;
      }

      // TODO: 공통 일정 저장 오류 UI가 준비되면 alert을 교체한다.
      window.alert('일정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (createAbortControllerRef.current === controller) {
        createAbortControllerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      {/* 하위 일정 설정 화면이 열리면 생성 모달을 숨긴다. */}
      {!isScheduleOpen &&
        !recommendationEditDraft &&
        createPortal(
          <Overlay onClick={handleCreateOverlayClick}>
            {(hasInputInteractionStarted || isRecommendMode) && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute overflow-hidden"
                style={{
                  left: appFrameRect.left,
                  width: appFrameRect.width,
                  top: visualViewportRect.top,
                  height: visualViewportRect.height,
                }}
              >
                <video
                  src="/BlendDimVideo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${isRecommendMode ? 'opacity-100' : 'opacity-50'}`}
                />
              </div>
            )}

            {/* 키보드를 제외한 화면 영역의 하단에 생성 모달을 맞춘다. */}
            <div
              ref={dialogRef}
              className="absolute flex items-end justify-center"
              style={{
                left: appFrameRect.left,
                width: appFrameRect.width,
                top: visualViewportRect.top,
                height: visualViewportRect.height,
              }}
            >
              <div className="flex w-full max-w-[385px] flex-col gap-2">
                {isRecommendationUnavailable && (
                  <ToastPopup inline GuideText="제안을 불러오지 못했습니다. 다시 시도해주세요." />
                )}

                <Frame
                  className="w-full !max-w-none !items-start !overflow-visible gap-0.5 p-3"
                  aria-labelledby={titleId}
                >
                  <h2 id={titleId} className="sr-only">
                    일정 생성
                  </h2>

                  {isRecommendationLoading && <CreateModalSkeleton />}

                  {isRecommendMode && (
                    <div className="flex w-full flex-col">
                      {showRecommendationHeader && (
                        <div className="flex w-full items-center justify-between px-1 py-2">
                          <p className="min-w-0 text-text-additional default-body-medium">
                            <span className="bg-gradient-to-l from-green-500 to-green-400 bg-clip-text text-transparent default-body-strong-medium">
                              {recommendationKeyword}
                            </span>

                            {recommendationMessage}
                          </p>
                        </div>
                      )}

                      <div
                        aria-disabled={isSaving}
                        className={isSaving ? 'pointer-events-none' : undefined}
                        onPointerDown={(event) => {
                          // 추천 제목 입력은 포커스를 유지하고, 나머지 터치는 키보드를 유지한다.
                          if (!(event.target instanceof HTMLInputElement)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <div className="flex min-h-0 w-full flex-col">
                          <div
                            className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            style={{ maxHeight: checklistScrollMaxHeight }}
                          >
                            <Checklist
                              items={renderedChecklistItems}
                              radioVariant="create"
                              showDivider={false}
                              onLeadingClick={handleChecklistClick}
                            />
                          </div>

                          <div className="shrink-0">
                            <Checklist
                              items={directAddChecklistItem}
                              radioVariant="create"
                              showDivider={false}
                              onLeadingClick={handleChecklistClick}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex w-full items-center justify-between self-stretch pl-2">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      disabled={isSaving}
                      value={inputValue}
                      onPointerDown={() => setHasInputInteractionStarted(true)}
                      onChange={(event) => handleInputChange(event.target.value)}
                      onBlur={handleInputBlur}
                      onKeyDown={handleInputKeyDown}
                      placeholder="어떤 일 인가요?"
                      className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
                    />

                    <Button
                      variant="CheckCTAButton"
                      className="size-9"
                      disabled={!trimmedInput || isSaving || hasEmptySelectedRecommendationTitle}
                      onClick={handleCreate}
                    />
                  </div>

                  <div className="flex w-full items-center gap-4 px-1 py-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onPointerDown={handleCalendarPointerDown}
                      onClick={handleCalendarClick}
                      className="flex items-center gap-xsmall border-0 bg-transparent p-0 text-text-additional default-caption-large"
                    >
                      <img src="/icon/icons/calendar_small.svg" alt="" className="block shrink-0" />

                      <span className="whitespace-nowrap">{calendarText}</span>
                    </button>

                    <div className="relative flex min-w-0">
                      <button
                        ref={labelButtonRef}
                        type="button"
                        disabled={isSaving}
                        onClick={handleLabelClick}
                        className="flex min-w-0 items-center gap-xsmall border-0 bg-transparent p-0 text-text-additional default-caption-large"
                      >
                        <img src="/icon/icons/label_small.svg" alt="" className="block shrink-0" />

                        {!selectedLabel && labelStatus.type === 'default' ? (
                          <span className="whitespace-nowrap">레이블 없음</span>
                        ) : (
                          <div className="flex min-w-0 items-center gap-xsmall">
                            <span className="max-w-[80px] truncate">
                              {selectedLabel?.label ??
                                (labelStatus.type === 'selected' ? labelStatus.label : '')}
                            </span>

                            <img
                              src={
                                COLOR_ICON[
                                  selectedLabel?.color ??
                                    (labelStatus.type === 'selected' ? labelStatus.color : 'green')
                                ]
                              }
                              alt=""
                              className="block shrink-0"
                            />
                          </div>
                        )}
                      </button>

                      {isLabelModalOpen && (
                        <div className="absolute bottom-[calc(100%+8px)] left-0 z-30">
                          <LabelModal
                            labels={selectableLabels}
                            onSelectLabel={handleSelectLabel}
                            onCreateLabel={handleCreateLabel}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Frame>
              </div>
            </div>
          </Overlay>,
          document.body,
        )}

      {isExitConfirmOpen &&
        createPortal(
          <ToastPopup
            GuideText="나가면 데이터는 삭제됩니다."
            confirmText="확인"
            onConfirm={handleExitConfirm}
            onClose={handleExitConfirmClose}
          />,
          document.body,
        )}

      {recommendationEditDraft && (
        <ActionItemScheduleBottomSheet
          title={recommendationEditDraft.title}
          parentEventStartDate={startDate}
          parentEventEndDate={endDate}
          startDate={recommendationEditDraft.startDate}
          endDate={recommendationEditDraft.endDate}
          startTime={recommendationEditDraft.startTime}
          endTime={recommendationEditDraft.endTime}
          onChange={(value: ActionItemScheduleValue) =>
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
            )
          }
          onClose={handleSaveRecommendationEdit}
        />
      )}

      {isScheduleOpen && (
        <RepeatScheduleBottomSheet
          startDate={startDate}
          endDate={endDate}
          startTime={startTime || scheduleOpenedAtTime}
          endTime={endTime || scheduleOpenedAtTime}
          repeat={repeat}
          onStartDateChange={(date) => {
            setStartDate(date);
            setHasScheduleChanged(true);
          }}
          onEndDateChange={(date) => {
            setEndDate(date);
            setHasScheduleChanged(true);
            setHasEndDateChanged(true);
          }}
          onStartTimeChange={(value) => {
            setStartTime(formatTime(value));
            setHasStartTimeChanged(true);
            setHasScheduleChanged(true);
          }}
          onEndTimeChange={(value) => {
            // 시작 시간이 없으면 바텀시트를 연 시점의 현재 시간으로 보완한다.
            if (!startTime) {
              setStartTime(scheduleOpenedAtTime);
              setHasStartTimeChanged(true);
            }
            setEndTime(formatTime(value));
            setHasEndTimeChanged(true);
            setHasScheduleChanged(true);
          }}
          onRepeatChange={(nextRepeat) => {
            setRepeat(nextRepeat);
            setHasRepeatChanged(true);
            setHasScheduleChanged(true);
          }}
          onClose={handleScheduleClose}
        />
      )}
    </>
  );
}

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { addDays, format, isSameDay, isToday, isValid, parseISO } from 'date-fns';

import { eventService } from '@/apis/services/eventService';
import type { EventParseResponse } from '@/apis/types/event';
import Button from '@/components/common/Buttons/Button';
import Checklist, { type ChecklistItemData } from '@/components/common/Checklist/Checklist';
import LabelModal, { type LabelItemData } from '@/components/common/LabelModal/LabelModal';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import { RepeatScheduleBottomSheet, type RepeatOption } from '@/features/event/components/create';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial';
import { useEventCreationStore } from '@/stores';
import type {
  ActionItemType,
  ParsedEventCandidate,
  RecommendationCandidate,
} from '@/stores/types';

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
  onInputChange?: (value: string) => void;
  onOpenCalendar?: () => void;
  onOpenLabel?: () => void;
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
  onAddChecklist?: () => void;
  onToggleChecklist?: (id: number) => void;
  onCreate?: () => void;
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

const PARSING_THROTTLE_DELAY = 300;
const RECOMMENDATION_DEBOUNCE_DELAY = 1000;
const MOCK_RECOMMENDATION_RESPONSE_DELAY = 4000;

const formatChecklistDate = (date: string | null | undefined, fallbackDate: Date) => {
  const parsedDate = date ? parseISO(date) : fallbackDate;

  return format(isValid(parsedDate) ? parsedDate : fallbackDate, 'MM. dd.');
};

type RevisionRequest = {
  input: string;
  revision: number;
};

type MockRecommendationResponse = {
  title: string;
  candidates: RecommendationCandidate[];
};

// 실제 API 연결 시 내부만 파싱 요청으로 교체한다.
const mapParseResponse = (
  input: string,
  response: EventParseResponse,
): ParsedEventCandidate => ({
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

// 실제 API 연결 전 추천 응답 형태와 대기 흐름을 재현한다.
const requestMockRecommendations = (
  { input }: RevisionRequest,
  scheduleDate: Date,
): Promise<MockRecommendationResponse> =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        title: `${input}에 필요한 체크리스트를 추천했어요.`,
        candidates: [
          {
            candidateId: 'mock-1',
            title: '일정 세부 내용 확인하기',
            itemType: 'CHECKLIST',
            displayDate: null,
            selected: true,
            edited: false,
          },
          {
            candidateId: 'mock-2',
            title: '필요한 준비물 챙기기',
            itemType: 'TIMED_ACTION',
            displayDate: format(addDays(scheduleDate, -1), 'yyyy-MM-dd'),
            selected: true,
            edited: false,
          },
          {
            candidateId: 'mock-3',
            title: '참석자에게 일정 공유하기',
            itemType: 'TIMED_ACTION',
            displayDate: format(scheduleDate, 'yyyy-MM-dd'),
            selected: true,
            edited: false,
          },
        ],
      });
    }, MOCK_RECOMMENDATION_RESPONSE_DELAY);
  });

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

const formatTriggerDate = (date: Date) => (isToday(date) ? '오늘' : format(date, 'M.d'));

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
  const revisionRef = useRef(0);
  const lastParseRequestedAtRef = useRef(0);
  const parseAbortControllerRef = useRef<AbortController | null>(null);
  const hasRecommendedRef = useRef(mode === 'recommend');
  const keepKeyboardOpenRef = useRef(true);
  const isScheduleOpeningRef = useRef(false);
  const isKeyboardNavigationRef = useRef(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [recommendedTitle, setRecommendedTitle] = useState('');
  const [startDate, setStartDate] = useState(() => new Date(initialScheduleDate ?? new Date()));
  const [endDate, setEndDate] = useState(() => new Date(initialScheduleDate ?? new Date()));
  const [startTime, setStartTime] = useState('9:41 AM');
  const [endTime, setEndTime] = useState('9:41 AM');
  const [repeat, setRepeat] = useState<RepeatOption>('매주');
  const [hasScheduleChanged, setHasScheduleChanged] = useState(false);
  const startDateRef = useRef(startDate);
  const [visualViewportRect, setVisualViewportRect] = useState(() => ({
    top: window.visualViewport?.offsetTop ?? 0,
    height: window.visualViewport?.height ?? window.innerHeight,
  }));
  const isRecommendationLoading = useEventCreationStore(
    (state) => state.isLoadingRecommendations,
  );
  const recommendationCandidates = useEventCreationStore((state) => state.recommendationCandidates);
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

  const trimmedInput = inputValue.trim();
  const isRecommendMode = mode === 'recommend' || hasRecommended;
  const recommendationKeyword = keyword || trimmedInput;
  const recommendationMessage =
    message || recommendedTitle || '에 필요한 체크리스트를 추천했어요.';

  const propCalendarText =
    calendarStatus.type === 'default' ? '오늘 · 반복 없음' : `${calendarStatus.text}마다`;
  const initialCalendarText = initialScheduleDate
    ? `${formatTriggerDate(startDate)} · 반복 없음`
    : propCalendarText;
  const selectedDateText = isSameDay(startDate, endDate)
    ? formatTriggerDate(startDate)
    : `${formatTriggerDate(startDate)}~${format(endDate, 'M.d')}`;
  const calendarText = hasScheduleChanged ? `${selectedDateText} · ${repeat}` : initialCalendarText;

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  // 입력 중 최신 원문을 최대 0.3초 간격으로 파싱한다.
  useEffect(() => {
    if (!trimmedInput) {
      parseAbortControllerRef.current?.abort();
      return;
    }

    const request = {
      input: trimmedInput,
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
          { eventTitle: request.input },
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
            setEndDate(parsedDate);
          }
        }

        if (parsedCandidate.timeCandidate) {
          setStartTime(parsedCandidate.timeCandidate);
          setEndTime(parsedCandidate.timeCandidate);
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
  }, [setParsedCandidate, setStep, trimmedInput]);

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

    const request = {
      input: trimmedInput,
      revision: revisionRef.current,
    };
    const timerId = window.setTimeout(async () => {
      setLoadingRecommendations(true);
      const response = await requestMockRecommendations(request, startDateRef.current);

      if (request.revision !== revisionRef.current) {
        return;
      }

      setRecommendationCandidates(response.candidates);
      setRecommendedTitle(response.title);
      hasRecommendedRef.current = true;
      setHasRecommended(true);
      setLoadingRecommendations(false);
      setStep('recommendation');
    }, RECOMMENDATION_DEBOUNCE_DELAY);

    return () => window.clearTimeout(timerId);
  }, [
    hasRecommended,
    mode,
    setLoadingRecommendations,
    setRecommendationCandidates,
    setStep,
    trimmedInput,
  ]);

  useEffect(
    () => () => {
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

        if (isLabelModalOpen) {
          setIsLabelModalOpen(false);
          window.requestAnimationFrame(() => {
            labelButtonRef.current?.focus();
          });
          return;
        }

        onClose?.();
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
  }, [isLabelModalOpen, isScheduleOpen, onClose]);

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

  // CreateModal에서 전달받은 기존 체크리스트 데이터를 공용 Checklist 컴포넌트의 데이터 형식으로 변환
  const renderedChecklistItems = useMemo<ChecklistItemData[]>(() => {
    const effectiveChecklistItems =
      checklistItems.length > 0
        ? checklistItems
        : recommendationCandidates.map((candidate, index) => ({
            id: index + 1,
            label: candidate.title,
            status: candidate.selected ? ('add' as const) : ('done' as const),
            itemType: candidate.itemType,
            date: candidate.displayDate ?? undefined,
          }));

    const recommendedItems = effectiveChecklistItems.map((item) => {
      const status = item.status ?? 'add';
      const hasDateTrailing = status === 'add' || status === 'done';
      const trailingText =
        item.itemType === 'TIMED_ACTION' ? formatChecklistDate(item.date, startDate) : '당일';

      return {
        id: item.id,
        label: item.label,
        status,
        trailing: hasDateTrailing
          ? {
              type: 'date' as const,
              text: trailingText,
            }
          : {
              type: 'none' as const,
            },
      };
    });

    const addItem: ChecklistItemData = {
      id: ADD_CHECKLIST_ITEM_ID,
      label: '직접 추가',
      status: 'plus',
      trailing: {
        type: 'none',
      },
    };

    return [...recommendedItems, addItem];
  }, [checklistItems, recommendationCandidates, startDate]);

  const handleChecklistClick = (id: number) => {
    if (id === ADD_CHECKLIST_ITEM_ID) {
      onAddChecklist?.();
      return;
    }

    if (checklistItems.length === 0) {
      const candidate = recommendationCandidates[id - 1];

      if (candidate) {
        toggleCandidateSelected(candidate.candidateId);
      }

      return;
    }

    onToggleChecklist?.(id);
  };

  const handleLabelClick = () => {
    setIsLabelModalOpen((isOpen) => !isOpen);
    onOpenLabel?.();
  };

  const handleCalendarClick = () => {
    if (isScheduleOpeningRef.current) {
      return;
    }

    isScheduleOpeningRef.current = true;
    keepKeyboardOpenRef.current = false;
    setIsLabelModalOpen(false);
    setIsScheduleOpen(true);
    inputRef.current?.blur();
    onOpenCalendar?.();
  };

  // 생성 모달 안에서는 입력 포커스를 유지한다.
  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
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
    // revision을 올려 이전 파싱·추천 응답을 무효화한다.
    revisionRef.current += 1;
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
    setIsLabelModalOpen(false);
    onSelectLabel?.(id);
  };

  const handleCreateLabel = () => {
    setIsLabelModalOpen(false);
    onCreateLabel?.();
  };

  return (
    <>
      {/* 생성 모달만 Portal로 분리하고 반복 바텀시트는 앱 레이아웃을 따른다. */}
      {!isScheduleOpen &&
        createPortal(
          <Overlay onClick={onClose}>
            {/* 키보드를 제외한 화면 영역의 하단에 생성 모달을 맞춘다. */}
            <div
              ref={dialogRef}
              className="absolute right-0 left-0 flex items-end justify-center"
              style={{
                top: visualViewportRect.top,
                height: visualViewportRect.height,
              }}
            >
              <Frame
                className="!items-start !overflow-visible max-w-[385px] gap-0.5 p-3"
                aria-labelledby={titleId}
              >
                <h2 id={titleId} className="sr-only">
                  일정 생성
                </h2>

                {isRecommendationLoading && <CreateModalSkeleton />}

                {isRecommendMode && (
                  <div className="flex w-full flex-col">
                    <div className="flex w-full items-center justify-between px-1 py-2">
                      <p className="min-w-0 text-text-additional default-body-medium">
                        {recommendedTitle ? (
                          recommendedTitle
                        ) : (
                          <>
                            <span className="bg-gradient-to-l from-[#29C878] to-[#32E089] bg-clip-text text-transparent default-body-strong-medium">
                              {recommendationKeyword}
                            </span>

                            {recommendationMessage}
                          </>
                        )}
                      </p>
                    </div>

                    <div onPointerDown={(event) => event.preventDefault()}>
                      <Checklist
                        items={renderedChecklistItems}
                        radioVariant="create"
                        onLeadingClick={handleChecklistClick}
                      />
                    </div>
                  </div>
                )}

                <div className="flex w-full items-center justify-between self-stretch pl-2">
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    value={inputValue}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    placeholder="어떤 일 인가요?"
                    className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
                  />

                  <Button variant="MediumDefaultFit" disabled={!isRecommendMode} onClick={onCreate}>
                    생성
                  </Button>
                </div>

                <div className="flex w-full items-center gap-4 px-1 py-1">
                  <button
                    type="button"
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
                      onClick={handleLabelClick}
                      className="flex min-w-0 items-center gap-xsmall border-0 bg-transparent p-0 text-text-additional default-caption-large"
                    >
                      <img src="/icon/icons/label_small.svg" alt="" className="block shrink-0" />

                      {labelStatus.type === 'default' ? (
                        <span className="whitespace-nowrap">레이블 없음</span>
                      ) : (
                        <div className="flex min-w-0 items-center gap-xsmall">
                          <span className="max-w-[80px] truncate">{labelStatus.label}</span>

                          <img
                            src={COLOR_ICON[labelStatus.color]}
                            alt=""
                            className="block shrink-0"
                          />
                        </div>
                      )}
                    </button>

                    {isLabelModalOpen && (
                      <div className="absolute bottom-[calc(100%+8px)] left-0 z-30">
                        <LabelModal
                          labels={labels}
                          onSelectLabel={handleSelectLabel}
                          onCreateLabel={handleCreateLabel}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Frame>
            </div>
          </Overlay>,
          document.body,
        )}

      {isScheduleOpen && (
        <RepeatScheduleBottomSheet
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          repeat={repeat}
          onStartDateChange={(date) => {
            setStartDate(date);
            setHasScheduleChanged(true);
          }}
          onEndDateChange={(date) => {
            setEndDate(date);
            setHasScheduleChanged(true);
          }}
          onStartTimeChange={(value) => setStartTime(formatTime(value))}
          onEndTimeChange={(value) => setEndTime(formatTime(value))}
          onRepeatChange={(nextRepeat) => {
            setRepeat(nextRepeat);
            setHasScheduleChanged(true);
          }}
          onClose={handleScheduleClose}
        />
      )}
    </>
  );
}

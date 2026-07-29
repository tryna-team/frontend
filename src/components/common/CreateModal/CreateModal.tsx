import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

import { addDays, format, isSameDay, isToday, isValid, parseISO } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import Checklist, { type ChecklistItemData } from '@/components/common/Checklist/Checklist';
import LabelModal, { type LabelItemData } from '@/components/common/LabelModal/LabelModal';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import { RepeatScheduleBottomSheet, type RepeatOption } from '@/features/event/components/create';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial';
import { useEventCreationStore } from '@/stores';
import type { ActionItemType, RecommendationCandidate } from '@/stores/types';

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
  // TIMED_ACTION의 실제 날짜를 ISO 형식으로 전달한다.
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

const PARSING_DEBOUNCE_DELAY = 300;
const RECOMMENDATION_DEBOUNCE_DELAY = 1000;
const MOCK_RECOMMENDATION_RESPONSE_DELAY = 4000;

const formatTime = ({ meridiem, hour, minute }: TimePickerValue) =>
  `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;

const formatTriggerDate = (date: Date) => (isToday(date) ? '오늘' : format(date, 'M.d'));

const parseMockDateText = (input: string) => {
  if (input.includes('모레')) {
    return format(addDays(new Date(), 2), 'MM.dd');
  }

  if (input.includes('내일')) {
    return format(addDays(new Date(), 1), 'MM.dd');
  }

  return input.includes('오늘') ? '오늘' : null;
};

const formatChecklistDate = (date: string | null | undefined, fallbackDate: Date) => {
  const parsedDate = date ? parseISO(date) : fallbackDate;

  return format(isValid(parsedDate) ? parsedDate : fallbackDate, 'MM. dd.');
};

// 비시간형은 당일, 시간형은 실제 날짜를 사용한다.
const createMockRecommendationCandidates = (scheduleDate: Date): RecommendationCandidate[] => [
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
];

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
  const inputRef = useRef<HTMLInputElement>(null);
  const revisionRef = useRef(0);
  const keepKeyboardOpenRef = useRef(true);
  const isScheduleOpeningRef = useRef(false);
  const isKeyboardNavigationRef = useRef(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [parsedDateText, setParsedDateText] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => initialScheduleDate ?? new Date());
  const [endDate, setEndDate] = useState(() => initialScheduleDate ?? new Date());
  const [startTime, setStartTime] = useState('9:41 AM');
  const [endTime, setEndTime] = useState('9:41 AM');
  const [repeat, setRepeat] = useState<RepeatOption>('매주');
  const [hasScheduleChanged, setHasScheduleChanged] = useState(false);
  const recommendationCandidates = useEventCreationStore((state) => state.recommendationCandidates);
  const setRecommendationCandidates = useEventCreationStore(
    (state) => state.setRecommendationCandidates,
  );
  const toggleCandidateSelected = useEventCreationStore((state) => state.toggleCandidateSelected);

  const trimmedInput = inputValue.trim();
  const isRecommendMode = mode === 'recommend' || hasRecommended;
  const recommendationKeyword = keyword || trimmedInput;
  const recommendationMessage = message || '에 필요한 체크리스트를 추천했어요.';

  const initialDateText = initialScheduleDate ? format(initialScheduleDate, 'MM.dd') : '오늘';
  const propCalendarText =
    calendarStatus.type === 'default'
      ? `${initialDateText} · 반복 없음`
      : `${calendarStatus.text}마다`;
  const selectedDateText = isSameDay(startDate, endDate)
    ? formatTriggerDate(startDate)
    : `${formatTriggerDate(startDate)}~${format(endDate, 'M.d')}`;
  const calendarText = hasScheduleChanged
    ? `${selectedDateText} · ${repeat}`
    : parsedDateText
      ? `${parsedDateText} · 반복 없음`
      : propCalendarText;

  // 입력 변경 0.3초 후 날짜 키워드를 mock 파싱한다.
  useEffect(() => {
    if (!trimmedInput) {
      return;
    }

    const revision = revisionRef.current;
    const timerId = window.setTimeout(() => {
      if (revision === revisionRef.current) {
        setParsedDateText(parseMockDateText(trimmedInput));
      }
    }, PARSING_DEBOUNCE_DELAY);

    return () => window.clearTimeout(timerId);
  }, [trimmedInput]);

  // recommend 전에는 마지막 입력 1초 후 추천 요청을 시작한다.
  useEffect(() => {
    if (mode === 'recommend' || hasRecommended || !trimmedInput) {
      return;
    }

    const revision = revisionRef.current;
    let responseTimerId: number | undefined;

    const debounceTimerId = window.setTimeout(() => {
      setIsRecommendationLoading(true);

      responseTimerId = window.setTimeout(() => {
        if (revision !== revisionRef.current) {
          return;
        }

        setRecommendationCandidates(createMockRecommendationCandidates(startDate));
        setHasRecommended(true);
        setIsRecommendationLoading(false);
      }, MOCK_RECOMMENDATION_RESPONSE_DELAY);
    }, RECOMMENDATION_DEBOUNCE_DELAY);

    return () => {
      window.clearTimeout(debounceTimerId);

      if (responseTimerId !== undefined) {
        window.clearTimeout(responseTimerId);
      }
    };
  }, [hasRecommended, mode, setRecommendationCandidates, startDate, trimmedInput]);

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
    // 입력이 바뀌면 이전 응답을 무효화하고 로딩을 다시 시작한다.
    revisionRef.current += 1;
    setIsRecommendationLoading(false);

    if (!value.trim()) {
      setParsedDateText(null);
    }

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
      {/* default 상태의 dim 배경을 누르면 생성 모달을 닫는다. */}
      <Overlay className="flex items-end justify-center" onClick={onClose}>
        <Frame
          className="!items-start !overflow-visible max-w-[385px] gap-0.5 p-3"
          aria-labelledby={titleId}
        >
          <h2 id={titleId} className="sr-only">
            일정 생성
          </h2>

          <div className="flex w-full flex-col" aria-busy={isRecommendationLoading || undefined}>
            {isRecommendationLoading && <CreateModalSkeleton />}

            {isRecommendMode && (
              <>
                <div className="flex w-full items-center justify-between px-1 py-2">
                  <p className="min-w-0 text-text-additional default-body-medium">
                    <span className="bg-gradient-to-l from-[#29C878] to-[#32E089] bg-clip-text text-transparent default-body-strong-medium">
                      {recommendationKeyword}
                    </span>

                    {recommendationMessage}
                  </p>
                </div>

                {/* 체크리스트 터치가 input 포커스를 가져가지 않게 한다. */}
                <div onPointerDown={(event) => event.preventDefault()}>
                  <Checklist
                    items={renderedChecklistItems}
                    radioVariant="create"
                    onLeadingClick={handleChecklistClick}
                  />
                </div>
              </>
            )}

            {/* 모드가 바뀌어도 같은 input을 유지해 모바일 키보드를 보존한다. */}
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

                    <img src={COLOR_ICON[labelStatus.color]} alt="" className="block shrink-0" />
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
      </Overlay>

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

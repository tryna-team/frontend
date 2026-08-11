import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { format } from 'date-fns';

import { eventService } from '@/apis/services/eventService';
import { queryClient } from '@/apis/queryClient';
import Button from '@/components/common/Buttons/Button';
import Checklist, { type ChecklistItemData } from '@/components/common/Checklist/Checklist';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import {
  ActionItemScheduleBottomSheet,
  RepeatScheduleBottomSheet,
  type RepeatOption,
} from '@/features/event/components/create';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useEventCreationStore } from '@/stores';

import {
  ADD_CHECKLIST_ITEM_ID,
  COLOR_ICON,
} from './constants';
import {
  formatChecklistDate,
  formatTime,
  getCurrentTime,
} from './utils/dateTime';
import CreateModalSkeleton from './CreateModalSkeleton';
import { buildCreateEventRequest, getTimedActionDates } from './utils/submit';
import type { CreateModalProps } from './types';
import { useCreateModalFocus } from './hooks/useFocus';
import { useCreateModalLabels } from './hooks/useLabels';
import { useCreateModalParsing } from './hooks/useParsing';
import { useCreateModalRecommendations } from './hooks/useRecommendations';
import { useRecommendationEdit } from './hooks/useRecommendationEdit';
import { useCreateModalScheduleText } from './hooks/useScheduleText';
import { useCreateModalViewport } from './hooks/useViewport';

// 직접 추가 항목에 사용하는 임시 전용 ID
// 실제 체크리스트 ID와 겹치지 않도록 접두사를 사용
const createManualCandidateId = () =>
  `manual-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  }`;

const createFallbackTempEventId = () =>
  `fallback-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  }`;


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
  const inputRevisionRef = useRef(0);
  const createAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
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
  const [hasInputInteractionStarted, setHasInputInteractionStarted] = useState(false);
  const { visualViewportRect, appFrameRect } = useCreateModalViewport();
  const isRecommendationLoading = useEventCreationStore((state) => state.isLoadingRecommendations);
  const recommendationCandidates = useEventCreationStore((state) => state.recommendationCandidates);
  const parsedCandidate = useEventCreationStore((state) => state.parsedCandidate);
  const setRawInput = useEventCreationStore((state) => state.setRawInput);
  const toggleCandidateSelected = useEventCreationStore((state) => state.toggleCandidateSelected);
  const editCandidate = useEventCreationStore((state) => state.editCandidate);
  const addManualCandidate = useEventCreationStore((state) => state.addManualCandidate);
  const resetCreation = useEventCreationStore((state) => state.reset);
  const {
    isLabelModalOpen,
    setIsLabelModalOpen,
    selectedLabelId,
    selectableLabels,
    selectedLabel,
    handleSelectLabel,
    handleCreateLabel,
  } = useCreateModalLabels({
    labels,
    labelStatus,
    pendingSelectedLabelId,
    isSaving,
    onSelectLabel,
    onCreateLabel,
  });

  const trimmedInput = inputValue.trim();
  const {
    hasRecommended,
    recommendedTitle,
    isRecommendationUnavailable,
    hasRecommendationResponse,
    hasRecommendedRef,
    handleRecommendationInputChange,
    hideRecommendationUnavailable,
  } = useCreateModalRecommendations({
    mode,
    inputValue,
    trimmedInput,
    inputRevisionRef,
    startDate,
    createFallbackTempEventId,
  });
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

  const { calendarText } = useCreateModalScheduleText({
    calendarStatus,
    initialScheduleDate,
    startDate,
    endDate,
    startTime,
    endTime,
    repeat,
    parsedCandidate,
    hasScheduleChanged,
    hasStartTimeChanged,
    hasEndTimeChanged,
    hasEndDateChanged,
    hasRepeatChanged,
  });
  useCreateModalParsing({
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
  });

  const handleCloseRequest = useCallback(() => {
    if (trimmedInput && !isSaving) {
      setIsExitConfirmOpen(true);
      return;
    }

    resetCreation();
    onClose?.();
  }, [isSaving, onClose, resetCreation, trimmedInput]);

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
  }, [handleCloseRequest, isLabelModalOpen, setIsLabelModalOpen]);

  const {
    keepKeyboardOpenRef,
    isScheduleOpeningRef,
    handleInputBlur,
    handleInputKeyDown,
  } = useCreateModalFocus({
    dialogRef,
    inputRef,
    labelButtonRef,
    isExitConfirmOpen,
    isLabelModalOpen,
    isScheduleOpen,
    setIsLabelModalOpen,
    handleCloseRequest,
    handleExitConfirmClose,
  });

  const {
    recommendationEditDraft,
    handleOpenRecommendationEdit,
    handleChangeRecommendationEdit,
    handleSaveRecommendationEdit,
  } = useRecommendationEdit({
    isSaving,
    startDate,
    editCandidate,
  });

  const handleExitConfirm = () => {
    // 확인한 경우에만 작성 중인 입력과 생성 후보를 삭제한다.
    onInputChange?.('');
    resetCreation();
    setIsExitConfirmOpen(false);
    onClose?.();
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      createAbortControllerRef.current?.abort();
      resetCreation();
    };
  }, [resetCreation]);

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
      hideRecommendationUnavailable();
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

  const handleInputChange = (value: string) => {
    if (isSaving) {
      return;
    }

    if (value) {
      setHasInputInteractionStarted(true);
    }

    // revision을 올려 이전 파싱·추천 응답을 무효화한다.
    inputRevisionRef.current += 1;
    handleRecommendationInputChange();
    setRawInput(value);
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

  const handleCreate = async () => {
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
          onChange={handleChangeRecommendationEdit}
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

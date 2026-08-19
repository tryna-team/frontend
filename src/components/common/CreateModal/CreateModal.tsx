import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { format, parseISO } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import Checklist from '@/components/common/Checklist/Checklist';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import {
  ActionItemScheduleBottomSheet,
  RepeatScheduleBottomSheet,
  type RepeatOption,
} from '@/features/event/components/create';
import { useEventCreationStore } from '@/stores';

import { COLOR_ICON } from './constants';
import {
  formatTime,
  getCurrentTime,
  getNextHourWindow,
  detectRepeatOptionFromText,
} from './utils/dateTime';
import CreateModalSkeleton from './CreateModalSkeleton';
import type { CreateModalProps } from './types';
import { useCreateEventSubmit } from './hooks/useCreateEventSubmit';
import { useCreateModalFocus } from './hooks/useFocus';
import { useCreateModalLabels } from './hooks/useLabels';
import { useCreateModalParsing } from './hooks/useParsing';
import { useRecommendationChecklistItems } from './hooks/useRecommendationChecklistItems';
import { useCreateModalRecommendations } from './hooks/useRecommendations';
import { useRecommendationEdit } from './hooks/useRecommendationEdit';
import { useCreateModalScheduleText } from './hooks/useScheduleText';
import { useCreateModalViewport } from './hooks/useViewport';

// 서버 tempEventId가 없을 때 작성 세션에서 재사용하는 임시 ID
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
  isLabelCreateOpen = false,
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
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  // 기본 시간 윈도우를 상태에서 관리해 자정 넘김 시 날짜도 적용할 수 있도록 한다
  const defaultScheduleWindow = useState(() => getNextHourWindow())[0];
  const [startDate, setStartDate] = useState(() =>
    initialScheduleDate ? new Date(initialScheduleDate) : parseISO(defaultScheduleWindow.startDate),
  );
  const [endDate, setEndDate] = useState(() =>
    initialScheduleDate ? new Date(initialScheduleDate) : parseISO(defaultScheduleWindow.endDate),
  );
  // 진입 경로의 날짜를 C103 파싱 기준일로 고정한다.
  const [parseSelectedDate] = useState(() =>
    format(initialScheduleDate ?? new Date(), 'yyyy-MM-dd'),
  );
  const [startTime, setStartTime] = useState(defaultScheduleWindow.startTime);
  const [endTime, setEndTime] = useState(defaultScheduleWindow.endTime);
  const [isScheduleAllDay, setIsScheduleAllDay] = useState(false);
  const [scheduleOpenedAtTime, setScheduleOpenedAtTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatOption>('반복 없음');
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

  // 입력 텍스트에서 반복 옵션을 추론한다. 키워드가 지워지면 자동으로 null이 되어 추론이 해제된다.
  const inferredRepeat = useMemo(() => detectRepeatOptionFromText(trimmedInput), [trimmedInput]);
  // 사용자가 명시적으로 선택한 repeat을 추론된 값보다 우선한다
  const effectiveRepeat = repeat !== '반복 없음' ? repeat : (inferredRepeat ?? '반복 없음');
  const effectiveHasRepeatChanged =
    repeat !== '반복 없음' ? hasRepeatChanged : inferredRepeat !== null;

  const { calendarText } = useCreateModalScheduleText({
    calendarStatus,
    initialScheduleDate,
    startDate,
    endDate,
    startTime,
    endTime,
    repeat: effectiveRepeat,
    parsedCandidate,
    hasScheduleChanged,
    hasStartTimeChanged,
    hasEndTimeChanged,
    hasEndDateChanged,
    hasRepeatChanged: effectiveHasRepeatChanged,
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

  const focusInputAfterPaint = useCallback(() => {
    // 모바일 브라우저가 포커스된 input을 보이게 하려고 문서를 스크롤하지 않도록 지연 포커스한다.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    });
  }, []);

  const handleExitConfirmClose = useCallback(() => {
    setIsExitConfirmOpen(false);

    focusInputAfterPaint();
  }, [focusInputAfterPaint]);

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

  const { keepKeyboardOpenRef, isScheduleOpeningRef, handleInputBlur, handleInputKeyDown } =
    useCreateModalFocus({
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
    endDate,
    editCandidate,
  });

  useEffect(() => {
    if (isScheduleOpen || recommendationEditDraft || isLabelCreateOpen) {
      return;
    }

    focusInputAfterPaint();
  }, [focusInputAfterPaint, isLabelCreateOpen, isScheduleOpen, recommendationEditDraft]);

  const { renderedChecklistItems, directAddChecklistItem, handleChecklistClick } =
    useRecommendationChecklistItems({
      checklistItems,
      recommendationCandidates,
      startDate,
      isSaving,
      hideRecommendationUnavailable,
      addManualCandidate,
      editCandidate,
      toggleCandidateSelected,
      handleOpenRecommendationEdit,
      onAddChecklist,
      onToggleChecklist,
    });

  const { handleCreate } = useCreateEventSubmit({
    trimmedInput,
    selectedLabelId,
    startDate,
    endDate,
    startTime,
    endTime,
    hasStartTimeChanged,
    hasEndTimeChanged,
    hasEndDateChanged,
    hasRepeatChanged: effectiveHasRepeatChanged,
    repeat: effectiveRepeat,
    parsedCandidate,
    recommendationCandidates,
    inputRevisionRef,
    isSaving,
    setIsSaving,
    resetCreation,
    onCreate,
    isScheduleAllDay,
  });

  const handleExitConfirm = () => {
    // 확인한 경우에만 작성 중인 입력과 생성 후보를 삭제한다.
    onInputChange?.('');
    resetCreation();
    setIsExitConfirmOpen(false);
    onClose?.();
  };

  // 항목이 늘어나면 모달이 위로 확장되고, 남은 공간부터 목록만 스크롤한다.
  const checklistScrollMaxHeight = Math.max(52, Math.min(312, visualViewportRect.height - 188));
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

    const nextHourWindow = getNextHourWindow();

    // 시작/종료 시간이 아직 설정되지 않았으면 기본 윈도우로 채운다
    if (!startTime) {
      setStartTime(nextHourWindow.startTime);
      // 자정을 넘을 때만 startDate를 변경
      if (nextHourWindow.crossesMidnight) {
        setStartDate(parseISO(nextHourWindow.startDate));
      }
    }

    if (!endTime) {
      setEndTime(nextHourWindow.endTime);
      // 자정을 넘을 때 endDate를 다음 날로 설정
      if (nextHourWindow.crossesMidnight) {
        setEndDate(parseISO(nextHourWindow.endDate));
      }
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

    focusInputAfterPaint();
  };

  return (
    <>
      {/* 하위 일정 설정 화면이나 라벨 생성 시트가 열리면 생성 모달을 숨긴다.
          라벨 시트는 앱 프레임 안에서 렌더링되는데 이 모달은 body로 포털돼서,
          숨기지 않으면 시트가 모달 뒤에 가려져 입력이 안 되는 것처럼 보인다. */}
      {!isScheduleOpen &&
        !recommendationEditDraft &&
        !isLabelCreateOpen &&
        createPortal(
          <Overlay onClick={handleCreateOverlayClick}>
            {(hasInputInteractionStarted || isRecommendMode) && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute overflow-hidden"
                style={{
                  left: appFrameRect.left,
                  width: appFrameRect.width,
                  top: 0,
                  bottom: 0,
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
              <div className="flex w-full max-w-[385px] flex-col items-center">
                {isRecommendationUnavailable && (
                  <div
                    role="status"
                    aria-live="polite"
                    aria-label="제안을 불러오지 못했습니다. 다시 시도해주세요."
                    className="mb-[8px] flex w-[353px] items-center justify-center rounded-[24px] bg-white/40 px-[20px] py-[16px] shadow-[0_0_10px_rgba(0,0,0,0.08)] backdrop-blur-[2px]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p className="w-full text-text-additional default-body-medium">
                      제안을 불러오지 못했습니다. 다시 시도해주세요.
                    </p>
                  </div>
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
                          <span className="whitespace-nowrap">라벨 없음</span>
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
          date={recommendationEditDraft.date}
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
          isAllDay={isScheduleAllDay}
          onAllDayChange={setIsScheduleAllDay}
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

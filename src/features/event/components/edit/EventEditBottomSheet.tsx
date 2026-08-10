import { useState } from 'react';

import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import ActionRow from '@/components/common/ActionRow/ActionRow';
import { COLOR_ICON } from '@/components/common/ActionRow/ActionRow.constant';
import Button from '@/components/common/Buttons/Button';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import EventScheduleRow, {
  type RepeatOption,
} from '@/features/event/components/create/EventScheduleRow';
import RepeatScheduleBottomSheet from '@/features/event/components/create/RepeatScheduleBottomSheet';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial.types';
import QuickModal from '@/components/common/Popup/QuickModal';
import { eventDetailService } from '@/apis/services/eventDetailService';
import type { UpdateScope } from '@/apis/types/eventDetail';
import { queryKeys } from '@/hooks/queries/queryKeys';

import { ActionItemChecklistSection } from './ActionItemChecklistSection';
import type { ActionItemEditItem } from './ActionItemEditItem';

const CHEVRON_ICON = '/icon/chevron/left_xsmall.svg';

// EventEditBottomSheet가 다루는 수정 가능한 필드값.
export type EventEditFormValue = {
  title: string;
  description: string;
  isAllDay: boolean;
  startDate: Date;
  // 종료 날짜/시간이 없는 일정도 있어(EventDetailResponseData.endDate/endTime이 nullable)
  // null을 그대로 유지한다 — 시작값으로 대체하면 안 건드려도 PATCH에 가짜 종료값이 나간다.
  endDate: Date | null;
  startTime: string;
  endTime: string | null;
  repeat: RepeatOption;
  location: string;
  labelId: number | null;
};

type EventEditBottomSheetProps = {
  eventId: number | string;
  // 반복 일정이면 "완료" 시 적용 범위(updateScope)를 물어봐야 한다.
  isRecurring: boolean;
  initialValue: EventEditFormValue;
  actionItems: ActionItemEditItem[];
  labels: LabelItemData[];
  onClose: () => void;
  // 체크리스트 항목 완료 토글 — EventViewPage의 E106 mutation을 그대로 전달받아 쓴다.
  onToggleActionItem?: (id: number) => void;
};

const formatDate = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

// API(C107)는 24시간제 'HH:mm' 문자열을 받는다 — TimePickerValue를 바로 이 형식으로
// 변환해서 상태에 저장한다(화면 표시도 이 값을 그대로 씀 — DailyScheduleDetail 등
// 다른 화면도 서버가 내려준 24시간제 문자열을 그대로 보여주는 것과 동일한 방식).
const toApiTime = ({ meridiem, hour, minute }: TimePickerValue) => {
  const normalizedHour = hour % 12;
  const hour24 = meridiem === 'PM' ? normalizedHour + 12 : normalizedHour;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// 피그마 "이벤트 수정" 바텀시트(node 3303:37852 외 3개 상태 프레임) — 이벤트 뷰 헤더의
// "수정" 버튼으로 열린다. PATCH /events/{eventId}(C107)로 실제 저장한다.
export default function EventEditBottomSheet({
  eventId,
  isRecurring,
  initialValue,
  actionItems,
  labels,
  onClose,
  onToggleActionItem,
}: EventEditBottomSheetProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [isAllDay, setIsAllDay] = useState(initialValue.isAllDay);
  const [startDate, setStartDate] = useState(initialValue.startDate);
  const [endDate, setEndDate] = useState<Date | null>(initialValue.endDate);
  const [startTime, setStartTime] = useState(initialValue.startTime);
  const [endTime, setEndTime] = useState<string | null>(initialValue.endTime);
  const [repeat, setRepeat] = useState<RepeatOption>(initialValue.repeat);
  const [labelId, setLabelId] = useState<number | null>(initialValue.labelId);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isUpdateErrorOpen, setIsUpdateErrorOpen] = useState(false);

  const queryClient = useQueryClient();

  // C107 일정 수정 — PATCH /api/v1/events/{eventId}
  const updateMutation = useMutation({
    mutationFn: ({ updateScope, labelId: labelIdToSave }: { updateScope: UpdateScope; labelId: number }) =>
      eventDetailService.updateEvent(eventId, {
        eventTitle: title.trim(),
        // 설명/장소는 이 바텀시트에 입력 UI가 없어(피그마 기준) 원래 값을 그대로 보낸다.
        description: initialValue.description,
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: isAllDay ? null : startTime,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        endTime: isAllDay ? null : endTime,
        isAllDay,
        location: initialValue.location,
        labelId: labelIdToSave,
        // 반복 일정 중 "지금 보고 있던 이 회차"를 서버에 알려주는 값 — 삭제(C106)와
        // 동일한 패턴. 사용자가 시작일을 편집했더라도 어느 회차를 수정하는지 식별하는
        // 용도라 편집 전 원래 날짜(initialValue.startDate)를 보낸다.
        occurrenceDate: isRecurring ? format(initialValue.startDate, 'yyyy-MM-dd') : null,
        updateScope,
      }),
    onSuccess: () => {
      // 삭제 플로우와 동일하게 events.all을 무효화 — 홈/데일리 화면의 캘린더 목록
      // 캐시도 같이 갱신돼야 제목/시간 변경이 바로 반영된다.
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      // TODO: 응답의 requiresActionItemReview(체크리스트 항목 날짜를 서버가 자동으로
      // 못 맞춰서 사용자 확인이 필요한 경우 true)를 아직 처리하지 않는다. UX가 정해지면
      // 여기서 안내를 띄워야 한다 — memory: project_eventedit_requires_action_item_review.md
      onClose();
    },
    onError: () => {
      setIsUpdateErrorOpen(true);
    },
  });

  const selectedLabel = labels.find((label) => label.id === labelId) ?? null;

  const handleComplete = () => {
    // 라벨은 PATCH 요청에서 선택 필드(null/생략 시 기존 라벨 유지)라 서버가 필수로
    // 요구하진 않지만, 이 폼엔 라벨을 완전히 비우는 UI가 없어 null이 될 일이 실질적으로
    // 없다 — 타입 좁히기를 위해 방어적으로 확인한다.
    if (labelId === null) {
      return;
    }

    if (isRecurring) {
      setIsScopeModalOpen(true);
      return;
    }

    updateMutation.mutate({ updateScope: 'SINGLE', labelId });
  };

  const openSchedule = () => {
    setIsLabelModalOpen(false);
    setIsScheduleOpen(true);
  };

  return (
    <>
      {/* TODO(미해결): ContentBox 카드들이 피그마(node 3303:37852)만큼 내용을 깔끔하게
          못 감싸는 문제가 아직 남아있음 — variant/shadow 수정, "상세" 섹션 제거,
          체크리스트 title 제거 등을 거쳤는데도 완전히 해결되지 않았다. 폰트 크기/줄높이가
          tds 토큰과 실제 렌더링 사이에서 다르게 나와 내용이 박스를 밀어내는 것으로
          추정되나 확정은 아님 — ContentBox/EventScheduleRow/Button 등에서 쓰는 텍스트
          클래스(default-body-large 등)의 실제 계산값과 피그마 스펙을 다시 대조해서
          원인을 좁혀야 한다. */}
      <Overlay className="flex items-end justify-center" onClick={onClose}>
        <Frame className="h-[92dvh] gap-6 overflow-y-auto p-4 scrollbar-none">
          <Header
            variant="modal"
            title="일정 수정"
            leading={{ type: 'icon', onClick: onClose }}
            trailing={{ type: 'text', text: '완료', onClick: handleComplete, disabled: updateMutation.isPending }}
          />

          <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
            <Input
              value={title}
              onChange={setTitle}
              onClear={() => setTitle('')}
              ariaLabel="일정 제목"
              placeholder="제목을 입력해주세요"
            />
          </div>

          <ContentBox title="일정">
            {/* 공용 Toggle이 필요한 자리 — ActionRow의 accessory type="toggle"(RowAccessory,
                /icon/toggle/on·off.svg)을 그대로 재사용한다. */}
            <ActionRow
              leading={{ type: 'text', text: '하루 종일' }}
              accessory={{
                type: 'toggle',
                checked: isAllDay,
                ariaLabel: '하루 종일',
                onClick: () => setIsAllDay((value) => !value),
              }}
            />

            <div className="flex w-full flex-col">
              <div className="box-content flex h-[52px] w-full items-center justify-between bg-transparent pr-padding-xsmall pl-padding-medium">
                <span className="shrink-0 text-text-default default-body-large">시작</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="MediumDefaultFit" onClick={openSchedule}>
                    {formatDate(startDate)}
                  </Button>
                  {!isAllDay && (
                    <Button variant="MediumDefaultFit" onClick={openSchedule}>
                      {startTime}
                    </Button>
                  )}
                </div>
              </div>

              <div className="box-content flex h-[52px] w-full items-center justify-between bg-transparent pr-padding-xsmall pl-padding-medium">
                <span className="shrink-0 text-text-default default-body-large">종료</span>
                <div className="flex shrink-0 items-center gap-2">
                  {/* endDate가 null(종료 없음)이면 시작 날짜를 표시용으로만 보여준다 —
                      실제로 선택하기 전까진 state는 계속 null로 남는다. */}
                  <Button variant="MediumDefaultFit" onClick={openSchedule}>
                    {formatDate(endDate ?? startDate)}
                  </Button>
                  {!isAllDay && endTime && (
                    <Button variant="MediumDefaultFit" onClick={openSchedule}>
                      {endTime}
                    </Button>
                  )}
                </div>
              </div>

              {/* PATCH 요청(EventUpdateRequest)에 반복 관련 필드가 없음(라이브 스웨거로
                  확인) — 반복은 생성 시점(C104)에만 정할 수 있고 수정으로는 바꿀 수 없어
                  onRepeatClick을 연결하지 않고 읽기 전용으로 표시만 한다. 반복이 아닌
                  일정은 행 자체를 숨긴다(안 그러면 매핑 기본값 때문에 "매일"로 잘못 보임). */}
              {isRecurring && <EventScheduleRow type="repeat" leading="반복" repeat={repeat} />}
            </div>
          </ContentBox>

          <ContentBox title="라벨">
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsLabelModalOpen((isOpen) => !isOpen)}
                className="flex h-[52px] w-full items-center justify-between border-0 bg-transparent p-0 text-left"
              >
                <span className="text-text-default default-body-large">라벨</span>

                <span className="flex items-center gap-2">
                  {selectedLabel ? (
                    <span className="flex items-center gap-2 text-text-default default-body-large">
                      <img
                        src={COLOR_ICON[selectedLabel.color]}
                        alt=""
                        className="block size-5 shrink-0"
                      />
                      <span className="max-w-30 truncate">{selectedLabel.label}</span>
                    </span>
                  ) : (
                    <span className="text-text-default default-body-large">없음</span>
                  )}

                  <span className="flex flex-col items-center" aria-hidden="true">
                    <img src={CHEVRON_ICON} alt="" className="block size-3 rotate-90 opacity-30" />
                    <img
                      src={CHEVRON_ICON}
                      alt=""
                      className="-mt-0.5 block size-3 -rotate-90 opacity-30"
                    />
                  </span>
                </span>
              </button>

              {isLabelModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsLabelModalOpen(false);
                    }}
                  />
                  <div className="absolute right-0 bottom-full z-30">
                    <LabelModal
                      labels={labels}
                      onSelectLabel={(id) => {
                        setLabelId(id);
                        setIsLabelModalOpen(false);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </ContentBox>

          {/* title을 빈 문자열로 두면 ContentBox 상단에 빈 라벨 줄이 살짝 남는다 —
              ContentBox의 title이 필수 prop이라 생기는 사소한 여백, 필요하면 추후
              ContentBox 쪽에 title을 선택값으로 바꿔서 없앨 수 있다. */}
          <ContentBox title="" variant="bottom">
            <ActionItemChecklistSection
              eventDate={format(startDate, 'yyyy-MM-dd')}
              items={actionItems}
              onToggleItem={onToggleActionItem}
            />
          </ContentBox>
        </Frame>
      </Overlay>

      {isScheduleOpen && (
        <RepeatScheduleBottomSheet
          startDate={startDate}
          // RepeatScheduleBottomSheet는 endDate/endTime을 필수(non-null)로 받아서,
          // 아직 안 정한 상태(null)일 땐 시작값을 임시로 보여준다 — 사용자가 실제로
          // 종료를 건드려야만 onEndDateChange/onEndTimeChange가 호출돼 state가 null에서
          // 벗어난다.
          endDate={endDate ?? startDate}
          startTime={startTime}
          endTime={endTime ?? startTime}
          repeat={repeat}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={(value) => setStartTime(toApiTime(value))}
          onEndTimeChange={(value) => setEndTime(toApiTime(value))}
          onRepeatChange={setRepeat}
          onClose={() => setIsScheduleOpen(false)}
          showBackgroundVideo={false}
        />
      )}

      {isUpdateErrorOpen && (
        <ToastPopup
          GuideText="일정을 수정하지 못했어요."
          DetailText="잠시 후 다시 시도해주세요."
          onClose={() => setIsUpdateErrorOpen(false)}
        />
      )}

      {isScopeModalOpen && labelId !== null && (
        <QuickModal
          message="일정을 수정하시겠습니까?"
          primaryAction={{
            text: '이 일정만 수정',
            onClick: () => {
              setIsScopeModalOpen(false);
              updateMutation.mutate({ updateScope: 'SINGLE', labelId });
            },
          }}
          secondaryAction={{
            text: '이 일정과 이후 일정 모두 수정',
            onClick: () => {
              setIsScopeModalOpen(false);
              updateMutation.mutate({ updateScope: 'THIS_AND_FUTURE', labelId });
            },
          }}
          onClose={() => setIsScopeModalOpen(false)}
        />
      )}
    </>
  );
}

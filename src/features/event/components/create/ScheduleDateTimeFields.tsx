import { useState, type ReactNode } from 'react';

import { format, isAfter, isBefore, isSameDay } from 'date-fns';

import ActionRow from '@/components/common/ActionRow/ActionRow';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import type { RepeatType } from '@/components/common/LabelModal/LabelItem';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';

import DatePickerCalendar from './DatePickerCalendar';
import EventScheduleRow, { type RepeatOption } from './EventScheduleRow';
import { REPEAT_OPTION } from './repeatOption';
import TimePickerDial, { type TimePickerValue } from './TimePickerDial';

type ActiveDateField = 'start' | 'end';
type ActiveTimeField = 'start' | 'end';

// 공용 ContentBox를 일정 아이템 박스로 사용한다. title을 안 넘기면(모든 사용처가
// title="") ContentBox가 제목 줄 자체를 렌더링하지 않으므로, 예전에 그 빈 줄을
// 숨기던 [&>div>div:first-child]:hidden은 더 이상 필요 없다 — 지금 두면 오히려
// 실제 콘텐츠(첫 번째이자 유일한 자식)를 가려버린다.
const CONTENT_BOX_LAYOUT_CLASS =
  'w-full [&>div]:overflow-hidden [&>div>div:last-child]:items-center [&>div>div:last-child]:px-0';

export type ScheduleDateTimeFieldsProps = {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  repeat: RepeatOption;
  isAllDay?: boolean;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onAllDayChange?: (isAllDay: boolean) => void;
  onStartTimeClick?: () => void;
  onEndTimeClick?: () => void;
  onStartTimeChange?: (value: TimePickerValue) => void;
  onEndTimeChange?: (value: TimePickerValue) => void;
  onRepeatClick?: () => void;
  onRepeatChange?: (repeat: RepeatOption) => void;
  // 반복 행 아래에 함께 배치할 내용(예: RepeatScheduleBottomSheet의 "닫기" 버튼).
  // 이 컴포넌트는 시트/인라인 여부를 모르므로, 시트 전용 요소는 호출부가 이 슬롯으로 넘긴다.
  footer?: ReactNode;
  // 반복 ContentBox의 그림자 여부. 기본값 'bottom'(그림자 없음)은 RepeatScheduleBottomSheet처럼
  // 반복 박스가 시트의 가장 마지막 콘텐츠일 때의 피그마 스펙(node 3330:39062, 그림자 없음).
  // EventEditBottomSheet처럼 반복 박스 뒤에 라벨/체크리스트 등 콘텐츠가 더 이어지는 경우엔
  // 'default'를 넘겨야 한다 — 피그마 실제 이벤트 수정 모달(node 3303:37943)의 반복 박스는
  // 다른 중간 박스들과 동일하게 그림자가 있다.
  repeatBoxVariant?: 'default' | 'bottom';
};

const formatScheduleDate = (date: Date) => format(date, 'yyyy. MM. dd.');

// EventDetailResponseData.startTime은 타입상 non-null이지만, 하루종일 일정은 실제로
// null이 내려온다(EventEditBottomSheet의 handleAllDayChange가 이미 이 케이스를
// 전제로 짜여 있음). 이 컴포넌트가 시트로만 열릴 땐 사용자가 시작/종료 버튼을 눌러야만
// 실행돼 잘 드러나지 않았지만, 화면에 항상 펼쳐두면 마운트 즉시 실행되므로 방어가 필요하다.
const parseTimePickerValue = (time: string | null | undefined): TimePickerValue => {
  if (!time) {
    return { meridiem: 'AM', hour: 9, minute: 0 };
  }

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (match) {
    return {
      meridiem: match[3].toUpperCase() === 'PM' ? 'PM' : 'AM',
      hour: Number(match[1]),
      minute: Math.min(55, Math.round(Number(match[2]) / 5) * 5),
    };
  }

  // 1차 파싱의 24시간제 응답을 시간 피커 형식으로 변환한다.
  const apiTime = time.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?Z?$/);

  if (apiTime) {
    const hour24 = Number(apiTime[1]);
    const minute = Number(apiTime[2]);
    const second = apiTime[3] === undefined ? 0 : Number(apiTime[3]);

    if (hour24 <= 23 && minute <= 59 && second <= 59) {
      return {
        meridiem: hour24 >= 12 ? 'PM' : 'AM',
        hour: hour24 % 12 || 12,
        minute: Math.min(55, Math.round(minute / 5) * 5),
      };
    }
  }

  return { meridiem: 'AM', hour: 9, minute: 0 };
};

const toMinutes = ({ meridiem, hour, minute }: TimePickerValue) => {
  const hour24 = (hour % 12) + (meridiem === 'PM' ? 12 : 0);

  return hour24 * 60 + minute;
};

// 하루종일/시작·종료(캘린더 포함)/반복 행 — RepeatScheduleBottomSheet(일정 생성 모달의
// 바텀시트)와 EventEditBottomSheet(이벤트 수정) 양쪽에서 그대로 재사용하는 콘텐츠.
// 시트 껍데기(Overlay/Frame/배경비디오/Escape 닫기/"닫기" 버튼)는 이 컴포넌트가 모르는
// 채로 두고, 필요한 호출부(RepeatScheduleBottomSheet)가 footer로 주입한다.
export default function ScheduleDateTimeFields({
  startDate,
  endDate,
  startTime,
  endTime,
  repeat,
  isAllDay = false,
  onStartDateChange,
  onEndDateChange,
  onAllDayChange,
  onStartTimeClick,
  onEndTimeClick,
  onStartTimeChange,
  onEndTimeChange,
  onRepeatClick,
  onRepeatChange,
  footer,
  repeatBoxVariant = 'bottom',
}: ScheduleDateTimeFieldsProps) {
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>('start');
  const [activeTimeField, setActiveTimeField] = useState<ActiveTimeField | null>(null);
  const [startTimeValue, setStartTimeValue] = useState<TimePickerValue>(() =>
    parseTimePickerValue(startTime),
  );
  const [endTimeValue, setEndTimeValue] = useState<TimePickerValue>(() =>
    parseTimePickerValue(endTime),
  );
  const [isRepeatOpen, setIsRepeatOpen] = useState(false);
  const [selectedRepeat, setSelectedRepeat] = useState<RepeatOption>(repeat);

  const activeDate = activeDateField === 'start' ? startDate : endDate;

  const alignEndTimeToStart = () => {
    if (toMinutes(endTimeValue) < toMinutes(startTimeValue)) {
      setEndTimeValue(startTimeValue);
      onEndTimeChange?.(startTimeValue);
    }
  };

  const alignStartTimeToEnd = () => {
    if (toMinutes(endTimeValue) < toMinutes(startTimeValue)) {
      setStartTimeValue(endTimeValue);
      onStartTimeChange?.(endTimeValue);
    }
  };

  // 날짜 순서를 유지하며 활성 일정의 날짜를 변경한다.
  const handleDateChange = (date: Date) => {
    if (activeDateField === 'start') {
      onStartDateChange?.(date);

      if (isAfter(date, endDate)) {
        onEndDateChange?.(date);
        alignEndTimeToStart();
      } else if (isSameDay(date, endDate)) {
        alignEndTimeToStart();
      }

      return;
    }

    onEndDateChange?.(date);

    if (isBefore(date, startDate)) {
      onStartDateChange?.(date);
      alignStartTimeToEnd();
    } else if (isSameDay(date, startDate)) {
      alignStartTimeToEnd();
    }
  };

  const handleTimeClick = (field: ActiveTimeField) => {
    setActiveDateField(field);
    setIsRepeatOpen(false);
    setActiveTimeField((currentField) => (currentField === field ? null : field));

    if (field === 'start') {
      onStartTimeClick?.();
      return;
    }

    onEndTimeClick?.();
  };

  const handleToggleAllDay = () => {
    setActiveTimeField(null);
    onAllDayChange?.(!isAllDay);
  };

  const handleStartTimeChange = (value: TimePickerValue) => {
    setStartTimeValue(value);
    onStartTimeChange?.(value);

    // 같은 날짜에서 시작 시간이 늦어지면 종료 시간을 함께 맞춘다.
    if (isSameDay(startDate, endDate) && toMinutes(value) > toMinutes(endTimeValue)) {
      setEndTimeValue(value);
      onEndTimeChange?.(value);
    }
  };

  const handleEndTimeChange = (value: TimePickerValue) => {
    setEndTimeValue(value);
    onEndTimeChange?.(value);

    // 같은 날짜에서 종료 시간이 빨라지면 시작 시간을 함께 맞춘다.
    if (isSameDay(startDate, endDate) && toMinutes(value) < toMinutes(startTimeValue)) {
      setStartTimeValue(value);
      onStartTimeChange?.(value);
    }
  };

  const handleRepeatClick = () => {
    setActiveTimeField(null);
    setIsRepeatOpen((isOpen) => !isOpen);
    onRepeatClick?.();
  };

  const handleRepeatSelect = (repeatType: RepeatType) => {
    const nextRepeat = REPEAT_OPTION[repeatType];

    setSelectedRepeat(nextRepeat);
    setIsRepeatOpen(false);
    onRepeatChange?.(nextRepeat);
  };

  // 시간 다이얼이 열려있을 때 바깥(날짜/시간 모달 안쪽이든, 그 바깥 dim 영역이든 전부)을
  // 누르면 다이얼만 닫히고, 날짜/시간 모달 자체는 안 닫혀야 한다. 화면 전체를 덮는
  // backdrop을 다이얼 바로 아래(z-20)에 깔아서, 다이얼(z-30) 외의 모든 클릭을 여기서
  // 가로챈다 — 값은 이미 onChange로 매 조작마다 즉시 반영되고 있어서 닫기만 하면 된다.
  const startRow = (
    <div className="relative">
      <EventScheduleRow
        type="date-time"
        leading="시작"
        date={formatScheduleDate(startDate)}
        time={startTime}
        hideTime={isAllDay}
        onDateClick={() => {
          setActiveDateField('start');
          setActiveTimeField(null);
          setIsRepeatOpen(false);
        }}
        onTimeClick={() => handleTimeClick('start')}
      />

      {activeTimeField === 'start' && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(event) => {
              event.stopPropagation();
              setActiveTimeField(null);
            }}
          />
          <div className="absolute top-[calc(100%+8px)] right-padding-xsmall z-50">
            <TimePickerDial value={startTimeValue} onChange={handleStartTimeChange} />
          </div>
        </>
      )}
    </div>
  );

  const endRow = (
    <div className="relative">
      <EventScheduleRow
        type="date-time"
        leading="종료"
        date={formatScheduleDate(endDate)}
        time={endTime}
        hideTime={isAllDay}
        onDateClick={() => {
          setActiveDateField('end');
          setActiveTimeField(null);
          setIsRepeatOpen(false);
        }}
        onTimeClick={() => handleTimeClick('end')}
      />

      {activeTimeField === 'end' && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(event) => {
              event.stopPropagation();
              setActiveTimeField(null);
            }}
          />
          <div className="absolute top-[calc(100%+8px)] right-padding-xsmall z-50">
            <TimePickerDial value={endTimeValue} onChange={handleEndTimeChange} />
          </div>
        </>
      )}
    </div>
  );

  const calendar = (
    <DatePickerCalendar
      key={activeDateField}
      value={activeDate}
      defaultMonth={activeDate}
      onChange={handleDateChange}
    />
  );

  const allDayRow = (
    <div className="box-content w-[329px] pr-padding-xsmall pl-padding-medium [&>div]:px-0">
      <ActionRow
        // 피그마 이 화면(시작/종료/반복과 같은 그룹)은 전부 Default/Body/Large(17px)를
        // 쓴다 — ActionRow 기본값(default-body-medium, 15px)이 아니라 이 화면 전용으로 확대.
        leading={{ type: 'text', text: '하루종일', size: 'large' }}
        accessory={{
          type: 'toggle',
          checked: isAllDay,
          ariaLabel: '하루종일',
          onClick: handleToggleAllDay,
        }}
      />
    </div>
  );

  // 반복 행과 footer(호출부가 넘긴 내용, 예: 닫기 버튼)를 하나의 하단 아이템으로 구성한다.
  // gap-10/pb-4는 반복 행과 footer(예: "닫기" 버튼) 사이 여백이라 footer가 있을 때만
  // 적용한다 — footer가 없는 EventEditBottomSheet에서도 항상 붙어 있어서 반복 박스만
  // 다른 박스(종료/라벨)보다 아래쪽 여백이 불필요하게 커 보이던 원인이었다(피그마
  // node 3303:37943은 반복 박스에 이런 여분 padding이 없음).
  const repeatAndFooterLayout = (
    <div className={`flex w-full flex-col items-center ${footer ? 'gap-10 pb-4' : ''}`}>
      <div className="relative">
        <EventScheduleRow
          type="repeat"
          leading="반복"
          repeat={selectedRepeat}
          onRepeatClick={handleRepeatClick}
        />

        {isRepeatOpen && (
          <>
            {/* 시간 다이얼과 동일하게, 바깥 클릭은 이 팝업만 닫는다(전체 모달은 유지). */}
            <div
              className="fixed inset-0 z-20"
              onClick={(event) => {
                event.stopPropagation();
                setIsRepeatOpen(false);
              }}
            />
            <div className="absolute right-padding-xsmall bottom-[47px] z-30">
              <LabelModal
                type="repeat"
                selectedDate={startDate}
                onSelectRepeat={handleRepeatSelect}
              />
            </div>
          </>
        )}
      </div>

      {footer}
    </div>
  );

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {/* 선택 중인 날짜 행 가까이에 캘린더를 표시한다. */}
        {activeDateField === 'start' ? (
          <>
            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">{allDayRow}</ContentBox>
            </div>

            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">
                {startRow}
                <div className="h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                <div className="pb-3">{calendar}</div>
              </ContentBox>
            </div>

            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">{endRow}</ContentBox>
            </div>
          </>
        ) : (
          <>
            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">{allDayRow}</ContentBox>
            </div>

            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">{startRow}</ContentBox>
            </div>

            <div className={CONTENT_BOX_LAYOUT_CLASS}>
              <ContentBox title="">
                {endRow}
                <div className="h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                <div className="pb-3">{calendar}</div>
              </ContentBox>
            </div>
          </>
        )}
      </div>

      {/* 반복 행(과 footer)을 하단 영역에 함께 배치한다. */}
      <div className={`${CONTENT_BOX_LAYOUT_CLASS} [&>div]:!overflow-visible`}>
        <ContentBox title="" variant={repeatBoxVariant}>
          {repeatAndFooterLayout}
        </ContentBox>
      </div>
    </>
  );
}

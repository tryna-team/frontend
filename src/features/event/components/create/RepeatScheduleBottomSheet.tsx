import { useEffect, useId, useState } from 'react';

import { format, isAfter, isBefore, isSameDay } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import type { RepeatType } from '@/components/common/LabelModal/LabelItem';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';

import DatePickerCalendar from './DatePickerCalendar';
import EventScheduleRow, { type RepeatOption } from './EventScheduleRow';
import TimePickerDial, { type TimePickerValue } from './TimePickerDial';

type ActiveDateField = 'start' | 'end';
type ActiveTimeField = 'start' | 'end';

// 공용 ContentBox를 일정 아이템 박스로 사용한다.
const CONTENT_BOX_LAYOUT_CLASS =
  'w-full [&>div]:overflow-hidden [&>div>div:first-child]:hidden [&>div>div:last-child]:items-center [&>div>div:last-child]:px-0';

export type RepeatScheduleBottomSheetProps = {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  repeat: RepeatOption;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onStartTimeClick?: () => void;
  onEndTimeClick?: () => void;
  onStartTimeChange?: (value: TimePickerValue) => void;
  onEndTimeChange?: (value: TimePickerValue) => void;
  onRepeatClick?: () => void;
  onRepeatChange?: (repeat: RepeatOption) => void;
  onClose: () => void;
};

const formatScheduleDate = (date: Date) => format(date, 'yyyy. MM. dd.');

const parseTimePickerValue = (time: string): TimePickerValue => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return { meridiem: 'AM', hour: 9, minute: 0 };
  }

  return {
    meridiem: match[3].toUpperCase() === 'PM' ? 'PM' : 'AM',
    hour: Number(match[1]),
    minute: Math.min(55, Math.round(Number(match[2]) / 5) * 5),
  };
};

const toMinutes = ({ meridiem, hour, minute }: TimePickerValue) => {
  const hour24 = (hour % 12) + (meridiem === 'PM' ? 12 : 0);

  return hour24 * 60 + minute;
};

const REPEAT_OPTION: Record<RepeatType, RepeatOption> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
};

export default function RepeatScheduleBottomSheet({
  startDate,
  endDate,
  startTime,
  endTime,
  repeat,
  onStartDateChange,
  onEndDateChange,
  onStartTimeClick,
  onEndTimeClick,
  onStartTimeChange,
  onEndTimeChange,
  onRepeatClick,
  onRepeatChange,
  onClose,
}: RepeatScheduleBottomSheetProps) {
  const titleId = useId();
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

  // Escape 입력으로 바텀시트를 닫는다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const startRow = (
    <div className="relative">
      <EventScheduleRow
        type="date-time"
        leading="시작"
        date={formatScheduleDate(startDate)}
        time={startTime}
        onDateClick={() => {
          setActiveDateField('start');
          setActiveTimeField(null);
          setIsRepeatOpen(false);
        }}
        onTimeClick={() => handleTimeClick('start')}
      />

      {activeTimeField === 'start' && (
        <div className="absolute right-padding-xsmall bottom-full z-20">
          <TimePickerDial value={startTimeValue} onChange={handleStartTimeChange} />
        </div>
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
        onDateClick={() => {
          setActiveDateField('end');
          setActiveTimeField(null);
          setIsRepeatOpen(false);
        }}
        onTimeClick={() => handleTimeClick('end')}
      />

      {activeTimeField === 'end' && (
        <div className="absolute right-padding-xsmall bottom-full z-20">
          <TimePickerDial value={endTimeValue} onChange={handleEndTimeChange} />
        </div>
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

  // 반복 행과 닫기 버튼을 하나의 하단 아이템으로 구성한다.
  const repeatAndCloseLayout = (
    <div className="flex w-full flex-col items-center gap-10 pb-4">
      <div className="relative">
        <EventScheduleRow
          type="repeat"
          leading="반복"
          repeat={selectedRepeat}
          onRepeatClick={handleRepeatClick}
        />

        {isRepeatOpen && (
          <div className="absolute right-padding-xsmall bottom-[47px] z-30">
            <LabelModal
              type="repeat"
              selectedDate={startDate}
              onSelectRepeat={handleRepeatSelect}
            />
          </div>
        )}
      </div>

      <Button variant="LargeDefaultFull" onClick={onClose}>
        닫기
      </Button>
    </div>
  );

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      <Frame className="gap-2 !bg-white px-4 pt-5 pb-1" aria-labelledby={titleId}>
        <h2 id={titleId} className="sr-only">
          반복 일정 설정
        </h2>

        <div className="flex w-full flex-col gap-2">
          {/* 선택 중인 날짜 행 가까이에 캘린더를 표시한다. */}
          {activeDateField === 'start' ? (
            <>
              <div className={CONTENT_BOX_LAYOUT_CLASS}>
                <ContentBox title="">
                  {calendar}
                  <div className="mt-3 h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                  {startRow}
                </ContentBox>
              </div>

              <div className={CONTENT_BOX_LAYOUT_CLASS}>
                <ContentBox title="">{endRow}</ContentBox>
              </div>
            </>
          ) : (
            <>
              <div className={CONTENT_BOX_LAYOUT_CLASS}>
                <ContentBox title="">{startRow}</ContentBox>
              </div>

              <div className={CONTENT_BOX_LAYOUT_CLASS}>
                <ContentBox title="">
                  {calendar}
                  <div className="mt-3 h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                  {endRow}
                </ContentBox>
              </div>
            </>
          )}
        </div>

        {/* 반복 행과 닫기 버튼을 하단 영역에 함께 배치한다. */}
        <div className={`${CONTENT_BOX_LAYOUT_CLASS} [&>div]:!overflow-visible`}>
          <ContentBox title="" variant="bottom">
            {repeatAndCloseLayout}
          </ContentBox>
        </div>
      </Frame>
    </Overlay>
  );
}

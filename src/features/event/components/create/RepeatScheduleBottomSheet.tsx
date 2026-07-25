import {
  useEffect,
  useId,
  useState,
} from 'react';

import { format } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';

import DatePickerCalendar from './DatePickerCalendar';
import EventScheduleRow, {
  type RepeatOption,
} from './EventScheduleRow';

type ActiveDateField = 'start' | 'end';

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
  onRepeatClick?: () => void;
  onClose: () => void;
};

const formatScheduleDate = (date: Date) =>
  format(date, 'yyyy. MM. dd.');

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
  onRepeatClick,
  onClose,
}: RepeatScheduleBottomSheetProps) {
  const titleId = useId();
  const [activeDateField, setActiveDateField] =
    useState<ActiveDateField>('start');

  const activeDate =
    activeDateField === 'start'
      ? startDate
      : endDate;

  // Escape 입력으로 바텀시트를 닫는다.
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () =>
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
  }, [onClose]);

  // 활성화된 일정의 날짜를 변경한다.
  const handleDateChange = (date: Date) => {
    if (activeDateField === 'start') {
      onStartDateChange?.(date);
      return;
    }

    onEndDateChange?.(date);
  };

  const startRow = (
    <EventScheduleRow
      type="date-time"
      leading="시작"
      date={formatScheduleDate(startDate)}
      time={startTime}
      onDateClick={() =>
        setActiveDateField('start')
      }
      onTimeClick={onStartTimeClick}
    />
  );

  const endRow = (
    <EventScheduleRow
      type="date-time"
      leading="종료"
      date={formatScheduleDate(endDate)}
      time={endTime}
      onDateClick={() =>
        setActiveDateField('end')
      }
      onTimeClick={onEndTimeClick}
    />
  );

  const calendar = (
    <DatePickerCalendar
      key={activeDateField}
      value={activeDate}
      defaultMonth={activeDate}
      onChange={handleDateChange}
    />
  );

  return (
    <Overlay
      className="flex items-end justify-center"
      onClick={onClose}
    >
      <Frame
        className="gap-2 !bg-[#f8f8f9] px-4 pt-5 pb-1"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="sr-only">
          반복 일정 설정
        </h2>

        <div
          className="flex w-full flex-col gap-2"
        >
          {/* 선택 중인 날짜 행 가까이에 캘린더를 표시한다. */}
          {activeDateField === 'start' ? (
            <>
              <section className="flex w-full flex-col items-center overflow-hidden rounded-medium bg-background-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                {calendar}
                <div className="mt-3 h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                {startRow}
              </section>

              <section className="flex w-full justify-center rounded-medium bg-background-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                {endRow}
              </section>
            </>
          ) : (
            <>
              <section className="flex w-full justify-center rounded-medium bg-background-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                {startRow}
              </section>

              <section className="flex w-full flex-col items-center overflow-hidden rounded-medium bg-background-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                {calendar}
                <div className="mt-3 h-px w-[calc(100%-32px)] bg-grey-opacity-100" />
                {endRow}
              </section>
            </>
          )}

        </div>

        {/* 반복 행과 닫기 버튼을 하단 영역에 함께 배치한다. */}
        <section className="flex w-full flex-col items-center gap-10 rounded-medium bg-background-white pt-3 pb-5">
          <EventScheduleRow
            type="repeat"
            leading="반복"
            repeat={repeat}
            onRepeatClick={onRepeatClick}
          />

          <Button
            variant="LargeDefaultFull"
            onClick={onClose}
          >
            닫기
          </Button>
        </section>
      </Frame>
    </Overlay>
  );
}

import { useId, useState } from 'react';

import { format, isAfter, isBefore } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';

import DatePickerCalendar from './DatePickerCalendar';
import EventScheduleRow from './EventScheduleRow';
import TimePickerDial, { type TimePickerValue } from './TimePickerDial';

type ActiveField = 'start' | 'end';

const CONTENT_BOX_LAYOUT_CLASS =
  'w-full [&>div]:overflow-hidden [&>div>div:first-child]:hidden [&>div>div:last-child]:items-center [&>div>div:last-child]:px-0';

export type ActionItemScheduleValue = {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
};

export type ActionItemScheduleBottomSheetProps = ActionItemScheduleValue & {
  title: string;
  parentEventStartDate: Date;
  parentEventEndDate: Date;
  onChange: (value: ActionItemScheduleValue) => void;
  onClose: () => void;
};

const formatDate = (date: Date) => format(date, 'yyyy. MM. dd.');

const parseTime = (time: string): TimePickerValue => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      meridiem: match[3].toUpperCase() === 'PM' ? 'PM' : 'AM',
      hour: Number(match[1]),
      minute: Math.min(55, Math.round(Number(match[2]) / 5) * 5),
    };
  }

  return { meridiem: 'AM', hour: 9, minute: 0 };
};

const formatTime = ({ meridiem, hour, minute }: TimePickerValue) =>
  `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;

export default function ActionItemScheduleBottomSheet({
  title,
  parentEventStartDate,
  parentEventEndDate,
  startDate,
  endDate,
  startTime,
  endTime,
  onChange,
  onClose,
}: ActionItemScheduleBottomSheetProps) {
  const titleId = useId();
  const [activeDateField, setActiveDateField] = useState<ActiveField>('start');
  const [activeTimeField, setActiveTimeField] = useState<ActiveField | null>(null);
  const [startTimeValue, setStartTimeValue] = useState(() => parseTime(startTime));
  const [endTimeValue, setEndTimeValue] = useState(() => parseTime(endTime));
  const activeDate = activeDateField === 'start' ? startDate : endDate;

  const handleDateChange = (date: Date) => {
    if (activeDateField === 'start') {
      onChange({
        startDate: date,
        endDate: isAfter(date, endDate) ? date : endDate,
        startTime,
        endTime,
      });
      return;
    }

    onChange({
      startDate: isBefore(date, startDate) ? date : startDate,
      endDate: date,
      startTime,
      endTime,
    });
  };

  const calendar = (
    <DatePickerCalendar
      key={activeDateField}
      value={activeDate}
      defaultMonth={activeDate}
      referenceDate={parentEventStartDate}
      referenceEndDate={parentEventEndDate}
      showCurrentDay={false}
      onChange={handleDateChange}
    />
  );

  const renderRow = (field: ActiveField) => {
    const isStart = field === 'start';
    const date = isStart ? startDate : endDate;
    const time = isStart ? startTime : endTime;
    const pickerValue = isStart ? startTimeValue : endTimeValue;

    return (
      <div className="relative">
        <EventScheduleRow
          type="date-time"
          leading={isStart ? '시작' : '종료'}
          date={formatDate(date)}
          time={time}
          onDateClick={() => {
            setActiveDateField(field);
            setActiveTimeField(null);
          }}
          onTimeClick={() => {
            setActiveDateField(field);
            setActiveTimeField((current) => (current === field ? null : field));
          }}
        />

        {activeTimeField === field && (
          <div className="absolute right-padding-xsmall bottom-full z-20">
            <TimePickerDial
              value={pickerValue}
              onChange={(value) => {
                const nextTime = formatTime(value);
                if (isStart) setStartTimeValue(value);
                else setEndTimeValue(value);
                onChange({
                  startDate,
                  endDate,
                  startTime: isStart ? nextTime : startTime,
                  endTime: isStart ? endTime : nextTime,
                });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const startRow = renderRow('start');
  const endRow = renderRow('end');

  return (
    <Overlay className="flex items-end justify-center">
      <video
        src="/BlendDimVideo.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <Frame className="relative z-10 gap-4 !bg-white px-4 pt-5 pb-1" aria-labelledby={titleId}>
        <p
          id={titleId}
          className="w-full px-padding-medium text-text-additional default-body-small"
        >
          {title}
        </p>

        <div className="flex w-full flex-col gap-2">
          {activeDateField === 'start' ? (
            <>
              <div className={CONTENT_BOX_LAYOUT_CLASS}>
                <ContentBox title="">
                  {calendar}
                  <div className="mt-3 h-px w-[calc(100%_-_32px)] bg-grey-opacity-100" />
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
                  <div className="mt-3 h-px w-[calc(100%_-_32px)] bg-grey-opacity-100" />
                  {endRow}
                </ContentBox>
              </div>
            </>
          )}
        </div>

        <div className={`${CONTENT_BOX_LAYOUT_CLASS} [&>div]:!overflow-visible`}>
          <ContentBox title="" variant="bottom">
            <div className="w-full pb-4">
              <Button variant="LargeDefaultFull" onClick={onClose}>
                닫기
              </Button>
            </div>
          </ContentBox>
        </div>
      </Frame>
    </Overlay>
  );
}

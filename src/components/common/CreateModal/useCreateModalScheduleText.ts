import { format, isSameDay } from 'date-fns';

import type { ParsedEventCandidate } from '@/stores/types';

import { formatTriggerDate, formatTriggerTime } from './CreateModal.dateTime';
import type { CalendarStatus } from './CreateModal.types';
import type { RepeatOption } from '@/features/event/components/create';

type UseCreateModalScheduleTextParams = {
  calendarStatus: CalendarStatus;
  initialScheduleDate?: Date;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  repeat: RepeatOption;
  parsedCandidate: ParsedEventCandidate | null;
  hasScheduleChanged: boolean;
  hasStartTimeChanged: boolean;
  hasEndTimeChanged: boolean;
  hasEndDateChanged: boolean;
  hasRepeatChanged: boolean;
};

export const useCreateModalScheduleText = ({
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
}: UseCreateModalScheduleTextParams) => {
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

  return {
    hasDateRange,
    selectedDateText,
    selectedTimeText,
    selectedScheduleText,
    calendarText,
  };
};

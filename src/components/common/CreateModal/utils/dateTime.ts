import { format, isSameDay, isToday, isValid, parseISO } from 'date-fns';

import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial';

export const normalizeTime = (time: string) => {
  const apiTime = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);

  if (apiTime) {
    return `${apiTime[1]}:${apiTime[2]}:${apiTime[3] ?? '00'}`;
  }

  const displayTime = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(time);

  if (!displayTime) {
    return null;
  }

  const hour = (Number(displayTime[1]) % 12) + (displayTime[3] === 'PM' ? 12 : 0);

  return `${String(hour).padStart(2, '0')}:${displayTime[2]}:00`;
};

export const formatActionItemDisplayTime = (
  displayDate: string | null | undefined,
  displayTime: string | null | undefined,
) => {
  if (!displayDate || !displayTime) {
    return null;
  }

  const time = displayTime.includes('T') ? displayTime.split('T')[1] : displayTime;
  const normalizedTime = normalizeTime(time);

  return normalizedTime ? `${displayDate}T${normalizedTime}` : null;
};

export const formatTime = ({ meridiem, hour, minute }: TimePickerValue) =>
  `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;

export const detectRepeatOptionFromText = (input: string) => {
  const normalizedText = input.replace(/\s+/g, ' ').trim();

  if (!normalizedText) {
    return null;
  }

  if (normalizedText.includes('매년')) {
    return '매년' as const;
  }

  if (normalizedText.includes('매월')) {
    return '매월' as const;
  }

  if (normalizedText.includes('매주')) {
    return '매주' as const;
  }

  if (normalizedText.includes('매일')) {
    return '매일' as const;
  }

  return null;
};

export const getNextHourWindow = (sourceDate: Date = new Date()) => {
  const startDate = new Date(sourceDate);

  if (startDate.getMinutes() > 0 || startDate.getSeconds() > 0 || startDate.getMilliseconds() > 0) {
    startDate.setHours(startDate.getHours() + 1);
  }

  startDate.setMinutes(0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  // 자정을 넘을 때 날짜 정보 포함
  const crossesMidnight = endDate.getDate() !== startDate.getDate();

  return {
    startTime: formatTime({
      meridiem: startDate.getHours() >= 12 ? 'PM' : 'AM',
      hour: startDate.getHours() % 12 || 12,
      minute: 0,
    }),
    startDate: startDate.toLocaleDateString('sv-SE'),
    endTime: formatTime({
      meridiem: endDate.getHours() >= 12 ? 'PM' : 'AM',
      hour: endDate.getHours() % 12 || 12,
      minute: 0,
    }),
    endDate: endDate.toLocaleDateString('sv-SE'),
    crossesMidnight,
  };
};

export const formatTriggerDate = (date: Date) => (isToday(date) ? '오늘' : format(date, 'MM.dd'));

export const formatTriggerTime = (time: string) => normalizeTime(time)?.slice(0, 5) ?? time;

export const getCurrentTime = () => format(new Date(), 'h:mm a').toUpperCase();

export const formatApiTimeForPicker = (time: string | null | undefined) => {
  const normalizedTime = time ? normalizeTime(time) : null;

  if (!normalizedTime) {
    return getCurrentTime();
  }

  const [hourText, minute] = normalizedTime.split(':');
  const hour = Number(hourText);
  const meridiem = hour >= 12 ? 'PM' : 'AM';

  return `${hour % 12 || 12}:${minute} ${meridiem}`;
};

export const formatChecklistDate = (
  date: string | null | undefined,
  endDate: string | null | undefined,
  fallbackDate: Date,
) => {
  const parsedDate = date ? parseISO(date) : fallbackDate;
  const validStartDate = isValid(parsedDate) ? parsedDate : fallbackDate;
  const parsedEndDate = endDate ? parseISO(endDate) : null;
  const startText = format(validStartDate, 'MM. dd.');

  return parsedEndDate && isValid(parsedEndDate) && !isSameDay(validStartDate, parsedEndDate)
    ? `${startText} - ${format(parsedEndDate, 'MM. dd.')}`
    : startText;
};

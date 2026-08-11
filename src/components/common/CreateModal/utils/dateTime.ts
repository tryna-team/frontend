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

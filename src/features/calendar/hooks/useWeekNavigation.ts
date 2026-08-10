import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { HorizontalPagerDirection } from './useHorizontalPager';

// 선택 날짜를 기준으로 주간 이동을 처리하기 위해 필요한 값
interface UseWeekNavigationOptions {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export interface WeekItem {
  dateString: string;
  dayOfWeek: number;
  dayNumber: number;
  isSelected: boolean;
}

export interface WeekPanel {
  position: HorizontalPagerDirection | 'current';
  key: string;
  items: WeekItem[];
}

// UTC 변환으로 날짜가 밀리지 않도록 로컬 기준 YYYY-MM-DD 문자열로 변환
function toDateString(date: Date) {
  return date.toLocaleDateString('sv-SE');
}

// 선택 날짜가 포함된 주의 일요일부터 토요일까지 7개 날짜를 계산
function getWeekDates(dateString: string) {
  const selectedDate = new Date(`${dateString}T00:00:00`);
  const sunday = new Date(selectedDate);
  sunday.setDate(selectedDate.getDate() - selectedDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return date;
  });
}

function addDays(dateString: string, offsetDays: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return toDateString(date);
}

function createWeekPanel(
  anchorDate: string,
  selectedDate: string,
  position: WeekPanel['position'],
): WeekPanel {
  const items = getWeekDates(anchorDate).map((date) => {
    const dateString = toDateString(date);

    return {
      dateString,
      dayOfWeek: date.getDay(),
      dayNumber: date.getDate(),
      isSelected: dateString === selectedDate,
    };
  });

  return {
    position,
    key: items[0].dateString,
    items,
  };
}

// 선택 날짜를 기준으로 이전·현재·다음 주의 날짜와 주 이동 동작을 제공
function useWeekNavigation({ selectedDate, onSelectDate }: UseWeekNavigationOptions) {
  const selectedDateRef = useRef(selectedDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const weekPanels = useMemo(
    () => [
      createWeekPanel(addDays(selectedDate, -7), selectedDate, 'previous'),
      createWeekPanel(selectedDate, selectedDate, 'current'),
      createWeekPanel(addDays(selectedDate, 7), selectedDate, 'next'),
    ],
    [selectedDate],
  );

  const weekKey = weekPanels[1].key;

  // 날짜 클릭과 주 이동 모두 동일한 선택 로직을 사용
  const selectWeekDate = useCallback(
    (dateString: string) => {
      selectedDateRef.current = dateString;
      onSelectDate(dateString);
    },
    [onSelectDate],
  );

  const goToWeek = useCallback(
    (offsetDays: number) => {
      const nextDate = new Date(`${selectedDateRef.current}T00:00:00`);
      nextDate.setDate(nextDate.getDate() + offsetDays);

      const nextDateString = toDateString(nextDate);
      selectWeekDate(nextDateString);
    },
    [selectWeekDate],
  );

  const moveWeek = useCallback(
    (direction: HorizontalPagerDirection) => {
      goToWeek(direction === 'next' ? 7 : -7);
    },
    [goToWeek],
  );

  return {
    weekKey,
    weekPanels,
    selectWeekDate,
    moveWeek,
  };
}

export default useWeekNavigation;

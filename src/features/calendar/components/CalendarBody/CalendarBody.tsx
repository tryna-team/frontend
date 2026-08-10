import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import useCalendarScroll from '@/features/calendar/hooks/useCalendarScroll';
import useVisibleCalendarItem from '@/features/calendar/hooks/useVisibleCalendarItem';

import CalendarMonth from './CalendarMonth';
import type { CalendarMonthEvent } from './CalendarMonth';
import useMonthWindow from './hooks/useMonthWindow';

import './CalendarBody.css';

export type CalendarEventsByMonth = Partial<Record<string, CalendarMonthEvent[]>>;

export interface CalendarDateScrollRequest {
  date: string;
  requestId: number;
}

interface CalendarBodyProps {
  initialYear: number;
  /** 1부터 12까지의 월 */
  initialMonth: number;
  visibleYear: number;
  /** 1부터 12까지의 월 */
  visibleMonth: number;
  eventsByMonth?: CalendarEventsByMonth;
  selectedDate?: string | null;
  scrollToDateRequest?: CalendarDateScrollRequest | null;
  onSelectDate: (date: string) => void;
  onLongPressDate?: (date: string) => void;
  onVisibleMonthChange: (year: number, month: number) => void;
  onScrollToDateComplete?: (requestId: number) => void;
}

const getMonthKey = (element: HTMLElement) => element.dataset.calendarMonth ?? null;

function CalendarBody({
  initialYear,
  initialMonth,
  visibleYear,
  visibleMonth,
  eventsByMonth,
  selectedDate = null,
  scrollToDateRequest = null,
  onSelectDate,
  onLongPressDate,
  onVisibleMonthChange,
  onScrollToDateComplete,
}: CalendarBodyProps) {
  const { months, prependMonth, appendMonth, resetMonthWindow } = useMonthWindow({
    initialYear,
    initialMonth,
  });
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const hasPositionedInitialMonthRef = useRef(false);
  const isProgrammaticPositioningRef = useRef(false);
  const handledScrollRequestIdRef = useRef<number | null>(null);
  const initialMonthKey = `${initialYear}-${String(initialMonth).padStart(2, '0')}`;
  const visibleMonthKey = `${visibleYear}-${String(visibleMonth).padStart(2, '0')}`;
  const isScrollFeatureEnabled = isScrollEnabled && !scrollToDateRequest;
  const { viewportRef, contentRef } = useCalendarScroll({
    onReachStart: prependMonth,
    onReachEnd: appendMonth,
    enabled: isScrollFeatureEnabled,
  });
  const handleVisibleItemChange = useCallback(
    (itemKey: string) => {
      if (isProgrammaticPositioningRef.current) {
        return;
      }

      const [year, month] = itemKey.split('-').map(Number);

      if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
        onVisibleMonthChange(year, month);
      }
    },
    [onVisibleMonthChange],
  );

  useVisibleCalendarItem({
    viewportRef,
    contentRef,
    currentItemKey: visibleMonthKey,
    getItemKey: getMonthKey,
    onVisibleItemChange: handleVisibleItemChange,
    enabled: isScrollFeatureEnabled,
  });

  useLayoutEffect(() => {
    if (hasPositionedInitialMonthRef.current || scrollToDateRequest) {
      return;
    }

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const initialMonthElement = content?.querySelector<HTMLElement>(
      `[data-calendar-month="${initialMonthKey}"]`,
    );

    if (!viewport || !initialMonthElement) {
      return;
    }

    const positionInitialMonth = () => {
      const offset =
        initialMonthElement.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
      viewport.scrollTop += offset;
    };

    positionInitialMonth();

    const frameId = window.requestAnimationFrame(() => {
      positionInitialMonth();
      hasPositionedInitialMonthRef.current = true;
      setIsScrollEnabled(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [contentRef, initialMonthKey, months, scrollToDateRequest, viewportRef]);

  useLayoutEffect(() => {
    const request = scrollToDateRequest;

    if (!request || handledScrollRequestIdRef.current === request.requestId) {
      return;
    }

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(request.date);
    const targetYear = Number(dateMatch?.[1]);
    const targetMonth = Number(dateMatch?.[2]);

    if (!dateMatch || !Number.isInteger(targetYear) || targetMonth < 1 || targetMonth > 12) {
      const frameId = window.requestAnimationFrame(() => {
        handledScrollRequestIdRef.current = request.requestId;
        isProgrammaticPositioningRef.current = false;
        setIsScrollEnabled(true);
        onScrollToDateComplete?.(request.requestId);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    isProgrammaticPositioningRef.current = true;

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const targetMonthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const targetMonthElement = content?.querySelector<HTMLElement>(
      `[data-calendar-month="${targetMonthKey}"]`,
    );

    if (!viewport || !content) {
      return;
    }

    if (!targetMonthElement) {
      const frameId = window.requestAnimationFrame(() => {
        resetMonthWindow(targetYear, targetMonth);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    const positionTargetDate = () => {
      const dateElement = targetMonthElement.querySelector<HTMLElement>(
        `[data-date="${request.date}"]`,
      );
      const targetElement = dateElement ?? targetMonthElement;
      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const targetOffset = targetRect.top - viewportRect.top;
      const desiredOffset = dateElement
        ? Math.max(0, (viewport.clientHeight - targetRect.height) / 2)
        : 0;
      const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const nextScrollTop = viewport.scrollTop + targetOffset - desiredOffset;

      viewport.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
    };

    positionTargetDate();

    // FullCalendar가 내부 셀 크기를 확정한 다음 한 번 더 맞춘다.
    const frameId = window.requestAnimationFrame(() => {
      positionTargetDate();
      handledScrollRequestIdRef.current = request.requestId;
      hasPositionedInitialMonthRef.current = true;
      isProgrammaticPositioningRef.current = false;
      setIsScrollEnabled(true);
      onScrollToDateComplete?.(request.requestId);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    contentRef,
    months,
    onScrollToDateComplete,
    resetMonthWindow,
    scrollToDateRequest,
    viewportRef,
  ]);

  return (
    <div className="calendar-body-viewport" ref={viewportRef}>
      <section className="calendar-body" ref={contentRef} aria-label="월간 캘린더">
        {months.map(({ year, month, key }) => (
          <CalendarMonth
            key={key}
            year={year}
            month={month}
            events={eventsByMonth?.[key] ?? []}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onLongPressDate={onLongPressDate}
          />
        ))}
      </section>
    </div>
  );
}

export default CalendarBody;

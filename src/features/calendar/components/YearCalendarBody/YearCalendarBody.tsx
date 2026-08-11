import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import useCalendarScroll from '@/features/calendar/hooks/useCalendarScroll';
import useVisibleCalendarItem from '@/features/calendar/hooks/useVisibleCalendarItem';

import CalendarYear from './CalendarYear';
import useYearWindow, { isSupportedCalendarYear } from './hooks/useYearWindow';

import './YearCalendarBody.css';

export interface CalendarYearScrollRequest {
  year: number;
  date?: string;
  requestId: number;
}

interface YearCalendarBodyProps {
  initialYear: number;
  visibleYear: number;
  scrollToYearRequest?: CalendarYearScrollRequest | null;
  onVisibleYearChange: (year: number) => void;
  onSelectMonth: (year: number, month: number) => void;
  onScrollToYearComplete?: (requestId: number) => void;
}

const getYearKey = (element: HTMLElement) => element.dataset.calendarYear ?? null;

function YearCalendarBody({
  initialYear,
  visibleYear,
  scrollToYearRequest = null,
  onVisibleYearChange,
  onSelectMonth,
  onScrollToYearComplete,
}: YearCalendarBodyProps) {
  const { years, prependYear, appendYear, resetYearWindow } = useYearWindow({ initialYear });
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const hasPositionedInitialYearRef = useRef(false);
  const isProgrammaticPositioningRef = useRef(false);
  const handledScrollRequestIdRef = useRef<number | null>(null);
  const initialYearKey = String(initialYear);
  const visibleYearKey = String(visibleYear);
  const isScrollFeatureEnabled = isScrollEnabled && !scrollToYearRequest;
  // 공통 기본 임계값에서 다음 연도를 미리 준비해 모멘텀 스크롤이 끝에서 끊기지 않게 한다.
  const { viewportRef, contentRef } = useCalendarScroll({
    onReachStart: prependYear,
    onReachEnd: appendYear,
    enabled: isScrollFeatureEnabled,
  });

  const handleVisibleItemChange = useCallback(
    (itemKey: string) => {
      if (isProgrammaticPositioningRef.current) {
        return;
      }

      const year = Number(itemKey);

      if (Number.isInteger(year)) {
        onVisibleYearChange(year);
      }
    },
    [onVisibleYearChange],
  );

  useVisibleCalendarItem({
    viewportRef,
    contentRef,
    currentItemKey: visibleYearKey,
    getItemKey: getYearKey,
    onVisibleItemChange: handleVisibleItemChange,
    enabled: isScrollFeatureEnabled,
  });

  useLayoutEffect(() => {
    if (hasPositionedInitialYearRef.current || scrollToYearRequest) {
      return;
    }

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const initialYearElement = content?.querySelector<HTMLElement>(
      `[data-calendar-year="${initialYearKey}"]`,
    );

    if (!viewport || !initialYearElement) {
      return;
    }

    const positionInitialYear = () => {
      const offset =
        initialYearElement.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
      viewport.scrollTop += offset;
    };

    positionInitialYear();

    let settleFrameId: number | null = null;
    const layoutFrameId = window.requestAnimationFrame(() => {
      positionInitialYear();
      settleFrameId = window.requestAnimationFrame(() => {
        positionInitialYear();
        hasPositionedInitialYearRef.current = true;
        setIsScrollEnabled(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(layoutFrameId);

      if (settleFrameId !== null) {
        window.cancelAnimationFrame(settleFrameId);
      }
    };
  }, [contentRef, initialYearKey, scrollToYearRequest, viewportRef, years]);

  useLayoutEffect(() => {
    const request = scrollToYearRequest;

    if (!request || handledScrollRequestIdRef.current === request.requestId) {
      return;
    }

    if (!isSupportedCalendarYear(request.year)) {
      const frameId = window.requestAnimationFrame(() => {
        handledScrollRequestIdRef.current = request.requestId;
        isProgrammaticPositioningRef.current = false;
        setIsScrollEnabled(true);
        onScrollToYearComplete?.(request.requestId);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    isProgrammaticPositioningRef.current = true;

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const targetYearKey = String(request.year);
    const targetYearElement = content?.querySelector<HTMLElement>(
      `[data-calendar-year="${targetYearKey}"]`,
    );

    if (!viewport || !content) {
      return;
    }

    if (!targetYearElement) {
      const frameId = window.requestAnimationFrame(() => {
        resetYearWindow(request.year);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    const targetDateElement =
      typeof request.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(request.date) &&
      request.date.startsWith(`${targetYearKey.padStart(4, '0')}-`)
        ? targetYearElement.querySelector<HTMLElement>(`[data-date="${request.date}"]`)
        : null;

    const positionTarget = () => {
      const targetElement = targetDateElement ?? targetYearElement;
      const targetRect = targetElement.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const targetOffset = targetRect.top - viewportRect.top;
      const desiredOffset = targetDateElement
        ? Math.max(0, (viewport.clientHeight - targetRect.height) / 2)
        : 0;
      const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const nextScrollTop = viewport.scrollTop + targetOffset - desiredOffset;

      viewport.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
    };

    positionTarget();

    // FullCalendar가 열 수와 연간 그리드 높이를 확정하는 동안 위치를 두 번 더 맞춘다.
    let settleFrameId: number | null = null;
    const layoutFrameId = window.requestAnimationFrame(() => {
      positionTarget();
      settleFrameId = window.requestAnimationFrame(() => {
        positionTarget();
        handledScrollRequestIdRef.current = request.requestId;
        hasPositionedInitialYearRef.current = true;
        isProgrammaticPositioningRef.current = false;
        setIsScrollEnabled(true);
        onVisibleYearChange(request.year);
        onScrollToYearComplete?.(request.requestId);
      });
    });

    return () => {
      window.cancelAnimationFrame(layoutFrameId);

      if (settleFrameId !== null) {
        window.cancelAnimationFrame(settleFrameId);
      }
    };
  }, [
    contentRef,
    onScrollToYearComplete,
    onVisibleYearChange,
    resetYearWindow,
    scrollToYearRequest,
    viewportRef,
    years,
  ]);

  return (
    <div className="year-calendar-body-viewport" ref={viewportRef}>
      <section className="year-calendar-body" ref={contentRef} aria-label="연간 캘린더">
        {years.map(({ year, key }) => (
          <CalendarYear key={key} year={year} onSelectMonth={onSelectMonth} />
        ))}
      </section>
    </div>
  );
}

export default YearCalendarBody;

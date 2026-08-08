import { useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';

import { useCalendarStore } from '@/stores';

import './CalendarGrid.css';

interface CalendarEvent {
  title: string;
  /** 시작일 "yyyy-mm-dd" */
  start: string;
  /**
   * 종료일. FullCalendar 규칙상 배타적이라 실제 마지막 날의 다음 날을 넣는다.
   * 값이 있으면 날짜를 가로지르는 하나의 막대로 그려진다.
   */
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onLongPressDate?: (date: string) => void;
  onSearchClick?: () => void;
  onViewToggleClick?: () => void; // TODO: 실제로는 라벨(label_small.svg) 버튼 클릭 핸들러라 이름이 실제 동작과 안 맞음 — 추후 onLabelClick 등으로 정리 필요
  onSettingsClick?: () => void;
  onYearViewClick?: () => void;
  initialView?: string;
}

const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

// 스크롤로 월 전환을 트리거할 최소 이동 거리(px)
const SCROLL_TRANSITION_THRESHOLD_PX = 60;
// 드래그 종료 후 다음/이전 달로 밀려나는 애니메이션 시간(ms) — CSS transition과 반드시 동일해야 함
const TRANSITION_DURATION_MS = 250;
// 마우스 휠은 pointerup 같은 "종료" 이벤트가 없어서, 이 시간 동안 휠 입력이 없으면 드래그가 끝난 것으로 간주
const WHEEL_IDLE_MS = 150;

/** month는 1-based. FullCalendar dayGridMonth(fixedWeekCount=false)와 동일한 방식으로
 *  주 단위 날짜 배열을 만든다. prev/next 패널은 이 값으로 "숫자만" 미리 그려서 보여준다. */
function getMonthWeeks(year: number, month: number) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = 일요일
  const gridStart = new Date(year, month - 1, 1 - startOffset);

  const lastOfMonth = new Date(year, month, 0);
  const endOffset = 6 - lastOfMonth.getDay();
  const totalDays =
    Math.round(
      (new Date(year, month - 1, lastOfMonth.getDate() + endOffset).getTime() -
        gridStart.getTime()) /
        86400000,
    ) + 1;

  const todayStr = new Date().toLocaleDateString('sv-SE');

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return {
      label: d.getDate(),
      isCurrentMonth: d.getMonth() === month - 1,
      isToday: d.toLocaleDateString('sv-SE') === todayStr,
    };
  });

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/** 실제 이벤트 없이 날짜 숫자만 옅게 보여주는 미리보기 패널 (드래그 중에만 보임) */
function MonthPeekGrid({ year, month }: { year: number; month: number }) {
  const weeks = getMonthWeeks(year, month);

  return (
    <div className="calendar-peek-grid">
      {weeks.map((week, weekIndex) => (
        <div className="calendar-peek-week" key={weekIndex}>
          {week.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={[
                'calendar-peek-day',
                day.isCurrentMonth ? '' : 'is-outside',
                day.isToday ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {day.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CalendarGrid({
  events,
  selectedDate,
  onSelectDate,
  onLongPressDate,
  onSearchClick,
  onViewToggleClick,
  onSettingsClick,
  onYearViewClick,
  initialView = 'dayGridMonth',
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressedDateRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // ── 스크롤(터치 드래그 / 휠) 기반 월 전환용 ref ──────────────────────
  const rootRef = useRef<HTMLDivElement>(null); // 컴포넌트 최상위 (calendar-grid-root)
  const headerRef = useRef<HTMLDivElement>(null); // 상단 헤더 (연도/월 숫자 등)
  const viewportRef = useRef<HTMLDivElement>(null); // overflow: hidden 컨테이너
  const trackRef = useRef<HTMLDivElement>(null); // [prev][current][next] 를 담는 트랙
  const currentPanelRef = useRef<HTMLDivElement>(null); // 실제 FullCalendar가 들어있는 안쪽 wrapper (내부 스크롤용)
  const prevPanelElRef = useRef<HTMLDivElement>(null); // 이전 달 패널(peek) — 주 수에 맞는 칸 높이 계산용
  const currentPanelElRef = useRef<HTMLDivElement>(null); // 현재 달 패널(FullCalendar 바깥) — 주 수에 맞는 칸 높이 계산용
  const nextPanelElRef = useRef<HTMLDivElement>(null); // 다음 달 패널(peek) — 주 수에 맞는 칸 높이 계산용
  const panelHeightRef = useRef(0); // 패널 하나의 높이(px) — "화면에 실제로 남는 공간" 기준
  const scrollTouchStartYRef = useRef<number | null>(null); // 드래그 시작 y좌표
  const wheelAccumulatedYRef = useRef(0);
  const wheelIdleTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null); // 제자리 복귀(snapback) 타이머 — 새 드래그 시작 시 취소용
  const isAnimatingRef = useRef(false); // 전환 애니메이션 진행 중에는 새 드래그를 막는다

  const currentYear = useCalendarStore((state) => state.currentYear);
  const currentMonth = useCalendarStore((state) => state.currentMonth);
  const setMonth = useCalendarStore((state) => state.setMonth);
  const initialCalendarDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

  // 1-based currentMonth 기준 인접 달 계산 (Date의 month는 0-based라 -2 / +0 이 됨)
  const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const nextMonthDate = new Date(currentYear, currentMonth, 1);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (wheelIdleTimerRef.current !== null) {
        window.clearTimeout(wheelIdleTimerRef.current);
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  // 저장된 연월이 바뀌면 현재 캘린더 화면도 함께 이동한다.
  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  // ── 패널(스와이프 뷰포트) 높이 ───────────────────────────────────
  // 실제 "화면에 남는 공간" 계산은 CSS(--panel-h: calc(100dvh - ...), CalendarGrid.css)가
  // 전담한다. 100dvh는 브라우저가 iOS Safari 툴바 접힘/펼침 등을 실시간으로 알아서
  // 반영해주는 단위라, 이전처럼 window.innerHeight/scrollY를 JS로 손수 재고 타이밍을
  // 맞추려다 계속 어긋나던 문제가 근본적으로 사라진다. 여기서는 그 계산에 필요한
  // 두 값(헤더 높이, 플로팅 버튼 바 높이)만 ResizeObserver로 관찰해서 CSS 변수로
  // 흘려준다 — 둘 다 "크기"만 보는 것이라 스크롤 위치나 타이밍에 영향받지 않는다.

  // 헤더 높이 관찰
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateHeaderVar = () => {
      rootRef.current?.style.setProperty('--header-h', `${header.getBoundingClientRect().height}px`);
    };

    updateHeaderVar();
    const observer = new ResizeObserver(updateHeaderVar);
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  // 플로팅 버튼 바(App.tsx의 .fixed.bottom-0) 높이 관찰. 이 요소는 CalendarGrid의
  // 자식이 아니라 App.tsx가 별도로 렌더링하고, HomePage 마운트 이후 뒤늦게 나타나기도
  // 하므로 MutationObserver로 등장/제거를 감지하면서 ResizeObserver로 크기를 추적한다.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    let floatingObserver: ResizeObserver | null = null;
    let trackedEl: Element | null = null;

    const syncFloatingHeight = () => {
      const el = document.querySelector<HTMLElement>('.fixed.bottom-0');

      // 추적 중인 요소가 그대로면 아무것도 안 한다 — 실제 크기 변화는 이미
      // 아래 ResizeObserver가 감시하고 있으므로, document.body 전체를 감시하는
      // MutationObserver가 (FullCalendar 내부 리렌더 등) 무관한 변화 때마다
      // 매번 getBoundingClientRect()로 레이아웃을 다시 읽을 필요가 없다.
      if (el === trackedEl) {
        return;
      }

      floatingObserver?.disconnect();
      trackedEl = el;

      if (el) {
        rootRef.current?.style.setProperty('--floating-h', `${el.getBoundingClientRect().height}px`);
        floatingObserver = new ResizeObserver(() => {
          rootRef.current?.style.setProperty('--floating-h', `${el.getBoundingClientRect().height}px`);
        });
        floatingObserver.observe(el);
      } else {
        rootRef.current?.style.setProperty('--floating-h', '0px');
      }
    };

    syncFloatingHeight();
    const bodyObserver = new MutationObserver(syncFloatingHeight);
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      bodyObserver.disconnect();
      floatingObserver?.disconnect();
    };
  }, []);

  // 드래그 시 transform 계산에는 실제 px 숫자가 필요하므로, CSS(calc(100dvh - ...))가
  // 계산해준 --panel-h의 "결과값"을 뷰포트 요소 자체의 렌더 높이로 읽어서 동기화한다.
  // (여기서 재는 건 CSS가 이미 계산한 결과를 읽기만 하는 것이라 순환 참조가 아니다.)
  //
  // 동시에, 스크롤 없이 항상 한 화면에 다 들어가야 하므로 "그 달의 주(週) 수"에 맞춰
  // 날짜 칸 높이(--day-row-h)를 계산해서 각 패널에 넣어준다. 현재 달(FullCalendar)은
  // 요일 헤더 행이 있어 그만큼 뺀 나머지를 주 수로 나누고, prev/next 미리보기 패널은
  // 요일 헤더가 없으므로 패널 전체 높이를 그대로 주 수로 나눈다.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateRowHeights = () => {
      const available = viewport.getBoundingClientRect().height;
      if (available <= 0) {
        return;
      }
      panelHeightRef.current = available;

      const colHeaderHeight =
        currentPanelRef.current?.querySelector('.fc-col-header')?.getBoundingClientRect().height ?? 0;

      const setRowHeight = (el: HTMLElement | null, weeks: number, subtractHeader: boolean) => {
        if (!el || weeks <= 0) {
          return;
        }
        const usable = subtractHeader ? available - colHeaderHeight : available;
        const rowHeight = usable / weeks;
        if (rowHeight > 0) {
          el.style.setProperty('--day-row-h', `${rowHeight}px`);
        }
      };

      setRowHeight(
        prevPanelElRef.current,
        getMonthWeeks(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1).length,
        false,
      );
      setRowHeight(
        currentPanelElRef.current,
        getMonthWeeks(currentYear, currentMonth).length,
        true,
      );
      setRowHeight(
        nextPanelElRef.current,
        getMonthWeeks(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1).length,
        false,
      );
    };

    updateRowHeights();
    const resizeObserver = new ResizeObserver(updateRowHeights);
    resizeObserver.observe(viewport);

    // ⚠️ FullCalendar는 마운트 직후 요일 헤더(.fc-col-header) 등 내부 DOM을 살짝
    // 늦게(비동기로) 그리는 경우가 있다. 그 시점 전에 위 updateRowHeights()가 먼저
    // 실행되면 colHeaderHeight를 0으로 잘못 계산해서, 실제로 헤더가 그려진 뒤에도
    // 그 헤더 높이만큼 계산에서 빠뜨린 채로 남아있게 된다(=6주짜리 달에서 페이지가
    // 헤더 높이만큼 넘쳐서 스크롤이 생기는 원인). viewport 자체는 크기가 고정이라
    // ResizeObserver만으로는 이 시점을 못 잡으므로, FullCalendar가 그려지는 DOM
    // 변화 자체를 MutationObserver로 감지해서 한 번 더 정확히 재계산한다.
    const panelInner = currentPanelRef.current;
    let mutationObserver: MutationObserver | null = null;
    if (panelInner && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(updateRowHeights);
      mutationObserver.observe(panelInner, { childList: true, subtree: true });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
    };
  }, [currentYear, currentMonth]);

  // 달이 바뀌면 이전 달에서 스크롤돼 있던 위치가 남아있지 않도록 맨 위로 초기화한다.
  useEffect(() => {
    if (currentPanelRef.current) {
      currentPanelRef.current.scrollTop = 0;
    }
  }, [currentYear, currentMonth]);


  // 트랙에 transform을 직접 적용 (state로 관리하면 드래그 중 매 프레임 리렌더가 발생하므로 DOM 직접 조작)
  // delta: 터치 기준 부호 — 음수면 "다음 달" 방향, 양수면 "이전 달" 방향으로 화면이 움직인다.
  const setTrackTransform = (delta: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track || panelHeightRef.current === 0) return;

    // prefers-reduced-motion을 요청한 사용자는 슬라이딩 애니메이션 없이 즉시 이동한다.
    // (실제 월 전환 로직 자체는 애니메이션 유무와 무관하게 setTimeout 기반이라 그대로 동작한다.)
    const shouldAnimate =
      animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    track.style.transition = shouldAnimate
      ? `transform ${TRANSITION_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
      : 'none';
    track.style.transform = `translateY(${-panelHeightRef.current + delta}px)`;
  };

  const resetTrack = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform = '';
  };

  // resetTrack을 지연 실행하되, 이미 예약된 타이머가 있으면 먼저 취소한다.
  // 그렇지 않으면 새 드래그가 시작된 후에도 예전 타이머가 실행되면서 트랙
  // transform이 갑자기 초기화되는 깜빡임(레이스 컨디션)이 생길 수 있다.
  const scheduleReset = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      resetTrack();
    }, TRANSITION_DURATION_MS);
  };

  const runTransition = (direction: 'next' | 'prev') => {
    isAnimatingRef.current = true;
    const target = direction === 'next' ? -panelHeightRef.current : panelHeightRef.current;
    setTrackTransform(target, true);

    window.setTimeout(() => {
      calendarRef.current?.getApi()[direction]();
      // 실제 달 데이터가 바뀐 뒤 애니메이션 없이 가운데(0)로 즉시 복귀
      resetTrack();
      isAnimatingRef.current = false;
    }, TRANSITION_DURATION_MS);
  };

  // delta(터치 기준 부호)가 임계값을 넘었으면 실제 전환, 아니면 제자리로 복귀
  const finishDrag = (delta: number) => {
    if (Math.abs(delta) >= SCROLL_TRANSITION_THRESHOLD_PX) {
      runTransition(delta < 0 ? 'next' : 'prev');
    } else {
      setTrackTransform(0, true);
      scheduleReset();
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (longPressedDateRef.current === arg.dateStr) {
      longPressedDateRef.current = null;
      return;
    }

    onSelectDate(arg.dateStr);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getDateFromTarget = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>('[data-date]')?.dataset.date
      : undefined;

  // 날짜 셀을 길게 누르면 해당 날짜의 생성 모달을 연다.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    // 헤더(검색/설정/연도 버튼 등)에서 시작된 포인터는 스와이프/롱프레스 로직을
    // 완전히 건너뛴다. 여기서 setPointerCapture를 호출하면 캡처링 대상이 되어
    // 버튼의 click 이벤트가 정상적으로 발생하지 않을 수 있다(크롬에서 특히 엄격).
    if (headerRef.current?.contains(event.target as Node)) {
      return;
    }

    // 포인터를 캡처해서, 드래그 도중 손가락/마우스가 이 요소(화면 프레임) 밖으로
    // 나가도 계속 이 요소가 pointermove/pointerup을 받도록 한다. 이게 없으면
    // 데스크톱에서 마우스 드래그 중 프레임(max-w-402px) 밖으로 살짝만 나가도
    // 드래그가 중간에 취소되는 문제가 있었다. 일부 포인터 타입/브라우저 조합에서
    // 예외가 날 수 있어 안전하게 try/catch로 감싼다.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 캡처 실패해도 기존 pointercancel 처리로 대부분 커버되므로 무시한다.
    }

    // 전환 애니메이션이 진행 중일 때는 새 드래그를 시작하지 않는다.
    if (!isAnimatingRef.current) {
      scrollTouchStartYRef.current = event.clientY;
    }

    const date = getDateFromTarget(event.target);

    // 콜백이 없는 화면에서는 일반 날짜 클릭만 처리한다.
    if (!date || !onLongPressDate) {
      return;
    }

    clearLongPressTimer();
    longPressedDateRef.current = null;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressedDateRef.current = date;
      longPressTimerRef.current = null;
      onLongPressDate(date);
    }, LONG_PRESS_DURATION_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;

    if (
      start &&
      (Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_THRESHOLD_PX ||
        Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_THRESHOLD_PX)
    ) {
      clearLongPressTimer();
    }

    // 터치 드래그 중에는 실제 월 전환 없이, 손가락을 따라 트랙만 실시간으로 움직인다.
    const scrollStartY = scrollTouchStartYRef.current;
    if (scrollStartY === null || isAnimatingRef.current) {
      return;
    }

    const deltaY = event.clientY - scrollStartY;
    setTrackTransform(deltaY, false);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    clearLongPressTimer();
    pointerStartRef.current = null;

    const scrollStartY = scrollTouchStartYRef.current;
    scrollTouchStartYRef.current = null;

    if (scrollStartY !== null && !isAnimatingRef.current) {
      finishDrag(event.clientY - scrollStartY);
    }

    if (longPressedDateRef.current) {
      window.setTimeout(() => {
        longPressedDateRef.current = null;
      }, 1000);
    }
  };

  // 드래그 도중 포인터가 화면 밖으로 나가는 등 비정상 종료 시 제자리로 복귀
  const handlePointerCancel = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
    scrollTouchStartYRef.current = null;

    if (!isAnimatingRef.current) {
      setTrackTransform(0, true);
      scheduleReset();
    }
  };

  // React의 onWheel은 브라우저에 의해 passive 리스너로 등록되는 경우가 있어,
  // 그 안에서 event.preventDefault()를 호출해도 무시되고 페이지가 같이 스크롤될
  // 수 있다. { passive: false }로 네이티브 리스너를 직접 붙여야 확실히 막힌다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onWheelNative = (event: globalThis.WheelEvent) => {
      if (isAnimatingRef.current) {
        return;
      }

      event.preventDefault();
      wheelAccumulatedYRef.current += event.deltaY;
      setTrackTransform(-wheelAccumulatedYRef.current, false);

      if (wheelIdleTimerRef.current !== null) {
        window.clearTimeout(wheelIdleTimerRef.current);
      }
      wheelIdleTimerRef.current = window.setTimeout(() => {
        finishDrag(-wheelAccumulatedYRef.current);
        wheelAccumulatedYRef.current = 0;
        wheelIdleTimerRef.current = null;
      }, WHEEL_IDLE_MS);
    };

    root.addEventListener('wheel', onWheelNative, { passive: false });
    return () => root.removeEventListener('wheel', onWheelNative);
  }, []);

  // long press 뒤의 click이 Daily 이동으로 이어지지 않게 막는다.
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    // 헤더(검색/설정/연도 버튼 등) 클릭은 스와이프/롱프레스 로직과 무관하므로
    // 그대로 통과시킨다. 그렇지 않으면 헤더 버튼 클릭이 이 캡처 핸들러를 거치면서
    // 일부 브라우저(Chrome)에서 정상적으로 target까지 전달되지 않는 경우가 있다.
    if (headerRef.current?.contains(event.target as Node)) {
      return;
    }

    const date = getDateFromTarget(event.target);

    if (date && longPressedDateRef.current === date) {
      event.preventDefault();
      event.stopPropagation();
      longPressedDateRef.current = null;
    }
  };

  const dayCellClassNames = (arg: { date: Date }) => {
    const dateStr = arg.date.toLocaleDateString('sv-SE');
    return dateStr === selectedDate ? ['selected-date'] : [];
  };

  // 마우스 드래그/휠 스와이프 외에, 키보드(방향키)로도 월 전환이 가능해야 한다.
  // headerToolbar={false}로 FullCalendar 자체 이전/다음 버튼도 꺼져있어서,
  // 이게 없으면 키보드/스크린리더 사용자는 현재 달 외에 다른 달로 이동할 방법이 없다.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) {
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      runTransition('next');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      runTransition('prev');
    }
  };

  return (
    <div
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={handlePointerEnd}
      onPointerCancelCapture={handlePointerCancel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`${currentYear}년 ${currentMonth}월 캘린더. 위/아래 방향키로 달을 전환할 수 있습니다.`}
      onClickCapture={handleClickCapture}
      onContextMenu={(event) => {
        if (getDateFromTarget(event.target)) {
          event.preventDefault();
        }
      }}
      className={`calendar-grid-root ${selectedDate ? 'has-selection' : ''}`}
      ref={rootRef}
    >
      <div className="calendar-header" ref={headerRef}>
        <div className="calendar-header-top">
          <button
            type="button"
            className="year-nav-button"
            onClick={onYearViewClick}
            aria-label="연간 캘린더로 이동"
          >
            <img src="/icon/chevron/left_small.svg" alt="" />
            <span className="year-number">{currentYear}</span>
          </button>

          <div className="calendar-header-icons">
            <button type="button" className="icon-button" onClick={onSearchClick} aria-label="검색">
              <img src="/icon/search.svg" alt="" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onViewToggleClick}
              aria-label="캘린더 뷰 전환"
            >
              <img src="/icon/icons/label_small.svg" alt="" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onSettingsClick}
              aria-label="설정"
            >
              <img src="/icon/settings.svg" alt="" />
            </button>
          </div>
        </div>

        <span className="month-number">{currentMonth}</span>
      </div>

      <div className="calendar-grid-scroll-area" ref={viewportRef}>
        <div className="calendar-swipe-track" ref={trackRef}>
          {/* 이전 달 — 드래그 중에만 살짝 보이는 미리보기(날짜만, 이벤트 없음) */}
          <div className="calendar-panel" ref={prevPanelElRef} aria-hidden="true">
            <MonthPeekGrid
              year={prevMonthDate.getFullYear()}
              month={prevMonthDate.getMonth() + 1}
            />
          </div>

          {/* 현재 달 — 실제 FullCalendar, 기존 이벤트/쿼리 로직 그대로.
              바깥 .calendar-panel은 트랙 정렬을 위해 --panel-h로 높이가 고정돼 있어서,
              측정 대상을 바깥이 아니라 이 안쪽(.calendar-panel-inner, 항상 auto 높이)으로
              둬야 한다. 그렇지 않으면 "고정된 높이를 다시 재서 자기 자신에 넣는" 순환
              측정이 되어, 5주↔6주 달 전환 시 실제 콘텐츠 크기 변화를 감지하지 못한다. */}
          <div className="calendar-panel" ref={currentPanelElRef}>
            <div className="calendar-panel-inner" ref={currentPanelRef}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView={initialView}
                initialDate={initialCalendarDate}
                locale="ko"
                events={events}
                dateClick={handleDateClick}
                dayCellClassNames={dayCellClassNames}
                dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
                height="auto"
                headerToolbar={false}
                fixedWeekCount={false}
                dayMaxEvents={3}
                moreLinkContent={(arg: MoreLinkContentArg) => `+${arg.num}`}
                datesSet={(arg) => {
                  const month = arg.view.currentStart.getMonth() + 1;
                  setMonth(arg.view.currentStart.getFullYear(), month);
                }}
              />
            </div>
          </div>

          {/* 다음 달 — 드래그 중에만 살짝 보이는 미리보기(날짜만, 이벤트 없음) */}
          <div className="calendar-panel" ref={nextPanelElRef} aria-hidden="true">
            <MonthPeekGrid
              year={nextMonthDate.getFullYear()}
              month={nextMonthDate.getMonth() + 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarGrid;
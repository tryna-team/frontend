import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEventHandler,
  type TouchEventHandler,
  type TransitionEventHandler,
} from 'react';
import { useSwipeable, type SwipeEventData } from 'react-swipeable';

export type HorizontalPagerDirection = 'previous' | 'next';
type GestureAxis = 'horizontal' | 'vertical' | null;

interface UseHorizontalPagerOptions {
  /** 가운데 패널을 식별하는 값. 값이 바뀌면 트랙을 가운데로 재정렬한다. */
  resetKey: string;
  /** 옆 패널까지 이동한 애니메이션이 끝난 뒤 호출된다. */
  onPageChange: (direction: HorizontalPagerDirection) => void;
  disabled?: boolean;
  thresholdRatio?: number;
  velocityThreshold?: number;
  transitionMs?: number;
}

const CENTER_POSITION = -100;
const PREVIOUS_POSITION = 0;
const NEXT_POSITION = -200;
const AXIS_LOCK_RATIO = 1.1;
const MIN_FLING_DISTANCE = 24;
const TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function setTrackPosition(track: HTMLDivElement, position: number, dragOffset = 0) {
  track.style.transform =
    dragOffset === 0
      ? `translate3d(${position}%, 0, 0)`
      : `translate3d(calc(${position}% + ${dragOffset}px), 0, 0)`;
}

/** 이전·현재·다음 3패널의 가로 이동만 담당하는 공통 훅 */
function useHorizontalPager({
  resetKey,
  onPageChange,
  disabled = false,
  thresholdRatio = 0.2,
  velocityThreshold = 0.45,
  transitionMs = 220,
}: UseHorizontalPagerOptions) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const pendingDirectionRef = useRef<HorizontalPagerDirection | null>(null);
  const isAnimatingRef = useRef(false);
  const gestureAxisRef = useRef<GestureAxis>(null);
  const suppressClickRef = useRef(false);
  const onPageChangeRef = useRef(onPageChange);

  useLayoutEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const clearTimers = useCallback(() => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const resetToCenter = useCallback(() => {
    clearTimers();

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      setTrackPosition(trackRef.current, CENTER_POSITION);
    }

    dragOffsetRef.current = 0;
    pendingDirectionRef.current = null;
    isAnimatingRef.current = false;
    gestureAxisRef.current = null;
  }, [clearTimers]);

  const completeTransition = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const direction = pendingDirectionRef.current;
    pendingDirectionRef.current = null;

    if (!direction) {
      resetToCenter();
      return;
    }

    onPageChangeRef.current(direction);

    // onPageChange가 resetKey를 바꾸지 않아도 트랙이 잠긴 채 남지 않도록 한다.
    resetTimerRef.current = window.setTimeout(resetToCenter, 300);
  }, [resetToCenter]);

  const settle = useCallback(
    (direction: HorizontalPagerDirection | null) => {
      const track = trackRef.current;
      if (!track) {
        if (direction) onPageChangeRef.current(direction);
        return;
      }

      clearTimers();
      track.style.transition = 'none';
      setTrackPosition(track, CENTER_POSITION, dragOffsetRef.current);
      void track.offsetWidth;

      pendingDirectionRef.current = direction;
      isAnimatingRef.current = true;

      const target =
        direction === 'previous'
          ? PREVIOUS_POSITION
          : direction === 'next'
            ? NEXT_POSITION
            : CENTER_POSITION;
      const duration = Math.max(0, transitionMs);
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (duration === 0 || reduceMotion) {
        setTrackPosition(track, target);
        completeTransition();
        return;
      }

      track.style.transition = `transform ${duration}ms ${TRANSITION_EASING}`;
      setTrackPosition(track, target);
      transitionTimerRef.current = window.setTimeout(completeTransition, duration + 80);
    },
    [clearTimers, completeTransition, transitionMs],
  );

  const handleSwiping = useCallback(
    ({ absX, absY, deltaX }: SwipeEventData) => {
      if (disabled || isAnimatingRef.current) return;

      if (gestureAxisRef.current === null) {
        if (absX > absY * AXIS_LOCK_RATIO) {
          gestureAxisRef.current = 'horizontal';
        } else if (absY > absX * AXIS_LOCK_RATIO) {
          gestureAxisRef.current = 'vertical';
        }
      }

      if (gestureAxisRef.current !== 'horizontal') return;

      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      if (viewportWidth === 0) return;

      dragOffsetRef.current = clamp(deltaX, -viewportWidth, viewportWidth);
      suppressClickRef.current = absX >= 8;

      if (dragFrameRef.current === null) {
        dragFrameRef.current = window.requestAnimationFrame(() => {
          dragFrameRef.current = null;
          if (!trackRef.current || isAnimatingRef.current) return;

          trackRef.current.style.transition = 'none';
          setTrackPosition(trackRef.current, CENTER_POSITION, dragOffsetRef.current);
        });
      }
    },
    [disabled],
  );

  const handleSwiped = useCallback(
    ({ absX, deltaX, vxvy }: SwipeEventData) => {
      if (disabled || isAnimatingRef.current) return;

      // 세로 스크롤만 한 경우에는 트랙이나 입력 잠금 상태를 건드리지 않는다.
      if (gestureAxisRef.current !== 'horizontal') return;

      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const passedDistance =
        viewportWidth > 0 && absX >= viewportWidth * clamp(thresholdRatio, 0, 1);
      const passedVelocity =
        absX >= MIN_FLING_DISTANCE && Math.abs(vxvy[0]) >= Math.max(0, velocityThreshold);
      const direction: HorizontalPagerDirection | null =
        passedDistance || passedVelocity ? (deltaX < 0 ? 'next' : 'previous') : null;

      settle(direction);
    },
    [disabled, settle, thresholdRatio, velocityThreshold],
  );

  const swipeHandlers = useSwipeable({
    onTouchStartOrOnMouseDown: () => {
      if (!isAnimatingRef.current) {
        dragOffsetRef.current = 0;
        gestureAxisRef.current = null;
        suppressClickRef.current = false;
      }
    },
    onSwiping: handleSwiping,
    onSwiped: handleSwiped,
    preventScrollOnSwipe: false,
    trackMouse: true,
  });

  const setViewportRef = useCallback(
    (element: HTMLDivElement | null) => {
      viewportRef.current = element;
      swipeHandlers.ref(element);
    },
    [swipeHandlers],
  );

  const handleTransitionEnd = useCallback<TransitionEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.target === event.currentTarget && event.propertyName === 'transform') {
        completeTransition();
      }
    },
    [completeTransition],
  );

  const handleClickCapture = useCallback<MouseEventHandler<HTMLDivElement>>((event) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  const handleTouchCancel = useCallback<TouchEventHandler<HTMLDivElement>>(() => {
    if (isAnimatingRef.current) return;

    if (gestureAxisRef.current === 'horizontal') {
      settle(null);
    } else {
      gestureAxisRef.current = null;
    }
  }, [settle]);

  // 날짜 클릭·오늘 이동·라우트 변경 후 새 3패널을 가운데에서 시작한다.
  useLayoutEffect(() => {
    resetToCenter();
  }, [disabled, resetKey, resetToCenter]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    viewportProps: {
      ...swipeHandlers,
      ref: setViewportRef,
      onClickCapture: handleClickCapture,
      onTouchCancel: handleTouchCancel,
    },
    trackProps: {
      ref: trackRef,
      onTransitionEnd: handleTransitionEnd,
    },
  };
}

export default useHorizontalPager;

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

interface UseCalendarScrollOptions {
  onReachStart?: () => void;
  onReachEnd?: () => void;
  /** 스크롤 영역의 위·아래 끝에서 콜백을 미리 호출할 거리(px) */
  threshold?: number;
  /** 최초 표시 항목으로 이동하기 전에는 false로 두어 경계 감지를 막는다. */
  enabled?: boolean;
}

interface ScrollAnchor {
  element: HTMLElement;
  offsetTop: number;
  children: Element[];
}

const DEFAULT_THRESHOLD_PX = 240;

function captureScrollAnchor(viewport: HTMLElement, content: HTMLElement): ScrollAnchor | null {
  const viewportTop = viewport.getBoundingClientRect().top;
  const element = Array.from(content.children).find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.getBoundingClientRect().bottom > viewportTop,
  );

  if (!element) {
    return null;
  }

  return {
    element,
    offsetTop: element.getBoundingClientRect().top - viewportTop,
    children: Array.from(content.children),
  };
}

function hasChildListChanged(content: HTMLElement, anchor: ScrollAnchor) {
  const currentChildren = Array.from(content.children);

  return (
    currentChildren.length !== anchor.children.length ||
    currentChildren.some((child, index) => child !== anchor.children[index])
  );
}

function restoreScrollPosition(viewport: HTMLElement, content: HTMLElement, anchor: ScrollAnchor) {
  if (!anchor.element.isConnected || !content.contains(anchor.element)) {
    return;
  }

  const viewportTop = viewport.getBoundingClientRect().top;
  const currentOffsetTop = anchor.element.getBoundingClientRect().top - viewportTop;
  viewport.scrollTop += currentOffsetTop - anchor.offsetTop;
}

function useCalendarScroll<
  ViewportElement extends HTMLElement = HTMLDivElement,
  ContentElement extends HTMLElement = HTMLDivElement,
>({
  onReachStart,
  onReachEnd,
  threshold = DEFAULT_THRESHOLD_PX,
  enabled = true,
}: UseCalendarScrollOptions) {
  const viewportRef = useRef<ViewportElement | null>(null);
  const contentRef = useRef<ContentElement | null>(null);
  const optionsRef = useRef({ onReachStart, onReachEnd, threshold, enabled });
  const startArmedRef = useRef(true);
  const endArmedRef = useRef(true);
  const pendingAnchorRef = useRef<ScrollAnchor | null>(null);
  const measureFrameRef = useRef<number | null>(null);

  const cancelMeasure = useCallback(() => {
    if (measureFrameRef.current !== null) {
      window.cancelAnimationFrame(measureFrameRef.current);
      measureFrameRef.current = null;
    }
  }, []);

  const measureEdges = useCallback(() => {
    measureFrameRef.current = null;

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const options = optionsRef.current;

    if (!viewport || !content || !options.enabled) {
      return;
    }

    const edgeThreshold = Math.max(0, options.threshold);
    const startDistance = Math.max(0, viewport.scrollTop);
    const endDistance = Math.max(
      0,
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
    );

    if (startDistance > edgeThreshold) {
      startArmedRef.current = true;
    }

    if (endDistance > edgeThreshold) {
      endArmedRef.current = true;
    }

    if (startDistance <= edgeThreshold && startArmedRef.current && options.onReachStart) {
      startArmedRef.current = false;
      pendingAnchorRef.current = captureScrollAnchor(viewport, content);
      options.onReachStart();
    }

    if (endDistance <= edgeThreshold && endArmedRef.current && options.onReachEnd) {
      endArmedRef.current = false;
      pendingAnchorRef.current = captureScrollAnchor(viewport, content);
      options.onReachEnd();
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (measureFrameRef.current === null) {
      measureFrameRef.current = window.requestAnimationFrame(measureEdges);
    }
  }, [measureEdges]);

  useLayoutEffect(() => {
    optionsRef.current = {
      onReachStart,
      onReachEnd,
      threshold: Math.max(0, threshold),
      enabled,
    };

    if (!enabled) {
      startArmedRef.current = true;
      endArmedRef.current = true;
      pendingAnchorRef.current = null;
      cancelMeasure();
      return;
    }

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const anchor = pendingAnchorRef.current;
    const contentChanged = anchor && content && hasChildListChanged(content, anchor);

    if (viewport && content && anchor && contentChanged) {
      restoreScrollPosition(viewport, content, anchor);
      pendingAnchorRef.current = null;
    }

    scheduleMeasure();
  });

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.addEventListener('scroll', scheduleMeasure, { passive: true });
    scheduleMeasure();

    return () => {
      viewport.removeEventListener('scroll', scheduleMeasure);
      cancelMeasure();
    };
  }, [cancelMeasure, scheduleMeasure]);

  return { viewportRef, contentRef };
}

export default useCalendarScroll;

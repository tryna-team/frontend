import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface UseVisibleCalendarItemOptions<
  ViewportElement extends HTMLElement,
  ContentElement extends HTMLElement,
> {
  viewportRef: RefObject<ViewportElement | null>;
  contentRef: RefObject<ContentElement | null>;
  currentItemKey: string | null;
  getItemKey: (element: HTMLElement) => string | null;
  onVisibleItemChange: (itemKey: string) => void;
  enabled?: boolean;
}

function getVisibleHeight(item: DOMRect, viewport: DOMRect) {
  return Math.max(0, Math.min(item.bottom, viewport.bottom) - Math.max(item.top, viewport.top));
}

function useVisibleCalendarItem<
  ViewportElement extends HTMLElement = HTMLDivElement,
  ContentElement extends HTMLElement = HTMLDivElement,
>({
  viewportRef,
  contentRef,
  currentItemKey,
  getItemKey,
  onVisibleItemChange,
  enabled = true,
}: UseVisibleCalendarItemOptions<ViewportElement, ContentElement>) {
  const optionsRef = useRef({ getItemKey, onVisibleItemChange, enabled });
  const measuredItemKeyRef = useRef(currentItemKey);
  const measureFrameRef = useRef<number | null>(null);

  const cancelMeasure = useCallback(() => {
    if (measureFrameRef.current !== null) {
      window.cancelAnimationFrame(measureFrameRef.current);
      measureFrameRef.current = null;
    }
  }, []);

  const measureVisibleItem = useCallback(() => {
    measureFrameRef.current = null;

    const viewport = viewportRef.current;
    const content = contentRef.current;
    const options = optionsRef.current;

    if (!viewport || !content || !options.enabled) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    let largestItemKey: string | null = null;
    let largestVisibleHeight = 0;
    let currentVisibleHeight = 0;

    for (const child of content.children) {
      if (!(child instanceof HTMLElement)) {
        continue;
      }

      const key = options.getItemKey(child);
      const height = getVisibleHeight(child.getBoundingClientRect(), viewportRect);

      if (!key || height <= 0) {
        continue;
      }

      if (key === measuredItemKeyRef.current) {
        currentVisibleHeight = height;
      }

      if (height > largestVisibleHeight) {
        largestItemKey = key;
        largestVisibleHeight = height;
      }
    }

    const nextItemKey =
      currentVisibleHeight === largestVisibleHeight ? measuredItemKeyRef.current : largestItemKey;

    if (!nextItemKey || nextItemKey === measuredItemKeyRef.current) {
      return;
    }

    measuredItemKeyRef.current = nextItemKey;
    options.onVisibleItemChange(nextItemKey);
  }, [contentRef, viewportRef]);

  const scheduleMeasure = useCallback(() => {
    if (measureFrameRef.current === null) {
      measureFrameRef.current = window.requestAnimationFrame(measureVisibleItem);
    }
  }, [measureVisibleItem]);

  useLayoutEffect(() => {
    optionsRef.current = { getItemKey, onVisibleItemChange, enabled };
    measuredItemKeyRef.current = currentItemKey;

    if (enabled) {
      scheduleMeasure();
    } else {
      cancelMeasure();
    }
  });

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    scheduleMeasure();

    return () => {
      viewport.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      cancelMeasure();
    };
  }, [cancelMeasure, scheduleMeasure, viewportRef]);
}

export default useVisibleCalendarItem;

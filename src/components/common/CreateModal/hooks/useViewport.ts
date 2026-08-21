import { useEffect, useState } from 'react';

const getVisualViewportHeight = () =>
  Math.round(window.visualViewport?.height ?? window.innerHeight);

const getKeyboardInset = () => {
  const viewport = window.visualViewport;

  if (!viewport) {
    return 0;
  }

  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
};

const getVisualViewportRect = () => ({
  top: 0,
  height: getVisualViewportHeight(),
  keyboardInset: getKeyboardInset(),
});

const getAppFrameRect = () => {
  const appFrame = document.querySelector<HTMLElement>('.transform-gpu');
  const { left = 0, width = window.innerWidth } = appFrame?.getBoundingClientRect() ?? {};

  return { left, width };
};

export const useCreateModalViewport = () => {
  const [visualViewportRect, setVisualViewportRect] = useState(getVisualViewportRect);
  const [appFrameRect, setAppFrameRect] = useState(getAppFrameRect);

  // Follow keyboard height changes, but ignore iOS visual viewport panning.
  useEffect(() => {
    const viewport = window.visualViewport;
    let frameId: number | null = null;

    const updateVisualViewport = () => {
      const nextRect = getVisualViewportRect();

      setVisualViewportRect((currentRect) => {
        if (
          currentRect.top === nextRect.top &&
          currentRect.height === nextRect.height &&
          currentRect.keyboardInset === nextRect.keyboardInset
        ) {
          return currentRect;
        }

        return nextRect;
      });
    };

    const scheduleVisualViewportUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateVisualViewport();
      });
    };

    viewport?.addEventListener('resize', scheduleVisualViewportUpdate);
    viewport?.addEventListener('scroll', scheduleVisualViewportUpdate);
    window.addEventListener('resize', scheduleVisualViewportUpdate);
    scheduleVisualViewportUpdate();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      viewport?.removeEventListener('resize', scheduleVisualViewportUpdate);
      viewport?.removeEventListener('scroll', scheduleVisualViewportUpdate);
      window.removeEventListener('resize', scheduleVisualViewportUpdate);
    };
  }, []);

  // Keep portal content aligned to the app frame width.
  useEffect(() => {
    const appFrame = document.querySelector<HTMLElement>('.transform-gpu');

    if (!appFrame) {
      return;
    }

    const updateAppFrameRect = () => {
      const { left, width } = appFrame.getBoundingClientRect();
      setAppFrameRect({ left, width });
    };
    const resizeObserver = new ResizeObserver(updateAppFrameRect);

    updateAppFrameRect();
    resizeObserver.observe(appFrame);
    window.addEventListener('resize', updateAppFrameRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateAppFrameRect);
    };
  }, []);

  return {
    visualViewportRect,
    appFrameRect,
  };
};

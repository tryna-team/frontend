import { useEffect, useState } from 'react';

const getVisualViewportRect = () => ({
  top: window.visualViewport?.offsetTop ?? 0,
  height: window.visualViewport?.height ?? window.innerHeight,
});

const getAppFrameRect = () => {
  const appFrame = document.querySelector<HTMLElement>('.transform-gpu');
  const { left = 0, width = window.innerWidth } = appFrame?.getBoundingClientRect() ?? {};

  return { left, width };
};

export const useCreateModalViewport = () => {
  const [visualViewportRect, setVisualViewportRect] = useState(getVisualViewportRect);
  const [appFrameRect, setAppFrameRect] = useState(getAppFrameRect);

  // 오버레이를 키보드를 제외한 실제 화면 영역에 맞춘다.
  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const updateVisualViewport = () => {
      setVisualViewportRect({
        top: viewport.offsetTop,
        height: viewport.height,
      });
    };

    viewport.addEventListener('resize', updateVisualViewport);
    viewport.addEventListener('scroll', updateVisualViewport);
    const frameId = window.requestAnimationFrame(updateVisualViewport);

    return () => {
      window.cancelAnimationFrame(frameId);
      viewport.removeEventListener('resize', updateVisualViewport);
      viewport.removeEventListener('scroll', updateVisualViewport);
    };
  }, []);

  // Portal 내부 콘텐츠를 실제 캘린더 프레임에 맞춘다.
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

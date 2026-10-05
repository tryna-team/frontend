import { useSyncExternalStore } from 'react';

export interface VisualViewportRect {
  // 키보드를 제외하고 실제로 보이는 높이(px)
  height: number;
  // 화면 아래에서 키보드가 차지하는 높이(px). 키보드가 없으면 0
  keyboardInset: number;
}

let cached: VisualViewportRect = { height: 0, keyboardInset: 0 };

function getSnapshot(): VisualViewportRect {
  const viewport = window.visualViewport;
  const next = viewport
    ? {
        height: Math.round(viewport.height),
        // iOS에서 키보드가 열릴 때 생기는 화면 이동(offsetTop)은 키보드 높이에서 뺀다
        keyboardInset: Math.max(
          0,
          Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
        ),
      }
    : { height: window.innerHeight, keyboardInset: 0 };

  if (next.height !== cached.height || next.keyboardInset !== cached.keyboardInset) cached = next;
  return cached;
}

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  window.addEventListener('resize', onChange);
  return () => {
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

const subscribeNothing = () => () => {};

// 키보드를 반영한 실제 보이는 영역. enabled일 때만 변화를 구독한다
export function useVisualViewport(enabled = true): VisualViewportRect {
  return useSyncExternalStore(enabled ? subscribe : subscribeNothing, getSnapshot);
}

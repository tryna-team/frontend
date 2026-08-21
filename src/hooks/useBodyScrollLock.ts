import { useEffect } from 'react';

type BodyScrollLockSnapshot = {
  target: HTMLElement;
  targetPosition: string;
  targetTop: string;
  targetLeft: string;
  targetRight: string;
  targetWidth: string;
  bodyOverflow: string;
  scrollY: number;
};

let lockCount = 0;
let snapshot: BodyScrollLockSnapshot | null = null;
let cleanupScrollInputBlock: (() => void) | null = null;

const getScrollLockTarget = () => document.getElementById('root') ?? document.body;

const getAllowedScrollElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLElement>('[data-scroll-lock-allow="true"]');
};

const canScrollVertically = (element: HTMLElement, deltaY: number) => {
  if (element.scrollHeight <= element.clientHeight) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight;
  }

  return false;
};

const startScrollInputBlock = () => {
  let lastTouchY: number | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    lastTouchY = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent) => {
    const allowedScrollElement = getAllowedScrollElement(event.target);
    const currentTouchY = event.touches[0]?.clientY ?? null;
    const deltaY =
      lastTouchY !== null && currentTouchY !== null ? lastTouchY - currentTouchY : 0;

    lastTouchY = currentTouchY;

    if (allowedScrollElement && canScrollVertically(allowedScrollElement, deltaY)) {
      return;
    }

    event.preventDefault();
  };

  const handleWheel = (event: WheelEvent) => {
    const allowedScrollElement = getAllowedScrollElement(event.target);

    if (allowedScrollElement && canScrollVertically(allowedScrollElement, event.deltaY)) {
      return;
    }

    event.preventDefault();
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('wheel', handleWheel);
  };
};

const lockBodyScroll = () => {
  if (lockCount === 0) {
    const { body } = document;
    const target = getScrollLockTarget();
    const scrollY = window.scrollY;

    snapshot = {
      target,
      targetPosition: target.style.position,
      targetTop: target.style.top,
      targetLeft: target.style.left,
      targetRight: target.style.right,
      targetWidth: target.style.width,
      bodyOverflow: body.style.overflow,
      scrollY,
    };

    body.style.overflow = 'hidden';
    target.style.position = 'fixed';
    target.style.top = `-${scrollY}px`;
    target.style.left = '0';
    target.style.right = '0';
    target.style.width = '100%';
    cleanupScrollInputBlock = startScrollInputBlock();
  }

  lockCount += 1;
};

const unlockBodyScroll = () => {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount > 0 || !snapshot) {
    return;
  }

  const { body } = document;
  const scrollY = snapshot.scrollY;
  const { target } = snapshot;

  cleanupScrollInputBlock?.();
  cleanupScrollInputBlock = null;
  target.style.position = snapshot.targetPosition;
  target.style.top = snapshot.targetTop;
  target.style.left = snapshot.targetLeft;
  target.style.right = snapshot.targetRight;
  target.style.width = snapshot.targetWidth;
  body.style.overflow = snapshot.bodyOverflow;
  snapshot = null;
  window.scrollTo(0, scrollY);
};

export const useBodyScrollLock = () => {
  useEffect(() => {
    lockBodyScroll();

    return unlockBodyScroll;
  }, []);
};

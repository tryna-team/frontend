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

const getScrollLockTarget = () => document.getElementById('root') ?? document.body;

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

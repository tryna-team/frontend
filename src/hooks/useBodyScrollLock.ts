import { useEffect } from 'react';

type BodyScrollLockSnapshot = {
  overflow: string;
  position: string;
  top: string;
  width: string;
  scrollY: number;
};

let lockCount = 0;
let snapshot: BodyScrollLockSnapshot | null = null;

const lockBodyScroll = () => {
  if (lockCount === 0) {
    const { body } = document;
    const scrollY = window.scrollY;

    snapshot = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      scrollY,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
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

  body.style.overflow = snapshot.overflow;
  body.style.position = snapshot.position;
  body.style.top = snapshot.top;
  body.style.width = snapshot.width;
  snapshot = null;
  window.scrollTo(0, scrollY);
};

export const useBodyScrollLock = () => {
  useEffect(() => {
    lockBodyScroll();

    return unlockBodyScroll;
  }, []);
};

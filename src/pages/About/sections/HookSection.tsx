import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const HOOK_MESSAGES = [
  {
    leading: '과제는 기억했지만,',
    highlight: '마감 시간',
    trailing: '은?',
  },
  {
    leading: '약속 장소는 알지만,',
    highlight: '이동 시간',
    trailing: '은?',
  },
  {
    leading: '여행 날짜는 기억했지만,',
    highlight: '보조배터리',
    trailing: '는?',
  },
] as const;

const MESSAGE_INTERVAL_MS = 2800;

export default function HookSection() {
  const [messageIndex, setMessageIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const message = HOOK_MESSAGES[messageIndex];

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((currentIndex) => (currentIndex + 1) % HOOK_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [shouldReduceMotion]);

  return (
    <section aria-label="tryna 핵심 메시지" className="h-[280px] w-full">
      <div className="mx-auto flex h-full w-full max-w-[1040px] items-center justify-center px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center gap-[12px] font-default text-landing-mobile-heading-01 lg:flex-row lg:gap-[20px] lg:text-landing-desktop-heading-01"
          >
            <span className="whitespace-nowrap text-text-default">
              {message.leading}
            </span>
            <span className="flex items-center gap-[12px] whitespace-nowrap lg:gap-[20px]">
              <span className="text-green-500">{message.highlight}</span>
              <span className="text-text-default">{message.trailing}</span>
            </span>
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}

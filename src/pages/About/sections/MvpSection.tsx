import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const MVP_SLIDES = [
  {
    desktopSrc: '/about/mvp/desktop_carousel1.png',
    mobileSrc: '/about/mvp/mobile_carousel1.png',
    description:
      '트라이나와 함께라면 따로 정리하지 않아도 일정과 준비물을 하나로 관리할 수 있어요.',
  },
  {
    desktopSrc: '/about/mvp/desktop_carousel2.png',
    mobileSrc: '/about/mvp/mobile_carousel2.png',
    description:
      '트라이나와 함께라면 매번 다시 찾지 않아도 필요한 준비와 행동을 일정에 연결해 함께 볼 수 있어요.',
  },
  {
    desktopSrc: '/about/mvp/desktop_carousel3.png',
    mobileSrc: '/about/mvp/mobile_carousel3.png',
    description:
      '트라이나와 함께라면 생각나는 대로 말하듯 간편하게 일정을 기록할 수 있어요.',
  },
] as const;

const SLIDE_INTERVAL_MS = 3600;

export default function MvpSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const isInView = useInView(sectionRef, { amount: 0.25 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) =>
        (currentSlide + 1) % MVP_SLIDES.length,
      );
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isInView, shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="tryna 핵심 경험"
      className="relative aspect-[390/785] w-full overflow-hidden lg:aspect-[1440/860]"
    >
      {MVP_SLIDES.map((slide, index) => (
        <motion.picture
          key={slide.desktopSrc}
          aria-hidden={index !== activeSlide}
          initial={false}
          animate={{ opacity: index === activeSlide ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0 block size-full will-change-[opacity]"
        >
          <source
            media="(min-width: 1024px)"
            srcSet={slide.desktopSrc}
            width={1440}
            height={860}
          />
          <img
            src={slide.mobileSrc}
            alt=""
            width={390}
            height={785}
            loading="lazy"
            decoding="async"
            className="block size-full object-contain"
          />
        </motion.picture>
      ))}

      <div className="sr-only">
        <h2>tryna 핵심 경험</h2>
        <ul>
          {MVP_SLIDES.map((slide) => (
            <li key={slide.description}>{slide.description}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

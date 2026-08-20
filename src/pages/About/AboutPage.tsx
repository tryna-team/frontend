import { useEffect, useRef, useState } from 'react';

import AboutFloatingCta from './components/AboutFloatingCta';
import AboutFooter from './components/AboutFooter';
import AboutHeader from './components/AboutHeader';
import EndingBannerSection from './sections/EndingBannerSection';
import EndingSection from './sections/EndingSection';
import HeroSection from './sections/HeroSection';
import HookSection from './sections/HookSection';
import MvpSection from './sections/MvpSection';
import OverviewSection from './sections/OverviewSection';

export default function AboutPage() {
  const heroRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [isHeroPassed, setIsHeroPassed] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsHeroPassed(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const footer = footerRef.current;

    if (!footer) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsFooterVisible(entry.isIntersecting);
    });

    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="about-top"
      className="min-h-[100dvh] w-full bg-background-white"
    >
      <AboutHeader />

      <main>
        <HeroSection ref={heroRef} />
        <HookSection />
        <OverviewSection />
        <MvpSection />
        <EndingSection />
        <EndingBannerSection />
      </main>

      <AboutFooter ref={footerRef} />

      <AboutFloatingCta isVisible={isHeroPassed && !isFooterVisible} />
    </div>
  );
}

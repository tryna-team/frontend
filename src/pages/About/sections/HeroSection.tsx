import { forwardRef } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/common/Buttons';
import { PATH } from '@/routes/paths';

const HeroSection = forwardRef<HTMLElement>(function HeroSection(_, ref) {
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      aria-label="tryna 소개"
      className="relative w-full overflow-hidden"
    >
      <picture className="block w-full">
        <source
          media="(min-width: 1024px)"
          srcSet="/about/hero/desktop_hero.webp"
          width={1920}
          height={1124}
        />
        <img
          src="/about/hero/mobile_hero.webp"
          alt=""
          width={1366}
          height={1700}
          fetchPriority="high"
          decoding="async"
          className="block h-auto w-full"
        />
      </picture>

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[240px]">
        <div className="mx-auto w-full max-w-[1040px] px-5">
          <div className="flex flex-col items-start gap-[40px]">
            <div className="flex flex-col items-start gap-2 font-default text-text-white">
              <p className="text-landing-mobile-caption lg:text-landing-desktop-caption">
                가벼운 일상을 위한 캘린더
              </p>
              <h1 className="text-landing-mobile-heading-01 font-bold lg:text-landing-desktop-heading-01">
                일상의 작은 것들을
                <br />
                놓치지 않도록
              </h1>
            </div>

            <Button
              variant="LargeStrongFit"
              className="bg-grey-900/20 text-text-white backdrop-blur-sm hover:bg-grey-900/20"
              onClick={() => navigate(PATH.HOME)}
            >
              앱 사용해 보기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;

import { useNavigate } from 'react-router';

import { Button } from '@/components/common/Buttons';
import { PATH } from '@/routes/paths';

export default function EndingBannerSection() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="tryna 마무리 메시지"
      className="relative h-[652px] w-full overflow-hidden"
    >
      <img
        src="/about/ending/endingBannerBackground.webp"
        alt=""
        width={1440}
        height={652}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover object-center"
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1040px] items-end px-5 pb-[120px] lg:px-0">
        <div className="flex items-start justify-start gap-[40px]">
          <img
            src="/favicon.svg"
            alt=""
            width={148}
            height={148}
            loading="lazy"
            decoding="async"
            className="size-[148px] shrink-0"
          />

          <div className="flex flex-col items-start gap-[40px]">
            <h2 className="text-left font-default text-landing-mobile-heading-01 font-bold leading-[1.3] text-text-default lg:text-landing-desktop-heading-01">
              일상의 작은 일을
              <br />
              트라이나가 함께 기억할게요
            </h2>

            <Button
              variant="LargeStrongFit"
              className="rounded-full bg-black text-text-white hover:bg-black"
              onClick={() => navigate(PATH.HOME)}
            >
              트라이나 시작하기 →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

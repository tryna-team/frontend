export default function OverviewSection() {
  return (
    <section
      aria-label="tryna 서비스 개요"
      className="relative w-full overflow-hidden"
    >
      <img
        src="/about/overview/overviewBackground.webp"
        alt=""
        width={1440}
        height={2557}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover object-top"
      />

      <div className="relative w-full pb-[116px] pt-[200px]">
        <div className="mx-auto w-full max-w-[1040px] px-5 lg:px-0">
          <h2
            className="bg-clip-text text-center font-default leading-[1.3] text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(87deg, var(--color-text-default) 0%, var(--color-green-900) 100%)',
            }}
          >
            <span className="block text-landing-mobile-display font-light lg:text-landing-desktop-display">
              기억보다 중요한 건
            </span>
            <span className="block lg:whitespace-nowrap">
              <span className="text-landing-mobile-display font-bold lg:text-landing-desktop-display">
                오늘을 살아가는 일
              </span>
              <span className="text-landing-mobile-display font-light lg:text-landing-desktop-display">
                이니까
              </span>
            </span>
          </h2>

          <p className="mt-[60px] text-center font-default text-landing-mobile-body-01 leading-[1.6] text-grey-opacity-600 lg:text-landing-desktop-body-01">
            <span className="block">
              우리는 사람들이 더 많은 계획을 세우고 모든 일을 완벽하게 관리해야
              한다고 생각하지 않습니다.
            </span>
            <span className="block">
              중요한 순간에 필요한 것들을 덜 놓치고, 계속 신경 쓰지 않아도 되는
              일상.
            </span>
            <span className="block">
              tryna는 그런 하루를 돕는 캘린더를 만듭니다.
            </span>
          </p>
        </div>

        <picture className="mx-auto mt-[132px] block w-full max-w-[1280px]">
          <source
            media="(min-width: 1024px)"
            srcSet="/about/overview/overviewCard_desktop.webp"
            width={1280}
            height={823}
          />
          <img
            src="/about/overview/overviewCard_mobile.webp"
            alt=""
            width={390}
            height={1180}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </picture>

        <h2 className="mx-auto mt-[320px] w-full max-w-[1280px] px-5 text-center font-bold text-landing-mobile-heading-02 leading-[1.3] text-text-default lg:px-0 lg:text-landing-desktop-heading-02">
          마음을 놓고 여유로워지세요
          <br />
          트라이나가 잘 기억하고 챙겨드릴게요
        </h2>

        <img
          src="/icon/logo/primary_lockup.svg"
          alt="tryna"
          width={160}
          height={52}
          loading="lazy"
          decoding="async"
          className="mx-auto mt-[120px] block h-[106px] w-auto"
        />
      </div>
    </section>
  );
}

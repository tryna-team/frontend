import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { PATH } from '@/routes/paths';

const PHILOSOPHY_PHOTOS = [
  {
    src: '/landing/scene/lifestyle-05.jpg',
    alt: '노트와 노트북을 펼쳐 두고 발표를 준비하는 오후',
    caption: '발표를 준비하는 오후',
    size: 'lg:col-span-5',
  },
  {
    src: '/landing/scene/lifestyle-01.jpg',
    alt: '카페에서 노트북을 함께 보며 일정을 맞추는 사람들',
    caption: '함께 맞춰보는 일정',
    size: 'lg:col-span-7',
  },
  {
    src: '/landing/scene/lifestyle-03.jpg',
    alt: '따뜻한 조명 아래에서 노트북으로 일정을 정리하는 사람',
    caption: '조용히 이어지는 하루',
    size: 'lg:col-span-7',
  },
  {
    src: '/landing/scene/lifestyle-02.jpg',
    alt: '버스 정류장에서 다음 장소로 향할 준비를 하는 사람',
    caption: '다음 장소로 향하는 길',
    size: 'lg:col-span-5',
  },
] as const;

const HOW_ITEMS = [
  {
    label: 'HOW',
    title: '말하듯 적어요',
    body: '복잡한 입력창 없이 평소 사용하는 문장으로 일정을 기록합니다.',
  },
  {
    label: 'WHAT',
    title: '필요한 것을 제안받아요',
    body: '일정의 맥락을 이해하고 준비물과 해야 할 일을 먼저 제안합니다.',
  },
  {
    label: 'WHEN',
    title: '필요한 순간 다시 확인해요',
    body: '일정 전 적절한 시점에 준비와 행동을 함께 확인합니다.',
  },
] as const;

const CLOSING_PHOTOS = [
  {
    src: '/landing/product-stage-how.png',
    alt: '발표를 준비하는 노트북과 노트',
  },
  {
    src: '/landing/product-stage-what.png',
    alt: '현관에서 외출을 준비하는 사람과 가방',
  },
  {
    src: '/landing/product-stage-when.png',
    alt: '병원 대기실에서 차례를 기다리는 사람',
  },
] as const;

function CtaLink({
  children,
  variant = 'light',
}: {
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'outline';
}) {
  const variantClass = {
    light: 'border border-white text-white hover:bg-white hover:text-[#1c1630]',
    dark: 'bg-[#1c1630] text-white hover:bg-[#302842]',
    outline: 'border border-[#1c1630] bg-white text-[#1c1630] hover:bg-[#f6f5f8]',
  }[variant];

  return (
    <Link
      to={PATH.HOME}
      className={`inline-flex w-fit items-center gap-1 rounded-full px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${variantClass}`}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
    </Link>
  );
}

export default function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const previousLanguage = document.documentElement.lang;
    document.title = 'Tryna | 일상의 작은 것들을 놓치지 않도록';
    document.documentElement.lang = 'ko';

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLanguage;
    };
  }, []);

  return (
    <main className="w-full overflow-x-clip bg-white font-['Pretendard'] text-[#1c1630]">
      <a
        href="#landing-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-white px-4 py-2 font-semibold text-[#1c1630] shadow-lg transition-transform focus:translate-y-0"
      >
        본문으로 건너뛰기
      </a>

      <section
        className="relative isolate flex min-h-[760px] flex-col bg-[#17131f] text-white sm:min-h-[860px] lg:h-[1000px]"
        aria-labelledby="hero-title"
      >
        <img
          src="/landing/scene/lifestyle-03.jpg"
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover object-[62%_center]"
          width="1254"
          height="1254"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/25 to-[#100c19]/85" />

        <header className="mx-4 mt-5 flex h-[64px] items-center justify-between rounded-full bg-white px-5 sm:mx-8 sm:h-[72px] sm:px-10 lg:mx-10 lg:px-[160px]">
          <Link to={PATH.LANDING} aria-label="Tryna 홈">
            <img
              src="/icon/logo/primary_lockup.svg"
              alt="tryna"
              className="h-auto w-[88px] sm:w-[110px]"
              width="160"
              height="52"
            />
          </Link>
          <CtaLink variant="outline">시작하기</CtaLink>
        </header>

        <div
          id="landing-content"
          className="mx-auto mt-auto flex w-full max-w-[1080px] flex-col items-start px-6 pb-12 sm:px-10 sm:pb-16 lg:px-0 lg:pb-[60px]"
        >
          <p className="text-lg font-medium leading-[1.6] sm:text-2xl">
            가벼운 일상을 위한 캘린더
          </p>
          <h1 id="hero-title" className="mt-2 text-[42px] font-bold leading-[1.22] sm:text-6xl sm:leading-[1.3]">
            일상의 작은 것들을
            <br />
            놓치지 않도록
          </h1>
          <p className="mt-5 max-w-[700px] text-sm font-medium leading-6 text-white/80 sm:text-base sm:leading-[1.6]">
            Tryna는 일정과 준비할 일을 한곳에서 관리하는 생산성 캘린더입니다. 사용자가
            연결을 선택하면 Google Calendar의 일정을 읽기 전용으로 동기화해 함께 보여드립니다.
          </p>
          <div className="mt-8">
            <CtaLink>트라이나 사용해 보기</CtaLink>
          </div>
        </div>
      </section>

      <section className="flex min-h-[280px] items-center justify-center px-6 py-16" aria-label="놓치기 쉬운 준비">
        <p className="flex flex-wrap items-center justify-center gap-3 text-center text-[32px] font-bold leading-[1.3] sm:gap-5 sm:text-[48px] lg:text-[56px]">
          <span>여행 날짜는 기억했지만</span>
          <span className="rounded-full border-2 border-[#1c1630]/5 px-5 py-2 text-[#29c878] sm:px-7">
            온라인 체크인
          </span>
          <span>은?</span>
        </p>
      </section>

      <section
        className="bg-[radial-gradient(circle_at_10%_55%,#e3fdf0_0,transparent_35%),radial-gradient(circle_at_85%_80%,#ffeedf_0,transparent_38%),linear-gradient(180deg,#fff_0%,#f5fbff_55%,#fff_100%)] px-5 py-28 sm:px-10 lg:px-20 lg:py-[200px]"
        aria-labelledby="philosophy-title"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center">
            <h2
              id="philosophy-title"
              className="bg-gradient-to-r from-[#1c1630] to-[#022e18] bg-clip-text text-[48px] font-light leading-[1.2] text-transparent sm:text-7xl lg:text-[100px] lg:leading-[1.3]"
            >
              기억보다 중요한 건
              <br />
              <strong className="font-bold">오늘을 살아가는 일</strong>이니까
            </h2>
            <p className="mx-auto mt-10 max-w-[1000px] text-base font-semibold leading-[1.7] text-[#1c1630]/70 sm:text-xl lg:mt-[60px]">
              우리는 사람들이 더 많은 계획을 세우고 모든 일을 완벽하게 관리해야 한다고 생각하지
              않습니다.
              <br className="hidden lg:block" /> 중요한 순간에 필요한 것들을 덜 놓치고, 계속 신경 쓰지
              않아도 되는 일상.
              <br className="hidden lg:block" /> tryna는 그런 하루를 돕는 캘린더를 만듭니다.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-[132px] lg:grid-cols-12">
            {PHILOSOPHY_PHOTOS.map((photo) => (
              <figure
                key={photo.caption}
                className={`group relative h-[320px] overflow-hidden rounded-3xl sm:h-[400px] ${photo.size}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  width="1254"
                  height="1254"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                <figcaption className="absolute bottom-6 left-6 text-base text-white/90">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-40 flex flex-col items-center text-center lg:mt-80">
            <p className="text-[32px] font-bold leading-[1.3] sm:text-[40px]">
              마음을 놓고 여유로워지세요
              <br />
              트라이나가 잘 기억하고 챙겨드릴게요
            </p>
            <img
              src="/icon/logo/primary_lockup.svg"
              alt="tryna"
              className="mt-20 h-auto w-[240px] sm:mt-[120px] sm:w-[333px]"
              width="160"
              height="52"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbff] px-6 pt-24 sm:px-10 lg:h-[860px] lg:px-20 lg:pt-[120px]" aria-labelledby="product-title">
        <div className="mx-auto grid max-w-[1080px] items-start gap-12 lg:grid-cols-[482px_1fr] lg:gap-[68px]">
          <img
            src="/landing/phone-stage.png"
            alt="일정 맥락에 맞는 준비물을 제안하는 Tryna 모바일 화면"
            className="mx-auto h-auto w-full max-w-[482px] self-end lg:h-[680px] lg:object-cover lg:object-top"
            width="813"
            height="860"
            loading="lazy"
            decoding="async"
          />
          <div className="pt-0 lg:pt-[100px]">
            <p className="text-xl font-bold text-[#29c878]">트라이나와 함께라면</p>
            <h2 id="product-title" className="mt-4 text-[44px] font-bold leading-[1.25] sm:text-[56px] sm:leading-[1.3]">
              따로 정리하지 않아도
            </h2>
            <p className="mt-6 max-w-[488px] text-lg font-semibold leading-[1.6] text-[#1c1630]/60 sm:text-xl">
              일정과 준비물을 여러 앱에 나누어 적는 번거로운 과정을 줄이고 트라이나 하나만으로
              관리해요.
            </p>
            <div className="mt-10 flex gap-2" aria-hidden="true">
              <span className="h-2 w-6 rounded-full bg-[#1c1630]" />
              <span className="size-2 rounded-full bg-[#1c1630]/20" />
              <span className="size-2 rounded-full bg-[#1c1630]/20" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pt-28 lg:pt-[200px]" aria-labelledby="how-title">
        <div className="mx-auto max-w-[1080px] px-6 sm:px-10 lg:px-0">
          <h2
            id="how-title"
            className="bg-gradient-to-r from-[#1c1630] to-[#022e18] bg-clip-text text-[48px] font-light leading-[1.2] text-transparent sm:text-7xl lg:text-[100px] lg:leading-[1.3]"
          >
            일정 하나만 적었는데,
            <br />
            <strong className="font-bold">준비할 일이 함께 정리</strong>됩니다.
          </h2>

          <div className="mt-24 grid gap-8 md:grid-cols-3 lg:mt-40 lg:gap-5">
            {HOW_ITEMS.map((item) => (
              <div key={item.label} className="relative pt-12">
                <span className="absolute left-8 top-0 bg-gradient-to-b from-[#32e089] to-white/40 bg-clip-text text-[48px] font-bold leading-[1.3] text-transparent sm:text-[56px]">
                  {item.label}
                </span>
                <article className="relative min-h-[151px] rounded-2xl bg-white px-8 py-7 shadow-[0_0_20px_rgba(0,0,0,0.08)]">
                  <h3 className="text-2xl font-bold leading-[1.3]">{item.title}</h3>
                  <p className="mt-3 text-base font-semibold leading-[1.6] text-[#1c1630]/60">
                    {item.body}
                  </p>
                </article>
              </div>
            ))}
          </div>

          <p className="mt-40 text-center text-[32px] font-bold leading-[1.3] sm:text-[40px] lg:mt-60">
            기억해야 할 것이 줄어들면
            <br />
            나의 하루도 조금 가벼워집니다
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 lg:mt-[207px]">
          {CLOSING_PHOTOS.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              className="aspect-square size-full object-cover"
              width="480"
              height="480"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </section>

      <section
        className="flex min-h-[560px] items-end bg-[radial-gradient(circle_at_35%_30%,#e2effd_0,transparent_33%),linear-gradient(125deg,#ffeedf_0%,#fff_45%,#e3fdf0_100%)] px-6 py-16 sm:px-10 lg:min-h-[652px] lg:px-[180px] lg:pb-[60px]"
        aria-labelledby="final-cta-title"
      >
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
          <img
            src="/favicon.svg"
            alt=""
            className="size-[104px] rounded-[34px] sm:size-[148px] sm:rounded-[48px]"
            width="512"
            height="512"
            loading="lazy"
          />
          <div>
            <h2 id="final-cta-title" className="text-[40px] font-bold leading-[1.25] sm:text-[56px] sm:leading-[1.3]">
              일상의 작은 일은
              <br />
              트라이나가 함께 기억할게요.
            </h2>
            <div className="mt-8 sm:mt-10">
              <CtaLink variant="dark">tryna 시작하기</CtaLink>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#1c1630]/[0.02] px-6 py-12 sm:px-10 lg:min-h-[210px] lg:px-[100px]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <img
            src="/icon/logo/primary_lockup.svg"
            alt="tryna"
            className="h-auto w-[132px] sm:w-[165px]"
            width="160"
            height="52"
          />
          <div className="flex flex-col gap-5 text-sm font-medium text-[#1c1630]/60 lg:items-end">
            <nav aria-label="정책 및 문의" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link className="underline-offset-4 hover:text-[#1c1630] hover:underline" to={PATH.TERMS}>
                서비스 이용약관
              </Link>
              <Link className="underline-offset-4 hover:text-[#1c1630] hover:underline" to={PATH.PRIVACY}>
                개인정보 처리방침
              </Link>
              <a
                className="underline-offset-4 hover:text-[#1c1630] hover:underline"
                href="mailto:tryingtotryna@gmail.com"
              >
                문의: tryingtotryna@gmail.com
              </a>
            </nav>
            <p>일상의 작은 것들을 놓치지 않도록.</p>
            <p>© 2026 tryna. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

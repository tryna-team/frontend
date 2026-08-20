import { forwardRef } from 'react';
import { Link } from 'react-router';

import { PATH } from '@/routes/paths';

const INSTAGRAM_URL =
  'https://www.instagram.com/tryna.studio/?utm_source=ig_web_button_share_sheet';

const AboutFooter = forwardRef<HTMLElement>(function AboutFooter(_, ref) {
  return (
    <footer ref={ref} className="min-h-[392px] w-full bg-grey-900">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-[64px] px-5 py-[72px] lg:flex-row lg:justify-between lg:gap-[80px] lg:py-[80px]">
        <div className="flex min-w-0 flex-col gap-[40px]">
          <nav
            aria-label="푸터 메뉴"
            className="flex flex-wrap gap-x-[64px] gap-y-[40px]"
          >
            <div className="flex min-w-[112px] flex-col items-start gap-[12px]">
              <h2 className="default-body-strong-medium text-text-white">
                서비스
              </h2>
              <a
                href="#about-top"
                className="default-body-small text-white-opacity transition-colors hover:text-text-white"
              >
                트라이나 소개
              </a>
              <Link
                to={PATH.HOME}
                className="default-body-small text-white-opacity transition-colors hover:text-text-white"
              >
                앱 사용해 보기
              </Link>
            </div>

            <div className="flex min-w-[112px] flex-col items-start gap-[12px]">
              <h2 className="default-body-strong-medium text-text-white">
                소셜
              </h2>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="default-body-small text-white-opacity transition-colors hover:text-text-white"
              >
                Instagram
              </a>
            </div>

            <div className="flex min-w-[112px] flex-col items-start gap-[12px]">
              <h2 className="default-body-strong-medium text-text-white">
                정책
              </h2>
              <Link
                to={PATH.TERMS}
                className="default-body-small text-white-opacity transition-colors hover:text-text-white"
              >
                서비스 이용약관
              </Link>
              <Link
                to={PATH.PRIVACY}
                className="default-body-small text-white-opacity transition-colors hover:text-text-white"
              >
                개인정보 처리방침
              </Link>
            </div>
          </nav>

          <div className="flex max-w-[560px] flex-col items-start gap-2">
            <p className="default-body-small text-grey-300">
              tryna는 Google Calendar의 기존 일정을 불러와 동기화하기 위해
              캘린더 읽기 전용 권한을 사용하며, Google API Services 사용자 데이터
              정책을 포함한{' '}
              <Link
                to={PATH.GOOGLE_CALENDAR_POLICY}
                className="font-semibold text-grey-200 underline decoration-1 underline-offset-[3px] transition-colors hover:text-text-white"
              >
                관련 정책
              </Link>
              을 따릅니다.
            </p>
            <a
              href="mailto:tryingtotryna@gmail.com"
              className="default-body-small text-grey-300 transition-colors hover:text-text-white"
            >
              문의: tryingtotryna@gmail.com
            </a>
          </div>
        </div>

        <div className="flex max-w-[320px] shrink-0 flex-col items-start">
          <p className="brand-heading-medium text-text-white">tryna</p>
          <p className="mt-[24px] default-body-small text-white-opacity">
            일상의 작은 것들을 놓치지 않도록.
          </p>
          <p className="mt-[24px] default-caption-large text-white-opacity">
            © 2026 tryna. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

export default AboutFooter;

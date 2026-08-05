import { useState, type ReactNode } from 'react';

import AppRouter from '@/routes/AppRouter';
import { FloatingButtonsContext } from '@/hooks/useFloatingButtons';

import './App.css';

// FloatingButtons 하단 여백: 기본 16px, 홈 인디케이터가 있는 기기에서는 그만큼(env)으로 확대
const FLOATING_BOTTOM_PADDING = 'max(16px,env(safe-area-inset-bottom))';

function App() {
  const [floatingContent, setFloatingContent] = useState<ReactNode>(null);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1200px] items-start justify-center lg:gap-[24px]">
      <aside className="sticky top-0 hidden h-[100dvh] w-[min(360px,calc(100vw-426px))] shrink-0 flex-col items-start pt-[200px] lg:flex">
        <img
          src="/intro/cover.png"
          alt="tryna"
          className="h-auto max-h-[560px] w-full object-contain"
        />

        <div className="mt-[24px] flex w-full items-top justify-between gap-[20px]">
          <p className="text-[18px] leading-[1.5] font-semibold text-foreground">
            인스타그램 팔로우하고
            <br />
            다이어리·캘린더 경품
            <br />
            받아가세요!
            <br/>
            <br/>
            tryna.studio
          </p>

          <a
            href="https://www.instagram.com/tryna.studio/?utm_source=ig_web_button_share_sheet"
            target="_blank"
            rel="noreferrer"
            aria-label="트라이나 인스타그램 새 탭에서 열기"
            className="shrink-0"
          >
            <img
              src="/intro/instarQR.png"
              alt="트라이나 인스타그램 QR 코드"
              className="h-[140px] w-[140px] object-contain"
            />
          </a>
        </div>
      </aside>

      {/* 공통 테스트 화면 크기
          width : 390 ~ 402px
          height: 최소 840px, 콘텐츠에 따라 자동 증가(뷰포트가 더 크면 뷰포트 기준)

          transform-gpu: 하위 fixed 요소가 브라우저 뷰포트가 아닌
          앱 프레임을 기준으로 위치하도록 유지. */}
      <div className="flex min-h-[100dvh] w-full min-w-[390px] max-w-[402px] transform-gpu flex-col bg-background md:min-h-[max(840px,100dvh)] lg:shrink-0">
        <FloatingButtonsContext.Provider value={setFloatingContent}>
          {/* Main: 스크롤 콘텐츠 영역. FloatingButtons가 떠 있을 땐 그 높이만큼 하단 여백 예약 */}
          <div className={floatingContent ? 'flex-1 main-floating-padding' : 'flex-1'}>
            <AppRouter />
          </div>

          {/* FloatingButtons: 화면 스크롤과 무관하게 항상 같은 위치. 등록된 콘텐츠 없으면 렌더 안 함 */}
          {floatingContent && (
            <div
              className="fixed bottom-0 left-1/2 z-10 flex h-[82px] w-[min(402px,100vw)] -translate-x-1/2 items-center justify-center bg-background px-4"
              style={{ paddingBottom: FLOATING_BOTTOM_PADDING }}
            >
              {floatingContent}
            </div>
          )}
        </FloatingButtonsContext.Provider>
      </div>
    </div>
  );
}

export default App;

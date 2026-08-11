import { useState, type ReactNode } from 'react';

import { WebIntro } from '@/components/common/WebIntro';
import AppRouter from '@/routes/AppRouter';
import GlobalBottomSheet from '@/components/common/Popup/GlobalBottomSheet';
import GlobalSettings from '@/components/common/Popup/GlobalSettings';
import { FloatingButtonsContext } from '@/hooks/useFloatingButtons';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAutoSyncExternalCalendar } from '@/hooks/queries/useExternalCalendar';
import { useCalendarStore } from '@/stores';
import SplashScreen from '@/pages/Splash/SplashScreen';

import './App.css';

// FloatingButtons 하단 여백: 기본 16px, 홈 인디케이터가 있는 기기에서는 그만큼(env)으로 확대
const FLOATING_BOTTOM_PADDING = 'max(16px,env(safe-area-inset-bottom))';

function App() {
  const [floatingContent, setFloatingContent] = useState<ReactNode>(null);
  // 앱 진입 상태 확인(A101). 유효한 토큰이 없으면 내부에서 비회원 생성(A102)까지 끝낸다.
  // Splash 라우트가 아니라 여기서 부트스트랩하는 이유: /home, /daily/:date 등으로 직접
  // 진입하거나 새로고침하면 Splash를 거치지 않아 토큰 없이 API가 나가게 된다.
  const { isPending: isBootstrapping } = useAppBootstrap();

  // 외부 캘린더 자동 동기화. 앱 진입·연도 이동·백그라운드 복귀 때 구글 일정을 다시 적재한다.
  // 화면이 아니라 여기에 두는 이유는, 복귀 시점에 사용자가 어느 화면에 있든 동작해야 하기
  // 때문이다. 비회원·미연동이면 훅 내부에서 아무것도 하지 않는다.
  const currentYear = useCalendarStore((state) => state.currentYear);
  useAutoSyncExternalCalendar(currentYear);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1200px] items-start justify-center lg:gap-[24px]">
      <WebIntro />

      {/* 공통 테스트 화면 크기
          width : 390 ~ 402px
          height: 최소 840px, 콘텐츠에 따라 자동 증가(뷰포트가 더 크면 뷰포트 기준)

          transform-gpu: 하위 fixed 요소가 브라우저 뷰포트가 아닌
          앱 프레임을 기준으로 위치하도록 유지. */}
      <div className="flex min-h-[100dvh] w-full min-w-[390px] max-w-[402px] transform-gpu flex-col bg-background md:min-h-[max(840px,100dvh)] lg:shrink-0">
        <FloatingButtonsContext.Provider value={setFloatingContent}>
          {/* Main: 스크롤 콘텐츠 영역. FloatingButtons가 떠 있을 땐 그 높이만큼 하단 여백 예약 */}
          <div className={floatingContent ? 'flex-1 main-floating-padding' : 'flex-1'}>
            {/* 토큰이 준비되기 전에 화면 API가 나가면 전부 401이 되므로, 부트스트랩이
                끝날 때까지는 스플래시 화면을 유지한다 (실패해도 진입은 막지 않음) */}
            {isBootstrapping ? <SplashScreen /> : <AppRouter />}
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

          {/* 전역 바텀시트: 어느 화면에서 열든 여기 한 곳에서만 렌더링된다.
              이 앱 프레임 안에 둬야 fixed inset-0이 전체 화면이 아닌 프레임 기준으로 잡힌다 */}
          <GlobalSettings />
          <GlobalBottomSheet />
        </FloatingButtonsContext.Provider>
      </div>
    </div>
  );
}

export default App;

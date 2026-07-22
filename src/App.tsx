import { useState, type ReactNode } from 'react';

import AppRouter from '@/routes/AppRouter';
import { FloatingButtonsContext } from '@/hooks/useFloatingButtons';

import './App.css';

// FloatingButtons 하단 여백: 기본 16px, 홈 인디케이터가 있는 기기에서는 그만큼(env)으로 확대
const FLOATING_BOTTOM_PADDING = 'max(16px,env(safe-area-inset-bottom))';

function App() {
  const [floatingContent, setFloatingContent] = useState<ReactNode>(null);

  return (
    // 공통 테스트 화면 크기
    // width : 390 ~ 402px
    // height: 최소 840px, 콘텐츠에 따라 자동 증가(뷰포트가 더 크면 뷰포트 기준)
    <div className="mx-auto flex min-h-[max(840px,100dvh)] w-full min-w-[390px] max-w-[402px] flex-col bg-background">
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
  );
}

export default App;

import AppRouter from '@/routes/AppRouter';

import './App.css';

function App() {
  return (
    // 공통 테스트 화면 크기
    // width : 390 ~ 402px
    // height: 최소 840px, 콘텐츠에 따라 자동 증가
    //
    // transform-gpu: 시각적으로는 변화 없음(translateZ(0) 항등 변환). 이 프레임에
    // transform을 걸어두면 CSS 스펙상 하위의 position:fixed 요소가 실제 브라우저
    // 뷰포트가 아니라 이 프레임을 기준으로 위치를 잡게 됨 — BottomSheet/ToastPopup처럼
    // fixed inset-0을 쓰는 오버레이가 전체 화면이 아니라 이 앱 프레임(390~402px) 폭
    // 안에서만 뜨도록 하기 위한 의도적인 처리.
    <div className="mx-auto min-h-[840px] w-full min-w-[390px] max-w-[402px] transform-gpu bg-background">
      <AppRouter />
    </div>
  );
}

export default App;

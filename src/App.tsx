import './App.css';
// 임시: EventViewPage 미리보기용 (라우팅 미연결, 확인 후 되돌릴 예정)
import EventViewPage from '@/pages/EventView/EventViewPage';

function App() {
  return (
    // 공통 테스트 화면 크기
    // width : 390 ~ 402px
    // height: 최소 840px, 콘텐츠에 따라 자동 증가
    <div className="mx-auto min-h-[840px] w-full min-w-[390px] max-w-[402px] bg-background">
      <EventViewPage />
    </div>
  );
}

export default App;

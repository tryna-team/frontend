import './App.css';
// 수정: EventViewPage 미리보기용 임시 import (라우팅 미연결, 확인 후 되돌릴 예정)
import EventViewPage from '@/pages/EventView/EventViewPage';

function App() {
  // 수정: 원래 <></> 였음 — EventViewPage 확인을 위해 임시로 교체
  return <EventViewPage />;
}

export default App;

import './App.css';

function App() {
  return (
    // 공통 테스트 화면 크기
    // width : 390 ~ 402px
    // height: 최소 840px, 콘텐츠에 따라 자동 증가
    <div className="mx-auto min-h-[840px] w-full min-w-[390px] max-w-[402px] bg-background"></div>
  );
}

export default App;
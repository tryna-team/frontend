import './SplashPage.css';

/**
 * 스플래시 로고 화면(표시 전용).
 *
 * SplashPage('/' 라우트)와 App의 부트스트랩 대기 화면이 같은 마크업을 쓰기 위해 분리했다.
 * 둘의 렌더 결과가 동일해야 부트스트랩 완료 시점에 로고가 깜빡이지 않는다.
 */
function SplashScreen() {
  return (
    <div className="splash-page">
      <img
        src="/icon/logo/primary_lockup.svg"
        alt="tryna"
        className="splash-page-logo"
      />
    </div>
  );
}

export default SplashScreen;

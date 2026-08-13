import './SplashPage.css';

/**
 * 스플래시 로고 화면(표시 전용).
 *
 * App의 부트스트랩 대기 중 같은 스플래시 화면을 재사용하기 위해 분리했다.
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

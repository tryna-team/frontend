import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import SplashScreen from '@/pages/Splash/SplashScreen';
import { PATH } from '@/routes/paths';

// splash 표시 시간
// 앱 진입 부트스트랩(A101/A102)은 App에서 이 화면이 마운트되기 전에 이미 끝나므로,
// 여기서는 토큰 상태를 신경 쓰지 않고 로고 노출 시간만 관리하면 된다.
const SPLASH_DURATION = 1500;

function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Splash가 브라우저 방문 기록에 남지 않도록 홈 경로 교체
    const timer = window.setTimeout(() => {
      navigate(PATH.HOME, {
        replace: true,
      });
    }, SPLASH_DURATION);

    // 화면이 먼저 사라지면 예약된 이동을 취소
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return <SplashScreen />;
}

export default SplashPage;

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { PATH } from '@/routes/paths';

import './SplashPage.css';

// splash 표시 시간
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

export default SplashPage;

import { lazy, Suspense, useState } from 'react';

import Header from '@/components/common/Header/Header';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import SettingsMainView from '@/features/settings/components/views/SettingsMainView';
import { useUIStore } from '@/stores/uiStore';

const TermsOfUseView = lazy(
  () => import('@/features/settings/components/views/TermsOfUseView'),
);
const PrivacyPolicyView = lazy(
  () => import('@/features/settings/components/views/PrivacyPolicyView'),
);

type SettingsSheetProps = {
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  // 비회원이면 "계정 관리" 영역이 로그아웃/회원탈퇴 대신 "Google로 시작하기" 버튼으로 바뀐다
  // (피그마 "1-10. 설정/비회원" 참고)
  isMember: boolean;
};

// 접근 > 알림 토글의 초기값 — 아직 연결할 설정/API가 없어 UI만 구현(요청 확인 사항)
const INITIAL_NOTIFICATION_ENABLED = true;

type SettingsView = 'main' | 'terms-of-use' | 'privacy-policy';

const VIEW_TITLE: Record<SettingsView, string> = {
  main: '설정',
  'terms-of-use': '서비스 이용약관',
  'privacy-policy': '개인정보 처리방침',
};

// 피그마 "1-10. 설정"
export default function SettingsSheet({
  onClose,
  onLogout,
  onDeleteAccount,
  isMember,
}: SettingsSheetProps) {
  // "접근 > 알림" 토글 — 연결할 설정 상태/API가 아직 없어 이번엔 UI만 구현한다
  // (값을 바꿔도 저장되지 않고, 시트를 다시 열면 기본값으로 초기화됨).
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    INITIAL_NOTIFICATION_ENABLED,
  );
  const [activeView, setActiveView] = useState<SettingsView>('main');
  const isDirty = isNotificationEnabled !== INITIAL_NOTIFICATION_ENABLED;
  const isMainView = activeView === 'main';

  // 이미 구축된 전역 로그인 흐름(GlobalBottomSheet의 4-1-1)을 그대로 연다 — uiStore 설계
  // 노트대로 "여는 쪽은 openBottomSheet만 호출"하면 되고, 로그인 진행/에러 토스트 등은
  // 전부 GlobalBottomSheet가 이미 처리한다.
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      {/* 피그마 프레임 높이 비율(788/852 ≈ 92%)에 맞춰 고정 — 콘텐츠 아래 빈 공간 포함 */}
      <Frame className="h-[92dvh] gap-6 p-4">
        <Header
          variant="modal"
          title={VIEW_TITLE[activeView]}
          leading={
            isMainView
              ? { type: 'none' }
              : { type: 'icon', onClick: () => setActiveView('main') }
          }
          trailing={{
            // 변경 사항이 있으면 "닫기"가 "완료"로 바뀐다(실제 저장할 API는 없어 동작은 onClose와 동일)
            type: 'text',
            text: isMainView && isDirty ? '완료' : '닫기',
            onClick: onClose,
          }}
        />

        {activeView === 'main' && (
          <SettingsMainView
            isMember={isMember}
            isNotificationEnabled={isNotificationEnabled}
            onNotificationToggle={() => setIsNotificationEnabled((previous) => !previous)}
            onLogin={() => openBottomSheet('login')}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
            onTermsOfUseOpen={() => setActiveView('terms-of-use')}
            onPrivacyPolicyOpen={() => setActiveView('privacy-policy')}
          />
        )}

        {!isMainView && (
          <Suspense
            fallback={
              <div className="flex min-h-0 w-full flex-1 items-center justify-center default-body-medium text-text-additional">
                문서를 불러오는 중...
              </div>
            }
          >
            {activeView === 'terms-of-use' && <TermsOfUseView />}
            {activeView === 'privacy-policy' && <PrivacyPolicyView />}
          </Suspense>
        )}
      </Frame>
    </Overlay>
  );
}

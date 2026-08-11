import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import Setting from '@/components/common/Popup/BottomSheet/Setting';
import QuickModal from '@/components/common/Popup/QuickModal';
import { useAccountActions } from '@/hooks/useAccountActions';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function GlobalSettings() {
  const location = useLocation();
  const previousLocationKeyRef = useRef(location.key);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const accountConfirm = useUIStore((state) => state.settingsAccountConfirm);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const requestAccountConfirm = useUIStore((state) => state.requestSettingsAccountConfirm);
  const closeAccountConfirm = useUIStore((state) => state.closeSettingsAccountConfirm);
  const isMember = useAuthStore((state) => state.userRole) === 'USER';
  const { logout, deleteAccount, isPending } = useAccountActions();
  useEffect(() => {
    if (previousLocationKeyRef.current === location.key) {
      return;
    }

    previousLocationKeyRef.current = location.key;

    if (isSettingsOpen) {
      closeSettings();
    }
  }, [closeSettings, isSettingsOpen, location.key]);

  if (!isSettingsOpen) {
    return null;
  }

  return (
    <>
      <Setting
        isMember={isMember}
        onClose={closeSettings}
        onOpenTerms={() => console.log('이용 약관(연동 예정)')}
        onOpenPrivacy={() => console.log('개인정보 처리 방침(연동 예정)')}
        onLogout={() => {
          if (!isMember || isPending) return;
          requestAccountConfirm('logout');
        }}
        onDeleteAccount={() => {
          if (!isMember || isPending) return;
          requestAccountConfirm('delete');
        }}
      />

      {accountConfirm === 'logout' && (
        <QuickModal
          message="로그아웃 하시겠습니까?"
          primaryAction={{
            text: '로그아웃',
            onClick: () => {
              closeAccountConfirm();
              void logout();
            },
          }}
          onClose={closeAccountConfirm}
        />
      )}

      {accountConfirm === 'delete' && (
        <QuickModal
          message="회원탈퇴 하시겠습니까?"
          primaryAction={{
            text: '회원탈퇴',
            onClick: () => {
              closeAccountConfirm();
              void deleteAccount().catch((error: unknown) => {
                console.error('회원탈퇴에 실패했습니다.', error);
              });
            },
          }}
          onClose={closeAccountConfirm}
        />
      )}
    </>
  );
}

export default GlobalSettings;

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
  const isAccountActionLockedRef = useRef(false);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const accountConfirm = useUIStore((state) => state.settingsAccountConfirm);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const requestAccountConfirm = useUIStore((state) => state.requestSettingsAccountConfirm);
  const closeAccountConfirm = useUIStore((state) => state.closeSettingsAccountConfirm);
  const isMember = useAuthStore((state) => state.userRole) === 'USER';
  const { logout, deleteAccount, isPending } = useAccountActions();

  const runAccountAction = (action: () => Promise<void>, failureMessage: string) => {
    if (isPending || isAccountActionLockedRef.current) {
      return;
    }

    isAccountActionLockedRef.current = true;
    closeAccountConfirm();

    void action()
      .catch((error: unknown) => {
        console.error(failureMessage, error);
      })
      .finally(() => {
        isAccountActionLockedRef.current = false;
      });
  };

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
            onClick: () => runAccountAction(logout, '로그아웃에 실패했습니다.'),
          }}
          onClose={closeAccountConfirm}
        />
      )}

      {accountConfirm === 'delete' && (
        <QuickModal
          message="회원탈퇴 하시겠습니까?"
          primaryAction={{
            text: '회원탈퇴',
            onClick: () => runAccountAction(deleteAccount, '회원탈퇴에 실패했습니다.'),
          }}
          onClose={closeAccountConfirm}
        />
      )}
    </>
  );
}

export default GlobalSettings;

import ActionRow from '@/components/common/ActionRow/ActionRow';
import Button from '@/components/common/Buttons/Button';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';

type SettingsMainViewProps = {
  isMember: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onTermsOfUseOpen: () => void;
  onPrivacyPolicyOpen: () => void;
};

export default function SettingsMainView({
  isMember,
  onLogin,
  onLogout,
  onDeleteAccount,
  onTermsOfUseOpen,
  onPrivacyPolicyOpen,
}: SettingsMainViewProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <ContentBox title="접근" variant="default">
        <ActionRow
          leading={{ type: 'text', text: '알림' }}
          accessory={{
            type: 'toggle',
            checked: false,
            disabled: true,
            ariaLabel: '알림 설정 준비 중',
          }}
        />
      </ContentBox>

      <ContentBox title="이용약관" variant="default">
        <ActionRow
          leading={{ type: 'text', text: '서비스 이용약관' }}
          accessory={{
            type: 'chevron',
            ariaLabel: '서비스 이용약관 보기',
            onClick: onTermsOfUseOpen,
          }}
          onClick={onTermsOfUseOpen}
        />
        <ActionRow
          leading={{ type: 'text', text: '개인정보 처리방침' }}
          accessory={{
            type: 'chevron',
            ariaLabel: '개인정보 처리방침 보기',
            onClick: onPrivacyPolicyOpen,
          }}
          onClick={onPrivacyPolicyOpen}
        />
      </ContentBox>

      <ContentBox title="계정 관리" variant="bottom">
        {isMember ? (
          <>
            <ActionRow leading={{ type: 'text', text: '로그아웃' }} onClick={onLogout} />
            <ActionRow
              leading={{ type: 'text', text: '회원탈퇴', tone: 'danger' }}
              onClick={onDeleteAccount}
            />
          </>
        ) : (
          <Button variant="LargeStrongRegular" className="w-full gap-small" onClick={onLogin}>
            <img src="/icon/google.svg" alt="" className="size-5 shrink-0" />
            Google로 시작하기
          </Button>
        )}
      </ContentBox>
    </div>
  );
}

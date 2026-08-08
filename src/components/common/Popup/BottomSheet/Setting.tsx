import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import ActionRow from '@/components/common/ActionRow/ActionRow';

type SettingProps = {
  onClose: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
};

// 피그마 "1-10. 설정"
export default function Setting({
  onClose,
  onOpenTerms,
  onOpenPrivacy,
  onLogout,
  onDeleteAccount,
}: SettingProps) {
  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      {/* 피그마 프레임 높이 비율(788/852 ≈ 92%)에 맞춰 고정 — 콘텐츠 아래 빈 공간 포함 */}
      <Frame className="h-[92dvh] gap-6 p-4">
        <Header
          variant="modal"
          title="설정"
          leading={{ type: 'none' }}
          trailing={{ type: 'text', text: '닫기', onClick: onClose }}
        />

        <ContentBox title="이용 약관" variant="default">
          <ActionRow
            leading={{ type: 'text', text: '서비스 이용 약관' }}
            accessory={{ type: 'chevron' }}
            onClick={onOpenTerms}
          />
          <ActionRow
            leading={{ type: 'text', text: '개인정보 처리 방침' }}
            accessory={{ type: 'chevron' }}
            onClick={onOpenPrivacy}
          />
        </ContentBox>

        <ContentBox title="계정 관리" variant="bottom">
          {/* 피그마상 오른쪽 chevron 없음 → accessory 생략 */}
          <ActionRow
            leading={{ type: 'text', text: '로그아웃' }}
            onClick={onLogout}
          />
          <ActionRow
            leading={{ type: 'text', text: '회원탈퇴', tone: 'danger' }}
            onClick={onDeleteAccount}
          />
        </ContentBox>
      </Frame>
    </Overlay>
  );
}

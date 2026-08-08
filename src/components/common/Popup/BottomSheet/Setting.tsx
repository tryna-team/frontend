import { useState } from 'react';

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

// 접근 > 알림 토글의 초기값 — 아직 연결할 설정/API가 없어 UI만 구현(요청 확인 사항)
const INITIAL_NOTIFICATION_ENABLED = true;

// 피그마 "1-10. 설정"
export default function Setting({
  onClose,
  onOpenTerms,
  onOpenPrivacy,
  onLogout,
  onDeleteAccount,
}: SettingProps) {
  // "접근 > 알림" 토글 — 연결할 설정 상태/API가 아직 없어 이번엔 UI만 구현한다
  // (값을 바꿔도 저장되지 않고, 시트를 다시 열면 기본값으로 초기화됨).
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    INITIAL_NOTIFICATION_ENABLED,
  );
  const isDirty = isNotificationEnabled !== INITIAL_NOTIFICATION_ENABLED;

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      {/* 피그마 프레임 높이 비율(788/852 ≈ 92%)에 맞춰 고정 — 콘텐츠 아래 빈 공간 포함 */}
      <Frame className="h-[92dvh] gap-6 p-4">
        <Header
          variant="modal"
          title="설정"
          leading={{ type: 'none' }}
          trailing={{
            // 변경 사항이 있으면 "닫기"가 "완료"로 바뀐다(실제 저장할 API는 없어 동작은 onClose와 동일)
            type: 'text',
            text: isDirty ? '완료' : '닫기',
            onClick: onClose,
          }}
        />

        <ContentBox title="접근" variant="default">
          <ActionRow
            leading={{ type: 'text', text: '알림' }}
            accessory={{
              type: 'toggle',
              checked: isNotificationEnabled,
              onClick: () => setIsNotificationEnabled((prev) => !prev),
            }}
          />
        </ContentBox>

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

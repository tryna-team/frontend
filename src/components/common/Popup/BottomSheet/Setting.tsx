import { useState } from 'react';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import ActionRow from '@/components/common/ActionRow/ActionRow';
import Button from '@/components/common/Buttons/Button';
import { useUIStore } from '@/stores/uiStore';

type SettingProps = {
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  // 비회원이면 "계정 관리" 영역이 로그아웃/회원탈퇴 대신 "Google로 시작하기" 버튼으로 바뀐다
  // (피그마 "1-10. 설정/비회원" 참고)
  isMember: boolean;
};

// 접근 > 알림 토글의 초기값 — 아직 연결할 설정/API가 없어 UI만 구현(요청 확인 사항)
const INITIAL_NOTIFICATION_ENABLED = true;

// 피그마 "1-10. 설정"
export default function Setting({ onClose, onLogout, onDeleteAccount, isMember }: SettingProps) {
  // "접근 > 알림" 토글 — 연결할 설정 상태/API가 아직 없어 이번엔 UI만 구현한다
  // (값을 바꿔도 저장되지 않고, 시트를 다시 열면 기본값으로 초기화됨).
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(INITIAL_NOTIFICATION_ENABLED);
  const isDirty = isNotificationEnabled !== INITIAL_NOTIFICATION_ENABLED;

  // 이미 구축된 전역 로그인 흐름(GlobalBottomSheet의 4-1-1)을 그대로 연다 — uiStore 설계
  // 노트대로 "여는 쪽은 openBottomSheet만 호출"하면 되고, 로그인 진행/에러 토스트 등은
  // 전부 GlobalBottomSheet가 이미 처리한다.
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);

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

        <ContentBox title="계정 관리" variant="bottom">
          {isMember ? (
            // 피그마상 오른쪽 chevron 없음 → accessory 생략
            <>
              <ActionRow leading={{ type: 'text', text: '로그아웃' }} onClick={onLogout} />
              <ActionRow
                leading={{ type: 'text', text: '회원탈퇴', tone: 'danger' }}
                onClick={onDeleteAccount}
              />
            </>
          ) : (
            <Button
              variant="LargeStrongRegular"
              className="w-full gap-small"
              onClick={() => openBottomSheet('login')}
            >
              <img src="/icon/google.svg" alt="" className="size-5 shrink-0" />
              Google로 시작하기
            </Button>
          )}
        </ContentBox>
      </Frame>
    </Overlay>
  );
}

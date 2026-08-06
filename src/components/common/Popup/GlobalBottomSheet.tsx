import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import { useUIStore } from '@/stores/uiStore';

/**
 * uiStore.activeBottomSheet에 따라 전역 바텀시트를 렌더링한다.
 *
 * 바텀시트는 앱 어디서든(캘린더, 생성 패널, 설정 등) 열릴 수 있어서 App에 한 번만 배치하고,
 * 여는 쪽은 uiStore.openBottomSheet만 호출한다 — 화면마다 시트를 들고 있을 필요가 없다.
 *
 * 현재는 4-1(로그인 안내) → 4-1-1(로그인) 2단계를 처리한다. 나머지 유형(알림 권한,
 * 네트워크 오류 등)은 해당 기능을 붙일 때 분기를 추가하면 된다.
 *
 * 레이아웃은 공용 Modal(BottomSheet.tsx)과 같은 구성이지만, 소셜 로그인 버튼에 제공자
 * 로고가 필요해서 공용 컴포넌트를 고치는 대신 Overlay/Frame을 직접 조합했다
 * (RepeatScheduleBottomSheet와 같은 방식).
 */

const LOGO_DEFAULT_ICON = '/icon/logo/Logo_Default.svg';

interface SheetLayoutProps {
  title: string;
  description: string;
  confirmText: string;
  /** 확인 버튼 텍스트 앞에 붙는 아이콘. public/icon 기준 상대 경로 (예: "google.svg") */
  confirmIcon?: string;
  cancelText: string;
  onConfirm: () => void;
  onClose: () => void;
}

function SheetLayout({
  title,
  description,
  confirmText,
  confirmIcon,
  cancelText,
  onConfirm,
  onClose,
}: SheetLayoutProps) {
  const titleId = useId();
  const descriptionId = useId();

  // Escape 키로 닫기 (공용 Modal과 동일한 동작)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      <Frame
        className="gap-6 px-5 pt-5 pb-8"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex w-full flex-col items-start gap-2">
          <img src={LOGO_DEFAULT_ICON} alt="" className="-m-2 size-23 shrink-0" />
          <p id={titleId} className="default-heading-small w-full text-text-default">
            {title}
          </p>
          {/* whitespace-pre-line: 서버 안내 문구(A104 guideMessage)의 줄바꿈을 그대로 살린다 */}
          <p
            id={descriptionId}
            className="default-body-medium w-full whitespace-pre-line text-text-additional"
          >
            {description}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3">
          <Button variant="LargeDefaultRegular" className="w-full gap-small" onClick={onConfirm}>
            {/* 제공자 로고는 장식용이라 alt를 비운다 (버튼 텍스트가 이미 이름을 제공) */}
            {confirmIcon && <img src={`/icon/${confirmIcon}`} alt="" className="size-5 shrink-0" />}
            {confirmText}
          </Button>
          <Button variant="Small" onClick={onClose}>
            {cancelText}
          </Button>
        </div>
      </Frame>
    </Overlay>
  );
}

/**
 * A104의 guideMessage를 제목/본문 두 영역으로 나눈다.
 * 서버 문구가 "안내 한 줄 + 빈 줄 + 이점 설명" 형태로 와서 피그마 4-1의 제목/본문과 그대로 대응된다.
 * 빈 줄이 없으면 전체가 제목이 되고 본문은 비는데, 문구 자체는 그대로 노출되므로 문제없다.
 * (문구를 프론트에서 하드코딩하지 않는 게 정책이라 자르기만 하고 내용은 건드리지 않는다)
 */
function splitGuideMessage(guideMessage: string) {
  const [firstParagraph, ...rest] = guideMessage.split('\n\n');

  return { title: firstParagraph, description: rest.join('\n\n') };
}

export default function GlobalBottomSheet() {
  const activeBottomSheet = useUIStore((state) => state.activeBottomSheet);
  const bottomSheetContext = useUIStore((state) => state.bottomSheetContext);
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);
  const closeBottomSheet = useUIStore((state) => state.closeBottomSheet);

  // 4-1-1 로그인 바텀시트 — 4-1에서 "로그인"을 누르면 전환된다.
  // 이 시트의 문구는 서버 안내가 아니라 화면 고정 문구라 여기서 정의한다.
  if (activeBottomSheet === 'login') {
    return (
      <SheetLayout
        title="로그인"
        description="구글 계정으로 로그인하세요."
        confirmText="Google로 시작하기"
        confirmIcon="google.svg"
        cancelText="다음에 하기"
        // TODO: 구글 로그인 SDK 연동 후 A105(authService.socialLogin) 또는
        // 비회원 데이터가 있으면 A106(convertGuestToMember)으로 연결할 것.
        // 지금은 oauthAccessToken을 발급받을 수단이 없어 닫기만 한다.
        onConfirm={closeBottomSheet}
        onClose={closeBottomSheet}
      />
    );
  }

  if (activeBottomSheet !== 'loginRequired') {
    return null;
  }

  // context는 Record<string, unknown>이라 사용 전에 타입을 좁힌다
  const guideMessage =
    typeof bottomSheetContext?.guideMessage === 'string' ? bottomSheetContext.guideMessage : '';
  const { title, description } = splitGuideMessage(guideMessage);

  return (
    <SheetLayout
      title={title}
      description={description}
      confirmText="로그인"
      cancelText="다음에 하기"
      // 4-1 → 4-1-1로 전환. 로그인 시트는 고정 문구라 context를 넘기지 않아도 된다.
      onConfirm={() => openBottomSheet('login')}
      onClose={closeBottomSheet}
    />
  );
}

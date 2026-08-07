import { useEffect, useId, useState } from 'react';

import Button from '@/components/common/Buttons/Button';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import TermsAgreementSheet from '@/components/common/Popup/TermsAgreementSheet';
import type { TermType } from '@/apis/types/auth';
import {
  AlreadyRegisteredError,
  TermsAgreementRequiredError,
  useSocialLogin,
} from '@/hooks/useSocialLogin';
import { GoogleLoginCancelledError } from '@/utils/googleAuth';
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

/** 로그인 시트에서 이어지는 하위 단계 (구글 인증 결과에 따라 갈린다) */
type LoginStep = 'idle' | 'terms' | 'alreadyRegistered';

export default function GlobalBottomSheet() {
  const activeBottomSheet = useUIStore((state) => state.activeBottomSheet);
  const bottomSheetContext = useUIStore((state) => state.bottomSheetContext);
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);
  const closeBottomSheet = useUIStore((state) => state.closeBottomSheet);
  const showToast = useUIStore((state) => state.showToast);
  const toast = useUIStore((state) => state.toast);
  const clearToast = useUIStore((state) => state.clearToast);

  const [loginStep, setLoginStep] = useState<LoginStep>('idle');
  const { login, reset, isPending } = useSocialLogin();

  const closeLoginFlow = () => {
    reset();
    setLoginStep('idle');
    closeBottomSheet();
  };

  const runLogin = async (agreedTermTypes: TermType[] = [], discardGuestData = false) => {
    try {
      await login(agreedTermTypes, { discardGuestData });
      closeLoginFlow();
    } catch (error) {
      // 사용자가 구글 팝업을 닫은 것뿐이라 에러로 알리지 않는다
      if (error instanceof GoogleLoginCancelledError) {
        return;
      }

      // 실패가 아니라 "약관 동의를 받아오라"는 신호
      if (error instanceof TermsAgreementRequiredError) {
        setLoginStep('terms');
        return;
      }

      // 이미 가입된 계정이라 비회원 전환이 막힌 경우 — 기존 계정 로그인 여부를 물어본다
      if (error instanceof AlreadyRegisteredError) {
        setLoginStep('alreadyRegistered');
        return;
      }

      showToast('loginFailed');
    }
  };

  // 4-1-1 로그인 바텀시트 — 4-1에서 "로그인"을 누르면 전환된다.
  // 이 시트의 문구는 서버 안내가 아니라 화면 고정 문구라 여기서 정의한다.
  const renderSheet = () => {
    if (activeBottomSheet === 'login') {
      if (loginStep === 'terms') {
        return (
          <TermsAgreementSheet
            isPending={isPending}
            onAgree={(agreedTermTypes) => void runLogin(agreedTermTypes)}
            onClose={closeLoginFlow}
          />
        );
      }

      // 비회원 데이터를 포기하고 기존 계정으로 로그인할지 확인받는다 (A106 AUTH_409 분기).
      // 확인하면 전환(A106) 대신 새 로그인(A105)을 태운다.
      if (loginStep === 'alreadyRegistered') {
        return (
          <SheetLayout
            title="이미 가입된 계정이에요"
            description={
              '이 구글 계정으로 이미 가입하셨어요.\n\n' +
              '기존 계정으로 로그인하면 지금 비회원으로 만든 일정과 준비 항목은 옮겨지지 않아요.'
            }
            confirmText="기존 계정으로 로그인"
            cancelText="취소"
            onConfirm={() => void runLogin([], true)}
            onClose={closeLoginFlow}
          />
        );
      }

      return (
        <SheetLayout
          title="로그인"
          description="구글 계정으로 로그인하세요."
          confirmText={isPending ? '로그인 중...' : 'Google로 시작하기'}
          confirmIcon="google.svg"
          cancelText="다음에 하기"
          onConfirm={() => void runLogin()}
          onClose={closeLoginFlow}
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
  };

  return (
    <>
      {renderSheet()}

      {/* 전역 토스트도 여기서 한 번만 렌더링한다 (uiStore 설계 노트 참고).
          바텀시트와 동시에 뜰 수 있어서 시트 분기와 독립적으로 둔다. */}
      {toast === 'loginFailed' && (
        <ToastPopup
          GuideText="로그인에 실패했어요"
          DetailText="잠시 후 다시 시도해주세요."
          onClose={clearToast}
        />
      )}
    </>
  );
}

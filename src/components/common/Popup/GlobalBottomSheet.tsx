import { lazy, Suspense, useEffect, useId, useState, type ReactNode } from 'react';

import Button from '@/components/common/Buttons/Button';
import Header from '@/components/common/Header/Header';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import { useSocialLogin } from '@/hooks/useSocialLogin';
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

const LegalDocumentView = lazy(
  () => import('@/features/legal/components/LegalDocumentView'),
);

type LoginLegalView = {
  document: 'terms' | 'privacy';
  variant: 'summary' | 'detail';
};

const LOGIN_LEGAL_TITLE: Record<LoginLegalView['document'], string> = {
  terms: '서비스 이용약관',
  privacy: '개인정보 처리방침',
};

interface SheetLayoutProps {
  title: string;
  description: string;
  confirmText: string;
  confirmDisabled?: boolean;
  cancelText: string;
  legalNotice?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

function SheetLayout({
  title,
  description,
  confirmText,
  confirmDisabled,
  cancelText,
  legalNotice,
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
          {legalNotice}
        </div>

        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3">
          <Button
            variant="LargeDefaultRegular"
            className="w-full gap-small"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
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

interface LoginLegalSheetProps {
  view: LoginLegalView;
  onBack: () => void;
  onClose: () => void;
  onShowDetail: () => void;
}

function LoginLegalSheet({ view, onBack, onClose, onShowDetail }: LoginLegalSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      <Frame className="h-[92dvh] gap-4 p-4">
        <Header
          variant="modal"
          title={LOGIN_LEGAL_TITLE[view.document]}
          leading={{ type: 'icon', onClick: onBack }}
          trailing={{ type: 'text', text: '닫기', onClick: onClose }}
        />

        {view.variant === 'summary' && (
          <div className="flex w-full shrink-0 justify-end px-1">
            <Button variant="Small" onClick={onShowDetail}>
              전문 보기
            </Button>
          </div>
        )}

        <Suspense
          fallback={
            <div className="flex min-h-0 w-full flex-1 items-center justify-center default-body-medium text-text-additional">
              문서를 불러오는 중...
            </div>
          }
        >
          <LegalDocumentView
            document={view.document}
            variant={view.variant}
            layout="sheet"
          />
        </Suspense>
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
  const showToast = useUIStore((state) => state.showToast);
  const toast = useUIStore((state) => state.toast);
  const clearToast = useUIStore((state) => state.clearToast);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const [loginLegalView, setLoginLegalView] = useState<LoginLegalView | null>(null);

  const { login, isPending } = useSocialLogin();

  const closeLoginFlow = () => {
    setLoginLegalView(null);
    closeBottomSheet();
  };

  // 로그인이 끝나면 로그인 시트뿐 아니라 설정 시트까지 닫는다.
  //
  // 설정에서 "로그인"을 누르면 설정 시트는 열린 채로 그 위에 로그인 시트가 뜬다.
  // 로그인 시트만 닫으면 설정 시트가 화면을 덮은 채 남아서, 로그인은 됐는데 화면이
  // 안 뜬 것처럼 보인다(새로고침하면 uiStore가 초기화되어 그제야 사라진다).
  //
  // 설정을 거치지 않고 연 경우에는 이미 닫혀 있어 호출해도 아무 일도 일어나지 않는다.
  const finishLoginFlow = () => {
    closeLoginFlow();
    closeSettings();
  };

  const runLogin = async () => {
    try {
      await login();
      finishLoginFlow();
    } catch (error) {
      // 사용자가 구글 팝업을 닫은 것뿐이라 에러로 알리지 않는다
      if (error instanceof GoogleLoginCancelledError) {
        return;
      }

      // TODO(디자인 대기): 아래 두 분기는 각각 전용 화면이 필요하지만 피그마에 없어
      // 지금은 공통 실패 토스트로만 처리한다.
      // - TermsAgreementRequiredError(TERMS_400): 약관 동의 화면을 띄우고, 동의한
      //   약관을 login(agreedTermTypes)로 넘겨 재시도해야 신규 가입이 완료된다.
      //   이 화면이 없으면 신규 가입은 여기서 더 진행되지 않는다.
      // - AlreadyRegisteredError(AUTH_409): "이미 가입된 계정입니다. 기존 계정으로
      //   로그인하시겠습니까? 현재 작성한 데이터는 사라집니다" 확인 창이 필요하다.
      showToast('loginFailed');
    }
  };

  // 4-1-1 로그인 바텀시트 — 4-1에서 "로그인"을 누르면 전환된다.
  // 이 시트의 문구는 서버 안내가 아니라 화면 고정 문구라 여기서 정의한다.
  const renderSheet = () => {
    if (activeBottomSheet === 'login') {
      if (loginLegalView) {
        return (
          <LoginLegalSheet
            view={loginLegalView}
            onBack={() => {
              if (loginLegalView.variant === 'detail') {
                setLoginLegalView({ ...loginLegalView, variant: 'summary' });
                return;
              }

              setLoginLegalView(null);
            }}
            onClose={closeLoginFlow}
            onShowDetail={() =>
              setLoginLegalView({ ...loginLegalView, variant: 'detail' })
            }
          />
        );
      }

      return (
        <SheetLayout
          title="로그인"
          description="구글 계정으로 로그인하세요."
          confirmText={isPending ? '진행 중...' : '동의하고 계속하기'}
          confirmDisabled={isPending}
          cancelText="나중에"
          legalNotice={
            <p className="w-full max-w-[320px] default-caption-large text-left text-text-additional">
              동의하고 계속하기를 누르면{' '}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() =>
                  setLoginLegalView({ document: 'terms', variant: 'summary' })
                }
              >
                서비스 이용약관
              </button>{' '}
              및{' '}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() =>
                  setLoginLegalView({ document: 'privacy', variant: 'summary' })
                }
              >
                개인정보 처리방침
              </button>
              에 동의한 것으로 간주됩니다.
            </p>
          }
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
        onConfirm={() => {
          setLoginLegalView(null);
          openBottomSheet('login');
        }}
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

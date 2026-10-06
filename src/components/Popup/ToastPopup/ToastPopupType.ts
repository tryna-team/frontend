// 토스트에 표시할 문구 형태 (toastMessages.ts의 문구 모음과 호출부가 직접 만드는 문구 모두 이 형태)
export interface ToastMessage {
  // 첫 줄. 스크린 리더가 토스트 이름으로 읽는다
  title: string;
  // 둘째 줄 (선택)
  description?: string;
}

export interface ToastPopupProps {
  // 열림 여부. 조건부 렌더링하지 말고 항상 렌더링한 뒤 open으로만 제어한다 (그래야 닫힘 애니메이션이 재생됨)
  open: boolean;
  // 닫기 요청 (dim·박스 탭, ESC, 자동 닫힘)
  onClose: () => void;
  // 표시할 문구. 닫힐 때도 바꾸지 않아야 닫힘 애니메이션 동안 빈 박스가 보이지 않는다
  message: ToastMessage;
}

// 자동으로 닫히기까지의 시간(초)
export const TOAST_AUTO_CLOSE_SECONDS = 2;

/* ── 스타일 ── */

// 화면 정중앙 배치. 가운데 정렬은 translate 속성, 애니메이션은 transform을 써서 서로 충돌하지 않는다
export const toastPopupContentClassName =
  'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none';

// Figma: Semantic/BackGround/White, Radius/Semantic/Large(24px), 폭 252px, 위아래 16px
// 그림자는 Figma Component/Default (바텀시트와 같은 값)
export const toastPopupBoxClassName =
  'flex w-[252px] flex-col items-center rounded-large bg-background-white py-padding-medium shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)]';

// Figma: 제목·설명 간격 8px, 왼쪽 20px · 오른쪽 12px
export const toastTextClassName =
  'flex w-full flex-col gap-small pl-padding-large pr-padding-small';
export const toastTitleClassName = 'w-full default-body-strong-large text-text-default';
export const toastDescriptionClassName = 'w-full default-body-medium text-text-additional';

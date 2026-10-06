import { useRef } from 'react';

// Radix Dialog를 Trigger 없이 open으로만 제어할 때의 포커스 처리.
// - 열 때: 직전 포커스 위치를 기억하고 다이얼로그 자체에 포커스 (입력창이 있어도 키보드가 바로 뜨지 않게)
// - 닫힐 때: 기억한 위치로 되돌림 (Radix는 Trigger로만 되돌리므로 직접 처리)
// TODO: BottomSheet는 아직 같은 처리를 직접 하고 있다. 이 훅으로 전환해 중복을 없앨 것
export function useDialogFocus<T extends HTMLElement>() {
  const contentRef = useRef<T>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const onOpenAutoFocus = (event: Event) => {
    event.preventDefault();
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    contentRef.current?.focus();
  };

  const onCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    returnFocusRef.current?.focus();
  };

  return { contentRef, onOpenAutoFocus, onCloseAutoFocus };
}

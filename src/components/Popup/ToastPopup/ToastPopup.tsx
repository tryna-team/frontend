import { useEffect, useEffectEvent, useId } from 'react';
import { Dialog } from 'radix-ui';
import { cn } from '@/utils/cn';
import { overlayAnimationClassName, toastAnimationClassName } from '../../shared/popupAnimation';
import { popupOverlayClassName } from '../../shared/popupOverlay';
import { useDialogFocus } from '../../shared/useDialogFocus';
import {
  TOAST_AUTO_CLOSE_SECONDS,
  toastDescriptionClassName,
  toastPopupBoxClassName,
  toastPopupContentClassName,
  toastTextClassName,
  toastTitleClassName,
  type ToastPopupProps,
} from './ToastPopupType';

export function ToastPopup({ open, onClose, message }: ToastPopupProps) {
  const { title, description } = message;
  const titleId = useId();
  const descriptionId = useId();
  const { contentRef, onOpenAutoFocus, onCloseAutoFocus } = useDialogFocus<HTMLDivElement>();
  // 호출부가 onClose를 매번 새로 만들어도 타이머가 다시 시작되지 않도록 최신 onClose를 참조
  const closeAutomatically = useEffectEvent(onClose);

  // 열린 뒤 일정 시간이 지나면 자동으로 닫는다. 문구가 바뀌면 다시 센다
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => closeAutomatically(), TOAST_AUTO_CLOSE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [open, title, description]);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {/* Overlay·Content는 Portal의 직접 자식이어야 닫힘 애니메이션이 끝날 때까지 유지된다 */}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(popupOverlayClassName, overlayAnimationClassName)}
          // dim 탭이 부모 컴포넌트의 클릭 처리로 전달되지 않도록 막는다
          // (Portal 안이어도 React 이벤트는 컴포넌트 트리를 따라 부모로 전달됨. 막아도 Radix는 dim 탭을 감지해 닫는다)
          onClick={(event) => event.stopPropagation()}
        />
        <Dialog.Content
          ref={contentRef}
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            toastPopupContentClassName,
            toastPopupBoxClassName,
            toastAnimationClassName,
          )}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          // 박스를 탭해도 닫힘. dim과 마찬가지로 부모 컴포넌트의 클릭 처리로 전달되지 않도록 막는다
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <div className={toastTextClassName}>
            <p id={titleId} className={toastTitleClassName}>
              {title}
            </p>
            {description && (
              <p id={descriptionId} className={toastDescriptionClassName}>
                {description}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

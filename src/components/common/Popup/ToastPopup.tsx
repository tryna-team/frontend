import Overlay from '@/components/common/Popup/Overlay';
import Button from '@/components/common/Buttons/Button';

interface ToastPopupProps {
  GuideText: string;
  DetailText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
  inline?: boolean;
  className?: string;
}

export default function ToastPopup({
  GuideText,
  DetailText,
  confirmText,
  onConfirm,
  onClose,
  inline = false,
  className = '',
}: ToastPopupProps) {
  const popup = (
    <div
      role={inline ? 'status' : 'alertdialog'}
      aria-label={GuideText}
      className={`flex ${inline ? 'w-full' : 'w-[252px]'} flex-col gap-2 rounded-[24px] bg-white px-5 py-4 drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="w-full text-text-default default-body-strong-large">{GuideText}</p>
      {DetailText && (
        <p className="w-full text-text-additional default-body-medium">{DetailText}</p>
      )}
      {confirmText && onConfirm && (
        <Button variant="MediumDefaultFit" className="w-full" onClick={onConfirm}>
          {confirmText}
        </Button>
      )}
    </div>
  );

  if (inline) {
    return popup;
  }

  return (
    <Overlay className="flex items-center justify-center" onClick={onClose}>
      {popup}
    </Overlay>
  );
}

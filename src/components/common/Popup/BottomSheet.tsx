import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';

type IconType = 'default' | 'warning' | 'danger' | 'information';

const ICON_MAP: Record<IconType, string> = {
  default: '/icon/logo/Logo_Default.svg',
  warning: '/icon/logo/Logo_Warning.svg',
  danger: '/icon/logo/Logo_Danger.svg',
  information: '/icon/logo/Logo_Information.svg',
};

interface ModalProps {
  icon: IconType;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function Modal({
  icon,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex flex-col gap-6 items-center w-full bg-background-white rounded-t-medium shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)] pt-5 pb-8 px-5 overflow-clip"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 콘텐츠 영역 */}
        <div className="flex flex-col gap-2 items-start w-full">
          <img src={ICON_MAP[icon]} alt={icon} className="size-23 shrink-0 -m-2" />
          <p id={titleId} className="default-heading-small text-text-default w-full">{title}</p>
          <p id={descriptionId} className="default-body-medium text-text-additional w-full">{description}</p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3 items-center justify-center w-full shrink-0">
          <Button variant="LargeDefaultRegular" className="w-full" onClick={onConfirm}>
            {confirmText}
          </Button>
          {cancelText && (
            <Button variant="Small" onClick={onCancel ?? onClose}>
              {cancelText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

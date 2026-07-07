import DefaultButtonLarge from '@/components/common/Buttons/Default/Large';
import ClearButton from '@/components/common/Buttons/Clear';

type IconType = 'default' | 'warning' | 'danger' | 'information';

const ICON_MAP: Record<IconType, string> = {
  default: '/icon/Icon_Default.svg',
  warning: '/icon/Icon_Warning.svg',
  danger: '/icon/Icon_Danger.svg',
  information: '/icon/Icon_Information.svg',
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20" onClick={onClose}>
      <div
        className="flex flex-col gap-6 items-center w-full bg-white rounded-t-[24px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)] pt-5 pb-8 px-5 overflow-clip"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 콘텐츠 영역 */}
        <div className="flex flex-col gap-2 items-start w-full">
          <img src={ICON_MAP[icon]} alt={icon} className="size-23 shrink-0 -m-2" />
          <p className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[22px] font-semibold text-[#1C1630] leading-8 tracking-[-0.22px] w-full">
            {title}
          </p>
          <p className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[15px] font-medium text-[rgba(28,22,48,0.7)] leading-5.5 tracking-[-0.15px] w-full">
            {description}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3 items-center justify-center w-full shrink-0">
          <DefaultButtonLarge className="w-full" onClick={onConfirm}>
            {confirmText}
          </DefaultButtonLarge>
          {cancelText && (
            <ClearButton className="px-0.5" onClick={onCancel}>
              {cancelText}
            </ClearButton>
          )}
        </div>
      </div>
    </div>
  );
}

import DefaultButtonLarge from "@/components/common/Buttons/Default/Large";
import ClearButton from "@/components/common/Buttons/Clear";

type IconType = "default" | "warning" | "danger" | "information";

const ICON_MAP: Record<IconType, string> = {
  default: "/icon/Icon_Default.svg",
  warning: "/icon/Icon_Warning.svg",
  danger: "/icon/Icon_Danger.svg",
  information: "/icon/Icon_Information.svg",
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-[393px] max-h-[80vh] bg-white rounded-[24px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex flex-col gap-2 items-start px-5 pt-5 overflow-y-auto">
          <img src={ICON_MAP[icon]} alt={icon} className="size-16 shrink-0" />
          <p className="font-[Pretendard] text-[22px] font-semibold text-[#1C1630] leading-8 tracking-[-0.22px] w-full">
            {title}
          </p>
          <p className="font-[Pretendard] text-[15px] font-medium text-[rgba(28,22,48,0.7)] leading-[22px] tracking-[-0.15px] w-full">
            {description}
          </p>
        </div>

        {/* 하단 고정 버튼 영역 */}
        <div className="flex flex-col gap-3 items-center px-5 pt-6 pb-8 shrink-0">
          <DefaultButtonLarge className="w-full" onClick={onConfirm}>
            {confirmText}
          </DefaultButtonLarge>
          {cancelText && (
            <ClearButton onClick={onCancel}>
              {cancelText}
            </ClearButton>
          )}
        </div>
      </div>
    </div>
  );
}

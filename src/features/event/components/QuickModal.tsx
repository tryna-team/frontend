import WarningButtonMedium from "@/components/common/Buttons/Warning/Medium";

interface QuickModalProps {
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function QuickModal({
  message = "이 이벤트를 삭제하시겠습니까?",
  onConfirm,
  onClose,
}: QuickModalProps) {
  return (
    <>
      {/* 위치 고정 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-144.75 left-1/2 -translate-x-1/2 z-50 bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] flex flex-col gap-6 items-center py-4 w-61.25">
        <div className="flex items-center pl-5 pr-3 w-full">
          <p className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[17px] font-semibold text-[#1C1630] leading-6.5 tracking-[-0.17px] flex-1">
            {message}
          </p>
        </div>
        <div className="flex flex-col items-start px-6 w-full">
          <WarningButtonMedium className="w-full" onClick={onConfirm}>
            이벤트 삭제
          </WarningButtonMedium>
        </div>
      </div>
    </>
  );
}

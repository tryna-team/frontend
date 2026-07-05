import WarningButtonMedium from "@/components/ui/buttons/Warning/Medium";

interface DeleteEventModalProps {
  message?: string;
  onConfirm: () => void;
}

export default function DeleteEventModal({
  message = "이 이벤트를 삭제하시겠습니까?",
  onConfirm,
}: DeleteEventModalProps) {
  return (
    <div className="bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] flex flex-col gap-8 items-center py-4 w-full">
      <div className="flex items-center pl-5 pr-3 w-full">
        <p className="font-[Pretendard] text-[17px] font-semibold text-[#1C1630] leading-[26px] tracking-[-0.17px] flex-1">
          {message}
        </p>
      </div>
      <div className="flex flex-col items-start px-6 w-full">
        <WarningButtonMedium className="w-full" onClick={onConfirm}>
          이벤트 삭제
        </WarningButtonMedium>
      </div>
    </div>
  );
}

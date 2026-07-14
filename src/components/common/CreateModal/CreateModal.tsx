import ChecklistItem from '@/components/common/Checklist/ChecklistItem';
import { Button } from '@/components/ui/button';

type ChecklistItemData = {
  id: string;
  label: string;
  status?: 'default' | 'done';
};

type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: ChecklistItemData[];
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
  onOpenCalendar?: () => void;
  onOpenLabel?: () => void;
  onToggleChecklist?: (id: string) => void;
  onDeleteChecklist?: (id: string) => void;
};

export default function CreateModal({
  mode = 'default',
  inputValue = '',
  keyword = '',
  message = '',
  checklistItems = [],
  onInputChange,
  onSubmit,
  onOpenCalendar,
  onOpenLabel,
  onToggleChecklist,
  onDeleteChecklist,
}: CreateModalProps) {
  const isRecommendMode = mode === 'recommend';

  return (
    <section className="w-full rounded-[20px] bg-white px-5 py-4 shadow-sm">
      {!isRecommendMode && (
        <div className="flex items-start justify-between gap-3">
          <input
            value={inputValue}
            onChange={(event) => onInputChange?.(event.target.value)}
            placeholder="어떤 일 인가요?"
            className="h-8 flex-1 bg-transparent text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#201A36] outline-none placeholder:text-[#B8B8C2]"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSubmit}
            className="h-9 w-9 rounded-full p-0 hover:bg-transparent"
            aria-label="일정 생성"
          >
            <img src="/icon/send_default.png" alt="" className="h-9 w-9 object-contain" />
          </Button>
        </div>
      )}

      {isRecommendMode && (
        <div>
          <p className="mb-3 text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#1C1630B2]">
            <span className="font-semibold text-[#1C1630]">{keyword}</span>
            {message}
          </p>

          <div className="border-b border-[#ECECF1]" />

          <div className="flex flex-col">
            {checklistItems.map((item) => (
              <div key={item.id}>
                <div className="py-2">
                  <ChecklistItem
                    label={item.label}
                    status={item.status}
                    variant="create"
                    deletable
                    onToggle={() => onToggleChecklist?.(item.id)}
                    onDelete={() => onDeleteChecklist?.(item.id)}
                  />
                </div>

                <div className="border-b border-[#ECECF1]" />
              </div>
            ))}

            <div className="py-2">
              <ChecklistItem
                label="직접 추가"
                status="default"
                variant="create"
                onToggle={() => {}}
              />
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <input
              value={inputValue}
              onChange={(event) => onInputChange?.(event.target.value)}
              placeholder="어떤 일 인가요?"
              className="h-8 min-w-0 flex-1 bg-transparent text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#201A36] outline-none placeholder:text-[#B8B8C2]"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onSubmit}
              className="h-9 w-9 rounded-full p-0 hover:bg-transparent"
              aria-label="일정 생성"
            >
              <img src="/icon/send_active.png" alt="" className="h-9 w-9 object-contain" />
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-[13px] font-medium leading-5 tracking-[-0.26px] text-[#8F8F9B]">
        <Button
          type="button"
          variant="ghost"
          onClick={onOpenCalendar}
          className="h-auto gap-1 p-0 text-[13px] font-medium text-[#8F8F9B] hover:bg-transparent"
          aria-label="날짜 선택"
        >
          <img src="/icon/calendar.png" alt="" className="h-5 w-5 object-contain" />
          <span>오늘 · 반복 없음</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onOpenLabel}
          className="h-auto gap-1 p-0 text-[13px] font-medium text-[#8F8F9B] hover:bg-transparent"
          aria-label="레이블 선택"
        >
          <img src="/icon/label.png" alt="" className="h-5 w-5 object-contain" />
          <span>레이블 없음</span>
        </Button>
      </div>
    </section>
  );
}

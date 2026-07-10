import ChecklistItem from '@/components/common/Checklist/ChecklistItem';

type ChecklistItemData = {
  id: string;
  label: string;
  status?: 'default' | 'done' | 'add';
};

type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: ChecklistItemData[];
  onInputChange?: (value: string) => void;
  onOpenCalender?: () => void;
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
  onOpenCalender,
  onOpenLabel,
  onToggleChecklist,
  onDeleteChecklist,
}: CreateModalProps) {
  const isRecommendMode = mode === 'recommend';

  return (
    <section className="flex w-full max-w-[385px] flex-col items-start gap-0.5 rounded-[24px] border border-[rgba(28,22,48,0.05)] bg-white p-3">
      {!isRecommendMode && (
        <div className="flex w-full items-center justify-between pl-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange?.(event.target.value)}
            placeholder="어떤 일 인가요?"
            className="h-9 min-w-0 flex-1 bg-transparent text-[15px] font-medium leading-[22px] tracking-[-0.15px] text-[#1C1630] outline-none placeholder:text-[rgba(28,22,48,0.30)]"
          />

          {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
          <span className="box-border flex h-9 w-[74px] shrink-0 items-center justify-center whitespace-nowrap text-[15px] font-semibold leading-[22px] tracking-[-0.15px] text-[#1C1630]">
            전송
          </span>
        </div>
      )}

      {isRecommendMode && (
        <div className="flex w-full flex-col">
          <div className="flex w-full items-center justify-between px-1 py-2">
            <p className="min-w-0 text-[15px] font-medium leading-[22px] tracking-[-0.15px] text-[rgba(28,22,48,0.70)]">
              <span className="bg-gradient-to-l from-[#29C878] to-[#32E089] bg-clip-text text-[15px] font-semibold leading-[22px] tracking-[-0.15px] text-transparent">
                {keyword}
              </span>
              {message}
            </p>
          </div>

          <div className="border-b border-[rgba(28,22,48,0.05)]" />

          <div className="flex w-full flex-col">
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

                <div className="border-b border-[rgba(28,22,48,0.05)]" />
              </div>
            ))}

            <div className="flex h-[46px] w-full items-center gap-2 border-t border-[rgba(28,22,48,0.05)] bg-white py-3">
              <img
                src="public/icon/icons/plus_small.svg"
                alt=""
                className="h-5 w-5 shrink-0 object-contain"
              />

              <span className="text-[15px] font-medium leading-[22px] tracking-[-0.15px] text-[rgba(28,22,48,0.30)]">
                직접 추가
              </span>
            </div>
          </div>

          <div className="mt-6 flex w-full items-center justify-between pl-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange?.(event.target.value)}
              placeholder="어떤 일 인가요?"
              className="h-9 min-w-0 flex-1 bg-transparent text-[15px] font-medium leading-[22px] tracking-[-0.15px] text-[#1C1630] outline-none placeholder:text-[rgba(28,22,48,0.30)]"
            />

            {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
            <span className="box-border flex h-9 w-[74px] shrink-0 items-center justify-center whitespace-nowrap text-[15px] font-semibold leading-[22px] tracking-[-0.15px] text-[#1C1630]">
              전송
            </span>
          </div>
        </div>
      )}

      <div className="flex w-full items-center gap-4 px-1 py-1">
        <button
          type="button"
          onClick={onOpenCalender}
          className="flex items-center gap-1 bg-transparent p-0 text-center text-[12px] font-normal leading-4 tracking-[-0.12px] text-[rgba(28,22,48,0.70)]"
          aria-label="날짜 및 반복 설정"
        >
          <img
            src="public/icon/icons/calender_small.svg"
            alt=""
            className="h-5 w-5 shrink-0 object-contain"
          />

          <span>오늘 · 반복 없음</span>
        </button>

        <button
          type="button"
          onClick={onOpenLabel}
          className="flex items-center gap-1 bg-transparent p-0 text-center text-[12px] font-normal leading-4 tracking-[-0.12px] text-[rgba(28,22,48,0.70)]"
          aria-label="레이블 설정"
        >
          <img
            src="public/icon/icons/label_small.svg"
            alt=""
            className="h-5 w-5 shrink-0 object-contain"
          />

          <span>레이블 없음</span>
        </button>
      </div>
    </section>
  );
}
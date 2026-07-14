import Button from '@/components/common/Buttons/Button';

export interface DailyScheduleTodoItem {
  id: string;
  text: string;
  checked: boolean;
  dateText: string;
}

interface DailyScheduleCardProps {
  items: DailyScheduleTodoItem[];
  onToggleItem?: (id: string) => void;
  onAddClick?: () => void;
  onCompleteAllClick?: () => void;
}

export default function DailyScheduleCard({
  items,
  onToggleItem,
  onAddClick,
  onCompleteAllClick,
}: DailyScheduleCardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[24px] bg-white px-4 py-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_9.701px_58.209px_0px_rgba(0,0,0,0.1)]">
      <ul className="flex w-full flex-col items-start gap-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex w-full items-center justify-between py-1"
          >
            <button
              type="button"
              onClick={() => onToggleItem?.(item.id)}
              aria-label={item.checked ? '완료 취소' : '완료 처리'}
              className="flex items-center gap-1 border-0 bg-transparent p-0"
            >
              <img
                src={
                  item.checked
                    ? '/icon/radio_button/done_medium.svg'
                    : '/icon/radio_button/default_medium.svg'
                }
                alt=""
                width={24}
                height={24}
              />
              <span
                className={`default-body-large whitespace-nowrap ${
                  item.checked ? 'text-text-disable' : 'text-text-default'
                }`}
              >
                {item.text}
              </span>
            </button>
            <span
              className={`w-11.25 whitespace-nowrap text-right default-label-medium ${
                item.checked ? 'text-text-disable' : 'text-text-additional'
              }`}
            >
              {item.dateText}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-10">
        <Button variant="LargeDefaultFit" onClick={onAddClick}>
          직접 추가
        </Button>
        <Button variant="Small" onClick={onCompleteAllClick}>
          모두 완료
        </Button>
      </div>
    </div>
  );
}

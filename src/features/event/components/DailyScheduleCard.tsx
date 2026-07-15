import Button from '@/components/common/Buttons/Button';
import Checklist from '@/components/common/Checklist/Checklist';

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
      {/* Checklist.tsx의 id는 number라 배열 index를 사용, onLeadingClick에서 실제 item.id(string)로 매핑 */}
      <Checklist
        items={items.map((item, index) => ({
          id: index,
          label: item.text,
          status: item.checked ? ('done' as const) : ('default' as const),
          trailing: { type: 'date' as const, text: item.dateText },
        }))}
        onLeadingClick={(index) => onToggleItem?.(items[index].id)}
      />

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

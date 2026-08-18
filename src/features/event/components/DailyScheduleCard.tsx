import Button from '@/components/common/Buttons/Button';
import Checklist from '@/components/common/Checklist/Checklist';

export interface DailyScheduleTodoItem {
  id: string;
  text: string;
  checked: boolean;
  dateText?: string;
}

interface DailyScheduleCardProps {
  items: DailyScheduleTodoItem[];
  onToggleItem?: (id: string) => void;
  onCompleteAllClick?: () => void;
  updatingItemIds?: ReadonlySet<string>;
}

export default function DailyScheduleCard({
  items,
  onToggleItem,
  onCompleteAllClick,
  updatingItemIds,
}: DailyScheduleCardProps) {
  return (
    // 피그마 스펙(node 1516:4802 등)의 h-448px 고정 카드. flex-basis가 되는 h-[448px]에
    // min-h-0을 더해, 부모(EventViewPage)가 뷰포트 높이 제약으로 공간이 모자랄 때 이 카드가
    // 448px보다 작게 줄어들 수 있도록 한다(넘치는 만큼은 아래 체크리스트 영역이 흡수).
    <div className="flex h-112 max-h-112 min-h-0 w-full flex-col items-center gap-4 rounded-[24px] bg-white px-4 py-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_9.701px_58.209px_0px_rgba(0,0,0,0.1)]">
      {/*
        TODO: index를 id로 쓰는 임시 처리 — 항목 추가/삭제/정렬이 생기면 잘못된 줄이
        토글될 수 있는 React key 안티패턴. 아래 두 곳을 고쳐야 함:
        1) (선행 조건, Checklist.tsx 수정 필요) ChecklistItemData.id: number →
           string | number, ChecklistProps.onLeadingClick/onDelete도 동일하게
           (id: string | number) => void 로 타입 확장.
        2) 위 1번이 반영되면 아래를:
           - items.map((item, index) => ({ id: index, ... }))
             → items.map((item) => ({ id: item.id, ... }))
           - onLeadingClick={(index) => onToggleItem?.(items[index].id)}
             → onLeadingClick={(id) => onToggleItem?.(String(id))}
           로 바꿔서 index로 items 배열을 다시 뒤지는 우회 없이 item.id를 그대로 전달.
      */}
      {/* 액션아이템이 늘어나 버튼 영역을 침범하지 않도록, 이 영역만 flex-1 + min-h-0 +
          overflow-y-auto로 남은 세로 공간을 갖고 내부 스크롤한다(버튼 영역은 항상 shrink-0). */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto scrollbar-none">
        {/* EventView에서는 큰 체크 아이콘과 양 끝 정렬을 사용한다. */}
        <Checklist
          radioVariant="event"
          toggleOnRowClick
          items={items.map((item, index) => ({
            id: index,
            label: item.text,
            status: item.checked ? ('done' as const) : ('default' as const),
            trailing: item.dateText
              ? { type: 'date' as const, text: item.dateText }
              : { type: 'none' as const },
            // 상태 변경을 요청한 항목만 잠시 비활성화한다.
            disabled: updatingItemIds?.has(item.id) ?? false,
          }))}
          onLeadingClick={(index) => onToggleItem?.(items[index].id)}
        />
      </div>

      <div className="flex shrink-0 items-center justify-center">
        {/* "직접 추가" 자리에 있던 Button/Large 자리를 그대로 "모두 완료" 액션으로 사용한다
            (피그마 node 1516:4820의 Button/Large 스타일 그대로, 라벨/기능만 교체). */}
        <Button variant="LargeDefaultFit" onClick={onCompleteAllClick}>
          모두 완료
        </Button>
      </div>
    </div>
  );
}

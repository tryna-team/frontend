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
    <div className="flex w-full flex-col items-center gap-4 rounded-[24px] bg-white px-4 py-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_9.701px_58.209px_0px_rgba(0,0,0,0.1)]">
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

      <div className="flex items-center justify-center gap-10">
        {/* "모두 완료"와 동일 크기의 보이지 않는 스페이서 — 기능 없음, 정렬용 */}
        <div aria-hidden="true" className="h-5.5 w-14.75" />
        {/* 기능 없는 자리표시자 — "직접 추가"가 있던 자리를 그대로 차지시켜 "모두 완료"
            위치를 원래대로 유지한다. 폭을 숫자로 추정하지 않고 실제 버튼을 렌더링한 뒤
            안 보이게만 처리해 폰트/패딩 변경에도 위치가 어긋나지 않도록 한다. */}
        <Button
          variant="LargeDefaultFit"
          className="invisible pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          직접 추가
        </Button>
        <Button variant="Small" onClick={onCompleteAllClick}>
          모두 완료
        </Button>
      </div>
    </div>
  );
}

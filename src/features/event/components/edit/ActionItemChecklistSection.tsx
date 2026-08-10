/**
 * 일정 수정 화면(EventEditBottomSheet)의 "체크리스트" 섹션에서 쓰는 표시 컴포넌트.
 * 준비/실행 항목 목록을 보여주고, 완료 토글과 항목별 날짜(ChipButton) 편집을 담당한다.
 *
 * "직접 추가" 입력 폼(텍스트 입력 + 캘린더/라벨 칩, E105 저장 연동)은 피그마
 * (node 3303:37852) 기준 이 화면에 없어 제거된 상태 — 다시 필요해지면 이 파일에
 * 복원하면 된다(이전 구현은 git 이력의 ActionItemEditBottomSheet.tsx 참고).
 */
import { useState } from 'react';

import { isSameDay } from 'date-fns';

import Checklist from '@/components/common/Checklist/Checklist';
import type { ChecklistItemData } from '@/components/common/Checklist/Checklist';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import DatePickerCalendar from '@/features/event/components/create/DatePickerCalendar';

import type { ActionItemEditItem } from './ActionItemEditItem';

const ADD_ITEM_ROW_ID = -1;
const UNTIMED_DATE_TEXT = '당일';

const formatEventDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`);

type ActionItemChecklistSectionProps = {
  // 'YYYY-MM-DD'. "당일" 판정 기준(=부모 일정 날짜)이자 UNTIMED_PREP 항목의 표시 날짜.
  eventDate: string;
  items: ActionItemEditItem[];
  onToggleItem?: (id: number) => void;
};

export function ActionItemChecklistSection({
  eventDate,
  items,
  onToggleItem,
}: ActionItemChecklistSectionProps) {
  // 체크 상태 등 실제 데이터는 items(부모 prop)를 그대로 신뢰한다 — 예전엔
  // useState(items)로 마운트 시점에 한 번만 복사해서, 바텀시트가 열려있는 동안
  // 부모가 새 데이터를 내려줘도(다른 곳에서 완료 처리 후 리페치된 경우 등) 반영이
  // 안 되는 문제가 있었다. 서버에 저장할 API가 아직 없는 "날짜 편집"만 이 컴포넌트
  // 안에서 덧입혀서 보여준다.
  const [dateTextOverrides, setDateTextOverrides] = useState<Record<number, string>>({});
  // ChipButton(날짜 뱃지)을 눌러 날짜를 편집 중인 항목의 id
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const localItems = items.map((item) =>
    dateTextOverrides[item.id] !== undefined
      ? { ...item, dateText: dateTextOverrides[item.id] }
      : item,
  );

  const handleToggle = (id: number) => {
    if (id === ADD_ITEM_ROW_ID) {
      return;
    }

    // 완료 토글은 로컬에서 직접 뒤집지 않고 부모(EventViewPage의 E106 mutation)에
    // 맡긴다 — 그쪽이 이미 낙관적 업데이트로 캐시를 갱신해서, items prop이 곧바로
    // 갱신된 값으로 다시 내려온다.
    onToggleItem?.(id);
  };

  const handlePickItemDate = (itemId: number, pickedDate: Date) => {
    // ⚠️ 임시 UI 구현, 추후 UI 확정되면 수정 필요: 날짜 선택 팝업에서 부모 일정 날짜와
    // 같은 날짜를 고르면 UNTIMED_PREP("당일")으로, 다른 날짜를 고르면 TIMED_ACTION으로
    // 판정한다. "당일로 설정" 같은 별도 버튼 없이 날짜 선택만으로 유형을 정하는 임시
    // 처리이며, 이미 저장된 항목의 날짜를 다시 수정하는 API가 아직 없어 화면 표시만
    // 갱신하고 서버에는 반영하지 않는다.
    const isUntimed = isSameDay(pickedDate, formatEventDate(eventDate));
    const dateText = isUntimed
      ? UNTIMED_DATE_TEXT
      : `${pickedDate.getMonth() + 1}월 ${pickedDate.getDate()}일`;

    setDateTextOverrides((prev) => ({ ...prev, [itemId]: dateText }));
    setEditingItemId(null);
  };

  const checklistItems: ChecklistItemData[] = [
    ...localItems.map((item) => ({
      id: item.id,
      label: item.label,
      status: (item.checked ? 'done' : 'default') as ChecklistItemData['status'],
      trailing: item.dateText
        ? {
            type: 'date' as const,
            text: item.dateText,
            onClick: () => setEditingItemId(item.id),
          }
        : { type: 'none' as const },
    })),
    {
      id: ADD_ITEM_ROW_ID,
      label: '직접 추가',
      status: 'plus',
      trailing: { type: 'none' },
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <Checklist items={checklistItems} radioVariant="create" onLeadingClick={handleToggle} />

      {editingItemId !== null && (
        <div onClick={(event) => event.stopPropagation()}>
          <Overlay className="flex items-end justify-center" onClick={() => setEditingItemId(null)}>
            <Frame className="gap-2 p-4">
              <DatePickerCalendar
                value={formatEventDate(eventDate)}
                defaultMonth={formatEventDate(eventDate)}
                onChange={(date) => handlePickItemDate(editingItemId, date)}
              />
            </Frame>
          </Overlay>
        </div>
      )}
    </div>
  );
}

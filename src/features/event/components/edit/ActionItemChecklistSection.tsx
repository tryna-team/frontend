/**
 * 일정 수정 화면(EventEditBottomSheet)의 "체크리스트" 섹션에서 쓰는 표시 컴포넌트.
 * 준비/실행 항목 목록을 보여주고, 완료 토글과 항목별 날짜(ChipButton) 편집을 담당한다.
 *
 * "직접 추가" 입력 폼(텍스트 입력 + 캘린더/라벨 칩, E105 저장 연동)은 피그마
 * (node 3303:37852) 기준 이 화면에 없어 제거된 상태 — 다시 필요해지면 이 파일에
 * 복원하면 된다(이전 구현은 git 이력의 ActionItemEditBottomSheet.tsx 참고).
 *
 * 항목 텍스트를 눌러 새로 추가하거나 제목을 고치는 인라인 입력 — 이 컴포넌트 자체는 저장
 * API를 호출하지 않고, 로컬 상태(labelOverrides/localNewItems/dateOverrides)만 들고
 * 있다가 onPendingChanges로 부모(EventEditBottomSheet)에 보고한다. 실제 저장은 "완료"
 * 버튼을 눌렀을 때 부모가 C107 PATCH의 actionItems 필드에 실어서 한 번에 보낸다.
 * 날짜 편집(ChipButton)도 08/13 백엔드 소스(EventUpdateService.syncActionItems →
 * ActionItems.updateDetails)로 displayDate/displayTime/itemType이 실제로 저장됨을
 * 확인해서 dateOverrides로 함께 보고한다.
 */
import { useEffect, useRef, useState } from 'react';

import { format, isSameDay } from 'date-fns';

import Checklist from '@/components/common/Checklist/Checklist';
import type { ChecklistItemData } from '@/components/common/Checklist/Checklist';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import DatePickerCalendar from '@/features/event/components/create/DatePickerCalendar';

import type { ActionItemEditItem } from './ActionItemEditItem';

const ADD_ITEM_ROW_ID = -1;
const UNTIMED_DATE_TEXT = '당일';

const formatEventDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`);

// 인라인 입력 중인 대상 — 새 항목 추가 or 기존 항목 제목 수정
type InlineEditMode = { type: 'add' } | { type: 'edit'; itemId: number };

// 날짜 편집 결과 — handlePickItemDate가 판정한 itemType과 그에 맞는 displayDate.
// UNTIMED_PREP은 displayDate를 항상 null로 보낸다(백엔드 hasInvalidDisplayFields 검증과
// DB 체크 제약이 TIMED_ACTION만 displayDate NOT NULL을 요구 — 08/13 소스 확인).
export type ActionItemDateOverride = {
  itemType: 'UNTIMED_PREP' | 'TIMED_ACTION';
  displayDate: string | null;
};

// 저장 API를 직접 호출하지 않고 부모에 보고하는 "아직 저장 안 된 변경사항".
// 부모가 "완료" 시 C107 PATCH의 actionItems에 실어 보낸다.
export type ActionItemPendingChanges = {
  // 기존 항목 id -> 새 제목
  labelOverrides: Record<number, string>;
  // 기존 항목 id -> 새 날짜(및 그에 따른 itemType)
  dateOverrides: Record<number, ActionItemDateOverride>;
  // 로컬에서만 존재하는 새 항목(아직 actionItemId 없음)
  newItems: { label: string }[];
};

type ActionItemChecklistSectionProps = {
  // 'YYYY-MM-DD'. "당일" 판정 기준(=부모 일정 날짜)이자 UNTIMED_PREP 항목의 표시 날짜.
  eventDate: string;
  items: ActionItemEditItem[];
  onToggleItem?: (id: number) => void;
  // labelOverrides/localNewItems가 바뀔 때마다 호출된다 — 안정적인 참조(예: state
  // setter, useCallback)를 넘겨야 불필요한 재호출을 피할 수 있다.
  onPendingChanges?: (pending: ActionItemPendingChanges) => void;
};

export function ActionItemChecklistSection({
  eventDate,
  items,
  onToggleItem,
  onPendingChanges,
}: ActionItemChecklistSectionProps) {
  // 체크 상태 등 실제 데이터는 items(부모 prop)를 그대로 신뢰한다 — 예전엔
  // useState(items)로 마운트 시점에 한 번만 복사해서, 바텀시트가 열려있는 동안
  // 부모가 새 데이터를 내려줘도(다른 곳에서 완료 처리 후 리페치된 경우 등) 반영이
  // 안 되는 문제가 있었다. 서버에 저장할 API가 아직 없는 "날짜 편집"/"제목 편집"만
  // 이 컴포넌트 안에서 덧입혀서 보여준다.
  const [dateTextOverrides, setDateTextOverrides] = useState<Record<number, string>>({});
  const [dateOverrides, setDateOverrides] = useState<Record<number, ActionItemDateOverride>>({});
  const [labelOverrides, setLabelOverrides] = useState<Record<number, string>>({});
  // 로컬에서만 존재하는 새 항목(⚠️ API 미연동 — 새로고침하면 사라짐)
  const [localNewItems, setLocalNewItems] = useState<ActionItemEditItem[]>([]);
  const nextLocalIdRef = useRef(-2);

  // ChipButton(날짜 뱃지)을 눌러 날짜를 편집 중인 항목의 id
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // 텍스트를 눌러 추가/수정 중인 행 — 둘 중 하나만 동시에 활성화될 수 있다.
  const [inlineMode, setInlineMode] = useState<InlineEditMode | null>(null);
  const [inlineValue, setInlineValue] = useState('');
  // Escape로 취소했을 때, 뒤이어 발생하는 blur가 다시 커밋해버리지 않도록 막는 플래그
  const skipBlurCommitRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // 인라인 입력이 열릴 때 체크리스트 섹션을 스크롤 상단으로 붙인다 — 네이티브처럼
  // 키보드가 화면을 밀어 헤더 바로 아래로 붙는 동작의 웹 환경 근사치.
  useEffect(() => {
    if (inlineMode) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [inlineMode]);

  // labelOverrides/dateOverrides/localNewItems가 바뀔 때마다 부모에 현재 상태를
  // 보고한다 — 부모는 "완료" 시점에 이 값을 그대로 PATCH 바디에 실어 보낸다.
  useEffect(() => {
    onPendingChanges?.({
      labelOverrides,
      dateOverrides,
      newItems: localNewItems.map((item) => ({ label: item.label })),
    });
  }, [labelOverrides, dateOverrides, localNewItems, onPendingChanges]);

  const localItems = items.map((item) => ({
    ...item,
    label: labelOverrides[item.id] ?? item.label,
    dateText: dateTextOverrides[item.id] !== undefined ? dateTextOverrides[item.id] : item.dateText,
  }));

  const handleToggle = (id: number) => {
    if (id === ADD_ITEM_ROW_ID) {
      handleLabelClick(id);
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
    // 판정한다. "당일로 설정" 같은 별도 버튼 없이 날짜 선택만으로 유형을 정하는 임시 처리.
    const isUntimed = isSameDay(pickedDate, formatEventDate(eventDate));
    const dateText = isUntimed
      ? UNTIMED_DATE_TEXT
      : `${pickedDate.getMonth() + 1}월 ${pickedDate.getDate()}일`;

    setDateTextOverrides((prev) => ({ ...prev, [itemId]: dateText }));
    setDateOverrides((prev) => ({
      ...prev,
      [itemId]: isUntimed
        ? { itemType: 'UNTIMED_PREP', displayDate: null }
        : { itemType: 'TIMED_ACTION', displayDate: format(pickedDate, 'yyyy-MM-dd') },
    }));
    setEditingItemId(null);
  };

  const closeInlineMode = () => {
    setInlineMode(null);
    setInlineValue('');
  };

  const handleLabelClick = (id: number) => {
    if (id === ADD_ITEM_ROW_ID) {
      setInlineMode({ type: 'add' });
      setInlineValue('');
      return;
    }

    const target = localItems.find((item) => item.id === id);
    setInlineMode({ type: 'edit', itemId: id });
    setInlineValue(target?.label ?? '');
  };

  const handleInlineCommit = () => {
    const trimmed = inlineValue.trim();

    if (inlineMode?.type === 'add') {
      if (trimmed) {
        // 이 시점엔 저장 안 함 — onPendingChanges로 부모에 보고되고, "완료" 시 부모가
        // C107 PATCH의 actionItems.items에 실어 보낸다.
        // id 확정/ref 감소는 updater 밖에서 먼저 끝낸다 — StrictMode가 updater를 두 번
        // 호출해도 ref가 중복 감소하거나 두 호출이 서로 다른 id를 쓰는 일이 없도록.
        const localId = nextLocalIdRef.current;
        nextLocalIdRef.current -= 1;
        setLocalNewItems((prev) => [...prev, { id: localId, label: trimmed, checked: false }]);
      }
    } else if (inlineMode?.type === 'edit') {
      if (trimmed) {
        // 이 시점엔 저장 안 함 — 위와 동일하게 "완료" 시 부모가 실어 보낸다.
        setLabelOverrides((prev) => ({ ...prev, [inlineMode.itemId]: trimmed }));
      }
    }

    closeInlineMode();
  };

  const handleInlineCancel = () => {
    skipBlurCommitRef.current = true;
    closeInlineMode();
  };

  const toChecklistItemData = (item: ActionItemEditItem): ChecklistItemData => ({
    id: item.id,
    label: item.label,
    // EventViewPage(DailyScheduleCard)와 동일하게 radioVariant="event" + 이 매핑을
    // 그대로 맞춘다 — 미완료(default)=선명한 빈 원, 완료(done)=흐린 체크 아이콘.
    status: item.checked ? 'done' : 'default',
    trailing: item.dateText
      ? {
          type: 'date' as const,
          text: item.dateText,
          onClick: () => setEditingItemId(item.id),
        }
      : { type: 'none' as const },
  });

  const allEntries: ActionItemEditItem[] = [
    ...localItems,
    ...localNewItems,
    { id: ADD_ITEM_ROW_ID, label: '직접 추가', checked: false },
  ];

  const editingRowId = inlineMode?.type === 'add' ? ADD_ITEM_ROW_ID : (inlineMode?.itemId ?? null);
  const editingIndex = editingRowId === null ? -1 : allEntries.findIndex((entry) => entry.id === editingRowId);

  const beforeItems = (editingIndex === -1 ? allEntries : allEntries.slice(0, editingIndex)).map((entry) =>
    entry.id === ADD_ITEM_ROW_ID
      ? { id: ADD_ITEM_ROW_ID, label: entry.label, status: 'plus' as const, trailing: { type: 'none' as const } }
      : toChecklistItemData(entry),
  );
  const afterItems = (editingIndex === -1 ? [] : allEntries.slice(editingIndex + 1)).map((entry) =>
    entry.id === ADD_ITEM_ROW_ID
      ? { id: ADD_ITEM_ROW_ID, label: entry.label, status: 'plus' as const, trailing: { type: 'none' as const } }
      : toChecklistItemData(entry),
  );

  return (
    <div ref={sectionRef} className="flex w-full flex-col">
      {/* Checklist의 컨테이너가 w-[353px]로 고정돼 있어(피그마의 393px 프레임 기준),
          여기(ContentBox 안쪽 padding까지 걸친 실제 폭)에서는 그보다 좁아서 항목 우측
          버튼(날짜 칩 등)이 밖으로 밀려난다 — w-full로 덮어써서 실제 컨테이너 폭에
          맞춘다. */}
      <div className="w-full [&>div]:w-full">
        <Checklist
          items={beforeItems}
          radioVariant="event"
          onLeadingClick={handleToggle}
          onLabelClick={handleLabelClick}
        />
      </div>

      {inlineMode && (
        <div className="flex w-full items-center py-1">
          <input
            key={inlineMode.type === 'add' ? 'add-row' : `edit-row-${inlineMode.itemId}`}
            type="text"
            autoFocus
            aria-label={inlineMode.type === 'add' ? '할 일 추가' : '할 일 제목 수정'}
            value={inlineValue}
            onChange={(event) => setInlineValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleInlineCommit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                handleInlineCancel();
              }
            }}
            onBlur={() => {
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              handleInlineCommit();
            }}
            placeholder={inlineMode.type === 'add' ? '할 일을 입력해주세요' : undefined}
            className="default-body-large w-full border-0 bg-transparent p-0 text-text-default outline-none placeholder:text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]"
          />
        </div>
      )}

      <div className="w-full [&>div]:w-full">
        <Checklist
          items={afterItems}
          radioVariant="event"
          onLeadingClick={handleToggle}
          onLabelClick={handleLabelClick}
        />
      </div>

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

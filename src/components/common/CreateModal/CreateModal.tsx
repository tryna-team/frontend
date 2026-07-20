import { useMemo } from 'react';

import Button from '@/components/common/Buttons/Button';
import Checklist, {
  type ChecklistItemData,
} from '@/components/common/Checklist/Checklist';

import type { ChecklistStatus } from '@/components/common/Checklist/ChecklistItem';

export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

export type CalendarStatus =
  | {
      type: 'default';
    }
  | {
      type: 'repeat';
      text: string;
    };

export type LabelStatus =
  | {
      type: 'default';
    }
  | {
      type: 'selected';
      label: string;
      color: LabelColor;
    };

// 기존 CreateModal에서 사용하던 체크리스트 데이터 타입을 유지
type CreateModalChecklistItem = {
  id: number;
  label: string;
  status?: ChecklistStatus;
  // status=add, done일 때 사용. 없으면 '당일'로 표시
  date?: string;
};

export type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: CreateModalChecklistItem[];
  calendarStatus?: CalendarStatus;
  labelStatus?: LabelStatus;
  onInputChange?: (value: string) => void;
  onOpenCalendar?: () => void;
  onOpenLabel?: () => void;
  onAddChecklist?: () => void;
  onToggleChecklist?: (id: number) => void;
  onDeleteChecklist?: (id: number) => void;
};

const COLOR_ICON = {
  apricot: '/icon/color_picker/apricot_small.svg',
  blue: '/icon/color_picker/blue_small.svg',
  green: '/icon/color_picker/green_small.svg',
  pink: '/icon/color_picker/pink_small.svg',
  purple: '/icon/color_picker/purple_small.svg',
  yellow: '/icon/color_picker/yellow_small.svg',
} as const;

// 직접 추가 항목에 사용하는 내부 전용 ID
// 실제 체크리스트 ID와 겹치지 않도록 음수를 사용
const ADD_CHECKLIST_ITEM_ID = -1;

export default function CreateModal({
  mode = 'default',
  inputValue = '',
  keyword = '',
  message = '',
  checklistItems = [],
  calendarStatus = { type: 'default' },
  labelStatus = { type: 'default' },
  onInputChange,
  onOpenCalendar,
  onOpenLabel,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
}: CreateModalProps) {
  const isRecommendMode =
    mode === 'recommend';

  const calendarText =
    calendarStatus.type === 'default'
      ? '오늘 · 반복 없음'
      : `${calendarStatus.text}마다`;

  // CreateModal에서 전달받은 기존 체크리스트 데이터를 공용 Checklist 컴포넌트의 데이터 형식으로 변환
  const renderedChecklistItems =
    useMemo<ChecklistItemData[]>(() => {
      const recommendedItems =
        checklistItems.map((item) => {
          const status =
            item.status ?? 'add';
          const hasDateTrailing =
            status === 'add' ||
            status === 'done';

          return {
            id: item.id,
            label: item.label,
            status,
            trailing: hasDateTrailing
              ? {
                  type: 'date' as const,
                  text:
                    item.date ?? '당일',
                }
              : {
                  type: 'none' as const,
                },
          };
        });

      const addItem: ChecklistItemData = {
        id: ADD_CHECKLIST_ITEM_ID,
        label: '직접 추가',
        status: 'plus',
        trailing: {
          type: 'none',
        },
      };

      return [
        ...recommendedItems,
        addItem,
      ];
    }, [checklistItems]);

  const handleChecklistClick = (
    id: number,
  ) => {
    if (
      id === ADD_CHECKLIST_ITEM_ID
    ) {
      onAddChecklist?.();
      return;
    }

    onToggleChecklist?.(id);
  };

  const handleDeleteChecklist = (
    id: number,
  ) => {
    // 내부 전용 직접 추가 항목은 삭제할 수 없음
    if (
      id === ADD_CHECKLIST_ITEM_ID
    ) {
      return;
    }

    onDeleteChecklist?.(id);
  };

  return (
    <section className="flex w-full max-w-[385px] flex-col items-start gap-0.5 rounded-[24px] border border-[rgba(28,22,48,0.05)] bg-background-white p-3">
      {!isRecommendMode && (
        <div className="flex w-full items-center justify-between self-stretch pl-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) =>
              onInputChange?.(
                event.target.value,
              )
            }
            placeholder="어떤 일 인가요?"
            className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
          />

          <Button
            variant="MediumDefaultFit"
            disabled
          >
            생성
          </Button>
        </div>
      )}

      {isRecommendMode && (
        <div className="flex w-full flex-col">
          <div className="flex w-full items-center justify-between px-1 py-2">
            <p className="min-w-0 text-text-additional default-body-medium">
              <span className="bg-gradient-to-l from-[#29C878] to-[#32E089] bg-clip-text text-transparent default-body-strong-medium">
                {keyword}
              </span>

              {message}
            </p>
          </div>

          <Checklist
            items={
              renderedChecklistItems
            }
            radioVariant="create"
            onLeadingClick={
              handleChecklistClick
            }
            onDelete={
              handleDeleteChecklist
            }
          />

          <div className="flex w-full items-center justify-between self-stretch pl-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) =>
                onInputChange?.(
                  event.target.value,
                )
              }
              placeholder="어떤 일 인가요?"
              className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
            />

            <Button variant="MediumDefaultFit">
              생성
            </Button>
          </div>
        </div>
      )}

      <div className="flex w-full items-center gap-4 px-1 py-1">
        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex items-center gap-xsmall border-0 bg-transparent p-0 text-text-additional default-caption-large"
        >
          <img
            src="/icon/icons/calendar_small.svg"
            alt=""
            className="block shrink-0"
          />

          <span className="whitespace-nowrap">
            {calendarText}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenLabel}
          className="flex min-w-0 items-center gap-xsmall border-0 bg-transparent p-0 text-text-additional default-caption-large"
        >
          <img
            src="/icon/icons/label_small.svg"
            alt=""
            className="block shrink-0"
          />

          {labelStatus.type ===
          'default' ? (
            <span className="whitespace-nowrap">
              레이블 없음
            </span>
          ) : (
            <div className="flex min-w-0 items-center gap-xsmall">
              <span className="max-w-[80px] truncate">
                {labelStatus.label}
              </span>

              <img
                src={
                  COLOR_ICON[
                    labelStatus.color
                  ]
                }
                alt=""
                className="block shrink-0"
              />
            </div>
          )}
        </button>
      </div>
    </section>
  );
}

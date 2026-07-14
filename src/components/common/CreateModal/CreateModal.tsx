// src/components/common/CreateModal/CreateModal.tsx

import ChecklistItem, {
  type ChecklistStatus,
} from '@/components/common/Checklist/ChecklistItem';

export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

export type CalendarStatus =
  | { type: 'default' }
  | {
      type: 'repeat';
      text: string;
    };

export type LabelStatus =
  | { type: 'default' }
  | {
      type: 'selected';
      label: string;
      color: LabelColor;
    };

type ChecklistItemData = {
  id: number;
  label: string;
  status?: ChecklistStatus;
};

type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: ChecklistItemData[];
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
  const isRecommendMode = mode === 'recommend';

  const calendarText =
    calendarStatus.type === 'default'
      ? '오늘 · 반복 없음'
      : `${calendarStatus.text}마다`;

  return (
    <section className="flex w-full max-w-[385px] flex-col items-start gap-0.5 rounded-[24px] border border-[rgba(28,22,48,0.05)] bg-background-white p-3">
      {!isRecommendMode && (
        <div className="flex w-full items-center justify-between self-stretch pl-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange?.(event.target.value)}
            placeholder="어떤 일 인가요?"
            className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
          />

          {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
          <span className="box-border flex h-9 w-[74px] shrink-0 items-center justify-center whitespace-nowrap text-text-default default-body-strong-medium">
            전송
          </span>
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

          <div className="border-b border-divider-default" />

          <div className="flex w-full flex-col">
            {checklistItems.map((item) => (
              <div key={item.id}>
                <div className="flex h-[46px] w-full items-center justify-between py-3 pr-1">
                  <ChecklistItem
                    label={item.label}
                    status={item.status ?? 'add'}
                    iconSize="medium"
                    trailing={{
                      type: 'delete',
                      onClick: () => onDeleteChecklist?.(item.id),
                    }}
                    onLeadingClick={() =>
                      onToggleChecklist?.(item.id)
                    }
                  />
                </div>

                <div className="border-b border-divider-default" />
              </div>
            ))}

            <div className="flex h-[46px] w-full items-center py-3">
              <ChecklistItem
                label="직접 추가"
                status="plus"
                iconSize="small"
                trailing={{ type: 'none' }}
                onLeadingClick={onAddChecklist}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between self-stretch pl-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange?.(event.target.value)}
              placeholder="어떤 일 인가요?"
              className="h-9 min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-disable default-body-medium"
            />

            {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
            <span className="box-border flex h-9 w-[74px] shrink-0 items-center justify-center whitespace-nowrap text-text-default default-body-strong-medium">
              전송
            </span>
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

          {labelStatus.type === 'default' ? (
            <span className="whitespace-nowrap">
              레이블 없음
            </span>
          ) : (
            <div className="flex min-w-0 items-center gap-xsmall">
              <span className="max-w-[80px] truncate">
                {labelStatus.label}
              </span>

              <img
                src={COLOR_ICON[labelStatus.color]}
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
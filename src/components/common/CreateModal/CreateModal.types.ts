import type { ChecklistStatus } from '@/components/common/Checklist/ChecklistItem';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import type { RecommendationCandidate } from '@/stores/types';
import type { ActionItemType } from '@/stores/types';

export type LabelColor = 'apricot' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow';

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
      id: number;
      label: string;
      color: LabelColor;
    };

export type CreateModalChecklistItem = {
  id: number;
  label: string;
  status?: ChecklistStatus;
  itemType?: ActionItemType;
  date?: string;
};

export type CreateModalProps = {
  mode?: 'default' | 'recommend';
  inputValue?: string;
  keyword?: string;
  message?: string;
  checklistItems?: CreateModalChecklistItem[];
  initialScheduleDate?: Date;
  calendarStatus?: CalendarStatus;
  labelStatus?: LabelStatus;
  labels?: LabelItemData[];
  pendingSelectedLabelId?: number | null;
  onInputChange?: (value: string) => void;
  onOpenCalendar?: () => void;
  onOpenLabel?: () => void;
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
  onAddChecklist?: () => void;
  onToggleChecklist?: (id: number) => void;
  onCreate?: (createdDate: string) => void;
  onClose?: () => void;
};

export type RecommendationEditDraft = {
  candidateId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  originalItemType: RecommendationCandidate['itemType'];
  originalApiItemType: NonNullable<RecommendationCandidate['apiItemType']>;
  originalDisplayDate: string | null;
  originalDisplayEndDate: string | null;
  originalDisplayTime: string | null;
  hasTimeChanged: boolean;
};

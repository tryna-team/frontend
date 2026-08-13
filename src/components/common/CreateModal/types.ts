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
  /**
   * 라벨 생성 시트가 열려 있는지. 열려 있는 동안에는 생성 모달을 숨긴다.
   *
   * 생성 모달은 document.body로 포털되는데 라벨 시트는 앱 프레임 안에서 렌더링된다.
   * 프레임에 transform이 걸려 별도의 쌓임 맥락이 생기므로, 같은 z-index여도 시트가
   * 항상 모달 뒤에 가려진다. 날짜·반복 시트가 이미 같은 방식으로 모달을 숨기고 있다.
   */
  isLabelCreateOpen?: boolean;
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
  date: Date;
  originalItemType: RecommendationCandidate['itemType'];
  originalApiItemType: NonNullable<RecommendationCandidate['apiItemType']>;
  originalDisplayDate: string | null;
};

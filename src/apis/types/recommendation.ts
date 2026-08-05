import type { EventDateSource, EventSourceType } from "./event";

export type RecommendationStatus = "READY" | "EMPTY" | "ERROR";

export type RecommendationItemType =
  | "TIMED_ACTION"
  | "UNTIMED_PREP"
  | "UNRESOLVED";

/** D101~D105 추천 파이프라인 요청 */
export interface RecommendationRequest {
  tempEventId: string;
  draftRevision: number;
  eventTitle: string;
  sourceType: EventSourceType;
  startDateCandidate: string;
  startTimeCandidate?: string | null;
  endDateCandidate?: string | null;
  endTimeCandidate?: string | null;
  startDateSource?: EventDateSource;
  placeCandidate?: string | null;
  description?: string | null;
  embeddingWords?: string[];
}

/** 유형은 날짜 존재 여부보다 항상 우선한다. */
export interface RecommendationSuggestion {
  sourceCode?: string;
  displayText?: string;
  itemType?: RecommendationItemType;
  offsetDays?: number | null;
  displayDate?: string | null;
  actionType?: string;
  targetType?: string;
  defaultTiming?: string;
  selectionRank?: number;
  parentTempEventId?: string;
}

export interface RecommendationResponse {
  tempEventId?: string;
  draftRevision?: number;
  suggestionStatus?: RecommendationStatus;
  suggestions?: RecommendationSuggestion[];
  errors?: string[];
}

export type ActionItemCreatedBy = "SYSTEM" | "USER" | "USER_EDITED";

export type RecommendationFeedbackAction =
  | "SELECTED"
  | "REJECTED"
  | "EDITED"
  | "USER_ADDED";

/** E105 최종 저장 대상 항목 */
export interface ActionItemSaveItem {
  title: string;
  itemType: RecommendationItemType;
  createdBy: ActionItemCreatedBy;
  displayDate?: string | null;
  displayTime?: string | null;
  offsetDays?: number | null;
  sourceTemplateId?: string | null;
}

/** E105 사용자 선택·수정 이력을 전달한다. */
export interface RecommendationFeedback {
  actionType: RecommendationFeedbackAction;
  sourceTemplateId?: string | null;
  originalTitle?: string | null;
  editedTitle?: string | null;
  reason?: string | null;
}

export interface ActionItemSaveRequest {
  items: ActionItemSaveItem[];
  feedbackLogs: RecommendationFeedback[];
}

/** 일정 생성 응답에 포함되는 저장 항목 */
export type SavedActionItem = ActionItemSaveItem;


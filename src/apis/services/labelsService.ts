import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  LabelListResponseData,
  LabelResponseData,
  CreateLabelRequestBody,
  UpdateLabelRequestBody,
  DeleteLabelResponseData,
  ReorderLabelsRequestBody,
  ReorderLabelsResponseData,
} from "../types/labels";
import type { CalendarLabel } from "@/stores/types";
import type { LabelColor } from "@/components/common/LabelModal/LabelItem";

export const labelsService = {
  /** 라벨 목록 조회 — GET /api/v1/labels (B108-1) */
  getList: () => apiClient.get<LabelListResponseData>(ENDPOINTS.LABELS.ROOT),

  /** 라벨 생성 — POST /api/v1/labels (B108-2) */
  create: (body: CreateLabelRequestBody) =>
    apiClient.post<LabelResponseData>(ENDPOINTS.LABELS.ROOT, body),

  /** 라벨 수정 — PATCH /api/v1/labels/{labelId} (B108-3) */
  update: (labelId: number | string, body: UpdateLabelRequestBody) =>
    apiClient.patch<LabelResponseData>(ENDPOINTS.LABELS.DETAIL(labelId), body),

  /** 라벨 삭제 — DELETE /api/v1/labels/{labelId} (B108-4) */
  remove: (labelId: number | string) =>
    apiClient.delete<DeleteLabelResponseData>(ENDPOINTS.LABELS.DETAIL(labelId)),

  /** 라벨 순서 변경 — PATCH /api/v1/labels/order (B108-5) */
  reorder: (body: ReorderLabelsRequestBody) =>
    apiClient.patch<ReorderLabelsResponseData>(ENDPOINTS.LABELS.ORDER, body),
};

/**
 * API 응답(LabelResponseData, apis/types/labels.ts)을 store 도메인 타입인
 * CalendarLabel(src/stores/types.ts)로 변환한다.
 *
 * color 변환: API는 색상을 UPPERCASE(예: "GREEN")로 내려주지만, 화면에서는
 * LabelColor(src/components/common/LabelModal/LabelItem.tsx, lowercase, 아이콘
 * 매핑용 COLOR_ICON과 함께 정의됨)를 그대로 재사용한다. 두 타입의 6개 값 집합은
 * 완전히 동일하고 대소문자만 다르므로 toLowerCase()만으로 안전하게 변환된다.
 */
export function toCalendarLabel(label: LabelResponseData): CalendarLabel {
  return {
    labelId: label.labelId,
    externalCalendarId: label.externalCalendarId,
    name: label.name,
    labelType: label.labelType,
    color: label.color.toLowerCase() as LabelColor,
    isDefault: label.isDefault,
    isVisible: label.isVisible,
    sortOrder: label.sortOrder,
  };
}

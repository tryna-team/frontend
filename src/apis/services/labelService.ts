import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  LabelListResponseData,
  LabelCreateRequest,
  LabelUpdateRequest,
  LabelReorderRequest,
  LabelReorderResponseData,
  LabelDeleteResponseData,
  LabelResponseItem,
  LabelColorCode,
} from "../types/label";
import type { CalendarLabel } from "../../stores/types";

/**
 * API 응답(LabelResponseItem)을 스토어/화면용 타입(CalendarLabel)으로 변환한다.
 * color만 대문자("GREEN") → 소문자("green")로 바뀌는데, enum 값 자체가 알파벳만
 * 다르고 철자가 같아서 대소문자 변환만으로 충분하다.
 */
export function toCalendarLabel(item: LabelResponseItem): CalendarLabel {
  return {
    labelId: item.labelId,
    externalCalendarId: item.externalCalendarId,
    name: item.name,
    labelType: item.labelType,
    color: item.color.toLowerCase(),
    isDefault: item.isDefault,
    isVisible: item.isVisible,
    sortOrder: item.sortOrder,
  };
}

/** 화면(LabelColor, 소문자)에서 API(LabelColorCode, 대문자)로 보낼 때 쓰는 역변환 */
export function toLabelColorCode(color: string): LabelColorCode {
  return color.toUpperCase() as LabelColorCode;
}

export const labelService = {
  /** B108-1 라벨 목록 조회 — GET /api/v1/labels */
  getLabels: () => apiClient.get<LabelListResponseData>(ENDPOINTS.LABELS.ROOT),

  /** B108-2 라벨 생성 — POST /api/v1/labels. 기본 라벨/외부 캘린더 라벨은 이 API로 생성 불가 */
  createLabel: (request: LabelCreateRequest) =>
    apiClient.post<LabelResponseItem>(ENDPOINTS.LABELS.ROOT, request),

  /** B108-3 라벨 수정 — PATCH /api/v1/labels/{labelId}. request는 변경할 필드만 담아 전달 */
  updateLabel: (labelId: number, request: LabelUpdateRequest) =>
    apiClient.patch<LabelResponseItem>(ENDPOINTS.LABELS.DETAIL(labelId), request),

  /**
   * B108-4 라벨 삭제 — DELETE /api/v1/labels/{labelId}.
   * 서버가 기본 라벨 재지정·소속 일정 이동(movedEventCount)까지 트랜잭션으로 처리한다.
   * 마지막 남은 활성 Tryna 라벨은 400으로 거부되고, 외부 캘린더 라벨은 이 API로 삭제할 수 없다.
   */
  deleteLabel: (labelId: number) =>
    apiClient.delete<LabelDeleteResponseData>(ENDPOINTS.LABELS.DETAIL(labelId)),

  /**
   * B108-5 라벨 순서 변경 — PATCH /api/v1/labels/order.
   * request.labelIds는 변경 후 최종 순서대로 나열한 "전체 활성 라벨" 목록이어야 하며,
   * 배열의 첫 번째 라벨이 새로운 기본 라벨로 자동 지정된다.
   */
  reorderLabels: (request: LabelReorderRequest) =>
    apiClient.patch<LabelReorderResponseData>(ENDPOINTS.LABELS.ORDER, request),
};

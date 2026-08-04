/**
 * 라벨(레이블) 도메인 타입 (label-controller API 명세서 기준, B108-1~5)
 */

// API가 실제로 내려주는 색상값. 화면 표시(아이콘 매핑 등)에는 이 값을 그대로 쓰지 않고
// LabelColor(src/components/common/LabelModal/LabelItem.tsx, lowercase)로 변환해서 쓴다.
// 6개 값 자체는 두 타입이 동일하고 대소문자만 다르다 — 변환은 apis/services/labelService.ts 참고.
export type ApiLabelColor = 'GREEN' | 'YELLOW' | 'PURPLE' | 'BLUE' | 'APRICOT' | 'PINK';

export type LabelType = 'USER' | 'EXTERNAL_CALENDAR';

/**
 * GET /api/v1/labels, POST /api/v1/labels, PATCH /api/v1/labels/{labelId} 응답의 라벨 항목.
 */
export interface LabelResponseData {
  labelId: number;
  externalCalendarId: number | null;
  name: string;
  labelType: LabelType;
  color: ApiLabelColor;
  isDefault: boolean;
  isVisible: boolean;
  sortOrder: number;
}

/** GET /api/v1/labels 응답 data 필드 (B108-1) */
export interface LabelListResponseData {
  labels: LabelResponseData[];
}

/** POST /api/v1/labels 요청 body (B108-2) */
export interface CreateLabelRequestBody {
  name: string;
  color?: ApiLabelColor;
}

/** PATCH /api/v1/labels/{labelId} 요청 body — 하나 이상 전달 (B108-3) */
export interface UpdateLabelRequestBody {
  name?: string;
  color?: ApiLabelColor;
  isVisible?: boolean;
}

/** DELETE /api/v1/labels/{labelId} 응답 data 필드 (B108-4) */
export interface DeleteLabelResponseData {
  deletedLabelId: number;
  movedEventCount: number;
  destinationLabelId: number;
  defaultLabelChanged: boolean;
}

/** PATCH /api/v1/labels/order 요청 body (B108-5) */
export interface ReorderLabelsRequestBody {
  labelIds: number[];
}

/** PATCH /api/v1/labels/order 응답 data 필드 (B108-5) */
export interface ReorderLabelsResponseData {
  labels: LabelResponseData[];
}

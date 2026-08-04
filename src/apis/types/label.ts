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

// 유니온 멤버 중 하나의 키만 필수로, 나머지는 optional로 남기는 걸 각 키마다
// 반복해서 유니온으로 묶는다 — "최소 하나는 있어야 함"을 표현하는 표준 패턴.
type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * PATCH /api/v1/labels/{labelId} 요청 body — 하나 이상 전달 (B108-3)
 * 전부 optional로 두면 {}(빈 객체)도 타입상 허용되는데, 실제 API는 값이 하나도
 * 없으면 400(B108_LABEL_UPDATE_400)을 반환한다 — RequireAtLeastOne으로 {}를 컴파일
 * 타임에 막는다.
 */
export type UpdateLabelRequestBody = RequireAtLeastOne<{
  name?: string;
  color?: ApiLabelColor;
  isVisible?: boolean;
}>;

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

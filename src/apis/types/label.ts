/**
 * label 도메인 타입 (B108-1~5 API 명세서 PDF 기준)
 * ⚠️ Swagger(실서버)에는 아직 반영되지 않은 신규 API — 명세서 PDF 기준으로 작성했고,
 * 실제 배포 후 응답 구조가 다르면 다시 확인해야 한다.
 */

export type LabelType = "USER" | "EXTERNAL_CALENDAR";

/** 6가지 프리셋 색상 — 서버는 대문자 enum으로 주고받는다 (stores/types.ts의 CalendarLabel.color는 소문자라 매핑 필요) */
export type LabelColorCode =
  | "GREEN"
  | "BLUE"
  | "APRICOT"
  | "PINK"
  | "YELLOW"
  | "PURPLE";

/** B108-1/2/3/5 응답에 공통으로 쓰이는 라벨 한 건 */
export interface LabelResponseItem {
  labelId: number;
  externalCalendarId: number | null;
  name: string;
  labelType: LabelType;
  color: LabelColorCode;
  isDefault: boolean;
  isVisible: boolean;
  sortOrder: number;
}

/** B108-1 라벨 목록 조회 응답 */
export interface LabelListResponseData {
  labels: LabelResponseItem[];
}

/** B108-2 라벨 생성 요청 — name 필수, color 미전달 시 서버 기본 색상 적용 */
export interface LabelCreateRequest {
  name: string;
  color?: LabelColorCode;
}

/** B108-3 라벨 수정 요청 — 변경할 값만 하나 이상 전달(labelType/externalCalendarId/isDefault/sortOrder는 이 API로 변경 불가) */
export interface LabelUpdateRequest {
  name?: string;
  color?: LabelColorCode;
  isVisible?: boolean;
}

/** B108-4 라벨 삭제 응답 — 서버가 기본 라벨 재지정·소속 일정 이동까지 트랜잭션으로 처리한 결과 */
export interface LabelDeleteResponseData {
  deletedLabelId: number;
  movedEventCount: number;
  destinationLabelId: number;
  defaultLabelChanged: boolean;
}

/** B108-5 라벨 순서 변경 요청 — 변경 후 최종 순서대로 정렬한 전체 활성 라벨 labelId 목록 */
export interface LabelReorderRequest {
  labelIds: number[];
}

/** B108-5 라벨 순서 변경 응답 — 배열의 첫 번째가 새 기본 라벨로 자동 지정됨 */
export interface LabelReorderResponseData {
  labels: LabelResponseItem[];
}

/**
 * ActionItemChecklistSection이 다루는 체크리스트 항목 하나의 화면 표시용 데이터 타입.
 * 실제 API 응답 타입(EventActionItem 등)과는 별개로, 체크리스트 UI 렌더링에 필요한
 * 최소 필드만 담는다 — EventViewPage.tsx가 실제 응답을 이 형태로 변환해서 넘긴다.
 */
export type ActionItemEditItem = {
  id: number;
  label: string;
  checked: boolean;
  dateText?: string;
};

import { useLocation } from 'react-router';

// react-router 내부 구현(window.history.state.idx)에 의존하지 않고
// 공개 API(location.key)로 "이 앱 내에서 뒤로 갈 히스토리가 있는지" 판단.
// 딥링크/새로고침으로 처음 진입한 경우 key가 'default'로 고정됨.
//
// ⚠️ 알려진 한계: key는 push/replace 상관없이 내비게이션마다 새로 생성되기 때문에,
// "/daily/:date" 같은 URL로 이 탭에 처음 진입한 뒤(Home을 거치지 않음) replace
// 계열 이동(WeekStrip 클릭, 오늘 버튼 등)이 한 번이라도 일어나면 실제로는 뒤로 갈
// 곳이 없는데도 이 함수가 true를 반환할 수 있음. 이 경우 handleBack의
// navigate(-1)이 앱 밖으로 나가버릴 수 있음.
// 지금은 이 진입 경로(Daily URL 직접 진입)가 실제로 없어서 영향이 없지만,
// 알림/공유 링크 등으로 딥링크 진입이 생기면 location.state에 직접 관리하는
// 내비게이션 깊이 카운터를 두는 방식으로 다시 구현해야 함(관련 논의: 코드래빗 리뷰).
export function useCanGoBack() {
  return useLocation().key !== 'default';
}

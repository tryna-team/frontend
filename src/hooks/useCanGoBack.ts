import { useLocation } from 'react-router';

// react-router 내부 구현(window.history.state.idx)에 의존하지 않고
// 공개 API(location.key)로 "이 앱 내에서 뒤로 갈 히스토리가 있는지" 판단.
// 딥링크/새로고침으로 처음 진입한 경우 key가 'default'로 고정됨.
export function useCanGoBack() {
  return useLocation().key !== 'default';
}

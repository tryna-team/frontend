import { createContext, useContext, useEffect, type ReactNode } from 'react';

type SetFloatingContent = (content: ReactNode) => void;

// App.tsx가 setter를 Provider로 내려주고, 각 페이지는 useFloatingButtons(content)로
// 자기 FloatingButtons 콘텐츠를 등록한다. 페이지가 언마운트되면 자동으로 비워진다.
// ⚠️ content는 반드시 useMemo로 감싼 안정적인 참조를 넘겨야 함 — 매 렌더마다 새로
// 생성되는 JSX를 그대로 넘기면 setState → 리렌더 → 새 JSX 생성이 반복되는 무한
// 루프("Maximum update depth exceeded")가 발생함.
export const FloatingButtonsContext = createContext<SetFloatingContent | null>(null);

export function useFloatingButtons(content: ReactNode) {
  const setFloatingContent = useContext(FloatingButtonsContext);

  useEffect(() => {
    setFloatingContent?.(content);

    return () => setFloatingContent?.(null);
  }, [content, setFloatingContent]);
}

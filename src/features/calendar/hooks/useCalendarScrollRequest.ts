import { useCallback, useRef, useState } from 'react';

export type CalendarScrollRequest<TPayload extends object> = TPayload & {
  requestId: number;
};

function useCalendarScrollRequest<TPayload extends object>() {
  const [scrollRequest, setScrollRequest] = useState<CalendarScrollRequest<TPayload> | null>(null);
  const requestIdRef = useRef(0);

  const requestScroll = useCallback((payload: TPayload) => {
    requestIdRef.current += 1;
    setScrollRequest({
      ...payload,
      requestId: requestIdRef.current,
    });
  }, []);

  const completeScroll = useCallback((requestId: number) => {
    setScrollRequest((currentRequest) =>
      currentRequest?.requestId === requestId ? null : currentRequest,
    );
  }, []);

  return {
    scrollRequest,
    requestScroll,
    completeScroll,
  };
}

export default useCalendarScrollRequest;

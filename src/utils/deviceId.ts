const DEVICE_ID_STORAGE_KEY = "tryna_device_id";

/** UUID v4 생성 — crypto.randomUUID 우선 사용, 미지원 환경(구형 브라우저/webview)은 폴백 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 기기별 고유 deviceId를 반환한다.
 * LocalStorage에 없으면 새로 생성해 저장한다 (앱 재설치/브라우저 데이터 삭제 전까지 유지).
 * 로그인·재발급·로그아웃 요청에 그대로 실려 보내지는 값이므로, 세션 중에는 바뀌면 안 된다.
 *
 * window가 없는 환경(SSR 등)에서는 LocalStorage에 접근할 수 없으므로 저장 없이
 * 매번 새 UUID만 반환한다. authStore.ts와 동일한 가드 패턴.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return generateUUID();
  }

  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

/**
 * 완전한 기기 초기화가 필요할 때만 사용한다 (예: 회원 탈퇴 후).
 * 일반 로그아웃 시에는 호출하지 않는다 — deviceId는 기기 식별용이라
 * 로그아웃 여부와 무관하게 유지되어야 한다.
 */
export function resetDeviceId(): string {
  const deviceId = generateUUID();

  if (typeof window !== "undefined") {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}
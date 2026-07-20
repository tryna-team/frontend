const DEVICE_ID_STORAGE_KEY = "tryna_device_id";

/**
 * UUID v4 생성 (crypto.randomUUID 우선 사용, 미지원 환경 폴백 포함)
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // 폴백: crypto.randomUUID 미지원 환경 (구형 브라우저/webview 등)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 기기별 고유 deviceId를 반환한다.
 * LocalStorage에 없으면 새로 생성해 저장 후 반환 (앱 재설치/브라우저 데이터 삭제 전까지 유지)
 * 로그아웃(DELETE /api/v1/auth-sessions/me?deviceId=)이나 로그인(POST /api/v1/auth-sessions)
 * 요청에 그대로 실어 보내는 값이므로, 세션 중에는 값이 바뀌면 안 된다.
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

/**
 * 완전한 기기 초기화가 필요한 경우(예: 회원 탈퇴 후)에만 사용.
 * 일반 로그아웃 시에는 호출하지 않는다 — deviceId는 기기 식별용이라 로그아웃과 무관하게 유지되어야 함.
 */
export function resetDeviceId(): string {
  const deviceId = generateUUID();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}
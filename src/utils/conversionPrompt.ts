/**
 * 비회원 → 회원 전환 유도 시트의 노출 이력.
 *
 * 일정을 만들 때마다 뜨면 이탈 요인이 되어 기기당 1회만 노출한다.
 * 계정을 지우고 완전히 새로 시작하는 경우(회원탈퇴)에는 이 이력도 함께 지워야
 * 새 비회원에게 다시 안내가 나간다 — 그래서 deviceId를 다루는 쪽과 같은 위치에 둔다.
 */

const CONVERSION_PROMPT_SHOWN_KEY = 'tryna_conversion_prompt_shown';

export function hasShownConversionPrompt(): boolean {
  return Boolean(localStorage.getItem(CONVERSION_PROMPT_SHOWN_KEY));
}

export function markConversionPromptShown(): void {
  localStorage.setItem(CONVERSION_PROMPT_SHOWN_KEY, 'true');
}

export function clearConversionPromptHistory(): void {
  localStorage.removeItem(CONVERSION_PROMPT_SHOWN_KEY);
}

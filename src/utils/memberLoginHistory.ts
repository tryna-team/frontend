/**
 * 이 기기에서 정식 회원으로 로그인한 적이 있는지에 대한 이력.
 *
 * A106 회원 전환은 이미 가입된 소셜 계정이면 AUTH_409로 막힌다. 그 시점엔 백엔드가
 * 인가 코드를 이미 토큰으로 교환해 소진한 뒤라, 로그인하려면 새 코드를 받아야 하고
 * 결국 구글 팝업이 한 번 더 뜬다. 그런데 팝업을 띄우기 전에는 그 구글 계정이 가입돼
 * 있는지 알 방법이 프론트에 없다.
 *
 * 그래서 "이 기기에서 이미 회원 로그인을 했다"는 사실을 대신 근거로 쓴다. 로그아웃 후
 * 재로그인이라면 그 계정은 이미 가입돼 있어 전환은 어차피 409로 막히므로, 아예 시도하지
 * 않고 A105로 바로 보내 팝업을 한 번만 띄운다.
 *
 * 회원탈퇴하면 계정이 사라져 다시 전환이 가능해지므로 이 이력도 함께 지운다
 * — conversionPrompt/deviceId와 같은 이유이고, 같은 위치에서 관리한다.
 */

const MEMBER_LOGIN_KEY = 'tryna_member_logged_in';

export function hasMemberLoggedInOnDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(localStorage.getItem(MEMBER_LOGIN_KEY));
}

export function markMemberLoggedInOnDevice(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(MEMBER_LOGIN_KEY, 'true');
}

export function clearMemberLoginHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(MEMBER_LOGIN_KEY);
}

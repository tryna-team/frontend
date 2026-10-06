// 팝업 열림·닫힘 애니메이션 (tw-animate-css)
// Radix Dialog가 data-state를 open/closed로 바꾸고, 닫힘 애니메이션이 끝난 뒤에 화면에서 제거한다.
// 움직임 줄이기 설정에서는 motion-safe 조건이 적용되지 않아 애니메이션 없이 바로 열고 닫는다.

// dim과 팝업 본체가 같은 속도로 움직이도록 시간을 공유한다
const duration = 'duration-200';

// dim 배경: 서서히 나타나고 사라짐
export const overlayAnimationClassName = [
  'motion-safe:data-[state=open]:animate-in data-[state=open]:fade-in',
  'motion-safe:data-[state=closed]:animate-out data-[state=closed]:fade-out',
  duration,
].join(' ');

// 바텀시트: 아래에서 올라오고 아래로 내려감. 이동 거리는 Content 높이(시트 + 하단 여백)의 100%
export const sheetAnimationClassName = [
  'motion-safe:data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
  'motion-safe:data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
  duration,
  'ease-out',
].join(' ');

// 토스트: 화면 가운데에서 살짝 커지며 나타나고, 작아지며 사라짐 (95% ↔ 100%)
export const toastAnimationClassName = [
  'motion-safe:data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
  'motion-safe:data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
  duration,
  'ease-out',
].join(' ');

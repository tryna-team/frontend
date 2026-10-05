import { useRef } from 'react';
import { Dialog } from 'radix-ui';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { cn } from '@/utils/cn';
import { overlayAnimationClassName, sheetAnimationClassName } from '../shared/popupAnimation';
import { popupOverlayClassName } from '../shared/popupOverlay';
import {
  BOTTOM_SHEET_HEIGHT_RATIO,
  bottomSheetContentClassName,
  bottomSheetHeightClassNames,
  bottomSheetSurfaceClassName,
  type BottomSheetProps,
} from './BottomSheetType';

// TODO(레이아웃 구현 후): 지금은 dim과 시트가 브라우저 화면 전체 폭 기준으로 뜬다.
// 앱 레이아웃(src/layouts)을 만들 때 데스크톱에서 시트를 앱 프레임(가운데 모바일 화면 영역) 폭에 맞출지 정하고,
// 맞춘다면 프레임의 위치·폭을 구하는 훅(useAppFrameRect, 7_14 CreateModal/hooks/useViewport.ts 참고)을 추가해
// Overlay·Content의 left/width에 적용한다.
export function BottomSheet(props: BottomSheetProps) {
  const { open, onClose, title, description, height = 'auto', className, children } = props;
  // 열려 있을 때만 키보드·화면 높이 변화를 구독 (닫힘 애니메이션 중에는 마지막 값 유지)
  const viewport = useVisualViewport(open);
  const contentRef = useRef<HTMLDivElement>(null);
  // 닫을 때 포커스를 돌려줄 요소. Dialog.Trigger 없이 open으로 제어하므로 Radix가 대신 기억하지 않는다
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sheetHeight = Math.round(viewport.height * BOTTOM_SHEET_HEIGHT_RATIO);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {/* Overlay·Content는 Portal의 직접 자식이어야 닫힘 애니메이션이 끝날 때까지 유지된다 */}
      <Dialog.Portal>
        <Dialog.Overlay className={cn(popupOverlayClassName, overlayAnimationClassName)} />
        <Dialog.Content
          ref={contentRef}
          className={cn(bottomSheetContentClassName, sheetAnimationClassName)}
          style={{ bottom: viewport.keyboardInset }}
          // 설명이 없으면 aria-describedby를 붙이지 않는다
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
          // 입력창이 있어도 열자마자 키보드가 뜨지 않도록, 첫 입력창 대신 시트 자체에 포커스
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            contentRef.current?.focus();
          }}
          // 닫히면 열기 전에 포커스가 있던 곳으로 되돌린다 (스크린 리더 사용자가 읽던 위치를 잃지 않도록)
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          {/* 스크린 리더용 이름·설명. 보이는 제목과 중복 낭독되지 않도록 숨긴다 */}
          <Dialog.Title hidden>{title}</Dialog.Title>
          {description !== undefined && (
            <Dialog.Description hidden>{description}</Dialog.Description>
          )}

          <div
            className={cn(
              bottomSheetSurfaceClassName,
              bottomSheetHeightClassNames[height],
              className,
            )}
            style={height === 'full' ? { height: sheetHeight } : { maxHeight: sheetHeight }}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

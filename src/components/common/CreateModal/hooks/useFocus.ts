import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, FocusEvent, KeyboardEvent, RefObject, SetStateAction } from 'react';

import { FOCUSABLE_SELECTOR } from '../constants';

type UseCreateModalFocusParams = {
  dialogRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  labelButtonRef: RefObject<HTMLButtonElement | null>;
  isExitConfirmOpen: boolean;
  isLabelModalOpen: boolean;
  isScheduleOpen: boolean;
  setIsLabelModalOpen: Dispatch<SetStateAction<boolean>>;
  handleCloseRequest: () => void;
  handleExitConfirmClose: () => void;
};

export const useCreateModalFocus = ({
  dialogRef,
  inputRef,
  labelButtonRef,
  isExitConfirmOpen,
  isLabelModalOpen,
  isScheduleOpen,
  setIsLabelModalOpen,
  handleCloseRequest,
  handleExitConfirmClose,
}: UseCreateModalFocusParams) => {
  const keepKeyboardOpenRef = useRef(true);
  const isScheduleOpeningRef = useRef(false);
  const isKeyboardNavigationRef = useRef(false);

  // 생성 모달 안에서는 입력 포커스를 유지한다.
  const handleInputBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      // 추천 항목 제목을 누르면 해당 입력창으로 포커스를 넘긴다.
      if (
        event.relatedTarget instanceof HTMLElement &&
        event.relatedTarget.dataset.recommendationTitleInput === 'true'
      ) {
        return;
      }

      if (isKeyboardNavigationRef.current && event.relatedTarget instanceof HTMLElement) {
        isKeyboardNavigationRef.current = false;
        return;
      }

      isKeyboardNavigationRef.current = false;

      window.requestAnimationFrame(() => {
        if (keepKeyboardOpenRef.current) {
          inputRef.current?.focus();
        }
      });
    },
    [inputRef],
  );

  // Tab 이동은 다른 컨트롤의 포커스를 유지한다.
  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      isKeyboardNavigationRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handleDialogKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isScheduleOpen) { return; }

      if (event.key === 'Escape') {
        event.preventDefault();

        if (isExitConfirmOpen) {
          handleExitConfirmClose();
          return;
        }

        if (isLabelModalOpen) {
          setIsLabelModalOpen(false);
          window.requestAnimationFrame(() => {
            labelButtonRef.current?.focus();
          });
          return;
        }

        handleCloseRequest();
        return;
      }

      if (event.key !== 'Tab') { return; }

      const dialog = dialogRef.current;

      if (!dialog) { return; }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const isFocusOutside = !dialog.contains(activeElement);

      if (event.shiftKey && (activeElement === firstElement || isFocusOutside)) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && (activeElement === lastElement || isFocusOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);

    return () => document.removeEventListener('keydown', handleDialogKeyDown);
  }, [
    dialogRef,
    handleCloseRequest,
    handleExitConfirmClose,
    isExitConfirmOpen,
    isLabelModalOpen,
    isScheduleOpen,
    labelButtonRef,
    setIsLabelModalOpen,
  ]);

  return {
    keepKeyboardOpenRef,
    isScheduleOpeningRef,
    handleInputBlur,
    handleInputKeyDown,
  };
};

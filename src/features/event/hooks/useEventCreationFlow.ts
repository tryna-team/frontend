import { useCallback, useState } from 'react';

import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';

interface UseEventCreationFlowOptions {
  onCreated: (createdDate: string) => void;
}

function useEventCreationFlow({ onCreated }: UseEventCreationFlowOptions) {
  const { promptIfGuest } = useGuestConversionPrompt();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);
  const [isLabelCreateOpen, setIsLabelCreateOpen] = useState(false);
  const [pendingSelectedLabelId, setPendingSelectedLabelId] = useState<number | null>(null);

  const closeCreationFlow = useCallback(() => {
    setIsCreateModalOpen(false);
    setInitialCreateDate(null);
    setIsLabelCreateOpen(false);
    setPendingSelectedLabelId(null);
  }, []);

  const resetCreationFlow = useCallback(() => {
    closeCreationFlow();
    setCreateInputValue('');
  }, [closeCreationFlow]);

  const openCreateModal = useCallback((initialDate?: Date) => {
    setInitialCreateDate(initialDate ?? null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    closeCreationFlow();
  }, [closeCreationFlow]);

  const completeCreate = useCallback(
    (createdDate: string) => {
      onCreated(createdDate);
      resetCreationFlow();
      promptIfGuest();
    },
    [onCreated, promptIfGuest, resetCreationFlow],
  );

  const openLabelCreate = useCallback(() => {
    setIsLabelCreateOpen(true);
  }, []);

  const closeLabelCreate = useCallback(() => {
    setIsLabelCreateOpen(false);
  }, []);

  const completeLabelCreate = useCallback((labelId: number) => {
    setPendingSelectedLabelId(labelId);
    setIsLabelCreateOpen(false);
  }, []);

  return {
    isCreateModalOpen,
    createInputValue,
    initialCreateDate,
    isLabelCreateOpen,
    pendingSelectedLabelId,
    setCreateInputValue,
    openCreateModal,
    closeCreateModal,
    completeCreate,
    openLabelCreate,
    closeLabelCreate,
    completeLabelCreate,
  };
}

export default useEventCreationFlow;

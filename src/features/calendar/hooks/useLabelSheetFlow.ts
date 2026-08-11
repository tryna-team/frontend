import { useCallback, useState } from 'react';

import type { CalendarLabel } from '@/stores/types';

type LabelSheetState =
  | { view: 'closed' }
  | { view: 'list' }
  | { view: 'create' }
  | { view: 'edit'; label: CalendarLabel };

const CLOSED_LABEL_SHEET_STATE: LabelSheetState = { view: 'closed' };

function useLabelSheetFlow() {
  const [labelSheetState, setLabelSheetState] = useState<LabelSheetState>(
    CLOSED_LABEL_SHEET_STATE,
  );

  const openLabelList = useCallback(() => {
    setLabelSheetState({ view: 'list' });
  }, []);

  const openLabelCreate = useCallback(() => {
    setLabelSheetState({ view: 'create' });
  }, []);

  const openLabelEdit = useCallback((label: CalendarLabel) => {
    setLabelSheetState({ view: 'edit', label });
  }, []);

  const closeLabelSheet = useCallback(() => {
    setLabelSheetState(CLOSED_LABEL_SHEET_STATE);
  }, []);

  return {
    labelSheetState,
    openLabelList,
    openLabelCreate,
    openLabelEdit,
    closeLabelSheet,
  };
}

export default useLabelSheetFlow;

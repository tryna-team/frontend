export type TodoVariant = 'daily' | 'eventView' | 'eventCreate';

// EventCreate: plus(추가), selected(선택), unSelected(미선택)
// Daily, EventView: done(완료), unDone(미완료)
export type TodoStatus =
    | 'plus'
    | 'selected'
    | 'unSelected'
    | 'done'
    | 'unDone';
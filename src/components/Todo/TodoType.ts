export type TodoVariant = 'daily' | 'eventView' | 'eventCreate';

// EventCreate: plus(추가), selected(선택), unSelected(미선택)
// Daily, EventView: done(완료), unDone(미완료)
export type TodoStatus = 'plus' | 'selected' | 'unSelected' | 'done' | 'unDone';

// # Todo data type
export type DailyTodoData = {
  id: number;
  status: 'done' | 'unDone';
  text: string;
  date?: string;
};

export type EventViewTodoData = {
  id: number;
  status: 'done' | 'unDone';
  text: string;
  date: string;
};

export type EventCreateTodoData = {
  id: number;
  status: 'selected' | 'unSelected';
  text: string;
  date: string;
};

// variant별 Todo data 연결
export type TodoDataByVariant = {
    daily: DailyTodoData;
    eventView: EventViewTodoData;
    eventCreate: EventCreateTodoData;
};
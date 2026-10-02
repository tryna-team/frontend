// src/hooks/useTodo.ts

import { useState } from 'react';

import type {
  EventCreateTodoData,
  TodoDataByVariant,
  TodoVariant,
} from '@/components/Todo/TodoType';

// # 타입 영역
type UpdateTodoData = {
  text?: string;
  date?: string;
};

// # hook
export default function useTodo<V extends TodoVariant>(
  variant: V,
  initialTodos: TodoDataByVariant[V][] = [],
) {
  const [todos, setTodos] = useState<TodoDataByVariant[V][]>(initialTodos);

  // Todo id 생성
  function createTodoId() {
    return todos.length === 0
      ? 1
      : Math.max(...todos.map((todo) => todo.id)) + 1;
  }

  // eventCreate Todo 추가
  function addTodo(text: string, date: string) {
    if (variant !== 'eventCreate') {
      return;
    }

    const newTodo: EventCreateTodoData = {
      id: createTodoId(),
      text,
      date,
      status: 'selected',
    };

    setTodos((prevTodos) => [
      ...prevTodos,
      newTodo as TodoDataByVariant[V],
    ]);
  }

  // selected <-> unSelected
  function toggleSelected(id: number) {
    if (variant !== 'eventCreate') {
      return;
    }

    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }

        if (todo.status === 'selected') {
          return {
            ...todo,
            status: 'unSelected',
          } as TodoDataByVariant[V];
        }

        if (todo.status === 'unSelected') {
          return {
            ...todo,
            status: 'selected',
          } as TodoDataByVariant[V];
        }

        return todo;
      }),
    );
  }

  // done <-> unDone
  function toggleDone(id: number) {
    if (variant === 'eventCreate') {
      return;
    }

    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }

        if (todo.status === 'done') {
          return {
            ...todo,
            status: 'unDone',
          } as TodoDataByVariant[V];
        }

        if (todo.status === 'unDone') {
          return {
            ...todo,
            status: 'done',
          } as TodoDataByVariant[V];
        }

        return todo;
      }),
    );
  }

  // Todo 수정
  function updateTodo(id: number, data: UpdateTodoData) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id
          ? ({
              ...todo,
              ...data,
            } as TodoDataByVariant[V])
          : todo,
      ),
    );
  }

  // selected Todo 반환
  function getSelectedTodos(): EventCreateTodoData[] {
    if (variant !== 'eventCreate') {
      return [];
    }

    return todos.filter(
      (todo): todo is TodoDataByVariant[V] & EventCreateTodoData =>
        todo.status === 'selected',
    );
  }

  return {
    todos,
    addTodo,
    toggleSelected,
    toggleDone,
    updateTodo,
    getSelectedTodos,
  };
}
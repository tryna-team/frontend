import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent } from 'react';

import type {
  TimePickerColumnProps,
  TimePickerColumnValue,
  TimePickerDialProps,
  TimePickerMeridiem,
  TimePickerValue,
} from './TimePickerDial.types';

import './TimePickerDial.css';

export type {
  TimePickerMeridiem,
  TimePickerValue,
} from './TimePickerDial.types';

const ITEM_HEIGHT = 34;
const VISIBLE_ITEM_COUNT = 5;

// 선택 영역을 가운데로 맞추기 위한 위·아래 여백 개수
const SIDE_SPACER_COUNT = Math.floor(
  VISIBLE_ITEM_COUNT / 2,
);

// 스크롤이 멈춘 것으로 판단하는 시간(ms)
const SCROLL_END_DELAY = 100;

// 무한 스크롤을 구현하기 위해 동일한 데이터를 반복 생성
const CIRCULAR_REPEAT_COUNT = 101;

const CIRCULAR_CENTER_REPEAT = Math.floor(
  CIRCULAR_REPEAT_COUNT / 2,
);

// 가장자리 근처까지 이동하면 가운데로 재배치하는 기준
const RECENTER_EDGE_REPEAT_COUNT = 3;

const MERIDIEM_VALUES = [
  'AM', 'PM',
] as const satisfies readonly TimePickerMeridiem[];

const HOUR_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

// 분 단위가 유효하지 않으면 기본값(5분)을 사용
function normalizeMinuteStep(
  minuteStep: number,
) {
  if (
    !Number.isInteger(minuteStep) ||
    minuteStep < 1 ||
    minuteStep > 30 ||
    60 % minuteStep !== 0
  ) {
    return 5;
  }

  return minuteStep;
}

function clampIndex(
  index: number,
  itemCount: number,
) {
  return Math.min(
    Math.max(index, 0),
    itemCount - 1,
  );
}

// 반복 배열의 실제 인덱스를 원본 데이터의 인덱스로 변환
function getLogicalIndex(
  absoluteIndex: number,
  valueCount: number,
) {
  return (
    ((absoluteIndex % valueCount) +
      valueCount) %
    valueCount
  );
}

function getDirection(
  previousIndex: number,
  nextIndex: number,
): -1 | 0 | 1 {
  if (nextIndex > previousIndex) {
    return 1;
  }

  if (nextIndex < previousIndex) {
    return -1;
  }

  return 0;
}

function getInitialAbsoluteIndex<
  T extends TimePickerColumnValue,
>(
  values: readonly T[],
  selectedValue: T,
  circular: boolean,
) {
  const selectedLogicalIndex = Math.max(
    values.indexOf(selectedValue),
    0,
  );

  if (!circular) {
    return selectedLogicalIndex;
  }

  return (
    CIRCULAR_CENTER_REPEAT *
      values.length +
    selectedLogicalIndex
  );
}

function TimePickerColumn<
  T extends TimePickerColumnValue,
>({
  ariaLabel,
  values,
  selectedValue,
  formatValue,
  onChange,
  className,
  circular = false,
}: TimePickerColumnProps<T>) {
  const generatedId = useId();

  const columnId = generatedId.replace(
    /:/g,
    '',
  );

  const initialIndex =
    getInitialAbsoluteIndex(
      values,
      selectedValue,
      circular,
    );

  const scrollContainerRef =
    useRef<HTMLDivElement>(null);

  const scrollEndTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const externalSyncFrameRef =
    useRef<number | null>(null);

  const currentAbsoluteIndexRef =
    useRef(initialIndex);

  const [activeIndex, setActiveIndex] =
    useState(() => initialIndex);

  const internallyChangedValueRef =
    useRef<T | null>(null);

  // 무한 스크롤을 위해 원본 데이터를 여러 번 반복 생성
  const renderedValues = useMemo(() => {
    if (!circular) {
      return [...values];
    }

    return Array.from(
      {
        length:
          values.length *
          CIRCULAR_REPEAT_COUNT,
      },
      (_, index) =>
        values[index % values.length],
    );
  }, [circular, values]);

  const getValueAtIndex = useCallback(
    (absoluteIndex: number) => {
      const logicalIndex =
        getLogicalIndex(
          absoluteIndex,
          values.length,
        );

      return values[logicalIndex];
    },
    [values],
  );

  const getOptionId = useCallback(
    (absoluteIndex: number) =>
      `time-picker-${columnId}-option-${absoluteIndex}`,
    [columnId],
  );

  const setCurrentIndex = useCallback(
    (nextIndex: number) => {
      currentAbsoluteIndexRef.current =
        nextIndex;

      setActiveIndex(nextIndex);
    },
    [],
  );

  const setScrollPosition = useCallback(
    (
      absoluteIndex: number,
      behavior: ScrollBehavior,
    ) => {
      const scrollContainer =
        scrollContainerRef.current;

      if (!scrollContainer) {
        return;
      }

      scrollContainer.scrollTo({
        top: absoluteIndex * ITEM_HEIGHT,
        behavior,
      });
    },
    [],
  );

  // 스크롤이 반복 배열의 시작 또는 끝에 가까워지면 같은 값을 유지한 채 가운데 영역으로 다시 이동
  const recenterIfNearEdge =
    useCallback(
      (absoluteIndex: number) => {
        if (!circular) {
          return absoluteIndex;
        }

        const valueCount = values.length;

        const edgeItemCount =
          valueCount *
          RECENTER_EDGE_REPEAT_COUNT;

        const isNearStart =
          absoluteIndex < edgeItemCount;

        const isNearEnd =
          absoluteIndex >
          renderedValues.length -
            edgeItemCount;

        if (
          !isNearStart &&
          !isNearEnd
        ) {
          return absoluteIndex;
        }

        const logicalIndex =
          getLogicalIndex(
            absoluteIndex,
            valueCount,
          );

        const centeredIndex =
          CIRCULAR_CENTER_REPEAT *
            valueCount +
          logicalIndex;

        setCurrentIndex(centeredIndex);

        setScrollPosition(
          centeredIndex,
          'auto',
        );

        return centeredIndex;
      },
      [
        circular,
        renderedValues.length,
        setCurrentIndex,
        setScrollPosition,
        values.length,
      ],
    );

  const commitIndex = useCallback(
    (
      requestedIndex: number,
      scrollToItem = false,
    ) => {
      const previousIndex =
        currentAbsoluteIndexRef.current;

      const nextIndex = circular
        ? requestedIndex
        : clampIndex(
            requestedIndex,
            renderedValues.length,
          );

      const previousValue =
        getValueAtIndex(previousIndex);

      const nextValue =
        getValueAtIndex(nextIndex);

      const direction = getDirection(
        previousIndex,
        nextIndex,
      );

      setCurrentIndex(nextIndex);

      if (scrollToItem) {
        setScrollPosition(
          nextIndex,
          'smooth',
        );
      }

      if (
        previousIndex !== nextIndex ||
        previousValue !== nextValue
      ) {
        internallyChangedValueRef.current =
          nextValue;

        onChange(nextValue, {
          previousValue,
          nextValue,
          previousIndex,
          nextIndex,
          direction,
        });
      }

      recenterIfNearEdge(nextIndex);
    },
    [
      circular,
      getValueAtIndex,
      onChange,
      recenterIfNearEdge,
      renderedValues.length,
      setCurrentIndex,
      setScrollPosition,
    ],
  );

  // 스크롤이 멈춘 시점의 가장 가까운 항목을 선택
  const handleScroll = () => {
    if (scrollEndTimerRef.current) {
      clearTimeout(
        scrollEndTimerRef.current,
      );
    }

    scrollEndTimerRef.current =
      setTimeout(() => {
        const scrollContainer =
          scrollContainerRef.current;

        if (!scrollContainer) {
          return;
        }

        const nearestIndex = Math.round(
          scrollContainer.scrollTop /
            ITEM_HEIGHT,
        );

        commitIndex(nearestIndex);
      }, SCROLL_END_DELAY);
  };

  const handleItemClick = (
    absoluteIndex: number,
  ) => {
    commitIndex(absoluteIndex, true);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    const currentIndex =
      currentAbsoluteIndexRef.current;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();

        commitIndex(
          currentIndex - 1,
          true,
        );
        break;

      case 'ArrowDown':
        event.preventDefault();

        commitIndex(
          currentIndex + 1,
          true,
        );
        break;

      case 'PageUp':
        event.preventDefault();

        commitIndex(
          currentIndex - 2,
          true,
        );
        break;

      case 'PageDown':
        event.preventDefault();

        commitIndex(
          currentIndex + 2,
          true,
        );
        break;

      case 'Home':
        if (!circular) {
          event.preventDefault();
          commitIndex(0, true);
        }
        break;

      case 'End':
        if (!circular) {
          event.preventDefault();

          commitIndex(
            renderedValues.length - 1,
            true,
          );
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    setScrollPosition(
      initialIndex,
      'auto',
    );
  }, [
    initialIndex,
    setScrollPosition,
  ]);

  useEffect(() => {
    if (
      internallyChangedValueRef.current ===
      selectedValue
    ) {
      internallyChangedValueRef.current =
        null;

      return;
    }

    const currentIndex =
      currentAbsoluteIndexRef.current;

    const currentValue =
      getValueAtIndex(currentIndex);

    if (currentValue === selectedValue) {
      return;
    }

    let nextIndex: number;

    if (!circular) {
      nextIndex = Math.max(
        values.indexOf(selectedValue),
        0,
      );
    } else {
      const currentLogicalIndex =
        getLogicalIndex(
          currentIndex,
          values.length,
        );

      const targetLogicalIndex =
        Math.max(
          values.indexOf(
            selectedValue,
          ),
          0,
        );

      const forwardDistance =
        (targetLogicalIndex -
          currentLogicalIndex +
          values.length) %
        values.length;

      const backwardDistance =
        forwardDistance -
        values.length;

      const nearestDistance =
        Math.abs(forwardDistance) <=
        Math.abs(backwardDistance)
          ? forwardDistance
          : backwardDistance;

      nextIndex =
        currentIndex +
        nearestDistance;
    }

    if (
      externalSyncFrameRef.current
    ) {
      cancelAnimationFrame(
        externalSyncFrameRef.current,
      );
    }

    externalSyncFrameRef.current =
      requestAnimationFrame(() => {
        setCurrentIndex(nextIndex);

        setScrollPosition(
          nextIndex,
          'auto',
        );

        externalSyncFrameRef.current =
          null;
      });

    return () => {
      if (
        externalSyncFrameRef.current
      ) {
        cancelAnimationFrame(
          externalSyncFrameRef.current,
        );

        externalSyncFrameRef.current =
          null;
      }
    };
  }, [
    circular,
    getValueAtIndex,
    selectedValue,
    setCurrentIndex,
    setScrollPosition,
    values,
  ]);

  useEffect(() => {
    return () => {
      if (
        scrollEndTimerRef.current
      ) {
        clearTimeout(
          scrollEndTimerRef.current,
        );
      }

      if (
        externalSyncFrameRef.current
      ) {
        cancelAnimationFrame(
          externalSyncFrameRef.current,
        );
      }
    };
  }, []);

  const rootClassName = [
    'time-picker-dial__column',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={scrollContainerRef}
      className={rootClassName}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={getOptionId(
        activeIndex,
      )}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {Array.from({
        length: SIDE_SPACER_COUNT,
      }).map((_, index) => (
        <div
          key={`top-spacer-${index}`}
          className="time-picker-dial__spacer"
          aria-hidden="true"
        />
      ))}

      {renderedValues.map(
        (
          itemValue,
          absoluteIndex,
        ) => {
          const isActive =
            absoluteIndex ===
            activeIndex;

          return (
            <button
              key={`${String(
                itemValue,
              )}-${absoluteIndex}`}
              id={getOptionId(
                absoluteIndex,
              )}
              type="button"
              role="option"
              aria-selected={isActive}
              className={[
                'time-picker-dial__item',
                isActive
                  ? 'time-picker-dial__item--selected'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() =>
                handleItemClick(
                  absoluteIndex,
                )
              }
            >
              {formatValue(
                itemValue,
              )}
            </button>
          );
        },
      )}

      {Array.from({
        length: SIDE_SPACER_COUNT,
      }).map((_, index) => (
        <div
          key={`bottom-spacer-${index}`}
          className="time-picker-dial__spacer"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function TimePickerDial({
  value,
  onChange,
  minuteStep = 5,
  className,
}: TimePickerDialProps) {
  const normalizedMinuteStep =
    normalizeMinuteStep(minuteStep);

  const minuteValues = useMemo(() => {
    const values: number[] = [];

    for (
      let minute = 0;
      minute < 60;
      minute +=
        normalizedMinuteStep
    ) {
      values.push(minute);
    }

    return values;
  }, [normalizedMinuteStep]);

  const updateValue = <
    Key extends keyof TimePickerValue,
  >(
    key: Key,
    nextValue: TimePickerValue[Key],
  ) => {
    if (value[key] === nextValue) {
      return;
    }

    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  const handleHourChange = (
    nextHour: number,
  ) => {
    if (value.hour === nextHour) {
      return;
    }

    onChange({
      ...value,
      hour: nextHour,
    });
  };

  const rootClassName = [
    'time-picker-dial',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={rootClassName}
      aria-label="시간 선택"
    >
      <div className="time-picker-dial__viewport">
        <div
          className="time-picker-dial__selected-row"
          aria-hidden="true"
        />

        <div className="time-picker-dial__columns">
          <TimePickerColumn
            ariaLabel="오전 또는 오후"
            className="time-picker-dial__column--meridiem"
            values={MERIDIEM_VALUES}
            selectedValue={
              value.meridiem
            }
            formatValue={(
              meridiem,
            ) =>
              meridiem === 'AM'
                ? '오전'
                : '오후'
            }
            onChange={(meridiem) =>
              updateValue(
                'meridiem',
                meridiem,
              )
            }
          />

          <TimePickerColumn
            ariaLabel="시"
            values={HOUR_VALUES}
            selectedValue={value.hour}
            formatValue={(hour) =>
              String(hour)
            }
            onChange={
              handleHourChange
            }
            circular
          />

          <TimePickerColumn
            ariaLabel="분"
            className="time-picker-dial__column--minute"
            values={minuteValues}
            selectedValue={
              value.minute
            }
            formatValue={(minute) =>
              String(minute).padStart(
                2,
                '0',
              )
            }
            onChange={(minute) =>
              updateValue(
                'minute',
                minute,
              )
            }
            circular
          />
        </div>

        <div
          className="time-picker-dial__fade time-picker-dial__fade--top"
          aria-hidden="true"
        />

        <div
          className="time-picker-dial__fade time-picker-dial__fade--bottom"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
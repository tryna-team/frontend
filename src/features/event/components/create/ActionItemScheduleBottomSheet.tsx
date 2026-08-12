import { useId } from 'react';

import { isAfter } from 'date-fns';

import Button from '@/components/common/Buttons/Button';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';

import DatePickerCalendar from './DatePickerCalendar';

const CONTENT_BOX_LAYOUT_CLASS =
  'w-full [&>div]:overflow-hidden [&>div>div:last-child]:items-center [&>div>div:last-child]:px-0';

export type ActionItemScheduleValue = {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
};

export type ActionItemScheduleBottomSheetProps = ActionItemScheduleValue & {
  title: string;
  parentEventStartDate: Date;
  parentEventEndDate: Date;
  onChange: (value: ActionItemScheduleValue) => void;
  onClose: () => void;
};

export default function ActionItemScheduleBottomSheet({
  title,
  parentEventStartDate,
  parentEventEndDate,
  startDate,
  endDate,
  startTime,
  endTime,
  onChange,
  onClose,
}: ActionItemScheduleBottomSheetProps) {
  const titleId = useId();

  const handleDateChange = (date: Date) => {
    onChange({
      startDate: date,
      endDate: isAfter(date, endDate) ? date : endDate,
      startTime,
      endTime,
    });
  };

  return (
    <Overlay className="flex items-end justify-center">
      <video
        src="/BlendDimVideo.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <Frame className="relative z-10 gap-4 !bg-white px-4 pt-5 pb-1" aria-labelledby={titleId}>
        <p id={titleId} className="w-full px-padding-medium text-text-additional default-body-small">
          {title}
        </p>

        <div className={CONTENT_BOX_LAYOUT_CLASS}>
          <ContentBox title="">
            <div className="pb-3">
              <DatePickerCalendar
                value={startDate}
                defaultMonth={startDate}
                referenceDate={parentEventStartDate}
                referenceEndDate={parentEventEndDate}
                showCurrentDay={false}
                onChange={handleDateChange}
              />
            </div>
          </ContentBox>
        </div>

        <div className={`${CONTENT_BOX_LAYOUT_CLASS} [&>div]:!overflow-visible`}>
          <ContentBox title="" variant="bottom">
            <div className="w-full pb-4">
              <Button variant="LargeDefaultFull" onClick={onClose}>
                닫기
              </Button>
            </div>
          </ContentBox>
        </div>
      </Frame>
    </Overlay>
  );
}

/**
 * @module components/DeadlineCalendar
 *
 * Visual calendar component showing upcoming deadlines,
 * hearing dates, and filing windows. Color-coded by
 * urgency with click-to-expand detail views and
 * calendar export functionality.
 */

import React from 'react';

export interface DeadlineCalendarProps {
  /** Deadlines to display on the calendar */
  deadlines: unknown[];
  /** Callback when a deadline is clicked */
  onDeadlineClick?: (deadlineId: string) => void;
}

export const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({ deadlines, onDeadlineClick }) => {
  // TODO: Implement visual calendar with deadline display
  return (
    <div data-testid="deadline-calendar">
      <p>Deadline Calendar — {deadlines.length} upcoming</p>
    </div>
  );
};

export default DeadlineCalendar;

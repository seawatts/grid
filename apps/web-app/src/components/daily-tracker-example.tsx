'use client';

import { cn } from '@seawatts/ui/lib/utils';
import { Check, X } from 'lucide-react';

interface DailyTrackerExampleProps {
  days: Array<{
    day: string;
    date: Date;
    completed: boolean;
    isToday: boolean;
  }>;
  onToggle: (day: string) => void;
}

export function DailyTrackerExample({
  days,
  onToggle,
}: DailyTrackerExampleProps) {
  return (
    <div className="flex gap-2">
      {days.map(({ day, date, completed }) => {
        const today = new Date();
        const isActuallyToday = date.toDateString() === today.toDateString();

        return (
          <button
            className={cn(
              'relative flex items-center justify-center rounded-full transition-all',
              'w-10 h-10 sm:w-12 sm:h-12',
              // Base styles
              completed
                ? 'bg-teal-500 text-white'
                : 'bg-orange-200 dark:bg-orange-900/30 text-red-600 dark:text-red-400',
              // Today highlight - thicker border with glow
              isActuallyToday && [
                'ring-2 ring-offset-2',
                completed
                  ? 'ring-teal-400 ring-offset-black'
                  : 'ring-orange-400 ring-offset-black',
                // Add a subtle shadow/glow for today
                'shadow-[0_0_8px_rgba(251,146,60,0.6)]',
              ],
            )}
            key={day}
            onClick={() => onToggle(day)}
            type="button"
          >
            {completed ? (
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
        );
      })}
    </div>
  );
}

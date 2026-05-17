import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TopDateBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  syncStatus?: { status: string; lastRun: string | null };
  className?: string;
}

export function TopDateBar({ selectedDate, onDateChange, syncStatus, className }: TopDateBarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-[#060608]/60 backdrop-blur-xl',
      className
    )}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white"
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            onDateChange(prev);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 px-3 text-xs rounded-lg border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]',
            isToday(selectedDate) && 'opacity-40'
          )}
          disabled={isToday(selectedDate)}
          onClick={() => onDateChange(new Date())}
        >
          Today
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-8 w-[200px] justify-start text-xs rounded-lg border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && onDateChange(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white"
          onClick={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            onDateChange(next);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {syncStatus && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
            <span className={cn(
              'h-1.5 w-1.5 rounded-full',
              syncStatus.status === 'Processing' ? 'bg-amber-400/70 animate-pulse' :
              syncStatus.status === 'Error' ? 'bg-rose-500/70' :
              syncStatus.lastRun ? 'bg-emerald-400/70' : 'bg-white/20'
            )} />
            {syncStatus.lastRun
              ? `Synced ${format(new Date(syncStatus.lastRun.replace(' ', 'T')), 'HH:mm')}`
              : 'No sync'}
          </div>
        )}
      </div>
    </div>
  );
}

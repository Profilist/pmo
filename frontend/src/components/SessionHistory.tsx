import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { GetSessionsByDate, SetWindowHeight } from "../../wailsjs/go/main/App";
import { cn } from "../lib/utils";
import { format } from "date-fns";

declare global {
  interface Window {
    runtime: any;
  }
}

interface SessionRecord {
  taskName: string;
  startTime: string;
  endTime: string;
  duration: number;
  completedCycles: number;
  isCompleted: boolean;
}

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionHistory({ isOpen, onClose }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Make window taller when history is opened
      SetWindowHeight(600);
    } else {
      // Restore original height when closed
      SetWindowHeight(145);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && date) {
      // Wait for Wails runtime to be ready
      const checkRuntime = () => {
        if (window.runtime) {
          loadSessions(date);
        } else {
          setTimeout(checkRuntime, 100);
        }
      };
      checkRuntime();
    }
  }, [isOpen, date]);

  const loadSessions = async (selectedDate: Date) => {
    console.log('Loading sessions for date:', selectedDate);
    setLoading(true);
    setError(null);
    try {
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];
      const history = await GetSessionsByDate(dateStr);
      console.log('Sessions loaded:', history);
      setSessions(history || []); // Ensure we always set an array
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load session history:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeFormat = { hour: "2-digit", minute: "2-digit" } as const;
    return `${start.toLocaleTimeString([], timeFormat)} - ${end.toLocaleTimeString([], timeFormat)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/100 flex flex-col">
      <div className="flex justify-between items-start p-4 border-b border-zinc-800">
        <div className="flex-1 relative">
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal border-zinc-800",
              !date && "text-muted-foreground"
            )}
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
          {isCalendarOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-50">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setIsCalendarOpen(false);
                  }
                }}
                className="rounded-md border border-zinc-800 bg-zinc-900"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium text-zinc-200",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-zinc-500 rounded-md w-8 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-zinc-800",
                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal text-zinc-400 aria-selected:opacity-100",
                    "hover:bg-zinc-800 hover:text-zinc-50 rounded-md",
                    "focus:bg-zinc-800 focus:text-zinc-50 focus:rounded-md"
                  ),
                  day_selected:
                    "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 focus:bg-zinc-900 focus:text-zinc-50",
                  day_today: "bg-zinc-800/50 text-zinc-50",
                  day_outside: "text-zinc-500 opacity-50",
                  day_disabled: "text-zinc-500 opacity-50",
                  day_range_middle:
                    "aria-selected:bg-zinc-800 aria-selected:text-zinc-50",
                  day_hidden: "invisible",
                }}
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 rounded-full p-0 hover:bg-zinc-800 text-zinc-400 ml-4"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center text-zinc-400">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="text-center text-red-400">
            Error: {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-zinc-400">
            No study sessions recorded yet
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[400px]">
            {sessions.map((session, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded bg-zinc-800/50",
                  "flex items-center justify-between",
                  "text-sm text-zinc-200"
                )}
              >
                <div>
                  <div className="font-medium">{session.taskName}</div>
                  <div className="text-xs text-zinc-400">{formatTimeRange(session.startTime, session.endTime)}</div>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="text-xs">
                    {session.completedCycles} {session.completedCycles === 1 ? "cycle" : "cycles"}
                  </div>
                  {session.isCompleted ? (
                    <div className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700/50 text-emerald-400">Complete</div>
                  ) : (
                    <div className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700/50 text-amber-400">Partial</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

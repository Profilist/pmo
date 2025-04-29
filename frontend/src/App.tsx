import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, GripHorizontal, BookOpen } from "lucide-react";
import { SessionHistory } from "./components/SessionHistory";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { cn } from "./lib/utils";
import notificationSound from './assets/notification.mp3'
import {
  StartTimer,
  PauseTimer,
  ResetTimer,
  SetTask,
  GetTask,
  SaveCompletedSession,
  SavePartialSession,
} from "../wailsjs/go/main/App";

const WORK_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 30 * 60; // 30 minutes

export default function PomodoroTimer() {
  const sessionCompletedRef = useRef(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastBreakWasLong, setLastBreakWasLong] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = Math.max(0, prevTime - 1);
          if (newTime === 0) {
            // Stop the timer
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);

            // Play notification sound
            new Audio(notificationSound)
              .play()
              .catch((err) => console.log("Audio playback failed:", err));

            // Handle cycle transitions
            if (!isBreak) {
              // Work period finished
              if (pomodoroCount === 4) {
                // Save completed session right before long break
                if (sessionStartTime && !sessionCompletedRef.current) {
                  SaveCompletedSession(sessionStartTime, new Date(), 4);
                  sessionCompletedRef.current = true;
                }
                setTimeLeft(LONG_BREAK);
                setIsBreak(true);
                setSessionStartTime(null); // Reset session start
                setLastBreakWasLong(true);
              } else {
                // Start short break
                setTimeLeft(SHORT_BREAK);
                setIsBreak(true);
                setLastBreakWasLong(false);
              }
            } else {
              // Break finished
              if (lastBreakWasLong) {
                // After long break, reset for next cycle
                ResetTimer();
                setTaskName("");
                setTimeLeft(WORK_TIME);
                setSessionStartTime(null);
                setLastBreakWasLong(false);
                setIsRunning(false);
                setIsBreak(false);
                setPomodoroCount(1); 
                sessionCompletedRef.current = false; 
                setIsSessionActive(false); 
                return 0;
              } else {
                // Start next work period
                setTimeLeft(WORK_TIME);
                setPomodoroCount(pomodoroCount + 1);
                setIsBreak(false);
              }
            }

            // Start next timer automatically
            if (!(lastBreakWasLong && isBreak)) {
              setTimeout(() => {
                setIsRunning(true);
              }, 1000);
            }

            // Show notification
            if (Notification.permission === "granted") {
              GetTask().then((currentTask) => {
                const phase = isBreak ? "Break" : "Work";
                new Notification("Pomodoro Timer", {
                  body: `${phase} period finished for task: ${currentTask || "Unnamed Task"}`,
                });
              });
            }
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!isRunning) {
      sessionCompletedRef.current = false; // Reset flag on manual start
      setIsSessionActive(true); // Session is now active
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      try {
        // If we're not paused, this is a new timer
        if (!taskName && timeLeft === WORK_TIME) {
          return; // Don't start if no task and timer is at initial state
        }

        // Only set task and reset time if we're not resuming from pause
        if (timeLeft === WORK_TIME) {
          await SetTask(taskName);
          await StartTimer(WORK_TIME);
          setTimeLeft(WORK_TIME);
        } else {
          // We're resuming from pause
          await StartTimer(timeLeft);
        }
        setIsRunning(true);
        setIsPaused(false);
      } catch (error) {
        console.error('Failed to start timer:', error);
      }
    }
  };

  const handlePause = async () => {
    try {
      await PauseTimer();
      setIsPaused(true);
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleReset = async () => {
    try {
      // Save partial session if at least one cycle is completed
      if (sessionStartTime && pomodoroCount > 0) {
        SavePartialSession(sessionStartTime, new Date(), pomodoroCount);
      }
      await ResetTimer();
      setIsRunning(false);
      setIsPaused(false);
      setTimeLeft(WORK_TIME);
      setTaskName('');
      setPomodoroCount(1);
      setIsBreak(false);
      setSessionStartTime(null);
      setIsSessionActive(false); // Session is no longer active
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  const handleTaskInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
  };

  const handleTaskInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && taskName.trim() !== '') {
      await handleStart();
    }
  };

  // Calculate progress percentage based on current phase
  const currentPhaseTime = isBreak ? (pomodoroCount === 4 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME;
  const progressPercentage = ((currentPhaseTime - timeLeft) / currentPhaseTime) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed rounded-xl bg-[#06080c] shadow-lg select-none transition-all duration-300 overflow-hidden w-80"
      )}
    >
      <div 
        className="h-6 flex items-center justify-center cursor-move bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors"
        style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
      >
        <GripHorizontal className="w-4 h-4 text-zinc-600" />
      </div>
      <div className="p-4">
      <div className="relative mb-2">
        <div className="relative">
          <Input
            type="text"
            placeholder="Task"
            value={taskName}
            onChange={handleTaskInputChange}
            onKeyDown={handleTaskInputKeyDown}
            disabled={isSessionActive}
            className="bg-zinc-800/80 border-none text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 pr-10"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-zinc-700/50"
            onClick={() => setIsHistoryOpen(true)}
          >
            <BookOpen className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>
        {taskName.trim() === "" && (
          <div className="absolute bottom-1 left-3 text-xs text-zinc-500 pointer-events-none"></div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-mono text-white tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 rounded-full p-0 bg-zinc-800 text-white flex items-center justify-center">
            {pomodoroCount}
          </div>
          {!isRunning ? (
            <Button
              onClick={handleStart}
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      </div>
      <SessionHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

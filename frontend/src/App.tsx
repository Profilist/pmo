import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, GripHorizontal } from "lucide-react";
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
} from "../wailsjs/go/main/App";

export default function PomodoroTimer() {
  const [taskName, setTaskName] = useState("");
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for testing
  const [isRunning, setIsRunning] = useState(false);

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

            // Show notification
            if (Notification.permission === "granted") {
              GetTask().then((currentTask) => {
                new Notification("Pomodoro Timer", {
                  body: `Time's up for task: ${currentTask || "Unnamed Task"}`,
                });
              });
            }

            // Reset task in backend
            ResetTimer();
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
    if (isRunning) return;
    
    try {
      // If we're not paused, this is a new timer
      if (!taskName && timeLeft === 5) {
        return; // Don't start if no task and timer is at initial state
      }

      // Only set task and reset time if we're not resuming from pause
      if (timeLeft === 5) {
        await SetTask(taskName);
        await StartTimer(5); // 5 seconds for testing
        setTimeLeft(5);
      } else {
        // We're resuming from pause
        await StartTimer(timeLeft);
      }
      
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePause = async () => {
    try {
      await PauseTimer();
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleReset = async () => {
    try {
      await ResetTimer();
      setIsRunning(false);
      setTimeLeft(5);
      setTaskName('');
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

  // Calculate progress percentage
  const progressPercentage = ((5 - timeLeft) / (5)) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed rounded-xl bg-black/80 shadow-lg select-none transition-all duration-300 overflow-hidden w-80"
      )}
    >
      {/* Drag handle */}
      <div 
        className="h-6 flex items-center justify-center cursor-move bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors"
        style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
      >
        <GripHorizontal className="w-4 h-4 text-zinc-600" />
      </div>
      <div className="p-4">
      <div className="relative mb-2">
        <Input
          type="text"
          placeholder="Create a task"
          value={taskName}
          onChange={handleTaskInputChange}
          onKeyDown={handleTaskInputKeyDown}
          disabled={isRunning}
          className="bg-zinc-800/80 border-none text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {taskName.trim() === "" && (
          <div className="absolute bottom-1 left-3 text-xs text-zinc-500 pointer-events-none"></div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-mono text-white tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="flex space-x-2">
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
    </div>
  );
}

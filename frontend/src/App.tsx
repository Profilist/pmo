import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { cn } from "./lib/utils"
import { StartTimer, PauseTimer, ResetTimer, SetTask, GetTimer, GetTask } from "../wailsjs/go/main/App"

export default function PomodoroTimer() {
  const [taskName, setTaskName] = useState("")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(async () => {
        const response = await GetTimer()
        // Since the Go backend returns a tuple but TypeScript sees it as a union,
        // we need to check if response is a number (remaining time) or boolean (running state)
        const remaining = typeof response === 'number' ? response : 0
        const running = typeof response === 'boolean' ? response : false
        if (!running) {
          setIsRunning(false)
          if (timerRef.current) clearInterval(timerRef.current)
        }
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          // Play notification sound or show notification
          new Audio("/notification.mp3").play().catch((err) => console.log("Audio playback failed:", err))
          if (Notification.permission === "granted") {
            const currentTask = await GetTask()
            new Notification("Pomodoro Timer", {
              body: `Time's up for task: ${currentTask || "Unnamed Task"}`,
            })
          }
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = async () => {
    if (taskName.trim() === "") return
    await SetTask(taskName)
    await StartTimer(25 * 60) // 25 minutes in seconds
    setIsRunning(true)
    setIsExpanded(true)
  }

  const handlePause = async () => {
    await PauseTimer()
    setIsRunning(false)
  }

  const handleReset = async () => {
    await ResetTimer()
    setIsRunning(false)
    setTimeLeft(25 * 60)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTaskInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value)
    if (e.target.value.trim() !== "" && !isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleTaskInputFocus = () => {
    setIsExpanded(true)
  }

  const handleTaskInputBlur = () => {
    if (taskName.trim() === "" && !isRunning) {
      setIsExpanded(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Calculate progress percentage
  const progressPercentage = ((25 * 60 - timeLeft) / (25 * 60)) * 100

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed rounded-xl bg-black/80 shadow-lg select-none transition-all duration-300 overflow-hidden",
        isDragging ? "cursor-grabbing" : "cursor-default",
        isExpanded ? "w-80 p-4" : "w-80 p-3",
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "all 0.3s ease",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle flex justify-between items-center cursor-grab mb-2">
        <div className="text-white font-mono text-sm"></div>
      </div>

      <div className="relative mb-2">
        <Input
          type="text"
          placeholder="Create a task"
          value={taskName}
          onChange={handleTaskInputChange}
          onFocus={handleTaskInputFocus}
          onBlur={handleTaskInputBlur}
          className="bg-zinc-800/80 border-none text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {taskName.trim() === "" && (
          <div className="absolute bottom-1 left-3 text-xs text-zinc-500 pointer-events-none">
           
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-mono text-white tabular-nums">{formatTime(timeLeft)}</div>
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
        </>
      )}
    </div>
  )
}

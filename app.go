package main

import (
	"context"
	"fmt"
)

// App struct
type App struct {
	ctx context.Context

	// Pomodoro state
	task string

	timerDuration int // in seconds
	remaining     int // in seconds
	running       bool
	paused        bool

	// For simplicity, timer will not tick down automatically in backend; frontend should poll GetTimer
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		task:          "",
		timerDuration: 25 * 60, // default 25 minutes
		remaining:     25 * 60,
		running:       false,
		paused:        false,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SetTask sets the current Pomodoro task
func (a *App) SetTask(task string) {
	fmt.Printf("[SetTask] Setting task to: %s\n", task)
	a.task = task
}

// GetTask returns the current Pomodoro task
func (a *App) GetTask() string {
	fmt.Printf("[GetTask] Current task: %s\n", a.task)
	return a.task
}

// StartTimer starts the Pomodoro timer with the given duration (in seconds)
func (a *App) StartTimer(duration int) {
	fmt.Printf("[StartTimer] Starting timer for %d seconds\n", duration)
	a.timerDuration = duration
	a.remaining = duration
	a.running = true
	a.paused = false
}

// PauseTimer pauses the Pomodoro timer
func (a *App) PauseTimer() {
	if a.running {
		fmt.Println("[PauseTimer] Pausing timer")
		a.paused = true
		a.running = false
	} else {
		fmt.Println("[PauseTimer] Timer is not running; nothing to pause")
	}
}

// ResetTimer resets the Pomodoro timer to the original duration
func (a *App) ResetTimer() {
	fmt.Println("[ResetTimer] Resetting timer to original duration")
	a.remaining = a.timerDuration
	a.running = false
	a.paused = false
}

// GetTimer returns the remaining time and whether the timer is running
func (a *App) GetTimer() (int, bool) {
	fmt.Printf("[GetTimer] Remaining: %d seconds, Running: %v\n", a.remaining, a.running)
	return a.remaining, a.running
}

package main

import (
	"context"
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
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		task:          "",
		timerDuration: 25 * 60, // Default 25 minutes
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

// StartTimer starts or resumes the timer
func (a *App) StartTimer(duration int) error {
	if a.running {
		return nil
	}

	// Only update duration and remaining if not paused
	if !a.paused {
		a.timerDuration = duration
		a.remaining = duration
	}

	a.running = true
	a.paused = false
	return nil
}

// PauseTimer pauses the timer
func (a *App) PauseTimer() error {
	if !a.running {
		return nil
	}

	a.running = false
	a.paused = true
	return nil
}

// ResetTimer resets the timer to its initial state
func (a *App) ResetTimer() error {
	a.running = false
	a.paused = false
	a.remaining = a.timerDuration
	a.task = ""
	return nil
}

// SetTask sets the current task
func (a *App) SetTask(task string) error {
	a.task = task
	return nil
}

// GetTimer returns the remaining time and running state
func (a *App) GetTimer() interface{} {
	if !a.running && !a.paused {
		return a.timerDuration
	}
	return a.remaining
}

// GetTask returns the current task
func (a *App) GetTask() string {
	return a.task
}


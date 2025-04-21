package main

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	_ "github.com/mattn/go-sqlite3"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB

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
func (a *App) startup(ctx context.Context) error {
	a.ctx = ctx

	// Get user's app data directory
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		return err
	}

	// Create our app's data directory if it doesn't exist
	appDir := filepath.Join(appDataDir, "Pomodoro")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return err
	}

	// Initialize database in the app data directory
	dbPath := filepath.Join(appDir, "pomodoro.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}
	a.db = db

	// Create tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task_name TEXT NOT NULL,
			start_time DATETIME NOT NULL,
			end_time DATETIME NOT NULL,
			duration INTEGER NOT NULL,
			completed_cycles INTEGER NOT NULL,
			is_completed BOOLEAN NOT NULL DEFAULT 0
		)
	`)
	return err
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

// SessionRecord represents a single pomodoro session
type SessionRecord struct {
	TaskName        string `json:"taskName"`
	StartTime       string `json:"startTime"`
	EndTime         string `json:"endTime"`
	Duration        int    `json:"duration"`
	CompletedCycles int    `json:"completedCycles"`
	IsCompleted     bool   `json:"isCompleted"`
}

// GetSessionsByDate returns sessions for a specific date
func (a *App) GetSessionsByDate(date string) ([]SessionRecord, error) {
	rows, err := a.db.Query(`
		SELECT task_name, start_time, end_time, duration, completed_cycles, is_completed
		FROM sessions
		WHERE date(start_time) = date(?)
		ORDER BY start_time DESC
	`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []SessionRecord
	for rows.Next() {
		var taskName string
		var startTime, endTime time.Time
		var duration, cycles int
		var completed bool

		err := rows.Scan(
			&taskName,
			&startTime,
			&endTime,
			&duration,
			&cycles,
			&completed,
		)

		session := SessionRecord{
			TaskName:        taskName,
			StartTime:       startTime.Format(time.RFC3339),
			EndTime:         endTime.Format(time.RFC3339),
			Duration:        duration,
			CompletedCycles: cycles,
			IsCompleted:     completed,
		}
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

// SetWindowHeight sets the window height
func (a *App) SetWindowHeight(height int) {
	runtime.WindowSetSize(a.ctx, 320, height)
}

// GetSessionHistory returns the last 50 pomodoro sessions, ordered by most recent
func (a *App) GetSessionHistory() ([]SessionRecord, error) {
	rows, err := a.db.Query(`
		SELECT task_name, start_time, end_time, duration, completed_cycles, is_completed
		FROM sessions
		ORDER BY start_time DESC
		LIMIT 50
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []SessionRecord
	for rows.Next() {
		var taskName string
		var startTime, endTime time.Time
		var duration, cycles int
		var completed bool

		err := rows.Scan(
			&taskName,
			&startTime,
			&endTime,
			&duration,
			&cycles,
			&completed,
		)

		session := SessionRecord{
			TaskName:        taskName,
			StartTime:       startTime.Format(time.RFC3339),
			EndTime:         endTime.Format(time.RFC3339),
			Duration:        duration,
			CompletedCycles: cycles,
			IsCompleted:     completed,
		}
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

// SaveCompletedSession saves a completed pomodoro session to the database
func (a *App) SaveCompletedSession(startTime time.Time, endTime time.Time, completedCycles int) error {
	if a.task == "" {
		return nil // Don't save sessions with no task name
	}

	// Calculate actual duration in minutes
	duration := int(endTime.Sub(startTime).Minutes())

	// Insert the session into the database
	_, err := a.db.Exec(`
		INSERT INTO sessions (task_name, start_time, end_time, duration, completed_cycles, is_completed)
		VALUES (?, ?, ?, ?, ?, 1)
	`, a.task, startTime, endTime, duration, completedCycles)

	return err
}

// SavePartialSession saves a partially completed pomodoro session to the database
// Only saves if at least one cycle was completed
func (a *App) SavePartialSession(startTime time.Time, endTime time.Time, completedCycles int) error {
	if a.task == "" || completedCycles < 1 {
		return nil // Don't save sessions with no task name or no completed cycles
	}

	// Calculate actual duration in minutes
	duration := int(endTime.Sub(startTime).Minutes())

	// Insert the session into the database
	_, err := a.db.Exec(`
		INSERT INTO sessions (task_name, start_time, end_time, duration, completed_cycles, is_completed)
		VALUES (?, ?, ?, ?, ?, 0)
	`, a.task, startTime, endTime, duration, completedCycles)

	return err
}

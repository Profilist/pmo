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

// App struct represents the main application structure for the Pomodoro timer.
// It manages the application state, database connection, and timer functionality.
// The app uses SQLite for persistent storage of study sessions and implements
// the core Pomodoro technique functionality including work sessions, breaks,
// and session history tracking.
type App struct {
	// ctx holds the application context for runtime operations
	ctx context.Context

	// db is the SQLite database connection for storing session data
	db *sql.DB

	// Pomodoro state
	// task is the current task being worked on
	task string

	// timerDuration is the total duration of the current timer in seconds
	timerDuration int

	// remaining is the number of seconds remaining in the current timer
	remaining int

	// running indicates if the timer is currently running
	running bool

	// paused indicates if the timer is currently paused
	paused bool
}

// NewApp creates and initializes a new App instance with default values.
// It sets up the initial state with:
// - Empty task
// - 25-minute timer duration (1500 seconds)
// - Timer not running or paused
func NewApp() *App {
	return &App{
		task:          "",
		timerDuration: 25 * 60, // Default 25 minutes
		remaining:     25 * 60,
		running:       false,
		paused:        false,
	}
}

// startup initializes the application when it starts.
// It performs the following tasks:
// - Saves the application context for runtime operations
// - Creates the application data directory if it doesn't exist
// - Initializes the SQLite database connection
// - Creates the necessary database tables for session tracking
//
// The database is stored in the user's application data directory:
// - Windows: %APPDATA%\Pomodoro\pomodoro.db
// - macOS: ~/Library/Application Support/Pomodoro/pomodoro.db
// - Linux: ~/.config/Pomodoro/pomodoro.db
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

// StartTimer starts or resumes the Pomodoro timer.
// If the timer is already running, it does nothing.
// If the timer was paused, it resumes from the remaining time.
// If starting fresh, it sets both the duration and remaining time to the provided duration.
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

// ResetTimer resets the timer to its initial state.
// This includes:
// - Stopping the timer
// - Clearing the pause state
// - Resetting the remaining time to the initial duration
// - Clearing the current task
func (a *App) ResetTimer() error {
	a.running = false
	a.paused = false
	a.remaining = a.timerDuration
	a.task = ""
	return nil
}

// SetTask sets the name of the current task to work on.
// The task name is used when saving session data to the database.
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

// GetTask returns the name of the current task being worked on.
// Returns an empty string if no task is set.
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

// SaveCompletedSession saves a completed Pomodoro session to the database.
// A session is only saved if there is a task name set.
// Parameters:
// - startTime: When the session started
// - endTime: When the session ended
// - completedCycles: Number of completed Pomodoro cycles
//
// The session is marked as completed (is_completed = 1) in the database.
// Duration is calculated in minutes from the start and end times.
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

// SavePartialSession saves a partially completed Pomodoro session to the database.
// A session is only saved if there is a task name and at least one completed cycle.
// Parameters:
// - startTime: When the session started
// - endTime: When the session was interrupted
// - completedCycles: Number of completed Pomodoro cycles
//
// The session is marked as incomplete (is_completed = 0) in the database.
// Duration is calculated in minutes from the start and end times.
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

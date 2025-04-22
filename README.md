# 🌿•₊✧ pmo 💻 ⋆⭒˚☕️｡⋆
> A minimalist Pomodoro timer desktop app 

Built for myself so I can focus better using the Pomodoro Technique. Created with React and Go using Wails, featuring local SQLite data persistence to track study sessions. 

Download the [lastest release here](https://github.com/Profilist/pmo/releases/tag/v1.0.0)!

## Features ✨

- Simple Pomodoro timer that always sits on top of your screen
- Local SQLite database for storing study sessions

![Timer](https://i.imgur.com/kshB4xp.png)
![History](https://i.imgur.com/kWgFBf2.png)

## Technologies 💻

- Frontend: React with TypeScript
- Backend: Go with Wails framework
- Database: SQLite

## Prerequisites ⚙️

- Go 1.18 or later
- Node.js 14 or later
- Wails CLI

## Installation 🛠️

1. Clone the repository
2. Install Wails CLI if not already installed:

   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```
4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
5. Build the application:
   ```bash
   wails build
   ```

## License 📜
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

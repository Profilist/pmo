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
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Build the application:

   **Windows**:
   ```bash
   wails build
   ```

   **macOS**:
   ```bash
   # For development/personal use
   wails build -platform darwin/universal

   # First time running the app:
   # Right-click the app and select 'Open' to bypass Gatekeeper warning
   ```

   > Note for Mac users: Building locally will create an unsigned app. This is fine for personal use but will show security warnings. For distribution to other users, an Apple Developer certificate is required.

## Release Process 🚀

This project uses GitHub Actions to automatically build releases for both Windows and macOS.

To create a new release:

1. Update version in `wails.json`
2. Create and push a new tag:
```bash
   git tag v1.0.0  # Use appropriate version
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically:
   - Build Windows and macOS versions
   - Create a draft release with both executables
   - You can then review and publish the release

## License 📜
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

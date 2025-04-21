package main

import (
	"context"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:         "pmo",
		Width:         320,
		Height:        145,
		Frameless:     true,
		DisableResize: true,
		AlwaysOnTop:   true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup: func(ctx context.Context) {
			if err := app.startup(ctx); err != nil {
				panic(err)
			}
		},
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
			WebviewIsTransparent:              true,
			WindowIsTranslucent:               true,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   "pmo",
				Message: "A minimal Pomodoro timer",
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

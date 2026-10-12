use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const COMPANION_URL: &str = "http://localhost:3000/companion";

fn companion_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window("companion") {
        return Ok(window);
    }

    let window = WebviewWindowBuilder::new(
        app,
        "companion",
        WebviewUrl::External(COMPANION_URL.parse().expect("a valid companion URL")),
    )
    .title("Kuri")
    .inner_size(816.0, 390.0)
    .min_inner_size(816.0, 390.0)
    .max_inner_size(816.0, 390.0)
    .resizable(false)
    .decorations(false)
    .shadow(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .visible(false)
    .build()?;

    let _ = window.center();

    Ok(window)
}

fn toggle_companion(app: &AppHandle) {
    let Ok(window) = companion_window(app) else {
        return;
    };

    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.eval("document.getElementById('kuri-task')?.focus()");
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            app.global_shortcut().on_shortcut(shortcut, move |_, _, event| {
                if event.state == ShortcutState::Pressed {
                    toggle_companion(&app_handle);
                }
            })?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Kuri Desktop");
}

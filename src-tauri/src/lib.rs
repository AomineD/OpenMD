use std::sync::Mutex;
use tauri::{Emitter, Manager, State, UserAttentionType, WebviewWindow};

struct InitialFilePath(Mutex<Option<String>>);

#[tauri::command]
fn get_initial_file_path(state: State<InitialFilePath>) -> Option<String> {
    state.0.lock().unwrap().take()
}

/// Command line: `openmd [--background] [path]`
struct CliArgs {
    file: Option<String>,
    background: bool,
}

fn parse_args<I: IntoIterator<Item = String>>(args: I) -> CliArgs {
    let mut parsed = CliArgs {
        file: None,
        background: false,
    };

    for arg in args.into_iter().skip(1) {
        match arg.as_str() {
            "--background" | "--no-focus" => parsed.background = true,
            _ if arg.starts_with('-') => {}
            _ if parsed.file.is_none() => parsed.file = Some(arg),
            _ => {}
        }
    }

    parsed
}

/// Whether the window is allowed to pull itself to the foreground.
///
/// While a game, a fullscreen video or a presentation is on screen, stealing
/// focus kicks the user out of what they are doing, so opening a file has to
/// stay silent: the tab loads in the background and the taskbar button blinks.
#[cfg(windows)]
fn may_steal_focus() -> bool {
    use windows_sys::Win32::UI::Shell::{SHQueryUserNotificationState, QUNS_ACCEPTS_NOTIFICATIONS};

    let mut state = QUNS_ACCEPTS_NOTIFICATIONS;
    let hresult = unsafe { SHQueryUserNotificationState(&mut state) };

    // On failure, keep the plain "bring to front" behavior.
    hresult < 0 || state == QUNS_ACCEPTS_NOTIFICATIONS
}

#[cfg(not(windows))]
fn may_steal_focus() -> bool {
    true
}

/// Make the window visible without taking the foreground away from whatever
/// the user is running. `window.show()` maps to `SW_SHOW`, which activates.
#[cfg(windows)]
fn show_without_activating(window: &WebviewWindow) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};

    match window.hwnd() {
        Ok(hwnd) => {
            let _ = unsafe { ShowWindow(hwnd.0 as _, SW_SHOWNOACTIVATE) };
        }
        Err(_) => {
            let _ = window.show();
        }
    }
}

#[cfg(not(windows))]
fn show_without_activating(window: &WebviewWindow) {
    let _ = window.show();
}

/// Blink the taskbar button so the user notices the new document whenever it
/// was opened without focus.
fn hint_new_document(window: &WebviewWindow) {
    let _ = window.request_user_attention(Some(UserAttentionType::Informational));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cli = parse_args(std::env::args());
    let quiet = cli.background || !may_steal_focus();

    tauri::Builder::default()
        .manage(InitialFilePath(Mutex::new(cli.file)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let window = app.get_webview_window("main").expect("no main window");
            let cli = parse_args(args);

            if cli.background || !may_steal_focus() {
                hint_new_document(&window);
            } else {
                window.unminimize().unwrap_or(());
                window.set_focus().unwrap_or(());
            }

            if let Some(file_path) = cli.file {
                let _ = window.emit("open-file", file_path);
            }
        }))
        .setup(move |app| {
            let window = app.get_webview_window("main").expect("no main window");

            if quiet {
                show_without_activating(&window);
                hint_new_document(&window);
            } else {
                window.show().unwrap();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_initial_file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::sync::Mutex;
use tauri::{Emitter, Manager, State};

struct InitialFilePath(Mutex<Option<String>>);

#[tauri::command]
fn get_initial_file_path(state: State<InitialFilePath>) -> Option<String> {
    state.0.lock().unwrap().take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_path: Option<String> = std::env::args().nth(1);

    tauri::Builder::default()
        .manage(InitialFilePath(Mutex::new(initial_path)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let window = app
                .get_webview_window("main")
                .expect("no main window");

            window.set_focus().unwrap_or(());
            window.unminimize().unwrap_or(());

            if let Some(file_path) = args.get(1) {
                let _ = window.emit("open-file", file_path);
            }
        }))
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("no main window");

            window.show().unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_initial_file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

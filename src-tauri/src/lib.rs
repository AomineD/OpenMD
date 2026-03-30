use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let window = app
                .get_webview_window("main")
                .expect("no main window");

            // Bring the existing window to focus
            window.set_focus().unwrap_or(());
            window.unminimize().unwrap_or(());

            // Forward the file path argument to the frontend
            if let Some(file_path) = args.get(1) {
                let _ = window.emit("open-file", file_path);
            }
        }))
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("no main window");

            // Show the window (starts hidden to prevent white flash on startup)
            window.show().unwrap();

            // Handle file path passed as CLI argument at startup
            let args: Vec<String> = std::env::args().collect();
            if let Some(file_path) = args.get(1) {
                let window_clone = window.clone();
                let path = file_path.clone();
                // 500ms delay ensures the frontend useEffect has mounted
                // and registered the listen() handler before the event fires
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = window_clone.emit("open-file", path);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

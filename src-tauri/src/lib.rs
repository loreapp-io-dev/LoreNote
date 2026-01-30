use tauri_plugin_fs::FsExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn allow_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.fs_scope()
        .allow_directory(&path, true)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, allow_path])
        .setup(|app| {
            // Allow home directory and root by default
            let fs_scope = app.fs_scope();
            if let Some(home) = dirs::home_dir() {
                let _ = fs_scope.allow_directory(&home, true);
            }
            // Allow root for absolute paths
            #[cfg(unix)]
            let _ = fs_scope.allow_directory("/", true);
            #[cfg(windows)]
            {
                for drive in ['C', 'D', 'E', 'F', 'G', 'H'] {
                    let _ = fs_scope.allow_directory(format!("{}:\\", drive), true);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

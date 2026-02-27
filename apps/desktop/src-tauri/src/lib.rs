use tauri::Manager;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database on app startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let app_dir = app_handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data dir");
                let db_path = app_dir.join("invoiceflow.db");

                match flow_db::database::init_db(&db_path).await {
                    Ok(pool) => {
                        app_handle.manage(commands::AppState { 
                            db: pool,
                            db_path: db_path.clone(),
                            app_data_dir: app_dir,
                        });
                        println!("✅ Database initialized at {:?}", db_path);
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to initialize database: {}", e);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_clients,
            commands::create_client,
            commands::delete_client,
            commands::update_client,
            commands::get_invoices,
            commands::create_invoice,
            commands::delete_invoice,
            commands::update_invoice_status,
            commands::get_analytics,
            commands::generate_pdf,
            commands::open_pdf,
            commands::save_logo,
            commands::get_logo,
            commands::delete_logo,
            commands::save_qr,
            commands::get_qr,
            commands::delete_qr,
            commands::save_bank_details,
            commands::get_bank_details,
            commands::get_settings,
            commands::save_settings,
            commands::reset_database,
            commands::export_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

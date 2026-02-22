use flow_db::database::DbPool;
use flow_db::repositories::{ClientRepository, InvoiceRepository};
use flow_db::repositories::invoice_repo::InvoiceSummary;
use flow_analytics::{AnalyticsEngine, RevenueMetrics};
use serde::{Deserialize, Serialize};
use tauri::State;

pub struct AppState {
    pub db: DbPool,
    pub db_path: std::path::PathBuf,
    pub app_data_dir: std::path::PathBuf,
}

// ─── Client Commands ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateClientRequest {
    pub name: String,
    pub email: Option<String>,
    pub company: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientResponse {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub company: Option<String>,
}

#[tauri::command]
pub async fn get_clients(state: State<'_, AppState>) -> Result<Vec<ClientResponse>, String> {
    let repo = ClientRepository::new(state.db.clone());
    let clients = repo.list_all().await.map_err(|e| e.to_string())?;
    Ok(clients
        .into_iter()
        .map(|c| ClientResponse {
            id: c.id.to_string(),
            name: c.name,
            email: c.email,
            company: c.company,
        })
        .collect())
}

#[tauri::command]
pub async fn create_client(
    state: State<'_, AppState>,
    request: CreateClientRequest,
) -> Result<ClientResponse, String> {
    let repo = ClientRepository::new(state.db.clone());
    let client = repo
        .create(&request.name, request.email.as_deref(), request.company.as_deref())
        .await
        .map_err(|e| e.to_string())?;

    Ok(ClientResponse {
        id: client.id.to_string(),
        name: client.name,
        email: client.email,
        company: client.company,
    })
}

#[tauri::command]
pub async fn delete_client(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let repo = ClientRepository::new(state.db.clone());
    repo.delete(&id).await.map_err(|e| e.to_string())
}

// ─── Invoice Commands ─────────────────────────────────────────

#[tauri::command]
pub async fn get_invoices(state: State<'_, AppState>) -> Result<Vec<InvoiceSummary>, String> {
    let repo = InvoiceRepository::new(state.db.clone());
    repo.list_all().await.map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceRequest {
    pub client_id: String,
    pub items: Vec<InvoiceItemRequest>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub issue_date: Option<String>,
    pub due_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceItemRequest {
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
}

#[tauri::command]
pub async fn create_invoice(
    state: State<'_, AppState>,
    request: CreateInvoiceRequest,
) -> Result<String, String> {
    use chrono::Utc;
    use flow_core::models::{Invoice, InvoiceItem};
    use flow_core::types::{Currency, InvoiceStatus, PaymentTerms};
    use flow_invoice::calculator::InvoiceCalculator;
    use rust_decimal::Decimal;
    use std::str::FromStr;
    use uuid::Uuid;

    use chrono::NaiveDate;

    let invoice_id = Uuid::new_v4();
    
    // Parse user-provided dates, fallback to today/today+30 if missing or invalid
    let today = Utc::now().date_naive();
    let issue_date = request.issue_date
        .and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
        .unwrap_or(today);
        
    let due_date = request.due_date
        .and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
        .unwrap_or_else(|| issue_date + chrono::Duration::days(30));

    // Build items
    let items: Vec<InvoiceItem> = request
        .items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let qty = Decimal::from_str(&item.quantity.to_string()).unwrap_or_default();
            let price = Decimal::from_str(&item.unit_price.to_string()).unwrap_or_default();
            InvoiceItem {
                id: Uuid::new_v4(),
                invoice_id,
                description: item.description.clone(),
                quantity: qty,
                unit_price: price,
                amount: qty * price,
                tax_rate_name: None,
                sort_order: i as i32,
            }
        })
        .collect();

    let (subtotal, tax, disc, total) = InvoiceCalculator::grand_total(&items, &[], &None);

    // Generate invoice number
    let repo = InvoiceRepository::new(state.db.clone());
    let existing = repo.list_all().await.map_err(|e| e.to_string())?;
    let gen = flow_invoice::number_generator::InvoiceNumberGenerator::default();
    let number = gen.next(existing.len() as u64);

    // Get active business profile
    let profile_repo = flow_db::repositories::BusinessProfileRepository::new(state.db.clone());
    let profile = profile_repo.get_profile().await.map_err(|e| e.to_string())?;

    let invoice = Invoice {
        id: invoice_id,
        number: number.clone(),
        status: request.status.map(|s| {
            match s.as_str() {
                "Pending" => InvoiceStatus::Pending,
                "Sent" => InvoiceStatus::Sent,
                "Paid" => InvoiceStatus::Paid,
                "Cancelled" => InvoiceStatus::Cancelled,
                _ => InvoiceStatus::Draft,
            }
        }).unwrap_or(InvoiceStatus::Draft),
        client_id: Uuid::parse_str(&request.client_id).map_err(|e| e.to_string())?,
        business_profile_id: profile.id,
        issue_date,
        due_date,
        currency: Currency::USD,
        items,
        tax_rates: vec![],
        discount: None,
        subtotal,
        tax_total: tax,
        discount_total: disc,
        total,
        amount_paid: Decimal::ZERO,
        amount_due: total,
        payment_terms: PaymentTerms::Net30,
        notes: request.notes,
        terms_and_conditions: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    repo.create(&invoice).await.map_err(|e| e.to_string())?;
    Ok(number)
}

#[tauri::command]
pub async fn delete_invoice(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let repo = InvoiceRepository::new(state.db.clone());
    repo.delete(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_invoice_status(state: State<'_, AppState>, id: String, status: String) -> Result<(), String> {
    use flow_core::types::InvoiceStatus;
    
    // Validate status string matches enum variants
    let valid_status = match status.as_str() {
        "Pending" => "Pending",
        "Sent" => "Sent",
        "Paid" => "Paid",
        "Cancelled" => "Cancelled",
        _ => "Draft",
    };

    let repo = InvoiceRepository::new(state.db.clone());
    repo.update_status(&id, valid_status).await.map_err(|e| e.to_string())
}

// ─── Analytics Commands ───────────────────────────────────────

#[tauri::command]
pub async fn get_analytics(state: State<'_, AppState>) -> Result<RevenueMetrics, String> {
    let engine = AnalyticsEngine::new();
    engine.get_revenue_metrics(&state.db_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_pdf(state: State<'_, AppState>, invoice_id: String) -> Result<String, String> {
    // Get the active profile to find the export directory
    let profile_repo = flow_db::repositories::BusinessProfileRepository::new(state.db.clone());
    let profile = profile_repo.get_profile().await.map_err(|e| e.to_string())?;

    let output_dir = if let Some(dir) = profile.pdf_export_dir {
        std::path::PathBuf::from(dir)
    } else {
        state.app_data_dir.join("pdfs")
    };

    let generator = flow_pdf::PdfGenerator::new(output_dir);
    
    // In a real app, we'd pass a URL to the invoice view, e.g. http://localhost:1420/invoice/<id>/print
    // Here we'll just use the invoice ID to generate a dummy PDF for demonstration
    let path = generator.generate_invoice_pdf(&invoice_id).map_err(|e| e.to_string())?;
    
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn open_pdf(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

// ─── Logo Commands ─────────────────────────────────────────────

#[tauri::command]
pub async fn save_logo(state: State<'_, AppState>, base64_data: String) -> Result<(), String> {
    use std::fs;
    let logo_path = state.app_data_dir.join("logo.txt");
    fs::write(&logo_path, base64_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_logo(state: State<'_, AppState>) -> Result<Option<String>, String> {
    use std::fs;
    let logo_path = state.app_data_dir.join("logo.txt");
    if logo_path.exists() {
        let content = fs::read_to_string(&logo_path).unwrap_or_default();
        if content.is_empty() {
            Ok(None)
        } else {
            Ok(Some(content))
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn delete_logo(state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    let logo_path = state.app_data_dir.join("logo.txt");
    if logo_path.exists() {
        fs::remove_file(&logo_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── QR Code Commands ──────────────────────────────────────────

#[tauri::command]
pub async fn save_qr(state: State<'_, AppState>, base64_data: String) -> Result<(), String> {
    use std::fs;
    let qr_path = state.app_data_dir.join("qr_code.txt");
    fs::write(&qr_path, base64_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_qr(state: State<'_, AppState>) -> Result<Option<String>, String> {
    use std::fs;
    let qr_path = state.app_data_dir.join("qr_code.txt");
    if qr_path.exists() {
        let content = fs::read_to_string(&qr_path).unwrap_or_default();
        if content.is_empty() {
            Ok(None)
        } else {
            Ok(Some(content))
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn delete_qr(state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    let qr_path = state.app_data_dir.join("qr_code.txt");
    if qr_path.exists() {
        fs::remove_file(&qr_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Bank Details Commands ─────────────────────────────────────

#[tauri::command]
pub async fn save_bank_details(state: State<'_, AppState>, json_data: String) -> Result<(), String> {
    use std::fs;
    let bank_path = state.app_data_dir.join("bank_details.json");
    fs::write(&bank_path, json_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_bank_details(state: State<'_, AppState>) -> Result<Option<String>, String> {
    use std::fs;
    let bank_path = state.app_data_dir.join("bank_details.json");
    if bank_path.exists() {
        let content = fs::read_to_string(&bank_path).unwrap_or_default();
        if content.is_empty() {
            Ok(None)
        } else {
            Ok(Some(content))
        }
    } else {
        Ok(None)
    }
}

// ─── Settings / Business Profile Commands ──────────────────────

use flow_core::models::BusinessProfile;
use flow_db::repositories::BusinessProfileRepository;

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<BusinessProfile, String> {
    let repo = BusinessProfileRepository::new(state.db.clone());
    repo.get_profile().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppState>,
    profile: BusinessProfile,
) -> Result<(), String> {
    let repo = BusinessProfileRepository::new(state.db.clone());
    repo.update_profile(&profile).await.map_err(|e| e.to_string())
}


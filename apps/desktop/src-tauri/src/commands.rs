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

    let invoice_id = Uuid::new_v4();
    let today = Utc::now().date_naive();
    let due_date = today + chrono::Duration::days(30);

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

    let invoice = Invoice {
        id: invoice_id,
        number: number.clone(),
        status: InvoiceStatus::Draft,
        client_id: Uuid::parse_str(&request.client_id).map_err(|e| e.to_string())?,
        business_profile_id: Uuid::nil(),
        issue_date: today,
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

// ─── Analytics Commands ───────────────────────────────────────

#[tauri::command]
pub async fn get_analytics(state: State<'_, AppState>) -> Result<RevenueMetrics, String> {
    let engine = AnalyticsEngine::new();
    engine.get_revenue_metrics(&state.db_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_pdf(state: State<'_, AppState>, invoice_id: String) -> Result<String, String> {
    let output_dir = state.app_data_dir.join("pdfs");
    let generator = flow_pdf::PdfGenerator::new(output_dir);
    
    // In a real app, we'd pass a URL to the invoice view, e.g. http://localhost:1420/invoice/<id>/print
    // Here we'll just use the invoice ID to generate a dummy PDF for demonstration
    let path = generator.generate_invoice_pdf(&invoice_id).map_err(|e| e.to_string())?;
    
    Ok(path.to_string_lossy().into_owned())
}

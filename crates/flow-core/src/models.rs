use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::types::{Currency, DiscountType, InvoiceStatus, PaymentTerms, TaxRate};

/// Business / company profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessProfile {
    pub id: Uuid,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Address,
    pub tax_id: Option<String>,
    pub logo_path: Option<String>,
    pub default_currency: Currency,
    pub default_payment_terms: PaymentTerms,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Client / customer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Client {
    pub id: Uuid,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub address: Address,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Address
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Address {
    pub line1: String,
    pub line2: Option<String>,
    pub city: String,
    pub state: Option<String>,
    pub postal_code: String,
    pub country: String,
}

/// Invoice
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: Uuid,
    pub number: String,
    pub status: InvoiceStatus,
    pub client_id: Uuid,
    pub business_profile_id: Uuid,

    // Dates
    pub issue_date: NaiveDate,
    pub due_date: NaiveDate,

    // Financial
    pub currency: Currency,
    pub items: Vec<InvoiceItem>,
    pub tax_rates: Vec<TaxRate>,
    pub discount: Option<DiscountType>,
    pub subtotal: Decimal,
    pub tax_total: Decimal,
    pub discount_total: Decimal,
    pub total: Decimal,
    pub amount_paid: Decimal,
    pub amount_due: Decimal,

    // Terms
    pub payment_terms: PaymentTerms,
    pub notes: Option<String>,
    pub terms_and_conditions: Option<String>,

    // Metadata
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Single line item on an invoice
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceItem {
    pub id: Uuid,
    pub invoice_id: Uuid,
    pub description: String,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub amount: Decimal,
    pub tax_rate_name: Option<String>,
    pub sort_order: i32,
}

/// A saved invoice template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub layout_json: String,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

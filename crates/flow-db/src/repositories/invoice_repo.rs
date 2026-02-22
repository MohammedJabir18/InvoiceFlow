use crate::database::DbPool;
use chrono::Utc;
use flow_core::models::{Invoice, InvoiceItem};

pub struct InvoiceRepository {
    pool: DbPool,
}

impl InvoiceRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, invoice: &Invoice) -> Result<(), sqlx::Error> {
        let id = invoice.id.to_string();
        let client_id = invoice.client_id.to_string();
        let bp_id = invoice.business_profile_id.to_string();
        let status = format!("{:?}", invoice.status);
        let currency = invoice.currency.to_string();
        let issue_date = invoice.issue_date.to_string();
        let due_date = invoice.due_date.to_string();
        let subtotal = invoice.subtotal.to_string();
        let tax_total = invoice.tax_total.to_string();
        let discount_total = invoice.discount_total.to_string();
        let total = invoice.total.to_string();
        let amount_paid = invoice.amount_paid.to_string();
        let amount_due = invoice.amount_due.to_string();
        let payment_terms = format!("{:?}", invoice.payment_terms);
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            r#"INSERT INTO invoices (id, number, status, client_id, business_profile_id, issue_date, due_date, currency, subtotal, tax_total, discount_total, total, amount_paid, amount_due, payment_terms, notes, terms_and_conditions, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&id)
        .bind(&invoice.number)
        .bind(&status)
        .bind(&client_id)
        .bind(&bp_id)
        .bind(&issue_date)
        .bind(&due_date)
        .bind(&currency)
        .bind(&subtotal)
        .bind(&tax_total)
        .bind(&discount_total)
        .bind(&total)
        .bind(&amount_paid)
        .bind(&amount_due)
        .bind(&payment_terms)
        .bind(&invoice.notes)
        .bind(&invoice.terms_and_conditions)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        // Insert items
        for item in &invoice.items {
            self.insert_item(item).await?;
        }

        Ok(())
    }

    async fn insert_item(&self, item: &InvoiceItem) -> Result<(), sqlx::Error> {
        let id = item.id.to_string();
        let inv_id = item.invoice_id.to_string();
        let qty = item.quantity.to_string();
        let price = item.unit_price.to_string();
        let amount = item.amount.to_string();

        sqlx::query(
            r#"INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, tax_rate_name, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&id)
        .bind(&inv_id)
        .bind(&item.description)
        .bind(&qty)
        .bind(&price)
        .bind(&amount)
        .bind(&item.tax_rate_name)
        .bind(item.sort_order)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn list_all(&self) -> Result<Vec<InvoiceSummary>, sqlx::Error> {
        let rows = sqlx::query_as::<_, InvoiceSummaryRow>(
            "SELECT id, number, status, client_id, issue_date, due_date, currency, total, amount_due FROM invoices ORDER BY created_at DESC",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.into_summary()).collect())
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<(), sqlx::Error> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM invoices WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Invoice>, sqlx::Error> {
        let inv_row = sqlx::query_as::<_, FullInvoiceRow>(
            r#"SELECT id, number, status, client_id, business_profile_id, issue_date, due_date, currency, subtotal, tax_total, discount_total, total, amount_paid, amount_due, payment_terms, notes, terms_and_conditions, created_at, updated_at
               FROM invoices WHERE id = ?"#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = inv_row {
            let item_rows = sqlx::query_as::<_, InvoiceItemRow>(
                r#"SELECT id, invoice_id, description, quantity, unit_price, amount, tax_rate_name, sort_order
                   FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC"#,
            )
            .bind(id)
            .fetch_all(&self.pool)
            .await?;

            let items = item_rows.into_iter().map(|r| r.into_item()).collect();
            Ok(Some(row.into_invoice(items)))
        } else {
            Ok(None)
        }
    }
}

/// Lightweight invoice listing DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InvoiceSummary {
    pub id: String,
    pub number: String,
    pub status: String,
    pub client_id: String,
    pub issue_date: String,
    pub due_date: String,
    pub currency: String,
    pub total: String,
    pub amount_due: String,
}

#[derive(sqlx::FromRow)]
struct InvoiceSummaryRow {
    id: String,
    number: String,
    status: String,
    client_id: String,
    issue_date: String,
    due_date: String,
    currency: String,
    total: String,
    amount_due: String,
}

impl InvoiceSummaryRow {
    fn into_summary(self) -> InvoiceSummary {
        InvoiceSummary {
            id: self.id,
            number: self.number,
            status: self.status,
            client_id: self.client_id,
            issue_date: self.issue_date,
            due_date: self.due_date,
            currency: self.currency,
            total: self.total,
            amount_due: self.amount_due,
        }
    }
}

#[derive(sqlx::FromRow)]
struct FullInvoiceRow {
    id: String,
    number: String,
    status: String,
    client_id: String,
    business_profile_id: String,
    issue_date: String,
    due_date: String,
    currency: String,
    subtotal: String,
    tax_total: String,
    discount_total: String,
    total: String,
    amount_paid: String,
    amount_due: String,
    payment_terms: String,
    notes: Option<String>,
    terms_and_conditions: Option<String>,
    created_at: String,
    updated_at: String,
}

impl FullInvoiceRow {
    fn into_invoice(self, items: Vec<InvoiceItem>) -> Invoice {
        use std::str::FromStr;
        use rust_decimal::Decimal;
        use flow_core::types::{Currency, InvoiceStatus, PaymentTerms};

        let status = match self.status.as_str() {
            "Draft" => InvoiceStatus::Draft,
            "Pending" => InvoiceStatus::Pending,
            "Sent" => InvoiceStatus::Sent,
            "Viewed" => InvoiceStatus::Viewed,
            "Paid" => InvoiceStatus::Paid,
            "Overdue" => InvoiceStatus::Overdue,
            "Cancelled" => InvoiceStatus::Cancelled,
            _ => InvoiceStatus::Draft,
        };

        Invoice {
            id: uuid::Uuid::parse_str(&self.id).unwrap_or_default(),
            number: self.number,
            status,
            client_id: uuid::Uuid::parse_str(&self.client_id).unwrap_or_default(),
            business_profile_id: uuid::Uuid::parse_str(&self.business_profile_id).unwrap_or_default(),
            issue_date: chrono::NaiveDate::parse_from_str(&self.issue_date, "%Y-%m-%d").unwrap_or_default(),
            due_date: chrono::NaiveDate::parse_from_str(&self.due_date, "%Y-%m-%d").unwrap_or_default(),
            currency: Currency::from_str(&self.currency).unwrap_or_default(),
            items,
            tax_rates: vec![],
            discount: None,
            subtotal: Decimal::from_str(&self.subtotal).unwrap_or_default(),
            tax_total: Decimal::from_str(&self.tax_total).unwrap_or_default(),
            discount_total: Decimal::from_str(&self.discount_total).unwrap_or_default(),
            total: Decimal::from_str(&self.total).unwrap_or_default(),
            amount_paid: Decimal::from_str(&self.amount_paid).unwrap_or_default(),
            amount_due: Decimal::from_str(&self.amount_due).unwrap_or_default(),
            payment_terms: PaymentTerms::from_str(&self.payment_terms).unwrap_or_default(),
            notes: self.notes,
            terms_and_conditions: self.terms_and_conditions,
            created_at: chrono::DateTime::parse_from_rfc3339(&self.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&self.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

#[derive(sqlx::FromRow)]
struct InvoiceItemRow {
    id: String,
    invoice_id: String,
    description: String,
    quantity: String,
    unit_price: String,
    amount: String,
    tax_rate_name: Option<String>,
    sort_order: i32,
}

impl InvoiceItemRow {
    fn into_item(self) -> InvoiceItem {
        use std::str::FromStr;
        use rust_decimal::Decimal;

        InvoiceItem {
            id: uuid::Uuid::parse_str(&self.id).unwrap_or_default(),
            invoice_id: uuid::Uuid::parse_str(&self.invoice_id).unwrap_or_default(),
            description: self.description,
            quantity: Decimal::from_str(&self.quantity).unwrap_or_default(),
            unit_price: Decimal::from_str(&self.unit_price).unwrap_or_default(),
            amount: Decimal::from_str(&self.amount).unwrap_or_default(),
            tax_rate_name: self.tax_rate_name,
            sort_order: self.sort_order,
        }
    }
}

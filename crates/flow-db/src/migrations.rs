use sqlx::{Pool, Sqlite};

/// Run all database migrations in order.
pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // Create business_profiles table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS business_profiles (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address_line1 TEXT NOT NULL DEFAULT '',
            address_line2 TEXT,
            address_city TEXT NOT NULL DEFAULT '',
            address_state TEXT,
            address_postal_code TEXT NOT NULL DEFAULT '',
            address_country TEXT NOT NULL DEFAULT '',
            tax_id TEXT,
            logo_path TEXT,
            default_currency TEXT NOT NULL DEFAULT 'USD',
            default_payment_terms TEXT NOT NULL DEFAULT 'Net30',
            theme_preference TEXT NOT NULL DEFAULT 'system',
            pdf_export_dir TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create clients table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            company TEXT,
            address_line1 TEXT NOT NULL DEFAULT '',
            address_line2 TEXT,
            address_city TEXT NOT NULL DEFAULT '',
            address_state TEXT,
            address_postal_code TEXT NOT NULL DEFAULT '',
            address_country TEXT NOT NULL DEFAULT '',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create invoices table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY NOT NULL,
            number TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'Draft',
            client_id TEXT NOT NULL,
            business_profile_id TEXT NOT NULL,
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            subtotal TEXT NOT NULL DEFAULT '0',
            tax_total TEXT NOT NULL DEFAULT '0',
            discount_total TEXT NOT NULL DEFAULT '0',
            total TEXT NOT NULL DEFAULT '0',
            amount_paid TEXT NOT NULL DEFAULT '0',
            amount_due TEXT NOT NULL DEFAULT '0',
            payment_terms TEXT NOT NULL DEFAULT 'Net30',
            notes TEXT,
            terms_and_conditions TEXT,
            tax_rates_json TEXT DEFAULT '[]',
            discount_json TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id)
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create invoice_items table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY NOT NULL,
            invoice_id TEXT NOT NULL,
            description TEXT NOT NULL,
            quantity TEXT NOT NULL DEFAULT '1',
            unit_price TEXT NOT NULL DEFAULT '0',
            amount TEXT NOT NULL DEFAULT '0',
            tax_rate_name TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create invoice_templates table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS invoice_templates (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            layout_json TEXT NOT NULL DEFAULT '{}',
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);")
        .execute(pool)
        .await?;
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);",
    )
    .execute(pool)
    .await?;

    // --- Backwards Compatibility Migrations ---
    
    // Add theme_preference column if not exists
    let _ = sqlx::query(
        "ALTER TABLE business_profiles ADD COLUMN theme_preference TEXT NOT NULL DEFAULT 'system';"
    )
    .execute(pool)
    .await;

    // Add pdf_export_dir column if not exists
    let _ = sqlx::query(
        "ALTER TABLE business_profiles ADD COLUMN pdf_export_dir TEXT;"
    )
    .execute(pool)
    .await;

    Ok(())
}

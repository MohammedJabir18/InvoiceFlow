use crate::database::DbPool;
use flow_core::models::{Address, BusinessProfile};
use flow_core::types::{Currency, PaymentTerms};
use chrono::Utc;
use std::str::FromStr;
use uuid::Uuid;

pub struct BusinessProfileRepository {
    pool: DbPool,
}

impl BusinessProfileRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Retrieve the first (and only) business profile, or create a default one if it doesn't exist
    pub async fn get_profile(&self) -> Result<BusinessProfile, sqlx::Error> {
        let row = sqlx::query_as::<_, BusinessProfileRow>(
            "SELECT id, name, email, phone, address_line1, address_line2, address_city, 
                    address_state, address_postal_code, address_country, tax_id, logo_path, 
                    default_currency, default_payment_terms, theme_preference, pdf_export_dir, 
                    created_at, updated_at 
             FROM business_profiles ORDER BY updated_at DESC LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(r) = row {
            Ok(r.into_profile())
        } else {
            // Create a default profile
            let id = Uuid::new_v4();
            let now = Utc::now();
            let id_str = id.to_string();
            let now_str = now.to_rfc3339();

            sqlx::query(
                r#"INSERT INTO business_profiles 
                   (id, name, address_line1, address_city, address_postal_code, address_country, default_currency, default_payment_terms, theme_preference, pdf_export_dir, created_at, updated_at)
                   VALUES (?, 'My Company', '', '', '', '', 'USD', 'Net30', 'system', NULL, ?, ?)"#
            )
            .bind(&id_str)
            .bind(&now_str)
            .bind(&now_str)
            .execute(&self.pool)
            .await?;

            Ok(BusinessProfile {
                id,
                name: "My Company".to_string(),
                email: None,
                phone: None,
                address: Address::default(),
                tax_id: None,
                logo_path: None,
                default_currency: Currency::USD,
                default_payment_terms: PaymentTerms::Net30,
                theme_preference: "system".to_string(),
                pdf_export_dir: None,
                created_at: now,
                updated_at: now,
            })
        }
    }

    /// Update the business profile
    pub async fn update_profile(&self, profile: &BusinessProfile) -> Result<(), sqlx::Error> {
        let now = Utc::now().to_rfc3339();
        
        sqlx::query(
            r#"UPDATE business_profiles 
               SET name = ?, email = ?, phone = ?, 
                   address_line1 = ?, address_line2 = ?, address_city = ?, 
                   address_state = ?, address_postal_code = ?, address_country = ?, 
                   tax_id = ?, logo_path = ?, default_currency = ?, default_payment_terms = ?, 
                   theme_preference = ?, pdf_export_dir = ?, updated_at = ?
               WHERE id = ?"#
        )
        .bind(&profile.name)
        .bind(&profile.email)
        .bind(&profile.phone)
        .bind(&profile.address.line1)
        .bind(&profile.address.line2)
        .bind(&profile.address.city)
        .bind(&profile.address.state)
        .bind(&profile.address.postal_code)
        .bind(&profile.address.country)
        .bind(&profile.tax_id)
        .bind(&profile.logo_path)
        .bind(profile.default_currency.to_string())
        .bind(profile.default_payment_terms.to_string())
        .bind(&profile.theme_preference)
        .bind(&profile.pdf_export_dir)
        .bind(&now)
        .bind(profile.id.to_string())
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

#[derive(sqlx::FromRow)]
struct BusinessProfileRow {
    id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address_line1: String,
    address_line2: Option<String>,
    address_city: String,
    address_state: Option<String>,
    address_postal_code: String,
    address_country: String,
    tax_id: Option<String>,
    logo_path: Option<String>,
    default_currency: String,
    default_payment_terms: String,
    theme_preference: String,
    pdf_export_dir: Option<String>,
    created_at: String,
    updated_at: String,
}

impl BusinessProfileRow {
    fn into_profile(self) -> BusinessProfile {
        BusinessProfile {
            id: Uuid::parse_str(&self.id).unwrap_or_default(),
            name: self.name,
            email: self.email,
            phone: self.phone,
            address: Address {
                line1: self.address_line1,
                line2: self.address_line2,
                city: self.address_city,
                state: self.address_state,
                postal_code: self.address_postal_code,
                country: self.address_country,
            },
            tax_id: self.tax_id,
            logo_path: self.logo_path,
            default_currency: Currency::from_str(&self.default_currency).unwrap_or(Currency::USD),
            default_payment_terms: PaymentTerms::from_str(&self.default_payment_terms).unwrap_or(PaymentTerms::Net30),
            theme_preference: self.theme_preference,
            pdf_export_dir: self.pdf_export_dir,
            created_at: chrono::DateTime::parse_from_rfc3339(&self.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&self.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

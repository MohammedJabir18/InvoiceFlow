use crate::database::DbPool;
use flow_core::models::{Address, Client};
use chrono::Utc;
use uuid::Uuid;

pub struct ClientRepository {
    pool: DbPool,
}

impl ClientRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, name: &str, email: Option<&str>, company: Option<&str>) -> Result<Client, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let id_str = id.to_string();
        let now_str = now.to_rfc3339();

        sqlx::query(
            r#"INSERT INTO clients (id, name, email, company, address_line1, address_city, address_postal_code, address_country, created_at, updated_at)
               VALUES (?, ?, ?, ?, '', '', '', '', ?, ?)"#,
        )
        .bind(&id_str)
        .bind(name)
        .bind(email)
        .bind(company)
        .bind(&now_str)
        .bind(&now_str)
        .execute(&self.pool)
        .await?;

        Ok(Client {
            id,
            name: name.to_string(),
            email: email.map(String::from),
            phone: None,
            company: company.map(String::from),
            address: Address::default(),
            notes: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn list_all(&self) -> Result<Vec<Client>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ClientRow>("SELECT id, name, email, phone, company, address_line1, address_city, address_postal_code, address_country, notes, created_at, updated_at FROM clients ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(|r| r.into_client()).collect())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Client>, sqlx::Error> {
        let row = sqlx::query_as::<_, ClientRow>("SELECT id, name, email, phone, company, address_line1, address_city, address_postal_code, address_country, notes, created_at, updated_at FROM clients WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.into_client()))
    }

    pub async fn delete(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM clients WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update(&self, id: &str, name: &str, email: Option<&str>, company: Option<&str>) -> Result<(), sqlx::Error> {
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE clients SET name = ?, email = ?, company = ?, updated_at = ? WHERE id = ?",
        )
        .bind(name)
        .bind(email)
        .bind(company)
        .bind(&now)
        .bind(id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

#[derive(sqlx::FromRow)]
struct ClientRow {
    id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    company: Option<String>,
    address_line1: String,
    address_city: String,
    address_postal_code: String,
    address_country: String,
    notes: Option<String>,
    created_at: String,
    updated_at: String,
}

impl ClientRow {
    fn into_client(self) -> Client {
        Client {
            id: Uuid::parse_str(&self.id).unwrap_or_default(),
            name: self.name,
            email: self.email,
            phone: self.phone,
            company: self.company,
            address: Address {
                line1: self.address_line1,
                line2: None,
                city: self.address_city,
                state: None,
                postal_code: self.address_postal_code,
                country: self.address_country,
            },
            notes: self.notes,
            created_at: chrono::DateTime::parse_from_rfc3339(&self.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&self.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

use crate::database::DbPool;
use flow_core::models::{Address, Client, Deal, InteractionLog};
use flow_core::types::{DealStatus, InteractionType};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use std::str::FromStr;
use uuid::Uuid;

pub struct CrmRepository {
    pool: DbPool,
}

impl CrmRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_client(&self, name: &str, email: Option<&str>, company: Option<&str>) -> Result<Client, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let id_str = id.to_string();
        let now_str = now.to_rfc3339();

        sqlx::query(
            r#"INSERT INTO clients (id, name, email, company, address_line1, address_city, address_postal_code, address_country, total_ltv, created_at, updated_at)
               VALUES (?, ?, ?, ?, '', '', '', '', '0', ?, ?)"#,
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
            total_ltv: Decimal::ZERO,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn get_clients(&self) -> Result<Vec<Client>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ClientRow>("SELECT id, name, email, phone, company, address_line1, address_city, address_postal_code, address_country, notes, total_ltv, created_at, updated_at FROM clients ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(|r| r.into_client()).collect())
    }

    pub async fn get_client_by_id(&self, id: &str) -> Result<Option<Client>, sqlx::Error> {
        let row = sqlx::query_as::<_, ClientRow>("SELECT id, name, email, phone, company, address_line1, address_city, address_postal_code, address_country, notes, total_ltv, created_at, updated_at FROM clients WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.into_client()))
    }

    pub async fn create_deal(&self, client_id: &str, title: &str, value: Decimal) -> Result<Deal, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let id_str = id.to_string();
        let value_str = value.to_string();
        let now_str = now.to_rfc3339();
        let status = "Prospect";

        sqlx::query(
            r#"INSERT INTO deals (id, client_id, title, value, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&id_str)
        .bind(client_id)
        .bind(title)
        .bind(&value_str)
        .bind(status)
        .bind(&now_str)
        .bind(&now_str)
        .execute(&self.pool)
        .await?;

        Ok(Deal {
            id,
            client_id: Uuid::parse_str(client_id).unwrap_or_default(),
            title: title.to_string(),
            value,
            status: DealStatus::Prospect,
            ai_lead_score: None,
            next_suggested_action: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn get_deals_by_client(&self, client_id: &str) -> Result<Vec<Deal>, sqlx::Error> {
        let rows = sqlx::query_as::<_, DealRow>("SELECT id, client_id, title, value, status, ai_lead_score, next_suggested_action, created_at, updated_at FROM deals WHERE client_id = ? ORDER BY created_at DESC")
            .bind(client_id)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(|r| r.into_deal()).collect())
    }

    pub async fn update_deal_status(&self, id: &str, status: DealStatus) -> Result<(), sqlx::Error> {
        let status_str = match status {
            DealStatus::Prospect => "Prospect",
            DealStatus::Contacted => "Contacted",
            DealStatus::Proposal => "Proposal",
            DealStatus::Won => "Won",
            DealStatus::Lost => "Lost",
        };
        let now = Utc::now().to_rfc3339();

        sqlx::query("UPDATE deals SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status_str)
            .bind(&now)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn update_deal_ai_metrics(&self, id: &str, score: i32, action: &str) -> Result<(), sqlx::Error> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE deals SET ai_lead_score = ?, next_suggested_action = ?, updated_at = ? WHERE id = ?")
            .bind(score)
            .bind(action)
            .bind(&now)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn add_interaction(&self, deal_id: &str, interaction_type: InteractionType, notes: Option<&str>, sentiment: Option<&str>) -> Result<InteractionLog, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let id_str = id.to_string();
        let now_str = now.to_rfc3339();
        let type_str = match interaction_type {
            InteractionType::Email => "Email",
            InteractionType::Call => "Call",
            InteractionType::Meeting => "Meeting",
        };

        sqlx::query(
            r#"INSERT INTO interaction_logs (id, deal_id, interaction_type, notes, ai_sentiment_summary, date)
               VALUES (?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&id_str)
        .bind(deal_id)
        .bind(type_str)
        .bind(notes)
        .bind(sentiment)
        .bind(&now_str)
        .execute(&self.pool)
        .await?;

        Ok(InteractionLog {
            id,
            deal_id: Uuid::parse_str(deal_id).unwrap_or_default(),
            interaction_type,
            notes: notes.map(String::from),
            ai_sentiment_summary: sentiment.map(String::from),
            date: now,
        })
    }

    pub async fn get_interactions_for_deal(&self, deal_id: &str) -> Result<Vec<InteractionLog>, sqlx::Error> {
        let rows = sqlx::query_as::<_, InteractionLogRow>("SELECT id, deal_id, interaction_type, notes, ai_sentiment_summary, date FROM interaction_logs WHERE deal_id = ? ORDER BY date DESC")
            .bind(deal_id)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(|r| r.into_interaction()).collect())
    }
}

// Internal rows for mapping 

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
    total_ltv: String,
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
            total_ltv: Decimal::from_str(&self.total_ltv).unwrap_or_default(),
            created_at: DateTime::parse_from_rfc3339(&self.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: DateTime::parse_from_rfc3339(&self.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

#[derive(sqlx::FromRow)]
struct DealRow {
    id: String,
    client_id: String,
    title: String,
    value: String,
    status: String,
    ai_lead_score: Option<i32>,
    next_suggested_action: Option<String>,
    created_at: String,
    updated_at: String,
}

impl DealRow {
    fn into_deal(self) -> Deal {
        let deal_status = match self.status.as_str() {
            "Contacted" => DealStatus::Contacted,
            "Proposal" => DealStatus::Proposal,
            "Won" => DealStatus::Won,
            "Lost" => DealStatus::Lost,
            _ => DealStatus::Prospect,
        };
        
        Deal {
            id: Uuid::parse_str(&self.id).unwrap_or_default(),
            client_id: Uuid::parse_str(&self.client_id).unwrap_or_default(),
            title: self.title,
            value: Decimal::from_str(&self.value).unwrap_or_default(),
            status: deal_status,
            ai_lead_score: self.ai_lead_score,
            next_suggested_action: self.next_suggested_action,
            created_at: DateTime::parse_from_rfc3339(&self.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: DateTime::parse_from_rfc3339(&self.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

#[derive(sqlx::FromRow)]
struct InteractionLogRow {
    id: String,
    deal_id: String,
    interaction_type: String,
    notes: Option<String>,
    ai_sentiment_summary: Option<String>,
    date: String,
}

impl InteractionLogRow {
    fn into_interaction(self) -> InteractionLog {
        let i_type = match self.interaction_type.as_str() {
            "Call" => InteractionType::Call,
            "Meeting" => InteractionType::Meeting,
            _ => InteractionType::Email,
        };

        InteractionLog {
            id: Uuid::parse_str(&self.id).unwrap_or_default(),
            deal_id: Uuid::parse_str(&self.deal_id).unwrap_or_default(),
            interaction_type: i_type,
            notes: self.notes,
            ai_sentiment_summary: self.ai_sentiment_summary,
            date: DateTime::parse_from_rfc3339(&self.date)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        }
    }
}

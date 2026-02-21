use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::fmt;

/// Currency representation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Currency {
    USD,
    EUR,
    GBP,
    INR,
    AED,
    Custom(String),
}

impl fmt::Display for Currency {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Currency::USD => write!(f, "USD"),
            Currency::EUR => write!(f, "EUR"),
            Currency::GBP => write!(f, "GBP"),
            Currency::INR => write!(f, "INR"),
            Currency::AED => write!(f, "AED"),
            Currency::Custom(code) => write!(f, "{}", code),
        }
    }
}

impl Default for Currency {
    fn default() -> Self {
        Currency::USD
    }
}

/// Invoice status lifecycle
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum InvoiceStatus {
    Draft,
    Pending,
    Sent,
    Viewed,
    Paid,
    Overdue,
    Cancelled,
}

impl Default for InvoiceStatus {
    fn default() -> Self {
        InvoiceStatus::Draft
    }
}

/// Payment terms
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PaymentTerms {
    DueOnReceipt,
    Net15,
    Net30,
    Net60,
    Net90,
    Custom { days: u32, label: String },
}

impl Default for PaymentTerms {
    fn default() -> Self {
        PaymentTerms::Net30
    }
}

/// Tax rate definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxRate {
    pub name: String,
    pub rate: Decimal,
    pub is_compound: bool,
}

/// Discount type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiscountType {
    Percentage(Decimal),
    FixedAmount(Decimal),
}

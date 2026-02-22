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

impl std::str::FromStr for Currency {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "USD" => Ok(Currency::USD),
            "EUR" => Ok(Currency::EUR),
            "GBP" => Ok(Currency::GBP),
            "INR" => Ok(Currency::INR),
            "AED" => Ok(Currency::AED),
            _ => Ok(Currency::Custom(s.to_string())),
        }
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

impl fmt::Display for PaymentTerms {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PaymentTerms::DueOnReceipt => write!(f, "DueOnReceipt"),
            PaymentTerms::Net15 => write!(f, "Net15"),
            PaymentTerms::Net30 => write!(f, "Net30"),
            PaymentTerms::Net60 => write!(f, "Net60"),
            PaymentTerms::Net90 => write!(f, "Net90"),
            PaymentTerms::Custom { label, .. } => write!(f, "{}", label),
        }
    }
}

impl std::str::FromStr for PaymentTerms {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "DueOnReceipt" => Ok(PaymentTerms::DueOnReceipt),
            "Net15" => Ok(PaymentTerms::Net15),
            "Net30" => Ok(PaymentTerms::Net30),
            "Net60" => Ok(PaymentTerms::Net60),
            "Net90" => Ok(PaymentTerms::Net90),
            _ => Ok(PaymentTerms::Custom { days: 30, label: s.to_string() }),
        }
    }
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

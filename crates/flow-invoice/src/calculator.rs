use flow_core::models::InvoiceItem;
use flow_core::types::{DiscountType, TaxRate};
use rust_decimal::Decimal;
use rust_decimal::prelude::Zero;

/// Calculate invoice financial totals.
pub struct InvoiceCalculator;

impl InvoiceCalculator {
    /// Calculate the subtotal from line items.
    pub fn subtotal(items: &[InvoiceItem]) -> Decimal {
        items.iter().fold(Decimal::zero(), |acc, item| {
            acc + (item.quantity * item.unit_price)
        })
    }

    /// Calculate total tax across all tax rates.
    pub fn tax_total(subtotal: Decimal, tax_rates: &[TaxRate]) -> Decimal {
        let mut base = subtotal;
        let mut total_tax = Decimal::zero();

        for rate in tax_rates {
            let tax = base * rate.rate / Decimal::from(100);
            total_tax += tax;
            if rate.is_compound {
                base += tax; // compound taxes stack on previous taxes
            }
        }

        total_tax
    }

    /// Calculate discount amount.
    pub fn discount_total(subtotal: Decimal, discount: &Option<DiscountType>) -> Decimal {
        match discount {
            Some(DiscountType::Percentage(pct)) => subtotal * pct / Decimal::from(100),
            Some(DiscountType::FixedAmount(amt)) => *amt,
            None => Decimal::zero(),
        }
    }

    /// Compute grand total: subtotal + tax - discount.
    pub fn grand_total(
        items: &[InvoiceItem],
        tax_rates: &[TaxRate],
        discount: &Option<DiscountType>,
    ) -> (Decimal, Decimal, Decimal, Decimal) {
        let subtotal = Self::subtotal(items);
        let tax = Self::tax_total(subtotal, tax_rates);
        let disc = Self::discount_total(subtotal, discount);
        let total = subtotal + tax - disc;
        (subtotal, tax, disc, total)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn test_item(qty: &str, price: &str) -> InvoiceItem {
        InvoiceItem {
            id: Uuid::new_v4(),
            invoice_id: Uuid::new_v4(),
            description: "Test Item".to_string(),
            quantity: Decimal::from_str_exact(qty).unwrap(),
            unit_price: Decimal::from_str_exact(price).unwrap(),
            amount: Decimal::zero(),
            tax_rate_name: None,
            sort_order: 0,
        }
    }

    #[test]
    fn test_subtotal_calculation() {
        let items = vec![
            test_item("2", "50.00"),
            test_item("1", "100.00"),
        ];
        let subtotal = InvoiceCalculator::subtotal(&items);
        assert_eq!(subtotal, Decimal::from_str_exact("200.00").unwrap());
    }

    #[test]
    fn test_tax_calculation() {
        let subtotal = Decimal::from_str_exact("200.00").unwrap();
        let tax_rates = vec![TaxRate {
            name: "GST".to_string(),
            rate: Decimal::from_str_exact("18").unwrap(),
            is_compound: false,
        }];
        let tax = InvoiceCalculator::tax_total(subtotal, &tax_rates);
        assert_eq!(tax, Decimal::from_str_exact("36.00").unwrap());
    }

    #[test]
    fn test_percentage_discount() {
        let subtotal = Decimal::from_str_exact("200.00").unwrap();
        let discount = Some(DiscountType::Percentage(Decimal::from_str_exact("10").unwrap()));
        let disc = InvoiceCalculator::discount_total(subtotal, &discount);
        assert_eq!(disc, Decimal::from_str_exact("20.00").unwrap());
    }

    #[test]
    fn test_grand_total() {
        let items = vec![test_item("2", "100.00")];
        let tax_rates = vec![TaxRate {
            name: "Tax".to_string(),
            rate: Decimal::from_str_exact("10").unwrap(),
            is_compound: false,
        }];
        let discount = Some(DiscountType::FixedAmount(Decimal::from_str_exact("5.00").unwrap()));

        let (sub, tax, disc, total) = InvoiceCalculator::grand_total(&items, &tax_rates, &discount);
        assert_eq!(sub, Decimal::from_str_exact("200.00").unwrap());
        assert_eq!(tax, Decimal::from_str_exact("20.00").unwrap());
        assert_eq!(disc, Decimal::from_str_exact("5.00").unwrap());
        assert_eq!(total, Decimal::from_str_exact("215.00").unwrap());
    }
}

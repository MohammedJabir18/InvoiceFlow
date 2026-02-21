use chrono::Utc;

/// Generate sequential invoice numbers with a configurable prefix.
pub struct InvoiceNumberGenerator {
    prefix: String,
}

impl InvoiceNumberGenerator {
    pub fn new(prefix: &str) -> Self {
        Self {
            prefix: prefix.to_string(),
        }
    }

    /// Generate the next invoice number based on the current count.
    pub fn next(&self, current_count: u64) -> String {
        let next_num = current_count + 1;
        let year = Utc::now().format("%Y");
        format!("{}-{}-{:05}", self.prefix, year, next_num)
    }
}

impl Default for InvoiceNumberGenerator {
    fn default() -> Self {
        Self::new("INV")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_number_generation() {
        let gen = InvoiceNumberGenerator::new("INV");
        let num = gen.next(0);
        assert!(num.starts_with("INV-"));
        assert!(num.ends_with("-00001"));
    }

    #[test]
    fn test_sequential_numbers() {
        let gen = InvoiceNumberGenerator::default();
        let a = gen.next(41);
        assert!(a.ends_with("-00042"));
    }
}

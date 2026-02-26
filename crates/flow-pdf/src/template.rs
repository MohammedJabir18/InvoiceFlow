use flow_core::models::{BusinessProfile, Client, Invoice};
use serde_json::Value;

pub fn render_invoice_html(invoice: &Invoice, client: &Client, _profile: &BusinessProfile) -> String {
    let mut developer = String::new();
    let mut parsed_logo = None;
    let mut qr_code_url = None;
    let mut bank_name = String::new();
    let mut branch = String::new();
    let mut account_holder = String::new();
    let mut account_number = String::new();
    let mut ifsc_code = String::new();
    let mut upi_id = String::new();
    let mut payment_terms_note = String::new();
    let mut project_details_html = String::new();

    if let Some(ref notes) = invoice.notes {
        if let Ok(json) = serde_json::from_str::<Value>(notes) {
            developer = json.get("developer").and_then(|v| v.as_str()).unwrap_or("").to_string();
            parsed_logo = json.get("logoPath").and_then(|v| v.as_str()).filter(|s| !s.is_empty()).map(|s| s.to_string());
            qr_code_url = json.get("qrCodeUrl").and_then(|v| v.as_str()).filter(|s| !s.is_empty()).map(|s| s.to_string());
            payment_terms_note = json.get("paymentTermsNote").and_then(|v| v.as_str()).unwrap_or("").to_string();

            if let Some(bank) = json.get("bankDetails") {
                bank_name = bank.get("bankName").and_then(|v| v.as_str()).unwrap_or("").to_string();
                branch = bank.get("branch").and_then(|v| v.as_str()).unwrap_or("").to_string();
                account_holder = bank.get("accountHolder").and_then(|v| v.as_str()).unwrap_or("").to_string();
                account_number = bank.get("accountNumber").and_then(|v| v.as_str()).unwrap_or("").to_string();
                ifsc_code = bank.get("ifscCode").and_then(|v| v.as_str()).unwrap_or("").to_string();
                upi_id = bank.get("upiId").and_then(|v| v.as_str()).unwrap_or("").to_string();
            }

            if let Some(arr) = json.get("projectDetails").and_then(|v| v.as_array()) {
                let mut html = String::new();
                for item in arr {
                    let label = item.get("label").and_then(|v| v.as_str()).unwrap_or("");
                    let value = item.get("value").and_then(|v| v.as_str()).unwrap_or("");
                    if !value.is_empty() {
                        html.push_str(&format!(
                            r#"
                            <div class="grid grid-cols-160 items-center">
                                <div class="font-bold">{}</div>
                                <div>{}</div>
                            </div>
                            "#,
                            label, value
                        ));
                    }
                }
                if !html.is_empty() {
                    project_details_html = html;
                }
            }
        }
    }

    let logo_html = if let Some(logo) = parsed_logo {
        if logo.starts_with("data:image") {
            format!(r#"<img src="{}" alt="Business Logo" class="logo-img" />"#, logo)
        } else {
            let logo_url = format!("file:///{}", logo.replace("\\", "/"));
            format!(r#"<img src="{}" alt="Business Logo" class="logo-img" />"#, logo_url)
        }
    } else {
        String::new()
    };

    let items_html: String = invoice.items.iter().map(|item| {
        format!(
            r#"
            <tr class="border-row">
                <td class="td-desc">{}</td>
                <td class="td-amount">{}</td>
            </tr>
            "#,
            item.description.replace("\n", "<br>"),
            format_currency(&item.amount.to_string(), &invoice.currency.to_string())
        )
    }).collect();

    let qr_html = if let Some(qr) = qr_code_url {
        if qr.starts_with("data:image") {
            format!(r#"<img src="{}" alt="UPI QR Code" class="qr-img bg-white" />"#, qr)
        } else {
            let qr_url = format!("file:///{}", qr.replace("\\", "/"));
            format!(r#"<img src="{}" alt="UPI QR Code" class="qr-img bg-white" />"#, qr_url)
        }
    } else {
        String::new()
    };

    format!(
        r#"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice {}</title>
            <style>
                * {{
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
                    background-color: #ffffff;
                    color: #111827;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }}
                
                .page {{
                    width: 210mm;
                    margin: 0 auto;
                    padding: 20mm;
                    background: #ffffff;
                }}
                
                /* Header */
                .header-flex {{
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }}
                
                .logo-container {{
                    width: 192px;
                    height: 96px;
                    border: 1px dashed #e5e7eb;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f9fafb;
                }}
                
                .logo-img {{
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    padding: 8px;
                }}
                
                .title-text {{
                    font-size: 36px;
                    font-weight: 700;
                    color: #3e546c;
                    letter-spacing: 0.025em;
                    margin: 8px 0 0 0;
                    text-align: right;
                }}
                
                /* Top Info Grid */
                .top-grid {{
                    display: flex;
                    background-color: #f3f4f6;
                    margin-bottom: 32px;
                }}
                
                .grid-col {{
                    flex: 1;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }}
                
                .grid-col:first-child {{
                    border-right: 1px solid #e5e7eb;
                }}
                
                .info-label {{
                    font-weight: 700;
                    font-size: 14px;
                    color: #111827;
                    display: block;
                    margin-bottom: 4px;
                }}
                
                .info-value {{
                    font-size: 16px;
                    color: #374151;
                }}
                
                /* Sections general */
                .section-title {{
                    font-size: 20px;
                    font-weight: 700;
                    color: #3e546c;
                    margin: 0 0 8px 0;
                }}
                
                .section-box {{
                    border: 1px solid #e5e7eb;
                    padding: 16px;
                    margin-bottom: 32px;
                    font-size: 14px;
                }}
                
                /* Bill To */
                .client-name {{
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 4px;
                }}
                
                .client-detail {{
                    color: #374151;
                    line-height: 1.6;
                }}
                
                .client-email {{
                    color: #3b82f6;
                }}
                
                /* Project Details */
                .grid-cols-160 {{
                    display: grid;
                    grid-template-columns: 160px 1fr;
                    margin-bottom: 8px;
                }}
                
                /* Table */
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 48px;
                }}
                
                th {{
                    background-color: #3e546c;
                    color: #ffffff;
                    text-align: left;
                    padding: 8px 16px;
                    font-weight: 700;
                    border: 1px solid #3e546c;
                }}
                
                th.th-amount {{
                    text-align: right;
                    width: 128px;
                }}
                
                .border-row td {{
                    border-bottom: 1px solid #e5e7eb;
                    border-left: 1px solid #e5e7eb;
                    border-right: 1px solid #e5e7eb;
                }}
                
                .td-desc {{
                    padding: 12px 16px;
                    vertical-align: top;
                    font-size: 14px;
                    color: #111827;
                    line-height: 1.6;
                }}
                
                .td-amount {{
                    padding: 12px 16px;
                    vertical-align: top;
                    text-align: right;
                    font-size: 16px;
                    font-weight: 700;
                    color: #111827;
                }}
                
                .total-row td {{
                    background-color: #10b981;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 18px;
                    padding: 12px 16px;
                    text-align: right;
                    border: 1px solid #10b981;
                }}
                
                /* Payment Info */
                .payment-section {{
                    margin-bottom: 16px;
                    margin-top: 48px;
                }}
                
                .payment-grid {{
                    display: flex;
                    gap: 24px;
                    margin-bottom: 32px;
                }}
                
                .bank-details {{
                    flex: 1;
                    background-color: #fffbeb;
                    padding: 16px;
                    font-size: 14px;
                }}
                
                .bank-title {{
                    font-weight: 700;
                    color: #3e546c;
                    font-size: 16px;
                    margin: 0 0 12px 0;
                }}
                
                .bank-row {{
                    display: flex;
                    margin-bottom: 6px;
                    color: #1f2937;
                }}
                
                .bank-label {{
                    font-weight: 700;
                    width: 120px;
                    flex-shrink: 0;
                }}
                
                .bank-value {{
                    flex: 1;
                }}
                
                .text-blue {{
                    color: #3b82f6;
                }}
                
                .qr-section {{
                    width: 250px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-left: 1px solid #e5e7eb;
                    padding-left: 24px;
                    position: relative;
                }}
                
                .qr-title {{
                    font-weight: 700;
                    color: #3e546c;
                    margin-bottom: 8px;
                    font-size: 14px;
                    text-align: center;
                }}
                
                .qr-box {{
                    width: 192px;
                    height: 192px;
                    background-color: #1e293b;
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }}
                
                .qr-img {{
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }}
                
                /* Payment Terms */
                .terms-box {{
                    background-color: #ecfdf5;
                    border: 1px solid #d1fae5;
                    padding: 16px;
                    font-size: 14px;
                    color: #1f2937;
                    margin-bottom: 32px;
                }}
                
                /* Footer Message */
                .footer-box {{
                    background-color: #e0f2fe;
                    padding: 16px 8px;
                    text-align: center;
                }}
                
                .footer-title {{
                    font-size: 20px;
                    font-weight: 700;
                    color: #0284c7;
                    margin: 0 0 4px 0;
                }}
                
                .bottom-text {{
                    text-align: center;
                    margin-top: 24px;
                    font-size: 12px;
                    font-style: italic;
                    color: #9ca3af;
                }}
            </style>
        </head>
        <body>
            <div class="page">
                <!-- Header -->
                <div class="header-flex">
                    <div class="logo-container">
                        {}
                    </div>
                    <div>
                        <h1 class="title-text">INVOICE</h1>
                    </div>
                </div>
                
                <!-- Top Info Grid -->
                <div class="top-grid">
                    <div class="grid-col">
                        <div>
                            <span class="info-label">Invoice Number:</span>
                            <div class="info-value">{}</div>
                        </div>
                        <div>
                            <span class="info-label">Invoice Date:</span>
                            <div class="info-value">{}</div>
                        </div>
                    </div>
                    <div class="grid-col">
                        <div>
                            <span class="info-label">Developer:</span>
                            <div class="info-value">{}</div>
                        </div>
                        <div>
                            <span class="info-label">Due Date:</span>
                            <div class="info-value">{}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Bill To -->
                <div style="margin-bottom: 32px;">
                    <h2 class="section-title">Bill To:</h2>
                    <div class="section-box">
                        <div class="client-name">{}</div>
                        <div class="client-detail">
                            {}
                            {}
                        </div>
                    </div>
                </div>
                
                <!-- Project Details -->
                {}
                
                <!-- Services & Charges -->
                <div>
                    <h2 class="section-title">Services & Charges</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="th-amount">Amount ({})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {}
                            <tr class="total-row">
                                <td>TOTAL AMOUNT DUE:</td>
                                <td>{}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Payment Information Section -->
                <div class="payment-section">
                    <h2 class="section-title">Payment Information</h2>
                </div>
                
                <div class="payment-grid">
                    <!-- Bank Details -->
                    <div class="bank-details">
                        <h3 class="bank-title">Bank Account Details</h3>
                        <div class="bank-row">
                            <span class="bank-label">Account Holder:</span>
                            <span class="bank-value">{}</span>
                        </div>
                        <div class="bank-row">
                            <span class="bank-label">Account Number:</span>
                            <span class="bank-value">{}</span>
                        </div>
                        <div class="bank-row">
                            <span class="bank-label">IFSC Code:</span>
                            <span class="bank-value text-blue">{}</span>
                        </div>
                        <div class="bank-row">
                            <span class="bank-label">Bank:</span>
                            <span class="bank-value">{}</span>
                        </div>
                        <div class="bank-row">
                            <span class="bank-label">Branch:</span>
                            <span class="bank-value">{}</span>
                        </div>
                        <div class="bank-row">
                            <span class="bank-label">UPI ID:</span>
                            <span class="bank-value text-blue">{}</span>
                        </div>
                        <div style="margin-top: 12px;">
                            <span style="font-weight: 700; display: block; margin-bottom: 4px;">Payment Methods:</span>
                            <p style="margin: 0; line-height: 1.4; color: #374151;">
                                • Bank Transfer (NEFT/RTGS/IMPS)<br>
                                • UPI Payment (Scan QR Code →)<br>
                                • Cash
                            </p>
                        </div>
                    </div>
                    
                    <!-- QR Code -->
                    <div class="qr-section">
                        <h3 class="qr-title">Scan to Pay via UPI</h3>
                        <div class="qr-box">
                            {}
                        </div>
                        <div style="margin-top: 8px; text-align: center; font-size: 12px; font-weight: 700; color: #111827;">{}</div>
                        <div style="text-align: center; font-size: 10px; color: #6b7280;">{}</div>
                    </div>
                </div>
                
                <!-- Payment Terms -->
                <div class="terms-box">
                    <h3 style="font-weight: 700; font-size: 16px; margin: 0 0 4px 0;">Payment Terms:</h3>
                    <p style="margin: 0 0 4px 0;">• Payment is due upon receipt of this invoice</p>
                    <p style="margin: 0 0 8px 0;">• Please include Invoice Number ({}) in payment reference</p>
                    <div style="display: flex; align-items: flex-start; margin-top: 8px;">
                        <span style="font-weight: 700; font-style: italic; margin-right: 4px; flex-shrink: 0;">Note:</span>
                        <span>{}</span>
                    </div>
                </div>
                
                <!-- Footer Message -->
                <div class="footer-box">
                    <h3 class="footer-title">Thank You for Your Business!</h3>
                    <p style="margin: 0; font-size: 14px; color: #1f2937;">For any queries regarding this invoice, please contact {}</p>
                </div>
                
                <div class="bottom-text">
                    This is a computer-generated invoice and does not require a physical signature.
                </div>
            </div>
        </body>
        </html>
        "#,
        &invoice.number,
        logo_html,
        invoice.number,
        invoice.issue_date.format("%d %b %Y"),
        developer,
        invoice.due_date.format("%d %b %Y"),
        client.name,
        if let Some(company) = &client.company { format!("<p>{}</p>", company) } else { String::new() },
        if let Some(email) = &client.email { format!(r#"<p>Website: <span class="client-email">{}</span></p>"#, email) } else { String::new() },
        if !project_details_html.is_empty() {
            format!(
                r#"
                <div style="margin-bottom: 32px;">
                    <h2 class="section-title">Project Details</h2>
                    <div class="section-box" style="display: flex; flex-direction: column; gap: 8px;">
                        {}
                    </div>
                </div>
                "#, project_details_html
            )
        } else {
            String::new()
        },
        currency_symbol(&invoice.currency.to_string()),
        items_html,
        format_currency(&invoice.amount_due.to_string(), &invoice.currency.to_string()),
        account_holder,
        account_number,
        ifsc_code,
        bank_name,
        branch,
        upi_id,
        qr_html,
        developer,
        upi_id,
        invoice.number,
        payment_terms_note.replace("\n", "<br>"),
        if developer.is_empty() { "the developer" } else { &developer }
    )
}

fn currency_symbol(currency: &str) -> String {
    match currency {
        "USD" => "$".to_string(),
        "EUR" => "€".to_string(),
        "GBP" => "£".to_string(),
        "INR" => "₹".to_string(),
        "AED" => "د.إ".to_string(),
        _ => currency.to_string(),
    }
}

fn format_currency(amount: &str, currency: &str) -> String {
    let amt: f64 = amount.parse().unwrap_or(0.0);
    
    // Add basic comma formatting for thousands (Indian format logic mostly)
    let int_part = amt.trunc() as i64;
    let fract_part = (amt.fract().abs() * 100.0).round() as i64;
    
    let mut int_str = int_part.to_string();
    
    if currency == "INR" {
        // Indian numbering system: 1,00,000
        let len = int_str.len();
        if len > 3 {
            let mut res = String::new();
            let mut count = 0;
            let mut is_first = true;
            for c in int_str.chars().rev() {
                res.push(c);
                count += 1;
                if is_first && count == 3 && len > 3 {
                    res.push(',');
                    count = 0;
                    is_first = false;
                } else if !is_first && count == 2 && res.len() < len + (len-3)/2 {
                    res.push(',');
                    count = 0;
                }
            }
            int_str = res.chars().rev().collect();
        }
    } else {
        // Western numbering system: 100,000
        let mut i = int_str.len() as isize - 3;
        while i > 0 {
            if int_str.as_bytes()[(i - 1) as usize] != b'-' {
                int_str.insert(i as usize, ',');
            }
            i -= 3;
        }
    }
    
    let formatted = format!("{}.{:02}", int_str, fract_part);
    
    format!("{} {}", currency_symbol(currency), formatted)
}

use crate::commands::AppState;
use flow_core::ai_service::{AIService, ParsedExpense, DealInsights};
use flow_db::repositories::CrmRepository;
use tauri::State;
use std::fs;

#[tauri::command]
pub async fn extract_receipt_data(file_path: String) -> Result<ParsedExpense, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    let ai = AIService::new().map_err(|e| e.to_string())?;
    
    ai.analyze_receipt(&bytes).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_deal_insights(state: State<'_, AppState>, deal_id: String) -> Result<DealInsights, String> {
    let repo = CrmRepository::new(state.db.clone());
    
    // Fetch interaction history
    let interactions = repo.get_interactions_for_deal(&deal_id).await.map_err(|e| e.to_string())?;
    
    // Evaluate via AI
    let ai = AIService::new().map_err(|e| e.to_string())?;
    let insights = ai.score_deal(&interactions).await.map_err(|e| e.to_string())?;
    
    // Update the Deal with the new score and suggested action
    repo.update_deal_ai_metrics(&deal_id, insights.ai_lead_score, &insights.next_suggested_action)
        .await
        .map_err(|e| e.to_string())?;
        
    Ok(insights)
}

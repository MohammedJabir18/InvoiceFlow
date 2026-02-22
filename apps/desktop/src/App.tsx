import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { Clients } from "./pages/Clients";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { useEffect } from "react";
import { useSettingsStore } from "./store/settingsStore";

function App() {
    const fetchSettings = useSettingsStore(state => state.fetchSettings);
    const fetchBankDetails = useSettingsStore(state => state.fetchBankDetails);

    useEffect(() => {
        fetchSettings();
        fetchBankDetails();
    }, [fetchSettings, fetchBankDetails]);

    return (
        <BrowserRouter>
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
                <div className="aurora-bg" />
                <Routes>
                    <Route path="/editor" element={<Editor />} />
                    <Route path="*" element={
                        <>
                            <Sidebar />
                            <main style={{ marginLeft: '16rem', flex: 1, minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', padding: '1.5rem' }}>
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/invoices" element={<Invoices />} />
                                    <Route path="/clients" element={<Clients />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Routes>
                            </main>
                        </>
                    } />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;

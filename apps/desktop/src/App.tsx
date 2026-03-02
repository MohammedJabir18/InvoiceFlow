import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FloatingSidebar } from "./components/FloatingSidebar";
import { TopNavbar } from "./components/TopNavbar";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { Clients } from "./pages/Clients";
import { Deals } from "./pages/Deals";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { useEffect, useState } from "react";
import { useSettingsStore } from "./store/settingsStore";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { UpdaterNotification } from "./components/ui/UpdaterNotification";

function App() {
    const fetchSettings = useSettingsStore(state => state.fetchSettings);
    const fetchBankDetails = useSettingsStore(state => state.fetchBankDetails);

    // Global Settings
    const profile = useSettingsStore(state => state.profile);
    const isLoading = useSettingsStore(state => state.isLoading);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchBankDetails();
    }, [fetchSettings, fetchBankDetails]);

    // Check onboarding status
    useEffect(() => {
        if (profile && !isLoading) {
            // First run condition: profile name is exactly "My Company" and no email/phone
            const hasSkipped = localStorage.getItem('has_skipped_onboarding') === 'true';
            if (!hasSkipped && profile.name === "My Company" && !profile.email && !profile.phone) {
                setShowWizard(true);
            } else {
                setShowWizard(false);
            }
        }
    }, [profile, isLoading]);

    // Apply Global Theme
    useEffect(() => {
        if (!profile) return;

        const applyTheme = (isLight: boolean) => {
            if (isLight) {
                document.body.classList.add('daylight');
            } else {
                document.body.classList.remove('daylight');
            }
        };

        if (profile.theme_preference === 'system') {
            // System preference shouldn't override explicitly set 'daylight' if toggle sets it.
            // We'll leave the initial body setup inside App and let ThemeToggle handle manual overrides.
        }
    }, [profile?.theme_preference]);

    return (
        <BrowserRouter>
            {showWizard && (
                <OnboardingWizard onComplete={() => setShowWizard(false)} />
            )}
            <UpdaterNotification />
            <div className="app-layout focus:outline-none">
                <div className="aurora-bg" />
                <Routes>
                    <Route path="/editor" element={<Editor />} />
                    <Route path="*" element={
                        <>
                            <FloatingSidebar />
                            <TopNavbar />
                            <main className="flex-1 ml-[104px] min-h-screen overflow-y-auto overflow-x-hidden pt-24 px-8 pb-10">
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/invoices" element={<Invoices />} />
                                    <Route path="/clients" element={<Clients />} />
                                    <Route path="/deals" element={<Deals />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/about" element={<About />} />
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

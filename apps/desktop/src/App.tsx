import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FloatingSidebar } from "./components/FloatingSidebar";
import { TopNavbar } from "./components/TopNavbar";
import { MobileHeader } from "./components/mobile/MobileHeader";
import { MobileBottomNav } from "./components/mobile/MobileBottomNav";
import { MobileMenuDrawer } from "./components/mobile/MobileMenuDrawer";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { Quotations } from "./pages/Quotations";
import { MonthlyReport } from "./pages/MonthlyReport";
import { Subscription } from "./pages/Subscription";
import { Clients } from "./pages/Clients";
import { Deals } from "./pages/Deals";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { PaymentLinkView } from "./pages/PaymentLinkView";
import { useEffect, useState } from "react";
import { useSettingsStore } from "./store/settingsStore";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { UpdaterNotification } from "./components/ui/UpdaterNotification";
import { CommandPalette } from "./components/ui/CommandPalette";

function App() {
    const fetchSettings = useSettingsStore(state => state.fetchSettings);
    const fetchBankDetails = useSettingsStore(state => state.fetchBankDetails);

    // Global Settings
    const profile = useSettingsStore(state => state.profile);
    const isLoading = useSettingsStore(state => state.isLoading);
    const [showWizard, setShowWizard] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchBankDetails();
    }, [fetchSettings, fetchBankDetails]);

    // Check onboarding status
    useEffect(() => {
        if (profile && !isLoading) {
            const hasSkipped = localStorage.getItem('has_skipped_onboarding') === 'true';
            if (!hasSkipped && profile.name === "My Company" && !profile.email && !profile.phone) {
                setShowWizard(true);
            } else {
                setShowWizard(false);
            }
        }
    }, [profile, isLoading]);

    return (
        <BrowserRouter>
            {showWizard && (
                <OnboardingWizard onComplete={() => setShowWizard(false)} />
            )}
            <UpdaterNotification />
            <div className="app-layout focus:outline-none">
                <CommandPalette />
                <div className="aurora-bg" />
                <Routes>
                    {/* Standalone Editor Route */}
                    <Route path="/editor" element={<Editor />} />

                    {/* Public Shareable Payment Link Route */}
                    <Route path="/pay/:id" element={<PaymentLinkView />} />

                    {/* Main Application Shell (Desktop + Mobile Responsive) */}
                    <Route path="*" element={
                        <>
                            {/* Desktop Sidebar & Top Navbar */}
                            <FloatingSidebar />
                            <TopNavbar />

                            {/* Mobile Smartphone Header & Bottom Navigation */}
                            <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />
                            <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
                            <MobileMenuDrawer
                                isOpen={mobileMenuOpen}
                                onClose={() => setMobileMenuOpen(false)}
                            />

                            {/* Responsive Main Content Area */}
                            <main className="flex-1 md:ml-[104px] ml-0 min-h-screen overflow-y-auto overflow-x-hidden pt-16 md:pt-24 px-3 sm:px-6 md:px-8 pb-24 md:pb-10">
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/invoices" element={<Invoices />} />
                                    <Route path="/quotations" element={<Quotations />} />
                                    <Route path="/reports" element={<MonthlyReport />} />
                                    <Route path="/subscription" element={<Subscription />} />
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

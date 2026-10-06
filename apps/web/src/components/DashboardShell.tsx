import React, { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store.js';
import { useOrganizations } from '../hooks/queries.js';
import { Navbar } from './Navbar.js';
import { OnboardingModal } from './OnboardingModal.js';
import { DashboardView } from './DashboardView.js';
import { SettingsView } from './SettingsView.js';
import { MembersView } from './MembersView.js';
import { LayoutDashboard, Settings, Users, PlusCircle } from 'lucide-react';

export const DashboardShell: React.FC = () => {
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const setCurrentOrgId = useUIStore((state) => state.setCurrentOrganizationId);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setCreateOrgModalOpen = useUIStore((state) => state.setCreateOrgModalOpen);

  const { data: orgs, isLoading } = useOrganizations();

  // If no active org selected, default to first available org
  useEffect(() => {
    if (orgs && orgs.length > 0 && (!currentOrgId || !orgs.some((o) => o.id === currentOrgId))) {
      setCurrentOrgId(orgs[0].id);
    }
  }, [orgs, currentOrgId, setCurrentOrgId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading organizations...</div>
        ) : !orgs || orgs.length === 0 ? (
          /* Empty State: Prompt user to bootstrap their first organization */
          <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl shadow-xs border border-gray-200 text-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Welcome to InvoiceFlow!</h2>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              You are not a member of any organization yet. Create your first business organization to get started.
            </p>
            <button
              type="button"
              onClick={() => setCreateOrgModalOpen(true)}
              className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div>
            {/* Subnav Tabs */}
            <div className="flex border-b border-gray-200 mb-6 space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center cursor-pointer transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center cursor-pointer transition-colors ${
                  activeTab === 'settings'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Business Settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center cursor-pointer transition-colors ${
                  activeTab === 'members'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Team & Access
              </button>
            </div>

            {/* Tab Body */}
            {activeTab === 'overview' && <DashboardView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'members' && <MembersView />}
          </div>
        )}
      </main>

      <OnboardingModal />
    </div>
  );
};

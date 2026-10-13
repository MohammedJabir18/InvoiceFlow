import React from 'react';
import { useUIStore } from '../stores/ui-store.js';
import { useCurrentUser, useOrganizations } from '../hooks/queries.js';
import { Building2, Plus, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { purgeQueryCache } from '../lib/query-client.js';

export const Navbar: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: orgs } = useOrganizations();
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const setCurrentOrgId = useUIStore((state) => state.setCurrentOrganizationId);
  const setCreateOrgModalOpen = useUIStore((state) => state.setCreateOrgModalOpen);
  const clearAuth = useUIStore((state) => state.clearAuth);

  const activeOrg = orgs?.find((o) => o.id === currentOrgId);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              IF
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">InvoiceFlow</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                Cloud SaaS
              </span>
            </div>
          </div>

          {/* Org Selector & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Organization Switcher */}
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div className="relative inline-block text-left">
                <select
                  value={currentOrgId || ''}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setCreateOrgModalOpen(true);
                    } else {
                      setCurrentOrgId(e.target.value);
                    }
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2 pr-8 font-medium cursor-pointer"
                >
                  {orgs && orgs.length > 0 ? (
                    orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.displayName || o.legalName} ({o.role})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No Organizations
                    </option>
                  )}
                  <option value="__NEW__">+ Create Organization...</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setCreateOrgModalOpen(true)}
                className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Create New Organization"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* User Info & Sign Out */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-gray-900">{user?.email}</div>
                {activeOrg && (
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    Role: {activeOrg.role}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {
                    // Ignore sign-out network errors
                  }
                  purgeQueryCache();
                  clearAuth();
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

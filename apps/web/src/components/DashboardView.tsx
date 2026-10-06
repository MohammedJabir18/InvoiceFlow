import React from 'react';
import { useUIStore } from '../stores/ui-store.js';
import { useOrganization } from '../hooks/queries.js';
import { ShieldCheck, Globe2, DollarSign, Clock, Users } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const { data: org, isLoading } = useOrganization(currentOrgId);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading organization overview...</div>;
  }

  if (!org) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active Tenant
              </span>
              <span className="text-xs text-gray-500">ID: {org.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {org.displayName || org.legalName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Legal Entity: <span className="font-medium text-gray-700">{org.legalName}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Business Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Manage Team
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Jurisdiction</div>
              <div className="text-lg font-bold text-gray-900">{org.businessCountry}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Base Currency</div>
              <div className="text-lg font-bold text-gray-900">{org.baseCurrency}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Timezone</div>
              <div className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                {org.timezone}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Your Role</div>
              <div className="text-lg font-bold text-gray-900">{org.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone 1A Verification & Isolation Architecture Box */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 sm:p-8 shadow-md">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Milestone 1A SaaS Foundation Active</h3>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              This tenant is isolated by PostgreSQL 17 Row-Level Security (RLS) using transaction-scoped
              context (<code className="text-indigo-300 bg-white/10 px-1.5 py-0.5 rounded">set_config(&apos;app.current_org_id&apos;)</code>).
              Connection pooling contamination is prevented by automatic rollback on completion.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
                PostgreSQL 17.6 Cluster
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
                Restricted App Role (NOSUPERUSER, NOBYPASSRLS)
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
                TanStack Query v5 Cache
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
                Zustand v5 UI State
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

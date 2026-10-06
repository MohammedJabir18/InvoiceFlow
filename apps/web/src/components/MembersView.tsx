import React, { useState } from 'react';
import { useUIStore } from '../stores/ui-store.js';
import {
  useOrganization,
  useOrganizationMembers,
  useAddMember,
  useRemoveMember,
} from '../hooks/queries.js';
import { Users, UserPlus, Trash2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MembersView: React.FC = () => {
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const { data: org } = useOrganization(currentOrgId);
  const { data: members, isLoading, error } = useOrganizationMembers(currentOrgId);

  const addMutation = useAddMember(currentOrgId || '');
  const removeMutation = useRemoveMember(currentOrgId || '');

  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'FINANCE' | 'VIEWER'>('VIEWER');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isManager = org?.role === 'OWNER' || org?.role === 'ADMIN';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!newUserId.trim()) return;

    try {
      await addMutation.mutateAsync({ userId: newUserId.trim(), role: newRole });
      setNewUserId('');
      setStatusMessage({ type: 'success', text: 'Member added successfully!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add member' });
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    setStatusMessage(null);

    try {
      await removeMutation.mutateAsync(userId);
      setStatusMessage({ type: 'success', text: `Access revoked for ${email}` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove member' });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading organization members...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load members: {(error as any)?.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & Role-Based Access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage members and enforce server-side authorization boundaries for this organization.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm flex items-center space-x-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Add Member Form (Owners / Admins only) */}
      {isManager && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
            <UserPlus className="w-4 h-4 mr-2 text-indigo-600" />
            Add Team Member
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Assign role-based access. Roles: OWNER (full authority), ADMIN (settings & members), FINANCE (documents & reports), VIEWER (read-only).
          </p>

          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Enter User UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="FINANCE">FINANCE</option>
              <option value="VIEWER">VIEWER</option>
            </select>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {addMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            Current Organization Members ({members?.length || 0})
          </h2>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              {isManager && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members && members.length > 0 ? (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : member.role === 'FINANCE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {isManager && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId, member.email)}
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Revoke Member Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isManager ? 4 : 3} className="px-6 py-8 text-center text-sm text-gray-500">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

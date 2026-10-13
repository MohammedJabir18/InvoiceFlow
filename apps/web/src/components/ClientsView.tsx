import React, { useState } from 'react';
import { useUIStore } from '../stores/ui-store.js';
import { useOrganization, useClients, useCreateClient, useUpdateClient, useArchiveClient } from '../hooks/queries.js';
import type { Client } from '@invoiceflow/shared-types';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Archive,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const { data: org } = useOrganization(currentOrgId);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading, error } = useClients(currentOrgId, {
    status: statusFilter,
    search: searchTerm,
  });

  const createMutation = useCreateClient(currentOrgId || '');
  const updateMutation = useUpdateClient(currentOrgId || '');
  const archiveMutation = useArchiveClient(currentOrgId || '');

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    taxIdentifier: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: org?.businessCountry || 'IN',
    currency: org?.baseCurrency || 'INR',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    taxIdentifier: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: '',
    currency: '',
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isEditable = org?.role === 'OWNER' || org?.role === 'ADMIN' || org?.role === 'FINANCE';

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      taxIdentifier: '',
      addressLine1: '',
      city: '',
      postalCode: '',
      country: org?.businessCountry || 'IN',
      currency: org?.baseCurrency || 'INR',
      notes: '',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      taxIdentifier: client.taxIdentifier || '',
      addressLine1: client.addressLine1 || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || org?.businessCountry || 'IN',
      currency: client.currency || org?.baseCurrency || 'INR',
      notes: client.notes || '',
      status: client.status,
    });
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.name.trim()) {
      setFormError('Client name is required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: createForm.name.trim(),
        email: createForm.email.trim() || null,
        phone: createForm.phone.trim() || null,
        company: createForm.company.trim() || null,
        taxIdentifier: createForm.taxIdentifier.trim() || null,
        addressLine1: createForm.addressLine1.trim() || null,
        city: createForm.city.trim() || null,
        postalCode: createForm.postalCode.trim() || null,
        country: createForm.country.trim() || null,
        currency: createForm.currency.trim() || null,
        notes: createForm.notes.trim() || null,
      });

      setIsCreateOpen(false);
      setFormSuccess('Client created successfully!');
      setTimeout(() => setFormSuccess(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create client');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setFormError(null);

    if (!editForm.name.trim()) {
      setFormError('Client name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        clientId: editingClient.id,
        data: {
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          company: editForm.company.trim() || null,
          taxIdentifier: editForm.taxIdentifier.trim() || null,
          addressLine1: editForm.addressLine1.trim() || null,
          city: editForm.city.trim() || null,
          postalCode: editForm.postalCode.trim() || null,
          country: editForm.country.trim() || null,
          currency: editForm.currency.trim() || null,
          notes: editForm.notes.trim() || null,
          status: editForm.status,
        },
      });

      setEditingClient(null);
      setFormSuccess('Client updated successfully!');
      setTimeout(() => setFormSuccess(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update client');
    }
  };

  const handleArchive = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to archive client "${client.name}"?`)) return;

    try {
      await archiveMutation.mutateAsync(client.id);
      setFormSuccess(`Client "${client.name}" archived.`);
      setTimeout(() => setFormSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to archive client');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your customers and business clients for quotations, invoicing, and payments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditable && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Read-Only ({org?.role})</span>
            </div>
          )}

          {isEditable && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </button>
          )}
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 uppercase mr-1">Status:</span>
          {(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Loading client directory...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600">
          Failed to load clients: {(error as any)?.message || 'Unknown error'}
        </div>
      ) : !clients || clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No clients found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No clients match the search term "${searchTerm}".`
              : 'Add your first business client to begin drafting linked quotations and invoices.'}
          </p>
          {isEditable && !searchTerm && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">
                    Client & Entity
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left">
                    Contact Details
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left">
                    Location & Currency
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{client.name}</div>
                          {client.company && (
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
                              {client.company}
                            </div>
                          )}
                          {client.taxIdentifier && (
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              Tax ID: {client.taxIdentifier}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="space-y-1">
                        {client.email ? (
                          <div className="flex items-center text-xs">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No email</span>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          <span>
                            {[client.city, client.country].filter(Boolean).join(', ') || 'Unspecified'}
                          </span>
                        </div>
                        {client.currency && (
                          <div className="text-[11px] font-semibold text-gray-500">
                            Currency: <span className="text-indigo-600">{client.currency}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          client.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      {isEditable ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(client)}
                            className="inline-flex items-center px-2.5 py-1.5 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Client"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          {client.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(client)}
                              className="inline-flex items-center px-2.5 py-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                              title="Archive Client"
                            >
                              <Archive className="w-3.5 h-3.5 mr-1" />
                              Archive
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Client */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                <p className="text-sm text-gray-500">
                  Register a customer entity within {org?.displayName || 'your organization'}.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Client / Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Company / Trade Name
                  </label>
                  <input
                    type="text"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    placeholder="e.g. Acme Group"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="billing@client.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Country (ISO-2)
                  </label>
                  <select
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="KW">Kuwait (KW)</option>
                    <option value="QA">Qatar (QA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Currency (ISO-3)
                  </label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SAR">SAR (﷼)</option>
                    <option value="KWD">KWD (KD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tax ID / GSTIN / VAT
                  </label>
                  <input
                    type="text"
                    value={createForm.taxIdentifier}
                    onChange={(e) => setCreateForm({ ...createForm, taxIdentifier: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={createForm.addressLine1}
                  onChange={(e) => setCreateForm({ ...createForm, addressLine1: e.target.value })}
                  placeholder="Address Line 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={createForm.postalCode}
                    onChange={(e) => setCreateForm({ ...createForm, postalCode: e.target.value })}
                    placeholder="Postal Code / PIN"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Payment terms, special instructions, contact persons..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving Client...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Client */}
      {editingClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditable ? 'Edit Client Details' : 'Client Overview'}
                </h2>
                <p className="text-sm text-gray-500">ID: {editingClient.id}</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Client / Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditable}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Company / Trade Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    disabled={!isEditable}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={!isEditable}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Country (ISO-2)
                  </label>
                  <select
                    disabled={!isEditable}
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="KW">Kuwait (KW)</option>
                    <option value="QA">Qatar (QA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Currency (ISO-3)
                  </label>
                  <select
                    disabled={!isEditable}
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SAR">SAR (﷼)</option>
                    <option value="KWD">KWD (KD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tax ID / GSTIN
                  </label>
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={editForm.taxIdentifier}
                    onChange={(e) => setEditForm({ ...editForm, taxIdentifier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Billing Address
                </label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={editForm.addressLine1}
                  onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                  placeholder="Address Line 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={editForm.postalCode}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    placeholder="Postal Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Status
                </label>
                <select
                  disabled={!isEditable}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditable}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {isEditable ? 'Cancel' : 'Close'}
                </button>
                {isEditable && (
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

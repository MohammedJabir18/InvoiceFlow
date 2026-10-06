import React, { useState, useEffect } from 'react';
import { useUIStore } from '../stores/ui-store.js';
import { useOrganization, useUpdateSettings } from '../hooks/queries.js';
import { Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const currentOrgId = useUIStore((state) => state.currentOrganizationId);
  const { data: org, isLoading, error } = useOrganization(currentOrgId);
  const updateMutation = useUpdateSettings(currentOrgId || '');

  const [formData, setFormData] = useState({
    legalName: '',
    displayName: '',
    businessCountry: 'US',
    taxIdentifier: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    contactEmail: '',
    contactPhone: '',
    baseCurrency: 'USD',
    reportingCurrency: 'USD',
    timezone: 'UTC',
    locale: 'en-US',
    documentLanguage: 'en',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form data when org loads
  useEffect(() => {
    if (org) {
      setFormData({
        legalName: org.legalName || '',
        displayName: org.displayName || '',
        businessCountry: org.businessCountry || 'US',
        taxIdentifier: org.taxIdentifier || '',
        addressLine1: org.addressLine1 || '',
        city: org.city || '',
        postalCode: org.postalCode || '',
        contactEmail: org.contactEmail || '',
        contactPhone: org.contactPhone || '',
        baseCurrency: org.baseCurrency || 'USD',
        reportingCurrency: org.reportingCurrency || 'USD',
        timezone: org.timezone || 'UTC',
        locale: org.locale || 'en-US',
        documentLanguage: org.documentLanguage || 'en',
      });
    }
  }, [org]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading organization settings...</div>;
  }

  if (error || !org) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load organization settings: {(error as any)?.message || 'Organization not found'}
      </div>
    );
  }

  const isEditable = org.role === 'OWNER' || org.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync({
        legalName: formData.legalName,
        displayName: formData.displayName,
        businessCountry: formData.businessCountry,
        taxIdentifier: formData.taxIdentifier || null,
        addressLine1: formData.addressLine1,
        city: formData.city,
        postalCode: formData.postalCode,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || null,
        baseCurrency: formData.baseCurrency,
        reportingCurrency: formData.reportingCurrency,
        timezone: formData.timezone,
        locale: formData.locale,
        documentLanguage: formData.documentLanguage,
      });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business & Regional Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure legal identity and independent regional parameters (Country, Currency, Timezone, Locale).
          </p>
        </div>
        {!isEditable && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Read-Only ({org.role})</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Regional & Localization Settings */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Regional & Localization Parameters
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            These settings are fully orthogonal: changing Country does not alter Currency or Timezone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Business Country (ISO 3166-1)
              </label>
              <select
                disabled={!isEditable}
                value={formData.businessCountry}
                onChange={(e) => setFormData({ ...formData, businessCountry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="US">United States (US)</option>
                <option value="IN">India (IN)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="AE">United Arab Emirates (AE)</option>
                <option value="JP">Japan (JP)</option>
                <option value="KW">Kuwait (KW)</option>
                <option value="DE">Germany (DE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Base Currency (ISO 4217)
              </label>
              <select
                disabled={!isEditable}
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="USD">USD ($) - 2 Decimals</option>
                <option value="INR">INR (₹) - 2 Decimals</option>
                <option value="EUR">EUR (€) - 2 Decimals</option>
                <option value="GBP">GBP (£) - 2 Decimals</option>
                <option value="AED">AED (د.إ) - 2 Decimals</option>
                <option value="KWD">KWD (KD) - 3 Decimals</option>
                <option value="JPY">JPY (¥) - 0 Decimals</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Reporting Currency
              </label>
              <select
                disabled={!isEditable}
                value={formData.reportingCurrency}
                onChange={(e) => setFormData({ ...formData, reportingCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Timezone (IANA)
              </label>
              <select
                disabled={!isEditable}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Formatting Locale (BCP 47)
              </label>
              <select
                disabled={!isEditable}
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="en-US">en-US (1,234.56)</option>
                <option value="en-IN">en-IN (1,23,456.78)</option>
                <option value="en-GB">en-GB (1,234.56)</option>
                <option value="ja-JP">ja-JP (1,234)</option>
                <option value="de-DE">de-DE (1.234,56)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Document Language
              </label>
              <select
                disabled={!isEditable}
                value={formData.documentLanguage}
                onChange={(e) => setFormData({ ...formData, documentLanguage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="en">English (en)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="de">German (de)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Legal & Identity */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Legal Identity & Tax</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Legal Registered Name *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Display Brand Name *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Tax Identification Number
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.taxIdentifier}
                onChange={(e) => setFormData({ ...formData, taxIdentifier: e.target.value })}
                placeholder="GSTIN / EIN / VAT Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Official Contact Email *
              </label>
              <input
                type="email"
                disabled={!isEditable}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Official Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  City *
                </label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Postal Code / ZIP *
                </label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {isEditable && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

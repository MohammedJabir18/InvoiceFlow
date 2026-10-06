export type MembershipRole = 'OWNER' | 'ADMIN' | 'FINANCE' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  legalName: string;
  displayName: string;
  businessCountry: string;      // ISO 3166-1 alpha-2, e.g. 'IN', 'US', 'AE'
  taxIdentifier: string | null; // e.g. GSTIN, VAT, EIN
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string;
  contactEmail: string;
  contactPhone: string | null;
  logoUrl: string | null;
  timezone: string;             // IANA timezone string, e.g. 'Asia/Kolkata', 'America/New_York'
  locale: string;               // BCP 47 locale, e.g. 'en-US', 'en-IN'
  documentLanguage: string;     // ISO 639-1 language code, e.g. 'en', 'ar', 'ml'
  baseCurrency: string;         // ISO 4217 currency code, e.g. 'USD', 'INR', 'AED', 'KWD'
  reportingCurrency: string;    // ISO 4217 currency code
  financialYearStartMonth: number; // 1 to 12
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  user?: User;
}

export interface CreateOrganizationDTO {
  legalName: string;
  displayName: string;
  businessCountry: string;
  taxIdentifier?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateProvince?: string | null;
  postalCode: string;
  contactEmail: string;
  contactPhone?: string | null;
  timezone: string;
  locale: string;
  documentLanguage: string;
  baseCurrency: string;
  reportingCurrency?: string;
  financialYearStartMonth?: number;
}

export interface UpdateOrganizationSettingsDTO {
  legalName?: string;
  displayName?: string;
  businessCountry?: string;
  taxIdentifier?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  stateProvince?: string | null;
  postalCode?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  timezone?: string;
  locale?: string;
  documentLanguage?: string;
  baseCurrency?: string;
  reportingCurrency?: string;
  financialYearStartMonth?: number;
}

export interface AuthenticatedUserPayload {
  id: string;        // Verified from JWT 'sub' claim
  email: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

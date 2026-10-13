import { useUIStore } from '../stores/ui-store.js';
import type {
  Client,
  CreateClientDTO,
  UpdateClientDTO,
  PaginationMetadata,
  PaginatedResult,
  ListClientsParams,
} from '@invoiceflow/shared-types';

class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

interface ApiResponseEnvelope<T> {
  data: T;
  pagination?: PaginationMetadata;
}

async function fetchWithAuthEnvelope<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponseEnvelope<T>> {
  const token = useUIStore.getState().token;
  const currentOrgId = useUIStore.getState().currentOrganizationId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (currentOrgId) {
    headers['x-organization-id'] = currentOrgId;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    useUIStore.getState().clearAuth();
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data?.error?.message || `HTTP error ${response.status}`;
    const errorCode = data?.error?.code || `HTTP_${response.status}`;
    throw new ApiError(errorMsg, errorCode, data?.error?.details);
  }

  return {
    data: data.data,
    pagination: data.pagination,
  };
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const envelope = await fetchWithAuthEnvelope<T>(endpoint, options);
  return envelope.data;
}

export const api = {
  auth: {
    sync: (payload: { fullName: string }) =>
      fetchWithAuth<{ id: string; email: string; fullName: string }>('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () =>
      fetchWithAuth<{
        id: string;
        email: string;
        organizations: Array<{
          id: string;
          legalName: string;
          displayName: string;
          role: string;
          createdAt: string;
          updatedAt: string;
        }>;
      }>('/api/auth/me'),
  },

  organizations: {
    list: () =>
      fetchWithAuth<
        Array<{
          id: string;
          legalName: string;
          displayName: string;
          role: string;
          createdAt: string;
          updatedAt: string;
        }>
      >('/api/organizations'),

    create: (payload: any) =>
      fetchWithAuth<{
        id: string;
        legalName: string;
        displayName: string;
        businessCountry: string;
        baseCurrency: string;
        timezone: string;
        locale: string;
        role: string;
      }>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    get: (id: string) => fetchWithAuth<any>(`/api/organizations/${id}`),

    updateSettings: (id: string, payload: any) =>
      fetchWithAuth<any>(`/api/organizations/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    getMembers: (id: string) =>
      fetchWithAuth<
        Array<{
          id: string;
          userId: string;
          email: string;
          fullName: string;
          role: string;
          joinedAt: string;
        }>
      >(`/api/organizations/${id}/members`),

    addMember: (id: string, payload: { userId: string; role: string }) =>
      fetchWithAuth<any>(`/api/organizations/${id}/members`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    removeMember: (id: string, userId: string) =>
      fetchWithAuth<{ success: boolean }>(`/api/organizations/${id}/members/${userId}`, {
        method: 'DELETE',
      }),
  },

  clients: {
    list: async (
      orgId: string,
      params?: ListClientsParams
    ): Promise<PaginatedResult<Client>> => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.search) sp.set('search', params.search);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const qs = sp.toString() ? `?${sp.toString()}` : '';

      const res = await fetchWithAuthEnvelope<Client[]>(`/api/organizations/${orgId}/clients${qs}`);
      const limit = params?.limit ?? 50;
      const page = params?.page ?? 1;

      return {
        items: res.data ?? [],
        pagination: res.pagination ?? {
          page,
          limit,
          total: res.data?.length ?? 0,
          totalPages: Math.ceil((res.data?.length ?? 0) / limit) || 1,
        },
      };
    },

    get: (orgId: string, clientId: string) =>
      fetchWithAuth<Client>(`/api/organizations/${orgId}/clients/${clientId}`),

    create: (orgId: string, payload: CreateClientDTO) =>
      fetchWithAuth<Client>(`/api/organizations/${orgId}/clients`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (orgId: string, clientId: string, payload: UpdateClientDTO) =>
      fetchWithAuth<Client>(`/api/organizations/${orgId}/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    archive: (orgId: string, clientId: string) =>
      fetchWithAuth<Client>(`/api/organizations/${orgId}/clients/${clientId}`, {
        method: 'DELETE',
      }),
  },
};

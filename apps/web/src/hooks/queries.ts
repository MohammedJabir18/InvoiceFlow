import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api-client.js';
import { useUIStore } from '../stores/ui-store.js';

export function useCurrentUser() {
  const token = useUIStore((state) => state.token);
  return useQuery({
    queryKey: ['currentUser', token ? 'authenticated' : 'anonymous'],
    queryFn: () => api.auth.me(),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useOrganizations() {
  const token = useUIStore((state) => state.token);
  return useQuery({
    queryKey: ['user-organizations', token ? 'authenticated' : 'anonymous'],
    queryFn: () => api.organizations.list(),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
}

export function useOrganization(id: string | null) {
  const token = useUIStore((state) => state.token);
  return useQuery({
    // Strictly tenant-scoped query key: includes explicit organization id
    queryKey: ['organization', id, 'details'],
    queryFn: () => api.organizations.get(id!),
    enabled: Boolean(token && id),
    staleTime: 30 * 1000,
  });
}

export function useOrganizationMembers(id: string | null) {
  const token = useUIStore((state) => state.token);
  return useQuery({
    // Strictly tenant-scoped query key: includes explicit organization id
    queryKey: ['organization', id, 'members'],
    queryFn: () => api.organizations.getMembers(id!),
    enabled: Boolean(token && id),
    staleTime: 30 * 1000,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const setCurrentOrgId = useUIStore((state) => state.setCurrentOrganizationId);

  return useMutation({
    mutationFn: (data: any) => api.organizations.create(data),
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCurrentOrgId(newOrg.id);
    },
  });
}

export function useUpdateSettings(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.organizations.updateSettings(orgId, data),
    onSuccess: () => {
      // Invalidate specifically this organization's cache
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
    },
  });
}

export function useAddMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      api.organizations.addMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'members'] });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.organizations.removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'members'] });
    },
  });
}

import type { ListClientsParams } from '@invoiceflow/shared-types';

export function useClients(orgId: string | null, params?: ListClientsParams) {
  const token = useUIStore((state) => state.token);
  const status = params?.status ?? 'ACTIVE';
  const search = params?.search ?? '';
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;

  return useQuery({
    queryKey: ['organization', orgId, 'clients', status, search, page, limit],
    queryFn: () => api.clients.list(orgId!, { status, search, page, limit }),
    enabled: Boolean(token && orgId),
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
  });
}

export function useClient(orgId: string | null, clientId: string | null) {
  const token = useUIStore((state) => state.token);
  return useQuery({
    queryKey: ['organization', orgId, 'clients', clientId],
    queryFn: () => api.clients.get(orgId!, clientId!),
    enabled: Boolean(token && orgId && clientId),
    staleTime: 30 * 1000,
  });
}

export function useCreateClient(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.clients.create(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'clients'] });
    },
  });
}

export function useUpdateClient(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: any }) =>
      api.clients.update(orgId, clientId, data),
    onSuccess: (_updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'clients'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', orgId, 'clients', variables.clientId],
      });
    },
  });
}

export function useArchiveClient(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => api.clients.archive(orgId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'clients'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

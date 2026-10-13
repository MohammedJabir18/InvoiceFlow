import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Completely clears all server-state caches across all tenants and users.
 * Must be executed on user logout or account switch to guarantee zero cross-tenant leakage.
 */
export function purgeQueryCache(): void {
  queryClient.clear();
}

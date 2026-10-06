import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from './stores/ui-store.js';
import { supabase } from './lib/supabase.js';
import { queryClient, purgeQueryCache } from './lib/query-client.js';
import { AuthView } from './components/AuthView.js';
import { DashboardShell } from './components/DashboardShell.js';

export const AppContent: React.FC = () => {
  const token = useUIStore((state) => state.token);
  const setToken = useUIStore((state) => state.setToken);
  const clearAuth = useUIStore((state) => state.clearAuth);

  // Synchronize with Supabase Auth session if present
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Guarantee user-scoped query caches are cleared on logout
        purgeQueryCache();
        clearAuth();
      } else if (session?.access_token) {
        setToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [setToken, clearAuth]);

  if (!token) {
    return <AuthView />;
  }

  return <DashboardShell />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;

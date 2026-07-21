import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import supabase from './supabase-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Import and expose debug utilities for development
if (import.meta.env.DEV) {
  const initDebug = async () => {
    try {
      const debug = await import('./utils/supabaseDebug');
      (globalThis as any).supabaseDebug = {
        ...debug,
        // Add quick helper for checking current user
        async checkUser() {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user?.id)
            .single();
          
          console.log('👤 Current User:', {
            authId: user?.id,
            email: user?.email,
            profile: profile,
            hasProfile: !!profile
          });
          return { user, profile };
        }
      };
      console.log('%c✅ Debug utils ready! Run: await supabaseDebug.runFullDiagnostics()', 'color: green; font-weight: bold; font-size: 12px;');
    } catch (err) {
      console.warn('Debug utils not available:', err);
    }
  };
  initDebug();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

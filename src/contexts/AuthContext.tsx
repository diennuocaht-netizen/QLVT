import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase-client';
import type { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUpUser: (email: string, password: string, displayName: string, role: Role) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref to track subscription so we can unsubscribe during logout
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Fetch/create user profile (non-blocking helper)
  const loadUserProfile = async (userId: string, userEmail: string) => {
    try {
      console.log('👤 [Auth] Fetching user profile...');
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!isMountedRef.current) return;

      if (!error && userData) {
        console.log('✅ [Auth] User profile loaded');
        setProfile(userData as UserProfile);
      } else if (error?.code === 'PGRST116') {
        // User not in database yet, create profile
        console.log('📝 [Auth] Creating user profile...');
        let role: Role = 'viewer';

        const newProfile: UserProfile = {
          id: userId,
          email: userEmail || '',
          display_name: '',
          role: role,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([newProfile]);

        if (insertError) {
          console.error('❌ [Auth] Error creating user profile:', insertError.message);
        } else {
          if (!isMountedRef.current) return;
          console.log('✅ [Auth] User profile created');
          setProfile(newProfile);
        }
      } else if (error) {
        console.error('❌ [Auth] Error loading profile:', error.message);
      }
    } catch (err) {
      console.error('❌ [Auth] Profile load error:', err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      try {
        console.log('🔐 [Auth] Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ [Auth] Session error:', error.message);
        }

        if (!isMountedRef.current) return;

        // SET LOADING FALSE IMMEDIATELY - don't wait for profile
        console.log('✅ [Auth] Session check complete, loading set to false');
        setLoading(false);

        if (session?.user) {
          console.log('🔐 [Auth] Session found for:', session.user.email);
          setUser(session.user);
          // Load profile in background (non-blocking)
          loadUserProfile(session.user.id, session.user.email || '');
        } else {
          console.log('🔐 [Auth] No session found');
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('❌ [Auth] Init error:', err);
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Start init
    initAuth();

    // Safety timeout
    timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('⏱️ [Auth] Safety timeout, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [Auth] Auth state changed:', event);
      
      if (!isMountedRef.current) return;

      if (session?.user) {
        setUser(session.user);
        // Load profile in background
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      console.log('🧹 [Auth] Cleanup');
      isMountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      console.log('🔐 [Auth] Starting logout...');
      
      // 1. Unsubscribe from auth listener first
      if (subscriptionRef.current) {
        console.log('🔌 [Auth] Unsubscribing from auth state changes');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      // 2. Clear local React state
      console.log('🧹 [Auth] Clearing local state');
      setUser(null);
      setProfile(null);

      // 3. Sign out from Supabase (this clears the session token)
      console.log('👤 [Auth] Calling signOut');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // If signOut fails, still proceed to redirect
        console.error('⚠️ [Auth] SignOut error:', error.message);
      } else {
        console.log('✅ [Auth] Signed out successfully');
      }

      // 4. Only clear app-specific localStorage (not Supabase session)
      console.log('🧹 [Auth] Clearing app storage');
      const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
      supabaseKeys.forEach(key => localStorage.removeItem(key));

      // 5. Redirect to login
      console.log('🔄 [Auth] Redirecting to login');
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ [Auth] Logout failed:', error);
      // Force redirect anyway
      setUser(null);
      setProfile(null);
      window.location.href = '/login';
    }
  };

  const signUpUser = async (email: string, password: string, displayName: string, role: Role) => {
    // Use signUp instead of admin.createUser (admin API is not available from client)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create user profile
    const newProfile: UserProfile = {
      id: authData.user.id,
      email,
      display_name: displayName,
      role,
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('users')
      .insert([newProfile]);

    if (profileError) throw profileError;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, signUpUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

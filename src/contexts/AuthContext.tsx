import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  validatePassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'bloom_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY);
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data && !error) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'global_password')
        .single();

      if (error || !settings) {
        console.error('Error fetching password:', error);
        return false;
      }

      if (settings.value === password) {
        // Create session
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          });

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          return false;
        }

        localStorage.setItem(SESSION_KEY, sessionToken);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  const validatePassword = async (password: string): Promise<boolean> => {
    try {
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'global_password')
        .single();

      if (error || !settings) {
        return false;
      }

      return settings.value === password;
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, validatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

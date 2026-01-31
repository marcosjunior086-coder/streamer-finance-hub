import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  validatePassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'bloom_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedToken = localStorage.getItem(SESSION_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Validate session via secure edge function
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'validate', sessionToken: storedToken }
      });

      if (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem(SESSION_KEY);
        setIsLoading(false);
        return;
      }

      if (data?.valid) {
        setIsAuthenticated(true);
        setSessionToken(storedToken);
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
      // Login via secure edge function (password validated server-side)
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'login', password }
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data?.success && data?.sessionToken) {
        localStorage.setItem(SESSION_KEY, data.sessionToken);
        setSessionToken(data.sessionToken);
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
    const storedToken = localStorage.getItem(SESSION_KEY);
    
    if (storedToken) {
      try {
        await supabase.functions.invoke('auth', {
          body: { action: 'logout', sessionToken: storedToken }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setIsAuthenticated(false);
  };

  const validatePassword = async (password: string): Promise<boolean> => {
    try {
      // Validate password via secure edge function
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'validate-password', password }
      });

      if (error) {
        console.error('Password validation error:', error);
        return false;
      }

      return data?.valid === true;
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      sessionToken,
      login, 
      logout, 
      validatePassword 
    }}>
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

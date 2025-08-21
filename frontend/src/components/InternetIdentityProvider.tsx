import React, { createContext, useContext, useEffect, useState } from 'react';
import { Principal } from '@dfinity/principal';
import icpService from '@/lib/icp-canister';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  principal: Principal | null;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an InternetIdentityProvider');
  }
  return context;
};

interface InternetIdentityProviderProps {
  children: React.ReactNode;
}

export const InternetIdentityProvider: React.FC<InternetIdentityProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      await icpService.initialize();

      if (icpService.isAuthenticated()) {
        const userPrincipal = icpService.getPrincipal();
        setPrincipal(userPrincipal);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to initialize Internet Identity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await icpService.login();

      if (success) {
        // Wait a moment for the login to complete
        setTimeout(async () => {
          const userPrincipal = icpService.getPrincipal();
          setPrincipal(userPrincipal);
          setIsAuthenticated(true);

          toast({
            title: "Login Successful",
            description: `Connected as ${userPrincipal?.toText().slice(0, 10)}...`,
          });
        }, 1000);
      }

      return success;
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: "Failed to connect with Internet Identity",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await icpService.logout();
      setPrincipal(null);
      setIsAuthenticated(false);

      toast({
        title: "Logged Out",
        description: "Successfully disconnected from Internet Identity",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    principal,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
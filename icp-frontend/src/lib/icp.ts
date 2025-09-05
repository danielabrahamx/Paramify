import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { ICP_CONFIG, isAdminPrincipal } from './config';

let authClient: AuthClient | null = null;

export async function initializeAuth(): Promise<void> {
  authClient = await AuthClient.create();
}

export async function loginWithInternetIdentity(): Promise<Principal | null> {
  if (!authClient) {
    await initializeAuth();
  }

  return new Promise((resolve) => {
    authClient!.login({
      identityProvider: ICP_CONFIG.IDENTITY_PROVIDER,
      onSuccess: () => {
        const identity = authClient!.getIdentity();
        const principal = identity.getPrincipal();
        resolve(principal);
      },
      onError: (error) => {
        console.error('Login failed:', error);
        resolve(null);
      },
    });
  });
}

export async function logoutFromInternetIdentity(): Promise<void> {
  if (authClient) {
    await authClient.logout();
  }
}

export function getCurrentPrincipal(): Principal | null {
  if (!authClient) return null;
  
  const identity = authClient.getIdentity();
  return identity.getPrincipal();
}

export function isAuthenticated(): boolean {
  if (!authClient) return false;
  return authClient.isAuthenticated();
}

export function formatPrincipal(principal: Principal): string {
  const text = principal.toText();
  return text.length > 20 ? `${text.slice(0, 10)}...${text.slice(-6)}` : text;
}

export function isAdmin(principal: Principal): boolean {
  return isAdminPrincipal(principal.toText());
}

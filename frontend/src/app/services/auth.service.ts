import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const SESSION_KEY = 'samde_agent_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  isAuthenticated(): boolean {
    return isPlatformBrowser(this.platformId) && localStorage.getItem(SESSION_KEY) === 'authenticated';
  }

  login(email: string, password: string): boolean {
    const normalizedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const isValid = isValidEmail && password.trim().length > 0;

    if (isValid && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(SESSION_KEY, 'authenticated');
    }

    return isValid;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(SESSION_KEY);
    }
  }
}

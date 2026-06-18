import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrpcClientService, User } from './orpc-client.js';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private orpc = inject(OrpcClientService);
  private platformId = inject(PLATFORM_ID);

  // Core Signals
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);

  // Computed Signals
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    this.init();
  }

  // Load and recover session on startup
  async init() {
    if (!this.isBrowser) return;

    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token.set(savedToken);
      try {
        const profile = await this.orpc.client.user.getProfile();
        this.currentUser.set(profile);
      } catch (err) {
        console.warn('Session restoration failed:', err);
        this.logout();
      }
    }
  }

  async login(credentials: any) {
    const res = await this.orpc.client.user.login(credentials);
    this.token.set(res.token);
    this.currentUser.set(res.user);

    if (this.isBrowser) {
      localStorage.setItem('token', res.token);
    }
  }

  async register(data: any) {
    const res = await this.orpc.client.user.register(data);
    this.token.set(res.token);
    this.currentUser.set(res.user);

    if (this.isBrowser) {
      localStorage.setItem('token', res.token);
    }
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);

    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }
}

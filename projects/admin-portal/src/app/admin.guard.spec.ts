import { TestBed } from '@angular/core/testing';
import { adminGuard } from './admin.guard';
import { Router } from '@angular/router';
import { AuthStateService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('adminGuard', () => {
  let mockAuthStateService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthStateService = {
      isAuthenticated: signal(false),
      isAdmin: signal(false)
    };

    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow navigation if user is authenticated and is admin', () => {
    mockAuthStateService.isAuthenticated.set(true);
    mockAuthStateService.isAdmin.set(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should block navigation and redirect to /login if user is not admin', () => {
    mockAuthStateService.isAuthenticated.set(true);
    mockAuthStateService.isAdmin.set(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should block navigation and redirect to /login if user is not authenticated', () => {
    mockAuthStateService.isAuthenticated.set(false);
    mockAuthStateService.isAdmin.set(true); // 即使偽造 isAdmin 為 true，但未登入依然阻擋

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});

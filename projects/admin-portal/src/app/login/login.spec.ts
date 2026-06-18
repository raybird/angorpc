import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { Router } from '@angular/router';
import { AuthStateService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('LoginComponent', () => {
  let mockAuthStateService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthStateService = {
      currentUser: signal<any>(null),
      login: vi.fn(),
      logout: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have invalid form on init', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component['loginForm'].invalid).toBe(true);
  });

  it('should successfully login admin user and redirect to dashboard', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component['loginForm'].patchValue({
      email: 'admin@example.com',
      password: 'password123'
    });

    mockAuthStateService.login.mockImplementation(async () => {
      mockAuthStateService.currentUser.set({ id: 'admin-1', role: 'ADMIN' });
    });

    await component.onSubmit();

    expect(mockAuthStateService.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password123'
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(component['errorMessage']()).toBe('');
  });

  it('should block non-admin users and logout immediately', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component['loginForm'].patchValue({
      email: 'user@example.com',
      password: 'password123'
    });

    mockAuthStateService.login.mockImplementation(async () => {
      mockAuthStateService.currentUser.set({ id: 'user-1', role: 'USER' });
    });

    await component.onSubmit();

    expect(mockAuthStateService.login).toHaveBeenCalled();
    expect(mockAuthStateService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toBe('權限不足，本系統僅供管理員登入！');
  });

  it('should display error banner if credentials are wrong', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component['loginForm'].patchValue({
      email: 'admin@example.com',
      password: 'wrongpassword'
    });

    mockAuthStateService.login.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    await component.onSubmit();

    expect(mockAuthStateService.login).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toBe('登入失敗，請確認您的帳號與密碼是否正確。');
  });
});

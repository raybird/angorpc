import { TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthStateService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('AdminLayoutComponent', () => {
  let mockAuthStateService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthStateService = {
      currentUser: signal({ id: 'admin-1', firstName: 'Raybird', lastName: '', role: 'ADMIN' }),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent, RouterTestingModule],
      providers: [
        { provide: AuthStateService, useValue: mockAuthStateService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar collapse state', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    const component = fixture.componentInstance;

    expect(component['isSidebarCollapsed']()).toBe(false);

    component.toggleSidebar();
    expect(component['isSidebarCollapsed']()).toBe(true);

    component.toggleSidebar();
    expect(component['isSidebarCollapsed']()).toBe(false);
  });

  it('should logout and redirect on onLogout', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onLogout();

    expect(mockAuthStateService.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});

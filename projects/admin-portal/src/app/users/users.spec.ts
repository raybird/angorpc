import { TestBed } from '@angular/core/testing';
import { UsersComponent } from './users';
import { OrpcClientService, AuthStateService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('UsersComponent', () => {
  let mockOrpcClientService: any;
  let mockAuthStateService: any;

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        user: {
          getUsers: vi.fn(),
          updateUserRole: vi.fn(),
          getUserStats: vi.fn()
        }
      }
    };

    mockAuthStateService = {
      currentUser: signal({ id: 'admin-1', firstName: 'Raybird', lastName: '', role: 'ADMIN' })
    };

    // 預設模擬 API 回傳
    mockOrpcClientService.client.user.getUsers.mockResolvedValue({
      users: [
        { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'USER', createdAt: '2026-06-19T00:00:00.000Z' },
        { id: 'admin-1', firstName: 'Raybird', lastName: '', email: 'raybird@example.com', role: 'ADMIN', createdAt: '2026-06-19T00:00:00.000Z' }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    });

    mockOrpcClientService.client.user.getUserStats.mockResolvedValue({
      totalOrders: 5,
      totalSpent: 15000
    });

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: OrpcClientService, useValue: mockOrpcClientService },
        { provide: AuthStateService, useValue: mockAuthStateService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load users on init', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(mockOrpcClientService.client.user.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      role: undefined
    });
    expect(component['users']().length).toBe(2);
    expect(component['users']()[0].id).toBe('user-1');
  });

  it('should trigger search query changes and reload', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    component.onSearch({ target: { value: 'John' } } as any);
    expect(component['searchQuery']()).toBe('John');
    expect(component['page']()).toBe(1);
    expect(mockOrpcClientService.client.user.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'John',
      role: undefined
    });
  });

  it('should trigger role filter changes and reload', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    component.onRoleFilterChange({ target: { value: 'ADMIN' } } as any);
    expect(component['selectedRole']()).toBe('ADMIN');
    expect(component['page']()).toBe(1);
    expect(mockOrpcClientService.client.user.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      role: 'ADMIN'
    });
  });

  it('should change page correctly', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    // 模擬有兩頁的情況
    mockOrpcClientService.client.user.getUsers.mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2
      }
    });

    component.ngOnInit();
    await fixture.whenStable();

    expect(component['totalPages']()).toBe(2);

    component.changePage(1);
    expect(component['page']()).toBe(2);
    expect(mockOrpcClientService.client.user.getUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: undefined,
      role: undefined
    });
  });

  it('should prevent self-demotion and restore previous role select value', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const myself = { id: 'admin-1', role: 'ADMIN' };
    const mockSelectElement = { value: 'USER' } as HTMLSelectElement;

    await component.changeUserRole(myself, { target: mockSelectElement } as any);

    expect(alertSpy).toHaveBeenCalledWith('為了系統安全，您無法變更自己的權限角色 (自我降權防護)。');
    expect(mockSelectElement.value).toBe('ADMIN');
    expect(mockOrpcClientService.client.user.updateUserRole).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should successfully update user role for other users', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    const otherUser = { id: 'user-1', role: 'USER' };
    const mockSelectElement = { value: 'ADMIN' } as HTMLSelectElement;

    mockOrpcClientService.client.user.updateUserRole.mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN'
    });

    component['users'].set([
      { id: 'user-1', firstName: 'John', lastName: 'Doe', role: 'USER' }
    ]);

    await component.changeUserRole(otherUser, { target: mockSelectElement } as any);

    expect(mockOrpcClientService.client.user.updateUserRole).toHaveBeenCalledWith({
      id: 'user-1',
      role: 'ADMIN'
    });
    expect(component['users']()[0].role).toBe('ADMIN');
  });

  it('should handle API error when updating user role and revert select value', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const otherUser = { id: 'user-1', role: 'USER' };
    const mockSelectElement = { value: 'ADMIN' } as HTMLSelectElement;

    mockOrpcClientService.client.user.updateUserRole.mockRejectedValue(new Error('API Error'));

    await component.changeUserRole(otherUser, { target: mockSelectElement } as any);

    expect(mockOrpcClientService.client.user.updateUserRole).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('修改用戶角色失敗，請稍後重試。');
    expect(mockSelectElement.value).toBe('USER');
    alertSpy.mockRestore();
  });

  it('should open details modal, fetch stats, and close modal', async () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;

    const user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'USER' };

    await component.viewUserDetail(user);

    expect(component['isModalOpen']()).toBe(true);
    expect(component['selectedUser']()).toBe(user);
    expect(mockOrpcClientService.client.user.getUserStats).toHaveBeenCalledWith({ id: 'user-1' });
    expect(component['selectedUserStats']()).toEqual({ totalOrders: 5, totalSpent: 15000 });

    component.closeModal();
    expect(component['isModalOpen']()).toBe(false);
    expect(component['selectedUser']()).toBeNull();
    expect(component['selectedUserStats']()).toBeNull();
  });
});

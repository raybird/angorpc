import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrpcClientService, AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent implements OnInit {
  private orpc = inject(OrpcClientService);
  protected readonly authState = inject(AuthStateService);

  // 訊號狀態管理
  protected readonly users = signal<any[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedRole = signal<string>('ALL'); // ALL, USER, ADMIN
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly isLoading = signal(true);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedUser = signal<any | null>(null);
  protected readonly selectedUserStats = signal<{ totalOrders: number; totalSpent: number } | null>(null);
  protected readonly isLoadingStats = signal(false);
  protected readonly isUpdatingRole = signal(false);
  protected readonly errorMessage = signal('');

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.isLoading.set(true);
    try {
      const roleFilter = this.selectedRole() === 'ALL' ? undefined : this.selectedRole();
      const res = await this.orpc.client.user.getUsers({
        page: this.page(),
        limit: 10,
        search: this.searchQuery() || undefined,
        role: roleFilter as any
      });
      this.users.set(res.users);
      this.totalPages.set(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadUsers();
  }

  onRoleFilterChange(event: Event) {
    const role = (event.target as HTMLSelectElement).value;
    this.selectedRole.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  changePage(offset: number) {
    const targetPage = this.page() + offset;
    if (targetPage >= 1 && targetPage <= this.totalPages()) {
      this.page.set(targetPage);
      this.loadUsers();
    }
  }

  async changeUserRole(user: any, event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const newRole = selectEl.value;
    const currentUser = this.authState.currentUser();

    if (currentUser && user.id === currentUser.id) {
      alert('為了系統安全，您無法變更自己的權限角色 (自我降權防護)。');
      // 將 select 值重設回原本的角色
      selectEl.value = user.role;
      return;
    }

    this.isUpdatingRole.set(true);
    try {
      const updated = await this.orpc.client.user.updateUserRole({
        id: user.id,
        role: newRole as any
      });

      // 即時更新本地列表的用戶角色
      this.users.update(list =>
        list.map(u => u.id === updated.id ? { ...u, role: updated.role } : u)
      );
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      alert('修改用戶角色失敗，請稍後重試。');
      selectEl.value = user.role;
    } finally {
      this.isUpdatingRole.set(false);
    }
  }

  async viewUserDetail(user: any) {
    this.selectedUser.set(user);
    this.isModalOpen.set(true);
    this.isLoadingStats.set(true);
    this.selectedUserStats.set(null);
    this.errorMessage.set('');

    try {
      const stats = await this.orpc.client.user.getUserStats({ id: user.id });
      this.selectedUserStats.set(stats);
    } catch (err: any) {
      console.error('Failed to load user stats:', err);
      this.errorMessage.set(err.message || '載入消費統計數據時發生錯誤');
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedUser.set(null);
    this.selectedUserStats.set(null);
  }
}

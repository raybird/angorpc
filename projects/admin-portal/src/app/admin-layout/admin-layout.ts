import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  private router = inject(Router);
  protected readonly authState = inject(AuthStateService);

  protected readonly isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(val => !val);
  }

  onLogout() {
    this.authState.logout();
    this.router.navigate(['/login']);
  }
}

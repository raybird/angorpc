import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authState = inject(AuthStateService);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const email = this.loginForm.value.email!;
      const password = this.loginForm.value.password!;

      await this.authState.login({ email, password });

      const user = this.authState.currentUser();
      if (user && user.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        // 非管理員，立即登出並清除凭證
        this.authState.logout();
        this.errorMessage.set('權限不足，本系統僅供管理員登入！');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.errorMessage.set('登入失敗，請確認您的帳號與密碼是否正確。');
    } finally {
      this.isLoading.set(false);
    }
  }
}

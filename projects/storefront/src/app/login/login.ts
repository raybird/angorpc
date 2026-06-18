import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authState.login(this.loginForm.value);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error(err);
      this.errorMessage.set('登入失敗，請檢查您的信箱與密碼是否正確。');
    } finally {
      this.isLoading.set(false);
    }
  }
}

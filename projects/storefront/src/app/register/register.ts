import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  protected readonly registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.pattern(/^\+?[0-9]{8,15}$/)]]
  });

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authState.register(this.registerForm.value);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        this.errorMessage.set('該電子郵件信箱已被註冊，請嘗試使用其他信箱或直接登入。');
      } else {
        this.errorMessage.set('註冊失敗，請確認所有欄位格式是否填寫正確。');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}

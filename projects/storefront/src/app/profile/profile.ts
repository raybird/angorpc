import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService, OrpcClientService, UserAddress } from 'shared-lib';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected readonly authState = inject(AuthStateService);
  private orpc = inject(OrpcClientService);

  // 狀態 Signals
  protected readonly addresses = signal<UserAddress[]>([]);
  protected readonly isProfileLoading = signal(false);
  protected readonly isAddressesLoading = signal(false);
  protected readonly isSavingProfile = signal(false);
  protected readonly isSavingAddress = signal(false);
  
  // 訊息 Signals
  protected readonly profileSuccessMsg = signal('');
  protected readonly profileErrorMsg = signal('');
  
  // 地址 Modal 控制
  protected readonly showAddressModal = signal(false);
  protected readonly editingAddress = signal<UserAddress | null>(null);
  protected readonly addressErrorMsg = signal('');

  // 個人資料表單
  protected readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    phone: ['', [Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    password: ['', [Validators.minLength(8)]],
    confirmPassword: ['']
  }, {
    validators: (control) => {
      const pass = control.get('password')?.value;
      const confirm = control.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  // 地址管理表單
  protected readonly addressForm = this.fb.group({
    recipientName: ['', [Validators.required, Validators.minLength(1)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    postalCode: [''],
    isDefault: [false]
  });

  async ngOnInit() {
    if (!this.authState.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await Promise.all([
      this.loadUserProfile(),
      this.loadAddresses()
    ]);
  }

  async loadUserProfile() {
    this.isProfileLoading.set(true);
    try {
      const profile = await this.orpc.client.user.getProfile();
      this.profileForm.patchValue({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || ''
      });
    } catch (err) {
      console.error(err);
      this.profileErrorMsg.set('無法取得個人基本資料！');
    } finally {
      this.isProfileLoading.set(false);
    }
  }

  async loadAddresses() {
    this.isAddressesLoading.set(true);
    try {
      const list = await this.orpc.client.user.getAddresses();
      this.addresses.set(list);
    } catch (err) {
      console.error(err);
    } finally {
      this.isAddressesLoading.set(false);
    }
  }

  async onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.profileSuccessMsg.set('');
    this.profileErrorMsg.set('');

    const formVal = this.profileForm.value;
    const updatePayload: any = {
      firstName: formVal.firstName || undefined,
      lastName: formVal.lastName || undefined,
      phone: formVal.phone || null
    };

    if (formVal.password) {
      updatePayload.password = formVal.password;
    }

    try {
      const updated = await this.orpc.client.user.updateProfile(updatePayload);
      
      // 更新本機 AuthState 中的使用者資料
      if (this.authState.currentUser()) {
        this.authState.currentUser.set({
          ...this.authState.currentUser()!,
          firstName: updated.firstName || '',
          lastName: updated.lastName || '',
        });
      }

      this.profileForm.get('password')?.reset();
      this.profileForm.get('confirmPassword')?.reset();
      this.profileSuccessMsg.set('個人資料已成功更新！');
    } catch (err: any) {
      console.error(err);
      this.profileErrorMsg.set('更新個人資料失敗，請稍後重試。');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  openAddAddressModal() {
    this.editingAddress.set(null);
    this.addressForm.reset({
      recipientName: '',
      phone: '',
      address: '',
      postalCode: '',
      isDefault: false
    });
    this.addressErrorMsg.set('');
    this.showAddressModal.set(true);
  }

  openEditAddressModal(addr: UserAddress) {
    this.editingAddress.set(addr);
    this.addressForm.setValue({
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault
    });
    this.addressErrorMsg.set('');
    this.showAddressModal.set(true);
  }

  closeAddressModal() {
    this.showAddressModal.set(false);
    this.editingAddress.set(null);
  }

  async onSaveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSavingAddress.set(true);
    this.addressErrorMsg.set('');

    const val = this.addressForm.value;
    const payload = {
      recipientName: val.recipientName!,
      phone: val.phone!,
      address: val.address!,
      postalCode: val.postalCode || null,
      isDefault: !!val.isDefault
    };

    try {
      const activeEdit = this.editingAddress();
      if (activeEdit) {
        await this.orpc.client.user.updateAddress({
          id: activeEdit.id,
          ...payload
        });
      } else {
        await this.orpc.client.user.createAddress(payload);
      }

      this.closeAddressModal();
      await this.loadAddresses();
    } catch (err: any) {
      console.error(err);
      this.addressErrorMsg.set('儲存地址失敗，請檢查資料格式後重試。');
    } finally {
      this.isSavingAddress.set(false);
    }
  }

  async onDeleteAddress(id: string) {
    if (!confirm('您確定要刪除這筆常用收件地址嗎？')) {
      return;
    }

    try {
      await this.orpc.client.user.deleteAddress({ id });
      await this.loadAddresses();
    } catch (err) {
      console.error(err);
      alert('刪除地址失敗，請稍後重試。');
    }
  }

  async onSetDefaultAddress(id: string) {
    try {
      await this.orpc.client.user.setDefaultAddress({ id });
      await this.loadAddresses();
    } catch (err) {
      console.error(err);
      alert('設定預設地址失敗，請稍後重試。');
    }
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrpcClientService } from 'shared-lib';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orpc = inject(OrpcClientService);

  // 訊號狀態管理
  protected readonly products = signal<any[]>([]);
  protected readonly categories = signal<any[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly isLoading = signal(true);
  protected readonly isModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly editingProduct = signal<any | null>(null);
  protected readonly errorMessage = signal('');

  protected readonly productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    isActive: [true],
    description: ['']
  });

  ngOnInit() {
    this.fetchCategories();
    this.loadProducts();

    // 貼心的自動 Slug 生成
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.editingProduct() && name) {
        const slug = name.toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        this.productForm.get('slug')?.patchValue(slug, { emitEvent: false });
      }
    });
  }

  async fetchCategories() {
    try {
      const res = await this.orpc.client.product.getCategories();
      this.categories.set(res);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  async loadProducts() {
    this.isLoading.set(true);
    try {
      const res = await this.orpc.client.product.getProducts({
        page: this.page(),
        limit: 10,
        categoryId: this.selectedCategory() || undefined,
        search: this.searchQuery() || undefined,
        includeInactive: true
      });
      this.products.set(res.products);
      this.totalPages.set(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadProducts();
  }

  onCategoryChange(event: Event) {
    const catId = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(catId);
    this.page.set(1);
    this.loadProducts();
  }

  changePage(offset: number) {
    const targetPage = this.page() + offset;
    if (targetPage >= 1 && targetPage <= this.totalPages()) {
      this.page.set(targetPage);
      this.loadProducts();
    }
  }

  async toggleActive(product: any) {
    try {
      const updated = await this.orpc.client.product.updateProduct({
        id: product.id,
        isActive: !product.isActive
      });

      // 直接更新本地狀態，提升互動流暢感
      this.products.update(list => 
        list.map(p => p.id === product.id ? { ...p, isActive: updated.isActive } : p)
      );
    } catch (err: any) {
      console.error('Failed to toggle active state:', err);
      alert('切換商品上架狀態失敗，請稍後重試。');
    }
  }

  openCreateModal() {
    this.editingProduct.set(null);
    this.errorMessage.set('');
    this.productForm.reset({
      name: '',
      slug: '',
      price: 0,
      stock: 0,
      categoryId: this.categories().length > 0 ? this.categories()[0].id : '',
      isActive: true,
      description: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: any) {
    this.editingProduct.set(product);
    this.errorMessage.set('');
    this.productForm.setValue({
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      isActive: product.isActive,
      description: product.description || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingProduct.set(null);
  }

  async onSaveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.productForm.value;
      const payload: any = {
        name: formValue.name!,
        slug: formValue.slug!,
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        categoryId: formValue.categoryId!,
        isActive: formValue.isActive!,
        description: formValue.description || undefined
      };

      if (this.editingProduct()) {
        await this.orpc.client.product.updateProduct({
          id: this.editingProduct().id,
          ...payload
        });
      } else {
        await this.orpc.client.product.createProduct(payload);
      }

      this.closeModal();
      this.loadProducts();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      this.errorMessage.set(err.message || '儲存商品時發生未知錯誤');
    } finally {
      this.isSaving.set(false);
    }
  }
}

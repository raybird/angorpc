import { TestBed } from '@angular/core/testing';
import { ProductsComponent } from './products';
import { OrpcClientService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('ProductsComponent', () => {
  let mockOrpcClientService: any;

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        product: {
          getProducts: vi.fn(),
          getCategories: vi.fn(),
          createProduct: vi.fn(),
          updateProduct: vi.fn()
        }
      }
    };

    // 預設模擬 API 回傳
    mockOrpcClientService.client.product.getCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Electronics', slug: 'electronics' }
    ]);

    mockOrpcClientService.client.product.getProducts.mockResolvedValue({
      products: [
        {
          id: 'prod-1',
          name: 'Mechanical Keyboard',
          slug: 'mechanical-keyboard',
          price: 1000,
          stock: 10,
          categoryId: 'cat-1',
          isActive: true
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    });

    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        { provide: OrpcClientService, useValue: mockOrpcClientService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load categories and products on init', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(mockOrpcClientService.client.product.getCategories).toHaveBeenCalled();
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      categoryId: undefined,
      search: undefined,
      includeInactive: true
    });
    expect(component['products']().length).toBe(1);
    expect(component['categories']().length).toBe(1);
  });

  it('should trigger search and category filtering', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    component.onSearch({ target: { value: 'Keyboard' } } as any);
    expect(component['searchQuery']()).toBe('Keyboard');
    expect(component['page']()).toBe(1);

    component.onCategoryChange({ target: { value: 'cat-1' } } as any);
    expect(component['selectedCategory']()).toBe('cat-1');
  });

  it('should toggle active status of a product', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    mockOrpcClientService.client.product.updateProduct.mockResolvedValue({
      id: 'prod-1',
      isActive: false
    });

    component['products'].set([
      { id: 'prod-1', name: 'Keyboard', isActive: true }
    ]);

    await component.toggleActive({ id: 'prod-1', isActive: true });

    expect(mockOrpcClientService.client.product.updateProduct).toHaveBeenCalledWith({
      id: 'prod-1',
      isActive: false
    });
    expect(component['products']()[0].isActive).toBe(false);
  });

  it('should open modal for creation and reset form', () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    component['categories'].set([{ id: 'cat-1', name: 'Electronics' }]);

    component.openCreateModal();

    expect(component['editingProduct']()).toBeNull();
    expect(component['isModalOpen']()).toBe(true);
    expect(component['productForm'].value.name).toBe('');
    expect(component['productForm'].value.categoryId).toBe('cat-1');
  });

  it('should open modal for editing and patch form values', () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    const mockProduct = {
      id: 'prod-1',
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      price: 1200,
      stock: 5,
      categoryId: 'cat-1',
      isActive: true,
      description: 'Cool keyboard'
    };

    component.openEditModal(mockProduct);

    expect(component['editingProduct']()).toEqual(mockProduct);
    expect(component['isModalOpen']()).toBe(true);
    expect(component['productForm'].value.name).toBe('Mechanical Keyboard');
    expect(component['productForm'].value.price).toBe(1200);
    expect(component['productForm'].value.description).toBe('Cool keyboard');
  });

  it('should call createProduct when submitting a new product', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    component.openCreateModal();
    component['productForm'].patchValue({
      name: 'Gaming Mouse',
      slug: 'gaming-mouse',
      price: 500,
      stock: 20,
      categoryId: 'cat-1',
      isActive: true,
      description: 'Fast mouse'
    });

    mockOrpcClientService.client.product.createProduct.mockResolvedValue({});

    await component.onSaveProduct();

    expect(mockOrpcClientService.client.product.createProduct).toHaveBeenCalledWith({
      name: 'Gaming Mouse',
      slug: 'gaming-mouse',
      price: 500,
      stock: 20,
      categoryId: 'cat-1',
      isActive: true,
      description: 'Fast mouse'
    });
    expect(component['isModalOpen']()).toBe(false);
  });

  it('should call updateProduct when submitting an edited product', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    const component = fixture.componentInstance;

    const mockProduct = {
      id: 'prod-1',
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      price: 1200,
      stock: 5,
      categoryId: 'cat-1',
      isActive: true,
      description: 'Cool keyboard'
    };

    component.openEditModal(mockProduct);
    // 修改售價
    component['productForm'].patchValue({
      price: 1500
    });

    mockOrpcClientService.client.product.updateProduct.mockResolvedValue({});

    await component.onSaveProduct();

    expect(mockOrpcClientService.client.product.updateProduct).toHaveBeenCalledWith({
      id: 'prod-1',
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      price: 1500,
      stock: 5,
      categoryId: 'cat-1',
      isActive: true,
      description: 'Cool keyboard'
    });
    expect(component['isModalOpen']()).toBe(false);
  });
});

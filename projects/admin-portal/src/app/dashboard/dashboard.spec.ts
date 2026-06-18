import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should start with loading state and set to false after delay', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component['isLoading']()).toBe(true);

    component.ngOnInit();
    vi.advanceTimersByTime(600);

    expect(component['isLoading']()).toBe(false);
    vi.useRealTimers();
  });

  it('should display mocked营运数据', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component['totalSales']()).toBe(158430);
    expect(component['ordersCount']()).toBe(642);
    expect(component['productsCount']()).toBe(54);
    expect(component['customersCount']()).toBe(218);
  });
});

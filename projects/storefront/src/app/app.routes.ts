import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout').then(m => m.CheckoutComponent),
  },
  {
    path: 'orders',
    loadComponent: () => import('./orders/orders').then(m => m.OrdersComponent),
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./product-detail/product-detail').then(m => m.ProductDetailComponent),
  },
];



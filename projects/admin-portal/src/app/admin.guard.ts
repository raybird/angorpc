import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from 'shared-lib';

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated() && authState.isAdmin()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

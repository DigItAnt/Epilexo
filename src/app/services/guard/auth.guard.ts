import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {
  
  constructor(
    protected readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }
  
  async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin  + state.url, /* aggiungere '/epilexo/' in produzione */
      });
    }

    const requiredRoles = route.data.roles;
    if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
      return true;
    } else {
      if (!this.roles || this.roles.length === 0) {
        return false;
      }
    }
    if (!requiredRoles.every((role) => this.roles.includes(role))) {
      this.router.navigate(['/']);
    }
    return requiredRoles.every((role) => this.roles.includes(role));
  }
}
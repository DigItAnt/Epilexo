import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthService {

  private baseUrl = environment.keycloak.issuer;
  private realmId = environment.keycloak.realm;
  private clientId = environment.keycloak.clientId;
  


  constructor(private keycloakService: KeycloakService, private http: HttpClient) {}

  public getLoggedUser(): KeycloakTokenParsed | undefined {
    try {
      const userDetails: KeycloakTokenParsed | undefined = this.keycloakService.getKeycloakInstance()
        .idTokenParsed;
      return userDetails;
    } catch (e) {
      console.error("Exception", e);
      return undefined;
    }
  }

  public isLoggedIn() : Promise<boolean> {
    return this.keycloakService.isLoggedIn();
  }

  public loadUserProfile() : Promise<KeycloakProfile> {
    return this.keycloakService.loadUserProfile();
  }

  public login() : void {
    this.keycloakService.login();
  }

  public logout() : void {
  
    this.keycloakService.logout();
  }

  public redirectToProfile(): void {
    this.keycloakService.getKeycloakInstance().accountManagement();
  }

  public getUsername(): any {
    if(this.getLoggedUser() != undefined){
      return this.getLoggedUser()['preferred_username'];
    }else{
      window.location.reload();
      return null;
    }
    
  }

  public getCurrentUserRole(): string[] {
    return this.keycloakService.getKeycloakInstance().realmAccess.roles;
  }

  public searchUser(search?): any {
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/users';
    if(search != undefined){
      string += '?search='+search;
    }
    return this.http.get(string);
  }

  public getUserByUsername(username?): any {
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/users';
    if(username != undefined){
      string += '?username='+username;
    }
    return this.http.get(string);
  }


  public getUserRoles(userId: string, clientId: string): any {
    //let string = this.baseUrl + 'admin/realms/' + this.realmId + '/users/' + id + '/role-mappings/realm';
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/users/'+ userId +'/role-mappings/clients/' + clientId;
    return this.http.get(string)
  }

  public getAllClientsRoles(id: string): any {
    let string = this.baseUrl + 'admin/realms/' + this.realmId  + '/clients/' + id + '/roles/';
    return this.http.get(string)
  }


  public getClientsInfo(): any {
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/clients/';
    return this.http.get(string)
  }

  public getUserInfo(id): any {
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/users/' + id;
    return this.http.get(string);
  }

  public getUsersByRole(id, role_name){
    
    let string = this.baseUrl + 'admin/realms/' + this.realmId + '/clients/' + id + '/roles/' + role_name +'/users';
    return this.http.get(string);
  }

  public createUser(parameters) {
    let string = this.baseUrl +'admin/realms/' + this.realmId + '/users/';
    return this.http.post(string, parameters)
  }

  public deleteUser(idUser : string) {
    let string = this.baseUrl +'admin/realms/' + this.realmId + '/users/' + idUser;
    return this.http.delete(string)
  }

  public updateUser(idUser : string, body) {
    let string = this.baseUrl +'admin/realms/' + this.realmId + '/users/' + idUser;
    return this.http.put(string, body)
  }

  public assignRolesToUser(userId, clientId, parameters) {
    let string = this.baseUrl +'admin/realms/' + this.realmId + '/users/' + userId + '/role-mappings/clients/' + clientId ;
    return this.http.post(string, parameters)
  }

  public deleteRolesToUser(userId, clientId, parameters) {
    let options = { headers: new HttpHeaders().set('Content-Type', 'application/json'), body: parameters };
    let string = this.baseUrl +'admin/realms/' + this.realmId + '/users/' + userId + '/role-mappings/clients/' + clientId ;
    return this.http.delete(string, options)
  }
}
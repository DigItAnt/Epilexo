import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
 
export function initializer(keycloak: KeycloakService): () => Promise<any> {
    return (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
          try {
            await keycloak.init({
                config: {
                    url: environment.keycloak.issuer,
                    realm: environment.keycloak.realm,
                    clientId: environment.keycloak.clientId
                },
              loadUserProfileAtStartUp: false,
              enableBearerInterceptor: true,
              bearerPrefix: 'Bearer',
              initOptions: {
                onLoad: 'check-sso',
                checkLoginIframe: true
              },
              bearerExcludedUrls: [
                'api.zotero.org'
              ]
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
}
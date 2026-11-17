import { LogLevel, PublicClientApplication } from '@azure/msal-browser'
import { AZURE_CONFIG } from './config'

let instance: PublicClientApplication | null = null
let initialization: Promise<void> | null = null

export async function getMsalInstance(): Promise<PublicClientApplication | null> {
  if (!AZURE_CONFIG.configured) return null

  if (!instance) {
    instance = new PublicClientApplication({
      auth: {
        clientId: AZURE_CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${AZURE_CONFIG.tenantId}`,
        redirectUri: AZURE_CONFIG.redirectUri,
        postLogoutRedirectUri: AZURE_CONFIG.redirectUri,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
      system: {
        loggerOptions: {
          piiLoggingEnabled: false,
          logLevel: LogLevel.Error,
          loggerCallback: () => undefined,
        },
      },
    })
    initialization = instance.initialize()
  }

  await initialization
  return instance
}

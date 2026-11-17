const tenantId = (import.meta.env.VITE_AZURE_TENANT_ID || '').trim()
const clientId = (import.meta.env.VITE_AZURE_CLIENT_ID || '').trim()
const redirectUri =
  (import.meta.env.VITE_AZURE_REDIRECT_URI || '').trim() || window.location.origin

export const AZURE_SCOPES = ['https://management.azure.com/user_impersonation']

export const AZURE_CONFIG = {
  tenantId,
  clientId,
  redirectUri,
  configured: Boolean(tenantId && clientId),
}

export const MISSING_AZURE_CONFIG = [
  !tenantId ? 'VITE_AZURE_TENANT_ID' : null,
  !clientId ? 'VITE_AZURE_CLIENT_ID' : null,
].filter((value): value is string => Boolean(value))

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser'
import {
  AzureSettings,
  AzureSubscription,
  getAzureSettings,
  getAzureSubscriptions,
  saveAzureSettings,
} from '../services/api'
import { AZURE_CONFIG, AZURE_SCOPES, MISSING_AZURE_CONFIG } from '../azure/config'
import { useAuth } from './AuthContext'
import { getMsalInstance } from '../azure/msal'

interface AzureContextType {
  configured: boolean
  missingConfig: string[]
  connected: boolean
  account: AccountInfo | null
  subscriptions: AzureSubscription[]
  selectedSubscriptionId: string
  selectedSubscription: AzureSubscription | null
  loadingSubscriptions: boolean
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  selectSubscription: (subscriptionId: string) => void
  getAccessToken: () => Promise<string>
}

const AzureContext = createContext<AzureContextType | undefined>(undefined)

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unable to connect to Azure'
}

export function AzureProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiresOn, setExpiresOn] = useState<Date | null>(null)
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([])
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')
  const [settings, setSettings] = useState<AzureSettings | null>(null)
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const restored = useRef(false)

  const applyToken = (result: AuthenticationResult) => {
    setAccessToken(result.accessToken)
    setExpiresOn(result.expiresOn)
    if (result.account) setAccount(result.account)
  }

  const loadAzureData = useCallback(async (token: string) => {
    setLoadingSubscriptions(true)
    try {
      const subscriptionsResponse = await getAzureSubscriptions(token)
      setSubscriptions(subscriptionsResponse.subscriptions)

      let savedSettings: AzureSettings | null = null
      try {
        const settingsResponse = await getAzureSettings()
        savedSettings = settingsResponse.settings
        setSettings(savedSettings)
      } catch (settingsError) {
        console.error('Failed to load Azure settings:', settingsError)
      }

      const savedSubscription = subscriptionsResponse.subscriptions.find(
        (subscription) => subscription.id === savedSettings?.subscription_id
      )
      setSelectedSubscriptionId(
        savedSubscription?.id || subscriptionsResponse.subscriptions[0]?.id || ''
      )
    } finally {
      setLoadingSubscriptions(false)
    }
  }, [])

  useEffect(() => {
    if (user) return

    setAccount(null)
    setAccessToken(null)
    setExpiresOn(null)
    setSubscriptions([])
    setSelectedSubscriptionId('')
    setSettings(null)
    setError(null)
    getMsalInstance()
      .then((instance) => instance?.clearCache())
      .catch((cacheError) => console.debug('Failed to clear MSAL cache:', cacheError))
  }, [user])

  useEffect(() => {
    if (!AZURE_CONFIG.configured || restored.current) return
    restored.current = true

    const restoreSession = async () => {
      try {
        const instance = await getMsalInstance()
        if (!instance) return
        const accounts = instance.getAllAccounts()
        if (accounts.length === 0) return

        setAccount(accounts[0])
        const result = await instance.acquireTokenSilent({
          scopes: AZURE_SCOPES,
          account: accounts[0],
        })
        applyToken(result)
        await loadAzureData(result.accessToken)
      } catch (restoreError) {
        console.debug('Azure session could not be restored silently:', restoreError)
      }
    }

    restoreSession()
  }, [loadAzureData])

  const getAccessToken = async (): Promise<string> => {
    if (accessToken && expiresOn && expiresOn.getTime() > Date.now() + 60_000) {
      return accessToken
    }

    const instance = await getMsalInstance()
    if (!instance || !account) {
      throw new Error('Azure is not connected')
    }

    try {
      const result = await instance.acquireTokenSilent({
        scopes: AZURE_SCOPES,
        account,
      })
      applyToken(result)
      return result.accessToken
    } catch {
      const result = await instance.acquireTokenPopup({
        scopes: AZURE_SCOPES,
        account,
      })
      applyToken(result)
      return result.accessToken
    }
  }

  const connect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const instance = await getMsalInstance()
      if (!instance) {
        setError('Azure OAuth is not configured')
        return
      }

      const loginResult = await instance.loginPopup({ scopes: AZURE_SCOPES })
      setAccount(loginResult.account)

      let tokenResult: AuthenticationResult = loginResult
      if (!loginResult.accessToken) {
        tokenResult = await instance.acquireTokenSilent({
          scopes: AZURE_SCOPES,
          account: loginResult.account,
        })
      }
      applyToken(tokenResult)
      await loadAzureData(tokenResult.accessToken)
    } catch (connectError) {
      console.error('Failed to connect to Azure:', connectError)
      setError(describeError(connectError))
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      const instance = await getMsalInstance()
      await instance?.clearCache()
    } catch (disconnectError) {
      console.debug('Failed to clear MSAL cache:', disconnectError)
    }
    setAccount(null)
    setAccessToken(null)
    setExpiresOn(null)
    setSubscriptions([])
    setSelectedSubscriptionId('')
    setSettings(null)
    setError(null)
  }

  const selectSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    const subscription = subscriptions.find((item) => item.id === subscriptionId)
    if (!accessToken || !subscription) return

    saveAzureSettings(accessToken, {
      subscription_id: subscription.id,
      subscription_name: subscription.name,
      resource_group_prefix: settings?.resource_group_prefix || 'rg-az104-lab',
    })
      .then((response) => setSettings(response.settings))
      .catch((saveError) => {
        console.error('Failed to save Azure settings:', saveError)
        setError(describeError(saveError))
      })
  }

  const selectedSubscription =
    subscriptions.find((subscription) => subscription.id === selectedSubscriptionId) || null

  return (
    <AzureContext.Provider
      value={{
        configured: AZURE_CONFIG.configured,
        missingConfig: MISSING_AZURE_CONFIG,
        connected: Boolean(account && accessToken),
        account,
        subscriptions,
        selectedSubscriptionId,
        selectedSubscription,
        loadingSubscriptions,
        connecting,
        error,
        connect,
        disconnect,
        selectSubscription,
        getAccessToken,
      }}
    >
      {children}
    </AzureContext.Provider>
  )
}

export function useAzure() {
  const context = useContext(AzureContext)
  if (!context) {
    throw new Error('useAzure must be used within an AzureProvider')
  }
  return context
}

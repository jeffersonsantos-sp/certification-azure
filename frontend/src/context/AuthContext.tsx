import { createContext, useContext, useState, ReactNode } from 'react'
import { User, login as apiLogin, logout as clearAuth, register as apiRegister } from '../services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (data: { email: string; password: string }) => Promise<User>
  signUp: (data: { email: string; password: string; full_name?: string }) => Promise<User>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function readStoredUser(): User | null {
  const stored = localStorage.getItem('user')
  if (!stored) return null

  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  const signIn = async (data: { email: string; password: string }) => {
    const response = await apiLogin(data)
    setUser(response.user)
    return response.user
  }

  const signUp = async (data: { email: string; password: string; full_name?: string }) => {
    const response = await apiRegister(data)
    setUser(response.user)
    return response.user
  }

  const signOut = () => {
    clearAuth()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && localStorage.getItem('token')),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

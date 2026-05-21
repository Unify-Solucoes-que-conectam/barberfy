import { createContext, useEffect, useState, type ReactNode } from 'react'

import { toast } from 'sonner'

import axios from '@/lib/axios'
import { isClientContext } from '@/lib/detectAppMode'
import type { Schema } from '@/pages/auth/schemas'
import { type ApiResponse } from '@/types/api-response'
import { type BarberShop, type User } from '@/types/consults'

interface AuthState {
  user: User | null
  token: string | null
  userRole: string | null
  barbershop: BarberShop | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  setLoading: (loading: boolean) => void
  refreshAuth: () => Promise<void>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; userRole?: string }>
  signUp: (signUpData: Schema) => Promise<{ success: boolean; message: string; userRole?: string }>
  signOut: () => Promise<void>
  requestOtp: (phone: string, name: string) => Promise<{ success: boolean; message: string }>
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; message: string }>
  autoLogin: () => Promise<{ success: boolean; message: string }>
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    userRole: localStorage.getItem('user_role'),
    barbershop: null,
    loading: true,
  })

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }))
  }

  const loadAuthData = async () => {
    const token = localStorage.getItem('auth_token')

    // No modo client, tentar auto-login via device_token se não tiver auth_token
    if (!token && isClientContext()) {
      const deviceToken = localStorage.getItem('device_token')
      const phone = localStorage.getItem('client_phone')

      if (deviceToken && phone) {
        try {
          const response = await axios.post<
            ApiResponse<{ user: User; barbershop: BarberShop; access_token: string }>
          >(`${API_URL}/auth/client/auto-login`, {
            device_token: deviceToken,
            phone,
          })

          if (response.data.success) {
            const { data } = response.data
            localStorage.setItem('auth_token', data.access_token)
            localStorage.setItem('user_role', data.user.role)

            setState({
              user: data.user,
              token: data.access_token,
              userRole: data.user.role,
              barbershop: data.barbershop,
              loading: false,
            })
            return
          }
        } catch {
          // Auto-login falhou, limpar device_token
          localStorage.removeItem('device_token')
          localStorage.removeItem('client_phone')
        }
      }

      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    if (!token) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      // Busca dados do usuário autenticado
      const userResponse = await axios.get<ApiResponse<User & { barbershop: BarberShop }>>(
        `${API_URL}/auth/me`
      )

      if (!userResponse.data.success) {
        throw new Error('Erro ao carregar usuário')
      }

      setState({
        user: userResponse.data.data,
        token,
        userRole: userResponse.data.data.role,
        barbershop: userResponse.data.data.barbershop,
        loading: false,
      })
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error)
      // Limpa dados inválidos
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_role')
      sessionStorage.removeItem('active_barbershop_id')
      setState({
        user: null,
        token: null,
        userRole: null,
        barbershop: null,
        loading: false,
      })
    }
  }

  // Carrega os dados do usuário e barbershop ao inicializar se tiver token
  useEffect(() => {
    loadAuthData()
  }, [])

  const logoutCleanup = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('device_token')
    localStorage.removeItem('client_phone')
    sessionStorage.removeItem('active_barbershop_id')
    setState({
      user: null,
      token: null,
      userRole: null,
      barbershop: null,
      loading: false,
    })
  }

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; userRole?: string }> => {
    try {
      const response = await axios.post<
        ApiResponse<{ user: User; barbershop: BarberShop; access_token: string }>
      >(`${API_URL}/auth/login`, {
        email,
        password,
        appMode: isClientContext() ? 'client' : 'admin',
      })

      const { data, message } = response.data

      if (!response.data.success) throw new Error(message || 'Erro ao fazer login')

      // Salvando no localStorage para persistência
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_role', data.user.role)
      sessionStorage.setItem('active_barbershop_id', data.barbershop.id)

      setState({
        user: data.user,
        token: data.access_token,
        userRole: data.user.role,
        barbershop: data.barbershop,
        loading: false,
      })

      return { success: true, message: 'Login realizado com sucesso!', userRole: data.user.role }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      return { success: false, message: error.message }
    }
  }

  const signOut = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${API_URL}/auth/logout`)

      if (response.data.success) {
        window.location.href = 'auth/login'
      } else {
        toast.error(
          response.data.message ||
            'Erro ao deslogar. Entre em contato com o suporte caso o erro persista.'
        )
      }
    } catch (e) {
      console.error('Erro ao deslogar no servidor', e)
    } finally {
      logoutCleanup()
    }
  }

  const signUp = async (
    signUpData: Schema
  ): Promise<{ success: boolean; message: string; userRole?: string }> => {
    try {
      if (!isClientContext()) {
        const response = await axios.post<ApiResponse>(`${API_URL}/register-barbershop`, {
          company_name: signUpData.company_name,
          owner_name: signUpData.owner_name,
          primary_color: signUpData.primary_color,
          email: signUpData.email,
          password: signUpData.password,
          password_confirmation: signUpData.password,
        })

        const { message } = response.data
        if (!response.data.success)
          throw new Error(message || response.data.errors?.email?.[0] || 'Erro ao registrar')

        const loginResult = await signIn(signUpData.email, signUpData.password)
        return loginResult
      } else {
        const response = await axios.post<ApiResponse>(`${API_URL}/auth/register`, {
          name: signUpData.owner_name,
          email: signUpData.email,
          password: signUpData.password,
          confirm_password: signUpData.password,
        })

        const { message } = response.data
        if (!response.data.success)
          throw new Error(message || response.data.errors?.email?.[0] || 'Erro ao registrar')

        const loginResult = await signIn(signUpData.email, signUpData.password)
        return loginResult
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  const requestOtp = async (
    phone: string,
    name: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.post<ApiResponse>(`${API_URL}/auth/client/request-otp`, {
        phone,
        name,
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao enviar código')
      }

      return { success: true, message: response.data.message || 'Código enviado!' }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao enviar código'
      return { success: false, message }
    }
  }

  const verifyOtp = async (
    phone: string,
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.post<
        ApiResponse<{
          user: User
          barbershop: BarberShop
          access_token: string
          device_token: string
        }>
      >(`${API_URL}/auth/client/verify-otp`, {
        phone,
        code,
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Código inválido')
      }

      const { data } = response.data

      // Salvar tokens e phone
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_role', data.user.role)
      localStorage.setItem('device_token', data.device_token)
      localStorage.setItem('client_phone', phone)

      setState({
        user: data.user,
        token: data.access_token,
        userRole: data.user.role,
        barbershop: data.barbershop,
        loading: false,
      })

      return { success: true, message: 'Verificação realizada com sucesso!' }
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Código inválido ou expirado'
      return { success: false, message }
    }
  }

  const autoLogin = async (): Promise<{ success: boolean; message: string }> => {
    const deviceToken = localStorage.getItem('device_token')
    const phone = localStorage.getItem('client_phone')

    if (!deviceToken || !phone) {
      return { success: false, message: 'Nenhum dispositivo registrado' }
    }

    try {
      const response = await axios.post<
        ApiResponse<{ user: User; barbershop: BarberShop; access_token: string }>
      >(`${API_URL}/auth/client/auto-login`, {
        device_token: deviceToken,
        phone,
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Sessão expirada')
      }

      const { data } = response.data

      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_role', data.user.role)

      setState({
        user: data.user,
        token: data.access_token,
        userRole: data.user.role,
        barbershop: data.barbershop,
        loading: false,
      })

      return { success: true, message: 'Login automático realizado!' }
    } catch {
      // Limpar device token inválido
      localStorage.removeItem('device_token')
      localStorage.removeItem('client_phone')
      return { success: false, message: 'Sessão expirada. Faça login novamente.' }
    }
  }

  const value: AuthContextType = {
    ...state,
    refreshAuth: loadAuthData,
    setLoading,
    signIn,
    signUp,
    signOut,
    requestOtp,
    verifyOtp,
    autoLogin,
    isAuthenticated: !!state.token && !!state.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

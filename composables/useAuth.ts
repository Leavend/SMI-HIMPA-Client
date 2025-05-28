import type { User } from '~/components/users/data/schema'

interface RegisterResponse {
  status: boolean
  message: string
  data: {
    user: User
  }
}

interface LoginResponse {
  status: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

interface ForgotPasswordResponse {
  status: boolean
  message: string
  data: Record<string, never>
}

interface ResetPasswordResponse {
  status: boolean
  message: string
  data: Record<string, never>
}

// Reactive bridge (safe for SSR)
const useTokenState = () => useState('token_state', () => '')
const useUserState = () => useState<User | null>('user_state', () => null)

export function useAuth() {
  const tokenStorage = useToken()
  const userStorage = useAuthUser()

  const token = useTokenState()
  const authUser = useUserState()

  const isLoading = ref(false)
  const errorMessage = ref('')

  if (import.meta.client) {
    watchEffect(() => {
      token.value = tokenStorage.value
      authUser.value = userStorage.value
    })
  }

  const login = async (username: string, password: string) => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await useFetch<LoginResponse>(useApiUrl('/user/login'), {
        method: 'POST',
        body: { username, password },
      })

      if (error.value || !data.value?.status) {
        throw createError({ statusCode: 401, statusMessage: data.value?.message || 'Login gagal' })
      }

      const user = data.value.data.user
      const newToken = data.value.data.token

      tokenStorage.value = newToken
      userStorage.value = user

      token.value = newToken
      authUser.value = user
    }
    catch (e: any) {
      errorMessage.value = e?.statusMessage || 'Login failed'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  const register = async (formData: {
    username: string
    email: string
    number: string
    password: string
    confirmPassword: string
  }) => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const { username, email, number, password, confirmPassword } = formData

      if (password !== confirmPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Password dan konfirmasi password tidak cocok' })
      }

      const { data: response, error } = await useFetch<RegisterResponse>(useApiUrl('/user/register'), {
        method: 'POST',
        body: {
          username,
          email,
          number,
          password,
        },
      })

      if (error.value || !response.value?.status) {
        throw createError({
          statusCode: 400,
          statusMessage: response.value?.message || 'Register failed',
        })
      }
    }
    catch (e: any) {
      errorMessage.value = e?.statusMessage || 'Register failed'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    tokenStorage.value = ''
    userStorage.value = null
    token.value = ''
    authUser.value = null
    navigateTo('/')
  }

  const forgotPassword = async (email: string) => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await useFetch<ForgotPasswordResponse>(useApiUrl('/user/forgot-password'), {
        method: 'POST',
        body: { email },
      })

      if (error.value || !data.value?.status) {
        throw createError({ statusCode: 400, statusMessage: data.value?.message || 'Permintaan reset gagal' })
      }
    }
    catch (e: any) {
      errorMessage.value = e?.statusMessage || 'Reset password gagal'
    }
    finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (
    email: string,
    code: string,
    password: string,
    confirmPassword?: string,
  ) => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      if (confirmPassword !== undefined && password !== confirmPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Password tidak cocok' })
      }

      const { data, error } = await useFetch<ResetPasswordResponse>(useApiUrl('/user/reset-password'), {
        method: 'POST',
        body: { email, code, password },
      })

      if (error.value || !data.value?.status) {
        throw createError({ statusCode: 400, statusMessage: data.value?.message || 'Reset password gagal' })
      }

      await navigateTo('/login')
    }
    catch (e: any) {
      errorMessage.value = e?.statusMessage || 'Reset password gagal'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    token,
    authUser,
    isLoggedIn: computed(() => !!token.value && !!authUser.value),
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    isLoading,
    errorMessage,
  }
}

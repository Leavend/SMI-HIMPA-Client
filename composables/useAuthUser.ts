import type { User } from '~/types/user'

export function useAuthUser() {
  return useCookie<User | null>('auth-user', {
    default: () => null,
    watch: true,
  })
}

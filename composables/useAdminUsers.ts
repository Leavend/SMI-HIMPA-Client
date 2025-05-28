import type { User } from '~/components/users/data/schema'
import { userSchema } from '@/components/users/data/schema'
import { z } from 'zod'
import { Role } from '~/types/role'

interface FetchUsersResponse {
  status: boolean
  message: string
  data: {
    users: User[]
  }
}

interface UpdateRoleUserResponse {
  status: boolean
  message: string
  data: {
    userId: string
    newRole: Role
  }
}

const CACHE_KEY = 'users'
const CACHE_TIMESTAMP_KEY = 'users_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 menit

export default function useAdminUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const adminGuard = () => {
    const token = useToken().value
    if (!token)
      throw new Error('Token tidak tersedia. Harap login ulang')

    const decode = decodeJWT(token)
    if (!decode || decode.role !== 'ADMIN')
      throw new Error('Authorization Strict')
  }

  const fetchUsers = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const storedUsers = localStorage.getItem(CACHE_KEY)
      const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isCacheValid
        = storedTimestamp
          && Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS

      // ⚠️ Step 1: Sementara pakai cache (jika valid)
      if (storedUsers && isCacheValid && !forceFetch) {
        const parsed = JSON.parse(storedUsers)
        const validated = z.array(userSchema).safeParse(parsed)

        if (validated.success) {
          users.value = validated.data
        }
        else {
          console.warn('Data cache tidak valid.')
        }
      }

      // ⚠️ Step 2: Tapi tetap fetch ke server (buat update terbaru)
      const { data, error: fetchError } = await useFetch<FetchUsersResponse>(
        useApiUrl('/admin/users'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      const usersData = data.value?.data?.users
      if (!usersData)
        throw new Error('Data pengguna tidak ditemukan di response server.')

      const validatedUsers = usersData.map(user => ({
        ...user,
        role: Role[user.role as keyof typeof Role] || Role.BORROWER,
        password: user.password || '',
      }))

      const parsed = z.array(userSchema).safeParse(validatedUsers)
      if (!parsed.success) {
        console.error('Zod validation error:', parsed.error)
        throw new Error('Data dari server tidak valid.')
      }

      users.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data pengguna.'
    }
    finally {
      loading.value = false
    }
  }

  const updateUserRole = async (userId: string, newRole: Role) => {
    adminGuard()
    const token = useToken().value

    const { data, error } = await useFetch<UpdateRoleUserResponse>(useApiUrl('/admin/user/update-role'), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newRole }),
    })

    if (error.value)
      throw new Error(error.value.message)

    if (data.value?.status) {
      const updatedUsers = users.value.map(user =>
        user.userId === userId ? { ...user, role: newRole } : user,
      )
      users.value = updatedUsers
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedUsers))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
      await fetchUsers(true)
    }
    else {
      throw new Error(data.value?.message || 'Gagal memperbarui peran pengguna.')
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
  }
}

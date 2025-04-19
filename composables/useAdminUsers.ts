import type { User } from '~/types/user'
import { userSchema } from '@/components/users/data/schema'
import { ref } from 'vue'
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

export default function useAdminUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Token tidak tersedia. Harap login ulang.')

      const storedUsers = localStorage.getItem('users')
      if (storedUsers && !forceFetch) {
        try {
          const parsed = JSON.parse(storedUsers)
          const validated = z.array(userSchema).safeParse(parsed)

          if (validated.success) {
            users.value = validated.data
            return
          }
          else {
            console.warn('Data cache tidak valid, fetch ulang dari server...')
          }
        }
        catch (e) {
          console.error('Gagal parsing data localStorage:', e)
        }
      }

      const { data, error: fetchError } = await useFetch<FetchUsersResponse>(useApiUrl('/admin/users'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message)
      }

      const usersData = data.value?.data?.users
      if (!usersData) {
        throw new Error('Data pengguna tidak ditemukan di response server.')
      }

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
      localStorage.setItem('users', JSON.stringify(parsed.data))
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data pengguna.'
    }
    finally {
      loading.value = false
    }
  }

  const updateUserRole = async (userId: string, newRole: Role) => {
    const token = useToken().value
    if (!token)
      throw new Error('Token tidak tersedia.')

    const { data, error } = await useFetch<UpdateRoleUserResponse>(useApiUrl('/admin/user/update-role'), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newRole }),
    })

    if (error.value) {
      throw new Error(error.value.message)
    }

    if (data.value?.status) {
      const updatedUsers = users.value.map(user =>
        user.userId === userId ? { ...user, role: newRole } : user,
      )
      users.value = updatedUsers
      localStorage.setItem('users', JSON.stringify(updatedUsers))
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

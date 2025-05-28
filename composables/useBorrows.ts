import type { Borrow } from '~/components/borrows/data/schema'
import type { User } from '~/components/users/data/schema'
import { useToken } from '@/composables/useToken'
import { ref } from 'vue'
import { z } from 'zod'
import { borrowSchema } from '~/components/borrows/data/schema'
import { userSchema } from '~/components/users/data/schema'

interface CreateBorrowResponse {
  status: boolean
  message: string
  data: {
    borrowId: string
    detailBorrow: {
      borrowDetailId: string
      borrowId: string
      inventoryId: string
      status: string
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }
  }
}

interface FetchUserBorrowsResponse {
  status: boolean
  message: string
  data: {
    borrows: Borrow[]
  }
}

interface FetchUsersResponse {
  status: boolean
  message: string
  data: {
    users: User[]
  }
}

export default function useBorrows() {
  const users = ref<User[]>([])
  const borrows = ref<Borrow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async () => {
    const token = useToken().value
    if (!token)
      throw new Error('Harap login terlebih dahulu.')

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
      throw new Error('Data user tidak ditemukan.')

    const parsed = z.array(userSchema).safeParse(usersData)
    if (!parsed.success)
      throw new Error('Data user tidak valid.')

    users.value = parsed.data
    return parsed.data
  }

  const getRandomAdminId = async (): Promise<string | null> => {
    try {
      const userList = await fetchUsers()

      const adminUsers = userList.filter(user => user.role === 'ADMIN')

      if (adminUsers.length === 0)
        return null

      const randomIndex = Math.floor(Math.random() * adminUsers.length)
      return adminUsers[randomIndex].userId
    }
    catch (error) {
      console.error('Failed to get random admin:', error)
      return null
    }
  }

  const fetchUserBorrows = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Harap login terlebih dahulu.')

      const { data, error: fetchError } = await useFetch<FetchUserBorrowsResponse>(
        useApiUrl(`/borrow/borrows/${userId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      const parsed = z.array(borrowSchema).safeParse(data.value?.data?.borrows)
      if (!parsed.success)
        throw new Error('Data peminjaman tidak valid.')

      borrows.value = parsed.data
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data peminjaman.'
    }
    finally {
      loading.value = false
    }
  }

  const createBorrow = async (formData: {
    userId: string
    adminId: string
    quantity: number
    dateBorrow: string
    dateReturn: string
    inventoryId: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token) {
        throw new Error('Harap login terlebih dahulu.')
      }

      const { data, error: fetchError } = await useFetch<CreateBorrowResponse>(
        useApiUrl('/borrow'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message)
      }

      if (!data.value?.status) {
        const error = new Error(data.value?.message || 'Gagal membuat peminjaman')
        Object.assign(error, {
          statusMessage: data.value?.message,
          data: { message: data.value?.message },
        })
        throw error
      }

      return data.value.data
    }
    catch (e: unknown) {
      let errorMessage = 'Gagal membuat peminjaman'
      let statusMessage = errorMessage
      let dataMessage = errorMessage

      if (e instanceof Error) {
        errorMessage = e.message
        statusMessage = (e as any).statusMessage || e.message
        dataMessage = (e as any)?.data?.message || e.message
      }
      else if (typeof e === 'object' && e !== null) {
        const err = e as Record<string, any>
        errorMessage = err.message || errorMessage
        statusMessage = err.statusMessage || statusMessage
        dataMessage = err?.data?.message || dataMessage
      }

      const errorObj = new Error(errorMessage)
      Object.assign(errorObj, {
        statusMessage,
        data: { message: dataMessage },
      })

      error.value = errorMessage
      throw errorObj
    }
    finally {
      loading.value = false
    }
  }

  return {
    borrows,
    users,
    loading,
    error,
    fetchUsers,
    fetchUserBorrows,
    createBorrow,
    getRandomAdminId,
  }
}

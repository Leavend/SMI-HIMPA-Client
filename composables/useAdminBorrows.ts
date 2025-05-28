import type { Borrow, BorrowDetail } from '~/components/borrows/data/schema'
import { z } from 'zod'
import { borrowSchema } from '~/components/borrows/data/schema'

interface FetchBorrowsResponse {
  status: boolean
  message: string
  data: {
    borrows: Borrow[]
  }
}

interface ConfirmRequestBorrowResponse {
  status: boolean
  message: string
  data: {
    borrowId: string
    status: string
  }
}

interface UpdateBorrowResponse {
  status: boolean
  message: string
  data: {
    borrow: Borrow
    borrowDetail: BorrowDetail
  }
}

interface UpdateBorrowParams {
  borrowId: string
  dateReturn?: string | null
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'RETURNED'
}

const CACHE_KEY = 'borrows'
const CACHE_TIMESTAMP_KEY = 'borrows_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 menit

export default function useAdminBorrows() {
  const borrows = ref<Borrow[]>([])
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

  const fetchBorrows = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const storedBorrows = localStorage.getItem(CACHE_KEY)
      const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isCacheValid
        = storedTimestamp
          && Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS

      // Load from cache if available
      if (storedBorrows && isCacheValid && !forceFetch) {
        const parsed = JSON.parse(storedBorrows)
        const validated = z.array(borrowSchema).safeParse(parsed)

        if (validated.success) {
          borrows.value = validated.data
          return
        }
        else {
          console.warn('Data cache tidak valid.')
        }
      }

      // Fetch from server
      const { data, error: fetchError } = await useFetch<FetchBorrowsResponse>(
        useApiUrl('/admin/borrows'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      const borrowsData = data.value?.data?.borrows
      if (!borrowsData)
        throw new Error('Data peminjaman tidak ditemukan di response server.')

      // ✅ Normalize borrowDetails before Zod validation
      const normalizedBorrows = borrowsData.map((borrow) => {
        const normalizedDetails = Array.isArray(borrow.borrowDetails)
          ? borrow.borrowDetails
          : borrow.borrowDetails
            ? [borrow.borrowDetails]
            : []

        return {
          ...borrow,
          borrowDetails: normalizedDetails.map(detail => ({
            ...detail,
            inventory: detail.inventory ?? undefined, // Optional handling
          })),
          user: borrow.user ?? undefined, // Optional handling
        }
      })

      const parsed = z.array(borrowSchema).safeParse(normalizedBorrows)

      if (!parsed.success) {
        console.error('Zod validation error:', parsed.error)
        throw new Error('Data dari server tidak valid.')
      }

      borrows.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data peminjaman.'
    }
    finally {
      loading.value = false
    }
  }

  const confirmRequestBorrow = async (formData: {
    borrowId: string
    status: 'ACTIVE' | 'REJECTED' | 'RETURNED'
  }) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const { error: fetchError, data } = await useFetch<ConfirmRequestBorrowResponse>(
        useApiUrl('/admin/borrow/confirmation-borrow'),
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            borrowId: formData.borrowId,
            status: formData.status,
          }),
        },
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message)
      }

      const updated = data.value?.data
      if (!updated?.borrowId || !updated?.status) {
        throw new Error('Data hasil konfirmasi tidak lengkap')
      }

      // Update local state
      const index = borrows.value.findIndex(b => b.borrowId === updated.borrowId)
      if (index !== -1) {
        borrows.value[index] = {
          ...borrows.value[index],
          borrowDetails: borrows.value[index].borrowDetails?.map(detail => ({
            ...detail,
            status: updated.status,
          })),
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(borrows.value))
      }

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Gagal mengkonfirmasi peminjaman'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateBorrow = async (formData: UpdateBorrowParams) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const { error: fetchError, data } = await useFetch<UpdateBorrowResponse>(
        useApiUrl(`/admin/borrow/${formData.borrowId}`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateReturn: formData.dateReturn ?? null,
            status: formData.status,
          }),
        },
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to update borrow')
      }

      // More flexible response checking
      if (!data.value?.data) {
        throw new Error('Invalid response format from server')
      }

      // Update local state
      const index = borrows.value.findIndex(b => b.borrowId === formData.borrowId)
      if (index !== -1) {
        borrows.value[index] = {
          ...borrows.value[index],
          dateReturn: formData.dateReturn ?? null,
          borrowDetails: borrows.value[index].borrowDetails?.map(detail => ({
            ...detail,
            status: formData.status || detail.status,
          })),
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(borrows.value))
      }

      return data.value.data
    }
    catch (err: any) {
      error.value = err.message || 'Failed to update borrow'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    borrows,
    loading,
    error,
    fetchBorrows,
    confirmRequestBorrow,
    updateBorrow,
  }
}

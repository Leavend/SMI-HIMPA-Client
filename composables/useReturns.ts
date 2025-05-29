import type { Return } from '~/components/returns/data/schema'
import { useToken } from '@/composables/useToken'
import { ref } from 'vue'
import { z } from 'zod'
import { returnSchema } from '~/components/returns/data/schema'

interface FetchReturnsResponse {
  status: boolean
  message: string
  data: {
    returns: Return[]
  }
}

const CACHE_KEY = 'returns_user'
const CACHE_TIMESTAMP_KEY = 'returns_user_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 menit

export default function useReturns() {
  const returns = ref<Return[]>([])
  const loading = ref(false)
  const error = ref<string | Error | null>(null)

  const getErrorMessage = (err: any): string => {
    // Jika bentuknya string langsung
    if (typeof err === 'string' && err.length > 0)
      return err

    // Jika Error instance biasa
    if (err instanceof Error) {
      const msg = err.message.toLowerCase()

      if (msg.includes('login terlebih dahulu'))
        return 'Harap login terlebih dahulu untuk melihat data.'
      if (msg.includes('tidak ditemukan'))
        return 'Data pengembalian tidak ditemukan.'
      if (msg.includes('tidak valid'))
        return 'Terjadi masalah saat memuat data pengembalian. Mohon coba lagi.'
      if (msg.includes('failed to fetch') || msg.includes('err_connection_refused'))
        return 'Gagal terhubung ke server. Mohon periksa koneksi Anda atau coba sebentar lagi.'
      if (msg.includes('404'))
        return 'Data tidak ditemukan. Mohon pastikan ID pengguna benar.'
      return 'Terjadi kesalahan saat memproses permintaan Anda.'
    }

    // Jika error berupa object dari useFetch atau backend
    if (err && typeof err === 'object') {
      const msg = err.data?.message || err.message

      if (typeof msg === 'string') {
        if (msg.toLowerCase().includes('no return records'))
          return 'Tidak ada data pengembalian untuk pengguna ini.'
        if (msg.toLowerCase().includes('not found') || msg.includes('404'))
          return 'Data tidak ditemukan.'
        return msg
      }

      if (err.statusCode) {
        if (err.statusCode === 404)
          return 'Data tidak ditemukan.'
        if (err.statusCode === 401 || err.statusCode === 403)
          return 'Anda tidak memiliki akses. Harap login kembali.'
        return `Terjadi kesalahan pada server (Kode: ${err.statusCode}).`
      }

      if (err.statusMessage)
        return err.statusMessage
    }

    return 'Terjadi kesalahan tidak dikenal saat memuat data.'
  }

  const fetchReturnsByUserId = async (userId: string, forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Harap login terlebih dahulu.')

      const storedReturns = localStorage.getItem(`${CACHE_KEY}_${userId}`)
      const storedTimestamp = localStorage.getItem(`${CACHE_TIMESTAMP_KEY}_${userId}`)
      const isCacheValid = storedTimestamp && Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS

      if (storedReturns && isCacheValid && !forceFetch) {
        const parsed = JSON.parse(storedReturns)
        const validated = z.array(returnSchema).safeParse(parsed)

        if (validated.success) {
          returns.value = validated.data
          return validated.data
        }
        else {
          console.warn('Data cache tidak valid.')
        }
      }

      const { data, error: fetchError } = await useFetch<FetchReturnsResponse>(
        useApiUrl(`/return/returns/${userId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value)
        throw new Error(getErrorMessage(fetchError.value))

      const returnsData = data.value?.data?.returns

      if (!returnsData || !Array.isArray(returnsData)) {
        returns.value = []
        return []
      }

      const parsed = z.array(returnSchema).safeParse(returnsData)
      if (!parsed.success) {
        console.error('Validation error:', parsed.error)
        throw new Error('Data pengembalian tidak valid.')
      }

      returns.value = parsed.data
      localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(parsed.data))
      localStorage.setItem(`${CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString())
      return parsed.data
    }
    catch (err: any) {
      error.value = new Error(getErrorMessage(err))
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const fetchAllReturns = async () => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Harap login terlebih dahulu.')

      const { data, error: fetchError } = await useFetch<FetchReturnsResponse>(
        useApiUrl('/admin/returns'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value)
        throw new Error(getErrorMessage(fetchError.value))

      const returnsData = data.value?.data?.returns
      if (!returnsData)
        throw new Error('Data pengembalian tidak ditemukan.')

      const parsed = z.array(returnSchema).safeParse(returnsData)
      if (!parsed.success) {
        console.error('Validation error:', parsed.error)
        throw new Error('Data pengembalian tidak valid.')
      }

      returns.value = parsed.data
      return parsed.data
    }
    catch (err: any) {
      error.value = new Error(getErrorMessage(err))
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const calculateLateDays = (dateReturn: string, expectedReturnDate: string): number => {
    const returnDate = new Date(dateReturn)
    const expectedDate = new Date(expectedReturnDate)
    const diffTime = returnDate.getTime() - expectedDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return {
    returns,
    loading,
    error,
    fetchReturnsByUserId,
    fetchAllReturns,
    calculateLateDays,
  }
}

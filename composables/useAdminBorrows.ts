import type { Borrow, BorrowDetail } from '~/components/borrows/data/schema'
import { useApiUrl } from '@/composables/useApiUrl'
import { useToken } from '@/composables/useToken'
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
    status: string // Seharusnya tipe status yang lebih spesifik jika memungkinkan
  }
}

interface UpdateBorrowResponse {
  status: boolean
  message: string
  data: {
    borrow: Borrow // Atau tipe data spesifik yang dikembalikan server
    borrowDetail: BorrowDetail // Atau tipe data spesifik yang dikembalikan server
  }
}

interface UpdateBorrowParams {
  borrowId: string
  dateReturn?: string | null
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'RETURNED' // Tipe status spesifik
}

const CACHE_KEY = 'admin_borrows' // Ubah nama cache key agar unik untuk admin
const CACHE_TIMESTAMP_KEY = 'admin_borrows_cache_timestamp'
const CACHE_DURATION_MS = 30 * 1000 // 30 Detik, untuk refresh yang lebih sering

// Fungsi helper untuk penanganan pesan error yang lebih baik
function getErrorMessage(err: any, defaultMessage: string): string {
  if (typeof err === 'string' && err.length > 0)
    return err

  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('login terlebih dahulu') || msg.includes('token tidak tersedia'))
      return 'Harap login terlebih dahulu.'
    if (msg.includes('authorization strict') || msg.includes('unauthorized') || msg.includes('forbidden'))
      return 'Anda tidak memiliki izin untuk tindakan ini.'
    if (msg.includes('tidak ditemukan') || msg.includes('not found'))
      return 'Data yang diminta tidak ditemukan.'
    if (msg.includes('tidak valid') || msg.includes('validation error'))
      return 'Data tidak valid atau format salah.'
    if (msg.includes('failed to fetch') || msg.includes('err_connection_refused'))
      return 'Gagal terhubung ke server. Periksa koneksi Anda.'
    if (msg.includes('404'))
      return 'Sumber daya tidak ditemukan (404).'
    if (msg.includes('500'))
      return 'Terjadi kesalahan internal pada server (500).'
    return err.message || defaultMessage
  }

  if (err && typeof err === 'object') {
    const dataMsg = err.data?.message || err.data?.error // Cek juga err.data.error
    const statusMsg = err.statusMessage
    const directMsg = err.message

    if (typeof dataMsg === 'string' && dataMsg.length > 0)
      return dataMsg
    if (typeof statusMsg === 'string' && statusMsg.length > 0)
      return statusMsg
    if (typeof directMsg === 'string' && directMsg.length > 0)
      return directMsg

    if (err.statusCode) {
      if (err.statusCode === 404)
        return 'Sumber daya tidak ditemukan (404).'
      if (err.statusCode === 401 || err.statusCode === 403)
        return 'Anda tidak memiliki izin (401/403).'
      return `Terjadi kesalahan server (Kode: ${err.statusCode}).`
    }
  }
  return defaultMessage
}

export default function useAdminBorrows() {
  const borrows = ref<Borrow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null) // error akan berisi string pesan

  const adminGuard = () => {
    const token = useToken().value
    if (!token)
      throw new Error('Token tidak tersedia. Harap login ulang')

    const decode = decodeJWT(token) // Asumsi fungsi ini ada dan berfungsi
    if (!decode || decode.role !== 'ADMIN')
      throw new Error('Authorization Strict')
  }

  const fetchBorrows = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value // Token sudah divalidasi di adminGuard

      const storedBorrows = localStorage.getItem(CACHE_KEY)
      const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isCacheValid = storedTimestamp && (Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS)

      if (storedBorrows && isCacheValid && !forceFetch) {
        const parsedFromCache = JSON.parse(storedBorrows)
        const validated = z.array(borrowSchema).safeParse(parsedFromCache)

        if (validated.success) {
          borrows.value = validated.data
          return // Data dari cache valid
        }
        else {
          console.warn('Data cache admin borrows tidak valid, mengambil dari server.')
        }
      }

      const { data, error: fetchError } = await useFetch<FetchBorrowsResponse>(
        useApiUrl('/admin/borrows'), // Pastikan useApiUrl() menghasilkan URL yang benar
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache', // Selalu ambil data baru dari network jika cache localStorage gagal/kedaluwarsa
        },
      )

      if (fetchError.value)
        throw fetchError.value // Biarkan getErrorMessage menangani di catch

      const borrowsData = data.value?.data?.borrows
      if (!data.value?.status || !borrowsData) {
        // Jika status false atau data tidak ada, gunakan message dari server jika ada
        throw new Error(data.value?.message || 'Data peminjaman tidak ditemukan di respons server.')
      }

      // Normalisasi data (opsional, tergantung struktur API Anda)
      const normalizedBorrows = borrowsData.map((borrow) => {
        const normalizedDetails = Array.isArray(borrow.borrowDetails)
          ? borrow.borrowDetails
          : borrow.borrowDetails ? [borrow.borrowDetails] : []

        return {
          ...borrow,
          borrowDetails: normalizedDetails.map(detail => ({
            ...detail,
            inventory: detail.inventory ?? undefined,
          })),
          user: borrow.user ?? undefined,
        }
      })

      const parsed = z.array(borrowSchema).safeParse(normalizedBorrows)
      if (!parsed.success) {
        console.error('Zod validation error (admin borrows):', parsed.error.flatten())
        throw new Error('Data dari server tidak valid setelah normalisasi.')
      }

      borrows.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal memuat data peminjaman admin.')
      error.value = friendlyError
      // console.error("Error in fetchBorrows (admin):", err); // Untuk debugging error asli
      // throw new Error(friendlyError); // Opsional: lempar lagi jika pemanggil perlu menangani
    }
    finally {
      loading.value = false
    }
  }

  const confirmRequestBorrow = async (formData: {
    borrowId: string
    status: 'ACTIVE' | 'REJECTED' // Status yang diizinkan untuk konfirmasi
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
          body: { // useFetch otomatis JSON.stringify jika body adalah objek & Content-Type application/json
            borrowId: formData.borrowId,
            status: formData.status,
          },
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      if (!data.value?.status || !data.value?.data?.borrowId) {
        throw new Error(data.value?.message || 'Gagal mengkonfirmasi peminjaman, respons tidak valid.')
      }

      const updatedData = data.value.data

      // Update local state
      const index = borrows.value.findIndex(b => b.borrowId === updatedData.borrowId)
      if (index !== -1) {
        // Asumsi status ada di borrowDetails, sesuaikan jika struktur berbeda
        borrows.value[index] = {
          ...borrows.value[index],
          borrowDetails: borrows.value[index].borrowDetails?.map(detail => ({
            ...detail,
            // Hanya update status detail, atau Anda mungkin perlu fetch ulang data borrow tunggal
            status: updatedData.status,
          })),
        }
        // Perbarui cache localStorage setelah perubahan
        localStorage.setItem(CACHE_KEY, JSON.stringify(borrows.value))
      }
      await fetchBorrows(true) // Paksa fetch ulang untuk sinkronisasi penuh
      return updatedData
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal mengkonfirmasi peminjaman.')
      error.value = friendlyError
      throw new Error(friendlyError) // Lempar error yang sudah diformat
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

      const bodyPayload: Record<string, any> = {}
      if (formData.dateReturn !== undefined)
        bodyPayload.dateReturn = formData.dateReturn // Kirim null jika memang null
      if (formData.status)
        bodyPayload.status = formData.status

      const { error: fetchError, data } = await useFetch<UpdateBorrowResponse>(
        useApiUrl(`/admin/borrow/${formData.borrowId}`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: bodyPayload,
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      if (!data.value?.status || !data.value?.data) {
        throw new Error(data.value?.message || 'Gagal memperbarui peminjaman, respons tidak valid.')
      }
      await fetchBorrows(true) // Paksa fetch ulang untuk sinkronisasi penuh

      return data.value.data
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal memperbarui peminjaman.')
      error.value = friendlyError
      throw new Error(friendlyError)
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

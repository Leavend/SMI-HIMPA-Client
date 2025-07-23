import type { User } from '~/components/users/data/schema'
import { userSchema } from '@/components/users/data/schema' // Pastikan path ini benar
import { useApiUrl } from '@/composables/useApiUrl' // Pastikan ada
import { useToken } from '@/composables/useToken' // Pastikan ada
import { z } from 'zod'
import { Role } from '~/types/role' // Pastikan path dan definisi Role enum ini benar

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
  data: { // Idealnya, server mengembalikan user yang diupdate atau setidaknya konfirmasi
    userId: string
    newRole: Role // atau string role dari server
  } | Record<string, never> // Memungkinkan data kosong jika API hanya mengembalikan pesan sukses
}

const CACHE_KEY = 'admin_users' // Ubah nama cache key agar unik untuk admin users
const CACHE_TIMESTAMP_KEY = 'admin_users_cache_timestamp'
const CACHE_DURATION_MS = 0.5 * 60 * 1000 // 5 menit (sesuaikan jika perlu)

// --- Fungsi Helper Error Message ---
function getErrorMessage(err: any, defaultMessage: string): string {
  if (typeof err === 'string' && err.length > 0) {
    // Jika error message mengandung URL, gunakan default message
    if (err.includes('http') || err.includes('api')) {
      return defaultMessage
    }
    return err
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    // Jika error message mengandung URL, gunakan default message
    if (msg.includes('http') || msg.includes('api')) {
      return defaultMessage
    }
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
    const dataMsg = err.data?.message || err.data?.error
    const statusMsg = err.statusMessage
    const directMsg = err.message

    if (typeof dataMsg === 'string' && dataMsg.length > 0) {
      if (dataMsg.includes('http') || dataMsg.includes('api')) {
        return defaultMessage
      }
      return dataMsg
    }
    if (typeof statusMsg === 'string' && statusMsg.length > 0) {
      if (statusMsg.includes('http') || statusMsg.includes('api')) {
        return defaultMessage
      }
      return statusMsg
    }
    if (typeof directMsg === 'string' && directMsg.length > 0) {
      if (directMsg.includes('http') || directMsg.includes('api')) {
        return defaultMessage
      }
      return directMsg
    }

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

export default function useAdminUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const adminGuard = () => {
    const token = useToken().value
    if (!token)
      throw new Error('Token tidak tersedia. Harap login ulang')

    const decode = decodeJWT(token)
    if (!decode || decode.role !== Role.ADMIN) { // Gunakan Role.ADMIN dari enum
      throw new Error('Authorization Strict: Hanya admin yang diizinkan.')
    }
  }

  const fetchUsers = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      if (!forceFetch) {
        const storedUsers = localStorage.getItem(CACHE_KEY)
        const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
        const isCacheValid = storedTimestamp && (Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS)

        if (storedUsers && isCacheValid) {
          const parsedFromCache = JSON.parse(storedUsers)
          // Validasi data cache dengan skema User, termasuk normalisasi peran jika perlu
          const validatedCache = z.array(userSchema.extend({
            role: z.nativeEnum(Role).default(Role.BORROWER), // Pastikan role adalah enum yang valid
          })).safeParse(parsedFromCache.map((user: any) => ({
            ...user,
            role: Role[user.role as keyof typeof Role] || Role.BORROWER, // Normalisasi peran dari cache
            password: user.password || '', // Pastikan password ada
          })))

          if (validatedCache.success) {
            users.value = validatedCache.data
            loading.value = false // Hentikan loading jika data dari cache digunakan
            return // Data dari cache valid dan digunakan
          }
          else {
            console.warn('Data cache pengguna admin tidak valid, mengambil dari server.', validatedCache.error.flatten())
          }
        }
      }

      // Jika forceFetch true, atau cache tidak valid/tidak ada, ambil dari server
      const data = await $fetch<FetchUsersResponse>(
        useApiUrl('/admin/users'),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const usersData = data?.data?.users
      if (!data?.status || !usersData) {
        throw new Error(data?.message || 'Data pengguna tidak ditemukan di respons server.')
      }

      // Normalisasi data dari server
      const normalizedUsers = usersData.map((user: any) => ({
        ...user,
        role: Role[user.role as keyof typeof Role] || Role.BORROWER, // Normalisasi peran
        password: user.password || '', // Pastikan password ada, meskipun mungkin tidak seharusnya dikirim ke klien
      }))

      const parsed = z.array(userSchema).safeParse(normalizedUsers)
      if (!parsed.success) {
        console.error('Zod validation error (admin users):', parsed.error.flatten())
        throw new Error('Data pengguna dari server tidak valid setelah normalisasi.')
      }

      users.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data)) // Simpan data yang sudah dinormalisasi dan divalidasi
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Gagal memuat data pengguna.')
      // console.error("Error in fetchUsers (admin):", err);
    }
    finally {
      loading.value = false
    }
  }

  const updateUserRole = async (userId: string, newRole: Role) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      // Validasi input
      if (!userId || !Object.values(Role).includes(newRole)) {
        throw new Error('User ID atau peran baru tidak valid.')
      }

      const data = await $fetch<UpdateRoleUserResponse>(
        useApiUrl('/admin/user/update-role'),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: { userId, newRole },
        },
      )

      if (!data?.status) {
        throw new Error(data?.message || 'Gagal memperbarui peran pengguna.')
      }

      // Setelah berhasil, fetch ulang semua pengguna untuk data terbaru
      // Ini adalah cara paling aman untuk memastikan konsistensi
      await fetchUsers(true)

      // Jika Anda ingin update lokal (opsional, fetch ulang lebih aman):
      // const userIndex = users.value.findIndex(u => u.userId === userId);
      // if (userIndex !== -1) {
      //   users.value[userIndex] = { ...users.value[userIndex], role: newRole };
      //   localStorage.setItem(CACHE_KEY, JSON.stringify(users.value));
      //   localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      // }

      return data.data // Mengembalikan data dari respons jika ada
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal memperbarui peran pengguna.')
      error.value = friendlyError
      throw new Error(friendlyError) // Lempar error yang sudah diformat
    }
    finally {
      loading.value = false
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

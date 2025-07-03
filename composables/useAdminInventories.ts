import type { Inventory } from '@/components/inventories/data/schema'
import { inventorySchema } from '@/components/inventories/data/schema' // Pastikan path ini benar
import { useApiUrl } from '@/composables/useApiUrl' // Pastikan composable ini ada
import { useToken } from '@/composables/useToken' // Pastikan composable ini ada
import { z } from 'zod'

// Tipe data kosong jika API mengembalikan objek kosong pada sukses
interface EmptyDataObject {
  [key: string]: never
}

// Tipe Respons untuk Fetch Inventories
interface FetchInventoriesResponse {
  status: boolean // Biasanya boolean atau string "success"/"error"
  message: string
  data: {
    inventories: Inventory[] // Asumsi API mengembalikan array inventories
  }
}

// Tipe Respons untuk Create Inventory
interface CreateInventoryResponse {
  status: boolean // Atau string
  message: string
  data: { // Idealnya, ini adalah Inventory (item yang baru dibuat)
    inventory: Inventory // Mengubah dari Inventory[] menjadi Inventory tunggal
    // Jika API Anda mengembalikan array, sesuaikan kembali ke Inventory[]
    // atau cukup EmptyDataObject jika hanya pesan sukses
  } | EmptyDataObject // Memungkinkan data kosong jika API hanya mengembalikan pesan
}

// Tipe Respons untuk Update Inventory (umum)
interface UpdateInventoryGeneralResponse {
  status: boolean // Atau string
  message: string
  data: EmptyDataObject // Sesuai definisi Anda, API tidak mengembalikan data inventory yang diupdate
}

// --- Konfigurasi Cache ---
const CACHE_KEY = 'admin_inventories'
const CACHE_TIMESTAMP_KEY = 'admin_inventories_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 menit (sesuaikan jika perlu)

// --- Fungsi Helper Error Message ---
function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (typeof err === 'string' && err.length > 0) return err;
  if (err instanceof Error) return err.message || defaultMessage;
  if (err && typeof err === 'object') {
    // @ts-ignore
    return err.message || defaultMessage;
  }
  return defaultMessage;
}

/**
 * Composable untuk manajemen data inventaris (khusus admin).
 * @returns inventories, loading, error, fetchInventories
 */
export default function useAdminInventories() {
  const inventories = ref<Inventory[]>([])
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

  // --- Fungsi Fetch Inventories ---
  const fetchInventories = async (forceFetch = false): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const storedData = localStorage.getItem(CACHE_KEY)
      const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isCacheValid = storedTimestamp && (Date.now() - Number(storedTimestamp) < CACHE_DURATION_MS)

      if (storedData && isCacheValid && !forceFetch) {
        const parsedFromCache = JSON.parse(storedData)
        const validated = z.array(inventorySchema).safeParse(parsedFromCache)
        if (validated.success) {
          inventories.value = validated.data
          return // Data dari cache valid
        }
        else {
          console.warn('Data cache admin inventories tidak valid, mengambil dari server.')
        }
      }

      const { data, error: fetchError } = await useFetch<FetchInventoriesResponse>(
        useApiUrl('/inventories'), // Endpoint untuk mengambil semua inventory (admin)
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      const inventoriesData = data.value?.data?.inventories
      if (!data.value?.status || !inventoriesData) {
        throw new Error(data.value?.message || 'Data inventaris tidak ditemukan di respons server.')
      }

      const parsed = z.array(inventorySchema).safeParse(inventoriesData)
      if (!parsed.success) {
        console.error('Zod validation error (admin inventories):', parsed.error.flatten())
        throw new Error('Data inventaris dari server tidak valid.')
      }

      inventories.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Gagal memuat data inventaris.')
      // console.error("Error in fetchInventories (admin):", err);
    }
    finally {
      loading.value = false
    }
  }

  // --- Fungsi Create Inventory ---
  const createInventory = async (formData: {
    name: string
    quantity: number // Pastikan ini number
    condition: string
    code: string
  }) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      // Validasi formData sebelum mengirim (opsional, karena server juga harus validasi)
      const createSchema = inventorySchema.pick({ name: true, quantity: true, condition: true, code: true })
      const parsedForm = createSchema.safeParse(formData)
      if (!parsedForm.success) {
        throw new Error(`Data input tidak valid: ${parsedForm.error.flatten().fieldErrors}`)
      }

      const { data, error: fetchError } = await useFetch<CreateInventoryResponse>(
        useApiUrl('/admin/inventory'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'application/json', // useFetch otomatis set ini jika body adalah objek
          },
          body: parsedForm.data, // Kirim data yang sudah divalidasi
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      if (!data.value?.status) { // Asumsi status: true berarti sukses
        throw new Error(data.value?.message || 'Gagal membuat inventaris.')
      }

      // Setelah berhasil, fetch ulang semua inventories untuk data terbaru
      await fetchInventories(true)
      // Jika API mengembalikan item yang baru dibuat, Anda bisa menambahkannya ke state lokal:
      // if (data.value.data && 'inventory' in data.value.data && data.value.data.inventory) {
      //   inventories.value.push(data.value.data.inventory);
      //   localStorage.setItem(CACHE_KEY, JSON.stringify(inventories.value));
      // } else {
      //   await fetchInventories(true);
      // }
      return data.value.data // Mengembalikan data dari respons (bisa EmptyDataObject atau objek inventory)
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Terjadi kesalahan saat membuat inventaris.')
      error.value = friendlyError
      throw new Error(friendlyError)
    }
    finally {
      loading.value = false
    }
  }

  // --- Fungsi Update Inventory ---
  const updateInventory = async (
    inventoryId: string, // Pisahkan inventoryId untuk URL
    updateData: { // Data yang akan diupdate
      name?: string
      quantity?: number
      condition?: string
      // code biasanya tidak diupdate, tapi bisa ditambahkan jika perlu
    },
  ) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      // Validasi hanya field yang ada di updateData
      const partialSchema = inventorySchema.pick({
        name: true,
        quantity: true,
        condition: true,
      }).partial() // .partial() membuat semua field opsional untuk update

      const parsedPayload = partialSchema.safeParse(updateData)
      if (!parsedPayload.success) {
        throw new Error(`Data update tidak valid: ${parsedPayload.error.flatten().fieldErrors}`)
      }

      if (Object.keys(parsedPayload.data).length === 0) {
        throw new Error('Tidak ada data yang akan diupdate.')
      }

      const { data, error: fetchError } = await useFetch<UpdateInventoryGeneralResponse>(
        useApiUrl(`/admin/inventory/${inventoryId}`),
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: parsedPayload.data,
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      if (!data.value?.status) {
        throw new Error(data.value?.message || 'Gagal memperbarui inventaris.')
      }

      // Setelah berhasil, fetch ulang semua inventories
      await fetchInventories(true)
      return data.value.data // Mengembalikan EmptyDataObject
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal memperbarui inventaris.')
      error.value = friendlyError
      throw new Error(friendlyError)
    }
    finally {
      loading.value = false
    }
  }

  // --- Fungsi Update Inventory Condition ---
  // Fungsi ini bisa digabung dengan updateInventory jika endpoint dan payloadnya fleksibel
  // Jika endpointnya spesifik hanya untuk kondisi, maka biarkan terpisah.
  const updateInventoryCondition = async (
    inventoryId: string,
    newCondition: string, // Hanya kondisi yang diupdate
  ) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()
      const token = useToken().value

      const conditionSchema = z.object({
        condition: inventorySchema.shape.condition, // Ambil skema enum/string dari inventorySchema
      })

      const parsedPayload = conditionSchema.safeParse({ condition: newCondition })
      if (!parsedPayload.success) {
        throw new Error(`Kondisi tidak valid: ${parsedPayload.error.flatten().fieldErrors}`)
      }

      const { data, error: fetchError } = await useFetch<UpdateInventoryGeneralResponse>(
        useApiUrl(`/admin/inventory/condition/${inventoryId}`), // Asumsi endpoint berbeda untuk kondisi
        // Jika endpoint sama dengan updateInventory, gunakan PUT ke /admin/inventory/${inventoryId}
        // dan body: { condition: newCondition }
        {
          method: 'PATCH', // Atau PUT, sesuaikan dengan API Anda
          headers: { Authorization: `Bearer ${token}` },
          body: parsedPayload.data, // Kirim { condition: "VALID_CONDITION" }
          cache: 'no-cache',
        },
      )

      if (fetchError.value)
        throw fetchError.value

      if (!data.value?.status) {
        throw new Error(data.value?.message || 'Gagal memperbarui kondisi inventaris.')
      }

      // Setelah berhasil, fetch ulang semua inventories
      await fetchInventories(true)
      return data.value.data // Mengembalikan EmptyDataObject
    }
    catch (err: any) {
      const friendlyError = getErrorMessage(err, 'Gagal memperbarui kondisi inventaris.')
      error.value = friendlyError
      throw new Error(friendlyError)
    }
    finally {
      loading.value = false
    }
  }

  return {
    inventories: readonly(inventories),
    loading: readonly(loading),
    error: readonly(error),
    fetchInventories,
    createInventory,
    updateInventory,
    updateInventoryCondition,
  }
}

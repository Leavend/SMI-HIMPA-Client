import type { Inventory } from '~/components/inventories/data/schema'
import { inventorySchema } from '@/components/inventories/data/schema'
import { z } from 'zod'

interface FetchInventoriesResponse {
  status: boolean
  message: string
  data: {
    inventories: Inventory[]
  }
}

export default function useInventories() {
  const inventories = ref<Inventory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const CACHE_KEY = 'inventories'
  const CACHE_TIMESTAMP_KEY = 'inventories_cache_timestamp'
  const CACHE_DURATION_MS = 0.1 * 60 * 1000

  const fetchInventories = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Authentication tidak tersedia. Harap login ulang.')

      // Step 1: Cek cache
      const stored = localStorage.getItem(CACHE_KEY)
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isValid = timestamp && Date.now() - Number(timestamp) < CACHE_DURATION_MS

      if (stored && isValid && !forceFetch) {
        const parsedCache = JSON.parse(stored)
        const validated = z.array(inventorySchema).safeParse(parsedCache)
        if (validated.success) {
          inventories.value = validated.data
        }
      }

      // Step 2: Fetch tetap dilakukan
      const data = await $fetch<FetchInventoriesResponse>(
        useApiUrl('/inventory/inventories'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const inventoriesData = data?.data?.inventories
      if (!inventoriesData)
        throw new Error('Data inventory tidak ditemukan di response server.')

      const parsed = z.array(inventorySchema).safeParse(inventoriesData)
      if (!parsed.success) {
        console.error('Zod validation error:', parsed.error)
        throw new Error('Data dari server tidak valid.')
      }

      inventories.value = parsed.data
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data inventory.'
    }
    finally {
      loading.value = false
    }
  }

  return {
    inventories,
    loading,
    error,
    fetchInventories,
  }
}

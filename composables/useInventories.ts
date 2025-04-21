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

  const fetchInventories = async (forceFetch = false) => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token)
        throw new Error('Authentication tidak tersedia. Harap login ulang.')
      const storedInventories = localStorage.getItem('inventories')
      if (storedInventories && !forceFetch) {
        try {
          const parsed = JSON.parse(storedInventories)
          const validated = z.array(inventorySchema).safeParse(parsed)

          if (validated.success) {
            inventories.value = validated.data
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

      const { data, error: fetchError } = await useFetch<FetchInventoriesResponse>(useApiUrl('/inventory/inventories'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      const inventoriesData = data.value?.data?.inventories
      if (!inventoriesData) {
        throw new Error('Data inventory tidak ditemukan di response server.')
      }

      const parsed = z.array(inventorySchema).safeParse(inventoriesData)
      if (!parsed.success) {
        console.error('Zod validation error:', parsed.error)
        throw new Error('Data dari server tidak valid.')
      }

      inventories.value = parsed.data
      localStorage.setItem('inventories', JSON.stringify(parsed.data))
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memuat data pengguna.'
    }
    finally {
      loading.value = false
    }
  }

  // Auto fetch once when composable is used
  fetchInventories()

  return {
    inventories,
    loading,
    error,
    fetchInventories,
  }
}

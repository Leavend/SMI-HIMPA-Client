import type { Inventory } from '~/components/inventories/data/schema'
import { inventorySchema } from '@/components/inventories/data/schema'
import { z } from 'zod'

interface EmptyDataObject {
  [key: string]: never
}

interface createInvetoryResponse {
  status: string
  message: string
  data: {
    inventory: Inventory[]
  }
}

interface updateInvetoryResponse {
  status: string
  message: string
  data: EmptyDataObject
}

interface updateInvetoryConditionResponse {
  status: string
  message: string
  data: EmptyDataObject
}

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

  const createInventory = async (formData: {
    name: string
    quantity: number
    condition: string
    code: string
  }) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()

      const token = useToken().value

      const { error: fetchError } = await useFetch<createInvetoryResponse>(
        useApiUrl('/admin/inventory'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      )

      if (fetchError.value) {
        const message = fetchError.value.data?.message || fetchError.value.message
        throw new Error(message)
      }
    }
    catch (err: any) {
      const message = err?.message || 'Terjadi kesalahan saat membuat inventaris.'
      error.value = message
      throw new Error(message)
    }
    finally {
      loading.value = false
    }
  }

  const updateInventory = async (
    formData: {
      inventoryId: string
      name: string
      quantity: number
      condition: string
    },
  ) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()

      const token = useToken().value

      const partialSchema = inventorySchema.pick({
        name: true,
        quantity: true,
        condition: true,
      })

      const parsed = partialSchema.safeParse(formData)
      if (!parsed.success)
        throw new Error(`Data update tidak valid: ${parsed.error.message}`)

      const { error: fetchError } = await useFetch<updateInvetoryResponse>(
        useApiUrl(`/admin/inventory/${formData.inventoryId}`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      )

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      // Update state lokal manual (tanpa data dari server)
      inventories.value = inventories.value.map(inv =>
        inv.inventoryId === formData.inventoryId
          ? { ...inv, ...formData }
          : inv,
      )
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memperbarui inventaris.'
    }
    finally {
      loading.value = false
    }
  }

  const updateInventoryCondition = async (
    formData: {
      inventoryId: string
      name: string
      quantity: number
      condition: string
    },
  ) => {
    loading.value = true
    error.value = null

    try {
      adminGuard()

      const token = useToken().value

      const conditionSchema = z.object({
        condition: inventorySchema.shape.condition,
      })

      const parsed = conditionSchema.safeParse({ condition: formData.condition })
      if (!parsed.success)
        throw new Error(`Kondisi tidak valid: ${parsed.error.message}`)

      const { error: fetchError } = await useFetch<updateInvetoryConditionResponse>(
        useApiUrl(`/admin/inventory/${formData.inventoryId}`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ condition: formData.condition }),
        },
      )

      if (fetchError.value)
        throw new Error(fetchError.value.message)

      // Update state lokal manual
      inventories.value = inventories.value.map(inv =>
        inv.inventoryId === formData.inventoryId
          ? { ...inv, condition: formData.condition }
          : inv,
      )
    }
    catch (err: any) {
      error.value = err.message || 'Gagal memperbarui kondisi inventaris.'
    }
    finally {
      loading.value = false
    }
  }

  return {
    inventories,
    loading,
    error,
    createInventory,
    updateInventory,
    updateInventoryCondition,
  }
}

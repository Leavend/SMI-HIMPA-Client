<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Inventory } from '../data/schema'
import { useApiUrl } from '@/composables/useApiUrl'
import { useToken } from '@/composables/useToken'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { inventorySchema } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<Inventory>
}

const props = defineProps<DataTableRowActionsProps>()
const emit = defineEmits<{
  (e: 'refetch'): void
}>()

const { fetchInventories } = useInventories()
const { updateInventory, updateInventoryCondition } = useAdminInventories()
const isLoading = ref(false)
const showForceDeleteDialog = ref(false)
const inventoryToDelete = ref<Inventory | null>(null)

const inventory = computed(() => {
  try {
    return inventorySchema.parse(props.row.original)
  }
  catch (err) {
    console.error('Error parsing inventory data:', err)
    toast.error('Gagal memuat data inventaris.')
    return {} as Inventory
  }
})

const conditions = [
  { label: 'Available', value: 'Available' },
  { label: 'Out of Stock', value: 'Out of Stock' },
  { label: 'Reserved', value: 'Reserved' },
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Discontinued', value: 'Discontinued' },
]

const showEditModal = ref(false)
const editedInventory = ref({
  name: inventory.value.name,
  quantity: inventory.value.quantity,
  condition: inventory.value.condition,
})

const token = useToken()

async function handleUpdateInventory() {
  try {
    isLoading.value = true
    await updateInventory(inventory.value.inventoryId, editedInventory.value)
    toast.success(`Inventaris "${editedInventory.value.name}" berhasil diperbarui`)
    emit('refetch')
    showEditModal.value = false
  }
  catch (err: any) {
    toast.error(err.message || 'Gagal memperbarui inventaris.')
  }
  finally {
    isLoading.value = false
  }
}

async function handleChangeCondition(_inventory: Inventory, _newCondition: string) {
  if (isLoading.value)
    return

  try {
    isLoading.value = true

    await updateInventoryCondition(_inventory.inventoryId, _newCondition)
    await fetchInventories(true)

    emit('refetch')
    toast.success(`Kondisi inventaris "${_inventory.name}" berhasil diubah ke "${_newCondition}"`)
  }
  catch (error) {
    const err = error as Error
    toast.error(err.message || 'Gagal mengubah kondisi inventaris.')
    console.error(err)
  }
  finally {
    isLoading.value = false
  }
}

async function deleteInventory(_inventory: Inventory) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/inventory/${_inventory.inventoryId}`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    if (fetchError.value) {
      console.error('Fetch error:', fetchError.value)
      throw new Error('Gagal menghapus inventaris.')
    }

    if (!data.value?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus inventaris.'

      // Cek apakah error karena ada related records (borrow details, etc.)
      if (errorMessage.includes('related') || errorMessage.includes('cascade=true')) {
        throw new Error('Inventaris tidak dapat dihapus karena memiliki riwayat peminjaman. Silakan hapus riwayat peminjaman terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Inventaris "${_inventory.name}" berhasil dihapus`)
    emit('refetch')
    await fetchInventories(true)
  }
  catch (err: any) {
    console.error('Delete inventory error:', err)
    // Hanya tampilkan pesan error yang user-friendly, bukan URL API
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus inventaris.' : err.message || 'Gagal menghapus inventaris.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

// Fungsi untuk force delete dengan cascade
async function forceDeleteInventory(_inventory: Inventory) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/inventory/${_inventory.inventoryId}?cascade=true`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    if (fetchError.value) {
      console.error('Fetch error:', fetchError.value)
      // Cek apakah error 500 (server error) - kemungkinan cascade tidak didukung
      if (fetchError.value.statusCode === 500) {
        throw new Error('Parameter cascade tidak didukung oleh server. Silakan hapus riwayat peminjaman secara manual terlebih dahulu.')
      }
      throw new Error('Gagal menghapus inventaris.')
    }

    if (!data.value?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus inventaris.'

      // Cek apakah error karena cascade tidak didukung
      if (errorMessage.includes('cascade') || errorMessage.includes('parameter')) {
        throw new Error('Parameter cascade tidak didukung. Silakan hapus riwayat peminjaman secara manual terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Inventaris "${_inventory.name}" dan semua riwayat peminjaman berhasil dihapus`)
    emit('refetch')
    await fetchInventories(true)
  }
  catch (err: any) {
    console.error('Force delete inventory error:', err)
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus inventaris.' : err.message || 'Gagal menghapus inventaris.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

async function handleDeleteClick(_inventory: Inventory) {
  inventoryToDelete.value = _inventory
  showForceDeleteDialog.value = true
}

async function confirmDelete() {
  if (!inventoryToDelete.value)
    return

  try {
    await deleteInventory(inventoryToDelete.value)
    showForceDeleteDialog.value = false
    inventoryToDelete.value = null
  }
  catch (err: any) {
    // Jika error karena related records, tampilkan opsi force delete
    if (err.message.includes('riwayat peminjaman')) {
      // Error sudah ditampilkan di toast, dialog tetap terbuka untuk opsi force delete
      return
    }
    showForceDeleteDialog.value = false
    inventoryToDelete.value = null
  }
}

async function confirmForceDelete() {
  if (!inventoryToDelete.value)
    return

  try {
    await forceDeleteInventory(inventoryToDelete.value)
    showForceDeleteDialog.value = false
    inventoryToDelete.value = null
  }
  catch {
    showForceDeleteDialog.value = false
    inventoryToDelete.value = null
  }
}

function cancelDelete() {
  showForceDeleteDialog.value = false
  inventoryToDelete.value = null
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-8 w-8 flex p-0 data-[state=open]:bg-muted"
        :disabled="isLoading"
      >
        <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[200px]">
      <DropdownMenuItem @click="() => showEditModal = true">
        Edit Inventory
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Update Condition</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup :value="inventory.condition">
            <DropdownMenuRadioItem
              v-for="cond in conditions"
              :key="cond.value"
              :value="cond.value"
              :disabled="isLoading"
              @click="() => handleChangeCondition(inventory, cond.value)"
            >
              <div class="flex items-center gap-2">
                <Loader2
                  v-if="isLoading && cond.value !== inventory.condition"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
                {{ cond.label }}
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="() => handleDeleteClick(inventory)">
        Delete
        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <Dialog v-model:open="showEditModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Inventory</DialogTitle>
        <DialogDescription>
          Perbarui informasi inventaris berikut.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <Input
          v-model="editedInventory.name"
          label="Name"
          :disabled="isLoading"
        />
        <Input
          v-model.number="editedInventory.quantity"
          label="Quantity"
          type="number"
          :disabled="isLoading"
        />
        <Select v-model="editedInventory.condition" :disabled="isLoading">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Pilih kondisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="cond in conditions"
              :key="cond.value"
              :value="cond.value"
            >
              {{ cond.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter class="mt-4">
        <Button variant="outline" @click="showEditModal = false">
          Cancel
        </Button>
        <Button :disabled="isLoading" @click="handleUpdateInventory">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="showForceDeleteDialog" @close="cancelDelete">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Konfirmasi Penghapusan Inventaris</DialogTitle>
        <DialogDescription>
          <div class="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus inventaris <strong>{{ inventoryToDelete?.name }}</strong>?
            </p>
            <div class="border border-yellow-200 rounded-lg bg-yellow-50 p-3">
              <div class="flex items-start">
                <Icon name="i-lucide-alert-triangle" class="mr-2 mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p class="text-sm text-yellow-800 font-medium">
                    Perhatian
                  </p>
                  <p class="mt-1 text-sm text-yellow-700">
                    Inventaris ini memiliki riwayat peminjaman. Jika Anda memilih "Hapus", operasi akan gagal.
                    Gunakan "Force Delete" untuk menghapus inventaris beserta semua riwayat peminjaman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="cancelDelete">
          Batal
        </Button>
        <Button variant="outline" :disabled="isLoading" @click="confirmDelete">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Hapus (Akan Gagal)
        </Button>
        <Button variant="destructive" :disabled="isLoading" @click="confirmForceDelete">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Force Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

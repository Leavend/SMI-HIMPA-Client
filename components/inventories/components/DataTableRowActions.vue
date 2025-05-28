<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Inventory } from '../data/schema'
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

async function handleUpdateInventory() {
  try {
    isLoading.value = true
    await updateInventory({
      inventoryId: inventory.value.inventoryId,
      ...editedInventory.value,
    })
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

    await updateInventoryCondition({
      inventoryId: _inventory.inventoryId,
      name: _inventory.name,
      quantity: _inventory.quantity,
      condition: _newCondition,
    })
    await fetchInventories()

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

function deleteInventory(_inventory: Inventory) {
  // TODO: Tambahkan fitur delete inventaris di sini
  toast.info(`Fitur hapus inventaris "${_inventory.name}" belum tersedia`)
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

      <DropdownMenuItem @click="() => deleteInventory(inventory)">
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
</template>

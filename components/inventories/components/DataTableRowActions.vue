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

const inventory = computed(() => inventorySchema.parse(props.row.original))
const { updateInventoryCondition } = useAdminInventories()
const isLoading = ref(false)

const conditions = [
  { label: 'Available', value: 'Available' },
  { label: 'Out of Stock', value: 'Out of Stock' },
  { label: 'Reserved', value: 'Reserved' },
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Discontinued', value: 'Discontinued' },
]

async function changeCondition(_inventory: Inventory, _newCondition: string) {
  if (isLoading.value)
    return

  try {
    isLoading.value = true
    await updateInventoryCondition(_inventory.inventoryId, _newCondition)
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
    <DropdownMenuContent align="end" class="w-[180px]">
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
              @click="() => changeCondition(inventory, cond.value)"
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
</template>

<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Borrow } from '../data/schema'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { borrowSchema } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<Borrow>
}

const props = defineProps<DataTableRowActionsProps>()
const emit = defineEmits<{
  (e: 'refetch'): void
}>()

const { fetchBorrows, confirmRequestBorrow, updateBorrow } = useAdminBorrows()
const isLoading = ref(false)
const isReturning = ref(false)

const borrow = computed(() => {
  const raw = { ...props.row.original }

  if (raw.borrowDetails && !Array.isArray(raw.borrowDetails)) {
    raw.borrowDetails = [raw.borrowDetails]
  }

  const result = borrowSchema.safeParse(raw)
  if (!result.success) {
    console.error('Error parsing borrow data:', result.error)
    toast.error('Gagal memuat data peminjaman.')
    return {} as Borrow
  }
  return result.data
})

const mainStatus = computed(() => {
  if (!borrow.value.borrowDetails?.length)
    return 'UNKNOWN'
  return borrow.value.borrowDetails[0].status
})

async function handleChangeStatus(_borrow: Borrow, _newStatus: string) {
  if (isLoading.value)
    return

  try {
    isLoading.value = true

    // Prefix unused variable with underscore
    const _result = await confirmRequestBorrow({
      borrowId: _borrow.borrowId,
      status: _newStatus as 'ACTIVE' | 'REJECTED' | 'RETURNED',
    })

    await fetchBorrows()
    emit('refetch')
    toast.success(`Status peminjaman "${_borrow.borrowId}" berhasil diubah ke "${_newStatus}"`)
  }
  catch (error) {
    const err = error as Error
    toast.error('Gagal memperbarui status. Coba lagi.')
    console.error('Status change error:', err)
  }
  finally {
    isLoading.value = false
  }
}

async function handleReturn(_borrow: Borrow) {
  if (isReturning.value)
    return

  try {
    isReturning.value = true

    // First update status to RETURNED
    await confirmRequestBorrow({
      borrowId: _borrow.borrowId,
      status: 'RETURNED',
    })

    // Then update with return date
    await updateBorrow({
      borrowId: _borrow.borrowId,
      dateReturn: new Date().toISOString(),
      status: 'RETURNED', // Make sure status is included
    })

    await fetchBorrows()
    emit('refetch')
    toast.success(`Peminjaman "${_borrow.borrowId}" telah selesai dan barang dikembalikan`)
  }
  catch (error) {
    const err = error as Error
    toast.error('Gagal menandai sebagai dikembalikan. Coba lagi.')
    console.error('Return error:', err)
  }
  finally {
    isReturning.value = false
  }
}

async function handleDelete(_borrow: Borrow) {
  try {
    isLoading.value = true
    // TODO: Implement delete functionality
    toast.info(`Fitur hapus peminjaman "${_borrow.borrowId}" belum tersedia`)
    emit('refetch')
  }
  catch (err) {
    toast.error('Gagal menghapus data.')
    console.error('Delete error:', err)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-8 w-8 flex p-0 data-[state=open]:bg-muted"
        :disabled="isLoading || isReturning"
      >
        <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-[200px]">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Edit Status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup :value="mainStatus">
            <DropdownMenuRadioItem
              value="ACTIVE"
              :disabled="isLoading || isReturning || mainStatus === 'ACTIVE'"
              @click="() => handleChangeStatus(borrow, 'ACTIVE')"
            >
              <div class="flex items-center gap-2">
                <Loader2
                  v-if="isLoading && mainStatus !== 'ACTIVE'"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
                Disetujui
              </div>
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem
              value="REJECTED"
              :disabled="isLoading || isReturning || mainStatus === 'REJECTED'"
              @click="() => handleChangeStatus(borrow, 'REJECTED')"
            >
              <div class="flex items-center gap-2">
                <Loader2
                  v-if="isLoading && mainStatus !== 'REJECTED'"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
                Ditolak
              </div>
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem
              value="RETURNED"
              :disabled="isLoading || isReturning || mainStatus === 'RETURNED'"
              @click="() => handleReturn(borrow)"
            >
              <div class="flex items-center gap-2">
                <Loader2
                  v-if="isReturning && mainStatus !== 'RETURNED'"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
                Telah Selesai
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        :disabled="isLoading || isReturning"
        @click="() => handleDelete(borrow)"
      >
        <template v-if="isLoading">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Menghapus...
        </template>
        <template v-else>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </template>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

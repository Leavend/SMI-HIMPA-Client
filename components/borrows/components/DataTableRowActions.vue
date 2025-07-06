<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Borrow } from '../data/schema'
import { useApiUrl } from '@/composables/useApiUrl'
import { useToken } from '@/composables/useToken'
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
const showForceDeleteDialog = ref(false)
const borrowToDelete = ref<Borrow | null>(null)

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

    if (_newStatus === 'RETURNED') {
      // Use updateBorrow for RETURNED status
      await updateBorrow({
        borrowId: _borrow.borrowId,
        dateReturn: new Date().toISOString(),
        status: 'RETURNED',
      } as any)
    }
    else if (_newStatus === 'ACTIVE' || _newStatus === 'REJECTED') {
      // Use confirmRequestBorrow for ACTIVE/REJECTED status
      await confirmRequestBorrow({
        borrowId: _borrow.borrowId,
        status: _newStatus as 'ACTIVE' | 'REJECTED',
      })
    }

    await fetchBorrows(true)
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

async function deleteBorrow(_borrow: Borrow) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const token = useToken()
    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/borrow/${_borrow.borrowId}`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    if (fetchError.value) {
      console.error('Fetch error:', fetchError.value)
      throw new Error('Gagal menghapus peminjaman.')
    }

    if (!data.value || !(data.value as any)?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus peminjaman.'

      // Cek apakah error karena ada related borrow details
      if (errorMessage.includes('related borrow detail') || errorMessage.includes('cascade=true')) {
        throw new Error('Peminjaman tidak dapat dihapus karena memiliki detail peminjaman. Silakan hapus detail peminjaman terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Peminjaman "${_borrow.borrowId}" berhasil dihapus`)
    emit('refetch')
    await fetchBorrows(true)
  }
  catch (err: any) {
    console.error('Delete borrow error:', err)
    // Hanya tampilkan pesan error yang user-friendly, bukan URL API
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus peminjaman.' : err.message || 'Gagal menghapus peminjaman.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

// Fungsi untuk force delete dengan cascade
async function forceDeleteBorrow(_borrow: Borrow) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const token = useToken()
    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/borrow/${_borrow.borrowId}?cascade=true`),
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
        throw new Error('Parameter cascade tidak didukung oleh server. Silakan hapus detail peminjaman secara manual terlebih dahulu.')
      }
      throw new Error('Gagal menghapus peminjaman.')
    }

    if (!data.value?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus peminjaman.'

      // Cek apakah error karena cascade tidak didukung
      if (errorMessage.includes('cascade') || errorMessage.includes('parameter')) {
        throw new Error('Parameter cascade tidak didukung. Silakan hapus detail peminjaman secara manual terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Peminjaman "${_borrow.borrowId}" dan semua detail peminjaman berhasil dihapus`)
    emit('refetch')
    await fetchBorrows(true)
  }
  catch (err: any) {
    console.error('Force delete borrow error:', err)
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus peminjaman.' : err.message || 'Gagal menghapus peminjaman.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

async function handleDeleteClick(_borrow: Borrow) {
  borrowToDelete.value = _borrow
  showForceDeleteDialog.value = true
}

async function confirmDelete() {
  if (!borrowToDelete.value)
    return

  try {
    await deleteBorrow(borrowToDelete.value)
    showForceDeleteDialog.value = false
    borrowToDelete.value = null
  }
  catch (err: any) {
    // Jika error karena related records, tampilkan opsi force delete
    if (err.message.includes('detail peminjaman')) {
      // Error sudah ditampilkan di toast, dialog tetap terbuka untuk opsi force delete
      return
    }
    showForceDeleteDialog.value = false
    borrowToDelete.value = null
  }
}

async function confirmForceDelete() {
  if (!borrowToDelete.value)
    return

  try {
    await forceDeleteBorrow(borrowToDelete.value)
    showForceDeleteDialog.value = false
    borrowToDelete.value = null
  }
  catch {
    showForceDeleteDialog.value = false
    borrowToDelete.value = null
  }
}

function cancelDelete() {
  showForceDeleteDialog.value = false
  borrowToDelete.value = null
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
        @click="() => handleDeleteClick(borrow)"
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

  <Dialog :open="showForceDeleteDialog" @close="cancelDelete">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Konfirmasi Penghapusan Peminjaman</DialogTitle>
        <DialogDescription>
          <div class="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus peminjaman <strong>{{ borrowToDelete?.borrowId }}</strong>?
            </p>
            <div class="border border-yellow-200 rounded-lg bg-yellow-50 p-3">
              <div class="flex items-start">
                <Icon name="i-lucide-alert-triangle" class="mr-2 mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p class="text-sm text-yellow-800 font-medium">
                    Perhatian
                  </p>
                  <p class="mt-1 text-sm text-yellow-700">
                    Peminjaman ini memiliki detail peminjaman. Jika Anda memilih "Hapus", operasi akan gagal.
                    Gunakan "Force Delete" untuk menghapus peminjaman beserta semua detail peminjaman.
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

<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { User } from '../data/schema'
import type { Role } from '~/types/role'
import { useApiUrl } from '@/composables/useApiUrl'
import { useToken } from '@/composables/useToken'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { roles, userSchema } from '../data/schema'

const props = defineProps<DataTableRowActionsProps>()
const emit = defineEmits<{
  (e: 'refetch'): void
}>()
const token = useToken()
const { fetchUsers } = useAdminUsers()

interface DataTableRowActionsProps {
  row: Row<User>
}

const user = computed(() => userSchema.parse(props.row.original))

const { updateUserRole } = useAdminUsers()
const isLoading = ref(false)
const showForceDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)

async function changeRole(_user: User, _newRole: Role) {
  if (isLoading.value)
    return

  try {
    isLoading.value = true

    if (!roles.some(role => role.value === _newRole)) {
      throw new Error('Peran tidak valid.')
    }

    await updateUserRole(_user.userId, _newRole)
    emit('refetch') // panggil parent buat refresh data dari server
    toast.success(`Peran pengguna "${_user.username}" berhasil diubah ke ${_newRole}`)
  }
  catch (error) {
    const err = error as Error
    toast.error(err.message || 'Gagal mengubah peran pengguna.')
    console.error(err)
  }
  finally {
    isLoading.value = false
  }
}

async function deleteUser(_user: User) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/user/${_user.userId}`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    if (fetchError.value) {
      console.error('Fetch error:', fetchError.value)
      throw new Error('Gagal menghapus pengguna.')
    }

    if (!data.value?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus pengguna.'

      // Cek apakah error karena ada related borrow records
      if (errorMessage.includes('related borrow record') || errorMessage.includes('cascade=true')) {
        throw new Error('Pengguna tidak dapat dihapus karena memiliki riwayat peminjaman. Silakan hapus riwayat peminjaman terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Pengguna "${_user.username}" berhasil dihapus`)
    emit('refetch')
    await fetchUsers(true)
  }
  catch (err: any) {
    console.error('Delete user error:', err)
    // Hanya tampilkan pesan error yang user-friendly, bukan URL API
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus pengguna.' : err.message || 'Gagal menghapus pengguna.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

// Fungsi untuk force delete dengan cascade
async function forceDeleteUser(_user: User) {
  if (isLoading.value)
    return
  try {
    isLoading.value = true

    const { data, error: fetchError } = await useFetch(
      useApiUrl(`/admin/user/${_user.userId}?cascade=true`),
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
      throw new Error('Gagal menghapus pengguna.')
    }

    if (!data.value?.status) {
      console.error('API response error:', data.value)
      const errorMessage = (data.value as any)?.message || 'Gagal menghapus pengguna.'

      // Cek apakah error karena cascade tidak didukung
      if (errorMessage.includes('cascade') || errorMessage.includes('parameter')) {
        throw new Error('Parameter cascade tidak didukung. Silakan hapus riwayat peminjaman secara manual terlebih dahulu.')
      }

      throw new Error(errorMessage)
    }

    toast.success(`Pengguna "${_user.username}" dan semua riwayat peminjaman berhasil dihapus`)
    emit('refetch')
    await fetchUsers(true)
  }
  catch (err: any) {
    console.error('Force delete user error:', err)
    const errorMessage = err.message?.includes('http') ? 'Gagal menghapus pengguna.' : err.message || 'Gagal menghapus pengguna.'
    toast.error(errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

async function handleDeleteClick(_user: User) {
  userToDelete.value = _user
  showForceDeleteDialog.value = true
}

async function confirmDelete() {
  if (!userToDelete.value)
    return

  try {
    await deleteUser(userToDelete.value)
    showForceDeleteDialog.value = false
    userToDelete.value = null
  }
  catch (err: any) {
    // Jika error karena related records, tampilkan opsi force delete
    if (err.message.includes('riwayat peminjaman')) {
      // Error sudah ditampilkan di toast, dialog tetap terbuka untuk opsi force delete
      return
    }
    showForceDeleteDialog.value = false
    userToDelete.value = null
  }
}

async function confirmForceDelete() {
  if (!userToDelete.value)
    return

  try {
    await forceDeleteUser(userToDelete.value)
    showForceDeleteDialog.value = false
    userToDelete.value = null
  }
  catch {
    showForceDeleteDialog.value = false
    userToDelete.value = null
  }
}

function cancelDelete() {
  showForceDeleteDialog.value = false
  userToDelete.value = null
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
        <span class="sr-only">Buka menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[180px]">
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Ubah Peran</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup :value="user.role">
            <DropdownMenuRadioItem
              v-for="role in roles"
              :key="role.value"
              :value="role.value"
              :disabled="isLoading"
              @click="() => changeRole(user, role.value as Role)"
            >
              <div class="flex items-center gap-2">
                <Loader2
                  v-if="isLoading && role.value !== user.role"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
                {{ role.label }}
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="() => handleDeleteClick(user)">
        Hapus
        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <Dialog :open="showForceDeleteDialog" @close="cancelDelete">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Konfirmasi Penghapusan Pengguna</DialogTitle>
        <DialogDescription>
          <div class="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus pengguna <strong>{{ userToDelete?.username }}</strong>?
            </p>
            <div class="border border-yellow-200 rounded-lg bg-yellow-50 p-3">
              <div class="flex items-start">
                <Icon name="i-lucide-alert-triangle" class="mr-2 mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p class="text-sm text-yellow-800 font-medium">
                    Perhatian
                  </p>
                  <p class="mt-1 text-sm text-yellow-700">
                    Pengguna ini memiliki riwayat peminjaman. Jika Anda memilih "Hapus", operasi akan gagal.
                    Gunakan "Force Delete" untuk menghapus pengguna beserta semua riwayat peminjaman.
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

<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { User } from '../data/schema'
import type { Role } from '~/types/role'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { roles, userSchema } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<User>
}

const props = defineProps<DataTableRowActionsProps>()

const emit = defineEmits<{
  (e: 'refetch'): void
}>()

const user = computed(() => userSchema.parse(props.row.original))

const { updateUserRole } = useAdminUsers()
const isLoading = ref(false)

async function changeRole(_user: User, _newRole: Role) {
  if (isLoading.value)
    return

  try {
    isLoading.value = true

    if (!roles.some(role => role.value === _newRole)) {
      throw new Error('Invalid role selected.')
    }

    await updateUserRole(_user.userId, _newRole)
    emit('refetch') // panggil parent buat refresh data dari server
    toast.success(`Role user "${_user.username}" berhasil diubah ke ${_newRole}`)
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

function deleteUser(_user: User) {
  // TODO: Tambahkan fitur delete user di sini
  toast.info(`Fitur delete user "${_user.username}" belum tersedia`)
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
        <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
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
      <DropdownMenuItem @click="() => deleteUser(user)">
        Delete
        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

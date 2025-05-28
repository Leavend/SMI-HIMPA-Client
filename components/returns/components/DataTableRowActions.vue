<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Return } from '../data/schema'
import { toast } from 'vue-sonner'

interface DataTableRowActionsProps {
  row: Row<Return>
}

defineProps<DataTableRowActionsProps>()
defineEmits<{
  (e: 'refetch'): void
}>()

function handleDisabledFeature() {
  toast.info('Fitur ini belum tersedia.')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-8 w-8 flex p-0 data-[state=open]:bg-muted"
        disabled
      >
        <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-[200px]">
      <DropdownMenuLabel class="text-xs text-muted-foreground">
        Fitur belum aktif
      </DropdownMenuLabel>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled>
          Edit Status
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value="UNKNOWN">
            <DropdownMenuRadioItem
              value="ACTIVE"
              disabled
              @click="handleDisabledFeature"
            >
              Disetujui
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem
              value="REJECTED"
              disabled
              @click="handleDisabledFeature"
            >
              Ditolak
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem
              value="RETURNED"
              disabled
              @click="handleDisabledFeature"
            >
              Telah Selesai
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        disabled
        @click="handleDisabledFeature"
      >
        Delete
        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Return } from '../data/schema' // Pastikan path ini benar
import { Icon } from '#components' // Atau sesuaikan dengan cara Anda mengimpor ikon
import { Button } from '@/components/ui/button'

import { computed } from 'vue'
import { borrowStatuses } from '../data/data' // Pastikan path ini benar
// Impor komponen yang dibutuhkan
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<Return>
}

const props = defineProps<DataTableToolbarProps>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

// Computed property untuk mengecek apakah filter dateBorrow aktif
const isDateBorrowFilterActive = computed(() => {
  return props.table.getColumn('dateBorrow')?.getFilterValue() !== undefined
})

// Fungsi untuk menangani update dari DatePicker
function setDateBorrowFilter(value: string | null) {
  props.table.getColumn('dateBorrow')?.setFilterValue(value === null ? undefined : value)
}

// Fungsi untuk membersihkan filter dateBorrow
function clearDateBorrowFilter() {
  props.table.getColumn('dateBorrow')?.setFilterValue(undefined)
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <BaseDatePicker
        :model-value="(table.getColumn('dateBorrow')?.getFilterValue() as string | null) ?? null"
        class="w-[180px] sm:w-[200px]"
        @update:model-value="setDateBorrowFilter"
      />

      <Button
        v-if="isDateBorrowFilterActive"
        variant="ghost"
        class="h-9 shrink-0 px-3" aria-label="Clear date filter"
        @click="clearDateBorrowFilter"
      >
        <Icon name="i-radix-icons-cross-1" class="mr-1 h-4 w-4" />
        Hapus Filter
      </Button>

      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        title="Status"
        :options="borrowStatuses"
      >
        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-8 px-2 lg:px-3"
          @click="table.resetColumnFilters()"
        >
          Atur Ulang
          <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
        </Button>
      </DataTableFacetedFilter>
    </div>
    <div class="flex items-center gap-2">
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>

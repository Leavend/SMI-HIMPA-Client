<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Inventory } from '../data/schema'
import { computed } from 'vue'
import { conditions } from '../data/data'
import InventoryCreateModal from '../modal/InventoryCreateModal.vue'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<Inventory>
}

const props = defineProps<DataTableToolbarProps>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        placeholder="Filter barang..."
        :model-value="(table.getColumn('name')?.getFilterValue() as string) ?? ''"
        class="h-8 w-[150px] lg:w-[250px]"
        @input="table.getColumn('name')?.setFilterValue($event.target.value)"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('condition')"
        :column="table.getColumn('condition')"
        title="Kondisi"
        :options="conditions"
      >
        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-8 px-2 lg:px-3"
          @click="table.resetColumnFilters()"
        >
          Reset
          <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
        </Button>
      </datatablefacetedfilter>
    </div>
    <!-- Tambahkan tombol di sebelah kanan -->
    <div class="flex items-center gap-2">
      <InventoryCreateModal />
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>

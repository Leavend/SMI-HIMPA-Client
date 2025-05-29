import type { ColumnDef } from '@tanstack/vue-table'
import type { BorrowDetail, Return } from '../data/schema'
import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import { borrowStatuses } from '../data/data'
import DataTableColumnHeader from './DataTableColumnHeader.vue'

export const columns: ColumnDef<Return>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:checked': value => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, {
      'checked': row.getIsSelected(),
      'onUpdate:checked': value => row.toggleSelected(!!value),
      'ariaLabel': 'Select row',
      'class': 'translate-y-0.5',
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'inventoryName',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Inventory Name' }),
    cell: ({ row }) => {
      const borrowDetails = row.original.borrow?.borrowDetails || []
      const inventoryName = borrowDetails[0]?.inventory?.name ?? 'Tidak ada nama'
      return h('span', { class: 'font-medium' }, inventoryName)
    },
  },
  {
    accessorKey: 'dateBorrow',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date Borrowed' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateBorrow'))
      return h('span', { class: 'font-medium' }, date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }))
    },
  },
  {
    accessorKey: 'dateReturn',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date Returned' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateReturn'))
      return h('span', { class: 'font-medium' }, date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }))
    },
  },
  {
    accessorKey: 'lateDays',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Late Days' }),
    cell: ({ row }) => h('span', { class: 'font-medium text-red-500 text-center block' }, row.getValue('lateDays')),
  },
  {
    id: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const borrowDetails = row.original.borrow?.borrowDetails || []
      if (borrowDetails.length === 0)
        return h('span', 'No status available')

      return h('div', { class: 'flex flex-col gap-1' }, borrowDetails.map((detail: BorrowDetail) => {
        const status = borrowStatuses.find(s => s.value === detail.status)
        return h('div', {
          key: detail.inventory?.name ?? Math.random(),
          class: 'flex items-center',
        }, [
          status?.icon && h(status.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
          h('span', status?.label || 'Unknown'),
        ])
      }))
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
]

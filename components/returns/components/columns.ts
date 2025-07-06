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
      'ariaLabel': 'Pilih semua',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, {
      'checked': row.getIsSelected(),
      'onUpdate:checked': value => row.toggleSelected(!!value),
      'ariaLabel': 'Pilih baris',
      'class': 'translate-y-0.5',
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'inventoryName',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nama Barang' }),
    cell: ({ row }) => {
      const borrowDetails = row.original.borrow?.borrowDetails || []
      const inventoryName = borrowDetails[0]?.inventory?.name ?? 'Tidak ada nama'
      return h('span', { class: 'font-medium' }, inventoryName)
    },
  },
  {
    accessorKey: 'dateBorrow',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Tanggal Pinjam' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateBorrow'))
      return h('span', { class: 'font-medium' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    },
    filterFn: (row, _id, filterValue: string) => {
      if (!filterValue)
        return true
      const rowDate = new Date(row.getValue('dateBorrow'))
      const formatted = rowDate.toISOString().split('T')[0] // yyyy-mm-dd
      return formatted === filterValue
    },
  },
  {
    accessorKey: 'dateReturn',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Tanggal Kembali' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateReturn'))
      return h('span', { class: 'font-medium' }, date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }))
    },
  },
  {
    accessorKey: 'lateDays',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Hari Terlambat' }),
    cell: ({ row }) => h('span', { class: 'font-medium text-red-500 text-center block' }, row.getValue('lateDays')),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status Peminjaman' }),
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
    filterFn: (row, _id, filterValues: string[]) => {
      const borrowDetails = row.original.borrow?.borrowDetails || []
      const statuses = borrowDetails.map((detail: BorrowDetail) => detail.status)
      return statuses.some(status => filterValues.includes(status))
    },
  },
]

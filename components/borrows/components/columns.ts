import type { ColumnDef } from '@tanstack/vue-table'
import type { Borrow, BorrowDetail } from '../data/schema'
import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import { borrowStatuses } from '../data/data'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

const { fetchBorrows } = useAdminBorrows()

export const columns: ColumnDef<Borrow>[] = [
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
    accessorKey: 'inventoryName',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Inventory Name' }),
    cell: ({ row }) => {
      const rawBorrowDetails = (row.original as Borrow & { borrowDetails?: BorrowDetail[] }).borrowDetails
      const borrowDetails = Array.isArray(rawBorrowDetails)
        ? rawBorrowDetails
        : rawBorrowDetails ? [rawBorrowDetails] : []

      // Menampilkan nama inventory dari borrowDetails pertama, jika ada
      const inventoryName = borrowDetails.length > 0 ? borrowDetails[0].inventory?.name : 'Tidak ada nama'
      return h('span', { class: 'font-medium' }, inventoryName)
    },
  },
  {
    id: 'username', // <- id biasa, bukan accessorKey
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Username' }),
    cell: ({ row }) => {
      const user = (row.original as Borrow).user
      const username = user?.username || 'Tidak ada user'
      return h('span', { class: 'font-medium' }, username)
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Quantity' }),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('quantity')),
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
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const rawBorrowDetails = (row.original as Borrow & { borrowDetails?: BorrowDetail[] }).borrowDetails
      const borrowDetails = Array.isArray(rawBorrowDetails)
        ? rawBorrowDetails
        : rawBorrowDetails ? [rawBorrowDetails] : []

      if (borrowDetails.length === 0)
        return h('span', 'No status available')

      return h('div', { class: 'flex flex-col gap-1' }, borrowDetails.map((detail: BorrowDetail) => {
        const status = borrowStatuses.find(status => status.value === detail.status)
        return h('div', { key: detail.borrowDetailId, class: 'flex items-center' }, [
          status?.icon && h(status.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
          h('span', status?.label || 'Unknown'),
        ])
      }))
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, value) => {
      const rawBorrowDetails = (row.original as Borrow & { borrowDetails?: BorrowDetail[] }).borrowDetails
      const borrowDetails = Array.isArray(rawBorrowDetails) ? rawBorrowDetails : rawBorrowDetails ? [rawBorrowDetails] : []
      const statuses = borrowDetails.map(detail => detail.status)
      return statuses.some(status => value.includes(status))
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Created At' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return h('span', { class: 'font-medium' }, date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'Asia/Makassar',
      }))
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => h(DataTableRowActions, {
      row,
      onRefetch: () => fetchBorrows(true),
    }),
  },
]

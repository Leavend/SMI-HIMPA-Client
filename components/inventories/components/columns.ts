import type { ColumnDef } from '@tanstack/vue-table'
import type { Inventory } from '../data/schema'
import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import { conditions } from '../data/data'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

const { fetchInventories } = useInventories()

export const columns: ColumnDef<Inventory>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:checked': value => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Pilih semua',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, { 'checked': row.getIsSelected(), 'onUpdate:checked': value => row.toggleSelected(!!value), 'ariaLabel': 'Select row', 'class': 'translate-y-0.5' }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nama Barang' }),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('name')),
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Jumlah' }),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('quantity')),
  },
  {
    accessorKey: 'condition',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Kondisi' }),

    cell: ({ row }) => {
      const condition = conditions.find(
        condition => condition.value === row.getValue('condition'),
      )

      if (!condition)
        return null

      return h('div', { class: 'flex w-[100px] items-center' }, [
        condition.icon && h(condition.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
        h('span', condition.label),
      ])
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Kode Barang' }),
    cell: ({ row }) => h('div', { class: 'w-20' }, row.getValue('code')),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Dibuat Pada' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'Asia/Makassar',
      }
      return h('span', { class: 'font-medium' }, date.toLocaleString('id-ID', options))
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Diperbarui Pada' }),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'))
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'Asia/Makassar',
      }
      return h('span', { class: 'font-medium' }, date.toLocaleString('id-ID', options))
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => h(DataTableRowActions, {
      row,
      onRefetch: () => fetchInventories(true),
    }),
  },
]

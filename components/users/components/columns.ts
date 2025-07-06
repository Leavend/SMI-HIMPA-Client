import type { ColumnDef } from '@tanstack/vue-table'
import type { User } from '../data/schema'
import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import { roles } from '../data/schema'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

const { fetchUsers } = useAdminUsers()

export const columns: ColumnDef<User>[] = [
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
    accessorKey: 'username',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nama Pengguna' }),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('username')),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Email' }),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('email')),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Peran' }),
    cell: ({ row }) => {
      const role = roles.find(role => role.value === row.getValue('role'))
      if (!role)
        return null
      return h('div', { class: 'flex items-center' }, [
        h('span', role.label),
      ])
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
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
      onRefetch: () => fetchUsers(true),
    }),
  },
]

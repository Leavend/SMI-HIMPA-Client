import type { ColumnDef } from '@tanstack/vue-table'
import type { BorrowDetail, Return } from '../data/schema'
import { Badge } from '@/components/ui/badge'
import { h } from 'vue'
import { borrowStatuses } from '../data/data'

import DataTableColumnHeader from './DataTableColumnHeader.vue'

export const columns: ColumnDef<Return>[] = [
  {
    accessorKey: 'inventoryName',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Nama Inventory',
    }),
    cell: ({ row }) => {
      const inventoryName = row.original.borrow?.borrowDetails?.[0]?.inventory?.name || 'Tidak ada nama'
      return h('div', { class: 'font-medium' }, inventoryName)
    },
  },
  {
    accessorKey: 'dateBorrow',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Tanggal Pinjam',
    }),
    cell: ({ row }) => {
      const date = new Date(row.original.dateBorrow)
      return h('div', { class: 'font-medium' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    },
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'dateReturn',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Tanggal Kembali',
    }),
    cell: ({ row }) => {
      const dateReturn = row.original.dateReturn
      // Menginterpretasikan dateReturn sebagai dueDate jika status bukan RETURNED
      // Sesuai logika di controller, dateReturn di sini adalah nilai dari field ReturnModel.dateReturn
      // Untuk tampilan di kolom "Tanggal Kembali", kita mungkin ingin logika berbeda jika status belum RETURNED.
      // Namun, untuk saat ini, kita tampilkan apa adanya atau "Belum dikembalikan" jika null.
      if (!dateReturn) {
        // Jika statusnya bukan RETURNED dan dateReturn (yang adalah dueDate) ada,
        // Anda mungkin ingin menampilkannya di sini sebagai "Jatuh Tempo: [tanggal]".
        // Untuk sekarang, jika null, anggap belum ada tanggal kembali fisik.
        const primaryStatus = row.original.borrow?.borrowDetails?.[0]?.status;
        if (primaryStatus && primaryStatus !== 'RETURNED') {
            // Jika Anda menyimpan dueDate di tempat lain (misalnya r.borrow.dueDate), Anda bisa menampilkannya.
            // Jika r.dateReturn adalah dueDate untuk status non-RETURNED, dan ia ada, tampilkan.
            // Untuk contoh ini, jika r.dateReturn adalah dueDate dan ada, ia akan ditampilkan di bawah.
            // Jika r.dateReturn adalah null (dan status bukan RETURNED), berarti dueDate tidak diset di r.dateReturn.
             return h(Badge, { variant: 'secondary' }, 'Belum Dikembalikan'); // Atau tampilkan dueDate jika logikanya begitu
        } else if (!dateReturn) { // Jika status RETURNED tapi dateReturn null (seharusnya tidak terjadi)
            return h(Badge, { variant: 'secondary' }, 'Belum Dikembalikan');
        }
      }
      // Jika dateReturn ada nilainya, tampilkan
      const date = new Date(dateReturn as string) // type assertion jika dateReturn pasti string di sini
      return h('div', { class: 'font-medium' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    },
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'lateDays',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Terlambat',
    }),
    cell: ({ row }) => {
      const lateDays = row.original.lateDays
      return h('div', {
        class: lateDays > 0
          ? 'text-red-600 font-medium' // Merah jika terlambat
          : 'text-green-600 font-medium', // Hijau jika tidak (lateDays = 0)
      }, `${lateDays} hari`)
    },
  },
  {
    accessorKey: 'status', // Anda mungkin ingin mengubah accessorKey ini jika tidak langsung relevan
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      // Mengambil hanya detail peminjaman pertama untuk status utama
      const firstDetail = row.original.borrow?.borrowDetails?.[0];

      if (!firstDetail || !firstDetail.status) {
        return h('span', { class: 'text-muted-foreground' }, 'Tidak ada status');
      }

      // Cari objek status yang sesuai dari array borrowStatuses Anda
      // Pastikan borrowStatuses memiliki entri untuk 'PENDING', 'ACTIVE', dll.
      // dengan 'label' dan 'variant' yang diinginkan.
      const statusObj = borrowStatuses.find(s => s.value === firstDetail.status);

      const validVariants = ['default', 'secondary', 'destructive', 'outline'] as const;
      type ValidVariant = typeof validVariants[number];

      let badgeVariant: ValidVariant = 'secondary'; // Default variant
      if (statusObj?.variant && validVariants.includes(statusObj.variant as ValidVariant)) {
        badgeVariant = statusObj.variant as ValidVariant;
      }

      const statusLabel = statusObj?.label || firstDetail.status || 'Unknown';

      return h('div', { class: 'flex items-center' }, [
        statusObj?.icon && h('span', { class: 'mr-2 h-4 w-4 text-muted-foreground' }, statusObj.icon),
        h(Badge, { variant: badgeVariant }, statusLabel),
      ]);
    },
    enableSorting: false,
    enableHiding: true,
  },
]

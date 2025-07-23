<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Borrow } from '../data/schema'
// 1. Impor jsPDF sebagai default dengan nama berhuruf kapital
import JSPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { computed } from 'vue'
import { toast } from 'vue-sonner' // Impor toast untuk notifikasi
import * as XLSX from 'xlsx'

import { borrowStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<Borrow>
}

const props = defineProps<DataTableToolbarProps>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

// Helper untuk mengambil data dari localStorage
function getBorrowsFromCache(): Borrow[] | null {
  const cachedData = localStorage.getItem('admin_borrows')
  if (!cachedData) {
    toast.error('Data tidak ditemukan di cache.', {
      description: 'Silakan muat ulang halaman untuk mengambil data dari server.',
    })
    return null
  }
  try {
    return JSON.parse(cachedData) as Borrow[]
  }
  catch (e) {
    toast.error('Gagal membaca data dari cache.')
    console.error('Error parsing borrows from localStorage:', e)
    return null
  }
}

// 2. Implementasi fungsi downloadPDF yang dimodifikasi
function downloadPDF() {
  const borrowsData = getBorrowsFromCache()
  if (!borrowsData)
    return // Hentikan jika data tidak ada

  const doc = new JSPDF()

  // Judul Dokumen
  doc.setFontSize(18)
  doc.text('Laporan Peminjaman Barang (Semua Data)', 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 29)

  // Definisikan kolom untuk tabel PDF
  const tableColumns = [
    { header: 'No', dataKey: 'no' },
    { header: 'Nama Barang', dataKey: 'itemName' },
    { header: 'Peminjam', dataKey: 'userName' },
    { header: 'Tgl Pinjam', dataKey: 'dateBorrow' },
    { header: 'Tgl Kembali', dataKey: 'dateReturn' },
    { header: 'Status', dataKey: 'status' },
  ]

  // Ambil data dari localStorage, bukan dari props.table
  const tableRows = borrowsData.map((borrow, index) => {
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString)
        return '-'
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    return {
      no: index + 1,
      itemName: borrow.borrowDetails?.[0]?.inventory?.name || 'N/A',
      userName: borrow.user?.username || 'N/A',
      dateBorrow: formatDate(borrow.dateBorrow),
      dateReturn: formatDate(borrow.dateReturn),
      status: borrow.borrowDetails?.[0]?.status || 'N/A', // Menggunakan status dari borrowDetails
    }
  })

  // Buat tabel menggunakan jspdf-autotable
  autoTable(doc, {
    head: [tableColumns.map(col => col.header)],
    body: tableRows.map(row => Object.values(row)),
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: 255,
      fontStyle: 'bold',
    },
  })

  doc.save('laporan-peminjaman-lengkap.pdf')
}

function downloadXLS() {
  const borrowsData = getBorrowsFromCache()
  if (!borrowsData)
    return // Hentikan jika data tidak ada

  // Ambil data dari localStorage
  const tableRows = borrowsData.map((borrow, index) => {
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString)
        return '-'
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
    return {
      'No': index + 1,
      'Nama Barang': borrow.borrowDetails?.[0]?.inventory?.name || 'N/A',
      'Peminjam': borrow.user?.username || 'N/A',
      'Tgl Pinjam': formatDate(borrow.dateBorrow),
      'Tgl Kembali': formatDate(borrow.dateReturn),
      'Status': borrow.borrowDetails?.[0]?.status || 'N/A',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(tableRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Peminjaman')

  XLSX.writeFile(workbook, 'laporan-peminjaman-lengkap.xlsx')
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        placeholder="Filter tanggal peminjaman"
        :model-value="(table.getColumn('dateBorrow')?.getFilterValue() as string) ?? ''"
        class="h-8 w-[150px] lg:w-[250px]"
        @input="table.getColumn('dateBorrow')?.setFilterValue(($event.target as HTMLInputElement).value)"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        title="Status"
        :options="borrowStatuses"
      />
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        Reset
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" @click="downloadPDF">
        Download PDF
      </Button>
      <Button variant="outline" size="sm" @click="downloadXLS">
        Download XLS
      </Button>
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>

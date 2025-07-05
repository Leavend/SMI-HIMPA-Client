<script setup lang="ts">
import { columns } from '@/components/borrows/components/columns'
import DataTable from '@/components/borrows/components/DataTable.vue'
import { toast } from 'vue-sonner'

// Ambil composable
const { borrows, loading, error, fetchBorrows } = useAdminBorrows()

onMounted(async () => {
  const token = useToken().value
  if (!token) {
    toast.error('Token tidak tersedia. Harap login ulang.')
    return
  }

  const storedBorrows = localStorage.getItem('admin_borrows')
  if (storedBorrows) {
    try {
      const parsed = JSON.parse(storedBorrows)

      if (Array.isArray(parsed) && parsed.length > 0) {
        borrows.value = parsed
        loading.value = false
        toast.success('Data peminjaman berhasil dimuat dari cache.')
      }
      else {
        throw new Error('Cache kosong atau tidak valid')
      }
    }
    catch (e) {
      console.error('Error parsing borrows from localStorage:', e)
      toast.error('Terjadi kesalahan saat memuat data dari cache. Memuat data dari server...')
      // Jika terjadi error saat parsing, panggil fetchBorrows untuk mendapatkan data dari server
      await fetchBorrows(true) // forceFetch = true agar selalu mengambil data terbaru
    }
  }
  else {
  // Jika tidak ada di localStorage, langsung fetch data
    toast.info('Memuat data peminjaman dari server...')
    await fetchBorrows(true) // forceFetch = true agar selalu mengambil data terbaru
  }
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Daftar Peminjaman
        </h2>
        <p class="text-muted-foreground">
          Berikut adalah daftar semua peminjaman.
        </p>
      </div>
    </div>

    <div v-if="loading">
      <p>Memuat...</p>
    </div>

    <div v-if="error">
      <p class="text-red-500">
        Error: {{ error }}
      </p>
    </div>

    <DataTable
      v-if="!loading && !error"
      :key="borrows.length"
      :data="borrows"
      :columns="columns"
      :loading="loading"
    />
  </div>
</template>

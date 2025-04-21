<script setup lang="ts">
import { columns } from '@/components/inventories/components/columns'
import DataTable from '@/components/inventories/components/DataTable.vue'
import { toast } from 'vue-sonner'

// Mengambil data dari composable `useInventories`
const { inventories, loading, error, fetchInventories } = useInventories()

// Pastikan data selalu dimuat saat halaman dimuat atau di-refresh
onMounted(async () => {
  const token = useToken().value
  if (!token) {
    toast.error('Token tidak tersedia. Harap login ulang.')
    return
  }

  // Mengecek apakah data pengguna sudah ada di localStorage
  const storedUsers = localStorage.getItem('Inventories')
  if (storedUsers) {
    try {
      const parsed = JSON.parse(storedUsers)

      if (Array.isArray(parsed) && parsed.length > 0) {
        inventories.value = parsed
        loading.value = false
        toast.success('Data pengguna berhasil dimuat dari cache.')
      }
      else {
        throw new Error('Cache kosong atau tidak valid')
      }
    }
    catch (e) {
      console.error('Error parsing Inventories from localStorage:', e)
      toast.error('Terjadi kesalahan saat memuat data dari cache. Memuat data dari server...')
      // Jika terjadi error saat parsing, panggil fetchInventories untuk mendapatkan data dari server
      await fetchInventories(true) // forceFetch = true agar selalu mengambil data terbaru
    }
  }
  else {
    // Jika tidak ada di localStorage, langsung fetch data
    toast.info('Memuat data Inventory dari server...')
    await fetchInventories(true) // forceFetch = true agar selalu mengambil data terbaru
  }
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Users List
        </h2>
        <p class="text-muted-foreground">
          Here's a list of all Inventories.
        </p>
      </div>
    </div>

    <!-- Menampilkan pesan loading saat data sedang dimuat -->
    <div v-if="loading">
      <p>Loading...</p>
    </div>

    <!-- Menampilkan pesan error jika ada masalah dengan pengambilan data -->
    <div v-if="error">
      <p>Error: {{ error }}</p>
    </div>

    <!-- Menampilkan tabel data pengguna jika tidak ada loading atau error -->
    <DataTable
      v-if="!loading && !error"
      :key="inventories.length"
      :data="inventories"
      :columns="columns"
      :loading="loading"
    />
  </div>
</template>

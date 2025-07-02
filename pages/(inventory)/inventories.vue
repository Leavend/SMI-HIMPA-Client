<script setup lang="ts">
import { columns } from '@/components/inventories/components/columns'
import DataTable from '@/components/inventories/components/DataTable.vue'
import { toast } from 'vue-sonner'

// Ambil composable
const { inventories, loading, error, fetchInventories } = useInventories()

onMounted(async () => {
  const token = useToken().value
  if (!token) {
    toast.error('Token tidak tersedia. Harap login ulang.')
    return
  }

  const storedInventories = localStorage.getItem('inventories')
  if (storedInventories) {
    try {
      const parsed = JSON.parse(storedInventories)

      if (Array.isArray(parsed) && parsed.length > 0) {
        inventories.value = parsed
        loading.value = false
        toast.success('Data inventaris berhasil dimuat dari cache.')
      }
      else {
        throw new Error('Cache kosong atau tidak valid')
      }
    }
    catch (e) {
      console.error('Error parsing inventories from localStorage:', e)
      toast.error('Terjadi kesalahan saat memuat data dari cache. Memuat data dari server...')
      // Jika terjadi error saat parsing, panggil fetchInventories untuk mendapatkan data dari server
      await fetchInventories(true) // forceFetch = true agar selalu mengambil data terbaru
    }
  }
  else {
  // Jika tidak ada di localStorage, langsung fetch data
    toast.info('Memuat data inventaris dari server...')
    await fetchInventories(true) // forceFetch = true agar selalu mengambil data terbaru
  }
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Daftar Inventaris
        </h2>
        <p class="text-muted-foreground">
          Berikut adalah daftar semua inventaris.
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
      :key="inventories.length"
      :data="inventories"
      :columns="columns"
      :loading="loading"
    />
  </div>
</template>

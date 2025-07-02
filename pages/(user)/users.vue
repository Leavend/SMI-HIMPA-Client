<script setup lang="ts">
import { columns } from '@/components/users/components/columns'
import DataTable from '@/components/users/components/DataTable.vue'
import { toast } from 'vue-sonner'

// Mengambil data dari composable `useAdminUsers`
const { users, loading, error, fetchUsers } = useAdminUsers()

// Pastikan data selalu dimuat saat halaman dimuat atau di-refresh
onMounted(async () => {
  const token = useToken().value
  if (!token) {
    toast.error('Token tidak tersedia. Harap login ulang.')
    return
  }

  // Mengecek apakah data pengguna sudah ada di localStorage
  const storedUsers = localStorage.getItem('users')
  if (storedUsers) {
    try {
      const parsed = JSON.parse(storedUsers)

      if (Array.isArray(parsed) && parsed.length > 0) {
        users.value = parsed
        loading.value = false
        toast.success('Data pengguna berhasil dimuat dari cache.')
      }
      else {
        throw new Error('Cache kosong atau tidak valid')
      }
    }
    catch (e) {
      console.error('Error parsing users from localStorage:', e)
      toast.error('Terjadi kesalahan saat memuat data dari cache. Memuat data dari server...')
      // Jika terjadi error saat parsing, panggil fetchUsers untuk mendapatkan data dari server
      await fetchUsers(true) // forceFetch = true agar selalu mengambil data terbaru
    }
  }
  else {
    // Jika tidak ada di localStorage, langsung fetch data
    toast.info('Memuat data pengguna dari server...')
    await fetchUsers(true) // forceFetch = true agar selalu mengambil data terbaru
  }
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Daftar Pengguna
        </h2>
        <p class="text-muted-foreground">
          Berikut adalah daftar semua pengguna.
        </p>
      </div>
    </div>

    <!-- Menampilkan pesan loading saat data sedang dimuat -->
    <div v-if="loading">
      <p>Memuat...</p>
    </div>

    <!-- Menampilkan pesan error jika ada masalah dengan pengambilan data -->
    <div v-if="error">
      <p>Error: {{ error }}</p>
    </div>

    <!-- Menampilkan tabel data pengguna jika tidak ada loading atau error -->
    <DataTable
      v-if="!loading && !error"
      :key="users.length"
      :data="users"
      :columns="columns"
      :loading="loading"
    />
  </div>
</template>

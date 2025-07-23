<script setup lang="ts">
import { columns } from '@/components/borrows/components/columns'
import DataTable from '@/components/borrows/components/DataTable.vue'
import { computed, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'

// Ambil composable
const { borrows, loading, error, fetchBorrows } = useAdminBorrows()
const authUserCookie = useAuthUser()

// ambil role user dari cookie
const userRole = computed(() => {
  return authUserCookie.value?.role || null
})

const errorMessage = computed(() => {
  if (!error.value)
    return null
  if (error.value !== null && error.value !== undefined && (error.value as any) instanceof Error)
    return (error.value as any).message
  if (typeof error.value === 'string')
    return error.value
  if (error.value && typeof (error.value as any).message === 'string')
    return (error.value as any).message
  return 'Tidak dapat memuat data.'
})

async function loadBorrows() {
  // jika role user bukan admin, redirect ke halaman lain
  if (userRole.value !== 'ADMIN') {
    navigateTo('/')
  }

  try {
    await fetchBorrows()
  }
  catch (err) {
    console.error('Gagal memuat data pengembalian:', err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBorrows()
})

watch(userRole, (newRole, oldRole) => {
  if (newRole && newRole !== oldRole) {
    loadBorrows()
  }
}, { immediate: true })

watch(error, (newError) => {
  if (newError) {
    const messageToDisplay = errorMessage.value || 'Terjadi kesalahan.'
    toast.error(messageToDisplay)
    error.value = null
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

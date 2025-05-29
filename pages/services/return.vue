<script setup lang="ts">
import { columns } from '@/components/returns/components/columns'
import DataTable from '@/components/returns/components/DataTable.vue'
import { computed, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'

const { returns, loading, error, fetchReturnsByUserId } = useReturns()
const authUserCookie = useAuthUser()

const userId = computed(() => {
  return authUserCookie.value?.userId || null
})

const errorMessage = computed(() => {
  if (!error.value) return null
  if (error.value instanceof Error) return error.value.message
  if (typeof error.value === 'string') return error.value
  if (error.value && typeof (error.value as any).message === 'string') return (error.value as any).message
  return 'Tidak dapat memuat data.'
})

// Fungsi memuat data pengembalian
async function loadReturns() {
  if (!userId.value) {
    toast.error('User belum login atau ID tidak ditemukan.')
    return
  }

  try {
    await fetchReturnsByUserId(userId.value)
  } catch (err) {
    // Error sudah ditangani oleh watch(error)
  }
}

// Muat data saat komponen pertama kali dipasang
onMounted(() => {
  loadReturns()
})

// Watch perubahan userId untuk reload data
watch(userId, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    loadReturns()
  }
}, { immediate: true })

// Watch error dan tampilkan toast
watch(error, (newError) => {
  if (newError) {
    const messageToDisplay = errorMessage.value || 'Terjadi kesalahan.'
    toast.error(messageToDisplay)

    // Clear error agar tidak muncul toast berulang
    error.value = null
  }
})
</script>

<template>
  <ServicesLayout>
    <div v-if="loading" class="py-8 text-center">
      Memuat data pengembalian...
    </div>

    <div v-else-if="errorMessage && !returns?.length" class="py-8 text-center text-red-500">
      <p>Terjadi kesalahan: {{ errorMessage }}</p>
      <button
        @click="loadReturns"
        class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Coba Lagi
      </button>
    </div>

    <DataTable
      v-else-if="returns?.length"
      :data="returns"
      :columns="columns"
      :loading="loading"
    />

    <div v-else class="py-8 text-center text-gray-500">
      Tidak ada data pengembalian.
    </div>
  </ServicesLayout>
</template>

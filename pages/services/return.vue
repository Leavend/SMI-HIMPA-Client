<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { columns } from '@/components/returns/components/columns';
import DataTable from '@/components/returns/components/DataTable.vue';
import { toast } from 'vue-sonner'; // Make sure vue-sonner is correctly installed and configured

// Assuming useReturns() and useAuthUser() are properly imported or globally available
const { returns, loading, error, fetchReturnsByUserId } = useReturns();
const authUserCookie = useAuthUser();

// Ambil userId dari data cookie auth-user
const userId = computed(() => {
  return authUserCookie.value?.userId || null;
});

// Computed property for the error message (can still be used or modified)
const errorMessage = computed(() => {
  if (!error.value) {
    return null;
  }

  if (error.value instanceof Error) {
    return error.value.message;
  } else if (typeof error.value === 'string') {
    return error.value;
  } else if (error.value && typeof (error.value as any).message === 'string') {
    return (error.value as any).message;
  }
  return 'Tidak dapat memuat data.';
});

// Fungsi untuk memuat data pengembalian
async function loadReturns() {
  if (userId.value) {
    // Reset error state before fetching
    // error.value = null; // If your useReturns composable doesn't do this
    await fetchReturnsByUserId(userId.value);
  } else {
    console.warn('No user ID found in auth-user cookie. Cannot fetch returns.');
    // You might want to set an error or show a toast here as well
    // error.value = "User not authenticated or ID not found.";
    // toast.error("User not authenticated or ID not found.");
  }
}

// Muat data saat komponen pertama kali dipasang
onMounted(() => {
  loadReturns();
});

// Perhatikan perubahan userId (dari cookie) dan muat ulang data jika userId berubah
watch(userId, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    loadReturns();
  }
}, { immediate: true });

// *** ADD THIS WATCHER FOR ERROR TOASTS ***
watch(error, (newError) => {
  if (newError) {
    const messageToDisplay = errorMessage.value || 'Terjadi kesalahan.'; // Use your computed errorMessage
    toast.error(messageToDisplay); // Or toast.error(newError.message) or similar

    // Optional: If you only want the toast and not the on-page error message,
    // you might prevent the on-page message from showing or clear the error
    // after toasting. However, having both can be fine.
  }
});

</script>

<template>
  <ServicesLayout>
    <div v-if="loading" class="text-center py-8">
      Memuat data pengembalian...
    </div>
    <div v-else-if="errorMessage && !returns?.length" class="text-center py-8 text-red-500">
      Terjadi kesalahan: {{ errorMessage }}
    </div>
    <DataTable
      v-else-if="returns?.length"
      :data="returns"
      :columns="columns"
      :loading="loading"
    />
    <div v-else-if="!loading && !errorMessage && !returns?.length" class="text-center py-8">
      Tidak ada data pengembalian.
    </div>
  </ServicesLayout>
</template>
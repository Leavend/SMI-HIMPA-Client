<script setup lang="ts">
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const { createBorrow, loading } = useBorrows()

// Ambil itemId dari route params
const itemId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
})

async function handleSubmit(payload: {
  userId: string
  inventoryId: string
  quantity: number
  dateBorrow: string
  dateReturn: string
  adminId: string
}) {
  loading.value = true

  try {
    const result = await createBorrow(payload)

    toast.success('Peminjaman Berhasil', {
      description: `Item ${payload.inventoryId} berhasil dipinjam`,
      action: {
        label: 'Lihat Detail',
        onClick: () => navigateTo(`/borrows`),
      },
    })

    await new Promise(resolve => setTimeout(resolve, 2000))
    await navigateTo('/dashboard')
  }
  catch (error: any) {
    toast.error('Gagal Memproses', {
      description: error?.data?.message
        || 'Terjadi kesalahan saat memproses peminjaman',
      action: {
        label: 'Coba Lagi',
        onClick: () => window.location.reload(),
      },
    })

    if (error?.data?.message?.includes('quantity')) {
      toast.warning('Stok Tidak Cukup', {
        description: 'Jumlah yang diminta melebihi stok tersedia',
      })
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <ServicesLayout>
    <BorrowRequestBorrowForm
      :is-loading="loading"
      :item-id="itemId"
      @submit="handleSubmit"
    />
  </ServicesLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'

const open = ref(false)
const name = ref('')
const quantity = ref<number | null>(null)
const condition = ref('')
const code = ref('')

const { createInventory, loading } = useAdminInventories()

const conditions = [
  { label: 'Available', value: 'Available' },
  { label: 'Out of Stock', value: 'Out of Stock' },
  { label: 'Reserved', value: 'Reserved' },
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Discontinued', value: 'Discontinued' },
]

async function onSubmit() {
  if (!name.value || !quantity.value || !condition.value || !code.value) {
    toast.error('Semua field harus diisi')
    return
  }

  try {
    await createInventory({
      name: name.value,
      quantity: quantity.value,
      condition: condition.value,
      code: code.value,
    })

    toast.success('Inventaris berhasil ditambahkan!')

    name.value = ''
    quantity.value = null
    condition.value = ''
    code.value = ''
    open.value = false
  }
  catch (e: any) {
    toast.error(e.message || 'Gagal menambahkan inventaris.')
  }
}

function openModal() {
  open.value = true
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="default" @click="openModal">
        Tambahkan Inventory
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>
        Tambah Inventaris Baru
      </DialogTitle>
      <DialogDescription>
        Masukkan data inventaris baru yang ingin ditambahkan ke dalam sistem.
      </DialogDescription>

      <div class="mt-2 space-y-4">
        <Input
          v-model="name"
          placeholder="Nama"
        />

        <Input
          :model-value="quantity ?? ''"
          type="number"
          placeholder="Jumlah"
          @update:model-value="val => quantity = val !== '' ? Number(val) : null"
        />

        <Select v-model="condition" :disabled="loading">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Pilih kondisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="cond in conditions"
              :key="cond.value"
              :value="cond.value"
            >
              {{ cond.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          v-model="code"
          placeholder="Kode"
        />
      </div>

      <DialogFooter class="mt-4">
        <Button :loading="loading" @click="onSubmit">
          Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

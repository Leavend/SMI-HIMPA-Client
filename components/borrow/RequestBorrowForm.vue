<script setup lang="ts">
import type { DateRange } from 'radix-vue'
import type { Inventory } from '~/components/inventories/data/schema'
import BaseDateRangePicker from '@/components/base/DateRangePicker.vue'
import { Button } from '@/components/ui/button'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Separator } from '@/components/ui/separator'
// 1. Impor `getLocalTimeZone`
import { type DateValue, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'

import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const props = withDefaults(defineProps<{
  isLoading?: boolean
  itemId?: string
}>(), {
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'submit', payload: {
    userId: string
    inventoryId: string
    quantity: number
    dateBorrow: string
    dateReturn: string
    adminId: string
  }): void
}>()

const authUser = useAuthUser()
const { inventories, fetchInventories } = useInventories()
const { users, fetchUsers } = useBorrows()

interface BorrowFormValues {
  inventoryId: string
  quantity: number
  dateBorrow: string
  dateReturn: string
}

const borrowFormSchema = toTypedSchema(
  z.object({
    inventoryId: z.string({ required_error: 'Tolong pilih barang' }).min(1),
    quantity: z.number({ required_error: 'Jumlah barang harus diisi' })
      .min(1, 'Jumlah barang harus minimal 1')
      .max(100, 'Jumlah barang tidak boleh melebihi 100'),
    dateBorrow: z.string({ required_error: 'Tanggal pinjam harus diisi' })
      .refine(val => val && val.match(/^\d{4}-\d{2}-\d{2}$/), {
        message: 'Format tanggal pinjam tidak valid. Gunakan format YYYY-MM-DD',
      }),
    dateReturn: z.string({ required_error: 'Tanggal kembali harus diisi' })
      .refine(val => val && val.match(/^\d{4}-\d{2}-\d{2}$/), {
        message: 'Format tanggal kembali tidak valid. Gunakan format YYYY-MM-DD',
      }),
  }).refine(
    (data) => {
      if (!data.dateBorrow || !data.dateReturn || !data.dateBorrow.match(/^\d{4}-\d{2}-\d{2}$/) || !data.dateReturn.match(/^\d{4}-\d{2}-\d{2}$/))
        return true
      try {
        return new Date(data.dateReturn) >= new Date(data.dateBorrow)
      }
      catch {
        return false
      }
    },
    {
      message: 'Tanggal kembali harus setelah tanggal pinjam',
      path: ['dateReturn'],
    },
  ),
)

const borrowForm = useForm<BorrowFormValues>({
  validationSchema: borrowFormSchema,
  initialValues: {
    quantity: 1,
    dateBorrow: '',
    dateReturn: '',
  } as BorrowFormValues,
})

const dateRangePickerValue = ref<DateRange>({ start: undefined, end: undefined })
const maxLoanWarning = ref('')
const isMaxLoanExceeded = ref(false)

function toCalendarDate(val: any) {
  if (val && typeof val.toCalendar === 'function')
    return val.toCalendar('gregory')

  return val
}
watch(dateRangePickerValue, (newRange) => {
  const start = toCalendarDate(newRange?.start)
  const end = toCalendarDate(newRange?.end)
  const startDateStr = start ? start.toString() : ''
  const endDateStr = end ? end.toString() : ''

  borrowForm.setFieldValue('dateBorrow', startDateStr)
  borrowForm.setFieldValue('dateReturn', endDateStr)

  borrowForm.validateField('dateBorrow')
  borrowForm.validateField('dateReturn')

  if (start && end) {
    const diffTime = new Date(end.toString()).getTime() - new Date(start.toString()).getTime()
    const diffDays = diffTime / (1000 * 3600 * 24) + 1
    if (diffDays > 14) {
      maxLoanWarning.value = 'Maksimal masa pinjam adalah 14 hari.'
      isMaxLoanExceeded.value = true
    }
    else {
      maxLoanWarning.value = ''
      isMaxLoanExceeded.value = false
    }
  }
  else {
    maxLoanWarning.value = ''
    isMaxLoanExceeded.value = false
  }
}, { deep: true })

onMounted(async () => {
  try {
    await Promise.all([fetchInventories(), fetchUsers()])

    if (props.itemId) {
      const itemExists = inventories.value.some(i => i.inventoryId === props.itemId)
      if (itemExists)
        borrowForm.setFieldValue('inventoryId', props.itemId)
      else
        toast.warning('Barang tidak ditemukan')
    }

    const initialDateBorrow = borrowForm.values.dateBorrow
    const initialDateReturn = borrowForm.values.dateReturn

    if (initialDateBorrow && initialDateReturn
      && initialDateBorrow.match(/^\d{4}-\d{2}-\d{2}$/)
      && initialDateReturn.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateRangePickerValue.value = {
        start: parseDate(initialDateBorrow),
        end: parseDate(initialDateReturn),
      }
    }
    else {
      // 2. Gunakan getLocalTimeZone()
      const now = today(getLocalTimeZone())
      dateRangePickerValue.value = {
        start: now,
        end: now.add({ days: 7 }),
      }
    }
  }
  catch (error) {
    let userFriendlyMessage = 'Maaf, terjadi kesalahan saat memuat data.'
    if (error instanceof Error) {
      switch (error.message) {
        case 'Failed to fetch': userFriendlyMessage = 'Gagal terhubung ke server. Mohon periksa koneksi internet Anda.'; break
        case '401 Unauthorized': userFriendlyMessage = 'Sesi Anda telah berakhir. Silakan login kembali.'; break
        case '404 Not Found': userFriendlyMessage = 'Data tidak ditemukan.'; break
        case '500 Internal Server Error': userFriendlyMessage = 'Server sedang mengalami masalah. Silakan coba lagi nanti.'; break
      }
    }
    toast.error(userFriendlyMessage)
    console.error('Error in onMounted:', error)
  }
})

function getRandomAdmin(): string {
  const admins = users.value.filter(user => user.role === 'ADMIN')
  if (admins.length === 0)
    return ''

  return admins[Math.floor(Math.random() * admins.length)].userId
}

const selectedItem = computed(() => {
  return inventories.value.find((i: Inventory) => i.inventoryId === borrowForm.values.inventoryId)
})

function getItemDisplayLabel(item: Inventory) {
  const conditionEmoji = {
    'Available': '✅',
    'Out of Stock': '❌',
    'Reserved': '🟡',
    'Damaged': '⚠️',
    'Discontinued': '⏹️',
  }[item.condition] || '❓'
  return `${conditionEmoji} ${item.name} (${item.quantity} left) - ${item.condition}`
}

const conditionClass = computed(() => {
  switch (selectedItem.value?.condition) {
    case 'Available': return 'text-green-600'
    case 'Out of Stock': return 'text-red-600'
    case 'Reserved': return 'text-yellow-600'
    case 'Damaged': return 'text-orange-600'
    case 'Discontinued': return 'text-gray-600'
    default: return ''
  }
})

const onSubmit = borrowForm.handleSubmit(async (values) => {
  if (isMaxLoanExceeded.value) {
    toast.error('Maksimal masa pinjam adalah 14 hari.')
    return
  }
  if (!values.dateBorrow || !values.dateReturn || !values.dateBorrow.match(/^\d{4}-\d{2}-\d{2}$/) || !values.dateReturn.match(/^\d{4}-\d{2}-\d{2}$/)) {
    toast.error('Tolong pilih rentang tanggal pinjam dan kembali yang valid.')
    borrowForm.validateField('dateBorrow')
    borrowForm.validateField('dateReturn')
    return
  }

  if (new Date(values.dateReturn) < new Date(values.dateBorrow)) {
    toast.error('Tanggal kembali harus setelah tanggal pinjam.')
    borrowForm.setFieldError('dateReturn', 'Tanggal kembali harus setelah tanggal pinjam.')
    return
  }

  const adminIdToAssign = getRandomAdmin()
  if (!adminIdToAssign) {
    toast.error('Gagal menugaskan admin. Silakan hubungi dukungan atau coba lagi nanti.')
    return
  }

  try {
    const payload = {
      ...values,
      userId: authUser.value?.userId || '',
      adminId: adminIdToAssign,
    }

    if (!payload.userId) {
      toast.error('Informasi pengguna tidak ditemukan. Silakan login kembali.')
      return
    }

    emit('submit', payload)
    toast.success('Permintaan pinjam berhasil dikirim!')
  }
  catch (error) {
    toast.error('Gagal mengirim permintaan', {
      description: error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga. Silakan coba lagi nanti.',
    })
  }
})

// 3. Perbaiki fungsi isDateBeforeToday agar sesuai dengan tipe data kalender
const dateToday = today(getLocalTimeZone())
function isDateBeforeToday(date: DateValue) {
  return date.compare(dateToday) < 0
}
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Pinjam Barang
    </h3>
    <p class="text-sm text-muted-foreground">
      Butuh barang? Isi form ini untuk meminta barang dari inventaris kami. Kami akan memberi tahu Anda ketika permintaan Anda disetujui!
    </p>
  </div>
  <Separator />
  <form class="space-y-6" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="inventoryId">
      <FormItem>
        <FormLabel>Barang</FormLabel>
        <Select v-bind="componentField" :disabled="props.isLoading || !inventories.length">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Pilih barang" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="item in inventories"
                :key="item.inventoryId"
                :value="item.inventoryId"
                :disabled="item.condition !== 'Available'"
              >
                <div class="flex items-center gap-2">
                  <span>{{ getItemDisplayLabel(item) }}</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

    <div v-if="selectedItem" class="grid grid-cols-2 gap-4 rounded-lg border p-4">
      <div>
        <p class="text-sm font-medium">
          Nama Barang
        </p><p>{{ selectedItem.name }}</p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Kondisi
        </p><p :class="conditionClass">
          {{ selectedItem.condition }}
        </p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Stok Tersedia
        </p><p>{{ selectedItem.quantity }}</p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Kode Barang
        </p><p class="font-mono">
          {{ selectedItem.code }}
        </p>
      </div>
    </div>

    <FormField v-slot="{ componentField }" name="quantity">
      <FormItem>
        <FormLabel>Jumlah</FormLabel>
        <FormControl>
          <Input
            type="number"
            placeholder="Masukkan jumlah"
            :min="1"
            :max="selectedItem?.quantity || 100"
            v-bind="componentField"
            :disabled="props.isLoading || !selectedItem"
          />
        </FormControl>
        <FormDescription v-if="selectedItem">
          Stok tersedia: {{ selectedItem.quantity }}
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="dateBorrow">
      <FormItem>
        <FormLabel>Tanggal Pinjam & Kembali</FormLabel>
        <FormControl>
          <BaseDateRangePicker
            v-model="dateRangePickerValue"
            :disabled="props.isLoading"
            class="w-full"
            :number-of-months="1"
            placeholder="Pilih tanggal pinjam dan kembali"
            :is-date-disabled="isDateBeforeToday"
          />
        </FormControl>
        <p v-if="maxLoanWarning" class="mt-1 text-sm text-red-600">
          {{ maxLoanWarning }}
        </p>
        <div class="mt-1 text-sm">
          <FormMessage name="dateBorrow" />
          <FormMessage name="dateReturn" />
        </div>
      </FormItem>
    </FormField>

    <Button type="submit" class="w-full" :disabled="props.isLoading || !selectedItem || !borrowForm.meta.value.valid || isMaxLoanExceeded">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-else>Pinjam Barang</span>
    </Button>
  </form>
</template>

<style scoped>
.text-green-600 {
  color: #16a34a;
}
.text-red-600 {
  color: #dc2626;
}
.text-yellow-600 {
  color: #ca8a04;
}
.text-orange-600 {
  color: #ea580c;
}
.text-gray-600 {
  color: #525252;
}
</style>

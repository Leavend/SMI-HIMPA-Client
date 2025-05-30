<script setup lang="ts">
// Pustaka untuk tanggal dan ikon
import type {
  CalendarDate,
} from '@internationalized/date'
// Komponen UI kustom (asumsi dari shadcn-vue atau serupa)
import { Button } from '@/components/ui/button'

import { Calendar } from '@/components/ui/calendar' // Komponen kalender untuk tanggal tunggal
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils' // Utilitas untuk class names
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

// Mendefinisikan props komponen
interface Props {
  modelValue?: string | null
  placeholder?: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Pilih Filter tanggal',
  disabled: false,
})

// Mendefinisikan emits untuk v-model
const emit = defineEmits(['update:modelValue'])

// Date Formatter untuk menampilkan tanggal di tombol
const df = new DateFormatter('id-ID', { // Menggunakan locale id-ID
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

// State internal untuk menyimpan tanggal sebagai objek CalendarDate
const internalDate = ref<CalendarDate | undefined>()
// State untuk mengontrol visibilitas Popover
const open = ref(false)

// Watcher untuk menyinkronkan `props.modelValue` (string) ke `internalDate` (CalendarDate)
// Ini berjalan saat komponen dimuat dan setiap kali props.modelValue berubah dari luar
watch(() => props.modelValue, (newValStr) => {
  if (newValStr && newValStr.match(/^\d{4}-\d{2}-\d{2}$/)) { // Validasi format YYYY-MM-DD
    try {
      const parsedDate = parseDate(newValStr)
      // Hanya update internalDate jika berbeda untuk menghindari loop atau re-render yang tidak perlu
      if (!internalDate.value || !parsedDate.isSameDay(internalDate.value)) {
        internalDate.value = parsedDate
      }
    }
    catch (e) {
      console.error('Error parsing modelValue date string:', newValStr, e)
      if (internalDate.value !== undefined)
        internalDate.value = undefined
    }
  }
  else if (!newValStr) { // Jika modelValue null atau string kosong
    if (internalDate.value !== undefined)
      internalDate.value = undefined
  }
}, { immediate: true }) // `immediate: true` untuk inisialisasi saat komponen dimuat

// Fungsi yang dipanggil ketika tanggal di komponen Calendar berubah
function handleDateUpdate(newCalDate: CalendarDate | undefined) {
  // Update state internal terlebih dahulu
  internalDate.value = newCalDate

  if (newCalDate) {
    // Konversi CalendarDate ke string "YYYY-MM-DD"
    const dateStr = `${newCalDate.year}-${String(newCalDate.month).padStart(2, '0')}-${String(newCalDate.day).padStart(2, '0')}`
    // Emit event hanya jika nilai string berbeda dari props.modelValue saat ini
    if (props.modelValue !== dateStr) {
      emit('update:modelValue', dateStr)
    }
    open.value = false // Tutup Popover setelah tanggal dipilih
  }
  else {
    // Jika tanggal dihapus/dikosongkan dari kalender (jika kalender mendukungnya)
    if (props.modelValue !== null) {
      emit('update:modelValue', null)
    }
    // open.value = false; // Opsional: tutup juga jika dikosongkan
  }
}

// Teks yang akan ditampilkan di tombol
const buttonDisplayText = computed(() => {
  if (internalDate.value) {
    return df.format(internalDate.value.toDate(getLocalTimeZone()))
  }
  return props.placeholder
})

// Placeholder untuk komponen Calendar (bulan mana yang ditampilkan saat pertama dibuka)
// Akan menampilkan bulan dari tanggal yang dipilih, atau bulan ini jika tidak ada tanggal
const initialCalendarDisplayDate = computed(() => internalDate.value || today(getLocalTimeZone()))
</script>

<template>
  <div :class="cn('', $attrs.class ?? '')">
    <Popover v-model:open="open">
      <PopoverTrigger as-child :disabled="props.disabled">
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          :aria-disabled="props.disabled"
          :class="cn(
            'w-full justify-start text-left font-normal',
            !internalDate && 'text-muted-foreground',
            props.disabled && 'cursor-not-allowed opacity-50',
          )"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          {{ buttonDisplayText }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="end">
        <Calendar
          :model-value="internalDate"
          initial-focus
          :placeholder="initialCalendarDisplayDate"
          weekday-format="short"
          locale="id-ID"
          :disabled="props.disabled"
          :readonly="props.disabled"
          @update:model-value="handleDateUpdate"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>

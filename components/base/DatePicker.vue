<script setup lang="ts">
import type { CalendarDate, DateValue } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { ref } from 'vue'

const df = new DateFormatter('id-ID', {
  dateStyle: 'medium',
})

const value = ref<CalendarDate>()
const open = ref(false)

function handleDateUpdate(selectedDate: DateValue | undefined) {
  if (selectedDate && 'toDate' in selectedDate) {
    value.value = selectedDate as CalendarDate
    open.value = false
  }
}
</script>

<template>
  <div :class="cn('grid gap-2', $attrs.class ?? '')">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          id="date"
          variant="outline"
          :class="cn(
            'w-[280px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <span>{{ value ? df.format(value.toDate(getLocalTimeZone())) : "Pilih tanggal" }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          :model-value="value"
          initial-focus
          :placeholder="value || today(getLocalTimeZone())"
          weekday-format="short"
          @update:model-value="handleDateUpdate"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>

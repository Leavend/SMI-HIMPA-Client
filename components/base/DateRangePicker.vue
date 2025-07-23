<script setup lang="ts">
import type { DateRange } from 'radix-vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { RangeCalendar } from '@/components/ui/range-calendar'
import { cn } from '@/lib/utils'

import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'

const props = defineProps<{
  isDateDisabled?: (date: any) => boolean
}>()

const modelValue = defineModel<DateRange>({ required: true })

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

const now = today(getLocalTimeZone())
</script>

<template>
  <div :class="cn('grid gap-2', $attrs.class ?? '')">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          id="date"
          variant="outline"
          :class="cn(
            'w-full justify-start text-left font-normal',
            !modelValue?.start && 'text-muted-foreground',
          )"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />

          <template v-if="modelValue?.start">
            <template v-if="modelValue.end">
              {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }} - {{ df.format(modelValue.end.toDate(getLocalTimeZone())) }}
            </template>
            <template v-else>
              {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
            </template>
          </template>
          <template v-else>
            Pilih tanggal
          </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="end">
        <RangeCalendar
          v-model="modelValue"
          weekday-format="short"
          :number-of-months="2"
          initial-focus
          :placeholder="now"
          :is-date-disabled="props.isDateDisabled"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>

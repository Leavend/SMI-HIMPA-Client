<script setup lang="ts">
import { cn } from '@/lib/utils'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { h } from 'vue'
import * as z from 'zod'
import { buttonVariants } from '~/components/ui/button'
import { toast } from '~/components/ui/toast'

const appearanceFormSchema = toTypedSchema(z.object({
  theme: z.enum(['light', 'dark'], {
    required_error: 'Please select a theme.',
  }),
  font: z.enum(['inter', 'manrope', 'system'], {
    invalid_type_error: 'Select a font',
    required_error: 'Please select a font.',
  }),
}))

const { handleSubmit } = useForm({
  validationSchema: appearanceFormSchema,
  initialValues: {
    theme: 'light',
    font: 'inter',
  },
})

const color = useColorMode()

const onSubmit = handleSubmit((values) => {
  toast({
    title: 'You submitted the following values:',
    description: h('pre', { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' }, h('code', { class: 'text-white' }, JSON.stringify(values, null, 2))),
  })
  if (values.theme === 'dark') {
    color.preference = 'dark'
  }
  else {
    color.preference = 'light'
  }
})
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Tampilan
    </h3>
    <p class="text-sm text-muted-foreground">
      Sesuaikan tampilan aplikasi. Beralih otomatis antara mode terang dan gelap.
    </p>
  </div>
  <Separator />
  <form class="space-y-8" @submit="onSubmit">
    <FormField v-slot="{ field }" name="font">
      <FormItem>
        <FormLabel>Font</FormLabel>
        <div class="relative w-[200px]">
          <FormControl>
            <select
              :class="cn(
                buttonVariants({ variant: 'outline' }),
                'w-[200px] appearance-none font-normal',
              )"
              v-bind="field"
            >
              <option value="inter">
                Inter
              </option>
              <option value="manrope">
                Manrope
              </option>
              <option value="system">
                Sistem
              </option>
            </select>
          </FormControl>
          <Icon name="i-radix-icons-chevron-down" class="pointer-events-none absolute right-3 top-2.5 h-4 w-4 opacity-50" />
        </div>
        <FormDescription>
          Pilih font yang ingin digunakan di dashboard.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" type="radio" name="theme">
      <FormItem class="space-y-1">
        <FormLabel>Tema</FormLabel>
        <FormDescription>
          Pilih tema untuk dashboard.
        </FormDescription>
        <FormMessage />

        <RadioGroup
          class="grid grid-cols-2 max-w-md gap-8 pt-2"
          v-bind="componentField"
        >
          <FormItem>
            <FormLabel class="[&:has([data-state=checked])>div]:border-primary">
              <FormControl>
                <RadioGroupItem value="light" class="sr-only" />
              </FormControl>
              <div class="items-center border-2 border-muted rounded-md p-1 hover:border-accent">
                <div class="rounded-sm bg-[#ecedef] p-2 space-y-2">
                  <div class="rounded-md bg-white p-2 shadow-sm space-y-2">
                    <div class="h-2 w-20 rounded-lg bg-[#ecedef]" />
                    <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                  <div class="flex items-center rounded-md bg-white p-2 shadow-sm space-x-2">
                    <div class="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                  <div class="flex items-center rounded-md bg-white p-2 shadow-sm space-x-2">
                    <div class="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                </div>
              </div>
              <span class="block w-full p-2 text-center font-normal">
                Terang
              </span>
            </FormLabel>
          </FormItem>
          <FormItem>
            <FormLabel class="[&:has([data-state=checked])>div]:border-primary">
              <FormControl>
                <RadioGroupItem value="dark" class="sr-only" />
              </FormControl>
              <div class="items-center border-2 border-muted rounded-md bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                <div class="rounded-sm bg-slate-950 p-2 space-y-2">
                  <div class="rounded-md bg-slate-800 p-2 shadow-sm space-y-2">
                    <div class="h-2 w-20 rounded-lg bg-slate-400" />
                    <div class="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                  <div class="flex items-center rounded-md bg-slate-800 p-2 shadow-sm space-x-2">
                    <div class="h-4 w-4 rounded-full bg-slate-400" />
                    <div class="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                  <div class="flex items-center rounded-md bg-slate-800 p-2 shadow-sm space-x-2">
                    <div class="h-4 w-4 rounded-full bg-slate-400" />
                    <div class="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                </div>
              </div>
              <span class="block w-full p-2 text-center font-normal">
                Gelap
              </span>
            </FormLabel>
          </FormItem>
        </RadioGroup>
      </FormItem>
    </FormField>

    <div class="flex justify-start">
      <Button type="submit">
        Perbarui preferensi
      </Button>
    </div>
  </form>
</template>

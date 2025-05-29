<script setup lang="ts">
import type { Inventory } from '~/components/inventories/data/schema'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
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

// Auth and data
const authUser = useAuthUser()
const { inventories, fetchInventories } = useInventories()
const { users, fetchUsers } = useBorrows()

// Define form schema type
interface BorrowFormValues {
  inventoryId: string
  quantity: number
  dateBorrow: string
  dateReturn: string
}

// Form schema with proper typing
const borrowFormSchema = toTypedSchema(
  z.object({
    inventoryId: z.string({ required_error: 'Please select an item' }).min(1),
    quantity: z.number({ required_error: 'Quantity is required' })
      .min(1, 'Quantity must be at least 1')
      .max(100, 'Quantity cannot exceed 100'),
    dateBorrow: z.string({ required_error: 'Borrow date is required' }),
    dateReturn: z.string({ required_error: 'Return date is required' }),
  }).refine(
    data => !data.dateBorrow || !data.dateReturn || new Date(data.dateReturn) >= new Date(data.dateBorrow),
    {
      message: 'Return date must be after borrow date',
      path: ['dateReturn'],
    },
  ),
)

// Typed form instance
const borrowForm = useForm<BorrowFormValues>({
  validationSchema: borrowFormSchema,
  initialValues: {
    quantity: 1,
  } as BorrowFormValues,
})

// Get random admin with proper return type
function getRandomAdmin(): string {
  const admins = users.value.filter(user => user.role === 'ADMIN')
  return admins.length > 0
    ? admins[Math.floor(Math.random() * admins.length)].userId
    : ''
}

// Get selected item details
const selectedItem = computed(() => {
  return inventories.value.find((i: Inventory) => i.inventoryId === borrowForm.values.inventoryId)
})

// Display functions with emoji indicators
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

onMounted(async () => {
  try {
    await Promise.all([fetchInventories(), fetchUsers()])

    if (props.itemId) {
      const itemExists = inventories.value.some(i => i.inventoryId === props.itemId)
      if (itemExists) {
        borrowForm.setFieldValue('inventoryId', props.itemId)
      }
      else {
        toast.warning('Selected item not found')
      }
    }
  }
  catch (error) {
    let userFriendlyMessage = 'Maaf, terjadi kesalahan saat memuat data inventory'

    if (error instanceof Error) {
    // Mapping error message dari backend ke pesan yang ramah pengguna
      switch (error.message) {
        case 'Failed to fetch':
          userFriendlyMessage = 'Gagal terhubung ke server. Mohon periksa koneksi internet Anda.'
          break
        case '401 Unauthorized':
          userFriendlyMessage = 'Sesi Anda telah berakhir. Silakan login kembali.'
          break
        case '404 Not Found':
          userFriendlyMessage = 'Data inventory tidak ditemukan.'
          break
        case '500 Internal Server Error':
          userFriendlyMessage = 'Server sedang mengalami masalah. Silakan coba lagi nanti.'
          break
      // Tambahkan case lainnya sesuai kebutuhan
      }
    }

    toast.error(userFriendlyMessage)

    // Untuk debugging, log error asli ke console
    console.error('Error loading inventory:', error)
  }
})

const onSubmit = borrowForm.handleSubmit(async (values) => {
  try {
    const payload = {
      ...values,
      userId: authUser.value?.userId || '',
      adminId: getRandomAdmin(),
    }

    emit('submit', payload)

    toast.success('Borrow request submitted!')
  }
  catch (error) {
    toast.error('Failed to submit request', {
      description: error instanceof Error ? error.message : 'Please try again later',
    })
  }
})
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Borrow Items
    </h3>
    <p class="text-sm text-muted-foreground">
      Need to borrow equipment? Fill out this form to request items from our inventory. We'll notify you once your request is approved!
    </p>
  </div>
  <Separator />
  <form class="space-y-6" @submit="onSubmit">
    <!-- Inventory selection with condition display -->
    <FormField v-slot="{ componentField }" name="inventoryId">
      <FormItem>
        <FormLabel>Item</FormLabel>
        <Select v-bind="componentField" :disabled="props.isLoading || !inventories.length">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
              <SelectValue placeholder="Select an item" />
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

    <!-- Selected item details -->
    <div v-if="selectedItem" class="grid grid-cols-2 gap-4 border rounded-lg p-4">
      <div>
        <p class="text-sm font-medium">
          Item Name
        </p>
        <p>{{ selectedItem.name }}</p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Condition
        </p>
        <p :class="conditionClass">
          {{ selectedItem.condition }}
        </p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Available Stock
        </p>
        <p>{{ selectedItem.quantity }}</p>
      </div>
      <div>
        <p class="text-sm font-medium">
          Item Code
        </p>
        <p class="font-mono">
          {{ selectedItem.code }}
        </p>
      </div>
    </div>

    <!-- Quantity input -->
    <FormField v-slot="{ componentField }" name="quantity">
      <FormItem>
        <FormLabel>Quantity</FormLabel>
        <FormControl>
          <Input
            type="number"
            placeholder="Enter quantity"
            :min="1"
            :max="selectedItem?.quantity || 100"
            v-bind="componentField"
            :disabled="props.isLoading || !selectedItem"
          />
        </FormControl>
        <FormDescription v-if="selectedItem">
          Maximum available: {{ selectedItem.quantity }}
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Date inputs -->
    <div class="grid grid-cols-2 gap-4">
      <FormField v-slot="{ componentField }" name="dateBorrow">
        <FormItem>
          <FormLabel>Borrow Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              v-bind="componentField"
              :disabled="props.isLoading"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="dateReturn">
        <FormItem>
          <FormLabel>Return Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              v-bind="componentField"
              :disabled="props.isLoading"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <Button type="submit" class="w-full" :disabled="props.isLoading || !selectedItem">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-else>Request Borrow</span>
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

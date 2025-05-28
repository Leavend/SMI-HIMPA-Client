<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, h, ref } from 'vue'
import * as z from 'zod'
import { toast } from '~/components/ui/toast'

// Define the shape of a return item
interface ReturnItem {
  id: string
  orderId: string
  customerName: string
  returnDate: string // ISO string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'
  amount: number
}

// Dummy data for the table
const returns = ref<ReturnItem[]>([
  { id: 'R001', orderId: 'ORD001', customerName: 'Alice Smith', returnDate: '2023-01-15T10:00:00Z', status: 'Approved', amount: 120.50 },
  { id: 'R002', orderId: 'ORD002', customerName: 'Bob Johnson', returnDate: '2023-02-20T14:30:00Z', status: 'Pending', amount: 75.00 },
  { id: 'R003', orderId: 'ORD003', customerName: 'Charlie Brown', returnDate: '2023-03-05T09:15:00Z', status: 'Rejected', amount: 200.00 },
  { id: 'R004', orderId: 'ORD004', customerName: 'Diana Prince', returnDate: '2023-04-10T11:00:00Z', status: 'Completed', amount: 30.00 },
  { id: 'R005', orderId: 'ORD005', customerName: 'Eve Adams', returnDate: '2023-05-22T16:45:00Z', status: 'Pending', amount: 99.99 },
  { id: 'R006', orderId: 'ORD006', customerName: 'Frank White', returnDate: '2023-06-01T08:00:00Z', status: 'Approved', amount: 50.25 },
  { id: 'R007', orderId: 'ORD007', customerName: 'Grace Black', returnDate: '2023-07-11T13:00:00Z', status: 'Pending', amount: 150.00 },
  { id: 'R008', orderId: 'ORD008', customerName: 'Harry Green', returnDate: '2023-08-01T10:00:00Z', status: 'Completed', amount: 80.00 },
])

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Filtered and paginated data
const filteredReturns = computed(() => {
  if (!searchQuery.value) {
    return returns.value
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return returns.value.filter(item =>
    item.id.toLowerCase().includes(lowerCaseQuery)
    || item.orderId.toLowerCase().includes(lowerCaseQuery)
    || item.customerName.toLowerCase().includes(lowerCaseQuery)
    || item.status.toLowerCase().includes(lowerCaseQuery),
  )
})

const paginatedReturns = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredReturns.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredReturns.value.length / itemsPerPage))

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// --- Optional: Form for adding a new return (example of form integration) ---
const newReturnFormSchema = toTypedSchema(z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
  customerName: z.string().min(2, { message: 'Customer name is required.' }),
  amount: z.number().min(0.01, { message: 'Amount must be positive.' }),
}))

async function addNewReturn(values: any) {
  const newReturnItem: ReturnItem = {
    id: `R${String(returns.value.length + 1).padStart(3, '0')}`, // Simple ID generation
    returnDate: new Date().toISOString(),
    status: 'Pending',
    ...values,
  }
  returns.value.push(newReturnItem)
  toast({
    title: 'New Return Added:',
    description: h('pre', { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' }, h('code', { class: 'text-white' }, JSON.stringify(newReturnItem, null, 2))),
  })
}
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Return Management
    </h3>
    <p class="text-sm text-muted-foreground">
      Manage all customer returns. View, search, and process return requests.
    </p>
  </div>
  <Separator />

  <div class="flex items-center justify-between py-4">
    <Input
      v-model="searchQuery"
      placeholder="Search returns..."
      class="max-w-sm"
    />
    <Button @click="() => toast({ title: 'Add New Return clicked!' })">
      Add New Return
    </Button>
  </div>

  <div class="border rounded-md">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]">
            Return ID
          </TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Return Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">
            Amount
          </TableHead>
          <TableHead class="text-center">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in paginatedReturns" :key="item.id">
          <TableCell class="font-medium">
            {{ item.id }}
          </TableCell>
          <TableCell>{{ item.orderId }}</TableCell>
          <TableCell>{{ item.customerName }}</TableCell>
          <TableCell>{{ new Date(item.returnDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</TableCell>
          <TableCell>{{ item.status }}</TableCell>
          <TableCell class="text-right">
            ${{ item.amount.toFixed(2) }}
          </TableCell>
          <TableCell class="text-center">
            <div class="flex justify-center gap-2">
              <Button variant="outline" size="sm" @click="() => toast({ title: `View Return ${item.id}` })">
                View
              </Button>
              <Button variant="secondary" size="sm" @click="() => toast({ title: `Edit Return ${item.id}` })">
                Edit
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="paginatedReturns.length === 0">
          <TableCell :colspan="7" class="h-24 text-center">
            No returns found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <div class="flex justify-end py-4">
    <Pagination
      v-slot="{ page }"
      :total="filteredReturns.length"
      :sibling-count="1"
      show-edges
      :default-page="1"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      @update:page="goToPage"
    >
      <PaginationList v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst @click="goToPage(1)" />
        <PaginationPrev @click="goToPage(currentPage - 1)" />

        <template v-for="(item, index) in items">
          <PaginationListItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="h-10 w-10 p-0"
              :variant="item.value === page ? 'default' : 'outline'"
              @click="goToPage(item.value)"
            >
              {{ item.value }}
            </Button>
          </PaginationListItem>
          <PaginationEllipsis v-else :key="item.type" />
        </template>

        <PaginationNext @click="goToPage(currentPage + 1)" />
        <PaginationLast @click="goToPage(totalPages)" />
      </PaginationList>
    </Pagination>
  </div>
</template>

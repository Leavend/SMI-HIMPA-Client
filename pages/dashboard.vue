<script setup lang="ts">
import { useAuthUser } from '@/composables/useAuthUser'
import { Activity, AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Package, Users } from 'lucide-vue-next'
import useAdminBorrows from '~/composables/useAdminBorrows'
import useAdminInventories from '~/composables/useAdminInventories'
import useAdminUsers from '~/composables/useAdminUsers'

// Get user data
const user = useAuthUser()

// Use existing composables for real data
const { borrows, loading: borrowsLoading, error: borrowsError, fetchBorrows } = useAdminBorrows()
const { inventories, loading: inventoriesLoading, error: inventoriesError, fetchInventories } = useAdminInventories()
const { users, loading: usersLoading, error: usersError, fetchUsers } = useAdminUsers()

// Computed dashboard data
const dashboardData = computed(() => {
  const today = new Date().toISOString().split('T')[0]

  return {
    totalInventories: inventories.value?.length || 0,
    totalUsers: users.value?.length || 0,
    activeBorrows: borrows.value?.filter((b) => {
      const borrowDetails = Array.isArray(b.borrowDetails) ? b.borrowDetails : b.borrowDetails ? [b.borrowDetails] : []
      return borrowDetails[0]?.status === 'ACTIVE'
    }).length || 0,
    pendingReturns: borrows.value?.filter((b) => {
      const borrowDetails = Array.isArray(b.borrowDetails) ? b.borrowDetails : b.borrowDetails ? [b.borrowDetails] : []
      return borrowDetails[0]?.status === 'PENDING'
    }).length || 0,
    todayBorrows: borrows.value?.filter(b => b.dateBorrow?.startsWith(today)).length || 0,
    overdueItems: borrows.value?.filter((b) => {
      const borrowDetails = Array.isArray(b.borrowDetails) ? b.borrowDetails : b.borrowDetails ? [b.borrowDetails] : []
      if (borrowDetails[0]?.status !== 'ACTIVE')
        return false
      const returnDate = b.dateReturn ? new Date(b.dateReturn) : null
      return returnDate && returnDate < new Date()
    }).length || 0,
    completedReturns: borrows.value?.filter((b) => {
      const borrowDetails = Array.isArray(b.borrowDetails) ? b.borrowDetails : b.borrowDetails ? [b.borrowDetails] : []
      return borrowDetails[0]?.status === 'RETURNED'
    }).length || 0,
    totalBorrows: borrows.value?.length || 0,
  }
})

const currentTime = ref(Date.now())

const sortedBorrows = computed(() => {
  if (!borrows.value)
    return []
  return [...borrows.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const recentActivities = computed(() => {
  if (!sortedBorrows.value)
    return []

  const recentBorrows = sortedBorrows.value.slice(0, 5)

  return recentBorrows.map((borrow) => {
    const borrowDetails = Array.isArray(borrow.borrowDetails)
      ? borrow.borrowDetails
      : borrow.borrowDetails ? [borrow.borrowDetails] : []

    const itemName = borrowDetails[0]?.inventory?.name || 'Item tidak diketahui'
    const userName = borrow.user?.username || 'Pengguna tidak diketahui'

    const timeDiff = currentTime.value - new Date(borrow.createdAt).getTime()
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
    const timeText = hoursAgo < 1
      ? 'Baru saja'
      : hoursAgo < 24
        ? `${hoursAgo} jam yang lalu`
        : `${Math.floor(hoursAgo / 24)} hari yang lalu`

    const borrowStatus = borrowDetails[0]?.status || 'UNKNOWN'
    const isOverdue = borrow.dateReturn && new Date(borrow.dateReturn).getTime() < currentTime.value

    return {
      id: borrow.borrowId,
      type: borrowStatus === 'RETURNED'
        ? 'return'
        : borrowStatus === 'ACTIVE' && isOverdue ? 'overdue' : 'borrow',
      user: userName,
      item: itemName,
      time: timeText,
      status: borrowStatus === 'RETURNED'
        ? 'success'
        : borrowStatus === 'PENDING'
          ? 'pending'
          : borrowStatus === 'ACTIVE' && isOverdue ? 'warning' : 'success',
    }
  })
})

const topInventories = computed(() => {
  if (!borrows.value || !inventories.value)
    return []

  const inventoryBorrowCounts: Record<string, number> = {}
  borrows.value.forEach((borrow) => {
    const borrowDetails = Array.isArray(borrow.borrowDetails)
      ? borrow.borrowDetails
      : borrow.borrowDetails ? [borrow.borrowDetails] : []

    borrowDetails.forEach((detail) => {
      const inventoryName = detail.inventory?.name
      if (inventoryName) {
        inventoryBorrowCounts[inventoryName] = (inventoryBorrowCounts[inventoryName] || 0) + 1
      }
    })
  })

  return Object.entries(inventoryBorrowCounts)
    .map(([name, count]) => {
      const inventory = inventories.value.find(inv => inv.name === name)
      return {
        name,
        borrows: count,
        available: inventory?.quantity || 0,
      }
    })
    .sort((a, b) => b.borrows - a.borrows)
    .slice(0, 5)
})

const userStats = computed(() => {
  if (!borrows.value || !users.value) {
    return {
      totalActive: 0,
      newThisMonth: 0,
      topBorrower: '',
      topBorrowerCount: 0,
    }
  }

  const userBorrowCounts: Record<string, number> = {}
  borrows.value.forEach((borrow) => {
    const userName = borrow.user?.username
    if (userName) {
      userBorrowCounts[userName] = (userBorrowCounts[userName] || 0) + 1
    }
  })

  const topBorrower = Object.entries(userBorrowCounts)
    .sort(([,a], [,b]) => b - a)[0]

  return {
    totalActive: users.value.filter(u => u.role !== 'ADMIN').length,
    newThisMonth: users.value.filter((u) => {
      const userDate = new Date(u.createdAt)
      const now = new Date()
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
    }).length,
    topBorrower: topBorrower?.[0] || 'Tidak ada data',
    topBorrowerCount: topBorrower?.[1] || 0,
  }
})

const loading = computed(() => borrowsLoading.value || inventoriesLoading.value || usersLoading.value)
const error = computed(() => borrowsError.value || inventoriesError.value || usersError.value)

// Function to reload all dashboard data
async function loadDashboardData() {
  try {
    await Promise.all([
      fetchBorrows(true),
      fetchInventories(true),
      fetchUsers(true),
    ])
  }
  catch (err) {
    console.error('Error loading dashboard data:', err)
  }
}

// Get activity icon based on type
function getActivityIcon(type: string) {
  switch (type) {
    case 'borrow':
      return BookOpen
    case 'return':
      return CheckCircle
    case 'overdue':
      return AlertCircle
    default:
      return Activity
  }
}

// Get activity color based on status
function getActivityColor(status: string) {
  switch (status) {
    case 'success':
      return 'text-green-600'
    case 'pending':
      return 'text-yellow-600'
    case 'warning':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

// Auto-refresh data every 30 seconds for real-time updates
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // Load data from all composables
  loadDashboardData()

  // Set up auto-refresh for real-time updates
  refreshInterval = setInterval(() => {
    if (!loading.value) {
      loadDashboardData()
    }
  }, 30000) // 30 seconds
})

onUnmounted(() => {
  // Clean up interval when component is unmounted
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            Selamat Datang, {{ user?.username || 'Pengguna' }}!
          </h1>
          <p class="text-muted-foreground">
            {{ user?.role === 'ADMIN' ? 'Panel Admin - Kelola Inventaris HIMPA' : 'Dashboard Peminjaman Inventaris HIMPA' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar class="mr-2 h-4 w-4" />
            {{ new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <AlertCircle class="h-8 w-8 text-red-500" />
        <p class="text-red-500">
          {{ error }}
        </p>
        <Button variant="outline" @click="loadDashboardData">
          Coba Lagi
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 w-8 animate-spin border-b-2 border-primary rounded-full" />
        <p class="text-muted-foreground">
          Memuat data dashboard...
        </p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Total Inventaris
            </CardTitle>
            <Package class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.totalInventories }}
            </div>
            <p class="text-xs text-muted-foreground">
              Item tersedia untuk dipinjam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Peminjaman Aktif
            </CardTitle>
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.activeBorrows }}
            </div>
            <p class="text-xs text-muted-foreground">
              Sedang dipinjam saat ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Menunggu Pengembalian
            </CardTitle>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.pendingReturns }}
            </div>
            <p class="text-xs text-muted-foreground">
              Belum dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Terlambat
            </CardTitle>
            <AlertCircle class="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-red-600 font-bold">
              {{ dashboardData.overdueItems }}
            </div>
            <p class="text-xs text-muted-foreground">
              Melewati batas waktu
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Admin Specific Stats -->
      <div v-if="user?.role === 'ADMIN'" class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Total Pengguna
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.totalUsers }}
            </div>
            <p class="text-xs text-muted-foreground">
              Pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Peminjaman Hari Ini
            </CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.todayBorrows }}
            </div>
            <p class="text-xs text-muted-foreground">
              Dipinjam hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Pengembalian Selesai
            </CardTitle>
            <CheckCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.completedReturns }}
            </div>
            <p class="text-xs text-muted-foreground">
              Telah dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Total Peminjaman
            </CardTitle>
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.totalBorrows }}
            </div>
            <p class="text-xs text-muted-foreground">
              Sepanjang waktu
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content Grid -->
      <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <!-- Recent Activities -->
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Aktivitas peminjaman dan pengembalian terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="recentActivities.length === 0" class="py-8 text-center text-muted-foreground">
              Belum ada aktivitas
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-center gap-4 border rounded-lg p-3"
              >
                <div class="flex-shrink-0">
                  <component
                    :is="getActivityIcon(activity.type)"
                    class="h-5 w-5"
                    :class="getActivityColor(activity.status)"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">
                    {{ activity.user }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ activity.type === 'borrow' ? 'Meminjam' : activity.type === 'return' ? 'Mengembalikan' : 'Terlambat' }}: {{ activity.item }}
                  </p>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ activity.time }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Actions for User -->
        <Card v-if="user?.role !== 'ADMIN'">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Layanan yang tersedia untuk Anda
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/services/borrow')">
              <BookOpen class="mr-2 h-4 w-4" />
              Pinjam Inventaris
            </Button>
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/services/return')">
              <CheckCircle class="mr-2 h-4 w-4" />
              Kembalikan Item
            </Button>
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/borrows')">
              <Clock class="mr-2 h-4 w-4" />
              Riwayat Peminjaman
            </Button>
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/inventories')">
              <Package class="mr-2 h-4 w-4" />
              Lihat Inventaris
            </Button>
          </CardContent>
        </Card>

        <!-- Admin Quick Actions -->
        <Card v-if="user?.role === 'ADMIN'">
          <CardHeader>
            <CardTitle>Aksi Admin</CardTitle>
            <CardDescription>
              Kelola sistem inventaris
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/users')">
              <Users class="mr-2 h-4 w-4" />
              Kelola Pengguna
            </Button>
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/inventories')">
              <Package class="mr-2 h-4 w-4" />
              Kelola Inventaris
            </Button>
            <Button class="w-full justify-start" variant="outline" @click="navigateTo('/borrows')">
              <BookOpen class="mr-2 h-4 w-4" />
              Kelola Peminjaman
            </Button>
          </CardContent>
        </Card>

        <!-- Top Inventories -->
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>Inventaris Terpopuler</CardTitle>
            <CardDescription>
              Item yang paling sering dipinjam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="topInventories.length === 0" class="py-8 text-center text-muted-foreground">
              Belum ada data inventaris
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="(item, index) in topInventories"
                :key="index"
                class="flex items-center justify-between border rounded-lg p-3"
              >
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 flex flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span class="text-sm text-primary font-medium">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <p class="font-medium">
                      {{ item.name }}
                    </p>
                    <p class="text-sm text-muted-foreground">
                      {{ item.borrows }} kali dipinjam
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-green-600 font-medium">
                    {{ item.available }} tersedia
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- User Stats (Admin Only) -->
        <Card v-if="user?.role === 'ADMIN'">
          <CardHeader>
            <CardTitle>Statistik Pengguna</CardTitle>
            <CardDescription>
              Ringkasan aktivitas pengguna
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm">Pengguna Aktif</span>
              <span class="font-medium">{{ userStats.totalActive }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Baru Bulan Ini</span>
              <span class="font-medium">{{ userStats.newThisMonth }}</span>
            </div>
            <Separator />
            <div>
              <p class="mb-2 text-sm font-medium">
                Peminjam Teraktif
              </p>
              <p class="text-sm text-muted-foreground">
                {{ userStats.topBorrower }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ userStats.topBorrowerCount }} kali meminjam
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

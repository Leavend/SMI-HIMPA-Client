<script setup lang="ts">
import { useAuthUser } from '@/composables/useAuthUser'
import { Activity, AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Package, Users } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import useAdminBorrows from '~/composables/useAdminBorrows'
import useAdminInventories from '~/composables/useAdminInventories'
import useAdminUsers from '~/composables/useAdminUsers'
import useBorrows from '~/composables/useBorrows'
import useInventories from '~/composables/useInventories'
import useReturns from '~/composables/useReturns'

// --- 1. Inisialisasi Semua Composable ---
const user = useAuthUser()
const isAdmin = computed(() => user.value?.role === 'ADMIN')
const userId = computed(() => user.value?.userId)

// Admin Composables
const { borrows: adminBorrows, loading: loadingAdminBorrows, error: errorAdminBorrows, fetchBorrows: fetchAdminBorrows } = useAdminBorrows()
const { inventories: adminInventories, loading: loadingAdminInventories, error: errorAdminInventories, fetchInventories: fetchAdminInventories } = useAdminInventories()
const { users, loading: loadingUsers, error: errorUsers, fetchUsers } = useAdminUsers()

// User (Borrower) Composables
const { borrows: userBorrowsData, loading: loadingUserBorrows, error: errorUserBorrows, fetchUserBorrows } = useBorrows()
const { returns, loading: loadingReturns, error: errorReturns, fetchReturnsByUserId } = useReturns()
const { inventories: publicInventories, loading: loadingPublicInventories, error: errorPublicInventories, fetchInventories: fetchPublicInventories } = useInventories()

// --- 2. Buat State Terpadu ---
// State ini akan berisi data yang benar, baik untuk admin maupun user.
const inventories = computed(() => isAdmin.value ? adminInventories.value : publicInventories.value)
const borrows = computed(() => isAdmin.value ? adminBorrows.value : userBorrowsData.value)

const loading = computed(() => {
  if (isAdmin.value)
    return loadingAdminBorrows.value || loadingAdminInventories.value || loadingUsers.value
  return loadingUserBorrows.value || loadingPublicInventories.value || loadingReturns.value
})

const error = computed(() => {
  if (isAdmin.value) {
    // Logika untuk admin tidak berubah
    return errorAdminBorrows.value || errorAdminInventories.value || errorUsers.value
  }

  // --- PERBAIKAN UNTUK BORROWER ---

  // 1. Cek error peminjaman, abaikan jika '404'
  const borrowError = errorUserBorrows.value && !String(errorUserBorrows.value).includes('404')
    ? errorUserBorrows.value
    : null

  // 2. Cek error pengembalian, abaikan jika 'tidak ditemukan' atau '404'
  const returnError = errorReturns.value && !(String(errorReturns.value).includes('404') || String(errorReturns.value).includes('tidak ditemukan'))
    ? errorReturns.value
    : null

  // Gabungkan hanya dengan error yang benar-benar fatal
  return borrowError || returnError || errorPublicInventories.value
})

// --- 3. Fungsi Terpusat untuk Memuat Data ---
async function loadDashboardData() {
  if (isAdmin.value) {
    // Admin memuat semua data
    await Promise.all([
      fetchAdminBorrows(true),
      fetchAdminInventories(true),
      fetchUsers(true),
      fetchReturnsByUserId(null, true),
    ])
  }
  else if (userId.value) {
    // User hanya memuat data miliknya dan data publik
    // INI ADALAH PERBAIKAN UTAMA
    await Promise.all([
      fetchUserBorrows(userId.value, true), // Mengambil data peminjaman user
      fetchReturnsByUserId(userId.value, true), // Mengambil data pengembalian user
      fetchPublicInventories(true), // Mengambil data inventaris publik
    ])
  }
}

// --- 4. Kalkulasi Data Dashboard (Computed Properties) ---
const currentTime = ref(Date.now())

const dashboardData = computed(() => {
  const today = new Date().toISOString().split('T')[0]

  return {
    totalInventories: inventories.value?.length || 0,
    totalUsers: isAdmin.value ? (users.value?.length || 0) : 0,
    activeBorrows: borrows.value?.filter(b => b.status === 'ACTIVE').length || 0,
    pendingBorrows: borrows.value?.filter(b => b.status === 'PENDING').length || 0,
    todayBorrows: borrows.value?.filter(b => b.dateBorrow?.startsWith(today)).length || 0,
    overdueItems: computed(() => {
      if (!borrows.value || !returns.value)
        return 0

      // 1. Buat daftar ID semua peminjaman yang sudah dikembalikan.
      const returnedBorrowIds = new Set(returns.value.map(r => r.borrowId))

      // 2. Filter peminjaman yang belum dikembalikan DAN sudah lewat tanggalnya.
      return borrows.value.filter((b) => {
        const hasBeenReturned = returnedBorrowIds.has(b.borrowId)
        const isOverdue = b.dateReturn && new Date(b.dateReturn) < new Date()
        return !hasBeenReturned && isOverdue
      }).length
    }),
    completedReturns: returns.value?.length || 0, // Menggunakan data returns yang sudah benar
    totalBorrows: borrows.value?.length || 0,
  }
})

const recentActivities = computed(() => {
  if (!borrows.value)
    return []

  // Gabungkan peminjaman dan pengembalian untuk aktivitas yang lebih lengkap
  const combinedActivities = [
    ...borrows.value.map(b => ({ ...b, type: 'borrow', activityDate: b.createdAt })),
    ...returns.value.map(r => ({ ...r, type: 'return', activityDate: r.createdAt, borrow: { borrowDetails: [{ inventory: { name: r.borrow?.borrowDetails[0]?.inventory.name || 'Item' } }] } })),
  ]

  return combinedActivities
    .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
    .slice(0, 5)
    .map((activity) => {
      const timeDiff = currentTime.value - new Date(activity.activityDate).getTime()
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
      const timeText = hoursAgo < 1 ? 'Baru saja' : hoursAgo < 24 ? `${hoursAgo} jam yang lalu` : `${Math.floor(hoursAgo / 24)} hari yang lalu`

      const isOverdue = activity.type === 'borrow' && activity.status === 'ACTIVE' && activity.dateReturn && new Date(activity.dateReturn) < new Date()

      let status = 'pending'
      if (activity.type === 'return')
        status = 'success'
      else if (isOverdue)
        status = 'warning'
      else if (activity.status === 'ACTIVE')
        status = 'success'

      return {
        id: activity.borrowId || activity.returnId,
        type: activity.type,
        user: isAdmin.value ? (activity.user?.username || 'Pengguna') : 'Anda',
        item: activity.borrow?.borrowDetails[0]?.inventory?.name || 'Item tidak diketahui',
        time: timeText,
        status,
      }
    })
})

const topInventories = computed(() => {
  if (!inventories.value)
    return []

  if (!isAdmin.value) {
    return inventories.value
      .filter(inv => inv.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(inv => ({ name: inv.name, borrows: 0, available: inv.quantity }))
  }

  const inventoryBorrowCounts: Record<string, number> = {}
  adminBorrows.value.forEach((borrow) => {
    borrow.borrowDetails?.forEach((detail) => {
      const inventoryName = detail.inventory?.name
      if (inventoryName)
        inventoryBorrowCounts[inventoryName] = (inventoryBorrowCounts[inventoryName] || 0) + 1
    })
  })

  return Object.entries(inventoryBorrowCounts)
    .map(([name, count]) => ({
      name,
      borrows: count,
      available: inventories.value.find(inv => inv.name === name)?.quantity || 0,
    }))
    .sort((a, b) => b.borrows - a.borrows)
    .slice(0, 5)
})

const userStats = computed(() => {
  if (!isAdmin.value || !users.value || !adminBorrows.value)
    return { totalActive: 0, newThisMonth: 0, topBorrower: '', topBorrowerCount: 0 }

  const userBorrowCounts: Record<string, number> = {}
  adminBorrows.value.forEach((borrow) => {
    const userName = borrow.user?.username
    if (userName)
      userBorrowCounts[userName] = (userBorrowCounts[userName] || 0) + 1
  })

  const topBorrower = Object.entries(userBorrowCounts).sort(([, a], [, b]) => b - a)[0]

  return {
    totalActive: users.value.filter(u => u.role !== 'ADMIN').length,
    newThisMonth: users.value.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length,
    topBorrower: topBorrower?.[0] || 'Tidak ada data',
    topBorrowerCount: topBorrower?.[1] || 0,
  }
})

// --- 5. Helper Functions & Lifecycle Hooks ---
function getActivityIcon(type: string) {
  return type === 'return' ? CheckCircle : BookOpen
}

function getActivityColor(status: string) {
  switch (status) {
    case 'success': return 'text-green-600'
    case 'pending': return 'text-yellow-600'
    case 'warning': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  loadDashboardData()
  refreshInterval = setInterval(() => {
    if (!loading.value)
      loadDashboardData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval)
    clearInterval(refreshInterval)
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
            {{ isAdmin ? 'Panel Admin - Kelola Inventaris HIMPA' : 'Dashboard Peminjaman Inventaris HIMPA' }}
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
              {{ isAdmin ? 'Peminjaman Aktif' : 'Peminjaman Saya' }}
            </CardTitle>
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.activeBorrows }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ isAdmin ? 'Sedang dipinjam saat ini' : 'Sedang Anda pinjam' }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              {{ isAdmin ? 'Menunggu Konfirmasi' : 'Menunggu Konfirmasi' }}
            </CardTitle>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ dashboardData.pendingBorrows }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ isAdmin ? 'Perlu disetujui admin' : 'Menunggu disetujui' }}
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
      <div v-if="isAdmin" class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
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
              Dipinjam pada hari ini
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
            <CardTitle>{{ isAdmin ? 'Aktivitas Terbaru' : 'Aktivitas Saya' }}</CardTitle>
            <CardDescription>
              {{ isAdmin ? 'Aktivitas peminjaman dan pengembalian terbaru' : 'Aktivitas peminjaman dan pengembalian Anda' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="recentActivities.length === 0" class="py-8 text-center text-muted-foreground">
              {{ isAdmin ? 'Belum ada aktivitas' : 'Belum ada aktivitas Anda' }}
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
                    {{ activity.type === 'borrow' ? 'Meminjam' : 'Mengembalikan' }}: {{ activity.item }}
                  </p>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ activity.time }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              {{ isAdmin ? 'Kelola sistem inventaris' : 'Layanan yang tersedia untuk Anda' }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <template v-if="isAdmin">
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
            </template>
            <template v-else>
              <Button class="w-full justify-start" variant="outline" @click="navigateTo('/services/borrow')">
                <BookOpen class="mr-2 h-4 w-4" />
                Pinjam Inventaris
              </Button>
              <Button class="w-full justify-start" variant="outline" @click="navigateTo('/services/return')">
                <CheckCircle class="mr-2 h-4 w-4" />
                Kembalikan Item
              </Button>
            </template>
          </CardContent>
        </Card>

        <!-- Top Inventories / Available Inventories -->
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>{{ isAdmin ? 'Inventaris Terpopuler' : 'Inventaris Tersedia' }}</CardTitle>
            <CardDescription>
              {{ isAdmin ? 'Item yang paling sering dipinjam' : 'Item yang tersedia untuk dipinjam' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="topInventories.length === 0" class="py-8 text-center text-muted-foreground">
              {{ isAdmin ? 'Belum ada data inventaris' : 'Tidak ada inventaris tersedia' }}
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
                      {{ isAdmin ? `${item.borrows} kali dipinjam` : `${item.available} unit tersedia` }}
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
        <Card v-if="isAdmin">
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

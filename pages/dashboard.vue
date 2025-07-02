<script setup lang="ts">
import { Activity, BookOpen, Package, Users, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-vue-next'

// Data untuk dashboard
const dashboardData = ref({
  totalInventories: 0,
  totalUsers: 0,
  activeBorrows: 0,
  pendingReturns: 0,
  todayBorrows: 0,
  overdueItems: 0,
  completedReturns: 0,
  totalBorrows: 0,
})

// Data untuk grafik dan statistik
const recentActivities = ref([])
const topInventories = ref([])
const userStats = ref({})

// Loading state
const loading = ref(true)

// Get user data
const user = useAuthUser()

// Fetch dashboard data
async function fetchDashboardData() {
  loading.value = true
  try {
    // Simulasi data - dalam implementasi nyata ini akan mengambil dari API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dashboardData.value = {
      totalInventories: 156,
      totalUsers: 89,
      activeBorrows: 23,
      pendingReturns: 8,
      todayBorrows: 5,
      overdueItems: 3,
      completedReturns: 45,
      totalBorrows: 234,
    }

    // Recent activities
    recentActivities.value = [
      {
        id: 1,
        type: 'borrow',
        user: 'Ahmad Fadillah',
        item: 'Laptop Dell Latitude',
        time: '2 jam yang lalu',
        status: 'success'
      },
      {
        id: 2,
        type: 'return',
        user: 'Siti Nurhaliza',
        item: 'Proyektor Epson',
        time: '4 jam yang lalu',
        status: 'success'
      },
      {
        id: 3,
        type: 'borrow',
        user: 'Budi Santoso',
        item: 'Kamera Canon EOS',
        time: '6 jam yang lalu',
        status: 'pending'
      },
      {
        id: 4,
        type: 'overdue',
        user: 'Dewi Sartika',
        item: 'Tablet iPad',
        time: '1 hari yang lalu',
        status: 'warning'
      }
    ]

    // Top inventories
    topInventories.value = [
      { name: 'Laptop Dell Latitude', borrows: 45, available: 8 },
      { name: 'Proyektor Epson', borrows: 32, available: 5 },
      { name: 'Kamera Canon EOS', borrows: 28, available: 3 },
      { name: 'Tablet iPad', borrows: 25, available: 6 },
      { name: 'Speaker JBL', borrows: 22, available: 4 }
    ]

    // User statistics
    userStats.value = {
      totalActive: 67,
      newThisMonth: 12,
      topBorrower: 'Ahmad Fadillah',
      topBorrowerCount: 15
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Get activity icon based on type
function getActivityIcon(type) {
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
function getActivityColor(status) {
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

onMounted(() => {
  fetchDashboardData()
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
            <Calendar class="h-4 w-4 mr-2" />
            {{ new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="text-muted-foreground">Memuat data dashboard...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Inventaris
            </CardTitle>
            <Package class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.totalInventories }}</div>
            <p class="text-xs text-muted-foreground">
              Item tersedia untuk dipinjam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Peminjaman Aktif
            </CardTitle>
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.activeBorrows }}</div>
            <p class="text-xs text-muted-foreground">
              Sedang dipinjam saat ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Menunggu Pengembalian
            </CardTitle>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.pendingReturns }}</div>
            <p class="text-xs text-muted-foreground">
              Belum dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Terlambat
            </CardTitle>
            <AlertCircle class="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">{{ dashboardData.overdueItems }}</div>
            <p class="text-xs text-muted-foreground">
              Melewati batas waktu
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Admin Specific Stats -->
      <div v-if="user?.role === 'ADMIN'" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Pengguna
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.totalUsers }}</div>
            <p class="text-xs text-muted-foreground">
              Pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Peminjaman Hari Ini
            </CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.todayBorrows }}</div>
            <p class="text-xs text-muted-foreground">
              Dipinjam hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Pengembalian Selesai
            </CardTitle>
            <CheckCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.completedReturns }}</div>
            <p class="text-xs text-muted-foreground">
              Telah dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Peminjaman
            </CardTitle>
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.totalBorrows }}</div>
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
            <div class="space-y-4">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-center gap-4 p-3 rounded-lg border"
              >
                <div class="flex-shrink-0">
                  <component
                    :is="getActivityIcon(activity.type)"
                    class="h-5 w-5"
                    :class="getActivityColor(activity.status)"
                  />
                </div>
                <div class="flex-1 min-w-0">
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
            <Button class="w-full justify-start" variant="outline">
              <BookOpen class="h-4 w-4 mr-2" />
              Pinjam Inventaris
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <CheckCircle class="h-4 w-4 mr-2" />
              Kembalikan Item
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <Clock class="h-4 w-4 mr-2" />
              Riwayat Peminjaman
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <Package class="h-4 w-4 mr-2" />
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
            <Button class="w-full justify-start" variant="outline">
              <Users class="h-4 w-4 mr-2" />
              Kelola Pengguna
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <Package class="h-4 w-4 mr-2" />
              Kelola Inventaris
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <BookOpen class="h-4 w-4 mr-2" />
              Kelola Peminjaman
            </Button>
            <Button class="w-full justify-start" variant="outline">
              <AlertCircle class="h-4 w-4 mr-2" />
              Lihat Terlambat
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
            <div class="space-y-4">
              <div
                v-for="(item, index) in topInventories"
                :key="index"
                class="flex items-center justify-between p-3 rounded-lg border"
              >
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-primary">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <p class="font-medium">{{ item.name }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ item.borrows }} kali dipinjam
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-green-600">
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
            <div class="flex justify-between items-center">
              <span class="text-sm">Pengguna Aktif</span>
              <span class="font-medium">{{ userStats.totalActive }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Baru Bulan Ini</span>
              <span class="font-medium">{{ userStats.newThisMonth }}</span>
            </div>
            <Separator />
            <div>
              <p class="text-sm font-medium mb-2">Peminjam Teraktif</p>
              <p class="text-sm text-muted-foreground">{{ userStats.topBorrower }}</p>
              <p class="text-xs text-muted-foreground">{{ userStats.topBorrowerCount }} kali meminjam</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  middleware: 'guest',
})

const { register, isLoading } = useAuth()
const router = useRouter()

// Fungsi untuk menangani submit form registrasi
async function handleRegister(data: {
  username: string
  email: string
  number: string
  password: string
  confirmPassword: string
}) {
  // Memastikan password dan confirmPassword cocok
  if (data.password !== data.confirmPassword) {
    toast.error('Password and Confirm Password must match.')
    return // Stop the registration process if passwords do not match
  }

  try {
    // Memanggil fungsi register dari useAuth
    await register(data)

    // Menampilkan pesan sukses menggunakan Sonner
    toast.success('Registrasi berhasil! Redirecting to login...')

    // Menunggu beberapa detik sebelum pindah ke halaman login
    setTimeout(() => {
      router.push('/login') // Pindah ke halaman login
    }, 2000) // Menunggu 2 detik
  }
  catch (error: any) {
    // Memastikan error terdeteksi dan ditampilkan dengan Sonner
    const errorMessage = error?.statusMessage || 'Register failed. Please try again later.'
    toast.error(errorMessage)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-6 bg-muted p-6 min-h-svh md:p-10">
    <div class="max-w-sm w-full flex flex-col gap-6">
      <NuxtLink to="/" class="flex items-center self-center gap-2 font-medium">
        <div class="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name="i-lucide-gallery-vertical-end" class="size-4" />
        </div>
        Himpa.
      </NuxtLink>

      <div class="flex flex-col gap-6">
        <Card>
          <CardHeader class="text-center">
            <CardTitle class="text-xl">
              Create an account
            </CardTitle>
            <CardDescription>Register with your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthSignUp :is-loading="isLoading" @submit="handleRegister" />
          </CardContent>
        </Card>

        <p class="text-center text-sm text-muted-foreground">
          Already have an account?
          <NuxtLink to="/login" class="underline underline-offset-4 hover:text-primary">
            Login
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

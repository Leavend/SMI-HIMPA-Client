<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  middleware: 'guest',
})

const { register, isLoading } = useAuth()

async function handleRegister(data: {
  username: string
  email: string
  number: string
  password: string
  confirmPassword: string
}) {
  if (data.password !== data.confirmPassword) {
    toast.error('Password dan Konfirmasi Password harus sama.')
    return
  }

  try {
    await register(data)
    toast.success('Registrasi berhasil! Mengalihkan ke halaman login...')
    await new Promise(r => setTimeout(r, 1000))
    await navigateTo('/login')
  }
  catch (error: any) {
    toast.error(error?.statusMessage || error?.data?.message || 'Registrasi gagal. Silakan coba lagi nanti.')
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
              Buat akun baru
            </CardTitle>
            <CardDescription>Daftar dengan kredensial Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthSignUp :is-loading="isLoading" @submit="handleRegister" />
          </CardContent>
        </Card>

        <p class="text-center text-sm text-muted-foreground">
          Sudah punya akun?
          <NuxtLink to="/login" class="underline underline-offset-4 hover:text-primary">
            Masuk
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

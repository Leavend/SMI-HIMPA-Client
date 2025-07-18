<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  middleware: 'guest',
})

const errorMessage = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)

const { resetPassword } = useAuth()

async function handleResetPassword({
  email,
  code,
  password,
  confirmPassword,
}: {
  email: string
  code: string
  password: string
  confirmPassword: string
}) {
  errorMessage.value = ''

  if (!password || password !== confirmPassword) {
    errorMessage.value = 'Password tidak cocok'
    toast.error('Password tidak cocok') // Menampilkan error notification
    return
  }

  if (!email || !code) {
    errorMessage.value = 'Email dan kode diperlukan'
    toast.error('Email dan kode diperlukan') // Menampilkan error notification
    return
  }

  isLoading.value = true
  try {
    await resetPassword(email, code, password)
    isSuccess.value = true
    toast.success('Password berhasil direset!') // Menampilkan success notification
  }
  catch (error: any) {
    errorMessage.value = error?.message || 'Gagal reset password'
    toast.error(errorMessage.value) // Menampilkan error notification
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-6 bg-muted p-6 min-h-svh md:p-10">
    <div class="max-w-sm w-full flex flex-col gap-6">
      <NuxtLink to="/" class="flex items-center self-center gap-2 font-medium">
        <div class="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name="i-lucide-gallery-vertical-end" class-name="size-4" />
        </div>
        Himpa.
      </NuxtLink>

      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">
            Reset Password
          </CardTitle>
          <CardDescription>
            Masukkan password baru untuk reset akun Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div class="grid mx-auto max-w-sm gap-6">
            <AuthResetPassword
              :is-loading="isLoading"
              :reset-sent="isSuccess"
              @submit="handleResetPassword"
            />
            <p v-if="errorMessage" class="text-center text-sm text-red-500">
              {{ errorMessage }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

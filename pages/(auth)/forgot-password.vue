<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  middleware: 'guest',
})

const errorMessage = ref('')
const isLoading = ref(false)
const resetSent = ref(false)

const { forgotPassword } = useAuth()

async function handleForgotPassword({ email }: { email: string }) {
  if (!email)
    return

  isLoading.value = true
  errorMessage.value = ''
  try {
    await forgotPassword(email)
    resetSent.value = true
    toast.success('Reset password link has been sent to your email.')
  }
  catch (error: any) {
    errorMessage.value = error?.message || 'Something went wrong'
    toast.error(errorMessage.value) // Menampilkan notifikasi error
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-6 bg-muted p-6 min-h-svh md:p-10">
    <div class="max-w-sm w-full flex flex-col gap-6">
      <NuxtLink to="#" class="flex items-center self-center gap-2 font-medium">
        <div class="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name="i-lucide-gallery-vertical-end" class-name="size-4" />
        </div>
        Himpa.
      </NuxtLink>
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email below to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid mx-auto max-w-sm gap-6">
            <AuthForgotPassword
              v-model:is-loading="isLoading"
              :reset-sent="resetSent"
              @submit="handleForgotPassword"
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

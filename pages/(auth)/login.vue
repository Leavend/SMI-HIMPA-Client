<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  middleware: 'guest',
})

const isLoading = ref(false)
const { login } = useAuth()

async function handleLogin({ username, password }: { username: string, password: string }) {
  isLoading.value = true

  try {
    await login(username, password)
    toast.success('Login successful!')
    await new Promise(r => setTimeout(r, 1000))
    await navigateTo('/dashboard')
  }
  catch (e: any) {
    toast.error(e?.statusMessage || e?.data?.message || 'Login failed')
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
          <Icon name="i-lucide-gallery-vertical-end" class="size-4" />
        </div>
        Himpa.
      </NuxtLink>

      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">
            Welcome back
          </CardTitle>
          <CardDescription>
            Login with your Username & Password
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <AuthSignIn
            v-model:is-loading="isLoading"
            @submit="handleLogin"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

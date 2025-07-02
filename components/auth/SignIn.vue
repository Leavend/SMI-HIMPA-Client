<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import PasswordInput from '~/components/PasswordInput.vue'

const props = defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { username: string, password: string }): void
  (e: 'update:isLoading', value: boolean): void
}>()

const username = ref('')
const password = ref('')

function onSubmit(event: Event) {
  event.preventDefault()
  if (!username.value || !password.value)
    return

  emit('submit', { username: username.value, password: password.value })
}
</script>

<template>
  <form class="grid gap-6" @submit="onSubmit">
    <Separator label="lanjutkan dengan" />

    <div class="grid gap-2">
      <Label for="username">Username</Label>
      <Input
        id="username"
        v-model="username"
        type="text"
        placeholder="Masukkan username Anda"
        :disabled="props.isLoading"
        autocomplete="username"
        autocapitalize="none"
        autocorrect="off"
      />
    </div>

    <div class="grid gap-2">
      <div class="flex items-center">
        <Label for="password">Password</Label>
        <NuxtLink
          to="/forgot-password"
          class="ml-auto inline-block text-sm underline"
        >
          Lupa password?
        </NuxtLink>
      </div>
      <PasswordInput
        id="password"
        v-model="password"
        :disabled="props.isLoading"
      />
    </div>

    <Button type="submit" class="w-full" :disabled="props.isLoading">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-else>Masuk</span>
    </Button>
  </form>

  <div class="mt-4 text-center text-sm text-muted-foreground">
    Belum punya akun?
    <NuxtLink to="/register" class="underline">
      Daftar
    </NuxtLink>
  </div>
</template>

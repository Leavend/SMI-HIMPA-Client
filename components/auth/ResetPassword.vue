<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  isLoading: boolean
  resetSent?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { email: string, code: string, password: string, confirmPassword: string }): void
}>()

const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')

function onSubmit(event: Event) {
  event.preventDefault()
  if (!email.value || !code.value || !password.value || !confirmPassword.value)
    return

  emit('submit', {
    email: email.value,
    code: code.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
}
</script>

<template>
  <form class="grid gap-4" @submit="onSubmit">
    <div class="grid gap-2">
      <Label for="email">Email</Label>
      <Input
        id="email"
        v-model="email"
        placeholder="nama@contoh.com"
        type="email"
        auto-capitalize="none"
        auto-complete="email"
        auto-correct="off"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <div class="grid gap-2">
      <Label for="code">Kode reset</Label>
      <Input
        id="code"
        v-model="code"
        placeholder="Masukkan kode dari email Anda"
        type="text"
        :disabled="props.isLoading || props.resetSent"
      />
      <p class="text-xs text-muted-foreground">
        Kami telah mengirim kode reset ke email Anda. Silakan cek inbox (atau folder spam).
      </p>
    </div>

    <div class="grid gap-2">
      <Label for="password">Password Baru</Label>
      <Input
        id="password"
        v-model="password"
        placeholder="Masukkan password baru"
        type="password"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <div class="grid gap-2">
      <Label for="confirmPassword">Konfirmasi Password</Label>
      <Input
        id="confirmPassword"
        v-model="confirmPassword"
        placeholder="Konfirmasi password baru"
        type="password"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <Button type="submit" :disabled="props.isLoading || props.resetSent">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-if="!props.resetSent">Reset Password</span>
      <span v-else>Berhasil! Pergi ke Login</span>
    </Button>
  </form>
</template>

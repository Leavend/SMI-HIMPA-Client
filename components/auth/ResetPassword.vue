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
        placeholder="name@example.com"
        type="email"
        auto-capitalize="none"
        auto-complete="email"
        auto-correct="off"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <div class="grid gap-2">
      <Label for="code">Reset code</Label>
      <Input
        id="code"
        v-model="code"
        placeholder="Enter the code from your email"
        type="text"
        :disabled="props.isLoading || props.resetSent"
      />
      <p class="text-xs text-muted-foreground">
        We’ve sent a reset code to your email. Please check your inbox (or spam folder).
      </p>
    </div>

    <div class="grid gap-2">
      <Label for="password">New Password</Label>
      <Input
        id="password"
        v-model="password"
        placeholder="Enter new password"
        type="password"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <div class="grid gap-2">
      <Label for="confirmPassword">Confirm Password</Label>
      <Input
        id="confirmPassword"
        v-model="confirmPassword"
        placeholder="Confirm new password"
        type="password"
        :disabled="props.isLoading || props.resetSent"
      />
    </div>

    <Button type="submit" :disabled="props.isLoading || props.resetSent">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-if="!props.resetSent">Reset Password</span>
      <span v-else>Success! Go to Login</span>
    </Button>
  </form>
</template>

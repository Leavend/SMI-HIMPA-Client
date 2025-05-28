<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import PasswordInput from '~/components/PasswordInput.vue'

const props = defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: {
    username: string
    email: string
    number: string
    password: string
    confirmPassword: string
  }): void
}>()

const username = ref('')
const email = ref('')
const number = ref('')
const password = ref('')
const confirmPassword = ref('')

function onSubmit(event: Event) {
  event.preventDefault()
  if (!username.value || !email.value || !number.value || !password.value || !confirmPassword.value)
    return

  emit('submit', {
    username: username.value,
    email: email.value,
    number: number.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
}
</script>

<template>
  <form class="grid gap-6" @submit="onSubmit">
    <div class="grid gap-2">
      <Label for="username">Username</Label>
      <Input
        id="username"
        v-model="username"
        type="text"
        placeholder="Enter your username"
        :disabled="props.isLoading"
        autocomplete="username"
        autocapitalize="none"
        autocorrect="off"
      />
    </div>

    <div class="grid gap-2">
      <Label for="email">Email</Label>
      <Input
        id="email"
        v-model="email"
        type="email"
        placeholder="name@example.com"
        :disabled="props.isLoading"
        autocomplete="email"
        autocapitalize="none"
        autocorrect="off"
      />
    </div>

    <div class="grid gap-2">
      <Label for="phone">Nomor HP</Label>
      <Input
        id="number"
        v-model="number"
        type="tel"
        placeholder="08xxxxxxxxxx"
        inputmode="tel"
        :disabled="props.isLoading"
        autocomplete="tel"
      />
    </div>

    <div class="grid gap-2">
      <Label for="password">Password</Label>
      <PasswordInput
        id="password"
        v-model="password"
        :disabled="props.isLoading"
      />
    </div>

    <div class="grid gap-2">
      <Label for="confirm-password">Confirm Password</Label>
      <PasswordInput
        id="confirm-password"
        v-model="confirmPassword"
        :disabled="props.isLoading"
      />
    </div>

    <Button type="submit" class="w-full" :disabled="props.isLoading">
      <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <span v-else>Register</span>
    </Button>
  </form>
</template>

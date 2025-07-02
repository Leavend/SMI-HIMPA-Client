<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  isLoading: boolean
  resetSent?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { email: string }): void
}>()

const email = ref('')

function onSubmit(event: Event) {
  event.preventDefault()
  if (!email.value)
    return
  emit('submit', { email: email.value })
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="grid gap-4">
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

      <template v-if="props.resetSent">
        <NuxtLink to="/reset-password">
          <Button type="button" class="w-full">
            Pergi ke Reset Password
          </Button>
        </NuxtLink>
      </template>

      <template v-else>
        <Button :disabled="props.isLoading">
          <Loader2 v-if="props.isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Kirim Link Reset
        </Button>
      </template>
    </div>
  </form>
</template>

<style scoped>
/* Optional style if needed */
</style>

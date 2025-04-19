<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10 text-center text-foreground">
    <div class="text-center space-y-6">
      <div class="flex justify-center">
        <!-- Ganti ini dengan logo Himpa jika ada -->
        <Icon name="mdi:rocket-launch" class="text-primary" size="64" />
      </div>
      <h1 class="text-4xl font-extrabold">
        Welcome to Himpa Web
      </h1>
      <p class="text-lg text-muted-foreground">
        Kickstart your management inventory with our modern and intuitive dashboard.
      </p>
      <div class="space-y-2">
        <NuxtLink
          to="/login"
          class="inline-block rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-primary/90"
        >
          Login to Get Started
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

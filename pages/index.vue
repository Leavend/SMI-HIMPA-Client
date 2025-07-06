<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10 text-center text-foreground">
    <div class="text-center space-y-6">
      <div class="flex justify-center">
        <img src="/constants/2.svg" alt="Logo HIMPA" class="h-16 w-16">
      </div>
      <h1 class="text-4xl font-extrabold">
        Selamat Datang di Aplikasi HIMPA
      </h1>
      <p class="text-lg text-muted-foreground">
        Mulai kelola inventaris Anda dengan dashboard modern dan intuitif kami.
      </p>
      <div class="space-y-2">
        <NuxtLink
          to="/login"
          class="mx-auto block max-w-xs w-auto rounded-lg bg-primary px-6 py-2 text-center text-white transition dark:bg-white hover:bg-primary/90 dark:text-black dark:hover:bg-white/80"
        >
          Masuk untuk Memulai
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10 text-center text-foreground">
    <div class="text-center space-y-6">
      <div class="flex justify-center">
        <img src="/constants/2.svg" alt="Logo HIMPA" class="w-16 h-16" />
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
          class="block mx-auto rounded-lg bg-primary text-white dark:bg-white dark:text-black px-6 py-2 transition hover:bg-primary/90 dark:hover:bg-white/80 w-auto max-w-xs text-center"
        >
          Masuk untuk Memulai
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

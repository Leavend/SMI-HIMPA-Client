<script setup lang="ts">
</script>

<template>
  <div class="pb-16 space-y-6">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">
        Services
      </h2>
      <p class="text-muted-foreground">
        Manage your borrow & return.
      </p>
    </div>

    <Separator class="my-6" />

    <div class="flex flex-col lg:flex-row space-y-6 lg:space-x-12 lg:space-y-0">
      <!-- Sidebar -->
      <div class="w-full lg:w-1/6">
        <ServicesSidebarNav />
      </div>

      <!-- Content -->
      <div class="flex-1">
        <div class="space-y-6">
          <div class="overflow-auto border border-gray-200 rounded-xl bg-white p-4 shadow-sm dark:bg-muted">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

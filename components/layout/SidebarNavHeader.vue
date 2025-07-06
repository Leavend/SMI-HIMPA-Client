<script setup lang="ts">
const props = defineProps<{
  user: {
    role: string
  }
}>()

const _roleIcon = computed(() => {
  switch (props.user.role.toUpperCase()) {
    case 'ADMIN':
      return 'i-lucide-gallery-vertical-end'
    case 'BORROWER':
      return 'i-lucide-audio-waveform'
    default:
      return 'i-lucide-help-circle'
  }
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        class="cursor-default"
      >
        <div class="aspect-square size-8 flex items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <img src="/constants/1.svg" alt="Logo HIMPA" class="size-6">
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-semibold">Himpa</span>
          <span class="truncate text-xs text-muted-foreground capitalize">
            {{ user.role }}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<style scoped>
</style>

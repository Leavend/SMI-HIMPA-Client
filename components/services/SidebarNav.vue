<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Item {
  title: string
  href: string
}

const route = useRoute()

const sidebarNavItems: Item[] = [
  {
    title: 'Pinjam',
    href: '/services/borrow',
  },
  {
    title: 'Kembali',
    href: '/services/return',
  },
]
</script>

<template>
  <nav class="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
    <Button
      v-for="item in sidebarNavItems"
      :key="item.title"
      variant="ghost"
      :class="cn(
        'w-full text-left justify-start items-start',
        route.path === item.href && 'bg-muted hover:bg-muted',
      )"
      as-child
    >
      <NuxtLink
        :to="item.href"
      >
        {{ item.title }}
      </NuxtLink>
    </Button>
  </nav>
</template>

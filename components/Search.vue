<script setup lang="ts">
import { useAuthUser } from '@/composables/useAuthUser'
import { navMenu } from '@/constants/menus'

const authUser = useAuthUser()

const { metaSymbol } = useShortcuts()

const openCommand = ref(false)
const router = useRouter()

defineShortcuts({
  Meta_K: () => openCommand.value = true,
})

const user = computed(() => {
  if (authUser.value) {
    return {
      username: authUser.value.username,
      email: authUser.value.email,
      avatar: '/avatars/avatartion.png',
      role: authUser.value.role,
    }
  }
  return {
    username: 'Tidak Diketahui',
    email: 'Tidak ada email',
    avatar: '/avatars/avatartion.png',
    role: 'Tidak Diketahui',
  }
})

const adminExtraMenu = [
  {
    heading: 'Panel Admin',
    items: [
      {
        title: 'Kelola Pengguna',
        icon: 'i-lucide-users',
        link: '/users',
      },
      {
        title: 'Kelola Inventaris',
        icon: 'i-lucide-box',
        link: '/inventories',
      },
      {
        title: 'Tugas Peminjaman',
        icon: 'i-lucide-calendar-check-2',
        link: '/borrows',
      },
    ],
  },
]

const menuItems = computed(() => {
  return user.value.role === 'ADMIN'
    ? [...navMenu, ...adminExtraMenu]
    : navMenu
})

const flatMenuLinks = computed(() => {
  // Flatten all menu items (including children)
  const links = []
  for (const menu of menuItems.value) {
    for (const item of menu.items) {
      if ('children' in item && Array.isArray(item.children)) {
        for (const child of item.children) {
          links.push({ ...child, group: item.title })
        }
      }
      else if ('link' in item) {
        links.push(item)
      }
    }
  }
  return links
})

function handleSelectLink(link: string) {
  router.push(link)
  openCommand.value = false
}
</script>

<template>
  <SidebarMenuButton as-child tooltip="Search">
    <Button variant="outline" size="sm" class="text-xs" @click="openCommand = !openCommand">
      <Icon name="i-lucide-search" />
      <span class="font-normal group-data-[collapsible=icon]:hidden">Cari menu...</span>
      <div class="ml-auto flex items-center space-x-0.5 group-data-[collapsible=icon]:hidden">
        <BaseKbd>{{ metaSymbol }}</BaseKbd>
        <BaseKbd>K</BaseKbd>
      </div>
    </Button>
  </SidebarMenuButton>

  <CommandDialog v-model:open="openCommand">
    <CommandInput placeholder="Ketik menu atau fitur..." />
    <CommandList>
      <CommandEmpty>Tidak ada hasil.</CommandEmpty>
      <CommandGroup heading="Menu Sidebar">
        <CommandItem
          v-for="nav in flatMenuLinks"
          :key="nav.title + nav.link"
          :value="nav.title"
          class="gap-2"
          @select="handleSelectLink(nav.link)"
        >
          <Icon :name="nav.icon || 'i-radix-icons-circle'" />
          <span>{{ nav.title }}</span>
          <span v-if="'group' in nav && nav.group" class="ml-2 text-xs text-muted-foreground">({{ nav.group }})</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<style scoped>

</style>

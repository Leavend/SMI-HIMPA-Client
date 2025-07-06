<script setup lang="ts">
import type { NavGroup, NavLink, NavMenu, NavSectionTitle } from '~/types/nav'
import { navMenu, navMenuBottom } from '~/constants/menus'

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')

  return resolveComponent('LayoutSidebarNavLink')
}

const authUser = useAuthUser()

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
    role: 'Tidak Diketahui', // Ensure default role exists
  }
})

// Admin-specific menu
const adminExtraMenu: NavMenu[] = [
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

// Combine default menu with admin-specific menu
const menuItems = computed<NavMenu[]>(() => {
  return user.value.role === 'ADMIN'
    ? [...navMenu, ...adminExtraMenu]
    : navMenu
})

const { sidebar } = useAppSettings()
</script>

<template>
  <Sidebar :collapsible="sidebar.collapsible" :side="sidebar.side" :variant="sidebar.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader :user="user" />
      <Search />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in menuItems" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in nav.items"
          :key="index"
          :item="item"
        />
      </SidebarGroup>

      <SidebarGroup class="mt-auto">
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in navMenuBottom"
          :key="index"
          :item="item"
          size="sm"
        />
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'
import { useAuth } from '~/composables/useAuth'

defineProps<{
  user: {
    username: string
    email: string
    avatar: string
  }
}>()

const { isMobile, setOpenMobile } = useSidebar()
const { logout } = useAuth()

const showModalTheme = ref(false)

function handleLogout() {
  logout()
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="user.avatar || '/avatars/default.png'" :alt="user.username" />
              <AvatarFallback class="rounded-lg">
                {{ user.username.charAt(0).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user.username }}</span>
              <span class="truncate text-xs">{{ user.email }}</span>
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="user.avatar || '/avatars/default.png'" :alt="user.username" />
                <AvatarFallback class="rounded-lg">
                  {{ user.username.charAt(0).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user.username }}</span>
                <span class="truncate text-xs">{{ user.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink to="/settings" @click="setOpenMobile(false)">
                <Icon name="i-lucide-settings" />
                Settings
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem @click="showModalTheme = true">
              <Icon name="i-lucide-paintbrush" />
              Theme
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <Icon name="i-lucide-log-out" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <Dialog v-model:open="showModalTheme">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Customize</DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          Customize & Preview in Real Time
        </DialogDescription>
      </DialogHeader>
      <ThemeCustomize />
    </DialogContent>
  </Dialog>
</template>

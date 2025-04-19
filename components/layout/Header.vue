<script setup lang="ts">
const route = useRoute()

function generateBreadcrumbs(fullPath: string): { title: string, href: string }[] {
  const segments = fullPath.split('/').filter(segment => segment !== '')
  const breadcrumbs: { title: string, href: string }[] = [{ title: 'Home', href: '/' }] // Asumsi root adalah home

  let currentPath = '/'
  segments.forEach((segment) => {
    currentPath += `${segment}/`
    const title = segment
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    breadcrumbs.push({ title, href: currentPath.slice(0, -1) }) // Remove trailing slash
  })

  return breadcrumbs
}

const links = ref<{
  title: string
  href: string
}[]>(generateBreadcrumbs(route.fullPath))

watch(() => route.fullPath, (val) => {
  if (val) {
    links.value = generateBreadcrumbs(val)
  }
})
</script>

<template>
  <header class="sticky top-0 z-10 h-53px flex items-center gap-4 border-b bg-background px-4 md:px-6">
    <div class="w-full flex items-center gap-4">
      <SidebarTrigger />
      <Separator orientation="vertical" class="h-4" />
      <BaseBreadcrumbCustom :links="links" />
    </div>
    <div class="ml-auto">
      <slot />
    </div>
  </header>
</template>

<style scoped>

</style>

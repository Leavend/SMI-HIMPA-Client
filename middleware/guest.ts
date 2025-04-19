export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()

  // Mengecek apakah pengguna sudah login
  if (import.meta.client && isLoggedIn.value && (to.path === '/login' || to.path === '/register')) {
    // Jika sudah login, arahkan ke dashboard
    return navigateTo('/dashboard')
  }
})

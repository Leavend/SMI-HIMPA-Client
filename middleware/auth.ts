export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()

  if (import.meta.client) {
    // Jika pengguna sudah login dan mencoba mengakses halaman login
    if (isLoggedIn.value && to.path === '/login') {
      return navigateTo('/dashboard')
    }

    // Jika pengguna belum login dan mencoba mengakses halaman selain login atau register
    if (!isLoggedIn.value && to.path !== '/login' && to.path !== '/register') {
      return navigateTo('/login')
    }
  }
})

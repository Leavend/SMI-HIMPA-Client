export function useApiUrl(path: string) {
  const baseURL = useRuntimeConfig().public.apiBase
  return `${baseURL}${path}`
}

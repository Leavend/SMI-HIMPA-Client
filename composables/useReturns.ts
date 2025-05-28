import type { Return } from '~/components/returns/data/schema'
import { useToken } from '@/composables/useToken'
import { ref } from 'vue'
import { z } from 'zod'
import { returnSchema } from '~/components/returns/data/schema'

interface FetchReturnsResponse {
  status: boolean
  message: string
  data: {
    returns: Return[]
  }
}

export default function useReturns() {
  const returns = ref<Return[]>([])
  const loading = ref(false)
  const error = ref<string | Error | null>(null)

  /**
   * Helper function to determine the user-friendly error message
   */
  const getErrorMessage = (err: any): string => {
    // Priority 1: Check for specific string messages from API or manual throws
    if (typeof err === 'string' && err.length > 0) {
      return err;
    }

    // Priority 2: Check for Error objects
    if (err instanceof Error) {
      // For general errors, check if the message is specific enough, otherwise use a generic one
      if (err.message.includes('login terlebih dahulu')) { // Specific check for your login error
          return 'Harap login terlebih dahulu untuk melihat data.';
      }
      if (err.message.includes('Data pengembalian tidak ditemukan')) {
          return 'Data pengembalian tidak ditemukan.';
      }
      if (err.message.includes('Data pengembalian tidak valid')) {
          return 'Terjadi masalah saat memuat data pengembalian. Mohon coba lagi.';
      }
      if (err.message.includes('Unknown fetch error') || err.message.includes('Failed to fetch')) {
        // This handles network errors, API unreachable, etc.
        return 'Gagal terhubung ke server. Mohon periksa koneksi Anda atau coba sebentar lagi.';
      }
      if (err.message.includes('404')) { // Example: check for 404 in the message
        return 'Data tidak ditemukan. Mohon pastikan ID pengguna benar.';
      }
      // Fallback for other standard Error objects
      return 'Terjadi kesalahan saat memproses permintaan Anda.';
    }

    // Priority 3: Check useFetch's FetchError structure (common for Nuxt/VueUse)
    // The image shows `solid-umbrella-rx7pxwgrrijl2xr9w-5000.app.github.dev/api/return/user/01965894-979e-762e-ac88-c17a7d86448": 404`
    // This implies `err` might be an object that contains this string somewhere.
    if (err && typeof err === 'object') {
      // Assuming useFetch's error object might have data, statusMessage, or message.
      // You might need to inspect the actual structure of `WorkspaceError.value` in your browser's console
      // to tailor these checks perfectly.
      if (err.data && typeof err.data.message === 'string' && err.data.message.length > 0) {
        return err.data.message;
      }
      if (typeof err.message === 'string' && err.message.length > 0) {
         // Check for generic "Failed to fetch" or HTTP status codes
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
            return 'Gagal terhubung ke server. Mohon periksa koneksi Anda atau coba sebentar lagi.';
        }
        if (err.message.includes('404')) {
            return 'Data tidak ditemukan. Mohon pastikan informasi yang diminta tersedia.';
        }
        if (err.message.includes('401') || err.message.includes('403')) {
            return 'Anda tidak memiliki izin untuk melihat data ini. Harap login kembali.';
        }
        // If it's a specific, internal API message we want to show
        // For now, let's generalize anything that looks like a backend message
        if (err.message.match(/\[GET\] ".*"\: \d+/)) { // Matches the pattern from your screenshot
            return 'Terjadi masalah saat memuat data. Mohon coba lagi.';
        }
        return err.message; // Use message if it seems user-friendly
      }
      if (err.statusMessage && typeof err.statusMessage === 'string' && err.statusMessage.length > 0) {
        return err.statusMessage; // E.g., "Not Found"
      }
      if (err.statusCode) {
        if (err.statusCode === 404) {
          return 'Data tidak ditemukan.';
        }
        if (err.statusCode === 401 || err.statusCode === 403) {
          return 'Anda tidak memiliki akses. Harap login kembali.';
        }
        // Generic HTTP error
        return `Terjadi kesalahan pada server (Kode: ${err.statusCode}).`;
      }
    }

    // Final fallback if no specific error message can be extracted
    return 'Terjadi kesalahan tidak dikenal saat memuat data.';
  };


  /**
   * Fetch returns data by user ID
   */
  const fetchReturnsByUserId = async (userId: string) => {
    loading.value = true
    error.value = null // Clear previous errors

    try {
      const token = useToken().value
      if (!token) {
        // Throw an Error object with a specific message for easy handling
        throw new Error('Harap login terlebih dahulu.');
      }

      const { data, error: fetchError } = await useFetch<FetchReturnsResponse>(
        useApiUrl(`/return/returns/${userId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value) {
        // getErrorMessage will decide the user-friendly message
        // Throw an Error object so it goes to the catch block consistently
        throw new Error(getErrorMessage(fetchError.value));
      }

      const returnsData = data.value?.data?.returns
      if (!returnsData) {
        throw new Error('Data pengembalian tidak ditemukan.'); // Specific message
      }

      const parsed = z.array(returnSchema).safeParse(returnsData)
      if (!parsed.success) {
        console.error('Validation error:', parsed.error)
        throw new Error('Data pengembalian tidak valid.'); // Specific message
      }

      returns.value = parsed.data
      return parsed.data
    }
    catch (err: any) {
      // Assign the user-friendly error message to the `error` ref
      error.value = new Error(getErrorMessage(err)); // Always store an Error object for consistency
      // Re-throw to propagate if other parts of the app rely on it, but the display is handled.
      throw err;
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch all returns data (for admin)
   */
  const fetchAllReturns = async () => {
    loading.value = true
    error.value = null

    try {
      const token = useToken().value
      if (!token) {
        throw new Error('Harap login terlebih dahulu.');
      }

      const { data, error: fetchError } = await useFetch<FetchReturnsResponse>(
        useApiUrl('/admin/returns'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (fetchError.value) {
        throw new Error(getErrorMessage(fetchError.value));
      }

      const returnsData = data.value?.data?.returns
      if (!returnsData) {
        throw new Error('Data pengembalian tidak ditemukan.');
      }

      const parsed = z.array(returnSchema).safeParse(returnsData)
      if (!parsed.success) {
        console.error('Validation error:', parsed.error)
        throw new Error('Data pengembalian tidak valid.');
      }

      returns.value = parsed.data
      return parsed.data
    }
    catch (err: any) {
      error.value = new Error(getErrorMessage(err));
      throw err;
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Calculate late days based on return date and expected return date
   */
  const calculateLateDays = (dateReturn: string, expectedReturnDate: string): number => {
    const returnDate = new Date(dateReturn)
    const expectedDate = new Date(expectedReturnDate)

    // Calculate difference in days
    const diffTime = returnDate.getTime() - expectedDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  return {
    returns,
    loading,
    error,
    fetchReturnsByUserId,
    fetchAllReturns,
    calculateLateDays,
  }
}
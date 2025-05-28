import type { VNode } from 'vue'
import { Icon } from '#components' // Pastikan Icon bisa di-resolve
import { h } from 'vue'

export type BorrowStatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'OVERDUE'
  | 'ACTIVE' // <<< TAMBAHKAN 'ACTIVE'

export interface BorrowStatusOption {
  value: BorrowStatusType
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' // 'success' adalah variant umum, pastikan Badge Anda mendukungnya
  icon?: VNode
}

export const borrowStatuses: BorrowStatusOption[] = [
  {
    value: 'PENDING',
    label: 'Pending',
    variant: 'outline',
    icon: h(Icon, { name: 'i-radix-icons-clock' }),
  },
  {
    value: 'APPROVED',
    label: 'Disetujui',
    variant: 'default', // Mungkin 'success' lebih cocok jika didukung
    icon: h(Icon, { name: 'i-radix-icons-rocket' }),
  },
  {
    value: 'REJECTED',
    label: 'Ditolak',
    variant: 'destructive',
    icon: h(Icon, { name: 'i-radix-icons-cross-circled' }),
  },
  {
    value: 'RETURNED',
    label: 'Dikembalikan',
    variant: 'default', // Mungkin 'success' atau 'outline' tergantung preferensi
    icon: h(Icon, { name: 'i-radix-icons-check-circled' }),
  },
  {
    value: 'OVERDUE',
    label: 'Terlambat',
    variant: 'secondary', // Mungkin 'destructive' jika ingin lebih menonjol
    icon: h(Icon, { name: 'i-radix-icons-timer' }),
  },
  { // <<< TAMBAHKAN BLOK INI UNTUK STATUS 'ACTIVE'
    value: 'ACTIVE',
    label: 'Aktif', // Label yang lebih ramah pengguna
    variant: 'default', // Pilih variant yang sesuai (misalnya 'success' atau 'default')
    icon: h(Icon, { name: 'i-radix-icons-star' }), // Ganti dengan ikon yang sesuai
  },
]

export const priorities = [
  {
    value: 'low',
    label: 'Rendah',
    icon: h(Icon, { name: 'i-radix-icons-arrow-down' }),
  },
  {
    value: 'medium',
    label: 'Sedang',
    icon: h(Icon, { name: 'i-radix-icons-arrow-right' }),
  },
  {
    value: 'high',
    label: 'Tinggi',
    icon: h(Icon, { name: 'i-radix-icons-arrow-up' }),
  },
]

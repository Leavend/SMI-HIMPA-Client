import { z } from 'zod'

// Enum untuk status peminjaman
export const BorrowStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  ACTIVE: 'ACTIVE', // <<< DITAMBAHKAN: status "ACTIVE"
} as const

export type BorrowStatusType = keyof typeof BorrowStatus

// Schema untuk detail peminjaman individual
export const borrowDetailSchema = z.object({
  inventory: z.object({
    name: z.string(),
  }).optional(),
  status: z.nativeEnum(BorrowStatus).optional(), // Status sekarang bisa "ACTIVE"
})

// Skema utama untuk data pengembalian (return)
export const returnSchema = z.object({
  returnId: z.string(),
  borrowId: z.string(),
  quantity: z.coerce.number(),
  dateBorrow: z.string().datetime(),
  dateReturn: z.string().datetime().nullable(),
  lateDays: z.coerce.number(), // lateDays sekarang bisa memiliki nilai > 0
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  borrow: z.object({ // Objek borrow keseluruhan opsional
    borrowDetails: z.array(borrowDetailSchema),
    status: z.nativeEnum(BorrowStatus).optional(), // Ini adalah status di level BorrowModel (jika ada)
    user: z.object({ // Objek user opsional
      Username: z.string().optional(), // Username di dalam user juga opsional
    }).optional(),
  }).optional(),
})

// Ekspor tipe-tipe yang diinferensikan
export type BorrowDetail = z.infer<typeof borrowDetailSchema>
export type Return = z.infer<typeof returnSchema>
import { z } from 'zod'

export const BorrowStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
} as const

export type BorrowStatusType = keyof typeof BorrowStatus

export const borrowDetailSchema = z.object({
  inventory: z.object({
    name: z.string(),
  }).optional(),
  status: z.string(),
})

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
  }).optional(),
})

// Ekspor tipe-tipe yang diinferensikan
export type BorrowDetail = z.infer<typeof borrowDetailSchema>
export type Return = z.infer<typeof returnSchema>

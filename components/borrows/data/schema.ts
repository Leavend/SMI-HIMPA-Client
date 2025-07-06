import { z } from 'zod'

export const borrowDetailSchema = z.object({
  borrowDetailId: z.string().uuid(),
  borrowId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  inventory: z.object({
    inventoryId: z.string().uuid().optional(),
    name: z.string(),
  }).optional(),
})

export const borrowSchema = z.object({
  borrowId: z.string(),
  quantity: z.coerce.number(),
  dateBorrow: z.string().datetime(),
  dateReturn: z.string().datetime().nullable(),
  userId: z.string(),
  adminId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  borrowDetails: z.array(borrowDetailSchema).optional(),
  user: z.object({
    username: z.string(),
  }).optional(),
})

// Type definitions for Borrow and BorrowDetail
export type Borrow = z.infer<typeof borrowSchema>
export type BorrowDetail = z.infer<typeof borrowDetailSchema>

export const BorrowStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
} as const

export type BorrowStatusType = keyof typeof BorrowStatus

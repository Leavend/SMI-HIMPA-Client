import { z } from 'zod'

// BorrowDetail schema (unchanged, but included here for completeness)
export const borrowDetailSchema = z.object({
  borrowDetailId: z.string().uuid(),
  borrowId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  inventory: z.object({ // Add inventory details
    inventoryId: z.string().uuid().optional(),
    name: z.string(),
  }).optional(),
})

// Borrow schema, including borrowDetails and user
export const borrowSchema = z.object({
  borrowId: z.string(),
  quantity: z.coerce.number(),
  dateBorrow: z.string().datetime(),
  dateReturn: z.string().datetime().nullable(), // Make sure this is nullable
  userId: z.string(),
  adminId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  borrowDetails: z.array(borrowDetailSchema).optional(),
  user: z.object({
    Username: z.string(),
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
